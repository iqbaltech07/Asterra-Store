'use client';

import { useState, useEffect } from 'react';
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
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowLeft,
  Loader2,
  AlertCircle,
  KeyRound,
  Terminal,
} from 'lucide-react';
import { AsterraLogo } from '@/components/ui/asterra-logo';

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if admin is already logged in
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const res = await fetch('/api/v1/admin/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            router.replace('/admin');
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

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Email administrator dan kata sandi otorisasi wajib diisi.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error?.message ||
            'Kredensial administrator tidak valid atau Anda tidak memiliki hak akses.'
        );
      }

      if (data.token && typeof window !== 'undefined') {
        localStorage.setItem('asterra_admin_token', data.token);
      }

      setSuccessMessage('Otorisasi admin berhasil. Mengalihkan ke panel kontrol...');

      // Redirect immediately to /admin
      setTimeout(() => {
        window.location.href = '/admin';
      }, 300);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan autentikasi.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifyingSession) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center selection:bg-primary/20 selection:text-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center shadow-subtle animate-pulse">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs text-foreground-muted tracking-widest uppercase font-mono">
            Memverifikasi Otoritas Sesi Admin...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-12 selection:bg-primary/20 selection:text-primary">
      {/* Back to Home Link */}
      <div className="w-full max-w-md mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Beranda Toko</span>
        </Link>
      </div>

      <Card className="w-full max-w-md border-border bg-surface shadow-editorial">
        <CardHeader className="space-y-2 text-center pb-6 pt-6">
          <div className="flex justify-center mb-2">
            <AsterraLogo variant="light-bg" size="md" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-navy-900 text-white text-[10px] font-mono uppercase tracking-wider mx-auto">
            <Terminal className="w-3 h-3 text-primary" />
            <span>Portal Terbatas</span>
          </div>

          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Otorisasi Administrator
          </CardTitle>
          <CardDescription className="text-xs text-foreground-muted max-w-xs mx-auto">
            Area terbatas khusus staf pengelola katalog dan konfigurasi Asterra Store
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleAdminLogin}>
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
                <ShieldCheck className="w-4 h-4 shrink-0 text-status-success" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="text-xs font-medium text-foreground-muted flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>Email Administrator</span>
              </label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@asterra.store"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="text-xs font-medium text-foreground-muted flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-primary" />
                <span>Kunci Sandi Otorisasi</span>
              </label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2 pb-6">
            <Button
              type="submit"
              className="w-full gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Otoritas...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Masuk Panel Admin</span>
                </>
              )}
            </Button>

            <p className="text-xs text-center text-foreground-muted">
              Bukan pengelola toko?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Masuk sebagai pelanggan
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      {/* Security notice footer */}
      <div className="mt-8 text-center text-[11px] text-foreground-muted max-w-sm">
        Sistem dilengkapi proteksi anti brute-force dan pemantauan sesi otomatis untuk setiap upaya akses tanpa izin.
      </div>
    </div>
  );
}
