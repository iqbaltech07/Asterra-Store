import { ProductItem } from '@/lib/products-data';

interface ScoredProduct {
  product: ProductItem;
  score: number;
}

const AI_KEYWORDS = [
  'gemini',
  'chatgpt',
  'openai',
  'gpt',
  'claude',
  'anthropic',
  'perplexity',
  'copilot',
  'midjourney',
  'stablediffusion',
  'suno',
  'deepseek',
  'elevenlabs',
];

const DESIGN_KEYWORDS = [
  'canva',
  'capcut',
  'freepik',
  'adobe',
  'photoshop',
  'illustrator',
  'figma',
  'envato',
  'coreldraw',
  'elements',
];

const STREAMING_KEYWORDS = [
  'netflix',
  'spotify',
  'youtube',
  'disney',
  'prime',
  'hbo',
  'vidio',
  'iqiyi',
  'wetv',
  'appletv',
  'viu',
  'bsation',
];

const PRODUCTIVITY_KEYWORDS = [
  'microsoft',
  'office',
  'windows',
  'google',
  'notion',
  'grammarly',
  'turnitin',
  'scribd',
  'zoom',
];

function getEcosystem(name: string, category: string, brand?: string): string {
  const combined = `${name} ${category} ${brand || ''}`.toLowerCase();
  if (AI_KEYWORDS.some((k) => combined.includes(k))) return 'ai';
  if (DESIGN_KEYWORDS.some((k) => combined.includes(k))) return 'design';
  if (STREAMING_KEYWORDS.some((k) => combined.includes(k))) return 'streaming';
  if (PRODUCTIVITY_KEYWORDS.some((k) => combined.includes(k))) return 'productivity';
  return 'general';
}

function extractCoreBrand(name: string, brand?: string): string {
  if (brand && brand.toLowerCase() !== 'digital' && brand.toLowerCase() !== 'custom') {
    return brand.toLowerCase().trim();
  }
  const clean = name.toLowerCase();
  const allBrands = [
    ...AI_KEYWORDS,
    ...DESIGN_KEYWORDS,
    ...STREAMING_KEYWORDS,
    ...PRODUCTIVITY_KEYWORDS,
  ];
  for (const k of allBrands) {
    if (clean.includes(k)) return k;
  }
  return '';
}

function extractDuration(name: string): string {
  const m = name.toLowerCase().match(/(\d+)\s*(bulan|bln|tahun|thn|hari|day|month|year)/);
  return m ? m[0].replace(/\s+/g, '') : '';
}

/**
 * Intelligent product recommendation algorithm [T23]
 * Analyzes semantic ecosystem, brand family, duration variants, category, and token overlaps
 */
export function findRelevantProducts(
  target: ProductItem,
  allCandidates: ProductItem[],
  limit = 3
): ProductItem[] {
  if (!target || !target.name) return [];
  const targetName = (target.name || '').toLowerCase();
  const targetCategory = (target.category?.name || '').toLowerCase();
  const targetEcosystem = getEcosystem(target.name || '', target.category?.name || '', target.brand);
  const targetBrand = extractCoreBrand(target.name || '', target.brand);
  const targetDuration = extractDuration(target.name || '');

  // Extract meaningful token words from target name
  const stopWords = new Set([
    'resmi',
    'original',
    'premium',
    'pro',
    'plus',
    'akun',
    'shared',
    'private',
    'garansi',
    'hari',
    'bulan',
    'tahun',
    'full',
    'akses',
    'app',
    'via',
    'layanan',
    'digital',
  ]);

  const targetTokens = targetName
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  const scored: ScoredProduct[] = [];

  for (const candidate of (allCandidates || [])) {
    if (!candidate || !candidate.name) continue;
    if (candidate.id === target.id) continue;
    if (candidate.status === 'archived') continue;

    let score = 0;
    const candName = (candidate.name || '').toLowerCase();
    const candCat = (candidate.category?.name || '').toLowerCase();
    const candEcosystem = getEcosystem(
      candidate.name,
      candidate.category?.name || '',
      candidate.brand
    );
    const candBrand = extractCoreBrand(candidate.name, candidate.brand);
    const candDuration = extractDuration(candidate.name);

    // 1. Same Brand match (+25) -> e.g. ChatGPT Go vs ChatGPT Plus
    if (targetBrand && candBrand && targetBrand === candBrand) {
      score += 25;
    }

    // 2. Same Semantic Ecosystem (+18) -> e.g. Gemini AI Pro when looking at ChatGPT
    if (targetEcosystem !== 'general' && targetEcosystem === candEcosystem) {
      score += 18;
    }

    // 3. Same Store Category (+10)
    if (targetCategory && candCat && targetCategory === candCat) {
      score += 10;
    }

    // 4. Complementary or duration match (+6)
    if (targetDuration && candDuration) {
      if (targetDuration === candDuration) {
        score += 6; // Same duration
      } else {
        score += 4; // Alternative duration variant (1 Bulan vs 1 Tahun)
      }
    }

    // 5. Token overlap (+5 per match)
    for (const token of targetTokens) {
      if (candName.includes(token)) {
        score += 5;
      }
    }

    // 6. Availability bonus
    if (
      candidate.stock !== undefined &&
      candidate.stock > 0 &&
      candidate.providerStatus !== 'empty'
    ) {
      score += 3;
    }

    // 7. Popular bonus
    if (candidate.popular) {
      score += 2;
    }

    scored.push({ product: candidate, score });
  }

  // Sort by highest relevance score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.product);
}
