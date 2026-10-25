'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  faKey,
  faEye,
  faEyeSlash,
  faSpinner,
  faCircleExclamation,
  faCircleCheck,
  faUsers,
  faArrowLeft,
  faLock,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { AsterraLogo } from '@/components/ui/asterra-logo';

function SalesResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [isVerifyingToken, setIsVerifyingToken] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string>('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // 1. Verify token on mount
  useEffect(() => {
    if (!token) {
      setIsVerifyingToken(false);
      setTokenError('Tautan reset tidak memiliki token verifikasi. Silakan minta tautan pemulihan baru.');
      return;
    }

    let isMounted = true;
    async function verify() {
      try {
        const res = await fetch('/api/v1/auth/forgot-password/verify-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-portal': 'sales',
          },
          body: JSON.stringify({ token, portal: 'sales' }),
        });

        const data = await res.json();
        if (!isMounted) return;

        if (!res.ok || !data.valid) {
          setTokenError(
            data.message || 'Tautan pemulihan kata sandi tidak valid atau telah kedaluwarsa (berlaku 15 menit).'
          );
        } else {
          setMaskedEmail(data.maskedEmail || '');
        }
      } catch {
        if (isMounted) {
          setTokenError('Gagal memverifikasi token ke server. Periksa koneksi internet Anda.');
        }
      } finally {
        if (isMounted) {
          setIsVerifyingToken(false);
        }
      }
    }

    verify();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Validation rules
  const isMinLength = newPassword.length >= 6;
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = isMinLength && isMatching && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setErrorMessage(null);

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/auth/forgot-password/reset-with-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-portal': 'sales',
        },
        body: JSON.stringify({
          token,
          portal: 'sales',
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengatur ulang kata sandi.');
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat memperbarui kata sandi.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-12 selection:bg-primary/20 selection:text-primary">
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <Link
          href="/sales/login"
          className="inline-flex items-center gap-2 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors group"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Masuk Mitra Sales</span>
        </Link>
      </div>

      <Card className="w-full max-w-md border-border bg-surface shadow-editorial">
        <CardHeader className="space-y-2 text-center pb-6 pt-6">
          <div className="flex justify-center mb-2">
            <AsterraLogo variant="light-bg" size="md" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold mx-auto">
            <FontAwesomeIcon icon={faUsers} className="text-xs" />
            <span>Portal Mitra Penjualan (Sales)</span>
          </div>

          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {isSuccess ? 'Kata Sandi Berhasil Diperbarui' : 'Atur Ulang Kata Sandi'}
          </CardTitle>

          <CardDescription className="text-xs text-foreground-muted max-w-xs mx-auto leading-relaxed">
            {isSuccess
              ? 'Kata sandi akun mitra sales Anda telah berhasil disimpan. Silakan masuk kembali menggunakan kata sandi baru.'
              : maskedEmail
              ? `Tetapkan kata sandi baru untuk akun mitra sales (${maskedEmail}).`
              : 'Tetapkan kata sandi baru untuk akun mitra sales Anda.'}
          </CardDescription>
        </CardHeader>

        {/* LOADING TOKEN VERIFICATION */}
        {isVerifyingToken && (
          <CardContent className="py-12 flex flex-col items-center justify-center space-y-3">
            <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-foreground-muted">Memverifikasi tautan pemulihan...</p>
          </CardContent>
        )}

        {/* INVALID / EXPIRED TOKEN STATE */}
        {!isVerifyingToken && tokenError && (
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-status-error/10 border border-status-error/20 space-y-2 text-xs text-status-error">
              <div className="flex items-center gap-2 font-bold">
                <FontAwesomeIcon icon={faCircleExclamation} className="text-sm shrink-0" />
                <span>Tautan Tidak Dapat Digunakan</span>
              </div>
              <p className="leading-relaxed text-foreground-muted text-[11px]">{tokenError}</p>
            </div>

            <Button
              type="button"
              onClick={() => router.push('/sales/lupa-password')}
              className="w-full gap-2 font-bold h-10 text-xs"
            >
              <span>Minta Link Reset Baru</span>
            </Button>
          </CardContent>
        )}

        {/* SUCCESS STATE */}
        {!isVerifyingToken && !tokenError && isSuccess && (
          <CardContent className="space-y-4 pt-2 pb-6">
            <div className="p-4 rounded-xl bg-status-success/10 border border-status-success/20 text-center space-y-2">
              <FontAwesomeIcon icon={faCircleCheck} className="text-3xl text-status-success mx-auto" />
              <p className="text-xs font-bold text-foreground">Pembaruan Kata Sandi Sukses</p>
              <p className="text-[11px] text-foreground-muted leading-relaxed">
                Kata sandi baru Anda telah aktif. Tautan pemulihan ini telah dinonaktifkan untuk keamanan akun.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => router.push('/sales/login')}
              className="w-full gap-2 font-bold h-10 text-xs"
            >
              <span>Masuk ke Portal Sales</span>
            </Button>
          </CardContent>
        )}

        {/* RESET FORM */}
        {!isVerifyingToken && !tokenError && !isSuccess && (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-status-error/10 border border-status-error/20 flex items-start gap-2.5 text-xs text-status-error animate-in fade-in">
                  <FontAwesomeIcon icon={faCircleExclamation} className="text-sm shrink-0 mt-0.5 text-status-error" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Input Kata Sandi Baru */}
              <div className="space-y-1.5">
                <label
                  htmlFor="sales-new-password"
                  className="text-xs font-medium text-foreground flex items-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faKey} className="text-xs text-primary" />
                  <span>Kata Sandi Baru</span>
                </label>
                <div className="relative">
                  <Input
                    id="sales-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    autoFocus
                    disabled={isSubmitting}
                    className="bg-surface-raised border-border text-xs h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground text-xs"
                    aria-label={showNewPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              {/* Input Konfirmasi Kata Sandi */}
              <div className="space-y-1.5">
                <label
                  htmlFor="sales-confirm-password"
                  className="text-xs font-medium text-foreground flex items-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faLock} className="text-xs text-primary" />
                  <span>Konfirmasi Kata Sandi Baru</span>
                </label>
                <div className="relative">
                  <Input
                    id="sales-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Ulangi kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={isSubmitting}
                    className="bg-surface-raised border-border text-xs h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground text-xs"
                    aria-label={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              {/* Indikator Validasi */}
              <div className="p-3 rounded-xl bg-surface-raised border border-border space-y-1.5 text-[11px]">
                <div className={`flex items-center gap-2 ${isMinLength ? 'text-status-success font-semibold' : 'text-foreground-muted'}`}>
                  <FontAwesomeIcon icon={faCheck} className={`text-[10px] ${isMinLength ? 'text-status-success' : 'opacity-30'}`} />
                  <span>Minimal 6 karakter</span>
                </div>
                <div className={`flex items-center gap-2 ${isMatching ? 'text-status-success font-semibold' : 'text-foreground-muted'}`}>
                  <FontAwesomeIcon icon={faCheck} className={`text-[10px] ${isMatching ? 'text-status-success' : 'opacity-30'}`} />
                  <span>Konfirmasi kata sandi cocok</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-2 pb-6">
              <Button
                type="submit"
                className="w-full gap-2 font-bold h-10 text-xs"
                disabled={!canSubmit}
              >
                {isSubmitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="text-sm fa-spin" />
                    <span>Menyimpan Kata Sandi...</span>
                  </>
                ) : (
                  <span>Simpan Kata Sandi Baru</span>
                )}
              </Button>

              <div className="flex items-center justify-center w-full pt-1 text-xs text-foreground-muted">
                <Link href="/sales/login" className="text-foreground-muted hover:text-foreground font-medium">
                  Batal dan kembali ke <span className="text-primary font-bold hover:underline">Halaman Masuk</span>
                </Link>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

export default function SalesResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 text-primary animate-spin" />
        </div>
      }
    >
      <SalesResetPasswordContent />
    </Suspense>
  );
}
