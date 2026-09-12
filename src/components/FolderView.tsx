import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Folder,
  ChevronRight,
  ArrowLeft,
  Layers,
  Download,
} from 'lucide-react';
import { Season, SeasonDefinition } from '../types';
import {
  SEASONS_LIST,
  YEARS_LIST,
  getActiveSeasonsForYear,
  getActiveSeasonKeysForYear,
  CURRENT_SEASON_CONFIG,
} from '../data/animeData';
import { AnimeGuidesLogo } from './AnimeGuidesLogo';
import { useSeasonalFavicon } from '../utils/useSeasonalFavicon';
import {
  SeasonAnimeHit,
  YEAR_SEASON_POOLS,
  selectThreeRandomSeasonHits,
} from '../data/folderStamps';
import {
  SeasonAtmosphericIcon,
  SakuraIcon,
  SunHanabiIcon,
  MapleLeafMomijiIcon,
  SnowflakeIcon,
} from './SeasonIcons';
import { usePWAInstall } from '../utils/usePWAInstall';

interface FolderViewProps {
  onSelectSeason: (year: number, season: Season) => void;
  currentYear: number;
  currentSeason: Season;
}

// Realistic Transparent Adhesive Tape (Fita Transparente)
const TransparentTape: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`absolute bg-white/35 backdrop-blur-[2px] border-t border-b border-white/50 shadow-[0_1px_2px_rgba(0,0,0,0.18)] pointer-events-none rounded-[1px] ${className}`}
  />
);

/**
 * StampIframe Component:
 * The stamp maintains its physical frame (dashed stamp edge, white postal border, tape, shadow),
 * acting as an iframe-like fixed window whose inside smoothly desvanece (cross-dissolves)
 * between 3 random posters from that specific season.
 * No dots, no text overlays inside: ONLY the poster image appears in the stamp!
 */
interface StampIframeProps {
  hits: SeasonAnimeHit[];
  seasonLabel: string;
  className?: string;
  style?: React.CSSProperties;
  borderClass?: string;
  tapeMode?: 'two-corners' | 'single-corner';
  tapeClass?: string;
  intervalMs?: number;
}

