import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, message: 'Kode tidak valid' }, { status: 400 });
    }

    const normalized = code.trim().toUpperCase();
    const partner = await prisma.salesPartner.findUnique({
      where: { code: normalized },
    });

    if (!partner) {
      return NextResponse.json({
        success: false,
        message: 'Kode referral tidak ditemukan',
      });
    }

    await prisma.salesPartner.update({
      where: { code: normalized },
      data: { totalClicks: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      message: 'Klik referral berhasil dicatat',
    });
  } catch (error: unknown) {
    console.error('Error recording click:', error);
    return NextResponse.json({ success: false, message: 'Gagal mencatat klik referral.' }, { status: 500 });
  }
}
