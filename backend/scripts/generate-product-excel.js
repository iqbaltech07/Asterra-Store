const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Helper to determine Brand / App Name
function getBrandAndApp(p) {
  const id = (p.id || '').toLowerCase();
  const code = (p.providerCode || '').toLowerCase();
  const name = (p.name || '').toLowerCase();

  if (id.includes('capcut') || code.includes('capcut') || name.includes('capcut')) return 'CapCut';
  if (id.includes('chatgpt') || code.includes('chatgpt') || name.includes('chatgpt')) return 'ChatGPT';
  if (id.includes('gemini') || code.includes('gemini') || name.includes('gemini')) return 'Google Gemini AI';
  if (id.includes('canva') || code.includes('canva') || name.includes('canva')) return 'Canva Pro';
  if (id.includes('viu') || code.includes('viu') || name.includes('viu')) return 'VIU Premium';
  if (id.includes('vidio') || code.includes('vidio') || name.includes('vidio')) return 'Vidio Platinum';
  if (id.includes('wetv') || code.includes('wetv') || name.includes('wetv')) return 'WeTV Premium';
  if (id.includes('bsprem') || code.includes('bsprem') || name.includes('bstation')) return 'Bstation';
  if (id.includes('iqiyi') || code.includes('iqiyi') || name.includes('iqiyi')) return 'iQIYI';
  if (id.includes('alightmotion') || code.includes('alightmotion') || name.includes('alightmotion')) return 'Alight Motion';
  if (id.includes('google') || name.includes('google')) return 'Google AI';
  if (id.includes('netflix') || code.includes('netflix') || name.includes('netflix')) return 'Netflix';
  if (id.includes('spotify') || code.includes('spotify') || name.includes('spotify')) return 'Spotify';
  if (id.includes('youtube') || code.includes('youtube') || name.includes('youtube')) return 'YouTube';
  if (id.includes('disney') || code.includes('disney') || name.includes('disney')) return 'Disney+ Hotstar';
  if (id.includes('kvision') || code.includes('kvision') || name.includes('k-vision')) return 'K-Vision';

  if (p.brand && p.brand !== 'Digital' && p.brand !== 'Custom') return p.brand;
  return '';
}

function getCleanProductName(p) {
  const brand = getBrandAndApp(p);
  let name = (p.name || '').trim();
  if (brand && !name.toLowerCase().includes(brand.toLowerCase().split(' ')[0])) {
    return `${brand} - ${name}`;
  }
  return name;
}

function getAccountType(p) {
  const name = (p.name || '').toLowerCase();
  const text = (name + ' ' + (p.description || '') + ' ' + (p.features || []).join(' ')).toLowerCase();

  if (name.includes('head invite') || name.includes('head')) return 'Private (Family Head)';
  if (name.includes('anggota')) return 'Sharing (Invite)';
  if (name.includes('desainer')) return 'Private (Desainer)';
  if (name.includes('shared') || name.includes('sharing')) return 'Sharing';
  if (name.includes('private') || name.includes('privat')) return 'Private';
  if (name.includes('edu') || name.includes('education')) return 'Sharing (Edu)';

  if (text.includes('shared') || text.includes('sharing')) return 'Sharing';
  if (text.includes('private') || text.includes('privat')) return 'Private';
  if (text.includes('anggota') || text.includes('invite')) return 'Sharing (Invite)';
  if (text.includes('edu')) return 'Sharing (Edu)';

  return 'Private';
}

function getAvailabilityStatus(p) {
  const isOutOfStock = (p.stock !== undefined && p.stock <= 0) || p.providerStatus === 'empty';
  return isOutOfStock ? 'Kosong' : 'Tersedia';
}

const STYLES = {
  headerFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }, // Slate 900
  headerFont: { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } },
  accentFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }, // Slate 800
  tealHeaderFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }, // Teal 700
  indigoHeaderFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } }, // Indigo 700
  cardFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }, // Slate 50
  zebraFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }, // Slate 50
  whiteFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } },
  totalFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }, // Slate 100
  borderThin: {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  },
  availableBadge: {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }, // Green 100
    font: { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF15803D' } }, // Green 700
  },
  emptyBadge: {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }, // Red 100
    font: { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFB91C1C' } }, // Red 700
  },
  privateBadge: {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }, // Blue 100
    font: { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF1D4ED8' } }, // Blue 700
  },
  sharingBadge: {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }, // Amber 100
    font: { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFB45309' } }, // Amber 700
  },
  currencyFmt: '"Rp "#,##0;[Red]\-"Rp "#,##0;"-"',
  percentFmt: '0.0%',
};

