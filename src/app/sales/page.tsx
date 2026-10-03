'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, LogOut, Wallet, Share2, Store, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { AdminSidebar, AdminTab } from '@/components/admin/admin-sidebar';
import { SalesConsoleSuite } from '@/components/sales/sales-console-suite';

const TAB_TITLES: Record<string, { category: string; title: string }> = {
  'sales-overview': { category: 'Portal Penjualan', title: 'Ringkasan Performa & Komisi Sales' },
  'sales-catalog': { category: 'Portal Penjualan', title: 'Katalog Produk & Estimasi Komisi' },
  'sales-links': { category: 'Portal Penjualan', title: 'Generator Tautan & Materi Promosi' },
  'sales-orders': { category: 'Portal Penjualan', title: 'Pesanan Referral Saya' },
  'sales-network': { category: 'Portal Penjualan', title: 'Bonus Komisi Tim & Teman Sales' },
  'sales-wallet': { category: 'Portal Penjualan', title: 'Dompet & Pencairan Komisi' },
  'sales-academy': { category: 'Portal Penjualan', title: 'Panduan & Edukasi Mitra Sales' },
};

export default function SalesPortalPage() {
  const router = useRouter();

  const [adminUser, setAdminUser] = useState<{ id?: string; email: string; name?: string; role?: string } | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('sales-overview');
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  useEffect(() => {
    async function verifyAuth() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('asterra_admin_token') : null;
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch('/api/v1/admin/auth/me', { headers });
        if (!res.ok) {
          router.replace('/sales/login');
          return;
        }
        const data = await res.json();
        if (!data.authenticated) {
          router.replace('/sales/login');
          return;
        }
        setAdminUser(data.admin);
      } catch {
        router.replace('/sales/login');
      } finally {
        setIsAuthChecking(false);
      }
    }
    verifyAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('asterra_admin_token');
      }
      await fetch('/api/v1/admin/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      router.replace('/sales/login');
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center shadow-subtle animate-pulse">
            <Share2 className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs text-foreground-muted tracking-widest uppercase font-mono">
            Memuat Portal Sales Asterra...
          </span>
        </div>
      </div>
    );
  }

  const currentTabMeta = TAB_TITLES[activeTab] || {
    category: 'Portal Penjualan',
    title: 'Portal Mitra Sales',
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans selection:bg-primary/20 selection:text-primary">
      {/* Sidebar with Sales Accordion Menus */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
        }}
        adminUser={adminUser}
        onLogout={handleLogout}
        isOpenMobile={isSidebarMobileOpen}
        onCloseMobile={() => setIsSidebarMobileOpen(false)}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Header Bar */}
        <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-raised border border-border transition-colors"
              aria-label="Buka Menu Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
                <span className="font-medium text-foreground">Asterra Store</span>
                <span>/</span>
                <span className="capitalize text-primary font-semibold">
                  {currentTabMeta.category}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-tight">
                {currentTabMeta.title}
              </h1>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setActiveTab('sales-wallet')}
              className="text-xs gap-1.5 shadow-xs font-semibold bg-status-success hover:bg-status-success/90 text-white"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Dompet Komisi</span>
            </Button>

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-raised text-xs text-foreground font-medium transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-primary" />
              <span>Lihat Toko</span>
              <ExternalLink className="w-3 h-3 text-foreground-muted" />
            </Link>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-6 w-full">
          <SalesConsoleSuite
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
            adminUser={adminUser}
          />
        </main>
      </div>
    </div>
  );
}
