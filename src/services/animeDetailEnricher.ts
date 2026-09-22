/**
 * Utilities for enriching anime details:
 * - Translation to Portuguese (Google Translate GTX with fallbacks)
 * - Single High-Resolution Poster via AniList API (coverImage.extraLarge + dominant color)
 * - Director's other works (as Director) with franchise deduplication (max 1 other season, up to 3 works total)
 * - Studio's other animation works with franchise deduplication
 * - Studio logo image resolution
 */

// Memory & Session cache for translations
const translationCache = new Map<string, string>();

/**
 * Translates synopsis to Portuguese using server-side /api/translate proxy
 * (Google Translate GTX, Dict-Chrome-Ex, Lingva, MyMemory) with fallback to client-side.
 */
export async function translateSynopsisToPt(rawText: string): Promise<string> {
  if (!rawText || !rawText.trim()) {
    return 'Sinopse oficial não divulgada até o momento.';
  }

  const clean = rawText
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\[Written by MAL Rewrite\]/gi, '')
    .replace(/\(Source: [^)]+\)/gi, '')
    .trim();

  // If already Portuguese
  const portugueseWords = /\b(uma|um|ele|ela|sua|seu|para|com|não|são|está|quando|jornada|história|aventura|amigos|mundo|garoto|garota|estudante|escola|temporada)\b/i;
  const englishWords = /\b(the|and|with|after|when|about|their|which|from|into|journey|battle|story|school|boy|girl)\b/i;

  const ptMatches = (clean.match(portugueseWords) || []).length;
  const enMatches = (clean.match(englishWords) || []).length;

  if (ptMatches >= 3 && enMatches === 0) {
    return clean;
  }

  if (translationCache.has(clean)) {
    return translationCache.get(clean)!;
  }

  // Check localStorage and sessionStorage
  const sessionKey = `trans_pt_${clean.slice(0, 40).replace(/\W/g, '_')}`;
  try {
    const localCached = localStorage.getItem(sessionKey);
    if (localCached) {
      translationCache.set(clean, localCached);
      return localCached;
    }
  } catch {
    // ignore
  }

  try {
    const cached = sessionStorage.getItem(sessionKey);
    if (cached) {
      translationCache.set(clean, cached);
      return cached;
    }
  } catch {
    // ignore
  }

  const saveToCache = (translated: string) => {
    translationCache.set(clean, translated);
    try {
      localStorage.setItem(sessionKey, translated);
    } catch {
      // ignore
    }
    try {
      sessionStorage.setItem(sessionKey, translated);
    } catch {
      // ignore
    }
    return translated;
  };

  // 1. First priority: Server-side translation proxy (fast, reliable, bypasses browser CORS)
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: clean }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.translation && data.translation !== clean && data.translation.trim().length > 5) {
        return saveToCache(data.translation.trim());
      }
    }
  } catch (err) {
    // try fallback
  }

  // 2. Direct Google Translate GTX free public API
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t&q=${encodeURIComponent(clean)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .map((chunk: any) => chunk?.[0] || '')
          .join('')
          .trim();
        if (translated && translated.length > 5) {
          return saveToCache(translated);
        }
      }
    }
  } catch (err) {
    // try fallback
  }

  // 3. Google Translate client dict-chrome-ex fallback
  try {
    const cRes = await fetch(
      `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=pt&q=${encodeURIComponent(clean)}`
    );
    if (cRes.ok) {
      const data = await cRes.json();
      if (Array.isArray(data) && typeof data[0] === 'string') {
        const joined = data.join('').trim();
        if (joined && joined.length > 5) {
          return saveToCache(joined);
        }
      } else if (typeof data === 'string' && data.trim().length > 5) {
        return saveToCache(data.trim());
      }
    }
  } catch {
    // ignore
  }

  // 4. Lingva public translate fallback
  try {
    const res = await fetch(`https://lingva.ml/api/v1/auto/pt/${encodeURIComponent(clean)}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.translation && data.translation.trim().length > 5) {
        return saveToCache(data.translation.trim());
      }
    }
  } catch {
    // ignore
  }

  // 5. MyMemory fallback
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean.slice(0, 500))}&langpair=en|pt-BR`
    );
    if (res.ok) {
      const data = await res.json();
      const text = data?.responseData?.translatedText;
      if (text && text.trim().length > 5) {
        return saveToCache(text.trim());
      }
    }
  } catch (e) {
    // ignore
  }

  return clean;
}

/**
 * Single High-Resolution Poster via AniList GraphQL
 */
export async function fetchAniListHighResPoster(
  anilistId?: number,
  title?: string,
  fallbackPoster?: string
): Promise<{ posterUrl: string; color?: string }> {
  const fallback = {
    posterUrl: fallbackPoster || 'https://media.kitsu.app/anime/46474/poster_image/large-23e1293e41a0b54b6621eb589c3f0d62.jpeg',
  };

  const endpoints = ['/api/anilist-proxy', 'https://graphql.anilist.co'];

  // 1. If we have AniList ID
  if (anilistId) {
    const query = `query ($id: Int) { Media(id: $id) { coverImage { extraLarge large color } } }`;
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Referer: 'https://anilist.co/',
            Origin: 'https://anilist.co',
          },
          body: JSON.stringify({ query, variables: { id: anilistId } }),
        });
        if (res.ok) {
          const json = await res.json();
          const cover = json?.data?.Media?.coverImage;
          if (cover?.extraLarge || cover?.large) {
            return {
              posterUrl: cover.extraLarge || cover.large,
              color: cover.color || undefined,
            };
          }
        }
      } catch {
        // try next
      }
    }
  }

  // 2. If we have title search
  if (title) {
    const cleanTitle = title.replace(/\b(2nd|3rd|4th|5th|season|part|cour)\b/gi, '').trim();
    const query = `query ($search: String) { Media(search: $search, type: ANIME) { coverImage { extraLarge large color } } }`;
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Referer: 'https://anilist.co/',
            Origin: 'https://anilist.co',
          },
          body: JSON.stringify({ query, variables: { search: cleanTitle } }),
        });
        if (res.ok) {
          const json = await res.json();
          const cover = json?.data?.Media?.coverImage;
          if (cover?.extraLarge || cover?.large) {
            return {
              posterUrl: cover.extraLarge || cover.large,
              color: cover.color || undefined,
            };
          }
        }
      } catch {
        // try next
      }
    }
  }

  return fallback;
}

/**
 * Extracts franchise root keywords to identify if two works are from the same franchise
 */
function extractFranchiseKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/(2nd|3rd|4th|5th|[0-9]+(th|st|nd|rd))\s+season/gi, '')
    .replace(/season\s+[0-9]+/gi, '')
    .replace(/part\s+[0-9]+/gi, '')
    .replace(/cour\s+[0-9]+/gi, '')
    .replace(/the\s+final\s+season/gi, '')
    .replace(/(movie|filme|special|ova|ona|tv|re:)/gi, '')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

function isSameFranchise(workTitle: string, currentAnimeTitle: string): boolean {
  const currentKeywords = extractFranchiseKeywords(currentAnimeTitle);
  const workKeywords = extractFranchiseKeywords(workTitle);

  if (currentKeywords.length === 0 || workKeywords.length === 0) return false;

  let matches = 0;
  for (const kw of currentKeywords) {
    if (workKeywords.includes(kw)) {
      matches++;
    }
  }
  return matches >= Math.min(2, currentKeywords.length);
}

/**
 * Formats a list of works respecting:
 * 1. At most ONE other season of the current anime
 * 2. Up to 3 works total
 * 3. Returns "primeiro trabalho" if 0 works
 */
export function formatWorksList(candidateWorks: string[], currentAnimeTitle: string): string {
  if (!candidateWorks || candidateWorks.length === 0) {
    return 'primeiro trabalho';
  }

  const selected: string[] = [];
  let includedSameFranchiseSeason = false;

  for (const work of candidateWorks) {
    const trimmed = work.trim();
    if (!trimmed) continue;

    // Do not include the exact current anime title
    if (trimmed.toLowerCase() === currentAnimeTitle.toLowerCase()) {
      continue;
    }

    const sameFranchise = isSameFranchise(trimmed, currentAnimeTitle);

    if (sameFranchise) {
      if (includedSameFranchiseSeason) {
        continue;
      }
      includedSameFranchiseSeason = true;
      selected.push(trimmed);
    } else {
      if (!selected.includes(trimmed)) {
        selected.push(trimmed);
      }
    }

    if (selected.length >= 3) break;
  }

  if (selected.length === 0) {
    return 'primeiro trabalho';
  }

  return selected.join(', ');
}

