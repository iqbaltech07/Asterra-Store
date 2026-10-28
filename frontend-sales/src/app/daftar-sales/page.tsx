'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWallet,
  faCircleCheck,
  faCircleExclamation,
  faCopy,
  faCheck,
  faShieldHalved,
  faCoins,
  faArrowRight,
  faCircleQuestion,
  faComments,
  faGift,
  faLock,
  faEye,
  faEyeSlash,
  faUsers,
  faXmark,
  faPercent,
  faEnvelope,
  faRotateRight,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getStoreBaseUrl } from '@/lib/utils/url';
import { CommissionSimulator } from '@/components/sales/commission-simulator';
import { ActivePromoCard } from '@/components/promo/active-promo-card';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successPartner, setSuccessPartner] = useState<PartnerResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // OTP Verification States
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [pendingOtpEmail, setPendingOtpEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Referral code real-time validation status
  const [validatingRef, setValidatingRef] = useState(false);
  const [refValidationMessage, setRefValidationMessage] = useState<string | null>(null);
  const [isRefValid, setIsRefValid] = useState<boolean | null>(null);
  const [sponsorData, setSponsorData] = useState<{ code: string; partnerName: string; tier?: string } | null>(null);

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

  // Resend OTP countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isVerifyingOtp && resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [isVerifyingOtp, resendCountdown]);

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

    registerMutation.mutate({
      name,
      email,
      whatsapp,
      password,
      referralCode: referralCode.trim() || undefined,
      customCode: customCode.trim() || undefined,
    });
  };

  const registerMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      email: string;
      whatsapp: string;
      password: string;
      referralCode?: string;
      customCode?: string;
    }) => {
      const res = await fetch('/api/v1/affiliate/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengirim formulir pendaftaran sales.');
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.requireOtp) {
        setIsVerifyingOtp(true);
        setPendingOtpEmail(data.email || email);
        setResendCountdown(60);
        setOtpDigits(['', '', '', '', '', '']);
        setOtpError(null);
        setOtpSuccessMsg(null);
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 150);
      } else {
        setSuccessPartner(data.data);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Terjadi gangguan koneksi. Silakan coba lagi.';
      setErrorMessage(msg);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (payload: { email: string; otp: string }) => {
      const res = await fetch('/api/v1/affiliate/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Kode OTP tidak cocok atau sudah kedaluwarsa.');
      }
      return data;
    },
    onSuccess: (data) => {
      setSuccessPartner(data.data);
      setIsVerifyingOtp(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Gagal memverifikasi OTP. Silakan periksa kembali.';
      setOtpError(msg);
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: async (payload: { email: string }) => {
      const res = await fetch('/api/v1/affiliate/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal meminta kode OTP baru.');
      }
      return data;
    },
    onSuccess: (data) => {
      setResendCountdown(60);
      setOtpSuccessMsg(data.message || 'Kode OTP baru telah berhasil dikirim ke email Anda.');
      setOtpError(null);
      setTimeout(() => setOtpSuccessMsg(null), 6000);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim ulang kode OTP.';
      setOtpError(msg);
    },
  });

  const handleOtpChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (!cleaned) {
      const nextDigits = [...otpDigits];
      nextDigits[index] = '';
      setOtpDigits(nextDigits);
      return;
    }

    if (cleaned.length > 1) {
      // Pasted or rapid entry
      const chars = cleaned.slice(0, 6).split('');
      const nextDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        if (chars[i]) nextDigits[i] = chars[i];
      }
      setOtpDigits(nextDigits);
      const focusTarget = Math.min(chars.length, 5);
      inputRefs.current[focusTarget]?.focus();
      return;
    }

    const nextDigits = [...otpDigits];
    nextDigits[index] = cleaned;
    setOtpDigits(nextDigits);
    setOtpError(null);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const nextDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      nextDigits[i] = pasted[i];
    }
    setOtpDigits(nextDigits);
    setOtpError(null);
    const targetIdx = Math.min(pasted.length, 5);
    inputRefs.current[targetIdx]?.focus();
  };

  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setOtpError('Harap masukkan 6 digit kode OTP secara lengkap.');
      return;
    }
    verifyOtpMutation.mutate({
      email: pendingOtpEmail,
      otp: fullOtp,
    });
  };

  const handleResendOtp = () => {
    if (resendCountdown > 0 || resendOtpMutation.isPending) return;
    setOtpError(null);
    resendOtpMutation.mutate({ email: pendingOtpEmail });
  };

  const handleBackToForm = () => {
    setIsVerifyingOtp(false);
    setOtpError(null);
    setOtpSuccessMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getReferralUrl = (code: string) => {
    return `${getStoreBaseUrl()}/?ref=${code}`;
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
        {/* OTP VERIFICATION STATE */}
        {/* ================================================================= */}
        {isVerifyingOtp && !successPartner ? (
          <div className="bg-surface border border-primary/30 rounded-2xl p-6 sm:p-10 shadow-xl space-y-8 max-w-xl mx-auto animate-in fade-in zoom-in-95">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary border border-primary/25 flex items-center justify-center mx-auto shadow-sm">
                <FontAwesomeIcon icon={faEnvelope} className="text-2xl" />
              </div>
              <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30 bg-primary/10">
                Langkah Terakhir • Verifikasi Email
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Masukkan Kode Verifikasi OTP
              </h1>
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed max-w-md mx-auto">
                Kami telah mengirim 6 digit kode OTP ke alamat email{' '}
                <strong className="text-foreground font-semibold underline underline-offset-2">{pendingOtpEmail}</strong>.
                Masukkan kode tersebut di bawah ini untuk mengaktifkan akun kemitraan Anda.
              </p>
            </div>

            {/* Error / Success Feedback */}
            {otpError && (
              <div className="p-3.5 rounded-lg bg-status-error/15 border border-status-error/30 text-status-error text-xs flex items-center gap-2.5 animate-in fade-in">
                <FontAwesomeIcon icon={faCircleExclamation} className="text-sm shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            {otpSuccessMsg && (
              <div className="p-3.5 rounded-lg bg-status-success/15 border border-status-success/30 text-status-success text-xs flex items-center gap-2.5 animate-in fade-in">
                <FontAwesomeIcon icon={faCircleCheck} className="text-sm shrink-0" />
                <span>{otpSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
              {/* 6 Digit Input Boxes */}
              <div>
                <label className="text-[11px] font-semibold text-foreground-muted block text-center mb-3">
                  6 DIGIT KODE VERIFIKASI:
                </label>
                <div className="flex justify-center items-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-10 h-13 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl bg-surface-raised border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors shadow-inner"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={otpDigits.join('').length !== 6 || verifyOtpMutation.isPending}
                className="w-full text-xs font-bold h-11 gap-2 shadow-md cursor-pointer disabled:cursor-not-allowed"
              >
                {verifyOtpMutation.isPending ? (
                  <span>Memverifikasi Akun Sales...</span>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCircleCheck} className="text-xs" />
                    <span>Verifikasi & Aktifkan Akun</span>
                  </>
                )}
              </Button>

              {/* Resend OTP & Cooldown */}
              <div className="flex flex-col sm:flex-row items-center justify-between text-xs pt-1 border-t border-border/70 gap-2">
                <div className="text-foreground-muted text-[11px] sm:text-xs">
                  {resendCountdown > 0 ? (
                    <span>
                      Kirim ulang kode dalam <strong className="font-mono text-foreground font-semibold">{resendCountdown} detik</strong>
                    </span>
                  ) : (
                    <span>Tidak menerima kode di email?</span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={resendCountdown > 0 || resendOtpMutation.isPending}
                  onClick={handleResendOtp}
                  className={`inline-flex items-center gap-1.5 font-semibold text-xs transition-colors ${
                    resendCountdown > 0 || resendOtpMutation.isPending
                      ? 'text-foreground-muted/50 cursor-not-allowed'
                      : 'text-primary hover:underline cursor-pointer'
                  }`}
                >
                  <FontAwesomeIcon
                    icon={faRotateRight}
                    className={`text-xs ${resendOtpMutation.isPending ? 'animate-spin' : ''}`}
                  />
                  <span>
                    {resendOtpMutation.isPending ? 'Mengirim ulang...' : 'Kirim Ulang Kode OTP'}
                  </span>
                </button>
              </div>

              {/* Back to form link */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleBackToForm}
                  className="inline-flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="text-[10px]" />
                  <span>Salah ketik email? Kembali & ubah data formulir</span>
                </button>
              </div>
            </form>

            <div className="p-3.5 bg-surface-raised border border-border/80 rounded-xl text-[11px] text-foreground-muted space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <FontAwesomeIcon icon={faShieldHalved} className="text-primary text-xs" />
                <span>Petunjuk Verifikasi:</span>
              </p>
              <p>• Jika email belum terlihat di Inbox utama, mohon periksa folder <strong>Spam / Promotions / Update</strong>.</p>
              <p>• Kode OTP berlaku selama <strong>10 menit</strong>. Akun sales Anda akan langsung aktif setelah kode diverifikasi.</p>
            </div>
          </div>
        ) : successPartner ? (
          <div className="bg-surface border border-status-success/40 rounded-2xl p-6 sm:p-10 shadow-xl space-y-8 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-3 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-status-success/15 text-status-success border border-status-success/30 flex items-center justify-center mx-auto shadow-sm">
                <FontAwesomeIcon icon={faCircleCheck} className="text-2xl" />
              </div>
              <Badge variant="outline" className="text-xs font-semibold text-status-success border-status-success/30 bg-status-success/10">
                Pendaftaran Berhasil & Akun Aktif
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Selamat Bergabung, {successPartner.name}!
              </h1>
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                Anda kini resmi menjadi bagian dari Tim Sales & Mitra Afiliasi Asterra Store dengan skema bagi hasil{' '}
                <strong className="text-status-success font-semibold">15% – 20% dari Profit Transaksi</strong>.
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
                        <FontAwesomeIcon icon={faCheck} className="text-xs text-status-success" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faCopy} className="text-xs" />
                        <span>Salin Link</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-xs text-foreground space-y-1">
                <p className="font-semibold text-primary flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCoins} className="text-xs" />
                  <span>Cara Kerja Penghasilan Anda:</span>
                </p>
                <p className="text-[11px] text-foreground-muted leading-relaxed">
                  Setiap transaksi dari pembeli yang membuka website Asterra Store menggunakan link referral Anda akan otomatis tercatat. Komisi sebesar 15% hingga 20% (sesuai performa) dari Profit Bersih Transaksi akan otomatis dialokasikan ke akun Anda (dengan masa holding garansi 3 hari).
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/sales/login" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto text-xs h-10 gap-2 bg-primary font-bold shadow-sm">
                  <FontAwesomeIcon icon={faLock} className="text-xs" />
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
                <FontAwesomeIcon icon={faComments} className="text-sm" />
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
          <div className="space-y-12 sm:space-y-16">
            {/* 1. Hero Section */}
            <div className="text-center space-y-4 max-w-3xl mx-auto px-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold">
                <FontAwesomeIcon icon={faGift} className="text-xs" />
                <span>Program Kemitraan Sales & Affiliate Resmi Asterra Store</span>
              </div>
              <h1
                data-gsap="daftar-title"
                className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight"
              >
                Daftar Jadi Mitra Sales Asterra Store
              </h1>
              <p
                data-gsap="daftar-desc"
                className="text-xs sm:text-sm md:text-base text-foreground-muted leading-relaxed max-w-2xl mx-auto"
              >
                Dapatkan bagi hasil komisi transparan <strong className="text-foreground">15% hingga 20% dari Profit Bersih</strong> setiap penjualan produk digital bergaransi kami, plus <strong className="text-primary">2% bonus rekrutmen tim</strong> tanpa repot stok dan pengiriman.
              </p>
            </div>

            {/* 2. Three Benefit Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
              <div
                data-gsap="daftar-feature-card"
                className="bg-surface border border-border rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-3"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  <FontAwesomeIcon icon={faPercent} className="text-lg" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-foreground">
                    Komisi Transparan 15% – 20%
                  </h3>
                  <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                    Bagi hasil dihitung murni dari Profit Transaksi bersih penjualan akun Canva Pro, Gemini AI, ChatGPT, Netflix, dan Spotify.
                  </p>
                </div>
              </div>

              <div
                data-gsap="daftar-feature-card"
                className="bg-surface border border-border rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-3"
              >
                <div className="w-12 h-12 rounded-xl bg-status-success/10 text-status-success flex items-center justify-center font-bold text-lg">
                  <FontAwesomeIcon icon={faWallet} className="text-lg" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-foreground">
                    Pencairan Dana Fleksibel
                  </h3>
                  <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                    Minimal payout hanya Rp 50.000. Komisi dapat langsung dicairkan ke rekening bank (BCA, Mandiri, BNI, BRI) atau E-Wallet (DANA, GoPay, OVO).
                  </p>
                </div>
              </div>

              <div
                data-gsap="daftar-feature-card"
                className="bg-surface border border-border rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-3"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-lg" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-foreground">
                    Produk Resmi & Bergaransi
                  </h3>
                  <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                    Semua akun bergaransi penggantian penuh 100%, dikirim otomatis dalam hitungan menit sehingga repeat order dan kepercayaan pembeli sangat tinggi.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Active Promo Callout Card (Redesign 3: Highlight active 15% promo campaign) */}
            <div className="max-w-4xl mx-auto w-full">
              <ActivePromoCard
                onCtaClick={() => {
                  const el = document.getElementById('kalkulator-sales');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            </div>

            {/* 4. Registration Form Card (Redesign 1: Spacious, balanced, responsive 2-column on desktop) */}
            <div
              data-gsap="daftar-form"
              className="bg-surface border border-border rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-sm max-w-4xl mx-auto space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-5 gap-3">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                    Formulir Pendaftaran Mitra Sales
                  </h2>
                  <p className="text-xs sm:text-sm text-foreground-muted">
                    Lengkapi data diri Anda di bawah ini untuk mengaktifkan akun dan kode referral resmi.
                  </p>
                </div>
                <Link href="/sales/login">
                  <Badge
                    variant="outline"
                    className="text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10 transition-colors py-1.5 px-3.5 shrink-0 self-start sm:self-auto cursor-pointer"
                  >
                    Sudah Punya Akun? Masuk Portal &rarr;
                  </Badge>
                </Link>
              </div>

              {errorMessage && (
                <div className="p-4 rounded-xl bg-status-error/15 border border-status-error/30 text-status-error text-xs sm:text-sm flex items-center gap-3 animate-in fade-in">
                  <FontAwesomeIcon icon={faCircleExclamation} className="text-base shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 text-xs sm:text-sm">
                {/* 2-Column Grid on Tablet/Desktop for Form Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  {/* 1. Nama Lengkap */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground block text-xs sm:text-sm">
                      Nama Lengkap <span className="text-status-error">*</span>
                    </label>
                    <Input
                      type="text"
                      required
                      placeholder="Contoh: Andi Pratama"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-surface-raised border-border text-xs sm:text-sm h-11 px-3.5"
                    />
                    <span className="text-[11px] text-foreground-muted block leading-tight">
                      Gunakan nama asli untuk verifikasi pencairan komisi bank.
                    </span>
                  </div>

                  {/* 2. Alamat Email */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground block text-xs sm:text-sm">
                      Alamat Email Aktif <span className="text-status-error">*</span>
                    </label>
                    <Input
                      type="email"
                      required
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-surface-raised border-border text-xs sm:text-sm h-11 px-3.5"
                    />
                    <span className="text-[11px] text-foreground-muted block leading-tight">
                      Digunakan untuk login ke portal sales & menerima kode OTP.
                    </span>
                  </div>

                  {/* 3. Nomor WhatsApp */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground block text-xs sm:text-sm">
                      Nomor WhatsApp Aktif <span className="text-status-error">*</span>
                    </label>
                    <Input
                      type="tel"
                      required
                      placeholder="081234567890 atau 6281234567890"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="bg-surface-raised border-border text-xs sm:text-sm font-mono h-11 px-3.5"
                    />
                    <span className="text-[11px] text-foreground-muted block leading-tight">
                      Digunakan untuk konfirmasi pencairan dana dan koordinasi CS.
                    </span>
                  </div>

                  {/* 4. Kustomisasi Kode Referral Sendiri (Opsional) */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground flex items-center justify-between text-xs sm:text-sm">
                      <span>Kode Referral Pilihan Anda</span>
                      <span className="text-[11px] text-foreground-muted font-normal">(Opsional)</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Contoh: ANDI-STORE"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                      className="bg-surface-raised border-border text-xs sm:text-sm font-mono uppercase h-11 px-3.5"
                    />
                    <span className="text-[11px] text-foreground-muted block leading-tight">
                      Sistem akan otomatis memberi awalan AST- (misal: AST-ANDI-STORE).
                    </span>
                  </div>

                  {/* 5a. Kata Sandi Akun Sales */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="sales-password" className="font-bold text-foreground flex items-center gap-1.5 text-xs sm:text-sm">
                        <FontAwesomeIcon icon={faLock} className="text-xs text-primary" />
                        <span>Kata Sandi Akun</span>
                        <span className="text-status-error">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-xs" />
                        <span>{showPassword ? 'Sembunyikan' : 'Lihat Sandi'}</span>
                      </button>
                    </div>
                    <Input
                      id="sales-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-surface-raised border-border text-xs sm:text-sm h-11 px-3.5"
                    />
                    <span className="text-[11px] text-foreground-muted block leading-tight">
                      Digunakan untuk login langsung ke Portal Sales Anda.
                    </span>
                  </div>

                  {/* 5b. Konfirmasi Kata Sandi */}
                  <div className="space-y-1.5">
                    <label htmlFor="sales-confirm-password" className="font-bold text-foreground flex items-center gap-1.5 text-xs sm:text-sm">
                      <FontAwesomeIcon icon={faLock} className="text-xs text-primary" />
                      <span>Konfirmasi Kata Sandi</span>
                      <span className="text-status-error">*</span>
                    </label>
                    <Input
                      id="sales-confirm-password"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="Ulangi kata sandi yang sama"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-surface-raised border-border text-xs sm:text-sm h-11 px-3.5"
                    />
                    {password && confirmPassword && password !== confirmPassword ? (
                      <span className="text-[11px] text-status-error block font-medium leading-tight">
                        Kata sandi dan konfirmasi belum cocok.
                      </span>
                    ) : (
                      <span className="text-[11px] text-foreground-muted block leading-tight">
                        Pastikan kedua kata sandi sama persis.
                      </span>
                    )}
                  </div>
                </div>

                {/* 6. Kode Referral Pengajak (Full Width Row) */}
                <div className="pt-3 border-t border-border">
                  <label className="font-bold text-foreground flex items-center justify-between mb-1.5 text-xs sm:text-sm">
                    <span>Kode Referral Pengajak (Jika Ada)</span>
                    <span className="text-[11px] text-foreground-muted font-normal">(Opsional)</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="sales-referral-code"
                      name="referralCode"
                      type="text"
                      placeholder="Contoh: AST-IQBAL"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className={`bg-surface-raised text-xs sm:text-sm font-mono uppercase h-11 px-3.5 pr-28 transition-colors ${
                        isRefValid === true
                          ? 'border-status-success focus-visible:ring-status-success text-status-success font-bold'
                          : isRefValid === false
                          ? 'border-status-error focus-visible:ring-status-error text-status-error'
                          : 'border-border'
                      }`}
                    />
                    {validatingRef && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-foreground-muted animate-pulse">
                        Memeriksa...
                      </span>
                    )}
                    {isRefValid === true && !validatingRef && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-status-success flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faCheck} className="text-xs" />
                        <span>Valid</span>
                      </span>
                    )}
                    {isRefValid === false && !validatingRef && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-status-error flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faXmark} className="text-xs" />
                        <span>Tidak Valid</span>
                      </span>
                    )}
                  </div>

                  {refValidationMessage && (
                    <span
                      className={`text-xs mt-1.5 block font-medium ${
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
                    <div className="mt-3 p-3.5 rounded-xl border border-status-success/30 bg-status-success/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-status-success/20 flex items-center justify-center text-status-success shrink-0 mt-0.5">
                          <FontAwesomeIcon icon={faUsers} className="text-xs" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-foreground">
                            Mitra Pengajak:{' '}
                            <span className="text-status-success">{sponsorData.partnerName}</span>{' '}
                            <span className="font-mono text-foreground-muted">({sponsorData.code})</span>
                          </p>
                          <p className="text-xs text-foreground-muted leading-relaxed mt-0.5">
                            Anda mendaftar di bawah bimbingan mitra ini. Hak komisi penjualan langsung Anda tetap 100% utuh (15% – 20%).
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
                        className="text-xs text-status-error hover:underline font-medium shrink-0 self-start sm:self-auto py-1 px-2 rounded hover:bg-status-error/10 transition-colors"
                      >
                        Hapus / Mandiri
                      </button>
                    </div>
                  )}

                  {!referralCode && (
                    <span className="text-[11px] text-foreground-muted mt-1.5 block">
                      Masukkan kode mitra yang mengajak Anda jika ada. Kosongkan jika Anda mendaftar mandiri.
                    </span>
                  )}
                </div>

                {/* Checkbox Syarat & Ketentuan */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-1 rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                      Saya menyetujui <span className="text-foreground font-semibold">Syarat & Ketentuan Mitra Sales</span> Asterra Store, bersedia menjaga etika promosi resmi, dan tidak melakukan spamming.
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  data-gsap="daftar-button"
                  disabled={registerMutation.isPending}
                  className="w-full text-xs sm:text-sm font-bold h-12 gap-2 shadow-md mt-3 cursor-pointer"
                >
                  {registerMutation.isPending ? (
                    <span>Mendaftarkan Akun Sales...</span>
                  ) : (
                    <>
                      <span>Daftar Jadi Sales Sekarang</span>
                      <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                    </>
                  )}
                </Button>

                <div className="pt-2 text-center text-xs sm:text-sm text-foreground-muted">
                  Sudah terdaftar sebagai mitra sales?{' '}
                  <Link href="/sales/login" className="text-primary font-bold hover:underline">
                    Masuk ke Portal Sales di sini
                  </Link>
                </div>
              </form>
            </div>

            {/* 5. Interactive Commission Simulator (Redesign 2) */}
            <div className="max-w-5xl mx-auto w-full">
              <CommissionSimulator />
            </div>

            {/* 6. FAQ Section */}
            <div className="bg-surface border border-border rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-xs max-w-4xl mx-auto space-y-5">
              <div className="space-y-1">
                <h3 className="font-extrabold text-base sm:text-lg text-foreground flex items-center gap-2">
                  <FontAwesomeIcon icon={faCircleQuestion} className="text-sm text-primary" />
                  <span>Pertanyaan Umum (FAQ) Program Sales</span>
                </h3>
                <p className="text-xs sm:text-sm text-foreground-muted">
                  Hal-hal penting yang sering ditanyakan seputar pendaftaran, pencairan, dan komisi kemitraan.
                </p>
              </div>

              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-1.5">
                  <span className="font-bold text-foreground block">
                    1. Apakah ada biaya untuk mendaftar jadi sales?
                  </span>
                  <p className="text-xs text-foreground-muted leading-relaxed">
                    Sama sekali tidak ada biaya (100% Gratis). Siapa saja bisa mendaftar, mendapatkan akun portal mandiri, dan langsung memperoleh kode referral resmi tanpa modal awal stok barang.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-1.5">
                  <span className="font-bold text-foreground block">
                    2. Kapan komisi penjualan bisa dicairkan?
                  </span>
                  <p className="text-xs text-foreground-muted leading-relaxed">
                    Komisi bisa diajukan pencairan kapan saja dengan batas saldo minimal Rp 50.000 ke rekening bank lokal (BCA, Mandiri, BNI, BRI) atau dompet digital (DANA, OVO, GoPay) Anda.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-1.5">
                  <span className="font-bold text-foreground block">
                    3. Dari mana komisi dihitung dan bagaimana sistem bonus referralnya?
                  </span>
                  <p className="text-xs text-foreground-muted leading-relaxed">
                    Komisi dihitung transparan dari Profit Bersih Transaksi (15% hingga 20% sesuai milestone performa). Jika Anda mengajak rekan sales lain dengan kode Anda, Anda berhak atas bonus rekrutmen 2% dari profit transaksi rekan Anda (maksimal 1 tingkat langsung).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-1.5">
                  <span className="font-bold text-foreground block">
                    4. Bagaimana cara mempromosikan produk?
                  </span>
                  <p className="text-xs text-foreground-muted leading-relaxed">
                    Cukup bagikan link referral Anda ke calon pembeli via WhatsApp, Telegram, atau media sosial. Pembeli diarahkan ke katalog toko kami dan sistem otomatis mencatat pesanan atas nama Anda.
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
