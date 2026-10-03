import { NextRequest, NextResponse } from 'next/server';
import { AffiliateService } from '@/lib/services/affiliate.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, message: 'Kode tidak valid' }, { status: 400 });
    }

    const recorded = AffiliateService.recordClick(code);

    return NextResponse.json({
      success: recorded,
      message: recorded ? 'Klik referral berhasil dicatat' : 'Kode referral tidak ditemukan',
    });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
