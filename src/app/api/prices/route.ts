import { NextRequest, NextResponse } from 'next/server';
import livePricesJson from '../../../data/live_market_prices.json';
import collectorPricesJson from '../../../data/collector_prices.json';

const COLLECTOR_PRICES: Record<string, number> = collectorPricesJson as Record<string, number>;

// Pre-seeded authentic CS2 prices dataset with collector grails protected
const FALLBACK_PRICES: Record<string, number> = {
  ...(livePricesJson as Record<string, number>),
  ...COLLECTOR_PRICES,
};

// 24-hour revalidation (86,400 seconds)
export const revalidate = 86400;

interface CachedPricesState {
  prices: Record<string, number>;
  updatedAt: number;
  source: string;
}

// In-memory memory state for warm serverless instances
const globalStore = globalThis as unknown as {
  __skinportPricesCache?: CachedPricesState;
};

if (!globalStore.__skinportPricesCache) {
  globalStore.__skinportPricesCache = {
    prices: FALLBACK_PRICES,
    updatedAt: Date.now(),
    source: 'bundled_dataset',
  };
}

/**
 * Fetches CS2 items directly from Skinport API with 24h Vercel Edge caching and optional authorization.
 * Executed STRICTLY on the backend (zero browser calls, zero CORS, zero client IP rate-limiting).
 */
async function fetchSkinportItemsDaily(): Promise<CachedPricesState> {
  const now = Date.now();
  const current = globalStore.__skinportPricesCache;

  // If memory cache is younger than 24 hours (86,400,000 ms) and has data, return it
  if (current && now - current.updatedAt < 86400 * 1000 && Object.keys(current.prices).length > 1000) {
    return current;
  }

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'ZalupaDrop-Vercel-Serverless/4.5 (CS2 Case Simulator)',
  };

  // Check for optional Client ID & Secret from Vercel Environment Variables
  const clientId = process.env.SKINPORT_CLIENT_ID;
  const clientSecret = process.env.SKINPORT_CLIENT_SECRET;
  if (clientId && clientSecret) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  try {
    const res = await fetch('https://api.skinport.com/v1/items?app_id=730&currency=USD', {
      headers,
      next: { revalidate: 86400 }, // 24-hour Vercel Data Cache
    });

    if (res.ok) {
      const items = await res.json();
      if (Array.isArray(items) && items.length > 0) {
        const priceMap: Record<string, number> = { ...FALLBACK_PRICES };

        for (const item of items) {
          const usd = item.suggested_price || item.min_price || item.median_price || 0;
          if (usd > 0 && item.market_hash_name) {
            const dc = Math.max(0.01, Number((usd * 4).toFixed(2)));
            // Do not downgrade ultra-exotic collector grails with retail low prices
            if (!COLLECTOR_PRICES[item.market_hash_name]) {
              priceMap[item.market_hash_name] = dc;
            }
          }
        }

        // Guarantee collector prices are applied
        for (const [k, v] of Object.entries(COLLECTOR_PRICES)) {
          priceMap[k] = v;
        }

        const newState: CachedPricesState = {
          prices: priceMap,
          updatedAt: now,
          source: 'skinport_api_24h',
        };

        globalStore.__skinportPricesCache = newState;
        return newState;
      }
    }
  } catch (err) {
    // If Skinport is temporarily unreachable, fallback cleanly to existing/bundled dataset
    console.warn('[Skinport Sync] Network request failed, using bundled market prices:', err);
  }

  return globalStore.__skinportPricesCache || {
    prices: FALLBACK_PRICES,
    updatedAt: now,
    source: 'fallback_dataset',
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const namesParam = searchParams.get('names');

  const cache = await fetchSkinportItemsDaily();

  // If specific items requested via query param (e.g. ?names=item1,item2)
  if (namesParam) {
    const requestedNames = namesParam.split(',').map((n) => n.trim()).filter(Boolean);
    const filtered: Record<string, { priceDc: number; priceUsd: number }> = {};

    for (const name of requestedNames) {
      const dc = cache.prices[name] || FALLBACK_PRICES[name] || 0;
      if (dc > 0) {
        filtered[name] = {
          priceDc: dc,
          priceUsd: Number((dc * 0.01).toFixed(2)),
        };
      }
    }

    return NextResponse.json(
      {
        success: true,
        source: cache.source,
        updatedAt: cache.updatedAt,
        prices: filtered,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
        },
      }
    );
  }

  // Full dataset response with 24-hour Edge Cache
  return NextResponse.json(
    {
      success: true,
      source: cache.source,
      updatedAt: cache.updatedAt,
      count: Object.keys(cache.prices).length,
      prices: cache.prices,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const names: string[] = Array.isArray(body?.names) ? body.names.slice(0, 100) : [];

    const cache = await fetchSkinportItemsDaily();
    const results: Record<string, { priceDc: number; priceUsd: number; source: string }> = {};

    for (const name of names) {
      const cleanName = String(name).trim();
      if (!cleanName) continue;

      const dc = cache.prices[cleanName] || FALLBACK_PRICES[cleanName] || 0;
      if (dc > 0) {
        results[cleanName] = {
          priceDc: dc,
          priceUsd: Number((dc * 0.01).toFixed(2)),
          source: cache.source,
        };
      }
    }

    return NextResponse.json(
      {
        success: true,
        source: cache.source,
        updatedAt: cache.updatedAt,
        prices: results,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Price sync failed' }, { status: 500 });
  }
}
