import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { AffiliateService } from '@/lib/services/affiliate.service';

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

    // Register into Affiliate service
    const result = AffiliateService.registerSalesPartner({
      name: cleanName,
      email: cleanEmail,
      whatsapp: whatsapp.trim(),
      referralCode: typeof referralCode === 'string' ? referralCode : undefined,
      customCode: typeof customCode === 'string' ? customCode : undefined,
    });

    if (!result.success || !result.partner) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    // Create or update AdminUser in database with role: 'sales'
    const passwordHash = await bcrypt.hash(password, 10);
    const usernameSlug = `sales-${result.partner.code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    try {
      await prisma.adminUser.upsert({
        where: { email: cleanEmail },
        update: {
          name: cleanName,
          role: 'sales',
          passwordHash,
          isActive: true,
        },
        create: {
          username: usernameSlug,
          email: cleanEmail,
          name: cleanName,
          passwordHash,
          role: 'sales',
          isActive: true,
        },
      });
    } catch (dbErr) {
      console.error('Error creating admin_user record for sales partner:', dbErr);
      // Fallback: don't fail whole request if DB user already exists, but log
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
