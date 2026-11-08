'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMobileScreen,
  faArrowsRotate,
  faCheck,
  faXmark,
  faCopy,
  faShieldHalved,
  faClock,
  faCircleCheck,
  faTriangleExclamation,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface PaymentEventItem {
  id: string;
  eventId: string;
  deviceId: string;
  amount: number;
  currency: string;
  transactionTime: string;
  source: string;
  rawReference?: string | null;
  status: 'DETECTED' | 'PENDING_REVIEW' | 'PAID' | 'DUPLICATE' | 'REJECTED';
  matchedOrderId?: string | null;
  verifiedByAdminId?: string | null;
  verifiedAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

interface AdminLiPayEventsWidgetProps {
  onNotify: (msg: string) => void;
  baseUrl: string;
}

export function AdminLiPayEventsWidget({ onNotify, baseUrl }: AdminLiPayEventsWidgetProps) {
  const [events, setEvents] = useState<PaymentEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = filterStatus === 'ALL'
        ? '/api/v1/admin/payment-events?limit=25'
        : `/api/v1/admin/payment-events?status=${filterStatus}&limit=25`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Gagal mengambil daftar event pembayaran');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEvents(json.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetch events';
      console.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onNotify('Berhasil disalin ke clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleConfirm = async (event: PaymentEventItem) => {
    if (!confirm(`Konfirmasi pembayaran Rp ${event.amount.toLocaleString('id-ID')} untuk Order ${event.matchedOrderId || 'terkait'}?`)) {
      return;
    }
    setProcessingId(event.eventId);
    try {
      const res = await fetch(`/api/v1/admin/payment-events/${event.eventId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: event.matchedOrderId,
          notes: 'Dikonfirmasi via Admin Web Console',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || data.message || 'Gagal konfirmasi');
      }
      onNotify(`Pembayaran event ${event.eventId} berhasil dikonfirmasi menjadi PAID!`);
      fetchEvents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      alert(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (event: PaymentEventItem) => {
    const reason = prompt('Masukkan alasan penolakan event ini:', 'Mutasi tidak ditemukan di DANA Bisnis');
    if (!reason) return;

    setProcessingId(event.eventId);
    try {
      const res = await fetch(`/api/v1/admin/payment-events/${event.eventId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || data.message || 'Gagal menolak');
      }
      onNotify(`Event ${event.eventId} berhasil ditolak (REJECTED).`);
      fetchEvents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      alert(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold text-[10px]">PAID</Badge>;
      case 'PENDING_REVIEW':
        return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold text-[10px]">PENDING REVIEW</Badge>;
      case 'DETECTED':
        return <Badge className="bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold text-[10px]">DETECTED</Badge>;
      case 'DUPLICATE':
        return <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 font-semibold text-[10px]">DUPLICATE</Badge>;
      case 'REJECTED':
        return <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-[10px]">REJECTED</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const ingestionUrl = `${baseUrl || 'https://api.asterrastore.biz.id'}/api/internal/payment-events/dana`;

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faMobileScreen} className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            LiPay — DANA Bisnis Payment Listener & Verification Feed
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchEvents}
            disabled={isLoading}
            className="text-[11px] h-7 gap-1 px-2.5"
          >
            <FontAwesomeIcon icon={faArrowsRotate} className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </Button>
          <Badge className="bg-primary/20 text-primary border border-primary/30 text-[10px] font-mono">
            {events.length} Events
          </Badge>
        </div>
      </div>

      {/* Device Connection Credentials Banner */}
      <div className="p-3 bg-surface-raised border border-border/80 rounded-lg space-y-2 text-xs">
        <div className="flex items-center justify-between text-[11px] text-foreground font-semibold">
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 text-primary" />
            Parameter Pairing HP Android (LiPay App):
          </span>
          <span className="text-[10px] text-foreground-muted font-normal">Header: X-Device-Token</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-[10px] text-foreground-muted block mb-0.5">Ingestion Endpoint (POST):</span>
            <div className="relative">
              <Input
                readOnly
                value={ingestionUrl}
                className="text-[11px] bg-surface border-border font-mono pr-14 select-all h-8"
              />
              <button
                type="button"
                onClick={() => handleCopy(ingestionUrl, 'ingest')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-primary hover:underline flex items-center gap-1"
              >
                {copiedKey === 'ingest' ? <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5" /> : <FontAwesomeIcon icon={faCopy} className="w-2.5 h-2.5" />}
                <span>{copiedKey === 'ingest' ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-foreground-muted block mb-0.5">Device Auth Token (X-Device-Token):</span>
            <div className="relative">
              <Input
                readOnly
                value="[Dikonfigurasi via LIPAY_DEVICE_TOKEN di env server]"
                className="text-[11px] bg-surface border-border font-mono italic text-foreground-muted h-8"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <FontAwesomeIcon icon={faFilter} className="w-3 h-3 text-foreground-muted mr-1" />
        {['ALL', 'PENDING_REVIEW', 'PAID', 'DETECTED', 'REJECTED'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilterStatus(st)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              filterStatus === st
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-raised hover:bg-surface-raised/80 text-foreground-muted border border-border'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Events Table / List */}
      {events.length === 0 ? (
        <div className="p-6 text-center text-foreground-muted text-xs border border-dashed border-border rounded-lg bg-surface-raised">
          <FontAwesomeIcon icon={faClock} className="w-6 h-6 mx-auto mb-2 text-foreground-muted/60" />
          <p>Belum ada notifikasi pembayaran DANA yang diterima dari perangkat LiPay.</p>
          <p className="text-[10px] text-foreground-muted/70 mt-1">
            Gunakan fitur simulasi pada aplikasi LiPay untuk menguji pengiriman data.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised text-foreground-muted text-[10px] uppercase font-semibold border-b border-border">
              <tr>
                <th className="p-2.5">Waktu / Event ID</th>
                <th className="p-2.5">Nominal</th>
                <th className="p-2.5">Cocok Invoice</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5 text-right">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((evt) => (
                <tr key={evt.id} className="hover:bg-surface-raised/50 transition-colors">
                  <td className="p-2.5">
                    <div className="font-mono text-[11px] font-semibold text-foreground">
                      {evt.eventId}
                    </div>
                    <div className="text-[10px] text-foreground-muted">
                      {new Date(evt.transactionTime || evt.createdAt).toLocaleString('id-ID')}
                    </div>
                    {evt.rawReference && (
                      <div className="text-[10px] text-foreground-muted/80 truncate max-w-[180px]">
                        Ref: {evt.rawReference}
                      </div>
                    )}
                  </td>
                  <td className="p-2.5 font-bold font-mono text-foreground">
                    Rp {evt.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="p-2.5">
                    {evt.matchedOrderId ? (
                      <span className="font-mono text-primary font-semibold text-[11px]">
                        {evt.matchedOrderId}
                      </span>
                    ) : (
                      <span className="text-[10px] text-foreground-muted italic">Tidak ada</span>
                    )}
                    {evt.notes && (
                      <div className="text-[10px] text-foreground-muted/80 line-clamp-1 max-w-[200px]">
                        {evt.notes}
                      </div>
                    )}
                  </td>
                  <td className="p-2.5">{getStatusBadge(evt.status)}</td>
                  <td className="p-2.5 text-right space-x-1 whitespace-nowrap">
                    {evt.status !== 'PAID' && evt.status !== 'REJECTED' && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleConfirm(evt)}
                          disabled={processingId === evt.eventId}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] h-6 px-2 gap-1"
                        >
                          <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5" />
                          <span>Konfirmasi</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(evt)}
                          disabled={processingId === evt.eventId}
                          className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-[10px] h-6 px-2 gap-1"
                        >
                          <FontAwesomeIcon icon={faXmark} className="w-2.5 h-2.5" />
                          <span>Tolak</span>
                        </Button>
                      </>
                    )}
                    {evt.status === 'PAID' && (
                      <span className="text-[11px] text-emerald-400 font-semibold inline-flex items-center gap-1">
                        <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3" />
                        Terverifikasi
                      </span>
                    )}
                    {evt.status === 'REJECTED' && (
                      <span className="text-[11px] text-rose-400 italic inline-flex items-center gap-1">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="w-3 h-3" />
                        Ditolak
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

