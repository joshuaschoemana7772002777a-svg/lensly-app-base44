import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2, Image as ImageIcon, Video } from "lucide-react";

export default function PortfolioUploader({ items = [], onChange, featuredItemId, onFeaturedChange }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const newItems = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const isVideo = file.type.startsWith("video/");
      newItems.push({ url: file_url, type: isVideo ? "video" : "image", caption: "" });
    }
    onChange([...items, ...newItems]);
    setUploading(false);
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
      <div className="grid grid-cols-3 gap-3">
        {items.map((item, i) => {
          const isFeatured = featuredItemId === item.url;
          return (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100 group">
              {item.type === "video" ? (
                <div className="w-full h-full flex items-center justify-center bg-neutral-200">
                  <Video className="w-8 h-8 text-neutral-400" />
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
        <label className="aspect-square rounded-xl border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition-colors">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
          ) : (
            <>
              <Plus className="w-6 h-6 text-neutral-400" />
              <span className="text-[10px] text-neutral-400 mt-1">Add</span>
            </>
          )}
          <input type="file" accept="image/*,video/*" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>
    </div>
  );
}