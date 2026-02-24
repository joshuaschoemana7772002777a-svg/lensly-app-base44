import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, Heart, ArrowUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [sortBy, setSortBy] = useState("rating");

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
    
    // Filter for complete profiles - require: cover image, featured specialties (1-2), starting price
    const complete = data.filter(creator => {
      const hasCoverImage = !!creator.profile_image;
      const hasFeaturedSpecialties = creator.featured_categories?.length > 0;
      const hasStartingPrice = !!creator.starting_price;
      const hasCategories = creator.categories?.length > 0;
      const hasAreas = creator.service_areas?.length > 0;
      return hasCoverImage && hasFeaturedSpecialties && hasStartingPrice && hasCategories && hasAreas;
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

    // Calculate quality score for each creator
    const calculateScore = (creator, isFavorited) => {
      let score = 0;

      // 1) Favorites boost (personalized)
      if (isFavorited) score += 20;

      // 2) Profile completeness
      if (creator.profile_image) score += 6;
      if (creator.bio && creator.bio.length >= 60) score += 6;
      if (creator.starting_price) score += 4;
      if (creator.portfolio_items?.length >= 6) score += 12;
      else if (creator.portfolio_items?.length >= 3) score += 6;
      if (creator.service_areas?.length >= 1) score += 4;
      if (creator.instagram_handle || creator.website_url) score += 4;

      // 3) Responsiveness (placeholder for future implementation)
      // TODO: Implement avg_response_time tracking
      // if (creator.avg_response_time_hours < 2) score += 12;
      // else if (creator.avg_response_time_hours < 12) score += 7;

      // 4) Reviews / reputation
      if (creator.reviewCount > 0) {
        if (creator.averageRating >= 4.8 && creator.reviewCount >= 10) score += 18;
        else if (creator.averageRating >= 4.6 && creator.reviewCount >= 5) score += 12;
        else if (creator.averageRating >= 4.4 && creator.reviewCount >= 3) score += 7;
        else if (creator.reviewCount < 3) score += 3;
      }

      // 5) Freshness / activity
      if (creator.updated_date) {
        const daysSinceUpdate = (Date.now() - new Date(creator.updated_date)) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate <= 30) score += 5;
      }

      return score;
    };

    // Get current user for favorites scoring
    let currentUserEmail = null;
    try {
      const authed = await base44.auth.isAuthenticated();
      if (authed) {
        const user = await base44.auth.me();
        currentUserEmail = user.email;
      }
    } catch {}

    // Load user favorites for scoring
    const userFavorites = new Set();
    if (currentUserEmail) {
      const favs = await base44.entities.Favourite.list();
      favs.forEach(f => userFavorites.add(f.creator_profile_id));
    }

    // Calculate and attach scores
    complete.forEach(creator => {
      creator.score = calculateScore(creator, userFavorites.has(creator.id));
    });

    // Sort by score DESC with tie-breakers
    const sorted = complete.sort((a, b) => {
      // Primary: Score
      if (a.score !== b.score) return b.score - a.score;
      
      // Tie-breaker 1: Higher rating
      if (a.averageRating !== b.averageRating) return b.averageRating - a.averageRating;
      
      // Tie-breaker 2: Higher review count
      if (a.reviewCount !== b.reviewCount) return b.reviewCount - a.reviewCount;
      
      // Tie-breaker 3: Response time (placeholder)
      // TODO: Implement when avg_response_time is tracked
      
      // Tie-breaker 4: More portfolio items
      const aPortfolio = a.portfolio_items?.length || 0;
      const bPortfolio = b.portfolio_items?.length || 0;
      if (aPortfolio !== bPortfolio) return bPortfolio - aPortfolio;
      
      // Tie-breaker 5: Most recently updated
      if (a.updated_date && b.updated_date) {
        return new Date(b.updated_date) - new Date(a.updated_date);
      }
      
      // Tie-breaker 6: Stable by ID (pseudo-random but consistent)
      return a.id.localeCompare(b.id);
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

  // Apply sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price_low") {
      const aPrice = a.starting_price || Infinity;
      const bPrice = b.starting_price || Infinity;
      return aPrice - bPrice;
    } else if (sortBy === "price_high") {
      const aPrice = a.starting_price || 0;
      const bPrice = b.starting_price || 0;
      return bPrice - aPrice;
    } else if (sortBy === "rating") {
      // Default: Top Rated
      if (a.averageRating !== b.averageRating) return b.averageRating - a.averageRating;
      return b.reviewCount - a.reviewCount;
    }
    return 0;
  });

  const activeFilters = [selectedCategory, selectedArea].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-neutral-100">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-neutral-900">Discover</h1>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-9 h-9 rounded-full bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors">
                    <ArrowUpDown className="w-5 h-5 text-neutral-600" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy("rating")}>
                    Top Rated
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price_high")}>
                    Price: High to Low
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price_low")}>
                    Price: Low to High
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
          </div>
          <CategoryFilterChips selected={selectedCategory} onChange={setSelectedCategory} />
          <div className="mt-2">
            <AreaFilterChips selected={selectedArea} onChange={setSelectedArea} />
          </div>
        </div>
      </div>

      <div className="px-5 pt-4">
        {sortBy !== "rating" && (
          <div className="mb-3">
            <button
              onClick={() => setSortBy("rating")}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-full text-xs font-medium text-neutral-700 hover:bg-neutral-200 transition-colors"
            >
              Sorted: {sortBy === "price_low" ? "Price: Low to High" : "Price: High to Low"}
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
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
            {sorted.map((creator, i) => (
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