'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Boxes,
  Package,
  FolderTree,
  DownloadCloud,
  Server,
  ShoppingBag,
  Users,
  AlertCircle,
  Sparkles,
  Share2,
  Tag,
  Flame,
  Image as ImageIcon,
  Wallet,
  TrendingUp,
  TrendingDown,
  Coins,
  Receipt,
  BarChart3,
  PackageCheck,
  Award,
  FileSpreadsheet,
  Sliders,
  CreditCard,
  Activity,
  Bell,
  ShieldCheck,
  Store,
  ChevronDown,
  LogOut,
  RefreshCw,
  ExternalLink,
  X,
} from 'lucide-react';

export type AdminTab =
  // OVERVIEW
  | 'dashboard'
  // KATALOG & LAYANAN
  | 'products'
  | 'categories'
  | 'vip-explorer'
  | 'providers'
  // TRANSAKSI
  | 'orders'
  | 'customers'
  | 'refunds'
  // MARKETING & GROWTH
  | 'affiliate'
  | 'promos'
  | 'campaigns'
  | 'banners'
  // KEUANGAN
  | 'wallets'
  | 'revenue'
  | 'expenses'
  | 'profit'
  | 'financial-transactions'
  // ANALYTICS & LAPORAN
  | 'sales-summary'
  | 'product-performance'
  | 'affiliate-performance'
  | 'financial-reports'
  // SISTEM & KONFIGURASI
  | 'payment-settings'
  | 'logs'
  | 'notifications'
  | 'admins'
  | 'store-settings'
  // PORTAL PENJUALAN (SALES)
  | 'sales-overview'
  | 'sales-catalog'
  | 'sales-links'
  | 'sales-orders'
  | 'sales-network'
  | 'sales-wallet'
  | 'sales-academy';

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
  isLoggingOut?: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function AdminSidebar({
  activeTab,
  onTabChange,
  metrics,
  adminUser,
  onLogout,
  isLoggingOut = false,
  isOpenMobile,
  onCloseMobile,
}: AdminSidebarProps) {
  const userRole = (adminUser?.role || 'admin').toLowerCase();

  // Navigation categories with dropdown items matching user requested 3-role RBAC:
  // - superadmin: SEMUA MENU (All 7 groups, 24 items)
  // - admin: HANYA BEBERAPA MENU (Operational groups only)
  // - sales: KHUSUS SALES SAJA (Portal Penjualan group only)
  const navGroups: NavGroup[] = useMemo(() => {
    // 1. Role: Sales -> ONLY Sales Portal items!
    if (userRole === 'sales') {
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
    }

    // 2. Role: Admin -> Operational items only
    if (userRole === 'admin') {
      return [
        {
          id: 'overview',
          label: 'OVERVIEW',
          icon: LayoutDashboard,
          items: [
            {
              id: 'dashboard',
              label: 'Dashboard',
              icon: LayoutDashboard,
              description: 'Ringkasan performa toko & aktivitas utama',
            },
          ],
        },
        {
          id: 'catalog',
          label: 'KATALOG & LAYANAN',
          icon: Boxes,
          items: [
            {
              id: 'products',
              label: 'Katalog Produk',
              icon: Package,
              badge: metrics?.total !== undefined ? metrics.total : 236,
              badgeVariant: 'primary',
              description: 'Kelola harga retail, stok, dan arsip',
            },
            {
              id: 'categories',
              label: 'Kategori',
              icon: FolderTree,
              description: 'Kelola grup & taksonomi layanan',
            },
            {
              id: 'vip-explorer',
              label: 'Import VIP Reseller',
              icon: DownloadCloud,
              badge: '12K+',
              badgeVariant: 'success',
              description: 'Jelajahi ribuan produk upstream',
            },
          ],
        },
        {
          id: 'transactions',
          label: 'TRANSAKSI',
          icon: ShoppingBag,
          items: [
            {
              id: 'orders',
              label: 'Pesanan Pelanggan',
              icon: ShoppingBag,
              description: 'Riwayat transaksi & status pembayaran',
            },
            {
              id: 'customers',
              label: 'Pelanggan',
              icon: Users,
              description: 'Database pelanggan & histori belanja',
            },
            {
              id: 'refunds',
              label: 'Refund & Komplain',
              icon: AlertCircle,
              description: 'Penanganan klaim garansi & pembatalan',
            },
          ],
        },
        {
          id: 'marketing',
          label: 'MARKETING & GROWTH',
          icon: Sparkles,
          items: [
            {
              id: 'affiliate',
              label: 'Affiliate / Sales',
              icon: Share2,
              badge: 'Sistem Sales',
              badgeVariant: 'primary',
              description: 'Mitra afiliasi, referral link, & komisi',
            },
            {
              id: 'promos',
              label: 'Voucher & Promo',
              icon: Tag,
              description: 'Kupon diskon & potongan harga belanja',
            },
            {
              id: 'campaigns',
              label: 'Campaign',
              icon: Flame,
              description: 'Flash sale, payday deal, & promo berkala',
            },
            {
              id: 'banners',
              label: 'Banner & Konten',
              icon: ImageIcon,
              description: 'Banner beranda & materi promosi visual',
            },
          ],
        },
        {
          id: 'analytics',
          label: 'ANALYTICS & LAPORAN',
          icon: BarChart3,
          items: [
            {
              id: 'sales-summary',
              label: 'Ringkasan Penjualan',
              icon: BarChart3,
              description: 'Grafik performa transaksi harian & bulanan',
            },
            {
              id: 'product-performance',
              label: 'Performa Produk',
              icon: PackageCheck,
              description: 'Daftar produk terlaris & konversi tinggi',
            },
            {
              id: 'affiliate-performance',
              label: 'Performa Affiliate',
              icon: Award,
              description: 'Efektivitas penjualan referral mitra sales',
            },
          ],
        },
      ];
    }

    // 3. Role: Superadmin (CEO & COO) -> SEMUA MENU (All 7 groups, 24 items)
    return [
      {
        id: 'overview',
        label: 'OVERVIEW',
        icon: LayoutDashboard,
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            description: 'Ringkasan performa toko & aktivitas utama',
          },
        ],
      },
      {
        id: 'catalog',
        label: 'KATALOG & LAYANAN',
        icon: Boxes,
        items: [
          {
            id: 'products',
            label: 'Katalog Produk',
            icon: Package,
            badge: metrics?.total !== undefined ? metrics.total : 236,
            badgeVariant: 'primary',
            description: 'Kelola harga retail, stok, dan arsip',
          },
          {
            id: 'categories',
            label: 'Kategori',
            icon: FolderTree,
            description: 'Kelola grup & taksonomi layanan',
          },
          {
            id: 'vip-explorer',
            label: 'Import VIP Reseller',
            icon: DownloadCloud,
            badge: '12K+',
            badgeVariant: 'success',
            description: 'Jelajahi ribuan produk upstream',
          },
          {
            id: 'providers',
            label: 'Provider / Supplier',
            icon: Server,
            description: 'Konektivitas gateway & saldo upstream',
          },
        ],
      },
      {
        id: 'transactions',
        label: 'TRANSAKSI',
        icon: ShoppingBag,
        items: [
          {
            id: 'orders',
            label: 'Pesanan Pelanggan',
            icon: ShoppingBag,
            description: 'Riwayat transaksi & status pembayaran',
          },
          {
            id: 'customers',
            label: 'Pelanggan',
            icon: Users,
            description: 'Database pelanggan & histori belanja',
          },
          {
            id: 'refunds',
            label: 'Refund & Komplain',
            icon: AlertCircle,
            description: 'Penanganan klaim garansi & pembatalan',
          },
        ],
      },
      {
        id: 'marketing',
        label: 'MARKETING & GROWTH',
        icon: Sparkles,
        items: [
          {
            id: 'affiliate',
            label: 'Affiliate / Sales',
            icon: Share2,
            badge: 'Sistem Sales',
            badgeVariant: 'primary',
            description: 'Mitra afiliasi, referral link, & komisi',
          },
          {
            id: 'promos',
            label: 'Voucher & Promo',
            icon: Tag,
            description: 'Kupon diskon & potongan harga belanja',
          },
          {
            id: 'campaigns',
            label: 'Campaign',
            icon: Flame,
            description: 'Flash sale, payday deal, & promo berkala',
          },
          {
            id: 'banners',
            label: 'Banner & Konten',
            icon: ImageIcon,
            description: 'Banner beranda & materi promosi visual',
          },
        ],
      },
      {
        id: 'finance',
        label: 'KEUANGAN',
        icon: Wallet,
        items: [
          {
            id: 'wallets',
            label: 'Saldo & Wallet',
            icon: Wallet,
            description: 'Saldo payment gateway & deposit saldo supplier',
          },
          {
            id: 'revenue',
            label: 'Pendapatan',
            icon: TrendingUp,
            description: 'Omzet bruto dan total penjualan',
          },
          {
            id: 'expenses',
            label: 'Pengeluaran',
            icon: TrendingDown,
            description: 'Modal produk upstream & fee transaksi',
          },
          {
            id: 'profit',
            label: 'Profit',
            icon: Coins,
            description: 'Laba bersih dan analisis margin keuntungan',
          },
          {
            id: 'financial-transactions',
            label: 'Riwayat Transaksi',
            icon: Receipt,
            description: 'Log mutasi finansial, debit, dan kredit',
          },
        ],
      },
      {
        id: 'analytics',
        label: 'ANALYTICS & LAPORAN',
        icon: BarChart3,
        items: [
          {
            id: 'sales-summary',
            label: 'Ringkasan Penjualan',
            icon: BarChart3,
            description: 'Grafik performa transaksi harian & bulanan',
          },
          {
            id: 'product-performance',
            label: 'Performa Produk',
            icon: PackageCheck,
            description: 'Daftar produk terlaris & konversi tinggi',
          },
          {
            id: 'affiliate-performance',
            label: 'Performa Affiliate',
            icon: Award,
            description: 'Efektivitas penjualan referral mitra sales',
          },
          {
            id: 'financial-reports',
            label: 'Laporan Keuangan',
            icon: FileSpreadsheet,
            description: 'Rekapitulasi pembukuan dan export laporan',
          },
        ],
      },
      {
        id: 'settings',
        label: 'SISTEM & KONFIGURASI',
        icon: Sliders,
        items: [
          {
            id: 'payment-settings',
            label: 'Metode Pembayaran',
            icon: CreditCard,
            description: 'Tripay, QRIS, bank transfer, & fee admin',
          },
          {
            id: 'logs',
            label: 'Log & Audit Gateway',
            icon: Activity,
            description: 'Webhook callback & audit log sistem',
          },
          {
            id: 'notifications',
            label: 'Notifikasi',
            icon: Bell,
            description: 'Template pesan WhatsApp & email bot',
          },
          {
            id: 'admins',
            label: 'Kelola Staff & Admin',
            icon: ShieldCheck,
            description: 'Hak akses kredensial staf dan administrator',
          },
          {
            id: 'store-settings',
            label: 'Pengaturan Toko',
            icon: Store,
            description: 'Identitas toko, kontak CS, & pemeliharaan',
          },
        ],
      },
    ];
  }, [userRole, metrics?.total]);

  // Accordion state: which groups are open
  const getInitialOpenGroups = (): Record<string, boolean> => {
    if (userRole === 'sales') {
      return { 'sales-portal': true };
    }
    return {
      overview: true,
      catalog: true,
      transactions: true,
      marketing: true,
      finance: true,
      analytics: false,
      settings: false,
    };
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(getInitialOpenGroups);

  // Sync open groups if role switches
  useEffect(() => {
    if (userRole === 'sales') {
      setOpenGroups({ 'sales-portal': true });
    }
  }, [userRole]);

  // Auto-expand group if activeTab changes to a child within it
  useEffect(() => {
    const parentGroup = navGroups.find((g) => g.items.some((item) => item.id === activeTab));
    if (parentGroup) {
      setOpenGroups((prev) => (prev[parentGroup.id] ? prev : { ...prev, [parentGroup.id]: true }));
    }
  }, [activeTab, navGroups]);

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
    if (tab === activeTab) {
      onCloseMobile();
      return;
    }
    onTabChange(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#111318] text-[#F4F7FB] select-none border-r border-white/10">
      {/* 1. Header / Logo Area */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <Link
          href="/admin"
          className="flex items-center gap-2.5 group transition-transform active:scale-98"
        >
          <div className="w-8 h-8 rounded-lg bg-[#191C22] border border-white/15 flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-xs group-hover:border-white/30 transition-colors">
            AS
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
              Asterra<span className="text-[#2563EB]">Store</span>
            </span>
            <span className="text-[10px] text-[#94A3B8] font-mono tracking-wider uppercase font-medium">
              {userRole === 'sales' ? 'Portal Mitra Sales' : userRole === 'admin' ? 'Konsol Admin' : 'Admin Console'}
            </span>
          </div>
        </Link>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
          aria-label="Tutup Menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Quick Live Status Bar */}
      <div className="px-4 py-2.5 bg-[#161920] border-b border-white/5 text-[11px] flex items-center justify-between">
        <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-[#191C22] border border-white/10 text-[#16A36A]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A36A] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A36A]"></span>
          </span>
          <span className="font-medium text-xs">Sistem Online</span>
        </div>
        {metrics?.vipBalance !== undefined && metrics.vipBalance !== null && (
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#F4F7FB] bg-[#191C22] border border-white/10 px-2.5 py-1 rounded-md font-semibold">
            <Wallet className="w-3 h-3 text-[#2563EB]" />
            <span>Rp {metrics.vipBalance.toLocaleString('id-ID')}</span>
          </div>
        )}
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
                              ? 'bg-[#303844] text-[#F4F7FB] font-semibold border border-white/15 shadow-sm'
                              : 'text-[#94A3B8] hover:text-[#F4F7FB] hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 pl-1.5 truncate">
                            <SubIcon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive ? 'text-white' : 'text-[#888888] group-hover:text-white'
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

        {/* Separator */}
        <div className="pt-2 border-t border-white/10">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#94A3B8] hover:text-white hover:bg-white/5 border border-white/10 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-[#2563EB]" />
              <span>Lihat Toko Publik</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#888888] group-hover:text-white transition-colors" />
          </Link>
        </div>
      </div>

      {/* 4. Footer: User Admin Profile & Logout */}
      <div className="p-3 border-t border-white/10 bg-[#161920] space-y-2">
        <div className="p-2.5 rounded-xl bg-[#191C22] border border-white/10 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2563EB] to-[#8B5CF6] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {adminUser?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {adminUser?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-[#94A3B8] truncate font-mono">
                {adminUser?.email || 'admin@asterra.store'}
              </p>
            </div>
          </div>
          {userRole === 'superadmin' && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
              Superadmin
            </span>
          )}
          {userRole === 'admin' && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40 shrink-0">
              Admin
            </span>
          )}
          {userRole === 'sales' && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
              Sales
            </span>
          )}
          {userRole !== 'superadmin' && userRole !== 'admin' && userRole !== 'sales' && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20 shrink-0">
              {adminUser?.role || 'Admin'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#CBD5E1] hover:text-white hover:bg-white/10 border border-white/10 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
              <span>Mengakhiri Sesi...</span>
            </>
          ) : (
            <>
              <LogOut className="w-3.5 h-3.5" />
              <span>{userRole === 'sales' ? 'Keluar Sesi Sales' : 'Keluar Sesi Admin'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 xl:w-72 h-screen sticky top-0 border-r border-white/10 bg-[#111318] shrink-0 z-30 shadow-subtle">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-Over with Backdrop) */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200 bg-[#111318]">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
