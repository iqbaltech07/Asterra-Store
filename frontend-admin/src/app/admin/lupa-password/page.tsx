'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
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
  faEnvelope,
  faArrowLeft,
  faSpinner,
  faCircleExclamation,
  faCircleCheck,
  faShieldHalved,
  faPaperPlane,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import { AsterraLogo } from '@/components/ui/asterra-logo';

function AdminForgotPasswordContent() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRequestResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || cooldown > 0) return;
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length < 5) {
      setErrorMessage('Silakan masukkan alamat email yang valid.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/forgot-password/request-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-portal': 'admin',
        },
        body: JSON.stringify({ email: cleanEmail, portal: 'admin' }),
      });

      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.message || 'Gagal memproses permintaan reset kata sandi.');
      }

      setSuccessMessage(
        data.message ||
          'Jika email tersebut terdaftar, kami akan mengirimkan instruksi untuk mengatur ulang kata sandi. Silakan periksa kotak masuk atau spam email Anda.'
      );
      setCooldown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala jaringan saat menghubungi server.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

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
            Lupa Kata Sandi?
          </CardTitle>

          <CardDescription className="text-xs text-foreground-muted max-w-xs mx-auto leading-relaxed">
            Masukkan alamat email administrator Anda untuk menerima tautan pemulihan kata sandi resmi Asterra Store.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleRequestResetLink}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-status-error/10 border border-status-error/20 flex items-start gap-2.5 text-xs text-status-error animate-in fade-in">
                <FontAwesomeIcon icon={faCircleExclamation} className="text-sm shrink-0 mt-0.5 text-status-error" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-xl bg-status-success/10 border border-status-success/20 flex items-start gap-2.5 text-xs text-status-success animate-in fade-in">
                <FontAwesomeIcon icon={faCircleCheck} className="text-sm shrink-0 mt-0.5 text-status-success" />
                <div className="space-y-1">
                  <p className="font-semibold">Permintaan Terkirim</p>
                  <p className="leading-relaxed text-foreground-muted text-[11px]">{successMessage}</p>
                </div>
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
                disabled={isLoading}
                className="bg-surface-raised border-border text-xs h-10"
              />
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 text-[11px] text-blue-700 dark:text-blue-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <span>ℹ️ Pemulihan Akun Aman</span>
              </div>
              <p className="leading-relaxed text-blue-600/90 dark:text-blue-300/80">
                Tautan pengaturan ulang kata sandi akan dikirim ke email terdaftar dan berlaku selama 15 menit.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-2 pb-6">
            <Button
              type="submit"
              className="w-full gap-2 font-bold h-10 text-xs"
              disabled={isLoading || cooldown > 0}
            >
              {isLoading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="text-sm fa-spin" />
                  <span>Memproses Permintaan...</span>
                </>
              ) : cooldown > 0 ? (
                <>
                  <FontAwesomeIcon icon={faRotateRight} className="text-xs" />
                  <span>Kirim Ulang Link ({cooldown}s)</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
                  <span>Kirim Link Reset</span>
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
      </Card>
    </div>
  );
}

export default function AdminForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 text-primary animate-spin" />
        </div>
      }
    >
      <AdminForgotPasswordContent />
    </Suspense>
  );
}
