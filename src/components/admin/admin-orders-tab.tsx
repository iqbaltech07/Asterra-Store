'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Order, OrderLog } from '@/lib/orders-data';
import { notificationSound } from '@/lib/utils/notification-sound';
import {
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  Ban,
  Phone,
  Mail,
  ExternalLink,
  Edit,
  X,
  Check,
  ShoppingBag,
  CreditCard,
  User,
  Activity,
  DollarSign,
  Copy,
  ShieldCheck,
  Volume2,
  VolumeX,
  Bell,
  Ticket,
} from 'lucide-react';

interface OrdersApiResponse {
  success: boolean;
  data: Order[];
  pagination: {
    total_items: number;
    current_page: number;
    total_pages: number;
    items_per_page: number;
  };
  metrics: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    totalRevenue: number;
  };
}

export function AdminOrdersTab() {
  const queryClient = useQueryClient();

  // Filters & State
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Status Change State inside Modal
  const [newStatus, setNewStatus] = useState<'pending' | 'processing' | 'completed' | 'cancelled'>('completed');
  const [statusNotes, setStatusNotes] = useState('');
  const [isMutationVerified, setIsMutationVerified] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // SSE & Audio Notifications State
  const [isMuted, setIsMuted] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Sync initial mute state
  useEffect(() => {
    setIsMuted(notificationSound.isSoundMuted());
  }, []);

  const handleToggleMute = () => {
    const nextMuted = notificationSound.toggleMute();
    setIsMuted(nextMuted);
    showNotification(nextMuted ? 'Suara notifikasi dibisukan (Muted)' : 'Suara notifikasi diaktifkan');
  };

  const handleTestSound = () => {
    notificationSound.play('new_order');
    showNotification('🔔 Menguji suara notifikasi pesanan masuk');
  };

  // SSE Real-Time Listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const eventSource = new EventSource('/api/v1/events?role=admin');

    eventSource.onopen = () => {
      setSseConnected(true);
    };

    eventSource.addEventListener('order:created', () => {
      try {
        notificationSound.play('new_order');
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      } catch (err) {
        console.error('SSE order:created parse error', err);
      }
    });

    eventSource.addEventListener('order:payment_verified', () => {
      try {
        notificationSound.play('payment_verified');
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      } catch (err) {
        console.error('SSE order:payment_verified parse error', err);
      }
    });

    eventSource.addEventListener('order:status_changed', () => {
      try {
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      } catch (err) {
        console.error('SSE order:status_changed parse error', err);
      }
    });

    eventSource.onerror = () => {
      setSseConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);

  // Fetch orders with React Query
  const {
    data: ordersData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<OrdersApiResponse>({
    queryKey: ['admin-orders', statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      const res = await fetch(`/api/v1/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat daftar pesanan');
      return res.json();
    },
  });

  const orders = ordersData?.data || [];
  const metrics = ordersData?.metrics;

  // Mutation: Update Order Status Manually by Admin
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
      notes,
    }: {
      orderId: string;
      status: string;
      notes: string;
    }) => {
      const res = await fetch(`/api/v1/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mengubah status pesanan');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      showNotification(`Status pesanan ${data.data.id} berhasil diubah ke '${newStatus}'.`);
      setSelectedOrder(data.data);
      setStatusNotes('');
    },
    onError: (err: Error) => {
      showNotification(`Error: ${err.message}`);
    },
  });



  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.order_status);
    setStatusNotes('');
    setIsMutationVerified(false);
    setIsDetailModalOpen(true);
  };

  const handleCopyValidation = (order: Order) => {
    const targetEmail = order.items[0]?.purchased_details?.target_email || order.customer_email || '-';
    const duration = order.items[0]?.purchased_details?.duration || 'Standard';
    const voucherInfo =
      order.promo_code || (order.discount_amount && order.discount_amount > 0)
        ? `\nVoucher: ${order.promo_code || 'PROMO'} (-Rp ${(order.discount_amount || 0).toLocaleString('id-ID')})`
        : `\nVoucher: Tanpa Voucher (Rp 0)`;

    const rawSubtotal = order.raw_amount
      ? `\nSubtotal: Rp ${order.raw_amount.toLocaleString('id-ID')}`
      : '';

    const uniqueCodeText = order.unique_code
      ? `\nKode Unik: +Rp ${order.unique_code.toLocaleString('id-ID')}`
      : '';

    const summary = `[ASTERRA STORE — VALIDASI PESANAN]\nID Pesanan: ${order.id}\nTanggal: ${new Date(
      order.order_date
    ).toLocaleString('id-ID')}\nNama Customer: ${order.customer_name || 'Pelanggan'}\nEmail Pemesan: ${
      order.customer_email || '-'
    }\nTarget Akun: ${targetEmail} (${duration})\nNo WhatsApp: ${order.customer_whatsapp || '-'}${rawSubtotal}${voucherInfo}${uniqueCodeText}\nTotal Tagihan: Rp ${order.total_amount.toLocaleString(
      'id-ID'
    )}\nStatus: ${order.order_status.toUpperCase()}\nMetode Bayar: ${order.payment?.payment_method?.toUpperCase() || 'QRIS'}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(summary);
      showNotification('Data validasi pelanggan berhasil disalin!');
    }
  };

  const handleSaveStatus = () => {
    if (!selectedOrder) return;
    if (newStatus === 'completed' && selectedOrder.payment_mode === 'manual' && !isMutationVerified) {
      showNotification('Harap centang verifikasi mutasi rekening riil terlebih dahulu!');
      return;
    }
    updateStatusMutation.mutate({
      orderId: selectedOrder.id,
      status: newStatus,
      notes: statusNotes.trim() || `Status pesanan diubah ke ${newStatus} oleh admin`,
    });
  };

  const formatWhatsAppUrl = (phone?: string) => {
    if (!phone) return null;
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return `https://wa.me/${clean}`;
  };

  const getStatusBadge = (status: Order['order_status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-status-success/15 text-status-success border border-status-success/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Selesai</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/30">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>Di Proses</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-status-error/15 text-status-error border border-status-error/30">
            <Ban className="w-3.5 h-3.5" />
            <span>Dibatalkan</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-status-warning/15 text-status-warning border border-status-warning/30">
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu Bayar</span>
          </span>
        );
    }
  };

  const getActorBadge = (actor: OrderLog['actor']) => {
    switch (actor) {
      case 'admin':
        return (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">
            Admin Manual
          </Badge>
        );
      case 'tripay_webhook':
        return (
          <Badge variant="outline" className="bg-status-success/10 text-status-success border-status-success/30 text-[10px]">
            Tripay Gateway
          </Badge>
        );
      case 'customer':
        return (
          <Badge variant="outline" className="bg-surface-raised text-foreground-muted border-border text-[10px]">
            Pelanggan
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-surface-raised text-foreground-muted border-border text-[10px]">
            Sistem
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-raised border border-primary/50 text-foreground px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <Check className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs font-medium">{notification}</p>
        </div>
      )}



      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
            <span>Total Pesanan</span>
            <ShoppingBag className="w-4 h-4 text-foreground-muted" />
          </div>
          <div className="text-2xl font-bold text-foreground">{metrics?.total ?? 0}</div>
          <span className="text-[11px] text-foreground-muted">Semua riwayat transaksi</span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
            <span>Menunggu Bayar</span>
            <Clock className="w-4 h-4 text-status-warning" />
          </div>
          <div className="text-2xl font-bold text-status-warning">{metrics?.pending ?? 0}</div>
          <span className="text-[11px] text-foreground-muted">Belum diselesaikan</span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
            <span>Sedang Diproses</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-primary">{metrics?.processing ?? 0}</div>
          <span className="text-[11px] text-foreground-muted">Perlu pengiriman</span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
            <span>Pesanan Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-status-success" />
          </div>
          <div className="text-2xl font-bold text-status-success">{metrics?.completed ?? 0}</div>
          <span className="text-[11px] text-foreground-muted">Berhasil terkirim</span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
            <span>Total Omset</span>
            <DollarSign className="w-4 h-4 text-status-success" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground truncate">
            Rp {(metrics?.totalRevenue ?? 0).toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-status-success font-medium">Dari pesanan lunas</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface border border-border rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Pill Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
            }`}
          >
            Semua ({metrics?.total ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-status-warning text-white shadow-sm'
                : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({metrics?.pending ?? 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('processing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === 'processing'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
            }`}
          >
            <span>Di Proses ({metrics?.processing ?? 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === 'completed'
                ? 'bg-status-success text-white shadow-sm'
                : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Selesai ({metrics?.completed ?? 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('cancelled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === 'cancelled'
                ? 'bg-foreground text-background shadow-sm'
                : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Dibatalkan ({metrics?.cancelled ?? 0})</span>
          </button>
        </div>

        {/* Search Input, Audio Controls & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* SSE Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-border bg-surface-raised">
            <span
              className={`w-2 h-2 rounded-full ${
                sseConnected ? 'bg-status-success animate-pulse' : 'bg-status-error'
              }`}
            />
            <span className={sseConnected ? 'text-status-success font-semibold' : 'text-status-error'}>
              {sseConnected ? 'SSE Live' : 'SSE Disconnected'}
            </span>
          </div>

          {/* Sound Mute/Unmute Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleMute}
            className="h-9 px-2.5 border-border gap-1.5 text-xs text-foreground-muted hover:text-foreground"
            title={isMuted ? 'Nyalakan audio notifikasi' : 'Bisukan audio notifikasi'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-status-error" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-status-success" />
            )}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound ON'}</span>
          </Button>

          {/* Test Sound Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestSound}
            className="h-9 px-2.5 border-border gap-1.5 text-xs text-foreground-muted hover:text-foreground"
            title="Uji coba suara notifikasi Web Audio"
          >
            <Bell className="w-3.5 h-3.5 text-primary" />
            <span className="hidden lg:inline">Tes Chime</span>
          </Button>

          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <Input
              type="text"
              placeholder="Cari ID, Email, WA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs bg-surface-raised border-border h-9"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 px-3 border-border gap-1.5 text-xs text-foreground-muted hover:text-foreground"
            title="Muat ulang pesanan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-primary' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
            <p className="text-xs text-foreground-muted">Memuat daftar pesanan pelanggan...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-foreground-muted/40 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground">Tidak Ada Pesanan Ditemukan</h3>
            <p className="text-xs text-foreground-muted mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `Tidak ada pesanan yang sesuai dengan kata kunci "${searchQuery}".`
                : 'Belum ada transaksi dengan status yang dipilih.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-raised border-b border-border text-foreground-muted font-medium uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">ID Pesanan & Waktu</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Produk Pesanan</th>
                  <th className="py-3 px-4">Total & Bayar</th>
                  <th className="py-3 px-4">Status Pesanan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => {
                  const waUrl = formatWhatsAppUrl(order.customer_whatsapp);
                  const firstItem = order.items[0];
                  const extraItemsCount = order.items.length - 1;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-surface-raised/60 transition-colors group"
                    >
                      {/* Order ID & Date */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono font-bold text-foreground text-xs flex items-center gap-1.5">
                          <span>{order.id}</span>
                        </div>
                        <div className="text-[11px] text-foreground-muted flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>
                            {new Date(order.order_date).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Customer Contact & Validation Info */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            {(order.customer_name || order.customer_email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground text-xs leading-snug">
                              {order.customer_name || 'Pelanggan Toko'}
                            </div>
                            <div className="text-[11px] text-foreground-muted flex items-center gap-1.5 mt-0.5 group/email">
                              <Mail className="w-3 h-3 shrink-0 text-foreground-muted" />
                              <a
                                href={`mailto:${order.customer_email || firstItem?.purchased_details?.target_email || 'customer@asterra.store'}`}
                                className="hover:text-primary hover:underline truncate max-w-[170px]"
                                title="Kirim email ke pelanggan"
                              >
                                {order.customer_email || firstItem?.purchased_details?.target_email || 'customer@asterra.store'}
                              </a>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard?.writeText(order.customer_email || firstItem?.purchased_details?.target_email || '');
                                  showNotification('Email pelanggan disalin!');
                                }}
                                className="opacity-0 group-hover/email:opacity-100 hover:text-foreground transition-opacity"
                                title="Salin Email"
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            {order.customer_whatsapp && (
                              <div className="mt-1 flex items-center gap-1.5">
                                {waUrl ? (
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] text-status-success hover:underline font-mono"
                                    title="Chat WhatsApp Pemesan"
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>{order.customer_whatsapp}</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-foreground-muted font-mono">
                                    {order.customer_whatsapp}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Products */}
                      <td className="py-3.5 px-4 align-top">
                        {firstItem ? (
                          <div>
                            <span className="font-medium text-foreground block truncate max-w-[200px]">
                              {firstItem.product_name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-foreground-muted">
                              <span>Qty: {firstItem.quantity}x</span>
                              {firstItem.purchased_details?.duration && (
                                <span className="bg-surface-raised px-1.5 py-0.2 rounded border border-border text-[10px]">
                                  {firstItem.purchased_details.duration}
                                </span>
                              )}
                            </div>
                            {extraItemsCount > 0 && (
                              <span className="inline-block mt-1 text-[10px] text-primary font-medium">
                                +{extraItemsCount} item lainnya
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-foreground-muted italic">Tidak ada item</span>
                        )}
                      </td>

                      {/* Total & Payment Method & Voucher Information */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-foreground font-mono text-xs flex items-center gap-1">
                          <span>Rp {order.total_amount.toLocaleString('id-ID')}</span>
                          {order.unique_code && (
                            <span className="text-[10px] text-primary font-mono" title={`Kode Unik Verifikasi: +${order.unique_code}`}>
                              (+{order.unique_code})
                            </span>
                          )}
                        </div>

                        {/* Transparent Voucher Badge */}
                        <div className="mt-1">
                          {order.promo_code || (order.discount_amount && order.discount_amount > 0) ? (
                            <div
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-medium"
                              title={`Voucher: ${order.promo_code || 'Promo'} - Potongan: Rp ${(order.discount_amount || 0).toLocaleString('id-ID')}`}
                            >
                              <Ticket className="w-2.5 h-2.5 shrink-0" />
                              <span>{order.promo_code || 'PROMO'}</span>
                              <span>(-Rp {(order.discount_amount || 0).toLocaleString('id-ID')})</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-foreground-muted block font-mono">
                              Tanpa Voucher
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <Badge
                            variant="outline"
                            className="bg-surface-raised border-border text-[10px] uppercase font-mono py-0 px-1.5"
                          >
                            <CreditCard className="w-2.5 h-2.5 mr-1" />
                            {order.payment?.payment_method || 'QRIS'}
                          </Badge>
                          {order.payment_mode === 'manual' ? (
                            <Badge className="bg-status-warning/15 text-status-warning border-status-warning/30 text-[9px] font-mono py-0 px-1">
                              Manual
                            </Badge>
                          ) : (
                            <Badge className="bg-status-success/15 text-status-success border-status-success/30 text-[9px] font-mono py-0 px-1">
                              Gateway
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top">
                        {getStatusBadge(order.order_status)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDetail(order)}
                          className="h-8 text-xs border-border hover:border-primary hover:text-primary gap-1.5"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Detail & Status</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL & STATUS UPDATE MODAL */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-surface/95 backdrop-blur-sm z-10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">
                    Detail Pesanan {selectedOrder.id}
                  </h3>
                  {getStatusBadge(selectedOrder.order_status)}
                </div>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Dibuat pada {new Date(selectedOrder.order_date).toLocaleString('id-ID')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-5 space-y-6">
              {/* Customer Info & Validation Card */}
              <div className="bg-surface-raised border border-border rounded-xl p-4">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/70">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>Data Validasi Customer & Akun</span>
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyValidation(selectedOrder)}
                    className="h-7 text-[11px] gap-1 px-2 border-border text-foreground-muted hover:text-foreground"
                    title="Salin ringkasan data validasi"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Salin Data Validasi</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-surface rounded-lg border border-border/60">
                    <span className="text-foreground-muted block text-[11px]">Nama Lengkap Customer:</span>
                    <span className="font-bold text-foreground text-sm">
                      {selectedOrder.customer_name || 'Pelanggan Toko'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-surface rounded-lg border border-border/60">
                    <span className="text-foreground-muted block text-[11px]">Email Pemesan / Notifikasi:</span>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-foreground truncate">
                        {selectedOrder.customer_email || 'customer@asterra.store'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(selectedOrder.customer_email || '');
                          showNotification('Email disalin!');
                        }}
                        className="text-foreground-muted hover:text-primary p-0.5"
                        title="Salin Email"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 bg-surface rounded-lg border border-border/60">
                    <span className="text-foreground-muted block text-[11px]">WhatsApp Pemesan:</span>
                    {selectedOrder.customer_whatsapp ? (
                      <a
                        href={formatWhatsAppUrl(selectedOrder.customer_whatsapp) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-status-success hover:underline font-mono"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{selectedOrder.customer_whatsapp}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-foreground-muted italic">Tidak dicantumkan</span>
                    )}
                  </div>

                  <div className="p-2.5 bg-surface rounded-lg border border-border/60">
                    <span className="text-foreground-muted block text-[11px]">Metode Pembayaran:</span>
                    <span className="font-mono font-bold text-foreground uppercase">
                      {selectedOrder.payment?.payment_method || 'QRIS'}
                    </span>
                  </div>
                </div>

                {selectedOrder.customer_notes && (
                  <div className="mt-3 pt-3 border-t border-border/60">
                    <span className="text-foreground-muted block text-[11px]">Catatan Pelanggan:</span>
                    <p className="text-xs text-foreground italic mt-0.5">
                      &ldquo;{selectedOrder.customer_notes}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Items Breakdown */}
              <div className="bg-surface-raised border border-border rounded-xl p-4">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                  <span>Rincian Item yang Dipesan</span>
                </h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 bg-surface rounded-lg border border-border flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-foreground">{item.product_name}</div>
                        <div className="text-[11px] text-foreground-muted mt-1 space-y-0.5">
                          {item.purchased_details?.target_email && (
                            <div>
                              <span>Target Email: </span>
                              <span className="font-medium text-foreground">
                                {item.purchased_details.target_email}
                              </span>
                            </div>
                          )}
                          {item.purchased_details?.duration && (
                            <div>
                              <span>Durasi Paket: </span>
                              <span className="font-medium text-foreground">
                                {item.purchased_details.duration}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold font-mono text-foreground">
                          Rp {(item.unit_price * item.quantity).toLocaleString('id-ID')}
                        </div>
                        <div className="text-[11px] text-foreground-muted">
                          {item.quantity}x @ Rp {item.unit_price.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Financial Breakdown & Transparent Voucher */}
                  <div className="mt-3 pt-3 border-t border-border space-y-2 text-xs">
                    <div className="flex justify-between items-center text-foreground-muted">
                      <span>Subtotal Produk</span>
                      <span className="font-mono font-medium text-foreground">
                        Rp {(
                          selectedOrder.raw_amount ||
                          selectedOrder.items.reduce((acc, curr) => acc + curr.unit_price * curr.quantity, 0)
                        ).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-foreground-muted">
                        <Ticket className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Kupon / Voucher</span>
                      </span>
                      {selectedOrder.promo_code || (selectedOrder.discount_amount && selectedOrder.discount_amount > 0) ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                          <span>{selectedOrder.promo_code || 'PROMO'}</span>
                          <span>(-Rp {(selectedOrder.discount_amount || 0).toLocaleString('id-ID')})</span>
                        </div>
                      ) : (
                        <span className="font-mono text-foreground-muted italic">
                          Tanpa Voucher (Rp 0)
                        </span>
                      )}
                    </div>

                    {!!selectedOrder.unique_code && (
                      <div className="flex justify-between items-center text-foreground-muted">
                        <span>Kode Unik Verifikasi</span>
                        <span className="font-mono font-medium text-primary">
                          +Rp {selectedOrder.unique_code.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}

                    <div className="pt-2.5 flex justify-between items-center text-sm font-bold text-foreground border-t border-border mt-2">
                      <span>Total Tagihan Akhir</span>
                      <span className="text-primary font-mono text-base">
                        Rp {selectedOrder.total_amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MANUAL STATUS CHANGER & ACTIONS */}
              <div className="bg-surface-raised border border-primary/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Edit className="w-3.5 h-3.5 text-primary" />
                    <span>Ubah Status Pesanan Manual</span>
                  </h4>
                  <span className="text-[11px] text-foreground-muted">Hak Akses Admin</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStatus('pending')}
                    className={`p-2.5 rounded-lg border text-center transition-colors text-xs font-medium flex flex-col items-center gap-1 ${
                      newStatus === 'pending'
                        ? 'border-status-warning bg-status-warning/15 text-status-warning font-bold'
                        : 'border-border bg-surface text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Pending</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStatus('processing')}
                    className={`p-2.5 rounded-lg border text-center transition-colors text-xs font-medium flex flex-col items-center gap-1 ${
                      newStatus === 'processing'
                        ? 'border-primary bg-primary/15 text-primary font-bold'
                        : 'border-border bg-surface text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Di Proses</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStatus('completed')}
                    className={`p-2.5 rounded-lg border text-center transition-colors text-xs font-medium flex flex-col items-center gap-1 ${
                      newStatus === 'completed'
                        ? 'border-status-success bg-status-success/15 text-status-success font-bold'
                        : 'border-border bg-surface text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Selesai</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStatus('cancelled')}
                    className={`p-2.5 rounded-lg border text-center transition-colors text-xs font-medium flex flex-col items-center gap-1 ${
                      newStatus === 'cancelled'
                        ? 'border-status-error bg-status-error/15 text-status-error font-bold'
                        : 'border-border bg-surface text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    <Ban className="w-4 h-4" />
                    <span>Dibatalkan</span>
                  </button>
                </div>

                <div>
                  <label className="text-[11px] text-foreground-muted block mb-1">
                    Catatan Perubahan (Tercatat di Audit Log):
                  </label>
                  <Input
                    type="text"
                    placeholder="Contoh: Kredensial akun dikirim via WhatsApp admin"
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    className="text-xs bg-surface border-border"
                  />
                </div>

                {/* Anti-Fraud Verification Checklist Box for Manual Orders */}
                {newStatus === 'completed' &&
                  (selectedOrder.payment_mode === 'manual' ||
                    selectedOrder.payment?.payment_method?.toLowerCase().includes('manual') ||
                    selectedOrder.payment?.payment_method === 'bca' ||
                    selectedOrder.payment?.payment_method === 'dana' ||
                    !selectedOrder.payment?.transaction_id?.startsWith('trx-tripay')) && (
                    <div className="p-3 bg-status-warning/10 border border-status-warning/40 rounded-lg space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-status-warning font-semibold">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>Verifikasi Mutasi Rekening Anti-Fraud</span>
                      </div>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        Nominal wajib dicek di mutasi m-Banking/DANA:{' '}
                        <strong className="text-foreground font-mono text-xs">
                          Rp {selectedOrder.total_amount.toLocaleString('id-ID')}
                        </strong>
                        {selectedOrder.unique_code ? (
                          <span className="text-primary font-mono ml-1 font-bold">
                            (Kode Unik: +Rp {selectedOrder.unique_code})
                          </span>
                        ) : null}
                        .
                      </p>
                      <label className="flex items-start gap-2 cursor-pointer pt-1 bg-surface p-2.5 rounded border border-border">
                        <input
                          type="checkbox"
                          checked={isMutationVerified}
                          onChange={(e) => setIsMutationVerified(e.target.checked)}
                          className="w-4 h-4 accent-primary mt-0.5 cursor-pointer"
                        />
                        <span className="text-[11px] font-medium text-foreground">
                          Saya menyatakan telah memeriksa mutasi riil di aplikasi m-Banking/DANA, bukan hanya screenshot WhatsApp.
                        </span>
                      </label>
                    </div>
                  )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="text-xs h-8 border-border"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveStatus}
                    disabled={
                      updateStatusMutation.isPending ||
                      (newStatus === 'completed' &&
                        (selectedOrder.payment_mode === 'manual' ||
                          !selectedOrder.payment?.transaction_id?.startsWith('trx-tripay')) &&
                        !isMutationVerified)
                    }
                    className="text-xs gap-1.5 h-8 font-semibold"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{updateStatusMutation.isPending ? 'Menyimpan...' : 'Simpan Status'}</span>
                  </Button>
                </div>
              </div>

              {/* TIMELINE AUDIT LOGS */}
              <div className="bg-surface-raised border border-border rounded-xl p-4">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  <span>Jejak Riwayat Transaksi (Timeline Logs)</span>
                </h4>

                {selectedOrder.logs && selectedOrder.logs.length > 0 ? (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {selectedOrder.logs.map((log) => (
                      <div key={log.id} className="relative text-xs">
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-surface ${
                            log.actor === 'tripay_webhook'
                              ? 'bg-status-success'
                              : log.actor === 'admin'
                              ? 'bg-primary'
                              : 'bg-foreground-muted'
                          }`}
                        />
                        <div className="flex items-center gap-2 mb-0.5">
                          {getActorBadge(log.actor)}
                          <span className="text-[11px] text-foreground-muted">
                            {new Date(log.created_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}{' '}
                            · {new Date(log.created_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        <p className="text-xs text-foreground font-medium">{log.notes}</p>
                        {log.previous_status && log.new_status && (
                          <div className="text-[10px] text-foreground-muted mt-0.5 flex items-center gap-1 font-mono">
                            <span>{log.previous_status}</span>
                            <span>➔</span>
                            <span className="font-bold text-foreground">{log.new_status}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-foreground-muted italic">
                    Belum ada riwayat audit log untuk pesanan ini.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex justify-end bg-surface">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-xs border-border"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
