'use client';

import { useState, useEffect } from 'react';
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
import {
  Lock,
  Mail,
  ArrowLeft,
  Loader2,
  AlertCircle,
  KeyRound,
  Share2,
  CheckCircle2,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { AsterraLogo } from '@/components/ui/asterra-logo';
import { Suspense } from 'react';

function SalesLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/sales';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if sales partner is already logged in
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('asterra_admin_token') : null;
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch('/api/v1/admin/auth/me', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            router.replace('/sales');
            return;
          }
        }
      } catch {
        // Session check failed, stay on login page
      } finally {
        setIsVerifyingSession(false);
      }
    }

    checkExistingSession();
  }, [router]);

  const handleSalesLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Email akun sales dan kata sandi wajib diisi.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error?.message ||
            'Email atau kata sandi tidak cocok. Pastikan Anda sudah terdaftar sebagai mitra sales.'
        );
      }

      if (data.token && typeof window !== 'undefined') {
        localStorage.setItem('asterra_admin_token', data.token);
      }

      setSuccessMessage('Login berhasil! Membuka Portal Sales Anda...');

      // Redirect immediately to sales console
      setTimeout(() => {
        window.location.href = callbackUrl;
      }, 300);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat masuk.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifyingSession) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center shadow-subtle animate-pulse">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs text-foreground-muted tracking-widest uppercase font-mono">
            Memverifikasi Sesi Portal Sales...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-12 selection:bg-primary/20 selection:text-primary">
      {/* Back to Home Link */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Beranda</span>
        </Link>
        <Link
          href="/daftar-sales"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <span>Daftar Mitra Baru</span>
          <span>&rarr;</span>
        </Link>
      </div>

      <Card className="w-full max-w-md border-border bg-surface shadow-editorial">
        <CardHeader className="space-y-2 text-center pb-6 pt-6">
          <div className="flex justify-center mb-2">
            <AsterraLogo variant="light-bg" size="md" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold mx-auto">
            <Share2 className="w-3.5 h-3.5" />
            <span>Portal Mitra Penjualan (Sales)</span>
          </div>

          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Masuk Portal Sales
          </CardTitle>
          <CardDescription className="text-xs text-foreground-muted max-w-xs mx-auto">
            Akses ringkasan komisi, katalog produk promosi, dan generator tautan referral Anda
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSalesLogin}>
          <CardContent className="space-y-4">
            {/* Feedback Notifications */}
            {errorMessage && (
              <div className="p-3 rounded-md bg-status-error/10 border border-status-error/20 flex items-start gap-2.5 text-xs text-status-error animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-status-error" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-md bg-status-success/10 border border-status-success/20 flex items-center gap-2.5 text-xs text-status-success animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-status-success" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="sales-email"
                className="text-xs font-medium text-foreground flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>Email atau Username Sales</span>
              </label>
              <Input
                id="sales-email"
                type="text"
                placeholder="nama@email.com atau username sales"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="bg-surface-raised border-border text-xs h-10"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="sales-password"
                  className="text-xs font-medium text-foreground flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-primary" />
                  <span>Kata Sandi Akun</span>
                </label>
              </div>
              <Input
                id="sales-password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="bg-surface-raised border-border text-xs h-10"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2 pb-6">
            <Button
              type="submit"
              className="w-full gap-2 font-bold h-10 text-xs"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Buka Portal Sales</span>
                </>
              )}
            </Button>

            <div className="flex items-center justify-between w-full pt-1 text-xs text-foreground-muted">
              <span>Belum punya akun?</span>
              <Link href="/daftar-sales" className="text-primary font-bold hover:underline">
                Daftar Jadi Sales &rarr;
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Footer Info */}
      <div className="mt-8 text-center text-[11px] text-foreground-muted space-y-1 max-w-sm">
        <p>Staf Toko / Pengelola Katalog? Masuk melalui <Link href="/admin/login" className="text-primary font-medium hover:underline">Portal Administrator</Link></p>
      </div>
    </div>
  );
}

export default function SalesLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <SalesLoginContent />
    </Suspense>
  );
}
