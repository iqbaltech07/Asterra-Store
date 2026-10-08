import fs from 'fs';
import path from 'path';
import { ProductItem } from '@/lib/products-data';
import { vipResellerService, VipRawService } from './vip-reseller.service';
import {
  formatRupiah,
  mapCategory,
  getProductImageUrl,
  calculateSellingPrice,
  DEFAULT_MARGIN_CONFIG,
} from './product-mapper';

export interface ManagedProductItem extends ProductItem {
  status: 'active' | 'archived';
  provider: 'native' | 'vip-reseller';
  providerCode?: string;
  providerPrice?: number;
  providerStatus?: 'available' | 'empty' | 'maintenance' | 'unknown';
  providerName?: string;
  lastProviderCheck?: string;
  profitMargin?: number;
  profitPercentage?: number;
}

export type ManagedProduct = ManagedProductItem;

// Global persistence store in memory across Next.js reloads
declare global {
  var __asterraManagedCatalog: ManagedProductItem[] | undefined;
  var __asterraAdminOverrides: Record<string, Partial<ManagedProductItem>> | undefined;
  var __asterraCatalogSyncing: boolean | undefined;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const CATALOG_FILE = path.join(DATA_DIR, 'managed-catalog.json');
const OVERRIDES_FILE = path.join(DATA_DIR, 'admin-overrides.json');

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // Ignore in read-only environments
  }
}

