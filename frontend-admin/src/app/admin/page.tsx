'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient, useIsFetching } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ManagedProductItem, VipRawService } from '@/types/catalog';
import {
  Search,
  Plus,
  RefreshCw,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  DownloadCloud,
  TrendingUp,
  TrendingDown,
  Package,
  X,
  Check,
  Wallet,
  Filter,
  Trash2,
  ShieldCheck,
  Menu,
  Copy,
  Bell,
  ChevronDown,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPen,
  faCopy as faCopySolid,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { AdminOrdersTab } from '@/components/admin/admin-orders-tab';
import { AdminLogsTab } from '@/components/admin/admin-logs-tab';
import { AdminPaymentSettingsTab } from '@/components/admin/admin-payment-settings-tab';
import { AdminPromosTab } from '@/components/admin/admin-promos-tab';
import { AdminUsersTab } from '@/components/admin/admin-users-tab';
import { AdminSidebar, AdminTab } from '@/components/admin/admin-sidebar';
import { AdminHomepageOrdering } from '@/components/admin/admin-homepage-ordering';
import { AdminDashboardTab } from '@/components/admin/admin-dashboard-tab';
import { AdminAffiliateTab } from '@/components/admin/admin-affiliate-tab';
import { AdminCategoriesTab } from '@/components/admin/admin-categories-tab';
import { AdminProvidersTab } from '@/components/admin/admin-providers-tab';
import { AdminCustomersTab } from '@/components/admin/admin-customers-tab';
import { AdminRefundsTab } from '@/components/admin/admin-refunds-tab';
import { AdminFinanceSuite } from '@/components/admin/admin-finance-suite';
import { AdminMarketingSuite } from '@/components/admin/admin-marketing-suite';
import { AdminAnalyticsSuite } from '@/components/admin/admin-analytics-suite';
import { AdminSystemSettingsSuite } from '@/components/admin/admin-system-settings-suite';
import { SalesConsoleSuite } from '@/components/sales/sales-console-suite';
import { ImageUploadDropzone, uploadFileToBlob } from '@/components/admin/image-upload-dropzone';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AsterraLogo } from '@/components/ui/asterra-logo';
import { AnimatedNumber } from '@/components/ui/animated-number';

interface AdminProductsResponse {
  success: boolean;
  data: ManagedProductItem[];
  metrics: {
    total: number;
    totalActive: number;
    totalArchived: number;
    totalWarnings: number;
    vipBalance?: number | null;
    isVipConnected?: boolean;
    vipUsername?: string;
    vipStatusMessage?: string;
  };
}

interface VipServicesResponse {
  success: boolean;
  total: number;
  cached?: boolean;
  cacheAgeSeconds?: number;
  availableTypes: string[];
  availableBrands: string[];
  data: (VipRawService & {
    isImported: boolean;
    isArchived?: boolean;
    dbStatus?: 'active' | 'archived' | 'unimported';
    importedProductId?: string;
  })[];
}

const TAB_TITLES: Record<AdminTab, { category: string; title: string }> = {
  dashboard: { category: 'Overview', title: 'Dashboard Eksekutif' },
  products: { category: 'Katalog & Layanan', title: 'Manajemen Katalog & Produk' },
  'homepage-ordering': { category: 'Katalog & Layanan', title: 'Pengaturan Urutan Produk Homepage' },
  categories: { category: 'Katalog & Layanan', title: 'Kategori Layanan' },
  'vip-explorer': { category: 'Katalog & Layanan', title: 'Jelajahi & Impor Layanan VIP Reseller' },
  providers: { category: 'Katalog & Layanan', title: 'Koneksi Gateway & Supplier VIP' },
  orders: { category: 'Transaksi', title: 'Pesanan & Transaksi Pelanggan' },
  customers: { category: 'Transaksi', title: 'Database Pelanggan (CRM)' },
  refunds: { category: 'Transaksi', title: 'Antrean Refund & Komplain' },
  affiliate: { category: 'Marketing & Growth', title: 'Sistem Afiliasi & Tim Penjualan (Sales)' },
  promos: { category: 'Marketing & Growth', title: 'Voucher & Promo Diskon' },
  campaigns: { category: 'Marketing & Growth', title: 'Manajemen Campaign & Flash Sale' },
  banners: { category: 'Marketing & Growth', title: 'Banner Hero & Konten Etalase' },
  wallets: { category: 'Keuangan', title: 'Saldo & Wallet Pembayaran' },
  revenue: { category: 'Keuangan', title: 'Laporan Pendapatan (Omzet Bruto)' },
  expenses: { category: 'Keuangan', title: 'Pengeluaran & Biaya Modal (HPP)' },
  profit: { category: 'Keuangan', title: 'Analisis Margin Keuntungan & Laba' },
  'financial-transactions': { category: 'Keuangan', title: 'Jurnal Pembukuan & Riwayat Mutasi' },
  'sales-summary': { category: 'Analytics & Laporan', title: 'Ringkasan & Grafik Penjualan' },
  'product-performance': { category: 'Analytics & Laporan', title: 'Analisis Performa Produk Terlaris' },
  'affiliate-performance': { category: 'Analytics & Laporan', title: 'Performa Konversi Afiliasi & Sales' },
  'financial-reports': { category: 'Analytics & Laporan', title: 'Laporan Finansial & Rekapitulasi' },
  'payment-settings': { category: 'Sistem & Konfigurasi', title: 'Metode Pembayaran & Gateway' },
  logs: { category: 'Sistem & Konfigurasi', title: 'Log Aktivitas & Audit Gateway' },
  notifications: { category: 'Sistem & Konfigurasi', title: 'Notifikasi WhatsApp & Email' },
  admins: { category: 'Sistem & Konfigurasi', title: 'Kelola Staff & Administrator' },
  'store-settings': { category: 'Sistem & Konfigurasi', title: 'Pengaturan Toko & Informasi CS' },
  // PORTAL PENJUALAN (SALES)
  'sales-overview': { category: 'Portal Penjualan', title: 'Ringkasan Performa & Komisi Sales' },
  'sales-catalog': { category: 'Portal Penjualan', title: 'Katalog Produk & Estimasi Komisi' },
  'sales-links': { category: 'Portal Penjualan', title: 'Generator Tautan & Materi Promosi' },
  'sales-orders': { category: 'Portal Penjualan', title: 'Pesanan Referral Saya' },
  'sales-network': { category: 'Portal Penjualan', title: 'Bonus Komisi Tim & Teman Sales' },
  'sales-wallet': { category: 'Portal Penjualan', title: 'Dompet & Pencairan Komisi' },
  'sales-academy': { category: 'Portal Penjualan', title: 'Panduan & Edukasi Mitra Sales' },
};

