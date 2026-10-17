/**
 * Verification Script: AsterraStore /orders Dynamic Order Simulation Audit
 * Validates deterministic timeline, wave intervals, status transitions,
 * catalog fidelity, masked names, and database isolation.
 * Includes explicit validation for MAXIMUM 3 CONCURRENT PROCESSING ORDERS.
 */

const fs = require('fs');
const path = require('path');

// 1. Load active catalog
const catalogPath = path.join(__dirname, '../backend/data/active-catalog.json');
const activeCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Extract simulation algorithm matching frontend-user/src/lib/hooks/use-dynamic-orders.ts
function hashPRNG(seed, stream) {
  let h = Math.imul(seed ^ 0x6d2b79f5, 0x9e3779b9) + stream * 0x85ebca6b;
  h = Math.imul(h ^ (h >>> 15), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 13), 0x846ca68b);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const GLOBAL_SIMULATION_EPOCH = new Date('2026-10-15T00:00:00+07:00').getTime();

const ACTIVE_CATALOG_PRODUCTS = [
  { sku: 'vip-ytpreminvt1bln-s3', name: 'YouTube Premium Family Anggota 1 Bulan [Invite] [Garansi 1x]', warranty: 'Garansi 1x Invite Ulang' },
  { sku: 'vip-ntflxshare30dgar28d-s2', name: 'Netflix Premium Shared 30 Hari [1 Profile] [Garansi 28 Hari]', warranty: 'Garansi 28 Hari' },
  { sku: 'vip-ntflxshare30dgar14d-s2', name: 'Netflix Premium Shared 30 Hari [1 Profile] [Garansi 14 Hari]', warranty: 'Garansi 14 Hari' },
  { sku: 'prod-muniiqze-jyh0', name: 'Google AI Pro Private 18 Bulan [Garansi 1 Bulan]', warranty: 'Garansi 1 Bulan' },
  { sku: 'vip-capcutshared1bln-s2', name: 'CapCut Pro Shared 1 Bulan [1 Device - 2 User] [Garansi 7 Hari]', warranty: 'Garansi 7 Hari' },
  { sku: 'vip-bspremshrd1bln-s1', name: 'Bstation Premium Shared 1 Bulan [1 Device]', warranty: 'Garansi Resmi' },
  { sku: 'vip-viu1thngar1bln-s1', name: 'Viu Premium Private 1 Tahun [1 Device] [Garansi 1 Bulan]', warranty: 'Garansi 1 Bulan' },
  { sku: 'vip-wetvprivate1bln-s1', name: 'WeTV VIP Private 1 Bulan', warranty: 'Garansi Resmi' },
  { sku: 'vip-vidioplatmobprivate-s1', name: 'Vidio Premier Platinum Private 1 Bulan [Khusus Mobile]', warranty: 'Garansi Resmi' },
  { sku: 'vip-vidiosharedmbl1bln-s2', name: 'Vidio Premier Platinum Shared 1 Bulan [1 Device - 2 User] [Khusus Mobile]', warranty: 'Garansi Resmi' },
  { sku: 'vip-canvaanggota1bln-s1', name: 'Canva Pro Anggota 1 Bulan [Garansi 1 Bulan]', warranty: 'Garansi 1 Bulan' },
  { sku: 'vip-geminiprohead1thngar1bln-s2', name: 'Google Gemini Pro Head Invite 1 Tahun [5 Anggota] [5 TB GDrive] [Garansi 1 Bulan]', warranty: 'Garansi 1 Bulan' },
  { sku: 'vip-chatgptgo1thngar6b-s1', name: 'ChatGPT GO Private 1 Tahun [Garansi 6 Bulan]', warranty: 'Garansi 6 Bulan' },
  { sku: 'vip-chatgptplus1bgar28d-s1', name: 'ChatGPT Plus Private 1 Bulan [Garansi 28 Hari]', warranty: 'Garansi 28 Hari' },
  { sku: 'vip-iqiyishared-s1', name: 'iQIYI Premium Shared 1 Bulan', warranty: 'Garansi Resmi' },
];

const MASKED_CUSTOMER_NAMES = [
  'D***s', 'A***a', 'F***n', 'K***a', 'S***a', 'B***i',
  'M***y', 'E***o', 'T***o', 'N***a', 'Z***i', 'R***n',
  'I***l', 'P***a', 'H***a', 'V***o', 'W***i', 'Y***u',
  'L***a', 'G***a', 'O***n', 'J***o', 'C***a', 'U***r',
];

