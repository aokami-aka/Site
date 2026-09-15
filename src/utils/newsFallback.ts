import { NewsArticle } from '../components/NewsDetailModal';

// Regex to detect banned sources requested by user
export const BANNED_SOURCES_REGEX =
  /comic\s*book|comicbook|anime\s*news\s*network|animenewsnetwork|\bann\b|anime\s*herald|animeherald/i;

// Robust text sanitizer that strips script tags, Akismet WordPress scripts, Delta entities, and site boilerplate
export const sanitizeNewsText = (str: string): string => {
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

// Filter strictly to anime, manga, light novel, seiyuu, and anime studios - rejecting video games & hardware
export const isGamingOrNonAnime = (article: {
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

// Decode HTML entities commonly found in RSS feeds
export const decodeHtmlEntities = (str: string): string => {
  return sanitizeNewsText(str);
};

export const formatPortugueseDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Hoje';
    const months = [
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ];
    return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
  } catch {
    return 'Hoje';
  }
};

export const formatRelativeTime = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    const diffHours = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'há poucos minutos';
    if (diffHours === 1) return 'há 1 hora';
    if (diffHours < 24) return `há ${diffHours} horas`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'ontem';
    return `há ${diffDays} dias`;
  } catch {
    return 'hoje';
  }
};

// Categorization helper strictly into the 4 requested categories
export const categorizeNews = (title: string, tags: string[] = []): string => {
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
  return 'Estreias & Datas';
};

// Rule-based anime headline translator for client-side execution
export const translateHeadlinePatterns = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  let res = decodeHtmlEntities(text);

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

  const trimmed = res.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

// High-resolution image cleaner
export const cleanNewsImageUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  let cleaned = url.trim();
  if (cleaned.includes('wp-content') || cleaned.includes('i0.wp.com')) {
    cleaned = cleaned.replace(/\?fit=\d+%2C\d+.*$/i, '?fit=1920%2C1080&ssl=1');
    cleaned = cleaned.replace(/\?w=\d+.*$/i, '?w=1920&ssl=1');
    cleaned = cleaned.replace(/\?resize=\d+%2C\d+.*$/i, '?fit=1920%2C1080&ssl=1');
    cleaned = cleaned.replace(/-\d+x\d+(\.(?:jpg|jpeg|png|webp))$/i, '$1');
  }
  return cleaned;
};

// Fallback curated articles in case no external APIs respond
export const CURATED_FALLBACK_ARTICLES: NewsArticle[] = [
  {
    id: 'curated-1',
    title: 'Temporada 3 de Ranma 1/2 revela novo trailer e data de estreia',
    titlePt: 'Temporada 3 de Ranma 1/2 revela novo trailer e data de estreia',
    source: 'Crunchyroll',
    excerpt: 'O anime clássico de Rumiko Takahashi produzido pelo estúdio MAPPA ganha nova prévia com anúncio oficial de transmissão.',
    excerptPt: 'O anime clássico de Rumiko Takahashi produzido pelo estúdio MAPPA ganha nova prévia com anúncio oficial de transmissão.',
    date: new Date().toISOString(),
    formattedDatePt: formatPortugueseDate(new Date().toISOString()),
    readTimeMin: 2,
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=85',
    link: 'https://crunchyroll.com',
    category: 'Trailers & Teasers',
    tags: ['ranma', 'mappa', 'anime'],
    author: 'Crunchyroll News',
  },
  {
    id: 'curated-2',
    title: 'Solo Leveling: Novidades sobre a continuação e bastidores da produção',
    titlePt: 'Solo Leveling: Novidades sobre a continuação e bastidores da produção',
    source: 'Anime Corner',
    excerpt: 'Equipe de animação da A-1 Pictures compartilha detalhes sobre as sequências de batalha e novos caçadores.',
    excerptPt: 'Equipe de animação da A-1 Pictures compartilha detalhes sobre as sequências de batalha e novos caçadores.',
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    formattedDatePt: formatPortugueseDate(new Date(Date.now() - 3600000 * 2).toISOString()),
    readTimeMin: 3,
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=85',
    link: 'https://animecorner.me',
    category: 'Estreias & Datas',
    tags: ['solo-leveling', 'a-1-pictures'],
    author: 'Anime Corner',
  },
  {
    id: 'curated-3',
    title: 'Chainsaw Man: O Filme do Arco de Reze ganha novo pôster oficial',
    titlePt: 'Chainsaw Man: O Filme do Arco de Reze ganha novo pôster oficial',
    source: 'Crunchyroll',
    excerpt: 'O aguardado longa-metragem dirigido pelo estúdio MAPPA ganha novos materiais promocionais para os cinemas.',
    excerptPt: 'O aguardado longa-metragem dirigido pelo estúdio MAPPA ganha novos materiais promocionais para os cinemas.',
    date: new Date(Date.now() - 3600000 * 5).toISOString(),
    formattedDatePt: formatPortugueseDate(new Date(Date.now() - 3600000 * 5).toISOString()),
    readTimeMin: 2,
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=85',
    link: 'https://crunchyroll.com',
    category: 'Mangá & Adaptações',
    tags: ['chainsaw-man', 'filme'],
    author: 'Crunchyroll News',
  },
  {
    id: 'curated-4',
    title: 'Entrevista com o elenco principal e equipe de Re:Zero -Starting Life in Another World-',
    titlePt: 'Entrevista com o elenco principal e equipe de Re:Zero -Starting Life in Another World-',
    source: 'Anime Corner',
    excerpt: 'Yusuke Kobayashi e artistas comentam os desafios emocionais e o desenvolvimento dos novos arcos.',
    excerptPt: 'Yusuke Kobayashi e artistas comentam os desafios emocionais e o desenvolvimento dos novos arcos.',
    date: new Date(Date.now() - 3600000 * 8).toISOString(),
    formattedDatePt: formatPortugueseDate(new Date(Date.now() - 3600000 * 8).toISOString()),
    readTimeMin: 4,
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=85',
    link: 'https://animecorner.me',
    category: 'Elenco & Produção',
    tags: ['re-zero', 'white-fox'],
    author: 'Anime Corner',
  }
];

