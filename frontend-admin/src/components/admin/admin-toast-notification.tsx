'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShoppingBag,
  Wallet,
  X,
  User,
  Package,
  CreditCard,
  ArrowRight,
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
    }, 240); // matches slide-up transition duration
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
      className={`pointer-events-auto relative w-full select-none cursor-pointer overflow-hidden rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-[0_12px_36px_rgba(0,0,0,0.08),0_3px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)] transition-all motion-reduce:transition-none duration-250 ease-out ${
        isExiting
          ? 'opacity-0 -translate-y-3 scale-[0.98]'
          : 'opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-top-3'
      }`}
    >
      {/* 1. Header Bar: Badge Label + Source + Time + Close Button */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2 border-b border-[#F3F4F6]">
        <div className="flex items-center gap-2">
          {/* Label Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
              isOrder
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOrder ? 'bg-emerald-500' : 'bg-blue-600'
              }`}
            />
            {isOrder ? 'PESANAN MASUK' : 'PENARIKAN KOMISI'}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 tracking-wider">
            ASTERRA STORE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium">
            Baru saja
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerExit();
            }}
            className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Tutup notifikasi"
            aria-label="Tutup notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Content Body */}
      <div className="p-4">
        <div className="flex items-start gap-3.5">
          {/* Relevant Icon */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isOrder
                ? 'bg-emerald-50/80 text-emerald-600 border-emerald-100'
                : 'bg-blue-50/80 text-blue-600 border-blue-100'
            }`}
          >
            {isOrder ? (
              <ShoppingBag className="w-5 h-5" />
            ) : (
              <Wallet className="w-5 h-5" />
            )}
          </div>

          {/* Texts & Structured Information */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 leading-snug tracking-tight">
              {isOrder ? 'Pesanan baru masuk' : 'Pengajuan penarikan baru'}
            </h4>

            {/* Information Chips / Data rows based strictly on actual data */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {isOrder ? (
                <>
                  {toast.metadata.orderId && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-mono font-medium text-slate-700 truncate max-w-[170px]">
                      {toast.metadata.orderId}
                    </span>
                  )}
                  {toast.metadata.customerName && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700 truncate max-w-[150px]">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{toast.metadata.customerName}</span>
                    </span>
                  )}
                  {toast.metadata.productName && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700 truncate max-w-[180px]">
                      <Package className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{toast.metadata.productName}</span>
                    </span>
                  )}
                  {typeof toast.metadata.totalAmount === 'number' && toast.metadata.totalAmount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[11px] font-bold text-emerald-700 border border-emerald-200/70">
                      <CreditCard className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span>{formatRupiah(toast.metadata.totalAmount)}</span>
                    </span>
                  )}
                </>
              ) : (
                <>
                  {toast.metadata.partnerName && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700 truncate max-w-[160px]">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{toast.metadata.partnerName}</span>
                    </span>
                  )}
                  {toast.metadata.requestId && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono font-medium text-slate-600 truncate max-w-[150px]">
                      {toast.metadata.requestId}
                    </span>
                  )}
                  {typeof toast.metadata.amount === 'number' && toast.metadata.amount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[11px] font-bold text-blue-700 border border-blue-200/70">
                      <CreditCard className="w-3 h-3 text-blue-500 shrink-0" />
                      <span>{formatRupiah(toast.metadata.amount)}</span>
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Action Footer Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/70 border-t border-[#F3F4F6] text-xs group">
        <span className="text-[11px] text-slate-500 font-medium">
          {isOrder ? 'Klik notifikasi untuk memproses pesanan' : 'Klik notifikasi untuk memverifikasi penarikan'}
        </span>
        <button
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all shadow-xs ${
            isOrder
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <span>{isOrder ? 'Lihat pesanan' : 'Lihat pengajuan'}</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 4. Auto-Dismiss Smooth Depleting Progress Indicator */}
      <div className="h-[2px] w-full bg-slate-100 overflow-hidden">
        <div
          style={{
            animation: `shrinkWidth ${duration}ms linear forwards`,
            animationPlayState: isHovered || isExiting ? 'paused' : 'running',
          }}
          className={`h-full ${isOrder ? 'bg-emerald-500' : 'bg-blue-600'}`}
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
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex flex-col items-center gap-2.5 w-[calc(100vw-2rem)] sm:w-[460px] max-w-[460px]"
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
