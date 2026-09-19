import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const globalPresence = globalThis as unknown as {
  __presenceSessions?: Map<string, number>;
};

if (!globalPresence.__presenceSessions) {
  globalPresence.__presenceSessions = new Map<string, number>();
}

function pruneExpired(): number {
  const map = globalPresence.__presenceSessions!;
  const now = Date.now();
  const TTL = 30 * 1000; // 30 seconds

  for (const [id, lastSeen] of map.entries()) {
    if (now - lastSeen > TTL) {
      map.delete(id);
    }
  }

  return map.size;
}

export async function GET() {
  const activeCount = pruneExpired();
  return NextResponse.json({
    success: true,
    online: Math.max(1, activeCount),
    timestamp: Date.now(),
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = String(body?.sessionId || '').trim();

    if (sessionId) {
      globalPresence.__presenceSessions!.set(sessionId, Date.now());
    }

    const activeCount = pruneExpired();

    return NextResponse.json({
      success: true,
      online: Math.max(1, activeCount),
    });
  } catch (_) {
    const activeCount = pruneExpired();
    return NextResponse.json({
      success: true,
      online: Math.max(1, activeCount),
    });
  }
}
