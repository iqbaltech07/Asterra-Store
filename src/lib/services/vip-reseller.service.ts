import crypto from 'crypto';

export interface VipResellerPrice {
  basic: number;
  premium: number;
  special: number;
}

export interface VipRawService {
  brand: string;
  code: string;
  name: string;
  note?: string;
  price: VipResellerPrice | number;
  status: 'available' | 'empty' | string;
  multi_trx?: boolean;
  maintenace?: string;
  category?: string;
  prepost?: string;
  type?: string;
  game?: string;
  server?: string;
  id?: string | number;
  description?: string;
}

export interface VipProfileData {
  full_name: string;
  username: string;
  balance: number;
  point: number;
  level: string;
  registered: string;
}

export interface VipApiResponse<T> {
  result: boolean;
  message: string;
  data: T | null;
}

export interface CacheEntry<T> {
  data: VipApiResponse<T>;
  timestamp: number;
}

export class VipResellerService {
  private baseUrl: string;
  private apiId: string;
  private apiKey: string;
  private staticSign?: string;
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  public static readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache to strictly avoid spamming VIP Reseller API

  constructor() {
    this.baseUrl = (
      process.env.VIP_RESELLER_BASE_URL || 'https://vip-reseller.co.id/api'
    ).replace(/\/+$/, '');
    this.apiId = process.env.VIP_RESELLER_API_ID || '';
    this.apiKey = process.env.VIP_RESELLER_API_KEY || '';
    this.staticSign = process.env.VIP_RESELLER_SIGN;
  }

  /**
   * Generates dynamic MD5 signature: md5(api_id + api_key)
   */
  public generateSignature(): string {
    if (this.staticSign) {
      return this.staticSign;
    }
    if (!this.apiId || !this.apiKey) {
      throw new Error(
        'VIP Reseller API ID dan API KEY wajib dikonfigurasi di file environment (.env).'
      );
    }
    return crypto.createHash('md5').update(this.apiId + this.apiKey).digest('hex');
  }

  /**
   * Helper to perform POST requests using application/x-www-form-urlencoded
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, string>
  ): Promise<VipApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const sign = this.generateSignature();

    const formParams = new URLSearchParams({
      key: this.apiKey,
      sign,
      ...params,
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Asterra-Store/1.0',
        },
        body: formParams.toString(),
        signal: AbortSignal.timeout(15000), // 15 seconds bounded timeout
      });

      if (!response.ok) {
        throw new Error(
          `VIP Reseller HTTP Error: ${response.status} ${response.statusText}`
        );
      }

      const json = (await response.json()) as VipApiResponse<T>;
      return json;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        result: false,
        message: `Koneksi gateway VIP Reseller gagal: ${errorMsg}`,
        data: null,
      };
    }
  }

  /**
   * Check account profile, level, and active balance
   */
  public async getProfile(): Promise<VipApiResponse<VipProfileData>> {
    return this.request<VipProfileData>('/profile', {});
  }