const RESTRICTED_FOR_OPERATIONAL_ADMIN: AdminTab[] = [
  'providers',
  'wallets',
  'revenue',
  'expenses',
  'profit',
  'financial-transactions',
  'financial-reports',
  'payment-settings',
  'logs',
  'notifications',
  'admins',
  'store-settings',
];

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

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

  // Admin authentication state
  const [adminUser, setAdminUser] = useState<{ id?: string; email: string; name?: string; role?: string } | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Navigation tab & visited tabs cache (initialized from URL or default)
  const initialUrlTab = getTabFromUrl();
  const [activeTab, setActiveTab] = useState<AdminTab>(initialUrlTab || 'dashboard');
  const [visitedTabs, setVisitedTabs] = useState<Set<AdminTab>>(() => new Set(['dashboard', 'orders', initialUrlTab || 'dashboard']));
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

  // Synchronize with browser Back and Forward navigation buttons
  useEffect(() => {
    const handlePopState = () => {
      const currentUrlTab = getTabFromUrl();
      if (currentUrlTab) {
        setActiveTab(currentUrlTab);
      } else {
        const defaultTab = adminUser?.role === 'sales' ? 'sales-overview' : 'dashboard';
        setActiveTab(defaultTab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getTabFromUrl, adminUser]);

  // Check admin session on mount
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
          const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/admin';
          router.replace(`/admin/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
          return;
        }
        const data = await res.json();
        if (!data.authenticated) {
          const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/admin';
          router.replace(`/admin/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
          return;
        }
        setAdminUser(data.admin);
        const currentUrlTab = getTabFromUrl();
        const role = (data.admin?.role || 'admin').toLowerCase();

        if (role === 'sales') {
          if (currentUrlTab && currentUrlTab.startsWith('sales-')) {
            setActiveTab(currentUrlTab);
          } else {
            handleTabChange('sales-overview');
          }
        } else {
          // Admin role: maintain currentUrlTab if valid and not restricted
          if (currentUrlTab && !RESTRICTED_FOR_OPERATIONAL_ADMIN.includes(currentUrlTab)) {
            setActiveTab(currentUrlTab);
          } else if (!currentUrlTab) {
            setActiveTab('dashboard');
          }
        }
      } catch {
        const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/admin';
        router.replace(`/admin/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
      } finally {
        setIsAuthChecking(false);
      }
    }
    verifyAuth();
  }, [router, getTabFromUrl, handleTabChange]);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('asterra_admin_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 1. Panggil Next.js Route Handler resmi (/api/auth/logout)
      // Menghapus cookie session httpOnly pada origin Next.js & membatalkan sesi backend
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers,
          credentials: 'include',
        });
      } catch (err) {
        console.warn('[AdminLogout] Route handler logout warning:', err);
      }

      // 2. Direct fallback call ke backend endpoint jika rewrites aktif
      try {
        await fetch('/api/v1/admin/auth/logout', {
          method: 'POST',
          headers,
          credentials: 'include',
        });
      } catch (err) {
        console.warn('[AdminLogout] Backend direct logout warning:', err);
      }

      // 3. Bersihkan token dan profil admin dari localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('asterra_admin_token');
        localStorage.removeItem('asterra_admin_user');
      }

      // 4. Bersihkan TanStack Query cache privat di browser memory
      try {
        queryClient.clear();
        queryClient.removeQueries();
      } catch {}

      // 5. Reset adminUser state lokal
      setAdminUser(null);

      // 6. Redirect aman menggunakan location.replace agar halaman admin
      // tidak tersisa dalam browser back-history
      if (typeof window !== 'undefined') {
        window.location.replace('/admin/login?logged_out=1');
      }
    } catch (err) {
      console.error('[AdminLogout] Error during logout:', err);
      showNotification('Gagal mengakhiri sesi. Silakan coba kembali.');
      setIsLoggingOut(false);
    }
  };

  // Lazily register visited tabs so each menu only mounts and requests API 1x
  useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  // Role-based Access Control guard for active tab
  useEffect(() => {
    if (!adminUser) return;
    const role = (adminUser.role || 'admin').toLowerCase();

    // 1. Sales partner can ONLY access sales-* tabs
    if (role === 'sales') {
      if (!activeTab.startsWith('sales-')) {
        handleTabChange('sales-overview');
      }
      return;
    }

    // 2. Operational Admin cannot access financial/sensitive system tabs
    if (role === 'admin' && RESTRICTED_FOR_OPERATIONAL_ADMIN.includes(activeTab)) {
      handleTabChange('dashboard');
    }
  }, [adminUser, activeTab, handleTabChange]);

  // Filter states for Managed Products
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'warning'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Multi-selection states for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter states for VIP Reseller Explorer
  const [vipSearch, setVipSearch] = useState('');
  const [debouncedVipSearch, setDebouncedVipSearch] = useState('');
  const [vipType, setVipType] = useState('all');
  const [vipStatus, setVipStatus] = useState('all');

  // Debounce search query to search across all 12,500+ services seamlessly on server
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedVipSearch(vipSearch.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [vipSearch]);

  // Modals
  const [notification, setNotification] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<ManagedProductItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [importingService, setImportingService] = useState<VipRawService | null>(null);

  // Form states for Create/Edit product
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('AI Tools');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formProviderPrice, setFormProviderPrice] = useState<number>(0);
  const [formStock, setFormStock] = useState<number>(100);
  const [formStatus, setFormStatus] = useState<'active' | 'archived'>('active');
  const [formDescription, setFormDescription] = useState('');
  const [formFeatures, setFormFeatures] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [isSpecialPromoBanner, setIsSpecialPromoBanner] = useState(false);
  const [formPopular, setFormPopular] = useState(false);
  const [formGuaranteeTitle, setFormGuaranteeTitle] = useState('Garansi Penuh');
  const [formGuaranteeDesc, setFormGuaranteeDesc] = useState('Jaminan ganti akun 100%');
  const [formProcessTitle, setFormProcessTitle] = useState('Proses Instan');
  const [formProcessDesc, setFormProcessDesc] = useState('1 - 15 menit selesai');
  const [formPrivacyTitle, setFormPrivacyTitle] = useState('Akun Private');
  const [formPrivacyDesc, setFormPrivacyDesc] = useState('Ruang kerja aman & personal');

  // Delete product states
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [deletingProductName, setDeletingProductName] = useState<string>('');
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Toast feedback
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Global Auto-Sync & Real-time State
  const isGlobalFetching = useIsFetching();
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(() => new Date());

  // Global SSE listener with Auto-Reconnect for real-time invalidations across all tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let retryAttempt = 0;
    let isSubscribed = true;

    const setupConnection = () => {
      if (!isSubscribed) return;

      if (eventSource) {
        try {
          eventSource.close();
        } catch {}
        eventSource = null;
      }

      try {
        eventSource = new EventSource('/api/v1/events?role=admin');

        eventSource.onopen = () => {
          if (!isSubscribed) return;
          setSseConnected(true);
          setLastSyncTime(new Date());
          retryAttempt = 0;
        };

        const handleOrderEvent = () => {
          if (!isSubscribed) return;
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
          queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
          queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard-overview'] });
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard-orders'] });
          queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
          queryClient.invalidateQueries({ queryKey: ['admin-analytics-suite'] });
          setLastSyncTime(new Date());
          window.dispatchEvent(new CustomEvent('admin:data-updated'));
        };

        eventSource.addEventListener('order:created', handleOrderEvent);
        eventSource.addEventListener('order:cancelled', handleOrderEvent);
        eventSource.addEventListener('order:payment_verified', handleOrderEvent);
        eventSource.addEventListener('order:status_changed', handleOrderEvent);

        eventSource.addEventListener('catalog:updated', () => {
          if (!isSubscribed) return;
          queryClient.invalidateQueries({ queryKey: ['admin-products'] });
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard-overview'] });
          queryClient.invalidateQueries({ queryKey: ['admin-analytics-suite'] });
          setLastSyncTime(new Date());
          window.dispatchEvent(new CustomEvent('admin:data-updated'));
        });

        eventSource.addEventListener('vip:status_updated', () => {
          if (!isSubscribed) return;
          queryClient.invalidateQueries({ queryKey: ['admin-vip-services'] });
          queryClient.invalidateQueries({ queryKey: ['admin-products'] });
          setLastSyncTime(new Date());
        });

        eventSource.addEventListener('promo:updated', () => {
          if (!isSubscribed) return;
          queryClient.invalidateQueries({ queryKey: ['admin-promos'] });
          queryClient.invalidateQueries({ queryKey: ['promos'] });
          window.dispatchEvent(new CustomEvent('admin:refresh-promos'));
          setLastSyncTime(new Date());
        });

        eventSource.addEventListener('affiliate:updated', () => {
          if (!isSubscribed) return;
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard-affiliates'] });
          window.dispatchEvent(new CustomEvent('admin:refresh-affiliates'));
          setLastSyncTime(new Date());
        });

        eventSource.addEventListener('campaign:updated', () => {
          if (!isSubscribed) return;
          window.dispatchEvent(new CustomEvent('admin:refresh-campaigns'));
          setLastSyncTime(new Date());
        });

        eventSource.addEventListener('payment_config:updated', () => {
          if (!isSubscribed) return;
          queryClient.invalidateQueries({ queryKey: ['admin-payment-config'] });
          window.dispatchEvent(new CustomEvent('admin:refresh-payment-config'));
          setLastSyncTime(new Date());
        });

        eventSource.onerror = () => {
          if (!isSubscribed) return;
          setSseConnected(false);
          try {
            if (eventSource) eventSource.close();
          } catch {}
          eventSource = null;

          retryAttempt++;
          const delay = Math.min(2000 * Math.pow(1.5, retryAttempt - 1), 15000);
          reconnectTimeout = setTimeout(() => {
            setupConnection();
          }, delay);
        };
      } catch (err) {
        console.warn('[Global SSE] Connection error:', err);
        setSseConnected(false);
        reconnectTimeout = setTimeout(() => {
          setupConnection();
        }, 3000);
      }
    };

    setupConnection();

    return () => {
      isSubscribed = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) {
        try {
          eventSource.close();
        } catch {}
        eventSource = null;
      }
    };
  }, [queryClient]);

  useEffect(() => {
    if (isGlobalFetching === 0) {
      setLastSyncTime(new Date());
    }
  }, [isGlobalFetching]);

  // Fetch Managed Products once - searching and filtering are 100% in-memory with Dual-Channel Auto-Sync
  const {
    data: productsData,
    isLoading: isLoadingProducts,
  } = useQuery<AdminProductsResponse>({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/products');
      if (res.status === 401) {
        router.replace('/admin/login');
        throw new Error('Unauthorized');
      }
      if (!res.ok) throw new Error('Gagal memuat produk admin');
      return res.json();
    },
    staleTime: 10000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: sseConnected ? 30000 : 10000,
    refetchIntervalInBackground: false,
  });

  // Fetch VIP Reseller Services Explorer - server searches all 12,500+ cached services in memory
  const {
    data: vipData,
    isLoading: isLoadingVip,
    error: vipError,
  } = useQuery<VipServicesResponse>({
    queryKey: ['admin-vip-services', debouncedVipSearch, vipType, vipStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedVipSearch) params.set('search', debouncedVipSearch);
      if (vipType && vipType !== 'all') params.set('type', vipType);
      if (vipStatus && vipStatus !== 'all') params.set('status', vipStatus);
      params.set('limit', '2500');

      const res = await fetch(`/api/v1/admin/vip-services?${params.toString()}`);
      if (res.status === 401) {
        router.replace('/admin/login');
        throw new Error('Unauthorized');
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal memuat layanan VIP Reseller');
      }
      return data;
    },
    enabled: activeTab === 'vip-explorer',
    staleTime: 30000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: activeTab === 'vip-explorer' ? 60000 : false,
    refetchIntervalInBackground: false,
  });

  // Toggle Product Status (Active vs Archived)
  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/admin/products/${id}/toggle-status`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Gagal mengubah status visibilitas produk');
      return res.json();
    },
    onSuccess: (data) => {
      showNotification(data.message);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });

  // Bulk Status Mutation (Activate or Archive multiple products in 1 single API call)
  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: 'active' | 'archived' }) => {
      const res = await fetch('/api/v1/admin/products/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengubah status produk massal');
      return data;
    },
    onSuccess: (data) => {
      showNotification(data.message);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err: Error) => {
      showNotification(`Gagal: ${err.message}`);
    },
  });

  // Refresh Upstream Stock Statuses
  const refreshStockMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/admin/refresh-stock', { method: 'POST' });
      if (!res.ok) throw new Error('Gagal mengecek status stok supplier');
      return res.json();
    },
    onSuccess: (data) => {
      showNotification(data.message);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });

  // Sync All Services from VIP Reseller
  const syncVipMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/admin/sync-vip', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal sinkronisasi dari VIP Reseller');
      }
      return data;
    },
    onSuccess: (data) => {
      showNotification(
        data.message ||
          `Berhasil menyinkronkan ${data.totalSynced} produk dari VIP Reseller!`
      );
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-vip-services'] });
    },
    onError: (err: Error) => {
      showNotification(`Gagal sinkronisasi: ${err.message}`);
    },
  });

  // Save Product (Create / Edit)
  // Pilar 2: Lazy/Deferred Upload — file is uploaded to Blob only on form submit
  const saveProductMutation = useMutation({
    mutationFn: async () => {
      // If a file is staged (lazy mode), upload it now before saving the product
      let finalImageUrl = formImageUrl;
      if (stagedFile) {
        const uploadResult = await uploadFileToBlob(
          stagedFile,
          'products',
          formName,
          editingProduct?.id,
          isSpecialPromoBanner
        );
        finalImageUrl = uploadResult.viewUrl;
      }

      const payload = {
        name: formName,
        category: {
          id: `cat-${formCategory.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: formCategory,
        },
        price: formPrice,
        providerPrice: formProviderPrice,
        stock: formStock,
        status: formStatus,
        description: formDescription,
        features: formFeatures
          .split('\n')
          .map((f) => f.trim())
          .filter(Boolean),
        imageUrl: finalImageUrl || undefined,
        popular: formPopular,
        guaranteeTitle: formGuaranteeTitle,
        guaranteeDesc: formGuaranteeDesc,
        processTitle: formProcessTitle,
        processDesc: formProcessDesc,
        privacyTitle: formPrivacyTitle,
        privacyDesc: formPrivacyDesc,
      };

      if (editingProduct) {
        const res = await fetch(`/api/v1/admin/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Gagal memperbarui produk');
        return res.json();
      } else {
        const res = await fetch('/api/v1/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Gagal menambahkan produk');
        return res.json();
      }
    },
    onSuccess: (data) => {
      showNotification(data.message);
      setEditingProduct(null);
      setIsCreateModalOpen(false);
      setStagedFile(null);
      setIsSpecialPromoBanner(false);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err: Error) => {
      showNotification(`Gagal menyimpan produk: ${err.message}`);
    },
  });

  // Import VIP Reseller Service
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!importingService) return;
      const res = await fetch('/api/v1/admin/vip-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: importingService.code,
          name: formName,
          price: formPrice,
          providerPrice: formProviderPrice,
          stock: formStock,
          categoryName: formCategory,
          description: formDescription,
          status: formStatus,
          imageUrl: formImageUrl || undefined,
        }),
      });
      if (!res.ok) throw new Error('Gagal mengimpor layanan VIP');
      return res.json();
    },
    onSuccess: (data) => {
      showNotification(data.message);
      setImportingService(null);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-vip-services'] });
    },
  });

  // Delete Single Product Mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/admin/products/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menghapus produk');
      return data;
    },
    onSuccess: (data) => {
      showNotification(data.message);
      setDeletingProductId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-vip-services'] });
    },
    onError: (err: Error) => {
      showNotification(`Gagal: ${err.message}`);
    },
  });

  // Bulk Delete Products Mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch('/api/v1/admin/products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menghapus produk terpilih');
      return data;
    },
    onSuccess: (data) => {
      showNotification(data.message);
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-vip-services'] });
    },
    onError: (err: Error) => {
      showNotification(`Gagal: ${err.message}`);
    },
  });

  // Open Edit Modal
  const handleOpenEdit = (p: ManagedProductItem) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category.name);
    setFormPrice(p.price);
    setFormProviderPrice(p.providerPrice || 0);
    setFormStock(p.stock !== undefined ? p.stock : p.providerStatus === 'empty' ? 0 : 100);
    setFormStatus(p.status);
    setFormDescription(p.description);
    setFormFeatures(p.features.join('\n'));
    setFormImageUrl(p.imageUrl);
    setStagedFile(null);
    setIsSpecialPromoBanner(false);
    setFormPopular(Boolean(p.popular));
    setFormGuaranteeTitle(p.guaranteeTitle || 'Garansi Penuh');
    setFormGuaranteeDesc(p.guaranteeDesc || 'Jaminan ganti akun 100%');
    setFormProcessTitle(p.processTitle || 'Proses Instan');
    setFormProcessDesc(p.processDesc || '1 - 15 menit selesai');
    setFormPrivacyTitle(p.privacyTitle || 'Akun Private');
    setFormPrivacyDesc(p.privacyDesc || 'Ruang kerja aman & personal');
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('AI Tools');
    setFormPrice(50000);
    setFormProviderPrice(0);
    setFormStock(100);
    setFormStatus('active');
    setFormDescription('');
    setFormFeatures('Akses resmi bergaransi\nProses aktivasi cepat 1-5 menit');
    setFormImageUrl('/images/default-product-banner.png');
    setStagedFile(null);
    setIsSpecialPromoBanner(false);
    setFormPopular(false);
    setFormGuaranteeTitle('Garansi Penuh');
    setFormGuaranteeDesc('Jaminan ganti akun 100%');
    setFormProcessTitle('Proses Instan');
    setFormProcessDesc('1 - 15 menit selesai');
    setFormPrivacyTitle('Akun Private');
    setFormPrivacyDesc('Ruang kerja aman & personal');
    setIsCreateModalOpen(true);
  };

  // Duplicate Existing Product
  const handleDuplicateProduct = (p: ManagedProductItem) => {
    setEditingProduct(null);
    setFormName(`${p.name} (Salinan)`);
    setFormCategory(p.category.name);
    setFormPrice(p.price);
    setFormProviderPrice(p.providerPrice || 0);
    setFormStock(p.stock !== undefined ? p.stock : 100);
    setFormStatus('archived');
    setFormDescription(p.description);
    setFormFeatures(p.features.join('\n'));
    setFormImageUrl(p.imageUrl);
    setStagedFile(null);
    setFormPopular(false);
    setFormGuaranteeTitle(p.guaranteeTitle || 'Garansi Penuh');
    setFormGuaranteeDesc(p.guaranteeDesc || 'Jaminan ganti akun 100%');
    setFormProcessTitle(p.processTitle || 'Proses Instan');
    setFormProcessDesc(p.processDesc || '1 - 15 menit selesai');
    setFormPrivacyTitle(p.privacyTitle || 'Akun Private');
    setFormPrivacyDesc(p.privacyDesc || 'Ruang kerja aman & personal');
    setIsCreateModalOpen(true);
    showNotification(`Menduplikasi produk "${p.name}". Silakan sesuaikan dan simpan.`);
  };

  // Open Import Modal from VIP Service
  const handleOpenImport = (service: VipRawService) => {
    setImportingService(service);
    setFormName(service.name);

    let base = 0;
    if (typeof service.price === 'object' && service.price !== null) {
      base = service.price.basic || service.price.premium || 0;
    } else if (typeof service.price === 'number') {
      base = service.price;
    }

    // Default suggested selling price: base + 10% rounded to 1000
    const suggestedPrice = Math.ceil((base * 1.1 + 2500) / 1000) * 1000;
    setFormPrice(suggestedPrice);
    setFormProviderPrice(base);
    setFormStock(service.status === 'available' ? 100 : 0);

    // Category mapping: AI Tools, Apps & Streaming, Games, etc.
    const b = (service.brand || '').toUpperCase();
    const n = (service.name || '').toUpperCase();
    const isAi =
      b.includes('GEMINI') ||
      b.includes('CHATGPT') ||
      b.includes('OPENAI') ||
      b.includes('CLAUDE') ||
      n.includes('GEMINI') ||
      n.includes('CHATGPT') ||
      n.includes('OPENAI');
    const isStreaming =
      service.type === 'streaming-tv' ||
      b.includes('NETFLIX') ||
      b.includes('YOUTUBE') ||
      b.includes('SPOTIFY') ||
      b.includes('CANVA') ||
      b.includes('BSTATION') ||
      b.includes('IQIYI') ||
      b.includes('WETV') ||
      b.includes('DISNEY') ||
      b.includes('VIDIO') ||
      n.includes('NETFLIX') ||
      n.includes('YOUTUBE') ||
      n.includes('SPOTIFY') ||
      n.includes('CANVA');

    setFormCategory(
      isAi ? 'AI Tools' : isStreaming ? 'Apps & Streaming' : service.type === 'game' ? 'Voucher Game' : 'Apps & Streaming'
    );

    setFormStatus('active'); // Default to active so imported product goes live immediately
    setFormDescription(service.note && service.note !== '-' ? `${service.name}. ${service.note}` : service.name);
    setFormImageUrl('');
    setStagedFile(null);
    setFormGuaranteeTitle('Garansi Penuh');
    setFormGuaranteeDesc('Jaminan ganti akun 100%');
    setFormProcessTitle('Proses Instan');
    setFormProcessDesc('1 - 15 menit selesai');
    setFormPrivacyTitle('Akun Private');
    setFormPrivacyDesc('Ruang kerja aman & personal');
  };

  const metrics = productsData?.metrics;
  const allProducts = useMemo(() => productsData?.data || [], [productsData?.data]);

  // Extract unique categories dynamically from products in database [T4 Fix]
  const availableCategories = useMemo(() => {
    const cats = new Map<string, { id: string; name: string; count: number }>();
    allProducts.forEach((p) => {
      if (p.category?.name) {
        const id = p.category.id || p.category.name;
        const name = p.category.name;
        const existing = cats.get(id);
        if (existing) {
          existing.count++;
        } else {
          cats.set(id, { id, name, count: 1 });
        }
      }
    });
    return Array.from(cats.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allProducts]);

  // Client-Side In-Memory Filtering for Managed Products (0 API request on search/filter)
  const filteredProducts = useMemo(() => {
    let list = allProducts;
    if (statusFilter !== 'all') {
      if (statusFilter === 'warning') {
        list = list.filter(
          (p) =>
            p.status === 'active' &&
            (p.providerStatus === 'empty' || p.stock === 0)
        );
      } else {
        list = list.filter((p) => p.status === statusFilter);
      }
    }
    if (categoryFilter !== 'all') {
      list = list.filter(
        (p) =>
          p.category.name.toLowerCase() === categoryFilter.toLowerCase() ||
          p.category.id.toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.providerCode && p.providerCode.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allProducts, statusFilter, categoryFilter, searchQuery]);

  // Display all filtered managed products without artificial slice limits
  const products = filteredProducts;

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const isAllSelected = useMemo(() => {
    if (products.length === 0) return false;
    return products.every((p) => selectedIdSet.has(p.id));
  }, [products, selectedIdSet]);

  const isSomeSelected = useMemo(() => {
    return selectedIds.length > 0 && !isAllSelected;
  }, [selectedIds.length, isAllSelected]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Client-Side In-Memory Filtering for VIP Reseller Services (0 API request on search/filter)
  const allVipServices = useMemo(() => vipData?.data || [], [vipData?.data]);

  const filteredVipServices = useMemo(() => {
    let items = allVipServices;
    if (vipType !== 'all') {
      items = items.filter((item) => item.type === vipType);
    }
    if (vipStatus !== 'all') {
      items = items.filter((item) => item.status === vipStatus);
    }
    if (vipSearch.trim()) {
      const q = vipSearch.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          (item.brand && item.brand.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q)) ||
          (item.game && item.game.toLowerCase().includes(q))
      );
    }
    return items;
  }, [allVipServices, vipType, vipStatus, vipSearch]);

  const [vipVisibleCount, setVipVisibleCount] = useState(24);

  // Reset pagination when search or filters change
  useEffect(() => {
    setVipVisibleCount(24);
  }, [vipSearch, vipType, vipStatus]);

  const vipServices = useMemo(() => {
    return filteredVipServices.slice(0, vipVisibleCount);
  }, [filteredVipServices, vipVisibleCount]);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center selection:bg-primary/20 selection:text-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center shadow-subtle animate-pulse">
            <RefreshCw className="w-5 h-5 text-primary animate-spin" />
          </div>
          <span className="text-xs text-foreground-muted tracking-widest uppercase font-mono">
            Memverifikasi Otoritas Sesi Admin...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans selection:bg-primary/20 selection:text-primary">
      {/* Sidebar with Accordion / Dropdown Menus */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        metrics={metrics}
        adminUser={adminUser}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        isOpenMobile={isSidebarMobileOpen}
        onCloseMobile={() => setIsSidebarMobileOpen(false)}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Header Bar - Structured Two-Row Density */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-8 py-2.5 sm:py-3 shadow-2xs space-y-2.5 transition-all">
          {/* Row 1: Breadcrumb + Heading Area (Left) and Global Controls (Right) */}
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setIsSidebarMobileOpen(true)}
                className="lg:hidden p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-slate-100 border border-slate-200/80 transition-colors shrink-0"
                aria-label="Buka Menu Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex flex-col min-w-0" key={activeTab}>
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#64748B] font-medium truncate">
                  <span>Admin Console</span>
                  <span>/</span>
                  <span className="capitalize text-[#64748B] font-medium truncate">
                    {TAB_TITLES[activeTab]?.category || 'Overview'}
                  </span>
                </div>
                <h1 className="text-lg sm:text-2xl font-bold text-[#0F172A] tracking-tight leading-tight truncate">
                  {TAB_TITLES[activeTab]?.title || 'Dashboard Eksekutif'}
                </h1>
              </div>
            </div>

            {/* Right Controls: Search, Notifications, Profile Chip */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Search Pill Input with responsive width */}
              <div className="hidden md:flex items-center gap-2 bg-white/70 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs text-slate-400 shadow-2xs hover:border-slate-300 transition-colors w-44 lg:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="flex-1 text-slate-400 select-none truncate text-xs">Cari apa saja...</span>
                <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-500 rounded border border-slate-200/80 font-mono">⌘K</kbd>
              </div>

              {/* Notification Bell */}
              <button
                type="button"
                onClick={() => handleTabChange('notifications')}
                className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer shrink-0"
                title="Notifikasi"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
              </button>

              {/* User Profile Chip */}
              <div className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-white border border-slate-200/80 shadow-2xs shrink-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#111318] text-white font-bold text-[10px] sm:text-[11px] flex items-center justify-center shrink-0">
                  AS
                </div>
                <div className="hidden sm:flex flex-col text-left leading-none">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[100px]">{adminUser?.name || 'Super Admin'}</span>
                  <span className="text-[9px] text-slate-400 font-normal mt-0.5">Administrator</span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
              </div>
            </div>
          </div>

          {/* Row 2: Status Auto-Sync on Left & Page Action Buttons on Right */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
            {/* Status Auto-Sync Engine */}
            <div
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full bg-slate-50/80 border border-slate-200/70 text-xs shadow-2xs select-none"
              title={sseConnected ? 'Dual-Channel Auto-Sync Aktif (SSE Gateway + Smart Polling)' : 'Auto-Sync Mode Terjadwal (Smart Polling)'}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                {sseConnected ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                )}
              </span>
              <span className="font-medium text-slate-700 text-[11px] whitespace-nowrap">
                {isGlobalFetching > 0 ? (
                  <span className="flex items-center gap-1 text-[#2563EB]">
                    <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                    <span>Menyinkronkan...</span>
                  </span>
                ) : sseConnected ? (
                  <span className="text-emerald-700 font-semibold">Auto-Sync Live</span>
                ) : (
                  <span className="text-amber-700 font-semibold">Auto-Sync (Polling)</span>
                )}
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline border-l border-slate-200 pl-2">
                {lastSyncTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* Quick Action Buttons per Tab */}
            <div className="flex items-center gap-2 ml-auto">
              {(activeTab === 'products' || activeTab === 'vip-explorer') &&
                adminUser?.role !== 'sales' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncVipMutation.mutate()}
                    disabled={syncVipMutation.isPending}
                    className="text-xs h-8 px-2.5 sm:px-3 gap-1.5 border-slate-200 hover:bg-slate-50 font-medium"
                    title="Ambil dan sinkronkan semua layanan dari gateway VIP Reseller"
                  >
                    <DownloadCloud className={`w-3.5 h-3.5 text-[#2563EB] ${syncVipMutation.isPending ? 'animate-bounce' : ''}`} />
                    <span className="hidden sm:inline">{syncVipMutation.isPending ? 'Menyinkronkan...' : 'Sinkronkan VIP'}</span>
                    <span className="sm:hidden">Sync VIP</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshStockMutation.mutate()}
                    disabled={refreshStockMutation.isPending}
                    className="text-xs h-8 px-2.5 sm:px-3 gap-1.5 border-slate-200 hover:bg-slate-50 font-medium"
                    title="Periksa ketersediaan stok live dari VIP Reseller"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#2563EB] ${refreshStockMutation.isPending ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">{refreshStockMutation.isPending ? 'Memeriksa...' : 'Cek Stok'}</span>
                    <span className="sm:hidden">Stok</span>
                  </Button>
                  <Button size="sm" onClick={handleOpenCreate} className="text-xs h-8 px-3 gap-1.5 shadow-xs font-semibold">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Produk</span>
                  </Button>
                </>
              )}

              {adminUser?.role === 'sales' && (
                <Button
                  size="sm"
                  onClick={() => handleTabChange('sales-wallet')}
                  className="text-xs h-8 gap-1.5 shadow-xs font-semibold bg-[#16A36A] hover:bg-[#15803D] text-white"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Dompet Komisi</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Floating Notification */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#111111]/95 backdrop-blur-md border border-white/10 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Check className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-medium text-white">{notification}</p>
          </div>
        )}

        <main className="flex-1 max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 2xl:px-8 py-6 w-full min-w-0">
          {/* Top Summary Metrics Cards - show on products & vip-explorer */}
          {(activeTab === 'products' || activeTab === 'vip-explorer') && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
              <div className="animate-fade-up stagger-1 motion-card-interactive bg-surface border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-foreground-muted mb-1.5 sm:mb-2">
                  <span className="font-medium truncate">Aktif di Katalog</span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-[#16A36A] flex items-center justify-center shrink-0">
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums font-mono">
                    <AnimatedNumber value={metrics?.totalActive ?? 0} showDelta />
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-foreground-muted truncate block">Muncul di etalase</span>
                </div>
              </div>

              <div className="animate-fade-up stagger-2 motion-card-interactive bg-surface border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-foreground-muted mb-1.5 sm:mb-2">
                  <span className="font-medium truncate">Diarsipkan (Draft)</span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                    <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-foreground tabular-nums font-mono">
                    <AnimatedNumber value={metrics?.totalArchived ?? 0} showDelta />
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-foreground-muted truncate block">Disembunyikan</span>
                </div>
              </div>

              <div className="animate-fade-up stagger-3 motion-card-interactive bg-surface border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-foreground-muted mb-1.5 sm:mb-2">
                  <span className="font-medium truncate">Perhatian Stok</span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#D97706] tabular-nums font-mono">
                    <AnimatedNumber value={metrics?.totalWarnings ?? 0} showDelta />
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-foreground-muted truncate block">Supplier kosong</span>
                </div>
              </div>

              <div className="animate-fade-up stagger-4 motion-card-interactive bg-surface border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-foreground-muted mb-1.5 sm:mb-2">
                  <span className="font-medium truncate">Saldo VIP</span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                    <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-extrabold text-foreground tabular-nums font-mono truncate">
                    {metrics?.isVipConnected && metrics?.vipBalance !== null && metrics?.vipBalance !== undefined ? (
                      <AnimatedNumber
                        value={metrics.vipBalance}
                        formatter={(v) => `Rp ${Math.round(v).toLocaleString('id-ID')}`}
                        showDelta
                      />
                    ) : (
                      'Belum Terhubung'
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${metrics?.isVipConnected ? 'bg-[#16A36A] animate-pulse' : 'bg-[#D97706]'}`} />
                    <span className={`text-[10px] sm:text-[11px] font-medium truncate ${metrics?.isVipConnected ? 'text-[#16A36A]' : 'text-[#D97706]'}`}>
                      {metrics?.isVipConnected
                        ? `Live (${metrics.vipUsername || 'Aktif'})`
                        : metrics?.vipStatusMessage || 'Belum Terhubung'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 0: DASHBOARD OVERVIEW */}
          {visitedTabs.has('dashboard') && (
            <div className={activeTab === 'dashboard' ? 'block animate-tab-glide' : 'hidden'}>
              <AdminDashboardTab
                metrics={metrics}
                onNavigateTab={handleTabChange}
                onOpenCreateProduct={handleOpenCreate}
                onSyncVip={() => syncVipMutation.mutate()}
                isSyncingVip={syncVipMutation.isPending}
              />
            </div>
          )}

          {/* TAB 1: MANAGED PRODUCTS */}
          {visitedTabs.has('products') && (
          <div className={activeTab === 'products' ? 'block animate-tab-glide' : 'hidden'}>
          <div className="space-y-6">
            {/* Quick Banner: Homepage Product Ordering */}
            <div className="bg-gradient-to-r from-primary/10 via-amber-500/10 to-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                    <span>Atur Urutan 8 Produk Homepage</span>
                    <Badge variant="primary" className="text-[10px]">Promo · Terlaris · Terbaru</Badge>
                  </h3>
                  <p className="text-[11px] text-foreground-muted mt-0.5">
                    Kustomisasi urutan produk yang tampil di halaman depan Customer Website dengan Mode Otomatis atau Prioritas Manual.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => handleTabChange('homepage-ordering')}
                className="bg-primary text-white hover:bg-primary/90 text-xs h-8.5 px-3.5 gap-1.5 font-semibold shrink-0"
              >
                <span>Buka Pengaturan Urutan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-surface border border-border rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
                  }`}
                >
                  Semua ({metrics?.total ?? 0})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    statusFilter === 'active'
                      ? 'bg-status-success text-white'
                      : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Aktif di Toko ({metrics?.totalActive ?? 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('archived')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    statusFilter === 'archived'
                      ? 'bg-foreground text-background'
                      : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Diarsipkan ({metrics?.totalArchived ?? 0})</span>
                </button>
                {metrics?.totalWarnings ? (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('warning')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      statusFilter === 'warning'
                        ? 'bg-status-warning text-white'
                        : 'bg-surface-raised text-status-warning border border-status-warning/30 hover:bg-status-warning/10'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Supplier Kosong ({metrics.totalWarnings})</span>
                  </button>
                ) : null}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                <div className="w-full sm:w-auto sm:min-w-[190px]">
                  <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val)}>
                    <SelectTrigger className="text-xs bg-surface-raised border-border h-9 w-full">
                      <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectItem value="all">Semua Kategori ({allProducts.length})</SelectItem>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name} ({cat.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative w-full sm:w-auto sm:min-w-[220px] sm:flex-1">
                  <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Cari produk terkelola..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-xs bg-surface-raised border-border w-full"
                  />
                </div>
              </div>
            </div>

            {/* Multi-Selection Bulk Action Banner */}
            {selectedIds.length > 0 && (
              <div className="bg-surface-raised border border-primary/40 rounded-xl p-3.5 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs">
                      {selectedIds.length}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      Produk Dipilih untuk Aksi Massal
                    </span>
                  </div>
                  <span className="text-foreground-muted text-xs hidden sm:inline">•</span>
                  <span className="text-xs text-foreground-muted hidden sm:inline">
                    Pilih aksi status atau hapus sekaligus ke seluruh item terpilih dalam 1 request.
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, status: 'active' })}
                    disabled={bulkStatusMutation.isPending || bulkDeleteMutation.isPending}
                    className="h-8 gap-1.5 bg-status-success hover:bg-status-success/90 text-white text-xs font-medium"
                    title="Ubah semua produk terpilih menjadi Aktif (Tampil di Toko)"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Aktifkan ({selectedIds.length})</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, status: 'archived' })}
                    disabled={bulkStatusMutation.isPending || bulkDeleteMutation.isPending}
                    className="h-8 gap-1.5 border-border hover:bg-surface-hover text-xs font-medium"
                    title="Ubah semua produk terpilih menjadi Diarsipkan (Sembunyikan dari Toko)"
                  >
                    <EyeOff className="w-3.5 h-3.5 text-foreground-muted" />
                    <span>Arsipkan ({selectedIds.length})</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setIsBulkDeleteModalOpen(true)}
                    disabled={bulkStatusMutation.isPending || bulkDeleteMutation.isPending}
                    className="h-8 gap-1.5 bg-status-error/15 hover:bg-status-error text-status-error hover:text-white border border-status-error/30 text-xs font-medium"
                    title="Hapus permanen produk terpilih"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus ({selectedIds.length})</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedIds([])}
                    disabled={bulkStatusMutation.isPending || bulkDeleteMutation.isPending}
                    className="h-8 text-foreground-muted hover:text-foreground text-xs"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    <span>Batal</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Products Table */}
            {isLoadingProducts ? (
              <div className="p-12 text-center text-xs text-foreground-muted bg-surface border border-border rounded-xl">
                Memuat data katalog terkelola...
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center space-y-3 bg-surface border border-border rounded-xl">
                <Package className="w-10 h-10 text-foreground-muted mx-auto" />
                <p className="text-sm font-semibold text-foreground">Tidak ada produk ditemukan</p>
                <p className="text-xs text-foreground-muted">
                  Coba ubah filter pencarian atau tambahkan produk baru.
                </p>
              </div>
            ) : (
              <div className="space-y-4 min-w-0">
                {/* 1. Desktop & Tablet View Table (hidden on mobile < md) */}
                <div className="hidden md:block bg-surface border border-border rounded-xl overflow-hidden shadow-subtle min-w-0">
                  <div className="overflow-x-auto min-w-0">
                  <table className="w-full text-left text-xs table-fixed">
                    <colgroup>
                      <col style={{ width: '38px' }} />
                      <col style={{ width: '28%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '11%' }} />
                      <col style={{ width: '11%' }} />
                      <col style={{ width: '9%' }} />
                      <col style={{ width: '106px' }} />
                    </colgroup>
                    <thead className="bg-surface-raised border-b border-border text-foreground-muted uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = isSomeSelected;
                            }}
                            onChange={handleToggleSelectAll}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer align-middle"
                            title={isAllSelected ? 'Batalkan pilihan semua' : 'Pilih semua produk terfilter'}
                            aria-label="Pilih semua produk"
                          />
                        </th>
                        <th className="py-3 px-2.5 sm:px-3 text-left">Produk</th>
                        <th className="py-3 px-2 text-left">Kategori</th>
                        <th className="py-3 px-2 text-left whitespace-nowrap">Harga Modal</th>
                        <th className="py-3 px-2 text-left whitespace-nowrap">Harga Jual</th>
                        <th className="py-3 px-2 text-left whitespace-nowrap">Margin Laba</th>
                        <th className="py-3 px-2 text-left whitespace-nowrap">Stok Supplier</th>
                        <th className="py-3 px-2 text-left whitespace-nowrap">Visibilitas</th>
                        <th className="py-3 px-2 text-center whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {products.map((p, idx) => {
                        const isLiveWarning =
                          p.status === 'active' &&
                          p.provider === 'vip-reseller' &&
                          p.providerStatus === 'empty';
                        const isSelected = selectedIdSet.has(p.id);

                        return (
                          <tr
                            key={p.id}
                            style={{ animationDelay: `${Math.min(idx, 12) * 35}ms` }}
                            className={`hover:bg-surface-hover/50 transition-colors animate-fade-up ${
                              isSelected ? 'bg-primary/10' : ''
                            } ${isLiveWarning ? 'bg-status-warning/5' : ''}`}
                          >
                            <td className="py-3 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectOne(p.id)}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer align-middle"
                                aria-label={`Pilih produk ${p.name}`}
                              />
                            </td>
                            <td className="py-3 px-2.5 sm:px-3 min-w-0">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-9 h-9 rounded-lg object-cover bg-surface-raised border border-border shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start gap-1.5">
                                    <span
                                      className="font-semibold text-foreground text-xs leading-snug line-clamp-2 break-words"
                                      title={p.name}
                                    >
                                      {p.name}
                                    </span>
                                    {p.popular && (
                                      <Badge className="text-[9px] py-0 px-1 bg-primary text-white shrink-0 font-medium mt-0.5">
                                        Populer
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-foreground-muted flex items-center gap-1.5 mt-0.5 min-w-0">
                                    <span className="shrink-0">ID: {p.id}</span>
                                    {p.provider === 'vip-reseller' && p.providerCode && (
                                      <span className="text-primary font-mono truncate" title={`VIP Code: ${p.providerCode}`}>
                                        • VIP: {p.providerCode}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-2 font-medium text-foreground text-xs min-w-0">
                              <span className="leading-snug break-words line-clamp-2 block" title={p.category.name}>
                                {p.category.name}
                              </span>
                            </td>

                            <td className="py-3 px-2 font-mono text-foreground-muted text-xs whitespace-nowrap">
                              {p.providerPrice ? `Rp ${p.providerPrice.toLocaleString('id-ID')}` : 'Internal'}
                            </td>

                            <td className="py-3 px-2 font-mono font-bold text-foreground text-xs whitespace-nowrap">
                              Rp {p.price.toLocaleString('id-ID')}
                            </td>

                            <td className="py-3 px-2 whitespace-nowrap">
                              {(() => {
                                const margin =
                                  p.providerPrice !== undefined && p.providerPrice !== null && p.providerPrice > 0
                                    ? p.price - p.providerPrice
                                    : p.profitMargin;
                                const percentage =
                                  p.providerPrice !== undefined && p.providerPrice !== null && p.providerPrice > 0
                                    ? Math.round(((p.price - p.providerPrice) / p.providerPrice) * 100)
                                    : p.profitPercentage;

                                if (margin !== undefined && margin > 0) {
                                  return (
                                    <div className="flex flex-col font-mono leading-tight whitespace-nowrap">
                                      <span className="inline-flex items-center gap-1 text-status-success font-semibold text-xs">
                                        <TrendingUp className="w-3 h-3 shrink-0" />
                                        <span>+Rp {margin.toLocaleString('id-ID')}</span>
                                      </span>
                                      <span className="text-[10px] text-status-success/80 font-normal pl-4">
                                        ({percentage}%)
                                      </span>
                                    </div>
                                  );
                                }
                                if (margin !== undefined && margin < 0) {
                                  return (
                                    <div className="flex flex-col font-mono leading-tight whitespace-nowrap">
                                      <span className="inline-flex items-center gap-1 text-status-error font-semibold text-xs">
                                        <TrendingDown className="w-3 h-3 shrink-0" />
                                        <span>-Rp {Math.abs(margin).toLocaleString('id-ID')}</span>
                                      </span>
                                      <span className="text-[10px] text-status-error/80 font-normal pl-4">
                                        ({percentage}%)
                                      </span>
                                    </div>
                                  );
                                }
                                if (margin === 0) {
                                  return (
                                    <div className="font-mono text-xs text-foreground-muted whitespace-nowrap">
                                      <span>Rp 0</span> <span className="text-[10px] opacity-75">(0%)</span>
                                    </div>
                                  );
                                }
                                return <span className="text-foreground-muted text-xs">-</span>;
                              })()}
                            </td>

                            <td className="py-3 px-2 whitespace-nowrap">
                              {p.provider === 'vip-reseller' ? (
                                p.providerStatus === 'available' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-status-success/15 text-status-success">
                                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                                    <span>Tersedia ({p.stock ?? 100})</span>
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-status-warning/15 text-status-warning"
                                    title="Stok supplier kosong!"
                                  >
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    <span>Kosong</span>
                                  </span>
                                )
                              ) : (
                                (p.stock !== undefined && p.stock <= 0) ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-status-warning/15 text-status-warning">
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    <span>Kosong (0)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-status-success/15 text-status-success">
                                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                                    <span>Tersedia ({p.stock ?? 100})</span>
                                  </span>
                                )
                              )}
                            </td>

                            <td className="py-3 px-2 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => toggleMutation.mutate(p.id)}
                                disabled={toggleMutation.isPending}
                                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer ${
                                  p.status === 'active'
                                    ? 'bg-status-success/15 text-status-success hover:bg-status-success/25'
                                    : 'bg-surface-raised border border-border text-foreground-muted hover:text-foreground'
                                }`}
                                title="Klik untuk beralih antara Muncul di Toko / Diarsipkan"
                              >
                                {p.status === 'active' ? (
                                  <>
                                    <Eye className="w-3 h-3 shrink-0" />
                                    <span>Aktif</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3 h-3 shrink-0" />
                                    <span>Diarsipkan</span>
                                  </>
                                )}
                              </button>
                            </td>

                            <td className="py-3 px-2 text-center whitespace-nowrap">
                              <div className="inline-flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(p)}
                                  className="w-8 h-8 rounded-lg bg-surface border border-border text-[#2563EB] hover:text-[#1D4ED8] hover:border-[#2563EB]/40 hover:bg-blue-50/80 dark:hover:bg-blue-950/30 transition-all inline-flex items-center justify-center shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary cursor-pointer active:scale-95 shrink-0"
                                  title="Edit detail & harga jual"
                                  aria-label={`Edit ${p.name}`}
                                >
                                  <FontAwesomeIcon icon={faPen} className="w-3.5 h-3.5 shrink-0" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateProduct(p)}
                                  className="w-8 h-8 rounded-lg bg-surface border border-border text-foreground-muted hover:text-foreground hover:border-border-strong hover:bg-surface-raised transition-all inline-flex items-center justify-center shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary cursor-pointer active:scale-95 shrink-0"
                                  title="Duplikat produk ini"
                                  aria-label={`Duplikat ${p.name}`}
                                >
                                  <FontAwesomeIcon icon={faCopySolid} className="w-3.5 h-3.5 shrink-0" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeletingProductId(p.id);
                                    setDeletingProductName(p.name);
                                  }}
                                  className="w-8 h-8 rounded-lg bg-surface border border-border text-status-error hover:text-red-700 hover:border-status-error/50 hover:bg-status-error/10 transition-all inline-flex items-center justify-center shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-status-error cursor-pointer active:scale-95 shrink-0"
                                  title="Hapus produk permanen"
                                  aria-label={`Hapus ${p.name}`}
                                >
                                  <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5 shrink-0" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 border-t border-border bg-surface-raised flex items-center justify-between text-xs">
                  <span className="text-foreground-muted font-medium">
                    Menampilkan seluruh <span className="text-foreground font-semibold">{filteredProducts.length}</span> produk
                    {searchQuery ? ` (hasil pencarian "${searchQuery}")` : ''}
                  </span>
                  <span className="text-[11px] text-foreground-muted hidden sm:inline">
                    Semua produk terkelola dimuat secara penuh tanpa batas.
                  </span>
                </div>
              </div>

              {/* 2. Mobile & Tablet Card View (visible on screen < md) */}
              <div className="md:hidden flex flex-col gap-3.5 min-w-0">
                {products.map((p, idx) => {
                  const isLiveWarning =
                    p.status === 'active' &&
                    p.provider === 'vip-reseller' &&
                    p.providerStatus === 'empty';
                  const isSelected = selectedIdSet.has(p.id);

                  const margin =
                    p.providerPrice !== undefined && p.providerPrice !== null && p.providerPrice > 0
                      ? p.price - p.providerPrice
                      : p.profitMargin;
                  const percentage =
                    p.providerPrice !== undefined && p.providerPrice !== null && p.providerPrice > 0
                      ? Math.round(((p.price - p.providerPrice) / p.providerPrice) * 100)
                      : p.profitPercentage;

                  return (
                    <div
                      key={p.id}
                      style={{ animationDelay: `${Math.min(idx, 12) * 35}ms` }}
                      className={`bg-surface border border-border/80 rounded-2xl p-4 space-y-3 shadow-2xs hover:shadow-xs hover:border-border-strong transition-all animate-fade-up ${
                        isSelected ? 'ring-2 ring-primary bg-primary/5 border-primary/40' : ''
                      } ${isLiveWarning ? 'border-amber-400/60 bg-amber-500/5' : ''}`}
                    >
                      {/* Top Row: Checkbox, Image, Title & Badges */}
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(p.id)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer align-middle mt-1 shrink-0"
                          aria-label={`Pilih produk ${p.name}`}
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          loading="lazy"
                          decoding="async"
                          className="w-11 h-11 rounded-lg object-cover bg-surface-raised border border-border shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="font-semibold text-foreground text-xs leading-snug line-clamp-2 break-words" title={p.name}>
                              {p.name}
                            </span>
                            {p.popular && (
                              <Badge className="text-[9px] py-0 px-1 bg-primary text-white shrink-0 font-medium">
                                Populer
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-foreground-muted mt-1">
                            <span className="px-1.5 py-0.5 rounded bg-surface-raised border border-border/80 font-medium text-foreground">
                              {p.category.name}
                            </span>
                            <span className="font-mono text-foreground-muted">ID: {p.id}</span>
                            {p.provider === 'vip-reseller' && p.providerCode && (
                              <span className="text-primary font-mono truncate" title={`VIP Code: ${p.providerCode}`}>
                                • VIP: {p.providerCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle Row: Financials 2x2 Grid */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-surface-raised/70 border border-border/80 text-xs">
                        <div>
                          <span className="text-[10px] text-foreground-muted block">Harga Jual</span>
                          <span className="font-mono font-bold text-foreground text-xs">
                            Rp {p.price.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-foreground-muted block">Harga Modal</span>
                          <span className="font-mono text-foreground-muted text-xs">
                            {p.providerPrice ? `Rp ${p.providerPrice.toLocaleString('id-ID')}` : 'Internal'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-foreground-muted block">Margin Laba</span>
                          {margin !== undefined && margin > 0 ? (
                            <span className="font-mono font-semibold text-status-success text-xs inline-flex items-center gap-0.5">
                              <TrendingUp className="w-3 h-3 shrink-0" />
                              <span>+Rp {margin.toLocaleString('id-ID')}</span>
                              <span className="text-[10px] opacity-80">({percentage}%)</span>
                            </span>
                          ) : margin !== undefined && margin < 0 ? (
                            <span className="font-mono font-semibold text-status-error text-xs inline-flex items-center gap-0.5">
                              <TrendingDown className="w-3 h-3 shrink-0" />
                              <span>-Rp {Math.abs(margin).toLocaleString('id-ID')}</span>
                              <span className="text-[10px] opacity-80">({percentage}%)</span>
                            </span>
                          ) : (
                            <span className="font-mono text-foreground-muted text-xs">Rp 0 (0%)</span>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] text-foreground-muted block">Stok Supplier</span>
                          {p.provider === 'vip-reseller' ? (
                            p.providerStatus === 'available' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-status-success">
                                <CheckCircle2 className="w-3 h-3 shrink-0" />
                                <span>Tersedia ({p.stock ?? 100})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-status-warning">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>Kosong</span>
                              </span>
                            )
                          ) : (
                            (p.stock !== undefined && p.stock <= 0) ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-status-warning">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>Kosong (0)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-status-success">
                                <CheckCircle2 className="w-3 h-3 shrink-0" />
                                <span>Tersedia ({p.stock ?? 100})</span>
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      {/* Bottom Row: Visibility Toggle & Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => toggleMutation.mutate(p.id)}
                          disabled={toggleMutation.isPending}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                            p.status === 'active'
                              ? 'bg-status-success/15 text-status-success hover:bg-status-success/25 border border-status-success/20'
                              : 'bg-surface-raised border border-border text-foreground-muted hover:text-foreground'
                          }`}
                          title="Klik untuk beralih antara Muncul di Toko / Diarsipkan"
                        >
                          {p.status === 'active' ? (
                            <>
                              <Eye className="w-3.5 h-3.5 shrink-0" />
                              <span>Aktif di Toko</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 shrink-0" />
                              <span>Diarsipkan</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="h-8 px-2.5 rounded-lg bg-surface border border-border text-[#2563EB] hover:text-[#1D4ED8] hover:border-[#2563EB]/40 hover:bg-blue-50/80 transition-all inline-flex items-center gap-1 text-xs font-medium shadow-2xs cursor-pointer active:scale-95"
                            title="Edit detail & harga jual"
                          >
                            <FontAwesomeIcon icon={faPen} className="w-3 h-3 shrink-0" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateProduct(p)}
                            className="h-8 px-2.5 rounded-lg bg-surface border border-border text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-all inline-flex items-center gap-1 text-xs font-medium shadow-2xs cursor-pointer active:scale-95"
                            title="Duplikat produk ini"
                          >
                            <FontAwesomeIcon icon={faCopySolid} className="w-3 h-3 shrink-0" />
                            <span>Salin</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingProductId(p.id);
                              setDeletingProductName(p.name);
                            }}
                            className="h-8 px-2.5 rounded-lg bg-surface border border-border text-status-error hover:text-red-700 hover:border-status-error/50 hover:bg-status-error/10 transition-all inline-flex items-center gap-1 text-xs font-medium shadow-2xs cursor-pointer active:scale-95"
                            title="Hapus produk permanen"
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-3 h-3 shrink-0" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Mobile Summary */}
                <div className="p-3.5 rounded-xl bg-surface border border-border text-center text-xs text-foreground-muted">
                  Menampilkan seluruh <span className="text-foreground font-semibold">{filteredProducts.length}</span> produk
                  {searchQuery ? ` (hasil pencarian "${searchQuery}")` : ''}
                </div>
              </div>
            </div>
          )}
          </div>
          </div>
        )}

        {/* TAB: HOMEPAGE PRODUCT ORDERING */}
        {visitedTabs.has('homepage-ordering') && (
          <div className={activeTab === 'homepage-ordering' ? 'block animate-tab-glide' : 'hidden'}>
            <AdminHomepageOrdering onNotify={showNotification} />
          </div>
        )}

        {/* TAB 2: USER ORDERS MANAGEMENT */}
        {visitedTabs.has('orders') && (
          <div className={activeTab === 'orders' ? 'block animate-tab-glide' : 'hidden'}>
            <AdminOrdersTab />
          </div>
        )}

        {/* TAB 3: ACTIVITY & AUDIT LOGS */}
        {visitedTabs.has('logs') && (
          <div className={activeTab === 'logs' ? 'block animate-tab-glide' : 'hidden'}>
            <AdminLogsTab />
          </div>
        )}

        {/* TAB 4: PAYMENT MODE SWITCHER & SETTINGS */}
        {visitedTabs.has('payment-settings') && (
          <div className={activeTab === 'payment-settings' ? 'block animate-tab-glide' : 'hidden'}>
            <AdminPaymentSettingsTab onNotify={showNotification} />
          </div>
        )}

        {/* TAB 5: PROMO & VOUCHER CODE MANAGEMENT */}
        {visitedTabs.has('promos') && (
          <div className={activeTab === 'promos' ? 'block animate-tab-glide' : 'hidden'}>
            <AdminPromosTab onNotify={showNotification} />
          </div>
        )}

        {/* TAB 6: VIP RESELLER EXPLORER */}
        {visitedTabs.has('vip-explorer') && (
          <div className={activeTab === 'vip-explorer' ? 'block animate-tab-glide' : 'hidden'}>
          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Jelajahi Layanan Gateway VIP Reseller (Upstream)
                  </h3>
                  <p className="text-xs text-foreground-muted">
                    Pilih produk dari {(allVipServices.length || vipData?.total || 9914).toLocaleString('id-ID')} layanan supplier live untuk diimpor ke katalog Asterra Store dengan harga retail kustom Anda.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30 w-fit">
                  Total Supplier: {(allVipServices.length || vipData?.total || 9914).toLocaleString('id-ID')} Layanan
                </Badge>
              </div>

              {/* Anti-Spam Cache Banner */}
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
                  <span>
                    <strong>Anti-Spam Cache Aktif:</strong> {allVipServices.length} layanan dimuat di memori. Pencarian & filter dilakukan secara instan tanpa mengirim request berulang ke API VIP Reseller.
                  </span>
                </div>
                {vipData?.cacheAgeSeconds !== undefined && (
                  <Badge variant="outline" className="text-[10px] text-foreground-muted border-border w-fit">
                    Usia Cache: {vipData.cacheAgeSeconds}d
                  </Badge>
                )}
              </div>

              {/* Explorer Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Cari layanan (Canva, Netflix, K-Vision, Mobile Legends)..."
                    value={vipSearch}
                    onChange={(e) => setVipSearch(e.target.value)}
                    className="pl-9 text-xs bg-surface-raised border-border"
                  />
                </div>

                <div className="w-full">
                  <Select value={vipType} onValueChange={(val) => setVipType(val)}>
                    <SelectTrigger className="h-9 text-xs bg-surface-raised border-border">
                      <div className="flex items-center gap-1.5 truncate">
                        <Filter className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-foreground-muted">Kategori:</span>
                        <SelectValue placeholder="Semua Tipe Layanan" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tipe Layanan</SelectItem>
                      {vipData?.availableTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full">
                  <Select value={vipStatus} onValueChange={(val) => setVipStatus(val)}>
                    <SelectTrigger className="h-9 text-xs bg-surface-raised border-border">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-foreground-muted">Status:</span>
                        <SelectValue placeholder="Semua Status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="available">Tersedia (Ready)</SelectItem>
                      <SelectItem value="empty">Kosong (Empty)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* VIP Services Listing */}
            {isLoadingVip ? (
              <div className="p-12 text-center text-xs text-foreground-muted bg-surface border border-border rounded-xl">
                Menghubungi gateway VIP Reseller dan memuat layanan...
              </div>
            ) : vipError ? (
              <div className="p-8 text-center space-y-4 bg-surface border border-status-warning/40 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-status-warning mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Kendala Gateway VIP Reseller</p>
                  <p className="text-xs text-foreground-muted max-w-lg mx-auto leading-relaxed">
                    {(vipError as Error).message}
                  </p>
                </div>
                <div className="p-4 bg-surface-raised border border-border rounded-lg max-w-md mx-auto text-left text-xs space-y-2">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-status-success" />
                    <span>Langkah Solusi IP Whitelist:</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-foreground-muted text-[11px]">
                    <li>Buka dan login ke dashboard <strong className="text-foreground">vip-reseller.co.id</strong></li>
                    <li>Masuk ke menu <strong className="text-foreground">Profil &gt; Pengaturan API</strong></li>
                    <li>Tambahkan IP publik Anda ke kolom <strong className="text-foreground">IP Whitelist</strong></li>
                    <li>Klik Simpan, lalu buka kembali tab ini untuk memuat layanan</li>
                  </ol>
                </div>
              </div>
            ) : vipServices.length === 0 ? (
              <div className="p-12 text-center text-xs text-foreground-muted bg-surface border border-border rounded-xl">
                Tidak ada layanan yang cocok dengan filter pencarian.
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vipServices.map((service) => {
                  let base = 0;
                  if (typeof service.price === 'object' && service.price !== null) {
                    base = service.price.basic || service.price.premium || 0;
                  } else if (typeof service.price === 'number') {
                    base = service.price;
                  }

                  return (
                    <div
                      key={service.code}
                      className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono text-primary font-semibold">
                            {service.code}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              service.status === 'available'
                                ? 'bg-status-success/15 text-status-success'
                                : 'bg-status-warning/15 text-status-warning'
                            }`}
                          >
                            {service.status === 'available' ? 'Tersedia' : 'Kosong'}
                          </span>
                        </div>

                        <h4 className="font-semibold text-foreground text-sm line-clamp-2">
                          {service.name}
                        </h4>

                        <div className="text-[11px] text-foreground-muted flex items-center gap-2">
                          <span>Brand: {service.brand || 'Digital'}</span>
                          <span>•</span>
                          <span>Tipe: {service.type}</span>
                        </div>

                        {service.note && service.note !== '-' && (
                          <p className="text-[11px] text-foreground-muted italic line-clamp-2">
                            {service.note}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-foreground-muted block">Harga Modal:</span>
                          <span className="font-bold text-sm text-foreground">
                            Rp {base.toLocaleString('id-ID')}
                          </span>
                        </div>

                        {service.isImported ? (
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="gap-1 text-xs bg-status-success/15 text-status-success border-status-success/30">
                              <Check className="w-3 h-3 text-status-success" />
                              <span>Aktif di Toko</span>
                            </Badge>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenImport(service)}
                              className="text-xs h-7 px-2 text-foreground-muted hover:text-foreground"
                              title="Konfigurasi ulang atau perbarui harga"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleOpenImport(service)}
                            className="text-xs gap-1.5"
                          >
                            <DownloadCloud className="w-3.5 h-3.5" />
                            <span>{service.isArchived ? 'Impor / Aktifkan' : 'Impor Produk'}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredVipServices.length > vipVisibleCount && (
                <div className="p-5 border border-border bg-surface rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs mt-6">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      Menampilkan {vipServices.length} dari {filteredVipServices.length} layanan yang cocok
                    </p>
                    <p className="text-foreground-muted text-[11px]">
                      {filteredVipServices.length - vipServices.length} layanan lainnya disembunyikan di memori browser agar tampilan tetap ringan & mulus.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVipVisibleCount((prev) => prev + 24)}
                      className="text-xs border-border"
                    >
                      Muat 24 Layanan Lagi
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVipVisibleCount(filteredVipServices.length)}
                      className="text-xs text-primary"
                    >
                      Tampilkan Semua ({filteredVipServices.length})
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
          </div>
        )}

        {/* TAB 7: KELOLA ADMIN */}
        {visitedTabs.has('admins') && (
          <div className={activeTab === 'admins' ? 'block animate-tab-glide' : 'hidden'}>
            <AdminUsersTab
              currentAdminEmail={adminUser?.email}
              onNotify={showNotification}
            />
          </div>
        )}

        {/* TAB 8: AFFILIATE & SALES SYSTEM */}
        {visitedTabs.has('affiliate') && (
          <div className={activeTab === 'affiliate' ? 'block animate-tab-glide' : 'hidden'}>
            <AdminAffiliateTab onNotify={showNotification} />
          </div>
        )}

        {/* TAB 9: KATEGORI */}
        {visitedTabs.has('categories') && (
          <div className={activeTab === 'categories' ? 'block animate-tab-glide' : 'hidden'}>
            <AdminCategoriesTab
              onNotify={showNotification}
              onFilterCategoryInProducts={(cat) => {
                setCategoryFilter(cat);
                handleTabChange('products');
              }}
            />
          </div>
        )}

        {/* TAB 10: PROVIDER & SUPPLIER */}
        {visitedTabs.has('providers') && (
          <div className={activeTab === 'providers' ? 'block animate-tab-glide' : 'hidden'}>
            <AdminProvidersTab
              metrics={metrics}
              onNotify={showNotification}
              onSyncVip={() => syncVipMutation.mutate()}
            />
          </div>
        )}

        {/* TAB 11: PELANGGAN (CRM 360) */}
        {visitedTabs.has('customers') && (
          <div className={activeTab === 'customers' ? 'block animate-tab-glide' : 'hidden'}>
            <AdminCustomersTab onNotify={showNotification} />
          </div>
        )}

        {/* TAB 12: REFUND & KOMPLAIN */}
        {visitedTabs.has('refunds') && (
          <div className={activeTab === 'refunds' ? 'block animate-tab-glide' : 'hidden'}>
            <AdminRefundsTab onNotify={showNotification} />
          </div>
        )}

        {/* TAB 13: MARKETING & GROWTH (Campaigns & Banners) */}
        {(visitedTabs.has('campaigns') || visitedTabs.has('banners')) && (
          <div className={activeTab === 'campaigns' || activeTab === 'banners' ? 'block animate-tab-glide' : 'hidden'}>
            <AdminMarketingSuite
              activeTab={activeTab as any}
              onNotify={showNotification}
            />
          </div>
        )}

        {/* TAB 14: KEUANGAN (Wallets, Revenue, Expenses, Profit, Transactions) */}
        {(visitedTabs.has('wallets') ||
          visitedTabs.has('revenue') ||
          visitedTabs.has('expenses') ||
          visitedTabs.has('profit') ||
          visitedTabs.has('financial-transactions')) && (
          <div className={
            activeTab === 'wallets' ||
            activeTab === 'revenue' ||
            activeTab === 'expenses' ||
            activeTab === 'profit' ||
            activeTab === 'financial-transactions'
              ? 'block animate-tab-glide'
              : 'hidden'
          }>
            <AdminFinanceSuite
              activeTab={activeTab as any}
              metrics={metrics}
              onNotify={showNotification}
            />
          </div>
        )}

        {/* TAB 15: ANALYTICS & LAPORAN */}
        {(visitedTabs.has('sales-summary') ||
          visitedTabs.has('product-performance') ||
          visitedTabs.has('affiliate-performance') ||
          visitedTabs.has('financial-reports')) && (
          <div className={
            activeTab === 'sales-summary' ||
            activeTab === 'product-performance' ||
            activeTab === 'affiliate-performance' ||
            activeTab === 'financial-reports'
              ? 'block animate-tab-glide'
              : 'hidden'
          }>
            <AdminAnalyticsSuite
              activeTab={activeTab as any}
              onNotify={showNotification}
            />
          </div>
        )}

        {/* TAB 16: SISTEM & KONFIGURASI (Notifications & Store Settings) */}
        {(visitedTabs.has('notifications') || visitedTabs.has('store-settings')) && (
          <div className={activeTab === 'notifications' || activeTab === 'store-settings' ? 'block animate-tab-glide' : 'hidden'}>
            <AdminSystemSettingsSuite
              activeTab={activeTab as any}
              onNotify={showNotification}
            />
          </div>
        )}

        {/* TAB 17: PORTAL PENJUALAN (SALES SUITE) */}
        {(visitedTabs.has('sales-overview') ||
          visitedTabs.has('sales-catalog') ||
          visitedTabs.has('sales-links') ||
          visitedTabs.has('sales-orders') ||
          visitedTabs.has('sales-network') ||
          visitedTabs.has('sales-wallet') ||
          visitedTabs.has('sales-academy')) && (
          <div className={activeTab.startsWith('sales-') ? 'block animate-tab-glide' : 'hidden'}>
            <SalesConsoleSuite
              activeTab={activeTab}
              onTabChange={handleTabChange}
              adminUser={adminUser}
            />
          </div>
        )}
      </main>

      {/* MODAL 1: EDIT / CREATE MANAGED PRODUCT */}
      {(editingProduct || isCreateModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-pop">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  {editingProduct ? 'Pengaturan Detail & Harga Produk' : 'Tambah Produk Baru ke Asterra'}
                </h3>
                <p className="text-xs text-foreground-muted">
                  Tentukan nama, harga jual konsumen, dan status visibilitas katalog.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setIsCreateModalOpen(false);
                }}
                className="text-foreground-muted hover:text-foreground p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveProductMutation.mutate();
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-semibold text-foreground block mb-1">Nama Produk</label>
                <Input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="bg-surface-raised border-border text-xs"
                  placeholder="Contoh: Canva Pro 1 Bulan Private"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Kategori Toko</label>
                <Input
                  type="text"
                  required
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="bg-surface-raised border-border text-xs"
                  placeholder="AI Tools, Desain, Streaming..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    Harga Jual Retail (Rp) <span className="text-primary">*Ditentukan Admin</span>
                  </label>
                  <Input
                    type="number"
                    required
                    min="0"
                    step="500"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="bg-surface-raised border-border text-xs font-mono font-bold"
                    placeholder="Contoh: 50000"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    Harga Supplier / Modal (Rp) <span className="text-foreground-muted text-[10px]">(Bisa diubah)</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="500"
                    value={formProviderPrice}
                    onChange={(e) => setFormProviderPrice(Number(e.target.value))}
                    className="bg-surface-raised border-border text-xs font-mono font-bold"
                    placeholder="Harga supply / modal dasar"
                  />
                  <span className="text-[10px] text-foreground-muted block mt-1">
                    {editingProduct?.provider === 'vip-reseller'
                      ? 'Terisi otomatis dari VIP Reseller (dapat diubah).'
                      : 'Harga modal untuk produk mandiri.'}
                  </span>
                </div>
              </div>

              {/* Real-time Profit Margin Calculation */}
              <div className="p-3 bg-surface-raised rounded-lg flex items-center justify-between text-xs border border-border">
                <div>
                  <span className="text-foreground-muted block">Harga Modal:</span>
                  <span className="font-bold text-foreground font-mono">
                    Rp {formProviderPrice.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-foreground-muted block">Estimasi Keuntungan:</span>
                  {formPrice - formProviderPrice > 0 ? (
                    <span className="font-bold text-status-success font-mono">
                      +Rp {(formPrice - formProviderPrice).toLocaleString('id-ID')} (
                      {formProviderPrice > 0
                        ? Math.round(((formPrice - formProviderPrice) / formProviderPrice) * 100)
                        : 100}
                      %)
                    </span>
                  ) : formPrice - formProviderPrice < 0 ? (
                    <span className="font-bold text-status-error font-mono">
                      -Rp {Math.abs(formPrice - formProviderPrice).toLocaleString('id-ID')} (
                      {formProviderPrice > 0
                        ? Math.round(((formPrice - formProviderPrice) / formProviderPrice) * 100)
                        : 0}
                      %)
                    </span>
                  ) : (
                    <span className="font-bold text-foreground-muted font-mono">
                      Rp 0 (0%)
                    </span>
                  )}
                </div>
              </div>

              {/* Pengaturan Stok Produk */}
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Pengaturan Stok Produk (Unit)
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(Math.max(0, parseInt(e.target.value || '0', 10)))}
                    className="bg-surface-raised border-border text-xs font-mono font-bold flex-1"
                    placeholder="Jumlah stok (0 = Habis)"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setFormStock(100)}
                      className="text-xs h-9 border-border"
                    >
                      Tersedia (100)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setFormStock(0)}
                      className="text-xs h-9 border-status-error/40 text-status-error hover:bg-status-error/10"
                    >
                      Set Habis (0)
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] text-foreground-muted">Status Ketersediaan:</span>
                  {formStock > 0 ? (
                    <span className="text-[11px] font-semibold text-status-success">
                      ✓ Stok Tersedia ({formStock} unit)
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-status-error">
                      ⚠ Stok Habis (Button checkout & keranjang akan nonaktif di sisi user)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Status Visibilitas Katalog
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormStatus('active')}
                    className={`p-2.5 rounded-lg border text-left transition-colors flex items-center gap-2 ${
                      formStatus === 'active'
                        ? 'border-status-success bg-status-success/10 text-status-success font-semibold'
                        : 'border-border bg-surface-raised text-foreground-muted'
                    }`}
                  >
                    <Eye className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="block text-xs">Aktif di Katalog</span>
                      <span className="text-[10px] text-foreground-muted">Muncul di toko publik</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStatus('archived')}
                    className={`p-2.5 rounded-lg border text-left transition-colors flex items-center gap-2 ${
                      formStatus === 'archived'
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border bg-surface-raised text-foreground-muted'
                    }`}
                  >
                    <EyeOff className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="block text-xs">Diarsipkan (Draft)</span>
                      <span className="text-[10px] text-foreground-muted">Sembunyikan dari toko</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Highlight Guarantees / Keunggulan (3 Kartu Atas) */}
              <div className="p-3 bg-surface-raised/60 border border-border rounded-xl space-y-3">
                <div>
                  <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span>3 Badge Keunggulan Layanan (Muncul di Halaman Detail)</span>
                  </h4>
                  <p className="text-[11px] text-foreground-muted">
                    Sesuaikan judul dan keterangan 3 kartu garansi / fitur utama di atas deskripsi produk.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {/* Chip 1 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-surface p-2.5 rounded-lg border border-border/80">
                    <div>
                      <label className="text-[10px] font-semibold text-foreground block mb-0.5">
                        Badge 1 - Judul (Garansi)
                      </label>
                      <Input
                        type="text"
                        value={formGuaranteeTitle}
                        onChange={(e) => setFormGuaranteeTitle(e.target.value)}
                        placeholder="Garansi Penuh"
                        className="h-8 text-xs bg-surface-raised"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-foreground block mb-0.5">
                        Badge 1 - Keterangan
                      </label>
                      <Input
                        type="text"
                        value={formGuaranteeDesc}
                        onChange={(e) => setFormGuaranteeDesc(e.target.value)}
                        placeholder="Jaminan ganti akun 100%"
                        className="h-8 text-xs bg-surface-raised"
                      />
                    </div>
                  </div>

                  {/* Chip 2 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-surface p-2.5 rounded-lg border border-border/80">
                    <div>
                      <label className="text-[10px] font-semibold text-foreground block mb-0.5">
                        Badge 2 - Judul (Proses)
                      </label>
                      <Input
                        type="text"
                        value={formProcessTitle}
                        onChange={(e) => setFormProcessTitle(e.target.value)}
                        placeholder="Proses Instan"
                        className="h-8 text-xs bg-surface-raised"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-foreground block mb-0.5">
                        Badge 2 - Keterangan
                      </label>
                      <Input
                        type="text"
                        value={formProcessDesc}
                        onChange={(e) => setFormProcessDesc(e.target.value)}
                        placeholder="1 - 15 menit selesai"
                        className="h-8 text-xs bg-surface-raised"
                      />
                    </div>
                  </div>

                  {/* Chip 3 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-surface p-2.5 rounded-lg border border-border/80">
                    <div>
                      <label className="text-[10px] font-semibold text-foreground block mb-0.5">
                        Badge 3 - Judul (Tipe Akun)
                      </label>
                      <Input
                        type="text"
                        value={formPrivacyTitle}
                        onChange={(e) => setFormPrivacyTitle(e.target.value)}
                        placeholder="Akun Private"
                        className="h-8 text-xs bg-surface-raised"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-foreground block mb-0.5">
                        Badge 3 - Keterangan
                      </label>
                      <Input
                        type="text"
                        value={formPrivacyDesc}
                        onChange={(e) => setFormPrivacyDesc(e.target.value)}
                        placeholder="Ruang kerja aman & personal"
                        className="h-8 text-xs bg-surface-raised"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Deskripsi Produk</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-surface-raised border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  placeholder="Jelaskan detail lisensi, akun, dan instruksi..."
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Fitur & Keunggulan (Satu per baris)
                </label>
                <textarea
                  rows={3}
                  value={formFeatures}
                  onChange={(e) => setFormFeatures(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-surface-raised border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  placeholder="Fitur 1&#10;Fitur 2&#10;Fitur 3"
                />
              </div>

              {/* Product Banner Guard & Anti-Redundansi Notice */}
              {editingProduct &&
                Boolean(editingProduct.imageUrl && !editingProduct.imageUrl.includes('default-product-banner')) && (
                  <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <span>Banner Resmi Terdaftar di Vercel Blob</span>
                      </span>
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                        Terkunci (Anti-Duplikasi)
                      </Badge>
                    </div>
                    <p className="text-[11px] text-foreground-muted leading-relaxed">
                      Produk ini sudah memiliki banner resmi di Vercel Blob. Upload banner reguler dinonaktifkan untuk menjaga integritas aset dan mencegah redundansi file.
                    </p>
                    <label className="flex items-center gap-2 pt-1 font-medium text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSpecialPromoBanner}
                        onChange={(e) => setIsSpecialPromoBanner(e.target.checked)}
                        className="rounded text-primary focus:ring-primary w-4 h-4"
                      />
                      <span className="text-xs">
                        Aktifkan Unggah Banner Promo Khusus (Event / Promo Terbatas)
                      </span>
                    </label>
                  </div>
                )}

              <ImageUploadDropzone
                value={formImageUrl}
                onChange={setFormImageUrl}
                onFileStaged={setStagedFile}
                folder="products"
                productName={formName}
                productId={editingProduct?.id}
                isSpecialPromo={isSpecialPromoBanner}
                disabled={Boolean(
                  editingProduct &&
                    editingProduct.imageUrl &&
                    !editingProduct.imageUrl.includes('default-product-banner') &&
                    !isSpecialPromoBanner
                )}
                label={
                  isSpecialPromoBanner
                    ? 'Unggah Banner Promo Khusus (Vercel Blob)'
                    : 'Banner / Gambar Produk (Vercel Blob)'
                }
                description={
                  editingProduct &&
                  editingProduct.imageUrl &&
                  !editingProduct.imageUrl.includes('default-product-banner') &&
                  !isSpecialPromoBanner
                    ? 'Banner resmi sudah aktif. Centang opsi di atas jika ingin mengunggah banner promosi khusus.'
                    : isSpecialPromoBanner
                    ? 'Tarik & lepas gambar promo khusus ke sini (otomatis ditandai prefix promo-).'
                    : 'Tarik & lepas gambar banner produk ke sini, atau klik untuk memilih file.'
                }
                mode="lazy"
              />

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="popular"
                  checked={formPopular}
                  onChange={(e) => setFormPopular(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <label htmlFor="popular" className="font-medium text-foreground cursor-pointer">
                  Tandai sebagai Produk Terpopuler / Rekomendasi
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingProduct(null);
                    setIsCreateModalOpen(false);
                  }}
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={saveProductMutation.isPending}>
                  {saveProductMutation.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: IMPORT FROM VIP RESELLER */}
      {importingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-pop">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Impor Layanan ke Asterra Store
                </h3>
                <p className="text-xs text-foreground-muted">
                  Tentukan harga jual retail dan status awal produk sebelum diterbitkan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImportingService(null)}
                className="text-foreground-muted hover:text-foreground p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                importMutation.mutate();
              }}
              className="space-y-4 text-xs"
            >
              <div className="p-3 bg-surface-raised rounded-lg space-y-1">
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Kode Layanan VIP:</span>
                  <span className="font-mono font-bold text-primary">{importingService.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Brand / Tipe:</span>
                  <span className="text-foreground">{importingService.brand || 'Digital'} ({importingService.type})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Ketersediaan Supplier:</span>
                  <span className={importingService.status === 'available' ? 'text-status-success font-semibold' : 'text-status-warning font-semibold'}>
                    {importingService.status === 'available' ? 'Tersedia' : 'Kosong'}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Nama Produk di Asterra</label>
                <Input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="bg-surface-raised border-border text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Kategori Asterra</label>
                <Input
                  type="text"
                  required
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="bg-surface-raised border-border text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    Harga Jual Retail (Rp) <span className="text-primary">*Ditentukan Anda</span>
                  </label>
                  <Input
                    type="number"
                    required
                    min="0"
                    step="500"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="bg-surface-raised border-border text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    Harga Modal Supplier (Rp) <span className="text-foreground-muted text-[10px]">(Bisa diubah)</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="500"
                    value={formProviderPrice}
                    onChange={(e) => setFormProviderPrice(Number(e.target.value))}
                    className="bg-surface-raised border-border text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Pengaturan Stok Produk */}
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Pengaturan Stok Produk (Unit)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(Math.max(0, parseInt(e.target.value || '0', 10)))}
                    className="bg-surface-raised border-border text-xs font-mono font-bold flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setFormStock(100)}
                    className="text-xs h-9 border-border"
                  >
                    Tersedia (100)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setFormStock(0)}
                    className="text-xs h-9 border-status-error/40 text-status-error hover:bg-status-error/10"
                  >
                    Habis (0)
                  </Button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Status Awal</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormStatus('active')}
                    className={`p-2.5 rounded-lg border text-left transition-colors flex items-center gap-2 ${
                      formStatus === 'active'
                        ? 'border-status-success bg-status-success/10 text-status-success font-semibold'
                        : 'border-border bg-surface-raised text-foreground-muted'
                    }`}
                  >
                    <Eye className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="block text-xs">Langsung Tampil</span>
                      <span className="text-[10px] text-foreground-muted">Aktif di katalog</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStatus('archived')}
                    className={`p-2.5 rounded-lg border text-left transition-colors flex items-center gap-2 ${
                      formStatus === 'archived'
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border bg-surface-raised text-foreground-muted'
                    }`}
                  >
                    <EyeOff className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="block text-xs">Simpan ke Arsip</span>
                      <span className="text-[10px] text-foreground-muted">Review sebelum live</span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Deskripsi Tambahan</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-surface-raised border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setImportingService(null)}
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={importMutation.isPending}>
                  {importMutation.isPending ? 'Mengimpor...' : 'Impor ke Katalog'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Sticky Bulk Actions Bar (When items are selected while scrolling) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-surface/95 backdrop-blur-md border border-primary/50 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs">
                {selectedIds.length}
              </span>
              <span className="font-semibold text-foreground whitespace-nowrap">
                produk dipilih
              </span>
            </div>

            <div className="h-5 w-px bg-border hidden sm:block" />

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, status: 'active' })}
                disabled={bulkStatusMutation.isPending}
                className="h-8 gap-1.5 bg-status-success hover:bg-status-success/90 text-white text-xs font-semibold px-3"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Aktifkan ({selectedIds.length})</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkStatusMutation.mutate({ ids: selectedIds, status: 'archived' })}
                disabled={bulkStatusMutation.isPending}
                className="h-8 gap-1.5 border-border bg-surface hover:bg-surface-raised text-foreground text-xs font-semibold px-3"
              >
                <EyeOff className="w-3.5 h-3.5 text-foreground-muted" />
                <span>Arsipkan ({selectedIds.length})</span>
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                disabled={bulkStatusMutation.isPending || bulkDeleteMutation.isPending}
                className="h-8 gap-1.5 text-xs font-semibold px-3"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus ({selectedIds.length})</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds([])}
                disabled={bulkStatusMutation.isPending || bulkDeleteMutation.isPending}
                className="h-8 text-foreground-muted hover:text-foreground text-xs"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">Batal</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Single Product Delete Confirmation Modal [T7] */}
      {deletingProductId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-status-error">
              <div className="w-10 h-10 rounded-full bg-status-error/10 border border-status-error/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-status-error" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Hapus Produk?</h3>
                <p className="text-xs text-foreground-muted">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-xs text-foreground bg-surface-raised border border-border p-3 rounded-lg leading-relaxed">
              Apakah Anda yakin ingin menghapus produk <strong className="text-status-error">{deletingProductName}</strong> dari database Asterra Store?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeletingProductId(null);
                  setDeletingProductName('');
                }}
                disabled={deleteProductMutation.isPending}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => deleteProductMutation.mutate(deletingProductId)}
                disabled={deleteProductMutation.isPending}
              >
                {deleteProductMutation.isPending ? 'Menghapus...' : 'Ya, Hapus Produk'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal [T7] */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-status-error">
              <div className="w-10 h-10 rounded-full bg-status-error/10 border border-status-error/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-status-error" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Hapus {selectedIds.length} Produk Sekaligus?</h3>
                <p className="text-xs text-foreground-muted">Tindakan penghapusan massal permanen.</p>
              </div>
            </div>

            <p className="text-xs text-foreground bg-surface-raised border border-border p-3 rounded-lg leading-relaxed">
              Anda akan menghapus <strong className="text-status-error">{selectedIds.length} produk</strong> sekaligus dari database. Produk yang telah dihapus tidak akan dapat dipulihkan kembali.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                disabled={bulkDeleteMutation.isPending}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => bulkDeleteMutation.mutate(selectedIds)}
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? 'Menghapus Massal...' : `Hapus ${selectedIds.length} Produk`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Dedicated Footer */}
      <footer className="mt-auto border-t border-border py-4 px-4 sm:px-8 bg-surface-raised/40 text-center text-xs text-foreground-muted">
        <p>© 2026 Asterra Store — Internal Management Console</p>
      </footer>
    </div>
  </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center selection:bg-primary/20 selection:text-primary">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center shadow-subtle animate-pulse">
              <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            </div>
            <span className="text-xs text-foreground-muted tracking-widest uppercase font-mono">
              Memverifikasi Otoritas Sesi Admin...
            </span>
          </div>
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
