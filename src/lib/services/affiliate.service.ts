import fs from 'fs';
import path from 'path';
import { ReferralProfitService } from './referral-profit.service';
import { ProfitLedgerService } from './profit-ledger.service';
import { ReferralDiscountService } from './referral-discount.service';

export interface PayoutRequest {
  id: string;
  amount: number;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  status: 'pending' | 'completed' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  notes?: string;
}

export interface CommissionOrderLog {
  id: string;
  orderId: string;
  orderTotal: number;
  netRevenue?: number;
  costOfGoods?: number;
  transactionProfit?: number;
  rate: number;
  commission: number;
  status: 'pending' | 'final' | 'reversed';
  holdingUntil: string; // 3-day holding period for warranty & fraud check
  createdAt: string;
  releasedAt?: string;
  reversalReason?: string;
}

export interface NetworkBonusLog {
  id: string;
  orderId?: string;
  fromPartnerCode: string;
  fromPartnerName: string;
  orderTotal: number;
  netRevenue?: number;
  costOfGoods?: number;
  transactionProfit?: number;
  bonusAmount: number;
  bonusPercentage: number;
  marginEstimate?: number;
  status: 'pending' | 'final' | 'reversed';
  holdingUntil: string;
  createdAt: string;
  releasedAt?: string;
  reversalReason?: string;
}

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
  unpaidCommission: number; // Final & available to withdraw
  pendingCommission?: number; // In 3-day warranty holding period
  paidCommission: number;
  networkCommission?: number;
  networkBonusLogs?: NetworkBonusLog[];
  commissionLogs?: CommissionOrderLog[];
  bankName?: string;
  bankAccount?: string;
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  joinedAt: string;
  createdAt: string;
  creditedOrderIds?: string[];
  payoutRequests?: PayoutRequest[];
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

  /**
   * Automatically transition pending commissions to available/final once 3-day holding period elapses
   */
  public static settleMatureCommissions(list: AffiliatePartnerData[]): boolean {
    const now = Date.now();
    let modified = false;

    for (const partner of list) {
      // 1. Direct sales commission logs
      if (partner.commissionLogs && partner.commissionLogs.length > 0) {
        for (const log of partner.commissionLogs) {
          if (log.status === 'pending' && new Date(log.holdingUntil).getTime() <= now) {
            log.status = 'final';
            log.releasedAt = new Date().toISOString();
            partner.pendingCommission = Math.max(0, (partner.pendingCommission || 0) - log.commission);
            partner.unpaidCommission = (partner.unpaidCommission || 0) + log.commission;
            modified = true;
          }
        }
      }

      // 2. Network override bonus logs
      if (partner.networkBonusLogs && partner.networkBonusLogs.length > 0) {
        for (const log of partner.networkBonusLogs) {
          if (log.status === 'pending' && new Date(log.holdingUntil).getTime() <= now) {
            log.status = 'final';
            log.releasedAt = new Date().toISOString();
            partner.pendingCommission = Math.max(0, (partner.pendingCommission || 0) - log.bonusAmount);
            partner.unpaidCommission = (partner.unpaidCommission || 0) + log.bonusAmount;
            modified = true;
          }
        }
      }

      // 3. Automatic tier evaluation based on successful transactions (Milestone: ≥50 orders = 15% VIP Sales)
      if ((partner.totalOrders || 0) >= 50 && partner.tier !== 'Executive (20%)') {
        if (partner.tier !== 'VIP Sales (15%)' || partner.rate !== 15) {
          partner.tier = 'VIP Sales (15%)';
          partner.rate = 15;
          modified = true;
        }
      } else if ((partner.totalOrders || 0) < 50 && partner.tier === 'VIP Sales (15%)' && partner.rate === 15) {
        partner.tier = 'Standard (10%)';
        partner.rate = 10;
        modified = true;
      }
    }

    return modified;
  }

  public static getAllAffiliates(): AffiliatePartnerData[] {
    try {
      this.ensureStorage();
      const content = fs.readFileSync(AFFILIATES_STORAGE_PATH, 'utf-8');
      const list: AffiliatePartnerData[] = JSON.parse(content);
      const changed = this.settleMatureCommissions(list);
      if (changed) {
        this.saveAffiliates(list);
      }
      return list;
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

    // Validate sponsor referral code if provided + Self-referral & Circular referral prevention
    let verifiedSponsorCode: string | undefined = undefined;
    if (input.referralCode && input.referralCode.trim()) {
      const sponsor = this.findByCode(input.referralCode);
      if (sponsor) {
        // 1. Direct self-referral checks
        if (sponsor.email.toLowerCase() === email) {
          return {
            success: false,
            message: 'Pelanggaran keamanan: Anda tidak dapat menggunakan kode referral Anda sendiri (Self-referral dilarang).',
          };
        }
        if (sponsor.whatsapp.replace(/\D/g, '') === whatsapp.replace(/\D/g, '')) {
          return {
            success: false,
            message: 'Pelanggaran keamanan: Nomor WhatsApp pengajak sama dengan nomor pendaftar. Self-referral dilarang.',
          };
        }

        // 2. Circular Referral Prevention (A cannot be invited by B if B was already invited by A)
        const existingSelf = this.findByEmailOrPhone(email, whatsapp);
        if (existingSelf && sponsor.referredByCode && sponsor.referredByCode.toUpperCase() === existingSelf.code.toUpperCase()) {
          return {
            success: false,
            message: 'Pelanggaran keamanan: Terdeteksi circular referral (rujukan melingkar antara mitra). Hubungan referral ditolak.',
          };
        }

        // 3. Status check: sponsor must be active
        if (sponsor.status === 'suspended') {
          return {
            success: false,
            message: 'Kode referral tidak dapat digunakan karena akun pengajak sedang ditangguhkan.',
          };
        }

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
      pendingCommission: 0,
      paidCommission: 0,
      networkCommission: 0,
      networkBonusLogs: [],
      commissionLogs: [],
      status: 'active',
      joinedAt: formattedJoinedAt,
      createdAt: todayDate.toISOString(),
      creditedOrderIds: [],
      payoutRequests: [],
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
   * Fully idempotent, margin-aware, with self-purchase protection and 3-day holding period.
   */
  public static recordSuccessfulOrder(
    code: string,
    orderTotal: number,
    orderId?: string,
    customerDetails?: {
      customerEmail?: string;
      customerPhone?: string;
      customerName?: string;
    },
    profitParams?: {
      costOfGoods?: number;
      paymentFee?: number;
      otherDirectCost?: number;
      customerDiscount?: number;
      transactionProfit?: number;
    }
  ): {
    success: boolean;
    commission: number;
    recruitmentBonus?: number;
    partnerName?: string;
    sponsorName?: string;
    message?: string;
  } {
    const normalized = code.trim().toUpperCase();
    const list = this.getAllAffiliates();
    const partner = list.find((a) => a.code.toUpperCase() === normalized);

    if (!partner) {
      return { success: false, commission: 0, message: 'Mitra afiliasi tidak ditemukan.' };
    }

    // 1. Lifecycle status check: only active partners can earn commissions
    if (partner.status !== 'active') {
      return {
        success: false,
        commission: 0,
        partnerName: partner.name,
        message: `Mitra sales "${partner.name}" berstatus "${partner.status}". Komisi hanya diberikan kepada akun yang berstatus aktif.`,
      };
    }

    // 2. Anti Self-Purchase Protection: Selling partner cannot buy via their own link
    if (customerDetails?.customerEmail) {
      const custEmail = customerDetails.customerEmail.trim().toLowerCase();
      if (partner.email.toLowerCase() === custEmail) {
        return {
          success: false,
          commission: 0,
          partnerName: partner.name,
          message: `[Self-Purchase Terdeteksi] Mitra sales "${partner.name}" dilarang memperoleh komisi dari pembelian akun sendiri.`,
        };
      }
    }

    if (customerDetails?.customerPhone) {
      const cleanCustPhone = customerDetails.customerPhone.replace(/\D/g, '');
      const cleanPartnerPhone = partner.whatsapp.replace(/\D/g, '');
      if (cleanCustPhone.length >= 8 && cleanPartnerPhone.length >= 8 && cleanCustPhone === cleanPartnerPhone) {
        return {
          success: false,
          commission: 0,
          partnerName: partner.name,
          message: `[Self-Purchase Terdeteksi] Nomor kontak pembeli identik dengan nomor WhatsApp mitra sales "${partner.name}".`,
        };
      }
    }

    // 3. Idempotency verification: prevent double-crediting the same order
    if (orderId) {
      partner.creditedOrderIds = partner.creditedOrderIds || [];
      if (partner.creditedOrderIds.includes(orderId)) {
        return {
          success: false,
          commission: 0,
          partnerName: partner.name,
          message: `Komisi untuk order ${orderId} sudah pernah dialokasikan sebelumnya.`,
        };
      }
      partner.creditedOrderIds.push(orderId);
    }

    // 4. Calculate Transaction Profit per SSOT §17
    // NEVER calculate commission from omzet!
    const customerDiscount = Math.max(0, profitParams?.customerDiscount ?? 0);
    const netRevenue = Math.max(0, orderTotal - customerDiscount);
    const costOfGoods = Math.max(0, profitParams?.costOfGoods ?? 0);
    const paymentFee = Math.max(0, profitParams?.paymentFee ?? 0);
    const otherDirectCost = Math.max(0, profitParams?.otherDirectCost ?? 0);

    let transactionProfit = profitParams?.transactionProfit;
    if (transactionProfit === undefined) {
      const directTransactionCost = costOfGoods + paymentFee + otherDirectCost;
      transactionProfit = Math.max(0, netRevenue - directTransactionCost);
    }

    partner.totalOrders = (partner.totalOrders || 0) + 1;
    partner.totalRevenue = (partner.totalRevenue || 0) + netRevenue;

    // Automatic Tier & Commission Rate Upgrade:
    // When partner reaches 50 transactions, promote to VIP Sales (15% of Transaction Profit)
    if (partner.totalOrders >= 50 && partner.tier !== 'Executive (20%)') {
      partner.tier = 'VIP Sales (15%)';
      partner.rate = 15;
    } else if (!partner.rate || (partner.rate === 15 && partner.totalOrders < 50)) {
      partner.tier = 'Standard (10%)';
      partner.rate = 10;
    }

    // Direct Sales Commission: based on active partner rate (10% standard, 15% for VIP Sales with ≥50 orders)
    // Always calculated from Transaction Profit, strictly 0 if profit <= 0 (SSOT §4, §13, §17)
    const commissionRate = partner.rate || 10;
    const earnedCommission = transactionProfit > 0 ? Math.round(transactionProfit * (commissionRate / 100)) : 0;

    // 5. Holding Period: 3 days (Masa Garansi Pembeli & Anti-Fraud)
    const holdingDays = 3;
    const holdingDurationMs = holdingDays * 24 * 60 * 60 * 1000;
    const holdingUntil = new Date(Date.now() + holdingDurationMs).toISOString();

    // Allocated to pendingCommission during warranty holding period
    partner.pendingCommission = (partner.pendingCommission || 0) + earnedCommission;
    partner.commissionLogs = partner.commissionLogs || [];
    partner.commissionLogs.unshift({
      id: `com-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      orderId: orderId || `ORD-${Date.now()}`,
      orderTotal: netRevenue,
      netRevenue,
      costOfGoods,
      transactionProfit,
      rate: commissionRate,
      commission: earnedCommission,
      status: 'pending',
      holdingUntil,
      createdAt: new Date().toISOString(),
    });

    // 6. Recruitment Bonus (1 Level Direct Recruiter only, SSOT §6 & §7 & §17)
    // 2% of Transaction Profit. Upline above recruiter gets 0.
    let sponsorBonusInfo = '';
    let sponsorName = '';
    let recruitmentBonusAmount = 0;

    if (partner.referredByCode) {
      const sponsor = list.find((a) => a.code.toUpperCase() === partner.referredByCode!.toUpperCase());
      // Prevent self-referral and ensure sponsor is active
      if (
        sponsor &&
        sponsor.id !== partner.id &&
        sponsor.email.toLowerCase() !== partner.email.toLowerCase() &&
        sponsor.status === 'active'
      ) {
        sponsorName = sponsor.name;
        recruitmentBonusAmount = transactionProfit > 0 ? Math.round(transactionProfit * 0.02) : 0;

        if (recruitmentBonusAmount > 0) {
          sponsor.pendingCommission = (sponsor.pendingCommission || 0) + recruitmentBonusAmount;
          sponsor.networkCommission = (sponsor.networkCommission || 0) + recruitmentBonusAmount;
          sponsor.networkBonusLogs = sponsor.networkBonusLogs || [];

          sponsor.networkBonusLogs.unshift({
            id: `net-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
            orderId,
            fromPartnerCode: partner.code,
            fromPartnerName: partner.name,
            orderTotal: netRevenue,
            netRevenue,
            costOfGoods,
            transactionProfit,
            bonusAmount: recruitmentBonusAmount,
            bonusPercentage: 2,
            status: 'pending',
            holdingUntil,
            createdAt: new Date().toISOString(),
          });

          sponsorBonusInfo = ` & Bonus tim Rp ${recruitmentBonusAmount.toLocaleString('id-ID')} (2% profit) dialokasikan ke ${sponsor.name} (Holding 3 Hari)`;
        }
      }
    }

    this.saveAffiliates(list);

    return {
      success: true,
      commission: earnedCommission,
      recruitmentBonus: recruitmentBonusAmount,
      partnerName: partner.name,
      sponsorName: sponsorName || undefined,
      message: `Komisi Rp ${earnedCommission.toLocaleString('id-ID')} (10% profit) berhasil dialokasikan ke ${partner.name} (Holding Garansi 3 Hari)${sponsorBonusInfo}.`,
    };
  }

  /**
   * Handle order refund / cancellation / chargeback per SSOT §10:
   * Reverses credited direct commission and sponsor recruitment bonus from pending/unpaid balances.
   * Supports balance clawback if commissions had already matured.
   */
  public static handleOrderRefund(
    orderId: string,
    reason?: string
  ): {
    success: boolean;
    partnerReversed?: string;
    directCommissionReversed: number;
    sponsorReversed?: string;
    networkBonusReversed: number;
    message: string;
  } {
    const list = this.getAllAffiliates();
    let directReversed = 0;
    let networkReversed = 0;
    let partnerName = '';
    let sponsorName = '';

    // 1. Reversal of direct sales commission
    for (const partner of list) {
      if (partner.creditedOrderIds && partner.creditedOrderIds.includes(orderId)) {
        partnerName = partner.name;
        const log = partner.commissionLogs?.find((l) => l.orderId === orderId && l.status !== 'reversed');
        const commAmount = log ? log.commission : 0;

        if (log) {
          log.status = 'reversed';
          log.reversalReason = reason || 'Pesanan dibatalkan / refund garansi';
        }

        if (commAmount > 0) {
          directReversed = commAmount;
          // Deduct from pendingCommission if not yet matured, else clawback from unpaidCommission
          if ((partner.pendingCommission || 0) >= commAmount) {
            partner.pendingCommission = (partner.pendingCommission || 0) - commAmount;
          } else {
            const remainder = commAmount - (partner.pendingCommission || 0);
            partner.pendingCommission = 0;
            partner.unpaidCommission = (partner.unpaidCommission || 0) - remainder; // Allow negative balance / clawback debt!
          }
        }

        partner.totalOrders = Math.max(0, (partner.totalOrders || 0) - 1);
        partner.creditedOrderIds = partner.creditedOrderIds.filter((id) => id !== orderId);
        break;
      }
    }

    // 2. Reversal of sponsor recruitment bonus
    for (const sponsor of list) {
      if (sponsor.networkBonusLogs && sponsor.networkBonusLogs.length > 0) {
        const bonusLog = sponsor.networkBonusLogs.find((l) => l.orderId === orderId && l.status !== 'reversed');
        if (bonusLog) {
          sponsorName = sponsor.name;
          networkReversed = bonusLog.bonusAmount;
          bonusLog.status = 'reversed';
          bonusLog.reversalReason = reason || 'Pesanan tim dibatalkan / refund';

          if ((sponsor.pendingCommission || 0) >= networkReversed) {
            sponsor.pendingCommission = (sponsor.pendingCommission || 0) - networkReversed;
          } else {
            const rem = networkReversed - (sponsor.pendingCommission || 0);
            sponsor.pendingCommission = 0;
            sponsor.unpaidCommission = (sponsor.unpaidCommission || 0) - rem; // Allow negative balance / clawback debt!
          }
          sponsor.networkCommission = Math.max(0, (sponsor.networkCommission || 0) - networkReversed);
          break;
        }
      }
    }

    // 3. Synchronize with Profit Ledger & Customer Referral Discount Reversion
    try {
      ProfitLedgerService.reverseOrderProfit(orderId, reason);
      ReferralDiscountService.revertUsage(orderId);
    } catch (syncErr) {
      console.warn('[AffiliateService] Reversal sync warning:', syncErr);
    }

    if (directReversed > 0 || networkReversed > 0) {
      this.saveAffiliates(list);
      return {
        success: true,
        partnerReversed: partnerName,
        directCommissionReversed: directReversed,
        sponsorReversed: sponsorName,
        networkBonusReversed: networkReversed,
        message: `Pembatalan komisi sukses untuk pesanan ${orderId}: Komisi penjualan Rp ${directReversed.toLocaleString('id-ID')} (${partnerName}) dan bonus tim Rp ${networkReversed.toLocaleString('id-ID')} (${sponsorName}) berhasil ditarik kembali.`,
      };
    }

    return {
      success: false,
      directCommissionReversed: 0,
      networkBonusReversed: 0,
      message: `Tidak ada alokasi komisi aktif yang terhubung dengan pesanan ${orderId}.`,
    };
  }

  /**
   * Get team downline data and passive bonus metrics for a sponsor sales partner
   */
  public static getTeamDataForPartner(partnerCode: string): {
    sponsorCode: string;
    totalTeamMembers: number;
    totalTeamOrders: number;
    totalTeamRevenue: number;
    totalNetworkBonus: number;
    pendingNetworkBonus: number;
    finalNetworkBonus: number;
    reversedNetworkBonus: number;
    teamMembers: Array<{
      id: string;
      name: string;
      email: string;
      whatsapp: string;
      code: string;
      joinedAt: string;
      totalOrders: number;
      totalRevenue: number;
      status: string;
      bonusEarnedFromMember: number;
    }>;
    bonusLogs: NetworkBonusLog[];
  } {
    const normalizedCode = partnerCode.trim().toUpperCase();
    const list = this.getAllAffiliates();
    const sponsor = list.find((a) => a.code.toUpperCase() === normalizedCode);

    // Find all partners who registered with this sponsor's referral code (strictly 1-level)
    const downlines = list.filter(
      (a) => a.referredByCode && a.referredByCode.toUpperCase() === normalizedCode && a.code.toUpperCase() !== normalizedCode
    );

    const bonusLogs = sponsor?.networkBonusLogs || [];

    const teamMembers = downlines.map((member) => {
      // Calculate total active bonus earned from this specific member
      const bonusFromMember = bonusLogs
        .filter((log) => log.fromPartnerCode.toUpperCase() === member.code.toUpperCase() && log.status !== 'reversed')
        .reduce((sum, log) => sum + (log.bonusAmount || 0), 0);

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        whatsapp: member.whatsapp,
        code: member.code,
        joinedAt: member.joinedAt,
        totalOrders: member.totalOrders || 0,
        totalRevenue: member.totalRevenue || 0,
        status: member.status || 'active',
        bonusEarnedFromMember: bonusFromMember,
      };
    });

    const totalTeamMembers = teamMembers.length;
    const totalTeamOrders = teamMembers.reduce((sum, m) => sum + m.totalOrders, 0);
    const totalTeamRevenue = teamMembers.reduce((sum, m) => sum + m.totalRevenue, 0);

    const pendingNetworkBonus = bonusLogs
      .filter((l) => l.status === 'pending')
      .reduce((sum, l) => sum + (l.bonusAmount || 0), 0);

    const finalNetworkBonus = bonusLogs
      .filter((l) => l.status === 'final')
      .reduce((sum, l) => sum + (l.bonusAmount || 0), 0);

    const reversedNetworkBonus = bonusLogs
      .filter((l) => l.status === 'reversed')
      .reduce((sum, l) => sum + (l.bonusAmount || 0), 0);

    const totalNetworkBonus = pendingNetworkBonus + finalNetworkBonus;

    return {
      sponsorCode: normalizedCode,
      totalTeamMembers,
      totalTeamOrders,
      totalTeamRevenue,
      totalNetworkBonus,
      pendingNetworkBonus,
      finalNetworkBonus,
      reversedNetworkBonus,
      teamMembers,
      bonusLogs,
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

  /**
   * Find affiliate partner by email, or auto-provision if admin user exists
   */
  public static findOrCreateByEmail(
    email: string,
    fallbackName?: string
  ): AffiliatePartnerData {
    const normEmail = email.trim().toLowerCase();
    const list = this.getAllAffiliates();
    let partner = list.find((a) => a.email.toLowerCase() === normEmail);

    if (!partner) {
      const cleanName = (fallbackName || email.split('@')[0]).trim();
      const codeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const cleanPrefix = cleanName.split(' ')[0].replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'SALES';
      const code = `AST-${cleanPrefix}-${codeSuffix}`;

      const todayDate = new Date();
      partner = {
        id: `aff-${Date.now().toString(36)}`,
        name: cleanName,
        email: normEmail,
        whatsapp: '-',
        code,
        tier: 'Standard (10%)',
        rate: 10,
        totalClicks: 0,
        totalOrders: 0,
        totalRevenue: 0,
        unpaidCommission: 0,
        paidCommission: 0,
        status: 'active',
        joinedAt: todayDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        createdAt: todayDate.toISOString(),
        creditedOrderIds: [],
        payoutRequests: [],
      };

      list.unshift(partner);
      this.saveAffiliates(list);
    }

    return partner;
  }

  /**
   * Submit a new withdrawal request for a sales partner
   */
  public static submitPayoutRequest(
    partnerId: string,
    input: {
      amount: number;
      bankName: string;
      bankAccount: string;
      bankAccountName: string;
      notes?: string;
    }
  ): { success: boolean; request?: PayoutRequest; message: string } {
    const list = this.getAllAffiliates();
    const partner = list.find((a) => a.id === partnerId);

    if (!partner) {
      return { success: false, message: 'Mitra sales tidak ditemukan.' };
    }

    // Lifecycle status check
    if (partner.status !== 'active') {
      return {
        success: false,
        message: `Akun mitra sales Anda berstatus "${partner.status}". Penarikan komisi hanya dapat diajukan oleh akun yang berstatus aktif. Hubungi CS untuk bantuan.`,
      };
    }

    const amount = Math.round(Number(input.amount));
    if (isNaN(amount) || amount < 50000) {
      return { success: false, message: 'Nominal pencairan minimal Rp 50.000.' };
    }

    if (amount > (partner.unpaidCommission || 0)) {
      const holdingInfo = partner.pendingCommission && partner.pendingCommission > 0
        ? ` (Terdapat Rp ${partner.pendingCommission.toLocaleString('id-ID')} yang masih dalam masa garansi holding 3 hari).`
        : '';
      return {
        success: false,
        message: `Saldo komisi siap tarik Anda saat ini (Rp ${(partner.unpaidCommission || 0).toLocaleString('id-ID')}) tidak mencukupi untuk penarikan Rp ${amount.toLocaleString('id-ID')}${holdingInfo}`,
      };
    }

    if (!input.bankName || !input.bankAccount || !input.bankAccountName) {
      return { success: false, message: 'Nama bank, nomor rekening, dan nama pemilik rekening wajib diisi.' };
    }

    // Deduct available unpaidCommission
    partner.unpaidCommission -= amount;
    partner.paidCommission = (partner.paidCommission || 0) + amount;

    partner.payoutRequests = partner.payoutRequests || [];
    const newRequest: PayoutRequest = {
      id: `pay-${Date.now().toString(36)}`,
      amount,
      bankName: input.bankName.trim(),
      bankAccount: input.bankAccount.trim(),
      bankAccountName: input.bankAccountName.trim(),
      status: 'pending',
      requestedAt: new Date().toISOString(),
      notes: input.notes?.trim(),
    };

    partner.payoutRequests.unshift(newRequest);
    this.saveAffiliates(list);

    return {
      success: true,
      request: newRequest,
      message: `Permintaan penarikan komisi Rp ${amount.toLocaleString('id-ID')} berhasil diajukan dan sedang diproses tim keuangan.`,
    };
  }
}