  /**
   * Fetch all prepaid services (Voucher, Streaming, Pulsa, Data, E-Money)
   * Cached in-memory to prevent spamming the VIP Reseller API
   */
  public async getPrepaidServices(
    options?: { filterType?: string; forceRefresh?: boolean } | string
  ): Promise<VipApiResponse<VipRawService[]>> {
    const filterType = typeof options === 'string' ? options : options?.filterType;
    const forceRefresh = typeof options === 'object' ? Boolean(options?.forceRefresh) : false;
    const cacheKey = 'prepaid_services_master';

    // 1. Check in-memory cache if not forcing refresh
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey) as CacheEntry<VipRawService[]> | undefined;
      if (
        cached &&
        Array.isArray(cached.data.data) &&
        Date.now() - cached.timestamp < VipResellerService.CACHE_TTL_MS
      ) {
        let items = cached.data.data;
        if (filterType) {
          items = items.filter((item) => item.type === filterType);
        }
        return {
          ...cached.data,
          data: items,
        };
      }
    }

    // 2. Fetch fresh from upstream gateway
    const res = await this.request<VipRawService[]>('/prepaid', {
      type: 'services',
    });

    if (res.result && Array.isArray(res.data)) {
      this.cache.set(cacheKey, {
        data: res,
        timestamp: Date.now(),
      });

      if (filterType) {
        return {
          ...res,
          data: res.data.filter((item) => item.type === filterType),
        };
      }
    }

    return res;
  }

  /**
   * Fetch game top-up services
   */
  public async getGameServices(): Promise<VipApiResponse<VipRawService[]>> {
    const res = await this.request<VipRawService[]>('/game-feature', {
      type: 'services',
    });
    if (res.result && Array.isArray(res.data) && res.data.length > 0) {
      return res;
    }
    // Also try type: 'service' as specified in some VIP Reseller documentation versions
    return this.request<VipRawService[]>('/game-feature', {
      type: 'service',
    });
  }

  /**
   * Fetch social media and digital services
   */
  public async getSocialMediaServices(): Promise<VipApiResponse<VipRawService[]>> {
    return this.request<VipRawService[]>('/social-media', {
      type: 'services',
    });
  }

  /**
   * Fetch all aggregated services across prepaid, game features, and digital services
   * Ensures all digital products, AI tools, accounts, and vouchers are accessible
   */
  public async getAllAggregatedServices(
    options?: { forceRefresh?: boolean }
  ): Promise<VipApiResponse<VipRawService[]>> {
    const forceRefresh = Boolean(options?.forceRefresh);
    const cacheKey = 'all_aggregated_services';

    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey) as CacheEntry<VipRawService[]> | undefined;
      if (
        cached &&
        Array.isArray(cached.data.data) &&
        Date.now() - cached.timestamp < VipResellerService.CACHE_TTL_MS
      ) {
        return cached.data;
      }
    }

    const [prepaidRes, gameRes, smRes] = await Promise.allSettled([
      this.getPrepaidServices({ forceRefresh }),
      this.getGameServices(),
      this.getSocialMediaServices(),
    ]);

    const streamingAndApps: VipRawService[] = [];
    const games: VipRawService[] = [];
    const prepaidVouchers: VipRawService[] = [];
    const socialMedia: VipRawService[] = [];
    const others: VipRawService[] = [];
    const seenCodes = new Set<string>();

    const isDigitalOrStreaming = (brand?: string, name?: string): boolean => {
      const text = `${brand || ''} ${name || ''}`.toLowerCase();
      return (
        text.includes('netflix') ||
        text.includes('youtube') ||
        text.includes('canva') ||
        text.includes('spotify') ||
        text.includes('bstation') ||
        text.includes('iqiyi') ||
        text.includes('wetv') ||
        text.includes('disney') ||
        text.includes('prime video') ||
        text.includes('chatgpt') ||
        text.includes('openai') ||
        text.includes('gemini') ||
        text.includes('claude') ||
        text.includes('vidio') ||
        text.includes('viu') ||
        text.includes('capcut') ||
        text.includes('alight motion')
      );
    };

    // 1. Process game-feature items (includes Netflix, YouTube, Spotify, Canva, Steam, Game vouchers)
    if (
      gameRes.status === 'fulfilled' &&
      gameRes.value.result &&
      Array.isArray(gameRes.value.data)
    ) {
      for (const item of gameRes.value.data) {
        if (!item.code || seenCodes.has(item.code)) continue;
        seenCodes.add(item.code);

        const brand = item.game || item.brand || 'Game';
        const cleanName =
          item.game && !item.name.toLowerCase().includes(item.game.toLowerCase())
            ? `${item.game} - ${item.name}`
            : item.name;

        const isStreaming = isDigitalOrStreaming(brand, item.name);
        const mapped: VipRawService = {
          ...item,
          brand,
          name: cleanName,
          note: item.description || item.note,
          type: isStreaming ? 'streaming-tv' : (item.type || 'game'),
        };

        if (isStreaming) {
          streamingAndApps.push(mapped);
        } else {
          games.push(mapped);
        }
      }
    }

    // 2. Process prepaid items (includes streaming telco, e-money, data, pulsa)
    if (
      prepaidRes.status === 'fulfilled' &&
      prepaidRes.value.result &&
      Array.isArray(prepaidRes.value.data)
    ) {
      for (const item of prepaidRes.value.data) {
        if (!item.code || seenCodes.has(item.code)) continue;
        seenCodes.add(item.code);

        const brand = item.brand || 'Digital';
        const isStreaming = isDigitalOrStreaming(brand, item.name);
        const mapped: VipRawService = {
          ...item,
          brand,
          type: item.type || (isStreaming ? 'streaming-tv' : 'prepaid'),
        };

        if (isStreaming) {
          streamingAndApps.push(mapped);
        } else if (item.type?.includes('voucher') || item.type?.includes('game')) {
          prepaidVouchers.push(mapped);
        } else {
          others.push(mapped);
        }
      }
    }

    // 3. Process social-media items (YouTube views, subscribers, shares, Instagram, TikTok)
    if (
      smRes.status === 'fulfilled' &&
      smRes.value.result &&
      Array.isArray(smRes.value.data)
    ) {
      for (const item of smRes.value.data) {
        const rawCode = item.code || (item.id ? `SM-${item.id}` : undefined);
        if (!rawCode || seenCodes.has(rawCode)) continue;
        seenCodes.add(rawCode);

        socialMedia.push({
          ...item,
          code: rawCode,
          brand: item.category || 'Social Media',
          type: 'social-media',
        });
      }
    }

    const combined: VipRawService[] = [
      ...streamingAndApps,
      ...games,
      ...prepaidVouchers,
      ...socialMedia,
      ...others,
    ];

    if (combined.length > 0) {
      const res: VipApiResponse<VipRawService[]> = {
        result: true,
        message: `Berhasil memuat ${combined.length} layanan dari semua gateway VIP Reseller.`,
        data: combined,
      };
      this.cache.set(cacheKey, { data: res, timestamp: Date.now() });
      return res;
    }

    const errorMsg =
      (prepaidRes.status === 'fulfilled' ? prepaidRes.value.message : '') ||
      (gameRes.status === 'fulfilled' ? gameRes.value.message : '') ||
      'Gagal mengambil layanan dari gateway VIP Reseller.';

    return {
      result: false,
      message: errorMsg,
      data: null,
    };
  }

  /**
   * Clear in-memory cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get current cache metadata
   */
  public getCacheInfo(): { hasMasterCache: boolean; ageSeconds: number } {
    const cached = this.cache.get('prepaid_services_master');
    if (!cached) {
      return { hasMasterCache: false, ageSeconds: 0 };
    }
    return {
      hasMasterCache: true,
      ageSeconds: Math.floor((Date.now() - cached.timestamp) / 1000),
    };
  }
}

export const vipResellerService = new VipResellerService();
