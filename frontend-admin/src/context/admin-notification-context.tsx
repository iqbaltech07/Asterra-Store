'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notificationSound } from '@/lib/utils/notification-sound';
import {
  AdminToastItem,
  AdminToastContainer,
} from '@/components/admin/admin-toast-notification';
import { formatRupiah } from '@/lib/utils/format';

interface AdminNotificationContextValue {
  toasts: AdminToastItem[];
  addToast: (toast: Omit<AdminToastItem, 'id' | 'timestamp'> & { id?: string }) => void;
  dismissToast: (id: string) => void;
  sseConnected: boolean;
  isMuted: boolean;
  audioUnlocked: boolean;
  handleToggleMute: () => boolean;
  handleTestSound: () => void;
}

const AdminNotificationContext = createContext<AdminNotificationContextValue | null>(null);

const MAX_VISIBLE_TOASTS = 4;
const STORAGE_PROCESSED_EVENTS_KEY = 'asterra_admin_processed_toast_events';

export interface AdminNotificationProviderProps {
  children: React.ReactNode;
  onNavigateTab?: (tab: 'orders' | 'affiliate') => void;
}

export const AdminNotificationProvider: React.FC<AdminNotificationProviderProps> = ({
  children,
  onNavigateTab,
}) => {
  const queryClient = useQueryClient();

  const [toasts, setToasts] = useState<AdminToastItem[]>([]);
  const queueRef = useRef<AdminToastItem[]>([]);
  const processedEventsRef = useRef<Set<string>>(new Set());

  // Audio & SSE States
  const [isMuted, setIsMuted] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);

  // Initialize processed events cache from localStorage to prevent duplicate toasts on refresh
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_PROCESSED_EVENTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          processedEventsRef.current = new Set(parsed.slice(-200));
        }
      }
    } catch (e) {
      console.warn('[AdminNotifications] Cache read note:', e);
    }
  }, []);

  const saveProcessedEvent = useCallback((eventId: string) => {
    processedEventsRef.current.add(eventId);
    if (typeof window !== 'undefined') {
      try {
        const arr = Array.from(processedEventsRef.current).slice(-200);
        localStorage.setItem(STORAGE_PROCESSED_EVENTS_KEY, JSON.stringify(arr));
      } catch {}
    }
  }, []);

  // Sync Audio sound engine mute & unlock state
  useEffect(() => {
    setIsMuted(notificationSound.isSoundMuted());
    const unsub = notificationSound.onUnlockChange((unlocked) => {
      setAudioUnlocked(unlocked);
    });
    notificationSound.reconcileOfflineEvents();
    return unsub;
  }, []);

  const handleToggleMute = useCallback(() => {
    notificationSound.unlockAudio();
    const nextMuted = notificationSound.toggleMute();
    setIsMuted(nextMuted);
    return nextMuted;
  }, []);

  const handleTestSound = useCallback(() => {
    notificationSound.unlockAudio().then(() => {
      notificationSound.play('order', { force: true });
    });
  }, []);

  // Toast Management
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (queueRef.current.length > 0 && filtered.length < MAX_VISIBLE_TOASTS) {
        const nextToast = queueRef.current.shift()!;
        return [...filtered, nextToast];
      }
      return filtered;
    });
  }, []);

  const addToast = useCallback((item: Omit<AdminToastItem, 'id' | 'timestamp'> & { id?: string }) => {
    const toastId = item.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast: AdminToastItem = {
      ...item,
      id: toastId,
      timestamp: Date.now(),
      durationMs: item.durationMs || 5500,
    };

    setToasts((prev) => {
      if (prev.some((t) => t.id === toastId)) return prev;
      if (prev.length >= MAX_VISIBLE_TOASTS) {
        queueRef.current.push(newToast);
        return prev;
      }
      return [...prev, newToast];
    });
  }, []);

  // Singleton SSE Connection
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
          retryAttempt = 0;
        };

        // Event A: Pesanan Baru Masuk
        eventSource.addEventListener('order:created', (e: MessageEvent) => {
          if (!isSubscribed) return;
          try {
            const payload = e.data ? JSON.parse(e.data) : {};
            const orderId = payload.order_id || payload.id;
            if (!orderId) return;

            const eventKey = `order:${orderId}:created`;
            if (processedEventsRef.current.has(eventKey)) return;
            saveProcessedEvent(eventKey);

            // Play existing audio notification
            notificationSound.play('order', { orderId, eventId: eventKey });

            // Invalidate React Query caches
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
            queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
            queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });

            const customerName = payload.customer_name || payload.customerName || 'Pelanggan';
            const productName = payload.product_name || payload.productName || 'Layanan Digital';
            const totalAmount = Number(payload.total_amount || payload.totalAmount || 0);

            // Trigger Smartphone-style Toast Notification
            addToast({
              id: `order-${orderId}`,
              type: 'order_created',
              title: 'Pesanan Baru Masuk!',
              description: `Pesanan ${orderId} telah diterima.`,
              targetTab: 'orders',
              metadata: {
                orderId,
                customerName,
                customerEmail: payload.customer_email || payload.customerEmail,
                productName,
                totalAmount,
              },
            });
          } catch (err) {
            console.error('[AdminNotifications] order:created parse error:', err);
          }
        });

        // Event B: Pengajuan Penarikan Saldo Komisi Sales
        eventSource.addEventListener('payout:requested', (e: MessageEvent) => {
          if (!isSubscribed) return;
          try {
            const payload = e.data ? JSON.parse(e.data) : {};
            const requestId = payload.request_id || payload.id || `payreq-${Date.now()}`;
            const eventKey = `payout:${requestId}:requested`;

            if (processedEventsRef.current.has(eventKey)) return;
            saveProcessedEvent(eventKey);

            // Audio notification cue for payout request using Request.mp3
            notificationSound.play('payout', { orderId: requestId, eventId: eventKey });

            // Invalidate Affiliate & Logs queries
            queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
            queryClient.invalidateQueries({ queryKey: ['admin-affiliate-partners'] });
            queryClient.invalidateQueries({ queryKey: ['admin-payout-requests'] });
            queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
            queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('admin:refresh-affiliates'));
            }

            const partnerName = payload.partner_name || payload.partnerName || 'Mitra Sales';
            const amount = Number(payload.amount || 0);

            // Trigger Smartphone-style Toast Notification
            addToast({
              id: `payout-${requestId}`,
              type: 'payout_requested',
              title: 'Pengajuan Penarikan Komisi Baru',
              description: `Sales ${partnerName} mengajukan penarikan komisi sebesar ${formatRupiah(amount)}.`,
              targetTab: 'affiliate',
              metadata: {
                requestId,
                partnerName,
                partnerCode: payload.partner_code || payload.partnerCode,
                amount,
                bankName: payload.bank_name || payload.bankName,
                bankAccount: payload.bank_account || payload.bankAccount,
              },
            });
          } catch (err) {
            console.error('[AdminNotifications] payout:requested parse error:', err);
          }
        });

        // Event: Affiliate Updated
        eventSource.addEventListener('affiliate:updated', () => {
          if (!isSubscribed) return;
          queryClient.invalidateQueries({ queryKey: ['admin-affiliates'] });
          queryClient.invalidateQueries({ queryKey: ['admin-affiliate-partners'] });
          queryClient.invalidateQueries({ queryKey: ['admin-payout-requests'] });
          queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('admin:refresh-affiliates'));
          }
        });

        // Event: Pesanan Dibatalkan
        eventSource.addEventListener('order:cancelled', (e: MessageEvent) => {
          if (!isSubscribed) return;
          try {
            const payload = e.data ? JSON.parse(e.data) : {};
            const orderId = payload.order_id || payload.id;
            if (orderId) {
              const eventKey = `order:${orderId}:cancelled`;
              notificationSound.play('cancel', { orderId, eventId: eventKey });
            }
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
            queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
          } catch (err) {
            console.error('[AdminNotifications] order:cancelled error:', err);
          }
        });

        // Event: Pembayaran Terverifikasi
        eventSource.addEventListener('order:payment_verified', () => {
          if (!isSubscribed) return;
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
          queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
          queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
        });

        // Event: Status Changed
        eventSource.addEventListener('order:status_changed', (e: MessageEvent) => {
          if (!isSubscribed) return;
          try {
            const payload = e.data ? JSON.parse(e.data) : {};
            const orderId = payload.order_id || payload.id;
            const status = String(payload.status || payload.new_status || '').toLowerCase();
            if (status === 'cancelled' || status === 'expired' || status === 'batal') {
              if (orderId) {
                notificationSound.play('cancel', { orderId, eventId: `${orderId}:cancelled` });
              }
            }
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
            queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
          } catch (err) {
            console.error('[AdminNotifications] order:status_changed error:', err);
          }
        });

        eventSource.onerror = () => {
          if (!isSubscribed) return;
          setSseConnected(false);
          try {
            eventSource?.close();
          } catch {}
          eventSource = null;

          const backoff = Math.min(1000 * Math.pow(1.5, retryAttempt), 15000);
          retryAttempt++;
          reconnectTimeout = setTimeout(setupConnection, backoff);
        };
      } catch (err) {
        console.warn('[AdminNotifications] SSE connection init error:', err);
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
      }
    };
  }, [queryClient, addToast, saveProcessedEvent]);

  const handleNavigate = useCallback(
    (tab: 'orders' | 'affiliate') => {
      if (onNavigateTab) {
        onNavigateTab(tab);
      } else if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.pushState({ tab }, '', url.pathname + url.search);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    },
    [onNavigateTab]
  );

  return (
    <AdminNotificationContext.Provider
      value={{
        toasts,
        addToast,
        dismissToast,
        sseConnected,
        isMuted,
        audioUnlocked,
        handleToggleMute,
        handleTestSound,
      }}
    >
      {children}
      <AdminToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        onNavigate={handleNavigate}
      />
    </AdminNotificationContext.Provider>
  );
};

export function useAdminNotifications() {
  const context = useContext(AdminNotificationContext);
  if (!context) {
    throw new Error('useAdminNotifications must be used within an AdminNotificationProvider');
  }
  return context;
}
