import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AdminAuthService } from '@/lib/services/admin-auth.service';
import { AffiliateService } from '@/lib/services/affiliate.service';

export async function GET(req: NextRequest) {
  try {
    const session = AdminAuthService.verifyAdminSession(req);

    if (!session.valid || !session.email) {
      return NextResponse.json(
        { success: false, error: 'Sesi tidak valid.' },
        { status: 401 }
      );
    }

    const partner = AffiliateService.findOrCreateByEmail(session.email, session.name);
    const creditedIds = partner.creditedOrderIds || [];

    // Query orders matching creditedOrderIds or customerNotes containing referral code
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          creditedIds.length > 0 ? { id: { in: creditedIds } } : undefined,
          { customerNotes: { contains: partner.code, mode: 'insensitive' } },
        ].filter(Boolean) as any,
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Mask customer email for data privacy
    const maskedOrders = orders.map((o) => {
      const emailParts = o.customerEmail.split('@');
      const maskedEmail =
        emailParts.length === 2
          ? `${emailParts[0].substring(0, 2)}***@${emailParts[1]}`
          : 'Pelanggan';

      const commissionLog = partner.commissionLogs?.find((l) => l.orderId === o.id);
      const commission = commissionLog?.commission ?? Math.round((o.totalAmount * (partner.rate || 10)) / 100);
      const commissionStatus = commissionLog?.status ?? (o.status === 'completed' ? 'final' : o.status === 'refunded' ? 'reversed' : 'pending');
      const holdingUntil = commissionLog?.holdingUntil;

      return {
        id: o.id,
        createdAt: o.createdAt.toISOString(),
        customerEmail: maskedEmail,
        customerName: o.customerName ? `${o.customerName.charAt(0)}***` : 'Pelanggan',
        totalAmount: o.totalAmount,
        status: o.status,
        paymentStatus: o.paymentStatus || (o.status === 'completed' ? 'PAID' : 'PENDING'),
        commission,
        commissionStatus,
        holdingUntil,
        itemsCount: o.items.length,
        productNames: o.items.map((i) => i.productName).join(', '),
      };
    });

    return NextResponse.json({
      success: true,
      data: maskedOrders,
      total: maskedOrders.length,
    });
  } catch (error: any) {
    console.error('Error fetching sales orders:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat daftar pesanan referral.' },
      { status: 500 }
    );
  }
}
