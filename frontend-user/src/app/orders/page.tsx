'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBox,
  faClock,
  faCircleCheck,
  faCircleExclamation,
  faRotateLeft,
  faArrowRight,
  faMagnifyingGlass,
  faShieldHalved,
  faReceipt,
  faUserCheck,
  faBolt,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import {
  PublicOrder,
  formatRelativeTime,
  parseSafeDate,
  clearLegacySyntheticTimelineStorage,
} from '@/lib/hooks/use-dynamic-orders';
import { maskCustomerName } from '@/lib/utils/masking';
import { useCatalogProducts } from '@/lib/hooks/use-catalog-products';
import { ProductCard } from '@/components/products/product-card';
import { ProductBrandIcon } from '@/components/ui/product-brand-icon';

const STATUS_FILTERS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'completed', label: 'Sukses' },
  { value: 'processing', label: 'Processing' },
  { value: 'pending', label: 'Menunggu Pembayaran' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

function getStatusBadge(status: PublicOrder['order_status']) {
  switch (status) {
    case 'completed':
      return (
        <span
          data-gsap="order-status"
          className="text-[11px] px-2.5 py-0.5 rounded-full bg-status-success/15 text-status-success font-medium inline-flex items-center gap-1.5 transition-all duration-300"
        >
          <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3 text-status-success" />
          <span>Sukses</span>
        </span>
      );
    case 'processing':
      return (
        <span
          data-gsap="order-status"
          className="text-[11px] px-2.5 py-0.5 rounded-full bg-status-info/15 text-status-info font-medium inline-flex items-center gap-1.5 animate-pulse"
        >
          <FontAwesomeIcon
            icon={faClock}
            className="w-3 h-3 animate-spin text-status-info"
            style={{ animationDuration: '3s' }}
          />
          <span>Processing</span>
        </span>
      );
    case 'pending':
      return (
        <span
          data-gsap="order-status"
          className="text-[11px] px-2.5 py-0.5 rounded-full bg-status-warning/15 text-status-warning font-medium inline-flex items-center gap-1"
        >
          <FontAwesomeIcon icon={faCircleExclamation} className="w-3 h-3" />
          <span>Menunggu Pembayaran</span>
        </span>
      );
    case 'cancelled':
      return (
        <span
          data-gsap="order-status"
          className="text-[11px] px-2.5 py-0.5 rounded-full bg-status-error/15 text-status-error font-medium inline-flex items-center gap-1"
        >
          <FontAwesomeIcon icon={faCircleExclamation} className="w-3 h-3" />
          <span>Dibatalkan</span>
        </span>
      );
    default:
      return (
        <span
          data-gsap="order-status"
          className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-raised text-foreground-muted font-medium"
        >
          {status}
        </span>
      );
  }
}

// Realistic Order Cards Skeleton matching actual UI card structure
function GlobalOrdersSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Memuat daftar pesanan">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-surface border border-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse"
        >
          <div className="flex items-start gap-3.5 flex-1">
            <div className="w-10 h-10 rounded-xl bg-surface-raised shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-24 h-4 bg-surface-raised rounded" />
                <div className="w-1 h-3 bg-surface-raised rounded" />
                <div className="w-28 h-4 bg-surface-raised rounded" />
              </div>
              <div className="w-48 sm:w-64 h-4 bg-surface-raised rounded" />
              <div className="flex items-center gap-2">
                <div className="w-20 h-3 bg-surface-raised rounded" />
                <div className="w-1 h-2 bg-surface-raised rounded" />
                <div className="w-16 h-3 bg-surface-raised rounded" />
                <div className="w-1 h-2 bg-surface-raised rounded" />
                <div className="w-24 h-3 bg-surface-raised rounded" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
            <div className="w-20 h-4 bg-surface-raised rounded" />
            <div className="w-24 h-6 bg-surface-raised rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Content Skeleton used for instant Suspense fallback (skeleton confined to content area)
function GlobalOrdersPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full animate-in fade-in duration-150">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center justify-between gap-3 mb-6 animate-pulse">
        <div className="w-32 h-4 bg-surface-raised rounded" />
        <div className="w-28 h-8 bg-surface-raised rounded-lg" />
      </div>

      {/* Page Header Skeleton */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
        <div className="space-y-2">
          <div className="w-40 h-7 bg-surface-raised rounded-lg" />
          <div className="w-64 h-3.5 bg-surface-raised rounded" />
        </div>
        <div className="w-36 h-8 bg-surface-raised rounded-xl" />
      </div>

      {/* Filters and Search Bar Skeleton */}
      <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 mb-6 space-y-4 animate-pulse">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="w-24 h-7 rounded-full bg-surface-raised shrink-0" />
            ))}
          </div>
          <div className="w-full sm:w-72 h-8 rounded-lg bg-surface-raised" />
        </div>
      </div>

      {/* Order Cards Skeleton */}
      <GlobalOrdersSkeleton />
    </div>
  );
}

