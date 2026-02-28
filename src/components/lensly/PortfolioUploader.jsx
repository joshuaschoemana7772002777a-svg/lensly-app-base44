import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2, Play, Crop, Star } from "lucide-react";
import PortfolioCropModal from "./PortfolioCropModal";

const generateVideoThumbnail = (file) =>
  new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration / 2);
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          window.URL.revokeObjectURL(video.src);
          blob ? resolve(blob) : reject("Canvas toBlob failed");
        },
        "image/jpeg",
        0.85
      );
    };
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject("Failed to load video for thumbnail");
    };
    video.src = URL.createObjectURL(file);
  });

const MAX_ITEMS = 12;
const MAX_VIDEO_DURATION = 60; // seconds
const MAX_VIDEO_SIZE = 160 * 1024 * 1024; // 160 MB

/**
 * getCropStyle: converts normalized crop (focalX/focalY/zoom) into CSS for a 1:1 tile.
 * Uses object-fit:cover + object-position for images; same for video thumbnail.
 */
const getCropStyle = (crop) => {
  if (!crop || crop.focalX === undefined) {
    return { objectFit: "cover", objectPosition: "50% 50%" };
  }
  const { focalX = 0.5, focalY = 0.5, zoom = 1 } = crop;
  return {
    objectFit: "cover",
    objectPosition: `${focalX * 100}% ${focalY * 100}%`,
    transform: `scale(${zoom})`,
    transformOrigin: `${focalX * 100}% ${focalY * 100}%`,
    width: "100%",
    height: "100%",
  };
};

