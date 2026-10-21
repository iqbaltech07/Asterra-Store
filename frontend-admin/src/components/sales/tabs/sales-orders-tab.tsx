'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  Flame,
  Share2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShoppingBag,
} from 'lucide-react';
import { AdminTab } from '@/components/admin/admin-sidebar';
import { SalesOrder } from '../types';

interface SalesOrdersTabProps {
  partnerCode: string;
  partnerRate: number;
  orders: SalesOrder[];
  isLoading?: boolean;
  onRefresh: () => void;
  onTabChange?: (tab: AdminTab) => void;
}

export function SalesOrdersTab({
  partnerCode,
  partnerRate,
  orders,
  isLoading = false,
  onRefresh,
  onTabChange,
}: SalesOrdersTabProps) {
  const campaignOrders = orders.filter((o) => o.isCampaignSale);
  const directOrders = orders.filter((o) => !o.isCampaignSale);

  return (
    <div className="space-y-8">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Daftar Transaksi & Komisi Sales</h2>
          <p className="text-xs text-foreground-muted">
            Rekapitulasi penjualan referral langsung dan penjualan melalui campaign promo ({partnerCode}).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="text-xs h-9 gap-1.5 border-border"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Segarkan Data</span>
        </Button>
      </div>

      {/* TABEL 1: PESANAN PENJUALAN MELALUI CAMPAIGN PROMO */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Flame className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>Pesanan Melalui Campaign Promo</span>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border-primary/30">
                  Komisi Dinamis Campaign
                </Badge>
              </h3>
              <p className="text-[11px] text-foreground-muted">
                Penjualan yang berasal dari event promo aktif. Persentase komisi mengikuti aturan campaign terkait.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-primary">
            {campaignOrders.length} Pesanan Campaign
          </span>
        </div>

        <div className="bg-surface border border-primary/25 rounded-xl shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-foreground-muted">Memuat data pesanan campaign...</div>
          ) : campaignOrders.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Flame className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-foreground">Belum Ada Penjualan dari Campaign</h4>
              <p className="text-xs text-foreground-muted max-w-md mx-auto leading-relaxed">
                Bagikan tautan promo event dari tab Generator Tautan untuk mendapatkan booster komisi dinamis hingga 15% - 20%!
              </p>
              <Button
                size="sm"
                onClick={() => onTabChange?.('sales-links')}
                className="text-xs h-8 font-semibold gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Lihat Campaign & Tautan</span>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-raised border-b border-border text-foreground-muted font-medium">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">ID Pesanan</th>
                    <th className="py-3 px-4">Campaign Promo</th>
                    <th className="py-3 px-4">Produk</th>
                    <th className="py-3 px-4">Pelanggan</th>
                    <th className="py-3 px-4">Total Nilai</th>
                    <th className="py-3 px-4">Persentase Komisi</th>
                    <th className="py-3 px-4">Komisi Diterima</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {campaignOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-surface-raised/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-foreground-muted">
                        {new Date(o.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-foreground">
                        {o.id.substring(0, 12)}...
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30 bg-primary/10">
                          {o.campaignName || o.campaignId || 'Event Promo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-foreground font-medium max-w-[180px] truncate">
                        {o.productNames || 'Produk Digital'}
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground-muted">
                        {o.customerEmail}
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground">
                        Rp {o.totalAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-primary px-2 py-0.5 rounded-full text-[11px] bg-primary/15 border border-primary/25">
                          🔥 {o.campaignRate || o.commissionRate || 15}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-status-success">
                          + Rp {o.commission.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] mt-0.5">
                          {o.commissionStatus === 'final' ? (
                            <span className="text-status-success font-medium inline-flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Siap Tarik
                            </span>
                          ) : o.commissionStatus === 'reversed' ? (
                            <span className="text-status-error font-medium inline-flex items-center gap-0.5">
                              <AlertCircle className="w-2.5 h-2.5" /> Dibatalkan
                            </span>
                          ) : (
                            <span className="text-amber-500 font-medium inline-flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" /> Masa Garansi (3 Hari)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold uppercase ${
                            o.status === 'completed'
                              ? 'text-status-success border-status-success/30 bg-status-success/10'
                              : o.status === 'processing'
                              ? 'text-blue-500 border-blue-500/30 bg-blue-500/10'
                              : o.status === 'refunded'
                              ? 'text-status-error border-status-error/30 bg-status-error/10'
                              : 'text-amber-500 border-amber-500/30 bg-amber-500/10'
                          }`}
                        >
                          {o.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* TABEL 2: PESANAN REFERRAL LANGSUNG */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-surface-raised text-foreground-muted flex items-center justify-center border border-border">
              <ShoppingBag className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Pesanan Referral Langsung
              </h3>
              <p className="text-[11px] text-foreground-muted">
                Transaksi reguler pelanggan yang menggunakan kode referral langsung Anda ({partnerCode}) dengan komisi standar {partnerRate}%.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-foreground-muted">
            {directOrders.length} Pesanan Langsung
          </span>
        </div>

        <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-foreground-muted">Memuat data pesanan referral...</div>
          ) : directOrders.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ShoppingBag className="w-10 h-10 text-foreground-muted mx-auto" />
              <h3 className="font-bold text-sm text-foreground">Belum Ada Pesanan Referral Langsung</h3>
              <p className="text-xs text-foreground-muted max-w-sm mx-auto">
                Belum ada pelanggan yang menyelesaikan transaksi melalui link referral langsung Anda. Bagikan link referral Anda untuk mulai mengumpulkan komisi!
              </p>
              <Button
                size="sm"
                onClick={() => onTabChange?.('sales-links')}
                className="text-xs h-9 font-semibold gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Mulai Bagikan Link</span>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-raised border-b border-border text-foreground-muted font-medium">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">ID Pesanan</th>
                    <th className="py-3 px-4">Produk</th>
                    <th className="py-3 px-4">Pelanggan</th>
                    <th className="py-3 px-4">Total Nilai</th>
                    <th className="py-3 px-4">Profit Transaksi</th>
                    <th className="py-3 px-4">Komisi Saya ({partnerRate}%)</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {directOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-surface-raised/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-foreground-muted">
                        {new Date(o.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-foreground">
                        {o.id.substring(0, 10)}...
                      </td>
                      <td className="py-3 px-4 text-foreground font-medium max-w-[200px] truncate">
                        {o.productNames || 'Produk Digital'}
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground-muted">
                        {o.customerEmail}
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground">
                        Rp {o.totalAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-primary">
                        Rp {(typeof o.transactionProfit === 'number' ? o.transactionProfit : 0).toLocaleString('id-ID')}
                        {o.transactionProfit === 0 && (
                          <span className="block text-[10px] text-foreground-muted font-normal">
                            (Margin tergerus promo)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-status-success">
                          + Rp {o.commission.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] mt-0.5">
                          {o.commissionStatus === 'final' ? (
                            <span className="text-status-success font-medium inline-flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Siap Tarik
                            </span>
                          ) : o.commissionStatus === 'reversed' ? (
                            <span className="text-status-error font-medium inline-flex items-center gap-0.5">
                              <AlertCircle className="w-2.5 h-2.5" /> Dibatalkan / Refund
                            </span>
                          ) : (
                            <span className="text-amber-500 font-medium inline-flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" /> Masa Garansi (3 Hari)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold uppercase ${
                            o.status === 'completed'
                              ? 'text-status-success border-status-success/30 bg-status-success/10'
                              : o.status === 'processing'
                              ? 'text-blue-500 border-blue-500/30 bg-blue-500/10'
                              : o.status === 'refunded'
                              ? 'text-status-error border-status-error/30 bg-status-error/10'
                              : 'text-amber-500 border-amber-500/30 bg-amber-500/10'
                          }`}
                        >
                          {o.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