const StampIframe: React.FC<StampIframeProps> = ({
  hits,
  seasonLabel,
  className = 'w-11 h-15 sm:w-12 sm:h-16',
  style,
  borderClass = 'border-slate-400/90',
  tapeMode = 'single-corner',
  tapeClass = 'w-3.5 h-1.5 -top-0.5 -left-1 -rotate-45',
  intervalMs = 4000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Automatically cycle through posters at intervals
  useEffect(() => {
    if (!hits || hits.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % hits.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [hits, intervalMs]);

  const currentHit = hits && hits[currentIndex] ? hits[currentIndex] : hits[0];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hits.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % hits.length);
    }
  };

  if (!currentHit) return null;

  return (
    <div
      style={style}
      onClick={handleNext}
      className={`group/stamp relative p-0.5 bg-white shadow-xl rounded-[2px] border-2 border-dashed ${borderClass} transition-transform duration-200 cursor-pointer select-none ${className}`}
      title={`[${seasonLabel}] ${currentHit.title} • Clique para desvanecer para a próxima imagem`}
    >
      {/* Tapes holding the stamp in place */}
      {tapeMode === 'two-corners' ? (
        <>
          <TransparentTape className="w-5 h-2 -top-1 -left-1.5 -rotate-45" />
          <TransparentTape className="w-5 h-2 -bottom-1 -right-1.5 -rotate-45" />
        </>
      ) : (
        <TransparentTape className={tapeClass} />
      )}

      {/* FIXED IFRAME VIEWPORT WINDOW: ONLY the image appears inside, with pure desvanecer transition */}
      <div className="relative w-full h-full overflow-hidden rounded-[1px] bg-slate-950">
        <AnimatePresence initial={false}>
          {currentHit.posterUrl ? (
            <motion.img
              key={currentHit.posterUrl}
              src={currentHit.posterUrl}
              alt={currentHit.title}
              referrerPolicy="no-referrer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeInOut' }}
              className="absolute inset-0 w-full h-full object-cover filter contrast-105 pointer-events-none"
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const FolderView: React.FC<FolderViewProps> = ({ onSelectSeason }) => {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [openingYear, setOpeningYear] = useState<number | null>(null);
  const [openingSeason, setOpeningSeason] = useState<Season | null>(null);

  const { isInstallable, installApp } = usePWAInstall();

  // Set browser favicon to base logo on FolderView
  useSeasonalFavicon(null);

  // Folder opening transition triggers
  const handleOpenYear = (year: number) => {
    if (openingYear !== null || openingSeason !== null) return;
    setOpeningYear(year);
    setTimeout(() => {
      setSelectedYear(year);
      setOpeningYear(null);
    }, 420);
  };

  const handleOpenSeason = (seasonKey: Season) => {
    if (openingYear !== null || openingSeason !== null || !selectedYear) return;
    setOpeningSeason(seasonKey);
    setTimeout(() => {
      onSelectSeason(selectedYear, seasonKey);
      setOpeningSeason(null);
    }, 420);
  };

  // Pick 3 random anime for each active season of each year on load
  const randomizedYearHits = useMemo(() => {
    const hitsMap: Record<number, Record<Season, SeasonAnimeHit[]>> = {};

    YEARS_LIST.forEach((year) => {
      const activeKeys = getActiveSeasonKeysForYear(year);
      const yearHitsObj: Record<Season, SeasonAnimeHit[]> = {
        WINTER: [],
        SPRING: [],
        SUMMER: [],
        FALL: [],
      };
      activeKeys.forEach((key) => {
        yearHitsObj[key] = selectThreeRandomSeasonHits(year, key);
      });
      hitsMap[year] = yearHitsObj;
    });
    return hitsMap;
  }, []);

  // Pick 3 random anime for seasons inside the selected year
  const randomizedSeasonHits = useMemo(() => {
    if (!selectedYear) return null;
    const activeKeys = getActiveSeasonKeysForYear(selectedYear);
    const hits: Partial<Record<Season, SeasonAnimeHit[]>> = {};
    activeKeys.forEach((key) => {
      hits[key] = selectThreeRandomSeasonHits(selectedYear, key);
    });
    return hits;
  }, [selectedYear]);

  // Borderless, large, atmospheric season symbol similar to the kanji
  const getSeasonAtmosphericIcon = (seasonKey: Season, className = '') => {
    return <SeasonAtmosphericIcon season={seasonKey} className={className} />;
  };

  const getSeasonKanji = (key: Season) => {
    switch (key) {
      case 'WINTER':
        return '冬';
      case 'SPRING':
        return '春';
      case 'SUMMER':
        return '夏';
      case 'FALL':
        return '秋';
    }
  };

  // Frosted Glass & Subtle Gradients per season:
  // Inverno: azul claro
  // Primavera: rosa sakura do Japão 🌸
  // Verão: amarelo solar & festival hanabi 🎆
  // Outono: marrom & folha de bordo momiji 🍁
  const getSeasonCardTheme = (key: Season) => {
    switch (key) {
      case 'WINTER':
        return {
          tabBg: 'bg-gradient-to-r from-sky-950/85 to-sky-900/70 border-sky-400/40 text-sky-300',
          bodyBg:
            'bg-gradient-to-br from-sky-950/45 via-slate-900/50 to-sky-900/35 border-sky-400/35 hover:border-sky-300/70 shadow-sky-950/40',
          gloss: 'from-sky-300/10',
          symbolColor: 'text-sky-300/35 group-hover:text-sky-300/60 drop-shadow-[0_0_12px_rgba(56,189,248,0.2)]',
          accentText: 'group-hover:text-sky-300',
          kanjiColor: 'text-sky-400/[0.13]',
          stampBorder: 'border-sky-300/70 shadow-sky-950/60',
          currentSeasonTab: {
            border: 'border-sky-400',
            bg: 'bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-400',
            shadow: 'shadow-[0_-3px_14px_rgba(56,189,248,0.55)]',
            pingBg: 'bg-sky-200',
            neonLip: 'via-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.95)]',
            clipBg: 'bg-sky-100/90',
          },
        };
      case 'SPRING':
        return {
          tabBg: 'bg-gradient-to-r from-rose-950/85 to-pink-900/70 border-pink-400/40 text-pink-300',
          bodyBg:
            'bg-gradient-to-br from-rose-950/45 via-slate-900/50 to-pink-900/35 border-pink-400/35 hover:border-pink-300/70 shadow-pink-950/40',
          gloss: 'from-pink-300/10',
          symbolColor: 'text-pink-300/35 group-hover:text-pink-300/65 drop-shadow-[0_0_12px_rgba(244,114,182,0.25)]',
          accentText: 'group-hover:text-pink-300',
          kanjiColor: 'text-pink-400/[0.13]',
          stampBorder: 'border-pink-300/70 shadow-pink-950/60',
          currentSeasonTab: {
            border: 'border-pink-400',
            bg: 'bg-gradient-to-r from-rose-600 via-pink-500 to-rose-400',
            shadow: 'shadow-[0_-3px_14px_rgba(244,114,182,0.55)]',
            pingBg: 'bg-pink-200',
            neonLip: 'via-pink-400 shadow-[0_0_14px_rgba(244,114,182,0.95)]',
            clipBg: 'bg-pink-100/90',
          },
        };
      case 'SUMMER':
        return {
          tabBg: 'bg-gradient-to-r from-yellow-950/85 to-amber-900/70 border-yellow-400/40 text-yellow-300',
          bodyBg:
            'bg-gradient-to-br from-amber-950/45 via-slate-900/50 to-yellow-950/35 border-yellow-400/35 hover:border-yellow-300/70 shadow-yellow-950/40',
          gloss: 'from-yellow-300/10',
          symbolColor: 'text-yellow-300/35 group-hover:text-yellow-300/60 drop-shadow-[0_0_12px_rgba(250,204,21,0.2)]',
          accentText: 'group-hover:text-yellow-300',
          kanjiColor: 'text-yellow-400/[0.13]',
          stampBorder: 'border-yellow-300/70 shadow-yellow-950/60',
          currentSeasonTab: {
            border: 'border-amber-400',
            bg: 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400',
            shadow: 'shadow-[0_-3px_14px_rgba(250,204,21,0.55)]',
            pingBg: 'bg-amber-200',
            neonLip: 'via-amber-400 shadow-[0_0_14px_rgba(250,204,21,0.95)]',
            clipBg: 'bg-yellow-100/90',
          },
        };
      case 'FALL':
        return {
          tabBg: 'bg-gradient-to-r from-[#2e180d]/90 to-[#3d2010]/80 border-[#b45309]/50 text-[#fcd34d]',
          bodyBg:
            'bg-gradient-to-br from-[#2a1409]/60 via-slate-900/50 to-[#3b1d0e]/45 border-[#b45309]/40 hover:border-[#d97706]/75 shadow-[#1a0c05]/60',
          gloss: 'from-[#f59e0b]/10',
          symbolColor: 'text-[#f59e0b]/40 group-hover:text-[#f59e0b]/65 drop-shadow-[0_0_12px_rgba(245,158,11,0.2)]',
          accentText: 'group-hover:text-[#fcd34d]',
          kanjiColor: 'text-[#b45309]/[0.18]',
          badge: 'bg-[#b45309]/20 text-[#fcd34d] border-[#b45309]/40',
          stampBorder: 'border-[#d97706]/70 shadow-[#1a0c05]/60',
          currentSeasonTab: {
            border: 'border-orange-500',
            bg: 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500',
            shadow: 'shadow-[0_-3px_14px_rgba(249,115,22,0.55)]',
            pingBg: 'bg-orange-200',
            neonLip: 'via-orange-500 shadow-[0_0_14px_rgba(249,115,22,0.95)]',
            clipBg: 'bg-orange-100/90',
          },
        };
    }
  };

  return (
    <div className="relative z-10 min-h-screen flex flex-col justify-between">
      <div>
        {/* Full-width Acrylic Frosted Glass Top Header (colada no topo e laterais, bordas inferiores arredondadas) */}
        <header className="sticky top-0 z-40 w-full rounded-t-none rounded-b-2xl sm:rounded-b-3xl bg-[#080b11]/35 backdrop-blur-2xl backdrop-saturate-180 border-b border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.4)] transition-all">
          <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 md:px-8 py-3">
            <div className="flex items-center gap-3">
              <AnimeGuidesLogo
                className="w-15 h-15 sm:w-16 sm:h-16 hover:scale-105 transition-transform cursor-pointer"
                glow={true}
              />
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                AnimeGuides
              </h1>
            </div>

            {/* PWA Install Button (shown when app is installable) */}
            {isInstallable && (
              <button
                id="pwa-install-header-btn"
                onClick={installApp}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Instalar AnimeGuides como aplicativo"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar App</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 mt-8">
          <AnimatePresence mode="wait">
            {selectedYear === null ? (
              /* YEAR FOLDERS VIEW */
              <motion.div
                key="years-list"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-5">
                  {YEARS_LIST.map((year) => {
                    const yearHits =
                      randomizedYearHits[year] || randomizedYearHits[CURRENT_SEASON_CONFIG.year] || {};
                    const activeKeys = getActiveSeasonKeysForYear(year);
                    const seasonLabels: Record<Season, string> = {
                      WINTER: 'Inverno',
                      SPRING: 'Primavera',
                      SUMMER: 'Verão',
                      FALL: 'Outono',
                    };

                    const isOpening = openingYear === year;

                    return (
                      <motion.div
                        key={`year-folder-${year}`}
                        whileHover={!isOpening ? { y: -6 } : {}}
                        whileTap={!isOpening ? { scale: 0.98 } : {}}
                        onClick={() => handleOpenYear(year)}
                        id={`year-folder-${year}`}
                        className="group relative cursor-pointer pt-4"
                        style={{ perspective: 1200 }}
                      >
                        {/* Folder Tab Header */}
                        <motion.div
                          animate={isOpening ? { y: -8, scale: 1.05 } : { y: 0, scale: 1 }}
                          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                          className="w-24 h-4 rounded-t-lg border-t border-l border-r transition-colors ml-4 bg-white/[0.07] backdrop-blur-xl border-white/15 group-hover:border-white/30"
                        />

                        {/* Frosted Glass Folder Body with Physical Opening Flap Animation */}
                        <motion.div
                          animate={
                            isOpening
                              ? {
                                  rotateX: -36,
                                  y: 12,
                                  filter: 'brightness(1.15)',
                                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
                                }
                              : { rotateX: 0, y: 0, filter: 'brightness(1)' }
                          }
                          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                          style={{ transformOrigin: 'bottom center', transformStyle: 'preserve-3d' }}
                          className="relative rounded-2xl rounded-tl-none bg-slate-900 md:bg-slate-900/40 md:backdrop-blur-2xl p-5 sm:p-6 border border-white/15 group-hover:border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all overflow-hidden cv-auto gpu-layer"
                        >
                          {/* Subtle gloss reflection */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none" />

                          <div className="flex items-start justify-between gap-2">
                            {/* Left side: Folder Icon & Year Text */}
                            <div className="flex flex-col justify-between">
                              <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/15 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                                <Folder className="w-5 h-5" />
                              </div>

                              <div className="mt-5">
                                <h3 className="text-3xl font-black text-white font-display tracking-tight group-hover:text-cyan-300 transition-colors">
                                  {year}
                                </h3>
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                                  <Layers className="w-3 h-3 text-slate-400" />
                                  {activeKeys.length === 1
                                    ? `1 Temporada (${seasonLabels[activeKeys[0]]})`
                                    : `${activeKeys.length} Temporadas`}
                                </p>
                              </div>
                            </div>

                            {/* Right side: stamps inside the folder that lift out when opened */}
                            <motion.div
                              animate={isOpening ? { y: -22, scale: 1.08 } : { y: 0, scale: 1 }}
                              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                              className={
                                activeKeys.length === 1
                                  ? 'flex items-center justify-center p-2 rounded-xl self-start shadow-inner min-w-[76px] min-h-[96px] sm:min-w-[84px] sm:min-h-[108px]'
                                  : 'grid grid-cols-2 gap-2 p-1.5 rounded-xl self-start shadow-inner'
                              }
                            >
                              {activeKeys.map((sKey, i) => {
                                const hits = yearHits[sKey] || [];
                                // Individual organic rotations simulating hand-pasted stamps
                                const rotations = [-5, 4, 3, -4];
                                const tapePositions = [
                                  'w-3.5 h-1.5 -top-0.5 -left-1 -rotate-45',
                                  'w-3.5 h-1.5 -top-0.5 -right-1 rotate-45',
                                  'w-3.5 h-1.5 -bottom-0.5 -left-1 rotate-45',
                                  'w-3.5 h-1.5 -bottom-0.5 -right-1 -rotate-45',
                                ];

                                if (activeKeys.length === 1) {
                                  return (
                                    <StampIframe
                                      key={`${year}-${sKey}`}
                                      hits={hits}
                                      seasonLabel={`${seasonLabels[sKey]} ${year}`}
                                      className="w-14 h-19 sm:w-16 sm:h-22 shadow-md"
                                      style={{
                                        transform: 'rotate(-2deg)',
                                      }}
                                      tapeMode="two-corners"
                                      intervalMs={3500}
                                    />
                                  );
                                }

                                return (
                                  <StampIframe
                                    key={`${year}-${sKey}`}
                                    hits={hits}
                                    seasonLabel={`${seasonLabels[sKey]} ${year}`}
                                    className={`w-10 h-13 sm:w-11 sm:h-15 ${
                                      activeKeys.length === 3 && i === 2 ? 'col-span-2 justify-self-center' : ''
                                    }`}
                                    style={{
                                      transform: `rotate(${rotations[i % rotations.length]}deg)`,
                                    }}
                                    tapeMode="single-corner"
                                    tapeClass={tapePositions[i % tapePositions.length]}
                                    intervalMs={3500 + i * 500}
                                  />
                                );
                              })}
                            </motion.div>
                          </div>

                          {/* Bottom Action Bar */}
                          <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs text-slate-300 group-hover:text-cyan-300 font-semibold">
                            <span>Ver temporadas</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              /* SEASON FOLDERS INSIDE SELECTED YEAR VIEW */
              <motion.div
                key={`seasons-for-${selectedYear}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Back button: ONLY arrow with NO border */}
                <div className="flex items-center gap-3">
                  <button
                    id="back-to-years-btn"
                    onClick={() => setSelectedYear(null)}
                    className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Voltar"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 font-display">
                    Temporadas de <span className="text-cyan-400">{selectedYear}</span>
                  </h2>
                </div>

                {/* Active Seasons Folders in Chronological Order with Frosted Glass, Subtle Gradient & Stamp Iframe */}
                {(() => {
                  const activeSeasons = getActiveSeasonsForYear(selectedYear);
                  return (
                    <div
                      className={`grid gap-5 pt-3 ${
                        activeSeasons.length === 1
                          ? 'grid-cols-1 sm:grid-cols-2 max-w-xl'
                          : activeSeasons.length === 2
                          ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl'
                          : activeSeasons.length === 3
                          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl'
                          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                      }`}
                    >
                      {activeSeasons.map((seasonDef: SeasonDefinition) => {
                    const isActualCurrentSeason =
                      selectedYear === CURRENT_SEASON_CONFIG.year &&
                      seasonDef.key === CURRENT_SEASON_CONFIG.season;

                    const kanji = getSeasonKanji(seasonDef.key);
                    const theme = getSeasonCardTheme(seasonDef.key);
                    const hits =
                      randomizedSeasonHits?.[seasonDef.key] ||
                      selectThreeRandomSeasonHits(selectedYear, seasonDef.key);

                    const isOpeningSeason = openingSeason === seasonDef.key;

                    return (
                      <motion.div
                        key={`season-folder-${seasonDef.key}`}
                        whileHover={!isOpeningSeason ? { y: -5 } : {}}
                        whileTap={!isOpeningSeason ? { scale: 0.98 } : {}}
                        onClick={() => handleOpenSeason(seasonDef.key)}
                        id={`season-folder-${seasonDef.key.toLowerCase()}`}
                        className="group relative cursor-pointer"
                        style={{ perspective: 1200 }}
                      >
                        {/* Physical Folder Tab Header: Creative Signal Built into the Folder Drawing */}
                        {isActualCurrentSeason ? (
                          <div className="flex items-center ml-5">
                            <motion.div
                              animate={isOpeningSeason ? { y: -8, scale: 1.05 } : { y: 0, scale: 1 }}
                              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                              className={`relative px-3.5 py-1 rounded-t-xl border-t-2 border-l-2 border-r-2 ${theme.currentSeasonTab.border} ${theme.currentSeasonTab.bg} text-slate-950 font-black text-[10px] tracking-wider uppercase flex items-center gap-2 ${theme.currentSeasonTab.shadow} backdrop-blur-xl transition-all`}
                            >
                              {/* Pulsing Season Atmospheric Icon with ping radar effect */}
                              <span className="relative flex items-center justify-center w-3.5 h-3.5 shrink-0">
                                <span className="animate-ping absolute inline-flex opacity-85">
                                  {getSeasonAtmosphericIcon(seasonDef.key, 'w-3.5 h-3.5 text-slate-100')}
                                </span>
                                <span className="relative inline-flex">
                                  {getSeasonAtmosphericIcon(seasonDef.key, 'w-3.5 h-3.5 text-slate-100')}
                                </span>
                              </span>
                              <span>Temporada Atual</span>

                              {/* Realistic indexing clip on the folder tab */}
                              <div
                                className={`absolute -top-1 right-2 w-3 h-2 ${theme.currentSeasonTab.clipBg} rounded-xs border border-black/20 shadow-xs`}
                              />
                            </motion.div>
                          </div>
                        ) : (
                          <motion.div
                            animate={isOpeningSeason ? { y: -8, scale: 1.05 } : { y: 0, scale: 1 }}
                            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                            className={`w-24 h-4 rounded-t-xl border-t border-l border-r ml-5 transition-colors md:backdrop-blur-xl ${theme.tabBg}`}
                          />
                        )}

                        {/* Folder Body Container with Physical Opening Flap Animation */}
                        <motion.div
                          animate={
                            isOpeningSeason
                              ? {
                                  rotateX: -36,
                                  y: 12,
                                  filter: 'brightness(1.15)',
                                  boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.85)',
                                }
                              : { rotateX: 0, y: 0, filter: 'brightness(1)' }
                          }
                          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                          style={{ transformOrigin: 'bottom center', transformStyle: 'preserve-3d' }}
                          className={`relative rounded-2xl rounded-tl-none p-6 border shadow-2xl md:backdrop-blur-2xl transition-all overflow-hidden cv-auto gpu-layer ${theme.bodyBg}`}
                        >
                          {/* Creative Active Neon Lip on the Folder for the Current Season with matching seasonal color */}
                          {isActualCurrentSeason && (
                            <div
                              className={`absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent ${theme.currentSeasonTab.neonLip} to-transparent pointer-events-none`}
                            />
                          )}

                          {/* Subtle gloss reflection tailored to the season color */}
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${theme.gloss} via-transparent to-transparent pointer-events-none`}
                          />

                          {/* Large Kanji aligned nicely in the bottom right corner without being clipped */}
                          <div
                            className={`absolute right-3 bottom-2 text-9xl sm:text-[10rem] font-black leading-none select-none font-display pointer-events-none transition-transform group-hover:scale-105 ${theme.kanjiColor}`}
                          >
                            {kanji}
                          </div>

                          {/* Emerging content layer that slides up when folder opens */}
                          <motion.div
                            animate={isOpeningSeason ? { y: -24, scale: 1.06 } : { y: 0, scale: 1 }}
                            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                            className="relative z-10"
                          >
                            {/* Top row: Borderless Large Atmospheric Season Symbol & Stamp Iframe */}
                            <div className="flex items-start justify-between">
                              {/* Season Symbol: No border, larger, semi-transparent resembling the kanji style */}
                              <div
                                className={`transition-transform duration-300 group-hover:scale-110 pointer-events-none ${theme.symbolColor}`}
                              >
                                {getSeasonAtmosphericIcon(
                                  seasonDef.key,
                                  'w-12 h-12 sm:w-14 sm:h-14'
                                )}
                              </div>

                              {/* POSTAGE STAMP IFRAME: ONLY the poster image appears, with desvanecer transition between 3 seasonal anime */}
                              <div className="relative -mr-1 -mt-1">
                                <StampIframe
                                  hits={hits}
                                  seasonLabel={`${seasonDef.labelPt} ${selectedYear}`}
                                  className="w-13 h-18 sm:w-15 sm:h-21 rotate-[3deg] group-hover:rotate-0 group-hover:scale-105 transition-transform"
                                  borderClass={theme.stampBorder}
                                  tapeMode="two-corners"
                                  intervalMs={4000}
                                />
                              </div>
                            </div>

                            {/* Season Title */}
                            <div className="mt-8">
                              <h3
                                className={`text-2xl font-black text-white font-display tracking-tight mt-0.5 transition-colors ${theme.accentText}`}
                              >
                                {seasonDef.labelPt}
                              </h3>
                            </div>

                            {/* Arrow '>' symbol placed at the BOTTOM-LEFT */}
                            <div className="mt-6 pt-3.5 border-t border-white/10 flex items-center justify-start">
                              <span className="w-7 h-7 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:bg-white/20 text-white transition-colors">
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                              </span>
                            </div>
                          </motion.div>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Minimal Footer with ONLY the Watermark of the site name */}
      <footer className="mt-16 py-8 text-center select-none pointer-events-none">
        <span className="text-xl sm:text-2xl font-black tracking-widest text-white/10 font-display uppercase">
          AnimeGuides
        </span>
      </footer>
    </div>
  );
};
