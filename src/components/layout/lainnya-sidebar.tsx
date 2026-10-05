'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faUser,
  faReceipt,
  faStar,
  faBookOpen,
  faHeadset,
  faChevronRight,
  faRightFromBracket,
  faRightToBracket,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigationStore } from '@/store/use-navigation-store';
import { useSession } from '@/lib/auth-client';
import { useAuthStore } from '@/store/use-auth-store';
import { useQueryClient } from '@tanstack/react-query';
import { performCustomerLogout } from '@/lib/utils/auth-logout';

export function LainnyaSidebar() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { isSidebarOpen, closeSidebar } = useNavigationStore();
  const { data: session } = useSession();
  const { user: legacyUser } = useAuthStore();
  const currentUser = session?.user || legacyUser;
  const userImage = currentUser && 'image' in currentUser ? (currentUser as { image?: string | null }).image : null;

  // Handle ESC key press to close sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSidebarOpen) {
        closeSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, closeSidebar]);

  // Lock document body scroll when sidebar is open, restore on close
  useEffect(() => {
    if (isSidebarOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isSidebarOpen]);

  const handleLogout = async () => {
    closeSidebar();
    await performCustomerLogout({
      queryClient,
      currentPath: pathname,
    });
  };

  const navMenuItems = [
    {
      title: 'Akun Saya',
      subtitle: 'Kelola akun & profil',
      href: '/profile',
      icon: faUser,
      isExternal: false,
    },
    {
      title: 'Pesanan Saya',
      subtitle: 'Lacak pesanan pribadi',
      href: '/orders?tab=my-orders',
      icon: faReceipt,
      isExternal: false,
    },
    {
      title: 'Keunggulan',
      subtitle: 'Kenapa memilih Asterra',
      href: '/#keunggulan',
      icon: faStar,
      isExternal: false,
    },
    {
      title: 'Cara Pemesanan',
      subtitle: 'Panduan transaksi',
      href: '/#panduan',
      icon: faBookOpen,
      isExternal: false,
    },
    {
      title: 'Customer Service',
      subtitle: 'Hubungi tim bantuan',
      href: 'https://wa.me/6281234567890?text=Halo%20CS%20Asterra%20Store%2C%20saya%20butuh%20bantuan%20layanan.',
      icon: faHeadset,
      isExternal: true,
    },
  ];

  if (!isSidebarOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu Navigasi Lainnya"
      className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200"
    >
      {/* Backdrop Overlay */}
      <div
        onClick={closeSidebar}
        className="fixed inset-0 bg-[#121A2A]/70 backdrop-blur-xs transition-opacity cursor-pointer"
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#121A2A] text-[#F7F5EF] border-l border-white/10 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-right duration-250 ease-out">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#C96F55] block">
              Menu Sekunder
            </span>
            <h2 className="text-lg font-black tracking-tight text-[#F7F5EF] mt-0.5">
              LAINNYA
            </h2>
          </div>

          <button
            type="button"
            onClick={closeSidebar}
            className="w-9 h-9 rounded-xl bg-[#182235] hover:bg-[#202d44] border border-white/10 text-[#F7F5EF]/80 hover:text-[#F7F5EF] flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C96F55]/40"
            aria-label="Tutup menu"
          >
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
          </button>
        </div>

        {/* User Card if Authenticated, or Login Prompt if Guest */}
        <div className="px-5 pt-4 sm:px-6">
          {currentUser ? (
            <Link
              href="/profile"
              onClick={closeSidebar}
              className="p-3.5 rounded-2xl bg-[#182235] border border-white/10 flex items-center gap-3 hover:border-[#C96F55]/40 transition-colors group"
            >
              {userImage ? (
                <Image
                  src={userImage}
                  alt={currentUser.name || 'Profil'}
                  width={40}
                  height={40}
                  unoptimized
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[rgba(201,111,85,0.2)] border border-[rgba(201,111,85,0.4)] text-[#C96F55] flex items-center justify-center font-bold text-sm shrink-0">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#F7F5EF] group-hover:text-[#C96F55] transition-colors truncate">
                  {currentUser.name || 'Pengguna Asterra'}
                </p>
                <p className="text-[11px] text-[#F7F5EF]/60 truncate">
                  {currentUser.email || 'Akun Aktif'}
                </p>
              </div>
              <FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5 text-[#F7F5EF]/40 group-hover:text-[#C96F55] transition-colors shrink-0" />
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={closeSidebar}
              className="p-3.5 rounded-2xl bg-[#182235] border border-white/10 flex items-center justify-between hover:border-[#C96F55]/40 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[rgba(201,111,85,0.15)] text-[#C96F55] flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={faRightToBracket} className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#F7F5EF] group-hover:text-[#C96F55] transition-colors">
                    Masuk ke Akun
                  </p>
                  <p className="text-[11px] text-[#F7F5EF]/60">
                    Akses pesanan & profil Anda
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#C96F55] bg-[rgba(201,111,85,0.1)] px-2.5 py-1 rounded-lg">
                Masuk
              </span>
            </Link>
          )}
        </div>

        {/* Navigation Menu Links */}
        <div className="p-5 sm:p-6 space-y-2 flex-1">
          {navMenuItems.map((item) => {
            const content = (
              <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-[#182235]/60 hover:bg-[#182235] border border-white/5 hover:border-[#C96F55]/30 transition-all duration-150 group cursor-pointer">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white/5 group-hover:bg-[rgba(201,111,85,0.15)] text-[#F7F5EF]/80 group-hover:text-[#C96F55] flex items-center justify-center transition-colors shrink-0">
                    <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-[13px] font-bold text-[#F7F5EF] group-hover:text-[#C96F55] transition-colors block">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-[#F7F5EF]/50 block">
                      {item.subtitle}
                    </span>
                  </div>
                </div>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="w-3.5 h-3.5 text-[#F7F5EF]/30 group-hover:text-[#C96F55] transition-colors shrink-0 ml-2"
                />
              </div>
            );

            if (item.isExternal) {
              return (
                <a
                  key={item.title}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeSidebar}
                  className="block"
                >
                  {content}
                </a>
              );
            }

            return (
              <Link
                key={item.title}
                href={item.href}
                onClick={closeSidebar}
                className="block"
              >
                {content}
              </Link>
            );
          })}
        </div>

        {/* Bottom Panel */}
        <div className="p-5 sm:p-6 border-t border-white/10 space-y-3 bg-[#0d1421]">
          {currentUser && (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors cursor-pointer"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="w-3.5 h-3.5" />
              <span>Keluar dari Akun</span>
            </button>
          )}

          <div className="text-center">
            <p className="text-[10px] text-[#F7F5EF]/40 font-mono">
              AsterraStore © 2026 • Lisensi & Akun Digital Resmi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
