import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// In-memory LRU-like cache for converted WebP images
const cache = new Map<string, { buffer: Buffer; timestamp: number }>();
const MAX_CACHE_SIZE = 500;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // Security: only allow steamstatic, steamcommunity, githubusercontent, and local
  try {
    const parsed = new URL(imageUrl);
    const host = parsed.hostname;
    const isAllowed =
      host.endsWith('steamstatic.com') ||
      host.endsWith('akamaihd.net') ||
      host.endsWith('steamcommunity.com') ||
      host === 'raw.githubusercontent.com';

    if (!isAllowed) {
      return new NextResponse('Domain not allowed', { status: 403 });
    }
  } catch {
    return new NextResponse('Invalid url', { status: 400 });
  }

  // Check in-memory cache
  const cached = cache.get(imageUrl);
  if (cached) {
    return new NextResponse(new Uint8Array(cached.buffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  try {
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CS2SkinSimulator/1.0',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      return new NextResponse(`Failed to fetch upstream: ${res.statusText}`, { status: res.status });
    }

    const arrayBuf = await res.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuf);

    // Optimize and convert to WebP
    const webpBuffer = await sharp(rawBuffer)
      .resize(240, 240, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 3 })
      .toBuffer();

    // Cache management
    if (cache.size >= MAX_CACHE_SIZE) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(imageUrl, { buffer: webpBuffer, timestamp: Date.now() });

    return new NextResponse(new Uint8Array(webpBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    // If conversion fails, redirect directly to upstream
    return NextResponse.redirect(imageUrl, { status: 302 });
  }
}
