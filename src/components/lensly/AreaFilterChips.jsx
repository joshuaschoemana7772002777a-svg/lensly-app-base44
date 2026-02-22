import React from "react";
import { MapPin } from "lucide-react";

const AREAS = ["Operating Area", "Sandton", "Johannesburg", "Pretoria", "Cape Town"];

export default function AreaFilterChips({ selected, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {AREAS.map((area) => {
        const isActive = area === "Operating Area" ? !selected : selected === area;
        return (
          <button
            key={area}
            onClick={() => onChange(area === "Operating Area" ? null : area)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              isActive
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-white text-neutral-600 border border-neutral-200 hover:border-blue-300"
            }`}
          >
            {area !== "Operating Area" && <MapPin className="w-3 h-3" />}
            {area}
          </button>
        );
      })}
    </div>
  );
}