import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Heart } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function RoleSelectionModal({ open, onClose }) {
  const handleSelectCreator = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      base44.auth.redirectToLogin(createPageUrl("EditProfile"));
    } else {
      const user = await base44.auth.me();
      const currentRole = user.account_type || "client";
      const newRole = currentRole === "client" ? "creator" : "both";
      await base44.auth.updateMe({ account_type: newRole });
      window.location.href = createPageUrl("EditProfile");
    }
  };

  const handleSelectClient = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (authed) {
      await base44.auth.updateMe({ account_type: "client" });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            What would you like to create?
          </h2>
          <p className="text-sm text-neutral-500">
            Choose how you want to use Lensly
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSelectClient}
            className="w-full p-6 rounded-2xl border-2 border-neutral-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900 mb-1">Client Profile</h3>
                <p className="text-sm text-neutral-500">
                  Browse creators, save favourites, and send booking requests
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={handleSelectCreator}
            className="w-full p-6 rounded-2xl border-2 border-neutral-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900 mb-1">Creator Profile</h3>
                <p className="text-sm text-neutral-500">
                  Showcase your work and receive booking requests from clients
                </p>
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}