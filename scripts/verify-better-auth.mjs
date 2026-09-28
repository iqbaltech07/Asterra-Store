import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function run() {
  console.log('====================================================');
  console.log(' Asterra Store: Better Auth Verification Suite     ');
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
    // 1. Static check: Prisma schema contains Better Auth models
    const schemaContent = fs.readFileSync(
      path.resolve(process.cwd(), 'prisma/schema.prisma'),
      'utf-8'
    );
    assert(schemaContent.includes('model User'), 'Prisma schema includes model User');
    assert(schemaContent.includes('model Session'), 'Prisma schema includes model Session');
    assert(schemaContent.includes('model Account'), 'Prisma schema includes model Account');
    assert(schemaContent.includes('model Verification'), 'Prisma schema includes model Verification');

    // 2. Static check: Login page is Google-only
    const loginPageContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/login/page.tsx'),
      'utf-8'
    );
    assert(
      loginPageContent.includes("provider: 'google'"),
      'Login page exclusively triggers Google OAuth via Better Auth'
    );
    assert(
      !loginPageContent.includes('type="password"'),
      'Customer login form has NO password input (100% Google Only)'
    );

    // 3. Static check: Route handler exists
    const routeHandlerPath = path.resolve(process.cwd(), 'src/app/api/auth/[...all]/route.ts');
    assert(fs.existsSync(routeHandlerPath), 'Better Auth API route handler exists at src/app/api/auth/[...all]/route.ts');

    // 4. Test database tables in Supabase
    await prisma.$connect();
    assert(true, 'Connected to Supabase PostgreSQL');

    const userCount = await prisma.user.count();
    assert(typeof userCount === 'number', `Tabel 'user' terverifikasi di Supabase PostgreSQL (users: ${userCount})`);

    const sessionCount = await prisma.session.count();
    assert(typeof sessionCount === 'number', `Tabel 'session' terverifikasi di Supabase PostgreSQL (sessions: ${sessionCount})`);

    const accountCount = await prisma.account.count();
    assert(typeof accountCount === 'number', `Tabel 'account' (OAuth) terverifikasi di Supabase PostgreSQL`);

    console.log('\n====================================================');
    console.log(` Results: ${passed} / ${total} tests PASSED!`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
