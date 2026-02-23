import React from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, User } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function RoleSelectionModal({ open, onClose }) {
  const handleCreatorRole = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      // Redirect to login with a flag to select creator role after signup
      base44.auth.redirectToLogin(window.location.origin + "?select_role=creator");
      return;
    }

    const user = await base44.auth.me();
    const currentType = user.account_type;
    
    if (currentType === "client") {
      await base44.auth.updateMe({ account_type: "both" });
    } else if (!currentType) {
      await base44.auth.updateMe({ account_type: "creator" });
    }
    
    window.location.href = createPageUrl("EditProfile");
  };

  const handleClientRole = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      // Redirect to login with a flag to select client role after signup
      base44.auth.redirectToLogin(window.location.origin + "?select_role=client");
      return;
    }

    const user = await base44.auth.me();
    if (!user.account_type) {
      await base44.auth.updateMe({ account_type: "client" });
    }
    
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">How will you use Lensly?</DialogTitle>
          <DialogDescription className="text-center">
            Choose how you'd like to get started
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          <button
            onClick={handleClientRole}
            className="w-full p-5 rounded-2xl border-2 border-neutral-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500 transition-colors">
                <User className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-neutral-900 mb-1">I'm looking to hire</h3>
                <p className="text-sm text-neutral-600">Find and connect with talented photographers and videographers</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleCreatorRole}
            className="w-full p-5 rounded-2xl border-2 border-neutral-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500 transition-colors">
                <Camera className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-neutral-900 mb-1">I'm a creator</h3>
                <p className="text-sm text-neutral-600">Showcase your work and get discovered by clients</p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="text-sm text-neutral-500 hover:text-neutral-700 mt-4 text-center w-full"
        >
          I'll decide later
        </button>
      </DialogContent>
    </Dialog>
  );
}