import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import CategoryCard from "../components/lensly/CategoryCard";

const CATEGORIES = ["Corporate", "Brand / Commercial", "Weddings", "Events", "Lifestyle", "Social Media Content"];

export default function Home() {
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
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <span className="text-neutral-600 font-medium text-sm tracking-wide">LENSLY</span>
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
            className="mt-6"
          >
            <Link to={createPageUrl("Discover")}>
              <Button className="w-full h-14 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base shadow-lg">
                Discover creators
              </Button>
            </Link>
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
    </div>
  );
}