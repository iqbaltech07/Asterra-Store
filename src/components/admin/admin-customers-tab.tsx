'use client';

import React, { useState } from 'react';
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

const INITIAL_CUSTOMERS: CustomerItem[] = [
  {
    id: 'cust-1',
    name: 'Budi Santoso',
    email: 'budi.santoso@gmail.com',
    whatsapp: '081234567890',
    tier: 'VIP Platinum',
    totalOrders: 12,
    totalSpent: 845000,
    lastOrderDate: '01 Okt 2026',
    joinedAt: '15 Juli 2026',
    referralCode: 'AST-IQBAL',
    purchasedProducts: ['Canva Pro 1 Bulan', 'Gemini AI Pro 1 Tahun', 'Netflix UHD Private'],
    recentOrders: [
      { orderId: 'ORD-882194', product: 'Canva Pro 1 Bulan Private', amount: 25000, date: '01 Okt 2026', status: 'completed' },
      { orderId: 'ORD-881023', product: 'Gemini AI Pro 1 Tahun', amount: 31000, date: '18 Sep 2026', status: 'completed' },
      { orderId: 'ORD-879410', product: 'Netflix UHD 1 Bulan', amount: 32000, date: '04 Sep 2026', status: 'completed' },
    ],
  },
  {
    id: 'cust-2',
    name: 'Dewi Lestari',
    email: 'dewi.lestari@yahoo.com',
    whatsapp: '085712345678',
    tier: 'Gold Member',
    totalOrders: 6,
    totalSpent: 390000,
    lastOrderDate: '29 Sep 2026',
    joinedAt: '02 Ags 2026',
    referralCode: 'DESAIN-PRO',
    purchasedProducts: ['Canva Pro 1 Bulan', 'CapCut Pro 1 Bulan'],
    recentOrders: [
      { orderId: 'ORD-881940', product: 'Canva Pro 1 Bulan', amount: 25000, date: '29 Sep 2026', status: 'completed' },
      { orderId: 'ORD-880291', product: 'CapCut Pro 1 Bulan', amount: 35000, date: '12 Sep 2026', status: 'completed' },
    ],
  },
  {
    id: 'cust-3',
    name: 'Farhan Maulana',
    email: 'farhan.m@outlook.com',
    whatsapp: '082199887766',
    tier: 'VIP Platinum',
    totalOrders: 15,
    totalSpent: 1240000,
    lastOrderDate: '02 Okt 2026',
    joinedAt: '20 Jun 2026',
    purchasedProducts: ['ChatGPT Plus 1 Bulan', 'Gemini AI Pro', 'Claude AI Pro Private', 'Office 365 5TB'],
    recentOrders: [
      { orderId: 'ORD-882191', product: 'ChatGPT Plus 1 Bulan', amount: 45000, date: '02 Okt 2026', status: 'completed' },
      { orderId: 'ORD-881880', product: 'Claude AI Pro Private', amount: 95000, date: '25 Sep 2026', status: 'completed' },
    ],
  },
  {
    id: 'cust-4',
    name: 'Siti Rahmawati',
    email: 'siti.rahma@gmail.com',
    whatsapp: '089655443322',
    tier: 'Silver',
    totalOrders: 2,
    totalSpent: 90000,
    lastOrderDate: '26 Sep 2026',
    joinedAt: '24 Sep 2026',
    referralCode: 'RIAN-STREAM',
    purchasedProducts: ['YouTube Premium 3 Bulan'],
    recentOrders: [
      { orderId: 'ORD-881512', product: 'YouTube Premium 3 Bulan', amount: 45000, date: '26 Sep 2026', status: 'completed' },
    ],
  },
];

interface AdminCustomersTabProps {
  onNotify?: (msg: string) => void;
}

