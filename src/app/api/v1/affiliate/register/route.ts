import { NextRequest, NextResponse } from 'next/server';
import { AffiliateService } from '@/lib/services/affiliate.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, whatsapp, referralCode, customCode } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Nama lengkap wajib diisi.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email aktif wajib diisi.' },
        { status: 400 }
      );
    }

    if (!whatsapp || typeof whatsapp !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Nomor WhatsApp wajib diisi.' },
        { status: 400 }
      );
    }

    const result = AffiliateService.registerSalesPartner({
      name,
      email,
      whatsapp,
      referralCode: typeof referralCode === 'string' ? referralCode : undefined,
      customCode: typeof customCode === 'string' ? customCode : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        data: result.partner,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in affiliate register API:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem saat mendaftar.' },
      { status: 500 }
    );
  }
}