async function generateExcel() {
  console.log('Fetching all products from DB...');
  const dbAllProducts = await prisma.product.findMany({
    orderBy: [{ status: 'asc' }, { categoryName: 'asc' }, { name: 'asc' }],
  });
  const dbActiveProducts = dbAllProducts.filter((p) => p.status === 'active');
  console.log(`Found ${dbAllProducts.length} total products in DB (${dbActiveProducts.length} active).`);

  let fallbackProducts = [];
  const fallbackPath = path.resolve(__dirname, '../data/active-catalog.json');
  if (fs.existsSync(fallbackPath)) {
    try {
      fallbackProducts = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
      console.log(`Loaded ${fallbackProducts.length} fallback products.`);
    } catch (e) {
      console.warn('Fallback catalog read error:', e.message);
    }
  }

  // Load pricing strategy data
  const stratPath = path.resolve(__dirname, '../data/pricing-strategy-milestone-50.json');
  let strategyProducts = [];
  if (fs.existsSync(stratPath)) {
    try {
      strategyProducts = JSON.parse(fs.readFileSync(stratPath, 'utf8'));
      console.log(`Loaded ${strategyProducts.length} items from pricing strategy JSON.`);
    } catch (e) {
      console.warn('Strategy read error:', e.message);
    }
  }

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Asterra Store Management System';
  workbook.lastModifiedBy = 'Admin Asterra Store';
  workbook.created = new Date();
  workbook.modified = new Date();

  // =========================================================================
  // SHEET 1: PRODUK AKTIF
  // =========================================================================
  const wsActive = workbook.addWorksheet('Produk Aktif', {
    properties: { tabColor: { argb: 'FF10B981' } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 4, showGridLines: true }],
  });

  wsActive.mergeCells('A1:J1');
  const titleActive = wsActive.getCell('A1');
  titleActive.value = 'ASTERRA STORE — KATALOG PRODUK AKTIF';
  titleActive.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleActive.fill = STYLES.accentFill;
  titleActive.alignment = { vertical: 'middle', horizontal: 'center' };
  wsActive.getRow(1).height = 36;

  wsActive.mergeCells('A2:J2');
  const subActive = wsActive.getCell('A2');
  subActive.value = `Tanggal: ${todayStr} | Total Produk Aktif: ${dbActiveProducts.length} Produk | Mata Uang: IDR (Rupiah)`;
  subActive.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF475569' } };
  subActive.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  subActive.alignment = { vertical: 'middle', horizontal: 'center' };
  wsActive.getRow(2).height = 22;

  wsActive.getRow(3).height = 8;

  wsActive.columns = [
    { key: 'no', width: 6 },
    { key: 'name', width: 44 },
    { key: 'category', width: 18 },
    { key: 'type', width: 22 },
    { key: 'status', width: 16 },
    { key: 'costPrice', width: 18 },
    { key: 'sellingPrice', width: 18 },
    { key: 'marginRp', width: 18 },
    { key: 'marginPct', width: 14 },
    { key: 'providerCode', width: 26 },
  ];

  const headersActive = [
    'No',
    'Nama Produk',
    'Tipe Produk',
    'Jenis (Private/Sharing)',
    'Status Tersedia',
    'Harga Pabrik (Modal)',
    'Harga Jual',
    'Margin Laba (Rp)',
    'Margin (%)',
    'Kode Layanan / ID',
  ];

  const headerRowActive = wsActive.getRow(4);
  headerRowActive.height = 28;
  headersActive.forEach((h, idx) => {
    const cell = headerRowActive.getCell(idx + 1);
    cell.value = h;
    cell.fill = STYLES.headerFill;
    cell.font = STYLES.headerFont;
    cell.alignment = {
      vertical: 'middle',
      horizontal: idx === 1 || idx === 9 ? 'left' : idx >= 5 && idx <= 8 ? 'right' : 'center',
      wrapText: true,
    };
    cell.border = STYLES.borderThin;
  });

  const startActiveRow = 5;
  dbActiveProducts.forEach((p, idx) => {
    const rowNum = startActiveRow + idx;
    const row = wsActive.getRow(rowNum);
    row.height = 24;

    const cleanName = getCleanProductName(p);
    const category = p.categoryName || 'Apps & Streaming';
    const accountType = getAccountType(p);
    const availability = getAvailabilityStatus(p);
    const costPrice = p.providerPrice || 0;
    const sellingPrice = p.price || 0;
    const providerCode = p.providerCode || p.id;

    row.getCell(1).value = idx + 1;
    row.getCell(2).value = cleanName;
    row.getCell(3).value = category;
    row.getCell(4).value = accountType;
    row.getCell(5).value = availability;
    row.getCell(6).value = costPrice;
    row.getCell(7).value = sellingPrice;
    row.getCell(8).value = { formula: `G${rowNum}-F${rowNum}` };
    row.getCell(9).value = { formula: `IF(G${rowNum}>0,(G${rowNum}-F${rowNum})/G${rowNum},0)` };
    row.getCell(10).value = providerCode;

    const isZebra = idx % 2 === 1;
    const baseFill = isZebra ? STYLES.zebraFill : STYLES.whiteFill;

    for (let c = 1; c <= 10; c++) {
      const cell = row.getCell(c);
      cell.border = STYLES.borderThin;
      cell.font = { name: 'Segoe UI', size: 9.5 };
      cell.fill = baseFill;

      if (c === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF64748B' } };
      } else if (c === 2) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
      } else if (c === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (c === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (accountType.startsWith('Private')) {
          cell.fill = STYLES.privateBadge.fill;
          cell.font = STYLES.privateBadge.font;
        } else {
          cell.fill = STYLES.sharingBadge.fill;
          cell.font = STYLES.sharingBadge.font;
        }
      } else if (c === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (availability === 'Tersedia') {
          cell.fill = STYLES.availableBadge.fill;
          cell.font = STYLES.availableBadge.font;
        } else {
          cell.fill = STYLES.emptyBadge.fill;
          cell.font = STYLES.emptyBadge.font;
        }
      } else if (c === 6 || c === 7 || c === 8) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = STYLES.currencyFmt;
        if (c === 8) cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF0D9488' } };
      } else if (c === 9) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = STYLES.percentFmt;
      } else if (c === 10) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.font = { name: 'Consolas', size: 8.5, color: { argb: 'FF475569' } };
      }
    }
  });

  const lastActiveRow = startActiveRow + dbActiveProducts.length - 1;
  const totalActiveRow = wsActive.getRow(lastActiveRow + 1);
  totalActiveRow.height = 26;

  totalActiveRow.getCell(1).value = '';
  totalActiveRow.getCell(2).value = 'TOTAL & RATA-RATA';
  totalActiveRow.getCell(3).value = '';
  totalActiveRow.getCell(4).value = '';
  totalActiveRow.getCell(5).value = '';
  totalActiveRow.getCell(6).value = { formula: `SUM(F${startActiveRow}:F${lastActiveRow})` };
  totalActiveRow.getCell(7).value = { formula: `SUM(G${startActiveRow}:G${lastActiveRow})` };
  totalActiveRow.getCell(8).value = { formula: `SUM(H${startActiveRow}:H${lastActiveRow})` };
  totalActiveRow.getCell(9).value = { formula: `AVERAGE(I${startActiveRow}:I${lastActiveRow})` };
  totalActiveRow.getCell(10).value = '';

  for (let c = 1; c <= 10; c++) {
    const cell = totalActiveRow.getCell(c);
    cell.fill = STYLES.totalFill;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    cell.border = {
      top: { style: 'double', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
    if (c === 2) cell.alignment = { vertical: 'middle', horizontal: 'left' };
    if (c >= 6 && c <= 8) {
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
      cell.numFmt = STYLES.currencyFmt;
    }
    if (c === 9) {
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
      cell.numFmt = STYLES.percentFmt;
    }
  }

  wsActive.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: lastActiveRow, column: 10 },
  };

  // =========================================================================
  // SHEET 2: SEMUA PRODUK (DB)
  // =========================================================================
  const wsAll = workbook.addWorksheet('Semua Produk (DB)', {
    properties: { tabColor: { argb: 'FF3B82F6' } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 4, showGridLines: true }],
  });

  wsAll.mergeCells('A1:K1');
  const titleAll = wsAll.getCell('A1');
  titleAll.value = 'ASTERRA STORE — MASTER KATALOG PRODUK (DATABASE)';
  titleAll.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleAll.fill = STYLES.accentFill;
  titleAll.alignment = { vertical: 'middle', horizontal: 'center' };
  wsAll.getRow(1).height = 36;

  wsAll.mergeCells('A2:K2');
  const subAll = wsAll.getCell('A2');
  subAll.value = `Total Produk: ${dbAllProducts.length} (Aktif: ${dbActiveProducts.length}, Arsip: ${dbAllProducts.length - dbActiveProducts.length}) | Tanggal: ${todayStr}`;
  subAll.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF475569' } };
  subAll.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  subAll.alignment = { vertical: 'middle', horizontal: 'center' };
  wsAll.getRow(2).height = 22;

  wsAll.getRow(3).height = 8;

  wsAll.columns = [
    { key: 'no', width: 6 },
    { key: 'name', width: 44 },
    { key: 'category', width: 18 },
    { key: 'type', width: 22 },
    { key: 'storeStatus', width: 14 },
    { key: 'status', width: 16 },
    { key: 'costPrice', width: 18 },
    { key: 'sellingPrice', width: 18 },
    { key: 'marginRp', width: 18 },
    { key: 'marginPct', width: 14 },
    { key: 'providerCode', width: 26 },
  ];

  const headersAll = [
    'No',
    'Nama Produk',
    'Tipe Produk',
    'Jenis (Private/Sharing)',
    'Status Toko',
    'Status Tersedia',
    'Harga Pabrik (Modal)',
    'Harga Jual',
    'Margin Laba (Rp)',
    'Margin (%)',
    'Kode Layanan / ID',
  ];

  const headerRowAll = wsAll.getRow(4);
  headerRowAll.height = 28;
  headersAll.forEach((h, idx) => {
    const cell = headerRowAll.getCell(idx + 1);
    cell.value = h;
    cell.fill = STYLES.headerFill;
    cell.font = STYLES.headerFont;
    cell.alignment = {
      vertical: 'middle',
      horizontal: idx === 1 || idx === 10 ? 'left' : idx >= 6 && idx <= 9 ? 'right' : 'center',
      wrapText: true,
    };
    cell.border = STYLES.borderThin;
  });

  const startAllRow = 5;
  dbAllProducts.forEach((p, idx) => {
    const rowNum = startAllRow + idx;
    const row = wsAll.getRow(rowNum);
    row.height = 22;

    const cleanName = getCleanProductName(p);
    const category = p.categoryName || 'Apps & Streaming';
    const accountType = getAccountType(p);
    const storeStatus = p.status === 'active' ? 'Aktif' : 'Diarsipkan';
    const availability = getAvailabilityStatus(p);
    const costPrice = p.providerPrice || 0;
    const sellingPrice = p.price || 0;
    const providerCode = p.providerCode || p.id;

    row.getCell(1).value = idx + 1;
    row.getCell(2).value = cleanName;
    row.getCell(3).value = category;
    row.getCell(4).value = accountType;
    row.getCell(5).value = storeStatus;
    row.getCell(6).value = availability;
    row.getCell(7).value = costPrice;
    row.getCell(8).value = sellingPrice;
    row.getCell(9).value = { formula: `H${rowNum}-G${rowNum}` };
    row.getCell(10).value = { formula: `IF(H${rowNum}>0,(H${rowNum}-G${rowNum})/H${rowNum},0)` };
    row.getCell(11).value = providerCode;

    const isZebra = idx % 2 === 1;
    const baseFill = isZebra ? STYLES.zebraFill : STYLES.whiteFill;

    for (let c = 1; c <= 11; c++) {
      const cell = row.getCell(c);
      cell.border = STYLES.borderThin;
      cell.font = { name: 'Segoe UI', size: 9 };
      cell.fill = baseFill;

      if (c === 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (c === 2) cell.alignment = { vertical: 'middle', horizontal: 'left' };
      if (c === 3) cell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (c === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (accountType.startsWith('Private')) {
          cell.font = STYLES.privateBadge.font;
        } else {
          cell.font = STYLES.sharingBadge.font;
        }
      }
      if (c === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = {
          name: 'Segoe UI',
          size: 9,
          bold: true,
          color: { argb: storeStatus === 'Aktif' ? 'FF15803D' : 'FF64748B' },
        };
      }
      if (c === 6) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (availability === 'Tersedia') {
          cell.fill = STYLES.availableBadge.fill;
          cell.font = STYLES.availableBadge.font;
        } else {
          cell.fill = STYLES.emptyBadge.fill;
          cell.font = STYLES.emptyBadge.font;
        }
      }
      if (c === 7 || c === 8 || c === 9) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = STYLES.currencyFmt;
      }
      if (c === 10) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = STYLES.percentFmt;
      }
      if (c === 11) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.font = { name: 'Consolas', size: 8.5, color: { argb: 'FF64748B' } };
      }
    }
  });

  const lastAllRow = startAllRow + dbAllProducts.length - 1;
  const totalAllRow = wsAll.getRow(lastAllRow + 1);
  totalAllRow.height = 26;

  totalAllRow.getCell(1).value = '';
  totalAllRow.getCell(2).value = 'TOTAL & RATA-RATA';
  totalAllRow.getCell(3).value = '';
  totalAllRow.getCell(4).value = '';
  totalAllRow.getCell(5).value = '';
  totalAllRow.getCell(6).value = '';
  totalAllRow.getCell(7).value = { formula: `SUM(G${startAllRow}:G${lastAllRow})` };
  totalAllRow.getCell(8).value = { formula: `SUM(H${startAllRow}:H${lastAllRow})` };
  totalAllRow.getCell(9).value = { formula: `SUM(I${startAllRow}:I${lastAllRow})` };
  totalAllRow.getCell(10).value = { formula: `AVERAGE(J${startAllRow}:J${lastAllRow})` };
  totalAllRow.getCell(11).value = '';

  for (let c = 1; c <= 11; c++) {
    const cell = totalAllRow.getCell(c);
    cell.fill = STYLES.totalFill;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    cell.border = {
      top: { style: 'double', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
    if (c === 2) cell.alignment = { vertical: 'middle', horizontal: 'left' };
    if (c >= 7 && c <= 9) {
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
      cell.numFmt = STYLES.currencyFmt;
    }
    if (c === 10) {
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
      cell.numFmt = STYLES.percentFmt;
    }
  }

  wsAll.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: lastAllRow, column: 11 },
  };

  // =========================================================================
  // SHEET 3: KATALOG FALLBACK (JSON)
  // =========================================================================
  if (fallbackProducts.length > 0) {
    const wsFallback = workbook.addWorksheet('Katalog Fallback (JSON)', {
      properties: { tabColor: { argb: 'FF8B5CF6' } },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 4, showGridLines: true }],
    });

    wsFallback.mergeCells('A1:J1');
    const titleFb = wsFallback.getCell('A1');
    titleFb.value = 'ASTERRA STORE — KATALOG CADANGAN (ACTIVE-CATALOG.JSON)';
    titleFb.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleFb.fill = STYLES.accentFill;
    titleFb.alignment = { vertical: 'middle', horizontal: 'center' };
    wsFallback.getRow(1).height = 36;

    wsFallback.mergeCells('A2:J2');
    const subFb = wsFallback.getCell('A2');
    subFb.value = `Total Fallback: ${fallbackProducts.length} Produk | Sumber: data/active-catalog.json`;
    subFb.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF475569' } };
    subFb.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    subFb.alignment = { vertical: 'middle', horizontal: 'center' };
    wsFallback.getRow(2).height = 22;

    wsFallback.getRow(3).height = 8;

    wsFallback.columns = [
      { key: 'no', width: 6 },
      { key: 'name', width: 44 },
      { key: 'category', width: 18 },
      { key: 'type', width: 22 },
      { key: 'status', width: 16 },
      { key: 'costPrice', width: 18 },
      { key: 'sellingPrice', width: 18 },
      { key: 'marginRp', width: 18 },
      { key: 'marginPct', width: 14 },
      { key: 'providerCode', width: 26 },
    ];

    const headerRowFb = wsFallback.getRow(4);
    headerRowFb.height = 28;
    headersActive.forEach((h, idx) => {
      const cell = headerRowFb.getCell(idx + 1);
      cell.value = h;
      cell.fill = STYLES.headerFill;
      cell.font = STYLES.headerFont;
      cell.alignment = {
        vertical: 'middle',
        horizontal: idx === 1 || idx === 9 ? 'left' : idx >= 5 && idx <= 8 ? 'right' : 'center',
        wrapText: true,
      };
      cell.border = STYLES.borderThin;
    });

    const startFbRow = 5;
    fallbackProducts.forEach((p, idx) => {
      const rowNum = startFbRow + idx;
      const row = wsFallback.getRow(rowNum);
      row.height = 22;

      const cleanName = getCleanProductName(p);
      const category = p.category?.name || 'Apps & Streaming';
      const accountType = getAccountType(p);
      const availability = getAvailabilityStatus(p);
      const costPrice = p.providerPrice || 0;
      const sellingPrice = p.price || 0;
      const providerCode = p.providerCode || p.id;

      row.getCell(1).value = idx + 1;
      row.getCell(2).value = cleanName;
      row.getCell(3).value = category;
      row.getCell(4).value = accountType;
      row.getCell(5).value = availability;
      row.getCell(6).value = costPrice;
      row.getCell(7).value = sellingPrice;
      row.getCell(8).value = { formula: `G${rowNum}-F${rowNum}` };
      row.getCell(9).value = { formula: `IF(G${rowNum}>0,(G${rowNum}-F${rowNum})/G${rowNum},0)` };
      row.getCell(10).value = providerCode;

      const isZebra = idx % 2 === 1;
      const baseFill = isZebra ? STYLES.zebraFill : STYLES.whiteFill;

      for (let c = 1; c <= 10; c++) {
        const cell = row.getCell(c);
        cell.border = STYLES.borderThin;
        cell.font = { name: 'Segoe UI', size: 9 };
        cell.fill = baseFill;

        if (c === 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (c === 2) cell.alignment = { vertical: 'middle', horizontal: 'left' };
        if (c === 3) cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (c === 4) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          if (accountType.startsWith('Private')) {
            cell.font = STYLES.privateBadge.font;
          } else {
            cell.font = STYLES.sharingBadge.font;
          }
        }
        if (c === 5) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          if (availability === 'Tersedia') {
            cell.fill = STYLES.availableBadge.fill;
            cell.font = STYLES.availableBadge.font;
          } else {
            cell.fill = STYLES.emptyBadge.fill;
            cell.font = STYLES.emptyBadge.font;
          }
        }
        if (c === 6 || c === 7 || c === 8) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = STYLES.currencyFmt;
        }
        if (c === 9) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = STYLES.percentFmt;
        }
        if (c === 10) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          cell.font = { name: 'Consolas', size: 8.5, color: { argb: 'FF64748B' } };
        }
      }
    });

    const lastFbRow = startFbRow + fallbackProducts.length - 1;
    wsFallback.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: lastFbRow, column: 10 },
    };
  }

  // =========================================================================
  // SHEET 4: PRICING STRATEGY & UNIT ECONOMICS (MILESTONE 50)
  // =========================================================================
  if (strategyProducts.length > 0) {
    const wsStrat = workbook.addWorksheet('Pricing Strategy', {
      properties: { tabColor: { argb: 'FFF59E0B' } },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 11, showGridLines: true }],
    });

    wsStrat.columns = [
      { key: 'A', width: 6 },
      { key: 'B', width: 44 },
      { key: 'C', width: 14 },
      { key: 'D', width: 14 },
      { key: 'E', width: 14 },
      { key: 'F', width: 12 },
      { key: 'G', width: 14 },
      { key: 'H', width: 15 },
      { key: 'I', width: 14 },
      { key: 'J', width: 14 },
      { key: 'K', width: 16 },
      { key: 'L', width: 14 },
      { key: 'M', width: 14 },
      { key: 'N', width: 14 },
      { key: 'O', width: 28 },
      { key: 'P', width: 34 },
      { key: 'Q', width: 18 },
      { key: 'R', width: 18 },
      { key: 'S', width: 16 },
      { key: 'T', width: 14 },
      { key: 'U', width: 32 },
    ];

    wsStrat.mergeCells('A1:U1');
    const titleStrat = wsStrat.getCell('A1');
    titleStrat.value = 'ASTERRA STORE — MILESTONE PRICING & UNIT ECONOMICS';
    titleStrat.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleStrat.fill = STYLES.accentFill;
    titleStrat.alignment = { vertical: 'middle', horizontal: 'center' };
    wsStrat.getRow(1).height = 36;

    wsStrat.mergeCells('A2:U2');
    const subStrat = wsStrat.getCell('A2');
    subStrat.value = 'Harga final dirancang agar komisi Sales naik ke 15% mulai order ke-50 tanpa menurunkan profit Asterra per 50 order.';
    subStrat.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'FF475569' } };
    subStrat.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    subStrat.alignment = { vertical: 'middle', horizontal: 'center' };
    wsStrat.getRow(2).height = 24;

    wsStrat.getRow(3).height = 10;

    wsStrat.mergeCells('A4:H4');
    const card1Head = wsStrat.getCell('A4');
    card1Head.value = 'PARAMETER REFERRAL & PROFIT SHARING MODEL';
    card1Head.fill = STYLES.headerFill;
    card1Head.font = STYLES.headerFont;
    card1Head.alignment = { vertical: 'middle', horizontal: 'center' };

    wsStrat.mergeCells('J4:O4');
    const card2Head = wsStrat.getCell('J4');
    card2Head.value = 'PORTFOLIO IMPACT (37 PRODUK KATALOG)';
    card2Head.fill = STYLES.tealHeaderFill;
    card2Head.font = STYLES.headerFont;
    card2Head.alignment = { vertical: 'middle', horizontal: 'center' };

    wsStrat.mergeCells('P4:U4');
    const card3Head = wsStrat.getCell('P4');
    card3Head.value = 'SIMULASI 50 ORDER — KOMISI 15% MULAI ORDER KE-50';
    card3Head.fill = STYLES.indigoHeaderFill;
    card3Head.font = STYLES.headerFont;
    card3Head.alignment = { vertical: 'middle', horizontal: 'center' };
    wsStrat.getRow(4).height = 26;

    const r5 = wsStrat.getRow(5);
    r5.height = 22;
    r5.getCell(1).value = 'Referral Discount (1x Customer Baru)';
    r5.getCell(2).value = 1000;
    r5.getCell(3).value = 'Sales Milestone Rate (Order #50+)';
    r5.getCell(4).value = 0.15;
    r5.getCell(5).value = 'Recruiter Bonus (1 Level)';
    r5.getCell(6).value = 0.02;
    r5.getCell(7).value = 'Internal Share (CEO & COO)';
    r5.getCell(8).value = 0.40;
    r5.getCell(10).value = 'Baseline listed total (old)';
    r5.getCell(11).value = 1511300;
    r5.getCell(12).value = 'Final listed total';
    r5.getCell(13).value = { formula: 'D49' };
    r5.getCell(14).value = 'Δ Uplift';
    r5.getCell(15).value = { formula: 'M5-K5' };
    r5.getCell(16).value = 'Metric';
    r5.getCell(17).value = 'Baseline (10%)';
    r5.getCell(18).value = 'Milestone (15%)';
    r5.getCell(19).value = 'Δ Selisih';
    r5.getCell(20).value = 'Δ %';
    r5.getCell(21).value = 'Catatan';

    const r6 = wsStrat.getRow(6);
    r6.height = 22;
    r6.getCell(3).value = 'Sales Baseline Rate (Order #1–49)';
    r6.getCell(4).value = 0.10;
    r6.getCell(10).value = 'Baseline gross profit (old)';
    r6.getCell(11).value = 728200;
    r6.getCell(12).value = 'Final gross profit';
    r6.getCell(13).value = { formula: 'E49' };
    r6.getCell(14).value = 'Δ Uplift';
    r6.getCell(15).value = { formula: 'M6-K6' };
    r6.getCell(16).value = 'Asterra Profit / 50 Order';
    r6.getCell(17).value = { formula: '50*($K$7/37)*(1-$D$6-$F$5)' };
    r6.getCell(18).value = { formula: '49*($M$7/37)*(1-$D$6-$F$5)+1*($M$7/37)*(1-$D$5-$F$5)' };
    r6.getCell(19).value = { formula: 'R6-Q6' };
    r6.getCell(20).value = { formula: 'S6/Q6' };
    r6.getCell(21).value = 'Order #1–49 @10%, order #50 @15%';

    const r7 = wsStrat.getRow(7);
    r7.height = 22;
    r7.getCell(3).value = 'Target Commission Uplift';
    r7.getCell(4).value = 0.15;
    r7.getCell(10).value = 'Baseline referral profit @10% (old)';
    r7.getCell(11).value = 691200;
    r7.getCell(12).value = 'Final referral profit @pricing';
    r7.getCell(13).value = { formula: 'H49' };
    r7.getCell(14).value = 'Δ Uplift';
    r7.getCell(15).value = { formula: 'M7-K7' };
    r7.getCell(16).value = 'Sales Commission / 50 Order';
    r7.getCell(17).value = { formula: '50*($K$7/37)*$D$6' };
    r7.getCell(18).value = { formula: '49*($M$7/37)*$D$6+1*($M$7/37)*$D$5' };
    r7.getCell(19).value = { formula: 'R7-Q7' };
    r7.getCell(20).value = { formula: 'S7/Q7' };
    r7.getCell(21).value = 'Order #1–49 @10%, order #50 @15%';

    const r8 = wsStrat.getRow(8);
    r8.height = 22;
    r8.getCell(10).value = 'Baseline Asterra distribution @10%';
    r8.getCell(11).value = 608256;
    r8.getCell(12).value = 'Final Asterra distribution @15%';
    r8.getCell(13).value = { formula: 'K49' };
    r8.getCell(14).value = 'Uplift';
    r8.getCell(15).value = { formula: 'M8-K8' };
    r8.getCell(16).value = 'Asterra Profit / Order (setelah milestone)';
    r8.getCell(17).value = { formula: '($K$7/37)*(1-$D$6-$F$5)' };
    r8.getCell(18).value = { formula: '($M$7/37)*(1-$D$5-$F$5)' };
    r8.getCell(19).value = { formula: 'R8-Q8' };
    r8.getCell(20).value = { formula: 'S8/Q8' };
    r8.getCell(21).value = 'Mulai order #50 seterusnya @15%';

    const r9 = wsStrat.getRow(9);
    r9.height = 22;
    r9.getCell(16).value = 'Sales Commission / Order (setelah milestone)';
    r9.getCell(17).value = { formula: '($M$7/37)*$D$6' };
    r9.getCell(18).value = { formula: '($M$7/37)*$D$5' };
    r9.getCell(19).value = { formula: 'R9-Q9' };
    r9.getCell(20).value = { formula: 'S9/Q9' };
    r9.getCell(21).value = 'Mulai order #50 seterusnya @15% (+50% komisi)';

    for (let r = 5; r <= 9; r++) {
      const row = wsStrat.getRow(r);
      for (let c = 1; c <= 21; c++) {
        if (c === 9) continue;
        const cell = row.getCell(c);
        cell.border = STYLES.borderThin;
        cell.font = { name: 'Segoe UI', size: 9 };
        cell.fill = STYLES.cardFill;

        if (c === 1 || c === 3 || c === 5 || c === 7) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          cell.font = { name: 'Segoe UI', size: 8.5, color: { argb: 'FF475569' } };
        }
        if (c === 2) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = STYLES.currencyFmt;
          cell.font = { name: 'Segoe UI', size: 9, bold: true };
        }
        if (c === 4 || c === 6 || c === 8) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = STYLES.percentFmt;
          cell.font = { name: 'Segoe UI', size: 9, bold: true };
        }
        if (c === 10 || c === 12 || c === 14) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          cell.font = { name: 'Segoe UI', size: 8.5, color: { argb: 'FF0F766E' } };
        }
        if (c === 11 || c === 13 || c === 15) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = STYLES.currencyFmt;
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF0F766E' } };
        }
        if (r === 5 && c >= 16 && c <= 21) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF312E81' } };
          cell.alignment = { vertical: 'middle', horizontal: c === 16 || c === 21 ? 'left' : 'right' };
        } else if (r >= 6) {
          if (c === 16) {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
            cell.font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: 'FF1E1B4B' } };
          }
          if (c === 17 || c === 18 || c === 19) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = STYLES.currencyFmt;
            cell.font = { name: 'Segoe UI', size: 9, bold: c === 19 };
          }
          if (c === 20) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = STYLES.percentFmt;
            cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF059669' } };
          }
          if (c === 21) {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
            cell.font = { name: 'Segoe UI', size: 8.5, italic: true, color: { argb: 'FF64748B' } };
          }
        }
      }
    }

    wsStrat.getRow(10).height = 12;

    const stratHeaders = [
      'No',
      'Nama Produk',
      'Modal',
      'Harga Final',
      'Gross Profit',
      'Gross Margin',
      'Harga Referral*',
      'Profit Referral*',
      'Sales 15%*',
      'Recruiter 2%*',
      'Profit Distribusi*',
      'CEO 40%*',
      'COO 40%*',
      'Modal 20%*',
      'Strategi Psikologi',
    ];

    const headerRowStrat = wsStrat.getRow(11);
    headerRowStrat.height = 30;
    stratHeaders.forEach((h, idx) => {
      const cell = headerRowStrat.getCell(idx + 1);
      cell.value = h;
      cell.fill = STYLES.headerFill;
      cell.font = STYLES.headerFont;
      cell.alignment = {
        vertical: 'middle',
        horizontal: idx === 1 || idx === 14 ? 'left' : idx >= 2 && idx <= 13 ? 'right' : 'center',
        wrapText: true,
      };
      cell.border = STYLES.borderThin;
    });

    const startStratDataRow = 12;
    strategyProducts.forEach((p, idx) => {
      const rowNum = startStratDataRow + idx;
      const row = wsStrat.getRow(rowNum);
      row.height = 24;

      row.getCell(1).value = p.no;
      row.getCell(2).value = p.name;
      row.getCell(3).value = p.modal;
      row.getCell(4).value = p.hargaFinal;
      row.getCell(5).value = { formula: `D${rowNum}-C${rowNum}` };
      row.getCell(6).value = { formula: `E${rowNum}/D${rowNum}` };
      row.getCell(7).value = { formula: `D${rowNum}-$B$5` };
      row.getCell(8).value = { formula: `G${rowNum}-C${rowNum}` };
      row.getCell(9).value = { formula: `ROUND(H${rowNum}*0.15,0)` };
      row.getCell(10).value = { formula: `ROUND(H${rowNum}*0.02,0)` };
      row.getCell(11).value = { formula: `H${rowNum}-I${rowNum}-J${rowNum}` };
      row.getCell(12).value = { formula: `ROUND(K${rowNum}*0.4,0)` };
      row.getCell(13).value = { formula: `ROUND(K${rowNum}*0.4,0)` };
      row.getCell(14).value = { formula: `K${rowNum}-L${rowNum}-M${rowNum}` };
      row.getCell(15).value = p.stratPsych;

      const isZebra = idx % 2 === 1;
      const baseFill = isZebra ? STYLES.zebraFill : STYLES.whiteFill;

      for (let c = 1; c <= 15; c++) {
        const cell = row.getCell(c);
        cell.border = STYLES.borderThin;
        cell.font = { name: 'Segoe UI', size: 9.5 };
        cell.fill = baseFill;

        if (c === 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF64748B' } };
        } else if (c === 2) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
        } else if (c >= 3 && c <= 5) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = STYLES.currencyFmt;
          if (c === 4) cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
          if (c === 5) cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF0D9488' } };
        } else if (c === 6) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = STYLES.percentFmt;
        } else if (c >= 7 && c <= 14) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = STYLES.currencyFmt;
          if (c === 9) cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF7C3AED' } };
          if (c === 11) cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF059669' } };
        } else if (c === 15) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          cell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF475569' } };
        }
      }
    });

    const lastStratRow = startStratDataRow + strategyProducts.length - 1;
    const totalStratRow = wsStrat.getRow(lastStratRow + 1);
    totalStratRow.height = 28;

    totalStratRow.getCell(1).value = '';
    totalStratRow.getCell(2).value = 'TOTAL / PORTFOLIO (37 PRODUK)';
    totalStratRow.getCell(3).value = { formula: `SUM(C${startStratDataRow}:C${lastStratRow})` };
    totalStratRow.getCell(4).value = { formula: `SUM(D${startStratDataRow}:D${lastStratRow})` };
    totalStratRow.getCell(5).value = { formula: `SUM(E${startStratDataRow}:E${lastStratRow})` };
    totalStratRow.getCell(6).value = { formula: `AVERAGE(F${startStratDataRow}:F${lastStratRow})` };
    totalStratRow.getCell(7).value = '';
    totalStratRow.getCell(8).value = { formula: `SUM(H${startStratDataRow}:H${lastStratRow})` };
    totalStratRow.getCell(9).value = { formula: `SUM(I${startStratDataRow}:I${lastStratRow})` };
    totalStratRow.getCell(10).value = { formula: `SUM(J${startStratDataRow}:J${lastStratRow})` };
    totalStratRow.getCell(11).value = { formula: `SUM(K${startStratDataRow}:K${lastStratRow})` };
    totalStratRow.getCell(12).value = { formula: `SUM(L${startStratDataRow}:L${lastStratRow})` };
    totalStratRow.getCell(13).value = { formula: `SUM(M${startStratDataRow}:M${lastStratRow})` };
    totalStratRow.getCell(14).value = { formula: `SUM(N${startStratDataRow}:N${lastStratRow})` };
    totalStratRow.getCell(15).value = '';

    for (let c = 1; c <= 15; c++) {
      const cell = totalStratRow.getCell(c);
      cell.fill = STYLES.totalFill;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      cell.border = {
        top: { style: 'double', color: { argb: 'FF0F172A' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      if (c === 2) cell.alignment = { vertical: 'middle', horizontal: 'left' };
      if (c === 6) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = STYLES.percentFmt;
      } else if (c >= 3 && c <= 14) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = STYLES.currencyFmt;
      }
    }

    wsStrat.mergeCells('A51:O54');
    const noteCell = wsStrat.getCell('A51');
    noteCell.value =
      'CATATAN STRATEGIS & KETENTUAN OPERASIONAL MILESTONE:\n' +
      '1. Model Milestone: Komisi Sales = 10% dari Profit Transaksi untuk order #1–49. Mulai order ke-50, komisi Sales otomatis naik menjadi 15% (naik +50% per transaksi).\n' +
      '2. Kenaikan 15% TIDAK retroaktif (order masa lalu tetap menggunakan komisi 10% saat transaksi dicatat).\n' +
      '3. Bonus Recruiter tetap flat 2% dari Profit Transaksi (direct recruiter, 1 level saja, tidak bertingkat).\n' +
      '4. Diskon Referral Customer sebesar Rp 1.000 berlaku 1x transaksi pertama customer baru dan dipotong sebelum menghitung Profit Transaksi.\n' +
      '5. Harga final pada katalog ini dirancang terstruktur sehingga setelah komisi Sales naik ke 15%, profit yang diterima Asterra tetap bertumbuh (+7.8% per order).';
    noteCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF334155' } };
    noteCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    noteCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    noteCell.border = STYLES.borderThin;

    wsStrat.autoFilter = {
      from: { row: 11, column: 1 },
      to: { row: lastStratRow, column: 15 },
    };
  }

  const outputPath = path.resolve(process.cwd(), 'Data_Produk_Aktif_Asterra_Store.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`Excel file successfully created at: ${outputPath}`);

  const milestonePath = path.resolve(process.cwd(), 'Data_Produk_Aktif_Asterra_Store_MILESTONE_50_FINAL.xlsx');
  await workbook.xlsx.writeFile(milestonePath);
  console.log(`Also synchronized final milestone export: ${milestonePath}`);

  await prisma.$disconnect();
}

generateExcel().catch((err) => {
  console.error('Error generating Excel file:', err);
  process.exit(1);
});
