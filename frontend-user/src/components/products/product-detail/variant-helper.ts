import { ParsedVariant, cleanHtmlContent } from '@/lib/services/product-variant-parser';
import { ProductDetailData, VariantDetails, SpecItem } from './types';

export function getVariantDetails(
  variant: ParsedVariant | null,
  product: ProductDetailData | undefined
): VariantDetails {
  if (!product) {
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
    };
  }

  const type = variant?.type || 'Private';
  const duration = variant?.duration || '1 Bulan';
  const warranty = variant?.warranty || '1 Bulan';
  const paket = variant?.paket || product.name.split('[')[0].trim();
  const fullName = variant?.name || product.name;

  const isShared = type.toLowerCase().includes('shared');
  const isInvite = type.toLowerCase().includes('anggota') || type.toLowerCase().includes('invite');
  const isDesigner = type.toLowerCase().includes('desainer') || type.toLowerCase().includes('head');

  let desc = '';
  if (variant?.description && variant.description.trim().length > 30) {
    desc = cleanHtmlContent(variant.description);
  } else {
    if (isShared) {
      desc = `${fullName} — Solusi berlangganan super hemat dengan akun Shared resmi. Anda mendapatkan 1 profil khusus dengan PIN pengaman pribadi. Akses lancar, kualitas streaming/fitur premium tertinggi tanpa antrean, dan dilarang merubah data email utama demi kestabilan akun. Dilindungi penuh dengan garansi resmi Asterra Store selama ${warranty}.`;
    } else if (isInvite) {
      desc = `${fullName} — Upgrade lisensi resmi via undangan langsung ke akun email pribadi Anda. Tidak perlu login akun baru, seluruh data kerja, template, dan riwayat proyek Anda tersimpan aman 100%. Aktivasi instan 1-15 menit dengan masa aktif ${duration} dan proteksi garansi penggantian resmi ${warranty}.`;
    } else if (isDesigner) {
      desc = `${fullName} — Paket lisensi eksklusif dengan otoritas tertinggi untuk desainer & tim profesional. Termasuk fitur kolaborasi tim penuh, cloud workspace terintegrasi, dan prioritas server. Bergaransi resmi ${warranty} dengan masa aktif ${duration}.`;
    } else {
      desc = `${fullName} — Akun Private eksklusif full akses 100% milik Anda sendiri. Dilengkapi kredensial privat (email & password), bebas digunakan di berbagai perangkat, tanpa sharing dengan pihak ketiga, dan privasi total terjamin. Diproteksi dengan garansi resmi Asterra Store selama ${warranty} dengan masa aktif penuh ${duration}.`;
    }
  }

  let features: string[] = [];
  if (isShared) {
    features = [
      '1 Profil Khusus dengan PIN Pengaman Pribadi',
      `Masa Aktif: ${duration} Berjalan Penuh Tanpa Jeda`,
      `Proteksi Garansi: ${warranty} Penggantian Akun 100% Resmi`,
      'Kualitas Streaming & Fitur Premium Maksimal (Ultra HD / 4K / Pro)',
      'Aktivasi Otomatis & Bantuan WhatsApp CS Siaga 24 Jam',
    ];
  } else if (isInvite) {
    features = [
      'Undangan Resmi Langsung ke Akun Email Pribadi Anda',
      'Data Proyek, Desain, dan Template Tersimpan Aman di Email Sendiri',
      `Masa Aktif Penuh: ${duration}`,
      `Garansi Resmi: ${warranty} dengan Jaminan Aktif Kembali`,
      'Bebas Akses Seluruh Fitur Pro & Kolaborasi Workspace',
    ];
  } else if (isDesigner) {
    features = [
      'Akses Otoritas Penuh & Fitur Kolaborasi Desainer / Tim',
      'Akses Cloud Storage Besar & Integrasi Brand Kit Lengkap',
      `Masa Aktif: ${duration} Bergaransi Resmi ${warranty}`,
      'Semua Aset Desain, Font, dan Ekspor Resolusi Tertinggi Terbuka',
      'Panduan Aktivasi Instan & Dukungan Prioritas Customer Service',
    ];
  } else {
    features = [
      'Akun Private Eksklusif (Email & Password Pribadi Tanpa Sharing)',
      `Masa Aktif: ${duration} Full Coverage`,
      `Garansi Perlindungan: ${warranty} Penggantian Resmi 100%`,
      'Bebas Akses Semua Fitur Premium Tanpa Batas Penggunaan',
      'Dukungan Multi-Device (Web, Android, iOS, Windows, macOS)',
    ];
  }

  if (product.features && product.features.length > 0) {
    const cleanedBase = product.features.map(cleanHtmlContent).filter(Boolean);
    cleanedBase.slice(0, 3).forEach((f) => {
      if (!features.some((ef) => ef.toLowerCase().includes(f.toLowerCase().slice(0, 15)))) {
        features.push(f);
      }
    });
  }

  const warrantyText = `Seluruh transaksi untuk paket ${fullName} dilindungi garansi penggantian resmi Asterra Store selama ${warranty}. Jika akun mengalami kendala login atau masa aktif terputus sebelum ${warranty}, tim CS kami siap memproses penggantian akun baru 100% gratis dalam hitungan menit.`;

  const guaranteeTitle = `Garansi ${warranty}`;
  const guaranteeDesc = `Jaminan ganti akun 100%`;
  const processTitle = `Proses Instan`;
  const processDesc = `1 - 15 menit selesai`;
  const privacyTitle = `Akun ${type}`;
  const privacyDesc = isShared
    ? '1 Profil PIN aman'
    : isInvite
    ? 'Invite email pribadi aman'
    : 'Ruang kerja aman & personal';

  const specifications: SpecItem[] = [
    { label: 'Paket / Nominal', value: paket },
    { label: 'Tipe Akun', value: `Akun ${type}` },
    { label: 'Durasi Masa Aktif', value: duration },
    { label: 'Proteksi Garansi', value: `Garansi ${warranty}` },
    { label: 'Kode SKU / Layanan', value: variant?.id || product.id },
    {
      label: 'Status Ketersediaan',
      value: variant?.isOutOfStock ? 'Stok Habis' : `Tersedia (${variant?.stock ?? 100} unit)`,
    },
    { label: 'Waktu Pengiriman', value: 'Proses Instan (1 - 15 Menit)' },
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
  };
}
