import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, MessageCircle, CheckCircle, XCircle, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function Notifications({ inboxMode = false }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    const notifs = await base44.entities.Notification.filter(
      { recipient_email: currentUser.email },
      "-created_date",
      100
    );
    setNotifications(notifs);
    setLoading(false);
  };

  const markAsRead = async (notification) => {
    if (!notification.is_read) {
      await base44.entities.Notification.update(notification.id, { is_read: true });
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
    }
    if (notification.link_url) {
      window.location.href = notification.link_url;
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(
      unread.map(n => base44.entities.Notification.update(n.id, { is_read: true }))
    );
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const getIcon = (type) => {
    switch (type) {
      case "request_new":
        return { icon: FileText, color: "bg-blue-500" };
      case "request_accepted":
        return { icon: CheckCircle, color: "bg-green-500" };
      case "request_declined":
        return { icon: XCircle, color: "bg-neutral-400" };
      case "message_new":
        return { icon: MessageCircle, color: "bg-purple-500" };
      default:
        return { icon: Bell, color: "bg-neutral-400" };
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`${inboxMode ? "bg-white" : "min-h-screen bg-neutral-50 pb-24"}`}>
      {/* Header */}
      {!inboxMode && (
        <div className="bg-white border-b border-neutral-200 px-5 pt-6 pb-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-neutral-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-neutral-500 mt-0.5">
                  {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-500 font-medium hover:text-blue-600"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>
      )}
      
      {inboxMode && unreadCount > 0 && (
        <div className="px-5 pt-4 pb-2 flex justify-end">
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-500 font-medium hover:text-blue-600"
          >
            Mark all read
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="px-5 pt-4 space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-7 h-7 text-neutral-400" />
            </div>
            <h3 className="font-semibold text-neutral-700">No notifications yet</h3>
            <p className="text-sm text-neutral-500 mt-1">
              We'll notify you about requests and messages
            </p>
          </div>
        ) : (
          notifications.map((notif, i) => {
            const { icon: Icon, color } = getIcon(notif.type);
            return (
              <motion.button
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => markAsRead(notif)}
                className={`w-full text-left rounded-2xl border transition-all ${
                  notif.is_read
                    ? "bg-white border-neutral-200"
                    : "bg-blue-50 border-blue-200 shadow-sm"
                }`}
              >
                <div className="p-4 flex gap-3">
                  <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`text-sm font-semibold ${notif.is_read ? "text-neutral-700" : "text-neutral-900"}`}>
                        {notif.title}
                      </h3>
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className={`text-sm leading-relaxed ${notif.is_read ? "text-neutral-500" : "text-neutral-700"}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-neutral-400 mt-2">
                      {format(new Date(notif.created_date), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}