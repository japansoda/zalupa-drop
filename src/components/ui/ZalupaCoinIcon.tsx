import React from 'react';

interface ZalupaCoinIconProps {
  className?: string;
  size?: number;
}

/**
 * Official ZalupaCoin (ZC / Залупакоин) Currency Emblem
 * High-tier minted cyber-gold coin with faceted "Z" monogram and specular rim highlights.
 */
export const ZalupaCoinIcon: React.FC<ZalupaCoinIconProps> = ({ className = '', size = 20 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 align-middle ${className}`}
      aria-label="ZalupaCoin"
    >
      <defs>
        {/* Outer coin rim gold gradient */}
        <linearGradient id="zcRimGrad" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="25%" stopColor="#FDE047" />
          <stop offset="60%" stopColor="#EAB308" />
          <stop offset="85%" stopColor="#CA8A04" />
          <stop offset="100%" stopColor="#713F12" />
        </linearGradient>

        {/* Inner coin field dark metallic gold */}
        <radialGradient id="zcFieldGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#3d2406" />
          <stop offset="65%" stopColor="#1e1003" />
          <stop offset="100%" stopColor="#0f0701" />
        </radialGradient>

        {/* Emblem "Z" specular gold gradient */}
        <linearGradient id="zcZGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="35%" stopColor="#FEF08A" />
          <stop offset="70%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>

        {/* Neon Gold Bloom Filter */}
        <filter id="zcGlow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#FACC15" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Outer Coin Base with Rim Glow */}
      <circle
        cx="12"
        cy="12"
        r="10.5"
        fill="url(#zcRimGrad)"
        stroke="#FEF08A"
        strokeWidth="0.75"
        filter="url(#zcGlow)"
      />

      {/* Coin Bevel Ring */}
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="url(#zcFieldGrad)"
        stroke="rgba(250, 204, 21, 0.45)"
        strokeWidth="0.8"
      />

      {/* Decorative Precision Coin Rim Rivets / Serrations */}
      <circle
        cx="12"
        cy="12"
        r="8.2"
        fill="none"
        stroke="#EAB308"
        strokeWidth="0.6"
        strokeDasharray="1.2 1.4"
        opacity="0.65"
      />

      {/* Center Stylized "Z" Monogram Insignia */}
      <g filter="drop-shadow(0 1px 2px rgba(0,0,0,0.85))">
        {/* Top Horizontal Bar */}
        <path
          d="M 7.2 7.2 L 16.8 7.2 L 15.6 9.4 L 11.2 9.4 L 7.2 7.2 Z"
          fill="#FFFBEB"
          opacity="0.95"
        />
        {/* Main Diagonal Slash with sharp facets */}
        <path
          d="M 16.5 7.4 L 9.2 16.6 L 7.2 16.6 L 14.5 7.4 Z"
          fill="url(#zcZGrad)"
        />
        {/* Bottom Horizontal Bar */}
        <path
          d="M 7.2 16.6 L 16.8 16.6 L 16.8 14.6 L 10.4 14.6 L 7.2 16.6 Z"
          fill="#CA8A04"
        />
        {/* Dynamic Center Cross-Notch / Diamond Core Accent */}
        <polygon
          points="12,10.6 13.4,12 12,13.4 10.6,12"
          fill="#FFFBEB"
          opacity="0.9"
        />
      </g>
    </svg>
  );
};

export default ZalupaCoinIcon;
