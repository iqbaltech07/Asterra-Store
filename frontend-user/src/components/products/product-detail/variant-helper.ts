import { ParsedVariant, cleanHtmlContent } from '@/lib/services/product-variant-parser';
import { ProductDetailData, VariantDetails, SpecItem } from './types';

export function getVariantDetails(
  variant: ParsedVariant | null,
  product: ProductDetailData | undefined
): VariantDetails {
  if (!product && !variant) {
    return {
      title: 'Detail Produk',
      desc: '',
      features: [],
      guaranteeTitle: 'Garansi Penuh',
      guaranteeDesc: 'Jaminan ganti akun 100%',
      processTitle: 'Proses Instan',
      processDesc: '1 - 15 menit selesai',
      privacyTitle: 'Akun Private',
      privacyDesc: 'Akses resmi & aman',
      specifications: [],
      warrantyText: 'Garansi resmi Asterra Store.',
      hasWarranty: true,
    };
  }

  const type = variant?.type || 'Private';
  const duration = variant?.duration || '1 Bulan';
  const warranty = variant?.warranty || '1 Bulan';
  const paket = variant?.paket || (product?.name ? product.name.split('[')[0].trim() : 'Standard');
  const fullName = variant?.name || product?.name || 'Produk Digital';

  const isShared = type.toLowerCase().includes('shared');
  const isInvite = type.toLowerCase().includes('anggota') || type.toLowerCase().includes('invite');
  const isDesigner = type.toLowerCase().includes('desainer') || type.toLowerCase().includes('head');

  const rawG = `${warranty} ${variant?.guaranteeTitle || ''} ${variant?.guaranteeDesc || ''} ${product?.guaranteeTitle || ''} ${variant?.name || ''} ${product?.name || ''}`.toLowerCase();
  const hasWarranty = !(
    rawG.includes('tanpa garansi') ||
    rawG.includes('tidak ada garansi') ||
    rawG.includes('tidak bergaransi') ||
    rawG.includes('non garansi') ||
    rawG.includes('no warranty') ||
    rawG.includes('no garansi') ||
    rawG.includes('0 hari') ||
    rawG.includes('0 bulan') ||
    (variant?.warranty && variant.warranty.toLowerCase().trim() === 'tanpa garansi')
  );

  // 1. Description: prioritize variant description, then product description, then fallback template
  let desc = '';
  if (variant?.description && variant.description.trim().length > 0) {
    desc = cleanHtmlContent(variant.description);
  } else if (product?.description && product.description.trim().length > 0) {
    desc = cleanHtmlContent(product.description);
  } else {
    const warrantyClause = hasWarranty
      ? `Dilindungi penuh dengan garansi resmi Asterra Store selama ${warranty}.`
      : 'Paket hemat ini disediakan tanpa fasilitas garansi penggantian akun.';
    if (isShared) {
      desc = `${fullName} — Solusi berlangganan super hemat dengan akun Shared resmi. Anda mendapatkan 1 profil khusus dengan PIN pengaman pribadi. Akses lancar, kualitas streaming/fitur premium tertinggi tanpa antrean, dan dilarang merubah data email utama demi kestabilan akun. ${warrantyClause}`;
    } else if (isInvite) {
      desc = `${fullName} — Upgrade lisensi resmi via undangan langsung ke akun email pribadi Anda. Tidak perlu login akun baru, seluruh data kerja, template, dan riwayat proyek Anda tersimpan aman 100%. Aktivasi instan 1-15 menit dengan masa aktif ${duration}. ${warrantyClause}`;
    } else if (isDesigner) {
      desc = `${fullName} — Paket lisensi eksklusif dengan otoritas tertinggi untuk desainer & tim profesional. Termasuk fitur kolaborasi tim penuh, cloud workspace terintegrasi, dan prioritas server. Masa aktif ${duration}. ${warrantyClause}`;
    } else {
      desc = `${fullName} — Akun Private eksklusif full akses 100% milik Anda sendiri. Dilengkapi kredensial privat (email & password), bebas digunakan di berbagai perangkat, tanpa sharing dengan pihak ketiga, dan privasi total terjamin. Masa aktif ${duration}. ${warrantyClause}`;
    }
  }

  // 2. Features / Benefits: prioritize variant features, then product features, then fallback template
  let features: string[] = [];
  if (variant?.features && variant.features.length > 0) {
    features = variant.features.map(cleanHtmlContent).filter(Boolean);
  } else if (product?.features && product.features.length > 0) {
    features = product.features.map(cleanHtmlContent).filter(Boolean);
  } else {
    const warrantyFeature = hasWarranty
      ? `Proteksi Garansi: ${warranty} Penggantian Akun 100% Resmi`
      : 'Ketentuan Layanan: Tanpa Garansi Penggantian Akun';

    if (isShared) {
      features = [
        '1 Profil Khusus dengan PIN Pengaman Pribadi',
        `Masa Aktif: ${duration} Berjalan Penuh Tanpa Jeda`,
        warrantyFeature,
        'Kualitas Streaming & Fitur Premium Maksimal (Ultra HD / 4K / Pro)',
        'Aktivasi Otomatis & Bantuan WhatsApp CS Siaga 24 Jam',
      ];
    } else if (isInvite) {
      features = [
        'Undangan Resmi Langsung ke Akun Email Pribadi Anda',
        'Data Proyek, Desain, dan Template Tersimpan Aman di Email Sendiri',
        `Masa Aktif Penuh: ${duration}`,
        warrantyFeature,
        'Bebas Akses Seluruh Fitur Pro & Kolaborasi Workspace',
      ];
    } else if (isDesigner) {
      features = [
        'Akses Otoritas Penuh & Fitur Kolaborasi Desainer / Tim',
        'Akses Cloud Storage Besar & Integrasi Brand Kit Lengkap',
        `Masa Aktif: ${duration}`,
        warrantyFeature,
        'Semua Aset Desain, Font, dan Ekspor Resolusi Tertinggi Terbuka',
        'Panduan Aktivasi Instan & Dukungan Prioritas Customer Service',
      ];
    } else {
      features = [
        'Akun Private Eksklusif (Email & Password Pribadi Tanpa Sharing)',
        `Masa Aktif: ${duration} Full Coverage`,
        warrantyFeature,
        'Bebas Akses Semua Fitur Premium Tanpa Batas Penggunaan',
        'Dukungan Multi-Device (Web, Android, iOS, Windows, macOS)',
      ];
    }
  }

  // 3. Guarantee, Privacy, Process: prioritize DB values!
  const rawTitle = variant?.guaranteeTitle || product?.guaranteeTitle || `Garansi ${warranty}`;
  const guaranteeTitle = hasWarranty ? rawTitle : 'Tanpa Garansi';
  const guaranteeDesc = hasWarranty
    ? (variant?.guaranteeDesc || product?.guaranteeDesc || 'Jaminan ganti akun 100%')
    : 'Tidak ada garansi penggantian';
  const processTitle = variant?.processTitle || product?.processTitle || 'Proses Instan';
  const processDesc = variant?.processDesc || product?.processDesc || '1 - 15 menit selesai';
  const privacyTitle = variant?.privacyTitle || product?.privacyTitle || `Akun ${type}`;
  const privacyDesc = variant?.privacyDesc || product?.privacyDesc || (isShared
    ? '1 Profil PIN aman'
    : isInvite
    ? 'Invite email pribadi aman'
    : 'Ruang kerja aman & personal');

  const warrantyText = hasWarranty
    ? `Seluruh transaksi untuk paket ${fullName} dilindungi garansi penggantian resmi Asterra Store selama ${guaranteeTitle}. Jika akun mengalami kendala login atau masa aktif terputus sebelum periode garansi berakhir, tim CS kami siap memproses penggantian akun baru 100% gratis dalam hitungan menit.`
    : `Paket ${fullName} ini disediakan dengan penawaran harga hemat tanpa fasilitas garansi penggantian akun setelah pesanan selesai diproses dan dikirimkan. Akun dipastikan aktif dan dapat digunakan saat pertama kali diterima. Harap pastikan Anda memahami ketentuan paket tanpa garansi ini sebelum menyelesaikan transaksi.`;

  const displayDuration = (processTitle && (processTitle.includes('Bulan') || processTitle.includes('Hari') || processTitle.includes('Tahun') || processTitle.includes('Lifetime')))
    ? processTitle
    : duration;

  const specifications: SpecItem[] = [
    { label: 'Paket / Nominal', value: paket },
    { label: 'Tipe Akun', value: privacyTitle },
    { label: 'Durasi Masa Aktif', value: displayDuration },
    { label: 'Proteksi Garansi', value: guaranteeTitle },
    { label: 'Kode SKU / Layanan', value: variant?.id || product?.id || '-' },
    {
      label: 'Status Ketersediaan',
      value: variant?.isOutOfStock ? 'Stok Habis' : `Tersedia (${variant?.stock ?? product?.stock ?? 100} unit)`,
    },
    { label: 'Waktu Pengiriman', value: processDesc },
    {
      label: 'Metode Pengiriman',
      value: isInvite ? 'Email Pribadi (Undangan Resmi)' : 'Kredensial Email & WhatsApp CS',
    },
    { label: 'Kompatibilitas', value: 'Web Browser, Windows, macOS, Android, iOS' },
  ];

  return {
    title: fullName,
    desc,
    features,
    guaranteeTitle,
    guaranteeDesc,
    processTitle,
    processDesc,
    privacyTitle,
    privacyDesc,
    specifications,
    warrantyText,
    hasWarranty,
  };
}