export default function PortfolioUploader({ items = [], onChange, featuredItemId, onFeaturedChange }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropItem, setCropItem] = useState(null);
  const [cropIndex, setCropIndex] = useState(null);

  const validateVideo = (file) =>
    new Promise((resolve, reject) => {
      if (!file.type.startsWith("video/mp4") && file.type !== "video/mp4") {
        // Allow any video/* but warn about mp4 preference
      }
      if (file.size > MAX_VIDEO_SIZE) {
        reject(`Video too large. Max allowed is 160 MB.`);
        return;
      }
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > MAX_VIDEO_DURATION) {
          reject(`Video too long. Max duration is ${MAX_VIDEO_DURATION} seconds.`);
        } else {
          resolve();
        }
      };
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject("Invalid video file.");
      };
      video.src = URL.createObjectURL(file);
    });

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (items.length + files.length > MAX_ITEMS) {
      setError(`Max ${MAX_ITEMS} items allowed.`);
      setTimeout(() => setError(null), 4000);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    const newItems = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith("video/");

      try {
        if (isVideo) await validateVideo(file);

        setUploadProgress(Math.round(((i + 0.2) / files.length) * 100));

        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        setUploadProgress(Math.round(((i + 0.7) / files.length) * 100));

        let thumbnailUrl = null;
        if (isVideo) {
          try {
            const thumbBlob = await generateVideoThumbnail(file);
            const thumbFile = new File([thumbBlob], `thumb_${file.name}.jpg`, { type: "image/jpeg" });
            const { file_url: thumb_url } = await base44.integrations.Core.UploadFile({ file: thumbFile });
            thumbnailUrl = thumb_url;
          } catch (thumbErr) {
            console.warn("Thumbnail generation failed, using video URL as fallback:", thumbErr);
          }
        }

        newItems.push({
          url: file_url,
          type: isVideo ? "video" : "image",
          caption: "",
          thumbnail_url: thumbnailUrl,
          crop: { focalX: 0.5, focalY: 0.5, zoom: 1, version: Date.now() },
        });

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      } catch (err) {
        setError(err?.message || err?.toString() || "Upload failed. Please try again.");
        setTimeout(() => setError(null), 6000);
      }
    }

    if (newItems.length > 0) onChange([...items, ...newItems]);
    setUploading(false);
    setUploadProgress(0);
    e.target.value = "";
  };

  const handleRemove = (index) => {
    const removedItem = items[index];
    const next = items.filter((_, i) => i !== index);
    onChange(next);
    if (featuredItemId === removedItem.url) {
      onFeaturedChange?.(null);
    }
  };

  const handleOpenCrop = (item, index) => {
    setCropItem(item);
    setCropIndex(index);
    setCropModalOpen(true);
  };

  const handleSaveCrop = (cropData) => {
    if (cropIndex === null) return;
    const updated = items.map((item, i) =>
      i === cropIndex ? { ...item, crop: cropData } : item
    );
    onChange(updated);

    // If this item is the featured one, notify parent to update cover immediately
    if (items[cropIndex]?.url === featuredItemId) {
      onFeaturedChange?.(featuredItemId, updated[cropIndex]);
    }

    setCropModalOpen(false);
    setCropItem(null);
    setCropIndex(null);
  };

  const getPreviewImageUrl = (item) => {
    if (item.type === "video") return item.thumbnail_url || null;
    return item.url || null;
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">{error}</div>
      )}
      {uploading && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-blue-900">Uploading…</span>
            <span className="text-xs text-blue-700">{uploadProgress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-blue-100 overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}
      <p className="text-xs text-neutral-400">
        Upload photos or short videos (MP4, max {MAX_VIDEO_DURATION}s, under 160 MB). Max {MAX_ITEMS} items.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item, i) => {
          const isFeatured = featuredItemId === item.url;
          const previewUrl = getPreviewImageUrl(item);
          const cropStyle = getCropStyle(item.crop);
          const cacheKey = item.crop?.version || 0;

          return (
            <div
              key={`${item.url}-${cacheKey}`}
              className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100 group"
            >
              {/* Thumbnail */}
              <div className="absolute inset-0 overflow-hidden">
                {previewUrl ? (
                  <img
                    src={`${previewUrl}${cacheKey ? `?v=${cacheKey}` : ""}`}
                    alt=""
                    className="absolute inset-0 pointer-events-none"
                    style={cropStyle}
                    draggable={false}
                  />
                ) : item.type === "video" ? (
                  <video
                    src={item.url}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    muted
                    playsInline
                  />
                ) : null}
              </div>

              {/* Video play icon */}
              {item.type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-9 h-9 rounded-full bg-black/55 flex items-center justify-center">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>
              )}

              {/* Featured badge */}
              {isFeatured && (
                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[9px] font-semibold z-10 flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-white" />
                  Featured
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />

              {/* Top controls */}
              <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={() => handleOpenCrop(item, i)}
                  className="w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                  title="Adjust position"
                >
                  <Crop className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleRemove(i)}
                  className="w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Feature button */}
              {!isFeatured && (
                <button
                  onClick={() => onFeaturedChange?.(item.url, item)}
                  className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-[10px] font-medium text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-center"
                >
                  Set as Featured
                </button>
              )}
            </div>
          );
        })}

        {/* Add button */}
        {items.length < MAX_ITEMS && (
          <label
            className={`aspect-square rounded-xl border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center transition-colors ${
              uploading ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-blue-400"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
                <span className="text-[10px] text-neutral-400 mt-1">{uploadProgress}%</span>
              </>
            ) : (
              <>
                <Plus className="w-6 h-6 text-neutral-400" />
                <span className="text-[10px] text-neutral-400 mt-1">Add</span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
              multiple
              onChange={handleUpload}
              className="hidden"
              disabled={uploading || items.length >= MAX_ITEMS}
            />
          </label>
        )}
      </div>

      <PortfolioCropModal
        open={cropModalOpen}
        onClose={() => {
          setCropModalOpen(false);
          setCropItem(null);
          setCropIndex(null);
        }}
        imageUrl={cropItem ? getPreviewImageUrl(cropItem) || cropItem.url : null}
        existingCrop={cropItem?.crop}
        onSave={handleSaveCrop}
      />
    </div>
  );
}