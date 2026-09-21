import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Star,
  Play,
  Film,
  Music,
  AlertTriangle,
  EyeOff,
  ShieldAlert,
  Loader2,
  ChevronDown,
  ChevronUp,
  Bell,
  Sparkles,
} from 'lucide-react';
import { AnimeItem, AnimeVideo, Season, ExternalLink } from '../types';
import { SEASON_PALETTES } from './SeasonPage';
import {
  translateSynopsisToPt,
  fetchAniListHighResPoster,
  fetchDirectorAndWorksFromAniList,
  fetchStudioAndWorksFromAniList,
  getStudioWorks,
  getStudioAniDbUrl,
  buildAniDbCreatorUrl,
  getStudioLogoUrl,
  fetchStudioLogoFromAnimeThemes,
  DirectorInfo,
  StudioInfo,
} from '../services/animeDetailEnricher';
import { fetchAnimeThemesVideos } from '../services/animeThemesApi';
import { CustomVideoPlayer } from './CustomVideoPlayer';
import { getPlatformInfo } from '../utils/platformLogos';
import { usePWAInstall } from '../utils/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';
import {
  isAnimeSubscribed,
  toggleAnimeNotification,
  isPWAInstalled,
} from '../services/notificationService';

const DEFAULT_POSTER_FALLBACK =
  'https://media.kitsu.app/anime/46474/poster_image/large-23e1293e41a0b54b6621eb589c3f0d62.jpeg';

/**
 * Formats anime status in Portuguese according to user specifications:
 * - "Em lançamento (episódios atuais/ total de episódios)" using nextAiringEpisode - 1
 * - "Completo" if finished
 * - "Em breve" if not yet released
 */
function getAnimeStatusText(anime: AnimeItem): string {
  const status = (anime.status || '').toUpperCase();
  const totalEpisodes = anime.episodes || '???';

  if (status === 'RELEASING') {
    let currentEpisode: number | string = '?';
    if (anime.nextAiringEpisode?.episode && anime.nextAiringEpisode.episode > 1) {
      currentEpisode = anime.nextAiringEpisode.episode - 1;
    } else if (typeof totalEpisodes === 'number') {
      currentEpisode = 1;
    }
    return `Em lançamento (${currentEpisode}/${totalEpisodes})`;
  }

  if (status === 'FINISHED') {
    return 'Completo';
  }

  if (status === 'NOT_YET_RELEASED') {
    return 'Em breve';
  }

  if (status === 'CANCELLED') {
    return 'Cancelado';
  }

  if (status === 'HIATUS') {
    return 'Em hiato';
  }

  return 'Em breve';
}

interface AnimeDetailModalProps {
  anime: AnimeItem | null;
  season?: Season;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (animeId: number) => void;
}

