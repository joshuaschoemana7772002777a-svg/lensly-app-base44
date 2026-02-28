import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Loader2, Play, Crop, Star, Clock } from "lucide-react";
import PortfolioCropModal from "./PortfolioCropModal";

const MAX_ITEMS = 12;
const MAX_VIDEO_DURATION = 30; // seconds
const MAX_VIDEO_SIZE = 150 * 1024 * 1024; // 150 MB

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

// Upload a file directly to Mux's upload URL (no size limit via Base44)
const uploadToMux = (file, uploadUrl, onProgress) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(`Upload failed: ${xhr.status}`);
    };
    xhr.onerror = () => reject("Network error during upload");
    xhr.open("PUT", uploadUrl);
    xhr.send(file);
  });

// Poll Mux until asset is ready (up to ~3 minutes)
const pollMuxAsset = async (uploadId) => {
  const MAX_POLLS = 36; // 36 × 5s = 3 min
  let assetId = null;

  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((r) => setTimeout(r, 5000));

    if (!assetId) {
      const uploadRes = await base44.functions.invoke("muxUpload", {
        action: "get_upload",
        asset_id: uploadId,
      });
      if (uploadRes.data?.asset_id) {
        assetId = uploadRes.data.asset_id;
      }
    }

    if (assetId) {
      const assetRes = await base44.functions.invoke("muxUpload", {
        action: "get_asset",
        asset_id: assetId,
      });
      if (assetRes.data?.status === "ready") {
        return assetRes.data;
      }
      if (assetRes.data?.status === "errored") {
        throw new Error("Mux processing failed");
      }
    }
  }
  throw new Error("Mux processing timed out");
};

export default function PortfolioUploader({ items = [], onChange, featuredItemId, onFeaturedChange, acceptVideo = true, acceptImage = true, maxItems = MAX_ITEMS }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLabel, setUploadLabel] = useState("Uploading…");
  const [error, setError] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropItem, setCropItem] = useState(null);
  const [cropIndex, setCropIndex] = useState(null);

  const validateVideo = (file) =>
    new Promise((resolve, reject) => {
      const allowed = ["video/mp4", "video/quicktime"];
      if (!allowed.includes(file.type)) {
        reject("Only MP4 or MOV (QuickTime) videos are supported.");
        return;
      }
      if (file.size > MAX_VIDEO_SIZE) {
        reject("Video must be under 150MB.");
        return;
      }
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > MAX_VIDEO_DURATION) {
          reject("Videos must be 30 seconds or shorter.");
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

    if (items.length + files.length > maxItems) {
      setError(`Max ${maxItems} items allowed.`);
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
      if (isVideo && !acceptVideo) continue;
      if (!isVideo && !acceptImage) continue;

      try {
        if (isVideo) {
          await validateVideo(file);

          // Step 1: Create Mux upload URL
          setUploadLabel("Preparing upload…");
          setUploadProgress(5);
          const { data: uploadData } = await base44.functions.invoke("muxUpload", {
            action: "create_upload",
          });
          const { upload_id, upload_url } = uploadData;

          // Add a placeholder "processing" item immediately so the grid shows it
          const placeholderItem = {
            url: "",
            type: "video",
            caption: "",
            thumbnail_url: null,
            asset_id: null,
            mux_upload_id: upload_id,
            mux_status: "uploading",
            crop: { focalX: 0.5, focalY: 0.5, zoom: 1, version: Date.now() },
          };
          onChange([...items, ...newItems, placeholderItem]);

          // Step 2: Upload directly to Mux (bypasses Base44 size limit)
          setUploadLabel("Uploading video…");
          await uploadToMux(file, upload_url, (pct) => {
            setUploadProgress(5 + Math.round(pct * 0.7)); // 5–75%
          });

          // Step 3: Poll for asset ready
          setUploadLabel("Processing video…");
          setUploadProgress(80);
          const asset = await pollMuxAsset(upload_id);

          newItems.push({
            url: asset.mp4_url || asset.playback_url,
            type: "video",
            caption: "",
            thumbnail_url: asset.thumbnail_url,
            asset_id: asset.asset_id,
            mux_playback_id: asset.playback_id,
            mux_playback_url: asset.playback_url,
            mux_mp4_url: asset.mp4_url,
            mux_status: "ready",
            crop: { focalX: 0.5, focalY: 0.5, zoom: 1, version: Date.now() },
          });

        } else {
          // Image — use standard UploadFile
          setUploadLabel("Uploading image…");
          setUploadProgress(Math.round(((i + 0.3) / files.length) * 100));
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          newItems.push({
            url: file_url,
            type: "image",
            caption: "",
            thumbnail_url: null,
            crop: { focalX: 0.5, focalY: 0.5, zoom: 1, version: Date.now() },
          });
          setUploadProgress(Math.round(((i + 1) / files.length) * 100));
        }
      } catch (err) {
        setError(err?.message || err?.toString() || "Upload failed. Please try again.");
        setTimeout(() => setError(null), 6000);
      }
    }

    // Replace any placeholder with the final items
    const finalItems = [
      ...items.filter((it) => it.mux_status !== "uploading"),
      ...newItems,
    ];
    onChange(finalItems);
    setUploading(false);
    setUploadProgress(0);
    setUploadLabel("Uploading…");
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
            <span className="text-xs font-medium text-blue-900">{uploadLabel}</span>
            <span className="text-xs text-blue-700">{uploadProgress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-blue-100 overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}
      <p className="text-xs text-neutral-400">
        {acceptVideo && acceptImage
          ? `Upload photos or short videos (MP4 or MOV, max 30 seconds, under 150MB). Max ${maxItems} items.`
          : acceptVideo
          ? `Upload short videos (MP4 or MOV, max 30 seconds, under 150MB). Max ${maxItems} items.`
          : `Upload photos (JPEG, PNG, or WebP). Max ${maxItems} items.`}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item, i) => {
          const isFeatured = featuredItemId === item.url;
          const isProcessing = item.mux_status === "uploading" || item.mux_status === "preparing";
          const previewUrl = getPreviewImageUrl(item);
          const cropStyle = getCropStyle(item.crop);
          const cacheKey = item.crop?.version || 0;

          return (
            <div
              key={`${item.url || item.mux_upload_id}-${cacheKey}`}
              className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100 group"
            >
              {/* Processing tile */}
              {isProcessing ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 text-white gap-2">
                  <Loader2 className="w-6 h-6 animate-spin opacity-70" />
                  <span className="text-[10px] font-medium opacity-70">Processing…</span>
                </div>
              ) : (
                <>
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
                      <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white opacity-50" />
                      </div>
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
                    {item.type === "image" && (
                      <button
                        onClick={() => handleOpenCrop(item, i)}
                        className="w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                        title="Adjust position"
                      >
                        <Crop className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(i)}
                      className="w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Feature button */}
                  {!isFeatured && item.url && (
                    <button
                      onClick={() => onFeaturedChange?.(item.url, item)}
                      className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-[10px] font-medium text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-center"
                    >
                      Set as Featured
                    </button>
                  )}
                </>
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
              accept={
                acceptVideo && acceptImage
                  ? "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp,video/mp4,video/quicktime,.mp4,.mov"
                  : acceptVideo
                  ? "video/mp4,video/quicktime,.mp4,.mov"
                  : "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              }
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