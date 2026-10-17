import { PublicOrder } from '@/lib/hooks/use-dynamic-orders';

export interface DemoOrder extends PublicOrder {
  is_demo: true;
}

/**
 * Dataset pesanan simulasi deterministik (statis).
 * Digunakan secara eksklusif untuk tampilan demo / aktivitas storefront tanpa
 * mencemari database transaksi, pendapatan, statistik, atau komisi affiliate.
 *
 * Seluruh pesanan demo menggunakan:
 * - ID berawalan "AST-DEMO-"
 * - Nama produk dari katalog aktif resmi Asterra Store
 * - Identitas pelanggan sintetis bertanda "Demo (...)"
 * - Timestamp deterministik statis dalam minggu berjalan
 * - Flag `is_demo: true`
 */
export const STATIC_DEMO_ORDERS: readonly DemoOrder[] = [
  {
    id: 'AST-DEMO-20261017-0001',
    raw_id: 'demo-20261017-0001',
    product_name: 'Google AI Pro Private 18 Bulan [Garansi 1 Bulan]',
    items_summary: 'Google AI Pro Private 18 Bulan [Garansi 1 Bulan]',
    items_count: 1,
    order_status: 'completed',
    status: 'completed',
    order_date: '2026-10-17T03:15:00.000Z',
    created_at: '2026-10-17T03:15:00.000Z',
    createdAt: '2026-10-17T03:15:00.000Z',
    customer_display: 'Demo (A***a)',
    product_sku: 'prod-muniiqze-jyh0',
    warranty_info: 'Garansi 1 Bulan',
    is_demo: true,
  },
  {
    id: 'AST-DEMO-20261017-0002',
    raw_id: 'demo-20261017-0002',
    product_name: 'CapCut Pro Shared 1 Bulan [1 Device - 2 User] [Garansi 7 Hari]',
    items_summary: 'CapCut Pro Shared 1 Bulan [1 Device - 2 User] [Garansi 7 Hari]',
    items_count: 1,
    order_status: 'processing',
    status: 'processing',
    order_date: '2026-10-17T01:45:00.000Z',
    created_at: '2026-10-17T01:45:00.000Z',
    createdAt: '2026-10-17T01:45:00.000Z',
    customer_display: 'Demo (D***s)',
    product_sku: 'vip-capcutshared1bln-s2',
    process_estimate: 'Estimasi 10-15 Menit',
    is_demo: true,
  },
  {
    id: 'AST-DEMO-20261016-0003',
    raw_id: 'demo-20261016-0003',
    product_name: 'Netflix Premium Shared 30 Hari [1 Profile] [Garansi 14 Hari]',
    items_summary: 'Netflix Premium Shared 30 Hari [1 Profile] [Garansi 14 Hari]',
    items_count: 1,
    order_status: 'completed',
    status: 'completed',
    order_date: '2026-10-16T13:20:00.000Z',
    created_at: '2026-10-16T13:20:00.000Z',
    createdAt: '2026-10-16T13:20:00.000Z',
    customer_display: 'Demo (F***n)',
    product_sku: 'vip-ntflxshare30dgar14d-s2',
    warranty_info: 'Garansi 14 Hari',
    is_demo: true,
  },
  {
    id: 'AST-DEMO-20261016-0004',
    raw_id: 'demo-20261016-0004',
    product_name: 'Vidio Premier Platinum Shared 1 Bulan',
    items_summary: 'Vidio Premier Platinum Shared 1 Bulan',
    items_count: 1,
    order_status: 'completed',
    status: 'completed',
    order_date: '2026-10-16T08:10:00.000Z',
    created_at: '2026-10-16T08:10:00.000Z',
    createdAt: '2026-10-16T08:10:00.000Z',
    customer_display: 'Demo (K***a)',
    product_sku: 'vip-vidioshared-s1',
    warranty_info: 'Garansi Resmi',
    is_demo: true,
  },
  {
    id: 'AST-DEMO-20261014-0005',
    raw_id: 'demo-20261014-0005',
    product_name: 'iQIYI Premium Shared 1 Bulan',
    items_summary: 'iQIYI Premium Shared 1 Bulan',
    items_count: 1,
    order_status: 'completed',
    status: 'completed',
    order_date: '2026-10-14T11:30:00.000Z',
    created_at: '2026-10-14T11:30:00.000Z',
    createdAt: '2026-10-14T11:30:00.000Z',
    customer_display: 'Demo (M***y)',
    product_sku: 'vip-iqiyishared-s1',
    warranty_info: 'Garansi Resmi',
    is_demo: true,
  },
  {
    id: 'AST-DEMO-20261013-0006',
    raw_id: 'demo-20261013-0006',
    product_name: 'Bstation Premium Shared 1 Bulan [1 Device]',
    items_summary: 'Bstation Premium Shared 1 Bulan [1 Device]',
    items_count: 1,
    order_status: 'completed',
    status: 'completed',
    order_date: '2026-10-13T14:15:00.000Z',
    created_at: '2026-10-13T14:15:00.000Z',
    createdAt: '2026-10-13T14:15:00.000Z',
    customer_display: 'Demo (T***o)',
    product_sku: 'vip-bspremshrd1bln-s1',
    warranty_info: 'Garansi Resmi',
    is_demo: true,
  },
  {
    id: 'AST-DEMO-20261013-0007',
    raw_id: 'demo-20261013-0007',
    product_name: 'Google Gemini Pro Head Invite 1 Tahun [5 Anggota] [5 TB GDrive] [Garansi 1 Bulan]',
    items_summary: 'Google Gemini Pro Head Invite 1 Tahun [5 Anggota] [5 TB GDrive] [Garansi 1 Bulan]',
    items_count: 1,
    order_status: 'completed',
    status: 'completed',
    order_date: '2026-10-13T04:00:00.000Z',
    created_at: '2026-10-13T04:00:00.000Z',
    createdAt: '2026-10-13T04:00:00.000Z',
    customer_display: 'Demo (Z***i)',
    product_sku: 'vip-geminiprohead1thngar1bln-s2',
    warranty_info: 'Garansi 1 Bulan',
    is_demo: true,
  },
  {
    id: 'AST-DEMO-20261012-0008',
    raw_id: 'demo-20261012-0008',
    product_name: 'ChatGPT Plus Private 1 Bulan [Garansi 28 Hari]',
    items_summary: 'ChatGPT Plus Private 1 Bulan [Garansi 28 Hari]',
    items_count: 1,
    order_status: 'completed',
    status: 'completed',
    order_date: '2026-10-12T09:30:00.000Z',
    created_at: '2026-10-12T09:30:00.000Z',
    createdAt: '2026-10-12T09:30:00.000Z',
    customer_display: 'Demo (N***a)',
    product_sku: 'vip-chatgptplus1bgar28d-s1',
    warranty_info: 'Garansi 28 Hari',
    is_demo: true,
  },
];

/**
 * Menentukan apakah mode demo pesanan sedang aktif.
 *
 * Prioritas evaluasi:
 * 1. Parameter URL (?demo=true atau ?demo=false) memiliki prioritas tertinggi.
 * 2. Environment variable NEXT_PUBLIC_ENABLE_ORDERS_DEMO.
 * Default bernilai true jika NEXT_PUBLIC_ENABLE_ORDERS_DEMO bernilai "true", atau jika tidak dispesifikasikan (default demo aktif untuk showcase).
 */
export function isOrdersDemoEnabled(searchParamDemo?: string | null): boolean {
  // 1. Explicit query param in URL (?demo=true / ?demo=false) has top priority
  if (searchParamDemo === 'true' || searchParamDemo === '1') {
    return true;
  }
  if (searchParamDemo === 'false' || searchParamDemo === '0') {
    return false;
  }

  // 2. Explicit environment variable NEXT_PUBLIC_ENABLE_ORDERS_DEMO
  const envVal = process.env.NEXT_PUBLIC_ENABLE_ORDERS_DEMO;
  if (envVal !== undefined && envVal !== '') {
    return envVal === 'true' || envVal === '1';
  }

  // 3. Default fallback: true (to maintain storefront activity showcase)
  return true;
}
