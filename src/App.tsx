import { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimeItem, Season } from './types';
import { fetchAniListSeason, getCachedSeasonData } from './services/animeApi';
import { CURRENT_SEASON_CONFIG } from './data/animeData';
import { DiagonalPosterBackground } from './components/DiagonalPosterBackground';
import { BACKGROUND_CONFIG } from './config/backgroundConfig';
import { FolderView } from './components/FolderView';
import { SeasonPage } from './components/SeasonPage';
import { AnimeDetailModal } from './components/AnimeDetailModal';
import { NewsPage } from './components/NewsPage';

export default function App() {
  // Navigation state: 'home' = Folder view; 'season' = Season anime page; 'news' = Anime newspaper
  const [currentView, setCurrentView] = useState<'home' | 'season' | 'news'>('home');
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_SEASON_CONFIG.year);
  const [selectedSeason, setSelectedSeason] = useState<Season>(CURRENT_SEASON_CONFIG.season);

  // Anime list for current active season (fetched from API)
  const [animeList, setAnimeList] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Expanded anime modal state
  const [selectedAnime, setSelectedAnime] = useState<AnimeItem | null>(null);
  const [pendingAnimeId, setPendingAnimeId] = useState<number | null>(null);

  // Favorites state persisted in localStorage
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('animeguides_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleToggleFavorite = useCallback((animeId: number) => {
    setFavorites((prev) => {
      const exists = prev.includes(animeId);
      const next = exists ? prev.filter((id) => id !== animeId) : [...prev, animeId];
      try {
        localStorage.setItem('animeguides_favorites', JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  }, []);

  // Parse URL search parameters on load or notification click navigation
  useEffect(() => {
    const handleUrlNavigation = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const animeIdStr = params.get('animeId');
      const viewParam = params.get('view');
      const yearParam = params.get('year');
      const seasonParam = params.get('season');

      if (yearParam) {
        const y = parseInt(yearParam, 10);
        if (!isNaN(y)) setSelectedYear(y);
      }
      if (seasonParam) {
        setSelectedSeason(seasonParam.toUpperCase() as Season);
      }

      if (viewParam === 'season' || animeIdStr) {
        setCurrentView('season');
      } else if (viewParam === 'news') {
        setCurrentView('news');
      }

      if (animeIdStr) {
        const id = parseInt(animeIdStr, 10);
        if (!isNaN(id)) {
          setPendingAnimeId(id);
        }
      }
    };

    handleUrlNavigation();

    // Listen for Service Worker postMessages when notification is clicked while app is already open
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OPEN_ANIME_DETAILS') {
        const id = Number(event.data.animeId);
        const y = event.data.year ? Number(event.data.year) : undefined;
        const s = event.data.season ? (event.data.season.toUpperCase() as Season) : undefined;

        setCurrentView('season');
        if (y) setSelectedYear(y);
        if (s) setSelectedSeason(s);
        if (!isNaN(id)) {
          setPendingAnimeId(id);
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }
    window.addEventListener('popstate', handleUrlNavigation);

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
      window.removeEventListener('popstate', handleUrlNavigation);
    };
  }, []);

  // Match pendingAnimeId against current animeList or cached season data
  useEffect(() => {
    if (!pendingAnimeId) return;

    // 1. Check current active anime list
    const foundInList = animeList.find((a) => a.id === pendingAnimeId);
    if (foundInList) {
      setSelectedAnime(foundInList);
      setPendingAnimeId(null);
      return;
    }

    // 2. Check local season cache
    const cached = getCachedSeasonData(selectedYear, selectedSeason);
    if (cached) {
      const foundInCache = cached.find((a) => a.id === pendingAnimeId);
      if (foundInCache) {
        setSelectedAnime(foundInCache);
        setPendingAnimeId(null);
      }
    }
  }, [pendingAnimeId, animeList, selectedYear, selectedSeason]);

  const handleCloseDetailModal = useCallback(() => {
    setSelectedAnime(null);
    setPendingAnimeId(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('animeId')) {
        url.searchParams.delete('animeId');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }
    }
  }, []);

  // Fetch season data with instant cache-first and online background revalidation
  const loadSeasonData = useCallback(async (year: number, season: Season) => {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    const cached = getCachedSeasonData(year, season);

    if (cached && cached.length > 0) {
      setAnimeList(cached);
      setLoading(false);
      // If offline, preserve the cached data with no network call
      if (isOffline) {
        return;
      }
    } else {
      setLoading(true);
    }

    // When online, fetch and update the current content from AniList & APIs in the background
    try {
      const freshData = await fetchAniListSeason(year, season, { forceRefresh: true });
      if (freshData && freshData.length > 0) {
        setAnimeList(freshData);
      }
    } catch (err) {
      console.warn('Background season data refresh failed, maintaining cached version:', err);
      // Ensure we keep cached version if available
      if (!cached || cached.length === 0) {
        const fallback = getCachedSeasonData(year, season);
        if (fallback && fallback.length > 0) {
          setAnimeList(fallback);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSeasonData(selectedYear, selectedSeason);
  }, [selectedYear, selectedSeason, loadSeasonData]);

  // Handle season selection from folders or top bar
  const handleSelectSeason = (year: number, season: Season) => {
    setSelectedYear(year);
    setSelectedSeason(season);
    setCurrentView('season');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateNews = () => {
    setCurrentView('news');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Compute posters for diagonal background
  // Home page: mix of authentic anime posters from top animes
  // Season page: posters specifically from that season's anime!
  const backgroundPosters = useMemo(() => {
    if (currentView === 'home' || currentView === 'news') {
      return BACKGROUND_CONFIG.customPostersList;
    }
    // Season page: strictly this season's anime posters without any stock photos
    const seasonCovers = animeList
      .map((a) => a.coverImages[0])
      .filter((url): url is string => Boolean(url) && !url.includes('unsplash.com'));

    return seasonCovers.length > 0 ? seasonCovers : BACKGROUND_CONFIG.customPostersList;
  }, [currentView, animeList]);

  return (
    <div className="relative min-h-screen bg-[#070b12] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Infinite Diagonal Sliding Posters Background (Hidden on mobile for peak performance, richly visible on desktop) */}
      <DiagonalPosterBackground
        posters={backgroundPosters}
        opacity={currentView === 'home' ? BACKGROUND_CONFIG.desktopOpacity : BACKGROUND_CONFIG.desktopOpacity * 0.95}
      />

      {/* Main Views: Folder View, News Page, or Season Page */}
      {currentView === 'home' ? (
        <FolderView
          onSelectSeason={handleSelectSeason}
          onNavigateNews={handleNavigateNews}
          currentYear={selectedYear}
          currentSeason={selectedSeason}
        />
      ) : currentView === 'news' ? (
        <NewsPage onBackToHome={handleNavigateHome} currentSeason={selectedSeason} />
      ) : (
        <SeasonPage
          year={selectedYear}
          season={selectedSeason}
          animeList={animeList}
          loading={loading}
          onNavigateHome={handleNavigateHome}
          onSelectSeason={handleSelectSeason}
          onSelectAnime={(anime) => setSelectedAnime(anime)}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* Anime Details Expanded Modal (Image 2) */}
      <AnimeDetailModal
        anime={selectedAnime}
        season={selectedSeason}
        onClose={handleCloseDetailModal}
        isFavorite={selectedAnime ? favorites.includes(selectedAnime.id) : false}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}
