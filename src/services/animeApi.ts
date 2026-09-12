import { AnimeItem, AnimeType, AnimeVideo, ExternalLink, Season } from '../types';

// In-memory cache for storing fetched seasonal data
const memoryCache = new Map<string, { timestamp: number; data: AnimeItem[] }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes
const CURRENT_CACHE_VERSION = 'v13_accurate_types_translations';

// Proactively clear old caches that may contain 18+ items
try {
  if (typeof window !== 'undefined') {
    // Clear all old anime cache keys from sessionStorage
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('anime_season_data_') && !key.includes(CURRENT_CACHE_VERSION)) {
        sessionStorage.removeItem(key);
      }
    });
    // Clear any old local storage anime cache
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('anime_season_') && !key.includes(CURRENT_CACHE_VERSION)) {
        localStorage.removeItem(key);
      }
    });
  }
} catch {
  // Ignore storage access errors
}

const GENRE_MAP: Record<string, string> = {
  Action: 'Ação',
  Adventure: 'Aventura',
  Comedy: 'Comédia',
  Drama: 'Drama',
  Ecchi: 'Ecchi',
  Fantasy: 'Fantasia',
  Horror: 'Terror',
  'Mahou Shoujo': 'Garotas Mágicas',
  Mecha: 'Mecha',
  Music: 'Música',
  Mystery: 'Mistério',
  Psychological: 'Psicológico',
  Romance: 'Romance',
  'Sci-Fi': 'Ficção Científica',
  'Slice of Life': 'Slice of Life',
  Sports: 'Esporte',
  Supernatural: 'Sobrenatural',
  Thriller: 'Suspense',
  Isekai: 'Isekai',
  School: 'Escolar',
  Historical: 'Histórico',
  Harem: 'Harém',
  Seinen: 'Seinen',
  Shounen: 'Shounen',
  Shoujo: 'Shoujo',
  Josei: 'Josei',
  "Boys' Love": "Boy's Love",
  "Girls' Love": 'Yuri',
};

export function translateGenre(g: string): string {
  return GENRE_MAP[g] || g;
}

/**
 * Checks if a given date string (YYYY-MM-DD) falls strictly within a specific year and season.
 * Winter: Jan, Feb, Mar (months 1, 2, 3)
 * Spring: Apr, May, Jun (months 4, 5, 6)
 * Summer: Jul, Aug, Sep (months 7, 8, 9)
 * Fall:   Oct, Nov, Dec (months 10, 11, 12)
 */
export function isDateInSeason(
  dateStr: string | undefined | null,
  year: number,
  season: Season
): boolean {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10);
  if (isNaN(y) || y !== year) return false;

  if (parts.length > 1) {
    const m = parseInt(parts[1], 10);
    if (!isNaN(m)) {
      if (season === 'WINTER') return m >= 1 && m <= 3;
      if (season === 'SPRING') return m >= 4 && m <= 6;
      if (season === 'SUMMER') return m >= 7 && m <= 9;
      if (season === 'FALL') return m >= 10 && m <= 12;
    }
  }
  return true;
}

/**
 * Deduplicates an array of anime items by unique ID and unique romaji title.
 */
export function deduplicateAnime(items: AnimeItem[]): AnimeItem[] {
  const seenIds = new Set<number>();
  const seenTitles = new Set<string>();
  const result: AnimeItem[] = [];

  for (const item of items) {
    if (!item || !item.id) continue;
    const normTitle = (item.title?.romaji || item.title?.userPreferred || '').trim().toLowerCase();
    if (seenIds.has(item.id) || (normTitle && seenTitles.has(normTitle))) {
      continue;
    }
    seenIds.add(item.id);
    if (normTitle) seenTitles.add(normTitle);
    result.push(item);
  }

  return result;
}

