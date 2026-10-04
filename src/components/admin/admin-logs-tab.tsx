'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OrderLog } from '@/lib/orders-data';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faArrowsRotate,
  faChartLine,
  faUser,
  faBolt,
  faShieldHalved,
  faCircleCheck,
  faBan,
  faFileLines,
} from '@fortawesome/free-solid-svg-icons';

interface LogsApiResponse {
  success: boolean;
  data: OrderLog[];
  pagination: {
    total_items: number;
    current_page: number;
    total_pages: number;
    items_per_page: number;
  };
}

export function AdminLogsTab() {
  const [actorFilter, setActorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const {
    data: logsData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<LogsApiResponse>({
    queryKey: ['admin-logs', actorFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (actorFilter !== 'all') params.append('actor', actorFilter);
      const res = await fetch(`/api/v1/admin/logs?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat log aktivitas');
      return res.json();
    },
  });

  const rawLogs = logsData?.data || [];

  // Filter logs by search query in-memory
  const logs = rawLogs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchOrder = log.order_id.toLowerCase().includes(q);
    const matchNotes = (log.notes || '').toLowerCase().includes(q);
    const matchAction = log.action.toLowerCase().includes(q);
    const matchName = (log.customer_name || '').toLowerCase().includes(q);
    const matchEmail = (log.customer_email || '').toLowerCase().includes(q);
    return matchOrder || matchNotes || matchAction || matchName || matchEmail;
  });

  const getActorBadge = (actor: OrderLog['actor']) => {
    switch (actor) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/15 text-primary border border-primary/30">
            <FontAwesomeIcon icon={faUser} className="w-3 h-3" />
            <span>Admin Manual</span>
          </span>
        );
      case 'tripay_webhook':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-status-success/15 text-status-success border border-status-success/30">
            <FontAwesomeIcon icon={faBolt} className="w-3 h-3" />
            <span>Tripay Webhook</span>
          </span>
        );
      case 'customer':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface-raised text-foreground-muted border border-border">
            <FontAwesomeIcon icon={faUser} className="w-3 h-3" />
            <span>Pelanggan</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface-raised text-foreground-muted border border-border">
            <FontAwesomeIcon icon={faShieldHalved} className="w-3 h-3" />
            <span>Sistem Otomatis</span>
          </span>
        );
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'payment_received':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-status-success/10 text-status-success">
            <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3" />
            <span>Pembayaran Lunas</span>
          </span>
        );
      case 'status_updated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
            <FontAwesomeIcon icon={faChartLine} className="w-3 h-3" />
            <span>Status Diubah</span>
          </span>
        );
      case 'order_created':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-status-warning/10 text-status-warning">
            <FontAwesomeIcon icon={faFileLines} className="w-3 h-3" />
            <span>Pesanan Dibuat</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-status-error/10 text-status-error">
            <FontAwesomeIcon icon={faBan} className="w-3 h-3" />
            <span>Dibatalkan</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-surface-raised text-foreground-muted">
            <span>{action}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Info */}
      <div className="bg-surface border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <FontAwesomeIcon icon={faChartLine} className="w-4 h-4 text-primary" />
            <span>Log Aktivitas & Audit Perubahan Status</span>
          </h2>
          <p className="text-xs text-foreground-muted mt-1 max-w-2xl">
            Mencatat setiap peristiwa perubahan status transaksi secara transparan beserta identitas customer dan email pemesan, baik yang dilakukan manual oleh
            administrator maupun otomatis dari callback payment gateway (Tripay).
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="text-right">
            <span className="text-[11px] text-foreground-muted block">Total Event Tercatat</span>
            <span className="text-xl font-bold font-mono text-foreground">{rawLogs.length}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="border-border text-xs gap-1.5 h-9"
          >
            <FontAwesomeIcon icon={faArrowsRotate} className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-primary' : ''}`} />
            <span>Segarkan Log</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-border rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Actor Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActorFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              actorFilter === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
            }`}
          >
            Semua Aktor
          </button>
          <button
            type="button"
            onClick={() => setActorFilter('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              actorFilter === 'admin'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
            }`}
          >
            <FontAwesomeIcon icon={faUser} className="w-3 h-3" />
            <span>Admin Manual</span>
          </button>
          <button
            type="button"
            onClick={() => setActorFilter('tripay_webhook')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              actorFilter === 'tripay_webhook'
                ? 'bg-status-success text-white shadow-sm'
                : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
            }`}
          >
            <FontAwesomeIcon icon={faBolt} className="w-3 h-3" />
            <span>Tripay Webhook</span>
          </button>
          <button
            type="button"
            onClick={() => setActorFilter('customer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              actorFilter === 'customer'
                ? 'bg-foreground text-background shadow-sm'
                : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
            }`}
          >
            <span>Pelanggan</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:w-80">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <Input
            type="text"
            placeholder="Cari Customer, Email, ID Pesanan, Action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs bg-surface-raised border-border h-9"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center">
            <FontAwesomeIcon icon={faArrowsRotate} className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
            <p className="text-xs text-foreground-muted">Memuat log aktivitas sistem...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <FontAwesomeIcon icon={faChartLine} className="w-12 h-12 text-foreground-muted/40 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground">Tidak Ada Log Tercatat</h3>
            <p className="text-xs text-foreground-muted mt-1">
              {searchQuery
                ? `Tidak ada log yang sesuai dengan filter atau kata kunci "${searchQuery}".`
                : 'Belum ada catatan aktivitas di kategori ini.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-raised border-b border-border text-foreground-muted font-medium uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Waktu Kejadian</th>
                  <th className="py-3 px-4">ID Pesanan & Customer</th>
                  <th className="py-3 px-4">Pelaku (Aktor)</th>
                  <th className="py-3 px-4">Jenis Peristiwa</th>
                  <th className="py-3 px-4">Perubahan Status</th>
                  <th className="py-3 px-4">Catatan & Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-raised/50 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap text-foreground-muted align-top">
                      <div className="font-mono text-foreground text-xs">
                        {new Date(log.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                      <div className="text-[11px] text-foreground-muted">
                        {new Date(log.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    {/* Order ID & Customer */}
                    <td className="py-3 px-4 align-top">
                      <div className="font-mono font-bold text-foreground">
                        <span className="bg-surface-raised px-2 py-0.5 rounded border border-border inline-block">
                          {log.order_id}
                        </span>
                      </div>
                      {(log.customer_name || log.customer_email) && (
                        <div className="mt-1 text-[11px] leading-tight">
                          <div className="font-medium text-foreground">{log.customer_name || 'Pelanggan'}</div>
                          {log.customer_email && (
                            <div className="text-foreground-muted truncate max-w-[170px] text-[10px]">
                              {log.customer_email}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4 align-top">{getActorBadge(log.actor)}</td>

                    {/* Action */}
                    <td className="py-3 px-4 align-top">{getActionBadge(log.action)}</td>

                    {/* Status Transition */}
                    <td className="py-3 px-4 align-top">
                      {log.previous_status || log.new_status ? (
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          {log.previous_status && (
                            <span className="text-foreground-muted">{log.previous_status}</span>
                          )}
                          {log.previous_status && log.new_status && (
                            <span className="text-foreground-muted">➔</span>
                          )}
                          {log.new_status && (
                            <span className="font-bold text-foreground bg-surface-raised px-1.5 py-0.5 rounded border border-border">
                              {log.new_status}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-foreground-muted text-[11px]">-</span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="py-3 px-4 text-foreground align-top max-w-md">
                      <p className="text-xs leading-relaxed">{log.notes || '-'}</p>
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
