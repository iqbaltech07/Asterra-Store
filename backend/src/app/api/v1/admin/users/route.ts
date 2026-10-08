import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { AdminAuthService } from '@/lib/services/admin-auth.service';

/**
 * GET /api/v1/admin/users
 * List all administrator accounts
 */
export async function GET(req: NextRequest) {
  const session = AdminAuthService.verifyAdminSession(req);
  if (!session.valid) {
    return NextResponse.json(
      { success: false, error: { message: 'Akses ditolak. Sesi admin tidak valid.' } },
      { status: 401 }
    );
  }

  try {
    const admins = await prisma.adminUser.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      admins,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: { message: `Gagal memuat daftar admin: ${msg}` } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/users
 * Create a new administrator account
 */
export async function POST(req: NextRequest) {
  const session = AdminAuthService.verifyAdminSession(req);
  if (!session.valid) {
    return NextResponse.json(
      { success: false, error: { message: 'Akses ditolak. Sesi admin tidak valid.' } },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { username, email, password, name, role = 'admin', isActive = true } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Username, email, dan password wajib diisi.' },
        },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check if username or email already exists
    const existing = await prisma.adminUser.findFirst({
      where: {
        OR: [
          { username: { equals: cleanUsername, mode: 'insensitive' } },
          { email: { equals: cleanEmail, mode: 'insensitive' } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              existing.username.toLowerCase() === cleanUsername
                ? 'Username tersebut sudah terdaftar.'
                : 'Email tersebut sudah terdaftar.',
          },
        },
        { status: 409 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Password minimal 6 karakter.' },
        },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newAdmin = await prisma.adminUser.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        name: name ? String(name).trim() : cleanUsername,
        role: role === 'superadmin' ? 'superadmin' : 'admin',
        isActive: Boolean(isActive),
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Admin berhasil ditambahkan.',
        admin: newAdmin,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: { message: `Gagal menambah admin: ${msg}` } },
      { status: 500 }
    );
  }
}
