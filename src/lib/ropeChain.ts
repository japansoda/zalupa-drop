/**
 * Tiny verlet rope for the grappling-hook chain.
 * Cheap by design: N small points, few iterations, caller writes ONE svg path
 * attribute per frame via ref (no React re-renders). Only transform-equivalent
 * DOM writes — no layout, no filters inside the loop.
 */

export interface RopePoint {
  x: number;
  y: number;
  px: number;
  py: number;
}

export function createRope(n: number, x = 0, y = 0): RopePoint[] {
  const pts: RopePoint[] = [];
  for (let i = 0; i < n; i++) pts.push({ x, y, px: x, py: y });
  return pts;
}

const DAMPING = 0.94;
const GRAVITY = 0.55;

/**
 * One physics step. A is pinned to (ax, ay), B is pinned to (bx, by).
 * Slack > 1 lets the chain sag a little like a real chain.
 */
export function stepRope(
  pts: RopePoint[],
  ax: number,
  ay: number,
  bx: number,
  by: number,
  slack = 1.04,
  iterations = 3
): void {
  const n = pts.length;
  if (n < 2) return;

  // Verlet integration (middle points only)
  for (let i = 1; i < n - 1; i++) {
    const p = pts[i];
    const vx = (p.x - p.px) * DAMPING;
    const vy = (p.y - p.py) * DAMPING;
    p.px = p.x;
    p.py = p.y;
    p.x += vx;
    p.y += vy + GRAVITY;
  }

  // Pin ends
  pts[0].x = ax;
  pts[0].y = ay;
  pts[n - 1].x = bx;
  pts[n - 1].y = by;

  // Relax constraints
  const dist = Math.hypot(bx - ax, by - ay);
  const segLen = Math.max(1, (dist * slack) / (n - 1));
  for (let k = 0; k < iterations; k++) {
    pts[0].x = ax;
    pts[0].y = ay;
    pts[n - 1].x = bx;
    pts[n - 1].y = by;
    for (let i = 0; i < n - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.0001;
      const diff = (d - segLen) / d;
      const aPinned = i === 0;
      const bPinned = i + 1 === n - 1;
      if (aPinned && bPinned) continue;
      if (aPinned) {
        b.x -= dx * diff;
        b.y -= dy * diff;
      } else if (bPinned) {
        a.x += dx * diff;
        a.y += dy * diff;
      } else {
        const f = diff * 0.5;
        a.x += dx * f;
        a.y += dy * f;
        b.x -= dx * f;
        b.y -= dy * f;
      }
    }
  }
}

/** Serialize rope points to an SVG path string. */
export function ropePath(pts: RopePoint[]): string {
  if (pts.length === 0) return '';
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  }
  return d;
}

/**
 * Free-falling half: first point pinned at (ax, ay), the rest dangle
 * under stronger gravity. Used for the snapped chain end on the arrow side.
 */
export function stepFree(pts: RopePoint[], ax: number, ay: number, gravity = 1.4): void {
  const n = pts.length;
  if (n < 2) return;
  for (let i = 1; i < n; i++) {
    const p = pts[i];
    const vx = (p.x - p.px) * 0.985;
    const vy = (p.y - p.py) * 0.985;
    p.px = p.x;
    p.py = p.y;
    p.x += vx;
    p.y += vy + gravity;
  }
  pts[0].x = ax;
  pts[0].y = ay;
  const dist = Math.hypot(pts[n - 1].x - ax, pts[n - 1].y - ay);
  const segLen = Math.max(1, dist / (n - 1));
  for (let k = 0; k < 2; k++) {
    pts[0].x = ax;
    pts[0].y = ay;
    for (let i = 0; i < n - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.0001;
      const diff = (d - segLen) / d;
      if (i === 0) {
        b.x -= dx * diff;
        b.y -= dy * diff;
      } else {
        const f = diff * 0.5;
        a.x += dx * f;
        a.y += dy * f;
        b.x -= dx * f;
        b.y -= dy * f;
      }
    }
  }
}

/** Snap all points onto the A->B segment (clean throw / retract start). */
export function resetRope(pts: RopePoint[], ax: number, ay: number, bx: number, by: number): void {
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    pts[i].x = x;
    pts[i].y = y;
    pts[i].px = x;
    pts[i].py = y;
  }
}