const ANILIST_SEASON_QUERY = `
query ($year: Int, $season: MediaSeason, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      hasNextPage
      total
    }
    media(seasonYear: $year, season: $season, type: ANIME, sort: [POPULARITY_DESC], isAdult: false) {
      id
      idMal
      isAdult
      title {
        romaji
        english
        native
        userPreferred
      }
      description(asHtml: false)
      coverImage {
        extraLarge
        large
        medium
        color
      }
      bannerImage
      format
      episodes
      status
      nextAiringEpisode {
        episode
        airingAt
        timeUntilAiring
      }
      season
      seasonYear
      startDate {
        year
        month
        day
      }
      genres
      studios(isMain: true) {
        nodes {
          name
          isAnimationStudio
        }
      }
      staff(perPage: 6) {
        edges {
          role
          node {
            name {
              full
            }
          }
        }
      }
      relations {
        edges {
          relationType
          node {
            id
            type
            format
            title {
              romaji
              english
            }
          }
        }
      }
      trailer {
        id
        site
        thumbnail
      }
      externalLinks {
        site
        url
      }
      averageScore
      popularity
    }
  }
}
`;

export function isContinuationTitle(title?: string): boolean {
  if (!title) return false;
  const t = title.trim();

  // Explicit Season markers: Season 2, 2nd Season, Part 2, Cour 2, 2nd Cour, etc.
  const seasonPattern =
    /\b(2nd|3rd|4th|5th|6th|7th|8th|9th|10th)\s*(season|cour|stage|series|period|part)?\b/i;
  const numberedSeasonPattern =
    /\b(season|temporada|part|parte|cour|stage)\s*([2-9]|\d{2})\b/i;
  const finalSeasonPattern =
    /\b(final\s*season|the\s*final\s*season|the\s*final\s*act|the\s*final|the\s*continuation|kanketsu-hen|zenpen|kouhen)\b/i;
  const romanNumeralPattern =
    /(?:^|\s|:|-)(ii|iii|iv|v|vi|vii|viii|ix|x)(?:$|\s|:|-)/i;
  const japaneseSeasonPattern =
    /(第[2-9２-９\d+]期|第[2-9２-９\d+]部|シーズン\s*[2-9２-９]|2nd|3rd|4th)/;

  if (seasonPattern.test(t)) return true;
  if (numberedSeasonPattern.test(t)) return true;
  if (finalSeasonPattern.test(t)) return true;
  if (japaneseSeasonPattern.test(t)) return true;

  if (romanNumeralPattern.test(t) && !/\b(the\s+iv\b|iv\s+drip)\b/i.test(t)) {
    return true;
  }

  return false;
}

function determineType(
  format: string,
  relations?: Array<{
    relationType: string;
    node?: {
      id?: number;
      type?: string;
      format?: string;
      title?: { romaji?: string; english?: string };
    };
  }>,
  title?: { romaji?: string; english?: string; native?: string; userPreferred?: string }
): AnimeType {
  const upperFormat = (format || 'TV').toUpperCase();

  if (upperFormat === 'MOVIE') return 'Filme';
  if (upperFormat === 'SPECIAL' || upperFormat === 'TV_SHORT') return 'Especial - TV';
  if (upperFormat === 'OVA') return 'OVA';
  if (upperFormat === 'ONA') return 'ONA';

  // 1. Check title patterns for continuation (e.g. "Sousou no Frieren 2nd Season", "Part 2", "II")
  if (
    isContinuationTitle(title?.romaji) ||
    isContinuationTitle(title?.english) ||
    isContinuationTitle(title?.userPreferred) ||
    isContinuationTitle(title?.native)
  ) {
    return 'Continuação';
  }

  // 2. Check relations from AniList strictly:
  // ONLY if relation is PREQUEL and node is an ANIME (TV, TV_SHORT, OVA, ONA, MOVIE).
  // Note: We intentionally do NOT check SEQUEL (which points forward to a future entry, meaning this is the first season/premiere!)
  // or ALTERNATIVE/ADAPTATION/SUMMARY (which are manga/game adaptations, recaps, or alternative settings, NOT sequels).
  if (relations && Array.isArray(relations)) {
    const hasAnimePrequel = relations.some((r) => {
      if (r.relationType === 'PREQUEL') {
        // If node type is explicitly defined, ensure it is an ANIME
        if (r.node?.type && r.node.type !== 'ANIME') {
          return false;
        }
        // If format is MUSIC or promotional PV, skip
        if (r.node?.format === 'MUSIC') {
          return false;
        }
        return true;
      }
      return false;
    });

    if (hasAnimePrequel) {
      return 'Continuação';
    }
  }

  return 'Estréia';
}

