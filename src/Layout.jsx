import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, Search, Heart, Camera, Mail, Settings, Bell } from "lucide-react";
import RoleSelectionModal from "./components/lensly/RoleSelectionModal";

const NAV_ITEMS = [
  { name: "Home", icon: Home, page: "Home" },
  { name: "Discover", icon: Search, page: "Discover" },
  { name: "Messages", icon: Mail, page: "Messages", badge: true },
  { name: "Settings", icon: Settings, page: "Settings" },
];

export default function Layout({ children, currentPageName }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
  }, [currentPageName]);

  const loadUnreadCount = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) return;
    const user = await base44.auth.me();
    
    // Count unread notifications
    const unreadNotifs = await base44.entities.Notification.filter({
      recipient_email: user.email,
      is_read: false,
    });
    
    // Count unread messages
    const profiles = await base44.entities.CreatorProfile.filter({ created_by: user.email });
    const isCreator = profiles.length > 0 && profiles[0].is_published;
    
    let convos = [];
    if (isCreator) {
      convos = await base44.entities.Conversation.filter({ creator_profile_id: profiles[0].id });
    } else {
      convos = await base44.entities.Conversation.filter({ client_email: user.email });
    }
    const unreadMsgCount = convos.reduce((sum, c) => sum + (isCreator ? c.unread_count_creator : c.unread_count_client), 0);
    
    setUnreadCount(unreadNotifs.length + unreadMsgCount);
  };

  const hideNav = currentPageName === "CreatorProfile" || currentPageName === "EditProfile" || currentPageName === "Conversation";



  return (
    <div className="min-h-screen bg-white">
      <style>{`
        :root {
          --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        body {
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
          background: white;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <main>{children}</main>

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-neutral-100 safe-area-bottom">
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = currentPageName === item.page;
              const Icon = item.icon;
              const showBadge = item.badge && unreadCount > 0;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors relative ${
                    isActive ? "text-blue-500" : "text-neutral-400"
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : ""}`} />
                    {showBadge && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
        )}
        </div>
        );
        }