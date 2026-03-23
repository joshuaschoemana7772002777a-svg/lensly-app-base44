import React, { useEffect, useRef } from "react";

/**
 * Video player supporting MOV and MP4 formats
 */
export default function HlsVideoPlayer({ item, className = "", poster }) {
  const videoRef = useRef(null);

  const movUrl = item?.mux_mov_url;
  const mp4Url = item?.mux_mp4_url;
  const hlsUrl = item?.mux_playback_url;
  const fallbackUrl = item?.url;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Priority: MOV → MP4 → HLS → fallback
    if (movUrl) {
      video.src = movUrl;
      video.type = "video/quicktime";
    } else if (mp4Url) {
      video.src = mp4Url;
      video.type = "video/mp4";
    } else if (hlsUrl) {
      video.src = hlsUrl;
      video.type = "application/x-mpegURL";
    } else if (fallbackUrl) {
      video.src = fallbackUrl;
    }
  }, [movUrl, mp4Url, hlsUrl, fallbackUrl]);

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