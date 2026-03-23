import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Video player supporting MOV and MP4 formats
 * Routes external videos through proxy function to avoid CORS issues
 */
export default function HlsVideoPlayer({ item, className = "", poster }) {
  const videoRef = useRef(null);
  const [proxiedUrl, setProxiedUrl] = useState(null);

  const movUrl = item?.mux_mov_url;
  const mp4Url = item?.mux_mp4_url;
  const hlsUrl = item?.mux_playback_url;
  const fallbackUrl = item?.url;

  useEffect(() => {
    const setupVideo = async () => {
      let sourceUrl = null;

      // Priority: MP4 → MOV → HLS → fallback
      if (mp4Url) {
        sourceUrl = mp4Url;
      } else if (movUrl) {
        sourceUrl = movUrl;
      } else if (hlsUrl) {
        sourceUrl = hlsUrl;
      } else if (fallbackUrl) {
        sourceUrl = fallbackUrl;
      }

      if (!sourceUrl) return;

      // Use direct URL - sandbox should handle it now
      setProxiedUrl(sourceUrl);
    };

    setupVideo();
  }, [movUrl, mp4Url, hlsUrl, fallbackUrl]);

  return (
    <video
      ref={videoRef}
      poster={poster || item?.thumbnail_url}
      controls
      playsInline
      preload="metadata"
      className={className}
    >
      {proxiedUrl && (
        <>
          {proxiedUrl.includes(".mp4") && <source src={proxiedUrl} type="video/mp4" />}
          {proxiedUrl.includes(".mov") && <source src={proxiedUrl} type="video/quicktime" />}
          {proxiedUrl.includes(".m3u8") && <source src={proxiedUrl} type="application/x-mpegURL" />}
          {!proxiedUrl.includes(".mp4") && !proxiedUrl.includes(".mov") && !proxiedUrl.includes(".m3u8") && (
            <source src={proxiedUrl} type="video/mp4" />
          )}
        </>
      )}
      Your browser does not support the video tag.
    </video>
  );
}