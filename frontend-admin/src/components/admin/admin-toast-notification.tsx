'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShoppingBag,
  Wallet,
  X,
  ChevronRight,
  User,
  Package,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils/format';

export type AdminToastType = 'order_created' | 'payout_requested';

export interface AdminToastMetadata {
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  productName?: string;
  totalAmount?: number;
  requestId?: string;
  partnerName?: string;
  partnerCode?: string;
  amount?: number;
  bankName?: string;
  bankAccount?: string;
}

export interface AdminToastItem {
  id: string; // Stable unique ID (e.g. "order:AST-ORD-123" or "payout:payreq-456")
  type: AdminToastType;
  title: string;
  description: string;
  timestamp: number;
  metadata: AdminToastMetadata;
  targetTab: 'orders' | 'affiliate';
  durationMs?: number; // default 5500ms
}

interface AdminToastCardProps {
  toast: AdminToastItem;
  onDismiss: (id: string) => void;
  onNavigate: (tab: 'orders' | 'affiliate') => void;
}

export const AdminToastCard: React.FC<AdminToastCardProps> = ({
  toast,
  onDismiss,
  onNavigate,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const duration = toast.durationMs || 5500;
  const remainingTimeRef = useRef(duration);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerExit = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 280); // matches slide-up transition duration
  }, [onDismiss, toast.id]);

  // Auto-dismiss timer with hover-pause support
  useEffect(() => {
    if (isHovered || isExiting) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      triggerExit();
    }, remainingTimeRef.current);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isHovered, isExiting, triggerExit]);

  const handleMouseEnter = () => {
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(500, remainingTimeRef.current - elapsed);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate(toast.targetTab);
    triggerExit();
  };

  const isOrder = toast.type === 'order_created';

  return (
    <div
      role="alert"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        transition: 'all 280ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`pointer-events-auto relative w-full sm:w-[410px] select-none cursor-pointer overflow-hidden rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200/90 dark:border-zinc-800 shadow-[0_12px_36px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_18px_44px_rgba(0,0,0,0.16)] transition-all ${
        isExiting
          ? 'opacity-0 -translate-y-4 scale-[0.98]'
          : 'opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-top-4 duration-300'
      }`}
    >
      {/* Top Header / App Pill & Meta */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-1 border-b border-slate-100 dark:border-zinc-800/60">
        <div className="flex items-center gap-2">
          {/* Status Indicator Pill */}
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
              isOrder
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/40'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                isOrder ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}
            />
            {isOrder ? 'Pesanan Masuk' : 'Pencairan Komisi'}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
            ASTERRA STORE
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
            Baru saja
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerExit();
            }}
            className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
            title="Tutup notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Notification Content */}
      <div className="p-3.5 sm:p-4">
        <div className="flex items-start gap-3">
          {/* Notification Icon */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              isOrder
                ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/80 text-emerald-600 border border-emerald-200/70 dark:from-emerald-950/60 dark:to-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/60'
                : 'bg-gradient-to-br from-indigo-50 to-indigo-100/80 text-indigo-600 border border-indigo-200/70 dark:from-indigo-950/60 dark:to-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/60'
            }`}
          >
            {isOrder ? (
              <ShoppingBag className="w-5 h-5" />
            ) : (
              <Wallet className="w-5 h-5" />
            )}
          </div>

          {/* Texts & Chips */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug tracking-tight">
              {toast.title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-zinc-300 mt-0.5 line-clamp-2 leading-relaxed">
              {toast.description}
            </p>

            {/* Additional Structured Metadata Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              {isOrder ? (
                <>
                  {toast.metadata.customerName && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-[11px] font-medium text-slate-700 dark:text-zinc-200 max-w-[150px] truncate">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{toast.metadata.customerName}</span>
                    </span>
                  )}
                  {toast.metadata.productName && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-[11px] font-medium text-slate-700 dark:text-zinc-200 max-w-[170px] truncate">
                      <Package className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{toast.metadata.productName}</span>
                    </span>
                  )}
                  {typeof toast.metadata.totalAmount === 'number' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30">
                      <CreditCard className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span>{formatRupiah(toast.metadata.totalAmount)}</span>
                    </span>
                  )}
                </>
              ) : (
                <>
                  {toast.metadata.partnerName && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-[11px] font-medium text-slate-700 dark:text-zinc-200 max-w-[150px] truncate">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{toast.metadata.partnerName}</span>
                    </span>
                  )}
                  {typeof toast.metadata.amount === 'number' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/30">
                      <CreditCard className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span>{formatRupiah(toast.metadata.amount)}</span>
                    </span>
                  )}
                  {toast.metadata.requestId && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-[10px] font-mono font-medium text-slate-500 dark:text-zinc-400 max-w-[130px] truncate">
                      <span>{toast.metadata.requestId}</span>
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Action Footer Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-50/70 dark:bg-zinc-800/40 border-t border-slate-100 dark:border-zinc-800/60 text-[11px] text-slate-500 dark:text-zinc-400 group">
        <span className="flex items-center gap-1 font-medium">
          <Sparkles className="w-3 h-3 text-primary" />
          {isOrder ? 'Klik untuk tinjau pesanan' : 'Klik untuk kelola pencairan'}
        </span>
        <span className="inline-flex items-center gap-0.5 font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
          Buka
          <ChevronRight className="w-3 h-3" />
        </span>
      </div>

      {/* Auto-Dismiss Smooth Depleting Progress Indicator */}
      <div className="h-[2px] w-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
        <div
          style={{
            animation: `shrinkWidth ${duration}ms linear forwards`,
            animationPlayState: isHovered || isExiting ? 'paused' : 'running',
          }}
          className={`h-full ${isOrder ? 'bg-emerald-500' : 'bg-indigo-500'}`}
        />
      </div>

      <style jsx>{`
        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

interface AdminToastContainerProps {
  toasts: AdminToastItem[];
  onDismiss: (id: string) => void;
  onNavigate: (tab: 'orders' | 'affiliate') => void;
}

export const AdminToastContainer: React.FC<AdminToastContainerProps> = ({
  toasts,
  onDismiss,
  onNavigate,
}) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-label="Admin Notifications"
      className="fixed top-4 right-4 z-[9999] pointer-events-none flex flex-col items-center sm:items-end gap-2.5 sm:gap-3 max-w-[calc(100vw-2rem)] sm:max-w-md w-full inset-x-4 sm:inset-x-auto"
    >
      {toasts.map((toast) => (
        <AdminToastCard
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
};
