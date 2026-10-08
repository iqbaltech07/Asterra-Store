import { NextRequest, NextResponse } from 'next/server';
import { PromoService } from '@/lib/services/promo.service';

/**
 * GET /api/v1/admin/promos
 * Retrieve all promo codes and overview metrics for admin dashboard
 */
export async function GET() {
  try {
    const promos = await PromoService.getAllPromos();
    const metrics = await PromoService.getPromoMetrics();

    return NextResponse.json({
      success: true,
      data: promos,
      metrics,
    });
  } catch (error) {
    console.error('[AdminPromosAPI] Error fetching promos:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil daftar kode promo.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/promos
 * Create or generate a new promo code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscount,
      minOrderAmount,
      usageLimit,
      perUserLimit,
      expiresAt,
      isActive,
      autoGenerate,
    } = body;

    let targetCode = (code || '').trim().toUpperCase();
    if (autoGenerate || !targetCode) {
      targetCode = PromoService.generateRandomCode('AST');
    }

    if (!targetCode || targetCode.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Kode promo minimal 3 karakter alfanumerik.' },
        { status: 400 }
      );
    }

    if (discountType !== 'percentage' && discountType !== 'fixed') {
      return NextResponse.json(
        { success: false, error: 'Tipe diskon harus berupa "percentage" (%) atau "fixed" (Rp).' },
        { status: 400 }
      );
    }

    const val = Number(discountValue);
    if (isNaN(val) || val <= 0) {
      return NextResponse.json(
        { success: false, error: 'Nilai diskon harus berupa angka lebih besar dari 0.' },
        { status: 400 }
      );
    }

    if (discountType === 'percentage' && val > 100) {
      return NextResponse.json(
        { success: false, error: 'Diskon persentase tidak boleh melebihi 100%.' },
        { status: 400 }
      );
    }

    const newPromo = await PromoService.createPromo({
      code: targetCode,
      description: description || null,
      discountType,
      discountValue: val,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      perUserLimit: perUserLimit ? Number(perUserLimit) : 1,
      expiresAt: expiresAt || null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Kode promo "${newPromo.code}" berhasil dibuat.`,
        data: newPromo,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
