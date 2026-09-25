'use client';

import React, { useEffect } from 'react';

export const handleHorizontalWheel = (e: React.WheelEvent<HTMLElement>) => {
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.deltaY !== 0) {
    const el = e.currentTarget;
    if (el.scrollWidth > el.clientWidth) {
      el.scrollLeft += e.deltaY;
      e.stopPropagation();
    }
  }
};

export const HorizontalScrollManager: React.FC = () => {
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      // Only handle if vertical delta is clearly dominant
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || e.deltaY === 0) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // FAST path: Never call window.getComputedStyle in a loop!
      // Only intercept elements that explicitly request horizontal wheel translation
      const el = target.closest<HTMLElement>(
        '[data-horizontal-scroll="true"], .horizontal-wheel-scroll, .live-drop-ticker'
      );

      if (!el) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      // Check if container can actually scroll in the desired direction
      const canScrollRight = e.deltaY > 0 && el.scrollLeft < maxScroll - 1;
      const canScrollLeft = e.deltaY < 0 && el.scrollLeft > 1;

      if (canScrollRight || canScrollLeft) {
        el.scrollLeft += e.deltaY * 1.1;
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  return null;
};
