'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ManagedProductItem } from '@/lib/services/admin-catalog-store';
import { VipRawService } from '@/lib/services/vip-reseller.service';
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
  LogOut,
  ShoppingBag,
  Activity,
  CreditCard,
  Tag,
  Trash2,
} from 'lucide-react';
import { AdminOrdersTab } from '@/components/admin/admin-orders-tab';
import { AdminLogsTab } from '@/components/admin/admin-logs-tab';
import { AdminPaymentSettingsTab } from '@/components/admin/admin-payment-settings-tab';
import { AdminPromosTab } from '@/components/admin/admin-promos-tab';
import { ImageUploadDropzone } from '@/components/admin/image-upload-dropzone';

interface AdminProductsResponse {
  success: boolean;
  data: ManagedProductItem[];
  metrics: {
    total: number;
    totalActive: number;
    totalArchived: number;
    totalWarnings: number;
    vipBalance: number | null;
  };
}

interface VipServicesResponse {
  success: boolean;
  total: number;
  cached?: boolean;
  cacheAgeSeconds?: number;
  availableTypes: string[];
  availableBrands: string[];
  data: (VipRawService & { isImported: boolean; importedProductId?: string })[];
}

export default function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Admin authentication state
  const [adminUser, setAdminUser] = useState<{ email: string } | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Check admin session on mount
  useEffect(() => {
    async function verifyAuth() {
      try {
        const res = await fetch('/api/v1/admin/auth/me');
        if (!res.ok) {
          router.replace('/admin/login');
          return;
        }
        const data = await res.json();
        if (!data.authenticated) {
          router.replace('/admin/login');
          return;
        }
        setAdminUser(data.admin);
      } catch {
        router.replace('/admin/login');
      } finally {
        setIsAuthChecking(false);
      }
    }
    verifyAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/admin/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      router.replace('/admin/login');
    }
  };

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'logs' | 'payment-settings' | 'promos' | 'vip-explorer'>('products');

  // Filter states for Managed Products
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'warning'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Multi-selection states for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter states for VIP Reseller Explorer
  const [vipSearch, setVipSearch] = useState('');
  const [vipType, setVipType] = useState('all');
  const [vipStatus, setVipStatus] = useState('all');

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
  const [formPopular, setFormPopular] = useState(false);

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

  // Fetch Managed Products once - searching and filtering are 100% in-memory
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
    staleTime: 5 * 60 * 1000,
  });

  // Fetch VIP Reseller Services Explorer once - cached in memory to prevent API spam
  const {
    data: vipData,
    isLoading: isLoadingVip,
    error: vipError,
  } = useQuery<VipServicesResponse>({
    queryKey: ['admin-vip-services'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/vip-services?limit=2500');
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
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
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
  const saveProductMutation = useMutation({
    mutationFn: async () => {
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
        imageUrl: formImageUrl || undefined,
        popular: formPopular,
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
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
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
    setFormPopular(Boolean(p.popular));
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
    setFormImageUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80');
    setFormPopular(false);
    setIsCreateModalOpen(true);
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

    // AI Tools vs Apps & Streaming mapping
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
    setFormCategory(isAi ? 'AI Tools' : service.type ? service.type : 'Apps & Streaming');

    setFormStatus('archived'); // Default to archived so admin reviews before publishing
    setFormDescription(service.note && service.note !== '-' ? `${service.name}. ${service.note}` : service.name);
    setFormImageUrl('');
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
          (item.brand && item.brand.toLowerCase().includes(q))
      );
    }
    return items;
  }, [allVipServices, vipType, vipStatus, vipSearch]);

  const [vipVisibleCount, setVipVisibleCount] = useState(24);
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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Dedicated Admin Navigation Header */}
      <header className="w-full bg-surface/95 backdrop-blur-md border-b border-border px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-50 shadow-subtle">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm tracking-wider">
              AS
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-foreground">
                Asterra<span className="text-primary">Store</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono font-bold uppercase tracking-wider">
                Admin Panel
              </span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-border text-xs text-foreground-muted">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <span>Terhubung sebagai:</span>
            <span className="text-foreground font-semibold font-mono text-[11px]">
              {adminUser?.email || 'admin@asterra.store'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground-muted hover:text-foreground hover:bg-surface-raised px-3 py-1.5 rounded-lg border border-border transition-colors text-xs font-medium flex items-center gap-1.5"
            title="Buka Toko Publik di tab baru"
          >
            <span>Toko Publik</span>
            <span className="text-[10px]">↗</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-8 text-xs text-status-error hover:bg-status-error/10 hover:text-status-error gap-1.5 px-3 font-medium border border-status-error/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Admin</span>
          </Button>
        </div>
      </header>

      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-raised border border-primary/40 text-foreground px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <Check className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs font-medium">{notification}</p>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Breadcrumb & Title */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-foreground-muted mb-1">
              <Link href="/" className="hover:text-foreground">Beranda</Link>
              <span>/</span>
              <span className="text-foreground font-medium">Panel Admin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Manajemen Katalog & Produk
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1">
              Atur produk aktif vs arsip, tentukan harga jual retail, dan pantau status ketersediaan live dari VIP Reseller.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncVipMutation.mutate()}
              disabled={syncVipMutation.isPending}
              className="text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
              title="Ambil dan sinkronkan semua layanan dari gateway VIP Reseller"
            >
              <DownloadCloud className={`w-3.5 h-3.5 ${syncVipMutation.isPending ? 'animate-bounce' : ''}`} />
              <span>{syncVipMutation.isPending ? 'Menyinkronkan...' : 'Sinkronkan VIP Reseller'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshStockMutation.mutate()}
              disabled={refreshStockMutation.isPending}
              className="text-xs gap-1.5 border-border"
              title="Periksa ketersediaan stok live dari VIP Reseller"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-primary ${refreshStockMutation.isPending ? 'animate-spin' : ''}`} />
              <span>{refreshStockMutation.isPending ? 'Memeriksa...' : 'Cek Stok Supplier'}</span>
            </Button>
            <Button size="sm" onClick={handleOpenCreate} className="text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Produk Baru</span>
            </Button>
          </div>
        </div>

        {/* Top Summary Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-foreground-muted mb-2">
              <span>Aktif di Katalog Toko</span>
              <Eye className="w-4 h-4 text-status-success" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {metrics?.totalActive ?? 0}
            </div>
            <span className="text-[11px] text-foreground-muted">Muncul di halaman pelanggan</span>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-foreground-muted mb-2">
              <span>Diarsipkan (Draft / Hidden)</span>
              <EyeOff className="w-4 h-4 text-foreground-muted" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {metrics?.totalArchived ?? 0}
            </div>
            <span className="text-[11px] text-foreground-muted">Disembunyikan dari katalog</span>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-foreground-muted mb-2">
              <span>Perlu Perhatian (Stok VIP Kosong)</span>
              <AlertTriangle className="w-4 h-4 text-status-warning" />
            </div>
            <div className="text-2xl font-bold text-status-warning">
              {metrics?.totalWarnings ?? 0}
            </div>
            <span className="text-[11px] text-foreground-muted">Produk aktif tapi supplier kosong</span>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs text-foreground-muted mb-2">
              <span>Saldo Akun VIP Reseller</span>
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">
              {metrics?.vipBalance !== null && metrics?.vipBalance !== undefined
                ? `Rp ${metrics.vipBalance.toLocaleString('id-ID')}`
                : 'Terhubung'}
            </div>
            <span className="text-[11px] text-foreground-muted">Status API: Live Whitelisted</span>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 border-b border-border pb-3 mb-6 text-xs font-medium overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface text-foreground-muted hover:text-foreground hover:bg-surface-hover border border-border'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Katalog Produk ({metrics?.total ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface text-foreground-muted hover:text-foreground hover:bg-surface-hover border border-border'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Pesanan Pelanggan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface text-foreground-muted hover:text-foreground hover:bg-surface-hover border border-border'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Log Aktivitas & Gateway</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payment-settings')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'payment-settings'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface text-foreground-muted hover:text-foreground hover:bg-surface-hover border border-border'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Pengaturan Pembayaran</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('promos')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'promos'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface text-foreground-muted hover:text-foreground hover:bg-surface-hover border border-border'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Voucher & Promo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vip-explorer')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'vip-explorer'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface text-foreground-muted hover:text-foreground hover:bg-surface-hover border border-border'
            }`}
          >
            <DownloadCloud className="w-4 h-4" />
            <span>Jelajahi & Impor VIP Reseller</span>
          </button>
        </div>

        {/* TAB 1: MANAGED PRODUCTS */}
        {activeTab === 'products' && (
          <div className="space-y-6">
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

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs bg-surface-raised border border-border rounded-md px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  title="Filter Kategori Produk"
                >
                  <option value="all">Semua Kategori ({allProducts.length})</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.count})
                    </option>
                  ))}
                </select>

                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Cari produk terkelola..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-xs bg-surface-raised border-border"
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
              <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-subtle">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[1000px]">
                    <thead className="bg-surface-raised border-b border-border text-foreground-muted uppercase tracking-wider text-[11px] whitespace-nowrap">
                      <tr>
                        <th className="py-3 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = isSomeSelected;
                            }}
                            onChange={handleToggleSelectAll}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer align-middle"
                            title={isAllSelected ? 'Batalkan pilihan semua' : 'Pilih semua produk terfilter'}
                          />
                        </th>
                        <th className="py-3 px-4 min-w-[220px]">Produk</th>
                        <th className="py-3 px-4 whitespace-nowrap">Kategori</th>
                        <th className="py-3 px-4 whitespace-nowrap">Harga Modal (VIP)</th>
                        <th className="py-3 px-4 whitespace-nowrap">Harga Jual (Asterra)</th>
                        <th className="py-3 px-4 whitespace-nowrap">Margin Laba</th>
                        <th className="py-3 px-4 whitespace-nowrap">Stok Supplier</th>
                        <th className="py-3 px-4 whitespace-nowrap">Visibilitas Toko</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {products.map((p) => {
                        const isLiveWarning =
                          p.status === 'active' &&
                          p.provider === 'vip-reseller' &&
                          p.providerStatus === 'empty';
                        const isSelected = selectedIdSet.has(p.id);

                        return (
                          <tr
                            key={p.id}
                            className={`hover:bg-surface-hover/50 transition-colors ${
                              isSelected ? 'bg-primary/10' : ''
                            } ${isLiveWarning ? 'bg-status-warning/5' : ''}`}
                          >
                            <td className="py-3.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectOne(p.id)}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer align-middle"
                              />
                            </td>
                            <td className="py-3.5 px-4 min-w-[220px]">
                              <div className="flex items-center gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-10 h-10 rounded-lg object-cover bg-surface-raised border border-border shrink-0"
                                />
                                <div>
                                  <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                                    <span>{p.name}</span>
                                    {p.popular && (
                                      <Badge className="text-[10px] py-0 px-1.5 bg-primary text-white">
                                        Populer
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-foreground-muted flex items-center gap-2 mt-0.5">
                                    <span>ID: {p.id}</span>
                                    {p.provider === 'vip-reseller' && (
                                      <span className="text-primary font-mono">
                                        • VIP: {p.providerCode}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-medium text-foreground whitespace-nowrap">
                              {p.category.name}
                            </td>

                            <td className="py-3.5 px-4 font-mono text-foreground-muted whitespace-nowrap">
                              {p.providerPrice ? `Rp ${p.providerPrice.toLocaleString('id-ID')}` : 'Internal'}
                            </td>

                            <td className="py-3.5 px-4 font-mono font-bold text-foreground whitespace-nowrap">
                              Rp {p.price.toLocaleString('id-ID')}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
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
                                    <div className="inline-flex items-center gap-1.5 text-status-success font-semibold whitespace-nowrap font-mono">
                                      <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                                      <span>+Rp {margin.toLocaleString('id-ID')}</span>
                                      <span className="text-[11px] text-status-success/80 font-normal">
                                        ({percentage}%)
                                      </span>
                                    </div>
                                  );
                                }
                                if (margin !== undefined && margin < 0) {
                                  return (
                                    <div className="inline-flex items-center gap-1.5 text-status-error font-semibold whitespace-nowrap font-mono">
                                      <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                                      <span>-Rp {Math.abs(margin).toLocaleString('id-ID')}</span>
                                      <span className="text-[11px] text-status-error/80 font-normal">
                                        ({percentage}%)
                                      </span>
                                    </div>
                                  );
                                }
                                if (margin === 0) {
                                  return (
                                    <div className="inline-flex items-center gap-1 text-foreground-muted font-medium whitespace-nowrap font-mono text-[11px]">
                                      <span>Rp 0</span>
                                      <span>(0%)</span>
                                    </div>
                                  );
                                }
                                return <span className="text-foreground-muted">-</span>;
                              })()}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {p.provider === 'vip-reseller' ? (
                                p.providerStatus === 'available' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-status-success/15 text-status-success">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Tersedia ({p.stock ?? 100})</span>
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-status-warning/15 text-status-warning"
                                    title="Stok supplier kosong!"
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Kosong</span>
                                  </span>
                                )
                              ) : (
                                (p.stock !== undefined && p.stock <= 0) ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-status-warning/15 text-status-warning">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Kosong (0)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-status-success/15 text-status-success">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Tersedia ({p.stock ?? 100})</span>
                                  </span>
                                )
                              )}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => toggleMutation.mutate(p.id)}
                                disabled={toggleMutation.isPending}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors flex items-center gap-1.5 ${
                                  p.status === 'active'
                                    ? 'bg-status-success/15 text-status-success hover:bg-status-success/25'
                                    : 'bg-surface-raised border border-border text-foreground-muted hover:text-foreground'
                                }`}
                                title="Klik untuk beralih antara Muncul di Toko / Diarsipkan"
                              >
                                {p.status === 'active' ? (
                                  <>
                                    <Eye className="w-3 h-3" />
                                    <span>Aktif (Tampil)</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3 h-3" />
                                    <span>Diarsipkan</span>
                                  </>
                                )}
                              </button>
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenEdit(p)}
                                  className="h-8 px-2.5 text-xs border-border"
                                  title="Edit detail & harga jual"
                                >
                                  <Edit className="w-3.5 h-3.5 text-primary" />
                                  <span className="hidden sm:inline ml-1">Edit</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setDeletingProductId(p.id);
                                    setDeletingProductName(p.name);
                                  }}
                                  className="h-8 px-2.5 text-xs border-border hover:border-status-error/50 hover:bg-status-error/10 text-status-error"
                                  title="Hapus produk permanen"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline ml-1">Hapus</span>
                                </Button>
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
            )}
          </div>
        )}

        {/* TAB 2: USER ORDERS MANAGEMENT */}
        {activeTab === 'orders' && <AdminOrdersTab />}

        {/* TAB 3: ACTIVITY & AUDIT LOGS */}
        {activeTab === 'logs' && <AdminLogsTab />}

        {/* TAB 4: PAYMENT MODE SWITCHER & SETTINGS */}
        {activeTab === 'payment-settings' && (
          <AdminPaymentSettingsTab onNotify={showNotification} />
        )}

        {/* TAB 5: PROMO & VOUCHER CODE MANAGEMENT */}
        {activeTab === 'promos' && (
          <AdminPromosTab onNotify={showNotification} />
        )}

        {/* TAB 6: VIP RESELLER EXPLORER */}
        {activeTab === 'vip-explorer' && (
          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Jelajahi Layanan Gateway VIP Reseller (Upstream)
                  </h3>
                  <p className="text-xs text-foreground-muted">
                    Pilih produk dari 1.841 layanan supplier untuk diimpor ke katalog Asterra Store dengan harga retail kustom Anda.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30 w-fit">
                  Total Supplier: {allVipServices.length > 0 ? allVipServices.length : (vipData?.total ?? 0)} Layanan
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

                <div className="flex items-center gap-2 bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-foreground-muted">
                  <Filter className="w-3.5 h-3.5 text-primary" />
                  <span>Kategori:</span>
                  <select
                    value={vipType}
                    onChange={(e) => setVipType(e.target.value)}
                    className="bg-transparent text-foreground font-medium text-xs focus:outline-none cursor-pointer w-full"
                  >
                    <option value="all">Semua Tipe Layanan</option>
                    {vipData?.availableTypes.map((t) => (
                      <option key={t} value={t} className="bg-surface text-foreground">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-foreground-muted">
                  <span>Status Ketersediaan:</span>
                  <select
                    value={vipStatus}
                    onChange={(e) => setVipStatus(e.target.value)}
                    className="bg-transparent text-foreground font-medium text-xs focus:outline-none cursor-pointer w-full"
                  >
                    <option value="all">Semua Status</option>
                    <option value="available">Tersedia (Ready)</option>
                    <option value="empty">Kosong (Empty)</option>
                  </select>
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
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <Check className="w-3 h-3 text-status-success" />
                            <span>Sudah Diimpor</span>
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleOpenImport(service)}
                            className="text-xs gap-1.5"
                          >
                            <DownloadCloud className="w-3.5 h-3.5" />
                            <span>Impor Produk</span>
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
        )}
      </main>

      {/* MODAL 1: EDIT / CREATE MANAGED PRODUCT */}
      {(editingProduct || isCreateModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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

              <ImageUploadDropzone
                value={formImageUrl}
                onChange={setFormImageUrl}
                folder="products"
                label="Banner / Gambar Produk"
                description="Tarik & lepas gambar banner produk ke sini, atau klik untuk memilih file."
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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
          <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
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
          <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
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
      <footer className="mt-auto border-t border-border py-4 px-4 sm:px-8 bg-surface-raised text-center text-xs text-foreground-muted">
        <p>© 2026 Asterra Store — Internal Management Console</p>
      </footer>
    </div>
  );
}
