import React from 'react';

interface PaperTextureOverlayProps {
  className?: string;
  opacity?: number;
}

/**
 * Reusable authentic newspaper paper texture overlay
 * Features fractal noise grain fibers and subtle cross-hatch paper texture
 */
export const PaperTextureOverlay: React.FC<PaperTextureOverlayProps> = ({
  className = '',
  opacity = 0.16,
}) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none rounded-[inherit] overflow-hidden select-none z-[1] ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* SVG Noise filter generating authentic paper fibers and print grain */}
      <svg className="w-full h-full object-cover" xmlns="http://www.w3.org/2000/svg">
        <filter id="paper-noise-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.16  0 0 0 0 0.13  0 0 0 0 0.08  0 0 0 1 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#paper-noise-filter)" />
      </svg>

      {/* Subtle fine paper fibers and woven texture */}
      <div
        className="absolute inset-0 mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(#3c3226 0.75px, transparent 0.75px),
            repeating-linear-gradient(45deg, rgba(40,30,20,0.03) 0px, rgba(40,30,20,0.03) 1px, transparent 1px, transparent 3px)
          `,
          backgroundSize: '12px 12px, 6px 6px',
        }}
      />
    </div>
  );
};
