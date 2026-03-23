import React, { useEffect, useRef } from "react";
import HLS from "hls.js";

export default function HlsVideoPlayer({ item, className = "", poster }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const hlsUrl = item?.mux_playback_url;
  const fallbackUrl = item?.url;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (HLS.isSupported()) {
      const hls = new HLS({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;

      hls.on(HLS.Events.ERROR, (event, data) => {
        console.error("[HLS] Error:", data);
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS support
      video.src = hlsUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl]);

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