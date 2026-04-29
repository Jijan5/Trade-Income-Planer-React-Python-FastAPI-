import React, { useState, useRef, useEffect } from 'react';

const FocalPointModal = ({ file, initialFocalPoint = '50% 50%', onApply, onCancel }) => {
  const [focalPoint, setFocalPoint] = useState({ x: 50, y: 50 }); // percentages
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  
  const [imageSrc] = useState(() => URL.createObjectURL(file));

  // Parse initial focal point if it exists
  useEffect(() => {
    if (initialFocalPoint && initialFocalPoint !== 'center') {
      const parts = initialFocalPoint.split(' ');
      if (parts.length === 2) {
        setFocalPoint({
          x: parseFloat(parts[0]) || 50,
          y: parseFloat(parts[1]) || 50
        });
      }
    }
  }, [initialFocalPoint]);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    updatePosition(e);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    updatePosition(e);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const updatePosition = (e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate position relative to container
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Clamp between 0 and 100
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));
    
    setFocalPoint({ x, y });
  };

  const handleApply = () => {
    const focalString = `${Math.round(focalPoint.x)}% ${Math.round(focalPoint.y)}%`;
    onApply(file, imageSrc, focalString);
  };

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#030308]/95 backdrop-blur-md p-4"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="bg-[#0a0f1c] border border-[#00cfff]/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(0,207,255,0.2)] max-w-3xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-[#00cfff]">🎯</span> Set Focus Point
          </h3>
          <span className="text-xs font-mono text-[#00cfff] bg-[#00cfff]/10 px-2 py-1 rounded">
            {Math.round(focalPoint.x)}% {Math.round(focalPoint.y)}%
          </span>
        </div>
        
        <p className="text-gray-400 text-sm mb-6">
          Drag the circle to choose which part of the image should always be visible. This ensures your background looks great on both short cards and wide banners.
        </p>

        <div 
          className="relative w-full bg-black/50 rounded-xl overflow-hidden mb-6 border border-white/10 select-none touch-none"
          ref={containerRef}
          onPointerDown={handlePointerDown}
          style={{ 
            // We want to show the full image so they can pick a spot
            aspectRatio: '16/9', // fallback container ratio
            maxHeight: '50vh'
          }}
        >
          {/* We use an img with object-fit contain so they see the whole picture */}
          <img 
            src={imageSrc} 
            alt="Focal preview" 
            className="w-full h-full object-contain pointer-events-none"
          />
          
          {/* Overlay to darken slightly so the dot pops out */}
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />

          {/* The Draggable Dot */}
          <div 
            className="absolute w-8 h-8 -ml-4 -mt-4 border-2 border-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-grab active:cursor-grabbing flex items-center justify-center backdrop-blur-sm"
            style={{ 
              left: `${focalPoint.x}%`, 
              top: `${focalPoint.y}%`,
              backgroundColor: 'rgba(0, 207, 255, 0.4)'
            }}
          >
            <div className="w-1.5 h-1.5 bg-[#00cfff] rounded-full shadow-[0_0_5px_#00cfff]" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#00cfff]/10">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="bg-[#00cfff] text-[#030308] px-6 py-2 rounded-xl text-sm font-extrabold hover:bg-[#00e5ff] hover:shadow-[0_0_15px_rgba(0,207,255,0.4)] transition-all"
          >
            Apply Focus Point
          </button>
        </div>
      </div>
    </div>
  );
};

export default FocalPointModal;
