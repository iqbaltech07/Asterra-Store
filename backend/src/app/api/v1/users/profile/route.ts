import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi tidak ditemukan atau telah berakhir.' },
        { status: 401 }
      );
    }

    const { user } = session;
    const userEmail = (user.email || '').trim();

    // Fetch user orders from database (case-insensitive)
    const rawOrders = await prisma.order.findMany({
      where: {
        customerEmail: {
          equals: userEmail,
          mode: 'insensitive',
        },
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    // Ensure each order has populated items (no empty displays)
    const orders = rawOrders.map((o) => {
      const items =
        o.items && o.items.length > 0
          ? o.items
          : [
              {
                id: `item-${o.id}-default`,
                orderId: o.id,
                productId: 'prod-digital',
                productName: 'Lisensi Layanan Digital',
                price: o.totalAmount,
                quantity: 1,
                targetEmail: o.customerEmail,
                targetPhone: o.customerWhatsapp,
                duration: 'standard',
              },
            ];
      return {
        ...o,
        items,
      };
    });

    const latestPhone =
      orders.find((o: { customerWhatsapp: string | null }) => Boolean(o.customerWhatsapp))
        ?.customerWhatsapp || null;

    const profileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image || null,
      role: user.role || 'customer',
      emailVerified: user.emailVerified,
      phone: latestPhone,
      createdAt: user.createdAt,
      orders,
      stats: {
        totalOrders: orders.length,
        completedOrders: orders.filter(
          (o: { status: string }) => o.status === 'completed' || o.status === 'paid'
        ).length,
        pendingOrders: orders.filter((o: { status: string }) => o.status === 'pending').length,
      },
    };

    return NextResponse.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error('[ProfileAPI] Error fetching profile:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data profil pengguna.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi tidak ditemukan atau telah berakhir.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nama pengguna tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() },
    });

    // If phone is provided, update orders customerWhatsapp for consistency
    if (phone && typeof phone === 'string' && phone.trim().length > 0) {
      await prisma.order.updateMany({
        where: {
          customerEmail: {
            equals: (session.user.email || '').trim(),
            mode: 'insensitive',
          },
        },
        data: { customerWhatsapp: phone.trim() },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: phone?.trim() || null,
      },
    });
  } catch (error) {
    console.error('[ProfileAPI] Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui data profil pengguna.' },
      { status: 500 }
    );
  }
}
