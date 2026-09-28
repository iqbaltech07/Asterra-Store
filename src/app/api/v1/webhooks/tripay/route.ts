import { NextRequest, NextResponse } from 'next/server';
import { TripayService, TripayCallbackPayload } from '@/lib/services/tripay.service';
import { OrderAdminService } from '@/lib/services/order-admin.service';
import { broadcastOrderEvent } from '@/lib/services/event-bus';

/**
 * POST /api/v1/webhooks/tripay
 * Official Tripay Payment Gateway Callback Webhook
 * Automatically verifies incoming payments and broadcasts real-time SSE events to admin and customer
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-callback-signature');
    const eventType = request.headers.get('x-callback-event');
    console.log('[TripayWebhook] Incoming callback event:', eventType);

    // 1. Signature Verification
    const isSignatureValid = TripayService.verifyCallbackSignature(rawBody, signature);
    const isDev = process.env.NODE_ENV === 'development';

    if (!isSignatureValid && !isDev) {
      return NextResponse.json(
        { success: false, message: 'Invalid callback signature' },
        { status: 401 }
      );
    }

    const payload: TripayCallbackPayload = JSON.parse(rawBody);
    const orderId = payload.merchant_ref;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'merchant_ref is required' },
        { status: 400 }
      );
    }

    const existingOrder = await OrderAdminService.getOrderById(orderId);
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, message: `Order ${orderId} not found` },
        { status: 404 }
      );
    }

    // 2. Handle Payment Status Transition
    if (payload.status === 'PAID') {
      // Idempotency guard: If order is already verified as paid, safely acknowledge duplicate callback
      if (existingOrder.order_status === 'processing' || existingOrder.order_status === 'completed') {
        return NextResponse.json({
          success: true,
          message: `Order ${orderId} is already ${existingOrder.order_status}. Duplicate callback ignored safely.`,
        });
      }

      // Underpayment validation guard: verify paid amount matches or covers expected order total
      if (typeof payload.total_amount === 'number' && payload.total_amount < existingOrder.total_amount) {
        console.warn(
          `[TripayWebhook] Underpayment attempt detected for ${orderId}: received Rp ${payload.total_amount}, required Rp ${existingOrder.total_amount}`
        );
        return NextResponse.json(
          { success: false, message: 'Underpaid amount detected' },
          { status: 400 }
        );
      }

      const updated = await OrderAdminService.updateStatus(
        orderId,
        'processing', // Advances to "Di Proses" after payment is verified
        'tripay_webhook', // Recorded in audit trail
        `[TRIPAY AUTOMATIC] Pembayaran Rp ${payload.total_amount.toLocaleString(
          'id-ID'
        )} via ${payload.payment_method} terverifikasi otomatis (Ref: ${payload.reference}).`,
        {
          tripay_reference: payload.reference,
          payment_method: payload.payment_method,
          amount_received: payload.amount_received,
          total_fee: payload.total_fee,
          paid_at: payload.paid_at ? new Date(payload.paid_at * 1000).toISOString() : new Date().toISOString(),
        }
      );

      // 3. Broadcast real-time SSE event to Admin (sound + toast) and Customer (live stepper advance)
      broadcastOrderEvent({
        type: 'order:payment_verified',
        orderId,
        status: 'processing',
        totalAmount: payload.total_amount,
        customerName: existingOrder.customer_name,
        customerEmail: existingOrder.customer_email,
        paymentMethod: payload.payment_method,
        message: `Pembayaran ${orderId} sebesar Rp ${payload.total_amount.toLocaleString('id-ID')} telah diverifikasi otomatis oleh Tripay!`,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: 'Tripay callback processed successfully',
        order: updated,
      });
    }

    if (payload.status === 'EXPIRED' || payload.status === 'FAILED') {
      const updated = await OrderAdminService.updateStatus(
        orderId,
        'cancelled',
        'tripay_webhook',
        `[TRIPAY AUTOMATIC] Transaksi dibatalkan/kedaluwarsa oleh sistem Tripay (${payload.status}).`
      );

      broadcastOrderEvent({
        type: 'order:status_changed',
        orderId,
        status: 'cancelled',
        message: `Pesanan ${orderId} dibatalkan otomatis oleh gateway Tripay (${payload.status}).`,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: `Tripay status ${payload.status} recorded`,
        order: updated,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Tripay status ${payload.status} acknowledged without state change`,
    });
  } catch (error) {
    console.error('[TripayWebhook] Callback processing error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error processing callback' },
      { status: 500 }
    );
  }
}