// Direct client-side news fetcher for local frontend-only environments
export async function fetchClientDirectNews(page = 1, limit = 20, search = ''): Promise<{ articles: NewsArticle[]; hasMore: boolean; total: number }> {
  try {
    const res = await fetch('https://aninews.vercel.app/api/news?limit=100', {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return { articles: CURATED_FALLBACK_ARTICLES, hasMore: false, total: CURATED_FALLBACK_ARTICLES.length };
    }

    const json = await res.json();
    if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
      return { articles: CURATED_FALLBACK_ARTICLES, hasMore: false, total: CURATED_FALLBACK_ARTICLES.length };
    }

    const filtered = json.data.filter(
      (item: any) =>
        !BANNED_SOURCES_REGEX.test(item.source || '') &&
        !BANNED_SOURCES_REGEX.test(item.link || '') &&
        !isGamingOrNonAnime({
          title: item.title,
          link: item.link,
          excerpt: item.excerpt,
          tags: item.tags,
        })
    );

    const mapped: NewsArticle[] = filtered.map((item: any, index: number) => {
      const rawTitle = sanitizeNewsText(item.title || '');
      const rawExcerpt = sanitizeNewsText(item.excerpt || item.title || '');
      const titlePt = translateHeadlinePatterns(rawTitle);
      const excerptPt = translateHeadlinePatterns(rawExcerpt);
      const tags = Array.isArray(item.tags) ? item.tags : ['anime'];
      const category = categorizeNews(titlePt, tags);
      const dateStr = item.date || new Date().toISOString();

      return {
        id: `client-news-${index}-${Date.now()}`,
        title: rawTitle,
        titlePt,
        source: item.source || 'Anime Corner',
        excerpt: rawExcerpt,
        excerptPt,
        date: dateStr,
        formattedDatePt: formatPortugueseDate(dateStr),
        readTimeMin: Math.max(1, Math.ceil(rawExcerpt.split(/\s+/).length / 40)),
        image: cleanNewsImageUrl(item.image || ''),
        link: item.link || 'https://animecorner.me',
        category,
        tags,
        author: item.author || item.source || 'Anime Corner',
      };
    });

    let finalArticles = mapped.length > 0 ? mapped : CURATED_FALLBACK_ARTICLES;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      finalArticles = finalArticles.filter(
        (a) =>
          a.titlePt.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.excerptPt.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q)
      );
    }

    const startIndex = (page - 1) * limit;
    const paginated = finalArticles.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < finalArticles.length;

    return {
      articles: paginated,
      hasMore,
      total: finalArticles.length,
    };
  } catch (e) {
    console.warn('Erro no fallback direto de notícias do cliente:', e);
    return { articles: CURATED_FALLBACK_ARTICLES, hasMore: false, total: CURATED_FALLBACK_ARTICLES.length };
  }
}