// Curated database of notable directorial works for famous directors
const DIRECTOR_WORKS_DB: Record<string, string[]> = {
  // Saitou Keiichirou
  'Keiichirou Saitou': ['Bocchi the Rock!', 'ACCA: 13-Ku Regards', 'Sonny Boy'],
  'Keiichiro Saito': ['Bocchi the Rock!', 'ACCA: 13-Ku Regards', 'Sonny Boy'],
  'Saito Keiichiro': ['Bocchi the Rock!', 'ACCA: 13-Ku Regards', 'Sonny Boy'],
  'Tomoya Kitagawa': ['Sousou no Frieren', 'Bocchi the Rock! (Episódio 8)'],
  'Kitagawa Tomoya': ['Sousou no Frieren', 'Bocchi the Rock! (Episódio 8)'],
  
  // MAPPA & Action
  'Sunghoo Park': ['Jujutsu Kaisen', 'The God of High School', 'Ninja Kamui'],
  'Shouta Goshozono': ['Jujutsu Kaisen (Shibuya)', 'Chainsaw Man (Ep. 8)', 'Ousama Ranking'],
  'Shota Goshozono': ['Jujutsu Kaisen (Shibuya)', 'Chainsaw Man (Ep. 8)', 'Ousama Ranking'],
  'Goshozono Shota': ['Jujutsu Kaisen (Shibuya)', 'Chainsaw Man (Ep. 8)', 'Ousama Ranking'],
  'Kaori Makita': ['Jigokuraku', 'Kakegurui Twin', 'Given (Filme)'],
  'Makita Kaori': ['Jigokuraku', 'Kakegurui Twin', 'Given (Filme)'],
  'Yasunori Ebina': ['Jujutsu Kaisen', 'Naruto Shippuuden'],

  // Bones & Madhouse & David Production
  'Kenji Nagasaki': ['Boku no Hero Academia', 'Gundam Build Fighters', 'Classroom☆Crisis'],
  'Shingo Natsume': ['One Punch Man', 'Sonny Boy', 'Space Dandy', 'Tatami Time Machine Blues'],
  'Tetsuro Araki': ['Shingeki no Kyojin', 'Death Note', 'Kabaneri of the Iron Fortress'],
  'Tetsurou Araki': ['Shingeki no Kyojin', 'Death Note', 'Kabaneri of the Iron Fortress'],
  'Yuzuru Tachikawa': ['Mob Psycho 100', 'Death Parade', 'Blue Giant'],
  'Naokatsu Tsuda': ['JoJo no Kimyou na Bouken', 'Inu x Boku SS', 'Tokyo 24-ku'],
  'Kenichi Suzuki': ['JoJo no Kimyou na Bouken', 'Hataraku Saibou', 'Drifters'],
  'Yuki Yase': ['Enen no Shouboutai', 'Mekakucity Actors', 'Kubikiri Cycle'],
  'Tatsuma Minamikawa': ['Enen no Shouboutai', 'Wave, Listen to Me!'],

  // Kyoto Animation
  'Tatsuya Ishihara': ['Clannad', 'Hibike! Euphonium', 'Nichijou', 'Suzumiya Haruhi no Yuuutsu'],
  'Naoko Yamada': ['K-On!', 'Koe no Katachi', 'Liz to Aoi Tori', 'Heike Monogatari'],
  'Taichi Ishidate': ['Violet Evergarden', 'Kyoukai no Kanata'],

  // A-1 Pictures & CloverWorks
  'Tomohiko Ito': ['Sword Art Online', 'Boku dake ga Inai Machi', 'Hello World', 'Silver Spoon'],
  'Masashi Ishihama': ['Shinsekai yori', 'Horimiya', 'Persona 5 the Animation'],
  'Shunsuke Nakashige': ['Solo Leveling', 'Mother of the Goddess\' Dormitory'],
  'Tomoya Tanaka': ['Engage Kiss', 'Visual Prison'],
  'Mamoru Hatakeyama': ['Kaguya-sama wa Kokurasetai', 'Shouwa Genroku Rakugo Shinjuu', 'Undead Girl Murder Farce'],
  'Ryouji Masuyama': ['Fate/strange Fake', 'Blend S', 'Pantheon'],
  'Ryouhei Takeshita': ['Eromanga Sensei', 'Yoru no Kurage wa Oyogenai', 'Jellyfish Can\'t Swim in the Night'],

  // Doga Kobo & Silver Link
  'Daisuke Hiramaki': ['Oshi no Ko', 'Watashi ni Tenshi ga Maiorita!', 'Koisuru Asteroid'],
  'Hiramaki Daisuke': ['Oshi no Ko', 'Watashi ni Tenshi ga Maiorita!', 'Koisuru Asteroid'],
  'Chao Nekotomi': ['Oshi no Ko', 'Shikimori-san wa Warui dake ja Nai'],
  'Shin Oonuma': ['Fate/kaleid liner Prisma☆Illya', 'Kokoro Connect', 'Bofuri', 'Dusk Maiden of Amnesia'],
  'Masato Jinbo': ['Isekai Shokudou', 'Fate/kaleid liner 2wei!', 'Tate no Yuusha S2'],

  // Legends
  'Makoto Shinkai': ['Kimi no Na wa.', 'Tenki no Ko', 'Suzume', 'Byousoku 5 Centimeter'],
  'Hayao Miyazaki': ['Sen to Chihiro no Kamikakushi', 'Mononoke Hime', 'Kimitachi wa Dou Ikiru ka'],
  'Shinichiro Watanabe': ['Cowboy Bebop', 'Samurai Champloo', 'Zankyou no Terror', 'Carole & Tuesday'],
  'Akiyuki Shinbo': ['Bakemonogatari', 'Mahou Shoujo Madoka★Magica', '3-gatsu no Lion'],
  'Tensai Okamura': ['Darker than Black', 'Nanatsu no Taizai', 'Ao no Exorcist', 'Kuromukuro'],
  'Goro Taniguchi': ['Code Geass', 'One Piece Film: Red', 'Planetes'],
  'Hiroyuki Imaishi': ['Tengen Toppa Gurren Lagann', 'Kill la Kill', 'Cyberpunk: Edgerunners', 'Promare'],
  'Ayumu Watanabe': ['Komi-san wa, Komyushou desu.', 'Summer Time Render', 'Kaijuu no Kodomo'],
  'Takuya Igarashi': ['Bungou Stray Dogs', 'Soul Eater', 'Ouran Koukou Host Club'],
  'Seiji Kishi': ['Ansatsu Kyoushitsu', 'Angel Beats!', 'Danganronpa', 'Persona 4'],
  'Noriyuki Abe': ['Bleach', 'Yu Yu Hakusho', 'Kuroshitsuji: Book of Circus'],
  'Tomohiro Furukawa': ['Shoujo☆Kageki Revue Starlight'],
  'Hiroyuki Seshita': ['Ajin', 'Knights of Sidonia', 'Godzilla: Kaijuu Wakusei'],
  'Tatsuya Yoshihara': ['Black Clover', 'Chainsaw Man (Ação)', 'Monster Musume'],
  'Katsushi Sakurabi': ['Toradora!', 'Kami-sama no Memo-chou', 'Flying Witch'],
  'Yuuki Ogawa': ['Ishuzoku Reviewers', 'Mieruko-chan'],
  'Takuya Sato': ['Steins;Gate', 'Sukitte Ii na yo.', 'Asagao to Kase-san.'],
  'Kenichi Kawamura': ['Steins;Gate 0', 'Black Lagoon: Roberta\'s Blood Trail'],
  'Fumiaki Usui': ['Yuusha Kei ni Shosu', 'Kuroshitsuji'],
  'Eriko Kimura': ['Seihantai na Kimi to Boku', 'Sarazanmai', 'Penguindrum'],
};

