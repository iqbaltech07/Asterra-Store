'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  MessageSquare,
  ShieldCheck,
  RotateCcw,
  Check,
  X,
  FileText,
  CreditCard,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
              Issue Resolution Center
            </span>
            <span className="text-[11px] text-foreground-muted">
              Garansi Kepuasan Lisensi Digital 100%
            </span>
          </div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Penanganan Komplain, Garansi & Refund Dana
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Tinjau klaim garansi pembeli, verifikasi kendala akun, kirim akun pengganti baru, atau setujui pengembalian dana konsumen.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-status-success border-status-success/30 font-semibold">
            {tickets.filter((t) => t.status === 'Resolved').length} Tiket Selesai
          </Badge>
        </div>
      </div>

      {/* 2. Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {(['All', 'Pending', 'Reviewing', 'Approved', 'Rejected', 'Resolved'] as const).map((st) => {
          const count = st === 'All' ? tickets.length : tickets.filter((t) => t.status === st).length;

          return (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === st
                  ? 'bg-primary text-white shadow-xs'
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
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised/80 border-b border-border text-foreground-muted text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Order ID & Produk</th>
                <th className="py-3 px-4">Alasan Komplain</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTickets.map((t) => (
                <tr key={t.id} className="hover:bg-surface-raised/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                    {t.id}
                    <span className="text-[10px] text-foreground-muted block font-normal">{t.submittedAt}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-foreground block">{t.customerName}</span>
                    <span className="text-[10px] text-foreground-muted font-mono">{t.customerWhatsapp}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-foreground block truncate max-w-[180px]">{t.product}</span>
                    <span className="font-mono text-[10px] text-primary">{t.orderId}</span>
                  </td>
                  <td className="py-3.5 px-4 text-foreground-muted truncate max-w-[220px]">
                    {t.reason}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-primary font-mono">
                    Rp {t.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold ${
                        t.status === 'Resolved'
                          ? 'bg-status-success/15 text-status-success border-status-success/30'
                          : t.status === 'Reviewing'
                          ? 'bg-status-warning/15 text-status-warning border-status-warning/30'
                          : t.status === 'Pending'
                          ? 'bg-primary/15 text-primary border-primary/30'
                          : 'bg-status-error/15 text-status-error border-status-error/30'
                      }`}
                    >
                      {t.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTicket(t);
                        setInternalNoteInput(t.internalNote || '');
                      }}
                      className="h-7 px-2.5 text-xs border-border"
                    >
                      Proses Tiket
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Ticket Resolution Drawer / Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="font-mono text-[10px] text-primary font-bold">{selectedTicket.id}</span>
                <h3 className="font-bold text-sm text-foreground">Detail Klaim Garansi & Komplain</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-foreground-muted hover:text-foreground p-1"
              >
                ✕
              </button>
            </div>

            {/* Ticket Info */}
            <div className="p-3 rounded-lg bg-surface-raised border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">Pelanggan:</span>
                <span className="font-semibold text-foreground">{selectedTicket.customerName} ({selectedTicket.customerWhatsapp})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">Produk Terkait:</span>
                <span className="font-semibold text-foreground">{selectedTicket.product}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">Nilai Pembelian:</span>
                <span className="font-bold text-primary font-mono">Rp {selectedTicket.amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="pt-2 border-t border-border">
                <span className="text-foreground-muted block mb-0.5">Kendala yang Dilaporkan:</span>
                <p className="text-foreground font-medium bg-surface p-2 rounded border border-border">
                  &quot;{selectedTicket.reason}&quot;
                </p>
              </div>
            </div>

            {/* Staff Internal Note */}
            <div>
              <label className="font-semibold text-foreground block mb-1">Catatan Internal Tim Admin</label>
              <Input
                placeholder="Tuliskan tindakan yang diambil (misal: 'Sudah dikirim akun baru via WA')..."
                value={internalNoteInput}
                onChange={(e) => setInternalNoteInput(e.target.value)}
                className="bg-surface-raised border-border text-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
              <a
                href={`https://wa.me/${selectedTicket.customerWhatsapp.replace(/\D/g, '')}?text=Halo%20Kak%20${encodeURIComponent(selectedTicket.customerName)},%20Customer%20Support%20Asterra%20Store%20telah%20meninjau%20tiket%20garansi%20${selectedTicket.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-raised text-foreground font-medium hover:bg-surface transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-status-success" />
                <span>Chat WA Pembeli</span>
              </a>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'Approved')}
                  className="text-status-warning border-status-warning/40 hover:bg-status-warning/10"
                >
                  Setujui Refund
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'Resolved')}
                  className="bg-status-success text-white hover:bg-status-success/90"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Selesai (Garansi Diberikan)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
