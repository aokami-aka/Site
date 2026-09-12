import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Loader2, Database } from 'lucide-react';
import { Season } from '../types';
import { SEASON_PALETTES, SeasonPalette } from './SeasonPage';
import { AnimeGuidesLogo } from './AnimeGuidesLogo';

interface AnimeLoadingStateProps {
  season: Season;
  year: number;
  palette?: SeasonPalette;
}

const LOADING_MESSAGES = [
  'Conectando à API oficial AniList...',
  'Buscando os lançamentos da temporada...',
  'Sincronizando notas, estúdios e episódios...',
  'Carregando links e plataformas de streaming...',
  'Preparando o catálogo da temporada...',
];

export const AnimeLoadingState: React.FC<AnimeLoadingStateProps> = ({
  season,
  year,
  palette = SEASON_PALETTES[season],
}) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full py-12 px-4 flex flex-col items-center justify-center space-y-10">
      {/* Central Stylish Hero Loader */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative flex flex-col items-center justify-center p-8 sm:p-10 rounded-3xl bg-[#0a0f1d]/75 backdrop-blur-2xl border border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.6)] text-center max-w-md w-full overflow-hidden group"
      >
        {/* Background Radial Glow Matching Season Color */}
        <div
          className="absolute -inset-10 rounded-full opacity-20 blur-3xl pointer-events-none transition-all duration-700"
          style={{
            background: `radial-gradient(circle, ${palette.accentHex} 0%, transparent 70%)`,
          }}
        />

        {/* Ambient Floating Particle Orbs */}
        <motion.div
          animate={{
            y: [-6, 6, -6],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-4 right-6 text-white/20"
        >
          <Sparkles className="w-5 h-5" style={{ color: palette.accentHex }} />
        </motion.div>

        {/* Multi-Ring Rotating Orb */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-6">
          {/* Outer Pulsing Glow Ring */}
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full border border-dashed opacity-40"
            style={{ borderColor: palette.accentHex }}
          />

          {/* Clockwise Spinning Outer Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-1 rounded-full border-2 border-t-transparent border-r-transparent"
            style={{
              borderColor: palette.accentHex,
              borderTopColor: 'transparent',
              borderRightColor: 'transparent',
            }}
          />

          {/* Counter-Clockwise Spinning Inner Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-3 rounded-full border-2 border-b-transparent border-l-transparent"
            style={{
              borderColor: `${palette.accentHex}a0`,
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
            }}
          />

          {/* Kanji Symbol or Logo Center */}
          <motion.div
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative z-10 flex flex-col items-center justify-center"
          >
            <span
              className="text-3xl sm:text-4xl font-black font-display tracking-tight drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
              style={{ color: palette.accentHex }}
            >
              {palette.kanji}
            </span>
          </motion.div>
        </div>

        {/* Loading Title & Season Info */}
        <div className="space-y-1.5 z-10">
          <div className="flex items-center justify-center gap-2">
            <AnimeGuidesLogo season={season} className="w-5 h-5 animate-spin-slow" glow={true} />
            <h3 className="text-lg font-black text-white font-display tracking-wide">
              {palette.namePt} {year}
            </h3>
          </div>

          {/* Dynamic Status Text with Smooth Fade Transition */}
          <div className="h-6 flex items-center justify-center">
            <motion.p
              key={msgIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: palette.accentHex }} />
              <span>{LOADING_MESSAGES[msgIndex]}</span>
            </motion.p>
          </div>
        </div>

        {/* Small AniList API Indicator Badge */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400">
          <Database className="w-3 h-3 text-cyan-400" />
          <span>Sincronizando com <strong className="text-cyan-300">AniList GraphQL API</strong></span>
        </div>
      </motion.div>

      {/* Grid of Skeleton Cards with Shimmering Sheen */}
      <div className="w-full max-w-7xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`skeleton-card-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="relative overflow-hidden aspect-[2/3] rounded-2xl bg-[#0f1526]/60 border border-white/10 backdrop-blur-xl p-3 flex flex-col justify-between"
          >
            {/* Animated Shimmer Sweep Layer */}
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeInOut',
                repeatDelay: 0.2 + i * 0.1,
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 pointer-events-none"
            />

            {/* Skeleton Top Badges */}
            <div className="flex items-center justify-between">
              <div className="w-12 h-5 rounded-lg bg-white/10 animate-pulse" />
              <div className="w-8 h-5 rounded-lg bg-white/10 animate-pulse" />
            </div>

            {/* Skeleton Bottom Info */}
            <div className="space-y-2 mt-auto">
              <div className="w-3/4 h-4 rounded-md bg-white/15 animate-pulse" />
              <div className="w-1/2 h-3 rounded-md bg-white/10 animate-pulse" />
              <div className="flex gap-1 pt-1">
                <div className="w-10 h-3 rounded bg-white/10 animate-pulse" />
                <div className="w-10 h-3 rounded bg-white/10 animate-pulse" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
