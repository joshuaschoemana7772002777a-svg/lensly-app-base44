import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, Search, Heart, Camera, Mail, Settings } from "lucide-react";
import RoleSelectionModal from "./components/lensly/RoleSelectionModal";

const NAV_ITEMS = [
  { name: "Home", icon: Home, page: "Home" },
  { name: "Discover", icon: Search, page: "Discover" },
  { name: "Messages", icon: Mail, page: "Messages" },
  { name: "Favourites", icon: Heart, page: "Favourites" },
  { name: "Settings", icon: Settings, page: "Settings" },
];

export default function Layout({ children, currentPageName }) {
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    setCheckingOnboarding(false);
    checkRoleSelection();
  }, [currentPageName]);

  const checkRoleSelection = async () => {
    const params = new URLSearchParams(window.location.search);
    const nextAction = params.get("next");
    
    if (nextAction === "creator") {
      const authed = await base44.auth.isAuthenticated();
      if (authed) {
        const user = await base44.auth.me();
        if (!user.account_type) {
          setShowRoleModal(true);
        }
      }
    }
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
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                    isActive ? "text-blue-500" : "text-neutral-400"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : ""}`} />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <RoleSelectionModal open={showRoleModal} onClose={() => setShowRoleModal(false)} />
    </div>
  );
}