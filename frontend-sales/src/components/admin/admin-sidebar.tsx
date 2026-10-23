'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Share2,
  Wallet,
  Award,
  Store,
  ChevronDown,
  LogOut,
  ExternalLink,
  ShieldCheck,
  X,
} from 'lucide-react';

export type AdminTab =
  // PORTAL PENJUALAN (SALES)
  | 'sales-overview'
  | 'sales-catalog'
  | 'sales-links'
  | 'sales-orders'
  | 'sales-network'
  | 'sales-wallet'
  | 'sales-academy'
  // LEGACY ALIASES (FALLBACK TO SALES OVERVIEW)
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'vip-explorer'
  | 'providers'
  | 'orders'
  | 'customers'
  | 'refunds'
  | 'affiliate'
  | 'promos'
  | 'campaigns'
  | 'banners'
  | 'wallets'
  | 'revenue'
  | 'expenses'
  | 'profit'
  | 'financial-transactions'
  | 'sales-summary'
  | 'product-performance'
  | 'affiliate-performance'
  | 'financial-reports'
  | 'payment-settings'
  | 'logs'
  | 'notifications'
  | 'admins'
  | 'store-settings';

interface NavSubItem {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number | null;
  badgeVariant?: 'default' | 'success' | 'warning' | 'primary';
  description?: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavSubItem[];
}

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  metrics?: {
    total?: number;
    totalActive?: number;
    totalArchived?: number;
    totalWarnings?: number;
    vipBalance?: number | null;
  };
  adminUser: { id?: string; email: string; name?: string; role?: string } | null;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function AdminSidebar({
  activeTab,
  onTabChange,
  metrics,
  adminUser,
  onLogout,
  isOpenMobile,
  onCloseMobile,
}: AdminSidebarProps) {
  const userRole = (adminUser?.role || 'sales').toLowerCase();

  // Navigation categories for Asterra Sales Representative Console (Port 3002)
  // Regardless of whether accessed by sales partner or admin inspecting sales,
  // this application is strictly the Sales Portal.
  const navGroups: NavGroup[] = useMemo(() => {
    return [
      {
        id: 'sales-portal',
        label: 'PORTAL PENJUALAN',
        icon: Share2,
        items: [
          {
            id: 'sales-overview',
            label: 'Ringkasan Performa',
            icon: LayoutDashboard,
            description: 'KPI komisi, link referral, & ringkasan penjualan',
          },
          {
            id: 'sales-catalog',
            label: 'Katalog & Komisi',
            icon: Package,
            badge: metrics?.total !== undefined ? metrics.total : '230+',
            badgeVariant: 'primary',
            description: 'Katalog toko & kalkulasi estimasi komisi',
          },
          {
            id: 'sales-links',
            label: 'Tautan & Materi Promo',
            icon: Share2,
            description: 'Link kustom UTM & template teks copywriting',
          },
          {
            id: 'sales-orders',
            label: 'Pesanan Referral Saya',
            icon: ShoppingBag,
            description: 'Daftar pesanan dari link referral Anda',
          },
          {
            id: 'sales-network',
            label: 'Bonus Tim & Teman',
            icon: Users,
            badge: 'Komisi Tim',
            badgeVariant: 'success',
            description: 'Bonus pasif dari teman yang diajak jadi sales',
          },
          {
            id: 'sales-wallet',
            label: 'Dompet & Pencairan',
            icon: Wallet,
            description: 'Saldo siap tarik & pengajuan penarikan dana',
          },
          {
            id: 'sales-academy',
            label: 'Panduan & Edukasi',
            icon: Award,
            description: 'Pedoman promosi, FAQ komisi, & bantuan admin',
          },
        ],
      },
    ];
  }, [metrics?.total]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'sales-portal': true,
  });

  // Monetira Sliding Indicator Measurement
  const navContainerRef = React.useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({
    top: 0,
    height: 0,
    opacity: 0,
  });

  const updateIndicator = React.useCallback(() => {
    if (!navContainerRef.current) return;
    const activeEl = navContainerRef.current.querySelector<HTMLElement>(
      `[data-active-tab="${activeTab}"]`
    );
    if (activeEl) {
      const containerRect = navContainerRef.current.getBoundingClientRect();
      const itemRect = activeEl.getBoundingClientRect();
      const top = itemRect.top - containerRect.top + navContainerRef.current.scrollTop;
      setIndicatorStyle({
        top,
        height: itemRect.height,
        opacity: 1,
      });
    } else {
      setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();
    const timer = setTimeout(updateIndicator, 50);
    const timer2 = setTimeout(updateIndicator, 240);
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [activeTab, openGroups, updateIndicator]);

  // Accessibility: Close mobile drawer on Escape key press
  useEffect(() => {
    if (!isOpenMobile) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpenMobile, onCloseMobile]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleSelectTab = (tab: AdminTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#111111] text-[#F5F5F5] select-none border-r border-white/10">
      {/* 1. Header / Logo Area */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <Link
          href="/sales"
          className="flex items-center gap-2.5 group transition-transform active:scale-98"
        >
          <div className="w-8 h-8 rounded-lg bg-[#1B1B1B] border border-white/15 flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-xs group-hover:border-white/30 transition-colors">
            AS
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
              Asterra<span className="text-[#2563EB]">Store</span>
            </span>
            <span className="text-[10px] text-[#A3A3A3] font-mono tracking-wider uppercase font-semibold">
              Portal Mitra Sales
            </span>
          </div>
        </Link>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-[#A3A3A3] hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
          aria-label="Tutup Menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Quick Live Status Bar */}
      <div className="px-4 py-2.5 bg-[#161616] border-b border-white/5 text-[11px] flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#A3A3A3]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A36A] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A36A]"></span>
          </span>
          <span className="font-medium text-[#16A36A]">Mitra Aktif</span>
        </div>
        <span className="text-[10px] font-mono text-white font-bold bg-[#222222] border border-white/10 px-2 py-0.5 rounded-md">
          Portal Sales
        </span>
      </div>

      {/* 3. Navigation List with Dropdown/Accordion Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-3.5 space-y-3 dark-scrollbar">
        {navGroups.map((group) => {
          const isOpen = Boolean(openGroups[group.id]);
          const GroupIcon = group.icon;
          const hasActiveChild = group.items.some((item) => item.id === activeTab);

          return (
            <div key={group.id} className="space-y-1">
              {/* Category Dropdown Header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={isOpen}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
                  hasActiveChild
                    ? 'text-white'
                    : 'text-[#888888] hover:text-[#CCCCCC] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <GroupIcon className={`w-3.5 h-3.5 ${hasActiveChild ? 'text-[#2563EB]' : 'text-[#777777]'}`} />
                  <span className="uppercase text-[11px] tracking-wider font-bold">
                    {group.label}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 text-[#888888] ${
                    isOpen ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              </button>

              {/* Sub-items Container (Smooth CSS Grid Accordion) */}
              <div className={`accordion-grid-wrapper ${isOpen ? 'is-open' : ''}`}>
                <div className="accordion-grid-content">
                  <div className="pl-1.5 space-y-0.5 pt-0.5 border-l border-white/10 ml-3">
                    {group.items.map((subItem) => {
                      const isActive = activeTab === subItem.id;
                      const SubIcon = subItem.icon;

                      return (
                        <button
                          key={subItem.id}
                          type="button"
                          data-active-tab={subItem.id}
                          onClick={() => handleSelectTab(subItem.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all group relative ${
                            isActive
                              ? 'bg-[#1B1B1B] text-white font-semibold border border-white/10 shadow-xs'
                              : 'text-[#A3A3A3] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#2563EB] rounded-r-full" />
                          )}

                          <div className="flex items-center gap-2.5 pl-1.5 truncate">
                            <SubIcon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive ? 'text-[#2563EB]' : 'text-[#888888] group-hover:text-white'
                              }`}
                            />
                            <span className="truncate">{subItem.label}</span>
                          </div>

                          {subItem.badge !== undefined && subItem.badge !== null && (
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                                subItem.badgeVariant === 'primary'
                                  ? 'bg-[#2563EB]/25 text-[#93C5FD] border border-[#2563EB]/40'
                                  : subItem.badgeVariant === 'success'
                                  ? 'bg-[#16A36A]/25 text-[#86EFAC] border border-[#16A36A]/40'
                                  : 'bg-white/10 text-[#D1D5DB] border border-white/15'
                              }`}
                            >
                              {subItem.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Separator & External Links */}
        <div className="pt-2 border-t border-white/10 space-y-1.5">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#A3A3A3] hover:text-white hover:bg-white/5 border border-white/10 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-[#2563EB]" />
              <span>Lihat Toko Publik</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#888888] group-hover:text-white transition-colors" />
          </Link>

          {/* Quick link to Admin Portal if user is Admin/Superadmin */}
          {(userRole === 'admin' || userRole === 'superadmin') && (
            <a
              href="/admin"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-blue-300 bg-[#2563EB]/15 hover:bg-[#2563EB]/25 border border-[#2563EB]/30 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                <span>Buka Konsol Admin</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#2563EB] group-hover:translate-x-0.5 transition-transform" />
            </a>
          )}
        </div>
      </div>

      {/* 4. Footer: User Profile & Logout */}
      <div className="p-3 border-t border-white/10 bg-[#141414] space-y-2">
        <div className="p-2.5 rounded-xl bg-[#1B1B1B] border border-white/10 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#8B5CF6] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {adminUser?.email?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {adminUser?.name || 'Mitra Sales'}
              </p>
              <p className="text-[10px] text-[#A3A3A3] truncate font-mono">
                {adminUser?.email || 'sales@asterra.store'}
              </p>
            </div>
          </div>
          {userRole === 'superadmin' ? (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
              Superadmin
            </span>
          ) : userRole === 'admin' ? (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40 shrink-0">
              Admin
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
              Mitra Sales
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/30 transition-all active:scale-98"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Sesi Sales</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 xl:w-72 h-screen sticky top-0 border-r border-white/10 bg-[#111111] shrink-0 z-30 shadow-subtle">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200 bg-[#111111]">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