function cleanDescription(desc?: string): string {
  if (!desc) return 'Sinopse não informada.';
  return desc
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<i>(.*?)<\/i>/gi, '$1')
    .replace(/<b>(.*?)<\/b>/gi, '$1')
    .replace(/<[^>]*>/g, '')
    .trim();
}

/**
 * Execute GraphQL request to AniList (trying proxy first, then direct endpoint with headers)
 */
async function queryAniListGraphQL(query: string, variables: Record<string, any>): Promise<any> {
  const endpoints = ['/api/anilist-proxy', 'https://graphql.anilist.co'];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Referer: 'https://anilist.co/',
          Origin: 'https://anilist.co',
        },
        body: JSON.stringify({ query, variables }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json?.data) {
          return json.data;
        }
      }
    } catch (e) {
      // Continue to next endpoint
    }
  }

  throw new Error('All AniList endpoints failed');
}

/**
 * Fetch anime data using AniList GraphQL API with local fallback and caching
 */
export async function fetchAniListSeason(year: number, season: Season): Promise<AnimeItem[]> {
  const cacheKey = `anime_season_data_${CURRENT_CACHE_VERSION}_${year}_${season}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Check sessionStorage
  try {
    const sessionItem = sessionStorage.getItem(cacheKey);
    if (sessionItem) {
      const parsed = JSON.parse(sessionItem);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS && Array.isArray(parsed.data) && parsed.data.length > 0) {
        memoryCache.set(cacheKey, parsed);
        return parsed.data;
      }
    }
  } catch (err) {
    // Ignore storage errors
  }

  // 1. Try AniList GraphQL (Strictly filtered by season and year, fetching all pages)
  try {
    let currentPage = 1;
    let hasNext = true;
    let allMediaList: any[] = [];

    while (hasNext && currentPage <= 8) {
      const data = await queryAniListGraphQL(ANILIST_SEASON_QUERY, {
        year,
        season,
        page: currentPage,
        perPage: 50,
      });

      const pageMedia = data?.Page?.media || [];
      if (pageMedia.length === 0) {
        break;
      }

      allMediaList.push(...pageMedia);
      hasNext = data?.Page?.pageInfo?.hasNextPage === true;
      currentPage++;
    }

    if (allMediaList.length > 0) {
      const mapped: AnimeItem[] = allMediaList
        .filter((m: any) => {
          // Filter out +18 adult anime
          if (m.isAdult === true) return false;
          if (
            m.genres?.some((g: string) => {
              const lower = (g || '').toLowerCase().trim();
              return lower === 'hentai' || lower === 'erotica' || lower === 'adult' || lower === 'r18';
            })
          ) {
            return false;
          }
          // Double verify season and year to prevent unexpected leaked data
          if (m.seasonYear && m.seasonYear !== year) return false;
          if (m.season && m.season !== season) return false;
          return true;
        })
        .map((m: any) => {
          const relations = m.relations?.edges?.map((e: any) => ({
            relationType: e.relationType,
            node: e.node,
          }));
          const mainStudio = m.studios?.nodes?.[0]?.name || 'Estúdio Desconhecido';
          
          // Find director(s) from staff list with strict director role filtering (excluding ADR, Sound, Art, Assistant, etc.)
          const directorEdges = (m.staff?.edges || []).filter((e: any) => {
            const role = (e.role || '').toLowerCase().trim();
            if (
              role.includes('adr') ||
              role.includes('sound') ||
              role.includes('audio') ||
              role.includes('art') ||
              role.includes('animation') ||
              role.includes('assistant') ||
              role.includes('episode') ||
              role.includes('photography') ||
              role.includes('casting') ||
              role.includes('action') ||
              role.includes('cgi') ||
              role.includes('3d') ||
              role.includes('technical') ||
              role.includes('voice') ||
              role.includes('music') ||
              role.includes('unit') ||
              role.includes('dialogue') ||
              role.includes('dubbing') ||
              role.includes('script')
            ) {
              return false;
            }
            return (
              role === 'director' ||
              role === 'series director' ||
              role === 'chief director' ||
              role === 'general director' ||
              role === 'diretor' ||
              role === 'co-director' ||
              role === 'main director'
            );
          });
          const directorNames = directorEdges
            .map((e: any) => e.node?.name?.full)
            .filter((name: any): name is string => Boolean(name && name.trim()));
          const directorName = directorNames.length > 0 ? Array.from(new Set(directorNames)).join(', ') : undefined;

          const externalLinks: ExternalLink[] = [];
          if (m.id) {
            externalLinks.push({
              site: 'AniList',
              url: `https://anilist.co/anime/${m.id}`,
              type: 'anilist',
            });
          }
          if (m.idMal) {
            externalLinks.push({
              site: 'MyAnimeList',
              url: `https://myanimelist.net/anime/${m.idMal}`,
              type: 'mal',
            });
          }
          if (m.externalLinks && Array.isArray(m.externalLinks)) {
            m.externalLinks.forEach((l: any) => {
              if (!l || !l.site || !l.url) return;
              const sLower = l.site.toLowerCase();
              let siteName = l.site;
              let typeKey = 'other';

              if (sLower.includes('crunchyroll')) {
                siteName = 'Crunchyroll';
                typeKey = 'crunchyroll';
              } else if (sLower.includes('netflix')) {
                siteName = 'Netflix';
                typeKey = 'netflix';
              } else if (sLower.includes('disney')) {
                siteName = 'Disney+';
                typeKey = 'disney';
              } else if (sLower.includes('max') || sLower.includes('hbo')) {
                siteName = 'Max';
                typeKey = 'max';
              } else if (sLower.includes('amazon') || sLower.includes('prime')) {
                siteName = 'Prime Video';
                typeKey = 'prime';
              } else if (sLower.includes('anidb')) {
                siteName = 'AniDB';
                typeKey = 'anidb';
              } else if (sLower.includes('hulu')) {
                siteName = 'Hulu';
                typeKey = 'hulu';
              } else if (sLower.includes('bilibili')) {
                siteName = 'Bilibili';
                typeKey = 'bilibili';
              } else if (sLower.includes('hidive')) {
                siteName = 'HIDIVE';
                typeKey = 'hidive';
              }

              const allowedSites = [
                'Crunchyroll',
                'Netflix',
                'Disney+',
                'Max',
                'Prime Video',
                'AniDB',
                'Hulu',
                'Bilibili',
                'HIDIVE',
              ];

              if (
                allowedSites.includes(siteName) &&
                !externalLinks.some((ex) => ex.site === siteName)
              ) {
                externalLinks.push({ site: siteName, url: l.url, type: typeKey });
              }
            });
          }

          const videos: AnimeVideo[] = [];
          if (m.trailer && m.trailer.site === 'youtube') {
            videos.push({
              id: `trailer-${m.id}`,
              title: `${m.title.userPreferred || m.title.romaji} - Trailer Oficial`,
              type: 'Trailer',
              displayTypeLabel: 'Trailer',
              songTitle: m.title.userPreferred || m.title.romaji,
              artistName: 'YouTube',
              youtubeId: m.trailer.id,
              thumbnail:
                m.trailer.thumbnail ||
                (m.trailer.id ? `https://img.youtube.com/vi/${m.trailer.id}/hqdefault.jpg` : m.coverImage?.large),
              source: 'youtube',
            });
          }

          const covers: string[] = [];
          if (m.coverImage?.extraLarge) covers.push(m.coverImage.extraLarge);
          if (m.coverImage?.large && !covers.includes(m.coverImage.large)) {
            covers.push(m.coverImage.large);
          }
          if (covers.length === 0 && m.coverImage?.medium) {
            covers.push(m.coverImage.medium);
          }

          const dateObj = m.startDate;
          const formattedDate =
            dateObj?.day && dateObj?.month
              ? `${String(dateObj.day).padStart(2, '0')}/${String(dateObj.month).padStart(2, '0')}`
              : dateObj?.month
              ? `01/${String(dateObj.month).padStart(2, '0')}`
              : 'Em breve';

          return {
            id: m.id,
            malId: m.idMal,
            anilistId: m.id,
            title: {
              romaji: m.title.romaji || m.title.userPreferred,
              english: m.title.english,
              native: m.title.native,
              portuguese: m.title.english || m.title.romaji,
              userPreferred: m.title.userPreferred || m.title.romaji,
            },
            synopsisPt: cleanDescription(m.description),
            synopsisEn: cleanDescription(m.description),
            coverImages: covers,
            coverColor: m.coverImage?.color || undefined,
            bannerImage: m.bannerImage,
            format: m.format || 'TV',
            typeLabel: determineType(m.format, relations, m.title),
            episodes: m.episodes || '???',
            status: m.status || 'RELEASING',
            nextAiringEpisode: m.nextAiringEpisode
              ? {
                  episode: m.nextAiringEpisode.episode,
                  airingAt: m.nextAiringEpisode.airingAt,
                  timeUntilAiring: m.nextAiringEpisode.timeUntilAiring,
                }
              : undefined,
            season,
            seasonYear: year,
            startDate: {
              year: dateObj?.year,
              month: dateObj?.month,
              day: dateObj?.day,
              formatted: formattedDate,
            },
            genres: (m.genres || []).map(translateGenre),
            studio: {
              name: mainStudio,
            },
            director: directorName,
            score: m.averageScore ? +(m.averageScore / 10).toFixed(1) : undefined,
            popularity: m.popularity,
            externalLinks,
            videos,
          };
        });

      const deduplicated = deduplicateAnime(mapped);
      const cacheEntry = { timestamp: Date.now(), data: deduplicated };
      memoryCache.set(cacheKey, cacheEntry);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      } catch (e) {
        // storage quota exceeded fallback
      }
      return deduplicated;
    }
  } catch (error) {
    console.warn(`AniList API failed for ${year}/${season}, falling back to Kitsu:`, error);
  }

  // 2. Fallback: Kitsu API (With strict season & month filtering)
  try {
    const kitsuResult = await fetchKitsuSeason(year, season);
    if (kitsuResult.length > 0) {
      const deduplicated = deduplicateAnime(kitsuResult);
      const cacheEntry = { timestamp: Date.now(), data: deduplicated };
      memoryCache.set(cacheKey, cacheEntry);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      } catch (e) {
        // ignore
      }
      return deduplicated;
    }
  } catch (kitsuError) {
    console.warn(`Kitsu API failed for ${year}/${season}:`, kitsuError);
  }

  // 3. Fallback: Jikan API
  try {
    const jikanResult = await fetchJikanSeason(year, season);
    if (jikanResult.length > 0) {
      const deduplicated = deduplicateAnime(jikanResult);
      const cacheEntry = { timestamp: Date.now(), data: deduplicated };
      memoryCache.set(cacheKey, cacheEntry);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      } catch (e) {
        // ignore
      }
      return deduplicated;
    }
  } catch (jikanError) {
    console.warn(`Jikan API failed for ${year}/${season}:`, jikanError);
  }

  return [];
}

