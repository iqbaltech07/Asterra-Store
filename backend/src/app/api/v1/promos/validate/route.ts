import { NextRequest, NextResponse } from 'next/server';
import { PromoService } from '@/lib/services/promo.service';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/v1/promos/validate
 * Public endpoint to validate promo code and calculate verified discount server-side with Floor Price Protection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal, email, user_email, items, referral_discount } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json(
        { success: false, error: 'Silakan masukkan kode promo yang ingin digunakan.' },
        { status: 400 }
      );
    }

    const numericSubtotal = Math.max(0, Number(subtotal) || 0);

    // Resolve user email from body or active session
    const rawEmail = email || user_email;
    let targetEmail = (rawEmail && typeof rawEmail === 'string' ? rawEmail.trim() : '') || null;
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

    // Floor Price Protection (Anti-Loss Guard)
    let floorPriceMaxDiscount: number | null = null;
    if (Array.isArray(items) && items.length > 0) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const productIds = items.map((i: any) => i.product_id || i.id).filter(Boolean);
        const dbProducts = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, providerPrice: true, price: true },
        });
        const productMap = new Map(dbProducts.map((p) => [p.id, p]));

        let totalCOGS = 0;
        let totalRaw = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const item of items) {
          const pid = item.product_id || item.id;
          const p = productMap.get(pid);
          const qty = Math.max(1, Number(item.quantity) || 1);
          const unitPrice = p?.price || Number(item.price) || 0;
          const unitCost = p?.providerPrice && p.providerPrice > 0 ? p.providerPrice : Math.round(unitPrice * 0.85);
          totalCOGS += unitCost * qty;
          totalRaw += unitPrice * qty;
        }

        const effectiveSubtotal = totalRaw > 0 ? totalRaw : numericSubtotal;
        const rawMargin = Math.max(0, effectiveSubtotal - totalCOGS);
        const minProfitTarget = rawMargin <= 3000 ? Math.round(rawMargin * 0.4) : 1500;
        const maxAllowed = Math.max(0, rawMargin - minProfitTarget);
        const refDiscount = Math.max(0, Number(referral_discount) || 0);
        floorPriceMaxDiscount = Math.max(0, maxAllowed - refDiscount);
      } catch (err) {
        console.warn('[PromoValidateAPI] Floor price check error:', err);
      }
    }

    const validation = await PromoService.validatePromo(
      code,
      numericSubtotal,
      targetEmail,
      floorPriceMaxDiscount !== null ? { maxAllowedDiscount: floorPriceMaxDiscount } : undefined
    );

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