export const AnimeDetailModal: React.FC<AnimeDetailModalProps> = ({
  anime,
  season = 'WINTER',
  onClose,
  isFavorite,
  onToggleFavorite,
}) => {
  const [playingVideo, setPlayingVideo] = useState<AnimeVideo | null>(null);
  const [allVideos, setAllVideos] = useState<AnimeVideo[]>([]);
  const [loadingThemes, setLoadingThemes] = useState<boolean>(true);
  const [isModalLoading, setIsModalLoading] = useState<boolean>(true);
  const [synopsis, setSynopsis] = useState<string>('');
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState<boolean>(false);
  const [posterUrl, setPosterUrl] = useState<string>(
    anime?.coverImages && anime.coverImages[0] ? anime.coverImages[0] : DEFAULT_POSTER_FALLBACK
  );
  const [posterGlowColor, setPosterGlowColor] = useState<string>(anime?.coverColor || '#00e5ff');
  const [directorsList, setDirectorsList] = useState<DirectorInfo[]>([]);
  const [combinedWorks, setCombinedWorks] = useState<string>('carregando...');
  const [studioInfo, setStudioInfo] = useState<StudioInfo | null>(null);
  const [studioWorks, setStudioWorks] = useState<string>('carregando...');
  const [studioLogoUrl, setStudioLogoUrl] = useState<string | null>(null);
  const [studioLogoFailed, setStudioLogoFailed] = useState<boolean>(false);
  const [activeLinks, setActiveLinks] = useState<ExternalLink[]>(anime?.externalLinks || []);
  const [coverTilt, setCoverTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, isHovered: false });
  const { isInstalled, isIOS } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(anime ? isAnimeSubscribed(anime.id) : false);
  const [isTogglingNotify, setIsTogglingNotify] = useState<boolean>(false);

  useEffect(() => {
    if (anime) {
      setIsSubscribed(isAnimeSubscribed(anime.id));
    }
  }, [anime]);
 
  useEffect(() => {
    const handleSubUpdate = (e: Event) => {
      const ce = e as CustomEvent<{ animeId: number; subscribed: boolean }>;
      if (anime && ce.detail && ce.detail.animeId === anime.id) {
        setIsSubscribed(ce.detail.subscribed);
      }
    };
    window.addEventListener('animeguides:subscription-updated', handleSubUpdate);
    return () => {
      window.removeEventListener('animeguides:subscription-updated', handleSubUpdate);
    };
  }, [anime]);
 
  const isPWA = isInstalled || isPWAInstalled();

  const handleToggleNotification = async () => {
    if (!anime || isTogglingNotify) return;
    if (!isPWA) {
      setShowInstallGuide(true);
      return;
    }
    setIsTogglingNotify(true);
    try {
      const res = await toggleAnimeNotification(anime);
      setIsSubscribed(res.subscribed);
    } finally {
      setIsTogglingNotify(false);
    }
  };
 
  const animeStatus = (anime?.status || '').toUpperCase();
  const isReleasingOrUpcoming = animeStatus === 'RELEASING' || animeStatus === 'NOT_YET_RELEASED';
  const shouldShowNotifyButton = isReleasingOrUpcoming;

  const handleCoverMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Subtle maximum rotation angle in degrees
    const maxRotate = 12;
    const rotateX = -((y - centerY) / centerY) * maxRotate;
    const rotateY = ((x - centerX) / centerX) * maxRotate;
    
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setCoverTilt({ rotateX, rotateY, glareX, glareY, isHovered: true });
  };

  const handleCoverMouseLeave = () => {
    setCoverTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, isHovered: false });
  };

  const palette = SEASON_PALETTES[season] || SEASON_PALETTES.WINTER;

  // Handle data enrichment whenever the opened anime changes
  useEffect(() => {
    if (!anime) return;

    let isCurrent = true;

    setIsModalLoading(true);
    setPlayingVideo(null);
    setIsSynopsisExpanded(false);
    setCoverTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, isHovered: false });

    // Initial poster from anime item
    const initialCover =
      anime.coverImages && anime.coverImages[0]
        ? anime.coverImages[0]
        : DEFAULT_POSTER_FALLBACK;
    setPosterUrl(initialCover);
    setPosterGlowColor(anime.coverColor || palette.accentHex);
    setCombinedWorks('carregando...');
    setStudioWorks('carregando...');
    setStudioInfo(null);
    setStudioLogoFailed(false);

    // 1. Initial video list: First is always AniList Official Trailer
    const initialVideos: AnimeVideo[] = [];
    if (anime.videos && anime.videos.length > 0) {
      initialVideos.push(...anime.videos);
    }
    setAllVideos(initialVideos);

    // 2. Fetch Openings and Endings strictly by AniList ID (No random fallback)
    setLoadingThemes(true);
    const themesPromise = fetchAnimeThemesVideos(anime.anilistId, initialCover)
      .then((themes) => {
        if (!isCurrent) return;
        if (themes.length > 0) {
          // Combine: AniList official trailer first, then AnimeThemes Openings & Endings
          const combined = [...initialVideos];
          for (const th of themes) {
            if (!combined.some((v) => v.id === th.id || (v.videoUrl && v.videoUrl === th.videoUrl))) {
              combined.push(th);
            }
          }
          setAllVideos(combined);
        }
      })
      .catch((err) => console.warn('Failed to load anime themes:', err))
      .finally(() => {
        if (isCurrent) {
          setLoadingThemes(false);
        }
      });

    // If anime already has initial director name, prepare placeholder list with AniDB Japanese name ordering
    if (anime.director && anime.director !== 'Equipe Principal') {
      const initNames = anime.director.split(/[,/|]/).map((n) => n.trim()).filter((n) => Boolean(n) && n !== 'Equipe Principal');
      setDirectorsList(
        initNames.map((n) => ({
          name: n,
          anidbUrl: buildAniDbCreatorUrl(n, false),
          works: 'carregando...',
        }))
      );
    } else {
      setDirectorsList([]);
    }

    // Initialize external links
    setActiveLinks(anime.externalLinks || []);
    fetch(
      `/api/anime-external-links?malId=${anime.malId || ''}&anilistId=${anime.anilistId || ''}&title=${encodeURIComponent(
        anime.title.romaji
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!isCurrent) return;
        if (data?.links && Array.isArray(data.links) && data.links.length > 0) {
          setActiveLinks((prev) => {
            const map = new Map<string, ExternalLink>();
            for (const l of prev) {
              if (l.url && !l.url.includes('search') && !l.url.includes('adb.search')) {
                map.set(l.site.toLowerCase(), l);
              }
            }
            for (const l of data.links) {
              if (l.url && !l.url.includes('search') && !l.url.includes('adb.search')) {
                map.set(l.site.toLowerCase(), l);
              }
            }
            return Array.from(map.values());
          });
        }
      })
      .catch((err) => console.warn('Failed to load external links:', err));

    // Core Promises tracking for smooth blur loading reveal
    const posterPromise = fetchAniListHighResPoster(anime.anilistId, anime.title.romaji, initialCover).then((res) => {
      if (!isCurrent) return;
      if (res.posterUrl && res.posterUrl.trim()) {
        setPosterUrl(res.posterUrl);
      }
      if (res.color) {
        setPosterGlowColor(res.color);
      }
    });

    // 2. Translate synopsis to Portuguese
    const rawSynopsis = anime.synopsisPt || anime.synopsisEn || '';
    setSynopsis(rawSynopsis || 'Traduzindo sinopse para o português...');
    const synopsisPromise = translateSynopsisToPt(rawSynopsis).then((translated) => {
      if (!isCurrent) return;
      if (translated) {
        setSynopsis(translated);
        anime.synopsisPt = translated;
      }
    });

    // 3. Resolve Director(s) strictly and fetch Staff.staffMedia works directly via AniList API
    const directorPromise = fetchDirectorAndWorksFromAniList(
      anime.anilistId,
      anime.title.romaji,
      anime.director,
      anime.malId
    ).then((res) => {
      if (!isCurrent) return;
      if (res.directors && res.directors.length > 0) {
        setDirectorsList(res.directors);
      }
      setCombinedWorks(res.combinedWorksText || 'primeiro trabalho');
    });

    // 4. Resolve Studio and its animation works (Produção de Animação) strictly from AniList
    const studioPromise = fetchStudioAndWorksFromAniList(
      anime.anilistId,
      anime.title.romaji,
      anime.studio?.name,
      anime.malId
    ).then((res) => {
      if (!isCurrent) return;
      if (res.studio) {
        setStudioInfo(res.studio);
      }
      setStudioWorks(res.worksText || 'primeiro trabalho');
    });

    Promise.allSettled([posterPromise, synopsisPromise, directorPromise, studioPromise]).finally(() => {
      if (isCurrent) {
        setIsModalLoading(false);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [anime?.id]);

  // Resolve studio logo dynamically via AnimeThemes API & MAL CDN
  useEffect(() => {
    let isMounted = true;
    const name = (studioInfo?.name || anime?.studio?.name || '').trim();
    if (!name) {
      setStudioLogoUrl(null);
      return;
    }

    const initialLogo = studioInfo?.logoUrl || getStudioLogoUrl(name) || (studioInfo?.malId ? `https://cdn.myanimelist.net/images/company/${studioInfo.malId}.png` : null);
    if (initialLogo) {
      setStudioLogoUrl(initialLogo);
    }

    fetchStudioLogoFromAnimeThemes(name, studioInfo?.malId).then((url) => {
      if (!isMounted) return;
      if (url) {
        setStudioLogoUrl(url);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [studioInfo, anime?.studio?.name]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (playingVideo) {
          setPlayingVideo(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, playingVideo]);

  const currentGlow = posterGlowColor || palette.accentHex;
  const currentPoster = posterUrl || DEFAULT_POSTER_FALLBACK;
  const currentStudioName = (studioInfo?.name || anime?.studio?.name || '').trim();
  const currentStudioLogo = getStudioLogoUrl(currentStudioName);
  const activeStudioLogo = studioLogoUrl || studioInfo?.logoUrl || currentStudioLogo;
  const processedStudioLogo = activeStudioLogo
    ? (activeStudioLogo.startsWith('data:') || activeStudioLogo.endsWith('.svg')
        ? activeStudioLogo
        : `/api/clean-studio-logo?url=${encodeURIComponent(activeStudioLogo)}`)
    : null;

  return (
    <AnimatePresence>
      {anime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 md:backdrop-blur-md"
          />

          {/* Modal Window with Glassmorphism, Responsive Ultra-Wide Layout & Seasonal Curvature Scrollbar */}
          <motion.div
            id="anime-detail-modal-card"
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0a0e17] md:bg-[#0a0e17]/80 md:backdrop-blur-2xl border border-white/10 shadow-2xl z-10 text-white my-auto season-modal-scroll gpu-layer"
            style={{
              '--season-accent-color': palette.accentHex,
              '--season-thumb-hover': palette.accentHex,
              borderColor: `${currentGlow}35`,
              boxShadow: `0 20px 50px -10px ${currentGlow}30, 0 0 30px -5px ${palette.accentHex}20`,
            } as React.CSSProperties}
          >
          {/* Unified Header: Title, Subtitle, Favorite and Close with Frosted Glassmorphism */}
          <div className="sticky top-0 z-20 flex items-start justify-between gap-3 sm:gap-4 p-4 sm:p-6 pb-3 sm:pb-4 bg-[#0a0e17]/95 md:bg-[#0a0e17]/85 md:backdrop-blur-xl border-b border-white/10">
            {/* Title and Subtitle */}
            <div className="flex-1 min-w-0 pr-1">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white font-display leading-tight">
                {anime.title.romaji}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 italic mt-0.5 font-normal truncate">
                {anime.title.portuguese || anime.title.english || anime.title.native}
              </p>
            </div>

            {/* Right Buttons: Favorite and Close in the top row, and Bell Notification button right below them */}
            <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
              <div className="flex items-center gap-2">
                <button
                  id="modal-favorite-btn"
                  onClick={() => onToggleFavorite(anime.id)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border-0 transition-all cursor-pointer shadow-sm flex items-center justify-center ${
                    isFavorite
                      ? 'bg-amber-400 text-slate-950 font-bold scale-[1.02]'
                      : 'bg-[#141b2c] text-slate-300 hover:text-white hover:bg-[#1f2a42]'
                  }`}
                  title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <Star className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorite ? 'fill-current text-slate-950' : 'text-amber-400 fill-current opacity-85'}`} />
                </button>

                <button
                  id="modal-close-btn"
                  onClick={onClose}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border-0 bg-[#141b2c] text-slate-300 hover:text-white hover:bg-[#1f2a42] transition-colors cursor-pointer shadow-sm flex items-center justify-center"
                  title="Fechar detalhes (ESC)"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
          
              {/* Bell notification button - only visible if status is RELEASING or NOT_YET_RELEASED and in installed PWA */}
              {shouldShowNotifyButton && (
                <div className="flex items-center gap-1 mt-0.5">
                  <button
                    id="modal-bell-notify-btn"
                    onClick={handleToggleNotification}
                    disabled={isTogglingNotify}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all cursor-pointer shadow-sm select-none ${
                      isSubscribed
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)] hover:bg-cyan-400'
                        : 'bg-[#141b2c] hover:bg-[#1f2a42] border-white/10 text-slate-300 hover:text-cyan-300'
                    }`}
                    title={
                      isSubscribed
                        ? 'Notificações ativas! Você receberá aviso push no celular quando sair novo episódio.'
                        : 'Ativar notificações push para novos episódios deste anime.'
                    }
                  >
                    <Bell
                      className={`w-3.5 h-3.5 ${
                        isSubscribed ? 'fill-current text-slate-950 animate-pulse' : 'text-cyan-400'
                      }`}
                    />
                    <span className="text-[11px] font-semibold whitespace-nowrap">
                      {isSubscribed ? 'Avisando novos eps' : 'Avisar episódios'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            {/* Subtle Loading Screen with Frosted Blur overlay */}
            <AnimatePresence>
              {isModalLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-[#0a0e17]/55 backdrop-blur-md rounded-b-3xl"
                >
                  <div className="flex flex-col items-center gap-3 p-5 sm:p-6 rounded-2xl bg-[#0e1422]/90 border border-white/10 shadow-2xl backdrop-blur-xl">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: palette.accentHex }} />
                    <span className="text-xs sm:text-sm font-semibold tracking-wide text-slate-200 animate-pulse">
                      Carregando informações detalhadas...
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={`px-4 sm:px-8 2xl:px-10 pb-8 pt-4 space-y-6 2xl:space-y-8 transition-all duration-500 ease-out ${isModalLoading ? 'filter blur-md opacity-35 pointer-events-none select-none' : 'filter blur-0 opacity-100'}`}>
              {/* Main Info Box */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 2xl:gap-8 items-start">
              {/* Left Column: Single High-Resolution Poster via AniList with 3D Hover Parallax Effect */}
              <div
                className="md:col-span-5 2xl:col-span-4 relative group"
                style={{ perspective: '1000px' }}
              >
                <div
                  onMouseMove={handleCoverMouseMove}
                  onMouseLeave={handleCoverMouseLeave}
                  className="relative aspect-[3/4.3] w-full rounded-2xl overflow-hidden shadow-2xl bg-[#070a0f] cursor-pointer"
                  style={{
                    transform: `rotateX(${coverTilt.rotateX}deg) rotateY(${coverTilt.rotateY}deg) ${
                      coverTilt.isHovered ? 'scale(1.04) translateZ(12px)' : 'scale(1)'
                    }`,
                    transformStyle: 'preserve-3d',
                    transition: coverTilt.isHovered
                      ? 'transform 0.1s ease-out, box-shadow 0.25s ease-out'
                      : 'transform 0.5s ease-out, box-shadow 0.5s ease-out',
                    border: `1px solid ${currentGlow}${coverTilt.isHovered ? '90' : '50'}`,
                    boxShadow: coverTilt.isHovered
                      ? `${-coverTilt.rotateY * 2.5}px ${coverTilt.rotateX * 2.5}px 35px -5px ${currentGlow}75, 0 0 35px -2px ${palette.accentHex}40`
                      : `0 12px 35px -5px ${currentGlow}45, 0 0 25px -3px ${palette.accentHex}25`,
                  }}
                >
                  {currentPoster ? (
                    <img
                      src={currentPoster}
                      alt={anime.title.romaji}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500"
                      style={{
                        transform: coverTilt.isHovered ? 'scale(1.05)' : 'scale(1)',
                      }}
                    />
                  ) : null}

                  {/* Dynamic 3D Glare & Glossy Reflection Sheen */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300 rounded-2xl"
                    style={{
                      opacity: coverTilt.isHovered ? 0.35 : 0,
                      background: `radial-gradient(circle at ${coverTilt.glareX}% ${coverTilt.glareY}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 65%)`,
                      mixBlendMode: 'overlay',
                    }}
                  />
                </div>
              </div>

              {/* Right Column: Technical Details with Frosted Glassmorphism */}
              <div
                className="md:col-span-7 2xl:col-span-8 rounded-2xl bg-[#0e1422]/80 backdrop-blur-xl p-5 sm:p-6 2xl:p-7 space-y-3.5 text-sm leading-relaxed shadow-xl"
                style={{
                  border: `1px solid ${currentGlow}25`,
                  boxShadow: `0 8px 24px -4px ${currentGlow}20`,
                }}
              >
                {/* Translated Synopsis with Read More toggle for large text */}
                <div>
                  <span className="font-bold mr-2" style={{ color: palette.accentHex }}>Sinopse:</span>
                  <span className="text-slate-200 leading-relaxed inline">
                    {synopsis
                      ? isSynopsisExpanded || synopsis.length <= 260
                        ? synopsis
                        : `${synopsis.slice(0, 260)}... `
                      : 'Sinopse oficial não divulgada até o momento.'}
                  </span>
                  {synopsis && synopsis.length > 260 && (
                    <button
                      onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
                      className="ml-1.5 inline-flex items-center gap-0.5 text-xs font-bold cursor-pointer transition-colors hover:underline"
                      style={{ color: palette.accentHex }}
                    >
                      {isSynopsisExpanded ? (
                        <>
                          <span>Ler menos</span>
                          <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <span>Ler mais</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Genre */}
                <div>
                  <span className="font-bold mr-2" style={{ color: palette.accentHex }}>Gênero:</span>
                  <span className="text-slate-200">
                    {anime.genres.length > 0 ? anime.genres.join(', ') : 'Geral'}
                  </span>
                </div>

                {/* Director (No underline, colored with current seasonal accent color - MAL direct link via Jikan with AniList fallback) */}
                <div>
                  <span className="font-bold mr-2" style={{ color: palette.accentHex }}>Diretor:</span>
                  {directorsList.length > 0 ? (
                    directorsList.map((dir, idx) => (
                      <React.Fragment key={`dir-${idx}-${dir.name}`}>
                        {idx > 0 && <span className="text-slate-300 mr-1.5">, </span>}
                        <a
                          href={
                            dir.url ||
                            dir.malUrl ||
                            dir.anilistUrl ||
                            (dir.id ? `https://anilist.co/staff/${dir.id}` : `https://anilist.co/search/staff?search=${encodeURIComponent(dir.name)}`)
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: palette.accentHex }}
                          className="font-bold hover:brightness-125 transition-all cursor-pointer inline-block"
                          title={dir.malUrl ? `Ver perfil de ${dir.name} no MyAnimeList` : `Ver perfil de ${dir.name} no AniList`}
                        >
                          {dir.name}
                        </a>
                      </React.Fragment>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">Identificando diretor...</span>
                  )}
                  {directorsList.length > 0 && combinedWorks && combinedWorks !== 'carregando...' && (
                    <span className="text-slate-400 font-normal ml-1.5">
                      ({combinedWorks})
                    </span>
                  )}
                  {directorsList.length > 0 && combinedWorks === 'carregando...' && (
                    <span className="text-slate-500 font-normal ml-1.5 text-xs italic">
                      (carregando trabalhos...)
                    </span>
                  )}
                </div>

                {/* Studio (Animation Work / Produção de Animação resolved with direct MyAnimeList link via Jikan with AniList fallback + Logo image rendering) */}
                <div>
                  <span className="font-bold mr-2" style={{ color: palette.accentHex }}>Estúdio:</span>
                  {currentStudioName ? (
                    <a
                      href={
                        studioInfo?.url ||
                        studioInfo?.malUrl ||
                        studioInfo?.siteUrl ||
                        studioInfo?.anilistUrl ||
                        (studioInfo?.id ? `https://anilist.co/studio/${studioInfo.id}` : `https://anilist.co/search/anime?studios=${encodeURIComponent(currentStudioName)}`)
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: palette.accentHex }}
                      className="font-bold hover:brightness-125 transition-all cursor-pointer inline-flex items-center gap-1.5 align-middle"
                      title={
                        studioInfo?.malUrl
                          ? `Ver estúdio ${currentStudioName} no MyAnimeList`
                          : `Ver estúdio ${currentStudioName} no AniList`
                      }
                    >
                      {processedStudioLogo && !studioLogoFailed ? (
                        <img
                          src={processedStudioLogo}
                          alt={currentStudioName}
                          className="h-14 sm:h-15 w-auto max-w-[140px] object-contain filter drop-shadow-md brightness-110 hover:scale-105 transition-all py-0.5"
                          referrerPolicy="no-referrer"
                          onError={() => setStudioLogoFailed(true)}
                        />
                      ) : (
                        <span>{currentStudioName}</span>
                      )}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Estúdio Desconhecido</span>
                  )}
                  {studioWorks && studioWorks !== 'carregando...' && (
                    <span className="text-slate-400 font-normal ml-1.5">
                      ({studioWorks})
                    </span>
                  )}
                  {studioWorks === 'carregando...' && (
                    <span className="text-slate-500 font-normal ml-1.5 text-xs italic">
                      (carregando trabalhos...)
                    </span>
                  )}
                </div>

                <br></br>

                {/* Release & Episodes */}
                <div>
                  <span className="font-bold mr-2" style={{ color: palette.accentHex }}>Estréia:</span>
                  <span className="text-slate-200">
                    {anime.startDate?.formatted || 'Em breve'}
                  </span>
                </div>
                <div>
                  <span className="font-bold mr-2" style={{ color: palette.accentHex }}>Episódios:</span>
                  <span className="text-slate-200">{anime.episodes}</span>
                </div>
                
                {/* Status */}
                <div>
                  <span className="font-bold mr-2" style={{ color: palette.accentHex }}>Status:</span>
                  <span className="text-slate-200 font-medium">
                    {getAnimeStatusText(anime)}
                  </span>
                </div>

                {/* Type */}
                <div>
                  <span className="font-bold mr-2" style={{ color: palette.accentHex }}>Tipo:</span>
                  <span className="text-slate-200">{anime.typeLabel}</span>
                </div>

                {/* Score */}
                <div>
                  <span className="font-bold mr-2" style={{ color: palette.accentHex }}>Nota:</span>
                  {anime.score ? (
                    <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
                      <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                      <span>{anime.score}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Sem avaliação ainda</span>
                  )}
                </div>

                {/* Official Platform & Streaming Links: Showing only pure icons without backgrounds */}
                {activeLinks.length > 0 && (
                  <div className="col-span-1 sm:col-span-2 pt-3 border-t border-white/10 mt-1">
                    <span
                      className="font-bold block mb-2 text-xs uppercase tracking-wider"
                      style={{ color: palette.accentHex }}
                    >
                      Onde Assistir & Informações:
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      {activeLinks.map((link) => {
                        const info = getPlatformInfo(link.site || link.type || '');
                        return (
                          <a
                            key={`${link.site}-${link.url}`}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:opacity-85 transition-all duration-200 flex items-center justify-center group cursor-pointer hover:scale-110"
                            title={`Acessar ${info.name}`}
                            aria-label={info.name}
                          >
                            <img
                              src={info.logo}
                              alt={info.name}
                              className="h-11 sm:h-13 w-auto max-w-[95px] object-contain shrink-0 filter drop-shadow-md group-hover:brightness-125 transition-all"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const target = e.currentTarget;
                                const domain = (info.name || link.site || 'link').toLowerCase().replace(/\s+/g, '') + '.com';
                                target.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                              }}
                            />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Video & Theme Section (AniList Trailer + AnimeThemes Openings & Endings) */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4" style={{ color: palette.accentHex }} />
                  <span>Trailers, Aberturas e Encerramentos</span>
                  <span className="text-sm sm:text-base font-normal text-slate-400">
                    ({loadingThemes ? '...' : allVideos.length})
                  </span>
                </h3>
                {loadingThemes && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-full shadow-sm animate-pulse">
                    <Loader2
                      className="w-3.5 h-3.5 animate-spin"
                      style={{ color: palette.accentHex }}
                    />
                    <span className="hidden sm:inline">Buscando aberturas e encerramentos...</span>
                    <span className="sm:hidden">Carregando...</span>
                  </div>
                )}
              </div>

              {/* Thumbnails Grid Matching capture_temp.jpg */}
              {allVideos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-start">
                  {allVideos.map((vid) => {
                    const isSelected = playingVideo?.id === vid.id;
                    const isOpOrEd = vid.type === 'OP' || vid.type === 'ED';
                    const isTrailer = !isOpOrEd;

                    return (
                      <div
                        key={vid.id}
                        onClick={() => {
                          setPlayingVideo(vid);
                        }}
                        className={`group flex flex-col rounded-2xl overflow-hidden bg-[#0c1017] border transition-all duration-300 cursor-pointer text-center h-fit ${
                          isTrailer ? 'self-start' : ''
                        } ${
                          isSelected
                            ? 'ring-2 shadow-xl'
                            : 'border-white/10 hover:border-white/30 hover:shadow-lg'
                        }`}
                        style={{
                          borderColor: isSelected ? palette.accentHex : undefined,
                          boxShadow: isSelected ? `0 0 20px -2px ${palette.accentHex}40` : undefined,
                        }}
                      >
                        {/* Top Thumbnail Image with 16:9 Aspect Ratio and Badge */}
                        <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                          {(() => {
                            const isAnimeThemes = vid.source === 'animethemes';
                            const videoThumbnail = isAnimeThemes
                              ? (vid.thumbnail && vid.thumbnail.includes('large-cover') ? vid.thumbnail : currentPoster)
                              : (currentPoster || vid.thumbnail);

                            return (
                              <img
                                src={videoThumbnail}
                                alt={vid.title}
                                className="w-full h-full object-cover brightness-90 group-hover:scale-105 group-hover:brightness-100 transition-all duration-300"
                              />
                            );
                          })()}

                          {/* Hover Play Button Overlay */}
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/15 flex items-center justify-center transition-colors">
                            <div
                              className="p-3 rounded-full shadow-lg transform group-hover:scale-110 transition-transform text-slate-950"
                              style={{ backgroundColor: palette.accentHex }}
                            >
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </div>
                          </div>

                          {/* Top-Left Badges: Spoiler, NSFW, Uncensored, and below them Over / Transition */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start pointer-events-none z-10">
                            {/* Primary Alert Badges (Spoiler, NSFW, Uncensored) - Translucent glass plaque style */}
                            {(vid.spoiler || vid.nsfw || vid.uncen) && (
                              <div className="flex flex-wrap gap-1 items-center">
                                {vid.spoiler && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-red-500/60 text-red-400 text-[10px] font-bold tracking-wider uppercase shadow-sm">
                                    <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                                    <span>Spoiler</span>
                                  </span>
                                )}
                                {vid.nsfw && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-rose-500/60 text-rose-400 text-[10px] font-bold tracking-wider uppercase shadow-sm">
                                    <ShieldAlert className="w-3 h-3 stroke-[2.5]" />
                                    <span>NSFW</span>
                                  </span>
                                )}
                                {vid.uncen && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-purple-500/60 text-purple-400 text-[10px] font-bold tracking-wider uppercase shadow-sm">
                                    <EyeOff className="w-3 h-3 stroke-[2.5]" />
                                    <span>Uncen</span>
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Secondary Flow Badges (Over, Transition) positioned below: SEM ícone nenhum, fundo SEMPRE preto, estilo placa transparente */}
                            {vid.overlap && vid.overlap !== 'None' && (
                              <div className="flex flex-wrap gap-1 items-center">
                                {vid.overlap === 'Over' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-black/90 backdrop-blur-md border border-white/20 text-slate-200 text-[10px] font-bold tracking-wider uppercase shadow-sm">
                                    OVER
                                  </span>
                                )}
                                {vid.overlap === 'Transition' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-black/90 backdrop-blur-md border border-white/20 text-slate-200 text-[10px] font-bold tracking-wider uppercase shadow-sm">
                                    TRANSITION
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Bottom-Right: Version indicator on bottom-right for multiple versions (restored as before) */}
                          {vid.source === 'animethemes' && vid.hasMultipleVersions && vid.version ? (
                            <div
                              className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-sm border text-[11px] font-bold text-white shadow-md z-10"
                              style={{ borderColor: palette.accentHex }}
                            >
                              <span>v{vid.version}</span>
                            </div>
                          ) : null}
                        </div>

                        {/* Bottom Info Block */}
                        {isTrailer ? (
                          /* Trailer: wraps tightly around text with zero extra height or gap */
                          <div className="py-2.5 px-3 bg-[#0a0e17] flex items-center justify-center">
                            <div
                              className="font-bold text-base sm:text-lg tracking-wide"
                              style={{ color: isSelected ? palette.accentHex : '#ffffff' }}
                            >
                              {vid.displayTypeLabel || vid.type}
                            </div>
                          </div>
                        ) : (
                          /* OP / ED: Type, Song name, centered Band and Episodes on bottom-left */
                          <div className="p-3 sm:p-3.5 bg-[#0a0e17] flex flex-col justify-center">
                            {/* Line 1: Type / Label (e.g., "OP", "Abertura 1", "ED") */}
                            <div
                              className="font-bold text-base sm:text-lg tracking-wide"
                              style={{ color: isSelected ? palette.accentHex : '#ffffff' }}
                            >
                              {vid.displayTypeLabel || vid.type}
                            </div>

                            {/* Line 2: Song Name */}
                            {vid.songTitle ? (
                              <div className="text-sm sm:text-base font-semibold italic text-slate-200 mt-0.5 line-clamp-1">
                                {vid.songTitle}
                              </div>
                            ) : null}

                            {/* Line 3: Band strictly centered horizontally, episodes pinned to the left */}
                            <div className="relative w-full flex items-center justify-center mt-2 min-h-[20px]">
                              {/* Bottom-left: Film icon + episodes range */}
                              {vid.episodes ? (
                                <div className="absolute left-0 flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 italic font-medium">
                                  <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.8] text-slate-400 shrink-0" />
                                  <span>{vid.episodes}</span>
                                </div>
                              ) : null}

                              {/* Center: Band / Artist - always mathematically centered */}
                              {vid.artistName ? (
                                <div className="text-xs sm:text-sm italic text-slate-400 font-medium truncate max-w-[65%] text-center px-1">
                                  {vid.artistName}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center text-slate-400 text-sm">
                  Nenhum trailer ou música oficial disponível para este anime no momento.
                </div>
              )}
            </div>
          </div>
        </div>
        </motion.div>

        {/* Central Popup Video Player (Modal style matching reference image) */}
        {playingVideo && (
          <CustomVideoPlayer
            video={playingVideo}
            anime={anime}
            palette={palette}
            onClose={() => setPlayingVideo(null)}
            onNext={() => {
              const idx = allVideos.findIndex((v) => v.id === playingVideo.id);
              if (idx >= 0 && idx < allVideos.length - 1) {
                setPlayingVideo(allVideos[idx + 1]);
              }
            }}
            onPrev={() => {
              const idx = allVideos.findIndex((v) => v.id === playingVideo.id);
              if (idx > 0) {
                setPlayingVideo(allVideos[idx - 1]);
              }
            }}
            hasNext={allVideos.findIndex((v) => v.id === playingVideo.id) < allVideos.length - 1}
            hasPrev={allVideos.findIndex((v) => v.id === playingVideo.id) > 0}
            nextVideo={
              allVideos.findIndex((v) => v.id === playingVideo.id) < allVideos.length - 1
                ? allVideos[allVideos.findIndex((v) => v.id === playingVideo.id) + 1]
                : undefined
            }
          />
        )}

        <PWAInstallModal
          isOpen={showInstallGuide}
          onClose={() => setShowInstallGuide(false)}
          isIOS={isIOS}
        />
        </div>
      )}
    </AnimatePresence>
  );
};

