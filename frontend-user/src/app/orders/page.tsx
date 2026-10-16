'use client';

import { useState, useMemo, Suspense } from 'react';
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
} from '@fortawesome/free-solid-svg-icons';
import {
  useDynamicOrderActivities,
  formatRelativeTime,
  parseSafeDate,
  PublicOrder,
} from '@/lib/hooks/use-dynamic-orders';
import { useCatalogProducts } from '@/lib/hooks/use-catalog-products';
import { ProductCard } from '@/components/products/product-card';

const STATUS_FILTERS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'completed', label: 'Sukses' },
  { value: 'processing', label: 'Processing' },
  { value: 'pending', label: 'Menunggu Pembayaran' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

function getStatusBadge(
  status: PublicOrder['order_status'],
  isDynamic?: boolean,
  remainingSeconds?: number
) {
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
          {remainingSeconds !== undefined && remainingSeconds > 0 && (
            <span className="text-[10px] opacity-75 font-mono">
              ({Math.ceil(remainingSeconds / 60)}m)
            </span>
          )}
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

  // Fetch Public / Global Orders Data from all customers with deduplication and caching
  const { data, isLoading, isFetching, error, refetch, isRefetching } = useQuery<{
    success: boolean;
    data: PublicOrder[];
    total: number;
  }>({
    queryKey: ['global-orders'],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('public', 'true');
      const res = await fetch('/api/v1/orders?' + params.toString());
      if (!res.ok) throw new Error('Gagal mengambil data pesanan publik');
      return res.json();
    },
    staleTime: 10000, // 10s fresh cache prevents redundant refetches on tab focus
    placeholderData: (previousData) => previousData, // Seamless UI during filter tab transitions
    refetchInterval: 30000, // Background sync every 30s
  });

  const rawOrders = useMemo(() => {
    return data?.data || [];
  }, [data]);

  // Hook Aktivitas Dinamis Frontend dengan jadwal bervariasi dan tumpang tindih
  const { processedOrders, now } = useDynamicOrderActivities(rawOrders);

  // Fetch Catalog Products untuk rekomendasi jika antrean transaksi kosong
  const { data: catalogResponse } = useCatalogProducts();
  const catalogProducts = useMemo(() => {
    return catalogResponse?.data || [];
  }, [catalogResponse?.data]);

  const filteredOrders = useMemo(() => {
    let list = processedOrders;
    if (selectedStatus !== 'all') {
      list = list.filter((order) => order.effectiveStatus === selectedStatus);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((order) => {
      const idMatch =
        (order.id || '').toLowerCase().includes(q) ||
        (order.raw_id || '').toLowerCase().includes(q);
      const productMatch =
        (order.product_name || '').toLowerCase().includes(q) ||
        (order.items_summary || '').toLowerCase().includes(q);
      const customerMatch = (order.customer_display || '').toLowerCase().includes(q);
      return idMatch || productMatch || customerMatch;
    });
  }, [processedOrders, selectedStatus, searchQuery]);

  // Initial loading state (no cached data yet)
  const isInitialLoading = isLoading && !data;

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
                    onClick={() => setSelectedStatus(filter.value)}
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
                onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Empty State when no transactions exist at all */}
        {!isInitialLoading && !error && processedOrders.length === 0 && (
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
        {!isInitialLoading && !error && processedOrders.length > 0 && filteredOrders.length === 0 && (
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
              }}
            >
              Reset Filter & Pencarian
            </Button>
          </div>
        )}

        {/* Global Orders List */}
        {!isInitialLoading && !error && filteredOrders.length > 0 && (
          <div className={`space-y-3 transition-opacity duration-150 ${isFetching ? 'opacity-85' : 'opacity-100'}`}>
            {filteredOrders.map((order) => {
              const displayDate = order.effectiveDate || order.order_date;
              return (
                <div
                  key={order.id + displayDate}
                  data-gsap="order-card"
                  className="bg-surface border border-border rounded-xl p-4 sm:p-5 transition-all duration-150 hover:border-primary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center text-primary shrink-0 mt-0.5">
                      <FontAwesomeIcon icon={faBox} className="w-4 h-4" />
                    </div>
                    <div data-gsap="order-info" className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-foreground">
                          {order.id}
                        </span>
                        <span className="text-foreground-muted text-xs">—</span>
                        <span className="text-xs text-foreground font-medium inline-flex items-center gap-1">
                          <FontAwesomeIcon icon={faUserCheck} className="w-3 h-3 text-foreground-muted" />
                          <span>{order.customer_display}</span>
                        </span>
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
                          {parseSafeDate(displayDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          {parseSafeDate(displayDate).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          WIB
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                    {order.effectiveStatus === 'processing' ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-info animate-ping" />
                        <span>Estimasi 3-8 Menit</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
                        <FontAwesomeIcon icon={faShieldHalved} className="w-3 h-3 text-status-success" />
                        <span>Garansi Resmi</span>
                      </div>
                    )}
                    {getStatusBadge(
                      order.effectiveStatus,
                      order.isDynamicActivity,
                      order.remainingProcessingSeconds
                    )}
                  </div>
                </div>
              );
            })}
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
