import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Download,
  Film,
  Music,
  Loader2,
} from 'lucide-react';
import { AnimeVideo, AnimeItem } from '../types';
import { SeasonPalette } from './SeasonPage';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface CustomVideoPlayerProps {
  video: AnimeVideo;
  anime?: AnimeItem;
  palette: SeasonPalette;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  nextVideo?: AnimeVideo;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  video,
  anime,
  palette,
  onClose,
  onNext,
  hasNext = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showDownloadMenu, setShowDownloadMenu] = useState<boolean>(false);
  const [isConvertingAudio, setIsConvertingAudio] = useState<boolean>(false);
  const [isConvertingVideo, setIsConvertingVideo] = useState<boolean>(false);

  const isMountedRef = useRef<boolean>(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isConverting = isConvertingAudio || isConvertingVideo;

  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isDirectVideo = Boolean(
    video.videoUrl &&
      (video.source === 'animethemes' ||
        video.videoUrl.endsWith('.webm') ||
        video.videoUrl.endsWith('.mp4'))
  );

  const isTheme = video.type === 'OP' || video.type === 'ED' || video.source === 'animethemes';

  // Auto-hide controls during playback (only for direct videos, as trailers use YouTube native UI)
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    if (isPlaying) {
      hideTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowDownloadMenu(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isPlaying, resetHideTimer]);

  // YouTube IFrame API Setup for Trailers
  useEffect(() => {
    if (isDirectVideo || !video.youtubeId) return;

    let pollTimer: NodeJS.Timeout | null = null;
    let destroyed = false;

    const setupPlayer = () => {
      if (destroyed || !window.YT || !window.YT.Player) return;

      try {
        ytPlayerRef.current = new window.YT.Player('custom-yt-player-iframe', {
          events: {
            onReady: (event: any) => {
              if (destroyed) return;
              setIsPlaying(true);
              try {
                event.target.playVideo();
              } catch {}

              // Subtitles & Auto-Translate to Portuguese
              try {
                event.target.loadModule('captions');
                setTimeout(() => {
                  try {
                    const trackList = event.target.getOption('captions', 'tracklist');
                    if (Array.isArray(trackList) && trackList.length > 0) {
                      const ptTrack = trackList.find(
                        (t: any) =>
                          t.languageCode === 'pt' ||
                          t.languageCode === 'pt-BR' ||
                          t.languageCode === 'pt-PT'
                      );
                      if (ptTrack) {
                        event.target.setOption('captions', 'track', {
                          languageCode: ptTrack.languageCode,
                        });
                      } else {
                        const baseTrack = trackList.find((t: any) => t.isDefault) || trackList[0];
                        event.target.setOption('captions', 'track', {
                          languageCode: baseTrack?.languageCode || 'ja',
                          translationLanguage: { languageCode: 'pt', languageName: 'Portuguese' },
                        });
                      }
                    } else {
                      event.target.setOption('captions', 'track', {
                        translationLanguage: { languageCode: 'pt', languageName: 'Portuguese' },
                      });
                    }
                  } catch {}
                }, 1000);
              } catch {}
            },
            onStateChange: (event: any) => {
              if (destroyed) return;
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
              if (event.data === 1) {
                setIsPlaying(true);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                setIsPlaying(false);
                if (hasNext && onNext) onNext();
              }
            },
          },
        });
      } catch (err) {
        console.warn('YouTube Player API init warning:', err);
      }
    };

    // Load YouTube API script if not loaded
    if (!window.YT) {
      if (!document.getElementById('youtube-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        setupPlayer();
      };
    } else {
      setupPlayer();
    }

    // Interval to sync time and duration for bottom progress bar
    pollTimer = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        try {
          const cur = ytPlayerRef.current.getCurrentTime() || 0;
          const dur = ytPlayerRef.current.getDuration() || 0;
          setCurrentTime(cur);
          if (dur > 0) setDuration(dur);
        } catch {}
      }
    }, 250);

    // Listen to direct postMessage from YouTube IFrame
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data && data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            setCurrentTime(data.info.currentTime);
          }
          if (typeof data.info.duration === 'number' && data.info.duration > 0) {
            setDuration(data.info.duration);
          }
          if (data.info.playerState === 1) {
            setIsPlaying(true);
          } else if (data.info.playerState === 2 || data.info.playerState === 0) {
            setIsPlaying(false);
          }
        }
      } catch {}
    };
    window.addEventListener('message', handleMessage);

    return () => {
      destroyed = true;
      if (pollTimer) clearInterval(pollTimer);
      window.removeEventListener('message', handleMessage);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
      }
      ytPlayerRef.current = null;
    };
  }, [isDirectVideo, video.youtubeId, hasNext, onNext]);

  // Handle Play/Pause (for direct video)
  const togglePlay = () => {
    if (isDirectVideo && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
    resetHideTimer();
  };

  // Handle Mute/Volume (for direct video)
  const toggleMute = () => {
    if (isDirectVideo && videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
    resetHideTimer();
  };

  // Direct video time update handler
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  // Progress Bar Seek handler (works for both direct video and YouTube trailers)
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;

    if (isDirectVideo && videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      resetHideTimer();
    } else if (!isDirectVideo && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      try {
        ytPlayerRef.current.seekTo(newTime, true);
        setCurrentTime(newTime);
      } catch {}
    }
  };

  // AnimeThemes Download Handler (Video converted to MP4 or Audio converted to MP3 via ffmpeg)
  const handleDownload = async (type: 'video' | 'audio') => {
    if (isConverting) return;
    setShowDownloadMenu(false);

    const cleanTitle = (video.songTitle || video.title || 'Tema').replace(/[/\\?%*:|"<>]/g, '_');
    const cleanAnime = (anime?.title?.romaji || anime?.title?.userPreferred || '').replace(/[/\\?%*:|"<>]/g, '_');
    const baseFilename = `${cleanAnime ? cleanAnime + ' - ' : ''}${video.displayTypeLabel || video.type} - ${cleanTitle}`;

    if (type === 'audio') {
      // Use FFmpeg server endpoint to convert OGG/Audio to MP3
      const rawAudioUrl = video.audioUrl || video.videoUrl;

      if (!rawAudioUrl) return;

      setIsConvertingAudio(true);
      const convertApiUrl = `/api/convert-audio?url=${encodeURIComponent(rawAudioUrl)}&title=${encodeURIComponent(baseFilename)}`;

      try {
        const response = await fetch(convertApiUrl);
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `${baseFilename}.mp3`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
          if (isMountedRef.current) setIsConvertingAudio(false);
          return;
        }
      } catch (err) {
        console.warn('Audio download fetch failed, opening direct stream:', err);
      }

      // Direct fallback
      const a = document.createElement('a');
      a.href = convertApiUrl;
      a.download = `${baseFilename}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (isMountedRef.current) setIsConvertingAudio(false);
    } else {
      // Video download converted from WebM to MP4 via FFmpeg server endpoint
      const downloadUrl = video.videoUrl;
      if (!downloadUrl) return;

      setIsConvertingVideo(true);
      const convertApiUrl = `/api/convert-video?url=${encodeURIComponent(downloadUrl)}&title=${encodeURIComponent(baseFilename)}`;

      try {
        const response = await fetch(convertApiUrl);
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `${baseFilename}.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
          if (isMountedRef.current) setIsConvertingVideo(false);
          return;
        }
      } catch (err) {
        console.warn('Video download fetch failed, opening direct stream:', err);
      }

      // Direct fallback
      const a = document.createElement('a');
      a.href = convertApiUrl;
      a.download = `${baseFilename}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (isMountedRef.current) setIsConvertingVideo(false);
    }
  };

  // Keyboard shortcuts (Space = toggle, Esc = close, m = mute, arrows = seek)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (isDirectVideo) {
        if (e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          togglePlay();
        } else if (e.key === 'ArrowRight' && duration > 0) {
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(duration, currentTime + 5);
            resetHideTimer();
          }
        } else if (e.key === 'ArrowLeft' && duration > 0) {
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, currentTime - 5);
            resetHideTimer();
          }
        } else if (e.key === 'm' || e.key === 'M') {
          toggleMute();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration, currentTime, isDirectVideo, onClose, isMuted]);

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    /* Modal Backdrop */
    <div
      id="video-player-popup-backdrop"
      className="fixed inset-0 z-[70] flex items-center justify-center p-2.5 sm:p-6 md:p-8 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Central Video Frame */}
      <div
        ref={containerRef}
        id="video-player-popup-frame"
        onMouseMove={isDirectVideo ? resetHideTimer : undefined}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black select-none group shadow-2xl border border-white/15 flex items-center justify-center"
        style={{
          boxShadow: `0 25px 60px -15px rgba(0,0,0,0.95), 0 0 35px -5px ${palette.accentHex}30`,
        }}
      >
        {/* CASE 1: Direct Video Stream (AnimeThemes OP / ED) */}
        {isDirectVideo ? (
          <>
            <video
              ref={videoRef}
              src={video.videoUrl}
              playsInline
              autoPlay
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setDuration(videoRef.current.duration || 0);
                  videoRef.current.play().catch(() => {});
                }
              }}
              onEnded={() => {
                setIsPlaying(false);
                if (hasNext && onNext) onNext();
              }}
              onClick={togglePlay}
              className="w-full h-full object-contain cursor-pointer"
            />

            {/* Top Header Bar (AnimeThemes) */}
            <div
              className={`absolute top-0 left-0 right-0 pt-3.5 sm:pt-4 pb-12 px-4 sm:px-6 bg-gradient-to-b from-black/90 via-black/45 to-transparent flex items-start justify-between gap-4 z-30 transition-opacity duration-300 pointer-events-none ${
                showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Clean title without circular avatar */}
              <div className="min-w-0 pr-3 pointer-events-auto">
                <h4 className="text-white text-xs sm:text-sm md:text-base font-bold truncate drop-shadow-md">
                  {video.displayTypeLabel ? `${video.displayTypeLabel} ` : ''}
                  {video.songTitle ? `『${video.songTitle}』` : video.title}
                </h4>
                <p className="text-white/75 text-[11px] sm:text-xs font-medium truncate drop-shadow mt-0.5">
                  {video.artistName || anime?.title?.romaji || ''}
                </p>
              </div>

              {/* Mute and Close Buttons with season subtle glow */}
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 pointer-events-auto">
                <button
                  onClick={toggleMute}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md group"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = palette.accentHex;
                    e.currentTarget.style.boxShadow = `0 0 12px ${palette.accentHex}60`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  title={isMuted ? 'Desmutar (M)' : 'Mutar (M)'}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2
                      className="w-4 h-4 transition-colors"
                      style={{ color: '#ffffff' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = palette.accentHex)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#ffffff')}
                    />
                  )}
                </button>

                <button
                  onClick={onClose}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md group"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = palette.accentHex;
                    e.currentTarget.style.boxShadow = `0 0 12px ${palette.accentHex}60`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  title="Fechar (Esc)"
                >
                  <X className="w-4 h-4 transition-transform group-hover:scale-110" />
                </button>
              </div>
            </div>

            {/* Center Play/Pause button */}
            <div
              onClick={togglePlay}
              className={`absolute inset-0 flex items-center justify-center pointer-events-auto cursor-pointer transition-opacity duration-300 ${
                !isPlaying || showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-black/55 hover:bg-black/80 backdrop-blur-md border text-white flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer group"
                style={{
                  borderColor: `${palette.accentHex}70`,
                  boxShadow: `0 0 20px ${palette.accentHex}40`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = palette.accentHex;
                  e.currentTarget.style.boxShadow = `0 0 28px ${palette.accentHex}80`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${palette.accentHex}70`;
                  e.currentTarget.style.boxShadow = `0 0 20px ${palette.accentHex}40`;
                }}
                title={isPlaying ? 'Pausar (Espaço)' : 'Reproduzir (Espaço)'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                ) : (
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-1" />
                )}
              </button>
            </div>

            {/* Download Button (Only for OP / ED themes)
                Mobile: positioned at bottom right (bottom-6 right-3)
                Desktop: positioned middle right (top-1/2 -translate-y-1/2 right-6)
            */}
            {isTheme && (
              <div
                className={`absolute z-30 transition-opacity duration-300 
                  bottom-6 right-3.5 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:right-6
                  ${
                    showControls || !isPlaying || showDownloadMenu
                      ? 'opacity-100 pointer-events-auto'
                      : 'opacity-0 pointer-events-none'
                  }`}
              >
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDownloadMenu((prev) => !prev);
                      resetHideTimer();
                    }}
                    disabled={isConverting}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/70 backdrop-blur-md border text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xl group disabled:opacity-75"
                    style={{
                      borderColor: showDownloadMenu ? palette.accentHex : `${palette.accentHex}70`,
                      boxShadow: showDownloadMenu
                        ? `0 0 18px ${palette.accentHex}70`
                        : `0 0 10px ${palette.accentHex}30`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = palette.accentHex;
                      e.currentTarget.style.boxShadow = `0 0 18px ${palette.accentHex}70`;
                    }}
                    onMouseLeave={(e) => {
                      if (!showDownloadMenu) {
                        e.currentTarget.style.borderColor = `${palette.accentHex}70`;
                        e.currentTarget.style.boxShadow = `0 0 10px ${palette.accentHex}30`;
                      }
                    }}
                    title="Opções de Download (Vídeo MP4 / Áudio MP3)"
                  >
                    {isConverting ? (
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: palette.accentHex }} />
                    ) : (
                      <Download className="w-5 h-5 transition-transform group-hover:scale-110" />
                    )}
                  </button>

                  {/* Download Options Menu:
                      - Mobile: Opens upwards and clamped properly
                      - Desktop: Opens below or to the side
                      - Text: Just "Vídeo" and "Áudio" with extension vertically aligned to the right!
                  */}
                  {showDownloadMenu && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 bottom-full mb-3 sm:bottom-auto sm:top-full sm:mt-2 w-48 p-1.5 rounded-xl bg-[#0c111c]/95 backdrop-blur-md border shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                      style={{ borderColor: `${palette.accentHex}60` }}
                    >
                      <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10 mb-1">
                        Baixar Tema
                      </div>

                      {/* Option 1: Video (MP4 via FFmpeg) */}
                      <button
                        onClick={() => handleDownload('video')}
                        disabled={isConverting}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-white hover:bg-white/10 transition-colors group cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-md flex items-center justify-center bg-white/10 shrink-0"
                            style={{ color: palette.accentHex }}
                          >
                            {isConvertingVideo ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Film className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <span className="text-xs font-bold text-white">Vídeo</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono font-medium">
                          {video.resolution ? `${video.resolution}p` : 'MP4'}
                        </span>
                      </button>

                      {/* Option 2: Audio (MP3 via FFmpeg) */}
                      <button
                        onClick={() => handleDownload('audio')}
                        disabled={isConverting}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-white hover:bg-white/10 transition-colors group cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-md flex items-center justify-center bg-white/10 shrink-0"
                            style={{ color: palette.accentHex }}
                          >
                            {isConvertingAudio ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Music className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <span className="text-xs font-bold text-white">Áudio</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono font-medium">
                          MP3
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* CASE 2: YouTube Trailer
             - Shows minimal YouTube buttons (no YouTube logo, no fullscreen clutter, no annotations)
             - YouTube's natural progress bar is hidden
             - Custom seasonal progress bar displayed and functional pinned to the bottom
             - Auto-translates to Portuguese captions
          */
          <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
            <iframe
              id="custom-yt-player-iframe"
              src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&enablejsapi=1&rel=0&playsinline=1&controls=0&modestbranding=1&fs=0&iv_load_policy=3&disablekb=0&cc_load_policy=1&cc_lang_pref=pt&hl=pt${
                typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : ''
              }`}
              title={video.title}
              className="w-full h-full border-0 pointer-events-auto"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

            {/* Subtle mask at bottom to hide YouTube's idle red progress line */}
            <div className="absolute left-0 right-0 bottom-0 h-1.5 sm:h-2 bg-black pointer-events-none z-30" />         
          </div>
        )}

        {/* Dynamic subtle progress bar pinned strictly to the bottom edge for both videos and trailers */}
        <div
          ref={progressBarRef}
          onClick={handleSeek}
          className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 hover:h-2 sm:hover:h-2.5 transition-all z-40 cursor-pointer bg-white/20"
        >
          <div
            className="h-full relative transition-all duration-100"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: palette.accentHex,
              boxShadow: `0 0 10px ${palette.accentHex}99`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
