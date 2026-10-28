'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { maskCustomerName } from '@/lib/utils/masking';

interface RefundTicket {
  id: string;
  orderId: string;
  customerName: string;
  customerWhatsapp: string;
  product: string;
  amount: number;
  reason: string;
  status: 'Pending' | 'Reviewing' | 'Approved' | 'Rejected' | 'Resolved';
  submittedAt: string;
  internalNote?: string;
}

const INITIAL_TICKETS: RefundTicket[] = [
  {
    id: 'TCK-2026-091',
    orderId: 'ORD-881940',
    customerName: 'Dewi Lestari',
    customerWhatsapp: '085712345678',
    product: 'Canva Pro 1 Bulan Private',
    amount: 25000,
    reason: 'Akun Canva terkena limit invite tim dari sistem Canva.',
    status: 'Reviewing',
    submittedAt: 'Hari ini, 09:15',
    internalNote: 'Sudah dihubungi via WA. Sedang disiapkan akun replacement baru.',
  },
  {
    id: 'TCK-2026-089',
    orderId: 'ORD-881023',
    customerName: 'Budi Santoso',
    customerWhatsapp: '081234567890',
    product: 'Gemini AI Pro 1 Tahun',
    amount: 31000,
    reason: 'Koneksi akun Google workspace domain butuh reverifikasi password.',
    status: 'Resolved',
    submittedAt: 'Kemarin, 14:30',
    internalNote: 'Akun pengganti sukses dikirim dan diverifikasi buyer.',
  },
  {
    id: 'TCK-2026-085',
    orderId: 'ORD-880199',
    customerName: 'Andi Saputra',
    customerWhatsapp: '081399881122',
    product: 'Netflix UHD 1 Bulan',
    amount: 32000,
    reason: 'Salah pilih paket durasi oleh pembeli, minta pembatalan saldo.',
    status: 'Pending',
    submittedAt: 'Kemarin, 18:20',
    internalNote: '',
  },
];

interface AdminRefundsTabProps {
  onNotify?: (msg: string) => void;
}

