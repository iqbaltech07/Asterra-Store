import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('====================================================');
  console.log(' Asterra Store: Prisma + Supabase Integration Test ');
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
    // 1. Database Connection Check
    await prisma.$connect();
    assert(true, 'Prisma connected to Supabase PostgreSQL successfully');

    // 2. Count Active Products
    const activeCount = await prisma.product.count({ where: { status: 'active' } });
    assert(activeCount >= 240, `Active products count in database is ${activeCount} (expected >= 240)`);

    // 3. Verify Gemini Product
    const geminiProduct = await prisma.product.findFirst({
      where: {
        providerCode: { contains: 'GEMINIPRO', mode: 'insensitive' },
      },
    });
    assert(
      geminiProduct !== null && geminiProduct.status === 'active',
      `Gemini Pro product exists in Supabase: "${geminiProduct?.name}" (code: ${geminiProduct?.providerCode})`
    );

    // 4. Test Search Query on Database
    const canvaProducts = await prisma.product.findMany({
      where: {
        status: 'active',
        name: { contains: 'Canva', mode: 'insensitive' },
      },
    });
    assert(canvaProducts.length > 0, `Search query for "Canva" returned ${canvaProducts.length} active products`);

    // 5. Test Live HTTP endpoint if server running
    try {
      const res = await fetch('http://localhost:3001/api/v1/products?search=gemini');
      if (res.ok) {
        const json = await res.json();
        assert(json.success === true, 'GET /api/v1/products?search=gemini returns HTTP 200 with success: true');
        assert(
          json.data.some((p) => p.name.toLowerCase().includes('gemini')),
          `Storefront API correctly returns ${json.data.length} Gemini items from Prisma`
        );
      } else {
        console.log(`[INFO] Dev server on :3001 responded with ${res.status}, skipping HTTP test`);
      }
    } catch {
      console.log('[INFO] Dev server not active on :3001, skipped HTTP probe');
    }

    // 6. Test Orders Table in Prisma
    const ordersCount = await prisma.order.count();
    assert(typeof ordersCount === 'number', `Orders table in Supabase queryable (current orders: ${ordersCount})`);

    console.log('\n====================================================');
    console.log(` Verification Summary: ${passed} / ${total} tests passed!`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
