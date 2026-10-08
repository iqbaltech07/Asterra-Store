'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/use-cart-store';
import { Order } from '@/lib/orders-data';
import { notificationSound } from '@/lib/utils/notification-sound';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBox,
  faClock,
  faCircleCheck,
  faCircleExclamation,
  faCopy,
  faCheck,
  faRotateLeft,
  faArrowRight,
  faPhone,
  faMagnifyingGlass,
  faCartShopping,
  faShieldHalved,
  faChevronDown,
  faChevronUp,
  faXmark,
  faCreditCard,
  faRightToBracket,
  faReceipt,
} from '@fortawesome/free-solid-svg-icons';
import { useSession } from '@/lib/auth-client';
import {
  CheckoutManualModal,
  ManualPaymentModalData,
} from '@/components/checkout/checkout-manual-modal';
import { PaymentConfigApi, OrdersApi } from '@/lib/api-client';
import { PublicPaymentConfig } from '@/lib/services/payment-config.service';

const STATUS_FILTERS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'pending', label: 'Menunggu Pembayaran' },
  { value: 'processing', label: 'Sedang Diproses' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

function OrderCountdownBadge({
  expiresAt,
  onExpired,
}: {
  expiresAt?: string;
  onExpired?: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();

    let hasNotified = false;

    const update = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft('Waktu Habis');
        setIsExpired(true);
        if (!hasNotified) {
          hasNotified = true;
          onExpired?.();
        }
        return;
      }
      const totalSec = Math.floor(diff / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      setTimeLeft(`${h}j ${m}m ${s}d`);
      setIsExpired(false);
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, onExpired]);

  if (!expiresAt || !timeLeft) return null;

  return (
    <span
      className={`text-[10px] font-mono px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
        isExpired
          ? 'bg-status-error/10 text-status-error border-status-error/30'
          : 'bg-status-warning/10 text-status-warning border-status-warning/30'
      }`}
      title="Batas Waktu Pembayaran 24 Jam"
    >
      <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
      <span>{timeLeft}</span>
    </span>
  );
}

// --- Order Pure Helper Functions ---
function isOrderExpired(order: Order): boolean {
  if (order.order_status === 'cancelled') return true;
  if (order.order_status === 'pending' && order.expires_at) {
    return new Date(order.expires_at).getTime() < Date.now();
  }
  return false;
}

function getStatusBadge(status: Order['order_status']) {
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

function getTimelineStep(order: Order): number {
  if (order.order_status === 'cancelled') {
    return 1;
  }
  if (order.order_status === 'completed') {
    return 4;
  }
  if (order.order_status === 'processing') {
    return 3;
  }
  if (
    order.paid_at ||
    order.payment?.payment_status === 'success' ||
    order.payment?.payment_status === 'settlement'
  ) {
    return 2;
  }
  return 1;
}

// Realistic Private Orders Skeleton matching exact order card layout
function PrivateOrdersSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat riwayat pesanan">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5 animate-pulse"
        >
          {/* Card Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-raised shrink-0" />
              <div className="space-y-1.5">
                <div className="w-28 h-4 bg-surface-raised rounded" />
                <div className="w-40 h-3 bg-surface-raised rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-6 rounded-full bg-surface-raised" />
              <div className="w-20 h-5 bg-surface-raised rounded" />
            </div>
          </div>

          {/* 4-Step Fulfillment Timeline Skeleton */}
          <div className="py-2 space-y-3">
            <div className="w-36 h-3 bg-surface-raised rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="p-2.5 rounded-lg bg-surface-raised h-10" />
              ))}
            </div>
          </div>

          {/* Items Row Skeleton */}
          <div className="space-y-2">
            <div className="bg-surface-raised rounded-lg p-3 h-16" />
          </div>

          {/* Actions Footer Skeleton */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
            <div className="w-28 h-4 bg-surface-raised rounded" />
            <div className="flex items-center gap-2">
              <div className="w-20 h-8 rounded-lg bg-surface-raised" />
              <div className="w-24 h-8 rounded-lg bg-surface-raised" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Content Skeleton used for instant Suspense fallback on /order (skeleton confined to content area)
function PrivateOrdersPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full animate-in fade-in duration-150">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center justify-between gap-3 mb-6 animate-pulse">
        <div className="w-36 h-4 bg-surface-raised rounded" />
        <div className="w-28 h-8 bg-surface-raised rounded-lg" />
      </div>

      {/* Email Lookup Card Skeleton */}
      <div className="bg-surface border border-primary/20 rounded-xl p-4 sm:p-5 max-w-xl mx-auto mb-8 animate-pulse">
        <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
          <div className="flex-1 h-9 rounded-lg bg-surface-raised" />
          <div className="w-28 h-9 rounded-lg bg-surface-raised shrink-0" />
        </div>
      </div>

      {/* Orders Skeleton */}
      <PrivateOrdersSkeleton />
    </div>
  );
}

