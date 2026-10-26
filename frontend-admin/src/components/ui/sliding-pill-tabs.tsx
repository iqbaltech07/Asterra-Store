'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MOTION_DURATION, MOTION_EASING, isReducedMotion } from '@/lib/motion';

export interface SlidingTabOption<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export type SlidingPillTabItem<T extends string = string> = SlidingTabOption<T>;

export interface SlidingPillTabsProps<T extends string = string> {
  tabs?: Array<SlidingTabOption<T>>;
  items?: Array<SlidingTabOption<T>>;
  activeTab?: T;
  activeId?: T;
  onChange: (tabId: T) => void;
  ariaLabel?: string;
  className?: string;
  pillClassName?: string;
  tabClassName?: string;
  itemClassName?: string;
  size?: 'sm' | 'md' | 'default';
}

export function SlidingPillTabs<T extends string = string>({
  tabs,
  items,
  activeTab,
  activeId,
  onChange,
  ariaLabel = 'Pilihan Tab',
  className = '',
  pillClassName = 'bg-[#334155] dark:bg-primary shadow-xs',
  tabClassName = '',
  itemClassName = '',
  size = 'sm',
}: SlidingPillTabsProps<T>) {
  const effectiveTabs = React.useMemo(() => tabs || items || [], [tabs, items]);
  const currentActive = (activeTab ?? activeId ?? (effectiveTabs[0]?.id as T)) as T;

  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const updateIndicator = useCallback(() => {
    const activeBtn = tabRefs.current.get(currentActive);
    const container = containerRef.current;
    if (activeBtn && container) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      const left = btnRect.left - containerRect.left;
      const width = btnRect.width;
      setIndicator({ left, width, ready: true });
    }
  }, [currentActive]);

  useEffect(() => {
    updateIndicator();
  }, [updateIndicator, currentActive, effectiveTabs]);

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
      const nextIndex = (currentIndex + 1) % effectiveTabs.length;
      onChange(effectiveTabs[nextIndex].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + effectiveTabs.length) % effectiveTabs.length;
      onChange(effectiveTabs[prevIndex].id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(effectiveTabs[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(effectiveTabs[effectiveTabs.length - 1].id);
    }
  };

  const isSmall = size === 'sm';

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`relative inline-flex items-center bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-full text-xs shadow-2xs select-none ${className}`}
    >
      {/* Sliding Pill Indicator with Signature Sales Motion */}
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
      {effectiveTabs.map((tab, idx) => {
        const isActive = currentActive === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el);
              else tabRefs.current.delete(tab.id);
            }}
            type="button"
            role="tab"
            data-tab-id={tab.id}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`relative z-10 font-semibold cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-full flex items-center gap-1.5 ${
              isSmall ? 'px-3.5 py-1 text-xs' : 'px-4 py-1.5 text-xs'
            } ${
              isActive
                ? 'text-white font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white active:text-slate-900'
            } ${tabClassName} ${itemClassName}`}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono transition-colors duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
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
