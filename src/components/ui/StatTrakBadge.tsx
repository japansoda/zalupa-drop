'use client';

import React from 'react';

interface StatTrakBadgeProps {
  size?: 'xs' | 'sm';
  className?: string;
}

export const StatTrakBadge: React.FC<StatTrakBadgeProps> = ({ size = 'xs', className = '' }) => {
  const sizeClasses = size === 'sm' ? 'text-[9.5px] px-1.5 py-0.5' : 'text-[8.5px] px-1.5 py-0.2';

  return (
    <span
      className={`inline-flex items-center font-mono font-black tracking-tight rounded bg-[#1c0f06] border border-[#ff7a00]/35 text-[#ff7a00] shadow-[0_0_6px_rgba(255,122,0,0.25)] select-none shrink-0 ${sizeClasses} ${className}`}
      title="StatTrak™"
    >
      ST™
    </span>
  );
};
