import { ProductItem } from '@/lib/products-data';

export interface ParsedVariant {
  id: string; // SKU id, e.g. vip-chatgptgo1thngar6b-s1
  name: string; // Original full product name
  paket: string; // e.g. 'ChatGPT GO', 'Plus Plan'
  type: string; // e.g. 'Private', 'Shared', 'Anggota / Invite'
  duration: string; // e.g. '1 Bulan', '6 Bulan', '1 Tahun'
  warranty: string; // e.g. '7 Hari', '1 Bulan', '6 Bulan'
  price: number;
  priceFormatted: string;
  stock?: number;
  providerStatus?: string;
  isOutOfStock: boolean;
  description?: string;
  features?: string[];
  imageUrl?: string;
}

export interface ProductFamilyData {
  slug: string;
  name: string;
  category: { id: string; name: string };
  imageUrl: string;
  rating: string;
  soldCount: number;
  description: string;
  features: string[];
  variants: ParsedVariant[];
  selectedVariant: ParsedVariant;
}

/**
 * Utility to strip raw HTML tags and clean up text into human-readable strings
 */
export function cleanHtmlContent(text: string | undefined | null): string {
  if (!text) return '';
  let s = text.replace(/<li[^>]*>/gi, '\n• ');
  s = s.replace(/<\/?(?:p|h[1-6]|ul|ol|div|br)[^>]*>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  const lines = s.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.join('\n');
}

interface AppDefinition {
  slug: string;
  aliases: string[];
  name: string;
  category: { id: string; name: string };
  imageUrl: string;
  rating: string;
  soldCount: number;
  description: string;
  features: string[];
  match: (text: string) => boolean;
  parsePaket: (name: string) => string;
}

export const KNOWN_APPS: AppDefinition[] = [
  {
    slug: 'chatgpt',
    aliases: ['chatgpt', 'chat-gpt', 'chat_gpt', 'openai'],
    name: 'ChatGPT',
    category: { id: 'cat-ai-tools', name: 'AI Tools' },
    imageUrl: '/images/apps/chatgpt.png',
    rating: '5.0',
    soldCount: 850,
    description:
      'Akses resmi ChatGPT Plus & Business dengan fitur tercanggih OpenAI termasuk GPT-4o, browsing, DALL-E, data analysis, dan voice mode. Aktivasi instan dan bergaransi penuh.',
    features: [
      'Akses GPT-4o, GPT-4, dan model AI terbaru tanpa batas antrean',
      'Pembuatan gambar instan via DALL-E 3 & Analisis Dokumen',
      'Akun aman dengan opsi Private personal atau Shared hemat',
      'Garansi penggantian penuh jika terjadi kendala akses',
    ],
    match: (t) =>
      t.includes('chatgpt') ||
      t.includes('chat gpt') ||
      t.includes('plus plan') ||
      t.includes('member team') ||
      t.includes('owner team') ||
      t.includes('teacher plan'),
    parsePaket: (n) => {
      if (/chatgpt\s*go/i.test(n)) return 'ChatGPT GO';
      if (/plus\s*plan/i.test(n) || /chatgpt\s*plus/i.test(n)) return 'Plus Plan';
      if (/member\s*team/i.test(n)) return 'Member Team Business';
      if (/owner\s*team/i.test(n)) return 'Owner Team Business';
      if (/teacher\s*plan/i.test(n)) return 'Teacher Plan';
      return 'ChatGPT Pro';
    },
  },
  {
    slug: 'google-gemini',
    aliases: ['google-gemini', 'gemini', 'google-ai'],
    name: 'Google Gemini',
    category: { id: 'cat-ai-tools', name: 'AI Tools' },
    imageUrl: '/images/apps/gemini.png',
    rating: '5.0',
    soldCount: 620,
    description:
      'Lisensi resmi Google Gemini AI Pro dengan integrasi Google Workspace, ruang penyimpanan Google Drive ekstra besar (hingga 5 TB), dan video generator Veo 3.',
    features: [
      'Model Gemini 1.5 Pro multimodal dengan token window jutaan',
      'Termasuk Google Drive Cloud Storage 2 TB hingga 5 TB',
      'Dukungan integrasi Gmail, Docs, Sheets, and Slides',
      'Garansi penggantian akun 100% dari Asterra Store',
    ],
    match: (t) => t.includes('gemini') && !t.includes('whimsical'),
    parsePaket: (n) => {
      if (/5\s*tb/i.test(n)) return 'Google AI Pro (5 TB)';
      if (/2tb/i.test(n)) return 'Google AI Pro (2 TB + Veo 3)';
      return 'Google AI Pro';
    },
  },
  {
    slug: 'canva',
    aliases: ['canva', 'canva-pro'],
    name: 'Canva',
    category: { id: 'cat-apps-streaming', name: 'Design & Creative' },
    imageUrl: '/images/apps/canva.png',
    rating: '4.9',
    soldCount: 1420,
    description:
      'Akun resmi Canva Pro & Education untuk desain grafis tanpa batas. Akses 100+ juta foto premium, audio, video, Magic Studio AI, dan hapus background 1 klik.',
    features: [
      'Bebas unduh 100+ juta asset foto, template, font, dan animasi premium',
      'Magic Studio AI: Magic Switch, Brand Kit, dan Hapus Background 1 Klik',
      'Dukungan cloud storage 1 TB untuk seluruh proyek desain Anda',
      'Garansi penuh sesuai durasi masa aktif yang dipilih',
    ],
    match: (t) => t.includes('canva'),
    parsePaket: (n) => {
      if (/desainer/i.test(n)) return 'Canva Pro Desainer';
      if (/anggota/i.test(n)) return 'Canva Pro Anggota';
      if (/edu/i.test(n)) return 'Canva Education';
      return 'Canva Pro';
    },
  },
  {
    slug: 'capcut',
    aliases: ['capcut', 'capcut-pro'],
    name: 'CapCut',
    category: { id: 'cat-apps-streaming', name: 'Video Editing' },
    imageUrl: '/images/apps/capcut.png',
    rating: '4.9',
    soldCount: 980,
    description:
      'Langganan resmi CapCut Pro untuk kreator video TikTok, Reels, dan YouTube Shorts. Buka semua efek pro, teks animasi, filter cinematic, dan transisi tanpa watermark.',
    features: [
      'Ekspor resolusi tinggi 4K 60fps tanpa watermark',
      'Fitur AI: Auto Captions, Body Effects, Optical Flow, dan Smart Cutout',
      'Akses ke library musik komersial dan ribuan sound effects',
      'Akun Private atau Shared dengan aktivasi instan 1-15 menit',
    ],
    match: (t) => t.includes('capcut'),
    parsePaket: () => 'CapCut Pro',
  },
  {
    slug: 'alight-motion',
    aliases: ['alight-motion', 'alightmotion', 'alight'],
    name: 'Alight Motion',
    category: { id: 'cat-apps-streaming', name: 'Motion Graphic' },
    imageUrl: '/images/apps/alightmotion.png',
    rating: '4.8',
    soldCount: 340,
    description:
      'Aplikasi desain motion graphic profesional pertama di smartphone. Buat animasi visual berkualitas tinggi, visual effects, komposisi video, dan preset editing tanpa watermark.',
    features: [
      'Multi-layer grafik, video, audio, dan kurva animasi vektor bebas kustom',
      'Bebas watermark dengan ekspor format MP4 dan GIF kualitas maksimal',
      'Dukungan import preset XML / tautan project secara instan',
      'Akun Private 1 Tahun resmi bergaransi',
    ],
    match: (t) => t.includes('alight'),
    parsePaket: () => 'Alight Motion Pro',
  },
  {
    slug: 'netflix',
    aliases: ['netflix', 'netflix-premium', 'ntflx'],
    name: 'Netflix',
    category: { id: 'cat-apps-streaming', name: 'Movies & Series' },
    imageUrl: '/images/apps/netflix.png',
    rating: '4.9',
    soldCount: 760,
    description:
      'Streaming film blockbuster, serial original Netflix, anime, dan dokumenter favorit dalam resolusi Ultra HD 4K dengan audio spasial.',
    features: [
      'Kualitas tayangan Ultra HD 4K & HDR',
      'Audio spasial Netflix berkualitas bioskop',
      'Dukungan unduhan offline di perangkat mobile',
      'Garansi penggantian akun jika terjadi hambatan',
    ],
    match: (t) => t.includes('netflix') || t.includes('ntflx'),
    parsePaket: () => 'Netflix Premium',
  },
  {
    slug: 'vidio',
    aliases: ['vidio', 'video-premier'],
    name: 'Vidio',
    category: { id: 'cat-apps-streaming', name: 'Sports & TV Streaming' },
    imageUrl: '/images/apps/vidio.png',
    rating: '4.9',
    soldCount: 1150,
    description:
      'Nonton siaran langsung olahraga terlengkap: Liga Inggris (EPL), BRI Liga 1, UCL, NBA, serta ribuan serial Vidio Original eksklusif.',
    features: [
      'Live streaming sepak bola dunia & siaran olahraga lengkap',
      'Bebas jeda iklan untuk seluruh Vidio Original Series & Film',
      'Tersedia opsi Khusus Mobile atau All Screen TV/PC',
      'Garansi akun resmi selama durasi langganan',
    ],
    match: (t) => t.includes('vidio') || t.includes('video premier'),
    parsePaket: (n) => {
      if (/fifa|world\s*cup/i.test(n)) return 'Vidio World Cup';
      return 'Vidio Premier Platinum';
    },
  },
  {
    slug: 'viu',
    aliases: ['viu', 'viu-premium'],
    name: 'Viu',
    category: { id: 'cat-apps-streaming', name: 'Asian Drama & Variety' },
    imageUrl: '/images/apps/viu.png',
    rating: '4.9',
    soldCount: 910,
    description:
      'Streaming drama Korea terbaru, variety show, anime, dan drama Asia terpopuler dengan subtitle bahasa Indonesia resmi berkecepatan tayang cepat.',
    features: [
      'Tayangan drama Korea episode terbaru di hari yang sama dengan Korea',
      'Kualitas Full HD tanpa gangguan jeda iklan',
      'Unduhan tanpa batas untuk ditonton offline kapan saja',
      'Akun Private resmi 1 device dengan masa garansi panjang',
    ],
    match: (t) => t.includes('viu') && !t.includes('data 22 gb'),
    parsePaket: () => 'Viu Premium',
  },
  {
    slug: 'spotify',
    aliases: ['spotify', 'spotify-premium'],
    name: 'Spotify',
    category: { id: 'cat-apps-streaming', name: 'Music Streaming' },
    imageUrl: '/images/apps/vidio.png', // Fallback or logo
    rating: '4.9',
    soldCount: 1280,
    description:
      'Dengarkan jutaan lagu dan podcast favorit tanpa jeda iklan, kualitas audio bitrate tertinggi, serta lewati trek musik tanpa batas.',
    features: [
      'Bebas iklan audio dan visual saat mendengarkan musik',
      'Kualitas audio streaming tertinggi (High Quality 320kbps)',
      'Unduh lagu favorit untuk didengarkan secara offline',
      'Aktivasi resmi bergaransi',
    ],
    match: (t) => (t.includes('spotify') || t.includes('spy')) && !t.includes('data'),
    parsePaket: (n) => {
      if (/admin/i.test(n)) return 'Spotify Premium Admin';
      if (/anggota/i.test(n)) return 'Spotify Premium Anggota';
      return 'Spotify Premium';
    },
  },
  {
    slug: 'youtube',
    aliases: ['youtube', 'youtube-premium'],
    name: 'YouTube',
    category: { id: 'cat-apps-streaming', name: 'Streaming & Video' },
    imageUrl: '/images/apps/netflix.png', // Fallback
    rating: '5.0',
    soldCount: 1890,
    description:
      'Nonton jutaan video YouTube tanpa iklan, putar di latar belakang saat layar mati, dan nikmati akses penuh ke YouTube Music Premium.',
    features: [
      'Video bebas iklan di semua perangkat (HP, Laptop, Smart TV)',
      'Background Play: video tetap berjalan saat buka aplikasi lain',
      'Termasuk YouTube Music Premium dengan audio kualitas tinggi',
      'Aktivasi ke email Gmail sendiri atau akun baru siap pakai',
    ],
    match: (t) => t.includes('youtube') && !t.includes('paket internet') && !t.includes('tri data') && !t.includes('telkomsel'),
    parsePaket: (n) => {
      if (/family/i.test(n)) return 'YouTube Family';
      return 'YouTube Individu';
    },
  },
  {
    slug: 'bstation',
    aliases: ['bstation', 'bsprem', 'bilibili'],
    name: 'Bstation',
    category: { id: 'cat-apps-streaming', name: 'Anime & Creators' },
    imageUrl: '/images/apps/vidio.png',
    rating: '4.9',
    soldCount: 480,
    description:
      'Platform anime legal terbesar di Asia Tenggara. Nonton anime musim terbaru kualitas Full HD hingga 4K, video kreator pop culture, dan game ACG.',
    features: [
      'Streaming anime simulcast kualitas tinggi 1080P hingga 4K',
      'Bebas iklan dengan subtitle bahasa Indonesia resmi',
      'Pilihan Private atau Shared hemat biaya',
      'Garansi penuh Asterra Store',
    ],
    match: (t) => t.includes('bstation') || t.includes('bsprem') || t.includes('bilibili'),
    parsePaket: () => 'Bstation Premium',
  },
  {
    slug: 'iqiyi',
    aliases: ['iqiyi', 'iqiyi-standard'],
    name: 'iQIYI',
    category: { id: 'cat-apps-streaming', name: 'Drama & Anime' },
    imageUrl: '/images/apps/vidio.png',
    rating: '4.9',
    soldCount: 520,
    description:
      'Platform streaming drama China (C-Drama), serial romantis, variety show, dan anime favorit dengan fitur VIP eksklusif.',
    features: [
      'Nonton episode baru lebih cepat dari pengguna reguler',
      'Kualitas streaming 1080P dengan Dolby Atmos audio',
      'Bebas jeda iklan sponsor',
      'Garansi akun resmi aktif sesuai masa paket',
    ],
    match: (t) => t.includes('iqiyi') && !t.includes('diamonds'),
    parsePaket: () => 'iQIYI Standard VIP',
  },
  {
    slug: 'wetv',
    aliases: ['wetv', 'wetv-vip'],
    name: 'WeTV',
    category: { id: 'cat-apps-streaming', name: 'Asian Drama & Anime' },
    imageUrl: '/images/apps/wetv.png',
    rating: '4.9',
    soldCount: 460,
    description:
      'Nonton serial original WeTV Indonesia yang viral, drama Asia terbaik, dan anime populer dengan subtitle resmi.',
    features: [
      'Akses VIP untuk semua episode serial WeTV Original',
      'Fitur fast track untuk episode terbaru lebih awal',
      'Kualitas Full HD tanpa jeda iklan',
      'Garansi penggantian akun jika ada kendala',
    ],
    match: (t) => t.includes('wetv'),
    parsePaket: () => 'WeTV VIP',
  },
];

/**
 * Parse an individual product into standardized variant data
 */
export function parseProductVariant(
  p: ProductItem,
  customPaketParser?: (name: string) => string
): ParsedVariant {
  const name = p.name || '';
  const id = p.id;
  const price = p.price || 0;

  // 1. Duration extraction
  let duration = '1 Bulan';
  const durMatch = name.match(/(\d+\s*(?:hari|bulan|tahun|thn|bln|days|month|year)|lifetime)/i);
  if (durMatch) {
    const d = durMatch[0].toLowerCase();
    if (d.includes('thn') || d.includes('tahun') || d.includes('year') || d.includes('12 bln') || d.includes('12 bulan') || d.includes('360 hari')) {
      duration = '1 Tahun';
    } else if (d.includes('6 bln') || d.includes('6 bulan') || d.includes('180 hari')) {
      duration = '6 Bulan';
    } else if (d.includes('3 bln') || d.includes('3 bulan') || d.includes('90 hari')) {
      duration = '3 Bulan';
    } else if (d.includes('2 bln') || d.includes('2 bulan')) {
      duration = '2 Bulan';
    } else if (d.includes('1 bln') || d.includes('1 bulan') || d.includes('30 hari')) {
      duration = '1 Bulan';
    } else if (d.includes('28 hari')) {
      duration = '28 Hari';
    } else if (d.includes('25 hari')) {
      duration = '25 Hari';
    } else if (d.includes('21 hari')) {
      duration = '21 Hari';
    } else if (d.includes('14 hari')) {
      duration = '14 Hari';
    } else if (d.includes('7 hari')) {
      duration = '7 Hari';
    } else if (d.includes('5 hari')) {
      duration = '5 Hari';
    } else if (d.includes('3 hari')) {
      duration = '3 Hari';
    } else if (d.includes('lifetime')) {
      duration = 'Lifetime';
    } else {
      duration = durMatch[0];
    }
  }

  // 2. Warranty (Garansi) extraction
  let warranty = '1 Bulan';
  const garMatch = name.match(/garansi\s*([^\]]+)/i);
  if (garMatch) {
    const g = garMatch[1].trim();
    if (/6\s*b/i.test(g)) warranty = '6 Bulan';
    else if (/3\s*b/i.test(g)) warranty = '3 Bulan';
    else if (/2\s*b/i.test(g)) warranty = '2 Bulan';
    else if (/12\s*b|1\s*t/i.test(g)) warranty = '12 Bulan';
    else if (/1\s*b/i.test(g)) warranty = '1 Bulan';
    else if (/28\s*h/i.test(g)) warranty = '28 Hari';
    else if (/25\s*h/i.test(g)) warranty = '25 Hari';
    else if (/14\s*h/i.test(g)) warranty = '14 Hari';
    else if (/7\s*h/i.test(g)) warranty = '7 Hari';
    else if (/5\s*h/i.test(g)) warranty = '5 Hari';
    else if (/3\s*h/i.test(g)) warranty = '3 Hari';
    else warranty = g;
  } else if (/full\s*garansi/i.test(name)) {
    warranty = 'Full Garansi';
  } else {
    warranty = duration.includes('Tahun') ? '6 Bulan' : duration;
  }

  // 3. Type (Private, Shared, Anggota, Invite, etc.)
  let type = 'Private';
  if (/shared/i.test(name)) {
    type = 'Shared';
  } else if (/head\s*invite/i.test(name)) {
    type = 'Head Invite (5 User)';
  } else if (/anggota|invite/i.test(name)) {
    type = 'Anggota / Invite';
  } else if (/desainer/i.test(name)) {
    type = 'Desainer';
  } else if (/private/i.test(name) || /individu/i.test(name)) {
    type = 'Private';
  }

  // 4. Paket / Nominal
  let paket = 'Standard';
  if (customPaketParser) {
    paket = customPaketParser(name);
  } else {
    const base = name.split('[')[0].replace(/\d+\s*(?:hari|bulan|tahun|thn|bln)/i, '').trim();
    paket = base || 'Standard';
  }

  const isOutOfStock =
    (p.stock !== undefined && p.stock <= 0) ||
    p.providerStatus === 'empty' ||
    p.status === 'out_of_stock';

  return {
    id,
    name,
    paket,
    type,
    duration,
    warranty,
    price,
    priceFormatted: p.priceFormatted || `Rp ${price.toLocaleString('id-ID')}`,
    stock: p.stock ?? 100,
    providerStatus: p.providerStatus,
    isOutOfStock,
    description: p.description,
    features: p.features,
    imageUrl: p.imageUrl,
  };
}

