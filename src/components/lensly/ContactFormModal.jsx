import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, CheckCircle2, Loader2 } from "lucide-react";

const CATEGORIES = ["Corporate", "Brand / Commercial", "Weddings", "Events", "Lifestyle", "Social Media Content"];

export default function ContactFormModal({ open, onClose, creator }) {
  const [form, setForm] = useState({
    sender_name: "",
    sender_email: "",
    sender_phone: "",
    category: "",
    preferred_date: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await base44.entities.ContactRequest.create({
      ...form,
      creator_profile_id: creator.id,
      creator_name: creator.display_name,
    });
    setSending(false);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setForm({ sender_name: "", sender_email: "", sender_phone: "", category: "", preferred_date: "", message: "" });
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
        {sent ? (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Request Sent!</h3>
            <p className="text-neutral-500 text-sm text-center">
              {creator?.display_name} will get back to you soon.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Contact {creator?.display_name}</DialogTitle>
              <DialogDescription>Tell them about your project</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-neutral-500 mb-1 block">Your Name *</Label>
                  <Input
                    required
                    value={form.sender_name}
                    onChange={(e) => setForm({ ...form, sender_name: e.target.value })}
                    placeholder="Full name"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-neutral-500 mb-1 block">Email *</Label>
                  <Input
                    required
                    type="email"
                    value={form.sender_email}
                    onChange={(e) => setForm({ ...form, sender_email: e.target.value })}
                    placeholder="email@example.com"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-neutral-500 mb-1 block">Phone</Label>
                  <Input
                    value={form.sender_phone}
                    onChange={(e) => setForm({ ...form, sender_phone: e.target.value })}
                    placeholder="+27..."
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-neutral-500 mb-1 block">Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-neutral-500 mb-1 block">Preferred Date</Label>
                  <Input
                    type="date"
                    value={form.preferred_date}
                    onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-neutral-500 mb-1 block">Message *</Label>
                <Textarea
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell them about your project, vision, and any specific requirements..."
                  className="rounded-xl min-h-[100px]"
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