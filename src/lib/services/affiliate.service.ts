import fs from 'fs';
import path from 'path';

export interface AffiliatePartnerData {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  code: string;
  referredByCode?: string;
  tier: 'Standard (10%)' | 'VIP Sales (15%)' | 'Executive (20%)';
  rate: number;
  totalClicks: number;
  totalOrders: number;
  totalRevenue: number;
  unpaidCommission: number;
  paidCommission: number;
  bankName?: string;
  bankAccount?: string;
  status: 'active' | 'pending' | 'suspended';
  joinedAt: string;
  createdAt: string;
  creditedOrderIds?: string[];
}

const AFFILIATES_STORAGE_PATH = path.join(process.cwd(), 'data', 'affiliates.json');

const INITIAL_AFFILIATES: AffiliatePartnerData[] = [];

export class AffiliateService {
  private static ensureStorage(): void {
    const dir = path.dirname(AFFILIATES_STORAGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(AFFILIATES_STORAGE_PATH)) {
      fs.writeFileSync(AFFILIATES_STORAGE_PATH, JSON.stringify(INITIAL_AFFILIATES, null, 2), 'utf-8');
    }
  }

  public static getAllAffiliates(): AffiliatePartnerData[] {
    try {
      this.ensureStorage();
      const content = fs.readFileSync(AFFILIATES_STORAGE_PATH, 'utf-8');
      return JSON.parse(content);
    } catch {
      return INITIAL_AFFILIATES;
    }
  }

