import React from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, User } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Checkbox } from "@/components/ui/checkbox";
import ClientSignupModal from "./ClientSignupModal";

export default function RoleSelectionModal({ open, onClose, isSwitchingRole = false }) {
  const [consentChecked, setConsentChecked] = React.useState(false);
  const [consentError, setConsentError] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showClientModal, setShowClientModal] = React.useState(false);
  const [skipConsent, setSkipConsent] = React.useState(false);

  React.useEffect(() => {
    if (open && isSwitchingRole) {
      checkIfConsentNeeded();
    }
  }, [open, isSwitchingRole]);

  const checkIfConsentNeeded = async () => {
    const user = await base44.auth.me();
    if (user?.termsAccepted) {
      setSkipConsent(true);
      setConsentChecked(true);
    }
  };

  const handleCreatorRole = async () => {
    if (!consentChecked) {
      setConsentError(true);
      return;
    }
    setIsProcessing(true);
    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      base44.auth.redirectToLogin(window.location.origin + "?select_role=creator");
      return;
    }

    const user = await base44.auth.me();
    const updates = { 
      role: "creator",
      roleChosenAt: user.roleChosenAt || new Date().toISOString(),
      roleLastChangedAt: new Date().toISOString(),
    };

    if (!skipConsent) {
      updates.termsAccepted = true;
      updates.termsAcceptedAt = new Date().toISOString();
      updates.termsVersion = "v1.0";
    }

    await base44.auth.updateMe(updates);

    // If switching from client, disable client profile
    if (isSwitchingRole) {
      const clientProfiles = await base44.entities.ClientProfile.filter({ created_by: user.email });
      if (clientProfiles.length > 0) {
        await base44.entities.ClientProfile.update(clientProfiles[0].id, { status: "disabled" });
      }

      // Reactivate creator profile if exists
      const creatorProfiles = await base44.entities.CreatorProfile.filter({ created_by: user.email });
      if (creatorProfiles.length > 0) {
        await base44.entities.CreatorProfile.update(creatorProfiles[0].id, { status: "draft" });
      }
    }
    
    window.location.href = createPageUrl("EditProfile");
  };

  const handleClientRole = async () => {
    if (!consentChecked) {
      setConsentError(true);
      return;
    }
    setIsProcessing(true);
    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      base44.auth.redirectToLogin(window.location.origin + "?select_role=client");
      return;
    }

    const user = await base44.auth.me();

    // If switching from creator, disable creator profile
    if (isSwitchingRole) {
      const creatorProfiles = await base44.entities.CreatorProfile.filter({ created_by: user.email });
      if (creatorProfiles.length > 0) {
        await base44.entities.CreatorProfile.update(creatorProfiles[0].id, { 
          status: "disabled",
          is_published: false
        });
      }

      // Reactivate client profile if exists
      const clientProfiles = await base44.entities.ClientProfile.filter({ created_by: user.email });
      if (clientProfiles.length > 0) {
        await base44.entities.ClientProfile.update(clientProfiles[0].id, { status: "active" });
      }
    }

    // Show client account creation modal
    setShowClientModal(true);
    setIsProcessing(false);
  };

  const handleClientSignupSuccess = () => {
    setShowClientModal(false);
    onClose();
    if (isSwitchingRole) {
      window.location.href = createPageUrl("Settings");
    } else {
      window.location.href = createPageUrl("Discover");
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">How will you use Lensly?</DialogTitle>
          <DialogDescription className="text-center">
            Choose what you're here to do. You can always change this later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          <button
            onClick={handleClientRole}
            disabled={!consentChecked || isProcessing}
            className="w-full p-5 rounded-2xl border-2 border-neutral-200 hover:border-blue-500 hover:bg-blue-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500 transition-colors">
                <User className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-neutral-900 mb-1">I'm a Client</h3>
                <p className="text-sm text-neutral-600">Hire photographers & videographers</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleCreatorRole}
            disabled={!consentChecked || isProcessing}
            className="w-full p-5 rounded-2xl border-2 border-neutral-200 hover:border-blue-500 hover:bg-blue-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500 transition-colors">
                <Camera className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-neutral-900 mb-1">I'm a Creator</h3>
                <p className="text-sm text-neutral-600">Offer photography or video services</p>
              </div>
            </div>
          </button>
        </div>

        {/* Consent Checkbox - only show if not already consented */}
        {!skipConsent && (
          <div className="space-y-2 mt-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent-role"
                checked={consentChecked}
                onCheckedChange={(checked) => {
                  setConsentChecked(checked);
                  setConsentError(false);
                }}
                className="mt-0.5"
              />
              <label htmlFor="consent-role" className="text-xs text-neutral-700 leading-relaxed cursor-pointer">
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

        <button
          onClick={onClose}
          className="text-sm text-neutral-500 hover:text-neutral-700 mt-4 text-center w-full"
        >
          I'll decide later
        </button>
      </DialogContent>
    </Dialog>

    {showClientModal && (
      <ClientSignupModal
        open={showClientModal}
        onClose={() => setShowClientModal(false)}
        onSuccess={handleClientSignupSuccess}
        skipConsent={skipConsent}
      />
    )}
  </>
  );
}