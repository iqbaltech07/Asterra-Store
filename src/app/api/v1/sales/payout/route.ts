import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/services/admin-auth.service';
import { AffiliateService } from '@/lib/services/affiliate.service';

export async function POST(req: NextRequest) {
  try {
    const session = AdminAuthService.verifyAdminSession(req);

    if (!session.valid || !session.email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sesi login sales tidak valid atau telah berakhir.',
        },
        { status: 401 }
      );
    }

    const partner = AffiliateService.findOrCreateByEmail(session.email, session.name);
    const body = await req.json();
    const { amount, bankName, bankAccount, bankAccountName, notes } = body;

    const result = AffiliateService.submitPayoutRequest(partner.id, {
      amount,
      bankName,
      bankAccount,
      bankAccountName,
      notes,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.request,
    });
  } catch (error: unknown) {
    console.error('Error submitting sales payout request:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem saat mengajukan pencairan dana.' },
      { status: 500 }
    );
  }
}
