import React from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Camera, User, Loader2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Checkbox } from "@/components/ui/checkbox";
import ClientSignupModal from "./ClientSignupModal";

export default function RoleSelectionModal({ open, onClose }) {
  const [consentChecked, setConsentChecked] = React.useState(false);
  const [consentError, setConsentError] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingRole, setProcessingRole] = React.useState(null); // "client" | "creator"
  const [showClientModal, setShowClientModal] = React.useState(false);
  const [skipConsent, setSkipConsent] = React.useState(false);
  const [saveError, setSaveError] = React.useState(null);

  React.useEffect(() => {
    if (open) checkIfConsentNeeded();
  }, [open]);

  const checkIfConsentNeeded = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) return;
    const user = await base44.auth.me();
    if (user?.termsAccepted) {
      setSkipConsent(true);
      setConsentChecked(true);
    }
  };

  const handleRoleSelect = async (role) => {
    setSaveError(null);

    if (!skipConsent && !consentChecked) {
      setConsentError(true);
      return;
    }

    setIsProcessing(true);
    setProcessingRole(role);

    try {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) {
        base44.auth.redirectToLogin(window.location.origin + `?select_role=${role}`);
        return;
      }

      const user = await base44.auth.me();

      const updates = {
        role,
        roleChosenAt: user.roleChosenAt || new Date().toISOString(),
        roleLastChangedAt: new Date().toISOString(),
      };

      if (!skipConsent) {
        updates.termsAccepted = true;
        updates.termsAcceptedAt = new Date().toISOString();
        updates.termsVersion = "v1.0";
      }

      if (role === "creator") {
        await base44.auth.updateMe(updates);
        // Additive: do NOT disable client profile — just send user to create/edit creator profile
        window.location.href = createPageUrl("EditProfile");
      } else {
        // client: show signup modal — additive, do NOT disable creator profile
        setShowClientModal(true);
        setIsProcessing(false);
        setProcessingRole(null);
      }
    } catch (err) {
      console.error("Role selection failed:", err);
      setSaveError("Couldn't save role, try again.");
      setIsProcessing(false);
      setProcessingRole(null);
    }
  };

  const handleClientSignupSuccess = () => {
    setShowClientModal(false);
    onClose();
    window.location.href = createPageUrl("Discover");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md mx-4 rounded-2xl" style={{ zIndex: 9999 }}>
          <DialogHeader>
            <DialogTitle className="text-xl text-center">How will you use Lensly?</DialogTitle>
            <DialogDescription className="text-center">
              Choose what you're here to do. You can always change this later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Consent checkbox — shown FIRST so users understand why they must agree before tapping */}
            {!skipConsent && (
              <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="consent-role"
                    checked={consentChecked}
                    onCheckedChange={(checked) => {
                      setConsentChecked(!!checked);
                      setConsentError(false);
                    }}
                    className="mt-0.5 shrink-0"
                  />
                  <label htmlFor="consent-role" className="text-xs text-neutral-700 leading-relaxed cursor-pointer select-none">
                    I agree to Lensly's{" "}
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
                  <p className="text-xs text-red-600 ml-7">
                    Please agree to the Terms & Privacy Policy to continue.
                  </p>
                )}
              </div>
            )}

            {/* Role buttons */}
            <button
              type="button"
              onClick={() => handleRoleSelect("client")}
              disabled={isProcessing}
              className="w-full p-5 rounded-2xl border-2 border-neutral-200 hover:border-blue-500 hover:bg-blue-50 active:bg-blue-100 transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ pointerEvents: isProcessing ? "none" : "auto" }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  {processingRole === "client" ? (
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  ) : (
                    <User className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-0.5">I'm a Client</h3>
                  <p className="text-sm text-neutral-500">Hire photographers & videographers</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect("creator")}
              disabled={isProcessing}
              className="w-full p-5 rounded-2xl border-2 border-neutral-200 hover:border-blue-500 hover:bg-blue-50 active:bg-blue-100 transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ pointerEvents: isProcessing ? "none" : "auto" }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  {processingRole === "creator" ? (
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-0.5">I'm a Creator</h3>
                  <p className="text-sm text-neutral-500">Offer photography or video services</p>
                </div>
              </div>
            </button>

            {saveError && (
              <p className="text-xs text-red-600 text-center">{saveError}</p>
            )}
          </div>
          <DialogDescription className="text-center text-xs text-neutral-400 mt-2">
            You can always add the other profile type later in Settings.
          </DialogDescription>
          <div>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-neutral-400 hover:text-neutral-600 w-full text-center py-1"
            >
              I'll decide later
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {showClientModal && (
        <ClientSignupModal
          open={showClientModal}
          onClose={() => setShowClientModal(false)}
          onSuccess={handleClientSignupSuccess}
          skipConsent={skipConsent || consentChecked}
        />
      )}
    </>
  );
}