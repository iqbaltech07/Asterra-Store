'use client';

import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { MOTION_DURATION, MOTION_EASING, isReducedMotion } from '@/lib/motion';

export interface SlidingPillTabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export interface SlidingPillTabsProps<T extends string = string> {
  items: SlidingPillTabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  className?: string;
  pillClassName?: string;
  itemClassName?: string;
  size?: 'sm' | 'default';
  ariaLabel?: string;
}

export function SlidingPillTabs<T extends string = string>({
  items,
  activeId,
  onChange,
  className = '',
  pillClassName = '',
  itemClassName = '',
  size = 'default',
  ariaLabel = 'Filter Tabs',
}: SlidingPillTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const updateIndicator = React.useCallback(() => {
    if (!containerRef.current) return;
    const activeBtn = containerRef.current.querySelector<HTMLButtonElement>(`[data-tab-id="${activeId}"]`);
    if (!activeBtn) return;

    setIndicatorStyle({
      left: activeBtn.offsetLeft,
      width: activeBtn.offsetWidth,
      opacity: 1,
    });
  }, [activeId]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator, items]);

  useEffect(() => {
    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateIndicator]);

  const reduced = isReducedMotion();

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`relative inline-flex items-center bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-full shadow-2xs select-none ${className}`}
    >
      {/* Sliding Pill Indicator */}
      <div
        className={`absolute top-1 bottom-1 rounded-full bg-[#334155] dark:bg-primary shadow-xs pointer-events-none ${pillClassName}`}
        style={{
          transform: `translateX(${indicatorStyle.left}px)`,
          width: `${indicatorStyle.width}px`,
          opacity: indicatorStyle.opacity,
          transition: reduced
            ? 'none'
            : `transform ${MOTION_DURATION.panel}ms ${MOTION_EASING.standard}, width ${MOTION_DURATION.panel}ms ${MOTION_EASING.standard}, opacity 150ms ease`,
        }}
      />

      {/* Tab Buttons */}
      {items.map((item) => {
        const isActive = item.id === activeId;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            data-tab-id={item.id}
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={`relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-colors duration-150 cursor-pointer ${
              size === 'sm' ? 'px-3 py-0.5 text-[11px]' : 'px-3.5 py-1 text-xs'
            } ${
              isActive
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            } ${itemClassName}`}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
