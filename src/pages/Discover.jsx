import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { SlidersHorizontal, Heart, ArrowUpDown, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as SliderPrimitive from "@radix-ui/react-slider";
import CreatorCard from "../components/lensly/CreatorCard";
import CreatorCardSkeleton from "../components/lensly/CreatorCardSkeleton";
import AreaFilterChips from "../components/lensly/AreaFilterChips";
import CategoryFilterChips from "../components/lensly/CategoryFilterChips";

const PAGE_SIZE = 12;

// In-memory cache: key → { data, timestamp }
const cache = {};
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function getCached(key) {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) return null;
  return entry.data;
}
function setCache(key, data) {
  cache[key] = { data, timestamp: Date.now() };
}

function buildCacheKey(filters, sort) {
  return JSON.stringify({ ...filters, sort });
}

function scoreCreator(creator, favouriteIds) {
  let score = 0;
  if (favouriteIds.has(creator.id)) score += 20;
  if (creator.profile_image) score += 6;
  if (creator.bio?.length >= 60) score += 6;
  if (creator.starting_price) score += 4;
  if (creator.portfolio_items?.length >= 6) score += 12;
  else if (creator.portfolio_items?.length >= 3) score += 6;
  if (creator.service_areas?.length >= 1) score += 4;
  if (creator.instagram_handle || creator.website_url) score += 4;
  const rc = creator.reviewCount || 0;
  const ar = creator.averageRating || 0;
  if (rc > 0) {
    if (ar >= 4.8 && rc >= 10) score += 18;
    else if (ar >= 4.6 && rc >= 5) score += 12;
    else if (ar >= 4.4 && rc >= 3) score += 7;
    else score += 3;
  }
  if (creator.updated_date) {
    const days = (Date.now() - new Date(creator.updated_date)) / (1000 * 60 * 60 * 24);
    if (days <= 30) score += 5;
  }
  return score;
}

const roundDownToStep = (val, step) => Math.floor(val / step) * step;
const roundUpToStep = (val, step) => Math.ceil(val / step) * step;

