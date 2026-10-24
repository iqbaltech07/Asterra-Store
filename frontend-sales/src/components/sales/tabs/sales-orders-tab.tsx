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
import { StatusBadge } from '@/components/ui/status-badge';

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
          <h2 className="text-xl font-bold tracking-tight text-foreground">Daftar Transaksi & Komisi Sales</h2>
          <p className="text-xs text-foreground-muted mt-1">
            Rekapitulasi penjualan referral langsung dan penjualan melalui campaign promo (<span className="font-mono text-primary font-bold">{partnerCode}</span>).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="text-xs h-9 gap-1.5 border-border rounded-xl"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </Button>
      </div>

      {/* TABEL 1: PESANAN PENJUALAN MELALUI CAMPAIGN PROMO */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Flame className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>Pesanan Melalui Campaign Promo</span>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border-primary/20">
                  Komisi Dinamis Campaign
                </Badge>
              </h3>
              <p className="text-xs text-foreground-muted">
                Penjualan yang berasal dari event promo aktif dengan booster komisi.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            {campaignOrders.length} Pesanan Campaign
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-foreground-muted animate-pulse">Memuat data pesanan campaign...</div>
          ) : campaignOrders.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
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
            <>
              {/* Mobile View: Compact Order Cards (md:hidden) */}
              <div className="md:hidden divide-y divide-border">
                {campaignOrders.map((o, idx) => (
                  <div
                    key={o.id}
                    className="p-3.5 space-y-2.5 hover:bg-surface-raised/40 transition-colors animate-fade-up"
                    style={{ animationDelay: `${Math.min(idx, 10) * 40}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {o.id.substring(0, 10)}...
                        </span>
                        <Badge variant="outline" className="text-[9px] font-bold uppercase text-primary border-primary/20 bg-primary/5 px-1.5 py-0">
                          🔥 {o.campaignRate || o.commissionRate || 15}%
                        </Badge>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>

                    <div>
                      <h4 className="font-semibold text-xs text-foreground line-clamp-1">
                        {o.productNames || 'Produk Digital'}
                      </h4>
                      <div className="flex items-center justify-between text-[11px] text-foreground-muted mt-0.5">
                        <span className="font-mono">{o.customerEmail}</span>
                        <span>
                          {new Date(o.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-foreground-muted block">Total Belanja</span>
                        <span className="font-bold text-foreground font-mono text-xs">
                          Rp {o.totalAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-foreground-muted block">Komisi Anda</span>
                        <div className="font-mono font-extrabold text-sm text-[#16A36A]">
                          + Rp {o.commission.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px]">
                      {o.commissionStatus === 'final' ? (
                        <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Siap Ditarik
                        </span>
                      ) : o.commissionStatus === 'reversed' ? (
                        <span className="text-rose-600 font-medium inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Dibatalkan
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Masa Garansi (3 Hari)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View: Table (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-raised border-b border-border text-foreground-muted font-medium">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Tanggal</th>
                      <th className="py-3 px-4 font-semibold">ID Pesanan</th>
                      <th className="py-3 px-4 font-semibold">Campaign Promo</th>
                      <th className="py-3 px-4 font-semibold">Produk</th>
                      <th className="py-3 px-4 font-semibold">Pelanggan</th>
                      <th className="py-3 px-4 font-semibold">Total Nilai</th>
                      <th className="py-3 px-4 font-semibold">Persentase</th>
                      <th className="py-3 px-4 font-semibold">Komisi Diterima</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {campaignOrders.map((o, idx) => (
                      <tr
                        key={o.id}
                        className="hover:bg-surface-raised/60 transition-colors animate-fade-up"
                        style={{ animationDelay: `${Math.min(idx, 10) * 40}ms` }}
                      >
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
                          <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/20 bg-primary/5">
                            {o.campaignName || o.campaignId || 'Event Promo'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-foreground font-medium max-w-[180px] truncate">
                          {o.productNames || 'Produk Digital'}
                        </td>
                        <td className="py-3 px-4 font-mono text-foreground-muted text-[11px]">
                          {o.customerEmail}
                        </td>
                        <td className="py-3 px-4 font-bold text-foreground font-mono">
                          Rp {o.totalAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-primary px-2 py-0.5 rounded-full text-[11px] bg-primary/10 border border-primary/20">
                            🔥 {o.campaignRate || o.commissionRate || 15}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#16A36A] font-mono">
                            + Rp {o.commission.toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] mt-0.5">
                            {o.commissionStatus === 'final' ? (
                              <span className="text-emerald-600 font-medium inline-flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Siap Tarik
                              </span>
                            ) : o.commissionStatus === 'reversed' ? (
                              <span className="text-rose-600 font-medium inline-flex items-center gap-0.5">
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
                          <StatusBadge status={o.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* TABEL 2: PESANAN REFERRAL LANGSUNG */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-raised text-foreground flex items-center justify-center border border-border">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Pesanan Referral Langsung
              </h3>
              <p className="text-xs text-foreground-muted">
                Transaksi reguler pelanggan via kode referral langsung ({partnerCode}) dengan komisi standar {partnerRate}%.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-foreground-muted bg-surface-raised px-2.5 py-1 rounded-full border border-border">
            {directOrders.length} Pesanan Langsung
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-foreground-muted animate-pulse">Memuat data pesanan referral...</div>
          ) : directOrders.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center mx-auto text-foreground-muted">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Belum Ada Pesanan Referral Langsung</h3>
              <p className="text-xs text-foreground-muted max-w-sm mx-auto leading-relaxed">
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
            <>
              {/* Mobile View: Compact Direct Order Cards (md:hidden) */}
              <div className="md:hidden divide-y divide-border">
                {directOrders.map((o, idx) => (
                  <div
                    key={o.id}
                    className="p-3.5 space-y-2.5 hover:bg-surface-raised/40 transition-colors animate-fade-up"
                    style={{ animationDelay: `${Math.min(idx, 10) * 40}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {o.id.substring(0, 10)}...
                        </span>
                        <Badge variant="outline" className="text-[9px] font-semibold text-foreground-muted border-border px-1.5 py-0">
                          {partnerRate}%
                        </Badge>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>

                    <div>
                      <h4 className="font-semibold text-xs text-foreground line-clamp-1">
                        {o.productNames || 'Produk Digital'}
                      </h4>
                      <div className="flex items-center justify-between text-[11px] text-foreground-muted mt-0.5">
                        <span className="font-mono">{o.customerEmail}</span>
                        <span>
                          {new Date(o.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-foreground-muted block">Total Belanja</span>
                        <span className="font-bold text-foreground font-mono text-xs">
                          Rp {o.totalAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-foreground-muted block">Komisi Saya</span>
                        <div className="font-mono font-extrabold text-sm text-[#16A36A]">
                          + Rp {o.commission.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px]">
                      {o.commissionStatus === 'final' ? (
                        <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Siap Ditarik
                        </span>
                      ) : o.commissionStatus === 'reversed' ? (
                        <span className="text-rose-600 font-medium inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Dibatalkan / Refund
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Masa Garansi (3 Hari)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View: Table (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-raised border-b border-border text-foreground-muted font-medium">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Tanggal</th>
                      <th className="py-3 px-4 font-semibold">ID Pesanan</th>
                      <th className="py-3 px-4 font-semibold">Produk</th>
                      <th className="py-3 px-4 font-semibold">Pelanggan</th>
                      <th className="py-3 px-4 font-semibold">Total Nilai</th>
                      <th className="py-3 px-4 font-semibold">Profit Transaksi</th>
                      <th className="py-3 px-4 font-semibold">Komisi Saya ({partnerRate}%)</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {directOrders.map((o, idx) => (
                      <tr
                        key={o.id}
                        className="hover:bg-surface-raised/60 transition-colors animate-fade-up"
                        style={{ animationDelay: `${Math.min(idx, 10) * 40}ms` }}
                      >
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
                        <td className="py-3 px-4 font-mono text-foreground-muted text-[11px]">
                          {o.customerEmail}
                        </td>
                        <td className="py-3 px-4 font-bold text-foreground font-mono">
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
                          <div className="font-bold text-[#16A36A] font-mono">
                            + Rp {o.commission.toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] mt-0.5">
                            {o.commissionStatus === 'final' ? (
                              <span className="text-emerald-600 font-medium inline-flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Siap Tarik
                              </span>
                            ) : o.commissionStatus === 'reversed' ? (
                              <span className="text-rose-600 font-medium inline-flex items-center gap-0.5">
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
                          <StatusBadge status={o.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
