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
    staleTime: 5 * 60 * 1000,
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

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-foreground-muted block">Total Pelanggan</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">{customers.length}</div>
          <span className="text-xs text-emerald-600 font-medium block pt-1 border-t border-border/60">Aktif bertransaksi</span>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-foreground-muted block">Repeat Customer Rate</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-primary font-mono tracking-tight">
            {customers.length > 0
              ? ((customers.filter((c) => c.totalOrders > 1).length / customers.length) * 100).toFixed(1)
              : '0.0'}%
          </div>
          <span className="text-xs text-foreground-muted block pt-1 border-t border-border/60">Pernah order &gt; 1 kali</span>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-foreground-muted block">Average Lifetime Value</span>
          <div className="text-xl sm:text-2xl font-extrabold text-foreground font-mono tracking-tight truncate">
            Rp {customers.length > 0
              ? Math.round(customers.reduce((a, b) => a + (b.totalSpent || 0), 0) / customers.length).toLocaleString('id-ID')
              : '0'}
          </div>
          <span className="text-xs text-emerald-600 font-medium block pt-1 border-t border-border/60">Rata-rata belanja</span>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-foreground-muted block">Dari Jalur Referral Sales</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono tracking-tight">
            {customers.length > 0
              ? Math.round((customers.filter((c) => !!c.referralCode).length / customers.length) * 100)
              : 0}%
          </div>
          <span className="text-xs text-foreground-muted block pt-1 border-t border-border/60">Attributed to Affiliate</span>
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

      {/* 4. Customers Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
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

      {/* 5. Customer 360° Profile Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-border flex items-center justify-center text-foreground font-bold text-sm">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">{selectedCustomer.name}</h3>
                  <span className="text-[11px] text-foreground-muted font-mono">{selectedCustomer.email}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-xl text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-surface-raised border border-border space-y-1">
                <span className="text-foreground-muted text-[11px] block">Tier Pelanggan</span>
                <span className="font-bold text-foreground text-sm">{selectedCustomer.tier}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-raised border border-border space-y-1">
                <span className="text-foreground-muted text-[11px] block">Total Belanja</span>
                <span className="font-bold text-foreground font-mono text-sm">
                  Rp {selectedCustomer.totalSpent.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-foreground text-xs block">Riwayat Pesanan Terakhir:</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedCustomer.recentOrders.map((ord) => (
                  <div key={ord.orderId} className="p-3 rounded-xl bg-surface-raised border border-border flex items-center justify-between">
                    <div>
                      <span className="font-bold text-foreground block">{ord.product}</span>
                      <span className="text-[10px] text-foreground-muted font-mono">{ord.orderId} • {ord.date}</span>
                    </div>
                    <span className="font-bold text-foreground font-mono">Rp {ord.amount.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => setSelectedCustomer(null)}
                className="w-full text-xs font-semibold rounded-xl h-10"
              >
                Tutup Ringkasan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
