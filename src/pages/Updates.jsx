import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, Clock, CheckCircle2, MessageCircle, User, X, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";
import { createNotification } from "../components/lensly/NotificationService";
import { motion } from "framer-motion";

export default function Updates() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    loadUpdates();
  }, []);

  const loadUpdates = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    const currentUser = await base44.auth.me();
    setUser(currentUser);
    
    const profiles = await base44.entities.CreatorProfile.filter({ created_by: currentUser.email });
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
        { sender_email: currentUser.email },
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
      
      // Create conversation
      const profiles = await base44.entities.CreatorProfile.filter({ created_by: user.email });
      const existingConvos = await base44.entities.Conversation.filter({
        creator_profile_id: profiles[0].id,
        client_email: req.sender_email,
      });
      
      if (existingConvos.length === 0) {
        await base44.entities.Conversation.create({
          creator_profile_id: profiles[0].id,
          creator_name: profiles[0].display_name,
          creator_image: profiles[0].profile_photo,
          client_email: req.sender_email,
          client_name: req.sender_name,
          contact_request_id: requestId,
          last_message_at: new Date().toISOString(),
        });
      }
      
      await createNotification({
        recipientEmail: req.sender_email,
        type: "request_accepted",
        title: "Request Accepted",
        message: `${req.creator_name || "A creator"} has accepted your request for ${req.category || "a shoot"}.`,
        linkUrl: createPageUrl("Messages"),
        relatedId: requestId,
        senderName: req.creator_name,
      });
      
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "accepted" } : r));
    } else if (action === "decline") {
      await base44.entities.ContactRequest.update(requestId, { status: "declined" });
      
      await createNotification({
        recipientEmail: req.sender_email,
        type: "request_declined",
        title: "Request Update",
        message: `${req.creator_name || "A creator"} is unavailable for your request.`,
        linkUrl: createPageUrl("Updates"),
        relatedId: requestId,
        senderName: req.creator_name,
      });
      
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "declined" } : r));
    } else if (action === "message") {
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
          creator_image: profiles[0].profile_photo,
          client_email: req.sender_email,
          client_name: req.sender_name,
          contact_request_id: requestId,
          last_message_at: new Date().toISOString(),
        });
        convoId = newConvo.id;
      }
      
      await base44.entities.ContactRequest.update(requestId, { status: "accepted" });
      window.location.href = createPageUrl("Conversation") + `?id=${convoId}`;
    }
  };

  const statusConfig = {
    pending: { icon: Clock, color: "bg-yellow-500 text-white", label: "Pending" },
    read: { icon: Clock, color: "bg-yellow-500 text-white", label: "Pending" },
    accepted: { icon: CheckCircle2, color: "bg-blue-500 text-white", label: "Accepted" },
    declined: { icon: X, color: "bg-red-500 text-white", label: "Rejected" },
    messaged: { icon: MessageCircle, color: "bg-blue-500 text-white", label: "Accepted" },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pb-20">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-neutral-100">
        <div className="px-5 pt-6 pb-4">
          <h1 className="text-2xl font-bold text-neutral-900">Updates</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {isCreator ? "New requests and notifications" : "Request status and updates"}
          </p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <Mail className="w-7 h-7 text-neutral-400" />
            </div>
            <h3 className="font-medium text-neutral-700">No updates yet</h3>
            <p className="text-sm text-neutral-400 mt-1 text-center max-w-sm">
              {isCreator 
                ? "Client requests will appear here" 
                : "Your request updates will appear here"}
            </p>
          </div>
        ) : (
          requests.map((req, i) => {
            const status = statusConfig[req.status || "pending"];
            const StatusIcon = status.icon;
            
            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden"
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
                    <Badge className={`${status.color} text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1`}>
                      <StatusIcon className="w-3 h-3" />
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
                    <p className="text-sm text-neutral-700 leading-relaxed">
                      {req.message}
                    </p>
                  </div>

                  {/* Actions */}
                  {isCreator ? (
                    <div className="pt-2">
                      {(req.status === "pending" || req.status === "read") ? (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleRequestAction(req.id, "accept")}
                            className="flex-1 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleRequestAction(req.id, "decline")}
                            variant="outline"
                            className="h-10 px-4 border-neutral-300 text-neutral-600 hover:bg-neutral-50 rounded-xl"
                          >
                            Decline
                          </Button>
                        </div>
                      ) : req.status === "accepted" || req.status === "messaged" ? (
                        <Button
                          onClick={() => handleRequestAction(req.id, "message")}
                          variant="outline"
                          className="w-full h-10 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <MessageCircle className="w-4 h-4 mr-1.5" />
                          View in Messages
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="pt-2">
                      {(req.status === "accepted" || req.status === "messaged") && (
                        <Button
                          onClick={async () => {
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
                          View in Messages
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}