export function AdminCustomersTab({ onNotify }: AdminCustomersTabProps) {
  const [customers] = useState<CustomerItem[]>(INITIAL_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);

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
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
              Customer 360 & CRM
            </span>
            <span className="text-[11px] text-foreground-muted">
              Total {customers.length} Pelanggan Terdaftar
            </span>
          </div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Database & Manajemen Pelanggan Toko
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Riwayat akumulasi belanja, tier keanggotaan loyalitas, identitas referral afiliasi, dan kontak langsung pembeli.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onNotify?.('Database kontak pelanggan berhasil diekspor.')}
          className="text-xs border-border"
        >
          Ekspor CSV Pelanggan
        </Button>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
          <span className="text-xs text-foreground-muted block mb-1">Total Pelanggan</span>
          <div className="text-2xl font-bold text-foreground">{customers.length}</div>
          <span className="text-[10px] text-status-success font-semibold">Aktif bertransaksi</span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
          <span className="text-xs text-foreground-muted block mb-1">Repeat Customer Rate</span>
          <div className="text-2xl font-bold text-primary">75.0%</div>
          <span className="text-[10px] text-foreground-muted">Pernah order &gt; 2 kali</span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
          <span className="text-xs text-foreground-muted block mb-1">Average Lifetime Value (LTV)</span>
          <div className="text-2xl font-bold text-foreground">Rp 641.250</div>
          <span className="text-[10px] text-status-success font-semibold">Tinggi (High retention)</span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
          <span className="text-xs text-foreground-muted block mb-1">Dari Jalur Referral Sales</span>
          <div className="text-2xl font-bold text-status-success">75%</div>
          <span className="text-[10px] text-foreground-muted">Attributed to Affiliate</span>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari nama, email, WhatsApp, atau referral..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs bg-surface-raised border-border"
          />
        </div>
        <div className="text-xs text-foreground-muted">
          Menampilkan {filteredCustomers.length} dari {customers.length} akun pembeli
        </div>
      </div>

      {/* 4. Customers Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised/80 border-b border-border text-foreground-muted text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Nama Pelanggan</th>
                <th className="py-3 px-4">Email & Kontak</th>
                <th className="py-3 px-4">Tier Member</th>
                <th className="py-3 px-4 text-center">Total Order</th>
                <th className="py-3 px-4 text-right">Total Belanja</th>
                <th className="py-3 px-4">Referral / Sales</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-surface-raised/40 transition-colors">
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
                          ? 'bg-primary/15 text-primary border-primary/30'
                          : cust.tier === 'Gold Member'
                          ? 'bg-status-warning/15 text-status-warning border-status-warning/30'
                          : 'bg-surface-raised text-foreground-muted border-border'
                      }`}
                    >
                      {cust.tier}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-foreground">
                    {cust.totalOrders} order
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-primary font-mono">
                    Rp {cust.totalSpent.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4">
                    {cust.referralCode ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-status-success/10 text-status-success border border-status-success/25 inline-flex items-center gap-1">
                        <Share2 className="w-3 h-3" />
                        {cust.referralCode}
                      </span>
                    ) : (
                      <span className="text-[11px] text-foreground-muted italic">Langsung (Organic)</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedCustomer(cust)}
                        className="h-7 px-2 text-xs border-border"
                      >
                        Detail 360°
                      </Button>
                      <a
                        href={`https://wa.me/${cust.whatsapp.replace(/\D/g, '')}?text=Halo%20Kak%20${encodeURIComponent(cust.name)},%20dari%20Customer%20Care%20Asterra%20Store`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border border-border text-foreground-muted hover:text-status-success hover:bg-status-success/10 transition-colors"
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

      {/* 5. Customer 360° Profile Modal / Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">{selectedCustomer.name}</h3>
                  <span className="text-[11px] text-foreground-muted font-mono">{selectedCustomer.email}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-foreground-muted hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Overview Grid */}
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-lg bg-surface-raised border border-border">
              <div>
                <span className="text-[10px] text-foreground-muted block">Tier Loyalitas</span>
                <span className="font-bold text-primary">{selectedCustomer.tier}</span>
              </div>
              <div>
                <span className="text-[10px] text-foreground-muted block">Akumulasi Belanja</span>
                <span className="font-bold text-foreground font-mono">Rp {selectedCustomer.totalSpent.toLocaleString('id-ID')}</span>
              </div>
              <div>
                <span className="text-[10px] text-foreground-muted block">Frekuensi Order</span>
                <span className="font-bold text-foreground">{selectedCustomer.totalOrders} Transaksi Lunas</span>
              </div>
              <div>
                <span className="text-[10px] text-foreground-muted block">Asal Referral</span>
                <span className="font-bold text-status-success font-mono">{selectedCustomer.referralCode || 'Organik'}</span>
              </div>
            </div>

            {/* Purchased Products */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-foreground text-xs">Lisensi & Produk yang Pernah Dibeli</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedCustomer.purchasedProducts.map((p, idx) => (
                  <span key={idx} className="px-2 py-1 rounded bg-surface-raised border border-border text-[11px] text-foreground font-medium">
                    ✓ {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Recent Orders Timeline */}
            <div className="space-y-2">
              <h4 className="font-bold text-foreground text-xs">Riwayat Transaksi Terbaru</h4>
              <div className="divide-y divide-border border border-border rounded-lg overflow-hidden bg-surface-raised">
                {selectedCustomer.recentOrders.map((ord) => (
                  <div key={ord.orderId} className="p-2.5 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-mono font-bold text-foreground">{ord.orderId}</span>
                      <span className="text-foreground-muted block text-[10px]">{ord.product} • {ord.date}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-primary font-mono block">Rp {ord.amount.toLocaleString('id-ID')}</span>
                      <Badge variant="outline" className="text-[9px] bg-status-success/15 text-status-success border-status-success/30">
                        {ord.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <a
                href={`https://wa.me/${selectedCustomer.whatsapp.replace(/\D/g, '')}?text=Halo%20Kak%20${encodeURIComponent(selectedCustomer.name)},%20ada%20yang%20bisa%20kami%20bantu%20terkait%20pesanan%20Anda?`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-success text-white hover:bg-status-success/90 font-medium text-xs shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Kirim Pesan WhatsApp Langsung</span>
              </a>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedCustomer(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
