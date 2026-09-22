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

    // Direct Steam Akamai/Cloudflare CDN gives ultra-fast <100ms loading without slow Dutch proxy delay
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-6 h-6 rounded-full border-2 border-yellow-400/20 border-t-yellow-400/80 animate-spin" />
        </div>
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
        className={`w-full h-full object-contain transition-all duration-150 ${
          loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      />
    </div>
  );
};
