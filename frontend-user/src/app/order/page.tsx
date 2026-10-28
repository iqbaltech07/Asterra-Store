'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Order } from '@/lib/orders-data';
import { notificationSound } from '@/lib/utils/notification-sound';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBox,
  faCopy,
  faCheck,
  faRotateLeft,
  faArrowRight,
  faPhone,
  faMagnifyingGlass,
  faShieldHalved,
  faChevronDown,
  faChevronUp,
  faCreditCard,
  faReceipt,
  faHeadset,
} from '@fortawesome/free-solid-svg-icons';
import { useSession } from '@/lib/auth-client';
import { useAuthStore } from '@/store/use-auth-store';
import {
  CheckoutManualModal,
  ManualPaymentModalData,
} from '@/components/checkout/checkout-manual-modal';
import { OrdersApi } from '@/lib/api-client';
import { usePaymentConfig } from '@/lib/hooks/use-payment-config';
import { ProductBrandIcon } from '@/components/ui/product-brand-icon';

import {
  STATUS_FILTERS,
  OrderCountdownBadge,
  isOrderExpired,
  getStatusBadge,
  getTimelineStep,
  formatFriendlyPaymentMethod,
} from '@/components/orders/order-status-helpers';
import {
  PrivateOrdersSkeleton,
  PrivateOrdersPageSkeleton,
} from '@/components/orders/order-skeletons';
import { OrderCredentialsCard } from '@/components/orders/order-credentials-card';

function cleanCustomerNotes(rawNotes?: string): string | null {
  if (!rawNotes) return null;
  const parts = rawNotes.split('|').map((p) => p.trim()).filter(Boolean);
  const cleanParts = parts.filter((p) => {
    const lower = p.toLowerCase();
    if (lower.startsWith('admin: status pesanan diubah')) return false;
    if (
      lower.startsWith('admin:') &&
      (lower.includes('processing') ||
        lower.includes('cancelled') ||
        lower.includes('completed') ||
        lower.includes('pending'))
    ) {
      return false;
    }
    return true;
  });
  const joined = cleanParts.join(' | ').trim();
  return joined.length > 0 ? joined : null;
}

function isSafeLicenseCredential(note?: string): boolean {
  if (!note) return false;
  const lower = note.toLowerCase();
  const errorPhrases = [
    'saldo anda tidak cukup',
    'saldo tidak cukup',
    'gagal otomatisasi',
    'gagal order',
    'insufficient balance',
    'gagal menghubungkan',
    'error dari provider',
    'api error',
    'gateway error',
  ];
  return !errorPhrases.some((phrase) => lower.includes(phrase));
}

