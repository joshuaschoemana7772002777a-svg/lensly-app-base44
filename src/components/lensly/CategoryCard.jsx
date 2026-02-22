import React from "react";
import { motion } from "framer-motion";
import { Camera, Briefcase, Heart, PartyPopper, Sparkles, Share2 } from "lucide-react";

const categoryConfig = {
  "Corporate": { icon: Briefcase, gradient: "from-slate-800 to-slate-600", image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&q=80" },
  "Brand / Commercial": { icon: Sparkles, gradient: "from-amber-700 to-amber-500", image: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=400&q=80" },
  "Weddings": { icon: Heart, gradient: "from-rose-700 to-rose-500", image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80" },
  "Events": { icon: PartyPopper, gradient: "from-violet-700 to-violet-500", image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80" },
  "Lifestyle": { icon: Camera, gradient: "from-emerald-700 to-emerald-500", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80" },
  "Social Media Content": { icon: Share2, gradient: "from-sky-700 to-sky-500", image: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&q=80" },
};

export default function CategoryCard({ category, onClick, index = 0 }) {
  const config = categoryConfig[category] || categoryConfig["Corporate"];
  const Icon = config.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      onClick={() => onClick(category)}
      className="relative group overflow-hidden rounded-2xl aspect-[4/3] w-full text-left"
    >
      <img
        src={config.image}
        alt={category}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className={`absolute inset-0 bg-gradient-to-t ${config.gradient} opacity-70`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="relative h-full flex flex-col justify-end p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
        <h3 className="text-white font-semibold text-base leading-tight">{category}</h3>
      </div>
    </motion.button>
  );
}