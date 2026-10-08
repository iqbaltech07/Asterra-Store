import { ProductItem } from '@/lib/products-data';
import { vipResellerService } from './vip-reseller.service';
import { mapVipServiceToProduct, DEFAULT_MARGIN_CONFIG } from './product-mapper';

interface CatalogCache {
  products: ProductItem[];
  lastSyncedAt: Date | null;
  totalRaw: number;
  totalMapped: number;
  isSyncing: boolean;
  lastError: string | null;
}

// In-memory global singleton cache for Next.js runtime
declare global {
  var __asterraVipCatalogCache: CatalogCache | undefined;
}

const cache: CatalogCache = global.__asterraVipCatalogCache || {
  products: [],
  lastSyncedAt: null,
  totalRaw: 0,
  totalMapped: 0,
  isSyncing: false,
  lastError: null,
};

if (process.env.NODE_ENV !== 'production') {
  global.__asterraVipCatalogCache = cache;
}

// Default cache TTL: 30 minutes
const CACHE_TTL_MS = 30 * 60 * 1000;

export class VipCatalogStore {
  public static getCacheState(): CatalogCache {
    return { ...cache };
  }

  public static getCachedProducts(): ProductItem[] {
    return cache.products;
  }

  public static isCacheStale(): boolean {
    if (!cache.lastSyncedAt || cache.products.length === 0) return true;
    const now = Date.now();
    return now - cache.lastSyncedAt.getTime() > CACHE_TTL_MS;
  }

  /**
   * Synchronize products from VIP Reseller API and update store cache
   */
  public static async syncFromProvider(force = false): Promise<{
    success: boolean;
    totalFetched: number;
    totalMapped: number;
    message: string;
    cachedAt: string;
  }> {
    if (cache.isSyncing) {
      return {
        success: true,
        totalFetched: cache.totalRaw,
        totalMapped: cache.totalMapped,
        message: 'Proses sinkronisasi sedang berjalan di latar belakang.',
        cachedAt: cache.lastSyncedAt ? cache.lastSyncedAt.toISOString() : new Date().toISOString(),
      };
    }

    if (!force && !this.isCacheStale()) {
      return {
        success: true,
        totalFetched: cache.totalRaw,
        totalMapped: cache.totalMapped,
        message: 'Katalog masih up-to-date dalam rentang TTL cache.',
        cachedAt: cache.lastSyncedAt ? cache.lastSyncedAt.toISOString() : new Date().toISOString(),
      };
    }

    cache.isSyncing = true;
    cache.lastError = null;

    try {
      // Fetch prepaid services from VIP Reseller
      const response = await vipResellerService.getPrepaidServices();

      if (!response.result || !Array.isArray(response.data)) {
        throw new Error(response.message || 'Gagal mengambil data layanan dari VIP Reseller');
      }

      const rawServices = response.data;
      cache.totalRaw = rawServices.length;

      // Filter and map services to ProductItem
      // Focus on available services and popular categories (Streaming, Games, E-Money, Data, etc.)
      const mappedList: ProductItem[] = [];

      for (const raw of rawServices) {
        // Skip dummy / empty entries
        if (!raw.name || !raw.code) continue;

        const product = mapVipServiceToProduct(raw, DEFAULT_MARGIN_CONFIG);
        if (product) {
          mappedList.push(product);
        }
      }

      cache.products = mappedList;
      cache.totalMapped = mappedList.length;
      cache.lastSyncedAt = new Date();

      return {
        success: true,
        totalFetched: rawServices.length,
        totalMapped: mappedList.length,
        message: `Berhasil menyinkronkan ${mappedList.length} produk dari total ${rawServices.length} layanan VIP Reseller.`,
        cachedAt: cache.lastSyncedAt.toISOString(),
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      cache.lastError = errorMsg;
      return {
        success: false,
        totalFetched: cache.totalRaw,
        totalMapped: cache.totalMapped,
        message: `Sinkronisasi gagal: ${errorMsg}`,
        cachedAt: cache.lastSyncedAt ? cache.lastSyncedAt.toISOString() : new Date().toISOString(),
      };
    } finally {
      cache.isSyncing = false;
    }
  }
}
