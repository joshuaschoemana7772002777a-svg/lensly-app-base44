import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ArrowRight, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import CategoryCard from "../components/lensly/CategoryCard";
import CreatorCard from "../components/lensly/CreatorCard";

const CATEGORIES = ["Corporate", "Brand / Commercial", "Weddings", "Events", "Lifestyle", "Social Media Content"];

export default function Home() {
  const [featuredCreators, setFeaturedCreators] = useState([]);
  const [favouriteIds, setFavouriteIds] = useState(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const creators = await base44.entities.CreatorProfile.filter({ is_published: true }, "-created_date", 6);
    setFeaturedCreators(creators);
    const authed = await base44.auth.isAuthenticated();
    setIsAuthenticated(authed);
    if (authed) {
      const favs = await base44.entities.Favourite.list();
      setFavouriteIds(new Set(favs.map(f => f.creator_profile_id)));
    }
  };

  const toggleFavourite = async (creator) => {
    if (!isAuthenticated) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (favouriteIds.has(creator.id)) {
      const favs = await base44.entities.Favourite.filter({ creator_profile_id: creator.id });
      if (favs.length > 0) await base44.entities.Favourite.delete(favs[0].id);
      setFavouriteIds(prev => { const next = new Set(prev); next.delete(creator.id); return next; });
    } else {
      await base44.entities.Favourite.create({
        creator_profile_id: creator.id,
        creator_name: creator.display_name,
        creator_image: creator.profile_image,
      });
      setFavouriteIds(prev => new Set(prev).add(creator.id));
    }
  };

  const navigateToCategory = (category) => {
    return createPageUrl("Explore") + `?category=${encodeURIComponent(category)}`;
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
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <span className="text-neutral-600 font-medium text-sm tracking-wide">LENSLY</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 leading-tight">
              Find your perfect<br />
              <span className="text-blue-500">creative</span> match
            </h1>
            <p className="text-neutral-500 mt-3 text-sm max-w-xs leading-relaxed">
              Discover top photographers & videographers operating across South Africa
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-6"
          >
            <Link
              to={createPageUrl("Explore")}
              className="flex items-center gap-3 bg-white border border-neutral-200 rounded-2xl px-4 py-3.5 text-neutral-400 hover:border-blue-300 transition-all shadow-sm"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">Search photographers, videographers...</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Browse by Category</h2>
          <Link to={createPageUrl("Explore")} className="text-blue-500 text-xs font-medium flex items-center gap-1">
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

      {/* Featured Creators */}
      {featuredCreators.length > 0 && (
        <div className="px-5 pt-6 pb-24">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Featured Creators</h2>
            <Link to={createPageUrl("Explore")} className="text-blue-500 text-xs font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {featuredCreators.map((creator, i) => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                index={i}
                isFavourite={favouriteIds.has(creator.id)}
                onToggleFavourite={toggleFavourite}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}