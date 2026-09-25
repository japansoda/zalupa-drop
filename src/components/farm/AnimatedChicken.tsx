'use client';

import React from 'react';
import { Clover, Sparkles, Heart } from 'lucide-react';
import { ChickenBreedId, CHICKEN_BREEDS } from '../../lib/farm';
import { BreedEgg } from './BreedEgg';

interface AnimatedChickenProps {
  breedId: ChickenBreedId;
  isHungry?: boolean;
  isEating?: boolean;
  isLaying?: boolean;
  isStatTrak?: boolean;
  hasLuckPotion?: boolean;
  eggsLaidCount?: number;
  className?: string;
  size?: number;
}

export const AnimatedChicken: React.FC<AnimatedChickenProps> = ({
  breedId,
  isHungry = false,
  isEating = false,
  isLaying = false,
  isStatTrak = false,
  hasLuckPotion = false,
  eggsLaidCount = 0,
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
  const isAsiimov = breedId === 'asiimov';
  const isCaseHardened = breedId === 'case_hardened';
  const isPrintstream = breedId === 'printstream';
  const isDragon = breedId === 'dragon_lore';
  const isHowl = breedId === 'howl';

  // Body colors
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
  } else if (isAsiimov) {
    bodyFill = '#ffffff';
    bodyShadow = '#27272a';
    combFill = '#f97316';
    beakFill = '#18181b';
    eyeFill = '#38bdf8';
  } else if (isCaseHardened) {
    bodyFill = 'url(#caseHardenedChickenGrad)';
    bodyShadow = '#0369a1';
    combFill = '#eab308';
    beakFill = '#facc15';
    eyeFill = '#38bdf8';
  } else if (isPrintstream) {
    bodyFill = 'url(#printstreamChickenGrad)';
    bodyShadow = '#cbd5e1';
    combFill = '#0f172a';
    beakFill = '#1e293b';
    eyeFill = '#ec4899';
  } else if (isDragon) {
    bodyFill = 'url(#dragonLoreChickenGrad)';
    bodyShadow = '#166534';
    combFill = '#ca8a04';
    beakFill = '#facc15';
    eyeFill = '#22c55e';
  } else if (isHowl) {
    bodyFill = 'url(#howlChickenGrad)';
    bodyShadow = '#18181b';
    combFill = '#ef4444';
    beakFill = '#f97316';
    eyeFill = '#fde047';
  }

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className} ${
        isEating && !isLaying ? 'animate-bounce' : ''
      }`}
      style={{ width: size, height: size }}
    >
      <style jsx>{`
        @keyframes chickenIdleBob {
          0%, 100% {
            transform: translate3d(0, 0px, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(0, -4px, 0) rotate(1deg);
          }
        }
        @keyframes chickenNestingBob {
          0%, 100% {
            transform: translate3d(0, 2px, 0) scale(1.02, 0.98);
          }
          50% {
            transform: translate3d(0, 4px, 0) scale(1.04, 0.96);
          }
        }
        @keyframes chickenWingFlap {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(-6deg) translate3d(0, -2px, 0);
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
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            opacity: 0.9;
            transform: translate3d(0, 0, 0) scale(1.08);
          }
        }
        @keyframes floatLayingHeart {
          0% {
            opacity: 0;
            transform: translate3d(0, 0px, 0) scale(0.6);
          }
          40% {
            opacity: 1;
            transform: translate3d(0, -10px, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate3d(0, -24px, 0) scale(0.8);
          }
        }
        @keyframes cloverFloat {
          0%, 100% {
            transform: translate3d(0, 0px, 0) rotate(0deg) scale(0.9);
            opacity: 0.75;
          }
          50% {
            transform: translate3d(0, -8px, 0) rotate(18deg) scale(1.1);
            opacity: 1;
          }
        }
        .chicken-body-motion {
          animation: ${isLaying ? 'chickenNestingBob 3.2s ease-in-out infinite' : 'chickenIdleBob 2.4s ease-in-out infinite'};
          transform-origin: 50% 80%;
          will-change: transform;
        }
        .chicken-wing-motion {
          animation: chickenWingFlap 1.8s ease-in-out infinite;
          transform-origin: 35% 45%;
          will-change: transform;
        }
        .chicken-comb-motion {
          animation: chickenCombWiggle 2.8s ease-in-out infinite;
          transform-origin: 65% 30%;
          will-change: transform;
        }
        .chicken-eye-motion {
          animation: chickenEyeBlink 3.6s infinite;
          transform-origin: 75% 42%;
        }
        .chicken-aura {
          animation: auraGlow 2.5s ease-in-out infinite;
          will-change: transform, opacity;
        }
        .laying-particle-1 {
          animation: floatLayingHeart 2.5s ease-out infinite;
          will-change: transform, opacity;
        }
        .laying-particle-2 {
          animation: floatLayingHeart 2.5s ease-out infinite 1.25s;
          will-change: transform, opacity;
        }
        .clover-p1 {
          animation: cloverFloat 2.6s ease-in-out infinite;
          will-change: transform, opacity;
        }
        .clover-p2 {
          animation: cloverFloat 3.1s ease-in-out infinite 1.3s;
          will-change: transform, opacity;
        }
      `}</style>

      {/* Ambient Rarity & Luck Glow Behind Chicken */}
      <div
        className="chicken-aura absolute inset-2 rounded-full blur-xl pointer-events-none -z-10"
        style={{
          background: hasLuckPotion
            ? `radial-gradient(circle, rgba(34,197,94,0.6) 0%, ${breed.color}35 45%, transparent 75%)`
            : `radial-gradient(circle, ${breed.color}45 0%, transparent 70%)`,
        }}
      />

      {/* Floating Clovers when Luck Potion is Active */}
      {hasLuckPotion && (
        <>
          <div className="clover-p1 absolute -top-2 left-6 pointer-events-none z-20 select-none text-emerald-400 filter drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">
            <Clover className="w-4 h-4 fill-emerald-400/30" />
          </div>
          <div className="clover-p2 absolute top-1 right-5 pointer-events-none z-20 select-none text-emerald-300 filter drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">
            <Clover className="w-3.5 h-3.5 fill-emerald-300/30" />
          </div>
        </>
      )}

      {/* Floating Sparkles / Hearts during Egg Laying */}
      {isLaying && (
        <>
          <div className="laying-particle-1 absolute -top-1 left-8 text-amber-400 pointer-events-none z-20">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="laying-particle-2 absolute 0 right-8 text-yellow-300 pointer-events-none z-20">
            <Heart className="w-3 h-3 fill-yellow-400/40 text-yellow-300" />
          </div>
        </>
      )}

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

          {/* Case Hardened Blue Gem */}
          <linearGradient id="caseHardenedChickenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="40%" stopColor="#0284c7" />
            <stop offset="75%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>

          {/* Printstream Monochrome */}
          <linearGradient id="printstreamChickenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>

          {/* Dragon Lore Gold / Green */}
          <linearGradient id="dragonLoreChickenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="30%" stopColor="#ca8a04" />
            <stop offset="70%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>

          {/* Howl Wolf Beast */}
          <linearGradient id="howlChickenGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#18181b" />
            <stop offset="40%" stopColor="#b91c1c" />
            <stop offset="80%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fde047" />
          </linearGradient>
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
        {!isLaying && (
          <g id="chicken-feet">
            <path d="M 46 92 L 46 100 M 46 100 L 40 103 M 46 100 L 46 104 M 46 100 L 52 103" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 68 92 L 68 100 M 68 100 L 62 103 M 68 100 L 68 104 M 68 100 L 74 103" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

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
            {isHowl && (
              <path
                d="M 16 46 Q 8 30 22 26 Q 24 38 28 42 Z"
                fill="#ea580c"
                opacity="0.95"
              />
            )}
          </g>

          {/* Plump Chicken Body */}
          <path
            d="M 32 68 C 30 50 44 42 62 42 C 84 42 96 52 94 72 C 92 88 78 96 58 96 C 40 96 32 84 32 68 Z"
            fill={bodyFill}
          />

          {/* Breed-Specific Body Decals */}
          {isAsiimov && (
            <g>
              <polygon points="38,55 88,55 82,65 42,65" fill="#18181b" />
              <polygon points="44,57 82,57 78,63 48,63" fill="#f97316" />
              <circle cx="56" cy="74" r="5" stroke="#f97316" strokeWidth="1.5" fill="none" />
            </g>
          )}

          {isPrintstream && (
            <g opacity="0.8">
              <rect x="42" y="60" width="2" height="10" fill="#0f172a" />
              <rect x="46" y="60" width="1" height="10" fill="#0f172a" />
              <rect x="49" y="60" width="2" height="10" fill="#0f172a" />
              <text x="56" y="68" fill="#0f172a" fontSize="7" fontWeight="bold" fontFamily="monospace">XX</text>
            </g>
          )}

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

          {/* Crown on Golden Nugget */}
          {isGold && (
            <g id="rooster-crown">
              <polygon points="76,26 80,16 84,22 88,14 92,22 96,16 100,26" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
              <circle cx="80" cy="16" r="1.5" fill="#ffffff" />
              <circle cx="88" cy="14" r="1.5" fill="#ffffff" />
              <circle cx="96" cy="16" r="1.5" fill="#ffffff" />
            </g>
          )}

          {/* Red Comb on Head */}
          <g id="chicken-comb" className="chicken-comb-motion">
            <path
              d="M 76 28 C 76 20 82 18 84 22 C 86 16 92 18 92 24 C 94 20 98 22 96 28 Z"
              fill={combFill}
            />
          </g>

          {/* Wattle under beak */}
          <g id="chicken-wattle">
            <path
              d="M 94 48 C 96 54 92 60 88 58 C 86 52 90 48 94 48 Z"
              fill={combFill}
            />
          </g>

          {/* Beak */}
          <polygon
            points="94,42 108,46 94,50"
            fill={beakFill}
            filter="drop-shadow(0 2px 2px rgba(0,0,0,0.3))"
          />

          {/* Eye */}
          <g id="chicken-eye" className="chicken-eye-motion">
            {isLaying ? (
              // Relaxed happy eye curve when laying an egg
              <path d="M 80 43 Q 84 39 88 43" stroke={eyeFill} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            ) : (
              <>
                <circle cx="84" cy="42" r="5" fill={eyeFill} />
                <circle cx="86" cy="40" r="1.8" fill={pupilHighlight} />
                {isZombie && <circle cx="84" cy="42" r="7" stroke="#84cc16" strokeWidth="1.5" opacity="0.6" />}
                {isCyber && <rect x="79" y="38" width="10" height="7" rx="1.5" fill="#06b6d4" opacity="0.8" />}
              </>
            )}
          </g>

          {/* Wing */}
          <g id="chicken-wing" className="chicken-wing-motion">
            <path
              d="M 44 60 C 44 52 56 50 68 56 C 76 60 78 72 74 78 C 66 86 48 82 44 72 Z"
              fill={bodyShadow}
              opacity="0.85"
            />
            <path
              d="M 46 62 C 46 56 56 54 66 58 C 72 62 74 70 70 76 C 62 82 48 78 46 70 Z"
              fill={bodyFill}
            />
          </g>
        </g>
      </svg>

      {/* Visible Breed Egg nestled during incubation / laying */}
      {isLaying && (
        <div className="absolute bottom-2 left-6 z-10 transition-transform scale-90 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
          <BreedEgg breedId={breedId} size={34} glowing={false} />
        </div>
      )}

      {/* CS2 StatTrak™ Digital Counter LED Box */}
      {isStatTrak && (
        <div className="absolute -bottom-2.5 z-30 px-3 py-1 rounded-md bg-black/95 border-[1.5px] border-amber-500 shadow-[0_0_16px_rgba(245,158,11,0.7)] flex items-center gap-1.5 pointer-events-none select-none">
          <span className="text-[10px] font-black text-amber-500 font-mono tracking-tight">ST™</span>
          <span className="text-[13px] font-black text-amber-400 font-mono tracking-widest leading-none">
            {String(eggsLaidCount || 0).padStart(6, '0')}
          </span>
        </div>
      )}
    </div>
  );
};
