import { prisma } from '@/lib/prisma';

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount: number | null;
  minOrderAmount: number;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number;
  startDate: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromoUsage {
  id: string;
  promoCodeId: string;
  orderId: string | null;
  userEmail: string;
  discountApplied: number;
  createdAt: string;
}

export interface PromoValidationResult {
  valid: boolean;
  code?: string;
  description?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount?: number;
  finalTotal?: number;
  minOrderAmount?: number;
  maxDiscount?: number | null;
  message?: string;
  error?: string;
}

// In-memory fallback default promos for resilience
const DEFAULT_PROMOS: PromoCode[] = [
  {
    id: 'promo-asterra10',
    code: 'ASTERRA10',
    description: 'Diskon 10% untuk seluruh lisensi digital Asterra Store',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscount: 50000,
    minOrderAmount: 0,
    usageLimit: 1000,
    usedCount: 0,
    perUserLimit: 5,
    startDate: new Date('2026-01-01').toISOString(),
    expiresAt: new Date('2027-12-31').toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'promo-promohemat',
    code: 'PROMOHEMAT',
    description: 'Potongan langsung Rp 15.000 untuk minimal belanja Rp 25.000',
    discountType: 'fixed',
    discountValue: 15000,
    maxDiscount: null,
    minOrderAmount: 25000,
    usageLimit: 500,
    usedCount: 0,
    perUserLimit: 2,
    startDate: new Date('2026-01-01').toISOString(),
    expiresAt: new Date('2027-12-31').toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'promo-launching',
    code: 'LAUNCHING20',
    description: 'Voucher Spesial Pelanggan Baru Diskon 20% (Maks. Rp 25.000)',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 25000,
    minOrderAmount: 14000,
    usageLimit: 200,
    usedCount: 0,
    perUserLimit: 1,
    startDate: new Date('2026-01-01').toISOString(),
    expiresAt: new Date('2027-12-31').toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let inMemoryPromos: PromoCode[] = [...DEFAULT_PROMOS];
const inMemoryUsages: PromoUsage[] = [];
let dbInitialized = false;

export class PromoService {
  /**
   * Ensure PostgreSQL tables exist
   */
  private static async ensureTableExists(): Promise<boolean> {
    if (dbInitialized) return true;
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS promo_codes (
          id TEXT PRIMARY KEY,
          code TEXT UNIQUE NOT NULL,
          description TEXT,
          discount_type TEXT NOT NULL DEFAULT 'percentage',
          discount_value INTEGER NOT NULL,
          max_discount INTEGER,
          min_order_amount INTEGER NOT NULL DEFAULT 0,
          usage_limit INTEGER,
          used_count INTEGER NOT NULL DEFAULT 0,
          per_user_limit INTEGER NOT NULL DEFAULT 1,
          start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS promo_usages (
          id TEXT PRIMARY KEY,
          promo_code_id TEXT NOT NULL,
          order_id TEXT,
          user_email TEXT NOT NULL,
          discount_applied INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code)`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active)`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_promo_usages_email ON promo_usages(user_email)`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_promo_usages_code_email ON promo_usages(promo_code_id, user_email)`);

      // Check if table is empty, if so, seed default promos
      const countResult: Array<{ count: string | number }> = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM promo_codes;`
      );
      const totalInDb = Number(countResult[0]?.count || 0);

      if (totalInDb === 0) {
        for (const p of DEFAULT_PROMOS) {
          await prisma.$executeRawUnsafe(
            `INSERT INTO promo_codes 
            (id, code, description, discount_type, discount_value, max_discount, min_order_amount, usage_limit, used_count, per_user_limit, start_date, expires_at, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (code) DO NOTHING;`,
            p.id,
            p.code,
            p.description,
            p.discountType,
            p.discountValue,
            p.maxDiscount,
            p.minOrderAmount,
            p.usageLimit,
            p.usedCount,
            p.perUserLimit,
            new Date(p.startDate),
            p.expiresAt ? new Date(p.expiresAt) : null,
            p.isActive,
            new Date(p.createdAt),
            new Date(p.updatedAt)
          );
        }
      }

      dbInitialized = true;
      return true;
    } catch (err) {
      console.warn('[PromoService] DB initialization warning, using in-memory layer:', err);
      return false;
    }
  }

  /**
   * Helper to generate high-entropy random promo code
   * e.g. "AST-8K9N" or "DISKON-4291"
   */
  public static generateRandomCode(prefix = 'AST'): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix.toUpperCase()}-${randomPart}`;
  }

  /**
   * Retrieve all promo codes for Admin management
   */
  public static async getAllPromos(): Promise<PromoCode[]> {
    const hasDb = await this.ensureTableExists();
    if (hasDb) {
      try {
        const rows: Array<{
          id: string;
          code: string;
          description: string | null;
          discount_type: string;
          discount_value: number;
          max_discount: number | null;
          min_order_amount: number;
          usage_limit: number | null;
          used_count: number;
          per_user_limit: number;
          start_date: Date;
          expires_at: Date | null;
          is_active: boolean;
          created_at: Date;
          updated_at: Date;
        }> = await prisma.$queryRawUnsafe(
          `SELECT * FROM promo_codes ORDER BY created_at DESC;`
        );

        if (rows && rows.length > 0) {
          inMemoryPromos = rows.map((r) => ({
            id: r.id,
            code: r.code,
            description: r.description,
            discountType: (r.discount_type as 'percentage' | 'fixed') || 'percentage',
            discountValue: Number(r.discount_value),
            maxDiscount: r.max_discount ? Number(r.max_discount) : null,
            minOrderAmount: Number(r.min_order_amount || 0),
            usageLimit: r.usage_limit ? Number(r.usage_limit) : null,
            usedCount: Number(r.used_count || 0),
            perUserLimit: Number(r.per_user_limit || 1),
            startDate: r.start_date ? new Date(r.start_date).toISOString() : new Date().toISOString(),
            expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
            isActive: Boolean(r.is_active),
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
            updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn('[PromoService] Error querying promo_codes:', err);
      }
    }
    return inMemoryPromos;
  }

  /**
   * Find promo code by code string (case-insensitive)
   */
  public static async getPromoByCode(code: string): Promise<PromoCode | null> {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) return null;

    const hasDb = await this.ensureTableExists();
    if (hasDb) {
      try {
        const rows: Array<{
          id: string;
          code: string;
          description: string | null;
          discount_type: string;
          discount_value: number;
          max_discount: number | null;
          min_order_amount: number;
          usage_limit: number | null;
          used_count: number;
          per_user_limit: number;
          start_date: Date;
          expires_at: Date | null;
          is_active: boolean;
          created_at: Date;
          updated_at: Date;
        }> = await prisma.$queryRawUnsafe(
          `SELECT * FROM promo_codes WHERE UPPER(code) = $1 LIMIT 1;`,
          cleanCode
        );

        if (rows && rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            code: r.code,
            description: r.description,
            discountType: (r.discount_type as 'percentage' | 'fixed') || 'percentage',
            discountValue: Number(r.discount_value),
            maxDiscount: r.max_discount ? Number(r.max_discount) : null,
            minOrderAmount: Number(r.min_order_amount || 0),
            usageLimit: r.usage_limit ? Number(r.usage_limit) : null,
            usedCount: Number(r.used_count || 0),
            perUserLimit: Number(r.per_user_limit || 1),
            startDate: r.start_date ? new Date(r.start_date).toISOString() : new Date().toISOString(),
            expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
            isActive: Boolean(r.is_active),
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
            updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
          };
        }
      } catch (err) {
        console.warn('[PromoService] Error querying promo by code:', err);
      }
    }

    return inMemoryPromos.find((p) => p.code.toUpperCase() === cleanCode) || null;
  }

  /**
   * Count how many times a user has used a specific promo code
   */
  public static async getUserUsageCount(promoCodeId: string, userEmail: string): Promise<number> {
    const cleanEmail = (userEmail || '').trim().toLowerCase();
    if (!cleanEmail) return 0;

    const hasDb = await this.ensureTableExists();
    if (hasDb) {
      try {
        const rows: Array<{ count: string | number }> = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM promo_usages WHERE promo_code_id = $1 AND LOWER(user_email) = $2;`,
          promoCodeId,
          cleanEmail
        );
        return Number(rows[0]?.count || 0);
      } catch (err) {
        console.warn('[PromoService] Error counting user promo usage:', err);
      }
    }

    return inMemoryUsages.filter(
      (u) => u.promoCodeId === promoCodeId && u.userEmail.toLowerCase() === cleanEmail
    ).length;
  }

  /**
   * Validate promo code against security rules, minimum order amount, date expiration, and user quota
   */
  public static async validatePromo(
    code: string,
    subtotal: number,
    userEmail?: string | null
  ): Promise<PromoValidationResult> {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      return { valid: false, error: 'Silakan masukkan kode promo yang valid.' };
    }

    const promo = await this.getPromoByCode(cleanCode);
    if (!promo) {
      return { valid: false, error: `Kode promo "${cleanCode}" tidak ditemukan atau salah ketik.` };
    }

    if (!promo.isActive) {
      return { valid: false, error: `Voucher promo "${cleanCode}" saat ini sedang dinonaktifkan.` };
    }

    const now = new Date();

    // Check Start Date
    if (promo.startDate && new Date(promo.startDate) > now) {
      return { valid: false, error: `Voucher promo "${cleanCode}" belum mulai berlaku.` };
    }

    // Check Expiration Date
    if (promo.expiresAt && new Date(promo.expiresAt) < now) {
      const expDate = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(promo.expiresAt));
      return { valid: false, error: `Voucher promo "${cleanCode}" telah kedaluwarsa pada ${expDate}.` };
    }

    // Check Global Usage Limit
    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
      return { valid: false, error: `Kuota penggunaan voucher "${cleanCode}" telah habis.` };
    }

    // Check Minimum Order Amount
    const numericSubtotal = Math.max(0, Number(subtotal) || 0);
    if (promo.minOrderAmount > 0 && numericSubtotal < promo.minOrderAmount) {
      return {
        valid: false,
        minOrderAmount: promo.minOrderAmount,
        error: `Minimal belanja untuk voucher ini adalah Rp ${promo.minOrderAmount.toLocaleString(
          'id-ID'
        )} (Subtotal Anda: Rp ${numericSubtotal.toLocaleString('id-ID')}).`,
      };
    }

    // Check Per-User Quota
    if (userEmail && promo.perUserLimit > 0) {
      const userUsageCount = await this.getUserUsageCount(promo.id, userEmail);
      if (userUsageCount >= promo.perUserLimit) {
        return {
          valid: false,
          error: `Anda telah mencapai batas maksimal (${promo.perUserLimit}x) pemakaian voucher "${cleanCode}".`,
        };
      }
    }

    // Calculate Discount Amount
    let discountAmount = 0;
    if (promo.discountType === 'percentage') {
      const rawDiscount = Math.round((numericSubtotal * promo.discountValue) / 100);
      discountAmount = promo.maxDiscount !== null ? Math.min(rawDiscount, promo.maxDiscount) : rawDiscount;
    } else {
      discountAmount = Math.min(numericSubtotal, promo.discountValue);
    }

    // Discount cannot exceed subtotal
    discountAmount = Math.max(0, Math.min(discountAmount, numericSubtotal));
    const finalTotal = Math.max(0, numericSubtotal - discountAmount);

    const discountSummary =
      promo.discountType === 'percentage'
        ? `${promo.discountValue}% (Hemat Rp ${discountAmount.toLocaleString('id-ID')})`
        : `Rp ${discountAmount.toLocaleString('id-ID')}`;

    return {
      valid: true,
      code: promo.code,
      description: promo.description || 'Voucher Promo Terverifikasi',
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount,
      finalTotal,
      minOrderAmount: promo.minOrderAmount,
      maxDiscount: promo.maxDiscount,
      message: `Voucher ${promo.code} berhasil digunakan! Potongan harga ${discountSummary}.`,
    };
  }

  /**
   * Redeem promo code when order is successfully created
   */
  public static async redeemPromo(
    code: string,
    orderId: string,
    subtotal: number,
    userEmail: string
  ): Promise<{ success: boolean; discountApplied: number; error?: string }> {
    const validation = await this.validatePromo(code, subtotal, userEmail);
    if (!validation.valid || !validation.discountAmount) {
      return { success: false, discountApplied: 0, error: validation.error || 'Voucher tidak valid.' };
    }

    const promo = await this.getPromoByCode(code);
    if (!promo) {
      return { success: false, discountApplied: 0, error: 'Promo tidak ditemukan.' };
    }

    const discountApplied = validation.discountAmount;
    const usageId = `usage-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();

    const hasDb = await this.ensureTableExists();
    if (hasDb) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE promo_codes SET used_count = used_count + 1, updated_at = NOW() WHERE id = $1;`,
          promo.id
        );

        await prisma.$executeRawUnsafe(
          `INSERT INTO promo_usages (id, promo_code_id, order_id, user_email, discount_applied, created_at)
          VALUES ($1, $2, $3, $4, $5, $6);`,
          usageId,
          promo.id,
          orderId,
          userEmail.trim().toLowerCase(),
          discountApplied,
          now
        );
      } catch (err) {
        console.warn('[PromoService] DB error recording promo usage:', err);
      }
    }

    // Sync in-memory store
    promo.usedCount += 1;
    inMemoryUsages.push({
      id: usageId,
      promoCodeId: promo.id,
      orderId,
      userEmail: userEmail.trim().toLowerCase(),
      discountApplied,
      createdAt: now.toISOString(),
    });

    return { success: true, discountApplied };
  }

  /**
   * Create new promo code (Admin action)
   */
  public static async createPromo(payload: {
    code: string;
    description?: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    maxDiscount?: number | null;
    minOrderAmount?: number;
    usageLimit?: number | null;
    perUserLimit?: number;
    expiresAt?: string | null;
    isActive?: boolean;
  }): Promise<PromoCode> {
    const cleanCode = (payload.code || '').trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 3) {
      throw new Error('Kode promo minimal 3 karakter alfanumerik.');
    }

    const existing = await this.getPromoByCode(cleanCode);
    if (existing) {
      throw new Error(`Kode promo "${cleanCode}" sudah digunakan.`);
    }

    const id = `promo-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const newPromo: PromoCode = {
      id,
      code: cleanCode,
      description: payload.description?.trim() || null,
      discountType: payload.discountType,
      discountValue: Math.max(1, Number(payload.discountValue) || 1),
      maxDiscount: payload.maxDiscount ? Number(payload.maxDiscount) : null,
      minOrderAmount: Math.max(0, Number(payload.minOrderAmount) || 0),
      usageLimit: payload.usageLimit ? Number(payload.usageLimit) : null,
      usedCount: 0,
      perUserLimit: Math.max(1, Number(payload.perUserLimit) || 1),
      startDate: now,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt).toISOString() : null,
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
      createdAt: now,
      updatedAt: now,
    };

    const hasDb = await this.ensureTableExists();
    if (hasDb) {
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO promo_codes 
          (id, code, description, discount_type, discount_value, max_discount, min_order_amount, usage_limit, used_count, per_user_limit, start_date, expires_at, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15);`,
          newPromo.id,
          newPromo.code,
          newPromo.description,
          newPromo.discountType,
          newPromo.discountValue,
          newPromo.maxDiscount,
          newPromo.minOrderAmount,
          newPromo.usageLimit,
          newPromo.usedCount,
          newPromo.perUserLimit,
          new Date(newPromo.startDate),
          newPromo.expiresAt ? new Date(newPromo.expiresAt) : null,
          newPromo.isActive,
          new Date(newPromo.createdAt),
          new Date(newPromo.updatedAt)
        );
      } catch (err) {
        console.warn('[PromoService] DB error creating promo code:', err);
      }
    }

    inMemoryPromos.unshift(newPromo);
    return newPromo;
  }

  /**
   * Toggle promo active status (Admin action)
   */
  public static async togglePromoStatus(id: string): Promise<PromoCode> {
    const promo = (await this.getAllPromos()).find((p) => p.id === id);
    if (!promo) {
      throw new Error('Promo code tidak ditemukan.');
    }

    const updatedStatus = !promo.isActive;
    promo.isActive = updatedStatus;
    promo.updatedAt = new Date().toISOString();

    const hasDb = await this.ensureTableExists();
    if (hasDb) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE promo_codes SET is_active = $1, updated_at = NOW() WHERE id = $2;`,
          updatedStatus,
          id
        );
      } catch (err) {
        console.warn('[PromoService] DB error toggling promo status:', err);
      }
    }

    return promo;
  }

  /**
   * Delete promo code (Admin action)
   */
  public static async deletePromo(id: string): Promise<boolean> {
    const hasDb = await this.ensureTableExists();
    if (hasDb) {
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM promo_codes WHERE id = $1;`, id);
      } catch (err) {
        console.warn('[PromoService] DB error deleting promo code:', err);
      }
    }

    inMemoryPromos = inMemoryPromos.filter((p) => p.id !== id);
    return true;
  }

  /**
   * Retrieve Promo Metrics for Admin Dashboard
   */
  public static async getPromoMetrics() {
    const promos = await this.getAllPromos();
    const now = new Date();

    const total = promos.length;
    const active = promos.filter((p) => p.isActive && (!p.expiresAt || new Date(p.expiresAt) >= now)).length;
    const totalUsed = promos.reduce((sum, p) => sum + (p.usedCount || 0), 0);

    return {
      total,
      active,
      expired: total - active,
      totalUsed,
    };
  }
}
