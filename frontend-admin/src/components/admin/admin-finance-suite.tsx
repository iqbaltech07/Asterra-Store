'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Coins,
  Receipt,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PieChart,
  FileSpreadsheet,
  Building2,
  DollarSign,
  Percent,
  RefreshCw,
  ShieldCheck,
  Users,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AdminTab } from './admin-sidebar';

interface ProfitDistributionSummary {
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
}

interface ProfitLedgerEntry {
  id: string;
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
  saleCommissionRate: number;
  recruitmentBonusRate: number;
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
  status: 'pending' | 'validated' | 'available' | 'withdrawn' | 'reversed';
  holdingUntil: string;
  createdAt: string;
  updatedAt: string;
  releasedAt?: string;
  reversalReason?: string;
}

interface WalletData {
  tripayBalance: number;
  vipBalance: number;
  reserveBalance: number;
}

interface PaymentChannel {
  name: string;
  amount: number;
  percentage: number;
}

interface RevenueData {
  todayRevenue: number;
  monthRevenue: number;
  aov: number;
  completedOrders: number;
  paymentChannels: PaymentChannel[];
}

interface ExpenseItem {
  id: string;
  category: string;
  desc: string;
  amount: number;
  date: string;
  ref: string;
}

interface JournalEntry {
  id: string;
  type: 'Credit' | 'Debit';
  desc: string;
  amount: number;
  balance: number;
  date: string;
}

interface FinanceSummary {
  wallets: WalletData;
  revenue: RevenueData;
  expenses: ExpenseItem[];
  totalExpense: number;
  financialTransactions: JournalEntry[];
}

interface AdminFinanceSuiteProps {
  activeTab: 'wallets' | 'revenue' | 'expenses' | 'profit' | 'financial-transactions';
  metrics?: {
    vipBalance?: number | null;
  };
  onNotify?: (msg: string) => void;
}

