'use client';

import React from 'react';

interface StatTrakBadgeProps {
  size?: 'xs' | 'sm';
  className?: string;
}

export const StatTrakBadge: React.FC<StatTrakBadgeProps> = ({ size = 'xs', className = '' }) => {
  const sizeClasses = size === 'sm' ? 'text-[9.5px] px-2.5 py-0.5' : 'text-[9px] px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center font-mono font-black tracking-wider rounded-full text-white bg-[#ea580c] shadow-[0_0_8px_rgba(234,88,12,0.4)] select-none shrink-0 uppercase ${sizeClasses} ${className}`}
      title="StatTrak™"
    >
      ST™
    </span>
  );
};
