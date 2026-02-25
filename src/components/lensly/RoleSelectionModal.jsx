import React from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, User } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Checkbox } from "@/components/ui/checkbox";

export default function RoleSelectionModal({ open, onClose }) {
  const [consentChecked, setConsentChecked] = React.useState(false);
  const [consentError, setConsentError] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleCreatorRole = async () => {
    if (!consentChecked) {
      setConsentError(true);
      return;
    }
    setIsProcessing(true);
    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      // Redirect to login with a flag to select creator role after signup
      base44.auth.redirectToLogin(window.location.origin + "?select_role=creator");
      return;
    }

    const user = await base44.auth.me();
    const currentType = user.account_type;
    
    if (currentType === "client") {
      await base44.auth.updateMe({ account_type: "both", consent_timestamp: new Date().toISOString() });
    } else if (!currentType) {
      await base44.auth.updateMe({ account_type: "creator", consent_timestamp: new Date().toISOString() });
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
      // Redirect to login with a flag to select client role after signup
      base44.auth.redirectToLogin(window.location.origin + "?select_role=client");
      return;
    }

    const user = await base44.auth.me();
    if (!user.account_type) {
      await base44.auth.updateMe({ account_type: "client", consent_timestamp: new Date().toISOString() });
    }
    
    onClose();
  };

  return (
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

        {/* Consent Checkbox */}
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