import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          error: { code: 'VALIDATION_ERROR', message: 'Nama, email, dan kata sandi wajib diisi.' },
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: { code: 'INVALID_PASSWORD', message: 'Kata sandi minimal 8 karakter.' } },
        { status: 400 }
      );
    }

    // Mock successful creation for frontend auth flow
    const newUser = {
      id: `usr-${Date.now().toString(36)}`,
      name,
      email,
      role: 'customer' as const,
      createdAt: new Date().toISOString(),
    };

    const mockToken = `ast_jwt_${Buffer.from(JSON.stringify({ id: newUser.id, email })).toString('base64')}`;

    return NextResponse.json(
      {
        success: true,
        message: 'Registrasi akun berhasil.',
        user: newUser,
        token: mockToken,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json(
      {
        error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server saat registrasi.' },
      },
      { status: 500 }
    );
  }
}
