import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";

export default function AccountDeletionModal({ open, onClose, actionType }) {
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(1);

  const handleConfirm = async () => {
    if (actionType === "delete" && step === 1) {
      setStep(2);
      return;
    }

    setProcessing(true);
    try {
      await base44.functions.invoke("manageAccount", { action: actionType });
      base44.auth.logout();
    } catch (error) {
      console.error("Account action failed:", error);
      alert("Something went wrong. Please try again.");
      setProcessing(false);
    }
  };

  const isDeactivate = actionType === "deactivate";
  const title = step === 1 
    ? (isDeactivate ? "Deactivate Account?" : "Delete Account Permanently?")
    : "Final Confirmation";
  
  const description = step === 1
    ? (isDeactivate 
        ? "Your profile will be hidden from Discover and you won't be able to send or receive messages. You can reactivate by logging back in."
        : "This will permanently delete your account and all associated data including your profile, messages, and portfolio. This action cannot be undone.")
    : "Are you absolutely sure? This action is permanent and cannot be reversed.";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <DialogTitle className="text-xl text-center">{title}</DialogTitle>
          <DialogDescription className="text-center pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-4">
          <Button
            onClick={handleConfirm}
            disabled={processing}
            className="w-full rounded-xl bg-red-600 hover:bg-red-700 h-11"
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {step === 1 ? "Continue" : "Yes, I'm sure"}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            disabled={processing}
            className="w-full rounded-xl h-11"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}