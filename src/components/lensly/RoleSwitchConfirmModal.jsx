import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function RoleSwitchConfirmModal({ open, onClose, onContinue, currentRole }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <DialogTitle className="text-xl">Switch role?</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-neutral-600 leading-relaxed">
            {currentRole === "creator" ? (
              <>
                Switching roles will hide your creator profile from Discover. 
                Your profile and all data will remain saved, but won't be visible to clients until you switch back.
              </>
            ) : (
              <>
                Switching to creator will start the creator profile setup flow. 
                Your client profile will remain saved and accessible if you switch back.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={onContinue}
            className="flex-1 rounded-xl bg-blue-500 hover:bg-blue-600"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}