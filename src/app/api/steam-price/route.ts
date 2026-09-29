import { NextRequest, NextResponse } from 'next/server';
import { getCanonicalPrice } from '../../../lib/marketPricing';
import { SkinWear, SkinEntity } from '../../../lib/types';
import livePricesJson from '../../../data/live_market_prices.json';

const BASE_LIVE_PRICES: Record<string, number> = livePricesJson as Record<string, number>;

interface PriceCacheEntry {
  priceUsd: number;
  priceDc: number;
  lowestPriceRaw: string | null;
  medianPriceRaw: string | null;
  volume: string | null;
  timestamp: number;
  source: string;
}

// In-memory cache for Steam Market prices with 5-minute TTL
const priceCache = new Map<string, PriceCacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours daily sync (Vercel Edge & Serverless)

// Seed in-memory cache with baseline live market prices
for (const [hashName, dc] of Object.entries(BASE_LIVE_PRICES)) {
  if (dc > 0) {
    priceCache.set(hashName, {
      priceUsd: Number((dc * 0.01).toFixed(2)),
      priceDc: dc,
      lowestPriceRaw: `$${(dc * 0.01).toFixed(2)}`,
      medianPriceRaw: null,
      volume: null,
      timestamp: Date.now(),
      source: 'live_cs2_market',
    });
  }
}

let lastSkinportSync = Date.now();
let isSyncingSkinport = false;

// Background updater: refresh entire 25,000 CS2 live prices once a day
async function triggerSkinportSyncIfNeeded(): Promise<void> {
  const now = Date.now();
  if (now - lastSkinportSync < CACHE_TTL_MS || isSyncingSkinport) {
    return;
  }

  isSyncingSkinport = true;
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'ZalupaDrop-Vercel-Serverless/4.5 (CS2 Case Simulator)',
    };

    const clientId = process.env.SKINPORT_CLIENT_ID;
    const clientSecret = process.env.SKINPORT_CLIENT_SECRET;
    if (clientId && clientSecret) {
      headers['Authorization'] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
    }

    const res = await fetch('https://api.skinport.com/v1/items?app_id=730&currency=USD', {
      headers,
      next: { revalidate: 86400 },
    });
    if (res.ok) {
      const items = await res.json();
      if (Array.isArray(items)) {
        for (const item of items) {
          const usd = item.suggested_price || item.min_price || item.median_price || 0;
          if (usd > 0 && item.market_hash_name) {
            const dc = Math.max(1, Math.round(usd * 4));
            priceCache.set(item.market_hash_name, {
              priceUsd: usd,
              priceDc: dc,
              lowestPriceRaw: `$${usd.toFixed(2)}`,
              medianPriceRaw: item.median_price ? `$${item.median_price.toFixed(2)}` : null,
              volume: item.quantity ? String(item.quantity) : null,
              timestamp: now,
              source: 'skinport_live',
            });
          }
        }
        lastSkinportSync = now;
      }
    }
  } catch (_) {
    // Keep using existing cache on network failure
  } finally {
    isSyncingSkinport = false;
  }
}

// Circuit breaker for Steam rate-limiting (HTTP 429)
let steamRateLimitUntil = 0;

