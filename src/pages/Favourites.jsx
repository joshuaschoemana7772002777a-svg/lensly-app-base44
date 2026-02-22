import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Heart, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CreatorCard from "../components/lensly/CreatorCard";

export default function Favourites() {
  const [favourites, setFavourites] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const authed = await base44.auth.isAuthenticated();
    setIsAuthenticated(authed);
    if (!authed) {
      setLoading(false);
      return;
    }
    const favs = await base44.entities.Favourite.list("-created_date");
    setFavourites(favs);
    if (favs.length > 0) {
      const allCreators = await base44.entities.CreatorProfile.list();
      const favIds = new Set(favs.map(f => f.creator_profile_id));
      setCreators(allCreators.filter(c => favIds.has(c.id)));
    }
    setLoading(false);
  };

  const toggleFavourite = async (creator) => {
    const fav = favourites.find(f => f.creator_profile_id === creator.id);
    if (fav) {
      await base44.entities.Favourite.delete(fav.id);
      setFavourites(prev => prev.filter(f => f.id !== fav.id));
      setCreators(prev => prev.filter(c => c.id !== creator.id));
    }
  };

  const favouriteIds = new Set(favourites.map(f => f.creator_profile_id));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-5">
        <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-neutral-300" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-800">Sign in to see favourites</h2>
        <p className="text-sm text-neutral-400 mt-2 text-center">Log in to save and view your favourite creators</p>
        <button
          onClick={() => base44.auth.redirectToLogin(window.location.href)}
          className="mt-6 px-6 py-3 bg-neutral-900 text-white rounded-2xl text-sm font-medium"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-bold text-neutral-900">Favourites</h1>
        <p className="text-sm text-neutral-400 mt-1">{creators.length} saved creator{creators.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="px-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map(i => <div key={i} className="aspect-[3/4] rounded-2xl bg-neutral-200 animate-pulse" />)}
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-neutral-300" />
            </div>
            <h3 className="font-medium text-neutral-700">No favourites yet</h3>
            <p className="text-sm text-neutral-400 mt-1">Tap the heart icon on any creator to save them</p>
            <Link to={createPageUrl("Explore")} className="inline-block mt-4 text-amber-600 text-sm font-medium">
              Explore Creators
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {creators.map((creator, i) => (
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