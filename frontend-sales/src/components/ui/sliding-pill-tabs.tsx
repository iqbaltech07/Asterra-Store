'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MOTION_DURATION, MOTION_EASING, isReducedMotion } from '@/lib/motion';

export interface SlidingTabOption<T extends string = string> {
  id: T;
  label: string;
  badge?: string | number;
}

export interface SlidingPillTabsProps<T extends string = string> {
  tabs: Array<SlidingTabOption<T>>;
  activeTab: T;
  onChange: (tabId: T) => void;
  ariaLabel?: string;
  className?: string;
  pillClassName?: string;
  tabClassName?: string;
  size?: 'sm' | 'md';
}

export function SlidingPillTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  ariaLabel = 'Pilihan Tab',
  className = '',
  pillClassName = 'bg-[#334155] shadow-xs',
  tabClassName = '',
  size = 'sm',
}: SlidingPillTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const updateIndicator = useCallback(() => {
    const activeBtn = tabRefs.current.get(activeTab);
    const container = containerRef.current;
    if (activeBtn && container) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      const left = btnRect.left - containerRect.left;
      const width = btnRect.width;
      setIndicator({ left, width, ready: true });
    }
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();
  }, [updateIndicator, activeTab, tabs]);

  // Recalculate on window resize and container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      updateIndicator();
    });
    ro.observe(container);

    window.addEventListener('resize', updateIndicator);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [updateIndicator]);

  const reduced = isReducedMotion();

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % tabs.length;
      onChange(tabs[nextIndex].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      onChange(tabs[prevIndex].id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(tabs[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(tabs[tabs.length - 1].id);
    }
  };

  const isSmall = size === 'sm';

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`relative inline-flex items-center bg-slate-100/90 p-1 rounded-full text-xs shadow-2xs select-none ${className}`}
    >
      {/* Sliding Pill Indicator */}
      <div
        className={`absolute top-1 bottom-1 rounded-full pointer-events-none ${pillClassName}`}
        style={{
          transform: `translateX(${indicator.left}px)`,
          width: `${indicator.width}px`,
          opacity: indicator.ready ? 1 : 0,
          transition: reduced || !indicator.ready
            ? 'none'
            : `transform ${MOTION_DURATION.slidingPill}ms ${MOTION_EASING.editorial}, width ${MOTION_DURATION.slidingPill}ms ${MOTION_EASING.editorial}, opacity 150ms ease`,
        }}
        aria-hidden="true"
      />

      {/* Tabs */}
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el);
              else tabRefs.current.delete(tab.id);
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`relative z-10 font-semibold cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-full flex items-center gap-1.5 ${
              isSmall ? 'px-3.5 py-1 text-xs' : 'px-4 py-1.5 text-xs'
            } ${
              isActive
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-900 active:text-slate-900'
            } ${tabClassName}`}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono transition-colors duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
