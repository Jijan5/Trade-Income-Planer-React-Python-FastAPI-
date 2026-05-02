import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

// Helper to create an image element from a URL
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid CORS issues on some browsers
    image.src = url;
  });

// Helper to get a cropped image blob
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.95);
  });
}

const ImageCropModal = ({ file, onApply, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Generate an object URL for the cropper to use
  const [imageSrc] = useState(() => URL.createObjectURL(file));

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApply = async () => {
    // If it's a GIF, pass it through directly to preserve animation
    if (file.type === 'image/gif') {
      onApply(file, imageSrc);
      return;
    }

    try {
      setIsProcessing(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const croppedUrl = URL.createObjectURL(croppedBlob);
      // Create a File object from the blob so it works with FormData like a regular file
      const croppedFile = new File([croppedBlob], `cropped-${file.name}`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
      onApply(croppedFile, croppedUrl);
    } catch (e) {
      console.error('Crop failed', e);
      // Fallback
      onApply(file, imageSrc);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-engine-bg/95 backdrop-blur-md p-4">
      <div className="bg-engine-panel border border-engine-neon/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(var(--engine-neon-rgb),0.2)] max-w-lg w-full">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-engine-neon">✂️</span> Crop Avatar
        </h3>

        {file.type === 'image/gif' ? (
          <div className="text-center py-8">
            <p className="text-gray-300 text-sm mb-4">
              GIFs cannot be cropped to preserve animation.
            </p>
            <img src={imageSrc} alt="Preview" className="w-32 h-32 rounded-full object-cover mx-auto border-2 border-engine-neon/50 shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.2)]" />
          </div>
        ) : (
          <>
            <div className="relative w-full h-[300px] bg-black/50 rounded-xl overflow-hidden mb-6">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="mb-6">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                Zoom
              </label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(e.target.value)}
                className="w-full accent-engine-neon"
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-engine-neon/10">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="px-5 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isProcessing}
            className="bg-engine-button text-engine-bg px-6 py-2 rounded-xl text-sm font-extrabold hover:bg-[#00e5ff] hover:shadow-[0_0_15px_rgba(var(--engine-neon-rgb),0.4)] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Apply Image'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
