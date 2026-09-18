'use client';

import React, { useState } from 'react';

interface SkinImageProps {
  src: string;
  alt: string;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
  priority?: boolean;
}

export const SkinImage: React.FC<SkinImageProps> = ({
  src,
  alt,
  className = '',
  size = 220,
  style,
  priority = false,
}) => {
  // stage: 0 = Cloudflare WebP CDN (wsrv.nl), 1 = local API proxy (/api/img), 2 = direct Steam URL
  const [stage, setStage] = useState<number>(0);
  const [loaded, setLoaded] = useState<boolean>(false);

  if (!src) {
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
    // Only optimize Steam CDN images
    const isSteam = src.includes('steamstatic.com') || src.includes('akamaihd.net') || src.includes('steamcommunity');
    if (!isSteam) return src;

    if (stage === 0) {
      // Fast Cloudflare-backed WebP cache (reduces 180KB -> 6KB)
      return `https://wsrv.nl/?url=${encodeURIComponent(src)}&w=${size}&output=webp&q=80`;
    }
    if (stage === 1) {
      // Local Next.js Sharp WebP proxy with 1-year disk cache
      return `/api/img?url=${encodeURIComponent(src)}`;
    }
    // Final direct fallback
    return src;
  };

  return (
    <img
      src={getSource()}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onLoad={() => setLoaded(true)}
      onError={() => {
        setStage((prev) => prev + 1);
      }}
      className={`transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-85'} ${className}`}
      style={style}
    />
  );
};
