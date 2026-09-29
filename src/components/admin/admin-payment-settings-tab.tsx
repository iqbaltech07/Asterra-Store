'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  QrCode,
  Smartphone,
  ShieldCheck,
  Check,
  Copy,
  Save,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PaymentConfig } from '@/lib/services/payment-config.service';
import { getAppBaseUrl } from '@/lib/utils/url';
import { ImageUploadDropzone } from '@/components/admin/image-upload-dropzone';

interface AdminPaymentSettingsTabProps {
  onNotify: (msg: string) => void;
}

export function AdminPaymentSettingsTab({ onNotify }: AdminPaymentSettingsTabProps) {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [currentBaseUrl, setCurrentBaseUrl] = useState('');

  // Form states
  const [mode, setMode] = useState<'gateway' | 'manual'>('gateway');
  const [bankName, setBankName] = useState('Bank Central Asia (BCA)');
  const [bankAccountNumber, setBankAccountNumber] = useState('8965123456');
  const [bankAccountName, setBankAccountName] = useState('Asterra Store Official');
  const [qrisImageUrl, setQrisImageUrl] = useState('/images/qris-toko.png');
  const [qrisMerchantName, setQrisMerchantName] = useState('ASTERRA STORE QRIS');
  const [danaNumber, setDanaNumber] = useState('081234567890');
  const [danaAccountName, setDanaAccountName] = useState('Asterra Store');
  const [confirmationWhatsapp, setConfirmationWhatsapp] = useState('6281234567890');
  const [enableUniqueCode, setEnableUniqueCode] = useState(true);
  const [orderExpiryHours, setOrderExpiryHours] = useState(24);
  const [instructions, setInstructions] = useState(
    'Transfer sesuai nominal tepat hingga 3 digit kode unik terakhir untuk verifikasi instan mutasi rekening.'
  );

  // Fetch current payment settings from API
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/payment-config');
      if (!res.ok) throw new Error('Gagal mengambil pengaturan pembayaran');
      const json = await res.json();
      if (json.success && json.data) {
        const d: PaymentConfig = json.data;
        setConfig(d);
        setMode(d.mode);
        setBankName(d.bankName || 'Bank Central Asia (BCA)');
        setBankAccountNumber(d.bankAccountNumber || '8965123456');
        setBankAccountName(d.bankAccountName || 'Asterra Store Official');
        setQrisImageUrl(d.qrisImageUrl || '/images/qris-toko.png');
        setQrisMerchantName(d.qrisMerchantName || 'ASTERRA STORE QRIS');
        setDanaNumber(d.danaNumber || '081234567890');
        setDanaAccountName(d.danaAccountName || 'Asterra Store');
        setConfirmationWhatsapp(d.confirmationWhatsapp || '6281234567890');
        setEnableUniqueCode(typeof d.enableUniqueCode === 'boolean' ? d.enableUniqueCode : true);
        setOrderExpiryHours(d.orderExpiryHours || 24);
        setInstructions(d.instructions || '');
      }
    } catch (err) {
      console.error(err);
      onNotify('Gagal memuat pengaturan pembayaran dari server.');
    } finally {
      setIsLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    fetchSettings();
    setCurrentBaseUrl(getAppBaseUrl());
  }, [fetchSettings]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSave = async (customMode?: 'gateway' | 'manual') => {
    const targetMode = customMode || mode;
    setIsSaving(true);
    try {
      const payload = {
        mode: targetMode,
        bankName,
        bankAccountNumber,
        bankAccountName,
        qrisImageUrl,
        qrisMerchantName,
        danaNumber,
        danaAccountName,
        confirmationWhatsapp,
        enableUniqueCode,
        orderExpiryHours,
        instructions,
      };

      const res = await fetch('/api/v1/admin/payment-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan pengaturan');
      }

      setMode(targetMode);
      onNotify(data.message || `Pengaturan pembayaran berhasil diperbarui. Mode: ${targetMode.toUpperCase()}`);
    } catch (err: unknown) {
      const error = err as Error;
      onNotify(`Gagal: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        <span className="text-xs text-foreground-muted">Memuat konfigurasi payment mode switcher...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Mode Status & Switcher */}
      <div
        className={`border rounded-2xl p-6 transition-all ${
          mode === 'gateway'
            ? 'bg-status-success/5 border-status-success/30 shadow-[0_0_25px_-5px_rgba(34,197,94,0.1)]'
            : 'bg-status-warning/5 border-status-warning/30 shadow-[0_0_25px_-5px_rgba(245,158,11,0.1)]'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-3 h-3 rounded-full animate-pulse ${
                  mode === 'gateway' ? 'bg-status-success' : 'bg-status-warning'
                }`}
              />
              <span className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground-muted">
                Status Mode Pembayaran Aktif
              </span>
              <Badge
                className={
                  mode === 'gateway'
                    ? 'bg-status-success/20 text-status-success border-status-success/30 hover:bg-status-success/20 font-mono text-[11px]'
                    : 'bg-status-warning/20 text-status-warning border-status-warning/30 hover:bg-status-warning/20 font-mono text-[11px]'
                }
              >
                {mode === 'gateway' ? '🟢 GATEWAY OTOMATIS (TRIPAY)' : '🟡 MANUAL TRANSFER TOKO'}
              </Badge>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {mode === 'gateway'
                ? 'Payment Gateway Tripay Berjalan Normal'
                : 'Mode Transfer Manual Toko Sedang Digunakan'}
            </h2>

            <p className="text-xs sm:text-sm text-foreground-muted max-w-2xl leading-relaxed">
              {mode === 'gateway'
                ? 'Semua transaksi pelanggan diproses otomatis via Tripay Gateway (QRIS Realtime, Virtual Account BCA/Mandiri/BNI/BRI, E-Wallet). Jika Tripay sedang kendala limit atau gangguan server, switch ke mode manual untuk menerima transfer langsung ke rekening toko.'
                : 'Pelanggan saat ini diarahkan transfer manual ke rekening Bank BCA, QRIS Manual, atau akun DANA Anda dengan instruksi konfirmasi via WhatsApp. Verifikasi mutasi dilakukan manual oleh admin.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {mode === 'gateway' ? (
              <Button
                type="button"
                onClick={() => handleSave('manual')}
                disabled={isSaving}
                className="bg-status-warning text-black hover:bg-status-warning/90 font-semibold text-xs gap-2 px-5 py-5 shadow-lg shadow-status-warning/10"
              >
                <AlertTriangle className="w-4 h-4 text-black" />
                <span>Beralih ke Transfer Manual Toko</span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => handleSave('gateway')}
                disabled={isSaving}
                className="bg-status-success text-black hover:bg-status-success/90 font-semibold text-xs gap-2 px-5 py-5 shadow-lg shadow-status-success/10"
              >
                <Check className="w-4 h-4 text-black" />
                <span>Beralih ke Gateway Otomatis (Tripay)</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchSettings}
              disabled={isLoading || isSaving}
              className="text-xs gap-1.5 border-border"
              title="Refresh status dari database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-foreground-muted ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Settings & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Details (8 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Rekening Bank Manual */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Rekening Bank Manual (BCA)</h3>
                  <p className="text-[11px] text-foreground-muted">Tujuan transfer bank utama untuk pelanggan</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-border">
                Bank Utama
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-foreground-muted block mb-1">
                  Nama Bank
                </label>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Contoh: Bank Central Asia (BCA)"
                  className="text-xs bg-surface-raised border-border"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-foreground-muted block mb-1">
                  Nomor Rekening
                </label>
                <div className="relative">
                  <Input
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="Contoh: 8965123456"
                    className="text-xs bg-surface-raised border-border font-mono pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(bankAccountNumber, 'bank')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-primary hover:underline px-1 py-0.5 flex items-center gap-1"
                  >
                    {copiedKey === 'bank' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'bank' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-medium text-foreground-muted block mb-1">
                  Nama Pemilik Rekening (Atas Nama)
                </label>
                <Input
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="Contoh: Asterra Store Official"
                  className="text-xs bg-surface-raised border-border"
                />
              </div>
            </div>
          </div>

          {/* Card: QRIS Manual Toko */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">QRIS Statis / Barcode Manual Toko</h3>
                  <p className="text-[11px] text-foreground-muted">Untuk scan QRIS semua bank & dompet digital</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-border">
                Semua E-Wallet & M-Banking
              </Badge>
            </div>

            <div className="space-y-3">
              <ImageUploadDropzone
                value={qrisImageUrl}
                onChange={setQrisImageUrl}
                folder="qris"
                label="Gambar Barcode QRIS Toko"
                description="Tarik & lepas file gambar barcode QRIS toko Anda ke sini untuk disimpan di Vercel Blob (Private Mode)."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <div>
                <label className="text-[11px] font-medium text-foreground-muted block mb-1">
                  Nama Merchant Terdaftar di QRIS
                </label>
                <Input
                  value={qrisMerchantName}
                  onChange={(e) => setQrisMerchantName(e.target.value)}
                  placeholder="Contoh: ASTERRA STORE QRIS"
                  className="text-xs bg-surface-raised border-border"
                />
                <span className="text-[10px] text-foreground-muted mt-1 block">
                  Membantu pembeli memastikan nama penerima benar saat scan barcode.
                </span>
              </div>
            </div>
          </div>

          {/* Card: E-Wallet DANA */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Akun E-Wallet DANA Manual</h3>
                  <p className="text-[11px] text-foreground-muted">Alternatif transfer sesama pengguna aplikasi DANA</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-border">
                DANA E-Wallet
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-foreground-muted block mb-1">
                  Nomor HP DANA
                </label>
                <div className="relative">
                  <Input
                    value={danaNumber}
                    onChange={(e) => setDanaNumber(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="text-xs bg-surface-raised border-border font-mono pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(danaNumber, 'dana')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-primary hover:underline px-1 py-0.5 flex items-center gap-1"
                  >
                    {copiedKey === 'dana' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'dana' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-foreground-muted block mb-1">
                  Nama Akun DANA
                </label>
                <Input
                  value={danaAccountName}
                  onChange={(e) => setDanaAccountName(e.target.value)}
                  placeholder="Contoh: Asterra Store"
                  className="text-xs bg-surface-raised border-border"
                />
              </div>
            </div>
          </div>

          {/* Card: Anti-Fraud, WhatsApp Konfirmasi & Expiry Window */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-status-warning/10 border border-status-warning/20 flex items-center justify-center text-status-warning">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Proteksi Anti-Fraud & Konfirmasi WhatsApp</h3>
                  <p className="text-[11px] text-foreground-muted">Mencegah bukti transfer palsu & penumpukan order gantung</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-status-warning/30 text-status-warning">
                Zero-Trust Anti Fraud
              </Badge>
            </div>

            <div className="space-y-4">
              {/* Feature 1: Unique Code Toggle */}
              <div className="flex items-start justify-between gap-4 p-3.5 bg-surface-raised rounded-lg border border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      Kode Unik 3 Digit Acak (*Unique Amount Code*)
                    </span>
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-mono">
                      Direkomendasikan
                    </Badge>
                  </div>
                  <p className="text-[11px] text-foreground-muted leading-relaxed">
                    Setiap pesanan manual akan ditambahkan 3 digit acak (contoh Rp 150.000 menjadi Rp 150.284).
                    Admin dapat memverifikasi mutasi bank/DANA secara instan dalam 1 detik tanpa risiko tertipu screenshot struk palsu/photoshop.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enableUniqueCode}
                  onChange={(e) => setEnableUniqueCode(e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer mt-1"
                />
              </div>

              {/* Feature 2: Order Expiry Window */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-foreground-muted block mb-1">
                    Batas Waktu Kedaluwarsa Pesanan (Jam)
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="number"
                      min={1}
                      max={168}
                      value={orderExpiryHours}
                      onChange={(e) => setOrderExpiryHours(parseInt(e.target.value, 10) || 24)}
                      className="pl-9 text-xs bg-surface-raised border-border font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-foreground-muted mt-1 block">
                    Pesanan manual belum bayar otomatis dibatalkan setelah {orderExpiryHours} jam.
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-foreground-muted block mb-1">
                    Nomor WhatsApp Admin Konfirmasi
                  </label>
                  <Input
                    value={confirmationWhatsapp}
                    onChange={(e) => setConfirmationWhatsapp(e.target.value)}
                    placeholder="Contoh: 6281234567890"
                    className="text-xs bg-surface-raised border-border font-mono"
                  />
                  <span className="text-[10px] text-foreground-muted mt-1 block">
                    Gunakan awalan 62. Tombol di checkout akan membuka chat WA ke nomor ini.
                  </span>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="text-[11px] font-medium text-foreground-muted block mb-1">
                  Instruksi Tambahan untuk Pelanggan (Muncul di Checkout)
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={2}
                  className="w-full text-xs bg-surface-raised border border-border rounded-lg p-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Petunjuk transfer untuk pelanggan..."
                />
              </div>
            </div>
          </div>

          {/* Action Button: Save Changes */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-foreground-muted">
              Terakhir diperbarui: {config?.updatedAt ? new Date(config.updatedAt).toLocaleString('id-ID') : '-'}
            </span>
            <Button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="text-xs font-semibold gap-2 px-6"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Pengaturan'}</span>
            </Button>
          </div>
        </div>

        {/* Right Column: Live Simulator / Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface border border-border rounded-xl p-5 sticky top-24 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Simulasi Tampilan Checkout Pelanggan
                </h3>
              </div>
              <Badge className="text-[10px] font-mono bg-surface-raised border border-border">
                Live Preview
              </Badge>
            </div>

            {/* Simulated Checkout Box */}
            <div className="bg-surface-raised border border-border/80 rounded-xl p-4 space-y-4 text-xs">
              {mode === 'gateway' ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-status-success/10 border border-status-success/20 flex items-center gap-2 text-status-success text-xs">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Payment Gateway Otomatis (Tripay) Aktif</span>
                  </div>
                  <div className="p-3 border border-border rounded-lg bg-surface space-y-2">
                    <div className="font-semibold text-foreground">Metode Pembayaran Tersedia:</div>
                    <ul className="text-foreground-muted space-y-1 text-[11px]">
                      <li>• QRIS Otomatis (Gojek, OVO, ShopeePay, Dana, LinkAja)</li>
                      <li>• Virtual Account (BCA, Mandiri, BNI, BRI, Permata)</li>
                      <li>• Minimarket (Indomaret, Alfamart)</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Manual Alert */}
                  <div className="p-2.5 rounded-lg bg-status-warning/10 border border-status-warning/30 flex items-center gap-2 text-status-warning text-[11px]">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Mode Transfer Manual Toko Sedang Aktif</span>
                  </div>

                  {/* Simulated Nominal with Unique Code */}
                  <div className="p-3 bg-surface border border-border rounded-lg space-y-1">
                    <div className="flex justify-between text-foreground-muted text-[11px]">
                      <span>Harga Pesanan (Contoh)</span>
                      <span>Rp 150.000</span>
                    </div>
                    {enableUniqueCode && (
                      <div className="flex justify-between text-primary font-mono text-[11px]">
                        <span>Kode Unik Verifikasi</span>
                        <span>+ Rp 284</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-border flex justify-between items-center font-bold text-foreground">
                      <span>Total Tagihan Tepat:</span>
                      <span className="text-primary font-mono text-sm">
                        {enableUniqueCode ? 'Rp 150.284' : 'Rp 150.000'}
                      </span>
                    </div>
                  </div>

                  {/* Bank Details Preview */}
                  <div className="p-3 bg-surface border border-border rounded-lg space-y-2">
                    <div className="text-[11px] font-semibold text-foreground">Transfer Bank BCA:</div>
                    <div className="flex items-center justify-between font-mono bg-surface-raised px-2.5 py-1.5 rounded border border-border text-foreground">
                      <span>{bankAccountNumber}</span>
                      <span className="text-[10px] text-primary">Salin</span>
                    </div>
                    <div className="text-[10px] text-foreground-muted">
                      a.n {bankAccountName} ({bankName})
                    </div>
                  </div>

                  {/* QRIS / DANA Quick Preview */}
                  <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                    <div className="p-2 bg-surface border border-border rounded-lg">
                      <QrCode className="w-4 h-4 text-primary mx-auto mb-1" />
                      <span className="font-semibold block text-foreground">QRIS Toko</span>
                      <span className="text-foreground-muted truncate block">{qrisMerchantName}</span>
                    </div>
                    <div className="p-2 bg-surface border border-border rounded-lg">
                      <Smartphone className="w-4 h-4 text-primary mx-auto mb-1" />
                      <span className="font-semibold block text-foreground">DANA</span>
                      <span className="text-foreground-muted font-mono block">{danaNumber}</span>
                    </div>
                  </div>

                  {/* WhatsApp CTA Button Simulation */}
                  <div className="pt-1">
                    <div className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 text-xs cursor-pointer shadow-md">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Kirim Bukti Pembayaran ke WhatsApp Admin</span>
                    </div>
                    <span className="text-[10px] text-foreground-muted block text-center mt-1.5">
                      Otomatis membuka chat ke WA: {confirmationWhatsapp}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] text-foreground-muted flex items-start gap-2 p-2.5 bg-surface-raised rounded-lg border border-border">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                Perubahan pada halaman ini berdampak langsung saat pelanggan mengakses halaman checkout.
              </span>
            </div>
          </div>

          {/* Card: Dynamic Tripay Webhook & Callback Info */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-status-success" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Integrasi & Callback Tripay
                </h4>
              </div>
              <Badge variant="outline" className="text-[10px] text-status-success border-status-success/30 font-mono">
                Auto-Dynamic
              </Badge>
            </div>

            <p className="text-[11px] text-foreground-muted leading-relaxed">
              Sistem telah dikonfigurasi secara otomatis mengirimkan <strong>Callback URL</strong> &amp; <strong>Return URL</strong> dinamis pada setiap pembuatan tagihan Tripay sesuai domain aktif Anda ({currentBaseUrl || 'https://asterrastore.biz.id'}).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-foreground-muted block font-medium mb-1">
                  URL Webhook Callback Tripay (POST):
                </span>
                <div className="relative">
                  <Input
                    readOnly
                    value={`${currentBaseUrl || 'https://asterrastore.biz.id'}/api/v1/webhooks/tripay`}
                    className="text-[11px] bg-surface-raised border-border font-mono pr-16 select-all"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `${currentBaseUrl || 'https://asterrastore.biz.id'}/api/v1/webhooks/tripay`,
                        'webhook'
                      )
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-primary hover:underline px-1 py-0.5 flex items-center gap-1"
                  >
                    {copiedKey === 'webhook' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'webhook' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-foreground-muted block font-medium mb-1">
                  URL Return Pengalihan Pelanggan (GET):
                </span>
                <div className="relative">
                  <Input
                    readOnly
                    value={`${currentBaseUrl || 'https://asterrastore.biz.id'}/orders`}
                    className="text-[11px] bg-surface-raised border-border font-mono pr-16 select-all"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(`${currentBaseUrl || 'https://asterrastore.biz.id'}/orders`, 'return')
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-primary hover:underline px-1 py-0.5 flex items-center gap-1"
                  >
                    {copiedKey === 'return' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'return' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
