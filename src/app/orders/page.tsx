'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
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
  faCartShopping,
  faShieldHalved,
  faReceipt,
  faUserCheck,
} from '@fortawesome/free-solid-svg-icons';

interface PublicOrder {
  id: string;
  raw_id: string;
  product_name: string;
  items_summary: string;
  items_count: number;
  order_status: 'pending' | 'processing' | 'completed' | 'cancelled';
  order_date: string;
  customer_display: string;
}

const STATUS_FILTERS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'completed', label: 'Selesai' },
  { value: 'processing', label: 'Sedang Diproses' },
  { value: 'pending', label: 'Menunggu Pembayaran' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

function getStatusBadge(status: PublicOrder['order_status']) {
  switch (status) {
    case 'completed':
      return (
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-status-success/15 text-status-success font-medium inline-flex items-center gap-1">
          <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3" />
          <span>Selesai</span>
        </span>
      );
    case 'processing':
      return (
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-status-info/15 text-status-info font-medium inline-flex items-center gap-1">
          <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
          <span>Di Proses</span>
        </span>
      );
    case 'pending':
      return (
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-status-warning/15 text-status-warning font-medium inline-flex items-center gap-1">
          <FontAwesomeIcon icon={faCircleExclamation} className="w-3 h-3" />
          <span>Menunggu Pembayaran</span>
        </span>
      );
    case 'cancelled':
      return (
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-status-error/15 text-status-error font-medium inline-flex items-center gap-1">
          <FontAwesomeIcon icon={faCircleExclamation} className="w-3 h-3" />
          <span>Dibatalkan</span>
        </span>
      );
    default:
      return (
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-raised text-foreground-muted font-medium">
          {status}
        </span>
      );
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Baru saja';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
  return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
}

function GlobalOrdersContent() {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Public / Global Orders Data from all customers
  const { data, isLoading, error, refetch, isRefetching } = useQuery<{
    success: boolean;
    data: PublicOrder[];
    total: number;
  }>({
    queryKey: ['global-orders', selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('public', 'true');
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      const res = await fetch(`/api/v1/orders?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil data pesanan publik');
      return res.json();
    },
    refetchInterval: 30000, // Background sync every 30s
  });

  const orders = useMemo(() => {
    return data?.data || [];
  }, [data]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (order) =>
        order.id.toLowerCase().includes(q) ||
        order.product_name.toLowerCase().includes(q) ||
        order.customer_display.toLowerCase().includes(q) ||
        order.items_summary.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
        {/* Breadcrumb & Top Actions Bar */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <Link href="/" className="hover:text-foreground transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Pesanan</span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/products">
              <Button size="sm" variant="outline" className="text-xs gap-1.5 border-border h-8">
                <FontAwesomeIcon icon={faCartShopping} className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Beli Lisensi Baru</span>
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
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Daftar Pesanan
            </h1>
            <p className="text-xs text-foreground-muted mt-1">
              Daftar transaksi lisensi dan akun digital pelanggan Asterra Store.
            </p>
          </div>

          {/* Quick link to private orders (/order) */}
          <Link
            href="/order"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border hover:border-primary/40 text-xs font-medium text-foreground transition-colors shrink-0 self-start sm:self-auto"
          >
            <FontAwesomeIcon icon={faReceipt} className="w-3.5 h-3.5 text-primary" />
            <span>Cari Pesanan Saya</span>
            <FontAwesomeIcon icon={faArrowRight} className="w-2.5 h-2.5 text-foreground-muted" />
          </Link>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
        {isLoading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-surface border border-border rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="w-32 h-4 bg-surface-raised rounded" />
                  <div className="w-48 h-3 bg-surface-raised rounded" />
                </div>
                <div className="w-24 h-6 bg-surface-raised rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-surface border border-status-error/40 rounded-xl p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-foreground">Gagal memuat daftar pesanan publik</p>
            <p className="text-xs text-foreground-muted">Silakan coba beberapa saat lagi.</p>
            <Button size="sm" onClick={() => refetch()}>
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredOrders.length === 0 && (
          <div className="bg-surface border border-border rounded-xl p-12 text-center space-y-4 max-w-md mx-auto my-12">
            <div className="w-12 h-12 rounded-xl bg-surface-raised border border-border flex items-center justify-center mx-auto text-foreground-muted">
              <FontAwesomeIcon icon={faBox} className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">Tidak Ada Pesanan</h3>
              <p className="text-xs text-foreground-muted">
                {selectedStatus !== 'all' || searchQuery
                  ? 'Tidak ada pesanan yang sesuai dengan filter atau kata kunci saat ini.'
                  : 'Belum ada transaksi pesanan yang tercatat dalam sistem.'}
              </p>
            </div>
            {selectedStatus !== 'all' || searchQuery ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedStatus('all');
                  setSearchQuery('');
                }}
              >
                Reset Filter
              </Button>
            ) : (
              <Link href="/products">
                <Button size="sm" className="gap-2">
                  <span>Mulai Belanja</span>
                  <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Global Orders List */}
        {!isLoading && !error && filteredOrders.length > 0 && (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id + order.order_date}
                className="bg-surface border border-border rounded-xl p-4 sm:p-5 transition-all duration-150 hover:border-primary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <FontAwesomeIcon icon={faBox} className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
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
                      <span>{formatRelativeTime(order.order_date)}</span>
                      <span>—</span>
                      <span>
                        {new Date(order.order_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                  <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
                    <FontAwesomeIcon icon={faShieldHalved} className="w-3 h-3 text-status-success" />
                    <span>Garansi Resmi</span>
                  </div>
                  {getStatusBadge(order.order_status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}

export default function GlobalOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <GlobalOrdersContent />
    </Suspense>
  );
}
