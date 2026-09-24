'use client';

import React from 'react';
import { ChickenBreedId, CHICKEN_BREEDS } from '../../lib/farm';

interface BreedEggProps {
  breedId: ChickenBreedId;
  size?: number;
  crackStage?: 0 | 1 | 2 | 3;
  glowing?: boolean;
  className?: string;
}

export const BreedEgg: React.FC<BreedEggProps> = ({
  breedId,
  size = 120,
  crackStage = 0,
  glowing = true,
  className = '',
}) => {
  const breed = CHICKEN_BREEDS[breedId] || CHICKEN_BREEDS.white_inferno;
  const pattern = breed.eggPattern || 'porcelain';

  // Unique SVG IDs per breed
  const maskId = `egg-mask-${breedId}`;
  const baseGradId = `egg-base-grad-${breedId}`;
  const highlightGradId = `egg-highlight-grad-${breedId}`;
  const shadowGradId = `egg-shadow-grad-${breedId}`;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: Math.round(size * 1.25) }}
    >
      {/* Outer Ambient Glow */}
      {glowing && (
        <div
          className="absolute inset-0 rounded-full blur-xl pointer-events-none opacity-80 animate-pulse transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle, ${breed.eggGlowColor} 0%, transparent 72%)`,
          }}
        />
      )}

      <svg
        viewBox="0 0 100 125"
        className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Egg Shape Clip Path */}
          <clipPath id={maskId}>
            <path d="M 50 8 C 76 8 93 38 93 68 C 93 94 74 116 50 116 C 26 116 7 94 7 68 C 7 38 24 8 50 8 Z" />
          </clipPath>

          {/* 3D Specular Highlight */}
          <radialGradient id={highlightGradId} cx="36%" cy="32%" r="45%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          {/* 3D Bottom Shadow */}
          <linearGradient id={shadowGradId} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="60%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.65" />
          </linearGradient>

          {/* ── Pattern-Specific Gradients ── */}

          {/* 1. White Inferno Porcelain */}
          <linearGradient id={`${baseGradId}-porcelain`} x1="20%" y1="10%" x2="80%" y2="90%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>

          {/* 2. Speckled Farm */}
          <linearGradient id={`${baseGradId}-speckled`} x1="20%" y1="10%" x2="80%" y2="90%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>

          {/* 3. Toxic Biohazard */}
          <linearGradient id={`${baseGradId}-toxic`} x1="10%" y1="10%" x2="90%" y2="90%">
            <stop offset="0%" stopColor="#bef264" />
            <stop offset="45%" stopColor="#65a30d" />
            <stop offset="100%" stopColor="#1a2e05" />
          </linearGradient>

          {/* 4. Cyber Matrix */}
          <linearGradient id={`${baseGradId}-cyber`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="40%" stopColor="#1e293b" />
            <stop offset="80%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>

          {/* 5. Asiimov High-Tech */}
          <linearGradient id={`${baseGradId}-asiimov`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#e4e4e7" />
            <stop offset="100%" stopColor="#a1a1aa" />
          </linearGradient>

          {/* 6. Case Hardened Blue Gem */}
          <linearGradient id={`${baseGradId}-case_hardened`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="35%" stopColor="#0284c7" />
            <stop offset="65%" stopColor="#0369a1" />
            <stop offset="85%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>

          {/* 7. Blaze Phoenix Magma */}
          <linearGradient id={`${baseGradId}-magma`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="30%" stopColor="#f97316" />
            <stop offset="70%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>

          {/* 8. Printstream Holographic */}
          <linearGradient id={`${baseGradId}-printstream`} x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#f1f5f9" />
            <stop offset="75%" stopColor="#fce7f3" />
            <stop offset="100%" stopColor="#e0e7ff" />
          </linearGradient>

          {/* 9. Ghost Fade */}
          <linearGradient id={`${baseGradId}-fade`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="35%" stopColor="#ec4899" />
            <stop offset="70%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          {/* 10. Golden Nugget */}
          <linearGradient id={`${baseGradId}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="25%" stopColor="#facc15" />
            <stop offset="60%" stopColor="#eab308" />
            <stop offset="85%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>

          {/* 11. Dragon Lore */}
          <linearGradient id={`${baseGradId}-dragon`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#ca8a04" />
            <stop offset="70%" stopColor="#4d7c0f" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>

          {/* 12. Howl Wolf Beast */}
          <linearGradient id={`${baseGradId}-howl`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#09090b" />
            <stop offset="30%" stopColor="#450a0a" />
            <stop offset="60%" stopColor="#dc2626" />
            <stop offset="85%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fde047" />
          </linearGradient>
        </defs>

        {/* ── Main Clipped Egg Shell Body ── */}
        <g clipPath={`url(#${maskId})`}>
          {/* Base Background Fill */}
          <rect width="100" height="125" fill={`url(#${baseGradId}-${pattern})`} />

          {/* ── BREED TEXTURE PATTERNS ── */}

          {/* Pattern: White Inferno */}
          {pattern === 'porcelain' && (
            <g opacity="0.35">
              <path d="M 50 35 C 55 45 65 52 70 65" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 45 42 C 40 50 35 60 38 75" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              <circle cx="50" cy="55" r="3" fill="#ef4444" />
            </g>
          )}

          {/* Pattern: Speckled Brown Rooster */}
          {pattern === 'speckled' && (
            <g fill="#451a03" opacity="0.55">
              <circle cx="35" cy="40" r="2.5" />
              <circle cx="48" cy="32" r="1.8" />
              <circle cx="62" cy="45" r="3.2" />
              <circle cx="30" cy="65" r="3" />
              <circle cx="52" cy="70" r="2.2" />
              <circle cx="68" cy="68" r="2.8" />
              <circle cx="42" cy="88" r="3.5" />
              <circle cx="58" cy="92" r="2" />
              <circle cx="75" cy="82" r="1.8" />
              <circle cx="25" cy="50" r="1.5" />
            </g>
          )}

          {/* Pattern: Toxic Biohazard */}
          {pattern === 'toxic' && (
            <g>
              <g stroke="#bef264" strokeWidth="2" opacity="0.6" strokeLinecap="round">
                <path d="M 50 25 Q 58 45 75 55" />
                <path d="M 50 25 Q 40 45 25 60" />
                <path d="M 50 70 Q 55 90 70 100" />
                <path d="M 48 68 Q 35 85 28 95" />
              </g>
              <circle cx="50" cy="55" r="12" fill="#bef264" opacity="0.25" />
              <circle cx="40" cy="75" r="7" fill="#84cc16" opacity="0.4" />
              <circle cx="65" cy="40" r="6" fill="#84cc16" opacity="0.4" />
              <circle cx="60" cy="85" r="5" fill="#bef264" opacity="0.3" />
            </g>
          )}

          {/* Pattern: Cyber Neon Matrix */}
          {pattern === 'cyber' && (
            <g stroke="#06b6d4" strokeWidth="1.8" opacity="0.8" strokeLinecap="round">
              <path d="M 25 45 L 45 45 L 55 35 L 75 35" />
              <path d="M 30 75 L 50 75 L 60 85 L 80 85" stroke="#ec4899" />
              <path d="M 45 45 L 45 65 L 50 75" />
              <circle cx="25" cy="45" r="2.5" fill="#06b6d4" />
              <circle cx="75" cy="35" r="2.5" fill="#06b6d4" />
              <circle cx="30" cy="75" r="2.5" fill="#ec4899" />
              <circle cx="80" cy="85" r="2.5" fill="#ec4899" />
            </g>
          )}

          {/* Pattern: Asiimov High-Tech */}
          {pattern === 'asiimov' && (
            <g>
              {/* Dark Gunmetal Panels */}
              <polygon points="10,25 90,25 85,42 15,42" fill="#18181b" />
              <polygon points="12,80 88,80 82,98 18,98" fill="#18181b" />
              {/* Bold Orange Racing Stripes */}
              <polygon points="20,28 80,28 75,38 25,38" fill="#f97316" />
              <polygon points="15,84 85,84 80,94 20,94" fill="#f97316" />
              {/* Sci-Fi Crosshair Targeting Decal */}
              <circle cx="50" cy="62" r="10" stroke="#f97316" strokeWidth="2.5" fill="none" />
              <line x1="50" y1="48" x2="50" y2="76" stroke="#f97316" strokeWidth="2" />
              <line x1="36" y1="62" x2="64" y2="62" stroke="#f97316" strokeWidth="2" />
              <circle cx="50" cy="62" r="3" fill="#18181b" />
            </g>
          )}

          {/* Pattern: Case Hardened Blue Gem */}
          {pattern === 'case_hardened' && (
            <g>
              {/* Iridescent Blue Swirls */}
              <path
                d="M 15 30 Q 40 15 65 35 Q 85 55 60 75 Q 35 95 20 70 Z"
                fill="#38bdf8"
                opacity="0.75"
              />
              <path
                d="M 45 45 Q 75 40 85 70 Q 95 100 65 105 Q 40 100 45 75 Z"
                fill="#0284c7"
                opacity="0.85"
              />
              {/* Golden Heated Steel Patina */}
              <path
                d="M 30 75 Q 50 65 65 80 Q 75 95 50 110 Q 25 105 30 75 Z"
                fill="#facc15"
                opacity="0.75"
              />
              <path
                d="M 60 20 Q 80 25 85 45 Q 70 55 55 35 Z"
                fill="#eab308"
                opacity="0.65"
              />
            </g>
          )}

          {/* Pattern: Blaze Phoenix Magma */}
          {pattern === 'magma' && (
            <g>
              {/* Blazing Cracks */}
              <path
                d="M 50 15 L 42 35 L 58 48 L 46 72 L 62 88 L 50 110"
                stroke="#fef08a"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="drop-shadow(0 0 4px #f97316)"
              />
              <path
                d="M 42 35 L 25 45 L 32 60"
                stroke="#f97316"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 58 48 L 78 55 L 70 70"
                stroke="#f97316"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 46 72 L 28 80"
                stroke="#ea580c"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* Pattern: Printstream Pearlescent & XX */}
          {pattern === 'printstream' && (
            <g>
              {/* Holographic Prismatic Sheen */}
              <path
                d="M 10 40 L 90 20 L 90 70 L 10 90 Z"
                fill="url(#ghostFadeGrad)"
                opacity="0.18"
              />
              {/* Minimalist Tech Barcode Decal */}
              <g fill="#0f172a" opacity="0.65">
                <rect x="25" y="48" width="3" height="18" />
                <rect x="31" y="48" width="1.5" height="18" />
                <rect x="35" y="48" width="4" height="18" />
                <rect x="41" y="48" width="1.5" height="18" />
                <rect x="45" y="48" width="2.5" height="18" />
              </g>
              {/* Iconic Printstream XX Decal */}
              <g stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" opacity="0.75">
                <line x1="60" y1="50" x2="68" y2="64" />
                <line x1="68" y1="50" x2="60" y2="64" />
                <line x1="72" y1="50" x2="80" y2="64" />
                <line x1="80" y1="50" x2="72" y2="64" />
              </g>
              <circle cx="50" cy="80" r="3" fill="#ec4899" opacity="0.7" />
            </g>
          )}

          {/* Pattern: Fade Gradient */}
          {pattern === 'fade' && (
            <g opacity="0.25">
              <ellipse cx="50" cy="65" rx="36" ry="46" fill="#ffffff" />
            </g>
          )}

          {/* Pattern: Golden Nugget 24K */}
          {pattern === 'gold' && (
            <g>
              {/* Gem Facet Highlights */}
              <polygon points="50,15 70,35 50,45 30,35" fill="#ffffff" opacity="0.45" />
              <polygon points="70,35 88,60 68,70 50,45" fill="#fef08a" opacity="0.3" />
              <polygon points="30,35 50,45 32,70 12,60" fill="#ca8a04" opacity="0.35" />
              <polygon points="50,45 68,70 50,105 32,70" fill="#ffffff" opacity="0.2" />
              {/* Star Sparkle Glints */}
              <path
                d="M 40 28 Q 40 34 46 34 Q 40 34 40 40 Q 40 34 34 34 Q 40 34 40 28 Z"
                fill="#ffffff"
                filter="drop-shadow(0 0 3px #ffffff)"
              />
              <path
                d="M 68 75 Q 68 79 72 79 Q 68 79 68 83 Q 68 79 64 79 Q 68 79 68 75 Z"
                fill="#ffffff"
                filter="drop-shadow(0 0 3px #ffffff)"
              />
            </g>
          )}

          {/* Pattern: Dragon Lore Royal Scales */}
          {pattern === 'dragon' && (
            <g>
              {/* Scaled Textures */}
              <path
                d="M 35 45 Q 50 35 65 45 Q 50 55 35 45 Z"
                fill="#fef08a"
                opacity="0.5"
              />
              <path
                d="M 25 65 Q 45 55 65 65 Q 45 75 25 65 Z"
                fill="#fef08a"
                opacity="0.4"
              />
              <path
                d="M 40 85 Q 60 75 80 85 Q 60 95 40 85 Z"
                fill="#fef08a"
                opacity="0.45"
              />
              {/* Fiery Celtic Dragon Breath */}
              <path
                d="M 50 25 Q 70 35 60 55 Q 50 75 75 85"
                stroke="#16a34a"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.6"
              />
              <circle cx="58" cy="40" r="3.5" fill="#facc15" />
            </g>
          )}

          {/* Pattern: Howl Beast */}
          {pattern === 'howl' && (
            <g>
              {/* Fierce Howl Wolf Beast Silhouette */}
              <path
                d="M 30 75 L 42 45 L 55 52 L 68 35 L 75 55 L 65 65 L 72 85 L 52 75 L 42 90 Z"
                fill="#ef4444"
                opacity="0.95"
                filter="drop-shadow(0 0 6px #ea580c)"
              />
              {/* Blazing Eye of the Wolf */}
              <circle cx="58" cy="48" r="3.5" fill="#fde047" />
              <circle cx="58" cy="48" r="1.5" fill="#ffffff" />
              {/* Rising Fiery Embers */}
              <circle cx="45" cy="30" r="1.8" fill="#f97316" />
              <circle cx="35" cy="48" r="2.2" fill="#fde047" />
              <circle cx="68" cy="25" r="1.5" fill="#ef4444" />
            </g>
          )}

          {/* 3D Curvature Shadow Overlay */}
          <rect width="100" height="125" fill={`url(#${shadowGradId})`} />

          {/* 3D Specular Highlight Overlay */}
          <ellipse
            cx="36"
            cy="36"
            rx="20"
            ry="28"
            fill={`url(#${highlightGradId})`}
            transform="rotate(-15 36 36)"
          />
        </g>

        {/* ── Outer Shell Rim Stroke ── */}
        <path
          d="M 50 8 C 76 8 93 38 93 68 C 93 94 74 116 50 116 C 26 116 7 94 7 68 C 7 38 24 8 50 8 Z"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.5"
          fill="none"
        />

        {/* ── PROCEDURAL CRACK STAGES OVERLAY ── */}

        {/* Crack Stage 1: Minor Hairline Fracture */}
        {crackStage >= 1 && (
          <g filter="drop-shadow(0 0 3px rgba(255,255,255,0.8))">
            <path
              d="M 50 20 L 45 35 L 54 48 L 48 62"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 45 35 L 35 42"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Crack Stage 2: Deep Radiant Fracture with Bursting Light */}
        {crackStage >= 2 && (
          <g>
            {/* Glowing Internal Energy Bleed */}
            <path
              d="M 50 12 L 42 32 L 56 46 L 44 65 L 60 82 L 48 105"
              stroke={breed.color}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
              filter="drop-shadow(0 0 8px #ffffff)"
            />
            {/* Sharp Inner White Core */}
            <path
              d="M 50 12 L 42 32 L 56 46 L 44 65 L 60 82 L 48 105"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Secondary Branch Cracks */}
            <path
              d="M 42 32 L 25 38 L 18 52"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M 56 46 L 75 42 L 85 58"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M 60 82 L 78 88"
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Crack Stage 3: Full Exploding Fissures */}
        {crackStage >= 3 && (
          <g>
            <circle cx="50" cy="60" r="28" fill="#ffffff" opacity="0.6" filter="blur(6px)" />
            <path
              d="M 15 55 L 85 65"
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
              filter="drop-shadow(0 0 10px #ffffff)"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
