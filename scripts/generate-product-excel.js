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

// Clean and readable product title with brand prefix if missing
function getCleanProductName(p) {
  const brand = getBrandAndApp(p);
  let name = (p.name || '').trim();
  if (brand && !name.toLowerCase().includes(brand.toLowerCase().split(' ')[0])) {
    return `${brand} - ${name}`;
  }
  return name;
}

// Determine Account Type (Private / Sharing)
function getAccountType(p) {
  const name = (p.name || '').toLowerCase();
  const text = (name + ' ' + (p.description || '') + ' ' + (p.features || []).join(' ')).toLowerCase();

  // Explicit check based on product naming
  if (name.includes('head invite') || name.includes('head')) return 'Private (Family Head)';
  if (name.includes('anggota')) return 'Sharing (Invite)';
  if (name.includes('desainer')) return 'Private (Desainer)';
  if (name.includes('shared') || name.includes('sharing')) return 'Sharing';
  if (name.includes('private') || name.includes('privat')) return 'Private';
  if (name.includes('edu') || name.includes('education')) return 'Sharing (Edu)';

  // Fallback to full text
  if (text.includes('shared') || text.includes('sharing')) return 'Sharing';
  if (text.includes('private') || text.includes('privat')) return 'Private';
  if (text.includes('anggota') || text.includes('invite')) return 'Sharing (Invite)';
  if (text.includes('edu')) return 'Sharing (Edu)';

  return 'Private';
}

// Determine Availability Status
function getAvailabilityStatus(p) {
  const isOutOfStock = (p.stock !== undefined && p.stock <= 0) || p.providerStatus === 'empty';
  return isOutOfStock ? 'Kosong' : 'Tersedia';
}

