import { NextRequest, NextResponse } from 'next/server';
import { AffiliateService } from '@/lib/services/affiliate.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, valid: false, message: 'Kode referral tidak disertakan.' },
        { status: 400 }
      );
    }

    const partner = AffiliateService.findByCode(code);

    if (!partner) {
      return NextResponse.json({
        success: true,
        valid: false,
        message: 'Kode referral tidak ditemukan di sistem Asterra Store.',
      });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      data: {
        code: partner.code,
        partnerName: partner.name,
        tier: partner.tier,
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
