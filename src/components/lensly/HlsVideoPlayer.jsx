import React, { useEffect, useRef, useState } from "react";
import HLS from "hls.js";

export default function HlsVideoPlayer({ item, className = "", poster }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [error, setError] = useState(null);

  const hlsUrl = item?.mux_playback_url;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) {
      console.log("[HLS] No video ref or URL:", { hasRef: !!video, hasUrl: !!hlsUrl });
      return;
    }

    console.log("[HLS] Loading URL:", hlsUrl);

    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (HLS.isSupported()) {
      const hls = new HLS({
        enableWorker: true,
        xhrSetup: (xhr, url) => {
          xhr.withCredentials = false;
        },
      });
      hlsRef.current = hls;

      hls.on(HLS.Events.MANIFEST_PARSED, () => {
        console.log("[HLS] Manifest loaded successfully");
        setError(null);
        video.play().catch((e) => console.error("[HLS] Play failed:", e));
      });

      hls.on(HLS.Events.ERROR, (event, data) => {
        console.error("[HLS] Error event:", data);
        if (data.fatal) {
          setError(`HLS Error: ${data.type}`);
        }
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      console.log("[HLS] Using native Safari HLS");
      video.src = hlsUrl;
    } else {
      setError("HLS not supported on this browser");
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl]);

  return (
    <>
      {error && <div className="text-red-500 text-sm p-2">{error}</div>}
      <video
        ref={videoRef}
        poster={poster || item?.thumbnail_url}
        controls
        playsInline
        preload="metadata"
        className={className}
        onError={(e) => {
          console.error("[VIDEO] Error:", e.target.error);
          setError(`Video Error: ${e.target.error?.message}`);
        }}
      />
    </>
  );
}