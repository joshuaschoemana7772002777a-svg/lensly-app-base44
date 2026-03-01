import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { createNotification } from "./NotificationService";
import { checkRequestAbuseLimit, trackRequestActivity } from "./RequestAbuseDetection";
import useScrollLock from "./useScrollLock";

const CATEGORIES = ["Corporate", "Brand / Commercial", "Wedding", "Event", "Lifestyle", "Social Media Content"];

export default function ContactFormModal({ open, onClose, creator }) {
  const [form, setForm] = useState({
    category: "",
    service_area: "",
    preferred_date: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [abuseError, setAbuseError] = useState(null);
  useScrollLock(open);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setAbuseError(null);

    try {
      const user = await base44.auth.me();

      // Check for abuse patterns
      const abuseCheck = await checkRequestAbuseLimit(
        user.email,
        creator.id,
        form.message
      );

      if (!abuseCheck.allowed) {
        setAbuseError(abuseCheck.message);
        setSending(false);
        return;
      }

      const request = await base44.entities.ContactRequest.create({
        ...form,
        creator_profile_id: creator.id,
        creator_name: creator.display_name,
        sender_name: user.full_name,
        sender_email: user.email,
      });

      // Track request activity
      await trackRequestActivity(
        user.email,
        creator.id,
        request.id,
        form.message,
        form.category
      );

      // Notify creator of new request (with throttling)
      await createNotification({
        recipientEmail: creator.created_by,
        type: "request_new",
        title: "New Request",
        message: `${user.full_name} sent you a request for ${form.category || "a shoot"}.`,
        linkUrl: createPageUrl("MyRequests"),
        relatedId: request.id,
        senderName: user.full_name,
      });

      setSending(false);
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setForm({ category: "", service_area: "", preferred_date: "", message: "" });
        setAbuseError(null);
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error sending request:", error);
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
        {sent ? (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Request Sent Successfully!</h3>
            <p className="text-neutral-600 text-sm text-center max-w-xs">
              Your contact request has been sent to {creator?.display_name}.
            </p>
            <p className="text-neutral-500 text-xs text-center max-w-xs">
              They can now message you. Check My Requests to continue.
            </p>
            <p className="text-amber-600 text-xs text-center max-w-xs font-medium">
              💳 Payments are arranged directly between you and the creator.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Contact {creator?.display_name}</DialogTitle>
              <DialogDescription>Tell them about your project</DialogDescription>
            </DialogHeader>
            {abuseError && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">{abuseError}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-neutral-500 mb-1 block">Shoot Type *</Label>
                  <Select required value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-neutral-500 mb-1 block">Operating Area *</Label>
                  <Select required value={form.service_area} onValueChange={(v) => setForm({ ...form, service_area: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select area" /></SelectTrigger>
                    <SelectContent>
                      {creator?.service_areas?.map((area) => <SelectItem key={area} value={area}>{area}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-neutral-500 mb-1 block">Message *</Label>
                <Textarea
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell them about your project..."
                  className="rounded-xl min-h-[100px]"
                />
              </div>
              <div>
                <Label className="text-xs text-neutral-500 mb-1 block">Shoot Date (Optional)</Label>
                <Input
                  type="date"
                  value={form.preferred_date}
                  onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <Button
                type="submit"
                disabled={sending}
                className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 h-12 text-sm font-medium"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Send Request
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}