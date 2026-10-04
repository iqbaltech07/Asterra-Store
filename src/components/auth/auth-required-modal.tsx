'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock, LogIn, UserPlus, X, ShieldCheck, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  callbackUrl?: string;
}

export function AuthRequiredModal({
  isOpen,
  onClose,
  title = 'Silakan Masuk ke Akun Anda',
  message = 'Untuk menambahkan produk ke keranjang belanja atau melakukan checkout pesanan, Anda wajib masuk terlebih dahulu.',
  callbackUrl,
}: AuthRequiredModalProps) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const effectiveCallback = callbackUrl || pathname || '/';
  const loginUrl = `/login?callbackUrl=${encodeURIComponent(effectiveCallback)}`;
  const registerUrl = `/register?callbackUrl=${encodeURIComponent(effectiveCallback)}`;

  const modalJSX = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface border border-primary/30 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4 border-b border-border flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0 shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground leading-snug">
                  {title}
                </h3>
              </div>
              <p className="text-xs text-primary font-medium flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Asterra Secure Customer Protection</span>
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full text-foreground-muted hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
            {message}
          </p>

          <div className="bg-surface-raised border border-border/80 rounded-xl p-3.5 flex items-start gap-3">
            <ShoppingBag className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-foreground-muted">
              <span className="font-semibold text-foreground">Keuntungan Akun Asterra:</span>{' '}
              Akses instan garansi lisensi digital, pelacakan riwayat pesanan real-time, dan klaim garansi otomatis 1-klik.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Link
              href={loginUrl}
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 bg-[#C96F55] text-white hover:bg-[#B86047] active:bg-[#A9553E] shadow-md font-semibold text-xs h-10 gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk Sekarang</span>
            </Link>
            <Link
              href={registerUrl}
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 border border-border bg-surface hover:bg-surface-raised active:bg-surface text-foreground font-medium text-xs h-10 gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar Akun Baru</span>
            </Link>
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="px-6 py-3 bg-surface-raised/50 border-t border-border text-center">
          <p className="text-[11px] text-foreground-muted">
            Sudah punya akun? Masuk untuk melanjutkan belanja Anda dengan aman.
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
}
