import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import CategoryCard from "../components/lensly/CategoryCard";
import RoleSelectionModal from "../components/lensly/RoleSelectionModal";

const CATEGORIES = ["Corporate", "Brand / Commercial", "Weddings", "Events", "Lifestyle", "Social Media Content"];

export default function Home() {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    checkRoleSelectionParam();
  }, []);

  const checkAuth = async () => {
    const authed = await base44.auth.isAuthenticated();
    setIsAuthenticated(authed);
  };

  const checkRoleSelectionParam = async () => {
    const params = new URLSearchParams(window.location.search);
    const selectRole = params.get("select_role");
    
    if (selectRole) {
      const authed = await base44.auth.isAuthenticated();
      if (authed) {
        const user = await base44.auth.me();
        if (!user.account_type) {
          setShowRoleModal(true);
        }
      }
    }
  };

  const navigateToCategory = (category) => {
    return createPageUrl("Discover") + `?category=${encodeURIComponent(category)}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-white px-5 pt-14 pb-10">
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699b110a371758e340a213c3/9c7cb5e90_1-014a4b80.png" 
                alt="Lensly Logo" 
                className="h-16"
              />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 leading-tight">
              Find photographers and videographers near you.
            </h1>
            <p className="text-neutral-500 mt-3 text-sm max-w-md leading-relaxed">
              Browse by shoot type and operating area, view portfolios, and contact creators when you're ready.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-6 flex gap-3"
          >
            <Link to={createPageUrl("Discover")} className="flex-1">
              <Button className="w-full h-14 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base shadow-lg">
                Discover creators
              </Button>
            </Link>
            {!isAuthenticated && (
              <Button
                onClick={() => setShowRoleModal(true)}
                variant="outline"
                className="h-14 px-6 rounded-2xl border-2 border-blue-500 text-blue-500 hover:bg-blue-50 font-semibold text-base"
              >
                Get Started
              </Button>
            )}
          </motion.div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-5 pt-8 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Browse by Category</h2>
          <Link to={createPageUrl("Discover")} className="text-blue-500 text-xs font-medium flex items-center gap-1">
            See all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((cat, i) => (
            <Link key={cat} to={navigateToCategory(cat)}>
              <CategoryCard category={cat} onClick={() => {}} index={i} />
            </Link>
          ))}
        </div>
      </div>

      <RoleSelectionModal open={showRoleModal} onClose={() => setShowRoleModal(false)} />
    </div>
  );
}