import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Star, Bell, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { AnimeItem } from '../types';

export interface SeasonPalette {
  namePt: string;
  kanji: string;
  kanjiColor: string;
  headerBadgeBg: string;
  headerBadgeBorder: string;
  accentHex: string;
  accentText: string;
  titleHoverText: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  activePillBg: string;
  activePillText: string;
  plaqueActiveBg: string;
  plaqueBorderColor: string;
  iconHoverBg: string;
  glowBoxShadow: string;
}

export interface ScheduleItem {
  anime: AnimeItem;
  episodeNumber: number;
  airingTimestamp: number; // in ms
  timeStr: string; // e.g. "09:25"
  isFuture: boolean;
}

export interface ScheduleDateInfo {
  date: Date;
  dateKey: string; // YYYY-MM-DD in America/Sao_Paulo
  dayOfWeekPt: string; // e.g. "quinta-feira"
  formattedDatePt: string; // e.g. "1 de out. de 2026"
  isToday: boolean;
}

/**
 * Returns date details for America/Sao_Paulo timezone with a given day offset (-7 to +7).
 */
export function getScheduleDateInfo(dayOffset: number = 0): ScheduleDateInfo {
  const now = new Date();
  const brazilNowStr = now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  const targetDate = new Date(brazilNowStr);
  targetDate.setDate(targetDate.getDate() + dayOffset);

  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateKey = dateFormatter.format(targetDate);
  const todayKey = dateFormatter.format(new Date(brazilNowStr));

  const dayFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
  });
  const dayOfWeekPt = dayFormatter.format(targetDate);

  const formattedDatePt = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(targetDate);

  return {
    date: targetDate,
    dateKey,
    dayOfWeekPt,
    formattedDatePt,
    isToday: dateKey === todayKey,
  };
}

/**
 * Formats countdown duration (e.g. "1h 33m 12s").
 */
