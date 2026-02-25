import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, Move } from "lucide-react";

export default function PortfolioCropModal({ open, onClose, imageUrl, onSave, existingCrop }) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (open && imageUrl) {
      const img = new Image();
      img.onload = () => {
        setImgDimensions({ width: img.width, height: img.height });
      };
      img.src = imageUrl;
    }
  }, [open, imageUrl]);
  
  // Load existing crop values when modal opens
  useEffect(() => {
    if (open) {
      if (existingCrop && existingCrop.x !== undefined) {
        setPosition({ x: existingCrop.x, y: existingCrop.y });
        setZoom(existingCrop.zoom || 1);
      } else {
        setPosition({ x: 0, y: 0 });
        setZoom(1);
      }
    }
  }, [open, existingCrop]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e) => {
    if (!dragging) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setDragging(false);
  };

  const handleSave = () => {
    if (!containerRef.current || !imgRef.current) return;
    
    // Save the raw pixel values and zoom - we'll apply them directly on render
    onSave({
      x: position.x,
      y: position.y,
      zoom: zoom,
      version: Date.now() // Cache busting
    });
    
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Adjust Position</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-xs text-neutral-500">
            Drag to reposition and zoom to fit your image in the square thumbnail.
          </p>
          
          {/* Preview Container */}
          <div 
            ref={containerRef}
            className="relative w-full aspect-square rounded-xl overflow-hidden bg-neutral-100 cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Crop preview"
              className="absolute select-none pointer-events-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transformOrigin: 'top left',
                maxWidth: 'none',
                width: 'auto',
                height: 'auto'
              }}
              draggable={false}
            />
            
            {/* Grid overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-white/20" />
                ))}
              </div>
            </div>
          </div>
          
          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <ZoomIn className="w-4 h-4" />
              <span>Zoom</span>
            </div>
            <Slider
              value={[zoom]}
              onValueChange={(values) => setZoom(values[0])}
              min={0.5}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>
          
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Move className="w-3 h-3" />
            <span>Drag the image to reposition</span>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}