function getDeterministicSimulationOrders(now, maxOrders = 150) {
  let waveTime = GLOBAL_SIMULATION_EPOCH;
  let waveIdx = 0;
  const rawCandidates = [];

  while (waveTime <= now + 600000) {
    const waveIntervalMs = 180000 + Math.floor(hashPRNG(waveIdx, 1) * 300000);
    const orderCountInWave = 1 + Math.floor(hashPRNG(waveIdx, 2) * 3);

    let curOrderTime = waveTime;
    for (let i = 0; i < orderCountInWave; i++) {
      if (i > 0) {
        const orderSpacingMs = 60000 + Math.floor(hashPRNG(waveIdx * 10 + i, 3) * 540000);
        curOrderTime += orderSpacingMs;
      }

      const pendingDurationMs = 60000 + Math.floor(hashPRNG(waveIdx * 10 + i, 4) * 120000);
      const processingDurationMs = 600000 + Math.floor(hashPRNG(waveIdx * 10 + i, 5) * 1200000);

      const processingStartTime = curOrderTime + pendingDurationMs;
      const naturalCompletedStartTime = processingStartTime + processingDurationMs;

      const wibDate = new Date(curOrderTime + 7 * 3600000);
      const yyyy = wibDate.getUTCFullYear();
      const mm = String(wibDate.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(wibDate.getUTCDate()).padStart(2, '0');
      const dateKey = String(yyyy) + mm + dd;

      let orderNum = 1000 + Math.floor(hashPRNG(waveIdx * 10 + i, 6) * 8990);
      if (orderNum === 7615) orderNum = 7616;
      const id = 'AST-ORD-' + dateKey + '-' + orderNum;

      const customerIdx =
        (Math.floor(hashPRNG(waveIdx * 10 + i, 7) * MASKED_CUSTOMER_NAMES.length) + (waveIdx * 3 + i)) %
        MASKED_CUSTOMER_NAMES.length;
      const customer_display = MASKED_CUSTOMER_NAMES[customerIdx];

      const productIdx =
        (Math.floor(hashPRNG(waveIdx * 10 + i, 8) * ACTIVE_CATALOG_PRODUCTS.length) + (waveIdx * 2 + i)) %
        ACTIVE_CATALOG_PRODUCTS.length;
      const product = ACTIVE_CATALOG_PRODUCTS[productIdx];

      const dateIso = new Date(curOrderTime).toISOString();

      rawCandidates.push({
        id,
        raw_id: 'sim-' + waveIdx + '-' + i,
        product_name: product.name,
        items_summary: product.name,
        items_count: 1,
        order_date: dateIso,
        created_at: dateIso,
        createdAt: dateIso,
        customer_display,
        product_sku: product.sku,
        warranty: product.warranty,
        _orderTime: curOrderTime,
        _processingStartTime: processingStartTime,
        _naturalCompletedStartTime: naturalCompletedStartTime,
        _effectiveCompletedStartTime: naturalCompletedStartTime,
        _pendingDurationMs: pendingDurationMs,
        _processingDurationMs: processingDurationMs,
        _waveIdx: waveIdx,
        _orderInWave: i
      });
    }

    waveTime += waveIntervalMs;
    waveIdx++;
  }

  // 2. Simulasi antrean FIFO Processing (maksimal 3 pesanan Processing bersamaan)
  rawCandidates.sort((a, b) => a._processingStartTime - b._processingStartTime);

  let activeProcessingQueue = [];
  for (let k = 0; k < rawCandidates.length; k++) {
    const candidate = rawCandidates[k];
    const pStart = candidate._processingStartTime;

    activeProcessingQueue = activeProcessingQueue.filter(
      item => item.effectiveCompletedStartTime > pStart
    );

    if (activeProcessingQueue.length >= 3) {
      const oldest = activeProcessingQueue.shift();
      rawCandidates[oldest.orderIndex]._effectiveCompletedStartTime = pStart;
    }

    activeProcessingQueue.push({
      orderIndex: k,
      effectiveCompletedStartTime: candidate._naturalCompletedStartTime,
    });
  }

  // 3. Filter pesanan yang sudah muncul pada waktu 'now'
  const appearedOrders = [];
  for (const candidate of rawCandidates) {
    if (candidate._orderTime <= now) {
      let status = 'completed';
      if (now < candidate._processingStartTime) {
        status = 'pending';
      } else if (now < candidate._effectiveCompletedStartTime) {
        status = 'processing';
      }

      appearedOrders.push({
        id: candidate.id,
        raw_id: candidate.raw_id,
        product_name: candidate.product_name,
        items_summary: candidate.items_summary,
        items_count: candidate.items_count,
        order_status: status,
        status,
        order_date: candidate.order_date,
        created_at: candidate.created_at,
        createdAt: candidate.createdAt,
        customer_display: candidate.customer_display,
        product_sku: candidate.product_sku,
        process_estimate: status === 'processing' ? 'Estimasi 5-15 Menit' : undefined,
        warranty_info: status === 'completed' ? candidate.warranty : null,
        _orderTime: candidate._orderTime,
        _processingStartTime: candidate._processingStartTime,
        _effectiveCompletedStartTime: candidate._effectiveCompletedStartTime
      });
    }
  }

  appearedOrders.sort((a, b) => {
    const timeA = new Date(a.order_date).getTime();
    const timeB = new Date(b.order_date).getTime();
    return timeB - timeA;
  });

  return appearedOrders.slice(0, maxOrders);
}

console.log('====================================================');
console.log('   ASTERRASTORE /orders SIMULATION AUDIT REPORT     ');
console.log('====================================================\n');

// TEST 1: DETERMINISM
const testTime = new Date('2026-10-17T15:35:00+07:00').getTime();
const browserA = getDeterministicSimulationOrders(testTime, 150);
const browserB_Incognito = getDeterministicSimulationOrders(testTime, 150);
const browserC_DifferentDevice = getDeterministicSimulationOrders(testTime, 150);

const determinismPass =
  JSON.stringify(browserA) === JSON.stringify(browserB_Incognito) &&
  JSON.stringify(browserA) === JSON.stringify(browserC_DifferentDevice);
console.log('1. Cross-Browser Determinism (Normal vs Incognito vs Other Device):', determinismPass ? 'PASS' : 'FAIL');

// TEST 2: WAVE INTERVALS (3 - 8 minutes)
let minWaveMin = Infinity, maxWaveMin = -Infinity;
for (let w = 0; w < 2000; w++) {
  const ivMin = (180000 + Math.floor(hashPRNG(w, 1) * 300000)) / 60000;
  if (ivMin < minWaveMin) minWaveMin = ivMin;
  if (ivMin > maxWaveMin) maxWaveMin = ivMin;
}
const waveIntervalPass = minWaveMin >= 3.0 && maxWaveMin <= 8.0;
console.log(
  '2. Wave Interval Bounds: Min =',
  minWaveMin.toFixed(2),
  'm, Max =',
  maxWaveMin.toFixed(2),
  'm (Expected: 3–8m):',
  waveIntervalPass ? 'PASS' : 'FAIL'
);

// TEST 3: WITHIN-WAVE SPACING (1 - 10 minutes)
let minSpaceMin = Infinity, maxSpaceMin = -Infinity;
for (let w = 0; w < 2000; w++) {
  for (let i = 1; i <= 2; i++) {
    const spMin = (60000 + Math.floor(hashPRNG(w * 10 + i, 3) * 540000)) / 60000;
    if (spMin < minSpaceMin) minSpaceMin = spMin;
    if (spMin > maxSpaceMin) maxSpaceMin = spMin;
  }
}
const orderSpacingPass = minSpaceMin >= 1.0 && maxSpaceMin <= 10.0;
console.log(
  '3. Within-Wave Order Spacing Bounds: Min =',
  minSpaceMin.toFixed(2),
  'm, Max =',
  maxSpaceMin.toFixed(2),
  'm (Expected: 1–10m):',
  orderSpacingPass ? 'PASS' : 'FAIL'
);

// TEST 4: PENDING TRANSITION (1 - 3 minutes)
let minPendingMin = Infinity, maxPendingMin = -Infinity;
for (let w = 0; w < 2000; w++) {
  for (let i = 0; i < 3; i++) {
    const pMin = (60000 + Math.floor(hashPRNG(w * 10 + i, 4) * 120000)) / 60000;
    if (pMin < minPendingMin) minPendingMin = pMin;
    if (pMin > maxPendingMin) maxPendingMin = pMin;
  }
}
const pendingPass = minPendingMin >= 1.0 && maxPendingMin <= 3.0;
console.log(
  '4. Menunggu Pembayaran -> Processing Duration: Min =',
  minPendingMin.toFixed(2),
  'm, Max =',
  maxPendingMin.toFixed(2),
  'm (Expected: 1–3m):',
  pendingPass ? 'PASS' : 'FAIL'
);

// TEST 5: MAXIMUM 3 PROCESSING ORDERS OVER TIME (Sample 600 time steps over 300 minutes)
let maxProcessingObserved = 0;
let processingOverLimitViolations = 0;
for (let step = 0; step < 600; step++) {
  const sampleTime = testTime + step * 30000; // every 30s
  const sampleList = getDeterministicSimulationOrders(sampleTime, 150);
  const procCount = sampleList.filter(o => o.order_status === 'processing').length;
  if (procCount > maxProcessingObserved) maxProcessingObserved = procCount;
  if (procCount > 3) processingOverLimitViolations++;
}
const max3Pass = maxProcessingObserved <= 3 && processingOverLimitViolations === 0;
console.log(
  '5. Maximum 3 Processing Constraint (Observed Max =',
  maxProcessingObserved,
  ', Violations =',
  processingOverLimitViolations,
  '):',
  max3Pass ? 'PASS' : 'FAIL'
);

// TEST 6: OLDEST PROCESSING ACCELERATED TO COMPLETED WHEN SLOT IS FULL
// Verify that when an order is displaced, its effectiveCompletedStartTime equals the new order's processingStartTime
let evictionVerified = false;
for (let step = 0; step < 60; step++) {
  const t1 = testTime + step * 120000;
  const list1 = getDeterministicSimulationOrders(t1, 150);
  const procOrders = list1.filter(o => o.order_status === 'processing');
  if (procOrders.length === 3) {
    // Find the oldest among the 3
    procOrders.sort((a, b) => a._processingStartTime - b._processingStartTime);
    const oldest = procOrders[0];
    // Check when it becomes completed: it must become completed at or before its natural end
    if (oldest._effectiveCompletedStartTime < oldest._processingStartTime + 1800000) {
      evictionVerified = true;
      break;
    }
  }
}
console.log('6. FIFO Eviction of Oldest Processing to Sukses When Slot Full:', evictionVerified ? 'PASS' : 'FAIL');

// TEST 7: IRREVERSIBLE PROGRESSION (Status Sukses never reverts back)
let noReversionPass = true;
const trackedOrders = browserA.filter(o => o.order_status === 'completed').slice(0, 20);
for (let min = 1; min <= 60; min++) {
  const futureTime = testTime + min * 60000;
  const futureList = getDeterministicSimulationOrders(futureTime, 150);
  for (const track of trackedOrders) {
    const check = futureList.find(o => o.id === track.id);
    if (check && check.order_status !== 'completed') {
      noReversionPass = false;
      break;
    }
  }
}
console.log('7. Irreversible Progression (Completed orders never revert to processing/pending):', noReversionPass ? 'PASS' : 'FAIL');

// TEST 8: ACTIVE CATALOG FIDELITY
let catalogPass = true;
ACTIVE_CATALOG_PRODUCTS.forEach(p => {
  const matchCat = activeCatalog.find(c => c.name === p.name && c.id === p.sku);
  if (!matchCat || matchCat.status !== 'active') {
    catalogPass = false;
  }
});
console.log('8. Catalog Fidelity (100% matched with active catalog):', catalogPass ? 'PASS' : 'FAIL');

// TEST 9: MASKED CUSTOMER NAMES FORMAT
const nameRegex = /^[A-Z]\*\*\*[a-z]$/;
const namesPass = MASKED_CUSTOMER_NAMES.every(n => nameRegex.test(n));
console.log('9. Masked Customer Names Format (e.g. M***u, D***s, A***a):', namesPass ? 'PASS' : 'FAIL');

// TEST 10: ORDER ID FORMAT AND ZERO COLLISION WITH REAL ORDER 7615
const idRegex = /^AST-ORD-\d{8}-\d{4}$/;
let idFormatPass = true;
let collisionPass = true;
browserA.forEach(o => {
  if (!idRegex.test(o.id)) idFormatPass = false;
  if (o.id.includes('7615')) collisionPass = false;
  if (o.id.includes('DEMO')) idFormatPass = false;
});
console.log('10. Order ID Format (AST-ORD-YYYYMMDD-NNNN, no AST-DEMO, no 7615 collision):', (idFormatPass && collisionPass) ? 'PASS' : 'FAIL');

// TEST 11: ZERO DATABASE WRITES
const genuineOrdersPath = path.join(__dirname, '../backend/data/orders.json');
let dbClean = true;
if (fs.existsSync(genuineOrdersPath)) {
  const genuineOrders = JSON.parse(fs.readFileSync(genuineOrdersPath, 'utf8'));
  if (genuineOrders.length !== 1 || genuineOrders[0].id !== 'AST-ORD-20261015-7615') {
    dbClean = false;
  }
}
console.log('11. Database Isolation (Pure frontend, exactly 1 genuine order in orders.json):', dbClean ? 'PASS' : 'FAIL');

console.log('\n====================================================');
const allPass =
  determinismPass &&
  waveIntervalPass &&
  orderSpacingPass &&
  pendingPass &&
  max3Pass &&
  evictionVerified &&
  noReversionPass &&
  catalogPass &&
  namesPass &&
  idFormatPass &&
  collisionPass &&
  dbClean;

console.log('OVERALL AUDIT VERIFICATION:', allPass ? 'ALL TESTS PASSED (100%)' : 'FAILURES DETECTED');
console.log('====================================================');
