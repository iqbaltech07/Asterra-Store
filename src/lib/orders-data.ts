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
  discount_amount?: number;
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

// Initial seeded logs
export const INITIAL_LOGS: OrderLog[] = [
  {
    id: 'log-8821-1',
    order_id: 'ORD-2026-8821',
    customer_name: 'Budi Santoso',
    customer_email: 'budi.santoso@gmail.com',
    actor: 'customer',
    action: 'order_created',
    new_status: 'pending',
    notes: 'Pesanan dibuat oleh pelanggan Budi Santoso',
    created_at: '2026-09-22T14:30:00.000Z',
  },
  {
    id: 'log-8821-2',
    order_id: 'ORD-2026-8821',
    customer_name: 'Budi Santoso',
    customer_email: 'budi.santoso@gmail.com',
    actor: 'tripay_webhook',
    action: 'payment_received',
    previous_status: 'pending',
    new_status: 'processing',
    notes: 'Pembayaran QRIS Rp 150.000 berhasil diverifikasi Tripay Gateway (Trx: trx-tripay-882194)',
    created_at: '2026-09-22T14:31:15.000Z',
  },
  {
    id: 'log-8821-3',
    order_id: 'ORD-2026-8821',
    customer_name: 'Budi Santoso',
    customer_email: 'budi.santoso@gmail.com',
    actor: 'admin',
    action: 'status_updated',
    previous_status: 'processing',
    new_status: 'completed',
    notes: 'Kredensial akun ChatGPT Plus telah dikirimkan ke email budi.santoso@gmail.com',
    created_at: '2026-09-22T14:35:00.000Z',
  },
  {
    id: 'log-8742-1',
    order_id: 'ORD-2026-8742',
    customer_name: 'Dewi Lestari',
    customer_email: 'dewi.lestari@gmail.com',
    actor: 'customer',
    action: 'order_created',
    new_status: 'pending',
    notes: 'Pesanan dibuat oleh pelanggan Dewi Lestari',
    created_at: '2026-09-18T09:15:00.000Z',
  },
  {
    id: 'log-8742-2',
    order_id: 'ORD-2026-8742',
    customer_name: 'Dewi Lestari',
    customer_email: 'dewi.lestari@gmail.com',
    actor: 'tripay_webhook',
    action: 'payment_received',
    previous_status: 'pending',
    new_status: 'completed',
    notes: 'Pembayaran QRIS/E-Wallet Rp 75.000 berhasil diverifikasi Tripay Gateway (Trx: trx-tripay-874201)',
    created_at: '2026-09-18T09:16:10.000Z',
  },
];

// Initial seeded orders for immediate realistic history and testing
export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-2026-8821',
    user_id: 'user-001',
    customer_email: 'budi.santoso@gmail.com',
    customer_whatsapp: '081234567890',
    customer_name: 'Budi Santoso',
    total_amount: 150000,
    order_status: 'completed',
    order_date: '2026-09-22T14:30:00.000Z',
    paid_at: '2026-09-22T14:31:15.000Z',
    customer_notes: 'Mohon kirim kredensial ke email utama.',
    items: [
      {
        id: 'item-8821-1',
        product_id: 'prod-002',
        product_name: 'ChatGPT Plus (1 Bulan)',
        unit_price: 150000,
        quantity: 1,
        purchased_details: {
          target_email: 'budi.santoso@gmail.com',
          duration: '1_month',
          phone: '081234567890',
        },
      },
    ],
    payment: {
      id: 'pay-8821',
      payment_method: 'qris',
      transaction_id: 'trx-tripay-882194',
      payment_status: 'success',
      amount: 150000,
    },
    logs: [
      INITIAL_LOGS[0],
      INITIAL_LOGS[1],
      INITIAL_LOGS[2],
    ],
  },
  {
    id: 'ORD-2026-8742',
    user_id: 'user-001',
    customer_email: 'dewi.lestari@gmail.com',
    customer_whatsapp: '085712345678',
    customer_name: 'Dewi Lestari',
    total_amount: 75000,
    order_status: 'completed',
    order_date: '2026-09-18T09:15:00.000Z',
    paid_at: '2026-09-18T09:16:10.000Z',
    items: [
      {
        id: 'item-8742-1',
        product_id: 'prod-001',
        product_name: 'Canva Pro (1 Bulan)',
        unit_price: 75000,
        quantity: 1,
        purchased_details: {
          target_email: 'dewi.lestari@gmail.com',
          duration: '1_month',
          phone: '085712345678',
        },
      },
    ],
    payment: {
      id: 'pay-8742',
      payment_method: 'gopay',
      transaction_id: 'trx-tripay-874201',
      payment_status: 'success',
      amount: 75000,
    },
    logs: [
      INITIAL_LOGS[3],
      INITIAL_LOGS[4],
    ],
  },
];

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
