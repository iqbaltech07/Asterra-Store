import { NextRequest, NextResponse } from 'next/server';
import { AffiliateService } from '@/lib/services/affiliate.service';
import { ReferralDiscountService } from '@/lib/services/referral-discount.service';

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

    const partner = await AffiliateService.findByCodeAsync(code.trim().toUpperCase());

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

    // Check discount eligibility if customer details are supplied
    const discountCheck = ReferralDiscountService.checkEligibility({
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
