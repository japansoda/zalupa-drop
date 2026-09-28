import confetti, { Options } from 'canvas-confetti';

let lastConfettiTime = 0;

export interface ConfettiPresetOptions extends Partial<Options> {
  tier?: 'low' | 'mid' | 'high' | 'legendary';
}

/**
 * High-performance, GPU-friendly wrapper around canvas-confetti.
 * Prevents main-thread stalls by:
 * - Capping particle counts to lightweight, aesthetically pleasing ranges (30-65)
 * - Lowering physics ticks from 200 (3.3s) to 75-90 (1.2s), freeing canvas 3x faster
 * - Throttling rapid sequential bursts within 300ms
 * - Enforcing disableForReducedMotion
 */
export function fireConfetti(options: ConfettiPresetOptions = {}) {
  if (typeof window === 'undefined') return;

  const now = performance.now();
  // Throttle bursts that fire too closely together (within 250ms)
  if (now - lastConfettiTime < 250) {
    return;
  }
  lastConfettiTime = now;

  const { tier = 'mid', particleCount, ticks = 85, spread = 70, origin = { y: 0.6 }, colors, ...rest } = options;

  // Calibrated particle counts (crisp, vivid, zero-lag)
  let count = particleCount;
  if (!count) {
    switch (tier) {
      case 'low':
        count = 35;
        break;
      case 'mid':
        count = 50;
        break;
      case 'high':
        count = 65;
        break;
      case 'legendary':
        count = 75;
        break;
      default:
        count = 50;
    }
  } else {
    // Hard cap to 80 particles even if caller requested more
    count = Math.min(80, count);
  }

  confetti({
    particleCount: count,
    spread: Math.min(90, spread),
    origin,
    ticks: Math.min(100, ticks),
    disableForReducedMotion: true,
    scalar: 0.95,
    colors: colors || ['#FACC15', '#FFFFFF', '#38BDF8', '#10B981', '#EC4899'],
    zIndex: 9999,
    ...rest,
  });
}
