import { NextRequest, NextResponse } from 'next/server';
import { OrderAdminService } from '@/lib/services/order-admin.service';
import { broadcastOrderEvent } from '@/lib/services/event-bus';

/**
 * POST /api/v1/admin/orders/simulate-tripay
 * Direct Tripay Webhook Simulator for testing real-time sound, SSE, and auto-verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, payment_method = 'QRIS' } = body;

    if (!order_id) {
      return NextResponse.json(
        { success: false, error: 'order_id wajib diisi' },
        { status: 400 }
      );
    }

    const order = await OrderAdminService.getOrderById(order_id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: `Pesanan ${order_id} tidak ditemukan.` },
        { status: 404 }
      );
    }

    const ref = `DEV-TRIPAY-${Date.now().toString(36).toUpperCase()}`;

    const updated = await OrderAdminService.updateStatus(
      order_id,
      'processing',
      'tripay_webhook',
      `[SIMULASI TRIPAY] Pembayaran otomatis via Tripay (${payment_method.toUpperCase()}) Rp ${order.total_amount.toLocaleString(
        'id-ID'
      )} diverifikasi otomatis.`,
      {
        simulated: true,
        gateway: 'tripay',
        reference: ref,
        payment_method,
        amount: order.total_amount,
        paid_at: new Date().toISOString(),
      }
    );

    // Broadcast Realtime SSE Event
    broadcastOrderEvent({
      type: 'order:payment_verified',
      orderId: order_id,
      status: 'processing',
      totalAmount: order.total_amount,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      paymentMethod: payment_method,
      message: `[Simulasi Tripay] Pembayaran pesanan ${order_id} (Rp ${order.total_amount.toLocaleString('id-ID')}) terverifikasi otomatis!`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Simulasi pembayaran Tripay untuk ${order_id} berhasil diverifikasi.`,
      order: updated,
    });
  } catch (error) {
    console.error('[SimulateTripay] Error simulating Tripay payment:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menjalankan simulasi pembayaran Tripay.' },
      { status: 500 }
    );
  }
}
