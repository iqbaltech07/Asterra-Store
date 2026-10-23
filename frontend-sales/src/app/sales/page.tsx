'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faWallet,
  faShareNodes,
  faStore,
  faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';
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
        localStorage.removeItem('asterra_admin_user');
        localStorage.removeItem('asterra_sales_token');
        sessionStorage.clear();

        // Expire all auth cookies on client domain
        const cookieNames = [
          'better-auth.session_token',
          '__Secure-better-auth.session_token',
          'asterra_admin_session',
          'asterra_session',
        ];
        cookieNames.forEach((name) => {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0;`;
        });
      }

      // Purge sessions on both Next.js route handler and FastAPI backend
      await Promise.allSettled([
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }),
        fetch('/api/v1/admin/auth/logout', { method: 'POST', credentials: 'include' }),
      ]);
    } catch {
      // ignore network errors during logout
    } finally {
      if (typeof window !== 'undefined') {
        window.location.replace('/sales/login?logged_out=1');
      }
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center shadow-subtle animate-pulse">
            <FontAwesomeIcon icon={faShareNodes} className="text-base text-primary" />
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
        <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/70 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-surface-secondary border border-white/70 transition-colors"
              aria-label="Buka Menu Sidebar"
            >
              <FontAwesomeIcon icon={faBars} className="text-base" />
            </button>
            <div className="flex flex-col animate-text-smooth" key={activeTab}>
              <div className="flex items-center gap-1.5 text-[11px] text-[#6680A8] font-medium">
                <span className="font-semibold text-[#10213D]">Asterra Sales</span>
                <span>/</span>
                <span className="capitalize text-[#2563EB] font-semibold">
                  {currentTabMeta.category}
                </span>
              </div>
              <h1 className="text-base sm:text-xl font-extrabold text-[#10213D] tracking-tight leading-tight">
                {currentTabMeta.title}
              </h1>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setActiveTab('sales-wallet')}
              className="text-xs gap-1.5 shadow-xs font-semibold bg-[#16A36A] hover:bg-[#15803D] text-white rounded-xl h-9"
            >
              <FontAwesomeIcon icon={faWallet} className="text-xs" />
              <span>Dompet Komisi</span>
            </Button>

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-white hover:bg-surface-secondary text-xs text-foreground font-medium shadow-xs transition-colors"
            >
              <FontAwesomeIcon icon={faStore} className="text-xs text-[#2563EB]" />
              <span>Lihat Toko</span>
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[10px] text-foreground-muted" />
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