  public static saveAffiliates(list: AffiliatePartnerData[]): void {
    try {
      this.ensureStorage();
      fs.writeFileSync(AFFILIATES_STORAGE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving affiliates:', err);
    }
  }

  public static findByCode(code: string): AffiliatePartnerData | undefined {
    const normalized = code.trim().toUpperCase();
    const list = this.getAllAffiliates();
    return list.find((a) => a.code.toUpperCase() === normalized);
  }

  public static findByEmailOrPhone(email: string, phone: string): AffiliatePartnerData | undefined {
    const normEmail = email.trim().toLowerCase();
    const normPhone = phone.replace(/\D/g, '');
    const list = this.getAllAffiliates();
    return list.find(
      (a) =>
        a.email.toLowerCase() === normEmail ||
        a.whatsapp.replace(/\D/g, '') === normPhone
    );
  }

  public static registerSalesPartner(input: {
    name: string;
    email: string;
    whatsapp: string;
    referralCode?: string;
    customCode?: string;
  }): { success: boolean; partner?: AffiliatePartnerData; message: string } {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const whatsapp = input.whatsapp.trim();

    if (!name || name.length < 3) {
      return { success: false, message: 'Nama lengkap wajib diisi minimal 3 karakter.' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Alamat email aktif tidak valid.' };
    }
    if (!whatsapp || whatsapp.length < 9) {
      return { success: false, message: 'Nomor WhatsApp wajib diisi minimal 9 digit.' };
    }

    // Check duplicate email or phone
    const existing = this.findByEmailOrPhone(email, whatsapp);
    if (existing) {
      return {
        success: false,
        message: `Akun sales dengan email atau WhatsApp tersebut sudah terdaftar (Kode: ${existing.code}).`,
      };
    }

    // Validate sponsor referral code if provided
    let verifiedSponsorCode: string | undefined = undefined;
    if (input.referralCode && input.referralCode.trim()) {
      const sponsor = this.findByCode(input.referralCode);
      if (sponsor) {
        verifiedSponsorCode = sponsor.code;
      }
    }

    // Generate unique code for the new sales partner
    let assignedCode = '';
    if (input.customCode && input.customCode.trim()) {
      const sanitized = input.customCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const codeCheck = this.findByCode(sanitized);
      if (!codeCheck && sanitized.length >= 3) {
        assignedCode = sanitized.startsWith('AST-') ? sanitized : `AST-${sanitized}`;
      }
    }

    if (!assignedCode) {
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const cleanName = name.split(' ')[0].replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      assignedCode = `AST-${cleanName || 'SALES'}-${randomSuffix}`;
    }

    // Double check unique code collision
    let finalCode = assignedCode;
    let counter = 1;
    while (this.findByCode(finalCode)) {
      finalCode = `${assignedCode}-${counter}`;
      counter++;
    }

    const todayDate = new Date();
    const formattedJoinedAt = todayDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const newPartner: AffiliatePartnerData = {
      id: `aff-${Date.now().toString(36)}`,
      name,
      email,
      whatsapp,
      code: finalCode,
      referredByCode: verifiedSponsorCode,
      tier: 'Standard (10%)',
      rate: 10,
      totalClicks: 0,
      totalOrders: 0,
      totalRevenue: 0,
      unpaidCommission: 0,
      paidCommission: 0,
      status: 'active',
      joinedAt: formattedJoinedAt,
      createdAt: todayDate.toISOString(),
    };

    const currentList = this.getAllAffiliates();
    currentList.unshift(newPartner);
    this.saveAffiliates(currentList);

    return {
      success: true,
      partner: newPartner,
      message: `Pendaftaran berhasil! Selamat datang di tim sales Asterra Store. Kode referral Anda: ${finalCode}`,
    };
  }

  /**
   * Record a referral link click in real-time
   */
  public static recordClick(code: string): boolean {
    const normalized = code.trim().toUpperCase();
    const list = this.getAllAffiliates();
    const partner = list.find((a) => a.code.toUpperCase() === normalized);

    if (!partner) return false;

    partner.totalClicks = (partner.totalClicks || 0) + 1;
    this.saveAffiliates(list);
    return true;
  }

  /**
   * Admin method to directly add a partner with custom rates & bank details
   */
  public static createPartnerByAdmin(input: {
    name: string;
    email: string;
    whatsapp: string;
    code: string;
    rate: number;
    bankName?: string;
    bankAccount?: string;
  }): { success: boolean; partner?: AffiliatePartnerData; message: string } {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const whatsapp = input.whatsapp.trim();
    const rawCode = input.code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');

    if (!name || name.length < 3) {
      return { success: false, message: 'Nama lengkap wajib diisi minimal 3 karakter.' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Alamat email tidak valid.' };
    }
    if (!rawCode || rawCode.length < 3) {
      return { success: false, message: 'Kode referral minimal 3 karakter.' };
    }

    const existingCode = this.findByCode(rawCode);
    if (existingCode) {
      return { success: false, message: `Kode referral "${rawCode}" sudah digunakan.` };
    }

    const todayDate = new Date();
    const formattedJoinedAt = todayDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const rate = Number(input.rate) || 10;
    const tier = rate >= 20 ? 'Executive (20%)' : rate >= 15 ? 'VIP Sales (15%)' : 'Standard (10%)';

    const newPartner: AffiliatePartnerData = {
      id: `aff-${Date.now().toString(36)}`,
      name,
      email,
      whatsapp: whatsapp || '-',
      code: rawCode,
      tier,
      rate,
      totalClicks: 0,
      totalOrders: 0,
      totalRevenue: 0,
      unpaidCommission: 0,
      paidCommission: 0,
      bankName: input.bankName || 'BCA',
      bankAccount: input.bankAccount || '-',
      status: 'active',
      joinedAt: formattedJoinedAt,
      createdAt: todayDate.toISOString(),
      creditedOrderIds: [],
    };

    const currentList = this.getAllAffiliates();
    currentList.unshift(newPartner);
    this.saveAffiliates(currentList);

    return {
      success: true,
      partner: newPartner,
      message: `Mitra sales ${name} (${rawCode}) berhasil didaftarkan.`,
    };
  }

  /**
   * Record an order completion and credit commission to the affiliate sales partner.
   * Fully idempotent: will NOT double-credit if orderId was previously credited.
   */
  public static recordSuccessfulOrder(
    code: string,
    orderTotal: number,
    orderId?: string
  ): { success: boolean; commission: number; partnerName?: string; message?: string } {
    const normalized = code.trim().toUpperCase();
    const list = this.getAllAffiliates();
    const partner = list.find((a) => a.code.toUpperCase() === normalized);

    if (!partner) {
      return { success: false, commission: 0, message: 'Mitra afiliasi tidak ditemukan.' };
    }

    // Idempotency verification
    if (orderId) {
      partner.creditedOrderIds = partner.creditedOrderIds || [];
      if (partner.creditedOrderIds.includes(orderId)) {
        return {
          success: false,
          commission: 0,
          partnerName: partner.name,
          message: `Komisi untuk order ${orderId} sudah pernah dikreditkan sebelumnya.`,
        };
      }
      partner.creditedOrderIds.push(orderId);
    }

    const commissionRate = partner.rate || 10;
    const earnedCommission = Math.round((orderTotal * commissionRate) / 100);

    partner.totalOrders = (partner.totalOrders || 0) + 1;
    partner.totalRevenue = (partner.totalRevenue || 0) + orderTotal;
    partner.unpaidCommission = (partner.unpaidCommission || 0) + earnedCommission;

    // Automatic Tier Promotion: If partner reaches 50 orders, promote to VIP Sales (15%)
    if (partner.totalOrders >= 50 && partner.rate < 15) {
      partner.tier = 'VIP Sales (15%)';
      partner.rate = 15;
    }

    this.saveAffiliates(list);

    return {
      success: true,
      commission: earnedCommission,
      partnerName: partner.name,
      message: `Komisi Rp ${earnedCommission.toLocaleString('id-ID')} berhasil dialokasikan ke ${partner.name}.`,
    };
  }

  /**
   * Process payout for a sales partner (moves unpaidCommission to paidCommission)
   */
  public static processPayout(partnerId: string): {
    success: boolean;
    amount: number;
    partner?: AffiliatePartnerData;
    message: string;
  } {
    const list = this.getAllAffiliates();
    const partner = list.find((a) => a.id === partnerId);

    if (!partner) {
      return { success: false, amount: 0, message: 'Mitra sales tidak ditemukan.' };
    }

    if (partner.unpaidCommission <= 0) {
      return {
        success: false,
        amount: 0,
        message: 'Tidak ada saldo komisi yang tertunda untuk dicairkan.',
      };
    }

    const payoutAmount = partner.unpaidCommission;
    partner.paidCommission = (partner.paidCommission || 0) + payoutAmount;
    partner.unpaidCommission = 0;

    this.saveAffiliates(list);

    return {
      success: true,
      amount: payoutAmount,
      partner,
      message: `Pencairan komisi Rp ${payoutAmount.toLocaleString('id-ID')} untuk ${partner.name} berhasil dicatat.`,
    };
  }
}
