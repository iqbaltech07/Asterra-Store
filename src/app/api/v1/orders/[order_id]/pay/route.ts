import { NextRequest, NextResponse } from 'next/server';
import { getGlobalOrders, addGlobalOrder, Order } from '@/lib/orders-data';
import { prisma } from '@/lib/prisma';
import { TripayService } from '@/lib/services/tripay.service';
import { getAppBaseUrl } from '@/lib/utils/url';
import { mapDbOrderToOrder, RawDbOrder } from '@/lib/utils/order-mapper';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  const { order_id } = await params;
  let order: Order | null = null;

  // 1. Primary Source of Truth: Query PostgreSQL via Prisma
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaClient = prisma as any;
    if (prismaClient?.order) {
      const dbOrder = await prismaClient.order.findUnique({
        where: { id: order_id },
        include: { items: true },
      });

      if (dbOrder) {
        order = mapDbOrderToOrder(dbOrder as unknown as RawDbOrder);
        addGlobalOrder(order);
      }
    }
  } catch (err) {
    console.warn('[OrdersPayAPI] Prisma lookup error:', err);
  }

  // 2. Secondary fallback to memory
  if (!order) {
    order = getGlobalOrders().find((o) => o.id === order_id) || null;
  }

  if (!order) {
    return NextResponse.json(
      { success: false, error: 'Pesanan tidak ditemukan' },
      { status: 404 }
    );
  }

  // Payment Status Guards: Prevent double payment or paying for dead orders
  if (order.order_status === 'completed' || order.order_status === 'processing') {
    return NextResponse.json(
      { success: false, error: 'Pesanan ini sudah berhasil diverifikasi dan sedang diproses atau telah selesai.' },
      { status: 400 }
    );
  }

  if (order.order_status === 'cancelled') {
    return NextResponse.json(
      { success: false, error: 'Pesanan ini telah dibatalkan atau kedaluwarsa. Silakan lakukan pemesanan baru.' },
      { status: 400 }
    );
  }

  if (order.expires_at && new Date(order.expires_at) < new Date()) {
    return NextResponse.json(
      { success: false, error: 'Batas waktu pembayaran untuk pesanan ini telah habis. Silakan buat pesanan baru.' },
      { status: 400 }
    );
  }

  let paymentMethod = 'qris';
  try {
    const body = await request.json();
    if (body.payment_method) {
      paymentMethod = body.payment_method;
    }
  } catch {
    // defaults to qris if no body
  }

  // Map user-selected frontend method to official Tripay payment channel code
  const mapToTripayMethod = (method: string): string => {
    const m = (method || '').toLowerCase().trim();
    if (m === 'qris' || m === 'qrisc' || m === 'qris2') {
      return 'QRISC';
    }
    if (m === 'bca_va' || m === 'bcava' || m === 'bca') {
      return 'BCAVA';
    }
    if (m === 'bni_va' || m === 'bniva' || m === 'bni') {
      return 'BNIVA';
    }
    if (m === 'seabank_va' || m === 'seabank' || m === 'otherbankva') {
      return 'OTHERBANKVA';
    }
    if (m === 'dana') {
      return 'DANA';
    }
    return 'QRISC';
  };

  const tripayMethod = mapToTripayMethod(paymentMethod);

  const requestOrigin = getAppBaseUrl(request);

  // Call official Tripay API with dynamically detected production domain
  const tripayRes = await TripayService.createTransaction({
    method: tripayMethod,
    merchantRef: order.id,
    amount: order.total_amount,
    customerName: order.customer_name || 'Pelanggan Asterra',
    customerEmail: order.customer_email || 'customer@asterra.store',
    customerPhone: order.customer_whatsapp || '081234567890',
    origin: requestOrigin,
    returnUrl: `${requestOrigin}/orders`,
    callbackUrl: `${requestOrigin}/api/v1/webhooks/tripay`,
    orderItems: (order.items || []).map((i) => ({
      sku: i.product_id,
      name: i.product_name,
      price: i.unit_price,
      quantity: i.quantity,
    })),
  });

  if (!tripayRes.success || !tripayRes.data) {
    const errorMsg = tripayRes.message || 'Gagal memproses tagihan ke gateway Tripay';
    console.warn(`[OrdersPayAPI] Tripay error for order ${order.id}:`, errorMsg);
    return NextResponse.json(
      {
        success: false,
        error: `Tripay Gateway: ${errorMsg}. Pastikan channel tersebut sudah diaktifkan di dashboard Tripay Merchant Anda.`,
      },
      { status: 400 }
    );
  }

  const tripayData = tripayRes.data;

  const payment = {
    id: `pay-${order_id}`,
    order_id: order_id,
    amount: tripayData.amount,
    payment_method: paymentMethod,
    tripay_method: tripayData.payment_method,
    transaction_id: tripayData.reference,
    payment_status: 'pending' as const,
    redirect_url: tripayData.checkout_url,
    checkout_url: tripayData.checkout_url,
    va_number: tripayData.pay_code || undefined,
    qr_url: tripayData.qr_url || undefined,
    qr_string: tripayData.qr_string || undefined,
    expired_at: new Date(tripayData.expired_time * 1000).toISOString(),
    instructions: tripayData.instructions || [],
  };

  order.payment = payment;

  // Persist payment info to Prisma
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaClient = prisma as any;
    if (prismaClient?.order) {
      await prismaClient.order.update({
        where: { id: order_id },
        data: {
          paymentMethod,
          paymentReference: tripayData.reference,
          paymentStatus: 'pending',
        },
      });
    }
  } catch (err) {
    console.warn('[OrdersPayAPI] Failed to update payment in Prisma:', err);
  }

  return NextResponse.json({
    success: true,
    message: 'Pembayaran berhasil diinisiasi via Tripay.',
    payment,
  });
}

// PATCH /api/v1/orders/:order_id/pay
// Security rule: Customers cannot arbitrarily mark their own order as 'completed'.
// Only Tripay Webhook (via cryptographic callback) or Administrator can approve payments and advance order status.
export async function PATCH() {
  return NextResponse.json(
    {
      success: false,
      error:
        'Akses ditolak: Status pesanan hanya dapat diubah oleh administrator atau webhook resmi Tripay setelah pembayaran terverifikasi.',
    },
    { status: 403 }
  );
}