export default function Discover() {
  const [allCreators, setAllCreators] = useState([]); // full sorted set
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [favouriteIds, setFavouriteIds] = useState(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [savedMode, setSavedMode] = useState(false);
  const [sortBy, setSortBy] = useState("rating");
  const [selectedType, setSelectedType] = useState(null);
  const [sliderMin, setSliderMin] = useState(0);
  const [sliderMax, setSliderMax] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [hasPriceData, setHasPriceData] = useState(false);

  const isPriceDefault = priceMax === sliderMax;

  // Read URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    const area = params.get("area");
    if (cat) setSelectedCategory(cat);
    if (area) setSelectedArea(area);
  }, []);

  // Load everything in parallel on mount
  useEffect(() => {
    loadAll(true);
  }, []);

  const loadAll = async (isInitial = false) => {
    if (isInitial) setLoading(true);

    // Parallelise: creators + reviews + auth/favourites all at once
    const [creatorsData, reviewsData, authed] = await Promise.all([
      base44.entities.CreatorProfile.filter(
        { status: "published", is_published: true, is_hidden: false },
        "-created_date",
        200
      ),
      base44.entities.Review.list("-created_date", 2000),
      base44.auth.isAuthenticated(),
    ]);

    setIsAuthenticated(authed);

    // Fetch favourites in parallel with nothing else blocking
    let favSet = new Set();
    if (authed) {
      const favs = await base44.entities.Favourite.list();
      favSet = new Set(favs.map(f => f.creator_profile_id));
      setFavouriteIds(favSet);
    }

    // Build review map
    const reviewMap = {};
    reviewsData.forEach(r => {
      if (!reviewMap[r.creator_profile_id]) reviewMap[r.creator_profile_id] = { sum: 0, count: 0 };
      reviewMap[r.creator_profile_id].sum += r.rating;
      reviewMap[r.creator_profile_id].count += 1;
    });

    // Filter out deleted/banned
    const eligible = creatorsData.filter(c => !c.isDeleted && !c.isBanned);

    // Attach review stats + score
    const withStats = eligible.map(c => {
      const stats = reviewMap[c.id] || { sum: 0, count: 0 };
      const averageRating = stats.count > 0 ? stats.sum / stats.count : 0;
      const reviewCount = stats.count;
      const score = scoreCreator({ ...c, averageRating, reviewCount }, favSet);
      return { ...c, averageRating, reviewCount, score };
    });

    // Default sort: by score
    const sorted = withStats.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.averageRating !== b.averageRating) return b.averageRating - a.averageRating;
      if (a.reviewCount !== b.reviewCount) return b.reviewCount - a.reviewCount;
      const ap = a.portfolio_items?.length || 0;
      const bp = b.portfolio_items?.length || 0;
      if (ap !== bp) return bp - ap;
      if (a.updated_date && b.updated_date) return new Date(b.updated_date) - new Date(a.updated_date);
      return a.id.localeCompare(b.id);
    });

    setAllCreators(sorted);
    setDisplayCount(PAGE_SIZE);

    // Price bounds
    const priced = sorted.filter(c => c.starting_price > 0);
    if (priced.length > 0) {
      const minP = Math.min(...priced.map(c => c.starting_price));
      const maxP = Math.max(...priced.map(c => c.starting_price));
      const sMin = roundDownToStep(minP, 500);
      const sMax = roundUpToStep(maxP, 500);
      setSliderMin(sMin);
      setSliderMax(sMax);
      setPriceMax(sMax);
      setHasPriceData(true);
    } else {
      setHasPriceData(false);
    }

    if (isInitial) setLoading(false);
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

  // Filter
  const filtered = allCreators.filter((c) => {
    if (savedMode && !favouriteIds.has(c.id)) return false;
    if (selectedArea && !(c.service_areas || []).includes(selectedArea)) return false;
    if (selectedCategory && !(c.categories || []).includes(selectedCategory)) return false;
    if (selectedType === "photographer" && c.creator_type !== "photographer" && c.creator_type !== "both") return false;
    if (selectedType === "videographer" && c.creator_type !== "videographer" && c.creator_type !== "both") return false;
    if (hasPriceData && !isPriceDefault) {
      if (!c.starting_price) return false;
      if (c.starting_price < priceRange[0] || c.starting_price > priceRange[1]) return false;
    }
    return true;
  });

  // Apply user-selected sort on top of filtered
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price_low") return (a.starting_price || Infinity) - (b.starting_price || Infinity);
    if (sortBy === "price_high") return (b.starting_price || 0) - (a.starting_price || 0);
    // "rating" — keep existing score-based order (already sorted)
    return 0;
  });

  const visible = sorted.slice(0, displayCount);
  const hasMore = displayCount < sorted.length;

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await new Promise(r => setTimeout(r, 300)); // brief pause for skeleton feel
    setDisplayCount(prev => prev + PAGE_SIZE);
    setLoadingMore(false);
  };

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [selectedArea, selectedCategory, selectedType, priceRange, savedMode, sortBy]);

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
                  <DropdownMenuItem onClick={() => setSortBy("rating")}>Top Rated</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price_high")}>Price: High to Low</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price_low")}>Price: Low to High</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                onClick={() => {
                  if (!isAuthenticated) { base44.auth.redirectToLogin(window.location.href); return; }
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
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-medium shrink-0">Type:</span>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {[
                { label: "All", value: null },
                { label: "Photographer", value: "photographer" },
                { label: "Videographer", value: "videographer" },
              ].map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => setSelectedType(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedType === value
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {hasPriceData && sliderMax > sliderMin && (
            <div className="mt-3 pb-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500 font-medium">Price Range</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-800">
                    {isPriceDefault ? "Any price" : `R${priceRange[0].toLocaleString()} – R${priceRange[1].toLocaleString()}`}
                  </span>
                  {!isPriceDefault && (
                    <button
                      onClick={() => setPriceRange([sliderMin, sliderMax])}
                      className="text-[10px] text-blue-500 hover:text-blue-700 font-medium"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <SliderPrimitive.Root
                className="relative flex items-center select-none touch-none w-full h-5"
                min={sliderMin} max={sliderMax} step={500}
                value={priceRange} onValueChange={setPriceRange}
              >
                <SliderPrimitive.Track className="bg-neutral-200 relative grow rounded-full h-1.5">
                  <SliderPrimitive.Range className="absolute bg-neutral-900 rounded-full h-full" />
                </SliderPrimitive.Track>
                <SliderPrimitive.Thumb className="block w-4 h-4 bg-white border-2 border-neutral-900 rounded-full shadow focus:outline-none cursor-grab active:cursor-grabbing" />
                <SliderPrimitive.Thumb className="block w-4 h-4 bg-white border-2 border-neutral-900 rounded-full shadow focus:outline-none cursor-grab active:cursor-grabbing" />
              </SliderPrimitive.Root>
              <p className="text-[10px] text-neutral-400 mt-1">Filters by creator starting price</p>
            </div>
          )}
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

        {!loading && (
          <p className="text-xs text-neutral-400 mb-4">
            {filtered.length} creator{filtered.length !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Skeleton or grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <CreatorCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-5">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              {savedMode ? <Heart className="w-6 h-6 text-neutral-400" /> : <SlidersHorizontal className="w-6 h-6 text-neutral-400" />}
            </div>
            <h3 className="font-medium text-neutral-700">
              {savedMode ? "No saved creators yet" : "No creators found"}
            </h3>
            <p className="text-sm text-neutral-400 mt-1">
              {savedMode ? "Save creators to find them faster later." : "No creators found for this selection."}
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
          <>
            <div className="grid grid-cols-2 gap-3">
              {visible.map((creator, i) => (
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
              {/* Load more skeletons */}
              {loadingMore && Array.from({ length: 4 }).map((_, i) => (
                <CreatorCardSkeleton key={`more-${i}`} />
              ))}
            </div>

            {hasMore && !loadingMore && (
              <button
                onClick={handleLoadMore}
                className="w-full mt-6 py-3 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Load more ({sorted.length - displayCount} remaining)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}