'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  HelpCircle,
  MessageSquare,
  Gift,
  Lock,
  Eye,
  EyeOff,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface PartnerResult {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  code: string;
  rate: number;
  tier: string;
  joinedAt: string;
}

function DaftarSalesContent() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get('ref') || '';

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState(initialRef);
  const [customCode, setCustomCode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successPartner, setSuccessPartner] = useState<PartnerResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Referral code real-time validation status
  const [validatingRef, setValidatingRef] = useState(false);
  const [refValidationMessage, setRefValidationMessage] = useState<string | null>(null);
  const [isRefValid, setIsRefValid] = useState<boolean | null>(null);
  const [sponsorData, setSponsorData] = useState<{ code: string; partnerName: string; tier?: string } | null>(null);

  // Commission Simulator State
  const [estimatedSales, setEstimatedSales] = useState(40);

  // Auto-detect referral code from localStorage if not in URL query
  useEffect(() => {
    if (!initialRef && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('asterra_ref');
        if (stored && stored.trim()) {
          setReferralCode(stored.trim().toUpperCase());
        }
      } catch (_) {}
    }
  }, [initialRef]);

  // Validate referral code when user stops typing or when initialRef is present
  useEffect(() => {
    if (!referralCode.trim()) {
      setRefValidationMessage(null);
      setIsRefValid(null);
      setSponsorData(null);
      return;
    }

    const timer = setTimeout(async () => {
      setValidatingRef(true);
      try {
        const res = await fetch(`/api/v1/affiliate/validate-referral?code=${encodeURIComponent(referralCode.trim())}`);
        const data = await res.json();
        if (data.valid && data.data) {
          setIsRefValid(true);
          setSponsorData(data.data);
          setRefValidationMessage(`Kode referral valid! Diundang oleh mitra ${data.data.partnerName} (${data.data.code})`);
        } else {
          setIsRefValid(false);
          setSponsorData(null);
          setRefValidationMessage('Kode referral tidak ditemukan di sistem. Hapus jika Anda mendaftar mandiri.');
        }
      } catch {
        setIsRefValid(null);
        setRefValidationMessage(null);
        setSponsorData(null);
      } finally {
        setValidatingRef(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [referralCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!agreeTerms) {
      setErrorMessage('Anda wajib menyetujui syarat & ketentuan kemitraan sales Asterra Store.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Kata sandi akun sales wajib diisi minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok. Harap periksa kembali.');
      return;
    }

    // STRICT GUARD: Block submit if referral code is entered but invalid or validating
    if (referralCode.trim() && isRefValid === false) {
      setErrorMessage('Kode referral pengajak tidak valid. Harap periksa kembali atau hapus kode jika Anda mendaftar mandiri.');
      return;
    }

    if (referralCode.trim() && validatingRef) {
      setErrorMessage('Harap tunggu sebentar, sistem sedang memverifikasi kode referral pengajak.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/v1/affiliate/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          whatsapp,
          password,
          referralCode: referralCode.trim() || undefined,
          customCode: customCode.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengirim formulir pendaftaran sales.');
      }

      setSuccessPartner(data.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi gangguan koneksi. Silakan coba lagi.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReferralUrl = (code: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/?ref=${code}`;
    }
    return `https://asterrastore.biz.id/?ref=${code}`;
  };

  const handleCopyLink = (code: string) => {
    const link = getReferralUrl(code);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full space-y-12">
        {/* ================================================================= */}
        {/* SUCCESS STATE */}
        {/* ================================================================= */}
        {successPartner ? (
          <div className="bg-surface border border-status-success/40 rounded-2xl p-6 sm:p-10 shadow-xl space-y-8 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-3 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-status-success/15 text-status-success border border-status-success/30 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <Badge variant="outline" className="text-xs font-semibold text-status-success border-status-success/30 bg-status-success/10">
                Pendaftaran Berhasil & Akun Aktif
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Selamat Bergabung, {successPartner.name}!
              </h1>
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                Anda kini resmi menjadi bagian dari Tim Sales & Mitra Afiliasi Asterra Store dengan skema bagi hasil{' '}
                <strong className="text-status-success font-semibold">10% dari Profit Transaksi</strong>.
              </p>
            </div>

            {/* Referral Code Showcase Box */}
            <div className="bg-surface-raised border border-border rounded-xl p-5 sm:p-6 space-y-4 max-w-xl mx-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Kode Referral Resmi Anda:</span>
                <span className="text-[11px] font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                  {successPartner.code}
                </span>
              </div>

              <div>
                <label className="text-[11px] text-foreground-muted block mb-1.5">
                  Link Promosi Toko Anda (Bagikan ke calon pembeli):
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={getReferralUrl(successPartner.code)}
                    className="bg-surface border-border text-xs font-mono text-foreground select-all h-10"
                  />
                  <Button
                    type="button"
                    onClick={() => handleCopyLink(successPartner.code)}
                    className="shrink-0 text-xs h-10 gap-1.5"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-status-success" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Link</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-xs text-foreground space-y-1">
                <p className="font-semibold text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cara Kerja Penghasilan Anda:</span>
                </p>
                <p className="text-[11px] text-foreground-muted leading-relaxed">
                  Setiap transaksi dari pembeli yang membuka website Asterra Store menggunakan link referral Anda akan otomatis tercatat. Komisi sebesar 10% dari Profit Bersih Transaksi akan otomatis dialokasikan ke akun Anda (dengan masa holding garansi 3 hari).
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/sales/login" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto text-xs h-10 gap-2 bg-primary font-bold shadow-sm">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Masuk ke Portal Sales Saya</span>
                </Button>
              </Link>

              <a
                href={`https://wa.me/6281298765432?text=Halo%20Admin%20Asterra%20Store,%20saya%20sudah%20mendaftar%20jadi%20Sales%20dengan%20nama%20${encodeURIComponent(
                  successPartner.name
                )}%20dan%20kode%20${encodeURIComponent(successPartner.code)}.%20Mohon%20panduan%20promosi%20dan%20katalognya.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-status-success hover:bg-status-success/90 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Hubungi Admin WhatsApp</span>
              </a>

              <Link href="/" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full text-xs h-10 border-border">
                  Kembali ke Toko
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* REGISTRATION FORM & HERO */
          /* ================================================================= */
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold">
                <Gift className="w-3.5 h-3.5" />
                <span>Program Kemitraan Sales & Affiliate Resmi</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                Daftar Jadi Mitra Sales Asterra Store
              </h1>
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                Dapatkan komisi <strong className="text-foreground">10% hingga 15% per transaksi</strong> hanya dengan membagikan link produk digital bergaransi kami ke teman, komunitas, atau media sosial Anda.
              </p>
            </div>

            {/* 3 Benefit Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2.5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <PercentIcon />
                </div>
                <h3 className="font-bold text-sm text-foreground">Komisi Menarik 10% – 15%</h3>
                <p className="text-xs text-foreground-muted leading-relaxed">
                  Bagi hasil transparan dari setiap penjualan akun Canva Pro, Gemini AI, Netflix, dan Spotify.
                </p>
              </div>

              <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2.5">
                <div className="w-10 h-10 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Pencairan Dana Cepat</h3>
                <p className="text-xs text-foreground-muted leading-relaxed">
                  Minimal payout hanya Rp 50.000. Komisi bisa langsung ditarik ke rekening bank (BCA, Mandiri, BNI, BRI) atau E-Wallet.
                </p>
              </div>

              <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2.5">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Produk Resmi & Bergaransi</h3>
                <p className="text-xs text-foreground-muted leading-relaxed">
                  Semua akun memiliki garansi penuh penggantian akun 100%, sehingga pembeli Anda percaya dan repeat order tinggi.
                </p>
              </div>
            </div>

            {/* Registration Form Card */}
            <div className="bg-surface border border-border rounded-2xl p-6 sm:p-10 shadow-sm max-w-xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-2">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-foreground">Formulir Pendaftaran Mitra Sales</h2>
                  <p className="text-xs text-foreground-muted">
                    Lengkapi data diri Anda di bawah ini untuk mengaktifkan akun & kode referral.
                  </p>
                </div>
                <Link href="/sales/login">
                  <Badge variant="outline" className="text-[11px] font-semibold text-primary border-primary/30 hover:bg-primary/10 transition-colors py-1 px-2.5 shrink-0 self-start sm:self-auto cursor-pointer">
                    Sudah Punya Akun? Login &rarr;
                  </Badge>
                </Link>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-lg bg-status-error/15 border border-status-error/30 text-status-error text-xs flex items-center gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* 1. Nama Lengkap */}
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    Nama Lengkap <span className="text-status-error">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Contoh: Andi Pratama"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-surface-raised border-border text-xs h-10"
                  />
                  <span className="text-[11px] text-foreground-muted mt-1 block">
                    Gunakan nama asli untuk verifikasi pencairan komisi bank.
                  </span>
                </div>

                {/* 2. Alamat Email */}
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    Alamat Email Aktif <span className="text-status-error">*</span>
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-surface-raised border-border text-xs h-10"
                  />
                  <span className="text-[11px] text-foreground-muted mt-1 block">
                    Email ini digunakan untuk login ke portal sales & menerima notifikasi komisi.
                  </span>
                </div>

                {/* 3. Nomor WhatsApp */}
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    Nomor WhatsApp Aktif <span className="text-status-error">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="tel"
                      required
                      placeholder="081234567890 atau 6281234567890"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="bg-surface-raised border-border text-xs font-mono h-10"
                    />
                  </div>
                  <span className="text-[11px] text-foreground-muted mt-1 block">
                    Digunakan untuk koordinasi promosi dan konfirmasi pencairan dana via CS WhatsApp.
                  </span>
                </div>

                {/* 3b. Kata Sandi Akun Sales */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="sales-password" className="font-semibold text-foreground flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-primary" />
                      <span>Kata Sandi Akun Sales</span>
                      <span className="text-status-error">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPassword ? 'Sembunyikan' : 'Lihat Sandi'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="sales-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="Minimal 6 karakter untuk login"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-surface-raised border-border text-xs h-10 pr-10"
                    />
                  </div>
                  <span className="text-[11px] text-foreground-muted block">
                    Digunakan untuk login langsung ke Portal Mitra Sales Asterra Store Anda.
                  </span>
                </div>

                {/* 3c. Konfirmasi Kata Sandi */}
                <div className="space-y-1.5">
                  <label htmlFor="sales-confirm-password" className="font-semibold text-foreground flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    <span>Konfirmasi Kata Sandi</span>
                    <span className="text-status-error">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="sales-confirm-password"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="Ulangi kata sandi yang sama"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-surface-raised border-border text-xs h-10"
                    />
                  </div>
                  {password && confirmPassword && password !== confirmPassword && (
                    <span className="text-[11px] text-status-error block font-medium">
                      Kata sandi dan konfirmasi belum cocok.
                    </span>
                  )}
                </div>

                {/* 4. Kode Referral Jika Punya */}
                <div className="pt-2 border-t border-border/70">
                  <label className="font-semibold text-foreground flex items-center justify-between mb-1">
                    <span>Kode Referral Pengajak (Jika Punya)</span>
                    <span className="text-[10px] text-foreground-muted font-normal">(Opsional)</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="sales-referral-code"
                      name="referralCode"
                      type="text"
                      placeholder="Contoh: AST-IQBAL"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className={`bg-surface-raised text-xs font-mono uppercase h-10 pr-28 transition-colors ${
                        isRefValid === true
                          ? 'border-status-success focus-visible:ring-status-success text-status-success font-semibold'
                          : isRefValid === false
                          ? 'border-status-error focus-visible:ring-status-error text-status-error'
                          : 'border-border'
                      }`}
                    />
                    {validatingRef && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-foreground-muted animate-pulse">
                        Memeriksa...
                      </span>
                    )}
                    {isRefValid === true && !validatingRef && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-status-success flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Valid</span>
                      </span>
                    )}
                    {isRefValid === false && !validatingRef && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-status-error flex items-center gap-1">
                        <X className="w-3.5 h-3.5" />
                        <span>Tidak Valid</span>
                      </span>
                    )}
                  </div>
                  {refValidationMessage && (
                    <span
                      className={`text-[11px] mt-1.5 block font-medium ${
                        isRefValid === true
                          ? 'text-status-success'
                          : isRefValid === false
                          ? 'text-status-error'
                          : 'text-foreground-muted'
                      }`}
                    >
                      {refValidationMessage}
                    </span>
                  )}

                  {/* Sponsor Confirmation Card */}
                  {isRefValid === true && sponsorData && (
                    <div className="mt-2.5 p-3 rounded-lg border border-status-success/30 bg-status-success/5 flex flex-col gap-1.5 animate-in fade-in duration-200">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-status-success/20 flex items-center justify-center text-status-success shrink-0 mt-0.5">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">
                              Mitra Pengajak:{' '}
                              <span className="text-status-success">{sponsorData.partnerName}</span>{' '}
                              <span className="font-mono text-foreground-muted">({sponsorData.code})</span>
                            </p>
                            <p className="text-[11px] text-foreground-muted leading-tight mt-0.5">
                              Anda mendaftar di bawah bimbingan mitra ini. Hak komisi penjualan langsung Anda tetap 100% utuh (10%).
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setReferralCode('');
                            setIsRefValid(null);
                            setSponsorData(null);
                            setRefValidationMessage(null);
                            try {
                              localStorage.removeItem('asterra_ref');
                            } catch (_) {}
                          }}
                          className="text-[10px] text-status-error hover:underline font-medium shrink-0 ml-1 py-0.5 px-1.5 rounded hover:bg-status-error/10 transition-colors"
                        >
                          Hapus / Mandiri
                        </button>
                      </div>
                    </div>
                  )}

                  {!referralCode && (
                    <span className="text-[10px] text-foreground-muted mt-1 block">
                      Masukkan kode mitra yang mengajak Anda jika ada. Kosongkan jika Anda mendaftar mandiri.
                    </span>
                  )}
                </div>

                {/* 5. Kustomisasi Kode Referral Sendiri (Opsional) */}
                <div>
                  <label className="font-semibold text-foreground flex items-center justify-between mb-1">
                    <span>Permintaan Kode Referral Unik Anda</span>
                    <span className="text-[10px] text-foreground-muted font-normal">(Opsional)</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Contoh: ANDI-STORE (Kosongkan untuk otomatis)"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                    className="bg-surface-raised border-border text-xs font-mono uppercase h-10"
                  />
                  <span className="text-[10px] text-foreground-muted mt-1 block">
                    Sistem akan otomatis memberi awalan AST- (misal: AST-ANDI-STORE).
                  </span>
                </div>

                {/* Checkbox Syarat & Ketentuan */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded border-border text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="text-[11px] text-foreground-muted leading-relaxed">
                      Saya menyetujui <span className="text-foreground font-medium">Syarat & Ketentuan Mitra Sales</span> Asterra Store, bersedia menjaga etika promosi resmi, dan tidak melakukan spamming.
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-xs font-bold h-11 gap-2 shadow-md mt-2"
                >
                  {isSubmitting ? (
                    <span>Mendaftarkan Akun Sales...</span>
                  ) : (
                    <>
                      <span>Daftar Jadi Sales Sekarang</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <div className="pt-2 text-center text-xs text-foreground-muted">
                  Sudah terdaftar sebagai mitra sales?{' '}
                  <Link href="/sales/login" className="text-primary font-bold hover:underline">
                    Masuk ke Portal Sales di sini
                  </Link>
                </div>
              </form>
            </div>

            {/* Interactive Commission Simulator */}
            <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-xs max-w-xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Kalkulator Estimasi Penghasilan Sales</span>
                  </h3>
                  <p className="text-xs text-foreground-muted">
                    Geser slider untuk melihat proyeksi komisi bulanan Anda.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-foreground-muted">Perkiraan Akun Terjual:</span>
                  <span className="font-bold font-mono text-foreground text-sm">{estimatedSales} Akun / Bulan</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="150"
                  step="5"
                  value={estimatedSales}
                  onChange={(e) => setEstimatedSales(Number(e.target.value))}
                  className="w-full h-2 bg-surface-raised rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="p-4 rounded-xl bg-status-success/10 border border-status-success/30 flex items-center justify-between text-xs">
                <div>
                  <span className="text-foreground-muted block text-[11px]">Proyeksi Komisi Bulanan Anda:</span>
                  <span className="text-lg sm:text-xl font-extrabold text-status-success font-mono">
                    Rp {(estimatedSales * 1000).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-foreground-muted block mt-0.5">
                    (Estimasi profit rata-rata Rp 10.000 / transaksi)
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] text-status-success border-status-success/40 bg-status-success/15 font-semibold">
                  10% dari Profit Transaksi
                </Badge>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-xs max-w-xl mx-auto space-y-4">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-foreground-muted" />
                <span>Pertanyaan Umum (FAQ) Program Sales</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-surface-raised border border-border space-y-1">
                  <span className="font-semibold text-foreground block">
                    1. Apakah ada biaya untuk mendaftar jadi sales?
                  </span>
                  <p className="text-[11px] text-foreground-muted leading-relaxed">
                    Sama sekali tidak ada biaya (100% Gratis). Siapa saja bisa mendaftar dan langsung mendapatkan link referral resmi.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-surface-raised border border-border space-y-1">
                  <span className="font-semibold text-foreground block">
                    2. Kapan komisi penjualan bisa dicairkan?
                  </span>
                  <p className="text-[11px] text-foreground-muted leading-relaxed">
                    Komisi bisa diajukan pencairan kapan saja dengan batas saldo minimal Rp 50.000 ke rekening bank atau e-wallet Anda.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-surface-raised border border-border space-y-1">
                  <span className="font-semibold text-foreground block">
                    3. Bagaimana cara mempromosikan produk?
                  </span>
                  <p className="text-[11px] text-foreground-muted leading-relaxed">
                    Cukup bagikan link referral Anda ke calon pembeli. Pembeli akan diarahkan ke katalog toko kami dan sistem otomatis mencatat pesanan atas nama Anda.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PercentIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm11 5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  );
}

export default function DaftarSalesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-xs text-foreground-muted">
          Memuat formulir pendaftaran sales...
        </div>
      }
    >
      <DaftarSalesContent />
    </Suspense>
  );
}
