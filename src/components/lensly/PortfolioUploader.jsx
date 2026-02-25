import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2, Image as ImageIcon, Video, Play, Crop } from "lucide-react";
import PortfolioCropModal from "./PortfolioCropModal";

const generateVideoThumbnail = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration / 2); // Seek to 1 second or middle
    };
    
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        window.URL.revokeObjectURL(video.src);
        resolve(blob);
      }, "image/jpeg", 0.85);
    };
    
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject("Failed to generate thumbnail");
    };
    
    video.src = URL.createObjectURL(file);
  });
};

const MAX_ITEMS = 12;
const MAX_VIDEO_DURATION = 45; // seconds
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB in bytes

export default function PortfolioUploader({ items = [], onChange, featuredItemId, onFeaturedChange }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropItem, setCropItem] = useState(null);
  const [cropIndex, setCropIndex] = useState(null);

  const validateVideo = (file) => {
    return new Promise((resolve, reject) => {
      // Check file type
      if (file.type !== "video/mp4") {
        reject("Unsupported format. Please upload an MP4 file.");
        return;
      }
      
      // Check file size
      if (file.size > MAX_VIDEO_SIZE) {
        reject("Video too large. Please upload an MP4 under 100MB (max 45 seconds).");
        return;
      }
      
      // Check duration
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > MAX_VIDEO_DURATION) {
          reject("Video too long. Please upload a video under 45 seconds.");
        } else {
          resolve();
        }
      };
      video.onerror = () => reject("Invalid video file. Please upload a valid MP4.");
      video.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    if (items.length + files.length > MAX_ITEMS) {
      setError(`Maximum ${MAX_ITEMS} items allowed`);
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    const newItems = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith("video/");
        
        // Validate video before upload
        if (isVideo) {
          await validateVideo(file);
        }
        
        // Update progress
        setUploadProgress(Math.round((i / files.length) * 100));
        
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          
          let thumbnailUrl = null;
          if (isVideo) {
            // Generate and upload thumbnail for videos
            try {
              const thumbnailBlob = await generateVideoThumbnail(file);
              const thumbnailFile = new File([thumbnailBlob], `${file.name}_thumb.jpg`, { type: "image/jpeg" });
              const { file_url: thumb_url } = await base44.integrations.Core.UploadFile({ file: thumbnailFile });
              thumbnailUrl = thumb_url;
            } catch (thumbError) {
              console.error("Thumbnail generation failed:", thumbError);
            }
          }
          
          newItems.push({ 
            url: file_url, 
            type: isVideo ? "video" : "image", 
            caption: "",
            thumbnail_url: thumbnailUrl,
            crop: { x: 0, y: 0, zoom: 1 } // Default center crop
          });
        } catch (uploadError) {
          throw new Error("Upload failed. Please try a smaller video or check your connection.");
        }
      }
      
      setUploadProgress(100);
      onChange([...items, ...newItems]);
    } catch (err) {
      const errorMessage = err.message || err.toString();
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
    
    // Reset input
    e.target.value = '';
  };

  const handleRemove = (index) => {
    const removedItem = items[index];
    onChange(items.filter((_, i) => i !== index));
    // If removing the featured item, clear the featured selection
    if (featuredItemId === removedItem.url) {
      onFeaturedChange?.(null);
    }
  };

  const handleSetFeatured = (itemUrl) => {
    onFeaturedChange?.(itemUrl);
  };

  const handleOpenCrop = (item, index) => {
    setCropItem(item);
    setCropIndex(index);
    setCropModalOpen(true);
  };

  const handleSaveCrop = (cropData) => {
    if (cropIndex === null) return;
    
    // Update the item with new crop data + version for cache busting
    const updatedItems = [...items];
    updatedItems[cropIndex] = { 
      ...updatedItems[cropIndex], 
      crop: {
        ...cropData,
        version: Date.now() // Force re-render
      }
    };
    
    // Immediately update parent state (optimistic update)
    onChange(updatedItems);
    
    // Close modal
    setCropModalOpen(false);
    setCropItem(null);
    setCropIndex(null);
  };

  const getDisplayStyle = (item) => {
    if (!item.crop) {
      // Default: center cover
      return {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      };
    }
    
    const { x, y, zoom } = item.crop;
    return {
      transform: `translate(${x}px, ${y}px) scale(${zoom})`,
      transformOrigin: 'top left',
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    };
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
          {error}
        </div>
      )}
      {uploading && uploadProgress > 0 && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-blue-900">Uploading...</span>
            <span className="text-xs text-blue-700">{uploadProgress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-blue-100 overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
      <p className="text-xs text-neutral-400">
        Upload photos or short videos (MP4, max 45 seconds, under 100MB). Max {MAX_ITEMS} items.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item, i) => {
          const isFeatured = featuredItemId === item.url;
          return (
            <div key={`${i}-${item.crop?.version || 0}`} className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100 group">
              {item.type === "video" ? (
                <div className="w-full h-full relative bg-neutral-900 overflow-hidden">
                  {item.thumbnail_url ? (
                    <div className="w-full h-full relative overflow-hidden">
                      <img 
                        src={`${item.thumbnail_url}?v=${item.crop?.version || 0}`}
                        alt="" 
                        className="absolute w-full h-full"
                        style={getDisplayStyle(item)}
                      />
                    </div>
                  ) : (
                    <video src={item.url} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full relative overflow-hidden">
                  <img 
                    src={`${item.url}?v=${item.crop?.version || 0}`}
                    alt="" 
                    className="absolute w-full h-full"
                    style={getDisplayStyle(item)}
                  />
                </div>
              )}
              {isFeatured && (
                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[9px] font-semibold">
                  Featured
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
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
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              {!isFeatured && (
                <button
                  onClick={() => handleSetFeatured(item.url)}
                  className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-[10px] font-medium text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  Set as Featured
                </button>
              )}
            </div>
          );
        })}
        {items.length < MAX_ITEMS && (
          <label className={`aspect-square rounded-xl border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center ${uploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-blue-500'} transition-colors`}>
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
              accept="image/jpeg,image/png,image/webp,video/mp4" 
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
        imageUrl={cropItem?.type === "video" ? cropItem?.thumbnail_url : cropItem?.url}
        onSave={handleSaveCrop}
      />
    </div>
  );
}