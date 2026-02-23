import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { createNotification } from "../components/lensly/NotificationService";
import { checkRequestAbuseLimit, trackRequestActivity } from "../components/lensly/RequestAbuseDetection";

const CATEGORIES = ["Corporate", "Brand / Commercial", "Weddings", "Events", "Lifestyle", "Social Media Content"];
const AREAS = ["Sandton", "Johannesburg", "Pretoria", "Cape Town"];

export default function CreateRequest() {
  const [request, setRequest] = useState({
    category: "",
    service_area: "",
    message: "",
    preferred_date: "",
    budget: "",
  });
  const [creators, setCreators] = useState([]);
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [abuseError, setAbuseError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const allCreators = await base44.entities.CreatorProfile.filter({ is_published: true });
    setCreators(allCreators);
    setLoading(false);
  };

  const toggleCreator = (creatorId) => {
    setSelectedCreators(prev =>
      prev.includes(creatorId)
        ? prev.filter(id => id !== creatorId)
        : [...prev, creatorId]
    );
  };

  const submitRequest = async () => {
    if (!request.category || !request.service_area || !request.message || selectedCreators.length === 0) return;

    setSending(true);
    setAbuseError(null);

    try {
      for (const creatorId of selectedCreators) {
        // Check abuse limits before each request
        const abuseCheck = await checkRequestAbuseLimit(
          user.email,
          creatorId,
          request.message
        );

        if (!abuseCheck.allowed) {
          setAbuseError(abuseCheck.message);
          setSending(false);
          return;
        }

        const creator = creators.find(c => c.id === creatorId);
        const newRequest = await base44.entities.ContactRequest.create({
          creator_profile_id: creatorId,
          creator_name: creator.display_name,
          sender_name: user.full_name,
          sender_email: user.email,
          category: request.category,
          service_area: request.service_area,
          message: request.message,
          preferred_date: request.preferred_date || null,
          budget: request.budget ? parseFloat(request.budget) : null,
          status: "pending",
        });

        // Track request activity
        await trackRequestActivity(
          user.email,
          creatorId,
          newRequest.id,
          request.message,
          request.category
        );

        // Notify creator (with throttling)
        await createNotification({
          recipientEmail: creator.created_by,
          type: "request_new",
          title: "New Request",
          message: `${user.full_name} sent you a request for ${request.category || "a shoot"}.`,
          linkUrl: createPageUrl("MyRequests"),
          relatedId: newRequest.id,
          senderName: user.full_name,
        });
      }

      setSending(false);
      setSent(true);

      setTimeout(() => {
        window.location.href = createPageUrl("MyRequests");
      }, 1500);
    } catch (error) {
      console.error("Error submitting requests:", error);
      setSending(false);
    }
  };

  const filteredCreators = creators.filter(c => {
    if (request.category && !c.categories?.includes(request.category)) return false;
    if (request.service_area && !c.service_areas?.includes(request.service_area)) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="sticky top-0 z-20 bg-white border-b border-neutral-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("MyRequests")} className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-neutral-700" />
          </Link>
          <h1 className="text-xl font-bold text-neutral-900">New Request</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {abuseError && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">{abuseError}</p>
          </div>
        )}
        <div>
          <Label className="text-xs text-neutral-500 mb-2 block">What type of shoot? *</Label>
          <Select value={request.category} onValueChange={(v) => setRequest({ ...request, category: v })}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-neutral-500 mb-2 block">Where? *</Label>
          <Select value={request.service_area} onValueChange={(v) => setRequest({ ...request, service_area: v })}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select area" />
            </SelectTrigger>
            <SelectContent>
              {AREAS.map(area => (
                <SelectItem key={area} value={area}>{area}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-neutral-500 mb-2 block">Preferred Date</Label>
          <Input
            type="date"
            value={request.preferred_date}
            onChange={(e) => setRequest({ ...request, preferred_date: e.target.value })}
            className="rounded-xl"
          />
        </div>

        <div>
          <Label className="text-xs text-neutral-500 mb-2 block">Budget (ZAR)</Label>
          <Input
            type="number"
            value={request.budget}
            onChange={(e) => setRequest({ ...request, budget: e.target.value })}
            placeholder="e.g. 5000"
            className="rounded-xl"
          />
        </div>

        <div>
          <Label className="text-xs text-neutral-500 mb-2 block">Details *</Label>
          <Textarea
            value={request.message}
            onChange={(e) => setRequest({ ...request, message: e.target.value })}
            placeholder="Tell creators about your project..."
            className="rounded-xl min-h-[120px]"
          />
        </div>

        <div>
          <Label className="text-xs text-neutral-500 mb-2 block">
            Send to creators * ({selectedCreators.length} selected)
          </Label>
          <p className="text-xs text-neutral-400 mb-3">
            {filteredCreators.length > 0
              ? "Select creators who match your category and location"
              : "No creators match your filters. Adjust category or location to see options."}
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredCreators.map(creator => (
              <button
                key={creator.id}
                onClick={() => toggleCreator(creator.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  selectedCreators.includes(creator.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-neutral-200 overflow-hidden flex-shrink-0">
                  {creator.profile_image && (
                    <img src={creator.profile_image} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-neutral-900">{creator.display_name}</p>
                  <p className="text-xs text-neutral-500">
                    {creator.starting_price ? `From R${creator.starting_price.toLocaleString()}` : ""}
                  </p>
                </div>
                {selectedCreators.includes(creator.id) && (
                  <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-neutral-100 z-30">
        <Button
          onClick={submitRequest}
          disabled={sending || !request.category || !request.service_area || !request.message || selectedCreators.length === 0}
          className="w-full h-14 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-medium text-base"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : sent ? (
            <CheckCircle2 className="w-4 h-4 mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {sent ? "Requests Sent!" : sending ? "Sending..." : `Send to ${selectedCreators.length} Creator${selectedCreators.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
}