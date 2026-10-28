'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Award,
  ShieldCheck,
  Users,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  Share2,
  HelpCircle,
  DollarSign,
  Store,
  Clock,
  Compass,
  Lightbulb,
  Headphones,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminTab } from '@/components/admin/admin-sidebar';

interface SalesGuidebookTabProps {
  partnerCode?: string;
  partnerRate?: number;
  onTabChange?: (tab: AdminTab) => void;
}

interface Chapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CHAPTERS: Chapter[] = [
  {
    id: 'bab-1',
    number: 1,
    title: 'Mengenal AsterraStore',
    subtitle: 'Peran mitra sales, ekosistem produk digital, dan legalitas kemitraan',
    icon: Compass,
  },
  {
    id: 'bab-2',
    number: 2,
    title: 'Login & Mengenal Dashboard',
    subtitle: 'Navigasi portal sales, membaca metrik KPI, dan keamanan akun',
    icon: BookOpen,
  },
  {
    id: 'bab-3',
    number: 3,
    title: 'Memilih Produk Digital',
    subtitle: 'Katalog produk, masa aktif, varian shared vs private, dan garansi resmi',
    icon: ShoppingBag,
  },
  {
    id: 'bab-4',
    number: 4,
    title: 'Cara Menjual kepada Pelanggan',
    subtitle: '8 langkah alur transaksi praktis dari konsultasi hingga serah terima',
    icon: Sparkles,
  },
  {
    id: 'bab-5',
    number: 5,
    title: 'Memahami Komisi Sales',
    subtitle: 'Skema komisi 15% (Pemula), 20% (VIP), dan holding garansi 3 hari',
    icon: DollarSign,
  },
  {
    id: 'bab-6',
    number: 6,
    title: 'Simulasi Harga Jual Reseller',
    subtitle: 'Panduan kalkulator reseller, markup mandiri, dan manajemen keuntungan',
    icon: Store,
  },
  {
    id: 'bab-7',
    number: 7,
    title: 'Link Referral & Jaringan Mitra',
    subtitle: 'Membagikan link unik, bonus pasif tim 2%, dan etika rekrutmen',
    icon: Share2,
  },
  {
    id: 'bab-8',
    number: 8,
    title: 'Pesanan, Garansi, & Komplain',
    subtitle: 'Status transaksi, tata cara klaim garansi ganti baru, dan bantuan CS',
    icon: ShieldCheck,
  },
  {
    id: 'bab-9',
    number: 9,
    title: 'Tips Penjualan Efektif',
    subtitle: 'Strategi promosi ramah, copywriting konversi tinggi, dan jadwal repeat order',
    icon: Lightbulb,
  },
  {
    id: 'bab-10',
    number: 10,
    title: 'Pertanyaan yang Sering Diajukan (FAQ)',
    subtitle: 'Jawaban resmi seputar pencairan saldo, kendala order, dan ketentuan toko',
    icon: HelpCircle,
  },
];

