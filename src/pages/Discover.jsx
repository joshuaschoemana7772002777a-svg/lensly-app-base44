import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { List, Map as MapIcon, SlidersHorizontal, X } from "lucide-react";
import CreatorCard from "../components/lensly/CreatorCard";
import AreaFilterChips from "../components/lensly/AreaFilterChips";
import CategoryFilterChips from "../components/lensly/CategoryFilterChips";
import MapView from "../components/lensly/MapView";

export default function Discover() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [favouriteIds, setFavouriteIds] = useState(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
  }, []);

  useEffect(() => {
    loadAuth();
  }, []);

  const loadAuth = async () => {
    const authed = await base44.auth.isAuthenticated();
    setIsAuthenticated(authed);
    if (authed) {
      const favs = await base44.entities.Favourite.list();
      setFavouriteIds(new Set(favs.map(f => f.creator_profile_id)));
    }
  };

  const loadCreators = async () => {
    setLoading(true);
    const data = await base44.entities.CreatorProfile.filter({ is_published: true }, "-created_date", 100);
    setCreators(data);
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-xl transition-colors ${viewMode === "list" ? "bg-blue-500 text-white" : "bg-white text-neutral-500 border border-neutral-200"}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`p-2 rounded-xl transition-colors ${viewMode === "map" ? "bg-blue-500 text-white" : "bg-white text-neutral-500 border border-neutral-200"}`}
              >
                <MapIcon className="w-4 h-4" />
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
        <p className="text-xs text-neutral-400 mb-4">
          {filtered.length} creator{filtered.length !== 1 ? "s" : ""} found
        </p>

        {viewMode === "map" && filtered.length > 0 && (
          <div className="mb-4">
            <MapView creators={filtered} />
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-neutral-200 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <SlidersHorizontal className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="font-medium text-neutral-700">No creators found</h3>
            <p className="text-sm text-neutral-400 mt-1">Try adjusting your filters</p>
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}