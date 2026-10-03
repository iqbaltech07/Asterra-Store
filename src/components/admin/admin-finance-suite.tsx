'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AdminTab } from './admin-sidebar';

interface AdminFinanceSuiteProps {
  activeTab: 'wallets' | 'revenue' | 'expenses' | 'profit' | 'financial-transactions';
  metrics?: {
    vipBalance?: number | null;
  };
  onNotify?: (msg: string) => void;
}

export function AdminFinanceSuite({ activeTab, metrics, onNotify }: AdminFinanceSuiteProps) {
  const vipBalance = metrics?.vipBalance ?? 0;

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
            <div className="text-2xl font-bold text-foreground font-mono">Rp 12.850.000</div>
            <p className="text-[11px] text-foreground-muted">Dana siap ditarik ke rekening bank operasional</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNotify?.('Pengajuan pencairan Tripay sebesar Rp 12.850.000 sedang diproses.')}
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
              Rp {vipBalance.toLocaleString('id-ID')}
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
            <div className="text-2xl font-bold text-foreground font-mono">Rp 3.500.000</div>
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
            <div className="text-xl font-bold text-foreground">Rp 985.000</div>
            <span className="text-[10px] text-status-success font-semibold">↑ +8.4% vs kemarin</span>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
            <span className="text-xs text-foreground-muted block mb-1">Omzet Bulan Ini</span>
            <div className="text-xl font-bold text-status-success">Rp 18.450.000</div>
            <span className="text-[10px] text-status-success font-semibold">Target tercapai 115%</span>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
            <span className="text-xs text-foreground-muted block mb-1">Average Order Value (AOV)</span>
            <div className="text-xl font-bold text-foreground">Rp 38.600</div>
            <span className="text-[10px] text-foreground-muted">Rata-rata belanja per order</span>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
            <span className="text-xs text-foreground-muted block mb-1">Total Transaksi Lunas</span>
            <div className="text-xl font-bold text-primary">478 Order</div>
            <span className="text-[10px] text-foreground-muted">Bulan berjalan</span>
          </div>
        </div>

        {/* Breakdown by Payment Channel */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-foreground">Distribusi Pendapatan per Kanal Pembayaran</h3>
          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-surface-raised rounded-lg border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">QRIS (ShopeePay, GoPay, DANA, OVO, BCA Mobile)</span>
                <span className="font-bold text-primary">Rp 12.177.000 (66.0%)</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '66%' }} />
              </div>
            </div>

            <div className="p-3 bg-surface-raised rounded-lg border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Virtual Account (BCA, Mandiri, BNI, BRI)</span>
                <span className="font-bold text-status-success">Rp 4.612.500 (25.0%)</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div className="bg-status-success h-2 rounded-full" style={{ width: '25%' }} />
              </div>
            </div>

            <div className="p-3 bg-surface-raised rounded-lg border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Transfer Bank Manual (BCA & DANA Toko)</span>
                <span className="font-bold text-foreground">Rp 1.660.500 (9.0%)</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div className="bg-foreground-muted h-2 rounded-full" style={{ width: '9%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. EXPENSES (Cost Center & Expense Tracker)
  // -------------------------------------------------------------
  if (activeTab === 'expenses') {
    const expenses = [
      { id: 'exp-1', category: 'Modal Supplier VIP Reseller', desc: 'Pembelian lisensi & API auto-fulfillment', amount: 10820000, date: '01 Okt 2026', ref: 'INV-VIP-0926' },
      { id: 'exp-2', category: 'Payment Gateway Fee (Tripay)', desc: 'Fee transaksi QRIS & Virtual Account (0.7%)', amount: 129150, date: '01 Okt 2026', ref: 'TRIPAY-FEE-09' },
      { id: 'exp-3', category: 'Komisi Mitra Affiliate', desc: 'Pencairan bagi hasil mitra kreator & sales', amount: 1485000, date: '28 Sep 2026', ref: 'PAYOUT-AFF-09' },
      { id: 'exp-4', category: 'Server & Cloud Hosting', desc: 'Vercel Pro & Upstash Redis Cloud', amount: 350000, date: '15 Sep 2026', ref: 'VCL-SUB-4981' },
      { id: 'exp-5', category: 'Gateway WhatsApp Bot', desc: 'Fonnte WhatsApp API Gateway Bulanan', amount: 100000, date: '10 Sep 2026', ref: 'FONNTE-SUB-89' },
    ];

    const totalExpense = expenses.reduce((a, b) => a + b.amount, 0);

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
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-surface-raised/40">
                    <td className="py-3.5 px-4 font-semibold text-foreground">{exp.category}</td>
                    <td className="py-3.5 px-4 text-foreground-muted">{exp.desc}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-primary">{exp.ref}</td>
                    <td className="py-3.5 px-4 text-foreground-muted text-[11px]">{exp.date}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-status-error font-mono">
                      -Rp {exp.amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. PROFIT (Financial Waterfall & Margin Analysis)
  // -------------------------------------------------------------
  if (activeTab === 'profit') {
    const grossRevenue = 18450000;
    const cogs = 10820000;
    const pgFees = 129150;
    const affiliateCommission = 1485000;
    const opex = 450000;
    const netProfit = grossRevenue - cogs - pgFees - affiliateCommission - opex;
    const netMarginPercent = ((netProfit / grossRevenue) * 100).toFixed(1);

    return (
      <div className="space-y-6">
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Analisis Profit & Waterfall Finansial</h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Kalkulasi laba bersih riil Asterra Store setelah dikurangi seluruh biaya modal, komisi sales, dan operasional.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-foreground-muted uppercase tracking-wider block">Net Profit Margin</span>
            <span className="text-2xl font-bold text-status-success font-mono">+{netMarginPercent}%</span>
          </div>
        </div>

        {/* Waterfall Calculation Cards */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-foreground">Struktur Pembentukan Laba Bersih (Waterfall P&L)</h3>

          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-status-success/10 border border-status-success/20 flex items-center justify-between font-semibold">
              <span className="text-foreground">(+) Pendapatan Bruto (Gross Revenue)</span>
              <span className="text-status-success font-mono font-bold text-sm">Rp {grossRevenue.toLocaleString('id-ID')}</span>
            </div>

            <div className="p-3 rounded-lg bg-surface-raised border border-border flex items-center justify-between">
              <span className="text-foreground-muted">(-) Modal Produk Upstream VIP Reseller (COGS)</span>
              <span className="text-status-error font-mono font-bold">-Rp {cogs.toLocaleString('id-ID')}</span>
            </div>

            <div className="p-3 rounded-lg bg-surface-raised border border-border flex items-center justify-between">
              <span className="text-foreground-muted">(-) Komisi Mitra Affiliate & Tim Sales</span>
              <span className="text-status-error font-mono font-bold">-Rp {affiliateCommission.toLocaleString('id-ID')}</span>
            </div>

            <div className="p-3 rounded-lg bg-surface-raised border border-border flex items-center justify-between">
              <span className="text-foreground-muted">(-) Biaya Payment Gateway (Tripay Fee 0.7%)</span>
              <span className="text-status-error font-mono font-bold">-Rp {pgFees.toLocaleString('id-ID')}</span>
            </div>

            <div className="p-3 rounded-lg bg-surface-raised border border-border flex items-center justify-between">
              <span className="text-foreground-muted">(-) Biaya Server & WhatsApp Gateway (OpEx)</span>
              <span className="text-status-error font-mono font-bold">-Rp {opex.toLocaleString('id-ID')}</span>
            </div>

            <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between font-bold text-sm">
              <span className="text-primary">(=) LABA BERSIH (NET PROFIT TOKO)</span>
              <span className="text-primary font-mono text-base">Rp {netProfit.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 5. FINANCIAL TRANSACTIONS (General Ledger Audit Trail)
  // -------------------------------------------------------------
  const ledgerEntries = [
    { id: 'TX-9841', type: 'Credit', desc: 'Pembayaran Order ORD-882194 (Canva Pro)', amount: 25000, balance: 12850000, date: '01 Okt 2026, 17:42' },
    { id: 'TX-9840', type: 'Debit', desc: 'Deduction VIP Reseller Order ORD-882194', amount: 13000, balance: 12825000, date: '01 Okt 2026, 17:42' },
    { id: 'TX-9839', type: 'Credit', desc: 'Pembayaran Order ORD-882193 (Gemini Pro)', amount: 31000, balance: 12838000, date: '01 Okt 2026, 17:30' },
    { id: 'TX-9838', type: 'Debit', desc: 'Deduction VIP Reseller Order ORD-882193', amount: 18000, balance: 12807000, date: '01 Okt 2026, 17:30' },
    { id: 'TX-9837', type: 'Debit', desc: 'Payout Komisi Mitra Affiliate (AST-IQBAL)', amount: 320000, balance: 12825000, date: '01 Okt 2026, 12:00' },
  ];

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
              {ledgerEntries.map((l) => (
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
                    {l.type === 'Credit' ? '+' : '-'}Rp {l.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-foreground font-semibold">
                    Rp {l.balance.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4 text-foreground-muted text-[11px]">{l.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
