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
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    if (action === "accept") {
      await base44.entities.ContactRequest.update(requestId, { status: "accepted" });
      
      // Notify client
      await base44.entities.Notification.create({
        recipient_email: req.sender_email,
        type: "request_accepted",
        title: "Request Accepted",
        message: `${req.creator_name || "A creator"} has accepted your request for ${req.category || "a shoot"}.`,
        link_url: createPageUrl("MyRequests"),
        related_id: requestId,
        sender_name: req.creator_name,
      });
      
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "accepted" } : r));
    } else if (action === "decline") {
      await base44.entities.ContactRequest.update(requestId, { status: "declined" });
      
      // Notify client
      await base44.entities.Notification.create({
        recipient_email: req.sender_email,
        type: "request_declined",
        title: "Request Update",
        message: `${req.creator_name || "A creator"} is unavailable for your request.`,
        link_url: createPageUrl("MyRequests"),
        related_id: requestId,
        sender_name: req.creator_name,
      });
      
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "declined" } : r));
    } else if (action === "message") {
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
    pending: { icon: Clock, color: "bg-blue-500 text-white", label: "New" },
    read: { icon: Clock, color: "bg-blue-500 text-white", label: "New" },
    messaged: { icon: MessageCircle, color: "bg-purple-500 text-white", label: "In Discussion" },
    accepted: { icon: CheckCircle2, color: "bg-green-500 text-white", label: "Booked" },
    declined: { icon: X, color: "bg-neutral-400 text-white", label: "Closed" },
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
            
            return (
              <div
                key={req.id}
                className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="p-4 bg-neutral-50 border-b border-neutral-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-neutral-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-neutral-900">
                          {isCreator ? req.sender_name : req.creator_name}
                        </h3>
                        <p className="text-xs text-neutral-500">
                          {req.created_date && format(new Date(req.created_date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${status.color} text-xs px-2.5 py-1 rounded-full font-medium`}>
                      {status.label}
                    </Badge>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Category & Location */}
                  <div className="flex flex-wrap gap-2">
                    {req.category && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-xs font-medium text-blue-700">{req.category}</span>
                      </div>
                    )}
                    {req.service_area && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                        <span className="text-xs font-medium text-neutral-700">{req.service_area}</span>
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  {req.preferred_date && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Clock className="w-4 h-4 text-neutral-400" />
                      <span>Preferred: {format(new Date(req.preferred_date), "MMMM d, yyyy")}</span>
                    </div>
                  )}

                  {/* Budget */}
                  {req.budget && (
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 bg-green-50 rounded-lg">
                        <span className="text-sm font-semibold text-green-700">
                          R{req.budget.toLocaleString()}
                        </span>
                        <span className="text-xs text-green-600 ml-1">budget</span>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <p className="text-sm text-neutral-700 leading-relaxed line-clamp-3">
                      {req.message}
                    </p>
                  </div>

                  {/* Actions */}
                  {isCreator ? (
                    <div className="pt-2">
                      {(req.status === "pending" || req.status === "read") ? (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleRequestAction(req.id, "message")}
                            className="flex-1 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium"
                          >
                            <MessageCircle className="w-4 h-4 mr-1.5" />
                            Message
                          </Button>
                          <Button
                            onClick={() => handleRequestAction(req.id, "accept")}
                            className="flex-1 h-10 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleRequestAction(req.id, "decline")}
                            variant="outline"
                            className="h-10 px-3 border-neutral-300 text-neutral-600 hover:bg-neutral-50 rounded-xl"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : req.status === "messaged" ? (
                        <Button
                          onClick={() => handleRequestAction(req.id, "message")}
                          variant="outline"
                          className="w-full h-10 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <MessageCircle className="w-4 h-4 mr-1.5" />
                          Continue Conversation
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="pt-2">
                      <Button
                        onClick={async () => {
                          const user = await base44.auth.me();
                          const existingConvos = await base44.entities.Conversation.filter({
                            creator_profile_id: req.creator_profile_id,
                            client_email: user.email,
                          });
                          
                          if (existingConvos.length > 0) {
                            window.location.href = createPageUrl("Conversation") + `?id=${existingConvos[0].id}`;
                          }
                        }}
                        variant="outline"
                        className="w-full h-10 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <MessageCircle className="w-4 h-4 mr-1.5" />
                        View Conversation
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}