import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Email dan kata sandi wajib diisi.' } },
        { status: 400 }
      );
    }

    // Standard customer user response - strictly customer role
    const mockUser = {
      id: `usr-${Date.now().toString(36)}`,
      name: email.split('@')[0],
      email,
      role: 'customer' as const,
    };

    const mockToken = `ast_jwt_${Buffer.from(JSON.stringify({ id: mockUser.id, email })).toString('base64')}`;

    return NextResponse.json({
      success: true,
      message: 'Login berhasil.',
      user: mockUser,
      token: mockToken,
    });
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server saat login.' } },
      { status: 500 }
    );
  }
}
