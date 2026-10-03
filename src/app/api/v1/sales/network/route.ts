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
    const networkData = AffiliateService.getTeamDataForPartner(partner.code);

    return NextResponse.json({
      success: true,
      data: networkData,
    });
  } catch (error: unknown) {
    console.error('Error in sales /network API:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat data bonus tim dan teman.' },
      { status: 500 }
    );
  }
}