function GlobalOrdersContent() {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [now, setNow] = useState<number>(() => Date.now());
  const itemsPerPage = 20;

  // Clean legacy simulation storage on mount
  useEffect(() => {
    clearLegacySyntheticTimelineStorage();
  }, []);

  // Update relative time reference & dynamic status transitions every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Public Orders from single canonical backend endpoint
  const { data, isLoading, isFetching, error, refetch, isRefetching } = useQuery<{
    success: boolean;
    data: PublicOrder[];
    total: number;
    pagination?: {
      total_items: number;
      current_page: number;
      total_pages: number;
      items_per_page: number;
      };
  }>({
    queryKey: ['global-orders', 'public-all'],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('public', 'true');
      params.append('page', '1');
      params.append('limit', '100');
      const res = await fetch('/api/v1/orders?' + params.toString());
      if (!res.ok) throw new Error('Gagal mengambil data pesanan publik');
      return res.json();
    },
    staleTime: 5000, // 5s fresh cache
    placeholderData: (previousData) => previousData, // Seamless UI during pagination and filtering
    refetchInterval: 15000, // Background sync every 15s keeps list updated across all browsers
  });

  // Data pesanan publik langsung dari backend (transaksi riil + isolated dummy order terverifikasi)
  const allOrders = useMemo<PublicOrder[]>(() => {
    const rawList = data?.data || [];
    const normalizedList: PublicOrder[] = rawList.map((o) => {
      const isDum = Boolean(
        o.is_dummy ||
        o.isDummy ||
        o.source === 'simulation' ||
        o.transaction_source === 'dummy'
      );
      return {
        ...o,
        is_dummy: isDum,
        isDummy: isDum,
        source: isDum ? 'simulation' : (o.source || 'direct'),
        transaction_source: isDum ? 'dummy' : (o.transaction_source || 'real'),
      };
    });
    return [...normalizedList].sort((a, b) => {
      const dateA = new Date(a.order_date || a.created_at || a.createdAt || '').getTime() || 0;
      const dateB = new Date(b.order_date || b.created_at || b.createdAt || '').getTime() || 0;
      return dateB - dateA;
    });
  }, [data?.data]);

  // Filter status dan pencarian
  const filteredOrders = useMemo<PublicOrder[]>(() => {
    let list = allOrders;
    if (selectedStatus !== 'all') {
      list = list.filter((o) => (o.order_status || o.status) === selectedStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((o) =>
        (o.id && o.id.toLowerCase().includes(q)) ||
        (o.product_name && o.product_name.toLowerCase().includes(q)) ||
        (o.customer_display && o.customer_display.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allOrders, selectedStatus, searchQuery]);

  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const orders = useMemo<PublicOrder[]>(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  // Fetch Catalog Products untuk rekomendasi jika antrean transaksi kosong
  const { data: catalogResponse, isLoading: isCatalogLoading } = useCatalogProducts();
  const catalogProducts = useMemo(() => {
    return catalogResponse?.data || [];
  }, [catalogResponse?.data]);

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Initial loading state (tunggu hingga data pesanan atau katalog awal tersedia)
  const isInitialLoading = (isLoading && !data) || (isCatalogLoading && !catalogResponse);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
        {/* Breadcrumb & Top Actions Bar */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div data-gsap="breadcrumb" className="flex items-center gap-2 text-xs text-foreground-muted">
            <Link href="/" className="hover:text-foreground transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Pesanan</span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/products">
              <Button size="sm" variant="outline" className="text-xs gap-1.5 border-border h-8">
                <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5 text-primary" />
                <span>Beli Lisensi Baru</span>
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => refetch()}
              className={`p-2 rounded-lg bg-surface-raised border border-border text-foreground-muted hover:text-foreground transition-colors cursor-pointer h-8 w-8 flex items-center justify-center ${
                isRefetching ? 'opacity-50' : ''
              }`}
              title="Perbarui Data"
            >
              <FontAwesomeIcon
                icon={faRotateLeft}
                className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-primary' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 data-gsap="orders-title" className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Daftar Pesanan
            </h1>
            <p data-gsap="orders-desc" className="text-xs text-foreground-muted mt-1">
              Daftar transaksi lisensi dan akun digital pelanggan Asterra Store.
            </p>
          </div>

          {/* Quick link to private orders (/order) */}
          <Link
            href="/order"
            data-gsap="orders-button"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border hover:border-primary/40 text-xs font-medium text-foreground transition-colors shrink-0 self-start sm:self-auto"
          >
            <FontAwesomeIcon icon={faReceipt} className="w-3.5 h-3.5 text-primary" />
            <span>Pesanan Saya</span>
            <FontAwesomeIcon icon={faArrowRight} className="w-2.5 h-2.5 text-foreground-muted" />
          </Link>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Status Filter Pills */}
            <div data-gsap="orders-tabs" className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {STATUS_FILTERS.map((filter) => {
                const isSelected = selectedStatus === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => handleStatusChange(filter.value)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 border cursor-pointer ${
                      isSelected
                        ? 'bg-navy-900 text-white border-navy-900 shadow-xs'
                        : 'bg-surface text-foreground-muted border-border hover:border-primary/40 hover:text-primary'
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative sm:w-72">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                type="text"
                placeholder="Cari ID pesanan / produk..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-raised border border-border text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isInitialLoading && <GlobalOrdersSkeleton />}

        {/* Error State */}
        {error && !isInitialLoading && (
          <div className="bg-surface border border-status-error/40 rounded-xl p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-foreground">Gagal memuat daftar pesanan publik</p>
            <p className="text-xs text-foreground-muted">Silakan coba beberapa saat lagi.</p>
            <Button size="sm" onClick={() => refetch()}>
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Empty State when no transactions exist at all in store */}
        {!isInitialLoading && !error && totalItems === 0 && selectedStatus === 'all' && !searchQuery.trim() && (
          <div className="space-y-8 my-8">
            <div className="bg-surface border border-border rounded-xl p-8 text-center space-y-3 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-xl bg-surface-raised border border-border flex items-center justify-center mx-auto text-primary">
                <FontAwesomeIcon icon={faBox} className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Belum Ada Transaksi Aktif</h3>
                <p className="text-xs text-foreground-muted">
                  Antrean transaksi saat ini sedang kosong. Silakan jelajahi lisensi digital resmi dan promo aktif di bawah ini.
                </p>
              </div>
              <Link href="/products">
                <Button size="sm" className="gap-2 mt-2">
                  <span>Mulai Belanja</span>
                  <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            {/* Rekomendasi Produk Pilihan & Promo Aktif */}
            {catalogProducts.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <FontAwesomeIcon icon={faBolt} className="w-4 h-4" />
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-foreground">Rekomendasi Produk & Promo Aktif</h2>
                      <p className="text-xs text-foreground-muted">Produk digital resmi terpopuler dengan garansi aktif.</p>
                    </div>
                  </div>
                  <Link href="/products" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                    <span>Lihat Semua</span>
                    <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {catalogProducts.slice(0, 4).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State when filters or search query return 0 results */}
        {!isInitialLoading && !error && totalItems === 0 && (selectedStatus !== 'all' || searchQuery.trim() !== '') && (
          <div className="bg-surface border border-border rounded-xl p-8 text-center space-y-3 max-w-md mx-auto my-8">
            <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center mx-auto text-foreground-muted">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Tidak Ada Pesanan Ditemukan</h3>
              <p className="text-xs text-foreground-muted">
                Tidak ada pesanan yang sesuai dengan filter status atau kata kunci pencarian Anda.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedStatus('all');
                setSearchQuery('');
                setCurrentPage(1);
              }}
            >
              Reset Filter & Pencarian
            </Button>
          </div>
        )}

        {/* Global Orders List */}
        {!isInitialLoading && !error && orders.length > 0 && (
          <div className="space-y-4">
            <div className={`space-y-3 transition-opacity duration-150 ${isFetching ? 'opacity-85' : 'opacity-100'}`}>
              {orders.map((order) => {
                const displayDate = order.order_date || order.created_at || order.createdAt || '';
                const dateObj = parseSafeDate(displayDate);

                // Format with explicit Asia/Jakarta (WIB) timezone for consistency across all visitors
                const dateFormatted = dateObj.toLocaleDateString('id-ID', {
                  timeZone: 'Asia/Jakarta',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const timeFormatted = dateObj.toLocaleTimeString('id-ID', {
                  timeZone: 'Asia/Jakarta',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={order.id}
                    data-gsap="order-card"
                    className="bg-surface border border-border rounded-xl p-4 sm:p-5 transition-all duration-150 hover:border-primary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <ProductBrandIcon name={order.product_name} className="w-10 h-10 rounded-full" />
                      <div data-gsap="order-info" className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-sm text-foreground">
                            {order.id}
                          </span>
                          <span className="text-foreground-muted text-xs">—</span>
                          <span className="text-xs text-foreground font-medium inline-flex items-center gap-1">
                            <FontAwesomeIcon icon={faUserCheck} className="w-3 h-3 text-foreground-muted" />
                            <span>{maskCustomerName(order.customer_display) || 'Pelanggan'}</span>
                          </span>
                          {(order.is_dummy || order.isDummy || order.source === 'simulation') && (
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full bg-surface-raised text-foreground-muted border border-border font-medium inline-flex items-center gap-1"
                              title="Pesanan simulasi aktivitas sistem"
                            >
                              Simulasi Sistem
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-foreground">
                          {order.product_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground-muted">
                          <span>{order.items_count} item lisensi</span>
                          <span>—</span>
                          <span>{formatRelativeTime(displayDate, now)}</span>
                          <span>—</span>
                          <span>
                            {dateFormatted} {timeFormatted} WIB
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                      {order.order_status === 'processing' ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
                          <span>{order.process_estimate || 'Estimasi 1-10 Menit'}</span>
                        </div>
                      ) : order.order_status === 'completed' ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
                          <FontAwesomeIcon icon={faShieldHalved} className="w-3 h-3 text-status-success" />
                          <span>{order.warranty_info || 'Garansi Resmi'}</span>
                        </div>
                      ) : order.order_status === 'pending' ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
                          <FontAwesomeIcon icon={faClock} className="w-3 h-3 text-status-warning" />
                          <span>Menunggu Transfer</span>
                        </div>
                      ) : null}
                      {getStatusBadge(order.order_status)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border mt-6">
                <p className="text-xs text-foreground-muted">
                  Menampilkan <span className="font-semibold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span>–
                  <span className="font-semibold text-foreground">{Math.min(currentPage * itemsPerPage, totalItems)}</span> dari{' '}
                  <span className="font-semibold text-foreground">{totalItems}</span> pesanan
                </p>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1 || isFetching}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className="h-8 px-3 text-xs gap-1 border-border"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" />
                    <span>Sebelumnya</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((pageNum) => {
                        return (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          Math.abs(pageNum - currentPage) <= 1
                        );
                      })
                      .map((pageNum, idx, arr) => {
                        const prevPage = arr[idx - 1];
                        const showEllipsis = prevPage && pageNum - prevPage > 1;

                        return (
                          <span key={pageNum} className="flex items-center">
                            {showEllipsis && (
                              <span className="px-2 text-xs text-foreground-muted">...</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-navy-900 text-white shadow-xs'
                                  : 'bg-surface text-foreground-muted hover:text-foreground hover:bg-surface-raised border border-border'
                              }`}
                            >
                              {pageNum}
                            </button>
                          </span>
                        );
                      })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages || isFetching}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    className="h-8 px-3 text-xs gap-1 border-border"
                  >
                    <span>Selanjutnya</span>
                    <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GlobalOrdersPage() {
  return (
    <Suspense fallback={<GlobalOrdersPageSkeleton />}>
      <GlobalOrdersContent />
    </Suspense>
  );
}
