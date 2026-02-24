import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, Heart } from "lucide-react";
import CreatorCard from "../components/lensly/CreatorCard";
import AreaFilterChips from "../components/lensly/AreaFilterChips";
import CategoryFilterChips from "../components/lensly/CategoryFilterChips";

export default function Discover() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [favouriteIds, setFavouriteIds] = useState(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [savedMode, setSavedMode] = useState(false);

  // Read URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    const area = params.get("area");
    if (cat) setSelectedCategory(cat);
    if (area) setSelectedArea(area);
  }, []);

  useEffect(() => {
    loadCreators();
    loadAuth();
  }, []);

  const loadAuth = async () => {
    try {
      const authed = await base44.auth.isAuthenticated();
      setIsAuthenticated(authed);
      if (authed) {
        const favs = await base44.entities.Favourite.list();
        setFavouriteIds(new Set(favs.map(f => f.creator_profile_id)));
      }
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const loadCreators = async () => {
    setLoading(true);
    const data = await base44.entities.CreatorProfile.filter({ 
      is_published: true,
      is_hidden: false 
    }, "-created_date", 100);
    
    // Filter to only show complete profiles
    const complete = data.filter(creator => {
      const hasPortfolio = creator.portfolio_items?.length > 0;
      const hasCategories = creator.categories?.length > 0;
      const hasAreas = creator.service_areas?.length > 0;
      return hasPortfolio && hasCategories && hasAreas;
    });

    // Load reviews for all creators
    const allReviews = await base44.entities.Review.list("-created_date", 1000);
    const reviewsByCreator = {};
    allReviews.forEach(review => {
      if (!reviewsByCreator[review.creator_profile_id]) {
        reviewsByCreator[review.creator_profile_id] = [];
      }
      reviewsByCreator[review.creator_profile_id].push(review);
    });

    // Attach review stats to creators
    complete.forEach(creator => {
      const reviews = reviewsByCreator[creator.id] || [];
      creator.reviewCount = reviews.length;
      creator.averageRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
    });
    
    // Sort by price, then creation date
    const sorted = complete.sort((a, b) => {
      if (a.starting_price && b.starting_price) {
        if (a.starting_price !== b.starting_price) {
          return a.starting_price - b.starting_price;
        }
      }
      return new Date(a.created_date) - new Date(b.created_date);
    });
    
    setCreators(sorted);
    setLoading(false);
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

  const filtered = creators.filter((c) => {
    if (savedMode && !favouriteIds.has(c.id)) return false;
    if (selectedArea && !(c.service_areas || []).includes(selectedArea)) return false;
    if (selectedCategory && !(c.categories || []).includes(selectedCategory)) return false;
    return true;
  });

  const activeFilters = [selectedCategory, selectedArea].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-neutral-100">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-neutral-900">Discover</h1>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  base44.auth.redirectToLogin(window.location.href);
                  return;
                }
                setSavedMode(!savedMode);
              }}
              className="w-9 h-9 rounded-full bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors"
            >
              <Heart className={`w-5 h-5 ${savedMode ? "fill-red-500 text-red-500" : "text-neutral-600"}`} />
            </button>
          </div>
          <CategoryFilterChips selected={selectedCategory} onChange={setSelectedCategory} />
          <div className="mt-2">
            <AreaFilterChips selected={selectedArea} onChange={setSelectedArea} />
          </div>
        </div>
      </div>

      <div className="px-5 pt-4">
        <p className="text-xs text-neutral-400 mb-4">
          {filtered.length} creator{filtered.length !== 1 ? "s" : ""} found
        </p>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-neutral-200 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-5">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              {savedMode ? (
                <Heart className="w-6 h-6 text-neutral-400" />
              ) : (
                <SlidersHorizontal className="w-6 h-6 text-neutral-400" />
              )}
            </div>
            <h3 className="font-medium text-neutral-700">
              {savedMode ? "No saved creators yet" : "No creators found"}
            </h3>
            <p className="text-sm text-neutral-400 mt-1">
              {savedMode ? "Save creators to find them faster later." : "Try adjusting your filters"}
            </p>
            {savedMode && (
              <button
                onClick={() => setSavedMode(false)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Browse creators
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((creator, i) => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                index={i}
                isFavourite={favouriteIds.has(creator.id)}
                onToggleFavourite={toggleFavourite}
                averageRating={creator.averageRating || 0}
                reviewCount={creator.reviewCount || 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}