import React, { useState, useRef, useEffect } from 'react';
import { Moment, Idea } from '../types';
import { LayoutGrid, X, Download } from 'lucide-react';

interface CollageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  moments: Moment[];
  ideas: Idea[];
}

export const CollageGeneratorModal: React.FC<CollageGeneratorModalProps> = ({
  isOpen,
  onClose,
  moments,
  ideas,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [collageTitle, setCollageTitle] = useState('TEDxAkure 2026');
  const [subtitle, setSubtitle] = useState('50 Connections • Unforgettable Momentum');
  const [selectedPhotoUrls, setSelectedPhotoUrls] = useState<string[]>([]);
  const [accentColor, setAccentColor] = useState('#FF5C00');
  const [layoutStyle, setLayoutStyle] = useState<'grid4' | 'trio3' | 'hero2'>('grid4');
  const [isRendering, setIsRendering] = useState(false);

  const availablePhotos = moments.filter((m) => m.mediaUrl && m.type === 'photo');

  useEffect(() => {
    if (availablePhotos.length > 0 && selectedPhotoUrls.length === 0) {
      setSelectedPhotoUrls(availablePhotos.slice(0, 4).map((m) => m.mediaUrl));
    }
  }, [availablePhotos, selectedPhotoUrls]);

  useEffect(() => {
    if (isOpen) {
      renderCollage();
    }
  }, [isOpen, collageTitle, subtitle, selectedPhotoUrls, accentColor, layoutStyle]);

  const togglePhotoSelection = (url: string) => {
    if (selectedPhotoUrls.includes(url)) {
      setSelectedPhotoUrls(selectedPhotoUrls.filter((u) => u !== url));
    } else {
      if (selectedPhotoUrls.length < 4) {
        setSelectedPhotoUrls([...selectedPhotoUrls, url]);
      }
    }
  };

  const renderCollage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsRendering(true);

    const width = 1080;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;

    // Dark OLED Background
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(0, 0, width, height);

    // Subtle Grid / Accent border
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Header Branding
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 36px serif';
    ctx.fillText('MOMENTUM', 60, 95);

    ctx.fillStyle = '#FADCD2';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(collageTitle, 60, 135);

    ctx.fillStyle = 'rgba(240, 220, 210, 0.7)';
    ctx.font = '16px sans-serif';
    ctx.fillText(subtitle, 60, 165);

    // Render selected images
    const loadImg = (url: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
          // Placeholder if failed
          const placeholder = new Image();
          resolve(placeholder);
        };
        img.src = url;
      });
    };

    const loadedImages = await Promise.all(selectedPhotoUrls.map((url) => loadImg(url)));

    if (layoutStyle === 'grid4') {
      const imgSize = 440;
      const positions = [
        { x: 60, y: 200 },
        { x: 580, y: 200 },
        { x: 60, y: 580 },
        { x: 580, y: 580 },
      ];

      loadedImages.slice(0, 4).forEach((img, idx) => {
        const pos = positions[idx];
        if (pos && img.width > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(pos.x, pos.y, imgSize, 340, 16);
          ctx.clip();
          ctx.drawImage(img, pos.x, pos.y, imgSize, 340);
          ctx.restore();

          // Border
          ctx.strokeStyle = 'rgba(255, 92, 0, 0.3)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    } else if (layoutStyle === 'trio3') {
      // 1 Top Large, 2 Bottom
      if (loadedImages[0] && loadedImages[0].width > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(60, 200, 960, 400, 16);
        ctx.clip();
        ctx.drawImage(loadedImages[0], 60, 200, 960, 400);
        ctx.restore();
      }
      if (loadedImages[1] && loadedImages[1].width > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(60, 630, 465, 300, 16);
        ctx.clip();
        ctx.drawImage(loadedImages[1], 60, 630, 465, 300);
        ctx.restore();
      }
      if (loadedImages[2] && loadedImages[2].width > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(555, 630, 465, 300, 16);
        ctx.clip();
        ctx.drawImage(loadedImages[2], 555, 630, 465, 300);
        ctx.restore();
      }
    } else {
      // Hero 2 Vertical split
      const heroWidth = 465;
      if (loadedImages[0] && loadedImages[0].width > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(60, 200, heroWidth, 740, 16);
        ctx.clip();
        ctx.drawImage(loadedImages[0], 60, 200, heroWidth, 740);
        ctx.restore();
      }
      if (loadedImages[1] && loadedImages[1].width > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(555, 200, heroWidth, 740, 16);
        ctx.clip();
        ctx.drawImage(loadedImages[1], 555, 200, heroWidth, 740);
        ctx.restore();
      }
    }

    // Footer Watermark
    ctx.fillStyle = '#FF5C00';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('TEDxAkure 2026 • Curated with Momentum OS', 60, 1030);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '14px sans-serif';
    ctx.fillText('x.com/tedxakure', 900, 1030);

    setIsRendering(false);
  };

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `TEDxAkure2026_Collage_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png', 0.95);
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div
        className="bg-[#140b07] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#20110a] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-[#FF5C00]" />
            <h2 className="text-base font-bold font-serif-display text-[#fadcd2]">
              Photo Collage Studio
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Canvas Live Preview */}
          <div className="flex justify-center bg-black/60 p-3 rounded-2xl border border-white/10">
            <canvas
              ref={canvasRef}
              className="max-h-[340px] w-auto rounded-xl shadow-2xl border border-white/10"
            />
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#e4beb1] mb-1">Headline</label>
              <input
                type="text"
                value={collageTitle}
                onChange={(e) => setCollageTitle(e.target.value)}
                className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#fadcd2] focus:border-[#FF5C00]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#e4beb1] mb-1">Subtitle</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full bg-[#0d0603] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#fadcd2] focus:border-[#FF5C00]"
              />
            </div>
          </div>

          {/* Layout Style Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#e4beb1] mb-1.5">
              Layout Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'grid4', label: '2x2 Grid' },
                { id: 'trio3', label: 'Trio Magazine' },
                { id: 'hero2', label: 'Twin Portals' },
              ].map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => setLayoutStyle(layout.id as any)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    layoutStyle === layout.id
                      ? 'bg-[#FF5C00] text-black shadow-md'
                      : 'bg-[#20100a] text-[#e4beb1]/70 hover:text-white border border-white/5'
                  }`}
                >
                  {layout.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pick Photos */}
          <div>
            <label className="block text-xs font-semibold text-[#e4beb1] mb-1.5">
              Select Photos to Include ({selectedPhotoUrls.length}/4)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {availablePhotos.map((m) => (
                <div
                  key={m.id}
                  onClick={() => togglePhotoSelection(m.mediaUrl)}
                  className={`h-16 rounded-xl overflow-hidden cursor-pointer border-2 relative ${
                    selectedPhotoUrls.includes(m.mediaUrl)
                      ? 'border-[#FF5C00] scale-95 shadow-md'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={m.mediaUrl} alt={m.title} className="w-full h-full object-cover" />
                  {selectedPhotoUrls.includes(m.mediaUrl) && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#FF5C00] text-black flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#1e100a] border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="w-1/3 py-2.5 rounded-xl border border-white/15 text-[#fadcd2] text-xs font-semibold hover:bg-white/5"
          >
            Close
          </button>
          <button
            onClick={handleDownloadImage}
            disabled={isRendering}
            className="flex-1 py-2.5 rounded-xl bg-[#FF5C00] text-black font-bold text-xs hover:bg-[#ff7a33] flex items-center justify-center gap-2 shadow-lg"
          >
            <Download className="w-4 h-4" />
            Download Collage (PNG)
          </button>
        </div>
      </div>
    </div>
  );
};
