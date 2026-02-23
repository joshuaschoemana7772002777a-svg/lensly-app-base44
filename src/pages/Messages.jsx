import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageCircle, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import moment from "moment";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
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

    let convos = [];
    if (isCreator) {
      convos = await base44.entities.Conversation.filter({ creator_profile_id: profiles[0].id });
    } else {
      convos = await base44.entities.Conversation.filter({ client_email: currentUser.email });
    }

    convos.sort((a, b) => new Date(b.last_message_at || b.created_date) - new Date(a.last_message_at || a.created_date));
    setConversations(convos);
    setLoading(false);
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
      <div className="px-5 pt-6 pb-4 border-b border-neutral-100">
        <h1 className="text-2xl font-bold text-neutral-900">Messages</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {userRole === "creator" ? "Respond to client inquiries" : "Follow up with creators"}
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-5">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
            <MessageCircle className="w-7 h-7 text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500 text-center mt-2 max-w-sm">
            {userRole === "creator" 
              ? "You don't have any inquiries yet. Make sure your profile is complete and visible on Discover."
              : "You don't have any conversations yet. Message a creator or send a request to get started."}
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
            const otherPersonImage = userRole === "creator" ? null : convo.creator_image;

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
                  <div className="w-12 h-12 rounded-full bg-neutral-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {otherPersonImage ? (
                      <img src={otherPersonImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <MessageCircle className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
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
    </div>
  );
}