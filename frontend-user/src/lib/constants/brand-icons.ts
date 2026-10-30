/**
 * Brandfetch & Official Icon Registry
 * Reliable icons served via internal proxy / cached media storage
 * Shared between Server Components and Client Components
 */
export const BRAND_ICONS_MAP: Record<string, string> = {
  canva: '/api/v1/media/brand-icons/canva',
  netflix: '/api/v1/media/brand-icons/netflix',
  spotify: '/api/v1/media/brand-icons/spotify',
  chatgpt: '/api/v1/media/brand-icons/chatgpt',
  openai: '/api/v1/media/brand-icons/chatgpt',
  gemini: '/api/v1/media/brand-icons/gemini',
  google: '/api/v1/media/brand-icons/gemini',
  alight: '/api/v1/media/brand-icons/alight',
  motion: '/api/v1/media/brand-icons/alight',
  capcut: '/api/v1/media/brand-icons/capcut',
  vidio: '/api/v1/media/brand-icons/vidio',
  viu: '/api/v1/media/brand-icons/viu',
  wetv: '/api/v1/media/brand-icons/wetv',
  bstation: '/api/v1/media/brand-icons/bstation',
  bilibili: '/api/v1/media/brand-icons/bstation',
  blibli: '/api/v1/media/brand-icons/bstation',
  iqiyi: '/api/v1/media/brand-icons/iqiyi',
  youtube: '/api/v1/media/brand-icons/youtube',
  disney: '/api/v1/media/brand-icons/disney',
  claude: '/api/v1/media/brand-icons/claude',
  midjourney: '/api/v1/media/brand-icons/midjourney',
  adobe: '/api/v1/media/brand-icons/adobe',
  grammarly: '/api/v1/media/brand-icons/grammarly',
  mobilelegends: '/api/v1/media/brand-icons/mobile-legends',
  'mobile legends': '/api/v1/media/brand-icons/mobile-legends',
  pubg: '/api/v1/media/brand-icons/pubg-mobile',
  vision: '/api/v1/media/brand-icons/vision-plus',
  'k-vision': '/api/v1/media/brand-icons/k-vision',
  kvision: '/api/v1/media/brand-icons/k-vision',
  nex: '/api/v1/media/brand-icons/nex-parabola',
  wink: '/api/v1/media/brand-icons/wink',
  meitu: '/api/v1/media/brand-icons/meitu',
};

export function resolveBrandLogo(name: string = '', fallbackUrl: string = ''): string {
  const trimmed = (fallbackUrl || '').trim();

  // If a valid custom logo URL is provided (and not a broken legacy path /images/brand/), ALWAYS prioritize it
  if (trimmed && !trimmed.startsWith('/images/brand/')) {
    return trimmed;
  }

  const lower = (name || '').toLowerCase();

  for (const [key, url] of Object.entries(BRAND_ICONS_MAP)) {
    if (lower.includes(key)) {
      return url;
    }
  }

  return trimmed && !trimmed.startsWith('/images/brand/') ? trimmed : '';
}

/**
 * Returns true if the logo asset is a standalone glyph on a transparent / white background
 * that needs inner padding so the glyph doesn't touch the circular border.
 * Logos with official solid/gradient backgrounds (Canva, CapCut, iQIYI, Netflix, Spotify, Disney, etc.)
 * return false so they can fill the circular avatar edge-to-edge without exposing square asset corners.
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

