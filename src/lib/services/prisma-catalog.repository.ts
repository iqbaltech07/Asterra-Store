import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { AdminCatalogStore, type ManagedProduct } from './admin-catalog-store';
import { getProductImageUrl } from './product-mapper';

const ACTIVE_CATALOG_PATH = path.resolve(process.cwd(), 'data/active-catalog.json');
const MANAGED_CATALOG_PATH = path.resolve(process.cwd(), 'data/managed-catalog.json');

/**
 * Fallback to local clean JSON files if database connection is unreachable
 */
function getLocalFallbackActiveProducts(): ManagedProduct[] {
  try {
    if (fs.existsSync(ACTIVE_CATALOG_PATH)) {
      return JSON.parse(fs.readFileSync(ACTIVE_CATALOG_PATH, 'utf-8'));
    }
    if (fs.existsSync(MANAGED_CATALOG_PATH)) {
      const all: ManagedProduct[] = JSON.parse(fs.readFileSync(MANAGED_CATALOG_PATH, 'utf-8'));
      return all.filter((p) => p.status === 'active');
    }
  } catch (err) {
    console.error('[CatalogRepository] Failed to read local fallback:', err);
  }
  return [];
}

/**
 * Accurately compute profit margin and percentage based on selling price and provider cost
 */
function computeProductMargins(
  price: number,
  providerPrice?: number | null,
  storedMargin?: number | null,
  storedPercentage?: number | null
): { profitMargin?: number; profitPercentage?: number } {
  if (providerPrice !== undefined && providerPrice !== null && providerPrice > 0) {
    const profitMargin = price - providerPrice;
    const profitPercentage = Math.round((profitMargin / providerPrice) * 100);
    return { profitMargin, profitPercentage };
  }
  return {
    profitMargin: storedMargin || undefined,
    profitPercentage: storedPercentage || undefined,
  };
}

export class PrismaCatalogRepository {
  /**
   * Get all active products for the public storefront
   */
  static async getActiveProducts(params?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ products: ManagedProduct[]; total: number }> {
    try {
      const where: Prisma.ProductWhereInput = { status: 'active' };
      if (params?.category && params.category !== 'all' && params.category !== 'cat-all') {
        where.categoryId = params.category;
      }
      if (params?.search) {
        const query = params.search.trim();
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { providerCode: { contains: query, mode: 'insensitive' } },
        ];
      }

      const [dbProducts, total] = await Promise.all([
        prisma.product.findMany({
          where,
          take: params?.limit ? params.limit : undefined,
          skip: params?.offset ? params.offset : undefined,
          orderBy: [{ popular: 'desc' }, { name: 'asc' }],
        }),
        prisma.product.count({ where }),
      ]);

      const formatted: ManagedProduct[] = dbProducts.map((p) => {
        const { profitMargin, profitPercentage } = computeProductMargins(
          p.price,
          p.providerPrice,
          p.profitMargin,
          p.profitPercentage
        );

        return {
          id: p.id,
          name: p.name,
          category: {
            id: p.categoryId,
            name: p.categoryName,
          },
          price: p.price,
          priceFormatted: p.priceFormatted,
          description: p.description || '',
          features: p.features,
          status: p.status as 'active' | 'archived',
          stock: p.stock ?? 100,
          imageUrl: p.imageUrl || getProductImageUrl(p.brand, p.categoryName),
          popular: p.popular,
          provider: (p.provider as 'native' | 'vip-reseller') || 'vip-reseller',
          providerCode: p.providerCode || undefined,
          providerName: p.providerName || undefined,
          providerPrice: p.providerPrice || undefined,
          providerStatus: (p.providerStatus as 'available' | 'empty') || undefined,
          lastProviderCheck: p.lastProviderCheck ? p.lastProviderCheck.toISOString() : undefined,
          profitMargin,
          profitPercentage,
        };
      });

      return { products: formatted, total };
    } catch (err) {
      console.warn('[PrismaCatalogRepository] Database error, using local fallback:', err);
      const local = getLocalFallbackActiveProducts();
      let filtered = local;

      if (params?.category && params.category !== 'all' && params.category !== 'cat-all') {
        filtered = filtered.filter((p) => p.category.id === params.category);
      }

      if (params?.search) {
        const query = params.search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.providerCode?.toLowerCase().includes(query) ||
            p.features.some((f) => f.toLowerCase().includes(query))
        );
      }

