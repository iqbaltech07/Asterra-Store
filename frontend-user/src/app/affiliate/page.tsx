import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faArrowUpRightFromSquare,
  faShieldHalved,
  faWallet,
  faChartLine,
  faShareNodes,
  faUserPlus,
  faBolt,
  faHandshake,
  faCoins,
  faCircleCheck,
  faHeadset,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Program Mitra Affiliate | Asterra Store',
  description:
    'Rekomendasikan 200+ produk digital terpopuler dan dapatkan komisi langsung 10% per transaksi serta bonus sponsor 2%. Tanpa modal stok dan tanpa repot pengiriman.',
  openGraph: {
    title: 'Program Mitra Affiliate - Asterra Store',
    description:
      'Dapatkan komisi langsung 10% dari setiap penjualan produk digital bergaransi. Daftar gratis dan kelola referral di Portal Sales.',
    images: ['/images/banners/hero-banner-seller.webp'],
  },
};

export default function AffiliatePage() {
  const salesUrl = process.env.NEXT_PUBLIC_SALES_URL || 'https://sales.asterrastore.biz.id';
  const registerUrl = `${salesUrl}/daftar-sales`;
  const portalUrl = `${salesUrl}/sales`;

  return (
    <div className="min-h-screen bg-white text-[#121A2A] flex flex-col selection:bg-[#C96F55]/20 selection:text-[#C96F55] w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-10 w-full space-y-8 sm:space-y-16">
        {/* HERO BANNER SECTION */}
        <section data-gsap="seller-hero" aria-label="Banner Program Affiliate Asterra" className="w-full overflow-hidden">
          <a
            href={registerUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Daftar Program Mitra Affiliate Asterra Store - Dapatkan Komisi 10% per Penjualan"
            className="group block relative w-full overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-[rgba(18,26,42,0.08)] shadow-xs hover:shadow-md transition-shadow bg-[#f0f5ff]"
          >
            <Image
              src="/images/banners/hero-banner-seller.webp"
              alt="Program Affiliate Asterra Store - Dapatkan Komisi 10% Langsung dari Setiap Transaksi Produk Digital"
              width={2640}
              height={882}
              priority
              quality={95}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1320px"
              className="w-full h-auto block rounded-xl sm:rounded-2xl md:rounded-3xl object-cover sm:object-contain transition-transform duration-300 group-hover:scale-[1.004]"
            />
          </a>
        </section>

        {/* QUICK ACTION BAR */}
        <section
          data-gsap="seller-cta-bar"
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)] shadow-xs w-full"
        >
          <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C96F55]/10 text-[#C96F55] text-[11px] font-bold tracking-wide uppercase mb-1">
              <FontAwesomeIcon icon={faHandshake} className="w-3 h-3" />
              <span>Program Kemitraan Affiliate</span>
            </div>
            <h2 data-gsap="seller-title" className="text-base sm:text-xl font-bold text-[#121A2A] leading-snug">
              Rekomendasikan Produk Digital, Dapatkan Komisi 10%
            </h2>
            <p data-gsap="seller-desc" className="text-xs sm:text-sm text-[#121A2A]/70 leading-relaxed max-w-2xl">
              Tanpa modal stok dan tanpa repot pengiriman. Cukup bagikan link referral Anda dan kelola performa penjualan di Portal Sales resmi.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
            <a
              href={registerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto block"
            >
              <Button
                data-gsap="seller-cta"
                className="w-full sm:w-auto h-11 px-5 sm:px-6 rounded-xl bg-[#C96F55] hover:bg-[#B86047] text-white font-bold text-xs sm:text-sm gap-2 shadow-xs transition-transform active:scale-95 justify-center"
              >
                <span>Daftar Mitra Affiliate</span>
                <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
              </Button>
            </a>
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto block"
            >
              <Button
                variant="outline"
                className="w-full sm:w-auto h-11 px-5 sm:px-6 rounded-xl border-[#121A2A]/20 bg-white hover:bg-slate-50 text-[#121A2A] font-semibold text-xs sm:text-sm gap-2 justify-center"
              >
                <span>Buka Portal Sales</span>
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 h-3 text-[#121A2A]/60" />
              </Button>
            </a>
          </div>
        </section>

        {/* SECTION: TENTANG PROGRAM AFFILIATE VS SELLER BIASA */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
          <div data-gsap="seller-info" className="lg:col-span-5 space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] sm:text-xs font-bold text-[#C96F55] uppercase tracking-wider block">
                Model Kemitraan Transparan
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-[#121A2A] leading-tight">
                Bagaimana Cara Kerja Affiliate Asterra?
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#121A2A]/75 leading-relaxed">
              Asterra Store menggunakan sistem <strong className="text-[#121A2A]">Affiliate Sales</strong>, bukan marketplace fisik di mana Anda harus memproduksi atau mengirimkan barang.
            </p>
            <p className="text-xs sm:text-sm text-[#121A2A]/75 leading-relaxed">
              Sebagai Mitra Affiliate, tugas utama Anda adalah membagikan rekomendasi link produk digital terpopuler ke teman, komunitas, atau media sosial. Seluruh verifikasi pembayaran, aktivasi akun, dan garansi layanan diselesaikan otomatis oleh sistem Asterra Store.
            </p>

            {/* HIGHLIGHT BOX WATERFALL */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                <FontAwesomeIcon icon={faCoins} className="w-4 h-4 text-amber-700" />
                <span>Skema Komisi Dua Jalur (Waterfall)</span>
              </div>
              <ul className="text-xs text-amber-900/80 space-y-1.5 list-disc list-inside leading-relaxed">
                <li>
                  <strong className="text-amber-950">10% Komisi Langsung</strong> dari margin profit bersih setiap pesanan yang checkout via tautan referral Anda.
                </li>
                <li>
                  <strong className="text-amber-950">2% Bonus Sponsor</strong> setiap kali mitra affiliate baru yang Anda undang berhasil melakukan penjualan.
                </li>
              </ul>
            </div>
          </div>

          {/* 6 KEUNGGULAN UTAMA */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div data-gsap="seller-card" className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)] space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#C96F55]/10 text-[#C96F55] flex items-center justify-center">
                <FontAwesomeIcon icon={faWallet} className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#121A2A]">Komisi 10% Langsung</h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Komisi dihitung transparan dari profit bersih setiap transaksi yang selesai dan valid.
              </p>
            </div>

            <div data-gsap="seller-card" className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)] space-y-2">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FontAwesomeIcon icon={faHandshake} className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#121A2A]">Bonus Sponsor 2%</h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Ajak rekan bergabung menjadi mitra dan nikmati override bonus 2% dari performa tim Anda.
              </p>
            </div>

            <div data-gsap="seller-card" className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)] space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FontAwesomeIcon icon={faBolt} className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#121A2A]">Pengiriman Otomatis</h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Pesanan pembeli dikirim otomatis dalam hitungan menit tanpa Anda perlu melayani chat manual.
              </p>
            </div>

            <div data-gsap="seller-card" className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)] space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#121A2A]">100% Bergaransi Resmi</h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Jaminan ganti akun penuh jika terjadi kendala akses. Rekomendasikan produk dengan percaya diri.
              </p>
            </div>

            <div data-gsap="seller-card" className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)] space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FontAwesomeIcon icon={faChartLine} className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#121A2A]">Portal Sales Khusus</h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Pantau statistik klik link, pesanan sukses, dan riwayat penarikan dana di sales portal mandiri.
              </p>
            </div>

            <div data-gsap="seller-card" className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)] space-y-2">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <FontAwesomeIcon icon={faCoins} className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#121A2A]">Pencairan Cepat</h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Tarik saldo komisi langsung ke bank lokal (BCA, Mandiri, BRI) atau e-wallet (DANA, GoPay, OVO).
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: 3 LANGKAH MUDAH MEMULAI */}
        <section className="space-y-6 pt-6 border-t border-[rgba(18,26,42,0.08)]">
          <div className="max-w-2xl">
            <span className="text-[11px] sm:text-xs font-bold text-[#C96F55] uppercase tracking-wider block mb-1">
              Alur Sederhana
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-[#121A2A] leading-tight">
              Tiga Langkah Memulai Kemitraan Affiliate
            </h2>
            <p className="text-xs sm:text-sm text-[#121A2A]/70 mt-1 leading-relaxed">
              Mulai menghasilkan penghasilan tambahan dalam beberapa menit tanpa formulir rumit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[rgba(18,26,42,0.08)] shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-[#C96F55]/25 font-mono">01</span>
                <div className="w-9 h-9 rounded-xl bg-[#C96F55]/10 text-[#C96F55] flex items-center justify-center">
                  <FontAwesomeIcon icon={faUserPlus} className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-bold text-base text-[#121A2A]">Daftar di Portal Sales</h3>
              <p className="text-xs text-[#121A2A]/70 leading-relaxed">
                Buka portal pendaftaran mitra di <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] text-slate-800">sales.asterrastore.biz.id</code>, isi data diri, dan dapatkan kode referral eksklusif Anda seketika.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[rgba(18,26,42,0.08)] shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-[#C96F55]/25 font-mono">02</span>
                <div className="w-9 h-9 rounded-xl bg-[#C96F55]/10 text-[#C96F55] flex items-center justify-center">
                  <FontAwesomeIcon icon={faShareNodes} className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-bold text-base text-[#121A2A]">Bagikan Link Referral</h3>
              <p className="text-xs text-[#121A2A]/70 leading-relaxed">
                Pilih produk populer seperti Canva Pro, ChatGPT, YouTube Premium, lalu salin tautan referral atau gunakan materi promosi siap pakai untuk dibagikan.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[rgba(18,26,42,0.08)] shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-[#C96F55]/25 font-mono">03</span>
                <div className="w-9 h-9 rounded-xl bg-[#C96F55]/10 text-[#C96F55] flex items-center justify-center">
                  <FontAwesomeIcon icon={faWallet} className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-bold text-base text-[#121A2A]">Terima Komisi Otomatis</h3>
              <p className="text-xs text-[#121A2A]/70 leading-relaxed">
                Setiap transaksi yang dibayar oleh pembeli via link Anda akan langsung mengkreditkan saldo komisi ke akun Anda dan siap dicairkan ke rekening.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: FAQ RINGKAS */}
        <section className="space-y-5 pt-6 border-t border-[rgba(18,26,42,0.08)]">
          <div className="max-w-2xl">
            <span className="text-[11px] sm:text-xs font-bold text-[#C96F55] uppercase tracking-wider block mb-1">
              Tanya Jawab
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-[#121A2A] leading-tight">
              Pertanyaan yang Sering Diajukan
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)] space-y-1.5">
              <h4 className="font-bold text-xs sm:text-sm text-[#121A2A] flex items-center gap-2">
                <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5 text-[#C96F55]" />
                <span>Apakah pendaftaran membutuhkan modal?</span>
              </h4>
              <p className="text-xs text-[#121A2A]/70 leading-relaxed pl-5">
                Tidak. Pendaftaran program affiliate Asterra Store 100% gratis. Anda tidak perlu membayar biaya kemitraan dan tidak perlu membeli stok produk terlebih dahulu.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)] space-y-1.5">
              <h4 className="font-bold text-xs sm:text-sm text-[#121A2A] flex items-center gap-2">
                <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5 text-[#C96F55]" />
                <span>Siapa yang mengirimkan pesanan ke pembeli?</span>
              </h4>
              <p className="text-xs text-[#121A2A]/70 leading-relaxed pl-5">
                Seluruh pengiriman akun dan instruksi akses diproses otomatis oleh sistem Asterra Store via WhatsApp dan Email. Anda tidak perlu repot mengurus pengiriman barang.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)] space-y-1.5">
              <h4 className="font-bold text-xs sm:text-sm text-[#121A2A] flex items-center gap-2">
                <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5 text-[#C96F55]" />
                <span>Bagaimana cara mencairkan komisi yang diperoleh?</span>
              </h4>
              <p className="text-xs text-[#121A2A]/70 leading-relaxed pl-5">
                Anda dapat mengajukan penarikan dana langsung dari menu Penarikan di Portal Sales. Dana akan ditransfer ke rekening bank lokal atau dompet digital (e-wallet) yang telah Anda daftarkan.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)] space-y-1.5">
              <h4 className="font-bold text-xs sm:text-sm text-[#121A2A] flex items-center gap-2">
                <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5 text-[#C96F55]" />
                <span>Apakah tersedia materi promosi dan copywriting?</span>
              </h4>
              <p className="text-xs text-[#121A2A]/70 leading-relaxed pl-5">
                Ya. Di dalam Portal Sales disediakan generator tautan dan template materi copywriting siap pakai untuk WhatsApp Status, broadcast, dan media sosial.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: CTA BANNER */}
        <section className="rounded-2xl sm:rounded-3xl bg-[#121A2A] text-white p-6 sm:p-10 border border-white/10 shadow-editorial flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#C96F55] block">
              Bergabung Bersama Kami
            </span>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
              Siap Menghasilkan Pendapatan dari Produk Digital?
            </h3>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Pendaftaran gratis dalam 1 menit. Akses langsung Portal Sales, salin tautan referral Anda, dan raih komisi dari setiap penjualan.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            <a
              href={registerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto block"
            >
              <Button className="w-full sm:w-auto h-11 px-6 rounded-xl bg-[#C96F55] hover:bg-[#B86047] text-white font-bold text-xs sm:text-sm gap-2 active:scale-95 transition-all justify-center">
                <span>Daftar Mitra Affiliate Sekarang</span>
                <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
              </Button>
            </a>
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto block"
            >
              <Button
                variant="outline"
                className="w-full sm:w-auto h-11 px-5 rounded-xl border-white/20 bg-transparent hover:bg-white/10 text-white font-semibold text-xs sm:text-sm gap-2 justify-center"
              >
                <span>Masuk Portal</span>
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 h-3 text-white/70" />
              </Button>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
