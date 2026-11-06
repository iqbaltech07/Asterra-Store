import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextRequest, NextResponse } from 'next/server';

const handler = toNextJsHandler(auth);

function handleError(method: string, err: unknown) {
  console.error(`[BetterAuth:${method}:Error]`, err);
  const errorObj = err as { message?: string; code?: string; name?: string; status?: number; stack?: string } | null;
  const errorMessage = errorObj?.message || 'Authentication error';
  const errorCode = errorObj?.code || 'AUTH_INTERNAL_ERROR';
  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      code: errorCode,
      name: errorObj?.name,
      details: process.env.NODE_ENV !== 'production' ? String(errorObj?.stack || err) : undefined,
    },
    { status: errorObj?.status && typeof errorObj.status === 'number' ? errorObj.status : 500 }
  );
}

export async function POST(req: NextRequest) {
  try {
    return await handler.POST(req);
  } catch (err: unknown) {
    return handleError('POST', err);
  }
}

export async function GET(req: NextRequest) {
  try {
    return await handler.GET(req);
  } catch (err: unknown) {
    return handleError('GET', err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    return await handler.PATCH(req);
  } catch (err: unknown) {
    return handleError('PATCH', err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    return await handler.PUT(req);
  } catch (err: unknown) {
    return handleError('PUT', err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    return await handler.DELETE(req);
  } catch (err: unknown) {
    return handleError('DELETE', err);
  }
}
