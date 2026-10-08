import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/services/admin-auth.service';
import { SalesDbService } from '@/lib/services/sales-db.service';

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

    const partner = await SalesDbService.findByEmail(session.email);
    if (!partner) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const networkData = await SalesDbService.getTeamDataForPartner(partner.id);

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
