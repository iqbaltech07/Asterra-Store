'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Order } from '@/lib/orders-data';
import { OrdersApi, OrdersApiResponse } from '@/lib/api-client';
import { useAdminNotifications } from '@/context/admin-notification-context';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowsRotate,
  faBagShopping,
  faCheck,
  faClock,
  faEnvelope,
  faPhone,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { formatDateTimeIndo, formatWhatsAppUrl } from '@/lib/utils/format';
import { OrderStatusBadge } from './orders/order-badges';
import { OrderMetricsCards } from './orders/order-metrics-cards';
import { OrderFiltersBar } from './orders/order-filters-bar';
import { OrderTableRow } from './orders/order-table-row';
import { OrderDetailModal } from './orders/order-detail-modal';

export function AdminOrdersTab() {
  const queryClient = useQueryClient();

  // Centralized SSE & Notification State
  const {
    sseConnected,
    isMuted,
    audioUnlocked,
    handleToggleMute,
    handleTestSound,
  } = useAdminNotifications();

  // Filters & Modal State
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Fetch orders with React Query via centralized OrdersApi with industry-standard Dual-Channel Auto-Sync
  const {
    data: ordersData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<OrdersApiResponse>({
    queryKey: ['admin-orders', statusFilter, searchQuery],
    queryFn: () =>
      OrdersApi.getAll({
        status: statusFilter,
        search: searchQuery,
      }),
    staleTime: 2000, // 2s freshness: window focus immediately checks for latest data
    refetchOnWindowFocus: true, // Immediate background refetch on tab focus
    refetchOnReconnect: true, // Immediate refetch upon network reconnection
    refetchInterval: sseConnected ? 15000 : 5000, // 15s safety poll when SSE alive, 5s active poll fallback when SSE reconnecting
    refetchIntervalInBackground: false,
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
      return OrdersApi.updateStatus(orderId, { status, notes });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      const targetId = data?.data?.id || variables?.orderId || selectedOrder?.id || 'Pesanan';
      showNotification(`Status pesanan ${targetId} berhasil diubah ke '${variables.status}'.`);
      if (data?.data && data.data.id) {
        setSelectedOrder(data.data);
      } else if (selectedOrder) {
        setSelectedOrder((prev) => (prev ? { ...prev, order_status: variables.status as any } : null));
      }
    },
    onError: (err: Error) => {
      showNotification(`Error: ${err.message}`);
    },
  });

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleCopyEmail = (email: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(email);
      showNotification('Email disalin!');
    }
  };

  const handleSaveStatus = (newStatus: string, notes: string) => {
    if (!selectedOrder) return;
    updateStatusMutation.mutate({
      orderId: selectedOrder.id,
      status: newStatus,
      notes: notes.trim() || `Status pesanan diubah ke ${newStatus} oleh admin`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-raised border border-primary/50 text-foreground px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs font-medium">{notification}</p>
        </div>
      )}

      {/* Top Metrics Cards */}
      <OrderMetricsCards metrics={metrics} totalRevenue={metrics?.totalRevenue} />

      {/* Filter, Search & SSE Bar */}
      <OrderFiltersBar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        metrics={metrics}
        isMuted={isMuted}
        audioUnlocked={audioUnlocked}
        onToggleMute={handleToggleMute}
        onTestSound={handleTestSound}
        sseConnected={sseConnected}
        onRefresh={() => refetch()}
        isLoading={isRefetching}
      />

      {/* Orders Table & Mobile Cards */}
      {isLoading ? (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm p-12 text-center">
          <FontAwesomeIcon icon={faArrowsRotate} className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
          <p className="text-xs text-foreground-muted">Memuat daftar pesanan pelanggan...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm p-12 text-center">
          <FontAwesomeIcon icon={faBagShopping} className="w-12 h-12 text-foreground-muted/40 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground">Tidak Ada Pesanan Ditemukan</h3>
          <p className="text-xs text-foreground-muted mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `Tidak ada pesanan yang sesuai dengan kata kunci "${searchQuery}".`
              : 'Belum ada transaksi dengan status yang dipilih.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
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
                  {orders.map((order: Order, idx: number) => (
                    <OrderTableRow
                      key={order.id}
                      order={order}
                      index={idx}
                      onOpenDetail={handleOpenDetail}
                      onCopyEmail={handleCopyEmail}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden flex flex-col gap-3.5">
            {orders.map((order: Order) => {
              const firstItem = order.items?.[0];
              const extraItems = (order.items?.length || 0) - 1;
              const waUrl = formatWhatsAppUrl(order.customer_whatsapp);

              return (
                <div
                  key={order.id}
                  className="bg-surface border border-border/80 rounded-2xl p-4 space-y-3 shadow-2xs hover:border-border-strong transition-all"
                >
                  {/* Header: ID + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono font-bold text-foreground text-xs">{order.id}</span>
                      <div className="text-[10px] text-foreground-muted flex items-center gap-1 mt-0.5">
                        <FontAwesomeIcon icon={faClock} className="w-2.5 h-2.5 shrink-0" />
                        <span>{formatDateTimeIndo(order.order_date)}</span>
                      </div>
                    </div>
                    <OrderStatusBadge status={order.order_status} />
                  </div>

                  {/* Customer Info */}
                  <div className="bg-surface-raised/60 border border-border/60 rounded-xl p-2.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground truncate">{order.customer_name || 'Pelanggan Toko'}</span>
                      {order.customer_whatsapp && waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono hover:underline shrink-0"
                        >
                          <FontAwesomeIcon icon={faPhone} className="w-2.5 h-2.5" />
                          <span>{order.customer_whatsapp}</span>
                        </a>
                      )}
                    </div>
                    <div className="text-[11px] text-foreground-muted flex items-center gap-1.5 truncate">
                      <FontAwesomeIcon icon={faEnvelope} className="w-2.5 h-2.5 shrink-0 text-foreground-muted" />
                      <span className="truncate">{order.customer_email || firstItem?.purchased_details?.target_email || '-'}</span>
                    </div>
                  </div>

                  {/* Products Info & Total */}
                  <div className="flex items-start justify-between gap-3 text-xs pt-0.5">
                    <div className="min-w-0">
                      <span className="text-[10px] text-foreground-muted block font-medium uppercase">Produk</span>
                      <span className="font-medium text-foreground truncate block text-xs">
                        {firstItem?.product_name || 'Produk Pesanan'}
                      </span>
                      <span className="text-[11px] text-foreground-muted">
                        Qty: {firstItem?.quantity || 1}x {extraItems > 0 && `(+${extraItems} lainnya)`}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-foreground-muted block font-medium uppercase">Total Bayar</span>
                      <span className="font-mono font-bold text-foreground text-xs block">
                        Rp {order.total_amount.toLocaleString('id-ID')}
                      </span>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-surface-raised border border-border text-[9px] font-mono text-foreground-muted uppercase">
                        {order.payment?.payment_method || 'QRIS'}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDetail(order)}
                    className="w-full h-8 text-xs font-semibold rounded-xl border-border hover:bg-surface-raised cursor-pointer"
                  >
                    Detail & Kelola Status →
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail & Status Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onSaveStatus={handleSaveStatus}
        isUpdating={updateStatusMutation.isPending}
        onShowNotification={showNotification}
      />
    </div>
  );
}
