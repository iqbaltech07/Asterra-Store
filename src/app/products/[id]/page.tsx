import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PrismaCatalogRepository } from '@/lib/services/prisma-catalog.repository';
import { parseProductDurations } from '@/lib/services/product-duration';
import { findRelevantProducts } from '@/lib/services/product-relevance';
import { resolveProductFamily } from '@/lib/services/product-variant-parser';
import { ProductDetailClient, ProductDetailData } from './product-detail-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { products: activeProducts } = await PrismaCatalogRepository.getActiveProducts();
  const familyData = resolveProductFamily(id, activeProducts);
  const baseProduct = await PrismaCatalogRepository.getProductById(id);

  const product = familyData
    ? {
        name: familyData.name,
        category: familyData.category,
        imageUrl: familyData.imageUrl,
        description: familyData.description,
        price: familyData.selectedVariant.price,
        id: familyData.selectedVariant.id,
      }
    : baseProduct;

  if (!product) {
    return {
      title: 'Produk Tidak Ditemukan | Asterra Store',
      description: 'Layanan lisensi digital yang Anda cari tidak tersedia di Asterra Store.',
    };
  }

  const title = `${product.name} Resmi Bergaransi | Asterra Store`;
  const description =
    product.description && product.description.length > 20
      ? `${product.description.slice(0, 150)}... Beli resmi bergaransi di Asterra Store.`
      : `Beli lisensi resmi ${product.name} bergaransi penuh 100% di Asterra Store. Aktivasi instan 1-15 menit, harga Rp ${product.price.toLocaleString('id-ID')}.`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://asterrastore.biz.id';
  const productUrl = `${siteUrl}/products/${id}`;

  return {
    title,
    description,
    keywords: [
      product.name,
      product.category?.name || 'Layanan Digital',
      'lisensi resmi',
      'akun premium',
      'garansi penuh',
      'asterra store',
      'beli lisensi digital',
    ],
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title,
      description,
      url: productUrl,
      siteName: 'Asterra Store',
      locale: 'id_ID',
      type: 'website',
      images: [
        {
          url: product.imageUrl,
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [product.imageUrl],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { products: activeProducts } = await PrismaCatalogRepository.getActiveProducts();
  const familyData = resolveProductFamily(id, activeProducts);
  const baseProduct = await PrismaCatalogRepository.getProductById(id);

  if (!familyData && (!baseProduct || baseProduct.status === 'archived')) {
    notFound();
  }

  const activeVariant = familyData?.selectedVariant;
  const productName = familyData?.name || baseProduct?.name || 'Produk Digital';
  const productImageUrl = familyData?.imageUrl || baseProduct?.imageUrl || '/images/default-product-banner.png';
  const productDesc = familyData?.description || baseProduct?.description || '';
  const productFeatures = familyData?.features || baseProduct?.features || ['Garansi 100% Penggantian', 'Aktivasi Instan'];
  const productCategory = familyData?.category || baseProduct?.category || { id: 'cat-digital', name: 'Layanan Digital' };
  const productPrice = activeVariant ? activeVariant.price : (baseProduct?.price || 0);
  const productPriceFormatted = activeVariant ? activeVariant.priceFormatted : (baseProduct?.priceFormatted || `Rp ${productPrice.toLocaleString('id-ID')}`);

  const fallbackProduct = baseProduct || {
    id: activeVariant?.id || id,
    name: productName,
    category: productCategory,
    price: productPrice,
    priceFormatted: productPriceFormatted,
    description: productDesc,
    features: productFeatures,
    status: 'active' as const,
    stock: activeVariant?.stock ?? 100,
    imageUrl: productImageUrl,
    provider: 'vip-reseller' as const,
    providerCode: activeVariant?.id || id,
  };

  const { durations, primaryDurationLabel, warranty } = parseProductDurations(fallbackProduct);
  const relevantProducts = findRelevantProducts(fallbackProduct, activeProducts, 3);

  const initialData: ProductDetailData = {
    ...fallbackProduct,
    id: activeVariant?.id || fallbackProduct.id,
    name: productName,
    category: productCategory,
    price: productPrice,
    priceFormatted: productPriceFormatted,
    description: productDesc,
    features: productFeatures,
    imageUrl: productImageUrl,
    familySlug: familyData?.slug,
    familyImageUrl: familyData?.imageUrl || productImageUrl,
    rating: familyData?.rating || '5.0',
    soldCount: familyData?.soldCount || 850,
    variants: familyData?.variants || [],
    selectedVariant: activeVariant,
    durations,
    specifications: [
      {
        label: 'Tipe Lisensi',
        value: activeVariant ? activeVariant.type : 'Akun Private / Akses Resmi Premium',
      },
      {
        label: 'Durasi Masa Aktif',
        value: activeVariant ? activeVariant.duration : primaryDurationLabel,
      },
      {
        label: 'Masa Garansi',
        value: activeVariant ? activeVariant.warranty : warranty,
      },
      {
        label: 'Kode Layanan Supplier',
        value: activeVariant?.id || fallbackProduct.providerCode || '-',
      },
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
      {
        question: 'Bagaimana jika akun tidak dapat digunakan?',
        answer:
          'Jika Anda mengalami kendala saat login atau kredensial bermasalah, segera hubungi tim CS Asterra Store melalui WhatsApp. Kami akan melakukan verifikasi akun dan memberikan penggantian baru sesuai ketentuan garansi.',
      },
      {
        question: 'Apa yang harus dilakukan jika terjadi kendala?',
        answer:
          'Cukup siapkan nomor Invoice pesanan Anda dan hubungi WhatsApp CS Asterra Store. Tim kami siap membantu panduan setup maupun klaim garansi.',
      },
    ],
    relatedProducts: relevantProducts.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      priceFormatted: p.priceFormatted,
      imageUrl: p.imageUrl,
      stock: p.stock,
      providerStatus: p.providerStatus,
    })),
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://asterrastore.biz.id';
  const productUrl = `${siteUrl}/products/${initialData.id}`;

  // Structured Data (JSON-LD) for Search Engines & AI Crawlers [T21]
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: initialData.name,
    image: [initialData.imageUrl],
    description: initialData.description || `Lisensi resmi ${initialData.name} bergaransi di Asterra Store.`,
    sku: initialData.id,
    mpn: initialData.providerCode || initialData.id,
    brand: {
      '@type': 'Brand',
      name: initialData.brand && initialData.brand !== 'Custom' ? initialData.brand : 'Asterra Store',
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'IDR',
      price: initialData.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        initialData.stock !== undefined && initialData.stock <= 0
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Asterra Store',
      },
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Beranda',
        item: siteUrl,
      },
      {
        '@type': 'Katalog Produk',
        position: 2,
        name: 'Katalog Produk',
        item: `${siteUrl}/products`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: initialData.name,
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetailClient id={id} initialData={initialData} />
    </>
  );
}
