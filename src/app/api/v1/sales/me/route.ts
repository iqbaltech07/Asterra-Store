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

    let partner = await SalesDbService.findByEmail(session.email);
    if (!partner) {
      const codeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const cleanPrefix = (session.name || session.email).split(' ')[0].replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'SALES';
      const code = `AST-${cleanPrefix}-${codeSuffix}`;

      partner = await SalesDbService.findOrCreatePartner({
        code,
        email: session.email,
        name: session.name,
      });
    }

    if (!partner) {
      return NextResponse.json(
        { success: false, message: 'Gagal membuat atau menemukan profil mitra sales.' },
        { status: 500 }
      );
    }

    const stats = await SalesDbService.getPartnerStats(partner.id);

    // Map to frontend expected fields
    const profile = {
      ...partner,
      totalOrders: stats.totalTransactions,
      totalRevenue: stats.totalCommission + stats.totalBonus,
      unpaidCommission: stats.availableAmount,
      pendingCommission: stats.pendingAmount,
      paidCommission: stats.totalCommission + stats.totalBonus - stats.availableAmount - stats.pendingAmount,
      networkCommission: stats.totalBonus,
      role: session.role || 'sales',
    };

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error: unknown) {
    console.error('Error in sales /me API:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat profil mitra sales.' },
      { status: 500 }
    );
  }
}
