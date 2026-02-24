import React from "react";
import { motion } from "framer-motion";
import { Heart, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StarRating from "./StarRating";

export default function CreatorCard({ creator, isFavourite, onToggleFavourite, index = 0, averageRating, reviewCount }) {
  // Use cover image (profile_image) as the main image
  const mainImage = creator.profile_image || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&q=80";
  
  // Get featured specialties (1-2 required)
  const featuredCategories = creator.featured_categories?.slice(0, 2) || [];
  const showFallback = featuredCategories.length === 0 && creator.categories?.length > 0;
  const displayCategories = showFallback ? [creator.categories[0]] : featuredCategories;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="group"
    >
      <Link to={createPageUrl("CreatorProfile") + `?id=${creator.id}`} className="block">
        <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-neutral-100">
          <img
            src={mainImage}
            alt={creator.display_name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavourite(creator);
            }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:bg-white/40"
          >
            <Heart className={`w-4 h-4 transition-colors ${isFavourite ? "fill-red-500 text-red-500" : "text-white"}`} />
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-semibold text-lg leading-tight mb-2">{creator.display_name}</h3>
            
            {displayCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {displayCategories.map((cat) => (
                  <span key={cat} className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-neutral-900">
                    {cat}
                  </span>
                ))}
              </div>
            )}
            
            {creator.starting_price && (
              <p className="text-white/90 text-xs font-medium">
                From R{creator.starting_price?.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}