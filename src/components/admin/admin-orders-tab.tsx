'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Order } from '@/lib/orders-data';
import { OrdersApi, OrdersApiResponse } from '@/lib/api-client';
import { notificationSound } from '@/lib/utils/notification-sound';
import { RefreshCw, ShoppingBag, Check } from 'lucide-react';
import { OrderMetricsCards } from './orders/order-metrics-cards';
import { OrderFiltersBar } from './orders/order-filters-bar';
import { OrderTableRow } from './orders/order-table-row';
import { OrderDetailModal } from './orders/order-detail-modal';

export function AdminOrdersTab() {
  const queryClient = useQueryClient();

  // Filters & Modal State
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
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

  // Fetch orders with React Query via centralized OrdersApi
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
      showNotification(`Status pesanan ${data.data.id} berhasil diubah ke '${variables.status}'.`);
      setSelectedOrder(data.data);
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
            <Check className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs font-medium">{notification}</p>
        </div>
      )}

      {/* Top Metrics Cards */}
      <OrderMetricsCards metrics={metrics} />

      {/* Filter, Search & SSE Bar */}
      <OrderFiltersBar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        metrics={metrics}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onTestSound={handleTestSound}
        sseConnected={sseConnected}
        onRefresh={() => refetch()}
        isLoading={isRefetching}
      />

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
                {orders.map((order: Order) => (
                  <OrderTableRow
                    key={order.id}
                    order={order}
                    onOpenDetail={handleOpenDetail}
                    onCopyEmail={handleCopyEmail}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
