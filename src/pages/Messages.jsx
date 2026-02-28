import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageCircle, ChevronRight, User, Clock, CheckCircle2, X } from "lucide-react";
import { motion } from "framer-motion";
import moment from "moment";
import { format } from "date-fns";
import ProfileAvatar from "../components/lensly/ProfileAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Messages() {
  const [activeTab, setActiveTab] = useState("messages");
  const [conversations, setConversations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [clientPhotos, setClientPhotos] = useState({});

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

    const profiles = await base44.entities.CreatorProfile.filter({ created_by: currentUser.email });
    const isCreator = profiles.length > 0 && profiles[0].is_published;
    setUserRole(isCreator ? "creator" : "client");

    // Load conversations
    let convos = [];
    if (isCreator) {
      convos = await base44.entities.Conversation.filter({ creator_profile_id: profiles[0].id });
    } else {
      convos = await base44.entities.Conversation.filter({ client_email: currentUser.email });
    }
    convos.sort((a, b) => new Date(b.last_message_at || b.created_date) - new Date(a.last_message_at || a.created_date));
    
    // Load client profile photos if user is creator
    if (isCreator) {
      const clientEmails = [...new Set(convos.map(c => c.client_email))];
      const users = await base44.entities.User.filter({ 
        email: { $in: clientEmails }
      });
      const photoMap = {};
      users.forEach(u => {
        if (u.profile_photo_url) {
          photoMap[u.email] = u.profile_photo_url;
        }
      });
      setClientPhotos(photoMap);
    }
    
    setConversations(convos);

    // Load requests
    let requestsList = [];
    if (isCreator) {
      requestsList = await base44.entities.ContactRequest.filter({
        creator_profile_id: profiles[0].id,
      }, "-created_date");
    } else {
      requestsList = await base44.entities.ContactRequest.filter({
        sender_email: currentUser.email,
      }, "-created_date");
    }
    setRequests(requestsList);

    // Default to Updates tab if there are pending requests
    const pendingCount = requestsList.filter(r => r.status === "pending" || r.status === "read").length;
    if (pendingCount > 0) {
      setActiveTab("updates");
    }

    setLoading(false);
  };

  const handleRequestAction = async (requestId, action) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    if (action === "accept") {
      // Accept request
      await base44.entities.ContactRequest.update(requestId, { status: "accepted" });

      // Create conversation if it doesn't exist
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

      window.location.href = createPageUrl("Conversation") + `?id=${convoId}`;
    } else if (action === "decline") {
      // Decline request
      await base44.entities.ContactRequest.update(requestId, { status: "declined" });
      await loadData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pb-20">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  // Creators see only pending/read; clients see all their sent requests (with status)
  const pendingRequests = userRole === "creator"
    ? requests.filter(r => r.status === "pending" || r.status === "read")
    : requests;
  const pendingCount = requests.filter(r => r.status === "pending" || r.status === "read").length;

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="sticky top-0 z-20 bg-white border-b border-neutral-100">
        <div className="px-5 pt-6 pb-3">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Messages</h1>
          
          {/* Sub-tabs */}
          <div className="flex gap-1 bg-neutral-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("messages")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === "messages"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab("updates")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all relative ${
                activeTab === "updates"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Updates
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Messages Tab */}
      {activeTab === "messages" && (
        <>
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-5">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <MessageCircle className="w-7 h-7 text-neutral-400" />
              </div>
              <h3 className="font-medium text-neutral-700">No conversations yet</h3>
              <p className="text-sm text-neutral-500 text-center mt-2 max-w-sm">
                Conversations appear here when you accept a request.
              </p>
              {userRole === "client" && (
                <Link
                  to={createPageUrl("Discover")}
                  className="mt-6 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-sm font-medium"
                >
                  Browse Creators
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {conversations.map((convo, i) => {
                const unreadCount = userRole === "creator" ? convo.unread_count_creator : convo.unread_count_client;
                const otherPersonName = userRole === "creator" ? convo.client_name : convo.creator_name;
                const otherPersonImage = userRole === "creator" ? clientPhotos[convo.client_email] : convo.creator_image;

                return (
                  <motion.div
                    key={convo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={createPageUrl("Conversation") + `?id=${convo.id}`}
                      className="flex items-center gap-3 p-4 hover:bg-neutral-50 transition"
                    >
                      <ProfileAvatar 
                        photoUrl={otherPersonImage}
                        displayName={otherPersonName}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-neutral-900 truncate">
                            {otherPersonName || "User"}
                          </h3>
                          <span className="text-xs text-neutral-400 ml-2 flex-shrink-0">
                            {convo.last_message_at ? moment(convo.last_message_at).fromNow() : moment(convo.created_date).fromNow()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-neutral-600 truncate">
                            {convo.last_message || "Start a conversation"}
                          </p>
                          {unreadCount > 0 && (
                            <div className="ml-2 flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium">
                              {unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-neutral-300 flex-shrink-0" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Updates Tab */}
      {activeTab === "updates" && (
        <>
          {pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-5">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-7 h-7 text-neutral-400" />
              </div>
              <h3 className="font-medium text-neutral-700">All caught up</h3>
              <p className="text-sm text-neutral-500 text-center mt-2 max-w-sm">
                {userRole === "creator" ? "New booking requests will appear here." : "Your sent requests will appear here."}
              </p>
            </div>
          ) : (
            <div className="px-5 pt-4 space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-4 bg-neutral-50 border-b border-neutral-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ProfileAvatar 
                          photoUrl={null}
                          displayName={userRole === "creator" ? req.sender_name : req.creator_name}
                          size="sm"
                        />
                        <div>
                          <h3 className="text-sm font-semibold text-neutral-900">
                            {userRole === "creator" ? req.sender_name : req.creator_name}
                          </h3>
                          <p className="text-xs text-neutral-500">
                            {req.created_date && format(new Date(req.created_date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <Badge className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        req.status === "accepted" ? "bg-green-100 text-green-700" :
                        req.status === "declined" ? "bg-neutral-100 text-neutral-500" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {req.status === "accepted" ? "Accepted" : req.status === "declined" ? "Declined" : "Pending"}
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

                    {/* Message Preview */}
                    <div>
                      <p className="text-sm text-neutral-700 leading-relaxed line-clamp-2">
                        {req.message}
                      </p>
                    </div>

                    {/* Actions for Creator */}
                    {userRole === "creator" && (
                      <div className="pt-2 flex gap-2">
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
                          <X className="w-4 h-4 mr-1.5" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}