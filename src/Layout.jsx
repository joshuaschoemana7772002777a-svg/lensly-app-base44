import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, Search, Heart, Camera, Mail } from "lucide-react";

const NAV_ITEMS = [
  { name: "Home", icon: Home, page: "Home" },
  { name: "Discover", icon: Search, page: "Discover" },
  { name: "Favourites", icon: Heart, page: "Favourites" },
  { name: "Profile", icon: Camera, page: "EditProfile" },
  { name: "Requests", icon: Mail, page: "MyRequests" },
];

export default function Layout({ children, currentPageName }) {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    checkOnboarding();
  }, [currentPageName]);

  const checkOnboarding = async () => {
    const authed = await base44.auth.isAuthenticated();
    if (!authed || currentPageName === "EditProfile") {
      setCheckingOnboarding(false);
      return;
    }
    const user = await base44.auth.me();
    const profiles = await base44.entities.CreatorProfile.filter({ created_by: user.email });
    const hasPublishedProfile = profiles.length > 0 && profiles[0].is_published;
    
    if (!hasPublishedProfile && currentPageName !== "EditProfile") {
      window.location.href = createPageUrl("EditProfile");
      return;
    }
    setCheckingOnboarding(false);
  };

  const hideNav = currentPageName === "CreatorProfile";

  if (checkingOnboarding) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-blue-500 animate-spin" />
      </div>
    );
  }

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
    </div>
  );
}