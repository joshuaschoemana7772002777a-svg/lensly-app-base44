import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import useScrollLock from "./useScrollLock";

const REPORT_REASONS = [
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "spam", label: "Spam or misleading" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "fake_profile", label: "Fake or impersonation" },
  { value: "scam_or_fraud", label: "Scam or fraud" },
  { value: "other", label: "Other" },
];

export default function ReportModal({ open, onClose, reportedUserEmail, reportedProfileId, reportedMessageId }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  useScrollLock(open);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const user = await base44.auth.me();
    await base44.entities.Report.create({
      reporter_email: user.email,
      reported_user_email: reportedUserEmail,
      reported_profile_id: reportedProfileId,
      reported_message_id: reportedMessageId,
      reason,
      details,
    });
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setReason("");
      setDetails("");
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
        {submitted ? (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Report Submitted</h3>
            <p className="text-neutral-600 text-sm text-center max-w-xs">
              Thank you. We'll review this report and take appropriate action.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Report Issue
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <Label className="text-sm text-neutral-700 mb-3 block">Why are you reporting this?</Label>
                <RadioGroup value={reason} onValueChange={setReason} required>
                  <div className="space-y-2">
                    {REPORT_REASONS.map((r) => (
                      <div key={r.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={r.value} id={r.value} />
                        <Label htmlFor={r.value} className="text-sm font-normal cursor-pointer">
                          {r.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label className="text-sm text-neutral-700 mb-1 block">Additional details (optional)</Label>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide more context..."
                  className="rounded-xl min-h-[80px]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!reason || submitting}
                  className="flex-1 rounded-xl bg-red-500 hover:bg-red-600"
                >
                  Submit Report
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}