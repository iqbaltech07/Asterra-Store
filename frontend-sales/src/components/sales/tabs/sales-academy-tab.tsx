'use client';

import React from 'react';
import {
  ShieldCheck,
  HelpCircle,
  MessageSquare,
  Send,
} from 'lucide-react';

export function SalesAcademyTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Panduan & Edukasi Kemitraan Sales</h2>
        <p className="text-xs text-foreground-muted mt-1">
          Pusat pengetahuan, etika promosi, regulasi perlindungan mitra, dan kepatuhan sistem Asterra Store.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Guide 1: Etika Promosi */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-foreground">Etika Promosi & Regulasi Anti-Fraud</h3>
          <ul className="text-xs text-foreground-muted space-y-3 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>
                <strong className="text-foreground">Dilarang Self-Referral:</strong> Mitra dilarang menggunakan link referral milik sendiri untuk pesanan pribadi atau membuat akun sirkular. Sistem secara otomatis mendeteksi kecocokan email dan WhatsApp.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>
                <strong className="text-foreground">Kalkulasi Berbasis Profit Transaksi:</strong> Komisi direct sales (10% – 15%) dan bonus rekrutmen (2%) selalu dihitung dari Profit Transaksi (Net Revenue dikurangi modal produk & biaya langsung), bukan dari omzet kotor.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>
                <strong className="text-foreground">Dilarang Spam:</strong> Jangan menyebarkan link secara massal di grup publik tanpa izin atau kolom komentar media sosial orang lain.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>
                <strong className="text-foreground">Informasi Garansi Resmi:</strong> Sampaikan informasi garansi sesuai ketentuan toko (garansi penggantian akun 100% selama masa aktif).
              </span>
            </li>
          </ul>
        </div>

        {/* Guide 2: FAQ Komisi */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-foreground">Pertanyaan Umum Seputar Komisi (FAQ)</h3>
          <div className="text-xs text-foreground-muted space-y-3.5 leading-relaxed">
            <div className="p-3.5 rounded-xl bg-surface-raised border border-border">
              <p className="font-semibold text-foreground mb-1">Kapan komisi masuk dan siap ditarik?</p>
              <p className="text-[11px]">
                Komisi tercatat seketika saat pembeli membayar dan masuk status <strong>Masa Garansi (Holding 3 Hari)</strong> untuk mengantisipasi klaim garansi/refund. Setelah 3 hari, saldo otomatis pindah ke <strong>Saldo Siap Ditarik</strong>.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-raised border border-border">
              <p className="font-semibold text-foreground mb-1">Dari mana sumber bonus 2% ajak teman?</p>
              <p className="text-[11px]">
                Bonus rekrutmen 2% dihitung dari Profit Transaksi yang dihasilkan oleh teman langsung Anda. Komisi penjualan teman Anda tetap utuh 100% (10% – 15% dari Profit Transaksi) tanpa ada potongan.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-raised border border-border">
              <p className="font-semibold text-foreground mb-1">Apakah ini sistem MLM atau piramida?</p>
              <p className="text-[11px]">
                Bukan MLM. Asterra Store menerapkan <strong>1-Level Referral Murni (Single-Tier)</strong>. Anda hanya mendapat bonus dari teman yang langsung mendaftar dengan kode Anda (tidak ada level 2 atau seterusnya).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Sales Coordinator */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">Butuh Bantuan Materi Promosi Khusus?</h3>
            <p className="text-xs text-foreground-muted">
              Hubungi Koordinator Mitra Sales Asterra Store untuk mendapatkan banner promo khusus atau konsultasi target penjualan.
            </p>
          </div>
        </div>
        <a
          href="https://wa.me/6281298765432?text=Halo%20Koordinator%20Sales%20Asterra%20Store,%20saya%20ingin%20konsultasi%20materi%20promosi%20dan%20katalog."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shrink-0 transition-colors shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span>WhatsApp Koordinator Sales</span>
        </a>
      </div>
    </div>
  );
}
