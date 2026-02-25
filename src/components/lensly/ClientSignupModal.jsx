import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, User } from "lucide-react";

export default function ClientSignupModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    display_name: "",
    profile_photo_url: "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm({ ...form, profile_photo_url: file_url });
    } catch (error) {
      console.error("Photo upload failed:", error);
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.auth.updateMe({
        display_name: form.display_name,
        profile_photo_url: form.profile_photo_url || null,
        account_type: "client",
      });
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
                {form.profile_photo_url ? (
                  <img src={form.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
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
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              placeholder="e.g. Sarah Johnson"
              className="rounded-xl"
            />
          </div>

          {/* Consent */}
          <p className="text-xs text-center text-neutral-500 leading-relaxed">
            By continuing, you agree to Lensly's{" "}
            <a
              href="https://getlenslyapp.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Terms & Conditions
            </a>{" "}
            and{" "}
            <a
              href="https://getlenslyapp.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Privacy Policy
            </a>
            .
          </p>

          <Button
            type="submit"
            disabled={saving || !form.display_name}
            className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 h-12 text-sm font-medium"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create account
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}