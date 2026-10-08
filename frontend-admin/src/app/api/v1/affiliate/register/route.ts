import { NextRequest, NextResponse } from 'next/server';
import { SalesDbService } from '@/lib/services/sales-db.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, whatsapp, password, referralCode, customCode } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return NextResponse.json(
        { success: false, message: 'Nama lengkap wajib diisi minimal 3 karakter.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Alamat email aktif tidak valid.' },
        { status: 400 }
      );
    }

    if (!whatsapp || typeof whatsapp !== 'string' || whatsapp.trim().length < 9) {
      return NextResponse.json(
        { success: false, message: 'Nomor WhatsApp wajib diisi minimal 9 digit.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Kata sandi akun sales wajib diisi minimal 6 karakter.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    const result = await SalesDbService.registerSalesPartner({
      name: cleanName,
      email: cleanEmail,
      whatsapp: whatsapp.trim(),
      password,
      referredByCode: typeof referralCode === 'string' ? referralCode : undefined,
      customCode: typeof customCode === 'string' ? customCode : undefined,
    });

    if (!result.success || !result.partner) {
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
  } catch (error: unknown) {
    console.error('Error in affiliate register API:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem saat mendaftar.' },
      { status: 500 }
    );
  }
}
