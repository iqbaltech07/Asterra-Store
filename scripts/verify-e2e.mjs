const BASE_URL = 'http://localhost:3005';

async function testEndpoint(name, url, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${url}`, options);
    const contentType = res.headers.get('content-type') || '';
    let body;
    if (contentType.includes('application/json')) {
      body = await res.json();
    } else {
      body = await res.text();
    }

    if (!res.ok) {
      console.error(`❌ [FAIL] ${name} (${url}) -> HTTP ${res.status}`);
      console.error(body);
      return { ok: false, status: res.status, body };
    }

    console.log(`✅ [PASS] ${name} (${url}) -> HTTP ${res.status}`);
    return { ok: true, status: res.status, body };
  } catch (err) {
    console.error(`❌ [ERROR] ${name} (${url}) -> ${err.message}`);
    return { ok: false, error: err.message };
  }
}

async function runAllTests() {
  console.log('====================================================');
  console.log('  Asterra Store - End-to-End Verification Pipeline  ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  async function check(name, url, options) {
    total++;
    const res = await testEndpoint(name, url, options);
    if (res.ok) passed++;
    return res;
  }

  // 1. Health check
  await check('Health Check', '/api/health');

  // 2. Auth: Register
  const registerPayload = {
    name: 'Ahmad Iqbal',
    email: `test-${Date.now()}@asterra.store`,
    password: 'Password123!',
  };
  await check('Auth Register', '/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerPayload),
  });

  // 3. Auth: Login
  const loginRes = await check('Auth Login', '/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: registerPayload.email,
      password: registerPayload.password,
    }),
  });

  const token = loginRes?.body?.token || 'test-token';

  // 4. User Profile
  await check('User Profile', '/api/v1/users/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });

  // 5. Products Catalog
  const catalogRes = await check('Products Catalog (All)', '/api/v1/products');
  if (catalogRes?.body?.data?.length > 0) {
    console.log(`   ℹ Found ${catalogRes.body.data.length} products in catalog.`);
  }

  // 6. Products Search & Filter
  await check('Products Search (Canva)', '/api/v1/products?search=canva');
  await check('Products Filter (AI Tools)', '/api/v1/products?category=AI+Tools');
  await check('Products Sort (Price Asc)', '/api/v1/products?sort=price_asc');

  // 7. Product Detail
  const detailRes = await check('Product Detail (prod-001)', '/api/v1/products/prod-001');
  if (detailRes?.body?.data?.durations) {
    console.log(`   ℹ Product has ${detailRes.body.data.durations.length} duration tiers.`);
  }

  // 8. Orders: Create Order
  const orderPayload = {
    items: [
      {
        product_id: 'prod-001-1_month',
        product_name: 'Canva Pro (1 Bulan)',
        unit_price: 75000,
        quantity: 1,
        purchased_details: {
          target_email: registerPayload.email,
          duration: '1_month',
          phone: '081234567890',
        },
      },
    ],
    customer_notes: 'Automated E2E Verification Order',
  };

  const createOrderRes = await check('Create New Order', '/api/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload),
  });

  const createdOrderId = createOrderRes?.body?.order?.id;
  console.log(`   ℹ Created Order ID: ${createdOrderId}`);

  // 9. Orders: Initiate Payment
  if (createdOrderId) {
    const payRes = await check('Initiate Payment (QRIS)', `/api/v1/orders/${createdOrderId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_method: 'qris' }),
    });

    console.log(`   ℹ Transaction ID: ${payRes?.body?.payment?.transaction_id}`);

    // 10. Orders: Confirm Payment Settlement
    await check('Confirm Payment Settlement', `/api/v1/orders/${createdOrderId}/pay`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
  }

  // 11. Orders: List User Orders
  const listOrdersRes = await check('List User Orders', '/api/v1/orders');
  console.log(`   ℹ Total user orders: ${listOrdersRes?.body?.pagination?.total_items || 0}`);

  // 12. Frontend HTML Route Rendering
  await check('Frontend: Home Page (/)', '/');
  await check('Frontend: Products Catalog (/products)', '/products');
  await check('Frontend: Product Detail (/products/prod-001)', '/products/prod-001');
  await check('Frontend: Checkout Page (/checkout)', '/checkout');
  await check('Frontend: Orders History (/orders)', '/orders');
  await check('Frontend: User Profile (/profile)', '/profile');
  await check('Frontend: Login Page (/login)', '/login');
  await check('Frontend: Register Page (/register)', '/register');

  console.log('\n====================================================');
  console.log(`  E2E Test Results: ${passed} / ${total} Tests Passed (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runAllTests();
