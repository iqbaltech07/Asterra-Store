'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import {
  faArrowLeft,
  faSpinner,
  faTriangleExclamation,
  faShieldHalved,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Social Provider Login (Google)
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn.social({
        provider: 'google',
        callbackURL: callbackUrl,
      });

      if (res?.error) {
        setErrorMessage(res.error.message || 'Gagal memulai autentikasi Google.');
        setIsGoogleLoading(false);
        return;
      }

      if (res?.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gagal menghubungi gerbang autentikasi Google.';
      setErrorMessage(message);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#121A2A] flex flex-col justify-center items-center px-4 py-12 selection:bg-[#C96F55]/20 selection:text-[#C96F55]">
      {/* Back to Home Link */}
      <div className="w-full max-w-md mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#121A2A]/60 hover:text-[#121A2A] transition-colors group"
        >
          <FontAwesomeIcon
            icon={faArrowLeft}
            className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform"
          />
          <span>Kembali ke Beranda Toko</span>
        </Link>
      </div>

      <Card
        data-gsap="login-card"
        className="w-full max-w-md border border-[rgba(18,26,42,0.08)] bg-white rounded-2xl shadow-card"
      >
        <CardHeader className="space-y-3 text-center pb-6 pt-7">
          <div data-gsap="login-logo" className="flex justify-center mb-1">
            <AsterraLogo variant="light-bg" size="lg" linkToHome={true} />
          </div>
          <CardTitle
            data-gsap="login-heading"
            className="text-2xl font-extrabold tracking-tight text-[#121A2A]"
          >
            Masuk ke Akun Anda
          </CardTitle>
          <CardDescription data-gsap="page-sub" className="text-xs text-[#121A2A]/60 max-w-xs mx-auto">
            Akses instan untuk mengelola langganan, lisensi, dan riwayat pesanan digital Anda
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-status-error animate-in fade-in">
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                className="w-4 h-4 shrink-0 mt-0.5 text-status-error"
              />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Google Login Provider Button */}
          <div className="pt-2">
            <button
              type="button"
              data-gsap="login-button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full h-12 rounded-xl bg-white border border-[rgba(18,26,42,0.15)] hover:border-[#C96F55] hover:bg-[#C96F55]/5 text-[#121A2A] font-semibold text-sm flex items-center justify-center gap-3 shadow-xs transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
            >
              {isGoogleLoading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin text-[#C96F55]" />
                  <span>Menghubungkan ke Google...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faGoogle} className="w-5 h-5 shrink-0 text-[#EA4335]" />
                  <span className="font-bold text-[#121A2A] tracking-tight text-sm">
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
              <span>Akses 1-klik instan ke seluruh pesanan digital Anda</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#121A2A]/70">
              <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 text-status-success shrink-0" />
              <span>Privasi data & lisensi resmi terlindungi standar enkripsi tinggi</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-3 pb-6 border-t border-[rgba(18,26,42,0.06)]">
          <p className="text-[11px] text-center text-[#121A2A]/50 leading-relaxed">
            Dengan masuk, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi Asterra Store.
          </p>
        </CardFooter>
      </Card>

      {/* Footer system note */}
      <div className="mt-8 text-center text-[11px] text-[#121A2A]/50 max-w-sm">
        Sistem autentikasi pelanggan dilindungi oleh enkripsi SSL & verifikasi Google OAuth 2.0 resmi.
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-[#121A2A]/70">
            <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin text-[#C96F55]" />
            <span>Memuat halaman login...</span>
          </div>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
