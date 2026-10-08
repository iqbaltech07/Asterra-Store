'use client';

import React, { useEffect } from 'react';
import { tryRecoverFromChunkError } from '@/lib/utils/chunk-recovery';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Root-level Fallback Error Boundary
 *
 * Catches catastrophic errors that occur within the root layout or root providers.
 * Completely standalone with zero external client library dependencies to guarantee
 * 100% reliable rendering without cascading exceptions.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
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
    <html lang="id">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: '#FFFFFF',
          color: '#121A2A',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '440px',
            width: '90%',
            padding: '36px 28px',
            margin: '20px auto',
            textAlign: 'center',
            borderRadius: '24px',
            border: '1px solid rgba(18, 26, 42, 0.08)',
            boxShadow: '0 10px 30px rgba(18, 26, 42, 0.05)',
            backgroundColor: '#FFFFFF',
          }}
        >
          {/* Warning Icon Badge */}
          <div
            style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 20px',
              borderRadius: '16px',
              backgroundColor: 'rgba(201, 111, 85, 0.08)',
              border: '1px solid rgba(201, 111, 85, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#C96F55',
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#C96F55',
              marginBottom: '8px',
            }}
          >
            Sistem Asterra Store
          </div>

          <h1
            style={{
              fontSize: '24px',
              fontWeight: 900,
              margin: '0 0 12px',
              color: '#121A2A',
              letterSpacing: '-0.02em',
            }}
          >
            Terjadi Gangguan
          </h1>

          <p
            style={{
              fontSize: '13px',
              lineHeight: 1.6,
              color: 'rgba(18, 26, 42, 0.65)',
              margin: '0 0 24px',
            }}
          >
            Halaman mengalami kendala saat dimuat. Silakan coba muat ulang halaman.
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <button
              type="button"
              onClick={handleReload}
              style={{
                width: '100%',
                height: '44px',
                padding: '0 20px',
                backgroundColor: '#121A2A',
                color: '#F7F5EF',
                border: 'none',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
            >
              Muat Ulang Halaman
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '42px',
                boxSizing: 'border-box',
                backgroundColor: 'transparent',
                color: '#121A2A',
                border: '1px solid rgba(18, 26, 42, 0.18)',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
