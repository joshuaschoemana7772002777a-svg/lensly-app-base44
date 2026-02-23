import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, Clock, CheckCircle2, MessageCircle, User, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isCreator, setIsCreator] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const authed = await base44.auth.isAuthenticated();
    setIsAuthenticated(authed);
    if (!authed) { setLoading(false); return; }
    const user = await base44.auth.me();
    setUserEmail(user.email);
    
    const profiles = await base44.entities.CreatorProfile.filter({ created_by: user.email });
    const creatorProfile = profiles.length > 0 && profiles[0].is_published;
    setIsCreator(!!creatorProfile);
    
    let reqs = [];
    if (creatorProfile) {
      reqs = await base44.entities.ContactRequest.filter(
        { creator_profile_id: profiles[0].id },
        "-created_date"
      );
    } else {
      reqs = await base44.entities.ContactRequest.filter(
        { sender_email: user.email },
        "-created_date"
      );
    }
    setRequests(reqs);
    setLoading(false);
  };

  const handleRequestAction = async (requestId, action) => {
    if (action === "accept") {
      await base44.entities.ContactRequest.update(requestId, { status: "accepted" });
    } else if (action === "decline") {
      await base44.entities.ContactRequest.update(requestId, { status: "declined" });
    } else if (action === "message") {
      const req = requests.find(r => r.id === requestId);
      const user = await base44.auth.me();
      const profiles = await base44.entities.CreatorProfile.filter({ created_by: user.email });
      
      const existingConvos = await base44.entities.Conversation.filter({
        creator_profile_id: profiles[0].id,
        client_email: req.sender_email,
      });
      
      let convoId;
      if (existingConvos.length > 0) {
        convoId = existingConvos[0].id;
      } else {
        const newConvo = await base44.entities.Conversation.create({
          creator_profile_id: profiles[0].id,
          creator_name: profiles[0].display_name,
          creator_image: profiles[0].profile_image,
          client_email: req.sender_email,
          client_name: req.sender_name,
          contact_request_id: requestId,
          last_message_at: new Date().toISOString(),
        });
        convoId = newConvo.id;
      }
      
      await base44.entities.ContactRequest.update(requestId, { status: "messaged" });
      window.location.href = createPageUrl("Conversation") + `?id=${convoId}`;
      return;
    }
    
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: action === "accept" ? "accepted" : "declined" } : r));
    setSelectedRequest(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-5">
        <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-neutral-300" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-800">Sign in to view requests</h2>
        <button
          onClick={() => base44.auth.redirectToLogin(window.location.href)}
          className="mt-6 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-sm font-medium"
        >
          Sign In
        </button>
      </div>
    );
  }

  const statusConfig = {
    pending: { icon: Clock, color: "bg-blue-100 text-blue-600", label: "New" },
    read: { icon: CheckCircle2, color: "bg-neutral-100 text-neutral-600", label: "Read" },
    accepted: { icon: CheckCircle2, color: "bg-green-100 text-green-700", label: "Accepted" },
    declined: { icon: X, color: "bg-red-100 text-red-600", label: "Declined" },
    messaged: { icon: MessageCircle, color: "bg-purple-100 text-purple-700", label: "Messaged" },
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">
              {isCreator ? "Incoming Requests" : "My Requests"}
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              {isCreator ? "Client inquiries and bookings" : "Requests you've sent to creators"}
            </p>
          </div>
          {!isCreator && (
            <Link to={createPageUrl("CreateRequest")}>
              <Button className="h-9 rounded-full bg-blue-500 hover:bg-blue-600">
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="px-5 space-y-3">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-neutral-200 animate-pulse" />
          ))
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-neutral-300" />
            </div>
            <h3 className="font-medium text-neutral-700">No requests yet</h3>
            <p className="text-sm text-neutral-400 mt-1">
              Requests from clients will appear here
            </p>
          </div>
        ) : (
          requests.map((req) => {
            const status = statusConfig[req.status || "pending"];
            const StatusIcon = status.icon;
            const isExpanded = selectedRequest === req.id;
            
            return (
              <div
                key={req.id}
                className={`rounded-2xl bg-white border transition-all ${
                  req.status === "pending" ? "border-blue-200 shadow-sm" : "border-neutral-100"
                }`}
              >
                <button
                  onClick={() => setSelectedRequest(isExpanded ? null : req.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-sm font-semibold text-neutral-800 truncate">
                          {isCreator ? req.sender_name : req.creator_name}
                        </span>
                        <Badge className={`${status.color} text-[10px] px-2`}>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                        {req.category && <span>{req.category}</span>}
                        {req.category && req.service_area && <span>·</span>}
                        {req.service_area && <span>{req.service_area}</span>}
                        {req.budget && <span>· R{req.budget.toLocaleString()}</span>}
                      </div>
                      <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{req.message}</p>
                      {req.preferred_date && (
                        <div className="text-xs text-neutral-400 mt-2">
                          Preferred: {format(new Date(req.preferred_date), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                  </div>
                  {req.created_date && (
                    <div className="text-[10px] text-neutral-400 mt-2">
                      {format(new Date(req.created_date), "MMM d, yyyy 'at' HH:mm")}
                    </div>
                  )}
                </button>
                
                {isExpanded && isCreator && (req.status === "pending" || req.status === "read") && (
                  <div className="px-4 pb-4 flex gap-2">
                    <Button
                      onClick={() => handleRequestAction(req.id, "accept")}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleRequestAction(req.id, "message")}
                      variant="outline"
                      className="flex-1 rounded-xl"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Message
                    </Button>
                    <Button
                      onClick={() => handleRequestAction(req.id, "decline")}
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}