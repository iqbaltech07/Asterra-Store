'use client';

import { useState } from 'react';
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
import { useAuthStore } from '@/store/use-auth-store';
import { AsterraLogo } from '@/components/ui/asterra-logo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLock,
  faEnvelope,
  faUser,
  faArrowLeft,
  faSpinner,
  faTriangleExclamation,
  faCircleCheck,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage('Semua bidang formulir wajib diisi.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Kata sandi harus memiliki minimal 8 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Anda harus menyetujui Ketentuan Layanan.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Registrasi gagal.');
      }

      // Save token & user in localStorage & cookies
      if (typeof window !== 'undefined') {
        localStorage.setItem('asterra_token', data.token);
        localStorage.setItem('asterra_user', JSON.stringify(data.user));
        document.cookie = `asterra_token=${data.token}; path=/; max-age=2592000; SameSite=Lax`;
        document.cookie = `asterra_session=${data.token}; path=/; max-age=2592000; SameSite=Lax`;
      }

      // Update Zustand state
      login(data.user);

      setSuccessMessage('Pendaftaran berhasil! Mengalihkan ke halaman utama...');
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#121A2A] flex flex-col justify-center items-center px-4 py-12 selection:bg-[#C96F55]/20 selection:text-[#C96F55]">
      {/* Back to Home Link */}
      <div className="w-full max-w-md mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#121A2A]/60 hover:text-[#121A2A] transition-colors group"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Beranda Toko</span>
        </Link>
      </div>

      <Card data-gsap="hero-card" className="w-full max-w-md border border-[rgba(18,26,42,0.08)] bg-white rounded-2xl shadow-card">
        <CardHeader className="space-y-3 text-center pb-6 pt-7">
          <div className="flex justify-center mb-1">
            <AsterraLogo variant="light-bg" size="lg" linkToHome={true} />
          </div>
          <CardTitle data-gsap="page-title" className="text-2xl font-extrabold tracking-tight text-[#121A2A]">
            Daftar Akun Baru
          </CardTitle>
          <CardDescription data-gsap="page-sub" className="text-xs text-[#121A2A]/60">
            Buat akun Asterra Store untuk mendapatkan kemudahan langganan digital
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Feedback Notifications */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-status-error animate-in fade-in">
                <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 shrink-0 text-status-error" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-status-success animate-in fade-in">
                <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 shrink-0 text-status-success" />
                <span className="font-medium">{successMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-bold text-[#121A2A]">
                Nama Lengkap
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faUser} className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#121A2A]/40 pointer-events-none" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Nama Lengkap Anda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 rounded-lg bg-white border-[rgba(18,26,42,0.12)] text-[#121A2A]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold text-[#121A2A]">
                Alamat Email
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#121A2A]/40 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rounded-lg bg-white border-[rgba(18,26,42,0.12)] text-[#121A2A]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-bold text-[#121A2A]">
                Kata Sandi
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faLock} className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#121A2A]/40 pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 rounded-lg bg-white border-[rgba(18,26,42,0.12)] text-[#121A2A]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-xs font-bold text-[#121A2A]"
              >
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faLock} className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#121A2A]/40 pointer-events-none" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ulangi kata sandi"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 rounded-lg bg-white border-[rgba(18,26,42,0.12)] text-[#121A2A]"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 rounded border-[rgba(18,26,42,0.2)] text-[#C96F55] focus:ring-[#C96F55] accent-[#C96F55] cursor-pointer"
              />
              <label htmlFor="terms" className="text-[11px] text-[#121A2A]/60 cursor-pointer">
                Saya menyetujui Ketentuan Layanan & Kebijakan Privasi Asterra Store
              </label>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2 pb-6">
            <Button type="submit" className="w-full gap-2 rounded-lg h-11 text-xs sm:text-sm font-bold bg-[#C96F55] hover:bg-[#B86047] text-[#F7F5EF] shadow-xs cursor-pointer" disabled={isLoading}>
              {isLoading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4" />
                  <span>Daftar Akun</span>
                </>
              )}
            </Button>

            <p className="text-xs text-center text-[#121A2A]/60">
              Sudah memiliki akun?{' '}
              <Link href="/login" className="text-[#C96F55] font-bold hover:underline">
                Masuk di sini
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
