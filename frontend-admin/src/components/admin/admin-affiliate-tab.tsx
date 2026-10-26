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
  MessageSquare,
  AlertCircle,
  XCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getStoreBaseUrl } from '@/lib/utils/url';
import { fetchWithRetry } from '@/lib/api-client';
import { formatWhatsAppUrl } from '@/lib/utils/format';

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

                  // Resolve WhatsApp phone number for the partner
                  const partner = affiliates.find((a) => a.id === payout.partnerId || a.code === payout.partnerCode);
                  const rawWa = payout.partnerWhatsapp || partner?.whatsapp;
                  const waUrl = formatWhatsAppUrl(
                    rawWa,
                    `Halo ${payout.partnerName}, update pengajuan pencairan komisi Asterra Store ID ${payout.id}`
                  );

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
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending ? (
                            <>
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
                            </>
                          ) : (
                            <span className="text-[11px] text-foreground-muted font-mono">
                              {payout.processedAt ? new Date(payout.processedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Selesai'}
                            </span>
                          )}

                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 px-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all inline-flex items-center gap-1 text-xs font-semibold shrink-0 cursor-pointer shadow-2xs"
                              title="Chat via WhatsApp"
                            >
                              <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                              </svg>
                              <span className="hidden sm:inline">WhatsApp</span>
                            </a>
                          )}
                        </div>
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

              const partner = affiliates.find((a) => a.id === payout.partnerId || a.code === payout.partnerCode);
              const rawWa = payout.partnerWhatsapp || partner?.whatsapp;
              const waUrl = formatWhatsAppUrl(
                rawWa,
                `Halo ${payout.partnerName}, update pengajuan pencairan komisi Asterra Store ID ${payout.id}`
              );

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
                  <div className="flex items-center gap-2 pt-1">
                    {isPending && (
                      <>
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
                      </>
                    )}
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 px-3 rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-[#25D366] hover:text-white transition-all flex items-center justify-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer shadow-2xs"
                        title="Chat via WhatsApp"
                      >
                        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                        </svg>
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 6. Modal Tambah Mitra Sales */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-lg max-h-[calc(100dvh-40px)] flex flex-col shadow-2xl overflow-hidden box-border animate-in zoom-in-95 duration-200">
            {/* Sticky Header */}
            <div className="shrink-0 px-5 py-3.5 border-b border-[#E2E8F0] bg-white flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Tambah Mitra Sales / Afiliasi Baru</h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Daftarkan kreator, influencer, atau agen sales dengan kode referral unik.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="h-8 w-8 p-0 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPartner} className="flex-1 flex flex-col overflow-hidden m-0 p-0">
              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs bg-[#F8FAFC]">
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Nama Mitra / Akun</label>
                    <Input
                      required
                      placeholder="Contoh: Aldi Syahputra (Tech Reviewer)"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-white border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] h-9 px-3 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Email</label>
                      <Input
                        type="email"
                        placeholder="aldi@creator.id"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="bg-white border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] h-9 px-3 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Nomor WhatsApp</label>
                      <Input
                        placeholder="08123456789"
                        value={newWhatsapp}
                        onChange={(e) => setNewWhatsapp(e.target.value)}
                        className="bg-white border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] h-9 px-3 font-mono focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                      Kata Sandi Akun Sales <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="password"
                      required
                      placeholder="Minimal 6 karakter untuk login mitra"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-white border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] h-9 px-3 font-mono focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                    <span className="text-[10px] text-[#64748B] mt-1 block">
                      Digunakan mitra untuk login ke portal sales (/sales/login).
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Kode Referral</label>
                      <Input
                        required
                        placeholder="Contoh: ALDI-VIP"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value)}
                        className="bg-white border-[#E2E8F0] rounded-lg text-xs font-mono font-bold uppercase text-[#0F172A] h-9 px-3 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Komisi (% Profit)</label>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        required
                        value={newRate}
                        onChange={(e) => setNewRate(Number(e.target.value))}
                        className="bg-white border-[#E2E8F0] rounded-lg text-xs font-bold text-[#0F172A] h-9 px-3 font-mono focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">Rekening Bank / E-Wallet</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Input
                        placeholder="Bank (BCA/Mandiri)"
                        value={newBank}
                        onChange={(e) => setNewBank(e.target.value)}
                        className="bg-white border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] h-9 px-3 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                      />
                      <Input
                        placeholder="No. Rekening a/n Nama"
                        value={newAccount}
                        onChange={(e) => setNewAccount(e.target.value)}
                        className="bg-white border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] h-9 px-3 font-mono sm:col-span-2 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="shrink-0 px-4 sm:px-5 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs h-8 px-3.5 border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] rounded-lg cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="text-xs gap-1.5 h-8 px-4 font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan & Buat Mitra'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal Konfirmasi Payout Komisi (Partner Level) */}
      {selectedPartnerForPayout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md max-h-[calc(100dvh-40px)] flex flex-col shadow-2xl overflow-hidden box-border animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="shrink-0 px-5 py-3.5 border-b border-[#E2E8F0] bg-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">Konfirmasi Pencairan Komisi</h3>
                  <p className="text-[11px] text-[#64748B] mt-0.5">Pencatatan transfer komisi mitra sales</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPartnerForPayout(null)}
                className="h-8 w-8 p-0 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs bg-[#F8FAFC]">
              <p className="text-[#64748B] leading-relaxed">
                Anda akan mencatat pembayaran komisi sebesar{' '}
                <strong className="text-[#0F172A] font-bold font-mono">
                  Rp {(selectedPartnerForPayout.unpaidCommission || selectedPartnerForPayout.pendingCommission || 0).toLocaleString('id-ID')}
                </strong>{' '}
                kepada:
              </p>
              <div className="p-3.5 bg-white rounded-xl border border-[#E2E8F0] font-mono text-[11px] space-y-1.5 shadow-2xs">
                <div className="text-[#0F172A] font-medium"><span className="text-[#64748B]">Penerima:</span> {selectedPartnerForPayout.name}</div>
                <div className="text-[#0F172A] font-medium"><span className="text-[#64748B]">Bank:</span> {selectedPartnerForPayout.bankName}</div>
                <div className="text-[#0F172A] font-medium"><span className="text-[#64748B]">Rekening:</span> {selectedPartnerForPayout.bankAccount}</div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 sm:px-5 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedPartnerForPayout(null)}
                className="text-xs h-8 px-3.5 border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] rounded-lg cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isProcessingPayout}
                onClick={() => handlePayout(selectedPartnerForPayout)}
                className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg h-8 px-4 text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isProcessingPayout ? 'Memproses...' : 'Konfirmasi Transfer Berhasil'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal Approval / Penolakan Payout Spesifik */}
      {selectedPayoutForAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md max-h-[calc(100dvh-40px)] flex flex-col shadow-2xl overflow-hidden box-border animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="shrink-0 px-5 py-3.5 border-b border-[#E2E8F0] bg-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {payoutActionType === 'approve' ? (
                  <>
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0F172A]">Setujui & Konfirmasi Transfer</h3>
                      <p className="text-[11px] text-[#64748B] mt-0.5">Verifikasi pembayaran pencairan dana</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0F172A]">Tolak Pengajuan Penarikan</h3>
                      <p className="text-[11px] text-[#64748B] mt-0.5">Saldo akan dikembalikan ke akun mitra</p>
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayoutForAction(null)}
                className="h-8 w-8 p-0 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs bg-[#F8FAFC]">
              {payoutActionType === 'approve' ? (
                <p className="text-[#64748B] leading-relaxed">
                  Anda akan mengonfirmasi bahwa transfer dana komisi sebesar{' '}
                  <strong className="text-[#0F172A] font-bold font-mono">
                    Rp {selectedPayoutForAction.amount.toLocaleString('id-ID')}
                  </strong>{' '}
                  telah berhasil ditransfer kepada:
                </p>
              ) : (
                <p className="text-[#64748B] leading-relaxed">
                  Pengajuan pencairan sebesar{' '}
                  <strong className="text-[#0F172A] font-bold font-mono">
                    Rp {selectedPayoutForAction.amount.toLocaleString('id-ID')}
                  </strong>{' '}
                  akan ditolak dan saldo komisi akan dikembalikan ke saldo mitra:
                </p>
              )}

              <div className="p-3.5 bg-white rounded-xl border border-[#E2E8F0] font-mono text-[11px] space-y-1.5 shadow-2xs">
                <div className="text-[#0F172A] font-medium"><span className="text-[#64748B]">ID:</span> {selectedPayoutForAction.id}</div>
                <div className="text-[#0F172A] font-medium"><span className="text-[#64748B]">Mitra:</span> {selectedPayoutForAction.partnerName}</div>
                <div className="text-[#0F172A] font-medium"><span className="text-[#64748B]">Bank / E-Wallet:</span> {selectedPayoutForAction.bankName}</div>
                <div className="text-[#0F172A] font-medium"><span className="text-[#64748B]">Nomor Rekening:</span> {selectedPayoutForAction.bankAccount}</div>
                <div className="text-[#0F172A] font-medium"><span className="text-[#64748B]">Atas Nama:</span> {selectedPayoutForAction.bankAccountName}</div>
              </div>

              {payoutActionType === 'reject' && (
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                    Alasan Penolakan (Catatan untuk mitra):
                  </label>
                  <Input
                    placeholder="Contoh: Nomor rekening tidak valid / salah nama"
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    className="bg-white border-[#E2E8F0] text-xs rounded-lg text-[#0F172A] h-9 px-3 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 sm:px-5 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedPayoutForAction(null)}
                className="text-xs h-8 px-3.5 border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] rounded-lg cursor-pointer"
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
                } rounded-lg h-8 px-4 text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50`}
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
