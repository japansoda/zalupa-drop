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
      // Find the closest ancestor that is horizontally scrollable
      let el = e.target as HTMLElement | null;

      while (el && el !== document.body && el !== document.documentElement) {
        const style = window.getComputedStyle(el);
        const overflowX = style.overflowX;
        if (el.dataset.noWheel === 'true' || el.classList.contains('no-wheel-scroll')) {
          el = el.parentElement;
          continue;
        }

        const isHorizontalCandidate =
          overflowX === 'auto' ||
          overflowX === 'scroll' ||
          el.classList.contains('overflow-x-auto') ||
          el.classList.contains('overflow-x-scroll');

        if (isHorizontalCandidate && el.scrollWidth > el.clientWidth) {
          // If vertical scroll delta is dominant, translate to horizontal scroll
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.deltaY !== 0) {
            el.scrollLeft += e.deltaY * 1.1;
            e.preventDefault();
            return;
          }
        }
        el = el.parentElement;
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  return null;
};