export function SalesGuidebookTab({
  partnerCode = 'AST-FOUNDER',
  partnerRate = 15,
  onTabChange,
}: SalesGuidebookTabProps) {
  const [activeChapterId, setActiveChapterId] = useState<string>('bab-1');

  const currentChapterIndex = CHAPTERS.findIndex((c) => c.id === activeChapterId);
  const currentChapter = CHAPTERS[currentChapterIndex] || CHAPTERS[0];

  const handleNext = () => {
    if (currentChapterIndex < CHAPTERS.length - 1) {
      setActiveChapterId(CHAPTERS[currentChapterIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentChapterIndex > 0) {
      setActiveChapterId(CHAPTERS[currentChapterIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 border border-border bg-surface shadow-xs">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-primary/10 via-primary/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Dokumentasi Resmi & Pedoman Operasional</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Buku Panduan Mitra Sales AsterraStore
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
              Panduan lengkap penggunaan portal Sales, cara menawarkan produk digital bergaransi, memahami pembagian komisi 15%–20%, dan mengembangkan jaringan referral secara etis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Badge variant="outline" className="border-border text-xs px-3 py-1.5 font-mono">
              Status: Pemula (15%) &bull; VIP (20%)
            </Badge>
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5 font-semibold">
              Bonus Tim: 2%
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar TOC & Chapter Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Table of Contents (Sticky on Desktop) */}
        <div className="lg:col-span-4 space-y-3 lg:sticky lg:top-4">
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Daftar Isi Buku Panduan</span>
              </span>
              <span className="text-[11px] font-mono text-foreground-muted">
                10 Bab Lengkap
              </span>
            </div>

            <div className="space-y-1">
              {CHAPTERS.map((ch) => {
                const IconComponent = ch.icon;
                const isActive = ch.id === activeChapterId;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      setActiveChapterId(ch.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 text-xs cursor-pointer ${
                      isActive
                        ? 'bg-primary text-white font-bold shadow-xs'
                        : 'text-foreground hover:bg-surface-raised border border-transparent hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-surface-raised text-foreground-muted border border-border'
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate">
                          Bab {ch.number}: {ch.title}
                        </div>
                      </div>
                    </div>
                    {isActive ? (
                      <ChevronRight className="w-4 h-4 shrink-0 text-white" />
                    ) : (
                      <span className="text-[10px] text-foreground-muted font-mono shrink-0">
                        B{ch.number}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Help Box */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-bold">
              <Headphones className="w-4 h-4 text-blue-600" />
              <span>Butuh Bantuan Langsung?</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Tim Koordinator Sales AsterraStore siap membantu panduan teknis maupun pertanyaan operasional setiap hari kerja.
            </p>
            <a
              href="https://wa.me/6281234567890?text=Halo%20Admin%20AsterraStore,%20saya%20Mitra%20Sales%20butuh%20bantuan%20panduan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline pt-1"
            >
              <span>Hubungi CS Mitra Sales via WhatsApp</span>
              <span>&rarr;</span>
            </a>
          </div>
        </div>

        {/* Right Column: Active Chapter Content Container */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            {/* Chapter Header */}
            <div className="space-y-2 pb-5 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary tracking-widest uppercase">
                  BAB {currentChapter.number}
                </span>
                <span className="text-foreground-muted">&bull;</span>
                <span className="text-xs text-foreground-muted font-mono">
                  Panduan Mitra Sales
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {currentChapter.title}
              </h2>
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                {currentChapter.subtitle}
              </p>
            </div>

            {/* Chapter Body Dynamic Content */}
            <div className="text-xs sm:text-sm text-foreground leading-relaxed space-y-5">
              {/* BAB 1 */}
              {activeChapterId === 'bab-1' && (
                <div className="space-y-5">
                  <p>
                    Selamat datang di ekosistem kemitraan <strong>AsterraStore</strong>! AsterraStore adalah platform penyedia produk digital premium terpercaya, mulai dari layanan produktivitas AI, tools desain grafis, hingga streaming legal bergaransi resmi.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-1.5">
                      <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                        <span>Penjualan Pribadi (Direct Sales)</span>
                      </h4>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        Anda membagikan link produk atau merekomendasikan layanan kepada pembeli. Dari setiap transaksi yang berhasil, Anda memperoleh komisi <strong>15% hingga 20%</strong> dari profit transaksi.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-1.5">
                      <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Jaringan Mitra (Referral Sales)</span>
                      </h4>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        Anda mengajak teman bergabung menjadi mitra sales menggunakan kode referral Anda. Setiap teman Anda berhasil menjual produk, Anda mendapatkan bonus pasif <strong>2%</strong> dari profit transaksi mereka.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Bukan Sistem MLM atau Skema Piramida</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      AsterraStore menerapkan <strong>Single-Level Referral resmi (1 tingkat saja)</strong>. Tidak ada sistem binary, tidak ada kaki kiri-kanan, dan komisi penjualan teman Anda tidak dipotong sedikitpun (komisi teman Anda tetap utuh 15%–20%).
                    </p>
                  </div>

                  <h3 className="font-bold text-base text-foreground pt-2">
                    Kategori Produk Unggulan AsterraStore
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5 text-foreground-muted text-xs pl-1">
                    <li><strong>AI Tools:</strong> ChatGPT Plus Private, ChatGPT GO, Google Gemini Pro 5TB, Claude AI Pro.</li>
                    <li><strong>Desain &amp; Kreatif:</strong> Canva Pro Anggota/Desainer, Canva Education 1 Tahun, CapCut Pro Private, Alight Motion Pro.</li>
                    <li><strong>Streaming &amp; Hiburan:</strong> Netflix Premium Shared/Private, YouTube Premium Family, Spotify Premium.</li>
                  </ul>
                </div>
              )}

              {/* BAB 2 */}
              {activeChapterId === 'bab-2' && (
                <div className="space-y-5">
                  <p>
                    Portal Sales AsterraStore dirancang agar Anda dapat mengelola seluruh aktivitas kemitraan dengan mudah dari perangkat laptop maupun smartphone.
                  </p>

                  <h3 className="font-bold text-base text-foreground">
                    1. Cara Masuk ke Portal Sales
                  </h3>
                  <p className="text-foreground-muted text-xs">
                    Kunjungi alamat portal sales di <code>https://sales.asterrastore.biz.id</code> (atau menu Portal Sales pada navigasi toko). Masukkan email terdaftar dan kata sandi akun sales Anda.
                  </p>

                  <h3 className="font-bold text-base text-foreground">
                    2. Membaca Ringkasan Dashboard
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-surface-raised border border-border space-y-1">
                      <span className="font-bold text-foreground block">Komisi Siap Ditarik (Final)</span>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        Saldo komisi bersih yang telah melewati masa garansi 3 hari dan siap dicairkan ke rekening bank Anda kapan saja.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-raised border border-border space-y-1">
                      <span className="font-bold text-foreground block">Masa Garansi (Pending 3 Hari)</span>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        Komisi transaksi yang baru selesai dan ditahan sementara selama 3 hari masa garansi toko untuk mengantisipasi klaim garansi.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-raised border border-border space-y-1">
                      <span className="font-bold text-foreground block">Tingkat Komisi Anda ({partnerRate}%)</span>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        Persentase komisi aktif Anda saat ini. Tingkat awal adalah <strong>15%</strong> (Sales Pemula) dan otomatis naik ke <strong>20%</strong> (Sales VIP) setelah mencapai 50 order sukses.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-raised border border-border space-y-1">
                      <span className="font-bold text-foreground block">Kode Referral ({partnerCode})</span>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        Kode unik pengenal transaksi Anda. Setiap kali pelanggan memasukkan kode ini atau mengklik link Anda, komisi otomatis tercatat.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Keamanan Akun Sales</span>
                    </div>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      Jangan pernah membagikan kata sandi akun sales kepada siapapun. Tim AsterraStore tidak pernah meminta kata sandi Anda melalui WhatsApp maupun pesan pribadi.
                    </p>
                  </div>
                </div>
              )}

              {/* BAB 3 */}
              {activeChapterId === 'bab-3' && (
                <div className="space-y-5">
                  <p>
                    Memahami detail produk digital adalah kunci keberhasilan penjualan. Pelanggan menyukai sales yang mampu menjelaskan masa aktif, jenis akun, dan garansi dengan jujur.
                  </p>

                  <h3 className="font-bold text-base text-foreground">
                    1. Perbedaan Akun Shared vs Private
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="p-3.5 rounded-xl bg-surface-raised border border-border">
                      <span className="font-bold text-foreground block mb-1">Akun Shared (Berbagi Profil)</span>
                      <p className="text-foreground-muted text-[11px] leading-relaxed">
                        Satu akun resmi digunakan bersama beberapa pengguna dengan slot profile atau invite email terpisah. Harga jauh lebih hemat, cocok untuk pengguna personal/pelajar (contoh: Netflix Shared 1 Profile, YouTube Premium Family Invite).
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-raised border border-border">
                      <span className="font-bold text-foreground block mb-1">Akun Private (Eksklusif)</span>
                      <p className="text-foreground-muted text-[11px] leading-relaxed">
                        Akun khusus milik 1 pembeli tanpa ada pengguna lain di dalamnya. Pembeli dapat mengubah nama profile, privasi 100% terjaga (contoh: ChatGPT Plus Private, CapCut Pro Private).
                      </p>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-foreground">
                    2. Memeriksa Ketentuan Garansi Resmi
                  </h3>
                  <p className="text-foreground-muted text-xs leading-relaxed">
                    Setiap produk di katalog memiliki masa garansi resmi (misal: 28 hari, 1 bulan, hingga 6 bulan). Jika akun mengalami kendala selama masa garansi, AsterraStore memberikan garansi penggantian akun baru 100% gratis tanpa biaya tambahan.
                  </p>

                  {onTabChange && (
                    <Button
                      size="sm"
                      onClick={() => onTabChange('sales-catalog')}
                      className="text-xs gap-1.5 h-8 font-semibold"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Buka Katalog Produk Sekarang</span>
                    </Button>
                  )}
                </div>
              )}

              {/* BAB 4 */}
              {activeChapterId === 'bab-4' && (
                <div className="space-y-5">
                  <p>
                    Ikuti 8 langkah standar operasional penjualan berikut agar pelanggan merasa nyaman, aman, dan menjadi pelanggan setia (repeat customer):
                  </p>

                  <div className="space-y-3">
                    {[
                      {
                        no: 1,
                        title: 'Pahami Kebutuhan Pelanggan',
                        desc: 'Tanyakan kebutuhan mereka: untuk tugas kuliah, editing video konten, atau hiburan keluarga.',
                      },
                      {
                        no: 2,
                        title: 'Pilih Produk yang Tepat',
                        desc: 'Rekomendasikan paket yang paling pas dengan budget dan kebutuhan mereka di katalog.',
                      },
                      {
                        no: 3,
                        title: 'Jelaskan Ketentuan & Garansi Secara Terbuka',
                        desc: 'Sampaikan apakah produk berjenis Shared atau Private, durasi masa aktif, serta durasi garansinya.',
                      },
                      {
                        no: 4,
                        title: 'Sampaikan Harga Resmi',
                        desc: 'Sampaikan harga jual resmi yang disepakati sebelum pembeli melakukan transfer pembayaran.',
                      },
                      {
                        no: 5,
                        title: 'Arahkan ke Link Pemesanan Resmi',
                        desc: 'Berikan link referral Anda agar pelanggan melakukan checkout di website AsterraStore.',
                      },
                      {
                        no: 6,
                        title: 'Verifikasi Pembayaran',
                        desc: 'Sistem AsterraStore memproses verifikasi otomatis QRIS maupun transfer bank.',
                      },
                      {
                        no: 7,
                        title: 'Serah Terima Akun / Akses Resmi',
                        desc: 'Detail login atau tautan undangan otomatis dikirimkan ke email atau WhatsApp pembeli.',
                      },
                      {
                        no: 8,
                        title: 'Edukasi Aturan Pemakaian',
                        desc: 'Ingatkan pembeli untuk tidak melanggar aturan profil agar akun awet selama masa aktif.',
                      },
                    ].map((step) => (
                      <div key={step.no} className="flex items-start gap-3 p-3 rounded-xl bg-surface-raised border border-border">
                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {step.no}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-xs text-foreground">{step.title}</h4>
                          <p className="text-[11px] text-foreground-muted leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 text-rose-900 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Larangan Mutlak Sales</span>
                    </div>
                    <p className="text-[11px] text-rose-800 leading-relaxed">
                      Dilarang meminta kata sandi email pribadi pelanggan, dilarang menagih pembayaran ke rekening pribadi tanpa konfirmasi checkout resmi, dan dilarang menjanjikan fitur yang tidak ada di ketentuan produk.
                    </p>
                  </div>
                </div>
              )}

              {/* BAB 5 */}
              {activeChapterId === 'bab-5' && (
                <div className="space-y-5">
                  <p>
                    AsterraStore menerapkan sistem bagi hasil komisi yang transparan berakar pada <strong>Profit Bersih Transaksi</strong> (Net Revenue dikurangi biaya modal produk supplier upstream).
                  </p>

                  <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-3">
                    <h4 className="font-bold text-foreground text-xs">Tingkatan Komisi Penjualan Pribadi:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">Sales Pemula</span>
                          <Badge variant="primary" className="text-[10px]">15% Komisi</Badge>
                        </div>
                        <p className="text-[11px] text-foreground-muted">
                          Berlaku langsung sejak pendaftaran pertama Anda hingga 49 pesanan sukses.
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">Sales Target (VIP)</span>
                          <Badge variant="success" className="text-[10px]">20% Komisi</Badge>
                        </div>
                        <p className="text-[11px] text-foreground-muted">
                          Otomatis naik ke <strong>20%</strong> setelah Anda mengakumulasi minimal 50 pesanan sukses.
                        </p>
                      </div>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-foreground">
                    Skema Bonus Rekrutmen Teman Sales (2%)
                  </h3>
                  <p className="text-foreground-muted text-xs leading-relaxed">
                    Setiap teman yang Anda ajak mendaftar sales menggunakan kode referral Anda, Anda berhak memperoleh <strong>2% dari profit transaksi</strong> mereka seumur hidup (1-Level resmi).
                  </p>

                  <h3 className="font-bold text-base text-foreground">
                    Masa Garansi &amp; Holding Window 3 Hari
                  </h3>
                  <p className="text-foreground-muted text-xs leading-relaxed">
                    Setiap komisi baru akan berada dalam status <strong>Masa Garansi (Pending 3 Hari)</strong>. Setelah 3 hari tanpa ada pembatalan transaksi, saldo komisi otomatis berstatus <strong>Final</strong> dan masuk ke dompet siap ditarik.
                  </p>
                </div>
              )}

              {/* BAB 6 */}
              {activeChapterId === 'bab-6' && (
                <div className="space-y-5">
                  <p>
                    Bagi Anda yang menjual produk secara mandiri kepada klien atau lingkungan offline (misal teman kantor, mahasiswa di kampus), gunakan fitur <strong>Simulasi Harga Jual Reseller</strong> di portal Sales.
                  </p>

                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-surface-raised border border-border space-y-1">
                      <span className="font-bold text-foreground block">1. Pilih Produk &amp; Tentukan Harga Jual</span>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        Pilih produk di kalkulator simulator, lalu masukkan harga yang ingin Anda tawarkan ke pembeli (misal: harga toko Asterra Rp 26.900, Anda tawarkan Rp 30.000).
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-raised border border-border space-y-1">
                      <span className="font-bold text-foreground block">2. Membaca Selisih Harga per Unit &amp; Estimasi Markup</span>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        Sistem menghitung selisih harga per unit (+Rp 3.100). Jika Anda menjual 10 unit, total estimasi markup adalah Rp 31.000.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-raised border border-border space-y-1">
                      <span className="font-bold text-foreground block">3. Menghitung Total Potensi Pendapatan</span>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        Total Potensi Pendapatan = Total Markup + Estimasi Komisi Penjualan + Bonus Referral.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold">
                      <Info className="w-4 h-4 text-amber-600" />
                      <span>Catatan Penting Reseller</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Markup selisih harga bukan otomatis keuntungan bersih jika Anda memiliki biaya operasional pribadi. Selain itu, transaksi reseller mandiri yang tidak tercatat melalui link referral resmi tidak otomatis memperoleh komisi affiliate.
                    </p>
                  </div>
                </div>
              )}

              {/* BAB 7 */}
              {activeChapterId === 'bab-7' && (
                <div className="space-y-5">
                  <p>
                    Mengembangkan jaringan mitra sales adalah cara terbaik menciptakan pendapatan pasif jangka panjang yang stabil.
                  </p>

                  <h3 className="font-bold text-base text-foreground">
                    1. Menemukan Link &amp; Kode Referral Anda
                  </h3>
                  <p className="text-foreground-muted text-xs leading-relaxed">
                    Buka tab <strong>Tautan &amp; Materi Promo</strong> atau <strong>Bonus Tim &amp; Teman</strong>. Salin kode referral unik Anda (contoh: <code>{partnerCode}</code>) atau bagikan link pendaftaran mitra sales langsung ke WhatsApp.
                  </p>

                  <h3 className="font-bold text-base text-foreground">
                    2. Etika Mengajak Calon Mitra
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5 text-foreground-muted text-xs pl-1">
                    <li>Jelaskan bahwa pendaftaran mitra sales AsterraStore adalah <strong>100% Gratis</strong> tanpa biaya pendaftaran.</li>
                    <li>Sampaikan bahwa tidak perlu stok produk dan tidak ada modal awal.</li>
                    <li>Jangan memberikan janji pendapatan pasti yang berlebihan. Pendapatan bergantung pada kerja nyata dan jumlah transaksi.</li>
                    <li>Bantu teman Anda memahami cara menggunakan katalog dan materi promosi toko.</li>
                  </ul>

                  {onTabChange && (
                    <Button
                      size="sm"
                      onClick={() => onTabChange('sales-network')}
                      className="text-xs gap-1.5 h-8 font-semibold"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Buka Tab Jaringan Mitra Sales</span>
                    </Button>
                  )}
                </div>
              )}

              {/* BAB 8 */}
              {activeChapterId === 'bab-8' && (
                <div className="space-y-5">
                  <p>
                    Setiap transaksi pelanggan dapat dipantau statusnya secara real-time pada tab <strong>Pesanan Referral Saya</strong>.
                  </p>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3.5 rounded-xl bg-surface-raised border border-border flex items-start gap-3">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-foreground block">Status: Diproses (Processing)</span>
                        <p className="text-[11px] text-foreground-muted">
                          Pembayaran pelanggan sedang diverifikasi atau akun digital sedang diaktivasi otomatis oleh server.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-raised border border-border flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-foreground block">Status: Selesai (Completed)</span>
                        <p className="text-[11px] text-foreground-muted">
                          Pesanan berhasil, akun telah diserahkan ke pembeli, dan komisi Anda tercatat ke holding garansi.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-raised border border-border flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-foreground block">Status: Dibatalkan / Refund (Cancelled)</span>
                        <p className="text-[11px] text-foreground-muted">
                          Pesanan batal karena tidak dibayar hingga batas waktu kedaluwarsa atau terjadi refund resmi.
                        </p>
                      </div>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-foreground">
                    Tata Cara Menangani Keluhan &amp; Garansi Pelanggan
                  </h3>
                  <ol className="list-decimal list-inside space-y-1.5 text-foreground-muted text-xs pl-1">
                    <li>Minta pembeli menyebutkan nomor <strong>Order ID</strong> (contoh: <code>ORD-xxxx</code>).</li>
                    <li>Tanyakan kendala secara spesifik (misal: sandi salah atau profil terisi penuh).</li>
                    <li>Arahkan pembeli ke layanan pelanggan resmi (CS) AsterraStore untuk verifikasi dan penggantian akun 100% baru.</li>
                  </ol>
                </div>
              )}

              {/* BAB 9 */}
              {activeChapterId === 'bab-9' && (
                <div className="space-y-5">
                  <p>
                    Berikut tips praktis dari para top mitra sales AsterraStore untuk meningkatkan penjualan harian Anda:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-1.5">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        <span>Fokus pada Solusi, Bukan Sekadar Harga</span>
                      </span>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        Daripada hanya menyebut harga, jelaskan manfaatnya: "Pakai Canva Pro ini bisa hapus background foto dalam 1 detik untuk jualan produk kamu".
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-1.5">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>Catat Tanggal Habis Langganan</span>
                      </span>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        Jika pelanggan membeli paket 1 bulan, hubungi kembali di hari ke-27 untuk menawarkan perpanjangan. Repeat order adalah sumber komisi termudah!
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-1.5">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Manfaatkan Status WhatsApp &amp; Story</span>
                      </span>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        Gunakan banner promosi resmi yang disediakan di tab Tautan &amp; Materi Promo. Bagikan secara berkala di jam istirahat siang dan malam.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-1.5">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Kedepankan Garansi Toko</span>
                      </span>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        Banyak orang ragu beli produk digital di internet karena takut tertipu. Tegaskan bahwa AsterraStore menjamin 100% garansi replace selama masa aktif.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* BAB 10 */}
              {activeChapterId === 'bab-10' && (
                <div className="space-y-5">
                  <p>
                    Berikut rangkuman pertanyaan yang paling sering ditanyakan oleh mitra sales yang baru bergabung:
                  </p>

                  <div className="space-y-3 text-xs">
                    <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-1">
                      <span className="font-bold text-foreground text-xs block">
                        Q: Kapan komisi saya bisa dicairkan ke rekening bank?
                      </span>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        A: Komisi dapat ditarik setelah berstatus <strong>Final</strong> (melewati masa garansi 3 hari). Minimal penarikan saldo adalah Rp 50.000 dan diproses ke rekening bank Anda (BCA, Mandiri, BRI, BNI, Dana, GoPay, dll).
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-1">
                      <span className="font-bold text-foreground text-xs block">
                        Q: Bagaimana jika pembeli tidak memasukkan kode referral saya saat belanja?
                      </span>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        A: Jika pembeli mengklik link referral Anda, browser mereka otomatis merekam cookie referral Anda selama 30 hari. Selama belanja dalam periode tersebut, pesanan otomatis terhubung ke akun sales Anda.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-1">
                      <span className="font-bold text-foreground text-xs block">
                        Q: Bagaimana cara menaikkan komisi dari 15% menjadi 20%?
                      </span>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        A: Anda hanya perlu mengumpulkan total 50 pesanan sukses. Sistem kami secara otomatis meningkatkan tier akun Anda ke <strong>Sales VIP (20%)</strong> tanpa perlu permohonan manual.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-1">
                      <span className="font-bold text-foreground text-xs block">
                        Q: Apakah nama pelanggan terlihat oleh saya?
                      </span>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        A: Demi perlindungan privasi pelanggan (PII), nama dan email pelanggan disamarkan secara otomatis di portal sales (contoh: <code>Mar***no</code> &bull; <code>an***@gmail.com</code>).
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="pt-6 border-t border-border flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentChapterIndex === 0}
                className="text-xs h-9 px-4 gap-1.5 border-border cursor-pointer disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Bab Sebelumnya</span>
              </Button>

              <span className="text-xs font-mono text-foreground-muted font-semibold">
                Bab {currentChapter.number} dari {CHAPTERS.length}
              </span>

              <Button
                type="button"
                size="sm"
                onClick={handleNext}
                disabled={currentChapterIndex === CHAPTERS.length - 1}
                className="text-xs h-9 px-4 gap-1.5 font-semibold cursor-pointer disabled:opacity-40"
              >
                <span>Bab Selanjutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
