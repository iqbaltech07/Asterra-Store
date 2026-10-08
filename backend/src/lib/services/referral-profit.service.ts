/**
 * Asterra Store — Referral & Profit Sharing Calculation Engine
 * 
 * SINGLE SOURCE OF TRUTH: asterra-referral-profit-model.md
 * 
 * Rules:
 * 1. net_revenue = selling_price - customer_discount
 * 2. transaction_profit = Math.max(0, net_revenue - direct_transaction_cost)
 * 3. sales_commission = 10% of transaction_profit (if valid direct referral, else 0)
 * 4. recruitment_bonus = 2% of transaction_profit (if sales has valid direct recruiter, 1 level only, else 0)
 * 5. profit_distribution = transaction_profit - sales_commission - recruitment_bonus
 * 6. ceo_share = 40% of profit_distribution
 * 7. coo_share = 40% of profit_distribution
 * 8. business_reserve = 20% of profit_distribution (Modal Usaha)
 * 9. CEO share === COO share ALWAYS.
 * 10. Commissions NEVER computed from omzet/selling price.
 * 11. If transaction_profit <= 0, all commissions and distributions are 0.
 */

export interface ProfitCalculationInput {
  sellingPrice: number;
  customerDiscount?: number;
  costOfGoods: number; // Provider / supplier price total
  paymentFee?: number; // Tripay / PG transaction fee
  otherDirectCost?: number; // Delivery / fulfillment direct costs
  hasDirectReferral: boolean;
  hasDirectRecruiter: boolean;
  salesCommissionRate?: number; // Default 0.10 (10%)
  recruitmentBonusRate?: number; // Default 0.02 (2%)
}

export interface ProfitBreakdown {
  sellingPrice: number;
  customerDiscount: number;
  netRevenue: number;
  costOfGoods: number;
  paymentFee: number;
  otherDirectCost: number;
  directTransactionCost: number;
  transactionProfit: number;
  salesCommissionRate: number;
  salesCommission: number;
  recruitmentBonusRate: number;
  recruitmentBonus: number;
  totalCommissions: number;
  profitDistribution: number;
  ceoShare: number;
  cooShare: number;
  businessReserve: number;
}

export const DEFAULT_REFERRAL_RATES = {
  SALES_COMMISSION_RATE: 0.10, // 10% of transaction profit
  RECRUITMENT_BONUS_RATE: 0.02, // 2% of transaction profit
  CEO_SHARE_RATE: 0.40, // 40% of profit distribution
  COO_SHARE_RATE: 0.40, // 40% of profit distribution
  BUSINESS_RESERVE_RATE: 0.20, // 20% of profit distribution
  DEFAULT_CUSTOMER_DISCOUNT: 1000, // Rp 1.000 1-time discount for new customer
  DEFAULT_GATEWAY_FEE_PERCENT: 0.007, // 0.7% Tripay QRIS
};

export class ReferralProfitService {
  /**
   * Pure calculation function implementing SSOT §17
   */
  public static calculate(input: ProfitCalculationInput): ProfitBreakdown {
    const sellingPrice = Math.max(0, Math.round(input.sellingPrice));
    const rawDiscount = Math.max(0, Math.round(input.customerDiscount || 0));
    
    // Customer discount cannot exceed selling price
    const customerDiscount = Math.min(sellingPrice, rawDiscount);
    const netRevenue = Math.max(0, sellingPrice - customerDiscount);

    const costOfGoods = Math.max(0, Math.round(input.costOfGoods));
    const paymentFee = Math.max(0, Math.round(input.paymentFee || 0));
    const otherDirectCost = Math.max(0, Math.round(input.otherDirectCost || 0));

    const directTransactionCost = costOfGoods + paymentFee + otherDirectCost;

    // Transaction Profit: Net Revenue - Total Direct Cost
    // Must be clamped to >= 0 so company never pays commissions from loss
    const rawProfit = netRevenue - directTransactionCost;
    const transactionProfit = Math.max(0, rawProfit);

    // If profit is 0 or negative, commissions are strictly 0
    let salesCommission = 0;
    let recruitmentBonus = 0;

    const salesCommissionRate = input.salesCommissionRate ?? DEFAULT_REFERRAL_RATES.SALES_COMMISSION_RATE;
    const recruitmentBonusRate = input.recruitmentBonusRate ?? DEFAULT_REFERRAL_RATES.RECRUITMENT_BONUS_RATE;

    if (transactionProfit > 0) {
      if (input.hasDirectReferral) {
        salesCommission = Math.round(transactionProfit * salesCommissionRate);
      }
      if (input.hasDirectRecruiter) {
        recruitmentBonus = Math.round(transactionProfit * recruitmentBonusRate);
      }
    }

    // Safety guard: Total commissions cannot exceed transaction profit
    if (salesCommission + recruitmentBonus > transactionProfit) {
      salesCommission = Math.round(transactionProfit * salesCommissionRate);
      recruitmentBonus = Math.max(0, transactionProfit - salesCommission);
    }

    const totalCommissions = salesCommission + recruitmentBonus;
    const profitDistribution = Math.max(0, transactionProfit - totalCommissions);

    // Distribution: 40% CEO, 40% COO, 20% Modal Usaha
    // CEO and COO must be strictly equal
    const ceoShare = Math.floor(profitDistribution * DEFAULT_REFERRAL_RATES.CEO_SHARE_RATE);
    const cooShare = ceoShare; // Strict equality: CEO === COO
    const businessReserve = profitDistribution - (ceoShare + cooShare);

    return {
      sellingPrice,
      customerDiscount,
      netRevenue,
      costOfGoods,
      paymentFee,
      otherDirectCost,
      directTransactionCost,
      transactionProfit,
      salesCommissionRate: input.hasDirectReferral ? salesCommissionRate : 0,
      salesCommission,
      recruitmentBonusRate: input.hasDirectRecruiter ? recruitmentBonusRate : 0,
      recruitmentBonus,
      totalCommissions,
      profitDistribution,
      ceoShare,
      cooShare,
      businessReserve,
    };
  }

  /**
   * Helper to estimate payment gateway fee
   */
  public static estimatePaymentFee(amount: number, paymentMode: 'gateway' | 'manual' | string): number {
    if (paymentMode === 'manual') return 0;
    return Math.round(amount * DEFAULT_REFERRAL_RATES.DEFAULT_GATEWAY_FEE_PERCENT);
  }
}