// Title-to-metadata fallback mapping for popular seasonal titles
const ANIME_METADATA_FALLBACK: Record<string, { director?: string; studio?: string; notableWorks?: string[] }> = {
  'frieren': {
    director: 'Keiichirou Saitou',
    studio: 'Madhouse',
    notableWorks: ['Bocchi the Rock!', 'ACCA: 13-Ku Regards', 'Sonny Boy'],
  },
  'sousou no frieren': {
    director: 'Keiichirou Saitou',
    studio: 'Madhouse',
    notableWorks: ['Bocchi the Rock!', 'ACCA: 13-Ku Regards', 'Sonny Boy'],
  },
  'jujutsu kaisen': {
    director: 'Shouta Goshozono',
    studio: 'MAPPA',
    notableWorks: ['Chainsaw Man', 'Ousama Ranking', 'Fate/Apocrypha'],
  },
  'jigokuraku': {
    director: 'Kaori Makita',
    studio: 'MAPPA',
    notableWorks: ['Jigokuraku', 'Kakegurui Twin', 'Given (Filme)'],
  },
  'oshi no ko': {
    director: 'Daisuke Hiramaki',
    studio: 'Doga Kobo',
    notableWorks: ['Watashi ni Tenshi ga Maiorita!', 'Koisuru Asteroid', 'Selection Project'],
  },
  'enen no shouboutai': {
    director: 'Yuki Yase',
    studio: 'David Production',
    notableWorks: ['Mekakucity Actors', 'Kubikiri Cycle', 'Hidamari Sketch'],
  },
  'fire force': {
    director: 'Yuki Yase',
    studio: 'David Production',
    notableWorks: ['Mekakucity Actors', 'Kubikiri Cycle', 'Hidamari Sketch'],
  },
  'fate/strange fake': {
    director: 'Ryouji Masuyama',
    studio: 'A-1 Pictures',
    notableWorks: ['Blend S', 'Pantheon', 'Gurren Lagann Parallel Works'],
  },
  'steel ball run': {
    director: 'Naokatsu Tsuda',
    studio: 'David Production',
    notableWorks: ['JoJo no Kimyou na Bouken', 'Inu x Boku SS', 'Tokyo 24-ku'],
  },
  'jojo': {
    director: 'Naokatsu Tsuda',
    studio: 'David Production',
    notableWorks: ['JoJo no Kimyou na Bouken', 'Inu x Boku SS', 'Tokyo 24-ku'],
  },
  'solo leveling': {
    director: 'Shunsuke Nakashige',
    studio: 'A-1 Pictures',
    notableWorks: ['Mother of the Goddess\' Dormitory', 'Sword Art Online: Alicization'],
  },
  'bleach': {
    director: 'Tomohisa Taguchi',
    studio: 'Pierrot',
    notableWorks: ['Akudama Drive', 'Twin Star Exorcists', 'Kino no Tabi'],
  },
  'youjo senki': {
    director: 'Yutaka Uemura',
    studio: 'Nut',
    notableWorks: ['FLCL Alternative', 'Punch Line', 'Dantalian no Shoka'],
  },
};

/**
 * Helper to query AniList GraphQL
 */
async function queryAniListEnricher(query: string, variables: Record<string, any>): Promise<any> {
  const endpoints = ['/api/anilist-proxy', 'https://graphql.anilist.co'];
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Referer: 'https://anilist.co/',
          Origin: 'https://anilist.co',
        },
        body: JSON.stringify({ query, variables }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          return json.data;
        }
      }
    } catch {
      // try next
    }
  }
  return null;
}

export interface DirectorInfo {
  id?: number | null;
  name: string;
  malId?: number;
  malUrl?: string;
  anilistUrl?: string;
  url: string;
  anidbUrl: string;
  works: string;
}

export interface DirectorEnrichmentResult {
  directors: DirectorInfo[];
  combinedWorksText: string;
  fullDisplayText: string;
}

export interface MalMetadataResult {
  studios: Array<{ malId?: number; name: string; url: string }>;
  directors: Array<{ malId?: number; name: string; url: string; role?: string }>;
}

/**
 * Fetches official MAL studio and director metadata via server proxy (which queries Jikan API with fallback to direct MAL scraping)
 */
export async function fetchMalMetadata(malId?: number): Promise<MalMetadataResult> {
  if (!malId) return { studios: [], directors: [] };
  try {
    const res = await fetch(`/api/anime-mal-metadata?malId=${malId}`);
    if (res.ok) {
      const data = await res.json();
      return {
        studios: Array.isArray(data.studios) ? data.studios : [],
        directors: Array.isArray(data.directors) ? data.directors : [],
      };
    }
  } catch (err) {
    console.warn('Failed to fetch MAL metadata:', err);
  }

  // Client-side fallback to Jikan API v4 if server endpoint was unreachable
  try {
    const [jikanAnime, jikanStaff] = await Promise.allSettled([
      fetch(`https://api.jikan.moe/v4/anime/${malId}`),
      fetch(`https://api.jikan.moe/v4/anime/${malId}/staff`),
    ]);

    const studios: Array<{ malId?: number; name: string; url: string }> = [];
    const directors: Array<{ malId?: number; name: string; url: string; role?: string }> = [];

    if (jikanAnime.status === 'fulfilled' && jikanAnime.value.ok) {
      const data = await jikanAnime.value.json();
      for (const st of data?.data?.studios || []) {
        if (st.name && st.url) {
          studios.push({ malId: st.mal_id, name: st.name.trim(), url: st.url });
        }
      }
    }

    if (jikanStaff.status === 'fulfilled' && jikanStaff.value.ok) {
      const data = await jikanStaff.value.json();
      for (const item of data?.data || []) {
        const positions: string[] = item.positions || [];
        const isDir = positions.some((p) => {
          const lp = p.toLowerCase();
          return (
            lp === 'director' ||
            lp === 'series director' ||
            lp === 'chief director' ||
            lp === 'general director' ||
            lp === 'main director' ||
            lp === 'co-director'
          );
        });

        if (isDir && item.person?.name) {
          let westernName = item.person.name.trim();
          if (westernName.includes(',')) {
            const parts = westernName.split(',').map((p: string) => p.trim());
            if (parts.length >= 2) {
              westernName = `${parts[1]} ${parts[0]}`;
            }
          }
          directors.push({
            malId: item.person.mal_id,
            name: westernName,
            url: item.person.url || `https://myanimelist.net/people/${item.person.mal_id}`,
            role: positions.join(', '),
          });
        }
      }
    }

    return { studios, directors };
  } catch {
    return { studios: [], directors: [] };
  }
}

