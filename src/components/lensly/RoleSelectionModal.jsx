import React from "react";
import { base44 } from "@/api/base44Client";
import { Camera, User, Loader2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { createPageUrl } from "@/utils";
import ClientSignupModal from "./ClientSignupModal";

const TERMS_VERSION = "v1.0";

/**
 * RoleSelectionModal
 * Props:
 *   open         — boolean
 *   onClose      — called when user dismisses (only shown when allowDismiss=true)
 *   onSuccess    — called after role+terms saved successfully
 *   allowDismiss — if true, shows X button; if false, user cannot escape
 */
export default function RoleSelectionModal({ open, onClose, onSuccess, allowDismiss = false }) {
  const [termsChecked, setTermsChecked] = React.useState(false);
  const [termsError, setTermsError] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingRole, setProcessingRole] = React.useState(null);
  const [showClientModal, setShowClientModal] = React.useState(false);
  const [saveError, setSaveError] = React.useState(null);
  const [termsAlreadyAccepted, setTermsAlreadyAccepted] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTermsChecked(false);
      setTermsError(false);
      setSaveError(null);
      checkExistingTerms();
    }
  }, [open]);

  const checkExistingTerms = async () => {
    try {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) return;
      const user = await base44.auth.me();
      if (user?.termsAcceptedAt && user?.termsVersion === TERMS_VERSION && user?.userRole) {
        setTermsAlreadyAccepted(true);
        setTermsChecked(true);
      } else {
        setTermsAlreadyAccepted(false);
      }
    } catch {}
  };

  const canChooseRole = termsChecked;

  const handleRoleSelect = async (role) => {
    if (!canChooseRole) {
      setTermsError(true);
      return;
    }

    setSaveError(null);
    setIsProcessing(true);
    setProcessingRole(role);

    try {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }

      const user = await base44.auth.me();
      if (!user || !user.email) {
        throw new Error("Could not load user profile — please refresh and try again.");
      }

      const now = new Date().toISOString();
      const updates = {
        userRole: role,
        roleChosenAt: now,
        roleLastChangedAt: now,
        termsAcceptedAt: now,
        termsVersion: TERMS_VERSION,
      };

      console.log("[RoleSelection] Saving updates:", updates, "for user:", user.email);

      await base44.auth.updateMe(updates);

      console.log("[RoleSelection] Save succeeded, role:", role);

      if (role === "creator") {
        setIsProcessing(false);
        setProcessingRole(null);
        if (onSuccess) onSuccess();
        window.location.href = createPageUrl("EditProfile");
      } else {
        setShowClientModal(true);
        setIsProcessing(false);
        setProcessingRole(null);
      }
    } catch (err) {
      const msg = err?.message || err?.response?.data?.error || String(err);
      console.error("[RoleSelection] FAILED — status:", err?.response?.status, "message:", msg, "full error:", err);
      setSaveError("Couldn't save your choice, please try again.");
      setIsProcessing(false);
      setProcessingRole(null);
    }
  };

  const handleClientSignupSuccess = () => {
    setShowClientModal(false);
    if (onSuccess) onSuccess();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/50"
        onClick={allowDismiss ? onClose : undefined}
        style={{ pointerEvents: allowDismiss ? "auto" : "none" }}
      />

      {/* Modal panel — always above backdrop */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center px-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-neutral-900 text-center">How will you use Lensly?</h2>
              <p className="text-sm text-neutral-500 text-center mt-1">
                Choose what you're here to do. You can always change this later.
              </p>
            </div>
            {allowDismiss && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center ml-2 shrink-0"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            )}
          </div>

          <div className="space-y-4 mt-5">
            {/* Terms checkbox — only show if not already accepted */}
            {!termsAlreadyAccepted && (
              <div className={`rounded-xl p-4 space-y-2 border ${termsError ? "border-red-300 bg-red-50" : "border-neutral-200 bg-neutral-50"}`}>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms-consent"
                    checked={termsChecked}
                    onCheckedChange={(checked) => {
                      setTermsChecked(!!checked);
                      if (checked) setTermsError(false);
                    }}
                    className="mt-0.5 shrink-0"
                  />
                  <label htmlFor="terms-consent" className="text-xs text-neutral-700 leading-relaxed cursor-pointer">
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
                {termsError && (
                  <p className="text-xs text-red-600 ml-7">
                    Please tick the box to continue.
                  </p>
                )}
              </div>
            )}

            {/* Role cards */}
            {[
              { role: "client", label: "I'm a Client", sub: "Hire photographers & videographers", Icon: User },
              { role: "creator", label: "I'm a Creator", sub: "Offer photography or video services", Icon: Camera },
            ].map(({ role, label, sub, Icon }) => (
              <button
                key={role}
                type="button"
                disabled={isProcessing || !canChooseRole}
                onClick={() => handleRoleSelect(role)}
                className={`w-full p-5 rounded-2xl border-2 transition-all text-left ${
                  canChooseRole
                    ? "border-neutral-200 hover:border-blue-500 hover:bg-blue-50 active:bg-blue-100 cursor-pointer"
                    : "border-neutral-200 bg-neutral-50 opacity-50 cursor-not-allowed"
                } ${isProcessing ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    {processingRole === role ? (
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    ) : (
                      <Icon className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-0.5">{label}</h3>
                    <p className="text-sm text-neutral-500">{sub}</p>
                  </div>
                </div>
              </button>
            ))}

            {!canChooseRole && !termsAlreadyAccepted && (
              <p className="text-center text-xs text-neutral-400">Tick the box above to continue.</p>
            )}

            {saveError && (
              <p className="text-xs text-red-600 text-center">{saveError}</p>
            )}

            <p className="text-center text-xs text-neutral-400">
              You can always add the other profile type later in Settings.
            </p>
          </div>
        </div>
      </div>

      {showClientModal && (
        <ClientSignupModal
          open={showClientModal}
          onClose={() => setShowClientModal(false)}
          onSuccess={handleClientSignupSuccess}
          skipConsent={true}
        />
      )}
    </>
  );
}