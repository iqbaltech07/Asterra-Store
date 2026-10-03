'use client';

import React, { useState, useEffect } from 'react';
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
  paidCommission: number;
  bankName: string;
  bankAccount: string;
  status: 'active' | 'pending' | 'suspended';
  joinedAt: string;
}

const INITIAL_AFFILIATES: AffiliatePartner[] = [];

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
      const res = await fetch('/api/v1/admin/affiliates');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAffiliates(json.data);
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
    const url = `https://asterra.store/?ref=${code}`;
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

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
              Sales & Growth Engine
            </span>
            <span className="flex items-center gap-1 text-[11px] text-status-success font-semibold">
              <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
              Sistem Referral Aktif (30 Hari Attribution)
            </span>
          </div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Sistem Afiliasi & Tim Penjualan (Sales)
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5 max-w-2xl">
            Kelola mitra kreator, agen sales internal, kode referral unik, pembagian bagi hasil (komisi), dan antrean pencairan dana komisi pesanan retail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Mitra Sales</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-2">
            <span>Mitra Sales & Afiliasi</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {totalPartners}
          </div>
          <span className="text-[11px] text-foreground-muted">Mitra aktif terdaftar</span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-2">
            <span>Total Omzet dari Sales</span>
            <TrendingUp className="w-4 h-4 text-status-success" />
          </div>
          <div className="text-2xl font-bold text-status-success">
            Rp {totalSalesRevenue.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-foreground-muted">Dari tracking link referral</span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-2">
            <span>Komisi Menunggu Pencairan</span>
            <Clock className="w-4 h-4 text-status-warning" />
          </div>
          <div className="text-2xl font-bold text-status-warning">
            Rp {totalUnpaidCommission.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-foreground-muted">Perlu diproses transfer</span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-2">
            <span>Komisi Selesai Dicairkan</span>
            <CheckCircle2 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-primary">
            Rp {totalPaidCommission.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-foreground-muted">Telah ditransfer ke rekening</span>
        </div>
      </div>

      {/* 3. Tier & Aturan Komisi Banner */}
      <div className="bg-surface-raised/60 border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              Skema Tier Otomatis: Standard 10% (1-49 Order) | VIP Sales 15% (≥50 Order) dari Profit Transaksi
            </p>
            <p className="text-foreground-muted text-[11px]">
              Dihitung murni dari profit bersih transaksi (Net Revenue − Biaya Langsung). Mitra otomatis naik ke VIP (15% Profit) setelah membawa 50 order sukses.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-[10px] font-mono border-border">
            Attribution: 30 Hari
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono border-border">
            Minimal Payout: Rp 50.000
          </Badge>
        </div>
      </div>

      {/* 4. Table Filter & Search */}
      <div className="bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari nama mitra, kode referral, atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs bg-surface-raised border-border"
          />
        </div>
        <div className="text-xs text-foreground-muted flex items-center gap-2">
          <span>Menampilkan {filteredAffiliates.length} dari {affiliates.length} mitra sales</span>
        </div>
      </div>

      {/* 5. Affiliates Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised/80 border-b border-border text-foreground-muted text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Mitra Sales</th>
                <th className="py-3 px-4">Kode Referral & Link</th>
                <th className="py-3 px-4">Tier & Rate</th>
                <th className="py-3 px-4 text-center">Performa (Klik / Order)</th>
                <th className="py-3 px-4 text-right">Omzet Penjualan</th>
                <th className="py-3 px-4 text-right">Komisi Tertunda</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-foreground-muted">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Memuat data mitra sales resmi...</span>
                    </div>
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
                        : 'Belum ada pendaftar mitra sales. Mitra baru akan otomatis muncul di sini secara real-time setelah mendaftar di halaman publik /daftar-sales.'}
                    </p>
                    {!searchQuery && (
                      <Button
                        size="sm"
                        onClick={() => setIsAddModalOpen(true)}
                        className="mt-3 text-xs gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Mitra Pertama</span>
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAffiliates.map((partner) => {
                  const isCopied = copiedCode === partner.code;

                return (
                  <tr key={partner.id} className="hover:bg-surface-raised/40 transition-colors">
                    {/* Partner Details */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-foreground text-xs">{partner.name}</div>
                      <div className="text-[11px] text-foreground-muted font-mono">{partner.email}</div>
                      <div className="text-[10px] text-foreground-muted">WA: {partner.whatsapp}</div>
                    </td>

                    {/* Code & Referral Link */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                          {partner.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyReferralLink(partner.code)}
                          className="p-1 rounded hover:bg-surface-raised text-foreground-muted hover:text-foreground transition-colors"
                          title="Salin Tautan Referral"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-status-success" />
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
                      <span className="text-[10px] text-status-success font-semibold block">
                        {partner.rate}% dari profit
                      </span>
                    </td>

                    {/* Performance */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="font-semibold text-foreground">
                        {partner.totalOrders} order
                      </div>
                      <div className="text-[10px] text-foreground-muted">
                        {partner.totalClicks} kunjungan link
                      </div>
                    </td>

                    {/* Revenue */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-foreground">
                        Rp {partner.totalRevenue.toLocaleString('id-ID')}
                      </div>
                      <div className="text-[10px] text-foreground-muted">
                        Sudah cair: Rp {partner.paidCommission.toLocaleString('id-ID')}
                      </div>
                    </td>

                    {/* Unpaid Commission */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-status-warning text-xs">
                        Rp {partner.unpaidCommission.toLocaleString('id-ID')}
                      </div>
                      <div className="text-[10px] text-foreground-muted font-mono">
                        {partner.bankName} - {partner.bankAccount}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {partner.unpaidCommission > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPartnerForPayout(partner)}
                            className="h-7 text-[11px] px-2 text-status-warning border-status-warning/40 hover:bg-status-warning/10"
                          >
                            <Wallet className="w-3 h-3 mr-1" />
                            Bayar Komisi
                          </Button>
                        )}
                        <a
                          href={`https://wa.me/${partner.whatsapp.replace(/\D/g, '')}?text=Halo%20${encodeURIComponent(
                            partner.name
                          )},%20update%20performa%20afiliasi%20Asterra%20Store%20Anda`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors"
                          title="Hubungi via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Modal Tambah Mitra Sales */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-sm text-foreground">Tambah Mitra Sales / Afiliasi Baru</h3>
                <p className="text-[11px] text-foreground-muted">
                  Daftarkan kreator, influencer, atau tim sales internal dengan kode referral unik.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-foreground-muted hover:text-foreground p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPartner} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Nama Mitra / Akun</label>
                <Input
                  required
                  placeholder="Contoh: Aldi Syahputra (Tech Reviewer)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-surface-raised border-border text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Email</label>
                  <Input
                    type="email"
                    placeholder="aldi@creator.id"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="bg-surface-raised border-border text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground block mb-1">Nomor WhatsApp</label>
                  <Input
                    placeholder="08123456789"
                    value={newWhatsapp}
                    onChange={(e) => setNewWhatsapp(e.target.value)}
                    className="bg-surface-raised border-border text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Kata Sandi Akun Sales <span className="text-status-error">*</span>
                </label>
                <Input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter untuk login mitra"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-surface-raised border-border text-xs"
                />
                <span className="text-[10px] text-foreground-muted mt-0.5 block">
                  Digunakan mitra untuk login ke portal sales (/sales/login).
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Kode Referral</label>
                  <Input
                    required
                    placeholder="Contoh: ALDI-VIP"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="bg-surface-raised border-border text-xs font-mono font-bold uppercase"
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
                    className="bg-surface-raised border-border text-xs font-bold"
                  />
                  <span className="text-[10px] text-foreground-muted block mt-0.5">
                    Standar model: 10% dari Profit Transaksi
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Rekening Bank / E-Wallet</label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Bank (BCA/Mandiri)"
                    value={newBank}
                    onChange={(e) => setNewBank(e.target.value)}
                    className="bg-surface-raised border-border text-xs col-span-1"
                  />
                  <Input
                    placeholder="No. Rekening a/n Nama"
                    value={newAccount}
                    onChange={(e) => setNewAccount(e.target.value)}
                    className="bg-surface-raised border-border text-xs col-span-2"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" size="sm">
                  Simpan & Buat Tautan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal Konfirmasi Payout Komisi */}
      {selectedPartnerForPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-status-warning">
              <Wallet className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-foreground">Konfirmasi Pencairan Komisi</h3>
            </div>
            <p className="text-foreground-muted">
              Anda akan mencatat pembayaran komisi sebesar{' '}
              <strong className="text-foreground font-bold">
                Rp {selectedPartnerForPayout.unpaidCommission.toLocaleString('id-ID')}
              </strong>{' '}
              kepada:
            </p>
            <div className="p-3 bg-surface-raised rounded-lg border border-border font-mono text-[11px] space-y-1">
              <div>Penerima: {selectedPartnerForPayout.name}</div>
              <div>Bank: {selectedPartnerForPayout.bankName}</div>
              <div>Rekening: {selectedPartnerForPayout.bankAccount}</div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedPartnerForPayout(null)}
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handlePayout(selectedPartnerForPayout)}
                className="bg-status-success text-white hover:bg-status-success/90"
              >
                Konfirmasi Transfer Berhasil
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
