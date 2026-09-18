import React from 'react';

interface DropCoinIconProps {
  className?: string;
  size?: number;
}

export const DropCoinIcon: React.FC<DropCoinIconProps> = ({ className = '', size = 20 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="dcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
        <filter id="dcGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#EAB308" floodOpacity="0.6" />
        </filter>
      </defs>
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="url(#dcGrad)"
        stroke="#FEF08A"
        strokeWidth="1.5"
        filter="url(#dcGlow)"
      />
      <circle
        cx="12"
        cy="12"
        r="8"
        fill="none"
        stroke="rgba(0, 0, 0, 0.25)"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fill="#713F12"
        fontSize="8.5"
        fontWeight="900"
        fontFamily="system-ui, sans-serif"
        letterSpacing="-0.5"
      >
        DC
      </text>
    </svg>
  );
};
