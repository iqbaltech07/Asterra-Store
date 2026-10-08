/**
 * Global Realtime Event Bus for Server-Sent Events (SSE)
 * Uses globalThis singleton to ensure full cross-chunk reactivity in Next.js App Router
 */

export type OrderEventType =
  | 'order:created'
  | 'order:status_changed'
  | 'order:payment_verified'
  | 'order:cancelled'
  | 'system:ping';

export interface OrderEventPayload {
  type: OrderEventType;
  orderId?: string;
  order?: unknown;
  status?: string;
  customerName?: string;
  customerEmail?: string;
  totalAmount?: number;
  paymentMethod?: string;
  message?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

type EventSubscriber = (event: OrderEventPayload) => void;

interface GlobalEventBusStore {
  subscribers: Set<EventSubscriber>;
}

const globalForEvents = globalThis as unknown as {
  asterraEventBusStore?: GlobalEventBusStore;
};

if (!globalForEvents.asterraEventBusStore) {
  globalForEvents.asterraEventBusStore = {
    subscribers: new Set<EventSubscriber>(),
  };
}

const store = globalForEvents.asterraEventBusStore;

export class OrderEventBus {
  /**
   * Subscribe an active SSE stream connection to order events
   */
  static subscribe(listener: EventSubscriber): () => void {
    store.subscribers.add(listener);
    return () => {
      store.subscribers.delete(listener);
    };
  }

  /**
   * Broadcast an event to all connected SSE clients (Admins and Customers)
   */
  static broadcast(payload: OrderEventPayload): void {
    store.subscribers.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.warn('[OrderEventBus] Failed to dispatch event to subscriber:', err);
      }
    });
  }

  /**
   * Get active subscriber count for monitoring
   */
  static getSubscriberCount(): number {
    return store.subscribers.size;
  }
}

export function broadcastOrderEvent(payload: OrderEventPayload): void {
  OrderEventBus.broadcast(payload);
}

export const eventBus = {
  emit: (
    type: OrderEventType,
    payload: {
      order_id?: string;
      orderId?: string;
      new_status?: string;
      status?: string;
      payment_method?: string;
      paymentMethod?: string;
      amount?: number;
      total_amount?: number;
      customer_name?: string;
      customer_email?: string;
      message?: string;
      timestamp?: string;
      metadata?: Record<string, unknown>;
    }
  ) => {
    OrderEventBus.broadcast({
      type,
      orderId: payload.order_id || payload.orderId,
      status: payload.new_status || payload.status,
      paymentMethod: payload.payment_method || payload.paymentMethod,
      totalAmount: payload.amount || payload.total_amount,
      customerName: payload.customer_name,
      customerEmail: payload.customer_email,
      message: payload.message,
      timestamp: payload.timestamp || new Date().toISOString(),
      metadata: payload.metadata,
    });
  },
  on: (listener: EventSubscriber) => OrderEventBus.subscribe(listener),
};

