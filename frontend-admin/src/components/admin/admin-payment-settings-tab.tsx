'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCreditCard,
  faQrcode,
  faMobileScreen,
  faShieldHalved,
  faCheck,
  faCopy,
  faFloppyDisk,
  faTriangleExclamation,
  faArrowUpRightFromSquare,
  faArrowsRotate,
  faClock,
  faEye,
  faCircleInfo,
  faPlus,
  faTrash,
  faEnvelope,
  faComment,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PaymentConfig } from '@/types/payment';
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
  const [isBankActive, setIsBankActive] = useState(true);
  const [isQrisActive, setIsQrisActive] = useState(true);
  const [isDanaActive, setIsDanaActive] = useState(true);
  const [bankName, setBankName] = useState('Bank Central Asia (BCA)');
  const [bankAccountNumber, setBankAccountNumber] = useState('8965123456');
  const [bankAccountName, setBankAccountName] = useState('Asterra Store Official');
  const [qrisImageUrl, setQrisImageUrl] = useState('/images/qris-toko.png');
  const [qrisMerchantName, setQrisMerchantName] = useState('ASTERRA STORE QRIS');
  const [danaNumber, setDanaNumber] = useState('081234567890');
  const [danaAccountName, setDanaAccountName] = useState('Asterra Store');
  const [confirmationWhatsapp, setConfirmationWhatsapp] = useState('6281234567890');
  const [csEmail, setCsEmail] = useState('support@asterra.store');
  const [csWhatsappNumbers, setCsWhatsappNumbers] = useState<string[]>(['6281234567890']);
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
        setIsBankActive((d.isBankActive ?? d.is_bank_active) !== false);
        setIsQrisActive((d.isQrisActive ?? d.is_qris_active) !== false);
        setIsDanaActive((d.isDanaActive ?? d.is_dana_active) !== false);
        setBankName(d.bankName || 'Bank Central Asia (BCA)');
        setBankAccountNumber(d.bankAccountNumber || '8965123456');
        setBankAccountName(d.bankAccountName || 'Asterra Store Official');
        setQrisImageUrl(d.qrisImageUrl || '/images/qris-toko.png');
        setQrisMerchantName(d.qrisMerchantName || 'ASTERRA STORE QRIS');
        setDanaNumber(d.danaNumber || '081234567890');
        setDanaAccountName(d.danaAccountName || 'Asterra Store');
        setConfirmationWhatsapp(d.confirmationWhatsapp || '6281234567890');
        setCsEmail(d.csEmail || 'support@asterra.store');
        setCsWhatsappNumbers(
          Array.isArray(d.csWhatsappNumbers) && d.csWhatsappNumbers.length > 0
            ? d.csWhatsappNumbers
            : [d.confirmationWhatsapp || '6281234567890']
        );
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
    setCurrentBaseUrl(getAppBaseUrl());
    fetchSettings();

    const handleAutoSync = () => {
      if (!isSaving) {
        fetchSettings();
      }
    };

    window.addEventListener('focus', handleAutoSync);
    window.addEventListener('admin:refresh-payment-config', handleAutoSync);

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        handleAutoSync();
      }
    }, 60000);

    return () => {
      window.removeEventListener('focus', handleAutoSync);
      window.removeEventListener('admin:refresh-payment-config', handleAutoSync);
      clearInterval(timer);
    };
  }, [fetchSettings, isSaving]);

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
        isBankActive,
        isQrisActive,
        isDanaActive,
        is_bank_active: isBankActive,
        is_qris_active: isQrisActive,
        is_dana_active: isDanaActive,
        bankName,
        bankAccountNumber,
        bankAccountName,
        qrisImageUrl,
        qrisMerchantName,
        danaNumber,
        danaAccountName,
        confirmationWhatsapp,
        csEmail,
        csWhatsappNumbers,
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
        <FontAwesomeIcon icon={faArrowsRotate} className="w-6 h-6 text-primary animate-spin" />
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
                <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 text-black" />
                <span>Beralih ke Transfer Manual Toko</span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => handleSave('gateway')}
                disabled={isSaving}
                className="bg-status-success text-black hover:bg-status-success/90 font-semibold text-xs gap-2 px-5 py-5 shadow-lg shadow-status-success/10"
              >
                <FontAwesomeIcon icon={faCheck} className="w-4 h-4 text-black" />
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
              <FontAwesomeIcon icon={faArrowsRotate} className={`w-3.5 h-3.5 text-foreground-muted ${isLoading ? 'animate-spin' : ''}`} />
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
          <div className={`bg-surface border rounded-xl p-5 space-y-4 transition-all duration-150 ${isBankActive ? 'border-border' : 'border-border/60 opacity-85'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${isBankActive ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface-raised border-border text-foreground-muted'}`}>
                  <FontAwesomeIcon icon={faCreditCard} className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Rekening Bank Manual (BCA)</h3>
                  <p className="text-[11px] text-foreground-muted">Tujuan transfer bank utama untuk pelanggan</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 self-end sm:self-center">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isBankActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                  {isBankActive ? 'Channel Aktif' : 'Non-aktif'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsBankActive(!isBankActive)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isBankActive ? 'bg-primary' : 'bg-surface-raised border-border'
                  }`}
                  role="switch"
                  aria-checked={isBankActive}
                  title={isBankActive ? "Nonaktifkan Channel BCA" : "Aktifkan Channel BCA"}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isBankActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
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
                    {copiedKey === 'bank' ? <FontAwesomeIcon icon={faCheck} className="w-3 h-3" /> : <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />}
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
          <div className={`bg-surface border rounded-xl p-5 space-y-4 transition-all duration-150 ${isQrisActive ? 'border-border' : 'border-border/60 opacity-85'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${isQrisActive ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface-raised border-border text-foreground-muted'}`}>
                  <FontAwesomeIcon icon={faQrcode} className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">QRIS Statis / Barcode Manual Toko</h3>
                  <p className="text-[11px] text-foreground-muted">Untuk scan QRIS semua bank & dompet digital</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 self-end sm:self-center">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isQrisActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                  {isQrisActive ? 'Channel Aktif' : 'Non-aktif'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsQrisActive(!isQrisActive)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isQrisActive ? 'bg-primary' : 'bg-surface-raised border-border'
                  }`}
                  role="switch"
                  aria-checked={isQrisActive}
                  title={isQrisActive ? "Nonaktifkan Channel QRIS" : "Aktifkan Channel QRIS"}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isQrisActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
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
          <div className={`bg-surface border rounded-xl p-5 space-y-4 transition-all duration-150 ${isDanaActive ? 'border-border' : 'border-border/60 opacity-85'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${isDanaActive ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface-raised border-border text-foreground-muted'}`}>
                  <FontAwesomeIcon icon={faMobileScreen} className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Akun E-Wallet DANA Manual</h3>
                  <p className="text-[11px] text-foreground-muted">Alternatif transfer sesama pengguna aplikasi DANA</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 self-end sm:self-center">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isDanaActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                  {isDanaActive ? 'Channel Aktif' : 'Non-aktif'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsDanaActive(!isDanaActive)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isDanaActive ? 'bg-primary' : 'bg-surface-raised border-border'
                  }`}
                  role="switch"
                  aria-checked={isDanaActive}
                  title={isDanaActive ? "Nonaktifkan Channel DANA" : "Aktifkan Channel DANA"}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isDanaActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
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
                    {copiedKey === 'dana' ? <FontAwesomeIcon icon={faCheck} className="w-3 h-3" /> : <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />}
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
                  <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4" />
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
                    <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
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

              {/* [T22] Kontak Layanan Pelanggan & WhatsApp CS Tambahan */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faComment} className="w-3.5 h-3.5 text-primary" />
                      <span>Kontak Layanan Pelanggan (Customer Service)</span>
                    </h4>
                    <p className="text-[11px] text-foreground-muted">
                      Atur Email CS dan daftar nomor WhatsApp CS. Jika terdapat 2 atau lebih nomor WA, di sisi pengguna akan tampil sebagai WhatsApp CS 1, WhatsApp CS 2, dst.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-foreground-muted block mb-1">
                    Email Customer Service
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faEnvelope} className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="email"
                      value={csEmail}
                      onChange={(e) => setCsEmail(e.target.value)}
                      placeholder="support@asterra.store"
                      className="pl-9 text-xs bg-surface-raised border-border font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-foreground-muted mt-1 block">
                    Email resmi untuk layanan komplain, garansi, dan invoice digital.
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-foreground-muted block">
                      Daftar Nomor WhatsApp CS (Dapat Ditambah)
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCsWhatsappNumbers([...csWhatsappNumbers, '628'])}
                      className="text-[10px] h-7 px-2.5 gap-1 border-border hover:border-primary/40"
                    >
                      <FontAwesomeIcon icon={faPlus} className="w-3 h-3 text-primary" />
                      <span>Tambah Nomor WA CS</span>
                    </Button>
                  </div>

                  {csWhatsappNumbers.map((num, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground w-28 shrink-0 font-mono">
                        {csWhatsappNumbers.length > 1 ? `WhatsApp CS ${idx + 1}` : 'WhatsApp CS'}
                      </span>
                      <Input
                        value={num}
                        onChange={(e) => {
                          const updated = [...csWhatsappNumbers];
                          updated[idx] = e.target.value;
                          setCsWhatsappNumbers(updated);
                        }}
                        placeholder="Contoh: 6281234567890"
                        className="text-xs bg-surface-raised border-border font-mono flex-1"
                      />
                      {csWhatsappNumbers.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = csWhatsappNumbers.filter((_, i) => i !== idx);
                            setCsWhatsappNumbers(updated);
                          }}
                          className="h-8 w-8 p-0 text-status-error hover:bg-status-error/10 shrink-0"
                          title="Hapus nomor ini"
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <span className="text-[10px] text-foreground-muted block">
                    Format nomor: 628... atau 08... User akan dapat memilih menghubungi CS 1, CS 2, dst.
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
              <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Pengaturan'}</span>
            </Button>
          </div>
        </div>

        {/* Right Column: Live Simulator / Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faEye} className="w-4 h-4 text-primary" />
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
                    <FontAwesomeIcon icon={faCheck} className="w-4 h-4 shrink-0" />
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
                    <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 shrink-0" />
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
                  <div className={`p-3 bg-surface border rounded-lg space-y-2 transition-all ${isBankActive ? 'border-border' : 'border-border/60 opacity-50'}`}>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                      <span>Transfer Bank BCA:</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${isBankActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {isBankActive ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </div>
                    {isBankActive ? (
                      <>
                        <div className="flex items-center justify-between font-mono bg-surface-raised px-2.5 py-1.5 rounded border border-border text-foreground">
                          <span>{bankAccountNumber}</span>
                          <span className="text-[10px] text-primary">Salin</span>
                        </div>
                        <div className="text-[10px] text-foreground-muted">
                          a.n {bankAccountName} ({bankName})
                        </div>
                      </>
                    ) : (
                      <p className="text-[10px] text-foreground-muted italic">Metode ini dinonaktifkan dari pilihan checkout pelanggan.</p>
                    )}
                  </div>

                  {/* QRIS / DANA Quick Preview */}
                  <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                    <div className={`p-2 bg-surface border rounded-lg transition-all ${isQrisActive ? 'border-border' : 'border-border/60 opacity-50'}`}>
                      <FontAwesomeIcon icon={faQrcode} className={`w-4 h-4 mx-auto mb-1 ${isQrisActive ? 'text-primary' : 'text-foreground-muted'}`} />
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-semibold block text-foreground">QRIS Toko</span>
                        <span className={`text-[8px] px-1 rounded ${isQrisActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {isQrisActive ? 'Aktif' : 'Off'}
                        </span>
                      </div>
                      <span className="text-foreground-muted truncate block">{qrisMerchantName}</span>
                    </div>
                    <div className={`p-2 bg-surface border rounded-lg transition-all ${isDanaActive ? 'border-border' : 'border-border/60 opacity-50'}`}>
                      <FontAwesomeIcon icon={faMobileScreen} className={`w-4 h-4 mx-auto mb-1 ${isDanaActive ? 'text-primary' : 'text-foreground-muted'}`} />
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-semibold block text-foreground">DANA</span>
                        <span className={`text-[8px] px-1 rounded ${isDanaActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {isDanaActive ? 'Aktif' : 'Off'}
                        </span>
                      </div>
                      <span className="text-foreground-muted font-mono block">{danaNumber}</span>
                    </div>
                  </div>

                  {/* WhatsApp CTA Button Simulation */}
                  <div className="pt-1">
                    <div className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 text-xs cursor-pointer shadow-md">
                      <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3.5 h-3.5" />
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
              <FontAwesomeIcon icon={faCircleInfo} className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                Perubahan pada halaman ini berdampak langsung saat pelanggan mengakses halaman checkout.
              </span>
            </div>
          </div>

          {/* Card: Dynamic Tripay Webhook & Callback Info */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 text-status-success" />
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
                    {copiedKey === 'webhook' ? <FontAwesomeIcon icon={faCheck} className="w-3 h-3" /> : <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />}
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
                    {copiedKey === 'return' ? <FontAwesomeIcon icon={faCheck} className="w-3 h-3" /> : <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />}
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