function PrivateOrderContent() {
  const { data: session } = useSession();
  const { user: legacyUser } = useAuthStore();
  const searchParams = useSearchParams();
  const paramOrderId = searchParams.get('id') || searchParams.get('orderId');
  const paramEmail = searchParams.get('email');

  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Active tracked order ID (synced with URL & storage)
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const urlId = new URLSearchParams(window.location.search).get('id') || new URLSearchParams(window.location.search).get('orderId');
      if (urlId) return urlId.trim().toUpperCase();
      return localStorage.getItem('asterra_last_order_id') || null;
    }
    return null;
  });

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const urlId = new URLSearchParams(window.location.search).get('id') || new URLSearchParams(window.location.search).get('orderId');
      return urlId ? urlId.trim().toUpperCase() : null;
    }
    return null;
  });

  // Individual Order Scoping: Session Email, Legacy User Email, URL param, or localStorage
  const [guestIdentity, setGuestIdentity] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlEmail = new URLSearchParams(window.location.search).get('email');
      if (urlEmail) {
        localStorage.setItem('asterra_customer_email', urlEmail.trim());
        return urlEmail.trim();
      }
      const stored = localStorage.getItem('asterra_customer_email');
      if (stored) return stored.trim();
      try {
        const rawCust = localStorage.getItem('asterra_checkout_customer');
        if (rawCust) {
          const parsed = JSON.parse(rawCust);
          if (parsed.email) return String(parsed.email).trim();
          if (parsed.phone) return String(parsed.phone).trim();
        }
      } catch {}
    }
    return '';
  });

  const [emailInput, setEmailInput] = useState('');
  const [isSubmittingLookup, setIsSubmittingLookup] = useState(false);
  const [isManualSwitchOpen, setIsManualSwitchOpen] = useState(false);

  // Sync query parameters when navigating from checkout or direct tracking links
  useEffect(() => {
    if (paramEmail && paramEmail.trim() !== guestIdentity) {
      const cleanEmail = paramEmail.trim();
      setGuestIdentity(cleanEmail);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('asterra_customer_email', cleanEmail);
        } catch {}
      }
    }
    if (paramOrderId) {
      const cleanId = paramOrderId.trim().toUpperCase();
      if (cleanId !== trackedOrderId) {
        setTrackedOrderId(cleanId);
      }
      setExpandedOrderId(cleanId);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('asterra_last_order_id', cleanId);
        } catch {}
      }
    }
  }, [paramEmail, paramOrderId, guestIdentity, trackedOrderId]);

  // Effective user email or contact to filter orders
  const activeEmail = session?.user?.email || legacyUser?.email || (guestIdentity.includes('@') ? guestIdentity : '');
  const activeContact = activeEmail || guestIdentity;
  const effectiveOrderId = trackedOrderId || paramOrderId || (typeof window !== 'undefined' ? localStorage.getItem('asterra_last_order_id') : null);

  // Manual payment modal states
  const [activeManualModal, setActiveManualModal] = useState<ManualPaymentModalData | null>(null);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load payment config with shared query caching (infrequently changes during a session)
  const { config } = usePaymentConfig();
  const paymentConfig = config || null;

  // PERSONAL / PRIVATE ORDERS QUERY
  const { data, isLoading, isFetching, error, refetch, isRefetching } = useQuery<{ success: boolean; data: Order[] }>({
    queryKey: ['private-orders', selectedStatus, activeContact, effectiveOrderId],
    queryFn: async () => {
      const ordersMap = new Map<string, Order>();

      // 1. If effectiveOrderId is specified, fetch that exact order directly for 100% precision
      if (effectiveOrderId) {
        try {
          const res = await fetch(`/api/v1/orders/${encodeURIComponent(effectiveOrderId)}`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              ordersMap.set(json.data.id, json.data);
            }
          }
        } catch (e) {
          console.warn('[Orders] Direct order lookup note:', e);
        }
      }

      // 2. If activeContact (email or phone) is provided, fetch list of orders
      if (activeContact) {
        const params = new URLSearchParams();
        if (selectedStatus !== 'all') params.append('status', selectedStatus);
        if (activeContact.includes('@')) {
          params.append('email', activeContact);
        } else {
          params.append('search', activeContact);
        }

        try {
          const res = await fetch(`/api/v1/orders?${params.toString()}`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
              for (const order of json.data) {
                if (!ordersMap.has(order.id)) {
                  ordersMap.set(order.id, order);
                }
              }
            }
          } else if (ordersMap.size === 0) {
            throw new Error('Gagal mengambil riwayat pesanan');
          }
        } catch (e) {
          if (ordersMap.size === 0) {
            throw e;
          }
        }
      }

      // 3. Fallback: If neither email was provided nor direct lookup succeeded, search order by ID query
      if (ordersMap.size === 0 && effectiveOrderId) {
        const params = new URLSearchParams();
        if (selectedStatus !== 'all') params.append('status', selectedStatus);
        params.append('search', effectiveOrderId);
        const res = await fetch(`/api/v1/orders?${params.toString()}`);
        if (!res.ok) throw new Error('Gagal mengambil riwayat pesanan');
        return res.json();
      }

      return {
        success: true,
        data: Array.from(ordersMap.values()),
      };
    },
    enabled: Boolean(activeContact || effectiveOrderId),
    staleTime: 5000,
    refetchInterval: 12000, // Background polling fallback ensures orders stay synchronized even if SSE is buffered or proxy returns 502
    placeholderData: (previousData) => previousData,
  });

  // Auto-expand and notify if viewing a specific order from checkout redirect
  useEffect(() => {
    const targetId = paramOrderId || effectiveOrderId;
    if (targetId && data?.data && data.data.length > 0) {
      const target = data.data.find(
        (o) => (o.id || '').toUpperCase() === targetId.toUpperCase()
      );
      if (target) {
        setExpandedOrderId(target.id);
        const st = String(target.order_status || (target as unknown as { status?: string }).status || '').toLowerCase();
        if (['completed', 'processing', 'paid', 'settlement'].includes(st)) {
          showNotification(`Pesanan #${target.id} aktif. Lisensi & status sedang diproses!`);
        }
      }
    }
  }, [paramOrderId, effectiveOrderId, data]);

  // Track active user order IDs for strict client-side event filtering & reconcile offline status changes
  const userOrderIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const ids = new Set<string>();
    if (effectiveOrderId) ids.add(effectiveOrderId.trim().toUpperCase());
    if (data?.data && Array.isArray(data.data)) {
      data.data.forEach((o) => ids.add(String(o.id).trim().toUpperCase()));
      // Reconcile status transitions across browser reloads
      notificationSound.reconcileUserOrders(
        data.data.map((o) => ({
          id: o.id,
          status: o.order_status || (o as unknown as { status?: string }).status || 'pending',
        }))
      );
    }
    userOrderIdsRef.current = ids;
  }, [data?.data, effectiveOrderId]);

  // Reset lookup submitting flag once loading completes
  useEffect(() => {
    if (!isLoading && !isFetching) {
      setIsSubmittingLookup(false);
    }
  }, [isLoading, isFetching]);

  // SSE Real-Time Listener for User Orders with proxy-resilient connection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    const eventUrl = apiBase ? `${apiBase}/api/v1/events?role=user` : '/api/v1/events?role=user';

    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(eventUrl);

      eventSource.onerror = () => {
        eventSource?.close();
      };

      // Event: Pesanan Dibatalkan -> Putar 'cancel' hanya jika milik user ini
      eventSource.addEventListener('order:cancelled', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          const orderId = String(payload.order_id || payload.id || '').trim().toUpperCase();
          if (userOrderIdsRef.current.has(orderId)) {
            notificationSound.play('cancel', { orderId, eventId: `${orderId}:cancelled` });
            refetch();
            showNotification(`Pesanan #${orderId} dibatalkan.`);
          }
        } catch (err) {
          console.error('SSE user order:cancelled error', err);
        }
      });

      // Event: Pesanan Selesai -> Putar 'selesai' hanya jika milik user ini
      eventSource.addEventListener('order:completed', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          const orderId = String(payload.order_id || payload.id || '').trim().toUpperCase();
          if (userOrderIdsRef.current.has(orderId)) {
            notificationSound.play('selesai', { orderId, eventId: `${orderId}:completed` });
            refetch();
            showNotification(`Pesanan #${orderId} telah selesai diproses!`);
          }
        } catch (err) {
          console.error('SSE user order:completed error', err);
        }
      });

      // Event: Status Changed Umum
      eventSource.addEventListener('order:status_changed', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          const orderId = String(payload.order_id || payload.id || '').trim().toUpperCase();
          const newStatus = String(payload.status || payload.new_status || '').toLowerCase();

          if (userOrderIdsRef.current.has(orderId)) {
            if (newStatus === 'cancelled' || newStatus === 'expired' || newStatus === 'batal') {
              notificationSound.play('cancel', { orderId, eventId: `${orderId}:cancelled` });
              showNotification(`Pesanan #${orderId} dibatalkan.`);
            } else if (newStatus === 'completed' || newStatus === 'selesai' || newStatus === 'paid') {
              notificationSound.play('selesai', { orderId, eventId: `${orderId}:completed` });
              showNotification(`Pesanan #${orderId} telah selesai diproses!`);
            }
            refetch();
          }
        } catch (err) {
          console.error('SSE user order:status_changed error', err);
        }
      });
    } catch {
      // Graceful fallback if SSE is unavailable
    }

    return () => {
      eventSource?.close();
    };
  }, [refetch]);

  const rawOrders = data?.data || [];

  const orders = [...rawOrders].sort((a, b) => {
    const timeA = new Date(a.order_date || (a as unknown as { createdAt?: string }).createdAt || 0).getTime();
    const timeB = new Date(b.order_date || (b as unknown as { createdAt?: string }).createdAt || 0).getTime();
    return timeB - timeA;
  });

  const filteredOrders = orders.filter((order) => {
    const isExpired = isOrderExpired(order);
    const rawStatus = (order.order_status || (order as unknown as { status?: string }).status || 'pending').toLowerCase();
    const effectiveStatus =
      rawStatus === 'pending' && isExpired ? 'cancelled' : rawStatus;

    if (selectedStatus !== 'all' && effectiveStatus !== selectedStatus) {
      return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (order.id || '').toLowerCase().includes(q) ||
      (order.items || []).some((item) => {
        const pName = item.product_name || (item as unknown as { productName?: string }).productName || '';
        return pName.toLowerCase().includes(q);
      })
    );
  });

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const handleCopyOrderId = (orderId: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(orderId);
      setCopiedOrderId(orderId);
      showNotification(`Nomor pesanan #${orderId} berhasil disalin!`);
      setTimeout(() => setCopiedOrderId(null), 2500);
    }
  };

  const handleCopyOrderInfo = (order: Order) => {
    if (typeof window !== 'undefined') {
      const orderTotal = Number(
        order.total_amount ??
        (order as unknown as { totalAmount?: number }).totalAmount ??
        (order as unknown as { amount?: number }).amount ??
        0
      );
      const orderDateStr =
        order.order_date ||
        (order as unknown as { createdAt?: string }).createdAt ||
        order.expires_at ||
        new Date().toISOString();
      const statusStr = (
        order.order_status ||
        (order as unknown as { status?: string }).status ||
        'pending'
      ).toUpperCase();

      const summaryText = `[Asterra Store] Bukti Pesanan:\nNomor: ${order.id}\nTanggal: ${new Date(
        orderDateStr
      ).toLocaleDateString('id-ID')}\nTotal: Rp ${orderTotal.toLocaleString(
        'id-ID'
      )}\nStatus: ${statusStr}\nItem: ${(order.items || [])
        .map((i) => {
          const pName = i.product_name || (i as unknown as { productName?: string }).productName || 'Produk';
          return `${pName} (${i.quantity || 1}x)`;
        })
        .join(', ')}`;
      navigator.clipboard?.writeText(summaryText);
      showNotification(`Informasi pesanan ${order.id} berhasil disalin!`);
    }
  };

  const handleReorder = (order: Order) => {
    const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
    const pId = firstItem?.product_id || (firstItem as unknown as { productId?: string })?.productId;
    if (pId) {
      window.location.href = `/products/${pId}`;
    } else {
      window.location.href = '/products';
    }
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

    const rawOrder = order as unknown as Record<string, any>;
    const orderTotal = Number(
      rawOrder.total_amount ??
      rawOrder.totalAmount ??
      rawOrder.amount ??
      0
    );
    const orderRaw = Number(
      rawOrder.raw_amount ??
      rawOrder.rawAmount ??
      orderTotal
    );
    const orderUnique = Number(
      rawOrder.unique_code ??
      rawOrder.uniqueCode ??
      0
    );
    const orderExpiresAt = rawOrder.expires_at || rawOrder.expiresAt;
    const paymentMethod =
      rawOrder.payment?.payment_method ||
      rawOrder.paymentMethod ||
      rawOrder.payment_method ||
      'manual_bca';

    const isManual =
      rawOrder.payment_mode === 'manual' ||
      rawOrder.paymentMode === 'manual' ||
      paymentMethod.startsWith('manual_');

    if (isManual) {
      setActiveManualModal({
        orderId: order.id,
        amount: orderTotal,
        totalAmount: orderTotal,
        total_amount: orderTotal,
        rawAmount: orderRaw,
        raw_amount: orderRaw,
        uniqueCode: orderUnique,
        unique_code: orderUnique,
        method: paymentMethod,
        expiresAt: orderExpiresAt,
        expires_at: orderExpiresAt,
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

  // Immediate loading state: actively fetching private orders for active contact or order ID
  const isInitialLoading = Boolean(activeContact || effectiveOrderId) && (isSubmittingLookup || (isLoading && !data));

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = emailInput.trim();
    if (!trimmed) return;

    setIsSubmittingLookup(true);

    if (trimmed.toUpperCase().startsWith('AST-') || trimmed.toUpperCase().startsWith('ORD-')) {
      const cleanId = trimmed.toUpperCase();
      setTrackedOrderId(cleanId);
      setExpandedOrderId(cleanId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('asterra_last_order_id', cleanId);
        const url = new URL(window.location.href);
        url.searchParams.set('id', cleanId);
        window.history.replaceState(window.history.state, '', url.pathname + url.search);
      }
      showNotification(`Memuat pesanan #${cleanId}...`);
      setIsManualSwitchOpen(false);
      refetch();
    } else if (trimmed.includes('@')) {
      const cleanEmail = trimmed.toLowerCase();
      setGuestIdentity(cleanEmail);
      if (typeof window !== 'undefined') {
        localStorage.setItem('asterra_customer_email', cleanEmail);
      }
      showNotification(`Memuat riwayat pesanan untuk ${cleanEmail}`);
      setIsManualSwitchOpen(false);
      refetch();
    } else {
      // Phone number or custom contact identifier
      setGuestIdentity(trimmed);
      if (typeof window !== 'undefined') {
        localStorage.setItem('asterra_customer_email', trimmed);
      }
      showNotification(`Memuat riwayat pesanan untuk ${trimmed}`);
      setIsManualSwitchOpen(false);
      refetch();
    }
  };

  const handleResetTracking = () => {
    setGuestIdentity('');
    setTrackedOrderId(null);
    setExpandedOrderId(null);
    setEmailInput('');
    setIsManualSwitchOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('asterra_customer_email');
      localStorage.removeItem('asterra_last_order_id');
      const url = new URL(window.location.href);
      url.searchParams.delete('id');
      url.searchParams.delete('orderId');
      url.searchParams.delete('email');
      window.history.replaceState(window.history.state, '', url.pathname + (url.search ? url.search : ''));
    }
    showNotification('Pelacakan pesanan direset.');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Floating Notification */}
      {notification && (
        <div data-ui="toast" className="fixed bottom-6 right-6 z-50 bg-surface border border-border text-foreground px-4 py-3 rounded-md shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
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
              <Button size="sm" variant="outline" className="text-xs gap-1.5 border-border h-8 font-medium">
                <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5 text-foreground-muted" />
                <span className="hidden sm:inline">Katalog Produk</span>
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => {
                refetch();
                showNotification('Data riwayat pesanan berhasil diperbarui.');
              }}
              className={`p-2 rounded-md bg-surface border border-border text-foreground-muted hover:text-foreground transition-colors cursor-pointer h-8 w-8 flex items-center justify-center ${
                isRefetching ? 'opacity-50' : ''
              }`}
              title="Perbarui Data"
            >
              <FontAwesomeIcon
                icon={faRotateLeft}
                className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-foreground' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Email / Phone / Order ID Entry & Lookup Form when unauthenticated and no active order, or user explicitly opened switch */}
        {((!activeContact && !effectiveOrderId) || isManualSwitchOpen) && (
          <div data-gsap="hero-card" className="bg-surface border border-border rounded-lg p-4 max-w-xl mx-auto mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">
                Lacak Pesanan Asterra
              </span>
              {isManualSwitchOpen && (activeContact || effectiveOrderId) && (
                <button
                  type="button"
                  onClick={() => setIsManualSwitchOpen(false)}
                  className="text-[11px] text-foreground-muted hover:text-foreground cursor-pointer"
                >
                  Tutup
                </button>
              )}
            </div>
            <form
              onSubmit={handleLookupSubmit}
              className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
            >
              <input
                type="text"
                required
                placeholder="Masukkan Email, No. WhatsApp, atau No. Pesanan"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-md bg-surface border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-foreground"
              />
              <Button type="submit" size="sm" className="text-xs shrink-0 font-medium" disabled={isSubmittingLookup}>
                {isSubmittingLookup ? 'Memuat...' : 'Lihat Pesanan'}
              </Button>
            </form>
          </div>
        )}

        {/* Active Account / Tracking Banner */}
        {(activeContact || effectiveOrderId) && (
          <div className="bg-surface border border-border rounded-lg px-4 py-3 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <FontAwesomeIcon icon={faReceipt} className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
              <div className="text-foreground">
                <span className="text-foreground-muted">Menampilkan riwayat pesanan untuk:{' '}</span>
                <strong className="font-medium text-foreground">{activeContact || `#${effectiveOrderId}`}</strong>
                {session?.user?.email && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground border border-border font-medium">
                    Akun Terverifikasi
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsManualSwitchOpen((prev) => !prev)}
                className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
              >
                {isManualSwitchOpen ? 'Tutup Pencarian' : 'Lacak ID / Akun Lain'}
              </button>
              {!session?.user?.email && !legacyUser?.email && (
                <button
                  type="button"
                  onClick={handleResetTracking}
                  className="text-[11px] text-foreground-muted hover:text-foreground cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="bg-surface border border-border rounded-lg p-3.5 mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {STATUS_FILTERS.map((filter) => {
                const isSelected = selectedStatus === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setSelectedStatus(filter.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 border cursor-pointer ${
                      isSelected
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-surface text-foreground-muted border-border hover:text-foreground hover:border-foreground/30'
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
                className="w-full pl-9 pr-3 py-1.5 rounded-md bg-surface border border-border text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-foreground"
              />
            </div>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isInitialLoading && <PrivateOrdersSkeleton />}

        {/* Error State */}
        {error && !isInitialLoading && (
          <div className="bg-surface border border-border rounded-lg p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-foreground">Gagal memuat riwayat pesanan</p>
            <p className="text-xs text-foreground-muted">Silakan coba beberapa saat lagi.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isInitialLoading && !error && filteredOrders.length === 0 && (
          <div className="bg-surface border border-border rounded-lg p-10 text-center space-y-3 max-w-md mx-auto my-8">
            <FontAwesomeIcon icon={faBox} className="w-8 h-8 text-foreground-muted/60 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Belum Ada Riwayat Pesanan</h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                {selectedStatus !== 'all' || searchQuery
                  ? 'Tidak ada transaksi yang cocok dengan filter atau kata kunci saat ini.'
                  : activeContact
                  ? `Tidak ada transaksi pesanan yang ditemukan untuk "${activeContact}".`
                  : effectiveOrderId
                  ? `Pesanan #${effectiveOrderId} tidak ditemukan atau belum tercatat.`
                  : 'Silakan masukkan email, nomor WhatsApp, atau nomor pesanan Anda di atas untuk melihat riwayat transaksi.'}
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
                className="text-xs font-medium cursor-pointer"
              >
                Reset Filter
              </Button>
            ) : (!activeContact && !effectiveOrderId) || isManualSwitchOpen ? (
              <Link href="/products">
                <Button size="sm" className="gap-1.5 text-xs font-medium cursor-pointer">
                  <span>Mulai Belanja</span>
                  <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
                </Button>
              </Link>
            ) : (
              <div className="flex items-center justify-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsManualSwitchOpen(true)}
                  className="text-xs font-medium cursor-pointer"
                >
                  Lacak Pesanan Lain
                </Button>
                <Link href="/products">
                  <Button size="sm" className="gap-1.5 text-xs font-medium cursor-pointer">
                    <span>Mulai Belanja</span>
                    <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Orders Listing */}
        {!isInitialLoading && !error && filteredOrders.length > 0 && (
          <div className={`space-y-6 transition-opacity duration-150 ${isFetching ? 'opacity-85' : 'opacity-100'}`}>
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const isExpired = isOrderExpired(order);
              const rawStatus = (
                order.order_status ||
                (order as unknown as { status?: string }).status ||
                'pending'
              ).toLowerCase() as Order['order_status'];
              const effectiveStatus: Order['order_status'] =
                rawStatus === 'pending' && isExpired ? 'cancelled' : rawStatus;
              const step = getTimelineStep({ ...order, order_status: effectiveStatus });
              const isCancelled = effectiveStatus === 'cancelled';
              const orderTotal = Number(
                order.total_amount ??
                (order as unknown as { totalAmount?: number }).totalAmount ??
                (order as unknown as { amount?: number }).amount ??
                0
              );
              const orderExpiresAt = order.expires_at || (order as unknown as { expiresAt?: string }).expiresAt;
              const orderDateStr =
                order.order_date ||
                (order as unknown as { createdAt?: string }).createdAt ||
                orderExpiresAt ||
                new Date().toISOString();

              const rawOrder = order as unknown as Record<string, any>;
              const promoDiscount = Number(rawOrder.promo_discount ?? rawOrder.promoDiscount ?? 0);
              const uniqueCode = Number(rawOrder.unique_code ?? rawOrder.uniqueCode ?? 0);
              const itemsSubtotal = (order.items || []).reduce((acc, it) => {
                const p = Number(it.unit_price ?? (it as any).price ?? 0);
                const q = Number(it.quantity ?? 1);
                return acc + (p * q);
              }, 0) || orderTotal;

              const cleanNotes = cleanCustomerNotes(order.customer_notes);
              const isSafeCredential = isSafeLicenseCredential(order.provider_note);

              return (
                <div
                  key={order.id}
                  className="bg-surface border border-border rounded-lg p-5 space-y-4"
                >
                  {/* Card Header: Order ID, Date & Total */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground tracking-tight tabular-nums">
                          {order.id}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyOrderId(order.id)}
                          className="text-foreground-muted hover:text-foreground transition-colors p-0.5 cursor-pointer"
                          title="Salin Nomor Pesanan"
                        >
                          <FontAwesomeIcon
                            icon={copiedOrderId === order.id ? faCheck : faCopy}
                            className={`w-3.5 h-3.5 ${copiedOrderId === order.id ? 'text-emerald-600' : ''}`}
                          />
                        </button>
                      </div>
                      <p className="text-[11px] text-foreground-muted">
                        Dipesan pada{' '}
                        <span className="text-foreground">
                          {new Date(orderDateStr).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })} WIB
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                      {effectiveStatus === 'pending' && (
                        <OrderCountdownBadge
                          expiresAt={orderExpiresAt}
                          onExpired={() => {
                            fetch(`/api/v1/orders/${order.id}/cancel`, { method: 'POST' }).finally(() => refetch());
                          }}
                        />
                      )}
                      {getStatusBadge(effectiveStatus)}
                      <div className="text-right pl-2 sm:border-l sm:border-border">
                        <span className="text-[10px] text-foreground-muted block uppercase tracking-wider font-medium">
                          Total
                        </span>
                        <span className="text-sm font-semibold text-foreground tabular-nums">
                          Rp {orderTotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pre-Order Specific Notice Card */}
                  {Boolean(rawOrder.is_preorder || rawOrder.isPreorder) && (
                    <div className="rounded-lg border border-[rgba(201,111,85,0.3)] bg-[rgba(201,111,85,0.08)] px-4 py-3 flex items-start gap-3 text-xs">
                      <span className="text-base leading-none shrink-0 mt-0.5">📋</span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#C96F55] uppercase tracking-wider text-[11px]">
                            Pesanan Pre-Order
                          </span>
                          <span className="bg-[#C96F55]/20 text-[#C96F55] text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Tercatat di Antrean
                          </span>
                        </div>
                        <p className="text-[#121A2A] font-medium leading-relaxed">
                          Pesanan telah masuk ke pre order, cek kembali ketika toko buka untuk melanjutkan ke pembayaran.
                        </p>
                        <p className="text-[11px] text-[#C96F55] font-semibold">
                          Pemesanan akan diproses kembali ketika admin sudah bangun dari tidurnya 😴
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Fulfillment Status Section */}
                  {isCancelled ? (
                    <div className="rounded-md border border-[#fecdd3] bg-[#ffedea]/60 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-[#831c1e]">
                          Pesanan Dibatalkan
                        </p>
                        <p className="text-[12px] text-[#831c1e]/80 leading-normal max-w-xl">
                          Pesanan ini telah dibatalkan dan proses alokasi lisensi dihentikan.
                          Jika pembayaran Anda sudah terpotong, silakan hubungi layanan pelanggan untuk verifikasi pengembalian dana.
                        </p>
                      </div>
                      <a
                        href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                          `Halo CS Asterra Store, saya ingin konfirmasi terkait kendala pesanan ${order.id}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7.5 border-[#fecdd3] text-[#831c1e] hover:bg-[#ffedea] cursor-pointer w-full sm:w-auto font-medium"
                        >
                          <FontAwesomeIcon icon={faHeadset} className="w-3 h-3 mr-1.5" />
                          <span>Bantuan CS</span>
                        </Button>
                      </a>
                    </div>
                  ) : (
                    /* Quiet, minimal fulfillment progress track */
                    <div className="py-1 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">Tahap Proses</span>
                        <span className="text-[11px] text-foreground-muted">
                          {effectiveStatus === 'completed'
                            ? 'Selesai • Lisensi digital siap digunakan'
                            : effectiveStatus === 'processing'
                            ? 'Pesanan diproses • Alokasi lisensi aktif'
                            : step >= 2
                            ? 'Pembayaran terverifikasi • Menyiapkan pesanan'
                            : 'Pesanan masuk • Menunggu pembayaran'}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        <div className={`h-1.5 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                        <div className={`h-1.5 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                        <div className={`h-1.5 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
                        <div className={`h-1.5 rounded-full ${step >= 4 ? 'bg-emerald-600' : 'bg-muted'}`} />
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 text-[11px] leading-tight text-center">
                        <span className={`break-words ${step >= 1 ? 'text-foreground font-medium' : 'text-foreground-muted'}`}>
                          Pesanan Masuk
                        </span>
                        <span className={`break-words ${step >= 2 ? 'text-foreground font-medium' : 'text-foreground-muted'}`}>
                          Pembayaran Terverifikasi
                        </span>
                        <span className={`break-words ${step >= 3 ? 'text-foreground font-medium' : 'text-foreground-muted'}`}>
                          Pesanan Diproses
                        </span>
                        <span className={`break-words ${step >= 4 ? 'text-emerald-700 font-medium' : 'text-foreground-muted'}`}>
                          Selesai
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Items List inside Order */}
                  <div className="divide-y divide-border border-y border-border py-0.5">
                    {(order.items || []).map((item) => {
                      const unitPrice = Number(
                        item.unit_price ??
                          (item as unknown as { price?: number }).price ??
                          0
                      );
                      const itemQty = Number(item.quantity ?? 1);
                      const pName =
                        item.product_name ||
                        (item as unknown as { productName?: string }).productName ||
                        'Layanan Digital';
                      const targetEmail =
                        item.purchased_details?.target_email ||
                        (item as unknown as { targetEmail?: string }).targetEmail ||
                        order.customer_email ||
                        (order as unknown as { customerEmail?: string }).customerEmail ||
                        '';

                      return (
                        <div
                          key={item.id}
                          className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <ProductBrandIcon name={pName} className="w-8 h-8 rounded-full" />
                            <div className="space-y-0.5">
                              <h4 className="font-medium text-foreground">
                                {pName}
                              </h4>
                            <div className="flex flex-wrap items-center gap-2 text-foreground-muted text-[11px]">
                              <span>{itemQty} lisensi</span>
                              {targetEmail && (
                                <span>
                                  • Akun:{' '}
                                  <span className="text-foreground font-medium">
                                    {targetEmail}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                          <div className="text-left sm:text-right shrink-0">
                            <span className="font-semibold text-foreground tabular-nums">
                              Rp {(unitPrice * itemQty).toLocaleString('id-ID')}
                            </span>
                            {itemQty > 1 && (
                              <span className="text-[11px] text-foreground-muted block tabular-nums">
                                @ Rp {unitPrice.toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Immediate Structured Credentials Box for Completed / Active Orders */}
                  {isSafeCredential && order.provider_note && (
                    <OrderCredentialsCard
                      rawNote={order.provider_note}
                      onNotification={showNotification}
                    />
                  )}

                  {/* Expandable Details Section */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-border space-y-3 text-xs">
                      <div className="rounded-md border border-border bg-muted/20 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                          <span className="font-medium text-foreground text-xs">
                            Rincian Pembayaran
                          </span>
                          <span className="text-[11px] text-foreground-muted tabular-nums">
                            Ref: {order.payment?.transaction_id || (order.payment as unknown as { payment_reference?: string })?.payment_reference || order.id}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-foreground-muted">
                          <div className="flex justify-between sm:justify-start sm:gap-2">
                            <span>Metode:</span>
                            <span className="text-foreground font-medium">
                              {formatFriendlyPaymentMethod(order.payment?.payment_method)}
                            </span>
                          </div>
                          <div className="flex justify-between sm:justify-start sm:gap-2">
                            <span>Waktu:</span>
                            <span className="text-foreground font-medium">
                              {new Date(orderDateStr).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })} WIB
                            </span>
                          </div>
                        </div>

                        {/* Price breakdown */}
                        <div className="border-t border-border pt-2 space-y-1.5 text-foreground-muted">
                          <div className="flex justify-between">
                            <span>Harga Produk:</span>
                            <span className="text-foreground tabular-nums">
                              Rp {itemsSubtotal.toLocaleString('id-ID')}
                            </span>
                          </div>
                          {promoDiscount > 0 && (
                            <div className="flex justify-between text-emerald-700">
                              <span>Potongan Promo:</span>
                              <span className="tabular-nums">- Rp {promoDiscount.toLocaleString('id-ID')}</span>
                            </div>
                          )}
                          {uniqueCode > 0 && (
                            <div className="flex justify-between">
                              <span>Kode Unik Verifikasi:</span>
                              <span className="text-foreground tabular-nums">+ Rp {uniqueCode.toLocaleString('id-ID')}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold text-foreground text-xs pt-1.5 border-t border-border">
                            <span>Total Pembayaran:</span>
                            <span className="tabular-nums text-sm">
                              Rp {orderTotal.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>

                        {cleanNotes && (
                          <div className="border-t border-border pt-2 flex items-start justify-between gap-3 text-foreground-muted">
                            <span className="shrink-0">Catatan:</span>
                            <span className="text-foreground text-right">{cleanNotes}</span>
                          </div>
                        )}
                      </div>

                      {/* In-Progress Notification for Processing Orders */}
                      {effectiveStatus === 'processing' && (
                        <div className="p-3 bg-muted/30 border border-border rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                          <div className="flex items-center gap-2 text-foreground-muted">
                            <FontAwesomeIcon icon={faRotateLeft} className="w-3.5 h-3.5 animate-spin shrink-0 text-foreground" />
                            <span className="text-foreground">
                              Lisensi digital sedang diproses oleh sistem. Kredensial akan otomatis muncul di sini.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await fetch(`/api/v1/orders/${order.id}/sync-vip`, { method: 'POST' });
                                refetch();
                                showNotification('Status pesanan berhasil diperbarui.');
                              } catch (_) {}
                            }}
                            className="text-xs font-medium text-foreground hover:underline cursor-pointer shrink-0 self-end sm:self-auto"
                          >
                            Perbarui Status
                          </button>
                        </div>
                      )}

                      {/* Guarantee quiet line */}
                      <div className="flex items-center gap-2 p-3 border border-border rounded-md text-foreground-muted text-[11px]">
                        <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                        <span>
                          Dilindungi oleh <span className="text-foreground font-medium">Garansi Asterra Store</span> — bantuan aktivasi dan penggantian 100% jika terjadi kendala akses.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="text-xs text-foreground-muted hover:text-foreground inline-flex items-center gap-1.5 cursor-pointer font-medium self-start sm:self-auto py-1"
                    >
                      <span>{isExpanded ? 'Sembunyikan Rincian' : 'Lihat Rincian Pesanan'}</span>
                      <FontAwesomeIcon
                        icon={isExpanded ? faChevronUp : faChevronDown}
                        className="w-3 h-3 transition-transform duration-200"
                      />
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyOrderInfo(order)}
                        className="text-xs gap-1.5 border-border h-8 font-medium cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faCopy} className="w-3 h-3 text-foreground-muted" />
                        <span>Salin Bukti</span>
                      </Button>

                      {effectiveStatus === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handlePayOrder(order)}
                          className="text-xs gap-1.5 h-8 font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs cursor-pointer"
                        >
                          <FontAwesomeIcon icon={faCreditCard} className="w-3.5 h-3.5" />
                          <span>Bayar Sekarang</span>
                        </Button>
                      )}

                      {(effectiveStatus === 'completed' || effectiveStatus === 'cancelled') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReorder(order)}
                          className="text-xs gap-1.5 border-border h-8 font-medium cursor-pointer hover:border-primary hover:text-primary"
                        >
                          <FontAwesomeIcon icon={faRotateLeft} className="w-3 h-3 text-primary" />
                          <span>Pesan Ulang</span>
                        </Button>
                      )}

                      <a
                        href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                          `Halo CS Asterra Store, saya ingin menanyakan status pesanan ${order.id}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button
                          size="sm"
                          variant={effectiveStatus === 'cancelled' ? 'secondary' : 'default'}
                          className="text-xs gap-1.5 h-8 cursor-pointer font-medium"
                        >
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
