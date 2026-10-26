'use client';

import React, { createContext, useContext, useState, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { MOTION_DURATION, MOTION_EASING, isReducedMotion } from '@/lib/motion';

interface AccordionContextValue {
  expandedItems: Set<string>;
  toggleItem: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

export interface AccordionProps {
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  children: React.ReactNode;
  className?: string;
}

export function Accordion({
  type = 'single',
  defaultValue,
  children,
  className = '',
}: AccordionProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    if (!defaultValue) return new Set();
    if (Array.isArray(defaultValue)) return new Set(defaultValue);
    return new Set([defaultValue]);
  });

  const toggleItem = (value: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        if (type === 'single') {
          next.clear();
        }
        next.add(value);
      }
      return next;
    });
  };

  return (
    <AccordionContext.Provider value={{ expandedItems, toggleItem }}>
      <div className={`space-y-2.5 ${className}`}>{children}</div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps {
  value: string;
  title?: React.ReactNode;
  trigger?: React.ReactNode;
  icon?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  defaultOpen?: boolean;
}

export function AccordionItem({
  value,
  title,
  trigger,
  icon,
  headerRight,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
}: AccordionItemProps) {
  const ctx = useContext(AccordionContext);
  const autoId = useId();
  const triggerId = `accordion-trigger-${value || autoId}`;
  const contentId = `accordion-content-${value || autoId}`;

  const isOpen = ctx ? ctx.expandedItems.has(value) : false;
  const reduced = isReducedMotion();

  const handleToggle = () => {
    if (ctx) {
      ctx.toggleItem(value);
    }
  };

  const headerTitle = trigger ?? title;

  return (
    <div
      className={`rounded-2xl border transition-colors duration-200 overflow-hidden ${
        isOpen
          ? 'bg-white border-slate-300/80 shadow-xs'
          : 'bg-white/80 border-slate-200/80 hover:border-slate-300'
      } ${className}`}
    >
      {/* Header Accordion Button */}
      <button
        id={triggerId}
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between p-3.5 sm:p-4 text-left cursor-pointer transition-colors select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${headerClassName}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
          {icon && <div className="shrink-0">{icon}</div>}
          <div className="min-w-0 flex-1 font-bold text-xs sm:text-sm text-slate-900 truncate">
            {headerTitle}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {headerRight && (
            <div onClick={(e) => e.stopPropagation()}>{headerRight}</div>
          )}
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
              isOpen
                ? 'bg-slate-100 text-slate-900 rotate-180'
                : 'text-slate-400 hover:text-slate-600 rotate-0'
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* Accordion Content with CSS Grid Height Interpolation */}
      <div
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        className="grid"
        style={{
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          transition: reduced
            ? 'none'
            : `grid-template-rows ${MOTION_DURATION.accordion}ms ${MOTION_EASING.editorial}`,
        }}
      >
        <div className="overflow-hidden min-h-0">
          <div
            className={`px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-1 ${contentClassName}`}
            style={{
              opacity: isOpen ? 1 : 0,
              transition: reduced
                ? 'none'
                : `opacity 220ms ease ${isOpen ? '60ms' : '0ms'}`,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
