import fs from 'fs';
import path from 'path';
import { AffiliateService } from './affiliate.service';

export interface CustomerReferralUsage {
  id: string;
  orderId: string;
  customerEmail: string;
  customerPhone?: string;
  referralCode: string;
  discountAmount: number;
  usedAt: string;
}

const STORAGE_PATH = path.join(process.cwd(), 'data', 'referral-discounts.json');

export class ReferralDiscountService {
  private static ensureStorage(): void {
    const dir = path.dirname(STORAGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(STORAGE_PATH)) {
      fs.writeFileSync(STORAGE_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  public static getAllUsages(): CustomerReferralUsage[] {
    try {
      this.ensureStorage();
      const content = fs.readFileSync(STORAGE_PATH, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  private static saveUsages(list: CustomerReferralUsage[]): void {
    try {
      this.ensureStorage();
      fs.writeFileSync(STORAGE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error('[ReferralDiscountService] Failed to save usages:', err);
    }
  }

  /**
   * Validate if customer is eligible for 1-time referral discount.
   * Rules (SSOT §5, §11):
   * 1. 1 customer = 1x discount only.
   * 2. Anti-Self-Referral: Sales partner cannot use their own referral code.
   * 3. Checked against customer email and customer phone number.
   */
  public static checkEligibility(params: {
    referralCode?: string;
    customerEmail?: string;
    customerPhone?: string;
  }): {
    eligible: boolean;
    discountAmount: number;
    reason?: string;
    salesPartnerName?: string;
  } {
    const { referralCode, customerEmail, customerPhone } = params;

    if (!referralCode || !referralCode.trim()) {
      return { eligible: false, discountAmount: 0, reason: 'Tidak ada kode referral.' };
    }

    const partner = AffiliateService.findByCode(referralCode);
    if (!partner || partner.status !== 'active') {
      return { eligible: false, discountAmount: 0, reason: 'Kode referral tidak valid atau tidak aktif.' };
    }

    // Anti-Self-Referral Check
    const cleanEmail = customerEmail?.trim().toLowerCase();
    if (cleanEmail && partner.email.toLowerCase() === cleanEmail) {
      return {
        eligible: false,
        discountAmount: 0,
        reason: 'Mitra sales tidak dapat menggunakan kode referral sendiri (Anti Self-Referral).',
      };
    }

    const cleanPhone = customerPhone?.replace(/\D/g, '');
    const partnerPhone = partner.whatsapp?.replace(/\D/g, '');
    if (cleanPhone && partnerPhone && cleanPhone.length >= 8 && cleanPhone === partnerPhone) {
      return {
        eligible: false,
        discountAmount: 0,
        reason: 'Nomor kontak terdaftar sebagai pemilik kode referral (Anti Self-Referral).',
      };
    }

    // Check if customer already used referral discount in the past (1x per customer rule)
    const usages = this.getAllUsages();

    if (cleanEmail) {
      const alreadyUsedEmail = usages.find(
        (u) => u.customerEmail.toLowerCase() === cleanEmail
      );
      if (alreadyUsedEmail) {
        return {
          eligible: false,
          discountAmount: 0,
          reason: 'Diskon referral khusus customer baru (1x per pelanggan) sudah pernah digunakan.',
        };
      }
    }

    if (cleanPhone && cleanPhone.length >= 8) {
      const alreadyUsedPhone = usages.find(
        (u) => u.customerPhone && u.customerPhone.replace(/\D/g, '') === cleanPhone
      );
      if (alreadyUsedPhone) {
        return {
          eligible: false,
          discountAmount: 0,
          reason: 'Nomor WhatsApp sudah pernah mengklaim diskon referral pelanggan baru.',
        };
      }
    }

    // Eligible for Rp 1.000 1-time discount per SSOT §3.2 & §5
    return {
      eligible: true,
      discountAmount: 1000,
      salesPartnerName: partner.name,
      reason: 'Diskon referral customer baru (Rp 1.000) valid.',
    };
  }

  /**
   * Record usage of 1-time referral discount when order is finalized
   */
  public static recordUsage(usage: Omit<CustomerReferralUsage, 'id' | 'usedAt'>): CustomerReferralUsage {
    const usages = this.getAllUsages();
    
    // Idempotency check by orderId
    const existing = usages.find((u) => u.orderId === usage.orderId);
    if (existing) return existing;

    const newEntry: CustomerReferralUsage = {
      id: `ref-use-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      ...usage,
      usedAt: new Date().toISOString(),
    };

    usages.push(newEntry);
    this.saveUsages(usages);
    return newEntry;
  }

  /**
   * Revert usage if order was cancelled or refunded so customer's 1x eligibility is restored
   */
  public static revertUsage(orderId: string): boolean {
    const usages = this.getAllUsages();
    const filtered = usages.filter((u) => u.orderId !== orderId);
    if (filtered.length !== usages.length) {
      this.saveUsages(filtered);
      return true;
    }
    return false;
  }
}