function parseSteamPrice(priceStr: string | undefined): number | null {
  if (!priceStr) return null;
  const cleaned = priceStr.replace(/[^\d.,]/g, '').trim();
  if (!cleaned) return null;
  const normalized = cleaned.includes(',') && !cleaned.includes('.') 
    ? cleaned.replace(',', '.') 
    : cleaned.replace(',', '');
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

function parseMarketHashName(hashName: string): Partial<SkinEntity> {
  const isSt = hashName.includes('StatTrak™');
  let clean = hashName.replace(/^★\s*/, '').replace(/StatTrak™\s*/i, '').trim();

  let wear: SkinWear | undefined = undefined;
  const wearMatch = clean.match(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/i);
  if (wearMatch) {
    const w = wearMatch[1].toLowerCase();
    if (w === 'factory new') wear = 'FN';
    else if (w === 'minimal wear') wear = 'MW';
    else if (w === 'field-tested') wear = 'FT';
    else if (w === 'well-worn') wear = 'WW';
    else if (w === 'battle-scarred') wear = 'BS';
    clean = clean.replace(wearMatch[0], '').trim();
  }

  let weapon = '';
  let skinName = clean;
  if (clean.includes(' | ')) {
    const parts = clean.split(' | ');
    weapon = parts[0].trim();
    skinName = parts.slice(1).join(' | ').trim();
  }

  return {
    weapon: hashName.startsWith('★') ? `★ ${weapon}` : weapon,
    skinName,
    name: hashName,
    wear,
    statTrak: isSt,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const marketHashName = searchParams.get('market_hash_name') || searchParams.get('name');

  if (!marketHashName) {
    return NextResponse.json({ error: 'Missing market_hash_name parameter' }, { status: 400 });
  }

  const cleanName = marketHashName.trim();
  const now = Date.now();

  // Trigger background refresh if older than 5 minutes (non-blocking)
  triggerSkinportSyncIfNeeded().catch(() => {});

  const cached = priceCache.get(cleanName);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      source: cached.source || 'cache',
      marketHashName: cleanName,
      priceUsd: cached.priceUsd,
      priceDc: cached.priceDc,
      lowestPrice: cached.lowestPriceRaw,
      medianPrice: cached.medianPriceRaw,
      volume: cached.volume,
    });
  }

  // If in cache even if slightly past TTL, use it while background refresh updates
  if (cached && cached.priceDc > 0) {
    return NextResponse.json({
      success: true,
      source: cached.source || 'cache',
      marketHashName: cleanName,
      priceUsd: cached.priceUsd,
      priceDc: cached.priceDc,
      lowestPrice: cached.lowestPriceRaw,
      medianPrice: cached.medianPriceRaw,
      volume: cached.volume,
    });
  }

  // If Steam is currently rate-limited, immediately return canonical price
  if (now < steamRateLimitUntil) {
    const fallback = getCanonicalPrice(parseMarketHashName(cleanName));
    return NextResponse.json({
      success: true,
      source: 'live_market_fallback',
      marketHashName: cleanName,
      priceUsd: fallback.priceUsd,
      priceDc: fallback.priceDc,
    });
  }

  try {
    const steamUrl = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${encodeURIComponent(cleanName)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(steamUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }, // 5 minutes live revalidation
    });

    clearTimeout(timeoutId);

    if (res.status === 429) {
      steamRateLimitUntil = Date.now() + 60_000; // back off for 1 minute
      const fallback = getCanonicalPrice(parseMarketHashName(cleanName));
      return NextResponse.json({
        success: true,
        source: 'live_market_fallback',
        marketHashName: cleanName,
        priceUsd: fallback.priceUsd,
        priceDc: fallback.priceDc,
      });
    }

    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        const priceUsd = parseSteamPrice(data.lowest_price) ?? parseSteamPrice(data.median_price);
        if (priceUsd !== null && priceUsd > 0) {
          const priceDc = Math.max(1, Math.round(priceUsd * 4));
          const entry: PriceCacheEntry = {
            priceUsd,
            priceDc,
            lowestPriceRaw: data.lowest_price || null,
            medianPriceRaw: data.median_price || null,
            volume: data.volume || null,
            timestamp: now,
            source: 'steam_live',
          };
          priceCache.set(cleanName, entry);
          return NextResponse.json({
            success: true,
            source: 'steam_live',
            marketHashName: cleanName,
            priceUsd,
            priceDc,
            lowestPrice: data.lowest_price,
            medianPrice: data.median_price,
            volume: data.volume,
          });
        }
      }
    }

    const fallback = getCanonicalPrice(parseMarketHashName(cleanName));
    return NextResponse.json({
      success: true,
      source: 'live_market_fallback',
      marketHashName: cleanName,
      priceUsd: fallback.priceUsd,
      priceDc: fallback.priceDc,
    });
  } catch (_) {
    const fallback = getCanonicalPrice(parseMarketHashName(cleanName));
    return NextResponse.json({
      success: true,
      source: 'live_market_fallback',
      marketHashName: cleanName,
      priceUsd: fallback.priceUsd,
      priceDc: fallback.priceDc,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const names: string[] = Array.isArray(body?.names) ? body.names.slice(0, 50) : [];
    if (names.length === 0) {
      return NextResponse.json({ success: true, prices: {} });
    }

    // Trigger background refresh if 5 minutes have elapsed
    triggerSkinportSyncIfNeeded().catch(() => {});

    const now = Date.now();
    const results: Record<string, { priceUsd: number; priceDc: number; source: string }> = {};

    for (const name of names) {
      const cleanName = String(name).trim();
      if (!cleanName) continue;

      const cached = priceCache.get(cleanName);
      if (cached && cached.priceDc > 0) {
        results[cleanName] = {
          priceUsd: cached.priceUsd,
          priceDc: cached.priceDc,
          source: cached.source || 'cache',
        };
        continue;
      }

      // Check canonical live dataset
      const canonical = getCanonicalPrice(parseMarketHashName(cleanName));
      if (canonical && canonical.priceDc > 0) {
        priceCache.set(cleanName, {
          priceUsd: canonical.priceUsd,
          priceDc: canonical.priceDc,
          lowestPriceRaw: `$${canonical.priceUsd.toFixed(2)}`,
          medianPriceRaw: null,
          volume: null,
          timestamp: now,
          source: 'live_cs2_market',
        });
        results[cleanName] = {
          priceUsd: canonical.priceUsd,
          priceDc: canonical.priceDc,
          source: 'live_cs2_market',
        };
      }
    }

    return NextResponse.json({
      success: true,
      prices: results,
      timestamp: now,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Batch price sync failed' }, { status: 500 });
  }
}
