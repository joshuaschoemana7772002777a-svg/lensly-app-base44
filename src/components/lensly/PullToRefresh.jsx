import React, { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * PullToRefresh
 * Wrap the scrollable page content with this component.
 * onRefresh: async function to call when pull is triggered.
 */
export default function PullToRefresh({ children, onRefresh }) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(null);
  const containerRef = useRef(null);
  const THRESHOLD = 70;

  const getScrollContainer = () => document.getElementById("root") || window;

  const getScrollTop = () => {
    const el = document.getElementById("root");
    return el ? el.scrollTop : window.scrollY;
  };

  const handleTouchStart = (e) => {
    if (getScrollTop() > 0) return;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (startY.current === null) return;
    if (getScrollTop() > 0) { startY.current = null; return; }
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) { setPullDistance(0); return; }
    // Resist pull — logarithmic feel
    const resistance = Math.min(delta * 0.45, THRESHOLD + 20);
    setPullDistance(resistance);
    setPulling(resistance >= THRESHOLD);
  };

  const handleTouchEnd = async () => {
    if (pulling) {
      setRefreshing(true);
      setPullDistance(0);
      setPulling(false);
      startY.current = null;
      await onRefresh();
      setRefreshing(false);
    } else {
      setPullDistance(0);
      setPulling(false);
      startY.current = null;
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: "relative" }}
    >
      {/* Pull indicator */}
      <div
        style={{
          height: refreshing ? 48 : pullDistance > 0 ? Math.min(pullDistance, 60) : 0,
          overflow: "hidden",
          transition: pullDistance > 0 ? "none" : "height 0.25s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2
          className={`w-5 h-5 text-blue-500 transition-transform duration-200 ${
            refreshing || pulling ? "animate-spin" : ""
          }`}
          style={{
            opacity: refreshing ? 1 : Math.min(pullDistance / THRESHOLD, 1),
            transform: `rotate(${(pullDistance / THRESHOLD) * 180}deg)`,
          }}
        />
      </div>
      {children}
    </div>
  );
}