// Style definitions
const STYLES = {
  headerFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }, // Slate 900
  headerFont: { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } },
  zebraFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }, // Slate 50
  whiteFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } },
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
  console.log('Fetching active products from database...');
  const dbActiveProducts = await prisma.product.findMany({
    where: { status: 'active' },
    orderBy: [{ categoryName: 'asc' }, { name: 'asc' }],
  });
  console.log(`Found ${dbActiveProducts.length} active products in database.`);

  console.log('Fetching all products from database (for complete archive reference)...');
  const dbAllProducts = await prisma.product.findMany({
    orderBy: [{ status: 'asc' }, { categoryName: 'asc' }, { name: 'asc' }],
  });
  console.log(`Found ${dbAllProducts.length} total products in database.`);

  let fallbackProducts = [];
  const fallbackPath = path.resolve(process.cwd(), 'data/active-catalog.json');
  if (fs.existsSync(fallbackPath)) {
    try {
      fallbackProducts = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
      console.log(`Found ${fallbackProducts.length} products in data/active-catalog.json.`);
    } catch (e) {
      console.warn('Could not read fallback catalog:', e.message);
    }
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Asterra Store Management System';
  workbook.lastModifiedBy = 'Admin Asterra Store';
  workbook.created = new Date();
  workbook.modified = new Date();

  // =========================================================================
  // SHEET 1: PRODUK AKTIF (37 Produk Live di Toko)
  // =========================================================================
  const wsActive = workbook.addWorksheet('Produk Aktif', {
    properties: { tabColor: { argb: 'FF10B981' } }, // Emerald green tab
    views: [{ state: 'frozen', xSplit: 0, ySplit: 4, showGridLines: true }],
  });

  // Title Banner
  wsActive.mergeCells('A1:J1');
  const titleCell = wsActive.getCell('A1');
  titleCell.value = 'ASTERRA STORE — KATALOG PRODUK AKTIF';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  wsActive.getRow(1).height = 36;

  // Subtitle / Metadata
  wsActive.mergeCells('A2:J2');
  const subCell = wsActive.getCell('A2');
  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  subCell.value = `Tanggal Ekspor: ${todayStr} | Total Produk Aktif: ${dbActiveProducts.length} Produk | Mata Uang: IDR (Rupiah)`;
  subCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF475569' } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  wsActive.getRow(2).height = 22;

  // Empty separator row
  wsActive.getRow(3).height = 8;

  // Define Columns
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

  // Header Row (Row 4)
  const headers = [
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

  const headerRow = wsActive.getRow(4);
  headerRow.height = 28;
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
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

  // Populate Data Rows
  let startRow = 5;
  dbActiveProducts.forEach((p, idx) => {
    const rowNum = startRow + idx;
    const row = wsActive.getRow(rowNum);
    row.height = 24;

    const cleanName = getCleanProductName(p);
    const category = p.categoryName || 'Apps & Streaming';
    const accountType = getAccountType(p);
    const availability = getAvailabilityStatus(p);
    const costPrice = p.providerPrice || 0;
    const sellingPrice = p.price || 0;
    const providerCode = p.providerCode || p.id;

    // Set Values
    row.getCell(1).value = idx + 1; // No
    row.getCell(2).value = cleanName; // Nama Produk
    row.getCell(3).value = category; // Tipe Produk
    row.getCell(4).value = accountType; // Jenis
    row.getCell(5).value = availability; // Status Tersedia
    row.getCell(6).value = costPrice; // Harga Pabrik
    row.getCell(7).value = sellingPrice; // Harga Jual
    row.getCell(8).value = { formula: `G${rowNum}-F${rowNum}` }; // Margin Rp
    row.getCell(9).value = { formula: `IF(F${rowNum}>0,(G${rowNum}-F${rowNum})/F${rowNum},0)` }; // Margin %
    row.getCell(10).value = providerCode; // Kode Layanan

    const isZebra = idx % 2 === 1;
    const baseFill = isZebra ? STYLES.zebraFill : STYLES.whiteFill;

    // Style each cell
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
        if (c === 8) cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF0D9488' } }; // Teal
      } else if (c === 9) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = STYLES.percentFmt;
      } else if (c === 10) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.font = { name: 'Consolas', size: 8.5, color: { argb: 'FF475569' } };
      }
    }
  });

  const lastDataRow = startRow + dbActiveProducts.length - 1;
  const totalRow = wsActive.getRow(lastDataRow + 1);
  totalRow.height = 26;

  totalRow.getCell(1).value = '';
  totalRow.getCell(2).value = 'TOTAL & RATA-RATA';
  totalRow.getCell(3).value = '';
  totalRow.getCell(4).value = '';
  totalRow.getCell(5).value = '';
  totalRow.getCell(6).value = { formula: `SUM(F${startRow}:F${lastDataRow})` };
  totalRow.getCell(7).value = { formula: `SUM(G${startRow}:G${lastDataRow})` };
  totalRow.getCell(8).value = { formula: `SUM(H${startRow}:H${lastDataRow})` };
  totalRow.getCell(9).value = { formula: `AVERAGE(I${startRow}:I${lastDataRow})` };
  totalRow.getCell(10).value = '';

  for (let c = 1; c <= 10; c++) {
    const cell = totalRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
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

  // Enable AutoFilter
  wsActive.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: lastDataRow, column: 10 },
  };

  // =========================================================================
  // SHEET 2: SEMUA PRODUK DATABASE (Aktif & Diarsipkan - 232 Produk)
  // =========================================================================
  const wsAll = workbook.addWorksheet('Semua Produk (DB)', {
    properties: { tabColor: { argb: 'FF3B82F6' } }, // Blue tab
    views: [{ state: 'frozen', xSplit: 0, ySplit: 4, showGridLines: true }],
  });

  wsAll.mergeCells('A1:K1');
  const titleCellAll = wsAll.getCell('A1');
  titleCellAll.value = 'ASTERRA STORE — MASTER KATALOG PRODUK (DATABASE)';
  titleCellAll.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCellAll.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  titleCellAll.alignment = { vertical: 'middle', horizontal: 'center' };
  wsAll.getRow(1).height = 36;

  wsAll.mergeCells('A2:K2');
  const subCellAll = wsAll.getCell('A2');
  subCellAll.value = `Total Produk: ${dbAllProducts.length} (Aktif: ${dbActiveProducts.length}, Arsip: ${dbAllProducts.length - dbActiveProducts.length}) | Tanggal: ${todayStr}`;
  subCellAll.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF475569' } };
  subCellAll.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  subCellAll.alignment = { vertical: 'middle', horizontal: 'center' };
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

  dbAllProducts.forEach((p, idx) => {
    const rowNum = 5 + idx;
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
    row.getCell(10).value = { formula: `IF(G${rowNum}>0,(H${rowNum}-G${rowNum})/G${rowNum},0)` };
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

  const lastAllRow = 4 + dbAllProducts.length;
  wsAll.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: lastAllRow, column: 11 },
  };

  // =========================================================================
  // SHEET 3: KATALOG FALLBACK (active-catalog.json - 245 Produk)
  // =========================================================================
  if (fallbackProducts.length > 0) {
    const wsFallback = workbook.addWorksheet('Katalog Fallback (JSON)', {
      properties: { tabColor: { argb: 'FF8B5CF6' } }, // Purple tab
      views: [{ state: 'frozen', xSplit: 0, ySplit: 4, showGridLines: true }],
    });

    wsFallback.mergeCells('A1:J1');
    const titleCellFb = wsFallback.getCell('A1');
    titleCellFb.value = 'ASTERRA STORE — KATALOG CADANGAN (ACTIVE-CATALOG.JSON)';
    titleCellFb.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCellFb.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    titleCellFb.alignment = { vertical: 'middle', horizontal: 'center' };
    wsFallback.getRow(1).height = 36;

    wsFallback.mergeCells('A2:J2');
    const subCellFb = wsFallback.getCell('A2');
    subCellFb.value = `Total Fallback: ${fallbackProducts.length} Produk | Sumber: data/active-catalog.json`;
    subCellFb.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF475569' } };
    subCellFb.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    subCellFb.alignment = { vertical: 'middle', horizontal: 'center' };
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
    headers.forEach((h, idx) => {
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

    fallbackProducts.forEach((p, idx) => {
      const rowNum = 5 + idx;
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
      row.getCell(9).value = { formula: `IF(F${rowNum}>0,(G${rowNum}-F${rowNum})/F${rowNum},0)` };
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

    const lastFbRow = 4 + fallbackProducts.length;
    wsFallback.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: lastFbRow, column: 10 },
    };
  }

  // Save the workbook
  const outputPath = path.resolve(process.cwd(), 'Data_Produk_Aktif_Asterra_Store.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`Excel file successfully created at: ${outputPath}`);

  await prisma.$disconnect();
}

generateExcel().catch((err) => {
  console.error('Error generating Excel file:', err);
  process.exit(1);
});
