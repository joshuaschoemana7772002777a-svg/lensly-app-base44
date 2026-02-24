import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, Camera, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react";
import PortfolioUploader from "../components/lensly/PortfolioUploader";
import OnboardingSuccessModal from "../components/lensly/OnboardingSuccessModal";
import ProfileCompletionChecklist from "../components/lensly/ProfileCompletionChecklist";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

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
  const [coverImageError, setCoverImageError] = useState(null);
  const [showVisibilityBanner, setShowVisibilityBanner] = useState(false);

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
        categories: [],
        featured_categories: [],
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
    const wasIncomplete = !profile.is_published;
    
    // Auto-publish if all required fields are filled
    const isComplete = !!(
      profile.display_name &&
      profile.bio &&
      profile.creator_type &&
      profile.starting_price &&
      profile.categories?.length > 0 &&
      profile.featured_categories?.length > 0 &&
      profile.service_areas?.length > 0 &&
      profile.profile_image
    );
    
    const updatedProfile = { ...profile, is_published: isComplete };
    let savedProfileId = profile.id;
    
    if (profile.id) {
      await base44.entities.CreatorProfile.update(profile.id, updatedProfile);
    } else {
      const created = await base44.entities.CreatorProfile.create(updatedProfile);
      savedProfileId = created.id;
      setProfile({ ...updatedProfile, id: created.id });
    }
    setSaving(false);
    setSaved(true);
    
    // Show success toast
    toast.success("Profile updated");
    
    // Show visibility banner if profile just went live
    if (wasIncomplete && isComplete) {
      setShowVisibilityBanner(true);
      setTimeout(() => setShowVisibilityBanner(false), 5000);
    }
    
    if (wasOnboarding && isComplete) {
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 500);
    } else if (!isOnboarding && isComplete) {
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
    
    if (file.type.startsWith('video/')) {
      setCoverImageError("Videos can be uploaded to your portfolio, not as your cover image.");
      setTimeout(() => setCoverImageError(null), 4000);
      e.target.value = '';
      return;
    }
    
    setCoverImageError(null);
    setProfileImageUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setProfile(p => ({ ...p, profile_image: file_url }));
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

  const isProfileComplete = !!(
    profile?.display_name &&
    profile?.bio &&
    profile?.creator_type &&
    profile?.starting_price &&
    profile?.categories?.length > 0 &&
    profile?.featured_categories?.length > 0 &&
    profile?.service_areas?.length > 0 &&
    profile?.profile_image
  );
  
  const steps = [
    { name: "Basic Info", complete: !!(profile?.display_name && profile?.bio && profile?.profile_image) },
    { name: "Pricing", complete: !!(profile?.starting_price && profile?.creator_type) },
    { name: "Categories", complete: !!(profile?.categories?.length > 0 && profile?.featured_categories?.length > 0) },
    { name: "Service Areas", complete: !!(profile?.service_areas?.length > 0) },
  ];
  const completedSteps = steps.filter(s => s.complete).length;

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="px-5 pt-6 pb-4">
        {showVisibilityBanner && (
          <div className="mb-4 p-4 rounded-2xl bg-green-50 border border-green-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">Your profile is now live on Discover!</p>
              <p className="text-xs text-green-700 mt-1">Clients can now find and contact you.</p>
            </div>
          </div>
        )}
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

        {/* Cover Photo */}
        <div className="space-y-2">
          <Label className="text-xs text-neutral-500 block">Cover Photo *</Label>
          <p className="text-xs text-neutral-400 mb-3">
            Upload a high-quality image that represents your work. This appears on Discover and your profile.
          </p>
          {coverImageError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
              {coverImageError}
            </div>
          )}
          <label className="relative cursor-pointer block">
            <div className="w-full aspect-video rounded-2xl bg-neutral-200 overflow-hidden flex items-center justify-center">
              {profile?.profile_image ? (
                <img src={profile.profile_image} alt="" className="w-full h-full object-cover" />
              ) : profileImageUploading ? (
                <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Camera className="w-8 h-8 text-neutral-400" />
                  <span className="text-xs text-neutral-500">Upload cover photo</span>
                </div>
              )}
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfileImageUpload} className="hidden" />
          </label>
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

        {/* Featured Specialties */}
        <div>
          <Label className="text-xs text-neutral-500 mb-2 block">Featured Specialties (1-2 required) *</Label>
          <p className="text-xs text-neutral-400 mb-3">
            Select 1-2 specialties from your categories above to appear on your Discover card.
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const isInCategories = profile?.categories?.includes(cat);
              const isFeatured = profile?.featured_categories?.includes(cat);
              const isMaxSelected = (profile?.featured_categories?.length || 0) >= 2;
              const isDisabled = !isInCategories || (!isFeatured && isMaxSelected);
              
              return (
                <button
                  key={cat}
                  onClick={() => {
                    if (!isInCategories) return;
                    
                    const current = profile.featured_categories || [];
                    if (isFeatured) {
                      setProfile({
                        ...profile,
                        featured_categories: current.filter(c => c !== cat)
                      });
                    } else if (current.length < 2) {
                      setProfile({
                        ...profile,
                        featured_categories: [...current, cat]
                      });
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all relative ${
                    isFeatured
                      ? "bg-blue-500 text-white"
                      : isDisabled
                      ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                      : "bg-white border border-neutral-200 text-neutral-600 hover:border-blue-300"
                  }`}
                  disabled={isDisabled}
                  title={!isInCategories ? "Select this category above first" : isMaxSelected && !isFeatured ? "Max 2 specialties" : ""}
                >
                  {cat}
                </button>
              );
            })}
          </div>
          {profile?.categories?.length > 0 && (profile?.featured_categories?.length || 0) === 0 && (
            <p className="text-xs text-amber-600 mt-2">⚠️ Please select at least 1 featured specialty</p>
          )}
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
          <PortfolioUploader
            items={profile?.portfolio_items || []}
            onChange={(items) => {
              const updated = { ...profile, portfolio_items: items };
              if (items.length > 0 && !profile?.profile_image) {
                const firstImage = items.find(item => item.type === 'image');
                if (firstImage) {
                  updated.profile_image = firstImage.url;
                }
              }
              setProfile(updated);
            }}
            featuredItemId={profile?.featuredPortfolioItemId}
            onFeaturedChange={(itemUrl) => setProfile({ ...profile, featuredPortfolioItemId: itemUrl })}
          />
        </div>

        {/* Profile Status */}
        {isProfileComplete ? (
          <div className="p-4 rounded-2xl border bg-green-50 border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Profile Complete & Live</p>
                <p className="text-xs text-green-700 mt-0.5">
                  Your profile is visible to clients on Discover
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border bg-amber-50 border-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-900">Complete Your Profile</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Fill all required fields above to go live
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-neutral-100 z-30">
        <div>
          <p className="text-xs text-neutral-500 text-center mb-3">
            Saving your profile updates your Discover listing instantly.
          </p>
          <Button
            onClick={handleSave}
            disabled={saving || !profile?.display_name || !profile?.profile_image || !profile?.categories?.length || !profile?.featured_categories?.length || !profile?.service_areas?.length || !profile?.starting_price}
            className="w-full h-14 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-medium text-base"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : saved ? (
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saved ? (isOnboarding && isProfileComplete ? "Welcome to Lensly!" : !isOnboarding && isProfileComplete ? "Profile updated" : "Saved!") : saving ? "Saving..." : (isOnboarding && isProfileComplete ? "Save & Go Live" : "Save Profile")}
          </Button>
        </div>
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