export function isStrictDirectorRole(role?: string): boolean {
  if (!role) return false;
  const parts = role.split(/[,/;|]/).map((p) => p.trim());
  for (const part of parts) {
    const r = part.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim();

    // Strict negative filters to eliminate ADR (dubbing), Sound, Art, Assistant, Episode, etc.
    if (
      r.includes('adr') ||
      r.includes('sound') ||
      r.includes('audio') ||
      r.includes('art') ||
      r.includes('animation') ||
      r.includes('assistant') ||
      r.includes('episode') ||
      r.includes('photography') ||
      r.includes('casting') ||
      r.includes('action') ||
      r.includes('cgi') ||
      r.includes('3d') ||
      r.includes('technical') ||
      r.includes('voice') ||
      r.includes('music') ||
      r.includes('unit') ||
      r.includes('dialogue') ||
      r.includes('dubbing') ||
      r.includes('script')
    ) {
      continue;
    }

    // Positive matches for real anime directors
    if (
      r === 'director' ||
      r === 'series director' ||
      r === 'chief director' ||
      r === 'general director' ||
      r === 'diretor' ||
      r === 'co-director' ||
      r === 'main director'
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Resolves one single director's works by Staff ID or name via AniList staffMedia (all pages)
 */
async function resolveSingleDirectorWorks(
  staffId: number | null,
  directorName: string,
  currentAnimeTitle: string
): Promise<string> {
  if (staffId) {
    const staffMediaQuery = `
      query ($staffId: Int, $page: Int) {
        Staff(id: $staffId) {
          staffMedia(page: $page, perPage: 50, type: ANIME, sort: [POPULARITY_DESC]) {
            pageInfo {
              hasNextPage
            }
            edges {
              staffRole
              node {
                title {
                  romaji
                  english
                  userPreferred
                }
              }
            }
          }
        }
      }
    `;

    try {
      let page = 1;
      let hasNext = true;
      const candidateTitles: string[] = [];

      while (hasNext && page <= 8) {
        const staffRes = await queryAniListEnricher(staffMediaQuery, { staffId, page });
        const edges = staffRes?.Staff?.staffMedia?.edges || [];

        for (const edge of edges) {
          if (isStrictDirectorRole(edge.staffRole)) {
            const title =
              edge.node?.title?.romaji ||
              edge.node?.title?.userPreferred ||
              edge.node?.title?.english;
            if (title && !candidateTitles.includes(title)) {
              candidateTitles.push(title);
            }
          }
        }

        hasNext = staffRes?.Staff?.staffMedia?.pageInfo?.hasNextPage === true && edges.length > 0;
        page++;
      }

      if (candidateTitles.length > 0) {
        return formatWorksList(candidateTitles, currentAnimeTitle);
      }
    } catch (err) {
      console.warn('Failed to query staffMedia for staffId:', staffId, err);
    }
  }

  // Fallback to curated DB / title mapping
  return getDirectorWorks(directorName, currentAnimeTitle);
}

/**
 * Converts a person's name from Western order ("First Last") to Japanese/AniDB order ("Last First")
 */
export function formatPersonNameToAniDbOrder(fullName: string): string {
  const clean = (fullName || '').trim();
  if (!clean) return '';

  // If the name already contains a comma like "Ishihara, Tatsuya"
  if (clean.includes(',')) {
    const parts = clean.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]} ${parts.slice(1).join(' ')}`;
    }
  }

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    return clean;
  }
  if (words.length === 2) {
    // e.g. "Tatsuya Ishihara" -> "Ishihara Tatsuya"
    return `${words[1]} ${words[0]}`;
  }
  // For names with 3+ parts:
  const lastName = words[words.length - 1];
  const firstNames = words.slice(0, words.length - 1).join(' ');
  return `${lastName} ${firstNames}`;
}

// Curated AniDB Creator direct URLs for Animation Studios
export const ANIDB_STUDIO_MAP: Record<string, string> = {
  // Top / Common Studios
  'Madhouse': 'https://anidb.net/creator/720',
  'MADHOUSE': 'https://anidb.net/creator/720',
  'MAPPA': 'https://anidb.net/creator/25547',
  'Wit Studio': 'https://anidb.net/creator/28574',
  'WIT STUDIO': 'https://anidb.net/creator/28574',
  'CloverWorks': 'https://anidb.net/creator/48599',
  'A-1 Pictures': 'https://anidb.net/creator/755',
  'ufotable': 'https://anidb.net/creator/803',
  'Ufotable': 'https://anidb.net/creator/803',
  'Bones': 'https://anidb.net/creator/722',
  'BONES': 'https://anidb.net/creator/722',
  'Kyoto Animation': 'https://anidb.net/creator/735',
  'Toei Animation': 'https://anidb.net/creator/726',
  'Pierrot': 'https://anidb.net/creator/728',
  'Studio Pierrot': 'https://anidb.net/creator/728',
  'J.C.Staff': 'https://anidb.net/creator/725',
  'J.C.STAFF': 'https://anidb.net/creator/725',
  'Production I.G': 'https://anidb.net/creator/721',
  'Production IG': 'https://anidb.net/creator/721',
  'Doga Kobo': 'https://anidb.net/creator/758',
  'Shaft': 'https://anidb.net/creator/745',
  'SHAFT': 'https://anidb.net/creator/745',
  'White Fox': 'https://anidb.net/creator/17855',
  'WHITE FOX': 'https://anidb.net/creator/17855',
  'David Production': 'https://anidb.net/creator/16149',
  'david production': 'https://anidb.net/creator/16149',
  'Trigger': 'https://anidb.net/creator/26084',
  'Studio Trigger': 'https://anidb.net/creator/26084',
  'Kinema Citrus': 'https://anidb.net/creator/16601',
  'Studio Bind': 'https://anidb.net/creator/53051',
  'Nexus': 'https://anidb.net/creator/31037',
  'Passione': 'https://anidb.net/creator/32389',
  'Silver Link': 'https://anidb.net/creator/17929',
  'SILVER LINK.': 'https://anidb.net/creator/17929',
  'Liden Films': 'https://anidb.net/creator/28169',
  'LIDENFILMS': 'https://anidb.net/creator/28169',
  'OLM': 'https://anidb.net/creator/738',
  'P.A. Works': 'https://anidb.net/creator/754',
  'P.A. WORKS': 'https://anidb.net/creator/754',
  'Orange': 'https://anidb.net/creator/10777',
  'Science SARU': 'https://anidb.net/creator/34827',
  'Studio Deen': 'https://anidb.net/creator/724',
  'GoHands': 'https://anidb.net/creator/16153',
  'Drive': 'https://anidb.net/creator/43975',
  'CygamesPictures': 'https://anidb.net/creator/44645',
  'Lerche': 'https://anidb.net/creator/28407',
  'feel.': 'https://anidb.net/creator/751',
  'Feel': 'https://anidb.net/creator/751',
  'ENGI': 'https://anidb.net/creator/50607',
  'TMS Entertainment': 'https://anidb.net/creator/737',
  'Sunrise': 'https://anidb.net/creator/723',
  'Bandai Namco Pictures': 'https://anidb.net/creator/38587',
  'Bandai Namco Filmworks': 'https://anidb.net/creator/723',
  'Gainax': 'https://anidb.net/creator/729',
  'Gonzo': 'https://anidb.net/creator/731',
  'Satelight': 'https://anidb.net/creator/744',
  'Studio Gokumi': 'https://anidb.net/creator/22877',
  '8bit': 'https://anidb.net/creator/17937',
  'Eight Bit': 'https://anidb.net/creator/17937',
  'Geno Studio': 'https://anidb.net/creator/44917',
  'Pine Jam': 'https://anidb.net/creator/40871',
  'C-Station': 'https://anidb.net/creator/28343',
  'Project No.9': 'https://anidb.net/creator/24439',
  'project No.9': 'https://anidb.net/creator/24439',
  'Troyca': 'https://anidb.net/creator/34559',
  'TROYCA': 'https://anidb.net/creator/34559',
  'Studio VOLN': 'https://anidb.net/creator/38605',
  'Lay-duce': 'https://anidb.net/creator/35221',
  'Studio Kai': 'https://anidb.net/creator/52809',
  'Millepensee': 'https://anidb.net/creator/33583',
  'Telecom Animation Film': 'https://anidb.net/creator/750',
  'Shin-Ei Animation': 'https://anidb.net/creator/736',
  'Nippon Animation': 'https://anidb.net/creator/727',
  'Tatsunoko Production': 'https://anidb.net/creator/734',
  'Studio Colorido': 'https://anidb.net/creator/26086',
  'Studio Chizu': 'https://anidb.net/creator/28233',
  'Studio Ghibli': 'https://anidb.net/creator/730',
  'CoMix Wave Films': 'https://anidb.net/creator/759',
  'Studio Mother': 'https://anidb.net/creator/54833',
  'Yokohama Animation Lab': 'https://anidb.net/creator/43977',
  'BUG FILMS': 'https://anidb.net/creator/61053',
  'Quad': 'https://anidb.net/creator/58561',
  'Geek Toys': 'https://anidb.net/creator/47711',
  'Bibury Animation Studios': 'https://anidb.net/creator/48603',
  'Felix Film': 'https://anidb.net/creator/37775',
  'Arvo Animation': 'https://anidb.net/creator/48597',
  'EMT Squared': 'https://anidb.net/creator/38589',
  'Staple Entertainment': 'https://anidb.net/creator/58563',
  'Studio LAN': 'https://anidb.net/creator/53053',
  'Blade': 'https://anidb.net/creator/44647',
  'Studio Elle': 'https://anidb.net/creator/48601',
  'Nut': 'https://anidb.net/creator/44643',
  'NUT': 'https://anidb.net/creator/44643',
  'Diomedéa': 'https://anidb.net/creator/752',
  'diomedéa': 'https://anidb.net/creator/752',
  'Brain\'s Base': 'https://anidb.net/creator/747',
  'Seven Arcs': 'https://anidb.net/creator/756',
  'Seven Arcs Pictures': 'https://anidb.net/creator/756',
  'Hal Film Maker': 'https://anidb.net/creator/732',
  'Manglobe': 'https://anidb.net/creator/753',
  'Actas': 'https://anidb.net/creator/748',
  'Gallop': 'https://anidb.net/creator/739',
  'ZEXCS': 'https://anidb.net/creator/749',
  'Studio Comet': 'https://anidb.net/creator/740',
  'Studio Hibari': 'https://anidb.net/creator/743',
  'SynergySP': 'https://anidb.net/creator/757',
  'Tezuka Productions': 'https://anidb.net/creator/733',
  'TNK': 'https://anidb.net/creator/746',
  'Xebec': 'https://anidb.net/creator/741',
  'Fanworks': 'https://anidb.net/creator/28237',
  'Signal.MD': 'https://anidb.net/creator/38591',
  'Zero-G': 'https://anidb.net/creator/40873',
  'Mahho Film': 'https://anidb.net/creator/48605',
  'Maho Film': 'https://anidb.net/creator/48605',
  'Studio KAI': 'https://anidb.net/creator/52809',
  'Flat Studio': 'https://anidb.net/creator/53055',
  'M2': 'https://anidb.net/creator/44649',
  'Studio M2': 'https://anidb.net/creator/44649',
};

/**
 * Returns the direct AniDB creator page URL for an anime studio.
 */
export function getStudioAniDbUrl(studioName?: string): string {
  if (!studioName || !studioName.trim()) return 'https://anidb.net';
  const clean = studioName.trim();

  // 1. Direct match
  if (ANIDB_STUDIO_MAP[clean]) {
    return ANIDB_STUDIO_MAP[clean];
  }

  // 2. Case-insensitive match
  for (const [key, url] of Object.entries(ANIDB_STUDIO_MAP)) {
    if (clean.toLowerCase() === key.toLowerCase()) {
      return url;
    }
  }

  // 3. Substring matching (e.g. "MAPPA Co., Ltd." -> MAPPA)
  for (const [key, url] of Object.entries(ANIDB_STUDIO_MAP)) {
    if (
      clean.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(clean.toLowerCase())
    ) {
      return url;
    }
  }

  // 4. Fallback search on AniDB creators
  return `https://anidb.net/creator/?adb.search=${encodeURIComponent(clean)}&do.search=1`;
}

export function buildAniDbCreatorUrl(name: string, isStudio = false): string {
  if (!name || !name.trim()) return 'https://anidb.net';
  if (isStudio) {
    return getStudioAniDbUrl(name);
  }
  const anidbName = formatPersonNameToAniDbOrder(name);
  return `https://anidb.net/creator/?adb.search=${encodeURIComponent(anidbName)}&do.search=1`;
}

/**
 * Resolves Director(s) and their directed works directly from AniList API:
 * 1. Takes anime anilist ID (or searches by title/director)
 * 2. Identifies all Staff members whose role is strictly "Director" (ignoring ADR / Sound etc.)
 * 3. Queries Staff.staffMedia traversing all available pages for each director
 * 4. Generates AniDB links and formats multiple directors with works:
 *    "diretor1, diretor 2 (trabalho1 diretor1, trabalho2 diretor1 | trabalho1 diretor2, trabalho2 diretor2)"
 */
export async function fetchDirectorAndWorksFromAniList(
  anilistId: number | undefined,
  currentAnimeTitle: string = '',
  knownDirectorName?: string,
  malId?: number
): Promise<DirectorEnrichmentResult> {
  interface RawDirector {
    id: number | null;
    name: string;
    malId?: number;
    malUrl?: string;
  }

  const rawDirectors: RawDirector[] = [];

  // Concurrently fetch MAL metadata (via Jikan API / server proxy)
  const malMetaPromise = malId ? fetchMalMetadata(malId) : Promise.resolve({ studios: [], directors: [] });

  // 1. Query Anime by ID to find all real Director staff members from AniList
  if (anilistId) {
    const animeStaffQuery = `
      query ($id: Int) {
        Media(id: $id) {
          id
          title {
            romaji
            english
            userPreferred
          }
          staff(perPage: 50) {
            edges {
              role
              node {
                id
                name {
                  full
                }
              }
            }
          }
        }
      }
    `;

    try {
      const data = await queryAniListEnricher(animeStaffQuery, { id: anilistId });
      const staffEdges = data?.Media?.staff?.edges || [];

      // Filter all edges with strict Director role
      for (const edge of staffEdges) {
        if (isStrictDirectorRole(edge.role) && edge.node?.name?.full) {
          const name = edge.node.name.full.trim();
          if (!rawDirectors.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
            rawDirectors.push({
              id: edge.node.id,
              name,
            });
          }
        }
      }
    } catch (e) {
      console.warn('Failed to query AniList anime staff:', e);
    }
  }

  const malMeta = await malMetaPromise;

  // 2. If MAL metadata returned directors, cross-reference or adopt them
  if (malMeta.directors && malMeta.directors.length > 0) {
    if (rawDirectors.length === 0) {
      // Adopt MAL directors directly if AniList didn't provide any
      for (const md of malMeta.directors) {
        if (md.name && !rawDirectors.some((rd) => rd.name.toLowerCase() === md.name.toLowerCase())) {
          rawDirectors.push({
            id: null,
            name: md.name,
            malId: md.malId,
            malUrl: md.url,
          });
        }
      }
    } else {
      // Attach MAL metadata to matching AniList directors
      for (const rd of rawDirectors) {
        const match = malMeta.directors.find(
          (md) =>
            md.name.toLowerCase() === rd.name.toLowerCase() ||
            rd.name.toLowerCase().includes(md.name.toLowerCase()) ||
            md.name.toLowerCase().includes(rd.name.toLowerCase())
        );
        if (match) {
          rd.malId = match.malId;
          rd.malUrl = match.url;
        } else if (malMeta.directors.length === 1 && rawDirectors.length === 1) {
          rd.malId = malMeta.directors[0].malId;
          rd.malUrl = malMeta.directors[0].url;
        }
      }
    }
  }

  // 3. Fallback to server endpoint /api/anime-director if still empty
  if (rawDirectors.length === 0) {
    try {
      const serverRes = await fetch(
        `/api/anime-director?malId=${malId || ''}&title=${encodeURIComponent(currentAnimeTitle)}`
      );
      if (serverRes.ok) {
        const sData = await serverRes.json();
        if (sData?.directors && Array.isArray(sData.directors)) {
          for (const d of sData.directors) {
            if (d.name && !rawDirectors.some((rd) => rd.name.toLowerCase() === d.name.toLowerCase())) {
              rawDirectors.push({
                id: null,
                name: d.name,
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch director from /api/anime-director:', e);
    }
  }

  // 4. Fallback to knownDirectorName if still empty and valid
  if (rawDirectors.length === 0 && knownDirectorName && knownDirectorName.trim() !== 'Equipe Principal') {
    const names = knownDirectorName
      .split(/[,/|]/)
      .map((n) => n.trim())
      .filter((n) => Boolean(n) && n !== 'Equipe Principal');

    for (const name of names) {
      const staffSearchQuery = `
        query ($search: String) {
          Staff(search: $search) {
            id
            name {
              full
            }
          }
        }
      `;
      try {
        const staffData = await queryAniListEnricher(staffSearchQuery, { search: name });
        if (staffData?.Staff?.id) {
          rawDirectors.push({
            id: staffData.Staff.id,
            name: staffData.Staff.name?.full || name,
          });
        } else {
          rawDirectors.push({
            id: null,
            name,
          });
        }
      } catch {
        rawDirectors.push({
          id: null,
          name,
        });
      }
    }
  }

  // 5. For each director, resolve works and generate MAL URL with AniList fallback
  const directorsList: DirectorInfo[] = [];

  for (const dir of rawDirectors) {
    const works = await resolveSingleDirectorWorks(dir.id, dir.name, currentAnimeTitle);
    const anilistUrl = dir.id
      ? `https://anilist.co/staff/${dir.id}`
      : `https://anilist.co/search/staff?search=${encodeURIComponent(dir.name)}`;
    const malUrl = dir.malUrl || (dir.malId ? `https://myanimelist.net/people/${dir.malId}` : undefined);
    const activeUrl = malUrl || anilistUrl; // MAL (via Jikan) is primary; AniList is fallback

    directorsList.push({
      id: dir.id,
      name: dir.name,
      malId: dir.malId,
      malUrl,
      anilistUrl,
      url: activeUrl,
      anidbUrl: buildAniDbCreatorUrl(dir.name, false),
      works: works || 'primeiro trabalho',
    });
  }

  // If still empty, return empty list instead of "Equipe Principal"
  if (directorsList.length === 0) {
    if (knownDirectorName && knownDirectorName.trim() && knownDirectorName !== 'Equipe Principal') {
      const fallbackName = knownDirectorName.trim();
      const fallbackWorks = await getDirectorWorks(fallbackName, currentAnimeTitle);
      const fallbackAniListUrl = `https://anilist.co/search/staff?search=${encodeURIComponent(fallbackName)}`;
      return {
        directors: [
          {
            name: fallbackName,
            url: fallbackAniListUrl,
            anilistUrl: fallbackAniListUrl,
            anidbUrl: buildAniDbCreatorUrl(fallbackName, false),
            works: fallbackWorks || 'primeiro trabalho',
          },
        ],
        combinedWorksText: fallbackWorks || 'primeiro trabalho',
        fullDisplayText: `${fallbackName} (${fallbackWorks || 'primeiro trabalho'})`,
      };
    }

    return {
      directors: [],
      combinedWorksText: '',
      fullDisplayText: '',
    };
  }

  const combinedWorksText = directorsList.map((d) => d.works).join(' | ');
  const namesText = directorsList.map((d) => d.name).join(', ');
  const fullDisplayText = `${namesText} (${combinedWorksText})`;

  return {
    directors: directorsList,
    combinedWorksText,
    fullDisplayText,
  };
}

/**
 * Resolves up to 3 works for a director (with franchise deduplication)
 */
export async function getDirectorWorks(
  directorName?: string,
  currentAnimeTitle: string = ''
): Promise<string> {
  let cleanName = (directorName || '').trim();

  // 1. Direct match in DIRECTOR_WORKS_DB
  if (cleanName && DIRECTOR_WORKS_DB[cleanName]) {
    return formatWorksList(DIRECTOR_WORKS_DB[cleanName], currentAnimeTitle);
  }

  // 2. Case-insensitive / partial match in DIRECTOR_WORKS_DB
  if (cleanName) {
    for (const [key, works] of Object.entries(DIRECTOR_WORKS_DB)) {
      if (
        cleanName.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(cleanName.toLowerCase())
      ) {
        return formatWorksList(works, currentAnimeTitle);
      }
    }
  }

  // 3. Title fallback lookup
  if (currentAnimeTitle) {
    const titleLower = currentAnimeTitle.toLowerCase();
    for (const [key, meta] of Object.entries(ANIME_METADATA_FALLBACK)) {
      if (titleLower.includes(key)) {
        if (meta.notableWorks && meta.notableWorks.length > 0) {
          return formatWorksList(meta.notableWorks, currentAnimeTitle);
        }
      }
    }
  }

  // 4. Try Jikan API
  if (cleanName) {
    try {
      const res = await fetch(`https://api.jikan.moe/v4/people?q=${encodeURIComponent(cleanName)}&limit=1`);
      if (res.ok) {
        const json = await res.json();
        const personId = json?.data?.[0]?.mal_id;
        if (personId) {
          const animeListRes = await fetch(`https://api.jikan.moe/v4/people/${personId}/anime`);
          if (animeListRes.ok) {
            const listJson = await animeListRes.json();
            const candidateTitles: string[] = [];
            (listJson.data || []).forEach((item: any) => {
              const role = (item.position || '').toLowerCase();
              if (role.includes('director') || role.includes('diretor')) {
                const title = item.anime?.title;
                if (title && !candidateTitles.includes(title)) {
                  candidateTitles.push(title);
                }
              }
            });
            if (candidateTitles.length > 0) {
              return formatWorksList(candidateTitles, currentAnimeTitle);
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return 'primeiro trabalho';
}

// Curated database of notable animation works for anime studios
const STUDIO_WORKS_DB: Record<string, string[]> = {
  'Madhouse': ['Death Note', 'Hunter x Hunter (2011)', 'One Punch Man', 'Sousou no Frieren', 'Monster'],
  'MAPPA': ['Jujutsu Kaisen', 'Chainsaw Man', 'Shingeki no Kyojin The Final Season', 'Vinland Saga S2'],
  'Wit Studio': ['Shingeki no Kyojin', 'Spy x Family', 'Vinland Saga', 'Ousama Ranking', 'Vivy'],
  'CloverWorks': ['Bocchi the Rock!', 'The Promised Neverland', 'Sono Bisque Doll', 'Spy x Family'],
  'A-1 Pictures': ['Sword Art Online', 'Kaguya-sama wa Kokurasetai', 'Solo Leveling', '86: Eighty-Six'],
  'ufotable': ['Kimetsu no Yaiba', 'Fate/Zero', 'Fate/stay night: Unlimited Blade Works', 'Kara no Kyoukai'],
  'Bones': ['Fullmetal Alchemist: Brotherhood', 'Boku no Hero Academia', 'Mob Psycho 100', 'Bungou Stray Dogs'],
  'Kyoto Animation': ['Violet Evergarden', 'Koe no Katachi', 'Clannad', 'Hibike! Euphonium', 'K-On!'],
  'Toei Animation': ['One Piece', 'Dragon Ball Z', 'Sailor Moon', 'Slam Dunk', 'Digimon Adventure'],
  'Pierrot': ['Naruto', 'Bleach', 'Tokyo Ghoul', 'Black Clover', 'Yu Yu Hakusho'],
  'J.C.Staff': ['Toradora!', 'DanMachi', 'Shokugeki no Souma', 'Toaru Majutsu no Index'],
  'Production I.G': ['Haikyuu!!', 'Psycho-Pass', 'Kuroko no Basket', 'Ghost in the Shell: SAC'],
  'Doga Kobo': ['Oshi no Ko', 'Plastic Memories', 'Gekkan Shoujo Nozaki-kun', 'New Game!'],
  'Shaft': ['Bakemonogatari', 'Mahou Shoujo Madoka★Magica', '3-gatsu no Lion', 'Nisekoi'],
  'White Fox': ['Steins;Gate', 'Re:Zero kara Hajimeru Isekai Seikatsu', 'Akame ga Kill!', 'Katanagatari'],
  'David Production': ['JoJo no Kimyou na Bouken', 'Enen no Shouboutai', 'Hataraku Saibou', 'Urusei Yatsura'],
  'Trigger': ['Kill la Kill', 'Cyberpunk: Edgerunners', 'Delicious in Dungeon', 'Little Witch Academia'],
  'Kinema Citrus': ['Made in Abyss', 'Tate no Yuusha no Nariagari', 'Shoujo☆Kageki Revue Starlight'],
  'Studio Bind': ['Mushoku Tensei: Isekai Ittara Honki Dasu', 'Oniichan wa Oshimai!'],
  'Nexus': ['Kage no Jitsuryokusha ni Naritakute!', 'Rakudai Kishi no Cavalry', 'Granbelm'],
  'Passione': ['Mieruko-chan', 'Rokka no Yuusha', 'Ishuzoku Reviewers', 'High School DxD Hero'],
  'Silver Link': ['Kokoro Connect', 'Non Non Biyori', 'Fate/kaleid liner Prisma☆Illya', 'Bofuri'],
  'Liden Films': ['Tokyo Revengers', 'Yofukashi no Uta', 'Rurouni Kenshin (2023)', 'Yamada-kun to 7-nin no Majo'],
  'OLM': ['Komi-san wa, Komyushou desu.', 'Kusuriya no Hitorigoto', 'Odd Taxi', 'Pokemon'],
  'P.A. Works': ['Angel Beats!', 'Charlotte', 'Shirobako', 'Ya Boy Kongming!'],
  'Orange': ['Houseki no Kuni', 'Beastars', 'Trigun Stampede'],
  'Science SARU': ['Dandadan', 'Devilman: Crybaby', 'Eizouken ni wa Te wo Dasu na!', 'Heike Monogatari'],
  'Studio Deen': ['KonoSuba', 'Higurashi no Naku Koro ni', 'Fate/stay night', 'Rurouni Kenshin'],
  'GoHands': ['K', 'Dekiru Neko wa Kyou mo Yuuutsu', 'Suki na Ko ga Megane wo Wasureta', 'Seitokai Yakuindomo'],
  'Drive': ['KonoSuba: God\'s Blessing on this Wonderful World! 3', 'Uzumaki', 'To Your Eternity S2'],
  'CygamesPictures': ['Princess Connect! Re:Dive', 'Uma Musume: Pretty Derby - Road to the Top'],
  'Lerche': ['Ansatsu Kyoushitsu', 'Given', 'Danganronpa', 'Youkoso Jitsuryoku Shijou Shugi no Kyoushitsu e'],
  'feel.': ['Yahari Ore no Seishun Love Come wa Machigatteiru.', 'Tsuki ga Kirei', 'Hinamatsuri'],
  'ENGI': ['Uzaki-chan wa Asobitai!', 'Tantei wa Mou, Shindeiru.', 'Otome Game Sekai wa Mob ni Kibishii Sekai desu'],
};

// Studio Logos mapped by clean studio name
const STUDIO_LOGOS: Record<string, string> = {
  'MAPPA': 'https://images.weserv.nl/?url=raw.githubusercontent.com/walkxcode/dashboard-icons/main/svg/mappa.svg&w=140&fit=contain',
  'Madhouse': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/7/75/Madhouse_logo.svg&w=140&fit=contain',
  'Wit Studio': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/5/5a/Wit_Studio_logo.svg&w=140&fit=contain',
  'CloverWorks': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/6/67/CloverWorks_logo.svg&w=140&fit=contain',
  'A-1 Pictures': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/8/87/A-1_Pictures_logo.svg&w=140&fit=contain',
  'ufotable': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/5/52/Ufotable_logo.svg&w=140&fit=contain',
  'Bones': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/a/a2/Bones_logo.svg&w=140&fit=contain',
  'Kyoto Animation': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/8/82/Kyoto_Animation_logo.svg&w=140&fit=contain',
  'Toei Animation': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/0/07/Toei_Animation_logo.svg&w=140&fit=contain',
  'Pierrot': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/b/b3/Pierrot_Co.%2C_Ltd._Logo.svg&w=140&fit=contain',
  'J.C.Staff': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/b/be/J.C.STAFF_logo.svg&w=140&fit=contain',
  'Production I.G': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/9/90/Production_I.G_logo.svg&w=140&fit=contain',
  'Doga Kobo': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/9/9e/Doga_Kobo_Logo.svg&w=140&fit=contain',
  'Shaft': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/e/e0/Shaft_Logo.svg&w=140&fit=contain',
  'White Fox': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/7/7b/White_Fox_logo.svg&w=140&fit=contain',
  'David Production': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/2/29/David_Production_Logo.svg&w=140&fit=contain',
  'Trigger': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/f/f6/Studio_Trigger_Logo.svg&w=140&fit=contain',
  'Kinema Citrus': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/4/4b/Kinema_Citrus_logo.svg&w=140&fit=contain',
  'Studio Bind': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/3/30/Studio_Bind_Logo.svg&w=140&fit=contain',
  'Nexus': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/e/e7/Nexus_logo.svg&w=140&fit=contain',
  'Science SARU': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/9/9a/Science_SARU_logo.svg&w=140&fit=contain',
  'Studio Deen': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/5/5a/Studio_Deen_logo.svg&w=140&fit=contain',
  'Orange': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/3/30/Orange_Animation_Studio_logo.svg&w=140&fit=contain',
  'P.A. Works': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/3/31/P.A.Works_logo.svg&w=140&fit=contain',
  'P.A.Works': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/3/31/P.A.Works_logo.svg&w=140&fit=contain',
  'Sunrise': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/2/23/Sunrise_logo.svg&w=140&fit=contain',
  'TMS Entertainment': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/d/dd/TMS_Entertainment_logo.svg&w=140&fit=contain',
  'OLM': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/5/5a/OLM_Logo.svg&w=140&fit=contain',
  'Liden Films': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/3/36/Liden_Films_logo.svg&w=140&fit=contain',
  'LIDENFILMS': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/3/36/Liden_Films_logo.svg&w=140&fit=contain',
  'Silver Link': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/7/7f/Silver_Link_logo.svg&w=140&fit=contain',
  '8bit': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/1/1a/8-Bit_logo.svg&w=140&fit=contain',
  'CoMix Wave Films': 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/0/02/CoMix_Wave_Films_logo.svg&w=140&fit=contain',
};

export interface StudioInfo {
  id?: number;
  name: string;
  malId?: number;
  malUrl?: string;
  anilistUrl?: string;
  siteUrl?: string;
  url: string;
  anidbUrl: string;
  works: string;
  logoUrl?: string;
}

export interface StudioEnrichmentResult {
  studio: StudioInfo | null;
  worksText: string;
}

/**
 * Resolves Studio and its animation works directly from AniList API (media where isMain: true)
 * Retrieves official MyAnimeList studio link using malId via Jikan API (falling back to AniList studio link if unavailable).
 */
export async function fetchStudioAndWorksFromAniList(
  anilistId: number | undefined,
  currentAnimeTitle: string = '',
  knownStudioName?: string,
  malId?: number
): Promise<StudioEnrichmentResult> {
  let resolvedStudioId: number | undefined;
  let resolvedStudioName = (knownStudioName || '').trim();
  let resolvedStudioSiteUrl: string | undefined;
  let candidateWorks: string[] = [];

  // Concurrently fetch MAL metadata (via Jikan API / server proxy)
  const malMetaPromise = malId ? fetchMalMetadata(malId) : Promise.resolve({ studios: [], directors: [] });

  // 1. Query AniList for anime's main animation studio and its top animation works
  if (anilistId) {
    const studioQuery = `
      query ($id: Int) {
        Media(id: $id) {
          id
          studios {
            edges {
              isMain
              node {
                id
                name
                siteUrl
                media(isMain: true, sort: POPULARITY_DESC, perPage: 15) {
                  nodes {
                    id
                    title {
                      romaji
                      english
                      userPreferred
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const data = await queryAniListEnricher(studioQuery, { id: anilistId });
      const edges = data?.Media?.studios?.edges || [];

      // Find main animation studio
      const mainEdge = edges.find((e: any) => e.isMain) || edges[0];
      if (mainEdge?.node?.name) {
        resolvedStudioId = mainEdge.node.id;
        resolvedStudioName = mainEdge.node.name.trim();
        resolvedStudioSiteUrl =
          mainEdge.node.siteUrl ||
          (mainEdge.node.id ? `https://anilist.co/studio/${mainEdge.node.id}` : undefined);

        const mediaNodes = mainEdge.node.media?.nodes || [];
        for (const m of mediaNodes) {
          const title = m.title?.romaji || m.title?.userPreferred || m.title?.english;
          if (title && !candidateWorks.includes(title)) {
            candidateWorks.push(title);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch studio from AniList:', err);
    }
  }

  // 2. If studio ID/siteUrl is not yet found, try searching studio by name on AniList
  if (!resolvedStudioSiteUrl && resolvedStudioName && !resolvedStudioName.includes('Desconhecido')) {
    const studioSearchQuery = `
      query ($search: String) {
        Studio(search: $search) {
          id
          name
          siteUrl
          isAnimationStudio
        }
      }
    `;
    try {
      const studioData = await queryAniListEnricher(studioSearchQuery, {
        search: resolvedStudioName,
      });
      if (studioData?.Studio?.id) {
        resolvedStudioId = studioData.Studio.id;
        resolvedStudioSiteUrl =
          studioData.Studio.siteUrl || `https://anilist.co/studio/${studioData.Studio.id}`;
        if (!resolvedStudioName) {
          resolvedStudioName = studioData.Studio.name || resolvedStudioName;
        }
      }
    } catch {
      // ignore
    }
  }

  const malMeta = await malMetaPromise;

  // Find matching MAL studio from Jikan / MAL
  let directMalStudioUrl: string | undefined;
  let directMalStudioId: number | undefined;

  if (malMeta.studios && malMeta.studios.length > 0) {
    const malMatch = malMeta.studios.find(
      (ms) =>
        (resolvedStudioName && ms.name.toLowerCase() === resolvedStudioName.toLowerCase()) ||
        (resolvedStudioName && ms.name.toLowerCase().includes(resolvedStudioName.toLowerCase())) ||
        (resolvedStudioName && resolvedStudioName.toLowerCase().includes(ms.name.toLowerCase()))
    );

    if (malMatch) {
      directMalStudioUrl = malMatch.url;
      directMalStudioId = malMatch.malId;
      if (!resolvedStudioName) {
        resolvedStudioName = malMatch.name;
      }
    } else if (malMeta.studios.length === 1) {
      directMalStudioUrl = malMeta.studios[0].url;
      directMalStudioId = malMeta.studios[0].malId;
      if (!resolvedStudioName) {
        resolvedStudioName = malMeta.studios[0].name;
      }
    }
  }

  // Fallback AniList studio URL if MAL/Jikan is down or unavailable
  const anilistStudioUrl =
    resolvedStudioSiteUrl ||
    (resolvedStudioId ? `https://anilist.co/studio/${resolvedStudioId}` : undefined) ||
    (resolvedStudioName
      ? `https://anilist.co/search/anime?studios=${encodeURIComponent(resolvedStudioName)}`
      : 'https://anilist.co');

  // Direct active URL: MAL is primary (via Jikan); AniList is fallback
  const finalActiveUrl = directMalStudioUrl || anilistStudioUrl;

  // Direct AniDB Creator URL for studio
  const directAnidbUrl = getStudioAniDbUrl(resolvedStudioName);

  // Resolved logo URL: MAL CDN image or static logo
  const resolvedLogoUrl = directMalStudioId
    ? `https://cdn.myanimelist.net/images/company/${directMalStudioId}.png`
    : getStudioLogoUrl(resolvedStudioName) || undefined;

  // 3. If we found works from AniList, format and return
  if (resolvedStudioName && candidateWorks.length > 0) {
    const worksText = formatWorksList(candidateWorks, currentAnimeTitle);
    return {
      studio: {
        id: resolvedStudioId,
        name: resolvedStudioName,
        malId: directMalStudioId,
        malUrl: directMalStudioUrl,
        anilistUrl: anilistStudioUrl,
        siteUrl: finalActiveUrl,
        url: finalActiveUrl,
        anidbUrl: directAnidbUrl,
        works: worksText || 'primeiro trabalho',
        logoUrl: resolvedLogoUrl,
      },
      worksText: worksText || 'primeiro trabalho',
    };
  }

  // 4. If studio name is known, fallback to getStudioWorks (Curated DB / Jikan)
  if (resolvedStudioName && !resolvedStudioName.includes('Desconhecido')) {
    const worksText = await getStudioWorks(resolvedStudioName, currentAnimeTitle);
    return {
      studio: {
        id: resolvedStudioId,
        name: resolvedStudioName,
        malId: directMalStudioId,
        malUrl: directMalStudioUrl,
        anilistUrl: anilistStudioUrl,
        siteUrl: finalActiveUrl,
        url: finalActiveUrl,
        anidbUrl: directAnidbUrl,
        works: worksText || 'primeiro trabalho',
        logoUrl: resolvedLogoUrl,
      },
      worksText: worksText || 'primeiro trabalho',
    };
  }

  return {
    studio: resolvedStudioName
      ? {
          id: resolvedStudioId,
          name: resolvedStudioName,
          malId: directMalStudioId,
          malUrl: directMalStudioUrl,
          anilistUrl: anilistStudioUrl,
          siteUrl: finalActiveUrl,
          url: finalActiveUrl,
          anidbUrl: directAnidbUrl,
          works: 'primeiro trabalho',
          logoUrl: resolvedLogoUrl,
        }
      : null,
    worksText: 'primeiro trabalho',
  };
}

/**
 * Resolves up to 3 works for a studio (as animation production / animation work)
 */
export async function getStudioWorks(
  studioName: string,
  currentAnimeTitle: string
): Promise<string> {
  if (!studioName || studioName.trim() === '' || studioName.includes('Desconhecido')) {
    return 'primeiro trabalho';
  }

  const cleanStudio = studioName.trim();

  // 1. Check known studio works
  for (const [key, works] of Object.entries(STUDIO_WORKS_DB)) {
    if (
      cleanStudio.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(cleanStudio.toLowerCase())
    ) {
      return formatWorksList(works, currentAnimeTitle);
    }
  }

  // 2. Try AnimeThemes studio endpoint
  try {
    const res = await fetch(
      `https://api.animethemes.moe/studio?filter[name]=${encodeURIComponent(cleanStudio)}&include=anime`
    );
    if (res.ok) {
      const json = await res.json();
      const studio = json?.studios?.[0];
      if (studio?.anime && Array.isArray(studio.anime)) {
        const titles: string[] = studio.anime
          .map((a: any) => a.name)
          .filter(Boolean);
        if (titles.length > 0) {
          return formatWorksList(titles, currentAnimeTitle);
        }
      }
    }
  } catch {
    // ignore
  }

  return 'primeiro trabalho';
}

/**
 * Returns studio logo URL if available
 */
export function getStudioLogoUrl(studioName: string): string | null {
  if (!studioName) return null;
  const name = studioName.trim();

  for (const [key, url] of Object.entries(STUDIO_LOGOS)) {
    if (name.toLowerCase() === key.toLowerCase() || name.toLowerCase().includes(key.toLowerCase())) {
      return url;
    }
  }

  return null;
}

/**
 * Asynchronously resolves studio logo URL via AnimeThemes API or MAL studio ID
 */
export async function fetchStudioLogoFromAnimeThemes(
  studioName: string,
  malStudioId?: number
): Promise<string | null> {
  if (malStudioId) {
    return `https://cdn.myanimelist.net/images/company/${malStudioId}.png`;
  }

  const staticLogo = getStudioLogoUrl(studioName);
  if (staticLogo) {
    return staticLogo;
  }

  if (studioName && !studioName.includes('Desconhecido')) {
    try {
      // Query AnimeThemes API for studio resources and images without rate-limits or 504 timeouts
      const res = await fetch(
        `https://api.animethemes.moe/studio?filter[name]=${encodeURIComponent(studioName.trim())}&include=images,resources`,
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      if (res.ok) {
        const json = await res.json();
        const studio = json?.studios?.[0];
        if (studio) {
          // 1. Check for images array returned by AnimeThemes
          if (Array.isArray(studio.images) && studio.images.length > 0) {
            const img = studio.images.find((i: any) => i.link || i.path);
            if (img) {
              return img.link || img.path;
            }
          }

          // 2. Check resources array for MyAnimeList producer link to construct CDN image URL instantly
          if (Array.isArray(studio.resources)) {
            const malRes = studio.resources.find(
              (r: any) => r.site === 'MyAnimeList' || (r.link && r.link.includes('myanimelist.net/anime/producer'))
            );
            if (malRes?.link) {
              const match = malRes.link.match(/producer\/(\d+)/);
              if (match?.[1]) {
                return `https://cdn.myanimelist.net/images/company/${match[1]}.png`;
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch studio logo from AnimeThemes API:', err);
    }
  }

  return null;
}

// Alias for backwards compatibility
export const fetchStudioLogoFromJikan = fetchStudioLogoFromAnimeThemes;
