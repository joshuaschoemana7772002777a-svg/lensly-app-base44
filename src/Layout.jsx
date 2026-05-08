import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, Search, Heart, Camera, Mail, Settings, Bell } from "lucide-react";
import FirstOpenConsentBanner from "./components/lensly/FirstOpenConsentBanner";
import { useTabHistory, getTabForPath } from "@/lib/TabHistoryContext";

const NAV_ITEMS = [
  { name: "Home", icon: Home, page: "Home" },
  { name: "Discover", icon: Search, page: "Discover" },
  { name: "Messages", icon: Mail, page: "Messages", badge: "combined" },
  { name: "Settings", icon: Settings, page: "Settings" },
];

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateTabPath, getTabPath, saveScroll, getScroll } = useTabHistory();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  // Track current path per tab
  useEffect(() => {
    const tab = getTabForPath(location.pathname);
    if (tab) updateTabPath(tab, location.pathname + location.search);
  }, [location.pathname, location.search]);

  // Save scroll position on unmount / path change
  useEffect(() => {
    const scrollEl = document.getElementById("root") || window;
    const getY = () => (scrollEl === window ? window.scrollY : scrollEl.scrollTop);

    const saveCurrent = () => {
      saveScroll(location.pathname + location.search, getY());
    };

    return () => { saveCurrent(); };
  }, [location.pathname, location.search]);

  // Restore scroll position when navigating to a path
  useEffect(() => {
    const key = location.pathname + location.search;
    const y = getScroll(key);
    const scrollEl = document.getElementById("root") || window;
    requestAnimationFrame(() => {
      if (scrollEl === window) window.scrollTo(0, y);
      else scrollEl.scrollTop = y;
    });
  }, [location.pathname, location.search]);

  useEffect(() => {
    loadUnreadCounts();
  }, [currentPageName]);

  const loadUnreadCounts = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed) return;
    const user = await base44.auth.me();

    // Fetch creator profile first to determine role
    const profiles = await base44.entities.CreatorProfile.filter({ created_by: user.email });
    const isCreator = profiles.length > 0 && profiles[0].is_published;
    const profileId = isCreator ? profiles[0].id : null;

    // Parallelise conversations + requests
    const [convos, requests] = await Promise.all([
      isCreator
        ? base44.entities.Conversation.filter({ creator_profile_id: profileId })
        : base44.entities.Conversation.filter({ client_email: user.email }),
      isCreator
        ? base44.entities.ContactRequest.filter({ creator_profile_id: profileId, status: { $in: ["pending", "read"] } })
        : base44.entities.ContactRequest.filter({ sender_email: user.email }),
    ]);

    const unreadMsgCount = convos.reduce((sum, c) => sum + (isCreator ? c.unread_count_creator : c.unread_count_client), 0);
    setUnreadMessages(unreadMsgCount);
    setPendingRequests(requests.length);
  };

  const hideNav = ["/CreatorProfile", "/EditProfile", "/Conversation", "/Login"].some(p => location.pathname.startsWith(p));



  return (
    <div className="min-h-screen bg-white dark:bg-[hsl(222,18%,10%)]">
      <style>{`
        :root {
          --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          --safe-top: env(safe-area-inset-top, 0px);
          --safe-bottom: env(safe-area-inset-bottom, 0px);
          --safe-left: env(safe-area-inset-left, 0px);
          --safe-right: env(safe-area-inset-right, 0px);
        }
        html, body {
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
          background: white;
          /* Prevent elastic overscroll / bounce on iOS */
          overscroll-behavior: none;
          overscroll-behavior-y: none;
          height: 100%;
        }
        #root {
          height: 100%;
          overflow-y: auto;
          overscroll-behavior-y: none;
          /* Safe area padding at document root */
          padding-top: var(--safe-top);
          padding-left: var(--safe-left);
          padding-right: var(--safe-right);
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

        /* Prevent text selection + long-press callout on all non-input elements */
        *:not(input):not(textarea):not([contenteditable]) {
          -webkit-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
        }
        input, textarea, [contenteditable] {
          -webkit-user-select: text;
          user-select: text;
          -webkit-touch-callout: default;
        }

        /* Remove tap highlight on buttons and links */
        button, a, [role="button"] {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        /* Prevent overscroll in scrollable sub-containers */
        .overflow-y-auto, .overflow-auto, .overflow-y-scroll {
          overscroll-behavior-y: contain;
        }

        /* Lock body scroll when modals/sheets are open (add class via JS) */
        body.modal-open {
          overflow: hidden;
          position: fixed;
          width: 100%;
        }
      `}</style>
      
      <main>{children}</main>

      {/* Footer - show on all pages */}
      {!hideNav && (
        <footer className="bg-neutral-50 dark:bg-[hsl(222,18%,8%)] border-t border-neutral-200 dark:border-neutral-800 py-8 px-5 pb-28">
          <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
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

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[hsl(222,18%,10%)]/90 backdrop-blur-xl border-t border-neutral-100 dark:border-neutral-800" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
            {NAV_ITEMS.map((item) => {
              const activeTab = getTabForPath(location.pathname);
              const isActive = activeTab === item.page;
              const Icon = item.icon;
              
              let badgeCount = 0;
              if (item.badge === "combined") badgeCount = unreadMessages + pendingRequests;
              
              const showBadge = badgeCount > 0;
              
              const tabRootUrl = createPageUrl(item.page);
              return (
                <button
                  key={item.page}
                  onClick={() => {
                    if (isActive) {
                      // Re-tapping active tab → scroll to top and reset to tab root
                      navigate(tabRootUrl, { replace: true });
                      const scrollEl = document.getElementById("root") || window;
                      if (scrollEl === window) window.scrollTo({ top: 0, behavior: "smooth" });
                      else scrollEl.scrollTo({ top: 0, behavior: "smooth" });
                    } else {
                      // Switch to last remembered path for this tab
                      const lastPath = getTabPath(item.page);
                      navigate(lastPath);
                    }
                  }}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors relative ${
                    isActive ? "text-blue-500" : "text-neutral-400 dark:text-neutral-500"
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
                </button>
              );
            })}
          </div>
        </nav>
        )}
        </div>
        );
        }