'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { signIn } from '@/lib/auth-client';
import { AsterraLogo } from '@/components/ui/asterra-logo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSpinner, faTriangleExclamation, faShieldHalved, faCheck } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await signIn.social({
        provider: 'google',
        callbackURL: '/',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gagal menghubungi gerbang autentikasi Google.';
      setErrorMessage(message);
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
            Masuk ke Akun Anda
          </CardTitle>
          <CardDescription data-gsap="page-sub" className="text-xs text-[#121A2A]/60 max-w-xs mx-auto">
            Akses instan untuk mengelola langganan, lisensi, dan riwayat pesanan digital Anda
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Error notification */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-status-error animate-in fade-in">
              <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 shrink-0 mt-0.5 text-status-error" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Google Login Button */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-white border border-[rgba(18,26,42,0.12)] hover:border-[#C96F55] hover:bg-[rgba(201,111,85,0.06)] text-[#121A2A] font-semibold text-sm flex items-center justify-center gap-3 shadow-xs transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
            >
              {isLoading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin text-[#C96F55]" />
                  <span>Menghubungkan ke Google...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faGoogle} className="w-4 h-4 shrink-0 text-[#EA4335]" />
                  <span className="font-bold text-[#121A2A] tracking-tight">
                    Lanjutkan dengan Akun Google
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Key Security Value Props */}
          <div className="pt-4 border-t border-[rgba(18,26,42,0.08)] space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-[#121A2A]/70">
              <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-status-success shrink-0" />
              <span>Akses 1-klik instan tanpa perlu mengingat password</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#121A2A]/70">
              <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-status-success shrink-0" />
              <span>Verifikasi identitas langsung dilindungi enkripsi Google</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#121A2A]/70">
              <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 text-status-success shrink-0" />
              <span>Privasi data pesanan terisolasi dengan aman di database</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-2 pb-6 border-t border-[rgba(18,26,42,0.06)]">
          <p className="text-[11px] text-center text-[#121A2A]/50 leading-relaxed">
            Dengan masuk, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi Asterra Store.
          </p>
        </CardFooter>
      </Card>

      {/* Footer system note */}
      <div className="mt-8 text-center text-[11px] text-[#121A2A]/50 max-w-sm">
        Sistem autentikasi pelanggan dilindungi oleh enkripsi SSL & verifikasi Google resmi.
      </div>
    </div>
  );
}
