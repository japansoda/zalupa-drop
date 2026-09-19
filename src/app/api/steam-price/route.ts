import { NextRequest, NextResponse } from 'next/server';

interface PriceCacheEntry {
  priceUsd: number;
  priceDc: number;
  lowestPriceRaw: string | null;
  medianPriceRaw: string | null;
  volume: string | null;
  timestamp: number;
}

// In-memory cache for Steam Market prices with 30-minute TTL
const priceCache = new Map<string, PriceCacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000;

function parseSteamPrice(priceStr: string | undefined): number | null {
  if (!priceStr) return null;
  // Remove non-numeric characters except dot and comma
  const cleaned = priceStr.replace(/[^\d.,]/g, '').trim();
  if (!cleaned) return null;
  // Handle comma as decimal separator if applicable
  const normalized = cleaned.includes(',') && !cleaned.includes('.') 
    ? cleaned.replace(',', '.') 
    : cleaned.replace(',', '');
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const marketHashName = searchParams.get('market_hash_name') || searchParams.get('name');

  if (!marketHashName) {
    return NextResponse.json({ error: 'Missing market_hash_name parameter' }, { status: 400 });
  }

  const now = Date.now();
  const cached = priceCache.get(marketHashName);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      source: 'cache',
      marketHashName,
      priceUsd: cached.priceUsd,
      priceDc: cached.priceDc,
      lowestPrice: cached.lowestPriceRaw,
      medianPrice: cached.medianPriceRaw,
      volume: cached.volume,
    });
  }

  try {
    const steamUrl = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${encodeURIComponent(marketHashName)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(steamUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 1800 },
    });

    clearTimeout(timeoutId);

    if (res.status === 429) {
      // Rate limited by Steam: return graceful status
      return NextResponse.json({
        success: false,
        rateLimited: true,
        source: 'steam_rate_limit',
        marketHashName,
      }, { status: 200 });
    }

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        notOnMarket: true,
        source: 'steam_http_error',
        marketHashName,
      }, { status: 200 });
    }

    const data = await res.json();

    if (!data || !data.success) {
      return NextResponse.json({
        success: false,
        notOnMarket: true,
        source: 'steam_not_found',
        marketHashName,
      }, { status: 200 });
    }

    const priceUsd = parseSteamPrice(data.lowest_price) ?? parseSteamPrice(data.median_price);

    if (priceUsd === null) {
      return NextResponse.json({
        success: false,
        notOnMarket: true,
        source: 'steam_no_price',
        marketHashName,
      }, { status: 200 });
    }

    // Convert USD to DC ($1 = 100 DC)
    const priceDc = Math.max(10, Math.round(priceUsd * 100));

    const entry: PriceCacheEntry = {
      priceUsd,
      priceDc,
      lowestPriceRaw: data.lowest_price || null,
      medianPriceRaw: data.median_price || null,
      volume: data.volume || null,
      timestamp: now,
    };

    priceCache.set(marketHashName, entry);

    return NextResponse.json({
      success: true,
      source: 'steam_live',
      marketHashName,
      priceUsd,
      priceDc,
      lowestPrice: data.lowest_price,
      medianPrice: data.median_price,
      volume: data.volume,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      notOnMarket: true,
      error: err?.message || 'Fetch failed',
      marketHashName,
    }, { status: 200 });
  }
}
