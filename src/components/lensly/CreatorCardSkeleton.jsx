import React from "react";

export default function CreatorCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden aspect-[3/4] bg-neutral-100 animate-pulse">
      <div className="w-full h-full relative">
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <div className="h-4 bg-neutral-200 rounded-full w-3/4" />
          <div className="h-3 bg-neutral-200 rounded-full w-1/2" />
          <div className="h-6 bg-neutral-200 rounded-full w-1/3 mt-1" />
        </div>
      </div>
    </div>
  );
}