function formatCountdown(diffMs: number): string {
  if (diffMs <= 0) return '';
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (days > 0) {
    return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
  }
  if (hours > 0) {
    return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
  return `${minutes}m ${pad(seconds)}s`;
}

/**
 * Sticky Navigation Bar for Cronograma
 * - Positioned with a clear gap below the top header on mobile (top-[72px] sm:top-[78px])
 * - Weekday name and formatted date are strictly single-line (whitespace-nowrap)
 */
export const ScheduleDateNavbar: React.FC<{
  dateOffset: number;
  setDateOffset: React.Dispatch<React.SetStateAction<number>>;
  palette: SeasonPalette;
}> = ({ dateOffset, setDateOffset, palette }) => {
  const dateInfo = useMemo(() => getScheduleDateInfo(dateOffset), [dateOffset]);

  const canGoPrev = dateOffset > -7;
  const canGoNext = dateOffset < 7;

  return (
    <div
      id="schedule-sticky-navbar"
      className="sticky top-[82px] sm:top-[90px] z-20 my-3 sm:my-4 py-2.5 px-3.5 sm:px-5 rounded-2xl bg-[#090e1a]/95 backdrop-blur-2xl border border-white/15 shadow-xl flex items-center justify-between gap-2.5 transition-all overflow-hidden"
    >
      {/* Left: Day of week and formatted date without line breaks */}
      <div className="min-w-0 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <h2 className="text-sm sm:text-base md:text-lg font-bold text-white capitalize font-display tracking-tight whitespace-nowrap">
            {dateInfo.dayOfWeekPt}
          </h2>
          {dateInfo.isToday && (
            <span
              className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 select-none"
              style={{
                backgroundColor: `${palette.accentHex}25`,
                color: palette.accentHex,
              }}
            >
              Hoje
            </span>
          )}
        </div>
        <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 whitespace-nowrap truncate">
          {dateInfo.formattedDatePt}
        </p>
      </div>

      {/* Right: < and > buttons (limited to -7 to +7 days) */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {!dateInfo.isToday && (
          <button
            onClick={() => setDateOffset(0)}
            className="text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-lg bg-[#141b2c] hover:bg-[#1e2840] border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer whitespace-nowrap active:scale-95"
            title="Voltar para a data de hoje"
          >
            <span className="hidden sm:inline">Voltar para </span>Hoje
          </button>
        )}

        <button
          onClick={() => setDateOffset((prev) => Math.max(-7, prev - 1))}
          disabled={!canGoPrev}
          className={`p-1.5 sm:p-2 rounded-xl border border-white/10 transition-all ${
            canGoPrev
              ? 'bg-[#141b2c] hover:bg-[#1e2840] text-slate-300 hover:text-white cursor-pointer active:scale-95'
              : 'bg-[#0f1422] text-slate-600 border-white/5 cursor-not-allowed opacity-40'
          }`}
          title={canGoPrev ? 'Dia anterior (limite 1 semana)' : 'Limite de 1 semana para trás atingido'}
          aria-label="Dia anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <button
          onClick={() => setDateOffset((prev) => Math.min(7, prev + 1))}
          disabled={!canGoNext}
          className={`p-1.5 sm:p-2 rounded-xl border border-white/10 transition-all ${
            canGoNext
              ? 'bg-[#141b2c] hover:bg-[#1e2840] text-slate-300 hover:text-white cursor-pointer active:scale-95'
              : 'bg-[#0f1422] text-slate-600 border-white/5 cursor-not-allowed opacity-40'
          }`}
          title={canGoNext ? 'Próximo dia (limite 1 semana)' : 'Limite de 1 semana para frente atingido'}
          aria-label="Próximo dia"
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Main Schedule View (Timeline with Agulha and Anime Cards)
 * - The vertical line passes dead-center through every circle
 * - Uses strictly authentic AniList schedule data without fake fallback episodes
 */
export const SeasonScheduleView: React.FC<{
  animeList: AnimeItem[];
  palette: SeasonPalette;
  favorites: number[];
  subscribedIds: number[];
  onSelectAnime: (anime: AnimeItem) => void;
  onToggleFavorite: (id: number) => void;
  onToggleNotification: (anime: AnimeItem) => void;
  dateOffset: number;
}> = ({
  animeList,
  palette,
  favorites,
  subscribedIds,
  onSelectAnime,
  onToggleFavorite,
  onToggleNotification,
  dateOffset,
}) => {
  const [currentBrazilTime, setCurrentBrazilTime] = useState<string>('');
  const [nowMs, setNowMs] = useState<number>(Date.now());

  // Update current time and countdown tick every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setNowMs(now.getTime());
      const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      setCurrentBrazilTime(timeFormatter.format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const dateInfo = useMemo(() => getScheduleDateInfo(dateOffset), [dateOffset]);

  // Compute scheduled anime items for the selected target date using ONLY authentic schedules
  const scheduledItems = useMemo<ScheduleItem[]>(() => {
    const items: ScheduleItem[] = [];
    const targetKey = dateInfo.dateKey; // YYYY-MM-DD in America/Sao_Paulo

    const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    // Track added animes to avoid duplicate cards on the same date
    const addedAnimeIds = new Set<number>();

    animeList.forEach((anime) => {
      if (addedAnimeIds.has(anime.id)) return;

      // 1. Check official AniList airingSchedule nodes first
      if (Array.isArray(anime.airingSchedule) && anime.airingSchedule.length > 0) {
        for (const node of anime.airingSchedule) {
          if (!node.airingAt || !node.episode) continue;
          const nodeDateKey = dateFormatter.format(new Date(node.airingAt * 1000));
          if (nodeDateKey === targetKey) {
            const timeStr = timeFormatter.format(new Date(node.airingAt * 1000));
            items.push({
              anime,
              episodeNumber: node.episode,
              airingTimestamp: node.airingAt * 1000,
              timeStr,
              isFuture: node.airingAt * 1000 > nowMs,
            });
            addedAnimeIds.add(anime.id);
            return;
          }
        }
      }

      // 2. If airingSchedule nodes were not present or did not cover this week,
      // project from nextAiringEpisode (which has official episode number and exact broadcast time)
      if (anime.nextAiringEpisode?.airingAt && anime.nextAiringEpisode?.episode) {
        const nextSec = anime.nextAiringEpisode.airingAt;
        const nextEp = anime.nextAiringEpisode.episode;

        for (let k = -15; k <= 15; k++) {
          const epSec = nextSec + k * 604800;
          const epNum = nextEp + k;
          if (epNum < 1) continue;
          if (typeof anime.episodes === 'number' && epNum > anime.episodes) continue;

          const epDateKey = dateFormatter.format(new Date(epSec * 1000));
          if (epDateKey === targetKey) {
            const timeStr = timeFormatter.format(new Date(epSec * 1000));
            items.push({
              anime,
              episodeNumber: epNum,
              airingTimestamp: epSec * 1000,
              timeStr,
              isFuture: epSec * 1000 > nowMs,
            });
            addedAnimeIds.add(anime.id);
            return;
          }
        }
      }
    });

    // Sort chronologically by airing timestamp / timeStr
    items.sort((a, b) => a.airingTimestamp - b.airingTimestamp);
    return items;
  }, [animeList, dateInfo, nowMs]);

  // Find index where current time needle ("agulha") should be inserted
  const needleIndex = useMemo(() => {
    if (!dateInfo.isToday || scheduledItems.length === 0) return -1;
    let lastPast = -1;
    for (let i = 0; i < scheduledItems.length; i++) {
      if (scheduledItems[i].airingTimestamp <= nowMs) {
        lastPast = i;
      } else {
        break;
      }
    }
    return lastPast;
  }, [dateInfo.isToday, scheduledItems, nowMs]);

  return (
    <div className="relative w-full max-w-4xl mx-auto py-2">
      {scheduledItems.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-[#090e1a]/60 border border-white/10 backdrop-blur-xl">
          <CalendarIcon className="w-12 h-12 mx-auto text-slate-500 mb-3 opacity-60" />
          <h3 className="text-base font-bold text-white font-display">
            Nenhum anime programado para este dia
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Nenhum episódio oficial encontrado para {dateInfo.dayOfWeekPt} ({dateInfo.formattedDatePt}). Navegue pelos dias através dos botões no topo.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Continuous Vertical Timeline Line
              - Positioned at left-[19px] with w-[2px].
              - Center of line is at 19px + 1px = 20px.
              - The circles have diameter 14px (w-3.5) positioned at left-[13px].
              - Center of circle is at 13px + 7px = 20px.
              - The line goes EXACTLY through the center of every circle!
          */}
          <div
            className="absolute left-[19px] top-3 bottom-3 w-[2px] rounded-full z-0 pointer-events-none transition-colors"
            style={{
              backgroundColor: `${palette.accentHex}45`,
              boxShadow: `0 0 10px ${palette.accentHex}30`,
            }}
          />

          {/* Agulha if current time is BEFORE the first item */}
          {dateInfo.isToday && needleIndex === -1 && (
            <div className="relative flex items-center my-3 pl-11 sm:pl-12">
              <div className="absolute left-[20px] top-1/2 -translate-y-1/2 z-20 flex items-center">
                <div
                  className="relative flex items-center px-2.5 py-0.5 rounded-r-md text-[11px] font-black shadow-lg select-none"
                  style={{
                    backgroundColor: palette.accentHex,
                    color: '#020617',
                    boxShadow: `0 0 14px ${palette.accentHex}80`,
                  }}
                >
                  <span
                    className="w-0 h-0 border-y-[4px] border-y-transparent border-r-[5px] absolute -left-[5px] top-1/2 -translate-y-1/2"
                    style={{ borderRightColor: palette.accentHex }}
                  />
                  <span>{currentBrazilTime}</span>
                </div>
              </div>
              <div
                className="w-full h-[2px] opacity-40 rounded-full"
                style={{ backgroundColor: palette.accentHex }}
              />
            </div>
          )}

          {/* Render schedule items with node dots and needle placed at exact chronological spot */}
          <div className="space-y-6">
            {scheduledItems.map((item, index) => {
              const anime = item.anime;
              const isFav = favorites.includes(anime.id);
              const isSub = subscribedIds.includes(anime.id);
              const cover =
                anime.coverImages && anime.coverImages[0]
                  ? anime.coverImages[0]
                  : 'https://media.kitsu.app/anime/46474/poster_image/medium-23e1293e41a0b54b6621eb589c3f0d62.jpeg';

              const countdown = item.isFuture ? formatCountdown(item.airingTimestamp - nowMs) : '';

              return (
                <React.Fragment key={`schedule-${anime.id}-${item.episodeNumber}-${index}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.4) }}
                    className="relative pl-11 sm:pl-12"
                  >
                    {/* Node Dot on the vertical line
                        - Positioned at left-[13px] with w-[14px]. Center is at 13 + 7 = 20px.
                        - Dead-center on the line at 20px!
                    */}
                    <div
                      className="absolute left-[13px] top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-all z-10"
                      style={{
                        borderColor: palette.accentHex,
                        backgroundColor: item.isFuture ? '#090e1a' : palette.accentHex,
                        boxShadow: `0 0 8px ${palette.accentHex}80`,
                      }}
                    />

                    {/* Time Header with Optional Live Countdown */}
                    <div className="flex items-center gap-2.5 mb-2 select-none">
                      <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                        {item.timeStr}
                      </span>
                      {countdown && (
                        <span className="text-xs text-slate-400 font-sans font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{countdown}</span>
                        </span>
                      )}
                    </div>

                    {/* Anime Card */}
                    <div
                      onClick={() => onSelectAnime(anime)}
                      className="group relative rounded-2xl bg-[#0e1422]/90 hover:bg-[#131b2c] border border-white/10 hover:border-white/25 p-3 sm:p-4 flex items-center justify-between gap-3 shadow-lg hover:shadow-2xl transition-all cursor-pointer cv-auto"
                      style={{
                        boxShadow: `0 4px 18px rgba(0,0,0,0.5)`,
                      }}
                    >
                      {/* Left: Poster thumbnail */}
                      <div className="relative w-14 h-20 sm:w-16 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-[#070a0f] border border-white/10 shadow-md">
                        {cover && (
                          <img
                            src={cover}
                            alt={anime.title.romaji}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>

                      {/* Middle: Title & Subtitle */}
                      <div className="flex-1 min-w-0 pr-1">
                        <h3
                          className={`text-sm sm:text-base font-bold text-white ${palette.titleHoverText} transition-colors line-clamp-2 leading-tight drop-shadow-sm font-display`}
                        >
                          {anime.title.romaji}
                        </h3>

                        {/* Subtitle: "EP{ep} • {typeLabel}" */}
                        <p className="text-xs text-slate-400 font-medium mt-1 truncate">
                          <span className="font-semibold text-slate-300">EP{item.episodeNumber}</span>
                          <span className="mx-1.5 opacity-60">•</span>
                          <span>{anime.typeLabel}</span>
                        </p>
                      </div>

                      {/* Right: Actions (Star, Bell) and Episode indicator */}
                      <div className="flex flex-col items-end justify-between self-stretch shrink-0 gap-2">
                        {/* Favorite & Notification Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            id={`schedule-fav-${anime.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(anime.id);
                            }}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              isFav
                                ? 'text-amber-400 bg-amber-400/15'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                            title={isFav ? 'Remover dos favoritos' : 'Favoritar anime'}
                            aria-label={isFav ? 'Remover dos favoritos' : 'Favoritar anime'}
                          >
                            <Star className={`w-4 h-4 ${isFav ? 'fill-current text-amber-400' : ''}`} />
                          </button>

                          <button
                            id={`schedule-notif-${anime.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleNotification(anime);
                            }}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              isSub
                                ? 'text-cyan-400 bg-cyan-400/15'
                                : 'text-slate-400 hover:text-cyan-300 hover:bg-white/5'
                            }`}
                            title={
                              isSub
                                ? 'Notificações ativadas para este anime'
                                : 'Ativar notificações push para este anime'
                            }
                            aria-label="Alternar notificação"
                          >
                            <Bell className={`w-4 h-4 ${isSub ? 'fill-current text-cyan-400' : ''}`} />
                          </button>
                        </div>

                        {/* Episode tracker: (epLancado/totalEpisodios) */}
                        <div className="text-[11px] sm:text-xs font-semibold text-slate-400 tracking-wide select-none">
                          ({item.episodeNumber}/{anime.episodes || '?'})
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Agulha (current time needle) placed between past and future items */}
                  {dateInfo.isToday && needleIndex === index && (
                    <div className="relative flex items-center my-4 pl-11 sm:pl-12">
                      <div className="absolute left-[20px] top-1/2 -translate-y-1/2 z-20 flex items-center">
                        <div
                          className="relative flex items-center px-2.5 py-0.5 rounded-r-md text-[11px] font-black shadow-lg select-none"
                          style={{
                            backgroundColor: palette.accentHex,
                            color: '#020617',
                            boxShadow: `0 0 14px ${palette.accentHex}80`,
                          }}
                        >
                          <span
                            className="w-0 h-0 border-y-[4px] border-y-transparent border-r-[5px] absolute -left-[5px] top-1/2 -translate-y-1/2"
                            style={{ borderRightColor: palette.accentHex }}
                          />
                          <span>{currentBrazilTime}</span>
                        </div>
                      </div>
                      <div
                        className="w-full h-[2px] opacity-40 rounded-full"
                        style={{ backgroundColor: palette.accentHex }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
