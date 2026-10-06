'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStore,
  faArrowRight,
  faShieldHalved,
  faWallet,
  faChartLine,
  faShareNodes,
  faUserPlus,
  faCheckCircle,
  faBolt,
  faHeadphones,
} from '@fortawesome/free-solid-svg-icons';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { Button } from '@/components/ui/button';

export default function SellerPage() {
  return (
    <div className="min-h-screen bg-white text-[#121A2A] flex flex-col selection:bg-[#C96F55]/20 selection:text-[#C96F55]">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full space-y-12 sm:space-y-16">
        {/* HERO BANNER SECTION */}
        <section aria-label="Banner Program Seller Asterra" className="w-full">
          <Link
            href="/daftar-sales"
            title="Daftar Program Seller Asterra Store - Bergabung Jadi Seller AsterraStore Mulai dari Sekarang!"
            className="group block relative w-full overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-[rgba(18,26,42,0.08)] shadow-xs hover:shadow-md transition-shadow bg-[#f0f5ff]"
          >
            <Image
              src="/images/banners/hero-banner-seller.webp"
              alt="Program Seller Asterra Store - Bergabung Jadi Seller AsterraStore Mulai dari Sekarang!"
              width={2640}
              height={882}
              priority
              quality={95}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1320px"
              className="w-full h-auto block rounded-xl sm:rounded-2xl md:rounded-3xl object-contain transition-transform duration-300 group-hover:scale-[1.004]"
            />
          </Link>
        </section>

        {/* QUICK ACTION BAR */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)] shadow-xs">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-base sm:text-lg font-bold text-[#121A2A]">
              Siap Menghasilkan dari Produk Digital?
            </h2>
            <p className="text-xs sm:text-sm text-[#121A2A]/70">
              Daftar sekarang gratis tanpa modal stok, atau masuk ke dashboard jika sudah memiliki akun sales.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link href="/daftar-sales" className="flex-1 sm:flex-initial">
              <Button className="w-full sm:w-auto h-11 px-6 rounded-xl bg-[#C96F55] hover:bg-[#B86047] text-white font-bold text-sm gap-2 shadow-xs transition-transform active:scale-95">
                <span>Daftar Jadi Seller</span>
                <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/sales" className="flex-1 sm:flex-initial">
              <Button
                variant="outline"
                className="w-full sm:w-auto h-11 px-6 rounded-xl border-[#121A2A]/20 bg-white hover:bg-slate-50 text-[#121A2A] font-semibold text-sm"
              >
                Masuk Dashboard Sales
              </Button>
            </Link>
          </div>
        </section>

        {/* SECTION: APA ITU SELLER ASTERRA */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
          <div className="space-y-3">
            <span className="text-xs font-bold text-[#C96F55] uppercase tracking-wider block">
              Tentang Program
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#121A2A]">
              Apa itu Seller Asterra Store?
            </h2>
            <p className="text-xs sm:text-sm text-[#121A2A]/70 leading-relaxed">
              Seller Asterra adalah program kemitraan resmi yang dirancang bagi individu, kreator konten, mahasiswa, maupun komunitas yang ingin mendapatkan penghasilan tambahan tanpa perlu modal stok produk.
            </p>
            <p className="text-xs sm:text-sm text-[#121A2A]/70 leading-relaxed">
              Seluruh pemrosesan pesanan, verifikasi pembayaran otomatis (QRIS / Virtual Account), aktivasi akun, dan garansi penggantian dikelola langsung oleh sistem Asterra Store. Anda cukup fokus membagikan katalog produk ke calon pelanggan.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#C96F55]/10 text-[#C96F55] flex items-center justify-center">
                <FontAwesomeIcon icon={faBolt} className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-[#121A2A]">Aktivasi Instan</h3>
              <p className="text-[11px] text-[#121A2A]/65 leading-relaxed">
                Pelanggan Anda menerima akun siap pakai dalam 1 - 15 menit.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-[#121A2A]">100% Bergaransi</h3>
              <p className="text-[11px] text-[#121A2A]/65 leading-relaxed">
                Jaminan ganti akun penuh jika terjadi kendala akses selama masa aktif.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FontAwesomeIcon icon={faChartLine} className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-[#121A2A]">Pelacakan Real-time</h3>
              <p className="text-[11px] text-[#121A2A]/65 leading-relaxed">
                Pantau setiap klik dan order dari dashboard sales pribadi Anda.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <FontAwesomeIcon icon={faWallet} className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-[#121A2A]">Tarik Komisi Mudah</h3>
              <p className="text-[11px] text-[#121A2A]/65 leading-relaxed">
                Pencairan dana komisi langsung ke bank lokal atau e-wallet.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: BAGAIMANA CARA MENJADI SELLER */}
        <section className="space-y-6 pt-4 border-t border-[rgba(18,26,42,0.08)]">
          <div className="max-w-2xl">
            <span className="text-xs font-bold text-[#C96F55] uppercase tracking-wider block mb-1">
              Panduan Langkah
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#121A2A]">
              Tiga Langkah Mudah Menjadi Seller
            </h2>
            <p className="text-xs sm:text-sm text-[#121A2A]/70 mt-1">
              Mulai berjualan hanya dalam hitungan menit tanpa persyaratan rumit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-5 rounded-2xl bg-white border border-[rgba(18,26,42,0.08)] shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-[#C96F55]/30 font-mono">01</span>
                <div className="w-8 h-8 rounded-lg bg-[#C96F55]/10 text-[#C96F55] flex items-center justify-center">
                  <FontAwesomeIcon icon={faUserPlus} className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-[#121A2A]">Daftar Akun Seller</h3>
              <p className="text-xs text-[#121A2A]/70 leading-relaxed">
                Buka formulir pendaftaran mitra, isi identitas singkat, dan dapatkan kode referral eksklusif Anda secara langsung.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[rgba(18,26,42,0.08)] shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-[#C96F55]/30 font-mono">02</span>
                <div className="w-8 h-8 rounded-lg bg-[#C96F55]/10 text-[#C96F55] flex items-center justify-center">
                  <FontAwesomeIcon icon={faShareNodes} className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-[#121A2A]">Bagikan Link Produk</h3>
              <p className="text-xs text-[#121A2A]/70 leading-relaxed">
                Gunakan tautan khusus untuk produk digital favorit (Canva, ChatGPT, YouTube, dll) dan bagikan ke media sosial atau teman.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[rgba(18,26,42,0.08)] shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-[#C96F55]/30 font-mono">03</span>
                <div className="w-8 h-8 rounded-lg bg-[#C96F55]/10 text-[#C96F55] flex items-center justify-center">
                  <FontAwesomeIcon icon={faWallet} className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-[#121A2A]">Terima Komisi Transaksi</h3>
              <p className="text-xs text-[#121A2A]/70 leading-relaxed">
                Setiap kali seseorang membeli melalui tautan Anda, saldo komisi secara otomatis masuk ke akun Anda dan siap dicairkan.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: CTA BANNER */}
        <section className="rounded-3xl bg-[#121A2A] text-white p-6 sm:p-10 border border-white/10 shadow-editorial flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Siap Memulai Bersama Seller Asterra?
            </h3>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Pendaftaran 100% gratis tanpa biaya bulanan. Dapatkan akses langsung ke dashboard penjualan dan materi promosi.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link href="/daftar-sales" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-11 px-6 rounded-xl bg-[#C96F55] hover:bg-[#B86047] text-white font-bold text-sm gap-2 active:scale-95 transition-all">
                <span>Daftar Sekarang</span>
                <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