      return {
        products: params?.limit
          ? filtered.slice(params?.offset || 0, (params?.offset || 0) + params.limit)
          : filtered,
        total: filtered.length,
      };
    }
  }

  /**
   * Get a single product by ID
   */
  static async getProductById(id: string): Promise<ManagedProduct | null> {
    try {
      const p = await prisma.product.findUnique({ where: { id } });
      if (!p) return null;

      const { profitMargin, profitPercentage } = computeProductMargins(
        p.price,
        p.providerPrice,
        p.profitMargin,
        p.profitPercentage
      );

      return {
        id: p.id,
        name: p.name,
        category: {
          id: p.categoryId,
          name: p.categoryName,
        },
        price: p.price,
        priceFormatted: p.priceFormatted,
        description: p.description || '',
        features: p.features,
        status: p.status as 'active' | 'archived',
        stock: p.stock ?? 100,
        imageUrl: p.imageUrl || getProductImageUrl(p.brand, p.categoryName),
        popular: p.popular,
        provider: (p.provider as 'native' | 'vip-reseller') || 'vip-reseller',
        providerCode: p.providerCode || undefined,
        providerName: p.providerName || undefined,
        providerPrice: p.providerPrice || undefined,
        providerStatus: (p.providerStatus as 'available' | 'empty') || undefined,
        lastProviderCheck: p.lastProviderCheck ? p.lastProviderCheck.toISOString() : undefined,
        profitMargin,
        profitPercentage,
      };
    } catch (err) {
      console.warn('[PrismaCatalogRepository] Database error on getProductById, using local fallback:', err);
      const local = getLocalFallbackActiveProducts();
      return local.find((p) => p.id === id) || null;
    }
  }

  /**
   * Get all products for Admin Console (including archived)
   */
  static async getAllProductsAdmin(params?: {
    status?: 'all' | 'active' | 'archived';
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ products: ManagedProduct[]; total: number; metrics: Record<string, number> }> {
    try {
      const where: Prisma.ProductWhereInput = {};
      if (params?.status && params.status !== 'all') {
        where.status = params.status;
      }
      if (params?.category && params.category !== 'all' && params.category !== 'cat-all') {
        where.OR = [
          { categoryId: params.category },
          { categoryName: { equals: params.category, mode: 'insensitive' } },
        ];
      }
      if (params?.search) {
        const query = params.search.trim();
        const searchConditions = [
          { name: { contains: query, mode: 'insensitive' as const } },
          { brand: { contains: query, mode: 'insensitive' as const } },
          { providerCode: { contains: query, mode: 'insensitive' as const } },
        ];
        if (where.OR) {
          where.AND = [{ OR: where.OR }, { OR: searchConditions }];
          delete where.OR;
        } else {
          where.OR = searchConditions;
        }
      }

      const [dbProducts, total, activeCount, archivedCount, warningCount] = await Promise.all([
        prisma.product.findMany({
          where,
          take: params?.limit ? params.limit : undefined,
          skip: params?.offset ? params.offset : undefined,
          orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
        }),
        prisma.product.count({ where }),
        prisma.product.count({ where: { status: 'active' } }),
        prisma.product.count({ where: { status: 'archived' } }),
        prisma.product.count({
          where: {
            status: 'active',
            OR: [{ providerStatus: 'empty' }, { stock: 0 }],
          },
        }),
      ]);

      const formatted: ManagedProduct[] = dbProducts.map((p) => {
        const { profitMargin, profitPercentage } = computeProductMargins(
          p.price,
          p.providerPrice,
          p.profitMargin,
          p.profitPercentage
        );

        return {
          id: p.id,
          name: p.name,
          category: {
            id: p.categoryId,
            name: p.categoryName,
          },
          price: p.price,
          priceFormatted: p.priceFormatted,
          description: p.description || '',
          features: p.features,
          status: p.status as 'active' | 'archived',
          stock: p.stock ?? 100,
          imageUrl: p.imageUrl || getProductImageUrl(p.brand, p.categoryName),
          popular: p.popular,
          provider: (p.provider as 'native' | 'vip-reseller') || 'vip-reseller',
          providerCode: p.providerCode || undefined,
          providerName: p.providerName || undefined,
          providerPrice: p.providerPrice || undefined,
          providerStatus: (p.providerStatus as 'available' | 'empty') || undefined,
          lastProviderCheck: p.lastProviderCheck ? p.lastProviderCheck.toISOString() : undefined,
          profitMargin,
          profitPercentage,
        };
      });

      return {
        products: formatted,
        total,
        metrics: {
          total: activeCount + archivedCount,
          active: activeCount,
          archived: archivedCount,
          warnings: warningCount,
        },
      };
    } catch (err) {
      console.warn('[PrismaCatalogRepository] Database error on admin products, using fallback:', err);
      const local = getLocalFallbackActiveProducts();
      return {
        products: local,
        total: local.length,
        metrics: {
          total: local.length,
          active: local.length,
          archived: 0,
          warnings: local.filter((p) => p.providerStatus === 'empty').length,
        },
      };
    }
  }

  /**
   * Update a product (price, description, status)
   */
  static async updateProduct(id: string, patch: Partial<ManagedProduct>): Promise<ManagedProduct | null> {
    try {
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) return null;

      const data: Prisma.ProductUpdateInput = {};
      if (patch.name !== undefined) data.name = patch.name;

      const newPrice = patch.price !== undefined ? patch.price : existing.price;
      const providerPrice =
        patch.providerPrice !== undefined ? patch.providerPrice : existing.providerPrice;

      if (patch.price !== undefined) {
        data.price = patch.price;
        data.priceFormatted = patch.priceFormatted || `Rp ${Math.round(patch.price / 1000)} Rb`;
      }
      if (patch.providerPrice !== undefined) {
        data.providerPrice = patch.providerPrice;
      }
      if (patch.providerStatus !== undefined) {
        data.providerStatus = patch.providerStatus;
      }
      if (patch.stock !== undefined) {
        data.stock = Number(patch.stock);
      }
      if (patch.description !== undefined) data.description = patch.description;
      if (patch.features !== undefined) data.features = patch.features;
      if (patch.status !== undefined) data.status = patch.status;
      if (patch.popular !== undefined) data.popular = patch.popular;
      if (patch.imageUrl !== undefined) data.imageUrl = patch.imageUrl;

      // Always calculate and persist updated profit margin & percentage when price or cost changes
      const { profitMargin, profitPercentage } = computeProductMargins(
        newPrice,
        providerPrice,
        existing.profitMargin,
        existing.profitPercentage
      );

      data.profitMargin = profitMargin ?? null;
      data.profitPercentage = profitPercentage ?? null;

      const updated = await prisma.product.update({
        where: { id },
        data,
      });

      // Synchronize in-memory and disk fallback store
      AdminCatalogStore.updateProduct(id, {
        ...patch,
        price: newPrice,
        profitMargin,
        profitPercentage,
      });

      return {
        id: updated.id,
        name: updated.name,
        category: {
          id: updated.categoryId,
          name: updated.categoryName,
        },
        price: updated.price,
        priceFormatted: updated.priceFormatted,
        description: updated.description || '',
        features: updated.features,
        status: updated.status as 'active' | 'archived',
        stock: updated.stock ?? 100,
        imageUrl: updated.imageUrl || getProductImageUrl(updated.brand, updated.categoryName),
        popular: updated.popular,
        provider: (updated.provider as 'native' | 'vip-reseller') || 'vip-reseller',
        providerCode: updated.providerCode || undefined,
        providerName: updated.providerName || undefined,
        providerPrice: updated.providerPrice || undefined,
        providerStatus: (updated.providerStatus as 'available' | 'empty') || undefined,
        lastProviderCheck: updated.lastProviderCheck ? updated.lastProviderCheck.toISOString() : undefined,
        profitMargin,
        profitPercentage,
      };
    } catch (err) {
      console.error('[PrismaCatalogRepository] Failed to update product:', err);
      throw err;
    }
  }

  /**
   * Toggle product status between active and archived
   */
  static async toggleProductStatus(id: string): Promise<ManagedProduct | null> {
    try {
      const current = await prisma.product.findUnique({ where: { id } });
      if (!current) return null;

      const newStatus = current.status === 'active' ? 'archived' : 'active';
      return await this.updateProduct(id, { status: newStatus });
    } catch (err) {
      console.error('[PrismaCatalogRepository] Failed to toggle product status:', err);
      throw err;
    }
  }

  /**
   * Bulk update status for multiple products in a single database operation
   */
  static async bulkUpdateStatus(
    ids: string[],
    status: 'active' | 'archived'
  ): Promise<{ count: number }> {
    if (!ids || ids.length === 0) return { count: 0 };

    try {
      const result = await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { status },
      });

      // Synchronize in-memory and disk fallback store
      AdminCatalogStore.bulkUpdateStatus(ids, status);

      return { count: result.count };
    } catch (err) {
      console.warn('[PrismaCatalogRepository] Database error on bulkUpdateStatus, using store fallback:', err);
      const count = AdminCatalogStore.bulkUpdateStatus(ids, status);
      return { count };
    }
  }

  /**
   * Permanently delete product from database and in-memory store
   */
  static async deleteProduct(id: string): Promise<boolean> {
    try {
      await prisma.product.delete({ where: { id } });
      AdminCatalogStore.deleteProduct(id);
      return true;
    } catch (err) {
      console.error('[PrismaCatalogRepository] Failed to delete product:', err);
      throw err;
    }
  }

  /**
   * Bulk delete products from database and in-memory store
   */
  static async bulkDeleteProducts(ids: string[]): Promise<{ count: number }> {
    if (!ids || ids.length === 0) return { count: 0 };
    try {
      const result = await prisma.product.deleteMany({
        where: { id: { in: ids } },
      });
      ids.forEach((id) => AdminCatalogStore.deleteProduct(id));
      return { count: result.count };
    } catch (err) {
      console.error('[PrismaCatalogRepository] Failed to bulk delete products:', err);
      throw err;
    }
  }
}
