import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2, Image as ImageIcon, Video, Play } from "lucide-react";

const MAX_ITEMS = 12;
const MAX_VIDEO_DURATION = 60; // seconds
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB in bytes

export default function PortfolioUploader({ items = [], onChange, featuredItemId, onFeaturedChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const validateVideo = (file) => {
    return new Promise((resolve, reject) => {
      if (file.size > MAX_VIDEO_SIZE) {
        reject("Video must be under 100MB");
        return;
      }
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > MAX_VIDEO_DURATION) {
          reject(`Video must be under ${MAX_VIDEO_DURATION} seconds`);
        } else {
          resolve();
        }
      };
      video.onerror = () => reject("Invalid video file");
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
    setError(null);
    const newItems = [];
    
    try {
      for (const file of files) {
        const isVideo = file.type.startsWith("video/");
        
        if (isVideo) {
          await validateVideo(file);
        }
        
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        newItems.push({ url: file_url, type: isVideo ? "video" : "image", caption: "" });
      }
      onChange([...items, ...newItems]);
    } catch (err) {
      setError(err.toString());
      setTimeout(() => setError(null), 4000);
    } finally {
      setUploading(false);
    }
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

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
          {error}
        </div>
      )}
      <p className="text-xs text-neutral-400">
        Upload photos or short videos of your work. Videos should be under 60 seconds. Max {MAX_ITEMS} items.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item, i) => {
          const isFeatured = featuredItemId === item.url;
          return (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100 group">
              {item.type === "video" ? (
                <div className="w-full h-full relative bg-neutral-900">
                  <video src={item.url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              )}
              {isFeatured && (
                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[9px] font-semibold">
                  Featured
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <button
                onClick={() => handleRemove(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="w-3 h-3" />
              </button>
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
          <label className="aspect-square rounded-xl border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
            {uploading ? (
              <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
            ) : (
              <>
                <Plus className="w-6 h-6 text-neutral-400" />
                <span className="text-[10px] text-neutral-400 mt-1">Add</span>
              </>
            )}
            <input 
              type="file" 
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" 
              multiple 
              onChange={handleUpload} 
              className="hidden" 
              disabled={uploading || items.length >= MAX_ITEMS} 
            />
          </label>
        )}
      </div>
    </div>
  );
}