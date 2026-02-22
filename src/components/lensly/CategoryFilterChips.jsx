import React from "react";

const CATEGORIES = ["All", "Corporate", "Brand / Commercial", "Weddings", "Events", "Lifestyle", "Social Media Content"];

export default function CategoryFilterChips({ selected, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {CATEGORIES.map((cat) => {
        const isActive = cat === "All" ? !selected : selected === cat;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat === "All" ? null : cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              isActive
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-white text-neutral-600 border border-neutral-200 hover:border-blue-300"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}