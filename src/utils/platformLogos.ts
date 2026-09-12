export interface PlatformInfo {
  name: string;
  logo: string;
  domainName: string;
}

/**
 * ============================================================================
 * MAPA DE LOGOS DAS PLATAFORMAS DE STREAMING E SITES OFICIAIS
 * ============================================================================
 * 
 * Para alterar ou adicionar a logo de uma plataforma (ex: Crunchyroll, Netflix, Disney+):
 * - Altere o valor de `logo` para a URL desejada (pode ser um link http/https ou caminho local em public/logos/).
 */
const PLATFORM_MAP: Record<string, { name: string; logo: string }> = {
  anidb: { name: 'AniDB', logo: '/logos/anidb.png' },
  mal: { name: 'MyAnimeList', logo: '/logos/myanimelist.png' },
  myanimelist: { name: 'MyAnimeList', logo: '/logos/myanimelist.png' },
  crunchyroll: { name: 'Crunchyroll', logo: '/logos/crunchyroll.png' },
  netflix: { name: 'Netflix', logo: '/logos/netflix.svg' },
  disney: { name: 'Disney+', logo: '/logos/disneyplus.svg' },
  'disney+': { name: 'Disney+', logo: '/logos/disneyplus.svg' },
  'disney plus': { name: 'Disney+', logo: '/logos/disneyplus.svg' },
  hbo: { name: 'Max', logo: '/logos/max.svg' },
  max: { name: 'Max', logo: '/logos/max.svg' },
  'hbo max': { name: 'Max', logo: '/logos/max.svg' },
  amazon: { name: 'Prime Video', logo: '/logos/primevideo.svg' },
  'prime video': { name: 'Prime Video', logo: '/logos/primevideo.svg' },
  'amazon prime video': { name: 'Prime Video', logo: '/logos/primevideo.svg' },
  anilist: { name: 'AniList', logo: '/logos/anilist.svg' },
  bilibili: {
    name: 'Bilibili',
    logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/2/22/Bilibili_logo.svg&w=128&fit=contain',
  },
  hulu: {
    name: 'Hulu',
    logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg&w=128&fit=contain',
  },
  hidive: {
    name: 'HIDIVE',
    logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/0/01/HIDIVE_logo.svg&w=128&fit=contain',
  },
  iqiyi: {
    name: 'iQIYI',
    logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/a/a2/IQiYi_logo.svg&w=128&fit=contain',
  },
  youtube: {
    name: 'YouTube',
    logo: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg&w=128&fit=contain',
  },
};

export function getPlatformInfo(siteOrType: string): PlatformInfo {
  const normalized = (siteOrType || '').toLowerCase().trim();

  for (const [key, val] of Object.entries(PLATFORM_MAP)) {
    if (normalized === key || normalized.includes(key)) {
      return {
        name: val.name,
        logo: val.logo,
        domainName: val.name,
      };
    }
  }

  // Fallback dinâmico usando o serviço de favicons do Google para qualquer site desconhecido
  const domain = normalized.includes('.') ? normalized : `${normalized.replace(/\s+/g, '')}.com`;
  return {
    name: siteOrType || 'Link Oficial',
    logo: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    domainName: siteOrType || 'Link Oficial',
  };
}
