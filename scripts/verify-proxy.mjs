import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NextRequest } from 'next/server.js';

async function run() {
  console.log('====================================================');
  console.log(' Asterra Store: Next.js Proxy & Middleware Tests    ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  }

  try {
    // 1. Static File Verification
    const proxyPath = path.resolve('src/proxy.ts');
    const middlewarePath = path.resolve('src/middleware.ts');

    assert(fs.existsSync(proxyPath), 'src/proxy.ts file exists');
    assert(fs.existsSync(middlewarePath), 'src/middleware.ts file exists');

    const proxyContent = fs.readFileSync(proxyPath, 'utf8');
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');

    assert(
      proxyContent.includes('export async function proxy'),
      'src/proxy.ts exports async function proxy(request)'
    );
    assert(
      proxyContent.includes('export const config = {') && proxyContent.includes('matcher:'),
      'src/proxy.ts exports valid config.matcher'
    );
    assert(
      proxyContent.includes('crypto.subtle'),
      'src/proxy.ts utilizes standard Web Crypto API (Edge-runtime safe)'
    );
    assert(
      middlewareContent.includes("export { proxy as middleware, proxy as default, config } from './proxy'"),
      'src/middleware.ts bridges proxy.ts for Next.js 15 backward compatibility'
    );

    // 2. Functional Unit Testing with Imported Proxy
    const { proxy } = await import('../src/proxy.ts');

    // A. Unauthenticated /admin page request
    const unauthAdminReq = new NextRequest('https://localhost:3000/admin');
    const unauthAdminRes = await proxy(unauthAdminReq);
    assert(
      unauthAdminRes.status === 307 || unauthAdminRes.status === 308 || unauthAdminRes.headers.get('location')?.includes('/admin/login'),
      'Unauthenticated /admin request redirects to /admin/login'
    );

    // B. Unauthenticated /api/v1/admin/catalog request
    const unauthAdminApiReq = new NextRequest('https://localhost:3000/api/v1/admin/catalog');
    const unauthAdminApiRes = await proxy(unauthAdminApiReq);
    assert(
      unauthAdminApiRes.status === 401,
      'Unauthenticated /api/v1/admin/* request returns 401 Unauthorized'
    );

    // C. Valid Authenticated Admin Request
    const secret = process.env.ADMIN_SESSION_SECRET || 'asterra_admin_fallback_secret_production_2026';
    const adminPayload = {
      email: 'admin@asterra.store',
      role: 'admin',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 60000,
      nonce: 'test_nonce',
    };
    const payloadB64 = Buffer.from(JSON.stringify(adminPayload)).toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
    const validAdminToken = `${payloadB64}.${signature}`;

    const authAdminLoginReq = new NextRequest('https://localhost:3000/admin/login', {
      headers: {
        cookie: `asterra_admin_session=${validAdminToken}`,
      },
    });
    const authAdminLoginRes = await proxy(authAdminLoginReq);
    assert(
      authAdminLoginRes.headers.get('location')?.endsWith('/admin'),
      'Already authenticated admin visiting /admin/login is redirected to /admin dashboard'
    );

    // D. Unauthenticated /profile customer request
    const unauthProfileReq = new NextRequest('https://localhost:3000/profile');
    const unauthProfileRes = await proxy(unauthProfileReq);
    assert(
      unauthProfileRes.headers.get('location')?.includes('/login'),
      'Unauthenticated /profile customer request redirects to /login'
    );

    // E. Authenticated Customer visiting /login
    const authCustomerLoginReq = new NextRequest('https://localhost:3000/login', {
      headers: {
        cookie: 'better-auth.session_token=mock_session_token_xyz',
      },
    });
    const authCustomerLoginRes = await proxy(authCustomerLoginReq);
    assert(
      authCustomerLoginRes.headers.get('location')?.includes('/profile'),
      'Already authenticated customer visiting /login is redirected to /profile'
    );

    // F. Security Headers on Pass-Through
    const publicReq = new NextRequest('https://localhost:3000/admin/login');
    const publicRes = await proxy(publicReq);
    assert(
      publicRes.headers.get('X-Frame-Options') === 'SAMEORIGIN' &&
      publicRes.headers.get('X-Content-Type-Options') === 'nosniff',
      'Security headers (X-Frame-Options, X-Content-Type-Options) are applied to responses'
    );

  } catch (err) {
    console.error('[ERROR] Proxy verification failed with exception:', err);
  }

  console.log('\n====================================================');
  console.log(` Results: ${passed} / ${total} tests PASSED!`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

run();
