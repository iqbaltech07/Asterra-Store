import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/services/admin-auth.service';
import { AffiliateService } from '@/lib/services/affiliate.service';

export async function GET(req: NextRequest) {
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

    return NextResponse.json({
      success: true,
      data: {
        ...partner,
        role: session.role || 'sales',
      },
    });
  } catch (error: any) {
    console.error('Error in sales /me API:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat profil mitra sales.' },
      { status: 500 }
    );
  }
}
