import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Calendar,
  Clock,
  ChevronRight,
  Download,
  Newspaper,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { AnimeGuidesLogo } from './AnimeGuidesLogo';
import { NewsArticle, NewsDetailModal } from './NewsDetailModal';
import { PaperTextureOverlay } from './PaperTextureOverlay';
import { PWAInstallButton } from './PWAInstallButton';
import {
  BANNED_SOURCES_REGEX,
  fetchClientDirectNews,
  CURATED_FALLBACK_ARTICLES,
  isGamingOrNonAnime,
  sanitizeNewsText,
} from '../utils/newsFallback';

interface NewsPageProps {
  onBackToHome: () => void;
}

// Categories with "Anúncios Oficiais", "Indústria & Bilheteria", and "Novidades" completely removed
const CATEGORIES = [
  'Todas',
  'Trailers & Teasers',
  'Estreias & Datas',
  'Mangá & Adaptações',
  'Elenco & Produção',
];

const INITIAL_PAGE_SIZE = 12;
const PAGE_INCREMENT = 10;

export const NewsPage: React.FC<NewsPageProps> = ({ onBackToHome }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchingServer, setSearchingServer] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedSource, setSelectedSource] = useState<string>('Todas');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_PAGE_SIZE);
  const [serverPage, setServerPage] = useState<number>(1);
  const [hasMoreServer, setHasMoreServer] = useState<boolean>(true);

  // Helper to filter and sanitize incoming articles array
  const sanitizeAndFilterList = (list: NewsArticle[]): NewsArticle[] => {
    return list
      .filter(
        (a) =>
          !BANNED_SOURCES_REGEX.test(a.source || '') &&
          !BANNED_SOURCES_REGEX.test(a.link || '') &&
          !isGamingOrNonAnime({
            title: a.title,
            link: a.link,
            excerpt: a.excerpt,
            tags: a.tags,
          })
      )
      .map((a) => ({
        ...a,
        title: sanitizeNewsText(a.title),
        titlePt: sanitizeNewsText(a.titlePt || a.title),
        excerpt: sanitizeNewsText(a.excerpt),
        excerptPt: sanitizeNewsText(a.excerptPt || a.excerpt),
      }));
  };

  const fetchNews = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setServerPage(1);

    try {
      const res = await fetch(`/api/anime-news?page=1&limit=30${forceRefresh ? '&refresh=true' : ''}`);
      const contentType = res.headers.get('content-type') || '';

      // If backend responded with JSON, parse normally
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const safeArticles = sanitizeAndFilterList(data.data);
          setArticles(safeArticles);
          setVisibleCount(INITIAL_PAGE_SIZE);
          setHasMoreServer(data.hasMore ?? true);
          return;
        }
      }

      // If backend is unreachable or returned HTML/SPA fallback (e.g. in local Vite frontend-only testing)
      const directFallback = await fetchClientDirectNews(1, 40);
      const safeDirect = sanitizeAndFilterList(directFallback.articles);
      setArticles(safeDirect);
      setVisibleCount(INITIAL_PAGE_SIZE);
      setHasMoreServer(directFallback.hasMore);
    } catch (err: any) {
      console.warn('Backend indisponível localmente, usando carregamento direto de notícias:', err);
      try {
        const directFallback = await fetchClientDirectNews(1, 40);
        const safeDirect = sanitizeAndFilterList(directFallback.articles);
        setArticles(safeDirect);
        setVisibleCount(INITIAL_PAGE_SIZE);
        setHasMoreServer(directFallback.hasMore);
      } catch {
        setArticles(sanitizeAndFilterList(CURATED_FALLBACK_ARTICLES));
        setVisibleCount(INITIAL_PAGE_SIZE);
        setHasMoreServer(false);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Server-side deep global search across all news archives & live feeds
  useEffect(() => {
    if (!searchQuery.trim()) {
      // If user cleared search, return to main feed if we were searching
      if (searchingServer) setSearchingServer(false);
      return;
    }

    setSearchingServer(true);
    setServerPage(1);

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          search: searchQuery.trim(),
          category: selectedCategory,
          source: selectedSource,
          page: '1',
          limit: '25',
        });
        const res = await fetch(`/api/anime-news?${params.toString()}`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            const safeArticles = sanitizeAndFilterList(data.data);
            setArticles(safeArticles);
            setVisibleCount(Math.max(INITIAL_PAGE_SIZE, safeArticles.length));
            setHasMoreServer(data.hasMore ?? false);
          }
        } else {
          // Direct client search fallback
          const directFallback = await fetchClientDirectNews(1, 40, searchQuery.trim());
          const safeDirect = sanitizeAndFilterList(directFallback.articles);
          setArticles(safeDirect);
          setVisibleCount(Math.max(INITIAL_PAGE_SIZE, safeDirect.length));
          setHasMoreServer(directFallback.hasMore);
        }
      } catch (err) {
        console.warn('Search fetch error:', err);
      } finally {
        setSearchingServer(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedSource]);

  // When search is cleared, reload normal full feed
  const handleClearSearch = () => {
    setSearchQuery('');
    fetchNews(false);
  };

  // Reset pagination count when category or source changes (if not searching)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setVisibleCount(INITIAL_PAGE_SIZE);
    }
  }, [selectedCategory, selectedSource]);

  // Unique sources for filtering (strictly anime sources, no gaming or banned sources)
  const availableSources = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => {
      if (
        a.source &&
        !BANNED_SOURCES_REGEX.test(a.source) &&
        !BANNED_SOURCES_REGEX.test(a.link || '') &&
        !isGamingOrNonAnime({ title: a.title, link: a.link, excerpt: a.excerpt, tags: a.tags })
      ) {
        set.add(a.source);
      }
    });
    return ['Todas', ...Array.from(set)];
  }, [articles]);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter((item) => {
      // Exclude banned sources & gaming
      if (
        BANNED_SOURCES_REGEX.test(item.source || '') ||
        BANNED_SOURCES_REGEX.test(item.link || '') ||
        isGamingOrNonAnime({
          title: item.title,
          link: item.link,
          excerpt: item.excerpt,
          tags: item.tags,
        })
      ) {
        return false;
      }
      // Category match
      if (selectedCategory !== 'Todas' && item.category !== selectedCategory) {
        return false;
      }
      // Source match
      if (selectedSource !== 'Todas' && item.source !== selectedSource) {
        return false;
      }
      // Local search filter (in case user types before debounce or searches within results)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inTitlePt = (item.titlePt || '').toLowerCase().includes(query);
        const inTitle = (item.title || '').toLowerCase().includes(query);
        const inExcerptPt = (item.excerptPt || '').toLowerCase().includes(query);
        const inExcerpt = (item.excerpt || '').toLowerCase().includes(query);
        const inSource = (item.source || '').toLowerCase().includes(query);
        const inCategory = (item.category || '').toLowerCase().includes(query);
        const inTags = (item.tags || []).some((t) => t.toLowerCase().includes(query));

        if (!inTitlePt && !inTitle && !inExcerptPt && !inExcerpt && !inSource && !inCategory && !inTags) {
          return false;
        }
      }
      return true;
    });
  }, [articles, selectedCategory, selectedSource, searchQuery]);

  // Visible sliced articles for pagination
  const displayedArticles = useMemo(() => {
    return filteredArticles.slice(0, visibleCount);
  }, [filteredArticles, visibleCount]);

  const hasMoreArticles = visibleCount < filteredArticles.length || hasMoreServer;

  // Load more: continuous infinite stream from server and external live feeds
  const handleLoadMore = async () => {
    if (visibleCount < filteredArticles.length) {
      setVisibleCount((prev) => prev + PAGE_INCREMENT);
      return;
    }

    if (loadingMore) return;

    setLoadingMore(true);
    const nextPage = serverPage + 1;

    try {
      const params = new URLSearchParams({
        page: nextPage.toString(),
        limit: '20',
        search: searchQuery.trim(),
        category: selectedCategory,
        source: selectedSource,
      });

      const res = await fetch(`/api/anime-news?${params.toString()}`);
      const contentType = res.headers.get('content-type') || '';

      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const newArticles = sanitizeAndFilterList(data.data);
          setArticles((prev) => {
            const map = new Map<string, NewsArticle>();
            prev.forEach((a) => map.set(a.link || a.id, a));
            newArticles.forEach((a) => map.set(a.link || a.id, a));
            return Array.from(map.values()).sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
          });
          setServerPage(nextPage);
          setHasMoreServer(data.hasMore ?? true);
          setVisibleCount((prev) => prev + newArticles.length);
        } else {
          setHasMoreServer(false);
        }
      } else {
        // Direct fallback pagination
        const directFallback = await fetchClientDirectNews(nextPage, 20, searchQuery.trim());
        if (directFallback.articles.length > 0) {
          const newArticles = sanitizeAndFilterList(directFallback.articles);
          setArticles((prev) => {
            const map = new Map<string, NewsArticle>();
            prev.forEach((a) => map.set(a.link || a.id, a));
            newArticles.forEach((a) => map.set(a.link || a.id, a));
            return Array.from(map.values()).sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
          });
          setServerPage(nextPage);
          setHasMoreServer(directFallback.hasMore);
          setVisibleCount((prev) => prev + newArticles.length);
        } else {
          setHasMoreServer(false);
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar mais notícias:', err);
      setHasMoreServer(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // Lead breaking article (first of filtered list if on page 1) and regular articles
  const leadArticle = displayedArticles.length > 0 ? displayedArticles[0] : null;
  const regularArticles = displayedArticles.slice(1);

  // Fallback high quality poster in case an external image fails to load
  const fallbackPoster = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=85';

  return (
    <div className="relative z-10 min-h-screen flex flex-col justify-between bg-[#070b12] text-slate-100">
      <div>
        {/* Header matching navigation */}
        <header className="sticky top-0 z-40 w-full rounded-t-none rounded-b-2xl sm:rounded-b-3xl bg-[#080b11]/75 backdrop-blur-2xl backdrop-saturate-180 border-b border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.5)] transition-all">
          <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 md:px-8 py-3">
            {/* Left: Back button + Logo */}
            <div className="flex items-center gap-3">
              <button
                id="news-back-home-btn"
                onClick={onBackToHome}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm group"
                title="Voltar para a página inicial"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline">Início</span>
              </button>

              <div
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={onBackToHome}
              >
                <AnimeGuidesLogo className="w-15 h-15 sm:w-16 sm:h-16 hover:scale-105 transition-transform" glow={true} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base sm:text-lg font-black tracking-tight text-white font-display leading-none">
                      AnimeGuides
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 text-amber-300 leading-none">
                      Notícias
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Controls: Refresh & PWA Install */}
            <div className="flex items-center gap-2">
              <button
                id="news-refresh-btn"
                onClick={() => fetchNews(true)}
                disabled={loading || refreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/15 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
                title="Atualizar notícias"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
                <span className="hidden md:inline">{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
              </button>

              <PWAInstallButton id="news-pwa-install-btn" />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 mt-6 pb-16">
          {/* ======================================================== */}
          {/* NEWSPAPER MASTHEAD BLOCK WITH EMBEDDED FILTERS */}
          {/* ======================================================== */}
          <section className="relative rounded-2xl sm:rounded-3xl bg-[#f5f1e8] text-[#1c1814] p-4 sm:p-7 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-4 border-[#2b241c]/25 overflow-hidden font-serif select-none mb-8">
            {/* Authentic Paper Texture Overlay */}
            <PaperTextureOverlay opacity={0.16} />

            {/* Main Newspaper Headline */}
            <div className="relative z-10 text-center py-2 sm:py-4 border-b-2 sm:border-b-4 border-[#2b241c] mb-3">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#161310] leading-none uppercase font-serif drop-shadow-sm">
                NOTÍCIAS DE ANIME
              </h1>
            </div>

            {/* INTEGRATED FILTERS INSIDE THE NEWSPAPER BLOCK */}
            <div className="relative z-10 pt-2 space-y-4 font-sans">
              {/* Search Bar & Source Selector */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Input ignoring date filters */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#665a4c]" />
                  <input
                    id="news-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar qualquer notícia, anime, estúdio ou palavra-chave..."
                    className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-[#ece6d8] border border-[#2b241c]/25 text-[#1b1713] placeholder-[#7d7060] text-xs sm:text-sm focus:outline-none focus:border-[#1c1814] focus:ring-1 focus:ring-[#1c1814] transition-all shadow-inner font-sans font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#665a4c] hover:text-[#1b1713] px-1.5 py-0.5 rounded bg-black/5 hover:bg-black/10 transition-colors"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Source dropdown */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-[#5c5040] whitespace-nowrap">Fonte:</span>
                  <select
                    id="news-source-select"
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-[#ece6d8] border border-[#2b241c]/25 text-[#1b1713] text-xs font-bold focus:outline-none focus:border-[#1c1814] cursor-pointer shadow-sm"
                  >
                    {availableSources.map((s) => (
                      <option key={s} value={s} className="bg-[#f5f1e8] text-[#1c1814]">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Filter Pills (Without "Anúncios Oficiais" and "Indústria & Bilheteria") */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer select-none ${
                        isActive
                          ? 'bg-[#221c15] text-[#f7f5ed] shadow-sm scale-[1.02]'
                          : 'bg-[#ece5d6] hover:bg-[#e4dcce] text-[#4d4234] border border-[#2b241c]/20'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Live search feedback counter */}
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#66594a] pt-1 border-t border-[#2b241c]/15">
                <span>
                  {searchQuery ? (
                    <>
                      Resultados para &ldquo;<strong className="text-[#1a1612]">{searchQuery}</strong>&rdquo;: {filteredArticles.length} encontrada{filteredArticles.length === 1 ? '' : 's'}
                    </>
                  ) : (
                    <>Exibindo {Math.min(displayedArticles.length, filteredArticles.length)} de {filteredArticles.length} notícias</>
                  )}
                </span>
                {selectedCategory !== 'Todas' && (
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#221c15]">
                    Seção: {selectedCategory}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* CONTENT SECTION (Loading / Error / Newspaper Grid) */}
          {/* ======================================================== */}
          {loading ? (
            /* Skeleton Loading */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-[#141b2a]/60 border border-white/10 p-5 space-y-4 animate-pulse"
                >
                  <div className="h-4 bg-white/10 rounded w-1/3" />
                  <div className="h-40 bg-white/5 rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-5 bg-white/10 rounded w-5/6" />
                    <div className="h-4 bg-white/10 rounded w-full" />
                    <div className="h-4 bg-white/10 rounded w-4/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error State */
            <div className="rounded-2xl bg-rose-950/30 border border-rose-500/30 p-8 text-center max-w-md mx-auto my-12">
              <p className="text-sm text-rose-300 mb-4">{error}</p>
              <button
                onClick={() => fetchNews(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Tentar novamente
              </button>
            </div>
          ) : filteredArticles.length === 0 ? (
            /* Empty State */
            <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center max-w-lg mx-auto my-12">
              <Newspaper className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-lg font-bold text-white mb-1">Nenhuma notícia encontrada</h3>
              <p className="text-xs text-slate-400 mb-5">
                Não foram encontradas matérias com esses termos de pesquisa ou filtros selecionados.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Todas');
                  setSelectedSource('Todas');
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-bold transition-all cursor-pointer"
              >
                Limpar todos os filtros
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* ======================================================== */}
              {/* FEATURED LEAD STORY WITH NEWSPAPER UNFOLDING REVEAL */}
              {/* ======================================================== */}
              {leadArticle && (
                <motion.article
                  key={leadArticle.id || leadArticle.link}
                  initial={{
                    opacity: 0,
                    rotateX: -32,
                    scaleY: 0.72,
                    scaleX: 0.96,
                    y: -28,
                    transformOrigin: 'top center',
                  }}
                  animate={{
                    opacity: 1,
                    rotateX: 0,
                    scaleY: 1,
                    scaleX: 1,
                    y: 0,
                    transformOrigin: 'top center',
                  }}
                  transition={{
                    type: 'spring',
                    damping: 18,
                    stiffness: 110,
                    mass: 0.8,
                  }}
                  onClick={() => setSelectedArticle(leadArticle)}
                  className="group relative rounded-2xl sm:rounded-3xl bg-[#f7f5ed] text-[#1c1814] p-5 sm:p-7 md:p-8 border-2 border-[#332b21]/25 shadow-[0_15px_45px_rgba(0,0,0,0.45)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)] hover:-translate-y-1 transition-all cursor-pointer overflow-hidden font-serif [transform-style:preserve-3d]"
                >
                  {/* Newspaper Unfurl Crease Highlight */}
                  <motion.div
                    initial={{ opacity: 0.7, scaleY: 1 }}
                    animate={{ opacity: 0, scaleY: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#d1c2a5]/50 via-[#ede2cc]/20 to-transparent pointer-events-none z-20"
                  />

                  {/* Authentic Paper Texture Overlay */}
                  <PaperTextureOverlay opacity={0.16} />

                  {/* Folded corner accent */}
                  <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-[#ded7c8] to-transparent pointer-events-none" />

                  <div className="relative z-10 flex flex-col lg:flex-row gap-6 items-center">
                    {/* Left: Headline & Excerpt */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 font-sans">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#1f1a14] text-[#f7f5ed]">
                          {leadArticle.category}
                        </span>
                        <span className="text-xs font-bold text-[#685c4d]">
                          {leadArticle.source}
                        </span>
                        <span className="text-xs text-[#7d7162]">• {leadArticle.formattedDatePt}</span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#14110e] leading-tight group-hover:text-[#8a3818] transition-colors font-serif">
                        {leadArticle.titlePt || leadArticle.title}
                      </h2>

                      <p className="text-sm sm:text-base text-[#3d3429] leading-relaxed line-clamp-3 font-serif italic">
                        &ldquo;{leadArticle.excerptPt || leadArticle.excerpt}&rdquo;
                      </p>

                      <div className="pt-2 flex items-center gap-4 font-sans text-xs">
                        <span className="inline-flex items-center gap-1 font-bold text-[#1f1a14] group-hover:text-[#8a3818] group-hover:translate-x-1 transition-all">
                          <span>Ler matéria completa</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                        <span className="text-[#7d7162] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          ~{leadArticle.readTimeMin} min de leitura
                        </span>
                      </div>
                    </div>

                    {/* Right: Featured Photo Frame with High Quality Image */}
                    {leadArticle.image && (
                      <div className="w-full lg:w-96 shrink-0">
                        <div className="relative rounded-xl overflow-hidden border-2 border-[#332b21]/20 shadow-md bg-[#e5decb] aspect-[16/10]">
                          <img
                            src={leadArticle.image}
                            alt={leadArticle.titlePt}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = fallbackPoster;
                            }}
                            className="w-full h-full object-cover filter contrast-[1.04] group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.article>
              )}

              {/* ======================================================== */}
              {/* NEWSPAPER COLUMNS / TILES GRID WITH 3D UNFOLDING REVEAL */}
              {/* ======================================================== */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 [perspective:1200px]">
                {regularArticles.map((article, idx) => (
                  <motion.article
                    key={article.id || `${article.link}-${idx}`}
                    initial={{
                      opacity: 0,
                      rotateX: -42,
                      scaleY: 0.68,
                      scaleX: 0.94,
                      y: -30,
                      transformOrigin: 'top center',
                    }}
                    animate={{
                      opacity: 1,
                      rotateX: 0,
                      scaleY: 1,
                      scaleX: 1,
                      y: 0,
                      transformOrigin: 'top center',
                    }}
                    transition={{
                      type: 'spring',
                      damping: 16,
                      stiffness: 115,
                      mass: 0.75,
                      delay: (idx % 9) * 0.05,
                    }}
                    whileHover={{
                      y: -6,
                      transition: { duration: 0.2 },
                    }}
                    onClick={() => setSelectedArticle(article)}
                    className="group relative flex flex-col justify-between rounded-2xl bg-[#f7f5ed] text-[#1c1814] p-5 border-2 border-[#332b21]/20 shadow-[0_8px_25px_rgba(0,0,0,0.35)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.55)] transition-all cursor-pointer font-serif overflow-hidden [transform-style:preserve-3d]"
                  >
                    {/* Newspaper Unfurl Paper Sheen / Crease Effect */}
                    <motion.div
                      initial={{ opacity: 0.8, scaleY: 1 }}
                      animate={{ opacity: 0, scaleY: 0 }}
                      transition={{ duration: 0.55, delay: (idx % 9) * 0.05 + 0.05 }}
                      className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#caa670]/40 via-[#eae2cd]/20 to-transparent pointer-events-none z-20"
                    />

                    {/* Authentic Paper Texture Overlay */}
                    <PaperTextureOverlay opacity={0.16} />

                    {/* Top stamp / line */}
                    <div className="relative z-10">
                      <div className="flex items-center justify-between gap-2 border-b border-[#332b21]/15 pb-2.5 mb-3 font-sans text-xs">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#2b241c] text-[#f7f5ed]">
                          {article.category}
                        </span>
                        <span className="text-[11px] font-semibold text-[#6d6152] truncate">
                          {article.source}
                        </span>
                      </div>

                      {/* Headline */}
                      <h3 className="text-base sm:text-lg font-black text-[#14120f] leading-snug line-clamp-3 group-hover:text-[#8a3818] transition-colors mb-2.5 font-serif">
                        {article.titlePt || article.title}
                      </h3>

                      {/* High-Resolution image snippet */}
                      {article.image && (
                        <div className="relative rounded-lg overflow-hidden border border-[#332b21]/20 my-2 aspect-[16/9] bg-[#e6dfce]">
                          <img
                            src={article.image}
                            alt={article.titlePt}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = fallbackPoster;
                            }}
                            className="w-full h-full object-cover filter contrast-[1.03] group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {/* Compact excerpt (newspaper column text) */}
                      <p className="text-xs sm:text-sm text-[#383026] leading-relaxed line-clamp-3 font-serif mt-2">
                        {article.excerptPt || article.excerpt}
                      </p>
                    </div>

                    {/* Newspaper Footer */}
                    <div className="relative z-10 pt-4 mt-3 border-t border-[#332b21]/15 flex items-center justify-between text-xs font-sans text-[#736757]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {article.formattedDatePt}
                      </span>
                      <span className="font-bold text-[#1f1a14] group-hover:text-[#8a3818] flex items-center gap-0.5">
                        <span>Ler mais</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </motion.article>
                ))}
              </div>

              {/* ======================================================== */}
              {/* PAGINATION: LOAD MORE BUTTON */}
              {/* ======================================================== */}
              <div className="pt-6 pb-2 flex flex-col items-center justify-center gap-3">
                {hasMoreArticles ? (
                  <button
                    id="news-load-more-btn"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="group relative inline-flex items-center gap-2.5 px-7 py-3 rounded-2xl bg-[#f5f1e8] hover:bg-[#ede5d6] text-[#1c1814] font-serif font-black text-sm sm:text-base border-2 border-[#2b241c]/30 shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden select-none disabled:opacity-70 disabled:pointer-events-none"
                  >
                    <PaperTextureOverlay opacity={0.16} />
                    <span className="relative z-10 flex items-center gap-2">
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#8a3818]" />
                          <span>Buscando mais notícias...</span>
                        </>
                      ) : (
                        <>
                          <span>Carregar mais notícias...</span>
                          <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                        </>
                      )}
                    </span>
                  </button>
                ) : filteredArticles.length > 0 ? (
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-sans select-none">
                    <div className="h-px w-12 bg-white/10" />
                    <span>Você chegou ao fim • Todas as {filteredArticles.length} notícias foram carregadas</span>
                    <div className="h-px w-12 bg-white/10" />
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Full Detail Newspaper Reader Modal */}
      <NewsDetailModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        onSelectArticle={setSelectedArticle}
        allArticles={filteredArticles}
      />
    </div>
  );
};