/**
 * Fetch anime data using Kitsu API v4 with strict month filtering
 */
export async function fetchKitsuSeason(year: number, season: Season): Promise<AnimeItem[]> {
  // Query multiple pages (offset 0, 20, 40)
  const urls = [
    `https://kitsu.io/api/edge/anime?filter[seasonYear]=${year}&page[limit]=20&page[offset]=0&sort=-userCount&include=categories,productions.company`,
    `https://kitsu.io/api/edge/anime?filter[seasonYear]=${year}&page[limit]=20&page[offset]=20&sort=-userCount&include=categories,productions.company`,
    `https://kitsu.io/api/edge/anime?filter[seasonYear]=${year}&page[limit]=20&page[offset]=40&sort=-userCount&include=categories,productions.company`,
  ];

  const responses = await Promise.allSettled(urls.map((u) => fetch(u)));
  const jsons = await Promise.all(
    responses.map(async (r) => {
      if (r.status === 'fulfilled' && r.value.ok) {
        return r.value.json();
      }
      return { data: [], included: [] };
    })
  );

  let rawData: any[] = [];
  let rawIncluded: any[] = [];
  jsons.forEach((j) => {
    if (Array.isArray(j.data)) rawData.push(...j.data);
    if (Array.isArray(j.included)) rawIncluded.push(...j.included);
  });

  if (rawData.length === 0) {
    return [];
  }

  const categoryMap: Record<string, string> = {};
  const producerMap: Record<string, string> = {};

  rawIncluded.forEach((inc: any) => {
    if (inc.type === 'categories' && inc.attributes?.title) {
      categoryMap[inc.id] = inc.attributes.title;
    }
    if (inc.type === 'producers' && inc.attributes?.name) {
      producerMap[inc.id] = inc.attributes.name;
    }
  });

  // Filter strictly by the 3 months of the target season and exclude adult 18+ content
  const seasonalFiltered = rawData.filter((item: any) => {
    const attr = item.attributes || {};
    if (attr.ageRating === 'R18' || attr.nsfw === true) return false;
    return isDateInSeason(attr.startDate, year, season);
  });

  const mapped: AnimeItem[] = seasonalFiltered.map((item: any) => {
    const attr = item.attributes || {};
    const catIds = item.relationships?.categories?.data?.map((c: any) => c.id) || [];
    const genres = catIds
      .map((id: string) => categoryMap[id])
      .filter(Boolean)
      .map(translateGenre)
      .slice(0, 6);

    let typeLabel: AnimeType = 'Estréia';
    const subtype = (attr.subtype || '').toLowerCase();
    if (subtype === 'movie') typeLabel = 'Filme';
    else if (subtype === 'special') typeLabel = 'Especial - TV';
    else if (subtype === 'ova') typeLabel = 'OVA';
    else if (subtype === 'ona') typeLabel = 'ONA';
    else if (
      isContinuationTitle(attr.canonicalTitle) ||
      isContinuationTitle(attr.titles?.en) ||
      isContinuationTitle(attr.titles?.en_jp)
    ) {
      typeLabel = 'Continuação';
    }

    const covers: string[] = [];
    if (attr.posterImage?.large) covers.push(attr.posterImage.large);
    if (attr.posterImage?.original && !covers.includes(attr.posterImage.original)) {
      covers.push(attr.posterImage.original);
    }
    if (attr.posterImage?.medium && !covers.includes(attr.posterImage.medium)) {
      covers.push(attr.posterImage.medium);
    }

    let formattedDate = 'Em breve';
    let monthNum: number | undefined;
    let dayNum: number | undefined;

    if (attr.startDate) {
      const parts = attr.startDate.split('-');
      if (parts.length >= 2) {
        monthNum = parseInt(parts[1], 10);
        dayNum = parts.length >= 3 ? parseInt(parts[2], 10) : undefined;
        formattedDate = dayNum
          ? `${String(dayNum).padStart(2, '0')}/${String(monthNum).padStart(2, '0')}`
          : `01/${String(monthNum).padStart(2, '0')}`;
      }
    }

    const videos: AnimeVideo[] = [];
    if (attr.youtubeVideoId) {
      videos.push({
        id: `trailer-${item.id}`,
        title: `${attr.canonicalTitle} - Trailer Oficial`,
        type: 'Trailer',
        displayTypeLabel: 'Trailer',
        songTitle: attr.canonicalTitle,
        artistName: 'YouTube',
        youtubeId: attr.youtubeVideoId,
        thumbnail:
          attr.posterImage?.large || `https://img.youtube.com/vi/${attr.youtubeVideoId}/hqdefault.jpg`,
        source: 'youtube',
      });
    }

    const scoreNum = attr.averageRating
      ? +(parseFloat(attr.averageRating) / 10).toFixed(1)
      : undefined;

    return {
      id: parseInt(item.id, 10),
      title: {
        romaji: attr.canonicalTitle || 'Sem título',
        english: attr.titles?.en || attr.titles?.en_jp || attr.canonicalTitle,
        native: attr.titles?.ja_jp,
        portuguese: attr.titles?.en || attr.canonicalTitle,
        userPreferred: attr.canonicalTitle || 'Sem título',
      },
      synopsisPt: cleanDescription(attr.synopsis),
      synopsisEn: cleanDescription(attr.synopsis),
      coverImages: covers,
      bannerImage: attr.coverImage?.large || attr.coverImage?.original,
      format: attr.subtype?.toUpperCase() || 'TV',
      typeLabel,
      episodes: attr.episodeCount || '???',
      status: attr.status === 'finished' ? 'FINISHED' : 'RELEASING',
      season,
      seasonYear: year,
      startDate: {
        year,
        month: monthNum,
        day: dayNum,
        formatted: formattedDate,
      },
      genres: genres.length > 0 ? genres : ['Animação'],
      studio: {
        name: 'Estúdio Japonês',
      },
      score: scoreNum,
      popularity: attr.userCount || attr.favoritesCount || 0,
      externalLinks: [
        {
          site: 'Kitsu',
          url: `https://kitsu.io/anime/${item.id}`,
          type: 'other',
        },
      ],
      videos,
    };
  });

  return deduplicateAnime(mapped);
}

