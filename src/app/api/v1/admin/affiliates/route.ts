import { NextRequest, NextResponse } from 'next/server';
import { AffiliateService } from '@/lib/services/affiliate.service';

export async function GET(req: NextRequest) {
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
    const { name, email, whatsapp, code, rate, bankName, bankAccount } = body;

    const result = AffiliateService.createPartnerByAdmin({
      name,
      email,
      whatsapp,
      code,
      rate: Number(rate) || 10,
      bankName,
      bankAccount,
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
  } catch (error) {
    console.error('Error creating affiliate by admin:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem saat menambahkan mitra sales.' },
      { status: 500 }
    );
  }
}

