import React from 'react';
import { Season } from '../types';

export interface AnimeGuidesLogoProps {
  season?: Season | null;
  className?: string;
  size?: number | string;
  glow?: boolean;
}

/**
 * ============================================================================
 * CAMINHOS DAS LOGOS DO SITE (VARIATION POR TEMPORADA OU BASE)
 * ============================================================================
 * 
 * Para personalizar a logo principal da aplicação:
 * - Substitua os arquivos na pasta `public/logos/` (ex: logo-base.png)
 * - Ou altere os links na constante `SEASON_LOGO_PATHS` abaixo por qualquer URL externa.
 */
export const SEASON_LOGO_PATHS: Record<string, string> = {
  BASE: '/logos/logo-base.png',
  WINTER: '/logos/logo-winter.png',
  SPRING: '/logos/logo-spring.png',
  SUMMER: '/logos/logo-summer.png',
  FALL: '/logos/logo-fall.png',
};

export const AnimeGuidesLogo: React.FC<AnimeGuidesLogoProps> = ({
  season,
  className = 'w-8 h-8',
  size,
  glow = true,
}) => {
  // Determine which seasonal variant to display
  const key = season ? season.toUpperCase() : 'BASE';
  const logoSrc = SEASON_LOGO_PATHS[key] || SEASON_LOGO_PATHS.BASE;

  // Seasonal glow color for subtle aura
  const glowShadow = season === 'WINTER'
    ? '0 0 16px rgba(0, 229, 255, 0.4)'
    : season === 'SPRING'
    ? '0 0 16px rgba(236, 72, 153, 0.4)'
    : season === 'SUMMER'
    ? '0 0 16px rgba(245, 158, 11, 0.4)'
    : season === 'FALL'
    ? '0 0 16px rgba(234, 88, 12, 0.4)'
    : '0 0 16px rgba(168, 85, 247, 0.4)';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 transition-all duration-300 ${className}`}
      style={{
        width: size,
        height: size,
        filter: glow ? `drop-shadow(${glowShadow})` : undefined,
      }}
    >
      <img
        src={logoSrc}
        alt={`AnimeGuides Logo ${season || 'Original'}`}
        className="w-full h-full object-contain select-none filter drop-shadow-md hover:scale-105 transition-transform duration-200"
        referrerPolicy="no-referrer"
        draggable={false}
      />
    </div>
  );
};
