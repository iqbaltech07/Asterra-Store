'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/use-cart-store';
import { useAuthStore } from '@/store/use-auth-store';
import { useSession, signOut } from '@/lib/auth-client';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { AsterraLogo } from '@/components/ui/asterra-logo';
import { ShoppingCart, Menu, X, Package, LogOut, User, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onNotify?: (message: string) => void;
}

export function Header({ onNotify }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { getTotalItems } = useCartStore();
  const { data: session } = useSession();
  const { user: legacyUser, logout: legacyLogout } = useAuthStore();

  const currentUser = session?.user || legacyUser;
  const userImage = currentUser && 'image' in currentUser ? currentUser.image : null;

  const handleActionNotice = (message: string) => {
    if (onNotify) {
      onNotify(message);
    }
  };

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
      <header className="sticky top-0 z-40 w-full px-2 sm:px-6 pt-2.5 pb-2 transition-all">
        <div className="max-w-7xl mx-auto rounded-2xl bg-navy-900 border border-navy-border shadow-navbar px-3.5 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <AsterraLogo
              variant="navbar"
              size="md"
              showBadge={true}
              badgeText="Toko Digital Premium"
              linkToHome={true}
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-[13px] font-medium">
            <Link
              href="/"
              className={`transition-colors py-1 ${
                isHomeActive
                  ? 'text-accent font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Beranda
            </Link>
            <Link
              href="/products"
              className={`transition-colors py-1 ${
                isProductsActive
                  ? 'text-accent font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Katalog Produk
            </Link>
            <Link
              href="/orders"
              className={`transition-colors py-1 inline-flex items-center gap-1.5 ${
                isOrdersActive
                  ? 'text-accent font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-accent" />
              <span>Pesanan Saya</span>
            </Link>
            <Link
              href="/#keunggulan"
              className="text-slate-300 hover:text-white transition-colors py-1"
            >
              Keunggulan
            </Link>
            <Link
              href="/#panduan"
              className="text-slate-300 hover:text-white transition-colors py-1"
            >
              Cara Pemesanan
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Trigger Button */}
            <button
              type="button"
              className="relative inline-flex items-center gap-2 h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-navy-800/90 border border-navy-border hover:border-accent/50 text-slate-200 hover:text-white text-xs sm:text-sm font-medium transition-all shadow-inner cursor-pointer group active:scale-95"
              onClick={() => setIsCartOpen(true)}
              aria-label="Buka Keranjang Pesanan"
            >
              <ShoppingCart className="w-4 h-4 text-accent transition-transform group-hover:scale-110" />
              <span className="hidden sm:inline">Pesanan</span>
              {getTotalItems() > 0 && (
                <span className="w-5 h-5 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center -mr-1 shadow-sm animate-in zoom-in-75">
                  {getTotalItems()}
                </span>
              )}
            </button>

            {/* Auth Actions */}
            {currentUser ? (
              <div className="hidden sm:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl border border-navy-border bg-navy-800/90 hover:border-accent/40 hover:bg-navy-700/80 transition-all text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer"
                      aria-label="Menu Akun Pengguna"
                    >
                      {userImage ? (
                        <img
                          src={userImage}
                          alt={currentUser.name || 'Profil'}
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-navy-border"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/40 text-accent flex items-center justify-center font-bold text-xs">
                          {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <span className="inline-block max-w-[90px] truncate text-slate-100 text-xs font-medium">
                        {currentUser.name?.split(' ')[0] || 'Profil'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 inline-block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white text-navy-900 border border-border shadow-editorial">
                    <DropdownMenuLabel className="font-normal py-2.5 px-3">
                      <div className="flex flex-col space-y-1">
                        <p className="text-xs font-semibold leading-none text-navy-900 truncate">
                          {currentUser.name || 'Pengguna Asterra'}
                        </p>
                        <p className="text-[11px] leading-none text-foreground-muted truncate">
                          {currentUser.email || 'Akun Aktif'}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/60" />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2 cursor-pointer w-full text-navy-900 hover:text-accent">
                        <User className="w-4 h-4 text-accent" />
                        <span>Profil Saya</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="flex items-center gap-2 cursor-pointer w-full text-navy-900 hover:text-accent">
                        <Package className="w-4 h-4 text-accent" />
                        <span>Pesanan Saya</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/60" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-status-error focus:text-status-error focus:bg-status-error/10 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar Akun</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden sm:flex items-center">
                <Link href="/login">
                  <Button
                    size="sm"
                    className="bg-accent hover:bg-accent-hover text-white font-semibold text-xs sm:text-sm h-9 sm:h-10 px-5 rounded-xl shadow-sm transition-transform active:scale-95"
                  >
                    Masuk
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white rounded-xl hover:bg-navy-800/80 transition-colors"
              aria-label="Buka Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-2 rounded-2xl bg-navy-950 border border-navy-border shadow-2xl p-4 space-y-4 animate-in slide-in-from-top-2 text-white">
            {currentUser ? (
              <div className="p-3 rounded-xl bg-navy-900 border border-navy-border flex items-center justify-between gap-3">
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 group"
                >
                  {userImage ? (
                    <img
                      src={userImage}
                      alt={currentUser.name || 'Profil'}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-navy-border shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/40 text-accent flex items-center justify-center font-bold text-sm shrink-0">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="font-semibold text-xs text-white group-hover:text-accent transition-colors truncate">
                      {currentUser.name || 'Profil Pengguna'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
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
                  className="text-xs text-slate-300 hover:text-status-error shrink-0"
                  aria-label="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="pb-1">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full block"
                >
                  <Button size="sm" className="w-full text-xs font-semibold h-10 rounded-xl bg-accent hover:bg-accent-hover text-white">
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
                  isHomeActive ? 'bg-navy-800 text-accent font-semibold' : 'text-slate-300 hover:text-white hover:bg-navy-900'
                }`}
              >
                Beranda
              </Link>
              <Link
                href="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2 px-3 rounded-lg transition-colors ${
                  isProductsActive ? 'bg-navy-800 text-accent font-semibold' : 'text-slate-300 hover:text-white hover:bg-navy-900'
                }`}
              >
                Katalog Produk
              </Link>
              <Link
                href="/orders"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2 px-3 rounded-lg transition-colors ${
                  isOrdersActive ? 'bg-navy-800 text-accent font-semibold' : 'text-slate-300 hover:text-white hover:bg-navy-900'
                }`}
              >
                Pesanan Saya
              </Link>
              <Link
                href={currentUser ? '/profile' : '/login'}
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg text-slate-300 hover:text-white hover:bg-navy-900 transition-colors"
              >
                Profil Saya
              </Link>
              <Link
                href="/#keunggulan"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg text-slate-300 hover:text-white hover:bg-navy-900 transition-colors"
              >
                Keunggulan
              </Link>
              <Link
                href="/#panduan"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg text-slate-300 hover:text-white hover:bg-navy-900 transition-colors"
              >
                Cara Pemesanan
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
