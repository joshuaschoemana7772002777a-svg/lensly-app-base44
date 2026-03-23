import React, { useEffect, useRef } from "react";

/**
 * Video player that prefers MP4 (most compatible with sandboxes and all browsers)
 */
export default function HlsVideoPlayer({ item, className = "", poster }) {
  const videoRef = useRef(null);

  const mp4Url = item?.mux_mp4_url;
  const hlsUrl = item?.mux_playback_url;
  const fallbackUrl = item?.url;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Priority: MP4 (most compatible) → HLS → fallback
    if (mp4Url) {
      video.src = mp4Url;
    } else if (hlsUrl) {
      video.src = hlsUrl;
    } else if (fallbackUrl) {
      video.src = fallbackUrl;
    }
  }, [mp4Url, hlsUrl, fallbackUrl]);

  return (
    <video
      ref={videoRef}
      poster={poster || item?.thumbnail_url}
      controls
      playsInline
      preload="metadata"
      className={className}
    />
  );
}