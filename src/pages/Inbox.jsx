import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle, Bell } from "lucide-react";
import Messages from "./Messages";
import Notifications from "./Notifications";

export default function Inbox() {
  const [activeTab, setActiveTab] = useState("messages");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    loadCounts();
  }, [activeTab]);

  const loadCounts = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) return;

    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const profiles = await base44.entities.CreatorProfile.filter({ created_by: currentUser.email });
    const isCreator = profiles.length > 0 && profiles[0].is_published;
    setUserRole(isCreator ? "creator" : "client");

    // Count unread messages
    let convos = [];
    if (isCreator) {
      convos = await base44.entities.Conversation.filter({ creator_profile_id: profiles[0].id });
    } else {
      convos = await base44.entities.Conversation.filter({ client_email: currentUser.email });
    }
    const unreadMsgCount = convos.reduce((sum, c) => sum + (isCreator ? c.unread_count_creator : c.unread_count_client), 0);
    setUnreadMessages(unreadMsgCount);

    // Count unread notifications
    const unreadNotifs = await base44.entities.Notification.filter({
      recipient_email: currentUser.email,
      is_read: false,
    });
    setUnreadNotifications(unreadNotifs.length);
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-neutral-100">
        <div className="flex">
          <button
            onClick={() => setActiveTab("messages")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors relative ${
              activeTab === "messages" ? "text-blue-500" : "text-neutral-400"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Messages</span>
            {unreadMessages > 0 && (
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{unreadMessages > 9 ? "9+" : unreadMessages}</span>
              </div>
            )}
            {activeTab === "messages" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors relative ${
              activeTab === "notifications" ? "text-blue-500" : "text-neutral-400"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
            {unreadNotifications > 0 && (
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>
              </div>
            )}
            {activeTab === "notifications" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === "messages" ? <Messages inboxMode={true} /> : <Notifications inboxMode={true} />}
      </div>
    </div>
  );
}