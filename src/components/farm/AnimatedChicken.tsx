'use client';

import React from 'react';
import { ChickenBreedId, CHICKEN_BREEDS } from '../../lib/farm';

interface AnimatedChickenProps {
  breedId: ChickenBreedId;
  isHungry?: boolean;
  isEating?: boolean;
  isLaying?: boolean;
  className?: string;
  size?: number;
}

export const AnimatedChicken: React.FC<AnimatedChickenProps> = ({
  breedId,
  isHungry = false,
  isEating = false,
  isLaying = false,
  className = '',
  size = 140,
}) => {
  const breed = CHICKEN_BREEDS[breedId] || CHICKEN_BREEDS.white_inferno;

  // Custom visual theme based on breed
  const isGold = breedId === 'golden_nugget';
  const isCyber = breedId === 'cyber_neon';
  const isBlaze = breedId === 'blaze_phoenix';
  const isGhost = breedId === 'ghost_fade';
  const isZombie = breedId === 'toxic_zombie';
  const isBrown = breedId === 'brown_rooster';

  // Body color
  let bodyFill = '#f8fafc';
  let bodyShadow = '#cbd5e1';
  let combFill = '#ef4444';
  let beakFill = '#f59e0b';
  let eyeFill = '#0f172a';
  let pupilHighlight = '#ffffff';

  if (isBrown) {
    bodyFill = '#92400e';
    bodyShadow = '#78350f';
    combFill = '#dc2626';
    beakFill = '#fbbf24';
  } else if (isZombie) {
    bodyFill = '#365314';
    bodyShadow = '#1a2e05';
    combFill = '#65a30d';
    beakFill = '#a3e635';
    eyeFill = '#bef264';
  } else if (isCyber) {
    bodyFill = '#0f172a';
    bodyShadow = '#020617';
    combFill = '#06b6d4';
    beakFill = '#38bdf8';
    eyeFill = '#06b6d4';
  } else if (isBlaze) {
    bodyFill = 'url(#blazeBodyGrad)';
    bodyShadow = '#7f1d1d';
    combFill = '#f97316';
    beakFill = '#fbbf24';
    eyeFill = '#ffedd5';
  } else if (isGhost) {
    bodyFill = 'url(#ghostFadeGrad)';
    bodyShadow = '#4c1d95';
    combFill = '#ec4899';
    beakFill = '#a855f7';
    eyeFill = '#ffffff';
  } else if (isGold) {
    bodyFill = 'url(#goldRoosterGrad)';
    bodyShadow = '#854d0e';
    combFill = '#ca8a04';
    beakFill = '#fef08a';
    eyeFill = '#422006';
  }

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className} ${
        isEating ? 'animate-bounce' : isLaying ? 'animate-pulse' : ''
      }`}
      style={{ width: size, height: size }}
    >
      <style jsx>{`
        @keyframes chickenIdleBob {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-4px) rotate(1deg);
          }
        }
        @keyframes chickenWingFlap {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(-6deg) translateY(-2px);
          }
        }
        @keyframes chickenCombWiggle {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(3deg);
          }
        }
        @keyframes chickenEyeBlink {
          0%, 92%, 100% {
            transform: scaleY(1);
          }
          96% {
            transform: scaleY(0.1);
          }
        }
        @keyframes auraGlow {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.08);
          }
        }
        .chicken-body-motion {
          animation: chickenIdleBob 2.4s ease-in-out infinite;
          transform-origin: 50% 80%;
        }
        .chicken-wing-motion {
          animation: chickenWingFlap 1.8s ease-in-out infinite;
          transform-origin: 35% 45%;
        }
        .chicken-comb-motion {
          animation: chickenCombWiggle 2.8s ease-in-out infinite;
          transform-origin: 65% 30%;
        }
        .chicken-eye-motion {
          animation: chickenEyeBlink 3.6s infinite;
          transform-origin: 75% 42%;
        }
        .chicken-aura {
          animation: auraGlow 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* Ambient Rarity Glow Behind Chicken */}
      <div
        className="chicken-aura absolute inset-2 rounded-full blur-xl pointer-events-none -z-10"
        style={{
          background: `radial-gradient(circle, ${breed.color}40 0%, transparent 70%)`,
        }}
      />

      <svg
        viewBox="0 0 120 120"
        className="w-full h-full filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gold Gradient */}
          <linearGradient id="goldRoosterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#facc15" />
            <stop offset="70%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>

          {/* Blaze Fire Gradient */}
          <linearGradient id="blazeBodyGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b91c1c" />
            <stop offset="45%" stopColor="#ea580c" />
            <stop offset="80%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fde047" />
          </linearGradient>

          {/* Ghost / CS2 Fade Gradient */}
          <linearGradient id="ghostFadeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="40%" stopColor="#ec4899" />
            <stop offset="75%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          {/* Cyber Circuit Pattern */}
          {isCyber && (
            <linearGradient id="cyberWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          )}
        </defs>

        {/* Straw / Nest Platform Beneath */}
        <g id="straw-nest">
          <ellipse cx="60" cy="102" rx="42" ry="10" fill="#78350f" opacity="0.6" />
          <ellipse cx="60" cy="101" rx="38" ry="7" fill="#ca8a04" opacity="0.8" />
          {/* Individual straw stalks */}
          <path d="M 28 100 Q 38 106 50 102" stroke="#fde047" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 45 102 Q 62 108 80 101" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 72 101 Q 88 105 95 99" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 35 104 Q 58 109 78 104" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Feet / Claws */}
        <g id="chicken-feet">
          <path d="M 46 92 L 46 100 M 46 100 L 40 103 M 46 100 L 46 104 M 46 100 L 52 103" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 68 92 L 68 100 M 68 100 L 62 103 M 68 100 L 68 104 M 68 100 L 74 103" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Main Body Animated Group */}
        <g className="chicken-body-motion">
          {/* Tail Feathers */}
          <g id="chicken-tail">
            <path
              d="M 22 62 C 12 50 16 34 28 38 C 22 46 26 56 34 60 Z"
              fill={bodyShadow}
            />
            <path
              d="M 28 66 C 16 58 18 42 32 44 C 28 52 32 60 40 64 Z"
              fill={bodyFill}
            />
            {isBlaze && (
              <path
                d="M 18 44 Q 10 32 20 28 Q 24 38 28 42 Z"
                fill="#fde047"
                opacity="0.9"
              />
            )}
          </g>

          {/* Plump Chicken Body */}
          <path
            d="M 32 68 C 30 50 44 42 62 42 C 84 42 96 52 94 72 C 92 88 78 96 58 96 C 40 96 32 84 32 68 Z"
            fill={bodyFill}
          />
          {/* Subtle Belly Shadow */}
          <path
            d="M 36 74 C 42 88 56 94 74 92 C 86 86 92 78 93 72 C 86 88 64 96 42 86 Z"
            fill={bodyShadow}
            opacity="0.4"
          />

          {/* Head & Neck */}
          <path
            d="M 66 52 C 66 38 74 28 84 28 C 94 28 98 38 96 50 C 90 56 80 58 66 52 Z"
            fill={bodyFill}
          />

          {/* Comb (Гребешок) */}
          <g className="chicken-comb-motion">
            <path
              d="M 76 28 C 74 20 80 18 82 22 C 84 16 90 16 90 22 C 94 18 98 20 96 28 Z"
              fill={combFill}
            />
            {/* Golden Crown for Golden Nugget */}
            {isGold && (
              <g id="golden-crown" transform="translate(76, 8)">
                <polygon points="0,12 5,2 10,8 15,2 20,12" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
                <circle cx="5" cy="2" r="1.5" fill="#38bdf8" />
                <circle cx="10" cy="8" r="1.5" fill="#f43f5e" />
                <circle cx="15" cy="2" r="1.5" fill="#38bdf8" />
              </g>
            )}
          </g>

          {/* Wattle (Бородка под клювом) */}
          <path
            d="M 92 48 C 96 50 96 56 93 58 C 90 56 90 52 92 48 Z"
            fill={combFill}
          />

          {/* Beak (Клюв) */}
          <polygon
            points="94,42 108,46 94,50"
            fill={beakFill}
            stroke="#b45309"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Eye */}
          <g className="chicken-eye-motion">
            {isCyber ? (
              // Cyberpunk Visor
              <rect x="80" y="36" width="16" height="6" rx="2" fill="#06b6d4" stroke="#ec4899" strokeWidth="1">
                <animate attributeName="opacity" values="0.8;1;0.8" dur="1s" repeatCount="indefinite" />
              </rect>
            ) : isZombie ? (
              // Glowing Toxic Radioactive Eye
              <g>
                <circle cx="85" cy="38" r="4.5" fill="#14532d" />
                <circle cx="85" cy="38" r="3" fill="#a3e635" />
                <circle cx="85" cy="38" r="1.5" fill="#ffffff" />
              </g>
            ) : isGold ? (
              // Cool Shades or Royal Diamond Eye
              <g>
                <circle cx="85" cy="38" r="4" fill="#422006" />
                <circle cx="86" cy="37" r="1.5" fill="#ffffff" />
                <polygon points="85,34 87,38 85,42 83,38" fill="#fef08a" opacity="0.8" />
              </g>
            ) : (
              // Classic Cute CS2 Eye
              <g>
                <circle cx="85" cy="38" r="3.8" fill={eyeFill} />
                <circle cx="86.2" cy="36.8" r="1.4" fill={pupilHighlight} />
                <circle cx="84" cy="39" r="0.7" fill={pupilHighlight} />
              </g>
            )}
          </g>

          {/* Wing with Flap Animation */}
          <g className="chicken-wing-motion">
            <path
              d="M 44 58 C 42 54 52 50 64 54 C 74 58 76 72 70 78 C 60 84 46 80 44 70 Z"
              fill={isCyber ? 'url(#cyberWingGrad)' : bodyShadow}
              stroke={isCyber ? '#06b6d4' : 'none'}
              strokeWidth={isCyber ? 1.5 : 0}
            />
            {/* Wing Feather Detail */}
            <path
              d="M 48 64 C 54 60 62 62 66 68 M 52 70 C 58 68 64 70 66 74"
              stroke={bodyFill}
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.8"
            />
          </g>

          {/* Cybernetic Details */}
          {isCyber && (
            <g id="cyber-circuits">
              <path d="M 64 48 L 72 44 L 80 48" stroke="#ec4899" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              <circle cx="80" cy="48" r="1.5" fill="#06b6d4" />
            </g>
          )}

          {/* Blaze Flame Wisps */}
          {isBlaze && (
            <g id="flame-wisps">
              <path d="M 52 46 Q 58 36 62 42" stroke="#fde047" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <path d="M 40 54 Q 32 44 42 46" stroke="#fb923c" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            </g>
          )}
        </g>
      </svg>

      {/* Hungry Alert Bubble */}
      {isHungry && (
        <div className="absolute -top-3 -right-2 bg-amber-500 text-black font-black text-[10px] px-2 py-0.5 rounded-full shadow-lg border border-amber-300 animate-bounce">
          🌽 Корм!
        </div>
      )}

      {/* Ready Egg Indicator */}
      {isLaying && (
        <div className="absolute -bottom-2 bg-yellow-400 text-black font-black text-[10px] px-2 py-0.5 rounded-full shadow-xl border border-yellow-200 animate-pulse">
          🥚 Яйцо готово!
        </div>
      )}
    </div>
  );
};