function PrivateOrderContent() {
  const { data: session } = useSession();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Individual Order Scoping: Session Email or Guest Email from localStorage
  const [guestEmail, setGuestEmail] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('asterra_customer_email') || '';
    }
    return '';
  });
  const [emailInput, setEmailInput] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isSubmittingLookup, setIsSubmittingLookup] = useState(false);

  // Effective email to filter orders
  const activeEmail = session?.user?.email || guestEmail;

  // Manual payment modal states
  const [activeManualModal, setActiveManualModal] = useState<ManualPaymentModalData | null>(null);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { addItem } = useCartStore();

  // Load payment config with caching (infrequently changes during a session)
  const { data: paymentConfigData } = useQuery<PublicPaymentConfig | null>({
    queryKey: ['public-payment-config'],
    queryFn: async () => {
      const res = await PaymentConfigApi.getPublicConfig();
      return res.success && res.data ? res.data : null;
    },
    staleTime: 60000,
  });
  const paymentConfig = paymentConfigData || null;

  // PERSONAL / PRIVATE ORDERS QUERY
  const { data, isLoading, isFetching, error, refetch, isRefetching } = useQuery<{ success: boolean; data: Order[] }>({
    queryKey: ['private-orders', selectedStatus, activeEmail],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (activeEmail) params.append('email', activeEmail);
      const res = await fetch(`/api/v1/orders?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil riwayat pesanan');
      return res.json();
    },
    enabled: Boolean(activeEmail),
    staleTime: 10000,
    placeholderData: (previousData) => previousData,
  });

  // Reset lookup submitting flag once data or error arrives
  useEffect(() => {
    if (data || error) {
      setIsSubmittingLookup(false);
    }
  }, [data, error]);

  // SSE Real-Time Listener for User Orders
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const eventSource = new EventSource('/api/v1/events?role=user');

    eventSource.addEventListener('order:payment_verified', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        notificationSound.play('payment_verified');
        refetch();
        showNotification(`Pembayaran #${payload.order_id} terverifikasi! Pesanan sedang diproses.`);
      } catch (err) {
        console.error('SSE user order:payment_verified error', err);
      }
    });

    eventSource.addEventListener('order:status_changed', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        notificationSound.play('status_updated');
        refetch();
        showNotification(`Status pesanan #${payload.order_id} diperbarui: ${payload.new_status}`);
      } catch (err) {
        console.error('SSE user order:status_changed error', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [refetch]);

  const rawOrders = data?.data || [];

  const orders = [...rawOrders].sort((a, b) => {
    return new Date(b.order_date).getTime() - new Date(a.order_date).getTime();
  });

  const filteredOrders = orders.filter((order) => {
    const isExpired = isOrderExpired(order);
    const effectiveStatus =
      order.order_status === 'pending' && isExpired ? 'cancelled' : order.order_status;

    if (selectedStatus !== 'all' && effectiveStatus !== selectedStatus) {
      return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(q) ||
      order.items.some((item) => item.product_name.toLowerCase().includes(q))
    );
  });

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const handleCopyOrderInfo = (order: Order) => {
    if (typeof window !== 'undefined') {
      const summaryText = `[Asterra Store] Bukti Pesanan:\nNomor: ${order.id}\nTanggal: ${new Date(
        order.order_date
      ).toLocaleDateString('id-ID')}\nTotal: Rp ${order.total_amount.toLocaleString(
        'id-ID'
      )}\nStatus: ${order.order_status.toUpperCase()}\nItem: ${order.items
        .map((i) => `${i.product_name} (${i.quantity}x)`)
        .join(', ')}`;
      navigator.clipboard?.writeText(summaryText);
      showNotification(`Informasi pesanan ${order.id} berhasil disalin!`);
    }
  };

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      addItem({
        id: item.product_id,
        name: item.product_name,
        category: 'Digital Service',
        priceFormatted: `Rp ${item.unit_price.toLocaleString('id-ID')}`,
        priceNumeric: item.unit_price,
      });
    });
    showNotification(`Item dari pesanan ${order.id} telah ditambahkan ke keranjang.`);
  };

  const handleModalCopy = (text: string, key: string, label: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(text);
      setCopiedKey(key);
      showNotification(`${label} berhasil disalin!`);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const getMethodName = (methodId: string) => {
    if (methodId === 'manual_bca') return paymentConfig?.bank?.name || 'Bank Central Asia (BCA)';
    if (methodId === 'manual_qris') return 'QRIS Statis Toko';
    if (methodId === 'manual_dana') return 'Transfer E-Wallet DANA';
    if (methodId === 'qris') return 'QRIS (Semua Pembayaran)';
    if (methodId === 'bca_va') return 'BCA Virtual Account';
    if (methodId === 'bni_va') return 'BNI Virtual Account';
    if (methodId === 'dana') return 'DANA E-Wallet';
    return 'Metode Pembayaran';
  };

  const handlePayOrder = async (order: Order) => {
    if (isOrderExpired(order)) {
      showNotification('Batas waktu pembayaran 24 jam telah habis. Pesanan dibatalkan.');
      fetch(`/api/v1/orders/${order.id}/cancel`, { method: 'POST' }).finally(() => refetch());
      return;
    }

    const isManual =
      order.payment_mode === 'manual' ||
      order.payment?.payment_method?.startsWith('manual_');

    if (isManual) {
      setActiveManualModal({
        orderId: order.id,
        amount: order.total_amount,
        rawAmount: order.raw_amount,
        uniqueCode: order.unique_code,
        method: order.payment?.payment_method || 'manual_bca',
        expiresAt: order.expires_at,
      });
      setSelectedOrderForModal(order);
    } else {
      try {
        showNotification('Memuat tagihan pembayaran Tripay...');
        const res = await OrdersApi.pay(order.id, order.payment?.payment_method || 'qris');
        const checkoutUrl = res.payment?.checkout_url || res.payment?.redirect_url;
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          showNotification('Gagal memuat link pembayaran Tripay.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memproses pembayaran.';
        showNotification(msg);
      }
    }
  };

  // Immediate loading state: actively fetching private orders for active email
  const isInitialLoading = Boolean(activeEmail) && (isSubmittingLookup || (isLoading && !data));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-raised border border-primary/40 text-foreground px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs font-medium">{notification}</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
        {/* Breadcrumb & Top Actions Bar */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <Link href="/" className="hover:text-foreground transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Pesanan Saya</span>
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
              onClick={() => {
                refetch();
                showNotification('Data riwayat pesanan berhasil diperbarui.');
              }}
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

        {/* Email Entry & Lookup Form when unauthenticated or changing email */}
        {(!activeEmail || isChangingEmail) && (
          <div data-gsap="hero-card" className="bg-surface border border-primary/30 rounded-xl p-4 sm:p-5 max-w-xl mx-auto mb-8 shadow-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = emailInput.trim();
                if (trimmed) {
                  setIsSubmittingLookup(true);
                  setGuestEmail(trimmed);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('asterra_customer_email', trimmed);
                  }
                  setIsChangingEmail(false);
                  showNotification(`Memuat riwayat pesanan untuk ${trimmed}`);
                }
              }}
              className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg bg-surface-raised border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary"
              />
              <Button type="submit" size="sm" className="text-xs shrink-0" disabled={isSubmittingLookup}>
                {isSubmittingLookup ? 'Memuat...' : 'Lihat Pesanan'}
              </Button>
            </form>
          </div>
        )}

        {/* Active Account / Tracking Banner */}
        {activeEmail && !isChangingEmail && (
          <div className="bg-surface border border-border rounded-xl px-4 py-3 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <FontAwesomeIcon icon={faReceipt} className="w-3.5 h-3.5 text-primary shrink-0" />
              <div className="text-foreground">
                <span className="text-foreground-muted">Menampilkan riwayat pesanan untuk:{' '}</span>
                <strong className="font-semibold text-primary">{activeEmail}</strong>
                {session?.user?.email && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    Akun Terverifikasi
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
              {!session?.user?.email && (
                <button
                  type="button"
                  onClick={() => {
                    setEmailInput(guestEmail);
                    setIsChangingEmail(true);
                  }}
                  className="text-primary hover:underline text-[11px] font-medium cursor-pointer"
                >
                  Ganti Email Pelacakan
                </button>
              )}
              {!session?.user && (
                <Link
                  href="/login"
                  className="text-foreground-muted hover:text-foreground text-[11px] inline-flex items-center gap-1"
                >
                  <FontAwesomeIcon icon={faRightToBracket} className="w-3 h-3" />
                  <span>Masuk</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Status Pills */}
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

            {/* Search within orders */}
            <div className="relative sm:w-72">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari ID pesanan / nama produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-raised border border-border text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isInitialLoading && <PrivateOrdersSkeleton />}

        {/* Error State */}
        {error && !isInitialLoading && (
          <div className="bg-surface border border-status-error/40 rounded-xl p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-foreground">Gagal memuat riwayat pesanan</p>
            <p className="text-xs text-foreground-muted">Silakan coba beberapa saat lagi.</p>
            <Button size="sm" onClick={() => refetch()}>
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isInitialLoading && !error && filteredOrders.length === 0 && (
          <div className="bg-surface border border-border rounded-xl p-12 text-center space-y-4 max-w-md mx-auto my-12">
            <div className="w-12 h-12 rounded-xl bg-surface-raised border border-border flex items-center justify-center mx-auto text-foreground-muted">
              <FontAwesomeIcon icon={faBox} className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">Belum Ada Riwayat Pesanan</h3>
              <p className="text-xs text-foreground-muted">
                {selectedStatus !== 'all' || searchQuery
                  ? 'Tidak ada transaksi yang cocok dengan filter atau kata kunci saat ini.'
                  : activeEmail
                  ? `Tidak ada transaksi pesanan yang ditemukan untuk email ${activeEmail}.`
                  : 'Silakan masukkan email pesanan Anda di atas untuk melihat riwayat transaksi.'}
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

        {/* Orders Listing */}
        {!isInitialLoading && !error && filteredOrders.length > 0 && (
          <div className={`space-y-6 transition-opacity duration-150 ${isFetching ? 'opacity-85' : 'opacity-100'}`}>
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const isExpired = isOrderExpired(order);
              const effectiveStatus: Order['order_status'] =
                order.order_status === 'pending' && isExpired ? 'cancelled' : order.order_status;
              const step = getTimelineStep({ ...order, order_status: effectiveStatus });
              const isCancelled = effectiveStatus === 'cancelled';

              return (
                <div
                  key={order.id}
                  className="bg-surface border border-border rounded-xl p-5 sm:p-6 transition-all duration-200 hover:border-primary/40 space-y-5"
                >
                  {/* Card Header: Order ID, Date, Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-surface-raised border border-border flex items-center justify-center text-primary shrink-0">
                        <FontAwesomeIcon icon={faBox} className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-foreground">
                            {order.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyOrderInfo(order)}
                            className="text-foreground-muted hover:text-foreground cursor-pointer"
                            title="Salin Data Pesanan"
                          >
                            <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[11px] text-foreground-muted">
                          Dipesan pada:{' '}
                          {new Date(order.order_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      {effectiveStatus === 'pending' && (
                        <OrderCountdownBadge
                          expiresAt={order.expires_at}
                          onExpired={() => {
                            fetch(`/api/v1/orders/${order.id}/cancel`, { method: 'POST' }).finally(() => refetch());
                          }}
                        />
                      )}
                      {getStatusBadge(effectiveStatus)}
                      <span className="text-sm font-bold text-foreground">
                        Rp {order.total_amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* 4-Step Interactive Fulfillment Timeline */}
                  <div className="py-2">
                    <span className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider block mb-3">
                      Proses Eksekusi Lisensi:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Step 1 */}
                      <div
                        className={`p-2.5 rounded-lg flex items-center gap-2.5 text-xs ${
                          step >= 1
                            ? 'bg-primary/10 text-primary'
                            : 'bg-surface-raised text-foreground-muted'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            step >= 1 ? 'bg-primary text-white' : 'bg-surface-hover'
                          }`}
                        >
                          1
                        </div>
                        <span className="font-medium">Pesanan Masuk</span>
                      </div>

                      {/* Step 2 */}
                      <div
                        className={`p-2.5 rounded-lg flex items-center gap-2.5 text-xs ${
                          step >= 2
                            ? 'bg-primary/10 text-primary'
                            : 'bg-surface-raised text-foreground-muted'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            step >= 2 ? 'bg-primary text-white' : 'bg-surface-hover'
                          }`}
                        >
                          2
                        </div>
                        <span className="font-medium">Pembayaran Terverifikasi</span>
                      </div>

                      {/* Step 3 */}
                      <div
                        className={`p-2.5 rounded-lg flex items-center gap-2.5 text-xs ${
                          step >= 3
                            ? 'bg-primary/10 text-primary'
                            : 'bg-surface-raised text-foreground-muted'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            step >= 3 ? 'bg-primary text-white' : 'bg-surface-hover'
                          }`}
                        >
                          3
                        </div>
                        <span className="font-medium">Di Proses</span>
                      </div>

                      {/* Step 4 */}
                      <div
                        className={`p-2.5 rounded-lg flex items-center gap-2.5 text-xs ${
                          isCancelled
                            ? 'bg-status-error/15 text-status-error'
                            : step >= 4
                            ? 'bg-status-success/15 text-status-success'
                            : 'bg-surface-raised text-foreground-muted'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isCancelled
                              ? 'bg-status-error text-white'
                              : step >= 4
                              ? 'bg-status-success text-white'
                              : 'bg-surface-hover'
                          }`}
                        >
                          {isCancelled ? <FontAwesomeIcon icon={faXmark} className="w-3 h-3" /> : '4'}
                        </div>
                        <span className="font-medium">
                          {isCancelled ? 'Dibatalkan' : 'Selesai'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items List inside Order */}
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-surface-raised rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <h4 className="font-semibold text-foreground text-sm">
                            {item.product_name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-foreground-muted text-[11px]">
                            <span>Jumlah: {item.quantity} lisensi</span>
                            <span>—</span>
                            <span>
                              Target Email:{' '}
                              <strong className="text-foreground">
                                {item.purchased_details?.target_email || 'customer@asterra.store'}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="font-bold text-foreground block">
                            Rp {(item.unit_price * item.quantity).toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-foreground-muted">
                            @ Rp {item.unit_price.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Expandable Details Section */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-border space-y-3 text-xs animate-in fade-in duration-150">
                      <div className="bg-surface-raised rounded-lg p-3 space-y-1.5">
                        <span className="font-semibold text-foreground block">Rincian Pembayaran</span>
                        <div className="flex justify-between text-foreground-muted">
                          <span>Metode Pembayaran:</span>
                          <span className="text-foreground uppercase font-mono">
                            {order.payment?.payment_method || 'QRIS / Instant'}
                          </span>
                        </div>
                        {order.payment?.transaction_id && (
                          <div className="flex justify-between text-foreground-muted">
                            <span>ID Transaksi Tripay:</span>
                            <span className="text-foreground font-mono">
                              {order.payment.transaction_id}
                            </span>
                          </div>
                        )}
                        {order.customer_notes && (
                          <div className="flex justify-between text-foreground-muted">
                            <span>Catatan Pesanan:</span>
                            <span className="text-foreground italic">{order.customer_notes}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-surface-raised rounded-lg text-status-success">
                        <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 shrink-0" />
                        <span className="text-[11px]">
                          Lisensi ini dilindungi oleh Garansi Asterra Store 100% penggantian jika mengalami kendala akses.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="text-xs text-foreground-muted hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Tutup Rincian' : 'Lihat Rincian Lisensi'}</span>
                      {isExpanded ? <FontAwesomeIcon icon={faChevronUp} className="w-3.5 h-3.5" /> : <FontAwesomeIcon icon={faChevronDown} className="w-3.5 h-3.5" />}
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyOrderInfo(order)}
                        className="text-xs gap-1.5 border-border h-8 cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />
                        <span>Salin Bukti</span>
                      </Button>

                      {effectiveStatus === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handlePayOrder(order)}
                          className="text-xs gap-1.5 h-8 font-semibold bg-primary hover:bg-primary/90 text-white shadow-sm cursor-pointer"
                        >
                          <FontAwesomeIcon icon={faCreditCard} className="w-3.5 h-3.5" />
                          <span>Bayar</span>
                        </Button>
                      )}

                      {(effectiveStatus === 'completed' || effectiveStatus === 'cancelled') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReorder(order)}
                          className="text-xs gap-1.5 border-border h-8 font-medium cursor-pointer"
                        >
                          <FontAwesomeIcon icon={faCartShopping} className="w-3 h-3 text-primary" />
                          <span>Beli Lagi</span>
                        </Button>
                      )}

                      <a
                        href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                          `Halo CS Asterra Store, saya ingin menanyakan status pesanan ${order.id}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button size="sm" className="text-xs gap-1.5 h-8 cursor-pointer">
                          <FontAwesomeIcon icon={faPhone} className="w-3 h-3" />
                          <span>Hubungi CS</span>
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Payment Instructions Modal from Orders Page */}
      {activeManualModal && (
        <CheckoutManualModal
          data={activeManualModal}
          paymentConfig={paymentConfig}
          customerName={selectedOrderForModal?.customer_name || 'Pelanggan'}
          targetEmail={selectedOrderForModal?.customer_email || ''}
          onClose={() => {
            setActiveManualModal(null);
            setSelectedOrderForModal(null);
            refetch();
          }}
          onCopy={handleModalCopy}
          copiedKey={copiedKey}
          getMethodName={getMethodName}
        />
      )}
    </div>
  );
}

export default function PrivateOrderPage() {
  return (
    <Suspense fallback={<PrivateOrdersPageSkeleton />}>
      <PrivateOrderContent />
    </Suspense>
  );
}
