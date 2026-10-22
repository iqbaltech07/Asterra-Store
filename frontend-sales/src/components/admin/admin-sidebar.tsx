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
    <div className="flex flex-col h-full bg-surface select-none">
      {/* 1. Header / Logo Area */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <Link
          href="/sales"
          className="flex items-center gap-2.5 group transition-transform active:scale-98"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm tracking-wider shadow-xs">
            AS
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-tight text-foreground flex items-center gap-1">
              Asterra<span className="text-primary">Store</span>
            </span>
            <span className="text-[10px] text-foreground-muted font-mono tracking-wider uppercase font-semibold">
              Portal Mitra Sales
            </span>
          </div>
        </Link>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-raised border border-border transition-colors"
          aria-label="Tutup Menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Quick Live Status Bar */}
      <div className="px-4 py-2.5 bg-surface-raised/60 border-b border-border text-[11px] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-foreground-muted">
          <span className="w-2 h-2 rounded-full bg-status-success animate-pulse shrink-0" />
          <span className="font-medium text-foreground">Status: Aktif</span>
        </div>
        <span className="text-[10px] font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
          Console Mitra
        </span>
      </div>

      {/* 3. Navigation List with Dropdown/Accordion Groups & Monetira Sliding Indicator */}
      <div
        ref={navContainerRef}
        onScroll={updateIndicator}
        className="relative flex-1 overflow-y-auto px-3 py-4 space-y-3 custom-scrollbar"
      >
        {/* Floating Sliding Indicator Pill */}
        <div
          className="absolute left-3 right-3 rounded-lg bg-primary/10 border border-primary/20 pointer-events-none transition-all duration-200 ease-out z-0"
          style={{
            transform: `translateY(${indicatorStyle.top}px)`,
            height: `${indicatorStyle.height}px`,
            opacity: indicatorStyle.opacity,
            display: indicatorStyle.opacity ? 'block' : 'none',
          }}
        />

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
                    ? 'text-primary'
                    : 'text-foreground-muted hover:text-foreground hover:bg-surface-raised/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <GroupIcon className={`w-3.5 h-3.5 ${hasActiveChild ? 'text-primary' : 'text-foreground-muted'}`} />
                  <span className="uppercase text-[11px] tracking-wider font-bold">
                    {group.label}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 text-foreground-muted ${
                    isOpen ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              </button>

              {/* Sub-items Container (Smooth CSS Grid Accordion) */}
              <div className={`accordion-grid-wrapper ${isOpen ? 'is-open' : ''}`}>
                <div className="accordion-grid-content">
                  <div className="pl-2 space-y-0.5 pt-1 border-l border-border/60 ml-3">
                    {group.items.map((subItem) => {
                      const isActive = activeTab === subItem.id;
                      const SubIcon = subItem.icon;

                      return (
                        <button
                          key={subItem.id}
                          type="button"
                          data-active-tab={subItem.id}
                          onClick={() => handleSelectTab(subItem.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors group relative z-10 ${
                            isActive
                              ? 'text-primary font-semibold'
                              : 'text-foreground-muted hover:text-foreground hover:bg-surface-raised/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 pl-1 truncate">
                            <SubIcon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive ? 'text-primary' : 'text-foreground-muted group-hover:text-foreground'
                              }`}
                            />
                            <span className="truncate">{subItem.label}</span>
                          </div>

                          {subItem.badge !== undefined && subItem.badge !== null && (
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                                subItem.badgeVariant === 'primary'
                                  ? 'bg-primary/15 text-primary'
                                  : subItem.badgeVariant === 'success'
                                  ? 'bg-status-success/15 text-status-success'
                                  : 'bg-surface-raised border border-border text-foreground-muted'
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
        <div className="pt-2 border-t border-border space-y-1.5">
          <Link
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-surface-raised border border-border/80 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" />
              <span>Lihat Toko Publik (3000)</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-foreground-muted group-hover:text-primary transition-colors" />
          </Link>

          {/* Quick link to Admin Portal on Port 3001 if user is Admin/Superadmin */}
          {(userRole === 'admin' || userRole === 'superadmin') && (
            <a
              href="http://localhost:3001/admin"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Buka Konsol Admin (3001)</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-primary group-hover:translate-x-0.5 transition-transform" />
            </a>
          )}
        </div>
      </div>

      {/* 4. Footer: User Profile & Logout */}
      <div className="p-3 border-t border-border bg-surface-raised/40 space-y-2">
        <div className="p-2 rounded-lg bg-surface border border-border flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
              {adminUser?.email?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {adminUser?.name || 'Mitra Sales'}
              </p>
              <p className="text-[10px] text-foreground-muted truncate font-mono">
                {adminUser?.email || 'sales@asterra.store'}
              </p>
            </div>
          </div>
          {userRole === 'superadmin' ? (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30 shrink-0">
              Superadmin
            </span>
          ) : userRole === 'admin' ? (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-blue-500/15 text-blue-500 border border-blue-500/30 shrink-0">
              Admin
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-status-success/15 text-status-success border border-status-success/30 shrink-0">
              Mitra Sales
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-status-error hover:bg-status-error/10 border border-status-error/25 transition-colors"
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
      <aside className="hidden lg:block w-64 xl:w-72 h-screen sticky top-0 border-r border-border shrink-0 z-30 shadow-subtle">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
