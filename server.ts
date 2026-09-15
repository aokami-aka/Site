import express from 'express';
import path from 'path';
import https from 'https';
import http from 'http';
import { spawn } from 'child_process';
import sharp from 'sharp';
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

    // 1. Google Translate client dict-chrome-ex (Highest reliability, doesn't easily rate limit)
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
        let trans = '';
        if (Array.isArray(data)) {
          if (Array.isArray(data[0]) && typeof data[0][0] === 'string') {
            trans = data[0][0].trim();
          } else if (typeof data[0] === 'string') {
            trans = data.join('').trim();
          }
        } else if (typeof data === 'string') {
          trans = data.trim();
        }
        if (trans && trans.length > 3) {
          translationCache.set(clean, trans);
          return trans;
        }
      }
    } catch {
      // ignore
    }

    // 2. Google Translate GTX (POST)
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
        3500
      );

      if (gtxRes.ok) {
        const data = (await gtxRes.json()) as any;
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translated = data[0]
            .map((chunk: any) => chunk?.[0] || '')
            .join('')
            .trim();
          if (translated && translated.length > 3) {
            translationCache.set(clean, translated);
            return translated;
          }
        }
      }
    } catch (err) {
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

    // 5. Gemini 3.6 Flash fallback
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const res = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: `Traduza o seguinte texto de notícias/sinopse de animes para Português do Brasil de forma fluida. IMPORTANTE: NUNCA traduza títulos próprios de animes, estúdios ou nomes de personagens. Retorne APENAS o texto traduzido sem aspas ou notas adicionais:\n\n${clean}`,
        });
        const gText = (res.text || '').trim();
        if (gText && gText.length > 3) {
          translationCache.set(clean, gText);
          return gText;
        }
      } catch {
        // ignore
      }
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

  // Studio logo background cleaner & trimmer (turns white background transparent and inverts dark logos for dark mode)
  const studioLogoCleanCache = new Map<string, Buffer>();
  app.get('/api/clean-studio-logo', async (req, res) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) {
      return res.status(400).send('Missing url parameter');
    }

    if (studioLogoCleanCache.has(rawUrl)) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      return res.send(studioLogoCleanCache.get(rawUrl));
    }

    try {
      const response = await fetch(rawUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'image/*',
        },
      });

      if (!response.ok) {
        return res.status(response.status).send('Failed to fetch image');
      }

      const arrayBuffer = await response.arrayBuffer();
      const inputBuf = Buffer.from(arrayBuffer);

      const image = sharp(inputBuf).ensureAlpha();
      const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

      let totalBrightness = 0;
      let nonWhitePixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const minC = Math.min(r, g, b);
        const maxC = Math.max(r, g, b);
        const diff = maxC - minC;

        // If pixel is near-white or light neutral background
        if (minC > 215 && diff < 28) {
          data[i + 3] = 0; // transparent
        } else if (minC > 175 && diff < 20) {
          // Antialias edge gradient
          const factor = (minC - 175) / 40;
          data[i + 3] = Math.round(255 * (1 - factor));
          totalBrightness += (r + g + b) / 3;
          nonWhitePixels++;
        } else {
          totalBrightness += (r + g + b) / 3;
          nonWhitePixels++;
        }
      }

      const avgBrightness = nonWhitePixels > 0 ? totalBrightness / nonWhitePixels : 128;

      // If the logo content is mostly dark (e.g. black text/outline on dark UI), invert to white
      if (avgBrightness < 110) {
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 0) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
          }
        }
      }

      const outputBuf = await sharp(data, { raw: info }).trim().png().toBuffer();
      studioLogoCleanCache.set(rawUrl, outputBuf);

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      res.send(outputBuf);
    } catch (err) {
      console.warn('Error processing studio logo:', err);
      res.redirect(rawUrl);
    }
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

    const studios: Array<{ malId?: number; name: string; url: string; logoUrl?: string }> = [];
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
              logoUrl: st.mal_id ? `https://cdn.myanimelist.net/images/company/${st.mal_id}.png` : undefined,
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

  // ==========================================
  // ANIME NEWS AGGREGATION & TRANSLATION API
  // ==========================================
  interface NewsArticle {
    id: string;
    title: string;
    titlePt: string;
    excerpt: string;
    excerptPt: string;
    contentPt?: string;
    date: string;
    formattedDatePt: string;
    image: string;
    source: string;
    link: string;
    tags: string[];
    category: string;
    readTimeMin: number;
    author?: string;
  }

  let newsCache: { data: NewsArticle[]; timestamp: number } | null = null;
  const NEWS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

  // Robust text sanitizer that strips script tags, Akismet WordPress scripts, Delta entities, and site boilerplate
  const sanitizeNewsText = (str: string): string => {
    if (!str || typeof str !== 'string') return '';
    let text = str;

    // 1. Remove script, style, svg, iframe, form, noscript tags and everything between them
    text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    text = text.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
    text = text.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');
    text = text.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
    text = text.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

    // 2. Remove all remaining HTML tags
    text = text.replace(/<[^>]+>/g, ' ');

    // 3. Decode common HTML entities
    text = text
      .replace(/&#916;/gi, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8230;/g, '...')
      .replace(/&hellip;/g, '...')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–');

    // 4. Strip JavaScript / Akismet residues (e.g. document.getElementById("ak_js_1").setAttribute...)
    text = text.replace(/(?:&#916;|\b)?\s*document\.getElementById[^;]+;\s*/gi, '');
    text = text.replace(/setAttribute\s*\([^)]*\)\s*;?/gi, '');
    text = text.replace(/new Date\(\)\.getTime\(\)/gi, '');
    text = text.replace(/ak_js_\d+/gi, '');
    text = text.replace(/\(new Date\(\)\)/gi, '');

    // 5. Strip WordPress & website boilerplates / signatures
    text = text.replace(/O conteúdo .*? aparece primeiro em .*?(\.|$)/gi, '');
    text = text.replace(/O post .*? apareceu primeiro em .*?(\.|$)/gi, '');
    text = text.replace(/OtakuPT é o maior site de Portugal.*?(\.|$)/gi, '');
    text = text.replace(/The post .*? appeared first on .*?(\.|$)/gi, '');
    text = text.replace(/\[\.\.\.\]|\[\s*\.\.\.\s*\]|\[&#8230;\]|\[\s*…\s*\]/g, '');

    // 6. Normalize whitespace
    return text.replace(/\s+/g, ' ').trim();
  };

  const decodeHtmlEntities = (str: string): string => {
    return sanitizeNewsText(str);
  };

  // Filter strictly to anime, manga, light novel, seiyuu, and anime studios - rejecting video games & hardware
  const isGamingOrNonAnime = (article: {
    title?: string;
    link?: string;
    excerpt?: string;
    category?: string;
    tags?: string[];
  }): boolean => {
    const link = (article.link || '').toLowerCase();
    // Check URL paths known to be non-anime
    if (
      link.includes('/jogos/') ||
      link.includes('/videojogos/') ||
      link.includes('/tecnologia/') ||
      link.includes('/hardware/') ||
      link.includes('/gadgets/') ||
      link.includes('/gaming/')
    ) {
      const title = (article.title || '').toLowerCase();
      // Allow only if explicitly an anime adaptation or series
      if (!title.includes('série anime') && !title.includes('anime de') && !title.includes('adaptação em anime') && !title.includes('filme anime')) {
        return true;
      }
    }

    const combined = `${article.title || ''} ${(article.tags || []).join(' ')} ${article.excerpt || ''}`.toLowerCase();

    // Explicit gaming/tech keywords that indicate pure gaming/tech news
    const gamingKeywordsRegex =
      /\b(gameplay|playstation|ps4|ps5|ps6|xbox series|nintendo switch|switch 2|steam deck|rtx \d+|geforce|placa gr[áa]fica|placa de v[íi]deo|headset gamer|teclado mec[âa]nico|mouse gamer|diablo|starcraft|fortnite|call of duty|warzone|gta\s*vi|gta\s*6|overwatch|valorant|league of legends|fifa 2|ea sports fc|mario kart|smash bros|god of war|the last of us|lies of p|monster hunter wilds|resident evil|silent hill|elden ring|pragmata|fatal fury|street fighter|tekken|game freak)\b/i;

    if (gamingKeywordsRegex.test(combined)) {
      const isAnimeExplicit =
        /\b(s[ée]rie anime|adapta[çc][ãa]o para anime|adapta[çc][ãa]o em anime|filme anime|mang[áa]|light novel|epis[óo]dio|temporada \d+|est[úu]dio de anima[çc][ãa]o|seiyuu|dublador)\b/i.test(
          combined
        );
      if (!isAnimeExplicit) {
        return true;
      }
    }

    return false;
  };

  // High-resolution image URL cleaner & upscaler
  const enhanceNewsImageUrl = (url: string): string => {
    if (!url || typeof url !== 'string') return '';
    let cleaned = url.trim();

    // 1. WordPress / CDN thumbnail removal (e.g. ?fit=32,32 or ?w=84&h=84 -> 1920x1080)
    if (cleaned.includes('wp-content') || cleaned.includes('i0.wp.com')) {
      cleaned = cleaned.replace(/\?fit=\d+%2C\d+.*$/i, '?fit=1920%2C1080&ssl=1');
      cleaned = cleaned.replace(/\?w=\d+.*$/i, '?w=1920&ssl=1');
      cleaned = cleaned.replace(/\?resize=\d+%2C\d+.*$/i, '?fit=1920%2C1080&ssl=1');
      cleaned = cleaned.replace(/-\d+x\d+(\.(?:jpg|jpeg|png|webp))$/i, '$1');
    }

    // 2. Generic query string downscales
    cleaned = cleaned.replace(/([?&])(width|w)=\d+/gi, '$1w=1200');
    cleaned = cleaned.replace(/([?&])(height|h)=\d+/gi, '$1h=700');

    // 3. MyAnimeList / Jikan downscaled CDN thumbnails (e.g. /r/50x70/ or /r/100x140/)
    cleaned = cleaned.replace(/\/r\/\d+x\d+\//g, '/');
    if (cleaned.includes('cdn.myanimelist.net') && /t\.(jpg|jpeg|png|webp)$/i.test(cleaned)) {
      cleaned = cleaned.replace(/t\.(jpg|jpeg|png|webp)$/i, '.$1');
    }

    // 4. Crunchyroll / Fandom thumbnail paths
    cleaned = cleaned.replace(/\/thumb\//gi, '/full/');
    cleaned = cleaned.replace(/_thumb\./gi, '.');
    cleaned = cleaned.replace(/scale_to_width_down\/\d+/gi, 'scale_to_width_down/1200');

    return cleaned;
  };

  // Known anime titles & franchises that MUST NEVER be translated into Portuguese
  const PROTECTED_ANIME_TITLES = [
    'Solo Leveling',
    'Chainsaw Man',
    'Jujutsu Kaisen',
    'Demon Slayer',
    'Kimetsu no Yaiba',
    'One Piece',
    'Attack on Titan',
    'Shingeki no Kyojin',
    'Spy x Family',
    'Blue Lock',
    'Frieren: Beyond Journey\'s End',
    'Frieren',
    'My Hero Academia',
    'Boku no Hero Academia',
    'Bleach: Thousand-Year Blood War',
    'Bleach',
    'Naruto: Shippuden',
    'Naruto',
    'Boruto',
    'Dragon Ball Super',
    'Dragon Ball Daima',
    'Dragon Ball',
    'D.Gray-man',
    'D-Gray-man',
    'Oshi no Ko',
    'Dan Da Dan',
    'Dandadan',
    'Kaiju No. 8',
    'Wind Breaker',
    'Black Clover',
    'Hunter x Hunter',
    'Death Note',
    'Vinland Saga',
    'Tokyo Ghoul',
    'Haikyu!!',
    'Haikyuu',
    'KonoSuba',
    'Sword Art Online',
    'Re:Zero',
    'Mushoku Tensei',
    'Overlord',
    'Fate/stay night',
    'Fate',
    'Steins;Gate',
    'Mob Psycho 100',
    'One Punch Man',
    'Gintama',
    'Bocchi the Rock!',
    'Delicious in Dungeon',
    'Tower of God',
    'Hell\'s Paradise',
    'Jigokuraku',
    'Undead Unluck',
    'Mashle',
    'Sakamoto Days',
    'Gachiakuta',
    'Fire Force',
    'Dr. STONE',
    'Choujin X',
    'Kagurabachi',
    'Kingdom',
    'Classroom of the Elite',
    'JoJo\'s Bizarre Adventure',
    'Berserk',
    'Neon Genesis Evangelion',
    'Cowboy Bebop',
    'Code Geass',
    'Fullmetal Alchemist',
    'Monster',
    'Cyberpunk: Edgerunners',
    'Lycoris Recoil',
    'The Apothecary Diaries',
    'Kusuriya no Hitorigoto',
    'Shangri-La Frontier',
    'Shangri-La',
    'Lord of Mysteries',
    'A-1 Pictures',
    'MAPPA',
    'Ufotable',
    'Bones',
    'CloverWorks',
    'Wit Studio',
    'Madhouse',
    'Kyoto Animation',
    'Toei Animation',
    'Production I.G',
    'Trigger',
    'Pierrot',
    'Eat-Man',
    'Psyren',
    'Ranma 1/2',
    'Ranma ½',
  ];

  // Regex to detect banned sources requested by user
  const BANNED_SOURCES_REGEX = /comic\s*book|comicbook|anime\s*news\s*network|animenewsnetwork|\bann\b|anime\s*herald|animeherald/i;

  // Check if text is already fluent Portuguese
  const isAlreadyPortuguese = (text: string): boolean => {
    if (!text) return false;
    const lower = text.toLowerCase();
    const ptTokens = [' de ', ' do ', ' da ', ' para ', ' com ', ' que ', ' revelou ', ' revela ', ' estreia ', ' temporada ', ' trailer ', ' mangá ', ' novo ', ' nova ', ' sobre ', ' após ', ' lança ', ' confirma ', ' final ', ' série ', ' filme ', ' adaptação '];
    let matches = 0;
    for (const tok of ptTokens) {
      if (lower.includes(tok)) matches++;
      if (matches >= 2) return true;
    }
    return false;
  };

  // Rule-based anime headline translator ensuring 100% of English headlines translate consistently
  const translateAnimeHeadlinePatterns = (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    let res = text;

    const patternReplacements: Array<[RegExp, string]> = [
      [/Reveals Additional Cast, Staff, Theme Songs, Main Promo/gi, 'revela elenco adicional, equipe de produção, temas musicais e trailer principal'],
      [/Reveals Additional Cast, Staff, Opening Theme, Main Promo/gi, 'revela elenco adicional, equipe de produção, tema de abertura e trailer principal'],
      [/Reveals Additional Cast, Staff, Ending Theme, Main Promo/gi, 'revela elenco adicional, equipe de produção, tema de encerramento e trailer principal'],
      [/Reveals Additional Cast, Staff, Theme Songs, Second Promo/gi, 'revela elenco adicional, equipe, temas musicais e 2º trailer'],
      [/Reveals Additional Cast, Staff, Opening Theme, First Promo/gi, 'revela elenco adicional, equipe, tema de abertura e 1º trailer'],
      [/Unveils Additional Cast, Staff, Opening Theme, First Promo/gi, 'divulga elenco adicional, equipe, tema de abertura e 1º trailer'],
      [/Unveils Supporting Cast, Main Promo/gi, 'divulga elenco de apoio e trailer principal'],
      [/Reveals Additional Staff, Theme Songs, Main Promo/gi, 'revela equipe técnica adicional, temas musicais e trailer principal'],
      [/Announces Production Staff/gi, 'anuncia equipe técnica de produção'],
      [/Gets New Anime Adaptation/gi, 'ganha nova adaptação em anime'],
      [/Gets TV Anime in/gi, 'ganha anime para TV em'],
      [/Gets TV Anime Adaptation/gi, 'ganha adaptação em anime para TV'],
      [/Gets Anime Adaptation/gi, 'ganha adaptação em anime'],
      [/Reveals Main Visual, Premiere Date/gi, 'revela visual oficial e data de estreia'],
      [/Reveals Teaser Visual, Promo/gi, 'revela visual teaser e vídeo promocional'],
      [/Reveals Teaser Visual/gi, 'revela imagem teaser'],
      [/Reveals Main Visual/gi, 'revela pôster oficial principal'],
      [/Reveals Key Visual/gi, 'revela visual promocional (Key Visual)'],
      [/Reveals Main Promo/gi, 'revela trailer promocional principal'],
      [/Reveals New Trailer/gi, 'revela novo trailer'],
      [/Reveals Premiere Date/gi, 'revela data de estreia'],
      [/Unveils Main Promo/gi, 'divulga trailer principal'],
      [/Unveils New Visual/gi, 'divulga novo pôster oficial'],
      [/Unveils Teaser Trailer/gi, 'divulga teaser trailer'],
      [/Teaser Trailer Streamed/gi, 'teaser trailer é divulgado'],
      [/Releases New Trailer/gi, 'lança novo trailer'],
      [/Announces Release Date/gi, 'anuncia data de estreia'],
      [/Premieres on/gi, 'estreia em'],
      [/Premieres in/gi, 'estreia em'],
      [/Scheduled to Premiere on/gi, 'tem estreia marcada para'],
      [/Scheduled for/gi, 'programado para'],
      [/Delayed to/gi, 'adiado para'],
      [/Manga Ends on Volume/gi, 'mangá termina no volume'],
      [/Manga Ends/gi, 'mangá chega ao fim'],
      [/Enters Final Arc/gi, 'entra em seu arco final'],
      [/Season 2 Confirmed/gi, '2ª temporada confirmada'],
      [/Season 3 Confirmed/gi, '3ª temporada confirmada'],
      [/Season 4 Confirmed/gi, '4ª temporada confirmada'],
      [/Season 2 Announced/gi, '2ª temporada anunciada'],
      [/Season 3 Announced/gi, '3ª temporada anunciada'],
      [/Season 2/gi, '2ª temporada'],
      [/Season 3/gi, '3ª temporada'],
      [/Season 4/gi, '4ª temporada'],
      [/Opens Official Website/gi, 'inaugura site oficial'],
      [/Theme Songs Revealed/gi, 'temas musicais revelados'],
      [/Opening Theme/gi, 'tema de abertura'],
      [/Ending Theme/gi, 'tema de encerramento'],
      [/New Promo/gi, 'novo trailer'],
      [/First Promo/gi, '1º trailer promocional'],
      [/Second Promo/gi, '2º trailer promocional'],
      [/Winter (\d{4})/gi, 'Inverno de $1'],
      [/Spring (\d{4})/gi, 'Primavera de $1'],
      [/Summer (\d{4})/gi, 'Verão de $1'],
      [/Fall (\d{4})/gi, 'Outono de $1'],
      [/October (\d{1,2})/gi, '$1 de outubro'],
      [/November (\d{1,2})/gi, '$1 de novembro'],
      [/December (\d{1,2})/gi, '$1 de dezembro'],
      [/January (\d{1,2})/gi, '$1 de janeiro'],
      [/February (\d{1,2})/gi, '$1 de fevereiro'],
      [/March (\d{1,2})/gi, '$1 de março'],
      [/April (\d{1,2})/gi, '$1 de abril'],
      [/May (\d{1,2})/gi, '$1 de maio'],
      [/June (\d{1,2})/gi, '$1 de junho'],
      [/July (\d{1,2})/gi, '$1 de julho'],
      [/August (\d{1,2})/gi, '$1 de agosto'],
      [/September (\d{1,2})/gi, '$1 de setembro'],
    ];

    for (const [pat, rep] of patternReplacements) {
      res = res.replace(pat, rep);
    }

    return res;
  };

  // Helper to translate news text while strictly preserving anime titles
  const translateNewsWithTitleProtection = async (text: string): Promise<string> => {
    if (!text || typeof text !== 'string') return '';
    const cleanedText = decodeHtmlEntities(text).trim();
    if (cleanedText.length <= 3) return cleanedText;

    // 1. Check if headline is already Portuguese
    if (isAlreadyPortuguese(cleanedText)) {
      return cleanedText;
    }

    // 2. Try fast headline pattern match first (0ms, no API calls needed for standard anime headlines)
    const quickPattern = translateAnimeHeadlinePatterns(cleanedText);
    if (quickPattern !== cleanedText && isAlreadyPortuguese(quickPattern)) {
      return quickPattern.charAt(0).toUpperCase() + quickPattern.slice(1);
    }

    // 3. Identify and mask titles with alphanumeric placeholders (translators don't break simple letters/numbers)
    const placeholders: Map<string, string> = new Map();
    let tokenCount = 0;
    let masked = cleanedText;

    // Protect quoted phrases (e.g. "Chainsaw Man" or 'Solo Leveling')
    masked = masked.replace(/["'“‘「]([^"'”’」]{2,60})["'”’」]/g, (_match, inner) => {
      const token = `ANMTOKEN${tokenCount++}X`;
      placeholders.set(token, `"${inner.trim()}"`);
      return token;
    });

    // Protect known anime titles and studio names
    for (const title of PROTECTED_ANIME_TITLES) {
      const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      if (regex.test(masked)) {
        const token = `ANMTOKEN${tokenCount++}X`;
        placeholders.set(token, title);
        masked = masked.replace(regex, token);
      }
    }

    // 2. Perform translation on masked text
    let translated = masked;
    try {
      const rawTrans = await handleTranslation(masked);
      if (rawTrans && rawTrans.trim().length > 3) {
        translated = rawTrans.trim();
      }
    } catch {
      translated = masked;
    }

    // 3. Restore all protected titles
    for (const [token, originalTitle] of placeholders.entries()) {
      const regex = new RegExp(token, 'gi');
      translated = translated.replace(regex, originalTitle);
    }

    // 4. Apply anime headline pattern translator as a polish and fallback
    translated = translateAnimeHeadlinePatterns(translated);

    // 5. Extra safeguard: Revert any common awkward literal translations
    const revertRules: Array<[RegExp, string]> = [
      [/homem[\s-]motosserra/gi, 'Chainsaw Man'],
      [/nivelamento[\s-]solo/gi, 'Solo Leveling'],
      [/matador[\s-]de[\s-]dem[ôo]nios/gi, 'Demon Slayer'],
      [/ataque[\s-]ao[\s-]tit[ãa]/gi, 'Attack on Titan'],
      [/ataque[\s-]dos[\s-]tit[ãa]s/gi, 'Attack on Titan'],
      [/espi[ãa]o[\s-]x[\s-]fam[íi]lia/gi, 'Spy x Family'],
      [/trava[\s-]azul/gi, 'Blue Lock'],
      [/di[áa]rios[\s-]do[\s-]botic[áa]rio/gi, 'The Apothecary Diaries'],
      [/minha[\s-]academia[\s-]de[\s-]her[óo]is/gi, 'My Hero Academia'],
      [/trevo[\s-]negro/gi, 'Black Clover'],
      [/ca[çc]ador[\s-]x[\s-]ca[çc]ador/gi, 'Hunter x Hunter'],
      [/alquimista[\s-]de[\s-]metal/gi, 'Fullmetal Alchemist'],
      [/para[íi]so[\s-]dos[\s-]dem[ôo]nios/gi, 'Hell\'s Paradise'],
      [/dias[\s-]de[\s-]sakamoto/gi, 'Sakamoto Days'],
      [/homem[\s-]de[\s-]um[\s-]soco/gi, 'One Punch Man'],
    ];

    for (const [pattern, original] of revertRules) {
      translated = translated.replace(pattern, original);
    }

    const finalResult = translated.trim();
    return finalResult.charAt(0).toUpperCase() + finalResult.slice(1);
  };

  // Categorization helper for newspaper sections: Strictly 4 categories (NO "Novidades", NO "Anúncios Oficiais")
  const categorizeNews = (title: string, tags: string[] = []): string => {
    const text = `${title} ${tags.join(' ')}`.toLowerCase();
    if (
      text.includes('trailer') ||
      text.includes('teaser') ||
      text.includes('preview') ||
      text.includes('vídeo') ||
      text.includes('video') ||
      text.includes('pv') ||
      text.includes('promo') ||
      text.includes('abertura') ||
      text.includes('encerramento')
    ) {
      return 'Trailers & Teasers';
    }
    if (
      text.includes('manga') ||
      text.includes('mangá') ||
      text.includes('chapter') ||
      text.includes('capítulo') ||
      text.includes('shonen') ||
      text.includes('adaptação') ||
      text.includes('volume') ||
      text.includes('light novel') ||
      text.includes('autor') ||
      text.includes('quadrinho')
    ) {
      return 'Mangá & Adaptações';
    }
    if (
      text.includes('voice') ||
      text.includes('cast') ||
      text.includes('director') ||
      text.includes('staff') ||
      text.includes('elenco') ||
      text.includes('dublagem') ||
      text.includes('dublador') ||
      text.includes('estúdio') ||
      text.includes('produção') ||
      text.includes('studio') ||
      text.includes('seiyuu') ||
      text.includes('diretor')
    ) {
      return 'Elenco & Produção';
    }
    // Default fallback is always 'Estreias & Datas' (releases, premiere dates, season confirmations)
    return 'Estreias & Datas';
  };

  const formatPortugueseDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Recentemente';
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'Recentemente';
    }
  };

  // Helper to fetch and parse any OtakuPT page on demand
  async function fetchOtakuPtPage(pageNum: number): Promise<any[]> {
    try {
      const url = pageNum === 1 ? 'https://www.otakupt.com/feed/' : `https://www.otakupt.com/feed/?paged=${pageNum}`;
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AnimePress/2.0',
          Accept: 'application/rss+xml, text/xml',
        },
      });
      if (!r.ok) return [];
      const xml = await r.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      const results: any[] = [];
      for (const itemXml of items) {
        const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
        const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
        const dateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        const descMatch =
          itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
          itemXml.match(/<description>([\s\S]*?)<\/description>/);
        const creatorMatch = itemXml.match(/<dc:creator><!\[CDATA\[([\s\S]*?)\]\]><\/dc:creator>/);

        if (!titleMatch || !linkMatch) continue;
        const rawTitle = sanitizeNewsText(titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1')).trim();
        const link = linkMatch[1].trim();
        const descHtml = descMatch ? descMatch[1] : '';
        const imgMatch = descHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
        const imageUrl = imgMatch ? imgMatch[1] : '';
        const cleanExcerpt = sanitizeNewsText(descHtml);

        if (isGamingOrNonAnime({ title: rawTitle, link, excerpt: cleanExcerpt })) continue;

        results.push({
          title: rawTitle,
          source: 'OtakuPT',
          excerpt: cleanExcerpt || rawTitle,
          date: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
          image: imageUrl,
          link,
          tags: ['anime', 'notícias'],
          author: creatorMatch ? creatorMatch[1].trim() : 'OtakuPT',
          isPortuguese: true,
        });
      }
      return results;
    } catch (err) {
      console.warn(`OtakuPT page ${pageNum} fetch warning:`, err);
      return [];
    }
  }

  // Helper to query live search from OtakuPT historical feed archives
  async function searchOtakuPtFeed(query: string, pageNum: number): Promise<any[]> {
    try {
      const url = `https://www.otakupt.com/?s=${encodeURIComponent(query)}&feed=rss2&paged=${pageNum}`;
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AnimePress/2.0',
          Accept: 'application/rss+xml, text/xml',
        },
      });
      if (!r.ok) return [];
      const xml = await r.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      const results: any[] = [];
      for (const itemXml of items) {
        const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
        const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
        const dateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        const descMatch =
          itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
          itemXml.match(/<description>([\s\S]*?)<\/description>/);
        const creatorMatch = itemXml.match(/<dc:creator><!\[CDATA\[([\s\S]*?)\]\]><\/dc:creator>/);

        if (!titleMatch || !linkMatch) continue;
        const rawTitle = sanitizeNewsText(titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1')).trim();
        const link = linkMatch[1].trim();
        const descHtml = descMatch ? descMatch[1] : '';
        const imgMatch = descHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
        const imageUrl = imgMatch ? imgMatch[1] : '';
        const cleanExcerpt = sanitizeNewsText(descHtml);

        if (isGamingOrNonAnime({ title: rawTitle, link, excerpt: cleanExcerpt })) continue;

        results.push({
          title: rawTitle,
          source: 'OtakuPT',
          excerpt: cleanExcerpt || rawTitle,
          date: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
          image: imageUrl,
          link,
          tags: ['anime', 'pesquisa'],
          author: creatorMatch ? creatorMatch[1].trim() : 'OtakuPT',
          isPortuguese: true,
        });
      }
      return results;
    } catch (err) {
      console.warn(`OtakuPT search error for "${query}" (page ${pageNum}):`, err);
      return [];
    }
  }

  // Convert raw fetched item to processed NewsArticle
  async function transformRawToNewsArticle(raw: any, index: number): Promise<NewsArticle> {
    const rawTitle = sanitizeNewsText((raw.title || '').trim());
    const rawExcerpt = sanitizeNewsText((raw.excerpt || raw.title || '').trim());
    const tags = Array.isArray(raw.tags) ? raw.tags : [];

    let titlePt = rawTitle;
    let excerptPt = rawExcerpt;

    if (raw.isPortuguese || isAlreadyPortuguese(rawTitle)) {
      titlePt = rawTitle;
      excerptPt = rawExcerpt;
    } else {
      try {
        const [transTitle, transExcerpt] = await Promise.all([
          translateNewsWithTitleProtection(rawTitle),
          translateNewsWithTitleProtection(rawExcerpt),
        ]);
        if (transTitle) titlePt = transTitle;
        if (transExcerpt) excerptPt = transExcerpt;
      } catch {
        titlePt = translateAnimeHeadlinePatterns(rawTitle);
        excerptPt = translateAnimeHeadlinePatterns(rawExcerpt);
      }
    }

    const category = categorizeNews(titlePt, tags);
    const wordsCount = (excerptPt || '').split(/\s+/).length;
    const readTimeMin = Math.max(1, Math.ceil(wordsCount / 60));
    const enhancedImage = enhanceNewsImageUrl(raw.image || '');

    return {
      id: raw.slug || `news-${index}-${(raw.link || '').slice(-15) || Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: rawTitle,
      titlePt,
      excerpt: rawExcerpt,
      excerptPt,
      date: raw.date || new Date().toISOString(),
      formattedDatePt: formatPortugueseDate(raw.date || new Date().toISOString()),
      image: enhancedImage,
      source: raw.source || 'Anime Press',
      link: raw.link || 'https://myanimelist.net/news',
      tags,
      category,
      readTimeMin,
      author: raw.author || raw.source || 'Redação de Notícias',
    };
  }

  app.get('/api/anime-news', async (req, res) => {
    const forceRefresh = req.query.refresh === 'true';
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || '20', 10)));
    const searchQuery = (req.query.search as string || '').trim().toLowerCase();
    const categoryQuery = (req.query.category as string || 'Todas').trim();
    const sourceQuery = (req.query.source as string || 'Todas').trim();

    try {
      // =========================================================================
      // CASE A: GLOBAL DEEP SEARCH MODE (Searches live archives + local cache)
      // =========================================================================
      if (searchQuery) {
        // 1. Fetch live search from OtakuPT for this page (2 RSS pages per page request)
        const p1 = (page - 1) * 2 + 1;
        const p2 = (page - 1) * 2 + 2;
        const [searchRes1, searchRes2] = await Promise.all([
          searchOtakuPtFeed(searchQuery, p1),
          searchOtakuPtFeed(searchQuery, p2),
        ]);

        const rawLiveSearchResults = [...searchRes1, ...searchRes2];

        // 2. Also search across cached memory pool if page == 1
        const cachedMatching: any[] = [];
        if (newsCache && Array.isArray(newsCache.data)) {
          const q = searchQuery.toLowerCase();
          for (const a of newsCache.data) {
            const match =
              (a.titlePt || '').toLowerCase().includes(q) ||
              (a.title || '').toLowerCase().includes(q) ||
              (a.excerptPt || '').toLowerCase().includes(q) ||
              (a.excerpt || '').toLowerCase().includes(q) ||
              (a.source || '').toLowerCase().includes(q) ||
              (a.tags || []).some((t) => t.toLowerCase().includes(q));
            if (match) {
              cachedMatching.push(a);
            }
          }
        }

        // Process any new live search results
        const processedLive: NewsArticle[] = await Promise.all(
          rawLiveSearchResults.map((raw, idx) => transformRawToNewsArticle(raw, idx))
        );

        // Deduplicate
        const mergedSearchMap = new Map<string, NewsArticle>();
        for (const a of processedLive) {
          mergedSearchMap.set(a.link || a.id, a);
        }
        for (const a of cachedMatching) {
          if (!mergedSearchMap.has(a.link || a.id)) {
            mergedSearchMap.set(a.link || a.id, a);
          }
        }

        let searchList = Array.from(mergedSearchMap.values()).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Category & Source filter
        if (categoryQuery !== 'Todas') {
          searchList = searchList.filter((a) => a.category === categoryQuery);
        }
        if (sourceQuery !== 'Todas') {
          searchList = searchList.filter((a) => a.source === sourceQuery);
        }

        return res.json({
          success: true,
          total: searchList.length,
          count: searchList.length,
          page,
          limit,
          hasMore: rawLiveSearchResults.length > 0, // as long as live feed returned results, there's more!
          data: searchList,
          cached: false,
          searchQuery,
        });
      }

      // =========================================================================
      // CASE B: REGULAR CONTINUOUS STREAMING FEED (No hard limits)
      // =========================================================================
      const cacheExpired = !newsCache || Date.now() - newsCache.timestamp >= NEWS_CACHE_TTL_MS;

      // Initial feed population if cache is empty or expired
      if (forceRefresh || cacheExpired || !newsCache || newsCache.data.length < 30) {
        let rawArticles: any[] = [];

        // 1. Initial 6 OtakuPT pages
        const initialOtakuPages = [1, 2, 3, 4, 5, 6];
        const otakuResults = await Promise.all(initialOtakuPages.map((p) => fetchOtakuPtPage(p)));
        for (const list of otakuResults) {
          rawArticles.push(...list);
        }

        // 2. Fetch MyAnimeList News RSS
        try {
          const malRes = await fetch('https://myanimelist.net/rss/news.xml', {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AnimePress/2.0',
              Accept: 'application/rss+xml, text/xml',
            },
          });
          if (malRes.ok) {
            const xml = await malRes.text();
            const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
            for (const itemXml of items) {
              const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
              const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
              const dateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
              const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/);
              const thumbMatch = itemXml.match(/<media:thumbnail>([\s\S]*?)<\/media:thumbnail>/);

              if (!titleMatch || !linkMatch) continue;
              const rawTitle = sanitizeNewsText(titleMatch[1]).trim();
              const cleanExcerpt = descMatch ? sanitizeNewsText(descMatch[1]) : rawTitle;

              if (isGamingOrNonAnime({ title: rawTitle, link: linkMatch[1], excerpt: cleanExcerpt })) {
                continue;
              }

              rawArticles.push({
                title: rawTitle,
                source: 'MyAnimeList',
                excerpt: cleanExcerpt,
                date: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
                image: thumbMatch ? thumbMatch[1].trim() : '',
                link: linkMatch[1].trim(),
                tags: ['anime', 'myanimelist'],
                author: 'MyAnimeList',
                isPortuguese: false,
              });
            }
          }
        } catch (err) {
          console.warn('MyAnimeList RSS fetch warning:', err);
        }

        // 3. Fetch AniNewsAPI
        try {
          const aniNewsRes = await fetch('https://aninews.vercel.app/api/news?limit=100', {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AnimePress/2.0',
              Accept: 'application/json',
            },
          });
          if (aniNewsRes.ok) {
            const json = (await aniNewsRes.json()) as any;
            if (json.success && Array.isArray(json.data)) {
              for (const item of json.data) {
                const src = item.source || '';
                const link = item.link || '';
                if (BANNED_SOURCES_REGEX.test(src) || BANNED_SOURCES_REGEX.test(link)) continue;
                const rawTitle = sanitizeNewsText(item.title || '');
                const rawExcerpt = sanitizeNewsText(item.excerpt || item.title || '');

                if (isGamingOrNonAnime({ title: rawTitle, link, excerpt: rawExcerpt, tags: item.tags })) continue;

                rawArticles.push({
                  title: rawTitle,
                  source: src,
                  excerpt: rawExcerpt,
                  date: item.date || new Date().toISOString(),
                  image: item.image || '',
                  link,
                  tags: Array.isArray(item.tags) ? item.tags : ['anime'],
                  author: item.author || src,
                  isPortuguese: false,
                });
              }
            }
          }
        } catch (err) {
          console.warn('AniNewsAPI fetch warning:', err);
        }

        // Deduplicate
        const seen = new Set<string>();
        const deduped: any[] = [];
        for (const item of rawArticles) {
          const norm = (item.title || '').toLowerCase().replace(/[^\w\s]/g, '').trim();
          if (norm && !seen.has(norm)) {
            seen.add(norm);
            deduped.push(item);
          }
        }

        deduped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const initialProcessed: NewsArticle[] = [];
        for (let i = 0; i < deduped.length; i += 6) {
          const batch = deduped.slice(i, i + 6);
          const batchResults = await Promise.all(batch.map((raw, idx) => transformRawToNewsArticle(raw, i + idx)));
          initialProcessed.push(...batchResults);
        }

        newsCache = {
          data: initialProcessed,
          timestamp: Date.now(),
        };
      }

      // If requested page requires more items than currently in cache, dynamically fetch next OtakuPT pages
      const startIndex = (page - 1) * limit;
      let cachedPool = (newsCache && newsCache.data) ? [...newsCache.data] : [];

      if (startIndex + limit >= cachedPool.length) {
        // Fetch next sequential OtakuPT pages (e.g. page * 2, page * 2 + 1, page * 2 + 2)
        const fetchP1 = page * 2 - 1;
        const fetchP2 = page * 2;
        const fetchP3 = page * 2 + 1;
        const [extra1, extra2, extra3] = await Promise.all([
          fetchOtakuPtPage(fetchP1),
          fetchOtakuPtPage(fetchP2),
          fetchOtakuPtPage(fetchP3),
        ]);

        const extraRaw = [...extra1, ...extra2, ...extra3];
        if (extraRaw.length > 0) {
          const extraProcessed = await Promise.all(
            extraRaw.map((raw, idx) => transformRawToNewsArticle(raw, cachedPool.length + idx))
          );

          const existingLinks = new Set(cachedPool.map((a) => a.link || a.id));
          for (const item of extraProcessed) {
            if (!existingLinks.has(item.link || item.id)) {
              existingLinks.add(item.link || item.id);
              cachedPool.push(item);
            }
          }

          cachedPool.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          if (newsCache) {
            newsCache.data = cachedPool;
          }
        }
      }

      let allArticles = cachedPool;

      // Filter out any gaming/tech or banned sources
      allArticles = allArticles.filter(
        (a) =>
          !BANNED_SOURCES_REGEX.test(a.source) &&
          !BANNED_SOURCES_REGEX.test(a.link) &&
          !isGamingOrNonAnime({
            title: a.title,
            link: a.link,
            excerpt: a.excerpt,
            tags: a.tags,
          })
      );

      // Category filter
      if (categoryQuery !== 'Todas') {
        allArticles = allArticles.filter((a) => a.category === categoryQuery);
      }

      // Source filter
      if (sourceQuery !== 'Todas') {
        allArticles = allArticles.filter((a) => a.source === sourceQuery);
      }

      const paginated = allArticles.slice(startIndex, startIndex + limit);

      return res.json({
        success: true,
        total: allArticles.length,
        count: paginated.length,
        page,
        limit,
        hasMore: true, // Always true because OtakuPT has unlimited historical pages
        data: paginated,
        cached: !forceRefresh && !cacheExpired,
      });
    } catch (err: any) {
      console.error('Anime news endpoint error:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch anime news' });
    }
  });

  // Endpoint to extract or expand article details
  app.get('/api/anime-news/article', async (req, res) => {
    const url = req.query.url as string;
    const title = req.query.title as string;

    if (!url && !title) {
      return res.status(400).json({ error: 'url or title query param required' });
    }

    try {
      if (url && url.startsWith('http')) {
        const response = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });

        if (response.ok) {
          const html = await response.text();
          // Extract paragraphs from article
          const pMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
          const cleanParagraphs: string[] = [];

          for (const p of pMatches) {
            const text = sanitizeNewsText(p);

            // Discard scripts, Akismet, privacy, spam, or cookies notices
            if (
              text.length > 35 &&
              !text.includes('cookie') &&
              !text.includes('privacy') &&
              !text.includes('copyright') &&
              !text.includes('document.getElementById') &&
              !text.includes('ak_js') &&
              !text.includes('OtakuPT é o maior site') &&
              !text.includes('aparece primeiro em')
            ) {
              cleanParagraphs.push(text);
            }
            if (cleanParagraphs.length >= 8) break;
          }

          if (cleanParagraphs.length > 0) {
            const rawBody = cleanParagraphs.join('\n\n');
            let translatedBody = rawBody;
            if (!isAlreadyPortuguese(rawBody)) {
              translatedBody = await translateNewsWithTitleProtection(rawBody);
            }
            return res.json({
              success: true,
              paragraphs: translatedBody.split('\n\n').map((p) => sanitizeNewsText(p)).filter(Boolean),
              sourceUrl: url,
            });
          }
        }
      }

      return res.json({
        success: false,
        message: 'Could not extract full body, fallback to summary',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
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
