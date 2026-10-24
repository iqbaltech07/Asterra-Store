'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Share2,
  Users,
  Wallet,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Plus,
  ArrowUpRight,
  Filter,
  Search,
  MessageSquare,
  ShieldCheck,
  Award,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getStoreBaseUrl } from '@/lib/utils/url';
import { fetchWithRetry } from '@/lib/api-client';

interface AffiliatePartner {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  code: string;
  tier: 'Standard (10%)' | 'VIP Sales (15%)' | 'Executive (20%)';
  rate: number;
  totalClicks: number;
  totalOrders: number;
  totalRevenue: number;
  unpaidCommission: number;
  pendingCommission: number;
  paidCommission: number;
  bankName: string;
  bankAccount: string;
  status: 'active' | 'pending' | 'suspended';
  joinedAt: string;
}

interface AdminAffiliateTabProps {
  onNotify?: (msg: string) => void;
}

export function AdminAffiliateTab({ onNotify }: AdminAffiliateTabProps) {
  const [affiliates, setAffiliates] = useState<AffiliatePartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPartnerForPayout, setSelectedPartnerForPayout] = useState<AffiliatePartner | null>(null);

  const fetchAffiliates = async () => {
    try {
      setIsLoading(true);
      const res = await fetchWithRetry('/api/v1/admin/affiliates', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const mappedData = json.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            whatsapp: p.whatsapp || '-',
            code: p.code,
            tier: p.tier || 'Standard (10%)',
            rate: p.rate || 10,
            totalClicks: p.totalClicks || 0,
            totalOrders: p.totalOrders ?? (p._count?.orders || 0),
            status: p.status || 'active',
            bankName: p.bankName || '-',
            bankAccount: p.bankAccount || '-',
            joinedAt: p.createdAt
              ? new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
              : (p.joinedAt || '-'),
            totalRevenue: Number(p.totalRevenue) || 0,
            unpaidCommission: Number(p.unpaidCommission) || 0,
            pendingCommission: Number(p.pendingCommission) || 0,
            paidCommission: Number(p.paidCommission) || 0,
          }));
          setAffiliates(mappedData);
        }
      }
    } catch (err) {
      console.error('Error fetching affiliates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();

    const handleAutoSync = () => {
      fetchAffiliates();
    };

    window.addEventListener('focus', handleAutoSync);
    window.addEventListener('admin:refresh-affiliates', handleAutoSync);

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        handleAutoSync();
      }
    }, 30000);

    return () => {
      window.removeEventListener('focus', handleAutoSync);
      window.removeEventListener('admin:refresh-affiliates', handleAutoSync);
      clearInterval(timer);
    };
  }, []);

  // New partner form states
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newRate, setNewRate] = useState(10);
  const [newBank, setNewBank] = useState('BCA');
  const [newAccount, setNewAccount] = useState('');

  const copyReferralLink = (code: string) => {
    const url = `${getStoreBaseUrl()}/?ref=${code}`;
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(url);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      onNotify?.(`Tautan referral berhasil disalin: ${url}`);
    }
  };

  const handlePayout = async (partner: AffiliatePartner) => {
    try {
      setIsProcessingPayout(true);
      const res = await fetch('/api/v1/admin/affiliates/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: partner.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.message || 'Gagal memproses pencairan komisi.');
        return;
      }
      await fetchAffiliates();
      setSelectedPartnerForPayout(null);
      onNotify?.(json.message || `Pencairan komisi berhasil dicatat.`);
    } catch {
      alert('Terjadi kesalahan saat memproses pencairan komisi.');
    } finally {
      setIsProcessingPayout(false);
    }
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCode) return;

    if (!newPassword || newPassword.length < 6) {
      alert('Kata sandi akun sales wajib diisi minimal 6 karakter.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/v1/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail || `${newCode.toLowerCase()}@partner.asterra.store`,
          password: newPassword,
          whatsapp: newWhatsapp || '-',
          code: newCode,
          rate: Number(newRate),
          bankName: newBank,
          bankAccount: newAccount || '-',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.message || 'Gagal menambahkan mitra sales.');
        return;
      }

      await fetchAffiliates();
      setIsAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewWhatsapp('');
      setNewCode('');
      setNewAccount('');
      onNotify?.(json.message || `Mitra Afiliasi & Sales ${newName} berhasil ditambahkan!`);
    } catch {
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAffiliates = affiliates.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.code.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  });

  const totalPartners = affiliates.length;
  const totalSalesRevenue = affiliates.reduce((acc, curr) => acc + curr.totalRevenue, 0);
  const totalPaidCommission = affiliates.reduce((acc, curr) => acc + curr.paidCommission, 0);
  const totalUnpaidCommission = affiliates.reduce((acc, curr) => acc + curr.unpaidCommission, 0);
  const totalPendingCommission = affiliates.reduce((acc, curr) => acc + (curr.pendingCommission || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Sales & Growth Engine
            </span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sistem Referral Aktif (30 Hari Attribution)
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            Sistem Afiliasi & Tim Penjualan (Sales)
          </h2>
          <p className="text-xs text-foreground-muted mt-1 max-w-2xl">
            Kelola mitra kreator, agen sales internal, kode referral unik, pembagian bagi hasil (komisi), dan antrean pencairan dana komisi pesanan retail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs gap-1.5 shadow-xs rounded-xl h-9 font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Mitra Sales</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards - Responsive Density */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-foreground-muted">
            <span className="font-semibold truncate">Mitra Sales</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground-muted shrink-0">
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground font-mono tracking-tight">
            {totalPartners}
          </div>
          <span className="text-[10px] sm:text-xs text-foreground-muted block pt-1 border-t border-border/60 truncate">Mitra aktif terdaftar</span>
        </div>

        <div className="bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-foreground-muted">
            <span className="font-semibold truncate">Total Omzet Sales</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-foreground font-mono tracking-tight truncate">
            Rp {totalSalesRevenue.toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] sm:text-xs text-emerald-600 font-medium block pt-1 border-t border-border/60 truncate">Tracking link referral</span>
        </div>

        <div className="bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-foreground-muted">
            <span className="font-semibold truncate">Komisi Tertunda</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-amber-600 font-mono tracking-tight truncate">
            Rp {(totalUnpaidCommission + totalPendingCommission).toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] sm:text-xs text-foreground-muted block pt-1 border-t border-border/60 truncate">
            {totalPendingCommission > 0
              ? `Siap: Rp ${totalUnpaidCommission.toLocaleString('id-ID')}`
              : 'Perlu transfer'}
          </span>
        </div>

        <div className="bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-foreground-muted">
            <span className="font-semibold truncate">Komisi Dicairkan</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 text-primary border border-blue-200/60 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-foreground font-mono tracking-tight truncate">
            Rp {totalPaidCommission.toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] sm:text-xs text-foreground-muted block pt-1 border-t border-border/60 truncate">Telah ditransfer</span>
        </div>
      </div>

      {/* 3. Tier & Aturan Komisi Banner */}
      <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-foreground">
              Skema Tier Otomatis: Standard 10% (1-49 Order) | VIP Sales 15% (≥50 Order) dari Profit Transaksi
            </p>
            <p className="text-foreground-muted text-[11px] mt-0.5">
              Dihitung murni dari profit bersih transaksi (Net Revenue − Biaya Langsung). Mitra otomatis naik ke VIP (15% Profit) setelah membawa 50 order sukses.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-[10px] font-mono border-border bg-surface-raised">
            Attribution: 30 Hari
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono border-border bg-surface-raised">
            Minimal Payout: Rp 50.000
          </Badge>
        </div>
      </div>

      {/* 4. Table Filter & Search */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari nama mitra, kode referral, atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs bg-surface-raised border-border rounded-xl h-10"
          />
        </div>
        <div className="text-xs text-foreground-muted font-mono">
          Menampilkan {filteredAffiliates.length} dari {affiliates.length} mitra sales
        </div>
      </div>

      {/* 5. Affiliates Table & Mobile Card View */}
      <div className="space-y-4">
        {/* Desktop Table View */}
        <div className="hidden md:block bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised border-b border-border text-foreground-muted text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 font-semibold">Mitra Sales</th>
                <th className="py-3 px-4 font-semibold">Kode Referral & Link</th>
                <th className="py-3 px-4 font-semibold">Tier & Rate</th>
                <th className="py-3 px-4 font-semibold text-center">Performa (Order / Klik)</th>
                <th className="py-3 px-4 font-semibold text-right">Omzet Penjualan</th>
                <th className="py-3 px-4 font-semibold text-right">Komisi Tertunda</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-foreground-muted animate-pulse">
                    Memuat data mitra sales resmi...
                  </td>
                </tr>
              ) : filteredAffiliates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-foreground-muted">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-foreground" />
                    <p className="font-semibold text-foreground text-sm">Belum Ada Mitra Sales</p>
                    <p className="text-xs text-foreground-muted mt-1 max-w-sm mx-auto">
                      {searchQuery
                        ? 'Tidak ada mitra sales yang cocok dengan kata kunci pencarian Anda.'
                        : 'Belum ada pendaftar mitra sales. Mitra baru akan otomatis muncul di sini setelah mendaftar di /daftar-sales.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAffiliates.map((partner) => {
                  const isCopied = copiedCode === partner.code;

                  return (
                    <tr key={partner.id} className="hover:bg-surface-raised/60 transition-colors">
                      {/* Partner Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground text-xs">{partner.name}</div>
                        <div className="text-[11px] text-foreground-muted font-mono">{partner.email}</div>
                        <div className="text-[10px] text-foreground-muted font-mono">WA: {partner.whatsapp}</div>
                      </td>

                      {/* Code & Referral Link */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                            {partner.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyReferralLink(partner.code)}
                            className="p-1 rounded-md hover:bg-surface-raised text-foreground-muted hover:text-foreground transition-colors"
                            title="Salin Tautan Referral"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-foreground-muted font-mono block mt-1">
                          ?ref={partner.code}
                        </span>
                      </td>

                      {/* Tier & Rate */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-foreground text-[11px]">{partner.tier}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold block font-mono">
                          {partner.rate}% dari profit
                        </span>
                      </td>

                      {/* Performance */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <div className="font-semibold text-foreground">
                          {partner.totalOrders} order
                        </div>
                        <div className="text-[10px] text-foreground-muted font-sans">
                          {partner.totalClicks} kunjungan
                        </div>
                      </td>

                      {/* Revenue */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-bold text-foreground">
                          Rp {partner.totalRevenue.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-foreground-muted">
                          Cair: Rp {partner.paidCommission.toLocaleString('id-ID')}
                        </div>
                      </td>

                      {/* Unpaid / Pending Commission */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-bold text-amber-600 text-xs">
                          Rp {(partner.unpaidCommission + (partner.pendingCommission || 0)).toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-foreground-muted">
                          {partner.pendingCommission > 0 && partner.unpaidCommission > 0 ? (
                            <span>
                              Siap: Rp {partner.unpaidCommission.toLocaleString('id-ID')}
                            </span>
                          ) : partner.unpaidCommission > 0 ? (
                            <span className="text-emerald-600 font-semibold">
                              Siap Dicairkan
                            </span>
                          ) : (
                            '- - -'
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(partner.unpaidCommission > 0 || (partner.pendingCommission || 0) > 0) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedPartnerForPayout(partner)}
                              className="h-8 text-[11px] px-2.5 rounded-xl text-amber-700 border-amber-200/60 hover:bg-amber-50 font-semibold"
                              title="Proses Pencairan Komisi"
                            >
                              <Wallet className="w-3.5 h-3.5 mr-1" />
                              Bayar Komisi
                            </Button>
                          )}
                          <a
                            href={`https://wa.me/${partner.whatsapp.replace(/\D/g, '')}?text=Halo%20${encodeURIComponent(
                              partner.name
                            )},%20update%20performa%20afiliasi%20Asterra%20Store%20Anda`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl border border-border text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors"
                            title="Hubungi via WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden flex flex-col gap-3.5">
        {isLoading ? (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center text-foreground-muted text-xs animate-pulse">
            Memuat data mitra sales...
          </div>
        ) : filteredAffiliates.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center text-foreground-muted">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-foreground" />
            <p className="font-semibold text-foreground text-xs">Belum Ada Mitra Sales</p>
          </div>
        ) : (
          filteredAffiliates.map((partner) => {
            const isCopied = copiedCode === partner.code;

            return (
              <div
                key={partner.id}
                className="bg-surface border border-border/80 rounded-2xl p-4 space-y-3 shadow-2xs hover:border-border-strong transition-all"
              >
                  {/* Header: Name + Code */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-foreground text-xs truncate">{partner.name}</h4>
                      <span className="text-[10px] text-foreground-muted block font-mono truncate">{partner.email}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-mono font-bold text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                        {partner.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyReferralLink(partner.code)}
                        className="p-1 rounded-md hover:bg-surface-raised text-foreground-muted hover:text-foreground transition-colors"
                        title="Salin Referral"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Tier & Performance Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-surface-raised/40 border border-border/40">
                      <span className="text-[10px] text-foreground-muted block">Tier & Rate</span>
                      <span className="font-semibold text-foreground text-xs block">{partner.tier}</span>
                      <span className="text-[10px] text-emerald-600 font-mono font-medium">{partner.rate}% dari profit</span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-raised/40 border border-border/40">
                      <span className="text-[10px] text-foreground-muted block">Performa</span>
                      <span className="font-bold text-foreground font-mono text-xs block">{partner.totalOrders} order</span>
                      <span className="text-[10px] text-foreground-muted">{partner.totalClicks} klik</span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-raised/40 border border-border/40">
                      <span className="text-[10px] text-foreground-muted block">Omzet Sales</span>
                      <span className="font-bold text-foreground font-mono text-xs block">Rp {partner.totalRevenue.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-medium">Komisi Tertunda</span>
                      <span className="font-bold text-amber-600 font-mono text-xs block">
                        Rp {(partner.unpaidCommission + (partner.pendingCommission || 0)).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    {(partner.unpaidCommission > 0 || (partner.pendingCommission || 0) > 0) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPartnerForPayout(partner)}
                        className="flex-1 h-8 text-xs font-semibold rounded-xl text-amber-700 border-amber-200/60 hover:bg-amber-50"
                      >
                        <Wallet className="w-3.5 h-3.5 mr-1.5" />
                        Bayar Komisi
                      </Button>
                    )}
                    <a
                      href={`https://wa.me/${partner.whatsapp.replace(/\D/g, '')}?text=Halo%20${encodeURIComponent(
                        partner.name
                      )},%20update%20performa%20afiliasi%20Asterra%20Store%20Anda`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 px-3 rounded-xl border border-border text-foreground-muted hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center shrink-0"
                      title="Hubungi via WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 6. Modal Tambah Mitra Sales */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3.5">
              <div>
                <h3 className="font-bold text-sm text-foreground">Tambah Mitra Sales / Afiliasi Baru</h3>
                <p className="text-[11px] text-foreground-muted mt-0.5">
                  Daftarkan kreator, influencer, atau agen sales dengan kode referral unik.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-foreground-muted hover:text-foreground p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPartner} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Nama Mitra / Akun</label>
                <Input
                  required
                  placeholder="Contoh: Aldi Syahputra (Tech Reviewer)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-surface-raised border-border text-xs rounded-xl h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Email</label>
                  <Input
                    type="email"
                    placeholder="aldi@creator.id"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="bg-surface-raised border-border text-xs rounded-xl h-10"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground block mb-1">Nomor WhatsApp</label>
                  <Input
                    placeholder="08123456789"
                    value={newWhatsapp}
                    onChange={(e) => setNewWhatsapp(e.target.value)}
                    className="bg-surface-raised border-border text-xs rounded-xl h-10 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Kata Sandi Akun Sales <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter untuk login mitra"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-surface-raised border-border text-xs rounded-xl h-10 font-mono"
                />
                <span className="text-[10px] text-foreground-muted mt-0.5 block">
                  Digunakan mitra untuk login ke portal sales (/sales/login).
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Kode Referral</label>
                  <Input
                    required
                    placeholder="Contoh: ALDI-VIP"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="bg-surface-raised border-border text-xs font-mono font-bold uppercase rounded-xl h-10"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground block mb-1">Komisi (% Profit)</label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={newRate}
                    onChange={(e) => setNewRate(Number(e.target.value))}
                    className="bg-surface-raised border-border text-xs font-bold rounded-xl h-10 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Rekening Bank / E-Wallet</label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Bank (BCA/Mandiri)"
                    value={newBank}
                    onChange={(e) => setNewBank(e.target.value)}
                    className="bg-surface-raised border-border text-xs col-span-1 rounded-xl h-10"
                  />
                  <Input
                    placeholder="No. Rekening a/n Nama"
                    value={newAccount}
                    onChange={(e) => setNewAccount(e.target.value)}
                    className="bg-surface-raised border-border text-xs col-span-2 rounded-xl h-10 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl h-9 text-xs"
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="rounded-xl h-9 text-xs font-semibold">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan & Buat Mitra'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal Konfirmasi Payout Komisi */}
      {selectedPartnerForPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-amber-600">
              <Wallet className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-foreground">Konfirmasi Pencairan Komisi</h3>
            </div>
            <p className="text-foreground-muted leading-relaxed">
              Anda akan mencatat pembayaran komisi sebesar{' '}
              <strong className="text-foreground font-bold font-mono">
                Rp {(selectedPartnerForPayout.unpaidCommission || selectedPartnerForPayout.pendingCommission || 0).toLocaleString('id-ID')}
              </strong>{' '}
              kepada:
            </p>
            <div className="p-3.5 bg-surface-raised rounded-xl border border-border font-mono text-[11px] space-y-1">
              <div>Penerima: {selectedPartnerForPayout.name}</div>
              <div>Bank: {selectedPartnerForPayout.bankName}</div>
              <div>Rekening: {selectedPartnerForPayout.bankAccount}</div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedPartnerForPayout(null)}
                className="rounded-xl h-9 text-xs"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isProcessingPayout}
                onClick={() => handlePayout(selectedPartnerForPayout)}
                className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl h-9 text-xs font-semibold"
              >
                {isProcessingPayout ? 'Memproses...' : 'Konfirmasi Transfer Berhasil'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
