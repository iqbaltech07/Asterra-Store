import { NextRequest, NextResponse } from 'next/server';
import { getGlobalOrders, addGlobalOrder, Order } from '@/lib/orders-data';
import { prisma } from '@/lib/prisma';
import { TripayService } from '@/lib/services/tripay.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  const { order_id } = await params;
  let order = getGlobalOrders().find((o) => o.id === order_id);

  // If not found in memory, query PostgreSQL via Prisma
  if (!order) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prismaClient = prisma as any;
      if (prismaClient?.order) {
        const dbOrder = await prismaClient.order.findUnique({
          where: { id: order_id },
          include: { items: true },
        });

        if (dbOrder) {
          order = {
            id: dbOrder.id,
            user_id: 'user-001',
            customer_email: dbOrder.customerEmail,
            customer_name: dbOrder.customerName || undefined,
            customer_whatsapp: dbOrder.customerWhatsapp || undefined,
            total_amount: dbOrder.totalAmount,
            raw_amount: dbOrder.rawAmount || undefined,
            unique_code: dbOrder.uniqueCode || undefined,
            payment_mode: (dbOrder.paymentMode as 'gateway' | 'manual') || 'gateway',
            order_status: (dbOrder.status as Order['order_status']) || 'pending',
            order_date: dbOrder.createdAt ? new Date(dbOrder.createdAt).toISOString() : new Date().toISOString(),
            expires_at: dbOrder.expiresAt ? new Date(dbOrder.expiresAt).toISOString() : undefined,
            customer_notes: dbOrder.customerNotes || '',
            items: Array.isArray(dbOrder.items) && dbOrder.items.length > 0
              ? (dbOrder.items as Array<{
                  id: string;
                  productId: string;
                  productName: string;
                  price: number;
                  quantity: number;
                  targetEmail?: string | null;
                  targetPhone?: string | null;
                  duration?: string | null;
                }>).map((i) => ({
                  id: i.id,
                  product_id: i.productId,
                  product_name: i.productName,
                  unit_price: i.price,
                  quantity: i.quantity,
                  purchased_details: {
                    target_email: i.targetEmail || dbOrder.customerEmail,
                    phone: i.targetPhone || '',
                    duration: i.duration || undefined,
                  },
                }))
              : [
                  {
                    id: `item-${dbOrder.id}-1`,
                    product_id: 'prod-digital',
                    product_name: 'Lisensi Layanan Digital',
                    unit_price: dbOrder.totalAmount,
                    quantity: 1,
                    purchased_details: {
                      target_email: dbOrder.customerEmail,
                      phone: dbOrder.customerWhatsapp || '',
                    },
                  },
                ],
          };
          addGlobalOrder(order);
        }
      }
    } catch (err) {
      console.warn('[OrdersPayAPI] Prisma lookup error:', err);
    }
  }

  if (!order) {
    return NextResponse.json(
      { success: false, error: 'Pesanan tidak ditemukan' },
      { status: 404 }
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

  // Call official Tripay API
  const tripayRes = await TripayService.createTransaction({
    method: tripayMethod,
    merchantRef: order.id,
    amount: order.total_amount,
    customerName: order.customer_name || 'Pelanggan Asterra',
    customerEmail: order.customer_email || 'customer@asterra.store',
    customerPhone: order.customer_whatsapp || '081234567890',
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
