import { useEffect } from 'react';
import { Season } from '../types';
import { SEASON_LOGO_PATHS } from '../components/AnimeGuidesLogo';

/**
 * Updates the browser's favicon dynamically based on the active season,
 * or reverts to the base/default logo when on the main folder view.
 */
export function useSeasonalFavicon(season?: Season | null) {
  useEffect(() => {
    const key = season ? season.toUpperCase() : 'BASE';
    const logoUrl = SEASON_LOGO_PATHS[key] || SEASON_LOGO_PATHS.BASE;

    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = `${logoUrl}?v=${Date.now()}`;
  }, [season]);
}
