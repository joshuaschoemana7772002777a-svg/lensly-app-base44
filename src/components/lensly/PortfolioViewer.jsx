import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import HlsVideoPlayer from "./HlsVideoPlayer";

export default function PortfolioViewer({ 
  isOpen, 
  onClose, 
  portfolio, 
  initialIndex = 0 
}) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setActiveIndex(initialIndex);
    setIsPlaying(false);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && activeIndex > 0) setActiveIndex(activeIndex - 1);
      if (e.key === "ArrowRight" && activeIndex < portfolio.length - 1) setActiveIndex(activeIndex + 1);
    };

    const handleWheel = (e) => {
      e.preventDefault();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    document.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
      document.removeEventListener("wheel", handleWheel);
    };
  }, [isOpen, activeIndex, portfolio.length, onClose]);

  if (!isOpen || !portfolio || portfolio.length === 0) return null;

  const currentItem = portfolio[activeIndex];
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < portfolio.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Counter */}
        <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
          <span className="text-sm font-medium text-white">
            {activeIndex + 1} / {portfolio.length}
          </span>
        </div>

        {/* Previous Button */}
        {canGoPrev && (
          <button
            onClick={() => setActiveIndex(activeIndex - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition hidden md:flex"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Next Button */}
        {canGoNext && (
          <button
            onClick={() => setActiveIndex(activeIndex + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition hidden md:flex"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Media Display */}
        <div className="w-full h-full flex items-center justify-center p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="max-w-full max-h-full"
            >
              {currentItem.type === "video" ? (
                <div className="relative">
                  <video
                    src={currentItem.mux_mp4_url || currentItem.mux_playback_url || currentItem.url}
                    poster={currentItem.thumbnail_url}
                    controls
                    playsInline
                    className="max-w-full max-h-[90vh] rounded-lg"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                </div>
              ) : (
                <img
                  src={currentItem.url}
                  alt={currentItem.caption || ""}
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Swipe Area for Mobile */}
        <div
          className="absolute inset-0 md:hidden"
          onTouchStart={(e) => {
            const touchStart = e.touches[0].clientX;
            const handleTouchEnd = (endEvent) => {
              const touchEnd = endEvent.changedTouches[0].clientX;
              const diff = touchStart - touchEnd;
              if (Math.abs(diff) > 50) {
                if (diff > 0 && canGoNext) setActiveIndex(activeIndex + 1);
                if (diff < 0 && canGoPrev) setActiveIndex(activeIndex - 1);
              }
              document.removeEventListener("touchend", handleTouchEnd);
            };
            document.addEventListener("touchend", handleTouchEnd);
          }}
        />

        {/* Caption (if exists) */}
        {currentItem.caption && (
          <div className="absolute bottom-4 left-4 right-4 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
            <p className="text-sm text-white text-center">{currentItem.caption}</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}