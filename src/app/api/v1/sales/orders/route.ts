import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AdminAuthService } from '@/lib/services/admin-auth.service';
import { SalesDbService } from '@/lib/services/sales-db.service';

export async function GET(req: NextRequest) {
  try {
    const session = AdminAuthService.verifyAdminSession(req);

    if (!session.valid || !session.email) {
      return NextResponse.json(
        { success: false, error: 'Sesi tidak valid.' },
        { status: 401 }
      );
    }

    const partner = await SalesDbService.findByEmail(session.email);
    if (!partner) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { salesPartnerId: partner.id },
          { referralCode: partner.code },
        ],
      },
      include: {
        items: true,
        commission: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const maskedOrders = orders.map((o) => {
      const emailParts = o.customerEmail.split('@');
      const maskedEmail =
        emailParts.length === 2
          ? `${emailParts[0].substring(0, 2)}***@${emailParts[1]}`
          : 'Pelanggan';

      return {
        id: o.id,
        createdAt: o.createdAt.toISOString(),
        customerEmail: maskedEmail,
        customerName: o.customerName ? `${o.customerName.charAt(0)}***` : 'Pelanggan',
        totalAmount: o.totalAmount,
        transactionProfit: o.commission?.transactionProfit || 0,
        status: o.status,
        paymentStatus: o.paymentStatus || (o.status === 'completed' ? 'PAID' : 'PENDING'),
        commission: o.commission?.commissionAmount || 0,
        commissionStatus: o.commission?.status || 'pending',
        holdingUntil: o.commission?.holdingUntil?.toISOString(),
        itemsCount: o.items.length,
        productNames: o.items.map((i) => i.productName).join(', '),
      };
    });

    return NextResponse.json({
      success: true,
      data: maskedOrders,
      total: maskedOrders.length,
    });
  } catch (error: unknown) {
    console.error('Error fetching sales orders:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat daftar pesanan referral.' },
      { status: 500 }
    );
  }
}
