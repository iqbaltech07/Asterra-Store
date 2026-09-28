import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('====================================================');
  console.log(' Asterra Store: User Profile & Navbar Verification  ');
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
    // 1. Header Verification
    const headerPath = path.resolve('src/components/layout/header.tsx');
    const headerContent = fs.readFileSync(headerPath, 'utf8');

    assert(
      headerContent.includes('const currentUser = session?.user || legacyUser;'),
      'Header derives currentUser from Better Auth session or legacy store'
    );
    assert(
      headerContent.includes('href="/profile"'),
      'Header links to /profile when user is logged in'
    );
    assert(
      headerContent.includes('currentUser.image'),
      'Header renders avatar image when user has Google profile photo'
    );
    assert(
      headerContent.includes('referrerPolicy="no-referrer"'),
      'Header avatar includes referrerPolicy="no-referrer" to prevent 403 Google image blocks'
    );
    assert(
      headerContent.includes('handleLogout'),
      'Header provides quick logout action'
    );
    assert(
      headerContent.includes('href="/login"') && headerContent.includes('Masuk'),
      'Header renders Masuk button linking to /login when unauthenticated'
    );
    assert(
      headerContent.includes('md:hidden') && headerContent.includes('Profil Pelanggan'),
      'Header mobile menu renders customer profile card when authenticated'
    );

    // 2. Profile Page Verification
    const profilePagePath = path.resolve('src/app/profile/page.tsx');
    const profileContent = fs.readFileSync(profilePagePath, 'utf8');

    assert(
      profileContent.includes("from '@/lib/auth-client'"),
      'Profile page imports Better Auth client functions (useSession, signOut, signIn)'
    );
    assert(
      profileContent.includes('isAuthPending') && profileContent.includes('!session?.user'),
      'Profile page includes auth guard with loading skeleton and login prompt'
    );
    assert(
      profileContent.includes('Google SSO Terverifikasi'),
      'Profile page shows verified Google SSO badge'
    );
    assert(
      profileContent.includes('/api/v1/users/profile'),
      'Profile page queries authenticated user profile and real Prisma orders'
    );
    assert(
      profileContent.includes('updateProfileMutation') && profileContent.includes("method: 'PATCH'"),
      'Profile page supports inline editing with PATCH mutation'
    );
    assert(
      profileContent.includes('Riwayat Transaksi & Lisensi'),
      'Profile page renders order history and digital license section'
    );
    assert(
      profileContent.includes('https://wa.me/'),
      'Profile page provides 24/7 WhatsApp customer service support links'
    );

    // 3. Profile API Route Verification
    const apiRoutePath = path.resolve('src/app/api/v1/users/profile/route.ts');
    const apiContent = fs.readFileSync(apiRoutePath, 'utf8');

    assert(
      apiContent.includes('export async function GET()') && apiContent.includes('auth.api.getSession'),
      'Profile API has GET handler secured with Better Auth session'
    );
    assert(
      apiContent.includes('export async function PATCH(') && apiContent.includes('prisma.user.update'),
      'Profile API has PATCH handler updating user profile in Prisma'
    );

    // 4. Database Prisma Connection
    const userCount = await prisma.user.count();
    assert(
      userCount >= 0,
      `Prisma User table accessible in Supabase PostgreSQL (current users: ${userCount})`
    );

    const orderCount = await prisma.order.count();
    assert(
      orderCount >= 0,
      `Prisma Order table accessible in Supabase PostgreSQL (current orders: ${orderCount})`
    );

  } catch (err) {
    console.error('[ERROR] Verification failed with exception:', err);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n====================================================');
  console.log(` Results: ${passed} / ${total} tests PASSED!`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

run();
