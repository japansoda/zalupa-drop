'use client';

import React, { useState } from 'react';

interface SkinImageProps {
  src: string;
  alt: string;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
  priority?: boolean;
  /** Tiny thumbnails (case preview strips etc.): fetch pre-resized WebP first, cheap skeleton */
  thumb?: boolean;
}

export const SkinImage: React.FC<SkinImageProps> = React.memo(({
  src,
  alt,
  className = '',
  size = 220,
  style,
  priority = false,
  thumb = false,
}) => {
  const [prevSrc, setPrevSrc] = useState(src);
  const [stage, setStage] = useState<number>(0);
  const [loaded, setLoaded] = useState<boolean>(false);

  // Instantly clear loaded status when src changes so old skin never lingers
  if (src !== prevSrc) {
    setPrevSrc(src);
    setLoaded(false);
    setStage(0);
  }

  if (!src || src.startsWith('file:') || src.includes('file://') || src.includes('C:/') || src.includes('C:\\')) {
    return <div className={`bg-white/5 ${className}`} style={style} />;
  }

  // Local SVGs or relative paths don't need proxying
  if (src.startsWith('/') || src.endsWith('.svg')) {
    return (
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        className={className}
        style={style}
      />
    );
  }

  const getSource = (): string => {
    const isSteam = src.includes('steamstatic.com') || src.includes('akamaihd.net') || src.includes('steamcommunity');
    if (!isSteam) return src;

    // Direct Steam CDN gives fast loading:
    if (priority || stage === 0) {
      return src;
    }
    if (stage === 1) {
      // Cloudflare-backed WebP cache fallback
      return `https://wsrv.nl/?url=${encodeURIComponent(src)}&w=${size}&output=webp&q=80`;
    }
    // Local Next.js Sharp WebP proxy fallback
    return `/api/img?url=${encodeURIComponent(src)}`;
  };

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`} style={style}>
      {!loaded && (
        <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />
      )}
      <img
        key={src}
        src={getSource()}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setStage((prev) => prev + 1);
        }}
        className={`w-full h-full object-contain transition-opacity duration-150 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
});
SkinImage.displayName = 'SkinImage';
