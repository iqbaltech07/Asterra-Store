const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function formatRupiah(amount) {
  if (amount >= 1000000) {
    const juta = amount / 1000000;
    return `Rp ${juta % 1 === 0 ? juta : juta.toFixed(1)} Jt`;
  }
  if (amount >= 1000) {
    const ribu = amount / 1000;
    return `Rp ${ribu % 1 === 0 ? ribu : ribu.toFixed(0)} Rb`;
  }
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

async function updateDatabasePrices() {
  console.log('=== STEP 1: READING EXCEL PRICING DATA ===');
  const parsedData = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'parsed_excel_data.json'), 'utf8'));
  const allDbSheet = parsedData['Semua Produk (DB)'];
  const pricingSheet = parsedData['Pricing Strategy'];

  // Map from Pricing Strategy (the 37 key active products)
  const strategyMap = new Map();
  for (let i = 10; i <= 46; i++) {
    const row = pricingSheet[i][1];
    const no = parseInt(row.A?.val || '0', 10);
    const name = (row.B?.val || '').trim();
    const modal = parseFloat(row.C?.val || '0');
    const hargaFinal = parseFloat(row.D?.val || '0');
    strategyMap.set(no, { no, name, modal, hargaFinal });
  }
  console.log(`Loaded ${strategyMap.size} strategy items from Pricing Strategy sheet.`);

  // Map from Semua Produk (DB)
  const excelProducts = [];
  for (let i = 4; i < allDbSheet.length; i++) {
    const row = allDbSheet[i][1];
    const no = parseInt(row.A?.val || '0', 10);
    const name = (row.B?.val || '').trim();
    const storeStatus = row.E?.val;
    const cost = parseFloat(row.G?.val || '0');
    const price = parseFloat(row.H?.val || '0');
    const codeOrId = (row.K?.val || '').trim();

    if (!codeOrId || !name) continue;

    excelProducts.push({
      no,
      name,
      storeStatus,
      cost,
      price,
      codeOrId,
    });
  }
  console.log(`Loaded ${excelProducts.length} products from 'Semua Produk (DB)' sheet.`);

  console.log('\n=== STEP 2: FETCHING EXISTING DB PRODUCTS ===');
  const dbProducts = await prisma.product.findMany();
  console.log(`Found ${dbProducts.length} total products in database.`);

  const dbById = new Map();
  const dbByCode = new Map();
  for (const p of dbProducts) {
    dbById.set(p.id, p);
    if (p.providerCode) {
      dbByCode.set(p.providerCode, p);
    }
  }

  console.log('\n=== STEP 3: UPDATING DB PRODUCTS ===');
  let updatedCount = 0;
  let skippedCount = 0;
  const updateLogs = [];

  for (const ep of excelProducts) {
    const matched = dbById.get(ep.codeOrId) || dbByCode.get(ep.codeOrId);
    if (!matched) {
      console.warn(`[WARNING] No DB record found for Excel product #${ep.no}: ${ep.name} (${ep.codeOrId})`);
      skippedCount++;
      continue;
    }

    const newPrice = Math.round(ep.price);
    const newCost = Math.round(ep.cost);
    const newProfitMargin = newPrice - newCost;
    const newProfitPct = newCost > 0 ? Math.round((newProfitMargin / newCost) * 100) : 0;
    const newPriceFormatted = formatRupiah(newPrice);

    // Check if there are changes
    const priceChanged = matched.price !== newPrice;
    const costChanged = matched.providerPrice !== newCost;
    const marginChanged = matched.profitMargin !== newProfitMargin;
    const pctChanged = matched.profitPercentage !== newProfitPct;
    const formattedChanged = matched.priceFormatted !== newPriceFormatted;

    if (priceChanged || costChanged || marginChanged || pctChanged || formattedChanged) {
      await prisma.product.update({
        where: { id: matched.id },
        data: {
          price: newPrice,
          providerPrice: newCost,
          profitMargin: newProfitMargin,
          profitPercentage: newProfitPct,
          priceFormatted: newPriceFormatted,
        },
      });

      updateLogs.push({
        id: matched.id,
        name: matched.name,
        oldPrice: matched.price,
        newPrice: newPrice,
        oldCost: matched.providerPrice,
        newCost: newCost,
        oldPf: matched.priceFormatted,
        newPf: newPriceFormatted,
      });
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} products in DB.`);
  console.log(`Skipped / no match: ${skippedCount}`);

  // Print sample updates
  console.log('\nSample Updated Products:');
  for (const log of updateLogs.slice(0, 10)) {
    console.log(`- ${log.name}`);
    console.log(`  Price: Rp ${log.oldPrice.toLocaleString('id-ID')} -> Rp ${log.newPrice.toLocaleString('id-ID')} (${log.newPf})`);
    console.log(`  Cost:  Rp ${log.oldCost?.toLocaleString('id-ID')} -> Rp ${log.newCost.toLocaleString('id-ID')}`);
  }

  // Check 4 extra active products to make sure their format is also clean
  const extraIds = [
    'vip-ntflxshare30dgar14d-s2',
    'vip-ntflxshare30dgar28d-s2',
    'vip-ytpreminvt1bln-s3',
    'prod-digital',
  ];
  console.log('\n=== STEP 4: VERIFYING RECENT ACTIVE PRODUCTS ===');
  for (const id of extraIds) {
    const p = await prisma.product.findUnique({ where: { id } });
    if (p) {
      const correctPf = formatRupiah(p.price);
      const cost = p.providerPrice || 0;
      const margin = p.price - cost;
      const pct = cost > 0 ? Math.round((margin / cost) * 100) : 0;
      if (p.priceFormatted !== correctPf || p.profitMargin !== margin || p.profitPercentage !== pct) {
        await prisma.product.update({
          where: { id: p.id },
          data: {
            priceFormatted: correctPf,
            profitMargin: margin,
            profitPercentage: pct,
          },
        });
        console.log(`Refreshed formatted fields for extra product: ${p.name} (${correctPf})`);
      } else {
        console.log(`Extra product verified: ${p.name} | Price: Rp ${p.price.toLocaleString('id-ID')} (${p.priceFormatted})`);
      }
    }
  }

  // Sync data/active-catalog.json fallback
  console.log('\n=== STEP 5: SYNCING FALLBACK CATALOG (data/active-catalog.json) ===');
  const catalogPath = path.resolve(__dirname, '../data/active-catalog.json');
  if (fs.existsSync(catalogPath)) {
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    let catalogUpdated = 0;
    for (const item of catalog) {
      const matched = dbById.get(item.id) || (item.providerCode ? dbByCode.get(item.providerCode) : null);
      if (matched) {
        // Update price in catalog to match newly updated DB price
        const updatedDb = await prisma.product.findUnique({ where: { id: matched.id } });
        if (updatedDb && item.price !== updatedDb.price) {
          item.price = updatedDb.price;
          item.priceFormatted = updatedDb.priceFormatted;
          item.providerPrice = updatedDb.providerPrice;
          item.profitMargin = updatedDb.profitMargin;
          item.profitPercentage = updatedDb.profitPercentage;
          catalogUpdated++;
        }
      }
    }
    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
    console.log(`Updated ${catalogUpdated} items in data/active-catalog.json fallback.`);
  }

  console.log('\n=== DATABASE PRICING UPDATE COMPLETED SUCCESSFULLY! ===');
}

updateDatabasePrices()
  .catch((err) => {
    console.error('Fatal error during DB update:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
