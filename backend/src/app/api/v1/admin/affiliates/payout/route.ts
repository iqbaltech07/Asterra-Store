import { NextRequest, NextResponse } from 'next/server';
import { SalesDbService } from '@/lib/services/sales-db.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { partnerId } = body;

    if (!partnerId || typeof partnerId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'ID mitra sales wajib disertakan.' },
        { status: 400 }
      );
    }

    const result = await SalesDbService.processPayout(partnerId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        partnerId,
        amount: result.amount,
      },
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem saat memproses pencairan komisi.' },
      { status: 500 }
    );
  }
}
