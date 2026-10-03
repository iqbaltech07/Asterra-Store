import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { AffiliateService } from '@/lib/services/affiliate.service';

export async function GET(_req: NextRequest) {
  try {
    const list = AffiliateService.getAllAffiliates();
    return NextResponse.json({
      success: true,
      data: list,
      total: list.length,
    });
  } catch (error) {
    console.error('Error fetching affiliates:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat daftar mitra sales.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, whatsapp, code, rate, bankName, bankAccount } = body;

    const result = AffiliateService.createPartnerByAdmin({
      name,
      email,
      whatsapp,
      code,
      rate: Number(rate) || 10,
      bankName,
      bankAccount,
    });

    if (!result.success || !result.partner) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    // If password provided, create or update AdminUser for sales portal login
    if (password && typeof password === 'string' && password.length >= 6) {
      try {
        const cleanEmail = result.partner.email.toLowerCase().trim();
        const passwordHash = await bcrypt.hash(password, 10);
        const usernameSlug = `sales-${result.partner.code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

        await prisma.adminUser.upsert({
          where: { email: cleanEmail },
          update: {
            name: result.partner.name,
            role: 'sales',
            passwordHash,
            isActive: true,
          },
          create: {
            username: usernameSlug,
            email: cleanEmail,
            name: result.partner.name,
            passwordHash,
            role: 'sales',
            isActive: true,
          },
        });
      } catch (dbErr) {
        console.error('Error creating admin_user record for admin-added sales partner:', dbErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        data: result.partner,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating affiliate by admin:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem saat menambahkan mitra sales.' },
      { status: 500 }
    );
  }
}

