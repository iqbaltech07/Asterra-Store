'use client';

import React from 'react';
import {
  ShieldCheck,
  HelpCircle,
  MessageSquare,
  Send,
} from 'lucide-react';
import { Accordion, AccordionItem } from '@/components/ui/accordion';

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
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-4 card-hover-elevation">
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
                <strong className="text-foreground">Kalkulasi Berbasis Profit Transaksi:</strong> Komisi direct affiliate 30% selalu dihitung dari Profit Transaksi (Harga Jual dikurangi modal produk upstream & biaya langsung), bukan dari omzet kotor, serta tanpa markup harga ke pembeli.
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

        {/* Guide 2: FAQ Komisi with Zero-Layout-Shift Accordion */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-4 card-hover-elevation">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-foreground">Pertanyaan Umum Seputar Komisi (FAQ)</h3>

          <Accordion type="single" defaultValue="faq-1" className="space-y-2.5">
            <AccordionItem
              value="faq-1"
              trigger={<span className="font-semibold text-foreground text-xs">Kapan komisi masuk dan siap ditarik?</span>}
              className="rounded-xl border border-border bg-surface-raised overflow-hidden"
            >
              <div className="p-3.5 text-[11px] text-foreground-muted leading-relaxed border-t border-border/70">
                Komisi tercatat seketika saat pembeli membayar dan masuk status <strong>Masa Garansi (Holding 3 Hari)</strong> untuk mengantisipasi klaim garansi/refund. Setelah 3 hari, saldo otomatis pindah ke <strong>Saldo Siap Ditarik</strong>.
              </div>
            </AccordionItem>

            <AccordionItem
              value="faq-2"
              trigger={<span className="font-semibold text-foreground text-xs">Bagaimana skema pembagian profit 70:30 Asterra Store?</span>}
              className="rounded-xl border border-border bg-surface-raised overflow-hidden"
            >
              <div className="p-3.5 text-[11px] text-foreground-muted leading-relaxed border-t border-border/70">
                Sesuai <strong>Model Bisnis v2.0</strong>, profit transaksi dibagi <strong>30% untuk Mitra Affiliate</strong> dan <strong>70% untuk Asterra Store</strong> (mencakup 15% cadangan usaha/garansi dan 55% laba pendiri). Hak komisi mitra 30% selalu dibayarkan utuh dan transparan.
              </div>
            </AccordionItem>

            <AccordionItem
              value="faq-3"
              trigger={<span className="font-semibold text-foreground text-xs">Apakah ini sistem MLM atau piramida?</span>}
              className="rounded-xl border border-border bg-surface-raised overflow-hidden"
            >
              <div className="p-3.5 text-[11px] text-foreground-muted leading-relaxed border-t border-border/70">
                Bukan MLM. Asterra Store menerapkan <strong>1-Level Referral Murni (Single-Tier)</strong>. Anda hanya mendapat bonus dari teman yang langsung mendaftar dengan kode Anda (tidak ada level 2 atau seterusnya).
              </div>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Contact Sales Coordinator */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-hover-elevation">
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
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs shrink-0 transition-all shadow-xs cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>WhatsApp Koordinator Sales</span>
        </a>
      </div>
    </div>
  );
}
