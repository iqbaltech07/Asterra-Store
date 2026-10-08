'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faLock,
  faHeadphones,
  faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';
import { AsterraLogo } from '@/components/ui/asterra-logo';
import { setupFooterReveal } from '@/lib/animations/gsap-utils';

interface FooterProps {
  onNotify?: (message: string) => void;
}

export function Footer({ onNotify }: FooterProps) {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const cleanup = setupFooterReveal(footerRef.current);
    return () => {
      cleanup?.();
    };
  }, []);

  const handleAction = (msg: string) => {
    if (onNotify) onNotify(msg);
  };

  return (
    <footer ref={footerRef} data-gsap="footer" className="border-t border-white/10 bg-[#121A2A] text-[#F7F5EF] mt-10 sm:mt-24 pt-8 sm:pt-14 pb-20 sm:pb-12 overflow-hidden">
      <div data-gsap="footer-content" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div data-gsap="footer-columns" className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 pb-8 sm:pb-12 border-b border-white/10">
          {/* Brand Col */}
          <div data-gsap="footer-col" className="col-span-2 md:col-span-1 space-y-3">
            <AsterraLogo
              variant="navbar"
              size="md"
              linkToHome={true}
            />
            <p className="text-xs text-[#F7F5EF]/70 leading-relaxed pt-0.5">
              Platform penyedia produk dan layanan digital premium terpercaya di Indonesia dengan
              konfirmasi pembayaran instan dan garansi resmi.
            </p>
            <div className="flex items-center gap-4 pt-1 text-xs text-[#F7F5EF]/80">
              <div className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faLock} className="w-3.5 h-3.5 text-[#C96F55]" />
                <span>SSL Terenkripsi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 text-status-success" />
                <span>Garansi 100%</span>
              </div>
            </div>
          </div>

          {/* Product Categories */}
          <div data-gsap="footer-col" className="col-span-1 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F7F5EF]">
              Katalog Produk
            </h4>
            <ul className="space-y-1.5 text-xs text-[#F7F5EF]/70">
              <li>
                <Link href="/products?search=Canva" className="hover:text-[#C96F55] transition-colors">
                  Canva Pro
                </Link>
              </li>
              <li>
                <Link href="/products?search=ChatGPT" className="hover:text-[#C96F55] transition-colors">
                  ChatGPT Plus
                </Link>
              </li>
              <li>
                <Link href="/products?search=Gemini" className="hover:text-[#C96F55] transition-colors">
                  Gemini Pro
                </Link>
              </li>
              <li>
                <Link href="/products?search=Capcut" className="hover:text-[#C96F55] transition-colors">
                  Capcut Pro
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-[#C96F55] transition-colors font-semibold text-[#C96F55] inline-flex items-center gap-1">
                  <span>Lihat Semua</span>
                  <span>→</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service & Help */}
          <div data-gsap="footer-col" className="col-span-1 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F7F5EF]">
              Bantuan & Layanan
            </h4>
            <ul className="space-y-1.5 text-xs text-[#F7F5EF]/70">
              <li>
                <a
                  href="https://wa.me/6281234567890?text=Halo%20Customer%20Service%20Asterra%20Store%2C%20saya%20memerlukan%20bantuan%20layanan."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#C96F55] transition-colors inline-flex items-center gap-1.5 text-[#F7F5EF]/85"
                >
                  <FontAwesomeIcon icon={faHeadphones} className="w-3.5 h-3.5 text-[#C96F55]" />
                  <span>WhatsApp CS</span>
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-2.5 h-2.5 text-[#F7F5EF]/50" />
                </a>
              </li>
              <li>
                <Link href="/#panduan" className="hover:text-[#C96F55] transition-colors">
                  Cara Pemesanan
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-[#C96F55] transition-colors">
                  Status Pesanan
                </Link>
              </li>
              <li>
                <Link href="/seller" className="text-primary hover:underline font-semibold transition-colors">
                  ★ Program Seller
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment Methods */}
          <div data-gsap="footer-col" className="col-span-2 md:col-span-1 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F7F5EF]">
              Metode Pembayaran
            </h4>
            <p className="text-[11px] text-[#F7F5EF]/70">
              QRIS instan, e-Wallet resmi, dan Virtual Account:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {['QRIS', 'GoPay', 'OVO', 'Dana', 'ShopeePay', 'BCA VA', 'Mandiri VA', 'BRI VA'].map(
                (badge) => (
                  <span
                    key={badge}
                    className="text-[10px] sm:text-[11px] font-medium bg-[#182235] border border-white/10 px-2 py-0.5 rounded text-[#F7F5EF]/85"
                  >
                    {badge}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div data-gsap="footer-bottom" className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-[11px] sm:text-xs text-[#F7F5EF]/60">
          <p>© 2026 Asterra Store. Hak cipta dilindungi undang-undang.</p>
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => handleAction('Ketentuan Layanan Asterra Store')}
              className="hover:text-[#C96F55] transition-colors cursor-pointer"
            >
              Ketentuan Layanan
            </button>
            <button
              type="button"
              onClick={() => handleAction('Kebijakan Privasi Asterra Store')}
              className="hover:text-[#C96F55] transition-colors cursor-pointer"
            >
              Kebijakan Privasi
            </button>
            <button
              type="button"
              onClick={() => handleAction('Keamanan Sistem & Perlindungan Pembayaran')}
              className="hover:text-[#C96F55] transition-colors cursor-pointer"
            >
              Keamanan Transaksi
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
