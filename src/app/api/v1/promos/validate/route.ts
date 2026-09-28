import { NextRequest, NextResponse } from 'next/server';
import { PromoService } from '@/lib/services/promo.service';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

/**
 * POST /api/v1/promos/validate
 * Public endpoint to validate promo code and calculate verified discount server-side
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal, email } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json(
        { success: false, error: 'Silakan masukkan kode promo yang ingin digunakan.' },
        { status: 400 }
      );
    }

    const numericSubtotal = Math.max(0, Number(subtotal) || 0);

    // Resolve user email from body or active session
    let targetEmail = (email && typeof email === 'string' ? email.trim() : '') || null;
    if (!targetEmail) {
      try {
        const session = await auth.api.getSession({
          headers: await headers(),
        });
        if (session?.user?.email) {
          targetEmail = session.user.email;
        }
      } catch {
        // session check optional
      }
    }

    const validation = await PromoService.validatePromo(code, numericSubtotal, targetEmail);

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Kode promo tidak valid.',
          minOrderAmount: validation.minOrderAmount,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error('[PromoValidateAPI] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat memvalidasi kode promo.' },
      { status: 500 }
    );
  }
}
