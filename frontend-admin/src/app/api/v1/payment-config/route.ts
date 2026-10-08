import { NextResponse } from 'next/server';
import { PaymentConfigService } from '@/lib/services/payment-config.service';

/**
 * GET /api/v1/payment-config
 * Public Payment Configuration Endpoint for Customer Checkout
 * Strictly returns public payment DTO without exposing secret keys or admin data.
 */
export async function GET() {
  try {
    const publicConfig = await PaymentConfigService.getPublicConfig();

    return NextResponse.json({
      success: true,
      data: publicConfig,
    });
  } catch (error) {
    console.error('[PublicPaymentConfigAPI] Failed to fetch public payment config:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal memuat konfigurasi pembayaran publik.',
      },
      { status: 500 }
    );
  }
}
