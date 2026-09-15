import { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimeItem, Season } from './types';
import { fetchAniListSeason } from './services/animeApi';
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
      } catch (e) {
        // Ignore storage error
      }
      return next;
    });
  }, []);

  // Fetch season data dynamically whenever year or season changes
  const loadSeasonData = useCallback(async (year: number, season: Season) => {
    setLoading(true);
    try {
      const data = await fetchAniListSeason(year, season);
      setAnimeList(data);
    } catch (err) {
      console.error('Error loading season data:', err);
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
          currentYear={2026}
          currentSeason={'WINTER'}
        />
      ) : currentView === 'news' ? (
        <NewsPage onBackToHome={handleNavigateHome} />
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
        onClose={() => setSelectedAnime(null)}
        isFavorite={selectedAnime ? favorites.includes(selectedAnime.id) : false}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}
