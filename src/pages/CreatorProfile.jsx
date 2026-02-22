import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, MapPin, Mail, Globe, Instagram, Camera, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ContactFormModal from "../components/lensly/ContactFormModal";

export default function CreatorProfile() {
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const params = new URLSearchParams(window.location.search);
  const creatorId = params.get("id");

  useEffect(() => {
    if (creatorId) loadCreator();
  }, [creatorId]);

  const loadCreator = async () => {
    setLoading(true);
    const data = await base44.entities.CreatorProfile.filter({ id: creatorId });
    if (data.length > 0) setCreator(data[0]);
    const authed = await base44.auth.isAuthenticated();
    setIsAuthenticated(authed);
    if (authed) {
      const favs = await base44.entities.Favourite.filter({ creator_profile_id: creatorId });
      setIsFavourite(favs.length > 0);
    }
    setLoading(false);
  };

  const toggleFavourite = async () => {
    if (!isAuthenticated) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (isFavourite) {
      const favs = await base44.entities.Favourite.filter({ creator_profile_id: creatorId });
      if (favs.length > 0) await base44.entities.Favourite.delete(favs[0].id);
      setIsFavourite(false);
    } else {
      await base44.entities.Favourite.create({
        creator_profile_id: creator.id,
        creator_name: creator.display_name,
        creator_image: creator.profile_image,
      });
      setIsFavourite(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 p-5">
        <h2 className="text-lg font-semibold">Creator not found</h2>
        <Link to={createPageUrl("Discover")} className="text-blue-500 text-sm">
          Back to Discover
        </Link>
      </div>
    );
  }

  const portfolio = creator.portfolio_items || [];
  const heroImage = portfolio[galleryIndex]?.url || creator.profile_image || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80";

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Hero Gallery */}
      <div className="relative aspect-[4/5] md:aspect-[16/9] max-h-[500px] bg-neutral-900">
        <motion.img
          key={galleryIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          src={heroImage}
          alt={creator.display_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        {/* Nav */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
          <Link
            to={createPageUrl("Discover")}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <button
            onClick={toggleFavourite}
            className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
          >
            <Heart className={`w-4 h-4 ${isFavourite ? "fill-red-500 text-red-500" : "text-white"}`} />
          </button>
        </div>

        {/* Gallery nav */}
        {portfolio.length > 1 && (
          <>
            <button
              onClick={() => setGalleryIndex(i => Math.max(0, i - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setGalleryIndex(i => Math.min(portfolio.length - 1, i + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {portfolio.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setGalleryIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === galleryIndex ? "bg-white w-6" : "bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="px-5 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-5 border border-neutral-100">
          <h1 className="text-2xl font-bold text-neutral-900 leading-tight">{creator.display_name}</h1>

          {creator.categories?.[0] && (
            <div className="mt-2">
              <Badge variant="secondary" className="bg-blue-500 text-white text-xs rounded-full px-3">
                {creator.categories[0]}
              </Badge>
            </div>
          )}

          {/* Price */}
          {creator.starting_price && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl">
              <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Starting from</span>
              <div className="text-3xl font-bold text-blue-600 mt-1">R{creator.starting_price?.toLocaleString()}</div>
            </div>
          )}

          {/* Areas */}
          <div className="mt-4">
            <div className="flex items-center gap-1.5 text-sm text-neutral-600">
              <MapPin className="w-4 h-4 text-neutral-400" />
              <span>Operates in: {(creator.service_areas || []).join(" · ")}</span>
            </div>
          </div>

          {/* Primary CTA */}
          <Button
            onClick={() => setContactOpen(true)}
            className="w-full h-14 mt-5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base shadow-lg"
          >
            <Send className="w-5 h-5 mr-2" />
            Contact {creator.display_name?.split(" ")[0]}
          </Button>
        </div>

        {/* Additional Details */}
        <div className="mt-5 bg-white rounded-2xl shadow-sm p-5 border border-neutral-100">
          {/* Categories */}
          {creator.categories?.length > 1 && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">All Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {creator.categories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="bg-neutral-100 text-neutral-700 text-xs rounded-full px-3">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {(creator.instagram_handle || creator.website_url) && (
            <div className={creator.categories?.length > 1 ? "mt-4" : ""}>
              <div className="flex flex-wrap gap-3">
                {creator.instagram_handle && (
                  <a
                    href={`https://instagram.com/${creator.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 rounded-xl text-xs font-medium text-neutral-700 hover:bg-neutral-200 transition"
                  >
                    <Instagram className="w-3.5 h-3.5" /> @{creator.instagram_handle}
                  </a>
                )}
                {creator.website_url && (
                  <a
                    href={creator.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 rounded-xl text-xs font-medium text-neutral-700 hover:bg-neutral-200 transition"
                  >
                    <Globe className="w-3.5 h-3.5" /> Website
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Portfolio Grid */}
        {portfolio.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Portfolio</h3>
            <div className="grid grid-cols-2 gap-2">
              {portfolio.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-xl overflow-hidden ${i === 0 ? "col-span-2 aspect-video" : "aspect-square"}`}
                >
                  {item.type === "video" ? (
                    <video src={item.url} controls className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.url} alt={item.caption || ""} className="w-full h-full object-cover" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Bio */}
        {creator.bio && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm p-5 border border-neutral-100">
            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">About</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">{creator.bio}</p>
          </div>
        )}
      </div>



      <ContactFormModal open={contactOpen} onClose={() => setContactOpen(false)} creator={creator} />
    </div>
  );
}