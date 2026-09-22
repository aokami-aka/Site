import { AnimeVideo } from '../types';

interface AnimeThemesApiResponse {
  anime?: Array<{
    id: number;
    name: string;
    slug: string;
    images?: Array<{ facet?: string; link?: string }>;
    animethemes?: Array<{
      id: number;
      type: 'OP' | 'ED' | string;
      sequence: number | null;
      slug: string; // e.g. "OP1", "ED2"
      song?: {
        id?: number;
        title?: string;
        artists?: Array<{ id?: number; name: string }>;
      };
      animethemeentries?: Array<{
        id: number;
        version: number | null;
        episodes?: string;
        notes?: string;
        nsfw?: boolean;
        spoiler?: boolean;
        videos?: Array<{
          id: number;
          basename: string;
          filename?: string;
          link: string; // https://v.animethemes.moe/...webm
          resolution?: number;
          nc?: boolean;
          subbed?: boolean;
          lyrics?: boolean;
          uncen?: boolean;
          overlap?: string;
          tags?: string;
          source?: string;
          audio?: {
            id: number;
            basename?: string;
            filename?: string;
            link: string;
          };
        }>;
      }>;
    }>;
  }>;
}

const memoryThemesCache = new Map<string, AnimeVideo[]>();

/**
 * Formats display label without version (since version is displayed on bottom-right):
 * - "Abertura 1", "Abertura 2"
 * - "Encerramento 1", "Encerramento 2"
 */
function formatThemeDisplayLabel(
  type: string,
  sequence: number | null,
  slug: string
): string {
  const isOp = type === 'OP';
  const prefix = isOp ? 'Abertura' : 'Encerramento';
  const seqNum = sequence || (slug.match(/\d+/) ? parseInt(slug.match(/\d+/)![0], 10) : 1);

  if (seqNum > 1) {
    return `${prefix} ${seqNum}`;
  }
  return `${prefix} 1`;
}

/**
 * Fetches Openings and Endings from AnimeThemes API strictly using AniList ID.
 * If not found, returns an empty array (indicating no OP/ED released yet).
 */
export async function fetchAnimeThemesVideos(
  anilistId?: number,
  posterFallback?: string
): Promise<AnimeVideo[]> {
  if (!anilistId || anilistId <= 0) {
    return [];
  }

  const cacheKey = `themes-anilist-${anilistId}`;
  if (memoryThemesCache.has(cacheKey)) {
    return memoryThemesCache.get(cacheKey)!;
  }

  // Check persistent storage
  try {
    const saved = localStorage.getItem(cacheKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryThemesCache.set(cacheKey, parsed);
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          return parsed;
        }
      }
    }
  } catch {
    // Ignore
  }

  const results: AnimeVideo[] = [];

  try {
    let data: AnimeThemesApiResponse | null = null;

    // Strict query by AniList ID
    const directUrl = `https://api.animethemes.moe/anime?filter[has]=resources&filter[site]=AniList&filter[external_id]=${anilistId}&include=animethemes.animethemeentries.videos.audio,animethemes.song.artists,images`;
    const proxyUrl = `/api/animethemes-proxy/anime?filter[has]=resources&filter[site]=AniList&filter[external_id]=${anilistId}&include=animethemes.animethemeentries.videos.audio,animethemes.song.artists,images`;

    try {
      const res = await fetch(directUrl);
      if (res.ok) {
        data = await res.json();
      } else {
        const proxyRes = await fetch(proxyUrl);
        if (proxyRes.ok) data = await proxyRes.json();
      }
    } catch {
      try {
        const proxyRes = await fetch(proxyUrl);
        if (proxyRes.ok) data = await proxyRes.json();
      } catch {
        // Ignore
      }
    }

    if (data && data.anime && data.anime.length > 0) {
      const animeEntry = data.anime[0];
      const themes = animeEntry.animethemes || [];
      const largeCover = animeEntry.images?.find((img) => img.facet === 'Large Cover' && img.link)?.link;
      const anyCover = animeEntry.images?.find((img) => img.link)?.link;
      const imageCover = largeCover || anyCover || posterFallback;

      for (const theme of themes) {
        const themeType = theme.type === 'OP' ? 'OP' : 'ED';
        const songTitle = theme.song?.title || (themeType === 'OP' ? 'Tema de Abertura' : 'Tema de Encerramento');
        const artists = (theme.song?.artists || []).map((a) => a.name).join(', ') || 'Artista Desconhecido';
        const entries = theme.animethemeentries || [];
        // Check if there are multiple versions for this theme
        const uniqueVersions = new Set(entries.map((e) => e.version || 1));
        const hasMultipleVersions = uniqueVersions.size > 1 || entries.some((e) => (e.version || 1) > 1);

        for (const entry of entries) {
          const videos = entry.videos || [];
          const entryVersion = entry.version || 1;
          const entryEpisodes = entry.episodes ? String(entry.episodes).trim() : undefined;
          const entrySpoiler = Boolean(entry.spoiler);
          const entryNsfw = Boolean(entry.nsfw);

          for (const vid of videos) {
            if (!vid.link) continue;

            const displayLabel = formatThemeDisplayLabel(
              themeType,
              theme.sequence,
              theme.slug || ''
            );

            // Thumbnail for video
            const thumb = imageCover || posterFallback || 'https://media.kitsu.app/anime/46474/poster_image/large-23e1293e41a0b54b6621eb589c3f0d62.jpeg';

            // Check tags or basename for spoiler / nsfw / uncen / overlap
            const tagsStr = (vid.tags || '').toLowerCase();
            const basenameStr = (vid.basename || '').toLowerCase();
            const isUncen = Boolean(vid.uncen) || tagsStr.includes('uncen') || basenameStr.includes('uncen');
            const isNsfw = entryNsfw || tagsStr.includes('nsfw') || basenameStr.includes('nsfw');
            const isSpoiler = entrySpoiler || tagsStr.includes('spoiler') || basenameStr.includes('spoiler');

            // Overlap: 'Over', 'Transition', 'None', or from tags/basename
            let overlapType = vid.overlap && vid.overlap !== 'None' ? vid.overlap : undefined;
            if (!overlapType) {
              if (tagsStr.includes('trans') || basenameStr.includes('trans')) {
                overlapType = 'Transition';
              } else if (tagsStr.includes('over') || basenameStr.includes('over')) {
                overlapType = 'Over';
              }
            }

            const audioLink =
              vid.audio?.link ||
              (vid.link
                ? vid.link.replace('https://v.animethemes.moe/', 'https://a.animethemes.moe/').replace(/\.webm$|\.mp4$/, '.ogg')
                : undefined);

            results.push({
              id: `animethemes-${theme.id}-${entry.id}-${vid.id}`,
              title: `${displayLabel} - ${songTitle}`,
              type: themeType,
              displayTypeLabel: displayLabel,
              songTitle: songTitle,
              artistName: artists,
              videoUrl: vid.link,
              audioUrl: audioLink,
              thumbnail: thumb,
              source: 'animethemes',
              version: entryVersion,
              hasMultipleVersions,
              episodes: entryEpisodes,
              spoiler: isSpoiler,
              nsfw: isNsfw,
              uncen: isUncen,
              overlap: overlapType,
              resolution: vid.resolution,
              videoSourceType: vid.source,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error fetching AnimeThemes strictly by AniList ID:', err);
  }

  memoryThemesCache.set(cacheKey, results);
  try {
    if (results.length > 0) {
      localStorage.setItem(cacheKey, JSON.stringify(results));
    }
  } catch {
    // Ignore storage quota errors
  }
  return results;
}
