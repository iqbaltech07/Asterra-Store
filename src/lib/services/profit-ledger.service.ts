import fs from 'fs';
import path from 'path';
import { ProfitBreakdown } from './referral-profit.service';

export type ProfitLedgerStatus = 'pending' | 'validated' | 'available' | 'withdrawn' | 'reversed';

export interface ProfitLedgerEntry {
  id: string;
  orderId: string;
  customerId?: string;
  customerEmail: string;
  customerName?: string;
  productId: string; // Comma-separated or primary product ID
  productNames: string;
  salesId?: string; // Partner code / ID of selling partner
  salesName?: string;
  referralCode?: string;
  recruiterSalesId?: string; // Direct recruiter of salesId (1 level only)
  recruiterSalesName?: string;
  saleCommissionRate: number; // 0.10 or 0
  recruitmentBonusRate: number; // 0.02 or 0
  sellingPrice: number;
  customerReferralDiscount: number;
  netRevenue: number;
  costOfGoods: number;
  paymentFee: number;
  otherDirectCost: number;
  directTransactionCost: number;
  transactionProfit: number;
  salesCommission: number;
  recruitmentBonus: number;
  profitDistribution: number;
  ceoShare: number;
  cooShare: number;
  businessReserve: number;
  status: ProfitLedgerStatus;
  holdingUntil: string;
  createdAt: string;
  updatedAt: string;
  releasedAt?: string;
  reversalReason?: string;
}

const LEDGER_STORAGE_PATH = path.join(process.cwd(), 'data', 'profit-ledger.json');

