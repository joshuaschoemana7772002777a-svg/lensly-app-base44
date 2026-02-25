import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, User } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function ClientSignupModal({ open, onClose, onSuccess, skipConsent = false }) {
  const [form, setForm] = useState({
    displayName: "",
    profilePhotoUrl: "",
    phoneOptional: "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [consentChecked, setConsentChecked] = useState(skipConsent);
  const [consentError, setConsentError] = useState(false);

  React.useEffect(() => {
    if (open) {
      loadUserData();
    }
  }, [open]);

  const loadUserData = async () => {
    const user = await base44.auth.me();
    setForm(prev => ({
      ...prev,
      displayName: user.full_name || prev.displayName,
      profilePhotoUrl: user.profilePhotoUrl || prev.profilePhotoUrl,
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm({ ...form, profilePhotoUrl: file_url });
    } catch (error) {
      console.error("Photo upload failed:", error);
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!skipConsent && !consentChecked) {
      setConsentError(true);
      return;
    }
    setSaving(true);
    try {
      const user = await base44.auth.me();
      
      // Generate initials
      const nameParts = form.displayName.trim().split(" ");
      const initials = nameParts.length === 1 
        ? nameParts[0].substring(0, 2).toUpperCase()
        : (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
      
      // Update user role
      const updates = {
        role: "client",
        roleChosenAt: user.roleChosenAt || new Date().toISOString(),
        roleLastChangedAt: new Date().toISOString(),
        profilePhotoUrl: form.profilePhotoUrl || null,
        profileInitials: initials,
      };

      if (!skipConsent) {
        updates.termsAccepted = true;
        updates.termsAcceptedAt = new Date().toISOString();
        updates.termsVersion = "v1.0";
      }

      await base44.auth.updateMe(updates);
      
      // Check if client profile exists, create or update
      const existingProfiles = await base44.entities.ClientProfile.filter({ created_by: user.email });
      if (existingProfiles.length > 0) {
        await base44.entities.ClientProfile.update(existingProfiles[0].id, {
          displayName: form.displayName,
          profilePhotoUrl: form.profilePhotoUrl || null,
          phoneOptional: form.phoneOptional || null,
          status: "active",
        });
      } else {
        await base44.entities.ClientProfile.create({
          displayName: form.displayName,
          profilePhotoUrl: form.profilePhotoUrl || null,
          phoneOptional: form.phoneOptional || null,
          status: "active",
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Create your account</DialogTitle>
          <DialogDescription>Complete your profile to get started</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Profile Photo */}
          <div>
            <Label className="text-xs text-neutral-500 mb-2 block">Profile Photo (Optional)</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden border-2 border-neutral-200">
                {form.profilePhotoUrl ? (
                  <img src={form.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-neutral-400" />
                )}
              </div>
              <div className="flex-1">
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
                    {uploading ? "Uploading..." : "Upload Photo"}
                  </Button>
                </label>
                <p className="text-xs text-neutral-400 mt-1">Optional — helps creators recognise you.</p>
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <Label className="text-xs text-neutral-500 mb-1 block">Full Name *</Label>
            <Input
              required
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              placeholder="e.g. Sarah Johnson"
              className="rounded-xl"
            />
          </div>

          {/* Phone */}
          <div>
            <Label className="text-xs text-neutral-500 mb-1 block">Phone Number (Optional)</Label>
            <Input
              type="tel"
              value={form.phoneOptional}
              onChange={(e) => setForm({ ...form, phoneOptional: e.target.value })}
              placeholder="e.g. 082 123 4567"
              className="rounded-xl"
            />
          </div>

          {/* Consent Checkbox - only show if needed */}
          {!skipConsent && (
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={consentChecked}
                  onCheckedChange={(checked) => {
                    setConsentChecked(checked);
                    setConsentError(false);
                  }}
                  className="mt-0.5"
                />
                <label htmlFor="consent" className="text-xs text-neutral-700 leading-relaxed cursor-pointer">
                  I confirm that I have read and agree to Lensly's{" "}
                  <a
                    href="https://getlenslyapp.com/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms & Conditions
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://getlenslyapp.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Privacy Policy
                  </a>
                  .
                </label>
              </div>
              {consentError && (
                <p className="text-xs text-red-600 ml-8">
                  Please confirm that you agree to the Terms & Conditions and Privacy Policy to continue.
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={saving || !form.displayName || (!skipConsent && !consentChecked)}
            className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 h-12 text-sm font-medium disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {skipConsent ? "Save Profile" : "Create account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}