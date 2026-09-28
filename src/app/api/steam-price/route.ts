import { NextRequest, NextResponse } from 'next/server';
import { getCanonicalPrice } from '../../../lib/marketPricing';
import { SkinWear, SkinEntity } from '../../../lib/types';

interface PriceCacheEntry {
  priceUsd: number;
  priceDc: number;
  lowestPriceRaw: string | null;
  medianPriceRaw: string | null;
  volume: string | null;
  timestamp: number;
  source: string;
}

// In-memory cache for Steam Market prices with 5-minute TTL (live refresh every 5 min)
const priceCache = new Map<string, PriceCacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes live cache

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

  // If Steam is currently rate-limited, immediately return fallback
  if (now < steamRateLimitUntil) {
    const fallback = getCanonicalPrice(parseMarketHashName(cleanName));
    return NextResponse.json({
      success: true,
      source: 'steam_rate_limit_fallback',
      marketHashName: cleanName,
      priceUsd: fallback.priceUsd,
      priceDc: fallback.priceDc,
    });
  }

  try {
    const steamUrl = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${encodeURIComponent(cleanName)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

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
        source: 'steam_rate_limit_fallback',
        marketHashName: cleanName,
        priceUsd: fallback.priceUsd,
        priceDc: fallback.priceDc,
      });
    }

    if (!res.ok) {
      const fallback = getCanonicalPrice(parseMarketHashName(cleanName));
      return NextResponse.json({
        success: true,
        source: 'steam_fallback',
        marketHashName: cleanName,
        priceUsd: fallback.priceUsd,
        priceDc: fallback.priceDc,
      });
    }

    const data = await res.json();

    if (!data || !data.success) {
      const fallback = getCanonicalPrice(parseMarketHashName(cleanName));
      return NextResponse.json({
        success: true,
        source: 'steam_fallback',
        marketHashName: cleanName,
        priceUsd: fallback.priceUsd,
        priceDc: fallback.priceDc,
      });
    }

    const priceUsd = parseSteamPrice(data.lowest_price) ?? parseSteamPrice(data.median_price);

    if (priceUsd === null || priceUsd <= 0) {
      const fallback = getCanonicalPrice(parseMarketHashName(cleanName));
      return NextResponse.json({
        success: true,
        source: 'steam_fallback',
        marketHashName: cleanName,
        priceUsd: fallback.priceUsd,
        priceDc: fallback.priceDc,
      });
    }

    // Convert USD to DC ($1 = 100 DC)
    const priceDc = Math.max(1, Math.round(priceUsd * 100));

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
  } catch (err: any) {
    const fallback = getCanonicalPrice(parseMarketHashName(cleanName));
    return NextResponse.json({
      success: true,
      source: 'steam_error_fallback',
      marketHashName: cleanName,
      priceUsd: fallback.priceUsd,
      priceDc: fallback.priceDc,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const names: string[] = Array.isArray(body?.names) ? body.names.slice(0, 45) : [];
    if (names.length === 0) {
      return NextResponse.json({ success: true, prices: {} });
    }

    const now = Date.now();
    const results: Record<string, { priceUsd: number; priceDc: number; source: string }> = {};

    for (const name of names) {
      const cleanName = String(name).trim();
      if (!cleanName) continue;

      const cached = priceCache.get(cleanName);
      if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        results[cleanName] = {
          priceUsd: cached.priceUsd,
          priceDc: cached.priceDc,
          source: 'cache',
        };
        continue;
      }

      // If Steam is currently rate limited, instantly use canonical fallback
      if (now < steamRateLimitUntil) {
        const fallback = getCanonicalPrice(parseMarketHashName(cleanName));
        results[cleanName] = {
          priceUsd: fallback.priceUsd,
          priceDc: fallback.priceDc,
          source: 'fallback_market',
        };
        continue;
      }

      try {
        const steamUrl = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${encodeURIComponent(cleanName)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(steamUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'application/json',
          },
        });
        clearTimeout(timeoutId);

        if (res.status === 429) {
          steamRateLimitUntil = Date.now() + 60_000;
          const fallback = getCanonicalPrice(parseMarketHashName(cleanName));
          results[cleanName] = { priceUsd: fallback.priceUsd, priceDc: fallback.priceDc, source: 'fallback_market' };
          continue;
        }

        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            const priceUsd = parseSteamPrice(data.lowest_price) ?? parseSteamPrice(data.median_price);
            if (priceUsd !== null && priceUsd > 0) {
              const priceDc = Math.max(1, Math.round(priceUsd * 100));
              priceCache.set(cleanName, {
                priceUsd,
                priceDc,
                lowestPriceRaw: data.lowest_price || null,
                medianPriceRaw: data.median_price || null,
                volume: data.volume || null,
                timestamp: now,
                source: 'steam_live',
              });
              results[cleanName] = { priceUsd, priceDc, source: 'steam_live' };
              continue;
            }
          }
        }

        // Fallback to canonical market pricing if item not found on Steam
        const fallback = getCanonicalPrice(parseMarketHashName(cleanName));
        results[cleanName] = { priceUsd: fallback.priceUsd, priceDc: fallback.priceDc, source: 'fallback_market' };
      } catch (_) {
        const fallback = getCanonicalPrice(parseMarketHashName(cleanName));
        results[cleanName] = { priceUsd: fallback.priceUsd, priceDc: fallback.priceDc, source: 'fallback_market' };
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
