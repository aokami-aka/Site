import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Snowflake,
  Sprout,
  Sun,
  Search,
  X,
  Star,
  LayoutGrid,
  Grid3X3,
  List,
  ArrowUpDown,
  SlidersHorizontal,
  Menu,
  Filter,
  ChevronDown,
  ChevronUp,
  Layers,
  Download,
} from 'lucide-react';
import {
  AnimeItem,
  AnimeType,
  DisplayFormat,
  Season,
  SeasonDefinition,
} from '../types';
import { GENRES_LIST, SEASONS_LIST, TYPES_LIST, getActiveSeasonsForYear } from '../data/animeData';
import { AnimeGuidesLogo } from './AnimeGuidesLogo';
import { useSeasonalFavicon } from '../utils/useSeasonalFavicon';
import { translateSynopsisToPt } from '../services/animeDetailEnricher';
import { AnimeLoadingState } from './AnimeLoadingState';
import {
  MapleLeafMomijiIcon,
  SakuraIcon,
  SunHanabiIcon,
  SnowflakeIcon,
} from './SeasonIcons';
import { usePWAInstall } from '../utils/usePWAInstall';

// Comprehensive seasonal color palettes matching earlier specifications
export interface SeasonPalette {
  namePt: string;
  kanji: string;
  accentHex: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  glowShadow: string;
  cardHoverBorder: string;
  titleHoverText: string;
  activePillBg: string;
  activePillText: string;
  kanjiColor: string;
  plaqueActiveBg: string;
  plaqueBorderColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const SEASON_PALETTES: Record<Season, SeasonPalette> = {
  WINTER: {
    namePt: 'Inverno',
    kanji: '冬',
    accentHex: '#38bdf8',
    accentText: 'text-sky-400',
    accentBg: 'bg-sky-500/15',
    accentBorder: 'border-sky-400/40',
    glowShadow: 'shadow-[0_0_20px_rgba(56,189,248,0.35)]',
    cardHoverBorder: 'hover:border-sky-400/70',
    titleHoverText: 'group-hover:text-sky-400',
    activePillBg: 'bg-sky-400',
    activePillText: 'text-slate-950 font-bold',
    kanjiColor: 'text-sky-400/[0.08]',
    plaqueActiveBg: 'bg-gradient-to-b from-sky-300 via-sky-400 to-sky-600 text-slate-950 font-black shadow-[0_0_15px_rgba(56,189,248,0.5)]',
    plaqueBorderColor: 'rgba(56,189,248,0.9)',
    badgeBg: 'bg-sky-500/10',
    badgeText: 'text-sky-400',
    badgeBorder: 'border-sky-500/25',
  },
  SPRING: {
    namePt: 'Primavera',
    kanji: '春',
    accentHex: '#f472b6',
    accentText: 'text-pink-400',
    accentBg: 'bg-pink-500/15',
    accentBorder: 'border-pink-400/40',
    glowShadow: 'shadow-[0_0_20px_rgba(244,114,182,0.35)]',
    cardHoverBorder: 'hover:border-pink-400/70',
    titleHoverText: 'group-hover:text-pink-400',
    activePillBg: 'bg-pink-400',
    activePillText: 'text-slate-950 font-bold',
    kanjiColor: 'text-pink-400/[0.08]',
    plaqueActiveBg: 'bg-gradient-to-b from-pink-300 via-pink-400 to-rose-500 text-slate-950 font-black shadow-[0_0_15px_rgba(244,114,182,0.5)]',
    plaqueBorderColor: 'rgba(244,114,182,0.9)',
    badgeBg: 'bg-pink-500/10',
    badgeText: 'text-pink-400',
    badgeBorder: 'border-pink-500/25',
  },
  SUMMER: {
    namePt: 'Verão',
    kanji: '夏',
    accentHex: '#fbbf24',
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-500/15',
    accentBorder: 'border-amber-400/40',
    glowShadow: 'shadow-[0_0_20px_rgba(251,191,36,0.35)]',
    cardHoverBorder: 'hover:border-amber-400/70',
    titleHoverText: 'group-hover:text-amber-400',
    activePillBg: 'bg-amber-400',
    activePillText: 'text-slate-950 font-bold',
    kanjiColor: 'text-amber-400/[0.08]',
    plaqueActiveBg: 'bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-black shadow-[0_0_15px_rgba(251,191,36,0.5)]',
    plaqueBorderColor: 'rgba(251,191,36,0.9)',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/25',
  },
  FALL: {
    namePt: 'Outono',
    kanji: '秋',
    accentHex: '#f97316',
    accentText: 'text-orange-400',
    accentBg: 'bg-orange-500/15',
    accentBorder: 'border-orange-400/40',
    glowShadow: 'shadow-[0_0_20px_rgba(249,115,22,0.35)]',
    cardHoverBorder: 'hover:border-orange-500/70',
    titleHoverText: 'group-hover:text-orange-400',
    activePillBg: 'bg-orange-500',
    activePillText: 'text-slate-950 font-bold',
    kanjiColor: 'text-orange-400/[0.08]',
    plaqueActiveBg: 'bg-gradient-to-b from-orange-300 via-orange-400 to-orange-600 text-slate-950 font-black shadow-[0_0_15px_rgba(249,115,22,0.5)]',
    plaqueBorderColor: 'rgba(249,115,22,0.9)',
    badgeBg: 'bg-orange-500/10',
    badgeText: 'text-orange-400',
    badgeBorder: 'border-orange-500/25',
  },
};

/**
 * Authentic Japanese Wooden Plaque (木札 / Kifuda) Button Component
 * Recreates traditional Japanese timber signboards with natural cedar/hinoki wood grain,
 * carved border groove lines, and wooden joinery dowels (Mokugyu round pegs).
 */
const PlaqueButton: React.FC<{
  id?: string;
  isActive?: boolean;
  activeBgClass?: string;
  borderColor?: string;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}> = ({
  id,
  isActive = false,
  activeBgClass = 'bg-gradient-to-b from-[#4e2b17] via-[#3a1d0d] to-[#251106]',
  borderColor = 'rgba(251,191,36,0.7)',
  onClick,
  title,
  children,
  className = '',
}) => {
  return (
    <button
      id={id}
      onClick={onClick}
      title={title}
      className={`relative inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-[5px] cursor-pointer select-none text-xs transition-all w-auto border-0 shadow-md ${
        isActive
          ? 'scale-[1.03] text-amber-50 font-bold'
          : 'text-amber-100/90 hover:text-white hover:brightness-110 shadow-[0_3px_8px_rgba(0,0,0,0.65)]'
      } ${className}`}
      style={{
        background: isActive
          ? 'linear-gradient(180deg, #502a16 0%, #3e1e0d 45%, #291206 100%)'
          : 'linear-gradient(180deg, #3a1e10 0%, #2b1509 45%, #1d0d05 100%)',
        boxShadow: isActive
          ? 'inset 0 1px 1px rgba(255, 220, 180, 0.45), inset 0 -1.5px 1px rgba(0, 0, 0, 0.85), 0 0 12px rgba(251,191,36,0.35), 0 3px 8px rgba(0,0,0,0.7)'
          : 'inset 0 1px 0 rgba(255, 220, 180, 0.22), inset 0 -1.5px 0 rgba(0, 0, 0, 0.85), 0 3px 7px rgba(0, 0, 0, 0.55)',
      }}
    >
      {/* Authentic Japanese Wood Grain & Carved Groove Texture Overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none rounded-[5px]"
        preserveAspectRatio="none"
        viewBox="0 0 100 40"
        aria-hidden="true"
      >
        {/* Fine horizontal wood grain fiber waves */}
        <path d="M0 9 Q 25 7, 55 10 T 100 8" stroke="rgba(255, 210, 160, 0.12)" strokeWidth="0.75" fill="none" />
        <path d="M0 17 Q 35 19, 70 16 T 100 18" stroke="rgba(0, 0, 0, 0.35)" strokeWidth="0.85" fill="none" />
        <path d="M0 25 Q 30 23, 65 26 T 100 24" stroke="rgba(255, 210, 160, 0.1)" strokeWidth="0.7" fill="none" />
        <path d="M0 32 Q 40 34, 75 31 T 100 33" stroke="rgba(0, 0, 0, 0.4)" strokeWidth="0.8" fill="none" />

        {/* Natural wood knot ellipses */}
        <ellipse cx="20" cy="18" rx="4.5" ry="2" fill="none" stroke="rgba(0, 0, 0, 0.25)" strokeWidth="0.6" />
        <ellipse cx="80" cy="24" rx="4" ry="1.8" fill="none" stroke="rgba(255, 210, 160, 0.08)" strokeWidth="0.5" />

        {/* Traditional carved groove border */}
        <rect
          x="2.5"
          y="2.5"
          width="95"
          height="35"
          rx="3"
          fill="none"
          stroke={isActive ? borderColor : 'rgba(0, 0, 0, 0.7)'}
          strokeWidth={isActive ? '1.4' : '1.1'}
          opacity={isActive ? 0.95 : 0.8}
        />
        <rect
          x="3.3"
          y="3.3"
          width="93.4"
          height="33.4"
          rx="2.5"
          fill="none"
          stroke={isActive ? 'rgba(255,255,255,0.45)' : 'rgba(255, 215, 170, 0.25)'}
          strokeWidth="0.7"
        />

        {/* Traditional Wooden Joinery Dowels (Mokugyu round pegs) at 4 corners */}
        <circle cx="5.5" cy="6" r="1.5" fill="#180a04" />
        <circle cx="5.5" cy="6" r="1.1" fill="#693717" stroke="#331808" strokeWidth="0.3" />

        <circle cx="94.5" cy="6" r="1.5" fill="#180a04" />
        <circle cx="94.5" cy="6" r="1.1" fill="#693717" stroke="#331808" strokeWidth="0.3" />

        <circle cx="5.5" cy="34" r="1.5" fill="#180a04" />
        <circle cx="5.5" cy="34" r="1.1" fill="#693717" stroke="#331808" strokeWidth="0.3" />

        <circle cx="94.5" cy="34" r="1.5" fill="#180a04" />
        <circle cx="94.5" cy="34" r="1.1" fill="#693717" stroke="#331808" strokeWidth="0.3" />
      </svg>

      {/* Engraved Plaque Text */}
      <span
        className="relative z-10 flex items-center justify-center gap-1.5 px-0.5"
        style={{
          textShadow: isActive
            ? '0 1px 3px rgba(0,0,0,0.95), 0 0 10px rgba(251,191,36,0.5)'
            : '0 1px 2px rgba(0,0,0,0.95), 0 -1px 0 rgba(255,220,180,0.15)',
        }}
      >
        {children}
      </span>
    </button>
  );
};

interface SeasonPageProps {
  year: number;
  season: Season;
  animeList: AnimeItem[];
  loading: boolean;
  onNavigateHome: () => void;
  onSelectSeason: (year: number, season: Season) => void;
  onSelectAnime: (anime: AnimeItem) => void;
  favorites: number[];
  onToggleFavorite: (animeId: number) => void;
}

const ListAnimeCardItem: React.FC<{
  anime: AnimeItem;
  index: number;
  palette: SeasonPalette;
  isFav: boolean;
  onSelectAnime: (anime: AnimeItem) => void;
  onToggleFavorite: (id: number) => void;
}> = ({ anime, index, palette, isFav, onSelectAnime, onToggleFavorite }) => {
  const [translatedSynopsis, setTranslatedSynopsis] = useState<string>(
    anime.synopsisPt || anime.synopsisEn || ''
  );

  useEffect(() => {
    const raw = anime.synopsisPt || anime.synopsisEn || '';
    if (raw) {
      translateSynopsisToPt(raw).then((res) => {
        if (res) setTranslatedSynopsis(res);
      });
    }
  }, [anime.id, anime.synopsisPt, anime.synopsisEn]);

  const cover =
    anime.coverImages && anime.coverImages[0]
      ? anime.coverImages[0]
      : 'https://media.kitsu.app/anime/46474/poster_image/medium-23e1293e41a0b54b6621eb589c3f0d62.jpeg';
  const posterGlow = anime.coverColor || palette.accentHex;

  return (
    <motion.div
      key={`list-anime-${anime.id}-${index}`}
      variants={{
        hidden: { opacity: 0, y: 16, scale: 0.98 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      onClick={() => onSelectAnime(anime)}
      className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-[#0e1422] md:bg-[#0e1422]/75 md:backdrop-blur-xl hover:bg-[#131b2c] md:hover:bg-[#131b2c]/90 transition-all cursor-pointer group cv-auto gpu-layer"
      style={{
        border: `1px solid ${posterGlow}30`,
        boxShadow: `0 6px 20px -4px ${posterGlow}22, 0 0 12px -2px ${palette.accentHex}14`,
      }}
    >
      <div
        className="relative w-full sm:w-28 sm:h-40 rounded-xl overflow-hidden shrink-0 bg-[#070a0f]"
        style={{
          boxShadow: `0 4px 14px ${posterGlow}30`,
        }}
      >
        {cover ? (
          <img
            src={cover}
            alt={anime.title.romaji}
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : null}
        {/* Subtle transparent frosted glass plaque badge for score and type with seasonal tint */}
        <div
          className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold backdrop-blur-md backdrop-saturate-150 select-none border whitespace-nowrap"
          style={{
            background: `linear-gradient(135deg, ${palette.accentHex}1f 0%, rgba(10, 15, 26, 0.78) 100%)`,
            borderColor: `${palette.accentHex}40`,
            boxShadow: `inset 0 1px 1px ${palette.accentHex}30, 0 2px 6px rgba(0,0,0,0.45)`,
          }}
        >
          {anime.score ? (
            <span className="flex items-center gap-0.5 text-amber-300 font-extrabold">
              <Star className="w-2.5 h-2.5 fill-current text-amber-400" />
              <span>{anime.score}</span>
            </span>
          ) : (
            <span className="text-white/60">—</span>
          )}
          <span style={{ color: `${palette.accentHex}80` }}>•</span>
          <span className="text-white font-semibold">{anime.typeLabel}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3
                className={`text-base font-bold text-white ${palette.titleHoverText} transition-colors font-display`}
              >
                {anime.title.romaji}
              </h3>
              <p className="text-xs text-slate-400 italic">
                {anime.title.portuguese || anime.title.english}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(anime.id);
              }}
              className={`p-2 rounded-full border transition-colors cursor-pointer ${
                isFav
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-black/50 text-slate-300 border-white/15 hover:text-white'
              }`}
            >
              <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
            </button>
          </div>

          <p className="text-xs text-slate-300 line-clamp-2 mt-2 leading-relaxed">
            {translatedSynopsis || 'Sinopse não disponível.'}
          </p>
        </div>

        {/* Bottom Metadata Info: Single Line with no extra type badge */}
        <div className="flex items-center gap-2 sm:gap-3 mt-3 pt-2.5 border-t border-white/5 text-xs text-slate-400 whitespace-nowrap overflow-x-auto">
          <span>Estúdio: <span className="text-slate-200 font-medium">{anime.studio?.name || 'Desconhecido'}</span></span>
          <span>•</span>
          <span>Episódios: <span className="text-slate-200 font-medium">{anime.episodes}</span></span>
          <span>•</span>
          <span>Estréia: <span className="text-slate-200 font-medium">{anime.startDate?.formatted || 'Em breve'}</span></span>
        </div>
      </div>
    </motion.div>
  );
};

export const SeasonPage: React.FC<SeasonPageProps> = ({
  year,
  season,
  animeList,
  loading,
  onNavigateHome,
  onSelectSeason,
  onSelectAnime,
  favorites,
  onToggleFavorite,
}) => {
  const [selectedType, setSelectedType] = useState<AnimeType>('Todos os Tipos');
  const [selectedGenre, setSelectedGenre] = useState<string>('Mostrar Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'score' | 'title' | 'date'>('default');
  const [displayFormat, setDisplayFormat] = useState<DisplayFormat>('grid-standard');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTypesExpanded, setIsTypesExpanded] = useState(false);
  const [isGenresExpanded, setIsGenresExpanded] = useState(false);

  const { isInstallable, installApp } = usePWAInstall();

  // Active season color palette
  const palette = SEASON_PALETTES[season] || SEASON_PALETTES.WINTER;

  // Active seasons configured for the current year
  const activeSeasons = useMemo(() => getActiveSeasonsForYear(year), [year]);

  // Update browser tab favicon to match active season
  useSeasonalFavicon(season);

  // Compute favorites count specifically for the current season / active anime list
  // Fixes user issue: "No botão de favoritos fala que tem 2 marcados, mas na verdade não tem nenhum marcado"
  const currentSeasonFavoritesCount = useMemo(() => {
    return animeList.filter((a) => favorites.includes(a.id)).length;
  }, [animeList, favorites]);

  // Find definition for current season
  const currentSeasonDef = useMemo(() => {
    return (
      SEASONS_LIST.find((s) => s.key === season) || {
        key: season,
        labelPt: palette.namePt,
        monthPt: palette.namePt,
        iconName: 'Snowflake',
      }
    );
  }, [season, palette.namePt]);

  // Filter and Sort Anime
  const filteredAnime = useMemo(() => {
    let list = [...animeList];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.title.romaji.toLowerCase().includes(q) ||
          a.title.english?.toLowerCase().includes(q) ||
          a.title.portuguese?.toLowerCase().includes(q) ||
          a.title.userPreferred?.toLowerCase().includes(q) ||
          a.studio.name.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (selectedType !== 'Todos os Tipos') {
      list = list.filter((a) => a.typeLabel === selectedType);
    }

    // Genre filter
    if (selectedGenre !== 'Mostrar Todos') {
      list = list.filter((a) => a.genres.includes(selectedGenre));
    }

    // Separate Favorites filter
    if (showOnlyFavorites) {
      list = list.filter((anime) => favorites.includes(anime.id));
    }

    // Sorting (default is sorted by popularity as requested)
    list.sort((a, b) => {
      if (sortBy === 'default') {
        return (b.popularity || 0) - (a.popularity || 0);
      }
      if (sortBy === 'score') {
        return (b.score || 0) - (a.score || 0);
      }
      if (sortBy === 'title') {
        return a.title.romaji.localeCompare(b.title.romaji);
      }
      if (sortBy === 'date') {
        const dateA = (a.startDate?.month || 0) * 100 + (a.startDate?.day || 0);
        const dateB = (b.startDate?.month || 0) * 100 + (b.startDate?.day || 0);
        return dateA - dateB;
      }
      return 0;
    });

    // Ensure strict deduplication by unique ID
    const seenIds = new Set<number>();
    return list.filter((item) => {
      if (!item || !item.id || seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });
  }, [animeList, selectedType, selectedGenre, searchQuery, sortBy, showOnlyFavorites, favorites]);

  const clearFilters = () => {
    setSelectedType('Todos os Tipos');
    setSelectedGenre('Mostrar Todos');
    setSearchQuery('');
    setShowOnlyFavorites(false);
  };

  // User requirement: Do not show clear button when the only changed setting is sort
  const hasActiveFilters =
    selectedType !== 'Todos os Tipos' ||
    selectedGenre !== 'Mostrar Todos' ||
    searchQuery !== '' ||
    showOnlyFavorites;

  // Icon selector for season tabs with seasonal dynamic coloring
  const getSeasonTabIcon = (iconName: string, isActive: boolean, tabSeasonKey?: Season) => {
    const tabPal = tabSeasonKey ? SEASON_PALETTES[tabSeasonKey] : palette;
    const iconClass = `w-3.5 h-3.5 ${isActive ? tabPal.accentText : 'text-amber-200/80'}`;
    switch (iconName) {
      case 'Snowflake':
        return <SnowflakeIcon className={iconClass} />;
      case 'Sakura':
      case 'Sprout':
        return <SakuraIcon className={iconClass} />;
      case 'SunHanabi':
      case 'Sun':
        return <SunHanabiIcon className={iconClass} />;
      case 'MapleLeaf':
      case 'Flame':
      default:
        return <MapleLeafMomijiIcon className={iconClass} />;
    }
  };

  return (
    <div className="w-full min-h-screen pb-16 flex flex-col items-center">
      {/* Full-width Acrylic Frosted Glass Navbar (colada no topo e laterais, bordas inferiores arredondadas) */}
      <header className="sticky top-0 z-40 w-full rounded-t-none rounded-b-2xl sm:rounded-b-3xl bg-[#080b11]/95 md:bg-[#080b11]/50 md:backdrop-blur-2xl md:backdrop-saturate-180 border-b border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.4)] transition-all">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 md:px-8 py-2.5">
          {/* Brand & Plaque Home button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 cursor-pointer group text-left"
              title="Ir para a página inicial"
            >
              <AnimeGuidesLogo
                season={season}
                className="w-15 h-15 sm:w-16 sm:h-16 transition-transform group-hover:scale-105"
                glow={true}
              />
              <span className="font-extrabold text-base tracking-tight font-display text-white transition-colors">
                AnimeGuides
              </span>
            </button>

            {/* Desktop Plaque Button for Página Inicial */}
            <div className="hidden md:block ml-1">
              <PlaqueButton
                id="nav-home-btn"
                onClick={onNavigateHome}
                title="Voltar para a página inicial"
              >
                <Home className={`w-3.5 h-3.5 ${palette.accentText}`} />
                <span>Página inicial</span>
              </PlaqueButton>
            </div>
          </div>

          {/* Season Quick Plaque Tabs (Desktop) */}
          <nav
            aria-label="Temporadas do ano"
            className="hidden md:flex items-center gap-2 py-0.5"
          >
            {activeSeasons.map((seasonDef: SeasonDefinition) => {
              const isActive = seasonDef.key === season;
              const tabPalette = SEASON_PALETTES[seasonDef.key];
              return (
                <PlaqueButton
                  key={`top-nav-${seasonDef.key}`}
                  id={`nav-season-${seasonDef.key.toLowerCase()}`}
                  isActive={isActive}
                  activeBgClass={tabPalette.plaqueActiveBg}
                  borderColor={tabPalette.plaqueBorderColor}
                  onClick={() => onSelectSeason(year, seasonDef.key)}
                  title={`Ir para ${seasonDef.monthPt} ${year}`}
                >
                  {getSeasonTabIcon(seasonDef.iconName, isActive, seasonDef.key)}
                  <span className="font-bold">
                    {seasonDef.monthPt} {year}
                  </span>
                </PlaqueButton>
              );
            })}

            {/* PWA Install Button (Desktop) */}
            {isInstallable && (
              <button
                id="season-pwa-install-btn"
                onClick={installApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-cyan-300 text-xs font-bold transition-all shadow-sm cursor-pointer ml-1"
                title="Instalar AnimeGuides como aplicativo"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar App</span>
              </button>
            )}
          </nav>

          {/* Mobile Hamburger Toggle Button (Completely borderless as requested) */}
          <div className="md:hidden flex items-center">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-transparent hover:bg-white/10 text-white transition-colors cursor-pointer border-0"
              aria-label="Abrir menu"
            >
              {isMobileMenuOpen ? (
                <X className={`w-5 h-5 ${palette.accentText}`} />
              ) : (
                <Menu className={`w-5 h-5 ${palette.accentText}`} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Expanding and Sliding Down Animation via AnimatePresence) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -14 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -14 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="md:hidden sticky top-[56px] z-30 w-full max-w-7xl mx-auto bg-[#0c121e]/95 md:bg-[#0c121e]/80 md:backdrop-blur-2xl border-b border-white/15 px-4 py-4 space-y-4 shadow-2xl overflow-hidden rounded-b-2xl"
          >
            {/* 1. Seasons Plaque Grid placed first */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
                Temporadas de {year}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {activeSeasons.map((seasonDef: SeasonDefinition) => {
                  const isActive = seasonDef.key === season;
                  const tabPalette = SEASON_PALETTES[seasonDef.key];
                  return (
                    <PlaqueButton
                      key={`mobile-nav-${seasonDef.key}`}
                      id={`mobile-nav-season-${seasonDef.key.toLowerCase()}`}
                      isActive={isActive}
                      activeBgClass={tabPalette.plaqueActiveBg}
                      borderColor={tabPalette.plaqueBorderColor}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onSelectSeason(year, seasonDef.key);
                      }}
                    >
                      {getSeasonTabIcon(seasonDef.iconName, isActive, seasonDef.key)}
                      <span>{seasonDef.monthPt}</span>
                    </PlaqueButton>
                  );
                })}
              </div>
            </div>

            {/* 2. Página Inicial button placed BELOW seasons, centered, auto-width hugging its content */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2 border-t border-white/10">
              <PlaqueButton
                id="mobile-nav-home-btn"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigateHome();
                }}
              >
                <Home className={`w-4 h-4 ${palette.accentText}`} />
                <span className="font-semibold">Página inicial</span>
              </PlaqueButton>

              {isInstallable && (
                <button
                  id="mobile-pwa-install-btn"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    installApp();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-bold shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Instalar App</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Page Container */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-2">
        {/* Subtle Page Fade Transition when changing seasons within the year */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${year}-${season}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
          {/* Main Title Section with Seasonal Palette & Atmospheric Kanji Watermark */}
          <div className="relative text-center pt-5 pb-3 overflow-hidden">
        {/* Subtle Watermark Kanji with Season Color */}
        <div
          aria-hidden="true"
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl sm:text-9xl md:text-[11rem] font-black select-none pointer-events-none font-display ${palette.kanjiColor}`}
        >
          {palette.kanji}
        </div>

        {/* Header Title: "[Temporada] [Ano]" with Seasonal Color */}
        <h1
          className={`relative z-10 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight font-display ${palette.accentText}`}
        >
          {currentSeasonDef.labelPt} {year}
        </h1>
      </div>

      {/* Creative Filter & Navigation Hub */}
      <div className="rounded-3xl bg-[#090e1a] md:bg-[#090e1a]/90 md:backdrop-blur-2xl border border-white/15 shadow-2xl p-4 sm:p-6 mb-7 space-y-4">
        {/* Row 1: Search Bar + Clear Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${palette.accentText} pointer-events-none`} />
            <input
              id="anime-title-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar anime por título ou estúdio... (ex: Frieren, MAPPA)"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#121827] border border-white/15 focus:outline-none focus:ring-2 text-xs sm:text-sm text-white placeholder-slate-500 transition-all shadow-inner"
              style={{
                borderColor: searchQuery ? palette.accentHex : undefined,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-0.5"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              id="clear-all-filters-btn"
              onClick={clearFilters}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-300 bg-[#131929] hover:bg-[#1a233a] border border-rose-500/30 transition-all cursor-pointer shrink-0 shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>

        {/* Row 2: Type Filter Collapsible Section (default collapsed) */}
        <div className="pt-2 border-t border-white/8 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className={`w-3.5 h-3.5 ${palette.accentText}`} />
                <span>Tipo de Anime:</span>
              </span>
              {selectedType !== 'Todos os Tipos' && (
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${palette.badgeBg} ${palette.badgeText} border ${palette.badgeBorder}`}>
                  {selectedType}
                </span>
              )}
              {showOnlyFavorites && (
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${palette.badgeBg} ${palette.badgeText} border ${palette.badgeBorder} flex items-center gap-1`}>
                  <Star className="w-3 h-3 fill-current" />
                  <span>Favoritos ({currentSeasonFavoritesCount})</span>
                </span>
              )}
            </div>

            <button
              id="toggle-types-filter-btn"
              onClick={() => setIsTypesExpanded((prev) => !prev)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#131929] hover:bg-[#1a233a] border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <span>{isTypesExpanded ? 'Encolher' : 'Expandir'}</span>
              {isTypesExpanded ? (
                <ChevronUp className={`w-3.5 h-3.5 ${palette.accentText}`} />
              ) : (
                <ChevronDown className={`w-3.5 h-3.5 ${palette.accentText}`} />
              )}
            </button>
          </div>

          <AnimatePresence>
            {isTypesExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-1.5 pt-1 pb-1">
                  {/* Seasonal Favorites Button (moved here and sized identical to type buttons) */}
                  <button
                    id="toggle-favorites-filter-btn"
                    onClick={() => setShowOnlyFavorites((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer select-none border ${
                      showOnlyFavorites
                        ? `${palette.activePillBg} ${palette.activePillText} shadow-md scale-[1.02] border-transparent`
                        : 'bg-[#121827] text-slate-300 hover:text-white hover:bg-[#1a2338] border-white/10'
                    }`}
                    title="Filtrar apenas favoritos nesta temporada"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        showOnlyFavorites ? 'fill-current' : 'fill-current text-amber-400 opacity-90'
                      }`}
                    />
                    <span>Favoritos</span>
                    <span
                      className="ml-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold"
                      style={{
                        backgroundColor: showOnlyFavorites ? 'rgba(0,0,0,0.25)' : `${palette.accentHex}20`,
                        color: showOnlyFavorites ? '#020617' : palette.accentHex,
                      }}
                    >
                      {currentSeasonFavoritesCount}
                    </span>
                  </button>

                  {TYPES_LIST.map((type) => {
                    const isSelected = selectedType === type;
                    return (
                      <button
                        key={`type-pill-${type}`}
                        id={`filter-type-${type.replace(/\s+/g, '-').toLowerCase()}`}
                        onClick={() => setSelectedType(type)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
                          isSelected
                            ? `${palette.activePillBg} ${palette.activePillText} shadow-md scale-[1.02]`
                            : 'bg-[#121827] text-slate-300 hover:text-white hover:bg-[#1a2338] border border-white/10'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Row 3: Genres Collapsible Section (default collapsed) */}
        <div className="pt-2 border-t border-white/8 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Filter className={`w-3.5 h-3.5 ${palette.accentText}`} />
                <span>Gêneros:</span>
              </span>
              {selectedGenre !== 'Mostrar Todos' && (
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${palette.badgeBg} ${palette.badgeText} border ${palette.badgeBorder}`}>
                  {selectedGenre}
                </span>
              )}
            </div>

            <button
              id="toggle-genres-filter-btn"
              onClick={() => setIsGenresExpanded((prev) => !prev)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#131929] hover:bg-[#1a233a] border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <span>{isGenresExpanded ? 'Encolher' : 'Expandir'}</span>
              {isGenresExpanded ? (
                <ChevronUp className={`w-3.5 h-3.5 ${palette.accentText}`} />
              ) : (
                <ChevronDown className={`w-3.5 h-3.5 ${palette.accentText}`} />
              )}
            </button>
          </div>

          <AnimatePresence>
            {isGenresExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1 pt-1 pb-1">
                  {GENRES_LIST.map((genre) => {
                    const isSelected = selectedGenre === genre;
                    return (
                      <button
                        key={`genre-pill-${genre}`}
                        id={`filter-genre-${genre.replace(/\s+/g, '-').toLowerCase()}`}
                        onClick={() => setSelectedGenre(genre)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer select-none ${
                          isSelected
                            ? `${palette.activePillBg} ${palette.activePillText} shadow-sm font-bold`
                            : 'bg-[#121725] text-slate-400 hover:text-slate-200 hover:bg-[#1a2134] border border-white/8 font-medium'
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Row 4: Dedicated Sorting & Display Format Toolbar (Clean separation, borderless container) */}
        <div className="pt-3 border-t border-white/8 flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
          {/* Results Counter: No pulsing dot, just 'X animes' as requested */}
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-300 tracking-wide">
              {filteredAnime.length} animes
            </span>
          </div>

          {/* Controls: Ordenar Por & Modo de Exibição */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="sort-anime-select"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-200 cursor-pointer"
              >
                <ArrowUpDown className={`w-3.5 h-3.5 ${palette.accentText}`} />
                <span>Ordenar:</span>
              </label>
              <select
                id="sort-anime-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#1c2438] text-white border border-white/25 rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-md cursor-pointer hover:border-white/50 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
              >
                <option value="default" className="bg-[#1c2438] text-white">
                  Padrão
                </option>
                <option value="score" className="bg-[#1c2438] text-white">
                  Nota
                </option>
                <option value="title" className="bg-[#1c2438] text-white">
                  Título (A-Z)
                </option>
                <option value="date" className="bg-[#1c2438] text-white">
                  Data de Lançamento
                </option>
              </select>
            </div>

            {/* Display Format Switcher with Sliding Background Pill Animation */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 hidden sm:inline-flex items-center gap-1.5">
                <LayoutGrid className={`w-3.5 h-3.5 ${palette.accentText}`} />
                <span>Exibição:</span>
              </span>
              <div className="relative flex items-center gap-1 bg-[#161d2e] p-1 rounded-xl border border-white/20 shadow-inner">
                {[
                  { id: 'grid-standard', label: 'Padrão', icon: Grid3X3 },
                  { id: 'grid-compact', label: 'Compacta', icon: LayoutGrid },
                  { id: 'list-detailed', label: 'Lista', icon: List },
                ].map((mode) => {
                  const isActive = displayFormat === mode.id;
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      id={`view-format-${mode.id}-btn`}
                      onClick={() => setDisplayFormat(mode.id as DisplayFormat)}
                      className={`relative px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer select-none z-10 ${
                        isActive ? palette.activePillText : 'text-slate-300 hover:text-white'
                      }`}
                      title={mode.label}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeDisplayFormatIndicator"
                          className={`absolute inset-0 rounded-lg ${palette.activePillBg} shadow-sm z-[-1]`}
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      <Icon className="w-3.5 h-3.5 relative z-10" />
                      <span className="relative z-10">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Animation */}
      {loading ? (
        <AnimeLoadingState season={season} year={year} palette={palette} />
      ) : filteredAnime.length === 0 ? (
        /* Empty State */
        <div className="py-16 text-center rounded-2xl bg-[#0f1420]/70 backdrop-blur-xl border border-white/10 max-w-md mx-auto my-8">
          <SlidersHorizontal className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white font-display">Nenhum anime encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Não encontramos títulos correspondentes aos filtros atuais.
          </p>
          <button
            onClick={clearFilters}
            className={`mt-4 px-4 py-2 rounded-xl ${palette.activePillBg} ${palette.activePillText} text-xs font-bold hover:brightness-110 cursor-pointer transition-colors shadow-sm`}
          >
            Redefinir Filtros
          </button>
        </div>
      ) : (
        /* Anime Grid Layout with Frosted Glass Touch, Staggered Motion & Seasonal Hover Accents */
        <motion.div
          key={`catalog-grid-${year}-${season}-${selectedType}-${selectedGenre}-${searchQuery}-${sortBy}-${showOnlyFavorites}-${displayFormat}`}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.03,
                delayChildren: 0.04,
              },
            },
          }}
          initial="hidden"
          animate="visible"
          className={
            displayFormat === 'grid-standard'
              ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
              : displayFormat === 'grid-compact'
              ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4'
              : 'space-y-3.5'
          }
        >
          {filteredAnime.map((anime, index) => {
            const isFav = favorites.includes(anime.id);
            const cover =
              anime.coverImages && anime.coverImages[0]
                ? anime.coverImages[0]
                : 'https://media.kitsu.app/anime/46474/poster_image/medium-23e1293e41a0b54b6621eb589c3f0d62.jpeg';
            const posterGlow = anime.coverColor || palette.accentHex;

            if (displayFormat === 'list-detailed') {
              return (
                <ListAnimeCardItem
                  key={`list-anime-${anime.id}-${index}`}
                  anime={anime}
                  index={index}
                  palette={palette}
                  isFav={isFav}
                  onSelectAnime={onSelectAnime}
                  onToggleFavorite={onToggleFavorite}
                />
              );
            }

            // Standard / Compact Grid Card with Frosted Glass, Ambient Glow, Staggered Animation and Hover Effects
            return (
              <motion.div
                key={`anime-card-${anime.id}-${index}`}
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.96 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
                whileHover={{
                  y: -5,
                  boxShadow: `0 14px 34px -4px ${posterGlow}65, 0 0 24px -2px ${palette.accentHex}35`,
                  borderColor: `${posterGlow}90`,
                }}
                onClick={() => onSelectAnime(anime)}
                id={`anime-card-${anime.id}`}
                className={`group relative rounded-2xl overflow-hidden bg-[#0d121c] md:bg-[#0d121c]/80 md:backdrop-blur-xl cursor-pointer flex flex-col justify-between aspect-[2/3] transition-all cv-auto gpu-layer`}
                style={{
                  border: `1px solid ${posterGlow}35`,
                  boxShadow: `0 6px 20px -3px ${posterGlow}25, 0 0 14px -2px ${palette.accentHex}18`,
                }}
              >
                {/* Poster Image */}
                <div className="absolute inset-0 z-0 bg-[#070a0f]">
                  {cover ? (
                    <img
                      src={cover}
                      alt={anime.title.romaji}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                    />
                  ) : null}
                  {/* Frosted Glass vignette / gradient at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/40 to-transparent" />
                </div>

                {/* Top Action & Plaque: Score and Type on top-left in frosted glass style, Favorite on top-right */}
                <div className="relative z-10 p-2 sm:p-2.5 flex items-start justify-between gap-1">
                  {/* Score & Type Plaque Badge (Frosted Glass with seasonal tint - responsive and robust on mobile compact) */}
                  <div
                    className="flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-[9px] sm:text-[10px] md:text-[11px] font-bold backdrop-blur-md backdrop-saturate-150 select-none border whitespace-nowrap min-w-0 max-w-[76%]"
                    style={{
                      background: `linear-gradient(135deg, ${palette.accentHex}1f 0%, rgba(10, 15, 26, 0.78) 100%)`,
                      borderColor: `${palette.accentHex}40`,
                      boxShadow: `inset 0 1px 1px ${palette.accentHex}35, 0 4px 12px rgba(0,0,0,0.45)`,
                    }}
                  >
                    {anime.score ? (
                      <span className="flex items-center gap-0.5 text-amber-300 font-extrabold shrink-0">
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current text-amber-400" />
                        <span>{anime.score}</span>
                      </span>
                    ) : (
                      <span className="text-white/60 font-semibold shrink-0">—</span>
                    )}

                    <span style={{ color: `${palette.accentHex}80` }} className="text-[9px] shrink-0">•</span>

                    <span className="text-white tracking-tight font-semibold truncate">
                      {anime.typeLabel}
                    </span>
                  </div>

                  <button
                    id={`fav-btn-${anime.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(anime.id);
                    }}
                    className={`p-1 sm:p-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                      isFav
                        ? 'text-amber-400 bg-black/60 drop-shadow'
                        : 'text-white/80 hover:text-white bg-black/40 hover:bg-black/70 backdrop-blur-sm'
                    }`}
                    title={isFav ? 'Remover favorito' : 'Favoritar anime'}
                  >
                    <Star className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 ${isFav ? 'fill-current text-amber-400' : ''}`} />
                  </button>
                </div>

                {/* Bottom Title Bar with Frosted Glass Touch */}
                <div className="relative z-10 p-2.5 sm:p-3.5 pb-2.5 sm:pb-3">
                  <h3
                    className={`text-xs sm:text-sm md:text-base font-bold text-white ${palette.titleHoverText} transition-colors line-clamp-2 leading-tight drop-shadow-sm`}
                  >
                    {anime.title.romaji}
                  </h3>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
        </motion.div>
      </AnimatePresence>
      </div>
    </div>
  );
};
