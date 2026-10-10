require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function mapCategory(product) {
  const code = (product.providerCode || '').toUpperCase();
  const name = (product.name || '').toUpperCase();
  const brand = (product.brand || '').toUpperCase();

  if (
    code.includes('CHATGPT') ||
    code.includes('GEMINI') ||
    name.includes('CHATGPT') ||
    name.includes('GEMINI') ||
    name.includes('GOOGLE AI') ||
    name.includes('GOOGLE PRO') ||
    name.includes('CLAUDE') ||
    name.includes('OPENAI') ||
    brand.includes('OPENAI') ||
    product.categoryId === 'cat-ai-tools' ||
    product.categoryName === 'AI Tools'
  ) {
    return { id: 'cat-ai-tools', name: 'AI Tools' };
  }

  if (
    brand.includes('NETFLIX') ||
    brand.includes('YOUTUBE') ||
    brand.includes('SPOTIFY') ||
    name.includes('CANVA') ||
    name.includes('CAPCUT') ||
    name.includes('NETFLIX') ||
    name.includes('YOUTUBE') ||
    name.includes('SPOTIFY') ||
    name.includes('VIDIO') ||
    name.includes('VIU') ||
    name.includes('WETV') ||
    name.includes('BSTATION') ||
    name.includes('IQIYI') ||
    name.includes('ALIGHT') ||
    product.categoryId === 'cat-apps-streaming' ||
    product.categoryName === 'Apps & Streaming'
  ) {
    return { id: 'cat-apps-streaming', name: 'Apps & Streaming' };
  }

  if (
    product.categoryId === 'digital' ||
    product.categoryId === 'cat-digital-services' ||
    product.categoryName === 'Layanan Digital' ||
    name.includes('LAYANAN DIGITAL')
  ) {
    return { id: 'cat-digital-services', name: 'Layanan Digital' };
  }

  return {
    id: product.categoryId || 'cat-apps-streaming',
    name: product.categoryName || 'Apps & Streaming',
  };
}

function formatProduct(p) {
  const category = mapCategory(p);
  return {
    id: p.id,
    name: p.name,
    category,
    categoryId: category.id,
    categoryName: category.name,
    price: p.price,
    priceFormatted: p.priceFormatted || `Rp ${p.price.toLocaleString('id-ID')}`,
    description: p.description || '',
    features: Array.isArray(p.features) ? p.features : [],
    status: p.status || 'active',
    stock: p.stock ?? 100,
    providerStatus: p.providerStatus || 'available',
    imageUrl: p.imageUrl || '/images/default-product-banner.png',
    popular: Boolean(p.popular),
    brand: p.brand || 'Digital',
    provider: p.provider || 'vip-reseller',
    providerCode: p.providerCode || undefined,
    providerPrice: p.providerPrice || undefined,
    profitMargin: p.profitMargin || undefined,
    profitPercentage: p.profitPercentage || undefined,
    guaranteeTitle: p.guaranteeTitle || 'Garansi Penuh',
    guaranteeDesc: p.guaranteeDesc || 'Jaminan ganti akun 100%',
    processTitle: p.processTitle || 'Proses Instan',
    processDesc: p.processDesc || '1 - 15 menit selesai',
    privacyTitle: p.privacyTitle || 'Akun Private',
    privacyDesc: p.privacyDesc || 'Ruang kerja aman & personal',
  };
}

async function exportAll() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const [orders, admins, partners, promos, paymentSettings, allDbProducts] = await Promise.all([
    prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } }),
    prisma.adminUser.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.salesPartner.findMany({ include: { commissions: true }, orderBy: { createdAt: 'desc' } }),
    prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.paymentSetting.findMany(),
    prisma.product.findMany({
      orderBy: [{ popular: 'desc' }, { name: 'asc' }],
    }),
  ]);

  // Format products
  const formattedAll = allDbProducts.map(formatProduct);
  const activeProducts = formattedAll.filter((p) => p.status === 'active');

  // Sort active products so popular items and AI Tools come first
  activeProducts.sort((a, b) => {
    if (a.popular !== b.popular) return a.popular ? -1 : 1;
    if (a.category.name === 'AI Tools' && b.category.name !== 'AI Tools') return -1;
    if (a.category.name !== 'AI Tools' && b.category.name === 'AI Tools') return 1;
    return a.name.localeCompare(b.name);
  });

  fs.writeFileSync(path.join(dataDir, 'supabase-orders.json'), JSON.stringify(orders, null, 2));
  fs.writeFileSync(path.join(dataDir, 'supabase-admins.json'), JSON.stringify(admins, null, 2));
  fs.writeFileSync(path.join(dataDir, 'supabase-partners.json'), JSON.stringify(partners, null, 2));
  fs.writeFileSync(path.join(dataDir, 'supabase-promos.json'), JSON.stringify(promos, null, 2));
  fs.writeFileSync(path.join(dataDir, 'supabase-payment-settings.json'), JSON.stringify(paymentSettings, null, 2));

  // Write active and managed catalogs
  const activeCatalogJson = JSON.stringify(activeProducts, null, 2);
  fs.writeFileSync(path.join(dataDir, 'active-catalog.json'), activeCatalogJson);
  fs.writeFileSync(path.join(dataDir, 'managed-catalog.json'), JSON.stringify(formattedAll, null, 2));

  // Sync to frontends fallback if data folder exists
  const frontendUserDir = path.resolve(__dirname, '../../frontend-user/data');
  if (fs.existsSync(frontendUserDir)) {
    fs.writeFileSync(path.join(frontendUserDir, 'active-catalog.json'), activeCatalogJson);
  }
  const frontendAdminDir = path.resolve(__dirname, '../../frontend-admin/data');
  if (fs.existsSync(frontendAdminDir)) {
    fs.writeFileSync(path.join(frontendAdminDir, 'active-catalog.json'), activeCatalogJson);
  }
  const frontendSalesDir = path.resolve(__dirname, '../../frontend-sales/data');
  if (fs.existsSync(frontendSalesDir)) {
    fs.writeFileSync(path.join(frontendSalesDir, 'active-catalog.json'), activeCatalogJson);
  }

  const categoryBreakdown = {};
  activeProducts.forEach((p) => {
    categoryBreakdown[p.category.name] = (categoryBreakdown[p.category.name] || 0) + 1;
  });

  console.log('Exported successfully from Supabase:', {
    orders: orders.length,
    admins: admins.length,
    partners: partners.length,
    promos: promos.length,
    paymentSettings: paymentSettings.length,
    activeProducts: activeProducts.length,
    totalProducts: formattedAll.length,
    categoryBreakdown,
  });
}

exportAll()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
