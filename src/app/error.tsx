'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight, faHouse, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { tryRecoverFromChunkError } from '@/lib/utils/chunk-recovery';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Attempt one-time self-healing reload if triggered by a deployment chunk mismatch
    tryRecoverFromChunkError(error);
  }, [error]);

  const handleReload = () => {
    try {
      reset();
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[70vh] bg-white text-[#121A2A] flex flex-col items-center justify-center font-sans px-4 sm:px-6 py-16">
      <div className="max-w-md w-full bg-white border border-[rgba(18,26,42,0.08)] rounded-3xl p-8 sm:p-10 text-center shadow-editorial space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center mx-auto text-[#C96F55]">
          <FontAwesomeIcon icon={faTriangleExclamation} className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-[#C96F55] tracking-widest uppercase">
            Sistem Asterra Store
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#121A2A] tracking-tight">
            Terjadi Gangguan
          </h1>
          <p className="text-xs sm:text-sm text-[#121A2A]/65 leading-relaxed">
            Halaman mengalami kendala saat dimuat. Silakan coba muat ulang halaman.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            onClick={handleReload}
            className="w-full sm:w-auto bg-[#121A2A] hover:bg-[#1c273d] text-[#F7F5EF] rounded-xl text-xs font-bold gap-2 h-11 px-5 cursor-pointer shadow-subtle active:scale-95 transition-all"
          >
            <FontAwesomeIcon icon={faRotateRight} className="w-3.5 h-3.5" />
            <span>Muat Ulang Halaman</span>
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto border-[rgba(18,26,42,0.18)] text-[#121A2A] hover:bg-[#F8FAFC] rounded-xl text-xs font-semibold gap-2 h-11 px-5 cursor-pointer"
            >
              <FontAwesomeIcon icon={faHouse} className="w-3.5 h-3.5 text-[#121A2A]/60" />
              <span>Kembali ke Beranda</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
