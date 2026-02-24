import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, Camera, CheckCircle2, Eye, EyeOff } from "lucide-react";
import PortfolioUploader from "../components/lensly/PortfolioUploader";
import OnboardingSuccessModal from "../components/lensly/OnboardingSuccessModal";
import ProfileCompletionChecklist from "../components/lensly/ProfileCompletionChecklist";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CATEGORIES = ["Corporate", "Brand / Commercial", "Weddings", "Events", "Lifestyle", "Social Media Content"];
const AREAS = ["Sandton", "Johannesburg", "Pretoria", "Cape Town"];

export default function EditProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile && !isOnboarding && isAuthenticated) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 2000);
      setAutoSaveTimer(timer);
    }
    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  }, [profile]);

  const loadProfile = async () => {
    const authed = await base44.auth.isAuthenticated();
    setIsAuthenticated(authed);
    if (!authed) { setLoading(false); return; }
    const user = await base44.auth.me();
    const profiles = await base44.entities.CreatorProfile.filter({ created_by: user.email });
    if (profiles.length > 0) {
      setProfile(profiles[0]);
      setIsOnboarding(!profiles[0].is_published);
    } else {
      setProfile({
        display_name: user.full_name || "",
        bio: "",
        profile_image: "",
        profile_avatar: "",
        categories: [],
        service_areas: [],
        starting_price: null,
        portfolio_items: [],
        featuredPortfolioItemId: null,
        is_published: false,
        creator_type: "photographer",
        contact_email: user.email || "",
        instagram_handle: "",
        website_url: "",
      });
      setIsOnboarding(true);
    }
    setLoading(false);
  };

  const handleAutoSave = async () => {
    if (!profile || autoSaving || saving) return;
    
    try {
      setAutoSaving(true);
      if (profile.id) {
        await base44.entities.CreatorProfile.update(profile.id, profile);
      } else {
        const created = await base44.entities.CreatorProfile.create(profile);
        setProfile({ ...profile, id: created.id });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const wasOnboarding = isOnboarding && !profile.is_published;
    let savedProfileId = profile.id;
    
    if (profile.id) {
      await base44.entities.CreatorProfile.update(profile.id, profile);
    } else {
      const created = await base44.entities.CreatorProfile.create(profile);
      savedProfileId = created.id;
      setProfile({ ...profile, id: created.id });
    }
    setSaving(false);
    setSaved(true);
    
    if (wasOnboarding && profile.is_published) {
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 500);
    } else if (!isOnboarding && profile.is_published) {
      setTimeout(() => {
        window.location.href = createPageUrl("CreatorProfile") + `?id=${savedProfileId}`;
      }, 800);
    } else {
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const toggleCategory = (cat) => {
    setProfile(p => ({
      ...p,
      categories: p.categories.includes(cat)
        ? p.categories.filter(c => c !== cat)
        : [...p.categories, cat],
    }));
  };

  const toggleArea = (area) => {
    setProfile(p => ({
      ...p,
      service_areas: p.service_areas.includes(area)
        ? p.service_areas.filter(a => a !== area)
        : [...p.service_areas, area],
    }));
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImageUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setProfile(p => ({ ...p, profile_image: file_url }));
    setProfileImageUploading(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImageUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setProfile(p => ({ ...p, profile_avatar: file_url }));
    setProfileImageUploading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-5">
        <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
          <Camera className="w-8 h-8 text-neutral-300" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-800">Sign in to create your profile</h2>
        <button
          onClick={() => base44.auth.redirectToLogin(window.location.href)}
          className="mt-6 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-sm font-medium"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-neutral-600 animate-spin" />
      </div>
    );
  }

  const steps = [
    { name: "Basic Info", complete: !!(profile?.display_name && profile?.profile_image) },
    { name: "Categories", complete: !!(profile?.categories?.length > 0) },
    { name: "Service Areas", complete: !!(profile?.service_areas?.length > 0) },
    { name: "Portfolio", complete: !!(profile?.portfolio_items?.length > 0) },
    { name: "Publish", complete: profile?.is_published },
  ];
  const completedSteps = steps.filter(s => s.complete).length;

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">
              {isOnboarding ? "Complete Your Profile" : "Edit Profile"}
            </h1>
            {isOnboarding && (
              <p className="text-xs text-neutral-500 mt-1">
                {completedSteps} of {steps.length} steps completed
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {(saved && !saving && !isOnboarding) && (
              <div className="flex items-center gap-1.5 text-green-600 text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Saved</span>
              </div>
            )}
            {profile?.id && profile?.is_published && (
              <Link
                to={createPageUrl("CreatorProfile") + `?id=${profile.id}`}
                className="text-xs text-blue-500 font-medium flex items-center gap-1"
              >
                <Eye className="w-3 h-3" /> View Live
              </Link>
            )}
          </div>
        </div>
        
        {isOnboarding && (
          <div className="mt-4 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(completedSteps / steps.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="px-5 space-y-6">
        {/* Completion Checklist */}
        <ProfileCompletionChecklist profile={profile} />

        {/* Profile Images */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer">
              <div className="w-20 h-20 rounded-full bg-neutral-200 overflow-hidden flex items-center justify-center">
                {profile?.profile_avatar ? (
                  <img src={profile.profile_avatar} alt="" className="w-full h-full object-cover" />
                ) : profileImageUploading ? (
                  <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-neutral-400" />
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
            <div>
              <p className="text-sm font-medium text-neutral-700">Profile Avatar</p>
              <p className="text-xs text-neutral-400">Circular profile picture</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer">
              <div className="w-20 h-20 rounded-2xl bg-neutral-200 overflow-hidden flex items-center justify-center">
                {profile?.profile_image ? (
                  <img src={profile.profile_image} alt="" className="w-full h-full object-cover" />
                ) : profileImageUploading ? (
                  <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-neutral-400" />
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleProfileImageUpload} className="hidden" />
            </label>
            <div>
              <p className="text-sm font-medium text-neutral-700">Cover Photo</p>
              <p className="text-xs text-neutral-400">Main profile image</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-neutral-500 mb-1 block">Display Name *</Label>
            <Input
              value={profile?.display_name || ""}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              placeholder="Your name or studio name"
              className="rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs text-neutral-500 mb-1 block">Bio</Label>
            <Textarea
              value={profile?.bio || ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell potential clients about yourself..."
              className="rounded-xl min-h-[100px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-neutral-500 mb-1 block">Creator Type</Label>
              <Select
                value={profile?.creator_type || "photographer"}
                onValueChange={(v) => setProfile({ ...profile, creator_type: v })}
              >
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="photographer">Photographer</SelectItem>
                  <SelectItem value="videographer">Videographer</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-neutral-500 mb-1 block">Starting From Price (ZAR)</Label>
              <Input
                type="number"
                value={profile?.starting_price || ""}
                onChange={(e) => setProfile({ ...profile, starting_price: parseFloat(e.target.value) || null })}
                placeholder="e.g. 2500"
                className="rounded-xl"
              />
              <p className="text-xs text-neutral-400 mt-1">
                Helps clients filter and set expectations
              </p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div>
          <Label className="text-xs text-neutral-500 mb-2 block">Categories *</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  profile?.categories?.includes(cat)
                    ? "bg-blue-500 text-white"
                    : "bg-white border border-neutral-200 text-neutral-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Service Areas */}
        <div>
          <Label className="text-xs text-neutral-500 mb-2 block">Operating Areas *</Label>
          <p className="text-xs text-neutral-400 mb-3">
            Select the areas you are happy to shoot in. You do not need to share your exact location.
          </p>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((area) => (
              <button
                key={area}
                onClick={() => toggleArea(area)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  profile?.service_areas?.includes(area)
                    ? "bg-blue-500 text-white"
                    : "bg-white border border-neutral-200 text-neutral-600"
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <Label className="text-xs text-neutral-500 block">Contact & Social</Label>
          <Input
            value={profile?.contact_email || ""}
            onChange={(e) => setProfile({ ...profile, contact_email: e.target.value })}
            placeholder="Contact email"
            className="rounded-xl"
          />
          <Input
            value={profile?.instagram_handle || ""}
            onChange={(e) => setProfile({ ...profile, instagram_handle: e.target.value })}
            placeholder="Instagram handle (without @)"
            className="rounded-xl"
          />
          <Input
            value={profile?.website_url || ""}
            onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
            placeholder="Website URL"
            className="rounded-xl"
          />
        </div>

        {/* Portfolio */}
        <div>
          <Label className="text-xs text-neutral-500 mb-2 block">Portfolio</Label>
          <p className="text-xs text-neutral-400 mb-3">
            Choose a featured image to display on your card
          </p>
          <PortfolioUploader
            items={profile?.portfolio_items || []}
            onChange={(items) => {
              const updated = { ...profile, portfolio_items: items };
              if (items.length > 0 && !profile?.profile_image) {
                updated.profile_image = items[0].url;
              }
              // Clear featured if that item was deleted
              if (profile?.featuredPortfolioItemId) {
                const featuredExists = items.find((_, idx) => idx.toString() === profile.featuredPortfolioItemId);
                if (!featuredExists) {
                  updated.featuredPortfolioItemId = null;
                }
              }
              setProfile(updated);
            }}
          />
          
          {profile?.portfolio_items?.length > 0 && (
            <div className="mt-4">
              <Label className="text-xs text-neutral-500 mb-2 block">Featured Portfolio Item</Label>
              <div className="grid grid-cols-3 gap-2">
                {profile.portfolio_items.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setProfile({ ...profile, featuredPortfolioItemId: idx.toString() })}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      profile.featuredPortfolioItemId === idx.toString()
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-neutral-200"
                    }`}
                  >
                    <img src={item.url} alt="" className="w-full h-full object-cover" />
                    {profile.featuredPortfolioItemId === idx.toString() && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-blue-600" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Publish */}
        <div className={`p-4 rounded-2xl border transition-all ${profile?.is_published ? "bg-green-50 border-green-200" : "bg-white border-neutral-100"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-800">Publish Profile</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {profile?.is_published ? "Your profile is live!" : "Make your profile visible to clients"}
              </p>
            </div>
            <Switch
              checked={profile?.is_published || false}
              onCheckedChange={(v) => setProfile({ ...profile, is_published: v })}
            />
          </div>
          {isOnboarding && !profile?.is_published && (
            <div className="mt-3 pt-3 border-t border-neutral-100">
              <p className="text-xs text-neutral-600">
                Complete all steps above, then publish to start receiving client requests.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-neutral-100 z-30">
        <Button
          onClick={handleSave}
          disabled={saving || !profile?.display_name || !profile?.categories?.length || !profile?.service_areas?.length}
          className="w-full h-14 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-medium text-base"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : saved ? (
            <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saved ? (isOnboarding && profile?.is_published ? "Welcome to Lensly!" : !isOnboarding && profile?.is_published ? "Profile updated" : "Saved!") : saving ? "Saving..." : (isOnboarding && profile?.is_published ? "Publish & Continue" : "Save Profile")}
        </Button>
      </div>

      <OnboardingSuccessModal
        open={showSuccessModal}
        profile={profile}
        onContinue={() => {
          window.location.href = createPageUrl("Home");
        }}
      />
    </div>
  );
}