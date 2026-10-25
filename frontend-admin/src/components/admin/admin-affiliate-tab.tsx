'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Share2,
  Users,
  Wallet,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Filter,
  Search,
  MessageSquare,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getStoreBaseUrl } from '@/lib/utils/url';
import { fetchWithRetry } from '@/lib/api-client';

export interface PayoutRequestItem {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  partnerCode: string;
  partnerWhatsapp: string;
  partnerTier?: string;
  amount: number;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  status: 'pending' | 'completed' | 'approved' | 'rejected';
  notes?: string;
  processedAt?: string;
  createdAt: string;
  requestedAt: string;
}

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

  // Payout Queue States
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequestItem[]>([]);
  const [isLoadingPayouts, setIsLoadingPayouts] = useState(true);
  const [payoutFilter, setPayoutFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [selectedPayoutForAction, setSelectedPayoutForAction] = useState<PayoutRequestItem | null>(null);
  const [payoutActionType, setPayoutActionType] = useState<'approve' | 'reject'>('approve');
  const [rejectionNotes, setRejectionNotes] = useState('');

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

  const fetchPayoutRequests = async () => {
    try {
      setIsLoadingPayouts(true);
      const res = await fetchWithRetry('/api/v1/admin/affiliates/payout-requests', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPayoutRequests(json.data);
        }
      }
    } catch (err) {
      console.error('Error fetching payout requests:', err);
    } finally {
      setIsLoadingPayouts(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
    fetchPayoutRequests();

    const handleAutoSync = () => {
      fetchAffiliates();
      fetchPayoutRequests();
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
      await Promise.all([fetchAffiliates(), fetchPayoutRequests()]);
      setSelectedPartnerForPayout(null);
      onNotify?.(json.message || `Pencairan komisi berhasil dicatat.`);
    } catch {
      alert('Terjadi kesalahan saat memproses pencairan komisi.');
    } finally {
      setIsProcessingPayout(false);
    }
  };

  const handleProcessPayoutRequest = async (payout: PayoutRequestItem, action: 'approve' | 'reject') => {
    try {
      setIsProcessingPayout(true);
      const res = await fetch('/api/v1/admin/affiliates/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutRequestId: payout.id,
          action,
          notes: action === 'reject' ? rejectionNotes : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.message || 'Gagal memproses pengajuan pencairan komisi.');
        return;
      }
      await Promise.all([fetchAffiliates(), fetchPayoutRequests()]);
      setSelectedPayoutForAction(null);
      setRejectionNotes('');
      onNotify?.(json.message || `Pengajuan penarikan dana ${payout.id} berhasil diproses.`);
    } catch {
      alert('Terjadi kesalahan koneksi saat memproses pengajuan pencairan komisi.');
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

  const pendingPayoutCount = payoutRequests.filter((p) => p.status === 'pending').length;
  const completedPayoutCount = payoutRequests.filter((p) => p.status === 'completed' || p.status === 'approved').length;
  const rejectedPayoutCount = payoutRequests.filter((p) => p.status === 'rejected').length;

  const filteredPayoutRequests = payoutRequests.filter((p) => {
    if (payoutFilter === 'pending') return p.status === 'pending';
    if (payoutFilter === 'completed') return p.status === 'completed' || p.status === 'approved';
    if (payoutFilter === 'rejected') return p.status === 'rejected';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Antrean Pencairan Dana Komisi Sales (Payout Queue) */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-foreground">Antrean Pencairan Dana Komisi</h3>
                {pendingPayoutCount > 0 && (
                  <span className="bg-amber-500 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                    {pendingPayoutCount} Perlu Ditransfer
                  </span>
                )}
              </div>
              <p className="text-[11px] text-foreground-muted mt-0.5">
                Daftar pengajuan penarikan resmi dari mitra sales yang menunggu verifikasi admin atau telah ditransfer.
              </p>
            </div>
          </div>

          {/* Filter Status Buttons */}
          <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-xl border border-border text-xs">
            <button
              type="button"
              onClick={() => setPayoutFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all text-[11px] ${
                payoutFilter === 'all'
                  ? 'bg-surface text-foreground font-semibold shadow-xs border border-border'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              Semua ({payoutRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setPayoutFilter('pending')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all text-[11px] flex items-center gap-1 ${
                payoutFilter === 'pending'
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold shadow-xs border border-amber-500/30'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-500" />
              Menunggu ({pendingPayoutCount})
            </button>
            <button
              type="button"
              onClick={() => setPayoutFilter('completed')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all text-[11px] flex items-center gap-1 ${
                payoutFilter === 'completed'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs border border-emerald-500/30'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Ditransfer ({completedPayoutCount})
            </button>
            <button
              type="button"
              onClick={() => setPayoutFilter('rejected')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all text-[11px] flex items-center gap-1 ${
                payoutFilter === 'rejected'
                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 font-semibold shadow-xs border border-rose-500/30'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              <AlertCircle className="w-3 h-3 text-rose-500" />
              Ditolak ({rejectedPayoutCount})
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised border-b border-border text-foreground-muted text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 font-semibold">ID & Mitra Sales</th>
                <th className="py-3 px-4 font-semibold">Nominal</th>
                <th className="py-3 px-4 font-semibold">Tujuan Transfer</th>
                <th className="py-3 px-4 font-semibold">Waktu Pengajuan</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingPayouts ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-foreground-muted animate-pulse">
                    Memuat antrean pencairan dana komisi...
                  </td>
                </tr>
              ) : filteredPayoutRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-foreground-muted">
                    <Wallet className="w-7 h-7 mx-auto mb-1.5 opacity-30 text-foreground" />
                    <p className="font-semibold text-foreground text-xs">Tidak Ada Pengajuan Pencairan</p>
                    <p className="text-[11px] text-foreground-muted mt-0.5">
                      {payoutFilter === 'pending'
                        ? 'Tidak ada pengajuan komisi yang menunggu verifikasi saat ini.'
                        : 'Belum ada data pengajuan penarikan komisi pada filter ini.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayoutRequests.map((payout) => {
                  const isPending = payout.status === 'pending';
                  const isCompleted = payout.status === 'completed' || payout.status === 'approved';
                  const isRejected = payout.status === 'rejected';

                  return (
                    <tr key={payout.id} className="hover:bg-surface-raised/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] text-primary font-bold">{payout.id}</div>
                        <div className="font-semibold text-foreground text-xs mt-0.5">{payout.partnerName}</div>
                        <div className="text-[10px] text-foreground-muted font-mono">{payout.partnerCode || payout.partnerEmail}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-xs text-foreground">
                        Rp {payout.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-surface-raised border border-border text-[10px]">
                            {payout.bankName}
                          </span>
                          <span>{payout.bankAccount}</span>
                        </div>
                        <div className="text-[10px] text-foreground-muted mt-0.5">
                          a/n {payout.bankAccountName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground-muted text-[11px]">
                        {payout.createdAt ? (
                          <>
                            <div>{new Date(payout.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            <div className="text-[10px] text-foreground-muted font-mono">{new Date(payout.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</div>
                          </>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3 text-amber-500" />
                            Menunggu Verifikasi
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Ditransfer
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            Ditolak
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPayoutForAction(payout);
                                setPayoutActionType('approve');
                              }}
                              className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-2xs gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Setujui & Transfer</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPayoutForAction(payout);
                                setPayoutActionType('reject');
                                setRejectionNotes('');
                              }}
                              className="h-8 px-2.5 text-xs text-rose-600 border-rose-200/60 hover:bg-rose-50 rounded-xl font-semibold gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Tolak</span>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-foreground-muted font-mono">
                            {payout.processedAt ? new Date(payout.processedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Selesai'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex flex-col gap-3">
          {isLoadingPayouts ? (
            <div className="py-6 text-center text-foreground-muted text-xs animate-pulse">
              Memuat pengajuan pencairan...
            </div>
          ) : filteredPayoutRequests.length === 0 ? (
            <div className="py-6 text-center text-foreground-muted text-xs">
              Tidak ada pengajuan pada filter ini.
            </div>
          ) : (
            filteredPayoutRequests.map((payout) => {
              const isPending = payout.status === 'pending';
              const isCompleted = payout.status === 'completed' || payout.status === 'approved';
              const isRejected = payout.status === 'rejected';

              return (
                <div key={payout.id} className="p-3.5 bg-surface-raised rounded-xl border border-border space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-[10px] text-primary font-bold">{payout.id}</div>
                      <div className="font-semibold text-foreground">{payout.partnerName}</div>
                    </div>
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        Menunggu
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Ditransfer
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                        Ditolak
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-foreground-muted text-[11px]">Nominal:</span>
                    <strong className="text-foreground font-bold">Rp {payout.amount.toLocaleString('id-ID')}</strong>
                  </div>
                  <div className="p-2 bg-surface rounded-lg border border-border/60 font-mono text-[10px] space-y-0.5">
                    <div>{payout.bankName} - {payout.bankAccount}</div>
                    <div className="text-foreground-muted">a/n {payout.bankAccountName}</div>
                  </div>
                  {isPending && (
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedPayoutForAction(payout);
                          setPayoutActionType('approve');
                        }}
                        className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold"
                      >
                        Setujui & Transfer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedPayoutForAction(payout);
                          setPayoutActionType('reject');
                          setRejectionNotes('');
                        }}
                        className="h-8 px-3 text-xs text-rose-600 border-rose-200/60 hover:bg-rose-50 rounded-xl font-semibold"
                      >
                        Tolak
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Div Pencarian Mitra Sales */}
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

      {/* 7. Modal Konfirmasi Payout Komisi (Partner Level) */}
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

      {/* 8. Modal Approval / Penolakan Payout Spesifik */}
      {selectedPayoutForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2">
              {payoutActionType === 'approve' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <h3 className="font-bold text-sm text-foreground">Setujui & Konfirmasi Transfer</h3>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <h3 className="font-bold text-sm text-foreground">Tolak Pengajuan Penarikan</h3>
                </>
              )}
            </div>

            {payoutActionType === 'approve' ? (
              <p className="text-foreground-muted leading-relaxed">
                Anda akan mengonfirmasi bahwa transfer dana komisi sebesar{' '}
                <strong className="text-foreground font-bold font-mono">
                  Rp {selectedPayoutForAction.amount.toLocaleString('id-ID')}
                </strong>{' '}
                telah berhasil ditransfer kepada:
              </p>
            ) : (
              <p className="text-foreground-muted leading-relaxed">
                Pengajuan pencairan sebesar{' '}
                <strong className="text-foreground font-bold font-mono">
                  Rp {selectedPayoutForAction.amount.toLocaleString('id-ID')}
                </strong>{' '}
                akan ditolak dan saldo komisi akan dikembalikan ke saldo mitra:
              </p>
            )}

            <div className="p-3.5 bg-surface-raised rounded-xl border border-border font-mono text-[11px] space-y-1">
              <div>ID: {selectedPayoutForAction.id}</div>
              <div>Mitra: {selectedPayoutForAction.partnerName}</div>
              <div>Bank / E-Wallet: {selectedPayoutForAction.bankName}</div>
              <div>Nomor Rekening: {selectedPayoutForAction.bankAccount}</div>
              <div>Atas Nama: {selectedPayoutForAction.bankAccountName}</div>
            </div>

            {payoutActionType === 'reject' && (
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Alasan Penolakan (Catatan untuk mitra):
                </label>
                <Input
                  placeholder="Contoh: Nomor rekening tidak valid / salah nama"
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  className="bg-surface-raised border-border text-xs rounded-xl h-9"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedPayoutForAction(null)}
                className="rounded-xl h-9 text-xs"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isProcessingPayout}
                onClick={() => handleProcessPayoutRequest(selectedPayoutForAction, payoutActionType)}
                className={`${
                  payoutActionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                } rounded-xl h-9 text-xs font-semibold`}
              >
                {isProcessingPayout
                  ? 'Memproses...'
                  : payoutActionType === 'approve'
                  ? 'Konfirmasi Transfer Berhasil'
                  : 'Tolak Pengajuan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
