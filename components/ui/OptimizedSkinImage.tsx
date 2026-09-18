"use client";

import React, { useState } from "react";
import Image from "next/image";

interface OptimizedSkinImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  weaponType?: string;
  rarityColor?: string;
}

export const OptimizedSkinImage: React.FC<OptimizedSkinImageProps> = ({
  src,
  alt,
  fallbackSrc,
  className = "",
  weaponType,
  rarityColor = "#a855f7",
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className={`relative flex flex-col items-center justify-center p-2 text-center select-none ${className}`}>
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-16 h-16 opacity-40 filter drop-shadow"
        >
          <path
            d="M12 40L38 18L52 28L26 50L12 40Z"
            stroke={rarityColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="rgba(255,255,255,0.05)"
          />
          <path d="M42 22L48 16L54 22L48 28L42 22Z" fill={rarityColor} opacity="0.6" />
        </svg>
        <span className="text-[10px] text-slate-400 font-bold truncate max-w-full mt-1">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Skeleton loader while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-full animate-ping opacity-20"
            style={{ backgroundColor: rarityColor }}
          />
        </div>
      )}

      {/* Image with unoptimized flag to bypass next/image CORS/hotlink block */}
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={handleError}
        onLoad={() => setIsLoaded(true)}
        className={`max-h-full max-w-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)] transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
};