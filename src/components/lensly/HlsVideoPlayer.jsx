import React, { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Video player supporting MOV and MP4 formats
 * Routes external videos through proxy function to avoid CORS issues
 */
export default function HlsVideoPlayer({ item, className = "", poster }) {
  const videoRef = useRef(null);
  const [proxiedUrl, setProxiedUrl] = React.useState(null);

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

      // Route through proxy function to avoid CORS issues
      try {
        const result = await base44.functions.invoke("videoProxy", { url: sourceUrl });
        setProxiedUrl(result.data?.proxied_url || sourceUrl);
      } catch {
        // Fallback to direct URL if proxy fails
        setProxiedUrl(sourceUrl);
      }
    };

    setupVideo();
  }, [movUrl, mp4Url, hlsUrl, fallbackUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !proxiedUrl) return;
    video.src = proxiedUrl;
  }, [proxiedUrl]);

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