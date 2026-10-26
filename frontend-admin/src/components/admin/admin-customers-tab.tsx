'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Search,
  Filter,
  ShoppingBag,
  Share2,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  Award,
  Calendar,
  Wallet,
  Clock,
  CheckCircle2,
  X,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface CustomerItem {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  tier: 'VIP Platinum' | 'Gold Member' | 'Silver' | 'Reguler';
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  joinedAt: string;
  referralCode?: string;
  purchasedProducts: string[];
  recentOrders: {
    orderId: string;
    product: string;
    amount: number;
    date: string;
    status: 'completed' | 'pending';
  }[];
}

interface AdminCustomersTabProps {
  onNotify?: (msg: string) => void;
}

export function AdminCustomersTab({ onNotify }: AdminCustomersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);

  const { data: customers = [], isLoading } = useQuery<CustomerItem[]>({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/customers');
      const json = await res.json();
      return json.success && Array.isArray(json.data) ? json.data : [];
    },
    staleTime: 10000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: false,
  });

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.whatsapp.includes(q) ||
      (c.referralCode && c.referralCode.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Customer 360 & CRM
            </span>
            <span className="text-xs text-foreground-muted font-mono">
              Total {customers.length} Pelanggan
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            Database & Manajemen Pelanggan Toko
          </h2>
          <p className="text-xs text-foreground-muted mt-1">
            Riwayat akumulasi belanja, tier keanggotaan loyalitas, identitas referral afiliasi, dan kontak langsung pembeli.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onNotify?.('Database kontak pelanggan berhasil diekspor.')}
          className="text-xs border-border rounded-xl h-9 font-semibold"
        >
          Ekspor CSV Pelanggan
        </Button>
      </div>

      {/* 2. Top Summary KPI Cards - Responsive Density */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-1.5 sm:space-y-2">
          <span className="text-[11px] sm:text-xs font-semibold text-foreground-muted block truncate">Total Pelanggan</span>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground font-mono tracking-tight">{customers.length}</div>
          <span className="text-[10px] sm:text-xs text-emerald-600 font-medium block pt-1 border-t border-border/60 truncate">Aktif bertransaksi</span>
        </div>

        <div className="bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-1.5 sm:space-y-2">
          <span className="text-[11px] sm:text-xs font-semibold text-foreground-muted block truncate">Repeat Rate</span>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-primary font-mono tracking-tight">
            {customers.length > 0
              ? ((customers.filter((c) => c.totalOrders > 1).length / customers.length) * 100).toFixed(1)
              : '0.0'}%
          </div>
          <span className="text-[10px] sm:text-xs text-foreground-muted block pt-1 border-t border-border/60 truncate">Order &gt; 1 kali</span>
        </div>

        <div className="bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-1.5 sm:space-y-2">
          <span className="text-[11px] sm:text-xs font-semibold text-foreground-muted block truncate">Avg Lifetime Value</span>
          <div className="text-lg sm:text-2xl font-extrabold text-foreground font-mono tracking-tight truncate">
            Rp {customers.length > 0
              ? Math.round(customers.reduce((a, b) => a + (b.totalSpent || 0), 0) / customers.length).toLocaleString('id-ID')
              : '0'}
          </div>
          <span className="text-[10px] sm:text-xs text-emerald-600 font-medium block pt-1 border-t border-border/60 truncate">Rata-rata belanja</span>
        </div>

        <div className="bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-1.5 sm:space-y-2">
          <span className="text-[11px] sm:text-xs font-semibold text-foreground-muted block truncate">Jalur Referral</span>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-emerald-600 font-mono tracking-tight">
            {customers.length > 0
              ? Math.round((customers.filter((c) => !!c.referralCode).length / customers.length) * 100)
              : 0}%
          </div>
          <span className="text-[10px] sm:text-xs text-foreground-muted block pt-1 border-t border-border/60 truncate">Via Mitra Sales</span>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari nama, email, WhatsApp, atau referral..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs bg-surface-raised border-border rounded-xl h-10"
          />
        </div>
        <div className="text-xs text-foreground-muted font-mono">
          Menampilkan {filteredCustomers.length} dari {customers.length} akun pembeli
        </div>
      </div>

      {/* 4. Customers Table & Mobile Card View */}
      <div className="space-y-4">
        {/* Desktop Table View */}
        <div className="hidden md:block bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised border-b border-border text-foreground-muted text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 font-semibold">Nama Pelanggan</th>
                <th className="py-3 px-4 font-semibold">Email & Kontak</th>
                <th className="py-3 px-4 font-semibold">Tier Member</th>
                <th className="py-3 px-4 font-semibold text-center">Total Order</th>
                <th className="py-3 px-4 font-semibold text-right">Total Belanja</th>
                <th className="py-3 px-4 font-semibold">Referral / Sales</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-surface-raised/60 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-foreground">
                    {cust.name}
                    <span className="text-[10px] text-foreground-muted block font-normal">
                      Gabung: {cust.joinedAt}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[11px] text-foreground block">{cust.email}</span>
                    <span className="text-[10px] text-foreground-muted font-mono">{cust.whatsapp}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold ${
                        cust.tier === 'VIP Platinum'
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : cust.tier === 'Gold Member'
                          ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                          : 'bg-surface-raised text-foreground-muted border-border'
                      }`}
                    >
                      {cust.tier}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-foreground font-mono">
                    {cust.totalOrders} order
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-foreground font-mono">
                    Rp {cust.totalSpent.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4">
                    {cust.referralCode ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 inline-flex items-center gap-1">
                        <Share2 className="w-3 h-3" />
                        {cust.referralCode}
                      </span>
                    ) : (
                      <span className="text-[11px] text-foreground-muted italic">Langsung (Organik)</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedCustomer(cust)}
                        className="h-8 px-2.5 text-xs border-border rounded-xl font-semibold"
                      >
                        Detail 360°
                      </Button>
                      <a
                        href={`https://wa.me/${cust.whatsapp.replace(/\D/g, '')}?text=Halo%20Kak%20${encodeURIComponent(cust.name)},%20dari%20Customer%20Care%20Asterra%20Store`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-xl border border-border text-foreground-muted hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Chat via WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden flex flex-col gap-3.5">
        {filteredCustomers.map((cust) => (
          <div
            key={cust.id}
            className="bg-surface border border-border/80 rounded-2xl p-4 space-y-3 shadow-2xs hover:border-border-strong transition-all"
          >
              {/* Header: Name + Joined + Tier */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-foreground/5 border border-border flex items-center justify-center text-foreground font-bold text-xs shrink-0">
                    {cust.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-foreground text-xs truncate">{cust.name}</h4>
                    <span className="text-[10px] text-foreground-muted block font-mono">Gabung {cust.joinedAt}</span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[9px] font-semibold shrink-0 ${
                    cust.tier === 'VIP Platinum'
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : cust.tier === 'Gold Member'
                      ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                      : 'bg-surface-raised text-foreground-muted border-border'
                  }`}
                >
                  {cust.tier}
                </Badge>
              </div>

              {/* Contact Info */}
              <div className="bg-surface-raised/60 border border-border/60 rounded-xl p-2.5 space-y-1 text-xs">
                <div className="font-mono text-[11px] text-foreground truncate">{cust.email}</div>
                <div className="flex items-center justify-between text-[10px] text-foreground-muted">
                  <span className="font-mono">{cust.whatsapp}</span>
                  {cust.referralCode ? (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-mono font-medium">
                      Ref: {cust.referralCode}
                    </span>
                  ) : (
                    <span className="italic">Organik</span>
                  )}
                </div>
              </div>

              {/* Financials & Order Count */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-surface-raised/40 border border-border/40">
                  <span className="text-[10px] text-foreground-muted block">Total Pesanan</span>
                  <span className="font-bold text-foreground font-mono text-xs">{cust.totalOrders} order</span>
                </div>
                <div className="p-2 rounded-lg bg-surface-raised/40 border border-border/40">
                  <span className="text-[10px] text-foreground-muted block">Total Belanja</span>
                  <span className="font-bold text-foreground font-mono text-xs">Rp {cust.totalSpent.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedCustomer(cust)}
                  className="flex-1 h-8 text-xs font-semibold rounded-xl border-border hover:bg-surface-raised"
                >
                  Detail 360°
                </Button>
                <a
                  href={`https://wa.me/${cust.whatsapp.replace(/\D/g, '')}?text=Halo%20Kak%20${encodeURIComponent(cust.name)},%20dari%20Customer%20Care%20Asterra%20Store`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 px-3 rounded-xl border border-border text-foreground-muted hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center shrink-0"
                  title="Chat via WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Customer 360° Profile Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-lg max-h-[calc(100dvh-40px)] flex flex-col shadow-2xl overflow-hidden box-border animate-in zoom-in-95 duration-200">
            {/* Sticky Header */}
            <div className="shrink-0 px-5 py-3.5 border-b border-[#E2E8F0] bg-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] font-bold text-sm shrink-0">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">{selectedCustomer.name}</h3>
                  <span className="text-[11px] text-[#64748B] font-mono mt-0.5 block">{selectedCustomer.email}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="h-8 w-8 p-0 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs bg-[#F8FAFC]">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs space-y-1">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">Tier Pelanggan</span>
                  <span className="font-bold text-[#0F172A] text-sm">{selectedCustomer.tier}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs space-y-1">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">Total Belanja</span>
                  <span className="font-bold text-[#0F172A] font-mono text-sm">
                    Rp {selectedCustomer.totalSpent.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">Riwayat Pesanan Terakhir</span>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                  {selectedCustomer.recentOrders.length === 0 ? (
                    <div className="text-center py-6 text-[#64748B] text-xs">Belum ada riwayat transaksi.</div>
                  ) : (
                    selectedCustomer.recentOrders.map((ord) => (
                      <div key={ord.orderId} className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[#0F172A] block">{ord.product}</span>
                          <span className="text-[10px] text-[#64748B] font-mono">{ord.orderId} • {ord.date}</span>
                        </div>
                        <span className="font-bold text-[#0F172A] font-mono">Rp {ord.amount.toLocaleString('id-ID')}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="shrink-0 px-4 sm:px-5 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-end">
              <Button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-xs h-8 px-4 font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs rounded-lg cursor-pointer"
              >
                Tutup Profil
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
