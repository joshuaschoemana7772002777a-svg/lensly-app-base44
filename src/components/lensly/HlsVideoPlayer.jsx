import React, { useRef } from "react";

/**
 * Video player supporting MOV and MP4 formats
 */
export default function HlsVideoPlayer({ item, className = "", poster }) {
  const videoRef = useRef(null);

  const movUrl = item?.mux_mov_url;
  const mp4Url = item?.mux_mp4_url;
  const hlsUrl = item?.mux_playback_url;
  const fallbackUrl = item?.url;

  return (
    <video
      ref={videoRef}
      poster={poster || item?.thumbnail_url}
      controls
      playsInline
      preload="metadata"
      className={className}
    >
      {movUrl && <source src={movUrl} type="video/quicktime" />}
      {mp4Url && <source src={mp4Url} type="video/mp4" />}
      {hlsUrl && <source src={hlsUrl} type="application/x-mpegURL" />}
      {fallbackUrl && <source src={fallbackUrl} type="video/mp4" />}
    </video>
  );
}