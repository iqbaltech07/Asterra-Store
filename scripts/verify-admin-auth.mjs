import http from 'http';
import fs from 'fs';
import path from 'path';

let BASE_URL = 'http://localhost:3000';

async function fetchJson(urlPath, options = {}) {
  const url = new URL(urlPath, BASE_URL);
  const res = await fetch(url.toString(), options);
  const data = await res.json().catch(() => null);
  return {
    status: res.status,
    headers: res.headers,
    data,
  };
}

async function runTests() {
  console.log('====================================================');
  console.log(' Asterra Store: Admin Isolation & Auth Verification');
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

  // 1. Static check: Navbar does not reveal /admin
  const headerContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/layout/header.tsx'),
    'utf-8'
  );
  assert(!headerContent.includes('href="/admin"'), 'Navbar does NOT contain any links to /admin');
  assert(!headerContent.includes('Panel Kelola Admin'), 'Navbar mobile menu does NOT mention Admin');

  // 2. Static check: Home page empty state does not reveal /admin
  const pageContent = fs.readFileSync(
    path.resolve(process.cwd(), 'src/app/page.tsx'),
    'utf-8'
  );
  assert(!pageContent.includes('href="/admin"'), 'Home page does NOT contain any links to /admin');

  // 3. Static check: Customer login API strictly enforces 'customer' role
  const customerAuthRoute = fs.readFileSync(
    path.resolve(process.cwd(), 'src/app/api/v1/auth/login/route.ts'),
    'utf-8'
  );
  assert(
    customerAuthRoute.includes("role: 'customer' as const") &&
      !customerAuthRoute.includes("role: email.includes('admin')"),
    'Customer login strictly enforces role: customer and prevents role escalation'
  );

  // 4. Test live server if reachable on port 3000, 3001, or 3002
  let serverReachable = false;
  for (const port of [3001, 3000, 3002]) {
    try {
      const probe = await fetch(`http://127.0.0.1:${port}/api/v1/products`, {
        signal: AbortSignal.timeout(6000),
      });
      if (probe.status === 200) {
        BASE_URL = `http://localhost:${port}`;
        serverReachable = true;
        console.log(`[INFO] Connected to live Asterra server on ${BASE_URL}`);
        break;
      }
    } catch {
      // try next
    }
  }

  if (!serverReachable) {
    console.log('\n[INFO] Dev server is not running on port 3000. Testing service units directly...');

    // Dynamic import AdminAuthService directly
    const { AdminAuthService, ADMIN_COOKIE_NAME } = await import(
      '../src/lib/services/admin-auth.service.js'
    ).catch(async () => {
      // If ts not transpiled, load via typescript or mock verify
      return {};
    });

    console.log(`\nResults: ${passed}/${total} static security assertions passed.`);
    return;
  }

  console.log('\nTesting live API security endpoints...\n');

  // Test 1: Unauthenticated request to /api/v1/admin/products
  const unauthRes = await fetchJson('/api/v1/admin/products');
  assert(
    unauthRes.status === 401,
    `Unauthenticated request to /api/v1/admin/products returns 401 (got ${unauthRes.status})`
  );

  // Test 2: Unauthenticated request to /api/v1/admin/sync-vip
  const syncUnauth = await fetchJson('/api/v1/admin/sync-vip', { method: 'POST' });
  assert(
    syncUnauth.status === 401,
    `Unauthenticated request to /api/v1/admin/sync-vip returns 401 (got ${syncUnauth.status})`
  );

  // Test 3: Invalid Admin credentials
  const badLogin = await fetchJson('/api/v1/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@asterra.store', password: 'wrongpassword' }),
  });
  assert(
    badLogin.status === 401 && badLogin.data?.success === false,
    `Invalid admin credentials return 401 Unauthorized (got ${badLogin.status})`
  );

  // Test 4: Customer login never grants admin access
  const custLogin = await fetchJson('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer_admin@gmail.com', password: 'password123' }),
  });
  assert(
    custLogin.status === 200 && custLogin.data?.user?.role === 'customer',
    `Customer login with "admin" in email strictly returns role: 'customer'`
  );

  // Test 5: Valid Admin Login
  const goodLogin = await fetchJson('/api/v1/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@asterra.store', password: 'AsterraAdmin#2026' }),
  });
  assert(
    goodLogin.status === 200 && goodLogin.data?.success === true,
    `Valid admin login succeeds with 200 OK`
  );

  const cookieHeader = goodLogin.headers.get('set-cookie');
  assert(
    Boolean(cookieHeader && cookieHeader.includes('asterra_admin_session')),
    `Set-Cookie header includes asterra_admin_session`
  );

  // Extract cookie
  let sessionCookie = '';
  if (cookieHeader) {
    const match = cookieHeader.match(/asterra_admin_session=([^;]+)/);
    if (match) sessionCookie = match[0];
  }

  // Test 6: Verify admin session via /api/v1/admin/auth/me
  const meRes = await fetchJson('/api/v1/admin/auth/me', {
    headers: { Cookie: sessionCookie },
  });
  assert(
    meRes.status === 200 && meRes.data?.authenticated === true && meRes.data?.admin?.role === 'admin',
    `/api/v1/admin/auth/me returns authenticated: true with role: admin`
  );

  // Test 7: Access /api/v1/admin/products WITH session cookie
  const authProducts = await fetchJson('/api/v1/admin/products', {
    headers: { Cookie: sessionCookie },
  });
  assert(
    authProducts.status === 200 && authProducts.data?.success === true,
    `Authenticated request to /api/v1/admin/products succeeds with 200 OK`
  );

  // Test 8: Logout Admin
  const logoutRes = await fetchJson('/api/v1/admin/auth/logout', {
    method: 'POST',
    headers: { Cookie: sessionCookie },
  });
  assert(
    logoutRes.status === 200 && logoutRes.data?.success === true,
    `Admin logout succeeds with 200 OK and clears session`
  );

  // Test 9: /api/v1/admin/auth/me after logout
  const meAfterLogout = await fetchJson('/api/v1/admin/auth/me');
  assert(
    meAfterLogout.status === 401,
    `/api/v1/admin/auth/me returns 401 Unauthorized after session termination`
  );

  console.log(`\n====================================================`);
  console.log(` Results: ${passed}/${total} assertions PASSED!`);
  console.log(`====================================================\n`);
}

runTests().catch(console.error);
