import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log(' Asterra Store: Prisma Database Migration Utility  ');
  console.log('====================================================\n');

  const catalogPath = path.resolve(process.cwd(), 'data/managed-catalog.json');
  const activeCatalogPath = path.resolve(process.cwd(), 'data/active-catalog.json');

  if (!fs.existsSync(catalogPath)) {
    console.error(`❌ File ${catalogPath} tidak ditemukan!`);
    process.exit(1);
  }

  console.log('📖 Membaca catalog dari data/managed-catalog.json...');
  const rawData = fs.readFileSync(catalogPath, 'utf-8');
  const allProducts = JSON.parse(rawData);

  console.log(`ℹ Total produk ditemukan: ${allProducts.length}`);

  // Filter only active products (Apps & Streaming)
  const activeProducts = allProducts.filter((p) => p.status === 'active');
  console.log(`ℹ Total produk aktif (Apps & Streaming): ${activeProducts.length}`);

  // 1. Simpan salinan bersih 200KB untuk fallback lokal
  fs.writeFileSync(activeCatalogPath, JSON.stringify(activeProducts, null, 2), 'utf-8');
  const activeStat = fs.statSync(activeCatalogPath);
  console.log(`✅ Salinan offline tersimpan di: data/active-catalog.json (${(activeStat.size / 1024).toFixed(1)} KB)`);

  // 2. Hubungkan ke database Supabase via Prisma
  console.log('\n🔌 Menghubungkan ke Supabase PostgreSQL via Prisma...');
  
  try {
    await prisma.$connect();
    console.log('✅ Berhasil terhubung ke Supabase Database!\n');

    console.log(`🚀 Memulai migrasi ${activeProducts.length} produk aktif ke database...`);
    let successCount = 0;
    let errorCount = 0;

    // Batch upsert in chunks of 50
    const CHUNK_SIZE = 50;
    for (let i = 0; i < activeProducts.length; i += CHUNK_SIZE) {
      const chunk = activeProducts.slice(i, i + CHUNK_SIZE);
      
      await Promise.all(
        chunk.map(async (prod) => {
          try {
            await prisma.product.upsert({
              where: { id: prod.id },
              update: {
                name: prod.name,
                categoryId: prod.category.id,
                categoryName: prod.category.name,
                brand: prod.features?.find((f) => f.startsWith('Brand:'))?.replace('Brand:', '').trim() || 'Apps & Streaming',
                price: prod.price,
                priceFormatted: prod.priceFormatted,
                description: prod.description || null,
                features: prod.features || [],
                status: prod.status || 'active',
                imageUrl: prod.imageUrl || null,
                popular: Boolean(prod.popular),
                provider: prod.provider || 'vip-reseller',
                providerCode: prod.providerCode || null,
                providerName: prod.providerName || null,
                providerPrice: prod.providerPrice || null,
                providerStatus: prod.providerStatus || null,
                lastProviderCheck: prod.lastProviderCheck ? new Date(prod.lastProviderCheck) : null,
                profitMargin: prod.profitMargin || null,
                profitPercentage: prod.profitPercentage || null,
              },
              create: {
                id: prod.id,
                name: prod.name,
                categoryId: prod.category.id,
                categoryName: prod.category.name,
                brand: prod.features?.find((f) => f.startsWith('Brand:'))?.replace('Brand:', '').trim() || 'Apps & Streaming',
                price: prod.price,
                priceFormatted: prod.priceFormatted,
                description: prod.description || null,
                features: prod.features || [],
                status: prod.status || 'active',
                imageUrl: prod.imageUrl || null,
                popular: Boolean(prod.popular),
                provider: prod.provider || 'vip-reseller',
                providerCode: prod.providerCode || null,
                providerName: prod.providerName || null,
                providerPrice: prod.providerPrice || null,
                providerStatus: prod.providerStatus || null,
                lastProviderCheck: prod.lastProviderCheck ? new Date(prod.lastProviderCheck) : null,
                profitMargin: prod.profitMargin || null,
                profitPercentage: prod.profitPercentage || null,
              },
            });
            successCount++;
          } catch (err) {
            console.error(`❌ Gagal migrasi produk ${prod.id}:`, err.message);
            errorCount++;
          }
        })
      );
      
      console.log(`   Progres: ${Math.min(i + CHUNK_SIZE, activeProducts.length)} / ${activeProducts.length} produk...`);
    }

    console.log('\n====================================================');
    console.log(`🎉 Migrasi Selesai!`);
    console.log(`   Sukses: ${successCount} produk`);
    if (errorCount > 0) console.log(`   Gagal:  ${errorCount} produk`);
    console.log('====================================================\n');

    const dbCount = await prisma.product.count({ where: { status: 'active' } });
    console.log(`📊 Total produk aktif terverifikasi di Supabase: ${dbCount}`);

  } catch (err) {
    console.error('❌ Terjadi kesalahan fatal saat migrasi database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
