'use client';

import Link from 'next/link';
import { ShieldCheck, Lock, Headphones, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNotify?: (message: string) => void;
}

export function Footer({ onNotify }: FooterProps) {
  const handleAction = (msg: string) => {
    if (onNotify) onNotify(msg);
  };

  return (
    <footer className="border-t border-border bg-surface mt-20 pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-border/70">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white font-bold text-sm shadow-sm">
                A
              </div>
              <span className="font-semibold text-lg text-foreground tracking-tight">
                Asterra Store
              </span>
            </Link>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Platform penyedia produk dan layanan digital premium terpercaya di Indonesia dengan
              konfirmasi pembayaran instan dan garansi resmi.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-foreground-muted">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" />
                <span>SSL Terenkripsi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
                <span>Garansi 100%</span>
              </div>
            </div>
          </div>

          {/* Product Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Katalog Produk
            </h4>
            <ul className="space-y-2 text-xs text-foreground-muted">
              <li>
                <Link href="/products?search=Canva" className="hover:text-foreground transition-colors">
                  Canva Pro (Desain Grafis)
                </Link>
              </li>
              <li>
                <Link href="/products?search=ChatGPT" className="hover:text-foreground transition-colors">
                  ChatGPT Plus (AI Tools)
                </Link>
              </li>
              <li>
                <Link href="/products?search=Gemini" className="hover:text-foreground transition-colors">
                  Gemini Pro (Google AI)
                </Link>
              </li>
              <li>
                <Link href="/products?search=Capcut" className="hover:text-foreground transition-colors">
                  Capcut Pro (Video Editing)
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-foreground transition-colors font-medium text-primary">
                  Lihat Seluruh Katalog Produk →
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service & Help */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Bantuan & Layanan
            </h4>
            <ul className="space-y-2 text-xs text-foreground-muted">
              <li>
                <a
                  href="https://wa.me/6281234567890?text=Halo%20Customer%20Service%20Asterra%20Store%2C%20saya%20memerlukan%20bantuan%20layanan."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                >
                  <Headphones className="w-3.5 h-3.5 text-primary" />
                  <span>Hubungi Customer Service (WA)</span>
                  <ExternalLink className="w-3 h-3 text-foreground-muted" />
                </a>
              </li>
              <li>
                <Link href="/#panduan" className="hover:text-foreground transition-colors">
                  Cara Pemesanan & Aktivasi
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-foreground transition-colors">
                  Pelacakan Status Pesanan
                </Link>
              </li>
              <li>
                <Link href="/#keunggulan" className="hover:text-foreground transition-colors">
                  Keunggulan Layanan & Garansi
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-foreground transition-colors">
                  Profil Pelanggan Saya
                </Link>
              </li>
              <li>
                <Link href="/daftar-sales" className="text-primary hover:underline font-medium transition-colors">
                  ★ Daftar Jadi Sales (Komisi 15%)
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Metode Pembayaran
            </h4>
            <p className="text-xs text-foreground-muted">
              Mendukung transaksi otomatis dan instan dari berbagai metode pembayaran online:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {['QRIS', 'GoPay', 'OVO', 'Dana', 'ShopeePay', 'BCA VA', 'Mandiri VA', 'BRI VA'].map(
                (badge) => (
                  <span
                    key={badge}
                    className="text-[11px] font-medium bg-surface-raised border border-border px-2 py-1 rounded text-foreground-muted"
                  >
                    {badge}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground-muted">
          <p>© 2026 Asterra Store. Hak cipta dilindungi undang-undang.</p>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => handleAction('Ketentuan Layanan Asterra Store')}
              className="hover:text-foreground transition-colors"
            >
              Ketentuan Layanan
            </button>
            <button
              type="button"
              onClick={() => handleAction('Kebijakan Privasi Asterra Store')}
              className="hover:text-foreground transition-colors"
            >
              Kebijakan Privasi
            </button>
            <button
              type="button"
              onClick={() => handleAction('Keamanan Sistem & Perlindungan Pembayaran')}
              className="hover:text-foreground transition-colors"
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
