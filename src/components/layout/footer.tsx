'use client';

import Link from 'next/link';
import { ShieldCheck, Lock, Headphones, ExternalLink } from 'lucide-react';
import { AsterraLogo } from '@/components/ui/asterra-logo';

interface FooterProps {
  onNotify?: (message: string) => void;
}

export function Footer({ onNotify }: FooterProps) {
  const handleAction = (msg: string) => {
    if (onNotify) onNotify(msg);
  };

  return (
    <footer data-gsap="footer" className="border-t border-white/10 bg-[#121A2A] text-[#F7F5EF] mt-24 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div data-gsap="footer-columns" className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Brand Col */}
          <div data-gsap="footer-col" className="space-y-4 md:col-span-1">
            <AsterraLogo
              variant="navbar"
              size="md"
              linkToHome={true}
            />
            <p className="text-xs text-[#F7F5EF]/70 leading-relaxed pt-1">
              Platform penyedia produk dan layanan digital premium terpercaya di Indonesia dengan
              konfirmasi pembayaran instan dan garansi resmi.
            </p>
            <div className="flex items-center gap-4 pt-2 text-xs text-[#F7F5EF]/80">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#C96F55]" />
                <span>SSL Terenkripsi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
                <span>Garansi 100%</span>
              </div>
            </div>
          </div>

          {/* Product Categories */}
          <div data-gsap="footer-col" className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F7F5EF]">
              Katalog Produk
            </h4>
            <ul className="space-y-2 text-xs text-[#F7F5EF]/70">
              <li>
                <Link href="/products?search=Canva" className="hover:text-[#C96F55] transition-colors">
                  Canva Pro (Desain Grafis)
                </Link>
              </li>
              <li>
                <Link href="/products?search=ChatGPT" className="hover:text-[#C96F55] transition-colors">
                  ChatGPT Plus (AI Tools)
                </Link>
              </li>
              <li>
                <Link href="/products?search=Gemini" className="hover:text-[#C96F55] transition-colors">
                  Gemini Pro (Google AI)
                </Link>
              </li>
              <li>
                <Link href="/products?search=Capcut" className="hover:text-[#C96F55] transition-colors">
                  Capcut Pro (Video Editing)
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-[#C96F55] transition-colors font-medium text-[#C96F55] inline-flex items-center gap-1">
                  <span>Lihat Seluruh Katalog</span>
                  <span>→</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service & Help */}
          <div data-gsap="footer-col" className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F7F5EF]">
              Bantuan & Layanan
            </h4>
            <ul className="space-y-2 text-xs text-[#F7F5EF]/70">
              <li>
                <a
                  href="https://wa.me/6281234567890?text=Halo%20Customer%20Service%20Asterra%20Store%2C%20saya%20memerlukan%20bantuan%20layanan."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#C96F55] transition-colors inline-flex items-center gap-1.5 text-[#F7F5EF]/80"
                >
                  <Headphones className="w-3.5 h-3.5 text-[#C96F55]" />
                  <span>Hubungi CS (WhatsApp)</span>
                  <ExternalLink className="w-3 h-3 text-[#F7F5EF]/50" />
                </a>
              </li>
              <li>
                <Link href="/#panduan" className="hover:text-[#C96F55] transition-colors">
                  Cara Pemesanan & Aktivasi
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-[#C96F55] transition-colors">
                  Pelacakan Status Pesanan
                </Link>
              </li>
              <li>
                <Link href="/#keunggulan" className="hover:text-[#C96F55] transition-colors">
                  Keunggulan Layanan & Garansi
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-[#C96F55] transition-colors">
                  Profil Pelanggan Saya
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment Methods */}
          <div data-gsap="footer-col" className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F7F5EF]">
              Metode Pembayaran
            </h4>
            <p className="text-xs text-[#F7F5EF]/70">
              Mendukung transaksi otomatis dan instan dari berbagai metode pembayaran resmi:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {['QRIS', 'GoPay', 'OVO', 'Dana', 'ShopeePay', 'BCA VA', 'Mandiri VA', 'BRI VA'].map(
                (badge) => (
                  <span
                    key={badge}
                    className="text-[11px] font-medium bg-[#182235] border border-white/10 px-2.5 py-1 rounded-md text-[#F7F5EF]/85"
                  >
                    {badge}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div data-gsap="footer-bottom" className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#F7F5EF]/60">
          <p>© 2026 Asterra Store. Hak cipta dilindungi undang-undang.</p>
          <div className="flex items-center gap-6">
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
