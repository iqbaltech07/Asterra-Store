'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
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
  faShieldHalved,
  faLock,
  faEnvelope,
  faArrowLeft,
  faArrowRight,
  faSpinner,
  faCircleExclamation,
  faKey,
  faTerminal,
} from '@fortawesome/free-solid-svg-icons';
import { AsterraLogo } from '@/components/ui/asterra-logo';
import { getSalesBaseUrl } from '@/lib/utils/url';

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [salesPortalUrl, setSalesPortalUrl] = useState<string | null>(null);

  // Check if admin is already logged in
  useEffect(() => {
    // If redirected due to forbidden sales access
    if (typeof window !== 'undefined' && window.location.search.includes('error=sales_forbidden')) {
      try {
        localStorage.removeItem('asterra_admin_token');
        localStorage.removeItem('asterra_admin_user');
      } catch {}
      setSalesPortalUrl(`${getSalesBaseUrl()}/sales/login`);
      setErrorMessage('Akun Mitra Sales tidak memiliki hak akses ke Admin Console. Silakan masuk melalui Portal Sales.');
      setIsVerifyingSession(false);
      return;
    }

    // If just logged out, bypass automatic session checking and display confirmation
    if (typeof window !== 'undefined' && window.location.search.includes('logged_out=1')) {
      try {
        localStorage.removeItem('asterra_admin_token');
        localStorage.removeItem('asterra_admin_user');
      } catch {}
      setIsVerifyingSession(false);
      setSuccessMessage('Sesi telah berhasil diakhiri.');
      return;
    }

    async function checkExistingSession() {
      try {
        const res = await fetch('/api/v1/admin/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            if (data.admin?.role === 'sales') {
              try {
                localStorage.removeItem('asterra_admin_token');
                localStorage.removeItem('asterra_admin_user');
              } catch {}
              setSalesPortalUrl(`${getSalesBaseUrl()}/sales/login`);
              setErrorMessage('Akun aktif terdeteksi sebagai Mitra Sales. Silakan gunakan Portal Sales Asterra Store.');
              setIsVerifyingSession(false);
              return;
            }
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

  const loginMutation = useMutation({
    mutationFn: async ({ emailVal, passwordVal }: { emailVal: string; passwordVal: string }) => {
      // Memanggil Next.js Route Handler (/api/auth/login) — bukan langsung ke backend.
      // Route handler ini mem-proxy ke backend dan meng-set cookie asterra_admin_session
      // dari sisi server Next.js agar middleware (proxy.ts) dapat membacanya.
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal, password: passwordVal }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        if (data.error?.code === 'PORTAL_ACCESS_DENIED' || data.salesPortalUrl) {
          setSalesPortalUrl(data.salesPortalUrl || `${getSalesBaseUrl()}/sales/login`);
        }
        throw new Error(
          data.error?.message ||
            'Kredensial administrator tidak valid atau Anda tidak memiliki hak akses.'
        );
      }

      if (data.admin?.role === 'sales') {
        setSalesPortalUrl(data.salesPortalUrl || `${getSalesBaseUrl()}/sales/login`);
        throw new Error('Akun ini terdaftar sebagai Mitra Sales. Silakan masuk melalui Portal Sales Asterra Store.');
      }

      return data;
    },
    onSuccess: (data) => {
      setSalesPortalUrl(null);
      // Simpan token ke localStorage sebagai fallback untuk verifyAuth di page component
      if (data.token && typeof window !== 'undefined') {
        localStorage.setItem('asterra_admin_token', data.token);
      }

      let targetUrl = '/admin';
      if (typeof window !== 'undefined') {
        const sp = new URLSearchParams(window.location.search);
        const cb = sp.get('callbackUrl');
        if (cb && cb.startsWith('/') && !cb.startsWith('/sales')) {
          targetUrl = cb;
        }
      }

      setSuccessMessage('Otorisasi admin berhasil. Mengalihkan ke panel kontrol...');

      setTimeout(() => {
        window.location.href = targetUrl;
      }, 300);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan autentikasi.';
      setErrorMessage(message);
    },
  });

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setSalesPortalUrl(null);

    if (!email || !password) {
      setErrorMessage('Email administrator dan kata sandi otorisasi wajib diisi.');
      return;
    }

    loginMutation.mutate({ emailVal: email, passwordVal: password });
  };

  if (isVerifyingSession) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center selection:bg-primary/20 selection:text-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center shadow-subtle animate-pulse">
            <FontAwesomeIcon icon={faLock} className="w-5 h-5 text-primary" />
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
          <FontAwesomeIcon icon={faArrowLeft} className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Beranda Toko</span>
        </Link>
      </div>

      <Card data-gsap="hero-card" className="w-full max-w-md border-border bg-surface shadow-editorial">
        <CardHeader className="space-y-2 text-center pb-6 pt-6">
          <div className="flex justify-center mb-2">
            <AsterraLogo variant="light-bg" size="md" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-navy-900 text-white text-[10px] font-mono uppercase tracking-wider mx-auto">
            <FontAwesomeIcon icon={faTerminal} className="w-3 h-3 text-primary" />
            <span>Portal Terbatas</span>
          </div>

          <CardTitle data-gsap="page-title" className="text-2xl font-bold tracking-tight text-foreground">
            Otorisasi Administrator
          </CardTitle>
          <CardDescription data-gsap="page-sub" className="text-xs text-foreground-muted max-w-xs mx-auto">
            Area terbatas khusus staf pengelola katalog dan konfigurasi Asterra Store
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleAdminLogin}>
          <CardContent className="space-y-4">
            {/* Feedback Notifications */}
            {errorMessage && (
              <div className="p-3 rounded-md bg-status-error/10 border border-status-error/20 flex flex-col gap-2 text-xs text-status-error animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <FontAwesomeIcon icon={faCircleExclamation} className="w-4 h-4 shrink-0 mt-0.5 text-status-error" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
                {salesPortalUrl && (
                  <div className="pt-1 pl-6">
                    <a
                      href={salesPortalUrl}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-status-error text-white font-medium hover:bg-status-error/90 transition-colors shadow-sm"
                    >
                      <span>Buka Portal Sales Asterra</span>
                      <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-md bg-status-success/10 border border-status-success/20 flex items-center gap-2.5 text-xs text-status-success animate-in fade-in">
                <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 shrink-0 text-status-success" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="text-xs font-medium text-foreground-muted flex items-center gap-1.5"
              >
                <FontAwesomeIcon icon={faEnvelope} className="w-3.5 h-3.5 text-primary" />
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
              <div className="flex items-center justify-between">
                <label
                  htmlFor="admin-password"
                  className="text-xs font-medium text-foreground-muted flex items-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faKey} className="w-3.5 h-3.5 text-primary" />
                  <span>Kunci Sandi Otorisasi</span>
                </label>
                <Link
                  href="/admin/lupa-password"
                  className="text-[11px] font-semibold text-primary hover:underline transition-colors"
                >
                  Lupa Kata Sandi?
                </Link>
              </div>
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
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Otoritas...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faLock} className="w-4 h-4" />
                  <span>Masuk Panel Admin</span>
                </>
              )}
            </Button>

            <div className="space-y-1 text-center">
              <p className="text-xs text-foreground-muted">
                Mitra Penjualan (Sales)?{' '}
                <Link href="/sales/login" className="text-primary font-bold hover:underline">
                  Masuk ke Portal Sales
                </Link>
              </p>
              <p className="text-xs text-foreground-muted">
                Bukan pengelola toko?{' '}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Masuk sebagai pelanggan
                </Link>
              </p>
            </div>
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
