import { NextRequest, NextResponse } from 'next/server';
import { PrismaCatalogRepository } from '@/lib/services/prisma-catalog.repository';
import { parseProductDurations } from '@/lib/services/product-duration';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const product = await PrismaCatalogRepository.getProductById(id);

  // If product does not exist or has been archived by Admin, return 404 for consumers
  if (!product || product.status === 'archived') {
    return NextResponse.json(
      {
        success: false,
        error: 'Produk tidak ditemukan atau tidak tersedia untuk saat ini.',
      },
      { status: 404 }
    );
  }

  // Active products for related recommendations
  const { products: activeProducts } = await PrismaCatalogRepository.getActiveProducts({ limit: 8 });

  // Extract accurate duration and warranty from product metadata
  const { durations, primaryDurationLabel, warranty } = parseProductDurations(product);

  // Prioritize related products in the same category
  const relatedProducts = activeProducts
    .filter((p) => p.id !== product.id && p.category?.id === product.category?.id)
    .slice(0, 3);

  // Extended product detail schema matching PRD specs
  const responseData = {
    ...product,
    durations,
    specifications: [
      {
        label: 'Tipe Lisensi',
        value: product.provider === 'vip-reseller' ? 'Voucher / Layanan Digital Resmi' : 'Akun Private / Akses Resmi Premium',
      },
      { label: 'Durasi Masa Aktif', value: primaryDurationLabel },
      { label: 'Masa Garansi', value: warranty },
      { label: 'Kode Layanan Supplier', value: product.providerCode || '-' },
      { label: 'Waktu Pengiriman', value: 'Proses Instan (1 - 15 Menit)' },
      { label: 'Metode Pengiriman', value: 'Email Terdaftar & Notifikasi WhatsApp CS' },
      { label: 'Kompatibilitas', value: 'Web Browser, Windows, macOS, Android, iOS' },
    ],
    faqs: [
      {
        question: 'Bagaimana cara aktivasi produk ini setelah pembayaran?',
        answer:
          'Setelah pembayaran diverifikasi, sistem akan otomatis mengirimkan kredensial atau kode aktivasi ke email Anda dan tercatat di menu Pesanan Saya.',
      },
      {
        question: 'Berapa lama waktu proses aktivasi?',
        answer:
          'Sebagian besar pesanan diproses secara instan dalam 1 hingga 15 menit melalui integrasi gateway otomatis kami.',
      },
      {
        question: 'Apakah produk ini bergaransi resmi Asterra Store?',
        answer:
          'Ya, seluruh produk dilindungi garansi 100% penggantian jika mengalami kendala teknis atau akses sebelum masa aktif berakhir.',
      },
    ],
    relatedProducts: relatedProducts.length > 0 ? relatedProducts : activeProducts.filter((p) => p.id !== product.id).slice(0, 3),
  };

  return NextResponse.json({
    success: true,
    data: responseData,
  });
}
