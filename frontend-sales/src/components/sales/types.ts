import { AdminTab } from '@/components/admin/admin-sidebar';

export interface SalesConsoleProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  adminUser: { id?: string; email: string; name?: string; role?: string } | null;
}

export interface SalesProfileData {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  code: string;
  tier: string;
  rate: number;
  totalClicks: number;
  totalOrders: number;
  totalRevenue: number;
  totalSalesAmount?: number;
  totalCommission?: number;
  unpaidCommission: number;
  pendingCommission?: number;
  paidCommission: number;
  networkCommission?: number;
  tierProgress?: { currentOrders: number; targetOrders: number };
  bankName?: string;
  bankAccount?: string;
  status: 'active' | 'pending' | 'suspended' | 'inactive' | string;
  joinedAt: string;
  payoutRequests?: Array<{
    id: string;
    amount: number;
    bankName: string;
    bankAccount: string;
    bankAccountName: string;
    status: 'pending' | 'completed' | 'rejected';
    requestedAt: string;
    notes?: string;
  }>;
}

export interface ProductItem {
  id: string;
  name: string;
  category?: { id: string; name: string };
  categoryName?: string;
  price: number;
  priceFormatted: string;
  status: string;
  imageUrl?: string;
  profitMargin?: number;
  profitPercentage?: number;
}

export interface SalesOrder {
  id: string;
  createdAt: string;
  customerEmail: string;
  customerName: string;
  totalAmount: number;
  transactionProfit?: number;
  status: string;
  paymentStatus: string;
  commission: number;
  commissionRate?: number;
  isCampaignSale?: boolean;
  campaignId?: string;
  campaignName?: string;
  campaignRate?: number;
  commissionStatus?: 'pending' | 'final' | 'reversed';
  holdingUntil?: string;
  itemsCount: number;
  productNames: string;
}

export interface NetworkMember {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  code: string;
  joinedAt: string;
  totalOrders: number;
  totalRevenue: number;
  status: 'active' | 'pending' | 'suspended' | 'inactive' | string;
  bonusEarnedFromMember: number;
}

export interface NetworkBonusLogItem {
  id: string;
  orderId?: string;
  fromPartnerCode: string;
  fromPartnerName: string;
  orderTotal: number;
  netRevenue?: number;
  costOfGoods?: number;
  transactionProfit?: number;
  marginEstimate?: number;
  bonusAmount: number;
  bonusPercentage: number;
  status: 'pending' | 'final' | 'reversed';
  holdingUntil?: string;
  releasedAt?: string;
  reversalReason?: string;
  createdAt: string;
}

export interface NetworkDataResponse {
  sponsorCode: string;
  totalTeamMembers: number;
  totalTeamOrders: number;
  totalTeamRevenue: number;
  totalNetworkBonus: number;
  pendingNetworkBonus: number;
  finalNetworkBonus: number;
  reversedNetworkBonus: number;
  teamMembers: NetworkMember[];
  bonusLogs: NetworkBonusLogItem[];
  summary?: {
    totalDownlines?: number;
    totalOrdersCount?: number;
    totalOrdersAmount?: number;
    totalEarnedCommission?: number;
    totalPendingCommission?: number;
  };
  downlines?: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    referralCode: string;
    joinedAt: string;
    status: string;
    completedOrdersCount: number;
    completedOrdersAmount: number;
    earnedBonusAmount: number;
  }>;
  recentOrders?: Array<{
    orderId: string;
    invoiceNumber: string;
    sellerName: string;
    sellerCode: string;
    createdAt: string;
    orderStatus: string;
    orderTotal: number;
    bonusAmount: number;
    commissionStatus: string;
  }>;
}

export interface CampaignItem {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  startDate: string;
  endDate: string;
  discountType: string;
  discountValue: number;
  targetCategory: string;
  affiliateBonusPercent: number;
  affiliateLink: string;
  partnerCode: string;
  partnerCommissionRate: number;
  boosterCommissionRate: number;
  isBoosterActive: boolean;
  whatsappShareText: string;
}

