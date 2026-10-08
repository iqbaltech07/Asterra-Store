import { NextRequest, NextResponse } from 'next/server';
import { SalesDbService } from '@/lib/services/sales-db.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, valid: false, message: 'Kode referral tidak disertakan.' },
        { status: 400 }
      );
    }

    const partner = await SalesDbService.findByCode(code.trim().toUpperCase());

    if (!partner) {
      return NextResponse.json({
        success: true,
        valid: false,
        message: 'Kode referral tidak ditemukan di sistem Asterra Store.',
      });
    }

    if (partner.status === 'suspended') {
      return NextResponse.json({
        success: true,
        valid: false,
        message: 'Kode referral mitra sedang tidak aktif (ditangguhkan).',
      });
    }

    const discountCheck = await SalesDbService.checkReferralDiscountEligibility({
      referralCode: partner.code,
      customerEmail: email || undefined,
      customerPhone: phone || undefined,
    });

    return NextResponse.json({
      success: true,
      valid: true,
      data: {
        code: partner.code,
        partnerName: partner.name,
        tier: partner.tier,
        discountEligible: discountCheck.eligible,
        discountAmount: discountCheck.discountAmount,
        discountReason: discountCheck.reason,
      },
      message: `Kode referral valid! Mitra pengajak: ${partner.name}`,
    });
  } catch (error) {
    console.error('Error in validate referral API:', error);
    return NextResponse.json(
      { success: false, valid: false, message: 'Gagal memvalidasi kode referral.' },
      { status: 500 }
    );
  }
}
