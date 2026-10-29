'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Save,
  Server,
  UserCheck,
  Zap,
  ShieldAlert,
  RefreshCw,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfigApi, OrderProcessingConfig } from '@/lib/api-client';

interface AdminOrderProcessingTabProps {
  onNotify?: (msg: string) => void;
}

export function AdminOrderProcessingTab({ onNotify }: AdminOrderProcessingTabProps) {
  const queryClient = useQueryClient();

  const { data: configData, isLoading, refetch } = useQuery({
    queryKey: ['admin-order-processing-config'],
    queryFn: () => ConfigApi.getOrderProcessing(),
  });

  const [selectedMode, setSelectedMode] = useState<'manual' | 'automatic'>('manual');
  const [activeReseller, setActiveReseller] = useState<string>('vip-reseller');
  const [autoFulfill, setAutoFulfill] = useState<boolean>(true);
  const [notifyAdmin, setNotifyAdmin] = useState<boolean>(true);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);

  // Sync state when data is loaded
  useEffect(() => {
    if (configData?.data) {
      setSelectedMode(configData.data.orderMode || configData.data.order_mode || 'manual');
      setActiveReseller(configData.data.activeReseller || configData.data.active_reseller || 'vip-reseller');
      setAutoFulfill(
        configData.data.autoFulfillOnPayment ?? configData.data.auto_fulfill_on_payment ?? true
      );
      setNotifyAdmin(
        configData.data.notifyAdminOnManualOrder ?? configData.data.notify_admin_on_manual_order ?? true
      );
    }
  }, [configData]);

  const updateMutation = useMutation({
    mutationFn: (payload: {
      orderMode: 'manual' | 'automatic';
      activeReseller: string;
      autoFulfillOnPayment: boolean;
      notifyAdminOnManualOrder: boolean;
    }) => ConfigApi.updateOrderProcessing(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-order-processing-config'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      onNotify?.(res.message || 'Konfigurasi pemrosesan pesanan berhasil disimpan.');
      setShowWarningModal(false);
    },
    onError: (err: Error) => {
      onNotify?.(`Gagal menyimpan konfigurasi: ${err.message}`);
    },
  });

  const handleSave = () => {
    const currentMode = configData?.data?.orderMode || configData?.data?.order_mode;
    if (currentMode && currentMode !== selectedMode) {
      // Show warning before switching mode
      setShowWarningModal(true);
    } else {
      executeSave();
    }
  };

  const executeSave = () => {
    updateMutation.mutate({
      orderMode: selectedMode,
      activeReseller,
      autoFulfillOnPayment: autoFulfill,
      notifyAdminOnManualOrder: notifyAdmin,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
              Konfigurasi Sistem
            </span>
            <span className="text-[11px] text-foreground-muted">Sistem Pemenuhan Pesanan</span>
          </div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Mode Pemrosesan Pesanan (Fulfillment)</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Tentukan alur pemenuhan transaksi: penanganan kredensial manual oleh admin atau otomatisasi via API reseller/supplier upstream.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="text-xs gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={updateMutation.isPending || isLoading}
            className="text-xs gap-1.5 h-9 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </Button>
        </div>
      </div>

      {/* 2. Active Mode Status Strip */}
      <div className="bg-surface-raised border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <span className="text-foreground-muted block text-[10px] uppercase font-bold tracking-wider">
              Status Operasional Saat Ini:
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-bold text-sm text-foreground">
                {selectedMode === 'manual' ? 'Mode Manual (Admin Dispatch)' : 'Mode Otomatis (Live Gateway)'}
              </span>
              <Badge
                className={
                  selectedMode === 'manual'
                    ? 'bg-status-warning/15 text-status-warning border-status-warning/30 font-mono text-[10px]'
                    : 'bg-status-success/15 text-status-success border-status-success/30 font-mono text-[10px]'
                }
              >
                {selectedMode.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>

        {selectedMode === 'automatic' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border text-[11px]">
            <Server className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-foreground-muted">Upstream Aktif:</span>
            <strong className="text-foreground font-mono">VIP Reseller API Gateway</strong>
          </div>
        )}
      </div>

      {/* 3. Mode Selection Grid (Two Exclusive Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CARD 1: MODE MANUAL */}
        <div
          onClick={() => setSelectedMode('manual')}
          className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            selectedMode === 'manual'
              ? 'border-primary bg-primary/5 shadow-md shadow-primary/5 ring-1 ring-primary/30'
              : 'border-border bg-surface hover:border-foreground-muted/40 hover:bg-surface-raised/40'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-status-warning/15 border border-status-warning/30 flex items-center justify-center text-status-warning">
                <UserCheck className="w-5 h-5" />
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  selectedMode === 'manual'
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-surface'
                }`}
              >
                {selectedMode === 'manual' && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
                <span>1. Mode Manual</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-status-warning/15 text-status-warning border border-status-warning/30">
                  Admin Kontrol Penuh
                </span>
              </h3>
              <p className="text-xs text-foreground-muted mt-1 leading-relaxed">
                Admin menangani sendiri penyediaan akun dan pengiriman lisensi. Pesanan tidak akan ditembakkan ke API reseller eksternal.
              </p>
            </div>

            <div className="p-3 bg-surface rounded-xl border border-border space-y-2 text-xs">
              <div className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                Ketentuan & Alur Mode Manual:
              </div>
              <ul className="space-y-1.5 text-foreground-muted text-[11px]">
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">✓</span>
                  <span>Pesanan masuk dengan status <strong>Pending</strong> setelah checkout pelanggan.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">✓</span>
                  <span>Admin meninjau transaksi dan mengubah status menjadi <strong>Diproses</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-status-warning font-bold">★</span>
                  <span>
                    Saat menekan <strong>Selesaikan Pesanan</strong>, form modal <strong>"Silakan masukkan kredensial akun pelanggan"</strong> wajib diisi.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">✓</span>
                  <span>Email penyelesaian memuat kredensial dan dikirim otomatis setelah admin menyimpan.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px]">
            <span className="text-foreground-muted">Cocok untuk: Akun Private In-House, Akun Khusus, Stok Fisik</span>
          </div>
        </div>

        {/* CARD 2: MODE OTOMATIS */}
        <div
          onClick={() => setSelectedMode('automatic')}
          className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            selectedMode === 'automatic'
              ? 'border-primary bg-primary/5 shadow-md shadow-primary/5 ring-1 ring-primary/30'
              : 'border-border bg-surface hover:border-foreground-muted/40 hover:bg-surface-raised/40'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-status-success/15 border border-status-success/30 flex items-center justify-center text-status-success">
                <Zap className="w-5 h-5" />
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  selectedMode === 'automatic'
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-surface'
                }`}
              >
                {selectedMode === 'automatic' && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
                <span>2. Mode Otomatis</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-status-success/15 text-status-success border border-status-success/30">
                  Instant Reseller API
                </span>
              </h3>
              <p className="text-xs text-foreground-muted mt-1 leading-relaxed">
                Sistem secara otomatis meneruskan pesanan ke API supplier/reseller resmi ketika pembayaran pelanggan telah terverifikasi.
              </p>
            </div>

            <div className="p-3 bg-surface rounded-xl border border-border space-y-2 text-xs">
              <div className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                Ketentuan & Alur Mode Otomatis:
              </div>
              <ul className="space-y-1.5 text-foreground-muted text-[11px]">
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">✓</span>
                  <span>Verifikasi pembayaran otomatis dari gateway Tripay / mutasi instan memicu dispatch.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">✓</span>
                  <span>Pesanan dieksekusi melalui <strong>VIP Reseller API Gateway</strong> secara real-time.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">✓</span>
                  <span>ID transaksi eksternal (TRXID) dan serial akun tersimpan otomatis.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">✓</span>
                  <span>Status selesai dan email kredensial dikirim tanpa intervensi manual staf toko.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px]">
            <span className="text-foreground-muted">Cocok untuk: Produk Digital 24 Jam, Lisensi Instan, Top-up</span>
          </div>
        </div>
      </div>

      {/* 4. Detail Konfigurasi Tambahan */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-foreground">Pengaturan Tambahan Pemenuhan</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Reseller Supplier Selection */}
          <div className="p-3.5 rounded-xl bg-surface-raised border border-border space-y-2">
            <label className="font-semibold text-foreground block">
              Pilihan Reseller / Supplier Upstream Aktif:
            </label>
            <select
              value={activeReseller}
              onChange={(e) => setActiveReseller(e.target.value)}
              disabled={selectedMode !== 'automatic'}
              className="w-full bg-surface border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <option value="vip-reseller">VIP Reseller API Gateway (Aktif & Terintegrasi)</option>
              <option value="internal-manual" disabled>
                Asterra Internal Vault (Hanya Mode Manual)
              </option>
            </select>
            <p className="text-[11px] text-foreground-muted">
              Hanya provider dengan adapter resmi dan siap produksi yang dapat dipilih.
            </p>
          </div>

          {/* Auto Fulfill Checkbox */}
          <div className="p-3.5 rounded-xl bg-surface-raised border border-border flex flex-col justify-between">
            <div>
              <span className="font-semibold text-foreground block mb-1">Otomatisasi Pembayaran:</span>
              <label className="flex items-start gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={autoFulfill}
                  onChange={(e) => setAutoFulfill(e.target.checked)}
                  disabled={selectedMode !== 'automatic'}
                  className="w-4 h-4 accent-primary mt-0.5 cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="text-[11px] text-foreground leading-snug">
                  Jalankan eksekusi API upstream seketika saat status pembayaran berubah menjadi <strong>settlement / terbayar</strong>.
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Warning / Notice Box */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-foreground">
          <strong className="block text-xs font-semibold text-blue-600 dark:text-blue-400">
            Prinsip Keamanan & Integritas Pesanan (In-Flight Safety)
          </strong>
          <p className="text-[11px] text-foreground-muted leading-relaxed">
            Pergantian mode ini hanya berlaku untuk pesanan baru yang dibuat setelah konfigurasi disimpan. Pesanan yang sedang berjalan (in-flight) mempertahankan mode yang ditetapkan pada saat pesanan dibuat, sehingga pergantian mode tidak akan mengganggu transaksi yang sedang berlangsung.
          </p>
        </div>
      </div>

      {/* Warning Confirmation Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-status-warning/15 border border-status-warning/30 flex items-center justify-center text-status-warning">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-foreground">Konfirmasi Pergantian Mode Pemrosesan</h4>
              <p className="text-xs text-foreground-muted mt-1 leading-relaxed">
                Anda akan mengubah mode pemrosesan pesanan toko dari{' '}
                <strong className="text-foreground uppercase">
                  {configData?.data?.orderMode || configData?.data?.order_mode || 'manual'}
                </strong>{' '}
                menjadi <strong className="text-primary uppercase">{selectedMode}</strong>.
              </p>
            </div>

            <div className="p-3 bg-surface-raised rounded-xl border border-border text-[11px] text-foreground-muted space-y-1">
              <p>• Pesanan baru akan diproses dalam <strong>Mode {selectedMode === 'manual' ? 'Manual' : 'Otomatis'}</strong>.</p>
              <p>• Pesanan yang sudah ada sebelumnya tidak akan berubah atau terganggu.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowWarningModal(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={executeSave}
                disabled={updateMutation.isPending}
                className="text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
              >
                {updateMutation.isPending ? 'Menyimpan...' : 'Ya, Ubah Mode'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

