'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { getSafeInternalRedirectUrl, setStoredReturnUrl } from '@/lib/utils/url';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLock,
  faRightToBracket,
  faUserPlus,
  faXmark,
  faShieldHalved,
  faBagShopping,
} from '@fortawesome/free-solid-svg-icons';

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
  message = 'Untuk melakukan pemesanan atau checkout produk resmi Asterra Store, Anda wajib masuk terlebih dahulu.',
  callbackUrl,
}: AuthRequiredModalProps) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!mounted || !isOpen) return null;

  // Resolve target callback URL safely preserving any existing query params in browser
  const currentPathWithSearch =
    typeof window !== 'undefined'
      ? window.location.pathname + window.location.search
      : pathname || '/';
  const effectiveCallback = getSafeInternalRedirectUrl(
    callbackUrl || currentPathWithSearch || '/',
    '/'
  );
  const loginUrl = `/login?callbackUrl=${encodeURIComponent(effectiveCallback)}`;
  const registerUrl = `/register?callbackUrl=${encodeURIComponent(effectiveCallback)}`;

  const handleNavigateToLogin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (effectiveCallback && effectiveCallback !== '/') {
      setStoredReturnUrl(effectiveCallback);
    }
    onClose();
  };

  const handleNavigateToRegister = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (effectiveCallback && effectiveCallback !== '/') {
      setStoredReturnUrl(effectiveCallback);
    }
    onClose();
  };

  const modalJSX = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#121A2A]/70 backdrop-blur-sm pointer-events-auto select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div
        className="bg-white border border-[rgba(18,26,42,0.12)] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden relative select-auto pointer-events-auto transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-[#121A2A] p-5 sm:p-6 border-b border-white/10 flex items-start justify-between text-[#F7F5EF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(201,111,85,0.2)] border border-[rgba(201,111,85,0.4)] flex items-center justify-center text-[#C96F55] shrink-0 shadow-inner">
              <FontAwesomeIcon icon={faLock} className="text-base pointer-events-none" />
            </div>
            <div>
              <h3 id="auth-modal-title" className="text-base font-bold text-[#F7F5EF] leading-snug">
                {title}
              </h3>
              <p className="text-xs text-[#C96F55] font-semibold flex items-center gap-1.5 mt-0.5">
                <FontAwesomeIcon icon={faShieldHalved} className="text-[11px] pointer-events-none" />
                <span>Asterra Customer Protection</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#F7F5EF]/80 hover:text-[#F7F5EF] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup Popup"
          >
            <FontAwesomeIcon icon={faXmark} className="text-sm pointer-events-none" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 bg-white text-[#121A2A]">
          <p className="text-xs sm:text-sm text-[#121A2A]/70 leading-relaxed">
            {message}
          </p>

          <div className="bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)] rounded-xl p-3.5 flex items-start gap-3">
            <FontAwesomeIcon icon={faBagShopping} className="text-sm text-[#C96F55] shrink-0 mt-0.5 pointer-events-none" />
            <div className="text-xs text-[#121A2A]/70">
              <span className="font-bold text-[#121A2A]">Keuntungan Akun Asterra:</span>{' '}
              Akses instan garansi lisensi digital, pelacakan riwayat pesanan real-time, dan klaim garansi otomatis 1-klik.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Link
              href={loginUrl}
              onClick={handleNavigateToLogin}
              className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C96F55]/40 bg-[#C96F55] text-white hover:bg-[#B86047] active:bg-[#A9553E] shadow-sm font-bold text-xs sm:text-sm h-11 gap-2 cursor-pointer active:scale-98"
            >
              <FontAwesomeIcon icon={faRightToBracket} className="text-xs pointer-events-none" />
              <span>Masuk Sekarang</span>
            </Link>
            <Link
              href={registerUrl}
              onClick={handleNavigateToRegister}
              className="flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#121A2A]/20 border border-[rgba(18,26,42,0.15)] bg-white hover:bg-[#F8FAFC] active:bg-white text-[#121A2A] font-semibold text-xs sm:text-sm h-11 gap-2 cursor-pointer active:scale-98"
            >
              <FontAwesomeIcon icon={faUserPlus} className="text-xs pointer-events-none" />
              <span>Daftar Akun Baru</span>
            </Link>
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[rgba(18,26,42,0.08)] text-center">
          <p className="text-[11px] text-[#121A2A]/60">
            Sudah punya akun? Masuk untuk melanjutkan pemesanan Anda dengan aman.
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
}
