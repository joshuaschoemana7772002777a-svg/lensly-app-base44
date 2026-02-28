import React from "react";
import PortfolioUploader from "./PortfolioUploader";
import { Image, Video } from "lucide-react";

/**
 * Renders Photos and Videos as two separate upload sections.
 * Only shows a section if there are already items of that type OR the upload button is always shown.
 */
export default function PortfolioSplitUploader({ items = [], onChange, featuredItemId, onFeaturedChange }) {
  const photos = items.filter((i) => i.type === "image");
  const videos = items.filter((i) => i.type === "video");

  // Merge changes back into combined list, preserving original order
  const handlePhotosChange = (newPhotos) => {
    // Replace all images, keep videos
    onChange([...newPhotos, ...videos]);
  };

  const handleVideosChange = (newVideos) => {
    // Replace all videos, keep photos
    onChange([...photos, ...newVideos]);
  };

  return (
    <div className="space-y-6">
      {/* Photos Section — always shown (upload button is available) */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Image className="w-4 h-4 text-neutral-500" />
          <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Photos</span>
          {photos.length > 0 && (
            <span className="text-xs text-neutral-400">({photos.length})</span>
          )}
        </div>
        <PortfolioUploader
          items={photos}
          onChange={handlePhotosChange}
          featuredItemId={featuredItemId}
          onFeaturedChange={onFeaturedChange}
          acceptVideo={false}
        />
      </div>

      {/* Videos Section — always shown */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Video className="w-4 h-4 text-neutral-500" />
          <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Videos</span>
          {videos.length > 0 && (
            <span className="text-xs text-neutral-400">({videos.length})</span>
          )}
        </div>
        <PortfolioUploader
          items={videos}
          onChange={handleVideosChange}
          featuredItemId={featuredItemId}
          onFeaturedChange={onFeaturedChange}
          acceptVideo={true}
          acceptImage={false}
          maxItems={2}
        />
      </div>
    </div>
  );
}