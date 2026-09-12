import React, { useMemo, useState, useEffect } from 'react';
import { BACKGROUND_CONFIG } from '../config/backgroundConfig';

interface DiagonalPosterBackgroundProps {
  posters?: string[];
  opacity?: number;
}

export const DiagonalPosterBackground: React.FC<DiagonalPosterBackgroundProps> = ({
  posters,
  opacity,
}) => {
  // Check if screen is mobile to completely avoid mounting heavy DOM elements / animation loop
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktop(e.matches);
    };

    handleMediaChange(mediaQuery);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
      return () => mediaQuery.removeEventListener('change', handleMediaChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleMediaChange);
      return () => mediaQuery.removeListener(handleMediaChange);
    }
  }, []);

  const config = BACKGROUND_CONFIG;
  const isEnabled = config.enabled;

  // Selected mode
  const mode = config.mode;
  const customImageUrl = config.customImageUrl;

  // Resolved posters list
  const posterList = useMemo(() => {
    if (mode === 'custom-posters' && config.customPostersList.length > 0) {
      const customValid = config.customPostersList.filter(
        (p): p is string => Boolean(p && typeof p === 'string' && p.trim().length > 0)
      );
      if (customValid.length > 0) {
        const repeated: string[] = [];
        while (repeated.length < 48) {
          repeated.push(...customValid);
        }
        return repeated.slice(0, 48);
      }
    }

    const valid = (posters || []).filter(
      (p): p is string => Boolean(p && typeof p === 'string' && p.trim().length > 0)
    );
    const list = valid.length > 0 ? valid : config.customPostersList;

    // Repeat list to make a dense, unbroken collage
    const targetCount = 48;
    const repeated: string[] = [];
    while (repeated.length < targetCount) {
      repeated.push(...list);
    }
    return repeated.slice(0, targetCount);
  }, [posters, mode, config.customPostersList]);

  // If globally disabled, return minimal dark canvas
  if (!isEnabled) {
    return (
      <div
        id="app-background-container"
        className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#070b12]"
        aria-hidden="true"
      />
    );
  }

  // Active desktop opacity
  const resolvedOpacity = opacity !== undefined ? opacity : config.desktopOpacity;
  const animationDuration = `${config.animationDurationSeconds || 65}s`;

  return (
    <div
      id="app-background-container"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#070b12]"
      aria-hidden="true"
    >
      {/* 
        ========================================================================
        MOBILE VIEW (< 768px):
        Completely disables heavy images and animation calculations for ultra-fast,
        battery-friendly mobile performance.
        ========================================================================
      */}
      <div className="md:hidden absolute inset-0 bg-gradient-to-b from-[#090e17] via-[#070b12] to-[#05070c]" />

      {/* 
        ========================================================================
        DESKTOP / TABLET VIEW (>= 768px):
        Displays the rich background with heightened visibility and smooth motion.
        ========================================================================
      */}
      {isDesktop && (
        <div className="hidden md:block absolute inset-0 overflow-hidden">
          {mode === 'custom-image' && customImageUrl ? (
            /* MODE: Single Custom Image / Wallpaper */
            <div
              className="absolute inset-0 w-full h-full select-none"
              style={{ opacity: resolvedOpacity }}
            >
              <img
                src={customImageUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center filter brightness-[0.95] contrast-[1.05] animate-subtle-drift"
              />
            </div>
          ) : (
            /* MODE: Dynamic Diagonal Poster Wall Collage */
            <div
              className="absolute -top-[55%] -left-[55%] w-[250%] h-[250%] animate-diagonal-seamless select-none"
              style={{
                opacity: resolvedOpacity,
                animationDuration: animationDuration,
              }}
            >
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 p-2 w-full h-full rotate-[-12deg] transform-gpu">
                {posterList.concat(posterList).map((url, idx) => (
                  <div
                    key={`bg-poster-${idx}`}
                    className="relative aspect-[2/3] w-full overflow-hidden bg-[#0c1017] shadow-md rounded-[4px] border border-white/5"
                  >
                    {url ? (
                      <img
                        src={url}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover filter brightness-[0.92] contrast-[1.12] saturate-[1.05] transition-all"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 
            Harmonized Vignette Overlays:
            Tuned to allow the artwork and animation to shine through clearly
            while preserving crisp contrast for foreground texts and UI cards.
          */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-[#070b12]/55 via-[#070b12]/70 to-[#070b12]/92 pointer-events-none"
            style={{ opacity: config.vignetteIntensity }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(15,23,42,0.4)_0%,rgba(7,11,18,0.85)_80%)] pointer-events-none" />
        </div>
      )}
    </div>
  );
};

