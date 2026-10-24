'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building2,
} from 'lucide-react';
import { SalesProfileData } from '../types';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { AnimatedProgressBar } from '@/components/ui/animated-progress-bar';
import { StatusBadge } from '@/components/ui/status-badge';

interface SalesWalletTabProps {
  partner: SalesProfileData | null | undefined;
  onRefetchProfile?: () => void;
}

export function SalesWalletTab({ partner, onRefetchProfile }: SalesWalletTabProps) {
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutBank, setPayoutBank] = useState('BCA');
  const [payoutAccount, setPayoutAccount] = useState(partner?.bankAccount || '');
  const [payoutHolder, setPayoutHolder] = useState(partner?.name || '');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);
  const [payoutErrorMsg, setPayoutErrorMsg] = useState<string | null>(null);

  const payoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/partners/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(payoutAmount),
          bankName: payoutBank,
          bankAccount: payoutAccount,
          bankAccountName: payoutHolder,
          notes: payoutNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengajukan penarikan');
      return data;
    },
    onSuccess: (data) => {
      setPayoutSuccessMsg(data.message || 'Pengajuan penarikan dana berhasil dikirim.');
      setPayoutErrorMsg(null);
      setPayoutAmount('');
      setPayoutNotes('');
      onRefetchProfile?.();
    },
    onError: (err: Error) => {
      setPayoutErrorMsg(err.message || 'Terjadi kesalahan sistem.');
      setPayoutSuccessMsg(null);
    },
  });

  const unpaid = partner?.unpaidCommission || 0;
  const pending = partner?.pendingCommission || 0;
  const totalAvailableHolding = unpaid + pending;
  const readyPercentage = totalAvailableHolding > 0 ? Math.round((unpaid / totalAvailableHolding) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Dompet & Pencairan Komisi</h2>
        <p className="text-xs text-foreground-muted mt-1">
          Cairkan saldo komisi yang berhasil Anda kumpulkan ke rekening bank atau e-wallet resmi Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Balance Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-4">
          <div className="col-span-2 bg-surface border border-border rounded-2xl p-4 sm:p-6 shadow-xs space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-foreground-muted">Saldo Siap Ditarik (Final)</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#16A36A] tracking-tight font-mono">
              <AnimatedNumber
                value={unpaid}
                prefix="Rp "
                className="text-2xl sm:text-3xl font-extrabold text-[#16A36A] tracking-tight font-mono"
              />
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] sm:text-xs text-foreground-muted">
              <span>Minimal penarikan:</span>
              <strong className="text-foreground font-mono">Rp 50.000</strong>
            </div>
          </div>

          <div className="col-span-1 bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-6 shadow-xs space-y-1.5 sm:space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-foreground-muted truncate">Masa Garansi (3 Hari)</span>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-amber-600 tracking-tight font-mono">
              <AnimatedNumber
                value={pending}
                prefix="Rp "
                className="text-lg sm:text-2xl font-bold text-amber-600 tracking-tight font-mono"
              />
            </div>
            <p className="text-[10px] sm:text-xs text-foreground-muted pt-1.5 border-t border-border leading-tight">
              Otomatis cair setelah proteksi selesai.
            </p>
          </div>

          <div className="col-span-1 bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-6 shadow-xs space-y-1.5 sm:space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-foreground-muted truncate">Telah Dicairkan</span>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-xl bg-foreground/5 text-foreground flex items-center justify-center border border-border shrink-0">
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-foreground tracking-tight font-mono">
              <AnimatedNumber
                value={partner?.paidCommission || 0}
                prefix="Rp "
                className="text-lg sm:text-2xl font-bold text-foreground tracking-tight font-mono"
              />
            </div>
            <p className="text-[10px] sm:text-xs text-foreground-muted pt-1.5 border-t border-border leading-tight">
              Transfer resmi tim finance.
            </p>
          </div>

          {/* Saldo Siap Tarik vs Tertahan Garansi Proportion Bar */}
          <div className="col-span-2 bg-surface border border-border rounded-xl p-3.5 sm:p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground text-[11px] sm:text-xs">Rasio Likuiditas Komisi</span>
              <span className="font-mono text-status-success font-bold text-[11px] sm:text-xs">{readyPercentage}% Siap Tarik</span>
            </div>
            <AnimatedProgressBar value={readyPercentage} barClassName="bg-status-success" />
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-foreground-muted font-mono">
              <span>Siap: Rp {unpaid.toLocaleString('id-ID')}</span>
              <span>Tertahan: Rp {pending.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Payout Request Form */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Formulir Pengajuan Penarikan Saldo</h3>
                <p className="text-xs text-foreground-muted">Dana ditransfer dalam waktu 1x24 jam kerja</p>
              </div>
            </div>
            {partner?.status !== 'active' && (
              <Badge variant="outline" className="text-rose-700 border-rose-200/60 bg-rose-50 text-[10px]">
                Akun Tidak Aktif
              </Badge>
            )}
          </div>

          {partner?.pendingCommission && partner.pendingCommission > 0 ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-800 text-xs flex items-center gap-2.5">
              <Clock className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Terdapat <strong className="font-mono">Rp {partner.pendingCommission.toLocaleString('id-ID')}</strong> dalam masa garansi 3 hari. Saldo otomatis pindah ke saldo siap ditarik setelah masa proteksi produk selesai.
              </span>
            </div>
          ) : null}

          {payoutSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{payoutSuccessMsg}</span>
            </div>
          )}

          {payoutErrorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/60 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{payoutErrorMsg}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              payoutMutation.mutate();
            }}
            className="space-y-4 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-foreground block mb-1.5">Pilih Bank / E-Wallet:</label>
                <div className="relative">
                  <select
                    value={payoutBank}
                    onChange={(e) => setPayoutBank(e.target.value)}
                    className="w-full bg-surface-raised border border-border rounded-xl text-xs p-3 text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
                  >
                    <option value="BCA">BCA (Bank Central Asia)</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BNI">BNI (Bank Negara Indonesia)</option>
                    <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                    <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                    <option value="DANA">DANA (E-Wallet)</option>
                    <option value="GoPay">GoPay (E-Wallet)</option>
                    <option value="OVO">OVO (E-Wallet)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1.5">Nominal Penarikan (Rp):</label>
                <Input
                  type="number"
                  required
                  min={50000}
                  max={partner?.unpaidCommission || 0}
                  placeholder="Contoh: 100000"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="bg-surface-raised border-border text-xs h-10 font-mono rounded-xl"
                />
                {/* Quick Nominal Chips for fast 1-tap mobile entry */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] text-foreground-muted font-medium mr-0.5">Cepat:</span>
                  {[50000, 100000, 250000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      disabled={unpaid < amt}
                      onClick={() => setPayoutAmount(String(amt))}
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        Number(payoutAmount) === amt
                          ? 'bg-primary text-white border-primary font-bold'
                          : unpaid >= amt
                          ? 'bg-surface-raised border-border text-foreground hover:bg-surface'
                          : 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                      }`}
                    >
                      {amt >= 1000 ? `${amt / 1000}rb` : amt}
                    </button>
                  ))}
                  {unpaid >= 50000 && (
                    <button
                      type="button"
                      onClick={() => setPayoutAmount(String(unpaid))}
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        Number(payoutAmount) === unpaid
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-emerald-50 border-emerald-200/80 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      Semua Saldo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-foreground block mb-1.5">Nomor Rekening / No. E-Wallet:</label>
                <Input
                  type="text"
                  required
                  placeholder="Contoh: 8965123456"
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value)}
                  className="bg-surface-raised border-border text-xs h-10 font-mono rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1.5">Nama Pemilik Rekening:</label>
                <Input
                  type="text"
                  required
                  placeholder="Contoh: Andi Pratama"
                  value={payoutHolder}
                  onChange={(e) => setPayoutHolder(e.target.value)}
                  className="bg-surface-raised border-border text-xs h-10 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1.5">Catatan Tambahan (Opsional):</label>
              <Input
                type="text"
                placeholder="Catatan untuk bagian finance..."
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                className="bg-surface-raised border-border text-xs h-10 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={
                payoutMutation.isPending ||
                !partner ||
                partner.status !== 'active' ||
                (partner.unpaidCommission || 0) < 50000 ||
                !payoutAccount ||
                !payoutHolder
              }
              className="w-full text-xs font-bold h-11 gap-2 shadow-xs rounded-xl"
            >
              {payoutMutation.isPending ? (
                <span>Mengirim Pengajuan...</span>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>Ajukan Penarikan Dana Sekarang</span>
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Payout History Table */}
      <div className="bg-surface border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Riwayat Pengajuan Penarikan Komisi</h3>
          </div>
          <span className="text-xs text-foreground-muted font-mono">
            {partner?.payoutRequests?.length || 0} Pengajuan
          </span>
        </div>
        {(partner?.payoutRequests || []).length === 0 ? (
          <div className="p-10 text-center text-xs text-foreground-muted">
            Belum ada histori pengajuan penarikan dana.
          </div>
        ) : (
          <>
            {/* Mobile View: Compact Cards (md:hidden) */}
            <div className="md:hidden divide-y divide-border">
              {(partner?.payoutRequests || []).map((req, idx) => (
                <div
                  key={req.id}
                  className="p-3.5 space-y-2 hover:bg-surface-raised/40 transition-colors animate-fade-up"
                  style={{ animationDelay: `${Math.min(idx, 10) * 40}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">{req.bankName}</span>
                    <StatusBadge status={req.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-extrabold text-sm text-[#16A36A]">
                      Rp {req.amount.toLocaleString('id-ID')}
                    </span>
                    <span className="font-mono text-[11px] text-foreground-muted">
                      {new Date(req.requestedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="text-[11px] text-foreground-muted font-mono">
                    Rek. {req.bankAccount} a.n <span className="text-foreground font-semibold">{req.bankAccountName}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-raised border-b border-border text-foreground-muted font-medium">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Tanggal Pengajuan</th>
                    <th className="py-3 px-4 font-semibold">Tujuan Transfer</th>
                    <th className="py-3 px-4 font-semibold">Nominal</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(partner?.payoutRequests || []).map((req, idx) => (
                    <tr
                      key={req.id}
                      className="hover:bg-surface-raised/60 transition-colors animate-fade-up"
                      style={{ animationDelay: `${Math.min(idx, 10) * 40}ms` }}
                    >
                      <td className="py-3 px-4 font-mono text-[11px] text-foreground-muted">
                        {new Date(req.requestedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        <span className="font-bold">{req.bankName}</span> ({req.bankAccount} a.n {req.bankAccountName})
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground font-mono">
                        Rp {req.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={req.status} />
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
  );
}