export class ProfitLedgerService {
  private static ensureStorage(): void {
    const dir = path.dirname(LEDGER_STORAGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(LEDGER_STORAGE_PATH)) {
      fs.writeFileSync(LEDGER_STORAGE_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  public static getAllEntries(): ProfitLedgerEntry[] {
    try {
      this.ensureStorage();
      const content = fs.readFileSync(LEDGER_STORAGE_PATH, 'utf-8');
      const list: ProfitLedgerEntry[] = JSON.parse(content);
      const changed = this.settleMatureLedgerEntries(list);
      if (changed) {
        this.saveEntries(list);
      }
      return list;
    } catch {
      return [];
    }
  }

  private static saveEntries(list: ProfitLedgerEntry[]): void {
    try {
      this.ensureStorage();
      fs.writeFileSync(LEDGER_STORAGE_PATH, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error('[ProfitLedgerService] Failed to save ledger:', err);
    }
  }

  /**
   * Automatically mature pending entries to available after 3-day holding period
   */
  public static settleMatureLedgerEntries(list: ProfitLedgerEntry[]): boolean {
    const now = Date.now();
    let modified = false;

    for (const entry of list) {
      if (entry.status === 'pending' && new Date(entry.holdingUntil).getTime() <= now) {
        entry.status = 'available';
        entry.releasedAt = new Date().toISOString();
        entry.updatedAt = new Date().toISOString();
        modified = true;
      }
    }

    return modified;
  }

  /**
   * Process and settle all matured pending ledger entries after 3-day holding period
   */
  public static processMaturedHoldings(): void {
    this.getAllEntries();
  }

  /**
   * Record or update an order in the profit sharing general ledger
   */
  public static recordOrderProfit(params: {
    orderId: string;
    customerId?: string;
    customerEmail: string;
    customerName?: string;
    productId: string;
    productNames: string;
    salesId?: string;
    salesName?: string;
    referralCode?: string;
    recruiterSalesId?: string;
    recruiterSalesName?: string;
    breakdown: ProfitBreakdown;
    holdingDays?: number;
  }): ProfitLedgerEntry {
    const list = this.getAllEntries();
    const existingIndex = list.findIndex((e) => e.orderId === params.orderId);

    const holdingDays = params.holdingDays ?? 3;
    const holdingDurationMs = holdingDays * 24 * 60 * 60 * 1000;
    const holdingUntil = new Date(Date.now() + holdingDurationMs).toISOString();

    const entry: ProfitLedgerEntry = {
      id: existingIndex >= 0 ? list[existingIndex].id : `ledg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      orderId: params.orderId,
      customerId: params.customerId,
      customerEmail: params.customerEmail,
      customerName: params.customerName,
      productId: params.productId,
      productNames: params.productNames,
      salesId: params.salesId,
      salesName: params.salesName,
      referralCode: params.referralCode,
      recruiterSalesId: params.recruiterSalesId,
      recruiterSalesName: params.recruiterSalesName,
      saleCommissionRate: params.breakdown.salesCommissionRate,
      recruitmentBonusRate: params.breakdown.recruitmentBonusRate,
      sellingPrice: params.breakdown.sellingPrice,
      customerReferralDiscount: params.breakdown.customerDiscount,
      netRevenue: params.breakdown.netRevenue,
      costOfGoods: params.breakdown.costOfGoods,
      paymentFee: params.breakdown.paymentFee,
      otherDirectCost: params.breakdown.otherDirectCost,
      directTransactionCost: params.breakdown.directTransactionCost,
      transactionProfit: params.breakdown.transactionProfit,
      salesCommission: params.breakdown.salesCommission,
      recruitmentBonus: params.breakdown.recruitmentBonus,
      profitDistribution: params.breakdown.profitDistribution,
      ceoShare: params.breakdown.ceoShare,
      cooShare: params.breakdown.cooShare,
      businessReserve: params.breakdown.businessReserve,
      status: 'pending',
      holdingUntil,
      createdAt: existingIndex >= 0 ? list[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      list[existingIndex] = entry;
    } else {
      list.unshift(entry);
    }

    this.saveEntries(list);
    return entry;
  }

  /**
   * Reverse a ledger entry on order cancellation or refund
   */
  public static reverseOrderProfit(orderId: string, reason?: string): ProfitLedgerEntry | null {
    const list = this.getAllEntries();
    const entry = list.find((e) => e.orderId === orderId);
    if (!entry) return null;

    entry.status = 'reversed';
    entry.reversalReason = reason || 'Pesanan dibatalkan / refund';
    entry.updatedAt = new Date().toISOString();

    this.saveEntries(list);
    return entry;
  }

  /**
   * Get aggregated financial metrics for CEO, COO, and Modal Usaha
   */
  public static getFinancialSummary(): {
    totalOrders: number;
    totalGrossRevenue: number;
    totalDiscounts: number;
    totalNetRevenue: number;
    totalCostOfGoods: number;
    totalPaymentFees: number;
    totalTransactionProfit: number;
    totalSalesCommission: number;
    totalRecruitmentBonus: number;
    totalProfitDistribution: number;
    totalCeoShare: number;
    totalCooShare: number;
    totalBusinessReserve: number;
    pendingCommissionTotal: number;
    availableCommissionTotal: number;
  } {
    const list = this.getAllEntries().filter((e) => e.status !== 'reversed');

    let totalGrossRevenue = 0;
    let totalDiscounts = 0;
    let totalNetRevenue = 0;
    let totalCostOfGoods = 0;
    let totalPaymentFees = 0;
    let totalTransactionProfit = 0;
    let totalSalesCommission = 0;
    let totalRecruitmentBonus = 0;
    let totalProfitDistribution = 0;
    let totalCeoShare = 0;
    let totalCooShare = 0;
    let totalBusinessReserve = 0;
    let pendingCommissionTotal = 0;
    let availableCommissionTotal = 0;

    for (const e of list) {
      totalGrossRevenue += e.sellingPrice;
      totalDiscounts += e.customerReferralDiscount;
      totalNetRevenue += e.netRevenue;
      totalCostOfGoods += e.costOfGoods;
      totalPaymentFees += e.paymentFee;
      totalTransactionProfit += e.transactionProfit;
      totalSalesCommission += e.salesCommission;
      totalRecruitmentBonus += e.recruitmentBonus;
      totalProfitDistribution += e.profitDistribution;
      totalCeoShare += e.ceoShare;
      totalCooShare += e.cooShare;
      totalBusinessReserve += e.businessReserve;

      if (e.status === 'pending') {
        pendingCommissionTotal += e.salesCommission + e.recruitmentBonus;
      } else if (e.status === 'available' || e.status === 'withdrawn') {
        availableCommissionTotal += e.salesCommission + e.recruitmentBonus;
      }
    }

    return {
      totalOrders: list.length,
      totalGrossRevenue,
      totalDiscounts,
      totalNetRevenue,
      totalCostOfGoods,
      totalPaymentFees,
      totalTransactionProfit,
      totalSalesCommission,
      totalRecruitmentBonus,
      totalProfitDistribution,
      totalCeoShare,
      totalCooShare,
      totalBusinessReserve,
      pendingCommissionTotal,
      availableCommissionTotal,
    };
  }
}
