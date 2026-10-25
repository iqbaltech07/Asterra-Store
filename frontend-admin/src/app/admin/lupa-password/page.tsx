'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLock,
  faEnvelope,
  faArrowLeft,
  faSpinner,
  faCircleExclamation,
  faCircleCheck,
  faShieldHalved,
  faKey,
  faRotateRight,
  faEye,
  faEyeSlash,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { AsterraLogo } from '@/components/ui/asterra-logo';

function AdminForgotPasswordContent() {
  const router = useRouter();

  // Steps: 'request' -> 'verify_reset' -> 'success'
  const [step, setStep] = useState<'request' | 'verify_reset' | 'success'>('request');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus OTP input when transitioning to step 2
  useEffect(() => {
    if (step === 'verify_reset') {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 150);
    }
  }, [step]);

  // Step 1: Send OTP to Email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Silakan masukkan alamat email yang valid.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengirim kode OTP. Periksa alamat email Anda.');
      }

      setSuccessMessage(data.message || 'Kode OTP telah berhasil dikirim ke email Anda.');
      setStep('verify_reset');
      setCooldown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan pada server.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || isResending) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    setIsResending(true);
    try {
      const res = await fetch('/api/v1/auth/forgot-password/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengirim ulang kode OTP.');
      }

      setSuccessMessage('Kode OTP baru telah dikirimkan ke email Anda.');
      setCooldown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim ulang kode OTP.';
      setErrorMessage(msg);
    } finally {
      setIsResending(false);
    }
  };

  // Step 2 Submit: Verify OTP & Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanOtp = otp.trim().replace(/\D/g, '');
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMessage('Kode OTP harus terdiri dari 6 digit angka.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Kata sandi baru minimal harus terdiri dari 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: cleanOtp,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengatur ulang kata sandi.');
      }

      setStep('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengatur ulang kata sandi.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const maskedEmail = React.useMemo(() => {
    if (!email || !email.includes('@')) return email;
    const [user, domain] = email.split('@');
    if (user.length <= 2) return `${user}***@${domain}`;
    return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`;
  }, [email]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-12 selection:bg-primary/20 selection:text-primary">
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-2 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors group"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Masuk Administrator</span>
        </Link>
      </div>

      <Card className="w-full max-w-md border-border bg-surface shadow-editorial">
        <CardHeader className="space-y-2 text-center pb-6 pt-6">
          <div className="flex justify-center mb-2">
            <AsterraLogo variant="light-bg" size="md" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold mx-auto">
            <FontAwesomeIcon icon={faShieldHalved} className="text-xs" />
            <span>Portal Administrator & Staf Toko</span>
          </div>

          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {step === 'request' && 'Reset Kunci Sandi Admin'}
            {step === 'verify_reset' && 'Verifikasi OTP & Sandi Baru'}
            {step === 'success' && 'Kata Sandi Berhasil Diperbarui'}
          </CardTitle>

          <CardDescription className="text-xs text-foreground-muted max-w-xs mx-auto leading-relaxed">
            {step === 'request' && 'Masukkan alamat email administrator Anda untuk menerima kode OTP verifikasi 6 digit.'}
            {step === 'verify_reset' && `Kode OTP telah dikirim ke ${maskedEmail}. Masukkan kode dan tentukan kata sandi baru.`}
            {step === 'success' && 'Kata sandi administrator Anda telah diperbarui dengan aman. Silakan masuk kembali.'}
          </CardDescription>
        </CardHeader>

        {/* STEP 1 */}
        {step === 'request' && (
          <form onSubmit={handleRequestOtp}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-md bg-status-error/10 border border-status-error/20 flex items-start gap-2.5 text-xs text-status-error animate-in fade-in">
                  <FontAwesomeIcon icon={faCircleExclamation} className="text-sm shrink-0 mt-0.5 text-status-error" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="admin-reset-email"
                  className="text-xs font-medium text-foreground flex items-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faEnvelope} className="text-xs text-primary" />
                  <span>Email Akun Administrator</span>
                </label>
                <Input
                  id="admin-reset-email"
                  type="email"
                  placeholder="admin@asterra.store"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  autoFocus
                  className="bg-surface-raised border-border text-xs h-10"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 text-[11px] text-blue-700 dark:text-blue-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <span>ℹ️ Pengiriman OTP Instan</span>
                </div>
                <p className="leading-relaxed text-blue-600/90 dark:text-blue-300/80">
                  Kode 6 digit akan dikirim melalui email resmi Asterra Store dan berlaku selama 10 menit.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-2 pb-6">
              <Button
                type="submit"
                className="w-full gap-2 font-bold h-10 text-xs"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="text-sm fa-spin" />
                    <span>Mengirim Kode OTP...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faEnvelope} className="text-xs" />
                    <span>Kirim Kode OTP ke Email</span>
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center w-full pt-1 text-xs text-foreground-muted">
                <Link href="/admin/login" className="text-foreground-muted hover:text-foreground font-medium">
                  Ingat kata sandi Anda? <span className="text-primary font-bold hover:underline">Masuk disini</span>
                </Link>
              </div>
            </CardFooter>
          </form>
        )}

        {/* STEP 2 */}
        {step === 'verify_reset' && (
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-md bg-status-error/10 border border-status-error/20 flex items-start gap-2.5 text-xs text-status-error animate-in fade-in">
                  <FontAwesomeIcon icon={faCircleExclamation} className="text-sm shrink-0 mt-0.5 text-status-error" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-md bg-status-success/10 border border-status-success/20 flex items-center gap-2.5 text-xs text-status-success animate-in fade-in">
                  <FontAwesomeIcon icon={faCircleCheck} className="text-sm shrink-0 text-status-success" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="admin-reset-otp"
                    className="text-xs font-medium text-foreground flex items-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={faShieldHalved} className="text-xs text-primary" />
                    <span>Kode Verifikasi (OTP)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || isResending}
                    className="text-[11px] font-semibold text-primary hover:underline disabled:text-foreground-muted disabled:no-underline flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isResending ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="text-[10px] fa-spin" />
                        <span>Mengirim...</span>
                      </>
                    ) : cooldown > 0 ? (
                      <span>Kirim ulang ({cooldown}s)</span>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faRotateRight} className="text-[10px]" />
                        <span>Kirim Ulang OTP</span>
                      </>
                    )}
                  </button>
                </div>
                <Input
                  ref={otpInputRef}
                  id="admin-reset-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className="bg-surface-raised border-border text-center tracking-[0.4em] font-mono text-base font-bold h-11"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="admin-new-password"
                  className="text-xs font-medium text-foreground flex items-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faKey} className="text-xs text-primary" />
                  <span>Kata Sandi Baru</span>
                </label>
                <div className="relative">
                  <Input
                    id="admin-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    className="bg-surface-raised border-border text-xs h-10 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground p-1 text-xs"
                    tabIndex={-1}
                  >
                    <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="admin-confirm-password"
                  className="text-xs font-medium text-foreground flex items-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faLock} className="text-xs text-primary" />
                  <span>Konfirmasi Kata Sandi Baru</span>
                </label>
                <div className="relative">
                  <Input
                    id="admin-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Ulangi kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    className="bg-surface-raised border-border text-xs h-10 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground p-1 text-xs"
                    tabIndex={-1}
                  >
                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              <div className="space-y-1 pt-1 text-[11px] text-foreground-muted">
                <div className={`flex items-center gap-1.5 ${newPassword.length >= 6 ? 'text-status-success font-medium' : ''}`}>
                  <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                  <span>Minimal 6 karakter</span>
                </div>
                {confirmPassword && (
                  <div className={`flex items-center gap-1.5 ${newPassword === confirmPassword ? 'text-status-success font-medium' : 'text-status-error'}`}>
                    <FontAwesomeIcon icon={newPassword === confirmPassword ? faCheck : faCircleExclamation} className="text-[10px]" />
                    <span>{newPassword === confirmPassword ? 'Kata sandi cocok' : 'Kata sandi belum cocok'}</span>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-2 pb-6">
              <Button
                type="submit"
                className="w-full gap-2 font-bold h-10 text-xs"
                disabled={isLoading || otp.length !== 6 || newPassword.length < 6 || newPassword !== confirmPassword}
              >
                {isLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="text-sm fa-spin" />
                    <span>Memperbarui Kata Sandi...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faKey} className="text-xs" />
                    <span>Perbarui Kata Sandi Saya</span>
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep('request');
                  setOtp('');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs text-foreground-muted hover:text-foreground font-medium transition-colors"
              >
                Salah memasukkan email? <span className="text-primary font-semibold hover:underline">Ganti Email</span>
              </button>
            </CardFooter>
          </form>
        )}

        {/* STEP 3 */}
        {step === 'success' && (
          <CardContent className="space-y-6 pt-2 pb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-status-success">
              <FontAwesomeIcon icon={faCircleCheck} className="text-3xl text-status-success" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-bold text-base text-foreground">
                Kata Sandi Baru Siap Digunakan
              </h3>
              <p className="text-xs text-foreground-muted max-w-xs mx-auto leading-relaxed">
                Kata sandi administrator Anda telah berhasil diperbarui. Silakan gunakan kata sandi baru untuk masuk ke Portal Administrator.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => router.push('/admin/login')}
              className="w-full gap-2 font-bold h-10 text-xs"
            >
              <span>Masuk ke Portal Administrator Sekarang</span>
              <span>&rarr;</span>
            </Button>
          </CardContent>
        )}
      </Card>

      <div className="mt-8 text-center text-[11px] text-foreground-muted space-y-1 max-w-sm">
        <p>Sistem keamanan reset kata sandi dilindungi oleh enkripsi SSL & verifikasi OTP instan.</p>
      </div>
    </div>
  );
}

export default function AdminForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <FontAwesomeIcon icon={faSpinner} className="text-xl fa-spin text-primary" />
        </div>
      }
    >
      <AdminForgotPasswordContent />
    </Suspense>
  );
}
