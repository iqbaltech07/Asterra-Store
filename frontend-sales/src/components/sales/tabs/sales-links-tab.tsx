'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Flame,
  Calendar,
  Share2,
  Send,
  ExternalLink,
  ShieldCheck,
  FileText,
  MessageSquare,
  Users,
} from 'lucide-react';
import { getStoreBaseUrl } from '@/lib/utils/url';
import { CopyButton } from '@/components/ui/copy-button';
import { ShareButton } from '@/components/ui/share-button';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import type { ProductItem, CampaignItem } from '../types';

export interface SalesLinksTabProps {
  products: ProductItem[];
  campaigns?: CampaignItem[];
  partnerCode: string;
  partnerRate: number;
  copiedLink?: string | null;
  handleCopy?: (text: string, id: string) => void;
}

export function SalesLinksTab({
  products,
  campaigns = [],
  partnerCode,
  partnerRate,
  copiedLink: _copiedLink,
  handleCopy: _handleCopy,
}: SalesLinksTabProps) {
  const [selectedProductForLink, setSelectedProductForLink] = useState('');
  const [selectedCampaignForLink, setSelectedCampaignForLink] = useState('');


  const customGeneratedUrl = useMemo(() => {
    const base = getStoreBaseUrl();
    const campParam = selectedCampaignForLink ? `&campaign=${selectedCampaignForLink}` : '';
    if (selectedProductForLink) {
      return `${base}/products/${selectedProductForLink}?ref=${partnerCode}${campParam}`;
    }
    return `${base}/?ref=${partnerCode}${campParam}`;
  }, [partnerCode, selectedProductForLink, selectedCampaignForLink]);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Generator Tautan & Materi Promosi</h2>
        <p className="text-xs text-foreground-muted mt-1">
          Pilih produk tujuan untuk membuat tautan referral langsung dan gunakan template materi promosi siap pakai untuk meningkatkan konversi.
        </p>
      </div>

      {/* Active Campaigns & Booster Komisi Section */}
      {campaigns && campaigns.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Flame className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <span>Event & Campaign Promo Aktif</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    Booster Komisi
                  </span>
                </h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Promosikan event resmi di bawah ini untuk mendapatkan bonus komisi lebih tinggi dan link siap pakai.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 font-mono">
              {campaigns.length} Event Berjalan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {campaigns.map((camp, idx) => (
              <div
                key={camp.id}
                className="rounded-2xl border border-border bg-surface-raised p-4 flex flex-col justify-between space-y-4 card-hover-elevation animate-fade-up"
                style={{ animationDelay: `${Math.min(idx, 5) * 50}ms` }}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      Aktif
                    </span>
                    <span className="text-[11px] text-foreground-muted flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      <span>{camp.startDate} - {camp.endDate}</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-foreground leading-snug">{camp.name}</h4>
                    <p className="text-xs text-foreground-muted line-clamp-2 mt-1">{camp.tagline}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface border border-border space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-xs text-foreground-muted">Bonus Komisi:</span>
                      <span className="font-extrabold text-primary font-mono text-sm">
                        🔥 {camp.boosterCommissionRate}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-foreground-muted pt-1.5 border-t border-border/60">
                      <span>Diskon Pembeli:</span>
                      <span className="font-semibold text-foreground font-mono">
                        {camp.discountType === 'percentage'
                          ? `${camp.discountValue}% OFF`
                          : `Rp ${camp.discountValue.toLocaleString('id-ID')}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <CopyButton
                      text={camp.affiliateLink}
                      label="Salin Link"
                      copiedLabel="Tersalin!"
                      size="sm"
                      className="flex-1"
                    />

                    <ShareButton
                      url={camp.affiliateLink}
                      title={camp.name}
                      text={camp.whatsappShareText}
                      variant="blue"
                      size="sm"
                    />

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(camp.whatsappShareText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center transition-all shrink-0 gap-1 text-xs font-semibold shadow-xs cursor-pointer"
                      title="Bagikan ke WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custom Link Builder */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Generator Tautan Referral</h3>
              <p className="text-xs text-foreground-muted">Kustomisasi link menuju katalog beranda atau halaman produk spesifik</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-foreground block mb-1.5">Pilih Halaman Tujuan:</label>
              <select
                value={selectedProductForLink}
                onChange={(e) => setSelectedProductForLink(e.target.value)}
                className="w-full bg-surface-raised border border-border rounded-xl text-xs p-3 text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
              >
                <option value="">Beranda Toko (Semua Katalog Produk)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.priceFormatted || `Rp ${p.price.toLocaleString('id-ID')}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1.5 flex items-center justify-between">
                <span>Sertakan Parameter Campaign (Opsional):</span>
                {selectedCampaignForLink && (
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                    Booster Komisi Aktif
                  </span>
                )}
              </label>
              <select
                value={selectedCampaignForLink}
                onChange={(e) => setSelectedCampaignForLink(e.target.value)}
                className="w-full bg-surface-raised border border-border rounded-xl text-xs p-3 text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
              >
                <option value="">Tanpa Campaign (Link Standar)</option>
                {campaigns.map((camp) => (
                  <option key={camp.id} value={camp.slug}>
                    🔥 {camp.name} — Booster Komisi {camp.boosterCommissionRate}%
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Target Preview */}
            {selectedProductForLink ? (
              <div className="p-3.5 rounded-xl border border-border bg-surface-raised flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-foreground-muted uppercase font-semibold block">Halaman Terpilih</span>
                  <span className="font-bold text-foreground">
                    {products.find((p) => p.id === selectedProductForLink)?.name || 'Produk Spesifik'}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30 bg-primary/5">
                  Link Langsung ke Produk
                </Badge>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-border bg-surface-raised flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-foreground-muted uppercase font-semibold block">Halaman Terpilih</span>
                  <span className="font-bold text-foreground">Beranda Toko Asterra Store</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold text-foreground-muted">
                  Semua Katalog
                </Badge>
              </div>
            )}

            {/* Hasil Tautan Referral */}
            <div className="pt-2 space-y-2">
              <label className="font-semibold text-foreground block">Tautan Referral Siap Pakai:</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Input
                  readOnly
                  value={customGeneratedUrl}
                  className="bg-surface-raised border-border text-xs font-mono h-10 select-all rounded-xl flex-1"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <CopyButton
                    text={customGeneratedUrl}
                    label="Salin"
                    copiedLabel="Tersalin!"
                    className="h-10 px-3.5"
                  />
                  <ShareButton
                    url={customGeneratedUrl}
                    title="Tautan Rekomendasi Asterra Store"
                    text="Dapatkan akun digital premium resmi bergaransi (Canva, Gemini AI, Netflix, Spotify) di Asterra Store:"
                    variant="blue"
                    className="h-10 px-3"
                  />
                  <a
                    href={customGeneratedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-3 rounded-xl border border-border bg-surface-raised hover:bg-surface text-foreground-muted hover:text-foreground flex items-center justify-center transition-all shrink-0 active:scale-95 cursor-pointer"
                    title="Buka Tautan"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Info Tracking Card */}
            <div className="pt-3 border-t border-border space-y-1.5 text-xs text-foreground-muted">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Garansi Pelacakan Cookie 30 Hari</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                Setiap calon pelanggan yang membuka tautan di atas akan otomatis mengaktifkan kode referral Anda (<code className="font-mono text-primary font-bold">{partnerCode}</code>). Jika mereka membeli dalam kurun 30 hari, komisi {partnerRate}% otomatis masuk ke akun Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Ready-to-use Copywriting Templates with Accordion */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Template Materi Promosi</h3>
              <p className="text-xs text-foreground-muted">Pilih copywriting siap pakai yang telah teruji konversinya</p>
            </div>
          </div>

          <Accordion type="single" defaultValue="wa-story" className="space-y-3">
            {/* Template 1: WhatsApp Status */}
            {(() => {
              const text1 = `Halo teman-teman! Lagi butuh akun Canva Pro, Gemini AI, ChatGPT Plus, atau Netflix private bergaransi resmi tanpa takut kena suspend? Langsung order aman lewat link resmi ini ya: ${customGeneratedUrl}`;
              return (
                <AccordionItem
                  value="wa-story"
                  trigger={
                    <span className="font-bold text-foreground flex items-center gap-2 text-xs">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>WhatsApp Story / Status</span>
                    </span>
                  }
                  className="rounded-xl border border-border bg-surface-raised overflow-hidden"
                >
                  <div className="p-3.5 sm:p-4 space-y-3 text-xs border-t border-border/70">
                    <p className="text-foreground-muted leading-relaxed text-[11px] bg-surface p-3 rounded-lg border border-border">
                      &ldquo;{text1}&rdquo;
                    </p>
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      <CopyButton
                        text={text1}
                        label="Salin Teks"
                        copiedLabel="Tersalin!"
                        size="sm"
                      />
                      <ShareButton
                        url={customGeneratedUrl}
                        title="Rekomendasi Akun Digital"
                        text={text1}
                        variant="blue"
                        size="sm"
                      />
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(text1)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-semibold transition-all cursor-pointer shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Status WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </AccordionItem>
              );
            })()}

            {/* Template 2: Chat Personal */}
            {(() => {
              const text2 = `Halo kak! Mau infoin nih kalau butuh tools produktivitas & hiburan premium (Canva, ChatGPT, Netflix, dll) yang resmi dan ada garansi ganti baru 100%, rekomendasiku beli di Asterra Store aja kak. Harganya jauh lebih hemat dan prosesnya instan: ${customGeneratedUrl}`;
              return (
                <AccordionItem
                  value="personal"
                  trigger={
                    <span className="font-bold text-foreground flex items-center gap-2 text-xs">
                      <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Chat Rekomendasi Personal</span>
                    </span>
                  }
                  className="rounded-xl border border-border bg-surface-raised overflow-hidden"
                >
                  <div className="p-3.5 sm:p-4 space-y-3 text-xs border-t border-border/70">
                    <p className="text-foreground-muted leading-relaxed text-[11px] bg-surface p-3 rounded-lg border border-border">
                      &ldquo;{text2}&rdquo;
                    </p>
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      <CopyButton
                        text={text2}
                        label="Salin Teks"
                        copiedLabel="Tersalin!"
                        size="sm"
                      />
                      <ShareButton
                        url={customGeneratedUrl}
                        title="Rekomendasi Personal"
                        text={text2}
                        variant="blue"
                        size="sm"
                      />
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(text2)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-semibold transition-all cursor-pointer shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Kirim WA</span>
                      </a>
                    </div>
                  </div>
                </AccordionItem>
              );
            })()}

            {/* Template 3: Caption Instagram / Bio */}
            {(() => {
              const text3 = `Layanan Akun Digital Premium Resmi & Bergaransi 100%\n\n✅ Canva Pro, ChatGPT Plus, Netflix, Spotify ready kilat\n✅ Bergaransi penuh & amanah\n✅ Proses 1 - 15 menit selesai\n\nKatalog lengkap & order resmi:\n👉 ${customGeneratedUrl}`;
              return (
                <AccordionItem
                  value="ig-bio"
                  trigger={
                    <span className="font-bold text-foreground flex items-center gap-2 text-xs">
                      <Share2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Caption Instagram / Bio Link</span>
                    </span>
                  }
                  className="rounded-xl border border-border bg-surface-raised overflow-hidden"
                >
                  <div className="p-3.5 sm:p-4 space-y-3 text-xs border-t border-border/70">
                    <p className="text-foreground-muted leading-relaxed text-[11px] bg-surface p-3 rounded-lg border border-border whitespace-pre-line font-mono">
                      {text3}
                    </p>
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      <CopyButton
                        text={text3}
                        label="Salin Teks"
                        copiedLabel="Tersalin!"
                        size="sm"
                      />
                      <ShareButton
                        url={customGeneratedUrl}
                        title="Materi Bio & Instagram"
                        text={text3}
                        variant="blue"
                        size="sm"
                      />
                    </div>
                  </div>
                </AccordionItem>
              );
            })()}

            {/* Template 4: Broadcast Grup */}
            {(() => {
              const text4 = `Selamat siang rekan-rekan! Izin berbagi info bermanfaat untuk kebutuhan tugas, kantor, dan hiburan. Bagi yang butuh akses resmi Canva Pro, AI tools, atau streaming dengan garansi aktif dan harga terjangkau, silakan cek katalog resmi Asterra Store di: ${customGeneratedUrl} 🙏`;
              return (
                <AccordionItem
                  value="group"
                  trigger={
                    <span className="font-bold text-foreground flex items-center gap-2 text-xs">
                      <Send className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Broadcast Komunitas & Grup</span>
                    </span>
                  }
                  className="rounded-xl border border-border bg-surface-raised overflow-hidden"
                >
                  <div className="p-3.5 sm:p-4 space-y-3 text-xs border-t border-border/70">
                    <p className="text-foreground-muted leading-relaxed text-[11px] bg-surface p-3 rounded-lg border border-border">
                      &ldquo;{text4}&rdquo;
                    </p>
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      <CopyButton
                        text={text4}
                        label="Salin Teks"
                        copiedLabel="Tersalin!"
                        size="sm"
                      />
                      <ShareButton
                        url={customGeneratedUrl}
                        title="Broadcast Komunitas"
                        text={text4}
                        variant="blue"
                        size="sm"
                      />
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(text4)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-semibold transition-all cursor-pointer shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Kirim ke Grup</span>
                      </a>
                    </div>
                  </div>
                </AccordionItem>
              );
            })()}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
