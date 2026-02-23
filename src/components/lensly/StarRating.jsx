import React from "react";
import { Star } from "lucide-react";

export default function StarRating({ rating, count, size = "sm" }) {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const textSizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className="flex items-center gap-1.5">
      <Star className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`} />
      <span className={`${textSizeClasses[size]} font-semibold text-neutral-900`}>
        {rating.toFixed(1)}
      </span>
      {count !== undefined && (
        <span className={`${textSizeClasses[size]} text-neutral-400`}>
          ({count})
        </span>
      )}
    </div>
  );
}