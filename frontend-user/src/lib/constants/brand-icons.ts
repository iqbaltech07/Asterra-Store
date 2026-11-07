/**
 * Brand & Official Icon Registry
 * Reliable icons served via local static storage or cached internal proxies
 * Shared between Server Components and Client Components
 */
export const BRAND_ICONS_MAP: Record<string, string> = {
  // AI Tools
  chatgpt: '/images/apps/chatgpt.png',
  openai: '/images/apps/chatgpt.png',
  gemini: '/images/apps/gemini.png',
  'google ai': '/images/apps/gemini.png',
  'google pro': '/images/apps/gemini.png',
  google: '/images/apps/gemini.png',
  claude: '/api/v1/media/brand-icons/claude',
  midjourney: '/api/v1/media/brand-icons/midjourney',

  // Design & Productivity
  canva: '/images/apps/canva.png',
  capcut: '/images/apps/capcut.png',
  alight: '/images/apps/alightmotion.png',
  motion: '/images/apps/alightmotion.png',
  adobe: '/api/v1/media/brand-icons/adobe',
  grammarly: '/api/v1/media/brand-icons/grammarly',

  // Streaming & Video
  netflix: '/images/apps/netflix.png',
  spotify: '/images/apps/spotify.svg',
  youtube: '/images/apps/youtube.svg',
  vidio: '/images/apps/vidio.png',
  viu: '/images/apps/viu.png',
  wetv: '/images/apps/wetv.png',
  bstation: '/api/v1/media/brand-icons/bstation',
  bilibili: '/api/v1/media/brand-icons/bstation',
  blibli: '/api/v1/media/brand-icons/bstation',
  iqiyi: '/api/v1/media/brand-icons/iqiyi',
  disney: '/images/apps/disney.svg',
  loklok: '/images/apps/loklok.svg',

  // Communication, Utilities & Learning
  duolingo: '/images/apps/duolingo.svg',
  getcontact: '/images/apps/getcontact.svg',
  zoom: '/images/apps/zoom.svg',
  apple: '/images/apps/apple-music.svg',
  'apple music': '/images/apps/apple-music.svg',

  // Games
  mobilelegends: '/images/apps/mobile-legends.webp',
  'mobile legends': '/images/apps/mobile-legends.webp',
  mlbb: '/images/apps/mobile-legends.webp',
  pubg: '/images/apps/pubg-mobile.webp',

  // TV & Satellite
  'k-vision': '/images/apps/k-vision.webp',
  kvision: '/images/apps/k-vision.webp',
  nex: '/images/apps/nex-parabola.webp',
  vision: '/images/apps/vision-plus.webp',
  'orange tv': '/images/apps/orange-tv.webp',

  // Photo & Beauty
  wink: '/images/apps/wink.webp',
  meitu: '/images/apps/meitu.webp',
};

/**
 * Strictly detect whether a given URL is a promotional product banner,
 * wide poster, or broken path rather than an authoritative brand logo.
 */
export function isBannerOrInvalidLogo(url: string = ''): boolean {
  if (!url) return true;
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed === '' ||
    trimmed.startsWith('/images/brand/') ||
    trimmed.startsWith('/images/banners/') ||
    trimmed.includes('/products/') ||
    trimmed.includes('/media/products/') ||
    trimmed.includes('/banners/') ||
    trimmed.includes('banner') ||
    trimmed.includes('poster') ||
    trimmed.includes('default-product')
  );
}

export function resolveBrandLogo(name: string = '', fallbackUrl: string = ''): string {
  const trimmed = (fallbackUrl || '').trim();
  const isInvalid = isBannerOrInvalidLogo(trimmed);

  // 1. If an authoritative brand logo URL is provided (and NOT a product banner), prioritize it
  if (!isInvalid) {
    if (
      trimmed.startsWith('https://cdn.brandfetch.io/') ||
      trimmed.startsWith('/api/v1/media/brand-icons/') ||
      trimmed.startsWith('/images/apps/') ||
      trimmed.startsWith('data:image/') ||
      trimmed.includes('/logos/') ||
      trimmed.includes('logo')
    ) {
      return trimmed;
    }
  }

  // 2. Resolve via keyword matching from BRAND_ICONS_MAP
  const lower = (name || '').toLowerCase();
  for (const [key, url] of Object.entries(BRAND_ICONS_MAP)) {
    if (lower.includes(key)) {
      return url;
    }
  }

  // 3. If fallbackUrl was not identified as a banner and is safe, return it
  return !isInvalid ? trimmed : '';
}

/**
 * Returns true if the logo asset is a standalone glyph on a transparent / white background
 * that needs inner padding so the glyph doesn't touch the circular border.
 */
export function isPaddedBrand(name: string): boolean {
  const n = (name || '').toLowerCase();
  return (
    n.includes('chatgpt') ||
    n.includes('openai') ||
    n.includes('gemini') ||
    n.includes('google') ||
    n.includes('youtube') ||
    n.includes('vidio') ||
    n.includes('viu') ||
    n.includes('wetv') ||
    n.includes('midjourney') ||
    n.includes('grammarly')
  );
}