export function AdminRefundsTab({ onNotify }: AdminRefundsTabProps) {
  const [tickets, setTickets] = useState<RefundTicket[]>(INITIAL_TICKETS);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Reviewing' | 'Approved' | 'Rejected' | 'Resolved'>('All');
  const [selectedTicket, setSelectedTicket] = useState<RefundTicket | null>(null);
  const [internalNoteInput, setInternalNoteInput] = useState('');

  const handleUpdateStatus = (ticketId: string, newStatus: RefundTicket['status']) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return { ...t, status: newStatus, internalNote: internalNoteInput || t.internalNote };
        }
        return t;
      })
    );
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket((prev) => prev ? { ...prev, status: newStatus, internalNote: internalNoteInput || prev.internalNote } : null);
    }
    onNotify?.(`Tiket ${ticketId} berhasil diubah ke status: ${newStatus}`);
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'All') return true;
    return t.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Issue Resolution Center
            </span>
            <span className="text-xs text-foreground-muted font-mono">
              Garansi Kepuasan Lisensi Digital 100%
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            Penanganan Komplain, Garansi & Refund Dana
          </h2>
          <p className="text-xs text-foreground-muted mt-1">
            Tinjau klaim garansi pembeli, verifikasi kendala akun, kirim akun pengganti baru, atau setujui pengembalian dana konsumen.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-emerald-700 bg-emerald-50 border-emerald-200/60 font-semibold px-3 py-1 rounded-full font-mono">
            {tickets.filter((t) => t.status === 'Resolved').length} Tiket Selesai
          </Badge>
        </div>
      </div>

      {/* 2. Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {(['All', 'Pending', 'Reviewing', 'Approved', 'Rejected', 'Resolved'] as const).map((st) => {
          const count = st === 'All' ? tickets.length : tickets.filter((t) => t.status === st).length;

          return (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                statusFilter === st
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-surface border border-border text-foreground-muted hover:text-foreground'
              }`}
            >
              <span>{st === 'All' ? 'Semua Status' : st}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                statusFilter === st ? 'bg-white/20 text-white' : 'bg-surface-raised text-foreground-muted'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Tickets Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised border-b border-border text-foreground-muted text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 font-semibold">ID Tiket & Waktu</th>
                <th className="py-3 px-4 font-semibold">Pelanggan</th>
                <th className="py-3 px-4 font-semibold">Produk & Nilai</th>
                <th className="py-3 px-4 font-semibold">Alasan Komplain</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTickets.map((t) => (
                <tr key={t.id} className="hover:bg-surface-raised/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono">
                    <span className="font-bold text-foreground text-xs block">{t.id}</span>
                    <span className="text-[10px] text-foreground-muted block">{t.submittedAt}</span>
                    <span className="text-[10px] text-primary block mt-0.5">{t.orderId}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-foreground text-xs block">{maskCustomerName(t.customerName)}</span>
                    <span className="text-[10px] text-foreground-muted font-mono">{t.customerWhatsapp}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-foreground block">{t.product}</span>
                    <span className="font-bold text-foreground font-mono text-[11px]">Rp {t.amount.toLocaleString('id-ID')}</span>
                  </td>
                  <td className="py-3.5 px-4 text-foreground-muted max-w-[260px] truncate leading-relaxed">
                    {t.reason}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold uppercase ${
                        t.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                          : t.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                          : t.status === 'Approved'
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : t.status === 'Reviewing'
                          ? 'bg-blue-50 text-blue-700 border-blue-200/60'
                          : 'bg-rose-50 text-rose-700 border-rose-200/60'
                      }`}
                    >
                      {t.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTicket(t);
                          setInternalNoteInput(t.internalNote || '');
                        }}
                        className="h-8 px-2.5 text-xs border-border rounded-xl font-semibold"
                      >
                        Kelola Tiket
                      </Button>
                      <a
                        href={`https://wa.me/${t.customerWhatsapp.replace(/\D/g, '')}?text=Halo%20Kak%20${encodeURIComponent(t.customerName)},%20Customer%20Support%20Asterra%20Store%20terkait%20tiket%20${t.id}`}
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

      {/* 4. Modal Penanganan Tiket */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-lg max-h-[calc(100dvh-40px)] flex flex-col shadow-2xl overflow-hidden box-border animate-in zoom-in-95 duration-200">
            {/* Sticky Header */}
            <div className="shrink-0 px-5 py-3.5 border-b border-[#E2E8F0] bg-white flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Kelola Tiket Garansi: {selectedTicket.id}</h3>
                <p className="text-[11px] text-[#64748B] font-mono mt-0.5">Pesanan: {selectedTicket.orderId}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="h-8 w-8 p-0 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs bg-[#F8FAFC]">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B] font-medium">Pelanggan:</span>
                  <span className="font-bold text-[#0F172A]">{maskCustomerName(selectedTicket.customerName)} ({selectedTicket.customerWhatsapp})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B] font-medium">Produk:</span>
                  <span className="font-bold text-[#0F172A]">{selectedTicket.product}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B] font-medium">Nilai Transaksi:</span>
                  <span className="font-bold text-[#0F172A] font-mono">Rp {selectedTicket.amount.toLocaleString('id-ID')}</span>
                </div>
                <div className="pt-2 border-t border-[#E2E8F0]">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">Keluhan Konsumen</span>
                  <p className="text-[#0F172A] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] leading-relaxed">
                    {selectedTicket.reason}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-2">
                <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">Catatan Internal / Solusi Tiket</label>
                <Input
                  type="text"
                  placeholder="Catatan penanganan (contoh: Akun baru telah dikirim via WA)"
                  value={internalNoteInput}
                  onChange={(e) => setInternalNoteInput(e.target.value)}
                  className="bg-white border-[#E2E8F0] text-xs rounded-lg text-[#0F172A] h-9 px-3 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="shrink-0 px-4 sm:px-5 py-3 border-t border-[#E2E8F0] bg-white flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedTicket(null)}
                className="text-xs h-8 px-3 border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] rounded-lg cursor-pointer"
              >
                Tutup
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleUpdateStatus(selectedTicket.id, 'Reviewing')}
                className="text-xs h-8 px-3 border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] rounded-lg cursor-pointer"
              >
                Sedang Ditinjau
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleUpdateStatus(selectedTicket.id, 'Approved')}
                className="text-xs h-8 px-3 border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] rounded-lg cursor-pointer font-medium"
              >
                Setujui Garansi
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleUpdateStatus(selectedTicket.id, 'Resolved')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-8 px-3.5 text-xs font-semibold shadow-xs cursor-pointer"
              >
                Selesai (Resolved)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
