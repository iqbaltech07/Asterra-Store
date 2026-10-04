'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCartShopping,
  faBars,
  faXmark,
  faBox,
  faUser,
  faRightFromBracket,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import { useCartStore } from '@/store/use-cart-store';
import { useAuthStore } from '@/store/use-auth-store';
import { useSession, signOut } from '@/lib/auth-client';
import { CartDrawer } from '@/components/cart/cart-drawer';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { getTotalItems } = useCartStore();
  const { data: session } = useSession();
  const { user: legacyUser, logout: legacyLogout } = useAuthStore();

  const pathname = usePathname();
  const router = useRouter();
  const headerRef = useRef<HTMLElement>(null);

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
    try {
      await signOut();
    } catch {
      // Ignore if offline
    }
    legacyLogout();
    handleActionNotice('Anda telah keluar dari akun.');
  };

  const isHomeActive = pathname === '/';
  const isProductsActive = pathname.startsWith('/products');
  const isOrdersActive = pathname.startsWith('/orders');

  return (
    <>
      <header ref={headerRef} className="sticky top-0 z-40 w-full px-2 sm:px-6 pt-2.5 pb-2 transition-colors duration-150">
        <div className="max-w-7xl mx-auto rounded-2xl bg-[#121A2A] border border-white/10 shadow-navbar px-3.5 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div data-gsap="nav-logo" className="flex items-center gap-3">
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
            <Link
              href="/daftar-sales"
              className="text-primary hover:text-primary/80 transition-colors font-semibold"
            >
              Daftar Sales
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Trigger Button */}
            <button
              type="button"
              data-gsap="nav-action"
              className="relative inline-flex items-center gap-2 h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-[#182235] border border-white/10 hover:border-[#C96F55]/50 text-[#F7F5EF] text-xs sm:text-sm font-medium transition-all shadow-inner cursor-pointer group active:scale-95"
              onClick={() => setIsCartOpen(true)}
              aria-label="Buka Keranjang Pesanan"
            >
              <FontAwesomeIcon icon={faCartShopping} className="w-4 h-4 text-[#C96F55] transition-transform group-hover:scale-110" />
              <span className="hidden sm:inline">Pesanan</span>
              {getTotalItems() > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#C96F55] text-[#F7F5EF] text-[11px] font-bold flex items-center justify-center -mr-1 shadow-xs animate-in zoom-in-75">
                  {getTotalItems()}
                </span>
              )}
            </button>

            {/* Auth Actions */}
            {currentUser ? (
              <div data-gsap="nav-action" className="hidden sm:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl border border-white/10 bg-[#182235] hover:border-[#C96F55]/40 hover:bg-[#1e2a40] transition-all text-xs font-medium text-[#F7F5EF] focus:outline-none focus:ring-2 focus:ring-[#C96F55]/30 cursor-pointer"
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
                      <span className="inline-block max-w-[90px] truncate text-[#F7F5EF] text-xs font-medium">
                        {currentUser.name?.split(' ')[0] || 'Profil'}
                      </span>
                      <FontAwesomeIcon icon={faChevronDown} className="w-3 h-3 text-[#F7F5EF]/60 inline-block" />
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
              <div data-gsap="nav-action" className="hidden sm:flex items-center">
                <Link href="/login">
                  <Button
                    size="sm"
                    className="bg-[#C96F55] hover:bg-[#B86047] text-[#F7F5EF] font-semibold text-xs sm:text-sm h-9 sm:h-10 px-5 rounded-xl shadow-xs transition-transform active:scale-95"
                  >
                    Masuk
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              data-gsap="nav-action"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-[#F7F5EF]/80 hover:text-[#F7F5EF] rounded-xl hover:bg-[#182235] transition-colors"
              aria-label="Buka Menu"
            >
              {isMobileMenuOpen ? (
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              ) : (
                <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-2 rounded-2xl bg-[#121A2A] border border-white/10 shadow-2xl p-4 space-y-4 animate-in slide-in-from-top-2 text-[#F7F5EF]">
            {currentUser ? (
              <div className="p-3 rounded-xl bg-[#182235] border border-white/10 flex items-center justify-between gap-3">
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 group"
                >
                  {userImage ? (
                    <Image
                      src={userImage}
                      alt={currentUser.name || 'Profil'}
                      width={36}
                      height={36}
                      unoptimized
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-white/20 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[rgba(201,111,85,0.2)] border border-[rgba(201,111,85,0.4)] text-[#C96F55] flex items-center justify-center font-bold text-sm shrink-0">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="font-semibold text-xs text-[#F7F5EF] group-hover:text-[#C96F55] transition-colors truncate">
                      {currentUser.name || 'Profil Pengguna'}
                    </p>
                    <p className="text-[11px] text-[#F7F5EF]/60 truncate">
                      {currentUser.email || 'Lihat Akun & Pesanan'}
                    </p>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="text-xs text-[#F7F5EF]/80 hover:text-status-error shrink-0"
                  aria-label="Keluar"
                >
                  <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="pb-1">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full block"
                >
                  <Button size="sm" className="w-full text-xs font-semibold h-10 rounded-xl bg-[#C96F55] hover:bg-[#B86047] text-[#F7F5EF]">
                    Masuk Akun
                  </Button>
                </Link>
              </div>
            )}

            <nav className="flex flex-col space-y-2 text-sm font-medium">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2 px-3 rounded-lg transition-colors ${
                  isHomeActive ? 'bg-[#182235] text-[#C96F55] font-semibold' : 'text-[#F7F5EF]/80 hover:text-[#F7F5EF] hover:bg-[#182235]'
                }`}
              >
                Beranda
              </Link>
              <Link
                href="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2 px-3 rounded-lg transition-colors ${
                  isProductsActive ? 'bg-[#182235] text-[#C96F55] font-semibold' : 'text-[#F7F5EF]/80 hover:text-[#F7F5EF] hover:bg-[#182235]'
                }`}
              >
                Katalog Produk
              </Link>
              <Link
                href="/orders"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2 px-3 rounded-lg transition-colors ${
                  isOrdersActive ? 'bg-[#182235] text-[#C96F55] font-semibold' : 'text-[#F7F5EF]/80 hover:text-[#F7F5EF] hover:bg-[#182235]'
                }`}
              >
                Pesanan Saya
              </Link>
              <Link
                href={currentUser ? '/profile' : '/login'}
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg text-[#F7F5EF]/80 hover:text-[#F7F5EF] hover:bg-[#182235] transition-colors"
              >
                Profil Saya
              </Link>
              <Link
                href="/#keunggulan"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg text-[#F7F5EF]/80 hover:text-[#F7F5EF] hover:bg-[#182235] transition-colors"
              >
                Keunggulan
              </Link>
              <Link
                href="/#panduan"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg text-[#F7F5EF]/80 hover:text-[#F7F5EF] hover:bg-[#182235] transition-colors"
              >
                Cara Pemesanan
              </Link>
              <Link
                href="/daftar-sales"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1 text-primary font-semibold hover:text-primary/80"
              >
                Daftar Jadi Sales (Komisi 15%)
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Cart Drawer Modal */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          router.push('/checkout');
        }}
      />
    </>
  );
}

export default Header;
