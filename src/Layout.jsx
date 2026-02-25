import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, Search, Heart, Camera, Mail, Settings, Bell } from "lucide-react";
import RoleSelectionModal from "./components/lensly/RoleSelectionModal";
import FirstOpenConsentBanner from "./components/lensly/FirstOpenConsentBanner";
import RoleSelectionWrapper from "./components/lensly/RoleSelectionWrapper";

const NAV_ITEMS = [
  { name: "Home", icon: Home, page: "Home" },
  { name: "Discover", icon: Search, page: "Discover" },
  { name: "Messages", icon: Mail, page: "Messages", badge: "combined" },
  { name: "Settings", icon: Settings, page: "Settings" },
];

export default function Layout({ children, currentPageName }) {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    loadUnreadCounts();
  }, [currentPageName]);

  const loadUnreadCounts = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) return;
    const user = await base44.auth.me();
    
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
    setUnreadMessages(unreadMsgCount);
    
    // Count pending requests
    let requests = [];
    if (isCreator) {
      requests = await base44.entities.ContactRequest.filter({
        creator_profile_id: profiles[0].id,
        status: { $in: ["pending", "read"] }
      });
    } else {
      requests = await base44.entities.ContactRequest.filter({
        sender_email: user.email,
      });
    }
    setPendingRequests(requests.length);
    
    // Combined badge = unread messages + pending requests
    const combinedBadge = unreadMsgCount + requests.length;
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

      {/* Footer - show on all pages */}
      {!hideNav && (
        <footer className="bg-neutral-50 border-t border-neutral-200 py-8 px-5 pb-28">
          <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-500">
            <span>© 2026 Lensly</span>
            <span>•</span>
            <a href={createPageUrl("Terms")} className="hover:text-neutral-900 transition-colors">
              Terms & Conditions
            </a>
            <span>•</span>
            <a href={createPageUrl("Privacy")} className="hover:text-neutral-900 transition-colors">
              Privacy Policy
            </a>
            <span>•</span>
            <a href={createPageUrl("CommunityGuidelines")} className="hover:text-neutral-900 transition-colors">
              Community Guidelines
            </a>
          </div>
        </footer>
      )}

      <FirstOpenConsentBanner />
      <RoleSelectionWrapper />

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-neutral-100 safe-area-bottom">
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = currentPageName === item.page;
              const Icon = item.icon;
              
              let badgeCount = 0;
              if (item.badge === "combined") badgeCount = unreadMessages + pendingRequests;
              
              const showBadge = badgeCount > 0;
              
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
                        <span className="text-[9px] font-bold text-white">{badgeCount > 9 ? "9+" : badgeCount}</span>
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