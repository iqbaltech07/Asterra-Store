export interface PurchasedDetails {
  target_email: string;
  duration?: string;
  phone?: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  purchased_details?: PurchasedDetails;
}

export interface OrderLog {
  id: string;
  order_id: string;
  customer_name?: string;
  customer_email?: string;
  actor: 'admin' | 'tripay_webhook' | 'customer' | 'system';
  action: string;
  previous_status?: string;
  new_status?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  customer_email?: string;
  customer_whatsapp?: string;
  customer_name?: string;
  total_amount: number;
  raw_amount?: number;
  unique_code?: number;
  payment_mode?: 'gateway' | 'manual';
  order_status: 'pending' | 'processing' | 'completed' | 'cancelled';
  order_date: string;
  paid_at?: string;
  expires_at?: string;
  items: OrderItem[];
  customer_notes?: string;
  promo_code?: string;
  referral_code?: string;
  discount_amount?: number;
  provider?: string;
  provider_trxid?: string;
  provider_status?: string;
  provider_note?: string;
  logs?: OrderLog[];
  payment?: {
    id: string;
    payment_method: string;
    transaction_id: string;
    payment_status: 'pending' | 'settlement' | 'success';
    amount: number;
    redirect_url?: string;
    va_number?: string;
  };
}

// Initial logs - empty by default, populated strictly from database API
export const INITIAL_LOGS: OrderLog[] = [];

// Initial orders - empty by default, populated strictly from database API
export const INITIAL_ORDERS: Order[] = [];

// Global runtime orders memory with globalThis singleton for Next.js multi-chunk dev/prod sharing
const globalForOrders = globalThis as unknown as {
  globalOrdersStore?: Order[];
  globalLogsStore?: OrderLog[];
};

if (!globalForOrders.globalOrdersStore) {
  globalForOrders.globalOrdersStore = [...INITIAL_ORDERS];
}
if (!globalForOrders.globalLogsStore) {
  globalForOrders.globalLogsStore = [...INITIAL_LOGS];
}

const globalOrdersStore: Order[] = globalForOrders.globalOrdersStore;
const globalLogsStore: OrderLog[] = globalForOrders.globalLogsStore;

export function getGlobalOrders(): Order[] {
  return globalOrdersStore;
}

export function addGlobalOrder(order: Order): void {
  globalOrdersStore.unshift(order);
  // Add creation log
  addGlobalLog({
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    order_id: order.id,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    actor: 'customer',
    action: 'order_created',
    new_status: order.order_status,
    notes: `Pesanan baru dibuat oleh ${order.customer_name || 'Pelanggan'} (${order.customer_email || 'Email'})`,
    created_at: new Date().toISOString(),
  });
}

export function addGlobalLog(log: OrderLog): void {
  globalLogsStore.unshift(log);
  const order = globalOrdersStore.find((o) => o.id === log.order_id);
  if (order) {
    if (!order.logs) order.logs = [];
    order.logs.unshift(log);
  }
}

export function getGlobalLogs(orderId?: string): OrderLog[] {
  if (orderId) {
    return globalLogsStore.filter((l) => l.order_id === orderId);
  }
  return globalLogsStore;
}

export function updateGlobalOrderStatus(
  orderId: string,
  status: Order['order_status'],
  actor: 'admin' | 'tripay_webhook' | 'system' = 'admin',
  notes?: string
): Order | undefined {
  const order = globalOrdersStore.find((o) => o.id === orderId);
  if (order) {
    const previousStatus = order.order_status;
    order.order_status = status;
    if (order.payment && (status === 'completed' || status === 'processing')) {
      order.payment.payment_status = 'success';
      order.paid_at = new Date().toISOString();
    }

    // Add log
    addGlobalLog({
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      order_id: orderId,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      actor,
      action: actor === 'tripay_webhook' ? 'payment_received' : 'status_updated',
      previous_status: previousStatus,
      new_status: status,
      notes: notes || `Status diubah dari ${previousStatus} menjadi ${status} oleh ${actor}`,
      created_at: new Date().toISOString(),
    });
  }
  return order;
}
