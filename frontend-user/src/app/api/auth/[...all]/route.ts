import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextRequest, NextResponse } from 'next/server';

const handler = toNextJsHandler(auth);

function sanitizeResponseCookies(res: Response): Response {
  // Purge legacy domain-level cookies so they cannot collide with host-only cookies in browsers
  if (process.env.NODE_ENV === 'production') {
    const expiredDomainSuffix = '; Domain=.asterrastore.biz.id; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; HttpOnly; SameSite=Lax';
    res.headers.append('Set-Cookie', `__Secure-better-auth.session_token=${expiredDomainSuffix}`);
    res.headers.append('Set-Cookie', `better-auth.session_token=${expiredDomainSuffix}`);
    res.headers.append('Set-Cookie', `__Secure-better-auth.session_data=${expiredDomainSuffix}`);
    res.headers.append('Set-Cookie', `better-auth.session_data=${expiredDomainSuffix}`);
  }
  return res;
}

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
    const res = await handler.POST(req);
    return sanitizeResponseCookies(res);
  } catch (err: unknown) {
    return handleError('POST', err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const res = await handler.GET(req);
    return sanitizeResponseCookies(res);
  } catch (err: unknown) {
    return handleError('GET', err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const res = await handler.PATCH(req);
    return sanitizeResponseCookies(res);
  } catch (err: unknown) {
    return handleError('PATCH', err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const res = await handler.PUT(req);
    return sanitizeResponseCookies(res);
  } catch (err: unknown) {
    return handleError('PUT', err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const res = await handler.DELETE(req);
    return sanitizeResponseCookies(res);
  } catch (err: unknown) {
    return handleError('DELETE', err);
  }
}
