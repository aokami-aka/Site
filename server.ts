import express from 'express';
import path from 'path';
import https from 'https';
import http from 'http';
import { spawn } from 'child_process';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory caches
  const translationCache = new Map<string, string>();
  const directorCache = new Map<string, any>();
  const linksCache = new Map<string, any>();
  const malMetadataCache = new Map<string, any>();

  // Translation to Portuguese endpoint (Google Translate server-side with multi-provider fallbacks)
  const handleTranslation = async (rawText: string): Promise<string> => {
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

    // If text is already Portuguese
    const ptMarkers = /\b(uma|um|ele|ela|sua|seu|para|com|não|são|está|quando|jornada|história|aventura|amigos|mundo|garoto|garota|estudante|escola|temporada)\b/gi;
    const enMarkers = /\b(the|and|with|after|when|about|their|which|from|into|journey|battle|story|school|boy|girl)\b/gi;
    const ptMatches = (clean.match(ptMarkers) || []).length;
    const enMatches = (clean.match(enMarkers) || []).length;
    if (ptMatches >= 3 && enMatches === 0) {
      return clean;
    }

    // Check memory cache
    if (translationCache.has(clean)) {
      return translationCache.get(clean)!;
    }

    // Helper timeout fetch
    const fetchWithTimeout = async (url: string, options: any = {}, timeoutMs = 4000) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeout);
        return response;
      } catch (err) {
        clearTimeout(timeout);
        throw err;
      }
    };

    // 1. Google Translate GTX (POST - prevents 414 URI Too Long for long synopses)
    try {
      const gtxRes = await fetchWithTimeout(
        'https://translate.googleapis.com/translate_a/single',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: '*/*',
          },
          body: new URLSearchParams({
            client: 'gtx',
            sl: 'auto',
            tl: 'pt',
            dt: 't',
            q: clean,
          }),
        },
        4000
      );

      if (gtxRes.ok) {
        const data = (await gtxRes.json()) as any;
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translated = data[0]
            .map((chunk: any) => chunk?.[0] || '')
            .join('')
            .trim();
          if (translated && translated.length > 5) {
            translationCache.set(clean, translated);
            return translated;
          }
        }
      }
    } catch (err) {
      console.warn('Google Translate GTX POST error:', err);
    }

    // 2. Google Translate GTX (GET with query string)
    try {
      const gtxGetUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t&q=${encodeURIComponent(
        clean
      )}`;
      const gtxGetRes = await fetchWithTimeout(
        gtxGetUrl,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: '*/*',
          },
        },
        3500
      );

      if (gtxGetRes.ok) {
        const data = (await gtxGetRes.json()) as any;
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translated = data[0]
            .map((chunk: any) => chunk?.[0] || '')
            .join('')
            .trim();
          if (translated && translated.length > 5) {
            translationCache.set(clean, translated);
            return translated;
          }
        }
      }
    } catch (err) {
      // ignore
    }

    // 3. Google Translate client dict-chrome-ex
    try {
      const clients5Url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=pt&q=${encodeURIComponent(
        clean
      )}`;
      const cRes = await fetchWithTimeout(
        clients5Url,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            Accept: 'application/json',
          },
        },
        3500
      );
      if (cRes.ok) {
        const data = (await cRes.json()) as any;
        if (Array.isArray(data) && typeof data[0] === 'string') {
          const joined = data.join('').trim();
          if (joined && joined.length > 5) {
            translationCache.set(clean, joined);
            return joined;
          }
        } else if (typeof data === 'string' && data.trim().length > 5) {
          translationCache.set(clean, data.trim());
          return data.trim();
        }
      }
    } catch {
      // ignore
    }

    // 4. Lingva instances
    const lingvaInstances = ['https://lingva.ml', 'https://translate.plausibility.cloud'];
    for (const inst of lingvaInstances) {
      try {
        const lingvaUrl = `${inst}/api/v1/auto/pt/${encodeURIComponent(clean)}`;
        const lingvaRes = await fetchWithTimeout(
          lingvaUrl,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              Accept: 'application/json',
            },
          },
          3000
        );
        if (lingvaRes.ok) {
          const data = (await lingvaRes.json()) as any;
          if (data?.translation && data.translation.trim().length > 5) {
            translationCache.set(clean, data.translation.trim());
            return data.translation.trim();
          }
        }
      } catch {
        // try next
      }
    }

    // 5. MyMemory in chunks if long
    try {
      const chunks: string[] = [];
      const maxLength = 450;
      let remaining = clean;
      while (remaining.length > 0) {
        if (remaining.length <= maxLength) {
          chunks.push(remaining);
          break;
        }
        let splitIdx = remaining.lastIndexOf('.', maxLength);
        if (splitIdx === -1 || splitIdx < 200) {
          splitIdx = remaining.lastIndexOf(' ', maxLength);
        }
        if (splitIdx === -1) splitIdx = maxLength;
        chunks.push(remaining.slice(0, splitIdx + 1));
        remaining = remaining.slice(splitIdx + 1).trim();
      }

      const translatedChunks: string[] = [];
      for (const chunk of chunks) {
        const myMemUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          chunk
        )}&langpair=en|pt-BR`;
        const myMemRes = await fetchWithTimeout(myMemUrl, {}, 2500);
        if (myMemRes.ok) {
          const data = (await myMemRes.json()) as any;
          const text = data?.responseData?.translatedText;
          if (text) {
            translatedChunks.push(text);
          } else {
            translatedChunks.push(chunk);
          }
        } else {
          translatedChunks.push(chunk);
        }
      }

      const result = translatedChunks.join(' ').trim();
      if (result && result.length > 5) {
        translationCache.set(clean, result);
        return result;
      }
    } catch {
      // ignore
    }

    return clean;
  };

  app.post('/api/translate', async (req, res) => {
    const text = (req.body?.text || req.query.text || '') as string;
    const translated = await handleTranslation(text);
    res.json({ translation: translated });
  });

  app.get('/api/translate', async (req, res) => {
    const text = (req.query.text || '') as string;
    const translated = await handleTranslation(text);
    res.json({ translation: translated });
  });

  // AniList GraphQL Proxy endpoint
  app.post('/api/anilist-proxy', async (req, res) => {
    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://anilist.co/',
          Origin: 'https://anilist.co',
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err: any) {
      console.warn('AniList proxy error:', err);
      return res.status(502).json({ error: err?.message || 'AniList proxy error' });
    }
  });

  // Endpoint to convert and stream AnimeThemes audio to MP3 using FFmpeg
  app.get('/api/convert-audio', (req, res) => {
    const audioUrl = req.query.url as string;
    const title = (req.query.title as string) || 'audio';

    if (!audioUrl || !audioUrl.startsWith('http')) {
      return res.status(400).send('Invalid audio URL');
    }

    const safeTitle = encodeURIComponent(title.replace(/[/\\?%*:|"<>]/g, '_'));
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp3"; filename*=UTF-8''${safeTitle}.mp3`);
    res.setHeader('Content-Type', 'audio/mpeg');

    const client = audioUrl.startsWith('https') ? https : http;

    const request = client.get(
      audioUrl,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://animethemes.moe/',
        },
      },
      (upstreamRes) => {
        if (upstreamRes.statusCode !== 200) {
          return res.status(upstreamRes.statusCode || 502).send('Error fetching upstream audio');
        }

        const ffmpeg = spawn('ffmpeg', [
          '-nostdin',
          '-y',
          '-i',
          'pipe:0',
          '-vn',
          '-acodec',
          'libmp3lame',
          '-q:a',
          '2',
          '-f',
          'mp3',
          'pipe:1',
        ]);

        upstreamRes.pipe(ffmpeg.stdin);
        ffmpeg.stdout.pipe(res);

        ffmpeg.stderr.on('data', () => {});

        ffmpeg.on('error', (err) => {
          console.error('FFmpeg audio process error:', err);
          if (!res.headersSent) {
            res.status(500).send('FFmpeg conversion error');
          }
        });

        req.on('close', () => {
          try {
            ffmpeg.kill('SIGKILL');
          } catch {}
        });
      }
    );

    request.on('error', (err) => {
      console.error('Audio fetch request error:', err);
      if (!res.headersSent) {
        res.status(502).send('Failed to connect to audio source');
      }
    });
  });

  // Endpoint to convert and stream AnimeThemes video (WebM/VP9) to standard MP4 using FFmpeg
  app.get('/api/convert-video', (req, res) => {
    const videoUrl = req.query.url as string;
    const title = (req.query.title as string) || 'video';

    if (!videoUrl || !videoUrl.startsWith('http')) {
      return res.status(400).send('Invalid video URL');
    }

    const safeTitle = encodeURIComponent(title.replace(/[/\\?%*:|"<>]/g, '_'));
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp4"; filename*=UTF-8''${safeTitle}.mp4`);
    res.setHeader('Content-Type', 'video/mp4');

    const isAlreadyMp4 = videoUrl.toLowerCase().includes('.mp4');

    const ffmpegArgs = [
      '-nostdin',
      '-y',
      '-headers',
      'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AnimeGuides/1.0\r\nReferer: https://animethemes.moe/\r\n',
      '-reconnect',
      '1',
      '-reconnect_streamed',
      '1',
      '-reconnect_delay_max',
      '5',
      '-i',
      videoUrl,
      ...(isAlreadyMp4
        ? ['-c', 'copy']
        : [
            '-c:v',
            'libx264',
            '-preset',
            'veryfast',
            '-crf',
            '22',
            '-pix_fmt',
            'yuv420p',
            '-c:a',
            'aac',
            '-b:a',
            '192k',
          ]),
      '-movflags',
      'frag_keyframe+empty_moov+default_base_moof',
      '-f',
      'mp4',
      'pipe:1',
    ];

    const ffmpeg = spawn('ffmpeg', ffmpegArgs);

    ffmpeg.stdout.pipe(res);

    ffmpeg.stderr.on('data', () => {});

    ffmpeg.on('error', (err) => {
      console.error('FFmpeg video process error:', err);
      if (!res.headersSent) {
        res.status(500).send('FFmpeg conversion error');
      }
    });

    req.on('close', () => {
      try {
        ffmpeg.kill('SIGKILL');
      } catch {}
    });
  });

  // API to resolve anime MAL metadata (Studio & Director official MyAnimeList URLs via Jikan API with MAL scraper fallback)
  app.get('/api/anime-mal-metadata', async (req, res) => {
    const malId = req.query.malId as string;

    if (!malId || !/^\d+$/.test(malId)) {
      return res.status(400).json({ error: 'Valid numeric malId is required', studios: [], directors: [] });
    }

    const cacheKey = `mal_meta_${malId}`;
    if (malMetadataCache.has(cacheKey)) {
      return res.json(malMetadataCache.get(cacheKey));
    }

    const studios: Array<{ malId?: number; name: string; url: string }> = [];
    const directors: Array<{ malId?: number; name: string; url: string; role?: string }> = [];

    // Helper for fetch with timeout
    const fetchWithTimeout = async (url: string, timeoutMs = 4000) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/json',
          },
        });
        clearTimeout(timeout);
        return response;
      } catch (err) {
        clearTimeout(timeout);
        throw err;
      }
    };

    // 1. Try Jikan API v4 (Official REST API for MyAnimeList)
    try {
      const [animeRes, staffRes] = await Promise.allSettled([
        fetchWithTimeout(`https://api.jikan.moe/v4/anime/${malId}`, 3500),
        fetchWithTimeout(`https://api.jikan.moe/v4/anime/${malId}/staff`, 3500),
      ]);

      if (animeRes.status === 'fulfilled' && animeRes.value.ok) {
        const animeData: any = await animeRes.value.json();
        const rawStudios = animeData?.data?.studios || [];
        for (const st of rawStudios) {
          if (st.name && st.url) {
            studios.push({
              malId: st.mal_id,
              name: st.name.trim(),
              url: st.url,
            });
          }
        }
      }

      if (staffRes.status === 'fulfilled' && staffRes.value.ok) {
        const staffData: any = await staffRes.value.json();
        const staffList = staffData?.data || [];
        for (const item of staffList) {
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

            if (!directors.some((d) => d.name.toLowerCase() === westernName.toLowerCase())) {
              directors.push({
                malId: item.person.mal_id,
                name: westernName,
                url: item.person.url || `https://myanimelist.net/people/${item.person.mal_id}`,
                role: positions.join(', '),
              });
            }
          }
        }
      }
    } catch (jikanErr) {
      console.warn(`Jikan API fetch error for MAL ${malId}:`, jikanErr);
    }

    // 2. Fallback: If Jikan was down / empty, scrape MyAnimeList directly
    if (studios.length === 0) {
      try {
        const malPageRes = await fetchWithTimeout(`https://myanimelist.net/anime/${malId}`, 3500);
        if (malPageRes.ok) {
          const html = await malPageRes.text();
          // Match studio links: <a href="https://myanimelist.net/anime/producer/43/ufotable">ufotable</a>
          const studioRegex = /href=\"(https:\/\/myanimelist\.net\/anime\/producer\/(\d+)\/[^\"]*)\"[^>]*>([^<]+)<\/a>/g;
          let match: RegExpExecArray | null;
          while ((match = studioRegex.exec(html)) !== null) {
            const sUrl = match[1];
            const sId = parseInt(match[2], 10);
            const sName = match[3].trim();
            if (sName && !studios.some((s) => s.name.toLowerCase() === sName.toLowerCase())) {
              studios.push({
                malId: sId,
                name: sName,
                url: sUrl,
              });
            }
          }
        }
      } catch (scrapeErr) {
        console.warn(`MAL studio scrape error for MAL ${malId}:`, scrapeErr);
      }
    }

    if (directors.length === 0) {
      try {
        const malStaffRes = await fetchWithTimeout(`https://myanimelist.net/anime/${malId}/_/characters`, 3500);
        if (malStaffRes.ok) {
          const html = await malStaffRes.text();
          const regex =
            /<a href=\"([^\"]*\/people\/(\d+)\/[^\"]*)\">([^<]+)<\/a>\s*<div class=\"spaceit_pad\">\s*<small>([^<]+)<\/small>/g;
          let match: RegExpExecArray | null;

          while ((match = regex.exec(html)) !== null) {
            const dUrl = match[1];
            const dId = parseInt(match[2], 10);
            const rawName = match[3].trim();
            const rawRole = match[4].trim();
            const positions = rawRole.split(',').map((p) => p.trim());

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

            if (isDir) {
              let westernName = rawName;
              if (rawName.includes(',')) {
                const parts = rawName.split(',').map((p) => p.trim());
                if (parts.length >= 2) {
                  westernName = `${parts[1]} ${parts[0]}`;
                }
              }

              if (!directors.some((d) => d.name.toLowerCase() === westernName.toLowerCase())) {
                directors.push({
                  malId: dId,
                  name: westernName,
                  url: dUrl.startsWith('http') ? dUrl : `https://myanimelist.net${dUrl}`,
                  role: rawRole,
                });
              }
            }
          }
        }
      } catch (scrapeErr) {
        console.warn(`MAL director scrape error for MAL ${malId}:`, scrapeErr);
      }
    }

    const result = { studios, directors };
    if (studios.length > 0 || directors.length > 0) {
      malMetadataCache.set(cacheKey, result);
    }
    return res.json(result);
  });

  // API to resolve anime Director(s) strictly from MyAnimeList characters/staff
  app.get('/api/anime-director', async (req, res) => {
    const malId = req.query.malId as string;
    const title = (req.query.title as string) || '';

    const cacheKey = `director_${malId || title}`;
    if (directorCache.has(cacheKey)) {
      return res.json(directorCache.get(cacheKey));
    }

    const directors: Array<{ name: string; anidbUrl: string; anidbName: string }> = [];

    if (malId && /^\d+$/.test(malId)) {
      try {
        const malUrl = `https://myanimelist.net/anime/${malId}/_/characters`;
        const response = await fetch(malUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });

        if (response.ok) {
          const html = await response.text();
          const regex =
            /<a href=\"[^\"]*\/people\/\d+\/[^\"]*\">([^<]+)<\/a>\s*<div class=\"spaceit_pad\">\s*<small>([^<]+)<\/small>/g;
          let match: RegExpExecArray | null;

          while ((match = regex.exec(html)) !== null) {
            const rawName = match[1].trim();
            const rawRole = match[2].trim();
            const positions = rawRole.split(',').map((p) => p.trim());

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

            if (isDir) {
              let westernName = rawName;
              let anidbName = rawName;
              if (rawName.includes(',')) {
                const parts = rawName.split(',').map((p) => p.trim());
                if (parts.length >= 2) {
                  westernName = `${parts[1]} ${parts[0]}`;
                  anidbName = `${parts[0]} ${parts[1]}`;
                }
              }

              if (!directors.some((d) => d.name === westernName)) {
                directors.push({
                  name: westernName,
                  anidbName,
                  anidbUrl: `https://anidb.net/creator/?adb.search=${encodeURIComponent(anidbName)}&do.search=1`,
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch director from MAL:', err);
      }
    }

    const result = { directors };
    if (directors.length > 0) {
      directorCache.set(cacheKey, result);
    }
    return res.json(result);
  });

  // API to aggregate official external streaming & info links (AniDB, MAL, Crunchyroll, Netflix, Disney+, Max, Prime) directly
  app.get('/api/anime-external-links', async (req, res) => {
    const malId = req.query.malId as string;
    const anilistId = req.query.anilistId as string;
    const title = (req.query.title as string) || '';

    const cacheKey = `links_${malId || ''}_${anilistId || ''}_${title}`;
    if (linksCache.has(cacheKey)) {
      return res.json(linksCache.get(cacheKey));
    }

    const links: Array<{ site: string; url: string; type: string }> = [];

    // 1. AniList GraphQL API: Fetch official direct external links
    if (anilistId && /^\d+$/.test(anilistId)) {
      try {
        const alRes = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Referer: 'https://anilist.co/',
            Origin: 'https://anilist.co',
          },
          body: JSON.stringify({
            query: `query ($idNum: Int) {
              Media(id: $idNum) {
                id
                idMal
                externalLinks { site url }
              }
            }`,
            variables: { idNum: Number(anilistId) },
          }),
        });

        if (alRes.ok) {
          const alData = (await alRes.json()) as any;
          const media = alData?.data?.Media;
          if (media) {
            if (media.id && !links.some((l) => l.site === 'AniList')) {
              links.push({
                site: 'AniList',
                url: `https://anilist.co/anime/${media.id}`,
                type: 'anilist',
              });
            }

            const effectiveMalId = media.idMal || (malId && /^\d+$/.test(malId) ? malId : null);
            if (effectiveMalId && !links.some((l) => l.site === 'MyAnimeList')) {
              links.push({
                site: 'MyAnimeList',
                url: `https://myanimelist.net/anime/${effectiveMalId}`,
                type: 'mal',
              });
            }

            if (media.externalLinks && Array.isArray(media.externalLinks)) {
              for (const l of media.externalLinks) {
                if (!l || !l.site || !l.url) continue;
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

                const allowed = [
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

                if (allowed.includes(siteName) && !links.some((ex) => ex.site === siteName)) {
                  // Direct URL only (no search page)
                  links.push({ site: siteName, url: l.url, type: typeKey });
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('AniList GraphQL external links fetch error:', err);
      }
    }

    // Fallbacks if AniList was not fetched or missing Mal / AniList links
    if (malId && /^\d+$/.test(malId) && !links.some((l) => l.site === 'MyAnimeList')) {
      links.push({
        site: 'MyAnimeList',
        url: `https://myanimelist.net/anime/${malId}`,
        type: 'mal',
      });
    }

    if (anilistId && /^\d+$/.test(anilistId) && !links.some((l) => l.site === 'AniList')) {
      links.push({
        site: 'AniList',
        url: `https://anilist.co/anime/${anilistId}`,
        type: 'anilist',
      });
    }

    // 2. AnimeThemes Resources: Fetch official direct links (especially for AniDB direct anime page)
    if (title) {
      try {
        const atRes = await fetch(
          `https://api.animethemes.moe/anime?filter[name]=${encodeURIComponent(title)}&include=resources`,
          {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'application/json',
            },
          }
        );

        if (atRes.ok) {
          const atData = (await atRes.json()) as any;
          const resources = atData?.anime?.[0]?.resources || [];

          for (const r of resources) {
            const siteLower = (r.site || '').toLowerCase();
            const url = r.link || '';
            if (!url || url.includes('search')) continue;

            if (siteLower === 'anidb' || siteLower.includes('anidb')) {
              if (!links.some((l) => l.site === 'AniDB')) {
                links.push({ site: 'AniDB', url, type: 'anidb' });
              }
            } else if (siteLower.includes('crunchyroll')) {
              if (!links.some((l) => l.site === 'Crunchyroll')) {
                links.push({ site: 'Crunchyroll', url, type: 'crunchyroll' });
              }
            } else if (siteLower.includes('netflix')) {
              if (!links.some((l) => l.site === 'Netflix')) {
                links.push({ site: 'Netflix', url, type: 'netflix' });
              }
            }
          }
        }
      } catch (err) {
        console.warn('AnimeThemes resources fetch error:', err);
      }
    }

    const result = { links };
    linksCache.set(cacheKey, result);
    return res.json(result);
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
