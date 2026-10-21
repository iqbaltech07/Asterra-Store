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
} from 'lucide-react';
import { SalesProfileData } from '../types';

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Dompet & Pencairan Komisi</h2>
        <p className="text-xs text-foreground-muted">
          Cairkan saldo komisi yang berhasil Anda kumpulkan ke rekening bank atau e-wallet Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Balance Cards */}
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-muted">Saldo Siap Ditarik (Final)</span>
              <div className="w-7 h-7 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-status-success tracking-tight">
              Rp {(partner?.unpaidCommission || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-foreground-muted pt-1">
              Minimal penarikan: <strong className="text-foreground">Rp 50.000</strong> (Tersedia ditarik sekarang)
            </p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-muted">Saldo Masa Garansi (Holding 3 Hari)</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-500 tracking-tight">
              Rp {(partner?.pendingCommission || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-foreground-muted pt-1">
              Dana komisi pesanan baru selama masa garansi pembeli 3 hari. Otomatis cair ke saldo siap tarik.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-muted">Total Komisi Telah Dicairkan</span>
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground tracking-tight">
              Rp {(partner?.paidCommission || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-foreground-muted pt-1">
              Semua transaksi transfer diproses oleh tim keuangan Asterra Store.
            </p>
          </div>
        </div>

        {/* Payout Request Form */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span>Formulir Pengajuan Penarikan Saldo</span>
            </h3>
            {partner?.status !== 'active' && (
              <Badge variant="outline" className="text-status-error border-status-error/30 bg-status-error/10 text-[10px]">
                Akun Tidak Aktif
              </Badge>
            )}
          </div>

          {partner?.pendingCommission && partner.pendingCommission > 0 ? (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-500 text-xs flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                Terdapat <strong>Rp {partner.pendingCommission.toLocaleString('id-ID')}</strong> dalam masa garansi 3 hari. Saldo tersebut akan otomatis dapat ditarik setelah masa garansi produk berakhir.
              </span>
            </div>
          ) : null}

          {payoutSuccessMsg && (
            <div className="p-3.5 rounded-lg bg-status-success/15 border border-status-success/30 text-status-success text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{payoutSuccessMsg}</span>
            </div>
          )}

          {payoutErrorMsg && (
            <div className="p-3.5 rounded-lg bg-status-error/15 border border-status-error/30 text-status-error text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
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
                <label className="font-semibold text-foreground block mb-1">Pilih Bank / E-Wallet:</label>
                <select
                  value={payoutBank}
                  onChange={(e) => setPayoutBank(e.target.value)}
                  className="w-full bg-surface-raised border border-border rounded-lg text-xs p-2.5 text-foreground"
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

              <div>
                <label className="font-semibold text-foreground block mb-1">Nominal Penarikan (Rp):</label>
                <Input
                  type="number"
                  required
                  min={50000}
                  max={partner?.unpaidCommission || 0}
                  placeholder="Contoh: 100000"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="bg-surface-raised border-border text-xs h-10 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-foreground block mb-1">Nomor Rekening / No. E-Wallet:</label>
                <Input
                  type="text"
                  required
                  placeholder="Contoh: 8965123456"
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value)}
                  className="bg-surface-raised border-border text-xs h-10 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Nama Pemilik Rekening:</label>
                <Input
                  type="text"
                  required
                  placeholder="Contoh: Andi Pratama"
                  value={payoutHolder}
                  onChange={(e) => setPayoutHolder(e.target.value)}
                  className="bg-surface-raised border-border text-xs h-10"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Catatan Tambahan (Opsional):</label>
              <Input
                type="text"
                placeholder="Catatan untuk bagian finance..."
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                className="bg-surface-raised border-border text-xs h-10"
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
              className="w-full text-xs font-bold h-10 gap-2 shadow-sm"
            >
              {payoutMutation.isPending ? (
                <span>Mengirim Pengajuan...</span>
              ) : (
                <>
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Ajukan Penarikan Dana Sekarang</span>
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Payout History Table */}
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-bold text-sm text-foreground">Riwayat Pengajuan Penarikan Komisi</h3>
        </div>
        {(partner?.payoutRequests || []).length === 0 ? (
          <div className="p-8 text-center text-xs text-foreground-muted">
            Belum ada histori pengajuan penarikan dana.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-raised border-b border-border text-foreground-muted font-medium">
                <tr>
                  <th className="py-3 px-4">Tanggal Pengajuan</th>
                  <th className="py-3 px-4">Tujuan Transfer</th>
                  <th className="py-3 px-4">Nominal</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(partner?.payoutRequests || []).map((req) => (
                  <tr key={req.id}>
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
                    <td className="py-3 px-4 font-bold text-foreground">
                      Rp {req.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold uppercase ${
                          req.status === 'completed'
                            ? 'text-status-success border-status-success/30 bg-status-success/10'
                            : req.status === 'rejected'
                            ? 'text-status-error border-status-error/30 bg-status-error/10'
                            : 'text-amber-500 border-amber-500/30 bg-amber-500/10'
                        }`}
                      >
                        {req.status === 'completed'
                          ? 'Selesai Ditransfer'
                          : req.status === 'rejected'
                          ? 'Ditolak'
                          : 'Diproses Tim Finance'}
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
  );
}
