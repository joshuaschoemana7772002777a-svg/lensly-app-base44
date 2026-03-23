import React, { useEffect, useRef } from "react";

/**
 * Video player for Mux URLs (MP4 format)
 * Mux URLs from mux_mp4_url are direct MP4 streams
 */
export default function HlsVideoPlayer({ item, className = "", poster }) {
  const videoRef = useRef(null);

  const mp4Url = item?.mux_mp4_url;
  const hlsUrl = item?.mux_playback_url;
  const fallbackUrl = item?.url;

  // Priority: MP4 → HLS → fallback
  const videoUrl = mp4Url || hlsUrl || fallbackUrl;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    // Clear existing sources
    video.innerHTML = "";

    // Determine MIME type based on URL pattern
    let mimeType = "video/mp4"; // default
    if (videoUrl.includes(".m3u8") || videoUrl.includes("hls")) {
      mimeType = "application/x-mpegURL";
    } else if (videoUrl.includes(".mov")) {
      mimeType = "video/quicktime";
    }

    const source = document.createElement("source");
    source.src = videoUrl;
    source.type = mimeType;
    video.appendChild(source);
  }, [videoUrl]);

  return (
    <video
      ref={videoRef}
      poster={poster || item?.thumbnail_url}
      controls
      playsInline
      preload="metadata"
      className={className}
    >
      Your browser does not support the video tag.
    </video>
  );
}