export function AdminFinanceSuite({ activeTab, metrics, onNotify }: AdminFinanceSuiteProps) {
  const vipBalance = metrics?.vipBalance ?? 0;

  // Finance Summary SSOT state
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [isLoadingFinance, setIsLoadingFinance] = useState<boolean>(false);

  // Profit Distribution & Ledger SSOT state
  const [profitSummary, setProfitSummary] = useState<ProfitDistributionSummary | null>(null);
  const [profitEntries, setProfitEntries] = useState<ProfitLedgerEntry[]>([]);
  const [isLoadingProfit, setIsLoadingProfit] = useState<boolean>(false);
  const [profitSearch, setProfitSearch] = useState<string>('');
  const [profitStatusFilter, setProfitStatusFilter] = useState<string>('all');

  const fetchFinanceSummary = useCallback(async () => {
    try {
      setIsLoadingFinance(true);
      const res = await fetch('/api/v1/admin/finance/summary');
      const json = await res.json();
      if (json.success && json.data) {
        setFinanceSummary(json.data);
      }
    } catch (err) {
      console.error('Failed to load finance summary:', err);
    } finally {
      setIsLoadingFinance(false);
    }
  }, []);

  const fetchProfitData = useCallback(async () => {
    try {
      setIsLoadingProfit(true);
      const res = await fetch('/api/v1/admin/profit-distribution');
      const json = await res.json();
      if (json.success && json.data) {
        setProfitSummary(json.data.summary);
        setProfitEntries(json.data.entries || []);
      }
    } catch (err) {
      console.error('Failed to load profit distribution data:', err);
    } finally {
      setIsLoadingProfit(false);
    }
  }, []);

  useEffect(() => {
    fetchFinanceSummary();
    if (activeTab === 'profit') {
      fetchProfitData();
    }
  }, [activeTab, fetchFinanceSummary, fetchProfitData]);

  const filteredProfitEntries = useMemo(() => {
    return profitEntries.filter((entry) => {
      const matchesStatus =
        profitStatusFilter === 'all' ? true : entry.status === profitStatusFilter;
      const q = profitSearch.toLowerCase();
      const matchesSearch =
        !q ||
        entry.orderId.toLowerCase().includes(q) ||
        entry.customerEmail.toLowerCase().includes(q) ||
        (entry.customerName && entry.customerName.toLowerCase().includes(q)) ||
        entry.productNames.toLowerCase().includes(q) ||
        (entry.referralCode && entry.referralCode.toLowerCase().includes(q)) ||
        (entry.salesName && entry.salesName.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [profitEntries, profitStatusFilter, profitSearch]);

  // -------------------------------------------------------------
  // 1. WALLETS (Multi-Wallet Treasury)
  // -------------------------------------------------------------
  if (activeTab === 'wallets') {
    return (
      <div className="space-y-6">
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
                Treasury & Wallet Hub
              </span>
              <span className="text-[11px] text-foreground-muted">Monitoring Likuiditas Kas Toko</span>
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Saldo & Dompet Pembayaran</h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Kelola saldo penampung payment gateway Tripay, saldo deposit operasional VIP Reseller, dan kas internal toko.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => onNotify?.('Instruksi top up saldo deposit VIP Reseller telah dibuka.')}
            className="text-xs gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Top-Up Saldo Supplier</span>
          </Button>
        </div>

        {/* Wallets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tripay Settlement Wallet */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs text-foreground-muted">
              <span>Tripay Settlement Balance</span>
              <Badge variant="outline" className="text-status-success border-status-success/30 text-[10px]">
                Available
              </Badge>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              Rp {(financeSummary?.wallets?.tripayBalance ?? 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-foreground-muted">Dana siap ditarik ke rekening bank operasional</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNotify?.(`Pengajuan pencairan Tripay sebesar Rp ${(financeSummary?.wallets?.tripayBalance ?? 0).toLocaleString('id-ID')} sedang diproses.`)}
              className="w-full text-xs border-border"
            >
              Withdraw ke Rekening Bank
            </Button>
          </div>

          {/* VIP Reseller Deposit Wallet */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs text-foreground-muted">
              <span>VIP Reseller Deposit</span>
              <Badge variant="outline" className="text-primary border-primary/30 text-[10px]">
                Upstream
              </Badge>
            </div>
            <div className="text-2xl font-bold text-primary font-mono">
              Rp {(financeSummary?.wallets?.vipBalance ?? vipBalance ?? 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-foreground-muted">Dipakai otomatis untuk eksekusi order instan supplier</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNotify?.('Silakan transfer ke Virtual Account BCA VIP Reseller untuk top up.')}
              className="w-full text-xs border-primary/30 text-primary hover:bg-primary/10"
            >
              Top Up Saldo Supplier
            </Button>
          </div>

          {/* Reserved / Internal Store Wallet */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs text-foreground-muted">
              <span>Dana Cadangan Garansi</span>
              <Badge variant="outline" className="text-foreground-muted border-border text-[10px]">
                Escrow
              </Badge>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              Rp {(financeSummary?.wallets?.reserveBalance ?? 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-foreground-muted">Alokasi jaminan penggantian akun jika kendala</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onNotify?.('Alokasi dana cadangan diperbarui.')}
              className="w-full text-xs text-foreground-muted hover:text-foreground"
            >
              Atur Alokasi Cadangan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. REVENUE (Revenue Intelligence)
  // -------------------------------------------------------------
  if (activeTab === 'revenue') {
    return (
      <div className="space-y-6">
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Analisis Pendapatan (Revenue Intelligence)</h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Rincian omzet bruto transaksi, kontribusi metode pembayaran, dan performa jalur akuisisi.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNotify?.('Laporan pendapatan berhasil diekspor ke Excel.')}
            className="text-xs gap-1.5 border-border"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Laporan Pendapatan</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
            <span className="text-xs text-foreground-muted block mb-1">Omzet Hari Ini</span>
            <div className="text-xl font-bold text-foreground">
              Rp {(financeSummary?.revenue?.todayRevenue ?? 0).toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-status-success font-semibold">↑ Real-Time Gateway</span>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
            <span className="text-xs text-foreground-muted block mb-1">Omzet Bulan Ini</span>
            <div className="text-xl font-bold text-status-success">
              Rp {(financeSummary?.revenue?.monthRevenue ?? 0).toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-status-success font-semibold">Transaksi Terverifikasi</span>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
            <span className="text-xs text-foreground-muted block mb-1">Average Order Value (AOV)</span>
            <div className="text-xl font-bold text-foreground">
              Rp {(financeSummary?.revenue?.aov ?? 0).toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-foreground-muted">Rata-rata belanja per order</span>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
            <span className="text-xs text-foreground-muted block mb-1">Total Transaksi Lunas</span>
            <div className="text-xl font-bold text-primary">
              {(financeSummary?.revenue?.completedOrders ?? 0)} Order
            </div>
            <span className="text-[10px] text-foreground-muted">Bulan berjalan</span>
          </div>
        </div>

        {/* Breakdown by Payment Channel */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-foreground">Distribusi Pendapatan per Kanal Pembayaran</h3>
          <div className="space-y-2.5 text-xs">
            {financeSummary?.revenue?.paymentChannels && financeSummary.revenue.paymentChannels.length > 0 ? (
              financeSummary.revenue.paymentChannels.map((ch, idx) => (
                <div key={idx} className="p-3 bg-surface-raised rounded-lg border border-border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{ch.name}</span>
                    <span className="font-bold text-primary">
                      Rp {(ch.amount ?? 0).toLocaleString('id-ID')} ({ch.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-status-success' : 'bg-foreground-muted'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, ch.percentage))}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-foreground-muted">Belum ada data kanal pembayaran</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. EXPENSES (Cost Center & Expense Tracker)
  // -------------------------------------------------------------
  if (activeTab === 'expenses') {
    const expenses = financeSummary?.expenses || [];
    const totalExpense = financeSummary?.totalExpense ?? expenses.reduce((a, b) => a + (b.amount || 0), 0);

    return (
      <div className="space-y-6">
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Manajemen Pengeluaran & Biaya Bisnis</h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Pencatatan seluruh biaya modal produk (COGS), komisi sales, payment gateway fee, dan infrastruktur cloud.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-foreground-muted uppercase tracking-wider block">Total Pengeluaran Bulan Ini</span>
            <span className="text-xl font-bold text-status-error font-mono">Rp {totalExpense.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-raised/80 border-b border-border text-foreground-muted text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Kategori Biaya</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4">Referensi / Invoice</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-foreground-muted">
                      Belum ada pencatatan biaya operasional
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-surface-raised/40">
                      <td className="py-3.5 px-4 font-semibold text-foreground">{exp.category}</td>
                      <td className="py-3.5 px-4 text-foreground-muted">{exp.desc}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-primary">{exp.ref}</td>
                      <td className="py-3.5 px-4 text-foreground-muted text-[11px]">{exp.date}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-status-error font-mono">
                        -Rp {(exp.amount ?? 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. PROFIT (Financial Waterfall, SSOT Split & Audit Ledger)
  // -------------------------------------------------------------
  if (activeTab === 'profit') {
    const grossRevenue = profitSummary?.totalGrossRevenue ?? 0;
    const discounts = profitSummary?.totalDiscounts ?? 0;
    const netRevenue = profitSummary?.totalNetRevenue ?? 0;
    const cogs = profitSummary?.totalCostOfGoods ?? 0;
    const pgFees = profitSummary?.totalPaymentFees ?? 0;
    const transactionProfit = profitSummary?.totalTransactionProfit ?? 0;
    const salesCommission = profitSummary?.totalSalesCommission ?? 0;
    const recruitmentBonus = profitSummary?.totalRecruitmentBonus ?? 0;
    const profitDistribution = profitSummary?.totalProfitDistribution ?? 0;

    const ceoShare = profitSummary?.totalCeoShare ?? 0;
    const cooShare = profitSummary?.totalCooShare ?? 0;
    const businessReserve = profitSummary?.totalBusinessReserve ?? 0;

    const pendingCommission = profitSummary?.pendingCommissionTotal ?? 0;
    const availableCommission = profitSummary?.availableCommissionTotal ?? 0;

    const netMarginPercent =
      netRevenue > 0 ? ((transactionProfit / netRevenue) * 100).toFixed(1) : '0.0';

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-status-success/15 text-status-success border border-status-success/25">
                Single Source of Truth (SSOT)
              </span>
              <span className="text-[11px] text-foreground-muted">Model Profit Sharing Asterra</span>
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              Buku Besar Distribusi Laba & Audit Finansial
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Perhitungan murni dari Profit Transaksi (Net Revenue − Biaya Langsung). Pembagian: 40% CEO, 40% COO (Strict Equality), 20% Modal Usaha.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-foreground-muted uppercase tracking-wider block">Profit Margin Toko</span>
              <span className="text-xl font-bold text-status-success font-mono">+{netMarginPercent}%</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                fetchProfitData();
                onNotify?.('Data distribusi laba dan buku besar berhasil diperbarui.');
              }}
              disabled={isLoadingProfit}
              className="text-xs gap-1.5 border-border"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProfit ? 'animate-spin' : ''}`} />
              <span>Sinkronisasi Data</span>
            </Button>
          </div>
        </div>

        {/* 3 Pillars of Distribution Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CEO Share Card */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs relative overflow-hidden space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Building2 className="w-4 h-4 text-primary" />
                <span>Bagian CEO (Chief Executive Officer)</span>
              </div>
              <Badge variant="outline" className="text-primary border-primary/30 text-[10px] font-mono font-bold">
                40%
              </Badge>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              Rp {ceoShare.toLocaleString('id-ID')}
            </div>
            <div className="flex items-center justify-between text-[11px] text-foreground-muted pt-1 border-t border-border/60">
              <span>Formula: 40% × Profit Distribusi</span>
              <span className="text-status-success font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> Sama Rata COO
              </span>
            </div>
          </div>

          {/* COO Share Card */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs relative overflow-hidden space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Bagian COO (Chief Operating Officer)</span>
              </div>
              <Badge variant="outline" className="text-primary border-primary/30 text-[10px] font-mono font-bold">
                40%
              </Badge>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              Rp {cooShare.toLocaleString('id-ID')}
            </div>
            <div className="flex items-center justify-between text-[11px] text-foreground-muted pt-1 border-t border-border/60">
              <span>Formula: 40% × Profit Distribusi</span>
              <span className="text-status-success font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> Sama Rata CEO
              </span>
            </div>
          </div>

          {/* Modal Usaha Card */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs relative overflow-hidden space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Coins className="w-4 h-4 text-status-warning" />
                <span>Cadangan Modal Usaha</span>
              </div>
              <Badge variant="outline" className="text-status-warning border-status-warning/30 text-[10px] font-mono font-bold">
                20%
              </Badge>
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              Rp {businessReserve.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-foreground-muted pt-1 border-t border-border/60">
              Operasional, deposit supplier, marketing, & buffer refund
            </div>
          </div>
        </div>

        {/* Waterfall Calculation Cards */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Struktur Pembentukan Laba Bersih (Waterfall P&L Sesuai SSOT)</span>
            </h3>
            <span className="text-[11px] text-foreground-muted">
              Total Transaksi Tercatat: <strong className="text-foreground">{profitSummary?.totalOrders ?? 0} order</strong>
            </span>
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-surface-raised border border-border flex items-center justify-between">
              <span className="text-foreground font-medium">(+) Harga Jual Kotor (Gross Selling Price)</span>
              <span className="text-foreground font-mono font-bold text-sm">
                Rp {grossRevenue.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-raised border border-border flex items-center justify-between">
              <span className="text-foreground-muted">
                (-) Diskon Pelanggan Referral (1x Promo Pengguna Baru)
              </span>
              <span className="text-status-warning font-mono font-bold">
                -Rp {discounts.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between font-semibold">
              <span className="text-primary font-bold">(=) Pendapatan Bersih (Net Revenue)</span>
              <span className="text-primary font-mono font-bold text-sm">
                Rp {netRevenue.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-raised border border-border flex items-center justify-between">
              <span className="text-foreground-muted">(-) Modal Produk Upstream Provider (COGS)</span>
              <span className="text-status-error font-mono font-bold">
                -Rp {cogs.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-raised border border-border flex items-center justify-between">
              <span className="text-foreground-muted">(-) Biaya Payment Gateway & Biaya Langsung Transaksi</span>
              <span className="text-status-error font-mono font-bold">
                -Rp {pgFees.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-status-success/10 border border-status-success/20 flex items-center justify-between font-semibold">
              <div>
                <span className="text-status-success font-bold">(=) PROFIT TRANSAKSI BERSIH</span>
                <span className="text-[11px] text-foreground-muted block font-normal">
                  Basis utama perhitungan komisi mitra sales & recruitment bonus.
                </span>
              </div>
              <span className="text-status-success font-mono font-bold text-base">
                Rp {transactionProfit.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-raised border border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-foreground-muted">(-) Komisi Direct Sales (10% dari Profit Transaksi)</span>
                <Badge variant="outline" className="text-[10px] border-border">10% Profit</Badge>
              </div>
              <span className="text-status-error font-mono font-bold">
                -Rp {salesCommission.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-raised border border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-foreground-muted">(-) Bonus Rekrutmen Upline (2% dari Profit Transaksi, 1-Level)</span>
                <Badge variant="outline" className="text-[10px] border-border">2% Profit</Badge>
              </div>
              <span className="text-status-error font-mono font-bold">
                -Rp {recruitmentBonus.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between font-bold text-sm">
              <div>
                <span className="text-primary font-bold text-base">(=) TOTAL PROFIT DISTRIBUSI</span>
                <span className="text-[11px] text-foreground-muted block font-normal">
                  Dialokasikan: 40% CEO (Rp {ceoShare.toLocaleString('id-ID')}) + 40% COO (Rp {cooShare.toLocaleString('id-ID')}) + 20% Modal Usaha (Rp {businessReserve.toLocaleString('id-ID')})
                </span>
              </div>
              <span className="text-primary font-mono text-lg">
                Rp {profitDistribution.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Commission Holding Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-status-warning/10 border border-status-warning/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-status-warning" />
                <div>
                  <span className="font-semibold text-foreground text-xs block">Komisi Masa Holding (3 Hari)</span>
                  <span className="text-[10px] text-foreground-muted">Dilindungi dari risiko refund/fraud</span>
                </div>
              </div>
              <span className="font-mono font-bold text-status-warning text-sm">
                Rp {pendingCommission.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-status-success/10 border border-status-success/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-success" />
                <div>
                  <span className="font-semibold text-foreground text-xs block">Komisi Tersedia & Dicairkan</span>
                  <span className="text-[10px] text-foreground-muted">Sudah melewati holding atau telah dibayar</span>
                </div>
              </div>
              <span className="font-mono font-bold text-status-success text-sm">
                Rp {availableCommission.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Section 8 Audit Ledger Table */}
        <div className="space-y-3">
          <div className="bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <span>Buku Besar Transaksi (Audit Trail Section 8)</span>
              </h3>
              <p className="text-foreground-muted text-[11px] mt-0.5">
                Audit riil per transaksi: Net Revenue, COGS, Profit, Komisi Sales (10%), Rekrutmen (2%), dan Distribusi.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Cari order, user, kode..."
                  value={profitSearch}
                  onChange={(e) => setProfitSearch(e.target.value)}
                  className="pl-8 text-xs bg-surface-raised border-border h-8"
                />
              </div>

              <select
                value={profitStatusFilter}
                onChange={(e) => setProfitStatusFilter(e.target.value)}
                className="bg-surface-raised border border-border rounded-lg text-xs px-2.5 py-1.5 text-foreground focus:outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Pending (Holding)</option>
                <option value="available">Available (Siap Cair)</option>
                <option value="withdrawn">Withdrawn (Cair)</option>
                <option value="reversed">Reversed (Dibatalkan)</option>
              </select>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-raised/80 border-b border-border text-foreground-muted text-[11px] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-3">Order & Waktu</th>
                    <th className="py-3 px-3">Pelanggan & Produk</th>
                    <th className="py-3 px-3">Mitra & Upline</th>
                    <th className="py-3 px-3 text-right">Net Revenue</th>
                    <th className="py-3 px-3 text-right">Biaya Langsung</th>
                    <th className="py-3 px-3 text-right">Profit Transaksi</th>
                    <th className="py-3 px-3 text-right">Komisi (10% + 2%)</th>
                    <th className="py-3 px-3 text-right">Profit Distribusi</th>
                    <th className="py-3 px-3 text-right">CEO / COO / Modal</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoadingProfit ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-foreground-muted">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span>Memuat data audit buku besar profit...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredProfitEntries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-foreground-muted">
                        Belum ada data transaksi profit yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredProfitEntries.map((e) => (
                      <tr key={e.id} className="hover:bg-surface-raised/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-foreground">{e.orderId}</div>
                          <div className="text-[10px] text-foreground-muted">
                            {new Date(e.createdAt).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-medium text-foreground line-clamp-1">{e.productNames}</div>
                          <div className="text-[10px] text-foreground-muted font-mono">{e.customerEmail}</div>
                          {(e.customerReferralDiscount ?? 0) > 0 && (
                            <span className="text-[10px] text-status-warning block">
                              Diskon 1x: -Rp {(e.customerReferralDiscount ?? 0).toLocaleString('id-ID')}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {e.referralCode ? (
                            <div>
                              <span className="font-mono font-bold text-[11px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                {e.referralCode}
                              </span>
                              {e.recruiterSalesId && (
                                <div className="text-[10px] text-foreground-muted mt-0.5">
                                  Upline: <span className="font-mono font-semibold">{e.recruiterSalesId}</span> (2%)
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-foreground-muted text-[11px] italic">Non-Referral (Organik)</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-medium text-foreground">
                          Rp {(e.netRevenue ?? 0).toLocaleString('id-ID')}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-status-error text-[11px]">
                          -Rp {(e.directTransactionCost ?? ((e.costOfGoods ?? 0) + (e.paymentFee ?? 0))).toLocaleString('id-ID')}
                          <div className="text-[9px] text-foreground-muted">
                            COGS: {(e.costOfGoods ?? 0).toLocaleString('id-ID')} | Fee: {(e.paymentFee ?? 0).toLocaleString('id-ID')}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-status-success">
                          Rp {(e.transactionProfit ?? 0).toLocaleString('id-ID')}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-xs">
                          {(e.salesCommission ?? 0) > 0 || (e.recruitmentBonus ?? 0) > 0 ? (
                            <div>
                              <span className="text-status-warning font-semibold">
                                Rp {((e.salesCommission ?? 0) + (e.recruitmentBonus ?? 0)).toLocaleString('id-ID')}
                              </span>
                              <div className="text-[9px] text-foreground-muted">
                                Direct: {(e.salesCommission ?? 0).toLocaleString('id-ID')} | Upline: {(e.recruitmentBonus ?? 0).toLocaleString('id-ID')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-foreground-muted">-</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-primary">
                          Rp {(e.profitDistribution ?? 0).toLocaleString('id-ID')}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-[10px] text-foreground-muted">
                          <div>CEO (40%): Rp {(e.ceoShare ?? 0).toLocaleString('id-ID')}</div>
                          <div>COO (40%): Rp {(e.cooShare ?? 0).toLocaleString('id-ID')}</div>
                          <div>Modal (20%): Rp {(e.businessReserve ?? 0).toLocaleString('id-ID')}</div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          {e.status === 'pending' ? (
                            <Badge variant="outline" className="text-status-warning border-status-warning/30 text-[10px]">
                              Holding (3d)
                            </Badge>
                          ) : e.status === 'available' || e.status === 'validated' ? (
                            <Badge variant="outline" className="text-status-success border-status-success/30 text-[10px]">
                              Available
                            </Badge>
                          ) : e.status === 'withdrawn' ? (
                            <Badge variant="outline" className="text-primary border-primary/30 text-[10px]">
                              Withdrawn
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-status-error border-status-error/30 text-[10px]">
                              Reversed
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 5. FINANCIAL TRANSACTIONS (General Ledger Audit Trail)
  // -------------------------------------------------------------
  const ledgerEntries = financeSummary?.financialTransactions || [];

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">Jurnal Pembukuan & Riwayat Mutasi Kas</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Audit trail transaksi finansial double-entry internal secara kronologis.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onNotify?.('Buku kas transaksi berhasil diekspor.')}
          className="text-xs gap-1.5 border-border"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Ekspor Jurnal (CSV)</span>
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised/80 border-b border-border text-foreground-muted text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">ID Mutasi</th>
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4">Deskripsi Transaksi</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-right">Saldo Berjalan</th>
                <th className="py-3 px-4">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-foreground-muted">
                    Belum ada riwayat mutasi kas transaksi
                  </td>
                </tr>
              ) : (
                ledgerEntries.map((l) => (
                  <tr key={l.id} className="hover:bg-surface-raised/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">{l.id}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          l.type === 'Credit'
                            ? 'bg-status-success/15 text-status-success border-status-success/30'
                            : 'bg-status-error/15 text-status-error border-status-error/30'
                        }`}
                      >
                        {l.type === 'Credit' ? '+ KREDIT' : '- DEBIT'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-foreground">{l.desc}</td>
                    <td className={`py-3.5 px-4 text-right font-mono font-bold ${
                      l.type === 'Credit' ? 'text-status-success' : 'text-status-error'
                    }`}>
                      {l.type === 'Credit' ? '+' : '-'}Rp {(l.amount ?? 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-foreground font-semibold">
                      Rp {(l.balance ?? 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-foreground-muted text-[11px]">{l.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
