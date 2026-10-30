import { cache } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parseProductDurations } from '@/lib/services/product-duration';
import { findRelevantProducts } from '@/lib/services/product-relevance';
import { resolveProductFamily, parseProductVariant } from '@/lib/services/product-variant-parser';
import { ProductDetailClient, ProductDetailData } from './product-detail-client';
import { ProductItem } from '@/lib/products-data';
import { getStoreOperatingHoursServer } from '@/lib/server/store-operating-hours';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:8000';

async function fetchActiveProductsImpl(): Promise<ProductItem[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/products`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('[Product Detail] Failed to fetch products from backend:', err);
    return [];
  }
}

// React cache deduplicates concurrent calls between generateMetadata and ProductDetailPage
const fetchActiveProducts = cache(fetchActiveProductsImpl);

async function fetchProductByIdImpl(id: string, activeProducts?: ProductItem[]): Promise<ProductItem | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/products/${id}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success !== false) {
        return (json.data as ProductItem) || (json.name ? (json as ProductItem) : null);
      }
    }
  } catch (err) {
    console.error(`[Product Detail] Failed to fetch product ${id} from backend:`, err);
  }

  // Fallback to activeProducts if direct fetch didn't return
  if (activeProducts && activeProducts.length > 0) {
    const found = activeProducts.find(
      (p) => p.id === id || p.providerCode === id || (p as any).provider_code === id
    );
    if (found) return found;
  }
  return null;
}

const fetchProductById = cache(fetchProductByIdImpl);

async function fetchCardByIdOrSlugImpl(idOrSlug: string): Promise<any> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/cards/${idOrSlug}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

const fetchCardByIdOrSlug = cache(fetchCardByIdOrSlugImpl);


interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const [activeProducts, initialCardData] = await Promise.all([
    fetchActiveProducts(),
    fetchCardByIdOrSlug(id),
  ]);
  const baseProduct = await fetchProductById(id, activeProducts);

  let cardData = initialCardData;
  if (!cardData && baseProduct && ((baseProduct as any).cardId || (baseProduct as any).card_id)) {
    const parentCardId = (baseProduct as any).cardId || (baseProduct as any).card_id;
    cardData = await fetchCardByIdOrSlug(parentCardId);
  }

  // Note 2: If the group is inactive/archived or product's parent group is inactive, hide from user (404)
  if (cardData && cardData.status && cardData.status !== 'active') {
    notFound();
  }
  if (baseProduct && (baseProduct as any).cardStatus && (baseProduct as any).cardStatus !== 'active') {
    notFound();
  }

  const familyData = cardData && Array.isArray(cardData.catalogs) && cardData.catalogs.length > 0
    ? {
        name: cardData.name,
        category: cardData.category || { id: cardData.categoryId || 'cat-digital', name: cardData.categoryName || 'Layanan Digital' },
        imageUrl: cardData.logoUrl || cardData.imageUrl || '/images/default-product-banner.png',
        description: cardData.description || `Akses resmi bergaransi penuh untuk ${cardData.name} di Asterra Store.`,
        price: cardData.minPrice || 0,
        id: cardData.id,
      }
    : resolveProductFamily(id, activeProducts);

  const product = familyData
    ? {
        name: familyData.name,
        category: familyData.category,
        imageUrl: familyData.imageUrl,
        description: familyData.description,
        price: ('selectedVariant' in familyData && familyData.selectedVariant) ? familyData.selectedVariant.price : (familyData as any).price || 0,
        id: ('selectedVariant' in familyData && familyData.selectedVariant) ? familyData.selectedVariant.id : (familyData as any).id || id,
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

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://asterrastore.biz.id';
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
  const [activeProducts, storeStatus, initialCardData] = await Promise.all([
    fetchActiveProducts(),
    getStoreOperatingHoursServer(),
    fetchCardByIdOrSlug(id),
  ]);
  const baseProduct = await fetchProductById(id, activeProducts);

  let cardData = initialCardData;
  if (!cardData && baseProduct && ((baseProduct as any).cardId || (baseProduct as any).card_id)) {
    const parentCardId = (baseProduct as any).cardId || (baseProduct as any).card_id;
    cardData = await fetchCardByIdOrSlug(parentCardId);
  }

  // Note 2: If the group is inactive/archived or product's parent group is inactive, hide from user (404)
  if (cardData && cardData.status && cardData.status !== 'active') {
    notFound();
  }
  if (baseProduct && (baseProduct as any).cardStatus && (baseProduct as any).cardStatus !== 'active') {
    notFound();
  }

  let familyData: any = null;
  if (cardData && Array.isArray(cardData.catalogs) && cardData.catalogs.length > 0) {
    const activeCatalogs = (cardData.catalogs || []).filter((c: any) => c.status === 'active');
    const parsedVariants = activeCatalogs.map((c: any) => parseProductVariant(c));
    parsedVariants.sort((a: any, b: any) => a.price - b.price);
    const matchingVariant = parsedVariants.find((v: any) => v.id === id || (baseProduct && v.id === baseProduct.id));
    const selectedVariant = matchingVariant || parsedVariants.find((v: any) => !v.isOutOfStock) || parsedVariants[0];

    const fallbackFeatures = ['Garansi Penuh 100% Penggantian', 'Aktivasi Instan 1 - 15 Menit', 'Dukungan CS 24 Jam'];

    familyData = {
      slug: cardData.slug,
      name: cardData.name,
      category: cardData.category || { id: cardData.categoryId || 'cat-digital', name: cardData.categoryName || 'Layanan Digital' },
      imageUrl: cardData.logoUrl || cardData.imageUrl || '/images/default-product-banner.png',
      rating: String(cardData.rating || '5.0'),
      soldCount: Math.min(40, Math.max(20, cardData.soldCount || 30)),
      description: cardData.description || `Akses resmi dan bergaransi penuh untuk ${cardData.name} di Asterra Store dengan konfirmasi otomatis dan dukungan CS 24 jam.`,
      features: (selectedVariant?.features && selectedVariant.features.length > 0) ? selectedVariant.features : fallbackFeatures,
      variants: parsedVariants,
      selectedVariant,
    };
  } else {
    familyData = resolveProductFamily(id, activeProducts);
  }

  if (!familyData && (!baseProduct || baseProduct.status === 'archived')) {
    notFound();
  }

  const activeVariant = familyData?.selectedVariant;
  const productName = activeVariant?.name || familyData?.name || baseProduct?.name || 'Produk Digital';
  const productImageUrl = activeVariant?.imageUrl || familyData?.imageUrl || baseProduct?.imageUrl || '/images/default-product-banner.png';
  const productDesc = activeVariant?.description || baseProduct?.description || familyData?.description || '';
  const productFeatures = (activeVariant?.features && activeVariant.features.length > 0)
    ? activeVariant.features
    : (baseProduct?.features && baseProduct.features.length > 0)
    ? baseProduct.features
    : (familyData?.features && familyData.features.length > 0)
    ? familyData.features
    : ['Garansi 100% Penggantian', 'Aktivasi Instan'];
  const productCategory = familyData?.category || baseProduct?.category || { id: 'cat-digital', name: 'Layanan Digital' };
  const productPrice = activeVariant ? activeVariant.price : (baseProduct?.price || 0);
  const productPriceFormatted = activeVariant ? activeVariant.priceFormatted : (baseProduct?.priceFormatted || `Rp ${productPrice.toLocaleString('id-ID')}`);

  const guaranteeTitle = activeVariant?.guaranteeTitle || (baseProduct as any)?.guaranteeTitle || (baseProduct as any)?.guarantee_title || 'Garansi Penuh';
  const guaranteeDesc = activeVariant?.guaranteeDesc || (baseProduct as any)?.guaranteeDesc || (baseProduct as any)?.guarantee_desc || 'Jaminan ganti akun 100%';
  const processTitle = activeVariant?.processTitle || (baseProduct as any)?.processTitle || (baseProduct as any)?.process_title || 'Proses Instan';
  const processDesc = activeVariant?.processDesc || (baseProduct as any)?.processDesc || (baseProduct as any)?.process_desc || '1 - 15 menit selesai';
  const privacyTitle = activeVariant?.privacyTitle || (baseProduct as any)?.privacyTitle || (baseProduct as any)?.privacy_title || 'Akun Private';
  const privacyDesc = activeVariant?.privacyDesc || (baseProduct as any)?.privacyDesc || (baseProduct as any)?.privacy_desc || 'Ruang kerja aman & personal';

  const resolvedProduct = baseProduct || {
    id: activeVariant?.id || id,
    name: productName,
    category: productCategory,
    price: productPrice,
    priceFormatted: productPriceFormatted,
    description: productDesc,
    features: productFeatures,
    guaranteeTitle,
    guaranteeDesc,
    processTitle,
    processDesc,
    privacyTitle,
    privacyDesc,
    status: 'active' as const,
    stock: activeVariant?.stock ?? 100,
    imageUrl: productImageUrl,
    provider: 'vip-reseller' as const,
    providerCode: activeVariant?.id || id,
  };

  const { durations, primaryDurationLabel, warranty } = parseProductDurations(resolvedProduct);
  const relevantProducts = findRelevantProducts(resolvedProduct, activeProducts, 3);

  const initialData: ProductDetailData = {
    ...resolvedProduct,
    id: activeVariant?.id || resolvedProduct.id,
    name: productName,
    category: productCategory,
    price: productPrice,
    priceFormatted: productPriceFormatted,
    description: productDesc,
    features: productFeatures,
    guaranteeTitle,
    guaranteeDesc,
    processTitle,
    processDesc,
    privacyTitle,
    privacyDesc,
    imageUrl: productImageUrl,
    familySlug: familyData?.slug,
    familyImageUrl: familyData?.imageUrl || productImageUrl,
    rating: familyData?.rating || '5.0',
    soldCount: familyData?.soldCount || 30,
    variants: familyData?.variants || [],
    selectedVariant: activeVariant,
    durations,
    specifications: [
      {
        label: 'Tipe Lisensi',
        value: privacyTitle,
      },
      {
        label: 'Durasi Masa Aktif',
        value: (processTitle && (processTitle.includes('Bulan') || processTitle.includes('Hari') || processTitle.includes('Tahun') || processTitle.includes('Lifetime'))) ? processTitle : (activeVariant ? activeVariant.duration : primaryDurationLabel),
      },
      {
        label: 'Masa Garansi',
        value: guaranteeTitle,
      },
      {
        label: 'Kode Layanan Supplier',
        value: activeVariant?.id || (resolvedProduct as { providerCode?: string }).providerCode || '-',
      },
      { label: 'Waktu Pengiriman', value: processDesc },
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

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://asterrastore.biz.id';
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
      <ProductDetailClient
        id={id}
        initialData={initialData}
        initialStoreStatus={storeStatus}
      />
    </>
  );
}
