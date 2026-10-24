'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faWallet,
  faShareNodes,
  faStore,
  faArrowUpRightFromSquare,
  faChevronDown,
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

function SalesPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getTabFromUrl = useCallback((): AdminTab | null => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const t = sp.get('tab');
      if (t && t in TAB_TITLES) return t as AdminTab;
    }
    const t = searchParams?.get('tab');
    if (t && t in TAB_TITLES) return t as AdminTab;
    return null;
  }, [searchParams]);

  const [adminUser, setAdminUser] = useState<{ id?: string; email: string; name?: string; role?: string } | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const initialUrlTab = getTabFromUrl();
  const [activeTab, setActiveTab] = useState<AdminTab>(initialUrlTab || 'sales-overview');
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  const handleTabChange = useCallback((newTab: AdminTab) => {
    setActiveTab(newTab);
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.get('tab') !== newTab) {
        currentUrl.searchParams.set('tab', newTab);
        window.history.pushState({ tab: newTab }, '', currentUrl.pathname + currentUrl.search);
      }
    }
  }, []);

  // Synchronize with browser Back and Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const currentUrlTab = getTabFromUrl();
      if (currentUrlTab) {
        setActiveTab(currentUrlTab);
      } else {
        setActiveTab('sales-overview');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getTabFromUrl]);

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
          const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/sales';
          router.replace(`/sales/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
          return;
        }
        const data = await res.json();
        if (!data.authenticated) {
          const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/sales';
          router.replace(`/sales/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
          return;
        }
        setAdminUser(data.admin);
        const currentUrlTab = getTabFromUrl();
        if (currentUrlTab) {
          setActiveTab(currentUrlTab);
        }
      } catch {
        const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/sales';
        router.replace(`/sales/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
      } finally {
        setIsAuthChecking(false);
      }
    }
    verifyAuth();
  }, [router, getTabFromUrl]);

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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentTabMeta = TAB_TITLES[activeTab] || {
    category: 'Portal Penjualan',
    title: 'Portal Mitra Sales',
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans selection:bg-primary/20 selection:text-primary">
      {/* Desktop Sidebar (hidden on mobile, uses bottom nav & mobile sheet instead) */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        adminUser={adminUser}
        onLogout={handleLogout}
        isOpenMobile={isSidebarMobileOpen}
        onCloseMobile={() => setIsSidebarMobileOpen(false)}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Responsive Sticky Header Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-3.5 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Desktop Hamburger (for lg toggle if needed) */}
            <button
              type="button"
              onClick={() => setIsSidebarMobileOpen(true)}
              className="hidden p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-surface-secondary border border-border transition-colors cursor-pointer"
              aria-label="Buka Menu Sidebar"
            >
              <FontAwesomeIcon icon={faBars} className="text-base" />
            </button>

            {/* Mobile Brand Badge */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-xs lg:hidden">
              <FontAwesomeIcon icon={faShareNodes} className="text-xs" />
            </div>

            <div className="flex flex-col min-w-0 animate-text-smooth" key={activeTab}>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#64748B] font-medium">
                <span>Sales Portal</span>
                <span>/</span>
                <span className="capitalize text-[#64748B] font-medium">
                  {currentTabMeta.category}
                </span>
              </div>
              <h1 className="text-base sm:text-2xl font-bold text-[#0F172A] tracking-tight leading-tight truncate">
                {currentTabMeta.title}
              </h1>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Dompet Shortcut (desktop & tablet) */}
            <Button
              size="sm"
              onClick={() => handleTabChange('sales-wallet')}
              className="text-xs gap-1.5 shadow-xs font-semibold bg-[#16A36A] hover:bg-[#15803D] text-white rounded-xl h-8 sm:h-9 px-2.5 sm:px-3.5 cursor-pointer"
            >
              <FontAwesomeIcon icon={faWallet} className="text-xs" />
              <span className="hidden xs:inline">Dompet Komisi</span>
              <span className="xs:hidden">Dompet</span>
            </Button>

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-slate-200/80 bg-white/70 hover:bg-white text-xs text-foreground font-medium shadow-2xs transition-colors"
            >
              <FontAwesomeIcon icon={faStore} className="text-xs text-[#2563EB]" />
              <span className="hidden md:inline">Lihat Toko</span>
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[10px] text-slate-400" />
            </Link>

            {/* Mobile More / Profile Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden flex items-center gap-1.5 p-1 sm:p-1.5 rounded-xl border border-slate-200 bg-white/80 hover:bg-white text-xs text-foreground shadow-2xs cursor-pointer active:scale-95 transition-all"
              aria-label="Buka Menu Lainnya"
            >
              <div className="w-7 h-7 rounded-lg bg-[#111318] text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'SP'}
              </div>
              <FontAwesomeIcon icon={faBars} className="text-xs text-slate-400 px-1" />
            </button>

            {/* Desktop Sales Partner Avatar Chip */}
            <div className="hidden lg:flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-white/70 border border-slate-200/80 shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-[#111318] text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'SP'}
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                  {adminUser?.name || 'Mitra Sales'}
                </span>
                <span className="text-[10px] text-slate-400 font-normal mt-0.5">Sales Affiliate</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Body with Mobile Safe Area Padding */}
        <main className="flex-1 max-w-7xl mx-auto px-3.5 sm:px-8 pt-4 sm:pt-6 pb-24 lg:pb-8 w-full">
          <SalesConsoleSuite
            activeTab={activeTab}
            onTabChange={handleTabChange}
            adminUser={adminUser}
          />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Ultra-responsive 5 Core Destinations) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
          {/* 1. Beranda */}
          <button
            type="button"
            onClick={() => handleTabChange('sales-overview')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
              activeTab === 'sales-overview'
                ? 'text-[#2563EB] font-bold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-all ${
                activeTab === 'sales-overview' ? 'bg-blue-50 text-[#2563EB]' : ''
              }`}
            >
              <FontAwesomeIcon icon={faStore} className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight leading-none">Beranda</span>
          </button>

          {/* 2. Katalog */}
          <button
            type="button"
            onClick={() => handleTabChange('sales-catalog')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
              activeTab === 'sales-catalog'
                ? 'text-[#2563EB] font-bold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-all ${
                activeTab === 'sales-catalog' ? 'bg-blue-50 text-[#2563EB]' : ''
              }`}
            >
              <FontAwesomeIcon icon={faBars} className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight leading-none">Katalog</span>
          </button>

          {/* 3. Bagikan */}
          <button
            type="button"
            onClick={() => handleTabChange('sales-links')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
              activeTab === 'sales-links'
                ? 'text-[#2563EB] font-bold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-all ${
                activeTab === 'sales-links' ? 'bg-blue-50 text-[#2563EB]' : ''
              }`}
            >
              <FontAwesomeIcon icon={faShareNodes} className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight leading-none">Bagikan</span>
          </button>

          {/* 4. Pesanan */}
          <button
            type="button"
            onClick={() => handleTabChange('sales-orders')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
              activeTab === 'sales-orders'
                ? 'text-[#2563EB] font-bold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-all ${
                activeTab === 'sales-orders' ? 'bg-blue-50 text-[#2563EB]' : ''
              }`}
            >
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight leading-none">Pesanan</span>
          </button>

          {/* 5. Dompet */}
          <button
            type="button"
            onClick={() => handleTabChange('sales-wallet')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
              activeTab === 'sales-wallet'
                ? 'text-[#16A36A] font-bold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-all ${
                activeTab === 'sales-wallet' ? 'bg-emerald-50 text-[#16A36A]' : ''
              }`}
            >
              <FontAwesomeIcon icon={faWallet} className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight leading-none">Dompet</span>
          </button>
        </div>
      </nav>

      {/* Mobile Quick Menu Sheet / Drawer (for secondary tabs & account) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white rounded-t-3xl border-t border-slate-200 p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 shadow-2xl"
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto" />

            {/* Profile Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#111318] text-white font-bold text-sm flex items-center justify-center shadow-xs">
                  {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'SP'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    {adminUser?.name || 'Mitra Sales'}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {adminUser?.email || 'sales@asterrastore.biz.id'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
                aria-label="Tutup Menu"
              >
                ✕
              </button>
            </div>

            {/* Secondary Navigation Options */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1 mb-1">
                Menu & Fitur Lainnya
              </span>

              {/* Bonus Tim & Teman */}
              <button
                type="button"
                onClick={() => {
                  handleTabChange('sales-network');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                  activeTab === 'sales-network'
                    ? 'bg-blue-50/80 border-blue-200 text-[#2563EB] font-bold'
                    : 'bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center border border-purple-200/60">
                    <FontAwesomeIcon icon={faShareNodes} className="text-xs" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Bonus Tim & Teman Sales</span>
                    <span className="text-[10px] text-slate-500 block">Bonus pasif 2% dari transaksi teman</span>
                  </div>
                </div>
                <span className="text-xs text-slate-400">&rarr;</span>
              </button>

              {/* Panduan & Edukasi */}
              <button
                type="button"
                onClick={() => {
                  handleTabChange('sales-academy');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                  activeTab === 'sales-academy'
                    ? 'bg-blue-50/80 border-blue-200 text-[#2563EB] font-bold'
                    : 'bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center border border-amber-200/60">
                    <FontAwesomeIcon icon={faBars} className="text-xs" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Panduan & Edukasi Mitra</span>
                    <span className="text-[10px] text-slate-500 block">Materi promosi, tips closing & FAQ</span>
                  </div>
                </div>
                <span className="text-xs text-slate-400">&rarr;</span>
              </button>

              {/* Buka Toko Asterra */}
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 text-slate-700 hover:bg-slate-100 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-200/60">
                    <FontAwesomeIcon icon={faStore} className="text-xs" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Kunjungi Toko Asterra</span>
                    <span className="text-[10px] text-slate-500 block">Buka etalase toko pelanggan</span>
                  </div>
                </div>
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-xs text-slate-400" />
              </Link>
            </div>

            {/* Logout Action */}
            <div className="pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full h-11 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 rounded-2xl gap-2 cursor-pointer"
              >
                <span>Keluar dari Akun Sales</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SalesPortalPage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <SalesPortalContent />
    </Suspense>
  );
}
