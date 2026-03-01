import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Loader2, User } from "lucide-react";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function EditClientProfile() {
  const [profile, setProfile] = useState({
    display_name: "",
    profilePhoto: "",
    phone: "",
    bio: "",
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    
    const userData = await base44.auth.me();
    setUser(userData);
    
    // Try to load existing client profile
    const profiles = await base44.entities.ClientProfile.filter({ created_by: userData.email });
    if (profiles.length > 0) {
      const clientProfile = profiles[0];
      setProfile({
        id: clientProfile.id,
        display_name: clientProfile.displayName || "",
        profilePhoto: clientProfile.profilePhotoUrl || "",
        phone: clientProfile.phoneOptional || "",
        bio: clientProfile.bio || "",
      });
    } else {
      // Pre-fill from user data
      setProfile({
        display_name: userData.full_name || "",
        profilePhoto: userData.profilePhotoUrl || "",
        phone: "",
        bio: "",
      });
    }
    
    setLoading(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfile({ ...profile, profilePhoto: file_url });
      toast.success("Photo uploaded");
    } catch (error) {
      console.error("Photo upload failed:", error);
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!profile.display_name) {
      toast.error("Please enter your name");
      return;
    }
    
    setSaving(true);
    try {
      // Generate initials
      const nameParts = profile.display_name.trim().split(" ");
      const initials = nameParts.length === 1 
        ? nameParts[0].substring(0, 2).toUpperCase()
        : (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
      
      // Update user record (single call, correct field names)
      await base44.auth.updateMe({
        profilePhotoUrl: profile.profilePhoto,
        profileInitials: initials,
      });
      
      // Create or update client profile
      if (profile.id) {
        await base44.entities.ClientProfile.update(profile.id, {
          displayName: profile.display_name,
          profilePhotoUrl: profile.profilePhoto,
          phoneOptional: profile.phone,
          bio: profile.bio,
        });
      } else {
        await base44.entities.ClientProfile.create({
          displayName: profile.display_name,
          profilePhotoUrl: profile.profilePhoto,
          phoneOptional: profile.phone,
          bio: profile.bio,
        });
      }
      
      toast.success("Profile updated");
      setTimeout(() => {
        window.location.href = createPageUrl("Settings");
      }, 1000);
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save profile");
    }
    setSaving(false);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-neutral-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Edit Profile</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Profile Photo */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg mb-3">
            {profile.profilePhoto ? (
              <img src={profile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {getInitials(profile.display_name)}
                </span>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
            id="photo-upload"
          />
          <label htmlFor="photo-upload">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={uploading}
              onClick={() => document.getElementById('photo-upload').click()}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {uploading ? "Uploading..." : "Change Photo"}
            </Button>
          </label>
          <p className="text-xs text-neutral-400 mt-2 text-center">Profile Photo (Optional)</p>
        </div>

        {/* Full Name */}
        <div>
          <Label className="text-xs text-neutral-500 mb-2 block">Full Name *</Label>
          <Input
            required
            value={profile.display_name}
            onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
            placeholder="e.g. Sarah Johnson"
            className="rounded-xl"
          />
        </div>

        {/* Phone */}
        <div>
          <Label className="text-xs text-neutral-500 mb-2 block">Phone Number (Optional)</Label>
          <Input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            placeholder="e.g. 082 123 4567"
            className="rounded-xl"
          />
        </div>

        {/* Bio */}
        <div>
          <Label className="text-xs text-neutral-500 mb-2 block">Bio (Optional)</Label>
          <Textarea
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Tell creators a bit about yourself..."
            className="rounded-xl resize-none h-24"
            maxLength={200}
          />
          <p className="text-xs text-neutral-400 mt-1">{profile.bio?.length || 0}/200</p>
        </div>
      </div>

      {/* Save Button */}
      <div className="px-5 pt-4 pb-24">
        <Button
          onClick={handleSave}
          disabled={saving || !profile.display_name}
          className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 h-12 text-sm font-medium disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {profile.id ? "Update Profile" : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}