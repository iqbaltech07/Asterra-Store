'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBox,
  faUser,
  faRightFromBracket,
  faChevronDown,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { useAuthStore } from '@/store/use-auth-store';
import { useSession } from '@/lib/auth-client';
import { useQueryClient } from '@tanstack/react-query';
import { performCustomerLogout } from '@/lib/utils/auth-logout';
import { AsterraLogo } from '@/components/ui/asterra-logo';
import { Button } from '@/components/ui/button';
import { animateNavbar } from '@/lib/animations/gsap-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onNotify?: (message: string) => void;
}

export function Header({ onNotify }: HeaderProps) {
  const { data: session } = useSession();
  const { user: legacyUser } = useAuthStore();

  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const cleanup = animateNavbar(headerRef.current);
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const handleActionNotice = (msg: string) => {
    if (onNotify) onNotify(msg);
  };

  const currentUser = session?.user || legacyUser;
  const userImage = currentUser && 'image' in currentUser ? (currentUser as { image?: string | null }).image : null;

  const handleLogout = async () => {
    await performCustomerLogout({
      queryClient,
      currentPath: pathname,
      onNotice: handleActionNotice,
    });
  };

  const isHomeActive = pathname === '/';
  const isProductsActive = pathname.startsWith('/products') || pathname.startsWith('/product');
  const isOrdersActive = pathname.startsWith('/orders');

  return (
    <header ref={headerRef} className="sticky top-0 z-40 w-full px-2 sm:px-6 pt-2 pb-1.5 transition-colors duration-150">
      <div className="max-w-7xl mx-auto rounded-2xl bg-[#121A2A] border border-white/10 shadow-navbar px-3 sm:px-5 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Brand Logo with Planet Animation */}
        <div data-gsap="nav-logo" className="flex items-center shrink-0">
          <AsterraLogo
            variant="navbar"
            size="md"
            linkToHome={true}
          />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-[13px] font-medium">
          <Link
            href="/"
            prefetch={true}
            data-gsap="nav-link"
            className={`transition-colors py-1 ${
              isHomeActive
                ? 'text-[#C96F55] font-semibold'
                : 'text-[#F7F5EF]/80 hover:text-[#F7F5EF]'
            }`}
          >
            Beranda
          </Link>
          <Link
            href="/products"
            prefetch={true}
            data-gsap="nav-link"
            className={`transition-colors py-1 ${
              isProductsActive
                ? 'text-[#C96F55] font-semibold'
                : 'text-[#F7F5EF]/80 hover:text-[#F7F5EF]'
            }`}
          >
            Katalog Produk
          </Link>
          <Link
            href="/orders"
            prefetch={true}
            data-gsap="nav-link"
            className={`transition-colors py-1 inline-flex items-center gap-1.5 ${
              isOrdersActive
                ? 'text-[#C96F55] font-semibold'
                : 'text-[#F7F5EF]/80 hover:text-[#F7F5EF]'
            }`}
          >
            <FontAwesomeIcon icon={faBox} className="w-3.5 h-3.5 text-[#C96F55]" />
            <span>Pesanan Saya</span>
          </Link>
          <Link
            href="/#keunggulan"
            data-gsap="nav-link"
            className="text-[#F7F5EF]/80 hover:text-[#F7F5EF] transition-colors py-1"
          >
            Keunggulan
          </Link>
          <Link
            href="/#panduan"
            data-gsap="nav-link"
            className="text-[#F7F5EF]/80 hover:text-[#F7F5EF] transition-colors py-1"
          >
            Cara Pemesanan
          </Link>
        </nav>

        {/* Action Buttons (Desktop & Compact Mobile) */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Mobile Search Icon */}
          <Link
            href="/products"
            data-gsap="nav-action"
            className="p-2 text-[#F7F5EF]/80 hover:text-[#F7F5EF] rounded-xl hover:bg-[#182235] transition-colors flex items-center justify-center"
            aria-label="Cari Produk di Katalog"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4" />
          </Link>

          {/* User Account Dropdown / Login Button */}
          {currentUser ? (
            <div data-gsap="nav-action">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl border border-white/10 bg-[#182235] hover:border-[#C96F55]/40 hover:bg-[#1e2a40] transition-all text-xs font-medium text-[#F7F5EF] focus:outline-none focus:ring-2 focus:ring-[#C96F55]/30 cursor-pointer"
                    aria-label="Menu Akun Pengguna"
                  >
                    {userImage ? (
                      <Image
                        src={userImage}
                        alt={currentUser.name || 'Profil'}
                        width={28}
                        height={28}
                        unoptimized
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[rgba(201,111,85,0.2)] border border-[rgba(201,111,85,0.4)] text-[#C96F55] flex items-center justify-center font-bold text-xs">
                        {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <span className="hidden sm:inline-block max-w-[90px] truncate text-[#F7F5EF] text-xs font-medium">
                      {currentUser.name?.split(' ')[0] || 'Profil'}
                    </span>
                    <FontAwesomeIcon icon={faChevronDown} className="w-3 h-3 text-[#F7F5EF]/60 hidden sm:inline-block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white text-[#121A2A] border border-[rgba(18,26,42,0.1)] shadow-editorial">
                  <DropdownMenuLabel className="font-normal py-2.5 px-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs font-semibold leading-none text-[#121A2A] truncate">
                        {currentUser.name || 'Pengguna Asterra'}
                      </p>
                      <p className="text-[11px] leading-none text-[#5F6C80] truncate">
                        {currentUser.email || 'Akun Aktif'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[rgba(18,26,42,0.08)]" />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer w-full text-[#121A2A] hover:text-[#C96F55]">
                      <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5 text-[#C96F55]" />
                      <span>Profil Saya</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center gap-2 cursor-pointer w-full text-[#121A2A] hover:text-[#C96F55]">
                      <FontAwesomeIcon icon={faBox} className="w-3.5 h-3.5 text-[#C96F55]" />
                      <span>Pesanan Saya</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[rgba(18,26,42,0.08)]" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-status-error focus:text-status-error focus:bg-status-error/10 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faRightFromBracket} className="w-3.5 h-3.5" />
                    <span>Keluar Akun</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div data-gsap="nav-action" className="flex items-center">
              <Link href="/login">
                <Button
                  size="sm"
                  className="bg-[#C96F55] hover:bg-[#B86047] text-[#F7F5EF] font-semibold text-xs sm:text-sm h-8 sm:h-9 px-3.5 sm:px-5 rounded-xl shadow-xs transition-transform active:scale-95"
                >
                  Masuk
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
