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
import { ArrowLeft, Loader2, AlertCircle, ShieldCheck, Check } from 'lucide-react';

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
    <div className="min-h-screen bg-[#F7F5EF] text-[#121A2A] flex flex-col justify-center items-center px-4 py-12 selection:bg-[#C96F55]/20 selection:text-[#C96F55]">
      {/* Back to Home Link */}
      <div className="w-full max-w-md mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#121A2A]/60 hover:text-[#121A2A] transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Beranda Toko</span>
        </Link>
      </div>

      <Card className="w-full max-w-md border border-[rgba(18,26,42,0.08)] bg-white rounded-2xl shadow-card">
        <CardHeader className="space-y-3 text-center pb-6 pt-7">
          <div className="flex justify-center mb-1">
            <AsterraLogo variant="light-bg" size="lg" linkToHome={true} />
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight text-[#121A2A]">
            Masuk ke Akun Anda
          </CardTitle>
          <CardDescription className="text-xs text-[#121A2A]/60 max-w-xs mx-auto">
            Akses instan untuk mengelola langganan, lisensi, dan riwayat pesanan digital Anda
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Error notification */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-status-error animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-status-error" />
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
                  <Loader2 className="w-4 h-4 animate-spin text-[#C96F55]" />
                  <span>Menghubungkan ke Google...</span>
                </>
              ) : (
                <>
                  {/* Google SVG Logo */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
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
              <Check className="w-3.5 h-3.5 text-status-success shrink-0" />
              <span>Akses 1-klik instan tanpa perlu mengingat password</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#121A2A]/70">
              <Check className="w-3.5 h-3.5 text-status-success shrink-0" />
              <span>Verifikasi identitas langsung dilindungi enkripsi Google</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#121A2A]/70">
              <ShieldCheck className="w-3.5 h-3.5 text-status-success shrink-0" />
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
