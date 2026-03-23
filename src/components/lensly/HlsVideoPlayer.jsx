import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

/**
 * HLS-aware video player.
 * - Safari: uses native HLS support (src = .m3u8)
 * - Chrome/Android: uses HLS.js to load the HLS stream
 * - Falls back to mp4_url if HLS is unavailable
 */
export default function HlsVideoPlayer({ item, className = "", poster }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const hlsUrl = item?.mux_playback_url; // .m3u8
  const mp4Url = item?.mux_mp4_url;
  const fallbackUrl = item?.url;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Destroy any previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (hlsUrl) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari — native HLS
        video.src = hlsUrl;
      } else if (Hls.isSupported()) {
        // Chrome, Firefox, Android — HLS.js
        const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.warn("HLS error:", data);
          // Fallback to MP4 on HLS error
          if (data.fatal && mp4Url) {
            video.src = mp4Url;
          }
        });
        
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        hlsRef.current = hls;
      } else if (mp4Url) {
        // Last resort: direct MP4
        video.src = mp4Url;
      } else {
        video.src = fallbackUrl || "";
      }
    } else if (mp4Url) {
      video.src = mp4Url;
    } else {
      video.src = fallbackUrl || "";
    }

    // Fallback for video load errors
    const handleError = () => {
      if (mp4Url && video.src !== mp4Url) {
        console.log("Video load failed, trying MP4 fallback");
        video.src = mp4Url;
      }
    };
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("error", handleError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl, mp4Url, fallbackUrl]);

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