function loadCatalogFromDisk(): ManagedProductItem[] | null {
  try {
    ensureDataDir();
    if (fs.existsSync(CATALOG_FILE)) {
      const content = fs.readFileSync(CATALOG_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback to empty if error reading
  }
  return null;
}

function saveCatalogToDisk(items: ManagedProductItem[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(CATALOG_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch {
    // Fail silently in restricted environments
  }
}

function loadOverridesFromDisk(): Record<string, Partial<ManagedProductItem>> {
  try {
    ensureDataDir();
    if (fs.existsSync(OVERRIDES_FILE)) {
      const content = fs.readFileSync(OVERRIDES_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {
    // Fallback
  }
  return {};
}

function saveOverridesToDisk(overrides: Record<string, Partial<ManagedProductItem>>): void {
  try {
    ensureDataDir();
    fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(overrides, null, 2), 'utf-8');
  } catch {
    // Fail silently
  }
}

function calculateMargins(sellingPrice: number, basePrice?: number) {
  if (!basePrice || basePrice <= 0) {
    return { profitMargin: undefined, profitPercentage: undefined };
  }
  const margin = sellingPrice - basePrice;
  const percentage = Math.round((margin / basePrice) * 100);
  return { profitMargin: margin, profitPercentage: percentage };
}

// Initial state setup: ZERO hardcoded products. Everything loads from VIP Reseller or saved disk catalog.
function getInitialCatalog(): ManagedProductItem[] {
  const diskCatalog = loadCatalogFromDisk();
  if (diskCatalog && diskCatalog.length > 0) {
    return diskCatalog;
  }
  return [];
}

if (!global.__asterraManagedCatalog) {
  global.__asterraManagedCatalog = getInitialCatalog();
}

if (!global.__asterraAdminOverrides) {
  global.__asterraAdminOverrides = loadOverridesFromDisk();
}

export class AdminCatalogStore {
  private static get store(): ManagedProductItem[] {
    if (!global.__asterraManagedCatalog) {
      global.__asterraManagedCatalog = getInitialCatalog();
    }
    return global.__asterraManagedCatalog;
  }

  private static set store(items: ManagedProductItem[]) {
    global.__asterraManagedCatalog = items;
    saveCatalogToDisk(items);
  }

  private static get overrides(): Record<string, Partial<ManagedProductItem>> {
    if (!global.__asterraAdminOverrides) {
      global.__asterraAdminOverrides = loadOverridesFromDisk();
    }
    return global.__asterraAdminOverrides;
  }

  private static setOverride(id: string, updates: Partial<ManagedProductItem>): void {
    const all = this.overrides;
    all[id] = { ...(all[id] || {}), ...updates };
    global.__asterraAdminOverrides = all;
    saveOverridesToDisk(all);
  }

  /**
   * Sync all products dynamically from VIP Reseller API
   * Transforms raw services into managed products and merges admin price/status overrides
   */
  public static async syncFromVipReseller(options?: { force?: boolean }): Promise<{
    success: boolean;
    totalSynced: number;
    message: string;
    isIpBlocked?: boolean;
    blockedIp?: string;
  }> {
    if (global.__asterraCatalogSyncing) {
      return {
        success: true,
        totalSynced: this.store.length,
        message: 'Sinkronisasi VIP Reseller sedang berjalan.',
      };
    }

    global.__asterraCatalogSyncing = true;

    try {
      const response = await vipResellerService.getAllAggregatedServices({
        forceRefresh: options?.force,
      });

      if (!response.result || !Array.isArray(response.data)) {
        const blockedIpMatch = response.message?.match(/IP\s+([\d\.]+)/i);
        const blockedIp = blockedIpMatch ? blockedIpMatch[1] : undefined;

        return {
          success: false,
          totalSynced: this.store.length,
          isIpBlocked: Boolean(blockedIp),
          blockedIp,
          message: response.message || 'Gagal mengambil data dari gateway VIP Reseller.',
        };
      }

      const rawServices = response.data;
      const existingMap = new Map<string, ManagedProductItem>();
      for (const item of this.store) {
        existingMap.set(item.id, item);
      }

      const overrides = this.overrides;
      const updatedCatalog: ManagedProductItem[] = [];

      for (const raw of rawServices) {
        if (!raw.code || !raw.name) continue;

        const id = `vip-${raw.code.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;
        let basePrice = 0;
        if (typeof raw.price === 'object' && raw.price !== null) {
          basePrice = raw.price.basic || raw.price.premium || 0;
        } else if (typeof raw.price === 'number') {
          basePrice = raw.price;
        }

        const providerStatus: 'available' | 'empty' =
          raw.status === 'available' ? 'available' : 'empty';

        const existing = existingMap.get(id);
        const override = overrides[id];

        // Determine selling price: Priority to admin override, then existing custom price, then calculated margin
        let sellingPrice: number;
        if (override?.price !== undefined) {
          sellingPrice = override.price;
        } else if (existing?.price !== undefined && existing.providerPrice !== basePrice) {
          sellingPrice = existing.price;
        } else {
          sellingPrice = calculateSellingPrice(basePrice, DEFAULT_MARGIN_CONFIG);
        }

        const { profitMargin, profitPercentage } = calculateMargins(
          sellingPrice,
          basePrice
        );

        const defaultCat = mapCategory(raw.type, raw.brand);
        const category = override?.category || existing?.category || defaultCat;
        const isAppsStreaming =
          category.id === 'cat-apps-streaming' ||
          category.name === 'Apps & Streaming';

        // Policy: HANYA Apps & Streaming yang aktif di toko secara default. Kategori lainnya otomatis diarsipkan.
        const defaultStatus: 'active' | 'archived' =
          isAppsStreaming && providerStatus === 'available' ? 'active' : 'archived';

        const status: 'active' | 'archived' =
          override?.status !== undefined
            ? override.status
            : existing?.status !== undefined
            ? existing.status
            : defaultStatus;

        const name = override?.name || existing?.name || raw.name;
        const imageUrl =
          override?.imageUrl ||
          existing?.imageUrl ||
          getProductImageUrl(raw.brand, raw.type);

        const description =
          override?.description ||
          existing?.description ||
          (raw.note && raw.note !== '-'
            ? `${raw.name}. ${raw.note}`
            : `${raw.name} - Layanan digital resmi terverifikasi dengan aktivasi instan.`);

        const features =
          override?.features ||
          existing?.features || [
            `Brand: ${raw.brand || 'Digital'}`,
            `Kode Layanan: ${raw.code}`,
            `Ketersediaan Supplier: ${providerStatus === 'available' ? 'Tersedia' : 'Kosong'}`,
            raw.note && raw.note !== '-'
              ? `Catatan: ${raw.note}`
              : 'Proses aktivasi cepat & otomatis',
          ];

        const popular =
          override?.popular !== undefined
            ? override.popular
            : existing?.popular !== undefined
            ? existing.popular
            : providerStatus === 'available' &&
              (raw.type === 'streaming-tv' ||
                raw.name.toLowerCase().includes('netflix') ||
                raw.name.toLowerCase().includes('spotify') ||
                raw.name.toLowerCase().includes('chatgpt') ||
                raw.name.toLowerCase().includes('canva'));

        const item: ManagedProductItem = {
          id,
          name,
          category,
          price: sellingPrice,
          priceFormatted: formatRupiah(sellingPrice),
          description,
          features,
          status,
          imageUrl,
          popular,
          provider: 'vip-reseller',
          providerCode: raw.code,
          providerName: raw.name,
          providerPrice: basePrice,
          providerStatus,
          lastProviderCheck: new Date().toISOString(),
          profitMargin,
          profitPercentage,
        };

        updatedCatalog.push(item);
      }

      this.store = updatedCatalog;

      return {
        success: true,
        totalSynced: updatedCatalog.length,
        message: `Berhasil memuat ${updatedCatalog.length} produk dari VIP Reseller.`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        totalSynced: this.store.length,
        message: `Gagal sinkronisasi katalog VIP Reseller: ${msg}`,
      };
    } finally {
      global.__asterraCatalogSyncing = false;
    }
  }

  /**
   * Ensure catalog is populated. If empty, attempts automatic sync from VIP Reseller.
   */
  public static async ensureInitialized(): Promise<void> {
    if (this.store.length === 0) {
      await this.syncFromVipReseller();
    }
  }

  /**
   * Get all products for Admin management (includes active, archived, and provider health)
   */
  public static getAllProducts(filter?: {
    status?: 'all' | 'active' | 'archived' | 'warning';
    search?: string;
    category?: string;
    provider?: string;
  }): ManagedProductItem[] {
    let list = [...this.store];

    if (filter?.status && filter.status !== 'all') {
      if (filter.status === 'warning') {
        // Products that are active in store but upstream provider has empty stock
        list = list.filter(
          (p) =>
            p.status === 'active' &&
            p.provider === 'vip-reseller' &&
            p.providerStatus === 'empty'
        );
      } else {
        list = list.filter((p) => p.status === filter.status);
      }
    }

    if (filter?.category && filter.category !== 'Semua' && filter.category !== 'all') {
      list = list.filter(
        (p) =>
          p.category.name.toLowerCase() === filter.category?.toLowerCase() ||
          p.category.id.toLowerCase() === filter.category?.toLowerCase()
      );
    }

    if (filter?.provider && filter.provider !== 'all') {
      list = list.filter((p) => p.provider === filter.provider);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.providerCode && p.providerCode.toLowerCase().includes(q))
      );
    }

    return list;
  }

  /**
   * Get only ACTIVE products for consumer storefront (/ and /products)
   */
  public static getActiveProducts(filter?: {
    search?: string;
    category?: string;
    sort?: string;
  }): ProductItem[] {
    let list = this.store.filter((p) => p.status === 'active');

    if (filter?.category && filter.category !== 'Semua' && filter.category !== 'all') {
      list = list.filter(
        (p) =>
          p.category.name.toLowerCase() === filter.category?.toLowerCase() ||
          p.category.id.toLowerCase() === filter.category?.toLowerCase()
      );
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.features.some((f) => f.toLowerCase().includes(q))
      );
    }

    if (filter?.sort === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (filter?.sort === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (filter?.sort === 'popular') {
      list.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    }

    return list;
  }

  /**
   * Find product by ID
   */
  public static getProductById(id: string): ManagedProductItem | null {
    return this.store.find((p) => p.id === id) || null;
  }

  /**
   * Add new product
   */
  public static createProduct(
    data: Omit<ManagedProductItem, 'id' | 'priceFormatted'> & {
      id?: string;
      priceFormatted?: string;
    }
  ): ManagedProductItem {
    const id =
      data.id ||
      `prod-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const { profitMargin, profitPercentage } = calculateMargins(
      data.price,
      data.providerPrice
    );

    const newProduct: ManagedProductItem = {
      ...data,
      id,
      priceFormatted: formatRupiah(data.price),
      status: data.status || 'active',
      provider: data.provider || 'native',
      profitMargin,
      profitPercentage,
    };

    this.store = [newProduct, ...this.store];
    this.setOverride(id, newProduct);
    return newProduct;
  }

  /**
   * Update existing product details, price, or status
   */
  public static updateProduct(
    id: string,
    updates: Partial<ManagedProductItem>
  ): ManagedProductItem | null {
    const index = this.store.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const current = this.store[index];
    const newPrice = updates.price !== undefined ? updates.price : current.price;
    const providerPrice =
      updates.providerPrice !== undefined
        ? updates.providerPrice
        : current.providerPrice;

    const { profitMargin, profitPercentage } = calculateMargins(
      newPrice,
      providerPrice
    );

    const updated: ManagedProductItem = {
      ...current,
      ...updates,
      price: newPrice,
      priceFormatted: formatRupiah(newPrice),
      profitMargin,
      profitPercentage,
    };

    const newStore = [...this.store];
    newStore[index] = updated;
    this.store = newStore;

    // Record override to persist admin preference
    this.setOverride(id, updates);

    return updated;
  }

  /**
   * Quick 1-click toggle between active and archived
   */
  public static toggleProductStatus(id: string): ManagedProductItem | null {
    const current = this.getProductById(id);
    if (!current) return null;

    const nextStatus: 'active' | 'archived' =
      current.status === 'active' ? 'archived' : 'active';
    return this.updateProduct(id, { status: nextStatus });
  }

  /**
   * Bulk update status for multiple products in memory and persistent disk overrides
   */
  public static bulkUpdateStatus(
    ids: string[],
    status: 'active' | 'archived'
  ): number {
    const idSet = new Set(ids);
    let count = 0;
    const updatedStore = this.store.map((p) => {
      if (idSet.has(p.id)) {
        count++;
        this.setOverride(p.id, { status });
        return { ...p, status };
      }
      return p;
    });
    this.store = updatedStore;
    return count;
  }

  /**
   * Delete or permanently remove product
   */
  public static deleteProduct(id: string): boolean {
    const initialLen = this.store.length;
    this.store = this.store.filter((p) => p.id !== id);
    return this.store.length < initialLen;
  }

  /**
   * Import product from VIP Reseller with custom admin pricing & details
   */
  public static importFromVipReseller(
    rawService: VipRawService,
    custom: {
      name?: string;
      price: number;
      categoryId?: string;
      categoryName?: string;
      description?: string;
      features?: string[];
      status?: 'active' | 'archived';
      imageUrl?: string;
    }
  ): ManagedProductItem {
    const id = `vip-${rawService.code.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;

    let basePrice = 0;
    if (typeof rawService.price === 'object' && rawService.price !== null) {
      basePrice = rawService.price.basic || rawService.price.premium || 0;
    } else if (typeof rawService.price === 'number') {
      basePrice = rawService.price;
    }

    const defaultCat = mapCategory(rawService.type, rawService.brand);
    const category = {
      id: custom.categoryId || defaultCat.id,
      name: custom.categoryName || defaultCat.name,
    };

    const name = custom.name || rawService.name;
    const price = custom.price;
    const status = custom.status || 'archived';

    const features =
      custom.features || [
        `Brand: ${rawService.brand || 'Digital'}`,
        `Kode Provider: ${rawService.code}`,
        `Ketersediaan Supplier: ${rawService.status === 'available' ? 'Tersedia' : 'Kosong'}`,
        rawService.note && rawService.note !== '-'
          ? `Catatan: ${rawService.note}`
          : 'Proses aktivasi cepat & bergaransi',
      ];

    const description =
      custom.description ||
      (rawService.note && rawService.note !== '-'
        ? `${name}. ${rawService.note}`
        : `${name} - Layanan digital resmi terverifikasi.`);

    const imageUrl =
      custom.imageUrl || getProductImageUrl(rawService.brand, rawService.type);

    const providerStatus: 'available' | 'empty' =
      rawService.status === 'available' ? 'available' : 'empty';

    const existing = this.getProductById(id);
    if (existing) {
      return this.updateProduct(id, {
        name,
        category,
        price,
        description,
        features,
        status,
        imageUrl,
        providerPrice: basePrice,
        providerStatus,
        lastProviderCheck: new Date().toISOString(),
      })!;
    }

    const created = this.createProduct({
      id,
      name,
      category,
      price,
      priceFormatted: formatRupiah(price),
      description,
      features,
      status,
      imageUrl,
      popular: false,
      provider: 'vip-reseller',
      providerCode: rawService.code,
      providerName: rawService.name,
      providerPrice: basePrice,
      providerStatus,
      lastProviderCheck: new Date().toISOString(),
    });

    this.setOverride(id, {
      name,
      price,
      status,
      category,
      description,
      features,
      imageUrl,
    });

    return created;
  }

  /**
   * Refresh provider availability & price from VIP Reseller API across all services
   */
  public static async refreshProviderStatuses(): Promise<{
    checked: number;
    updated: number;
    warningsCount: number;
  }> {
    const vipProducts = this.store.filter(
      (p) => p.provider === 'vip-reseller' && p.providerCode
    );

    if (vipProducts.length === 0) {
      return { checked: 0, updated: 0, warningsCount: 0 };
    }

    try {
      const response = await vipResellerService.getAllAggregatedServices();
      if (!response.result || !Array.isArray(response.data)) {
        return { checked: vipProducts.length, updated: 0, warningsCount: 0 };
      }

      const servicesMap = new Map<string, VipRawService>();
      for (const s of response.data) {
        if (s.code) {
          servicesMap.set(s.code.toUpperCase(), s);
        }
      }

      let updatedCount = 0;
      let warningsCount = 0;

      for (const prod of vipProducts) {
        if (!prod.providerCode) continue;
        const live = servicesMap.get(prod.providerCode.toUpperCase());

        if (live) {
          let basePrice = 0;
          if (typeof live.price === 'object' && live.price !== null) {
            basePrice = live.price.basic || live.price.premium || 0;
          } else if (typeof live.price === 'number') {
            basePrice = live.price;
          }

          const providerStatus: 'available' | 'empty' =
            live.status === 'available' ? 'available' : 'empty';

          if (providerStatus === 'empty' && prod.status === 'active') {
            warningsCount++;
          }

          this.updateProduct(prod.id, {
            providerPrice: basePrice || prod.providerPrice,
            providerStatus,
            lastProviderCheck: new Date().toISOString(),
          });

          updatedCount++;
        }
      }

      return {
        checked: vipProducts.length,
        updated: updatedCount,
        warningsCount,
      };
    } catch {
      return { checked: vipProducts.length, updated: 0, warningsCount: 0 };
    }
  }
}
