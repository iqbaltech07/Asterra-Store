'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFire,
  faClock,
  faTag,
  faCalendarDays,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';

interface ActivePromoCardProps {
  campaignName?: string;
  discountPercent?: number;
  startDate?: string;
  endDate?: string;
  endsAt?: string;
  description?: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

export function ActivePromoCard({
  campaignName = 'Promo Spesial Asterra Store',
  discountPercent = 15,
  startDate = '23 Okt 2026',
  endDate = '06 Nov 2026',
  endsAt = '2026-11-06T23:59:59+07:00',
  description = 'Seluruh pembeli menikmati diskon 15% untuk produk digital resmi bergaransi. Moment terbaik untuk membagikan link sales Anda!',
  ctaText = 'Hitung Estimasi Komisi Promo',
  onCtaClick,
}: ActivePromoCardProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    formatted: string;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    formatted: 'Memuat waktu...',
  });

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const targetTime = new Date(endsAt).getTime();

    const calculateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0 || isNaN(targetTime)) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          formatted: 'Promo telah berakhir',
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const pad = (n: number) => String(n).padStart(2, '0');
      const timeFormatted =
        days > 0
          ? `${days} hari ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
          : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
        formatted: timeFormatted,
      });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (timeLeft.isExpired) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/70 via-amber-50/40 to-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-md">
      {/* Top Header: Title, Category Badge, and Discount Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-600/10 text-rose-600 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faFire} className="text-sm" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full border border-rose-200">
                Event Promo Aktif
              </span>
              <span className="text-xs font-bold text-foreground">
                {campaignName}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-foreground-muted mt-0.5 leading-snug">
              {description}
            </p>
          </div>
        </div>

        {/* Measured, elegant discount badge */}
        <div className="shrink-0 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
            <FontAwesomeIcon icon={faTag} className="text-[10px]" />
            <span>Diskon {discountPercent}%</span>
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="my-3.5 border-t border-rose-200/60" />

      {/* Bottom Metadata: Promo Period & Live Synchronized Countdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-foreground-muted">
          <FontAwesomeIcon icon={faCalendarDays} className="text-rose-500 text-xs shrink-0" />
          <span>
            Periode Promo:{' '}
            <strong className="text-foreground font-semibold">
              {startDate} – {endDate}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isMounted && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 font-medium text-xs shadow-2xs">
              <FontAwesomeIcon icon={faClock} className="text-[11px] text-rose-500" />
              <span>Sisa Waktu:</span>
              <span className="font-mono font-bold tracking-tight text-rose-800">
                {timeLeft.formatted}
              </span>
            </div>
          )}

          {onCtaClick && (
            <button
              type="button"
              onClick={onCtaClick}
              className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline ml-2 cursor-pointer"
            >
              <span>{ctaText}</span>
              <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
