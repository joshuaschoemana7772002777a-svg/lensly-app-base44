import React, { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, Move } from "lucide-react";

/**
 * Crop system uses NORMALIZED values:
 *   cropX, cropY: 0.0–1.0  (focal point as fraction of image dimensions)
 *   zoom: 1.0–3.0
 *
 * These are stored on the portfolio item and applied via CSS object-position in the grid.
 */

export default function PortfolioCropModal({ open, onClose, imageUrl, onSave, existingCrop }) {
  // focalX/focalY: 0–1, where 0.5/0.5 = center
  const [focalX, setFocalX] = useState(0.5);
  const [focalY, setFocalY] = useState(0.5);
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const containerRef = useRef(null);

  // Initialize from existing crop or default to center
  useEffect(() => {
    if (open) {
      if (existingCrop && existingCrop.focalX !== undefined) {
        setFocalX(existingCrop.focalX);
        setFocalY(existingCrop.focalY);
        setZoom(existingCrop.zoom || 1);
      } else {
        setFocalX(0.5);
        setFocalY(0.5);
        setZoom(1);
      }
    }
  }, [open, imageUrl]);

  const getPointerPos = (e) => {
    if (e.touches) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    const pos = getPointerPos(e);
    setDragging(true);
    setDragStart({ x: pos.x, y: pos.y, fx: focalX, fy: focalY });
  }, [focalX, focalY]);

  const handlePointerMove = useCallback((e) => {
    if (!dragging || !dragStart || !containerRef.current) return;
    const pos = getPointerPos(e);
    const rect = containerRef.current.getBoundingClientRect();
    const dx = (pos.x - dragStart.x) / rect.width;
    const dy = (pos.y - dragStart.y) / rect.height;
    // Dragging right moves focal point left (we're moving the image under the frame)
    const newFX = Math.max(0, Math.min(1, dragStart.fx - dx / zoom));
    const newFY = Math.max(0, Math.min(1, dragStart.fy - dy / zoom));
    setFocalX(newFX);
    setFocalY(newFY);
  }, [dragging, dragStart, zoom]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    setDragStart(null);
  }, []);

  const handleSave = () => {
    onSave({
      focalX,
      focalY,
      zoom,
      version: Date.now(),
    });
    onClose();
  };

  // CSS object-position: convert 0–1 to percentage
  const objPosX = `${focalX * 100}%`;
  const objPosY = `${focalY * 100}%`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Adjust Position</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-neutral-500">
            Drag to reposition the focal point. Use zoom to fill the frame.
          </p>

          {/* Preview Container */}
          <div
            ref={containerRef}
            className="relative w-full aspect-square rounded-xl overflow-hidden bg-neutral-200 select-none"
            style={{ cursor: dragging ? "grabbing" : "grab" }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Crop preview"
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                  objectFit: "cover",
                  objectPosition: `${objPosX} ${objPosY}`,
                  transform: `scale(${zoom})`,
                  transformOrigin: `${objPosX} ${objPosY}`,
                }}
                draggable={false}
              />
            )}

            {/* Grid overlay */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/25" />
              ))}
            </div>
          </div>

          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <ZoomIn className="w-4 h-4" />
              <span>Zoom: {zoom.toFixed(1)}×</span>
            </div>
            <Slider
              value={[zoom]}
              onValueChange={(vals) => setZoom(vals[0])}
              min={1}
              max={3}
              step={0.05}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Move className="w-3 h-3" />
            <span>Drag the image to reposition</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 rounded-xl bg-blue-500 hover:bg-blue-600 text-white">
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}