/**
 * Fetch anime data using Jikan API v4 (MyAnimeList)
 */
export async function fetchJikanSeason(year: number, season: Season): Promise<AnimeItem[]> {
  const jikanSeasonStr = season.toLowerCase();
  const url = `https://api.jikan.moe/v4/seasons/${year}/${jikanSeasonStr}?sfw=true`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Jikan status ${response.status}`);
  }
  const json = await response.json();
  const data = (json.data || []).filter((item: any) => {
    if (item.rating?.includes('Rx') || item.rating?.includes('18+')) return false;
    return true;
  });

  const mapped: AnimeItem[] = data.map((item: any) => {
    const genres = (item.genres || []).map((g: any) => translateGenre(g.name));
    const studios = (item.studios || []).map((s: any) => s.name).join(', ') || 'Estúdio Desconhecido';

    const covers = [];
    if (item.images?.webp?.large_image_url) covers.push(item.images.webp.large_image_url);
    if (item.images?.jpg?.large_image_url) covers.push(item.images.jpg.large_image_url);

    const fromDate = item.aired?.from ? new Date(item.aired.from) : null;
    const formattedDate = fromDate
      ? `${String(fromDate.getDate()).padStart(2, '0')}/${String(fromDate.getMonth() + 1).padStart(2, '0')}`
      : 'Em breve';

    let typeLabel: AnimeType = 'Estréia';
    if (item.type === 'Movie') typeLabel = 'Filme';
    else if (item.type === 'Special') typeLabel = 'Especial - TV';
    else if (item.type === 'OVA') typeLabel = 'OVA';
    else if (item.type === 'ONA') typeLabel = 'ONA';
    else if (
      isContinuationTitle(item.title) ||
      isContinuationTitle(item.title_english) ||
      isContinuationTitle(item.title_japanese)
    ) {
      typeLabel = 'Continuação';
    }

    const videos: AnimeVideo[] = [];
    if (item.trailer?.youtube_id) {
      videos.push({
        id: `trailer-${item.mal_id}`,
        title: `${item.title} - Trailer Oficial`,
        type: 'Trailer',
        displayTypeLabel: 'Trailer',
        songTitle: item.title,
        artistName: 'YouTube',
        youtubeId: item.trailer.youtube_id,
        thumbnail:
          item.trailer.images?.maximum_image_url ||
          item.trailer.images?.large_image_url ||
          `https://img.youtube.com/vi/${item.trailer.youtube_id}/hqdefault.jpg`,
        source: 'youtube',
      });
    }

    return {
      id: item.mal_id,
      malId: item.mal_id,
      title: {
        romaji: item.title,
        english: item.title_english,
        native: item.title_japanese,
        userPreferred: item.title,
      },
      synopsisPt: cleanDescription(item.synopsis),
      synopsisEn: cleanDescription(item.synopsis),
      coverImages: covers,
      format: item.type || 'TV',
      typeLabel,
      episodes: item.episodes || '???',
      status: item.status || 'NOT_YET_RELEASED',
      season,
      seasonYear: year,
      startDate: {
        formatted: formattedDate,
      },
      genres,
      studio: {
        name: studios,
      },
      score: item.score,
      popularity: item.members,
      externalLinks: [
        { site: 'MAL', url: item.url || `https://myanimelist.net/anime/${item.mal_id}`, type: 'mal' },
      ],
      videos,
    };
  });

  return deduplicateAnime(mapped);
}

export function getCuratedSeasonFallback(_year: number, _season: Season): AnimeItem[] {
  return [];
}
