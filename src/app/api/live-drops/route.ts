import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { LiveDrop } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NTFY_TOPIC = 'zalupa_live_drops_v3';
const NTFY_URL = `https://ntfy.sh/${NTFY_TOPIC}`;
const DISK_FILE = path.join(os.tmpdir(), 'zalupa_live_drops_v3.json');
const PERSISTENT_SETTINGS_FILE = path.resolve(process.cwd(), 'src/data/live_settings.json');
const FALLBACK_SETTINGS_FILE = path.join(os.tmpdir(), 'zalupa_settings_v1.json');
const MAX_DROPS = 50;

// Global memory buffer for warm serverless instances
const globalStore = globalThis as unknown as {
  __liveDropsBuffer?: LiveDrop[];
  __lastNtfySync?: number;
  __fakeDropsEnabled?: boolean;
};

if (!globalStore.__liveDropsBuffer) {
  globalStore.__liveDropsBuffer = [];
}

function loadSettings(): { fakeDropsEnabled: boolean } {
  try {
    if (fs.existsSync(PERSISTENT_SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PERSISTENT_SETTINGS_FILE, 'utf-8'));
      if (typeof data.fakeDropsEnabled === 'boolean') return data;
    }
  } catch (_) {}
  try {
    if (fs.existsSync(FALLBACK_SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(FALLBACK_SETTINGS_FILE, 'utf-8'));
      if (typeof data.fakeDropsEnabled === 'boolean') return data;
    }
  } catch (_) {}
  return { fakeDropsEnabled: true };
}

function saveSettings(settings: { fakeDropsEnabled: boolean }) {
  try {
    fs.writeFileSync(PERSISTENT_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (_) {}
  try {
    fs.writeFileSync(FALLBACK_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (_) {}
}

if (globalStore.__fakeDropsEnabled === undefined) {
  globalStore.__fakeDropsEnabled = loadSettings().fakeDropsEnabled;
}

function isSafeImageUrl(img: string | undefined | null): boolean {
  if (!img || typeof img !== 'string') return false;
  const s = img.trim();
  if (s.startsWith('file:') || s.includes('file://') || s.includes('C:/') || s.includes('C:\\')) return false;
  return s.startsWith('/') || s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:');
}

// Helper to safely load from local disk file
function loadFromDisk(): LiveDrop[] {
  try {
    if (fs.existsSync(DISK_FILE)) {
      const data = fs.readFileSync(DISK_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter((d) => d?.skin?.name && isSafeImageUrl(d?.skin?.image) && (d?.skin?.priceDc || 0) >= 25000);
      }
    }
  } catch (_) {}
  return [];
}

// Helper to safely save to local disk file
function saveToDisk(drops: LiveDrop[]) {
  try {
    fs.writeFileSync(DISK_FILE, JSON.stringify(drops.slice(0, MAX_DROPS)), 'utf-8');
  } catch (_) {}
}

// Merge & deduplicate drops
function mergeDrops(existing: LiveDrop[], incoming: LiveDrop[]): LiveDrop[] {
  const map = new Map<string, LiveDrop>();

  // Add existing
  for (const d of existing) {
    if (d && d.skin && d.skin.name && isSafeImageUrl(d.skin.image) && (d.skin.priceDc || 0) >= 25000) {
      const cleanId = d.id.replace(/^net_/, '');
      map.set(cleanId, d);
    }
  }

  // Add incoming (overwrites if matching ID)
  for (const d of incoming) {
    if (d && d.skin && d.skin.name && isSafeImageUrl(d.skin.image) && (d.skin.priceDc || 0) >= 25000) {
      const cleanId = d.id.replace(/^net_/, '');
      map.set(cleanId, d);
    }
  }

  // Sort by timestamp descending
  return Array.from(map.values())
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, MAX_DROPS);
}

// Fetch historical drops from ntfy.sh cache
async function syncFromNtfy(): Promise<LiveDrop[]> {
  try {
    const res = await fetch(`${NTFY_URL}/json?poll=1&since=12h`, {
      signal: AbortSignal.timeout(2000),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.trim().split('\n').filter(Boolean);
    const drops: LiveDrop[] = [];

    for (const line of lines) {
      try {
        const item = JSON.parse(line);
        if (item.event === 'message' && item.message) {
          const drop = JSON.parse(item.message);
          if (drop && drop.skin && drop.skin.name && isSafeImageUrl(drop.skin.image) && (drop.skin.priceDc || 0) >= 25000) {
            drops.push(drop);
          }
        }
      } catch (_) {}
    }
    return drops;
  } catch (_) {
    return [];
  }
}

export async function GET() {
  let memory = globalStore.__liveDropsBuffer || [];

  // Seed from disk if memory is empty
  if (memory.length === 0) {
    const diskDrops = loadFromDisk();
    if (diskDrops.length > 0) {
      memory = diskDrops;
      globalStore.__liveDropsBuffer = memory;
    }
  }

  // Periodic background sync with ntfy (at most once every 5 seconds per lambda)
  const now = Date.now();
  if (!globalStore.__lastNtfySync || now - globalStore.__lastNtfySync > 5000) {
    globalStore.__lastNtfySync = now;
    const ntfyDrops = await syncFromNtfy();
    if (ntfyDrops.length > 0) {
      memory = mergeDrops(memory, ntfyDrops);
      globalStore.__liveDropsBuffer = memory;
      saveToDisk(memory);
    }
  }

  return NextResponse.json({
    success: true,
    drops: memory,
    fakeDropsEnabled: globalStore.__fakeDropsEnabled ?? true,
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Admin toggle for fake drops
    if (body?.action === 'setFakeDrops') {
      const enabled = Boolean(body.enabled);
      globalStore.__fakeDropsEnabled = enabled;
      saveSettings({ fakeDropsEnabled: enabled });

      // Broadcast config change to all connected clients via ntfy
      fetch(NTFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'CONFIG', fakeDropsEnabled: enabled }),
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        fakeDropsEnabled: enabled,
      });
    }

    if (
      !body ||
      !body.skin ||
      !isSafeImageUrl(body.skin.image) ||
      !body.skin.name ||
      typeof body.skin.priceDc !== 'number' ||
      body.skin.priceDc < 25000
    ) {
      return NextResponse.json({ error: 'Invalid drop or price < 25000 DC' }, { status: 400 });
    }

    const cleanId = String(body.id || `real_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);

    const drop: LiveDrop = {
      id: cleanId,
      user: '', // other clients see clean tagless item
      avatar: '',
      skin: body.skin,
      caseName: String(body.caseName || 'Case'),
      timestamp: Number(body.timestamp) || Date.now(),
    };

    // 1. Update memory
    globalStore.__liveDropsBuffer = mergeDrops(globalStore.__liveDropsBuffer || [], [drop]);

    // 2. Persist to disk
    saveToDisk(globalStore.__liveDropsBuffer);

    // 3. Broadcast to ntfy.sh for instant cross-device SSE
    fetch(NTFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(drop),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      drop,
      total: globalStore.__liveDropsBuffer.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
