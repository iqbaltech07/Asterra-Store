'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/use-cart-store';
import { useAuthStore } from '@/store/use-auth-store';
import { useSession, signOut } from '@/lib/auth-client';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Menu, X, Package, LogOut } from 'lucide-react';

interface HeaderProps {
  onNotify?: (message: string) => void;
}

export function Header({ onNotify }: HeaderProps) {
  const router = useRouter();
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

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                A
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base tracking-tight text-foreground">
                  Asterra Store
                </span>
                <span className="text-[10px] text-foreground-muted font-normal leading-none hidden sm:inline">
                  Toko Digital Premium
                </span>
              </div>
            </Link>

            <Badge
              variant="outline"
              className="hidden md:inline-flex ml-2 text-[11px] font-normal text-foreground-muted border-border"
            >
              Terpercaya
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-foreground-muted">
            <Link href="/products" className="hover:text-foreground transition-colors">
              Katalog Produk
            </Link>
            <Link href="/orders" className="hover:text-foreground transition-colors inline-flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-primary" />
              <span>Pesanan Saya</span>
            </Link>
            <Link href="/#keunggulan" className="hover:text-foreground transition-colors">
              Keunggulan
            </Link>
            <Link href="/#panduan" className="hover:text-foreground transition-colors">
              Cara Pemesanan
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Cart Trigger */}
            <Button
              variant="outline"
              size="sm"
              className="relative gap-2 border-border hover:border-primary/40 transition-colors"
              onClick={() => setIsCartOpen(true)}
              aria-label="Buka Keranjang Pesanan"
            >
              <ShoppingCart className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Pesanan</span>
              {getTotalItems() > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center -mr-1">
                  {getTotalItems()}
                </span>
              )}
            </Button>

            {/* Auth Actions */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border border-border bg-surface-raised hover:border-primary/40 hover:shadow-xs transition-all text-xs font-medium text-foreground group"
                  aria-label="Buka Profil Pengguna"
                >
                  {userImage ? (
                    <img
                      src={userImage}
                      alt={currentUser.name || 'Profil'}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-border group-hover:ring-primary/50 transition-all"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[11px]">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="max-w-[100px] truncate text-foreground group-hover:text-primary transition-colors font-medium">
                    {currentUser.name || 'Profil'}
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="h-8 w-8 p-0 text-foreground-muted hover:text-status-error hover:bg-status-error/10 transition-colors"
                  title="Keluar dari Akun"
                  aria-label="Keluar dari Akun"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link href="/login">
                  <Button size="sm" className="text-xs font-medium">
                    Masuk
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-foreground-muted hover:text-foreground rounded-md"
              aria-label="Buka Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-4 animate-in slide-in-from-top-2">
            {currentUser ? (
              <div className="p-3 rounded-lg bg-surface-raised border border-border flex items-center justify-between gap-3">
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 group"
                >
                  {userImage ? (
                    <img
                      src={userImage}
                      alt={currentUser.name || 'Profil'}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-border shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                      {currentUser.name || 'Profil Pelanggan'}
                    </p>
                    <p className="text-[11px] text-foreground-muted truncate">
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
                  className="text-xs text-foreground-muted hover:text-status-error shrink-0"
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
                  <Button size="sm" className="w-full text-xs font-medium">
                    Masuk Akun
                  </Button>
                </Link>
              </div>
            )}

            <nav className="flex flex-col space-y-2 text-sm font-medium">
              <Link
                href="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1 text-foreground-muted hover:text-foreground"
              >
                Katalog Produk
              </Link>
              <Link
                href="/orders"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1 text-foreground-muted hover:text-foreground"
              >
                Pesanan Saya
              </Link>
              {currentUser && (
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-1 text-foreground-muted hover:text-foreground"
                >
                  Profil Pengguna
                </Link>
              )}
              <Link
                href="/#keunggulan"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1 text-foreground-muted hover:text-foreground"
              >
                Keunggulan Layanan
              </Link>
              <Link
                href="/#panduan"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1 text-foreground-muted hover:text-foreground"
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
