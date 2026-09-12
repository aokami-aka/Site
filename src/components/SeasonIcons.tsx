import React from 'react';
import { Season } from '../types';

/**
 * Authentic Japanese Maple Leaf (Momiji / 紅葉 - Acer Palmatum)
 * Features 7 deeply divided serrated lobes, primary/secondary leaf veins, and slender petiole stalk.
 */
export const MapleLeafMomijiIcon: React.FC<{ className?: string; strokeWidth?: number }> = ({
  className = 'w-4 h-4',
}) => (
  <svg
    viewBox="0 0 48 48"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="0.5"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Momiji Leaf 7-lobed silhouette with sharp characteristic Japanese serrations */}
    <path
      d="M24 3
         C24.8 5.2 26.2 7 27.5 8.8
         L30.2 7.2
         C29.6 9.8 30.5 11.2 32.5 12
         L35.5 11.2
         C34.2 13.5 35 15.2 37.2 16.5
         L40.5 16.2
         C38.8 18.5 39.2 20.8 41.5 22.5
         L44 23
         C41.2 25.5 40.5 27.8 42 30.8
         C38.8 30.2 36.5 31.8 35.2 34.5
         C34.2 32 32.5 31.2 29.8 31.8
         C29.2 33.5 28.5 35.8 28.2 38
         L25.8 38
         C25.8 40.5 26.2 43 26.8 45.5
         L21.2 45.5
         C21.8 43 22.2 40.5 22.2 38
         L19.8 38
         C19.5 35.8 18.8 33.5 18.2 31.8
         C15.5 31.2 13.8 32 12.8 34.5
         C11.5 31.8 9.2 30.2 6 30.8
         C7.5 27.8 6.8 25.5 4 23
         L6.5 22.5
         C8.8 20.8 9.2 18.5 7.5 16.2
         L10.8 16.5
         C13 15.2 13.8 13.5 12.5 11.2
         L15.5 12
         C17.5 11.2 18.4 9.8 17.8 7.2
         L20.5 8.8
         C21.8 7 23.2 5.2 24 3 Z"
    />
    {/* Delicate internal leaf veins for depth and realism */}
    <path
      d="M24 38 L24 9 M24 28 L35 18 M24 28 L13 18 M24 32 L38 27 M24 32 L10 27 M24 20 L30 11 M24 20 L18 11"
      fill="none"
      stroke="rgba(0, 0, 0, 0.35)"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Traditional Japanese Cherry Blossom (Sakura / 桜)
 * Features 5 distinct rounded petals each with the iconic cleft/notch (v-cut) at the tip,
 * plus center pistil and delicate stamens.
 */
export const SakuraIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 48 48"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    {/* 5 Distinct Sakura Petals each with notched tips */}
    <g transform="translate(24, 24)">
      {[0, 72, 144, 216, 288].map((angle) => (
        <g key={angle} transform={`rotate(${angle})`}>
          <path
            d="M 0 -3
               C -5.5 -7 -10.5 -13 -8.5 -19
               C -6.8 -23.5 -2.2 -24 0 -20.8
               C 2.2 -24 6.8 -23.5 8.5 -19
               C 10.5 -13 5.5 -7 0 -3 Z"
          />
          {/* Subtle petal contour vein */}
          <path
            d="M 0 -4 L 0 -18"
            fill="none"
            stroke="rgba(0,0,0,0.18)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
        </g>
      ))}

      {/* Flower Center Core & Radiating Stamens (雄しべ) */}
      <circle cx="0" cy="0" r="4.2" fill="rgba(255, 255, 255, 0.45)" />
      <circle cx="0" cy="0" r="2.2" fill="rgba(0, 0, 0, 0.25)" />
      {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
        <g key={`stamen-${deg}`} transform={`rotate(${deg})`}>
          <line x1="0" y1="-2" x2="0" y2="-6.5" stroke="rgba(255, 255, 255, 0.65)" strokeWidth="0.8" strokeLinecap="round" />
          <circle cx="0" cy="-7" r="0.9" fill="rgba(255, 255, 255, 0.85)" />
        </g>
      ))}
    </g>
  </svg>
);

/**
 * Japanese Summer Sun & Festival Fireworks (Taiyou & Hanabi / 太陽 & 花火)
 * Intricate fusion of radiant summer sunburst and festive hanabi fireworks sparkles.
 */
export const SunHanabiIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 48 48"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <g transform="translate(24, 24)">
      {/* Central Radiant Sun Core */}
      <circle cx="0" cy="0" r="7.5" />
      <circle cx="0" cy="0" r="4" fill="rgba(255, 255, 255, 0.45)" />

      {/* 8 Primary Solar Crown Flares */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <g key={`primary-flare-${deg}`} transform={`rotate(${deg})`}>
          <path
            d="M -2.2 -9 L 0 -22 L 2.2 -9 Z"
          />
          {/* Hanabi Firework Sparkle Star at tip of each primary ray */}
          <circle cx="0" cy="-22.5" r="1.4" fill="currentColor" />
        </g>
      ))}

      {/* 8 Secondary Hanabi Firework Spark Rays with dual bursts */}
      {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((deg) => (
        <g key={`secondary-spark-${deg}`} transform={`rotate(${deg})`}>
          <line
            x1="0"
            y1="-8.5"
            x2="0"
            y2="-17.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="-2.2" cy="-15" r="1.1" fill="currentColor" />
          <circle cx="2.2" cy="-15" r="1.1" fill="currentColor" />
          <circle cx="0" cy="-18" r="1.3" fill="currentColor" />
        </g>
      ))}

      {/* Inner Hanabi shimmer points */}
      {[0, 90, 180, 270].map((deg) => (
        <circle key={`inner-shimmer-${deg}`} cx={Math.cos((deg * Math.PI) / 180) * 11} cy={Math.sin((deg * Math.PI) / 180) * 11} r="0.9" fill="rgba(255,255,255,0.7)" />
      ))}
    </g>
  </svg>
);

/**
 * Winter Ice Crystal Snowflake (Yuki no Kesshou / 雪の結晶)
 */
export const SnowflakeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
    {/* Crystal Branch Notches */}
    <path d="M7 10 L5 12 L7 14" />
    <path d="M17 10 L19 12 L17 14" />
    <path d="M10 7 L12 5 L14 7" />
    <path d="M10 17 L12 19 L14 17" />
    <path d="M7.5 5.5 L6.5 7.5 L8.5 8.5" />
    <path d="M16.5 18.5 L17.5 16.5 L15.5 15.5" />
    <path d="M18.5 7.5 L16.5 6.5 L15.5 8.5" />
    <path d="M5.5 16.5 L7.5 17.5 L8.5 15.5" />
  </svg>
);

/**
 * Unified seasonal icon dispatcher
 */
export const SeasonAtmosphericIcon: React.FC<{
  season: Season;
  className?: string;
}> = ({ season, className = 'w-4 h-4' }) => {
  switch (season) {
    case 'WINTER':
      return <SnowflakeIcon className={className} />;
    case 'SPRING':
      return <SakuraIcon className={className} />;
    case 'SUMMER':
      return <SunHanabiIcon className={className} />;
    case 'FALL':
      return <MapleLeafMomijiIcon className={className} />;
  }
};
