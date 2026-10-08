import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { AdminAuthService } from '@/lib/services/admin-auth.service';

/**
 * PATCH /api/v1/admin/users/[id]
 * Update administrator account (toggle active/inactive, change name/password/role)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = AdminAuthService.verifyAdminSession(req);
  if (!session.valid) {
    return NextResponse.json(
      { success: false, error: { message: 'Akses ditolak. Sesi admin tidak valid.' } },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const targetAdmin = await prisma.adminUser.findUnique({
      where: { id },
    });

    if (!targetAdmin) {
      return NextResponse.json(
        { success: false, error: { message: 'Admin tidak ditemukan.' } },
        { status: 404 }
      );
    }

    const body = await req.json();
    const updateData: {
      name?: string;
      role?: string;
      isActive?: boolean;
      passwordHash?: string;
    } = {};

    if (typeof body.isActive === 'boolean') {
      // Prevent deactivating the only active admin/superadmin
      if (!body.isActive) {
        const activeCount = await prisma.adminUser.count({
          where: { isActive: true },
        });

        if (activeCount <= 1 && targetAdmin.isActive) {
          return NextResponse.json(
            {
              success: false,
              error: {
                message:
                  'Tidak dapat menonaktifkan admin ini. Minimal harus ada satu akun admin yang aktif.',
              },
            },
            { status: 400 }
          );
        }
      }
      updateData.isActive = body.isActive;
    }

    if (body.name !== undefined) {
      updateData.name = String(body.name).trim();
    }

    if (body.role !== undefined) {
      updateData.role = body.role === 'superadmin' ? 'superadmin' : 'admin';
    }

    if (body.password && typeof body.password === 'string' && body.password.length >= 6) {
      updateData.passwordHash = await bcrypt.hash(body.password, 10);
    }

    const updated = await prisma.adminUser.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Admin ${updated.username} berhasil diperbarui.`,
      admin: updated,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: { message: `Gagal memperbarui admin: ${msg}` } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/admin/users/[id]
 * Delete administrator account
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = AdminAuthService.verifyAdminSession(req);
  if (!session.valid) {
    return NextResponse.json(
      { success: false, error: { message: 'Akses ditolak. Sesi admin tidak valid.' } },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const targetAdmin = await prisma.adminUser.findUnique({
      where: { id },
    });

    if (!targetAdmin) {
      return NextResponse.json(
        { success: false, error: { message: 'Admin tidak ditemukan.' } },
        { status: 404 }
      );
    }

    // Safety check: Cannot delete yourself if matching current session
    if (session.id === id || session.email === targetAdmin.email) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang login.' },
        },
        { status: 400 }
      );
    }

    // Safety check: Minimum 1 admin in system
    const totalCount = await prisma.adminUser.count();
    if (totalCount <= 1) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Tidak dapat menghapus admin terakhir pada sistem.' },
        },
        { status: 400 }
      );
    }

    await prisma.adminUser.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Admin ${targetAdmin.username} berhasil dihapus.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: { message: `Gagal menghapus admin: ${msg}` } },
      { status: 500 }
    );
  }
}
