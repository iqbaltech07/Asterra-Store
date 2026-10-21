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
        <h2 className="text-lg font-bold text-foreground">Panduan & Edukasi Kemitraan Sales</h2>
        <p className="text-xs text-foreground-muted">
          Pusat pengetahuan, etika promosi, regulasi perlindungan mitra, dan kepatuhan sistem Asterra Store.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Guide 1: Etika Promosi */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-foreground">Etika Promosi & Regulasi Anti-Fraud</h3>
          <ul className="text-xs text-foreground-muted space-y-2 list-disc list-inside leading-relaxed">
            <li>
              <strong className="text-foreground">Dilarang Self-Referral:</strong> Mitra dilarang menggunakan link referral milik sendiri untuk pesanan pribadi atau membuat akun sirkular. Sistem secara otomatis mendeteksi kecocokan email dan WhatsApp.
            </li>
            <li>
              <strong className="text-foreground">Kalkulasi Berbasis Profit Transaksi:</strong> Komisi direct sales (10%) dan bonus rekrutmen (2%) selalu dihitung dari Profit Transaksi (Net Revenue dikurangi modal produk & biaya langsung), bukan dari omzet kotor.
            </li>
            <li>
              <strong className="text-foreground">Dilarang Spam:</strong> Jangan menyebarkan link secara massal di grup publik tanpa izin atau kolom komentar media sosial orang lain.
            </li>
            <li>
              <strong className="text-foreground">Informasi Garansi Resmi:</strong> Sampaikan informasi garansi sesuai ketentuan toko (garansi penggantian akun 100% selama masa aktif).
            </li>
          </ul>
        </div>

        {/* Guide 2: FAQ Komisi */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-foreground">Pertanyaan Umum Seputar Komisi (FAQ)</h3>
          <div className="text-xs text-foreground-muted space-y-2.5 leading-relaxed">
            <div>
              <p className="font-semibold text-foreground">Kapan komisi masuk dan siap ditarik?</p>
              <p className="text-[11px]">
                Komisi tercatat seketika saat pembeli membayar dan masuk status <strong>Masa Garansi (Holding 3 Hari)</strong> untuk mengantisipasi klaim garansi/refund. Setelah 3 hari, saldo otomatis pindah ke <strong>Saldo Siap Ditarik</strong>.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Dari mana sumber bonus 2% ajak teman?</p>
              <p className="text-[11px]">
                Bonus rekrutmen 2% dihitung dari Profit Transaksi yang dihasilkan oleh teman langsung Anda. Komisi penjualan teman Anda tetap utuh 100% (10% dari Profit Transaksi) tanpa ada potongan.
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Apakah ini sistem MLM atau piramida?</p>
              <p className="text-[11px]">
                Bukan MLM. Asterra Store menerapkan <strong>1-Level Referral Murni (Single-Tier)</strong>. Anda hanya mendapat bonus dari teman yang langsung mendaftar dengan kode Anda (tidak ada level 2 atau level seterusnya).
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Bagaimana jika ada pesanan teman yang di-refund?</p>
              <p className="text-[11px]">
                Jika pesanan dibatalkan atau di-refund sebelum melewati masa garansi, komisi dan bonus terkait akan dibatalkan (reversed) secara otomatis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Sales Coordinator */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-status-success" />
            <span>Butuh Bantuan Materi Promosi Khusus?</span>
          </h3>
          <p className="text-xs text-foreground-muted">
            Hubungi Koordinator Mitra Sales Asterra Store untuk mendapatkan banner promo khusus atau konsultasi target penjualan.
          </p>
        </div>
        <a
          href="https://wa.me/6281298765432?text=Halo%20Koordinator%20Sales%20Asterra%20Store,%20saya%20ingin%20konsultasi%20materi%20promosi%20dan%20katalog."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-status-success hover:bg-status-success/90 text-white font-semibold text-xs shrink-0 transition-colors shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>WhatsApp Koordinator Sales</span>
        </a>
      </div>
    </div>
  );
}