/**
 * Universal resolver: takes an identifier (could be a family slug like 'chatgpt',
 * or an exact SKU ID like 'vip-chatgptgo1thngar6b-s1') and groups all active variants.
 */
export function resolveProductFamily(
  identifier: string,
  allProducts: ProductItem[]
): ProductFamilyData | null {
  if (!identifier || allProducts.length === 0) return null;
  const cleanId = identifier.trim().toLowerCase();

  // 1. Check if identifier directly matches a known app slug or alias
  const matchedApp = KNOWN_APPS.find(
    (app) => app.slug === cleanId || app.aliases.includes(cleanId)
  );

  if (matchedApp) {
    const familyItems = allProducts.filter((p) => {
      const text = `${p.id} ${p.name} ${(p as unknown as { providerCode?: string }).providerCode || ''}`.toLowerCase();
      if (text.includes('lisensi')) return false;
      return matchedApp.match(text);
    });

    if (familyItems.length > 0) {
      const variants = familyItems.map((p) => parseProductVariant(p, matchedApp.parsePaket));
      
      // Sort variants: by price ascending
      variants.sort((a, b) => a.price - b.price);

      // Select initial variant: prefer active/available variant with reasonable price
      const selectedVariant = variants.find((v) => !v.isOutOfStock) || variants[0];

      return {
        slug: matchedApp.slug,
        name: matchedApp.name,
        category: matchedApp.category,
        imageUrl: matchedApp.imageUrl,
        rating: matchedApp.rating,
        soldCount: matchedApp.soldCount,
        description: matchedApp.description,
        features: matchedApp.features,
        variants,
        selectedVariant,
      };
    }
  }

  // 2. Check if identifier is an exact product SKU / ID
  const directProduct = allProducts.find((p) => p.id.toLowerCase() === cleanId);
  if (directProduct) {
    // See if this product belongs to any of our known apps
    const pText = `${directProduct.id} ${directProduct.name} ${(directProduct as unknown as { providerCode?: string }).providerCode || ''}`.toLowerCase();
    const parentApp = KNOWN_APPS.find((app) => app.match(pText));

    if (parentApp) {
      const familyItems = allProducts.filter((p) => {
        const text = `${p.id} ${p.name} ${(p as unknown as { providerCode?: string }).providerCode || ''}`.toLowerCase();
        if (text.includes('lisensi')) return false;
        return parentApp.match(text);
      });

      const variants = familyItems.map((p) => parseProductVariant(p, parentApp.parsePaket));
      variants.sort((a, b) => a.price - b.price);

      const targetVariant = variants.find((v) => v.id.toLowerCase() === cleanId) || variants[0];

      return {
        slug: parentApp.slug,
        name: parentApp.name,
        category: parentApp.category,
        imageUrl: parentApp.imageUrl,
        rating: parentApp.rating,
        soldCount: parentApp.soldCount,
        description: parentApp.description,
        features: parentApp.features,
        variants,
        selectedVariant: targetVariant,
      };
    }

    // Generic fallback for any other standalone SKU
    const singleVariant = parseProductVariant(directProduct);
    return {
      slug: directProduct.id,
      name: directProduct.name,
      category: directProduct.category,
      imageUrl: directProduct.imageUrl || '/images/default-product-banner.png',
      rating: '4.9',
      soldCount: 150,
      description: cleanHtmlContent(directProduct.description) || 'Layanan digital resmi bergaransi.',
      features: (directProduct.features && directProduct.features.length > 0)
        ? directProduct.features.map(cleanHtmlContent).filter(Boolean)
        : ['Garansi Penggantian Penuh', 'Aktivasi Instan Otomatis'],
      variants: [singleVariant],
      selectedVariant: singleVariant,
    };
  }

  // 3. Fallback: fuzzy search by token
  const fuzzyItems = allProducts.filter((p) => {
    const text = `${p.id} ${p.name}`.toLowerCase();
    return text.includes(cleanId);
  });

  if (fuzzyItems.length > 0) {
    const baseP = fuzzyItems[0];
    const variants = fuzzyItems.map((p) => parseProductVariant(p));
    variants.sort((a, b) => a.price - b.price);

    return {
      slug: cleanId,
      name: baseP.name.split('[')[0].trim(),
      category: baseP.category,
      imageUrl: baseP.imageUrl || '/images/default-product-banner.png',
      rating: '4.9',
      soldCount: 200,
      description: baseP.description || 'Layanan digital resmi bergaransi di Asterra Store.',
      features: baseP.features || ['Garansi Penggantian Penuh', 'Aktivasi Instan Otomatis'],
      variants,
      selectedVariant: variants[0],
    };
  }

  return null;
}
