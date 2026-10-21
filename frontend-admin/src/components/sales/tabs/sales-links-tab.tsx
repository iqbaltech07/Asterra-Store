'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Flame,
  Calendar,
  Share2,
  Copy,
  Check,
  Send,
  ExternalLink,
  ShieldCheck,
  FileText,
  MessageSquare,
  Users,
  Sparkles,
} from 'lucide-react';
import { getStoreBaseUrl } from '@/lib/utils/url';
import type { ProductItem, CampaignItem } from '../types';

export interface SalesLinksTabProps {
  products: ProductItem[];
  campaigns?: CampaignItem[];
  partnerCode: string;
  partnerRate: number;
  copiedLink: string | null;
  handleCopy: (text: string, id: string) => void;
}

export function SalesLinksTab({
  products,
  campaigns = [],
  partnerCode,
  partnerRate,
  copiedLink,
  handleCopy,
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
      <div>
        <h2 className="text-lg font-bold text-foreground">Generator Tautan & Materi Promosi</h2>
        <p className="text-xs text-foreground-muted">
          Pilih produk tujuan untuk membuat tautan referral langsung dan gunakan template materi promosi siap pakai untuk meningkatkan konversi.
        </p>
      </div>

      {/* Active Campaigns & Booster Komisi Section */}
      {campaigns && campaigns.length > 0 && (
        <div className="bg-surface border border-primary/25 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                <Flame className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <span>Event & Campaign Promo Aktif</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
                    Booster Komisi
                  </span>
                </h3>
                <p className="text-[11px] text-foreground-muted">
                  Promosikan event resmi di bawah ini untuk mendapatkan bonus komisi lebih tinggi dan link siap pakai.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-status-success font-mono">
              {campaigns.length} Event Berjalan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className="bg-surface-raised border border-border hover:border-primary/40 rounded-xl p-4 shadow-2xs flex flex-col justify-between space-y-3.5 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-status-success/15 text-status-success border border-status-success/25 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                      <span>Aktif</span>
                    </span>
                    <span className="text-[10px] text-foreground-muted flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      <span>{camp.startDate} s.d. {camp.endDate}</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-foreground leading-snug">{camp.name}</h4>
                    <p className="text-[11px] text-foreground-muted line-clamp-2 mt-0.5">{camp.tagline}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] text-foreground-muted">Bonus Komisi Anda:</span>
                      <span className="font-extrabold text-primary font-mono text-sm">
                        🔥 {camp.boosterCommissionRate}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-foreground-muted pt-1 border-t border-primary/15">
                      <span>Diskon Pembeli:</span>
                      <span className="font-semibold text-foreground font-mono">
                        {camp.discountType === 'percentage'
                          ? `${camp.discountValue}% OFF`
                          : `Rp ${camp.discountValue.toLocaleString('id-ID')}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/70">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleCopy(camp.affiliateLink, `camp-${camp.id}`)}
                      className="flex-1 h-8 text-xs font-semibold gap-1.5"
                    >
                      {copiedLink === `camp-${camp.id}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-status-success" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Link</span>
                        </>
                      )}
                    </Button>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(camp.whatsappShareText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 px-2.5 rounded-lg bg-status-success hover:bg-status-success/90 text-white flex items-center justify-center transition-colors shrink-0 gap-1 text-xs font-semibold"
                      title="Bagikan ke WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
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
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Share2 className="w-4 h-4 text-primary" />
            <span>Generator Tautan Referral</span>
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-foreground block mb-1.5">Pilih Halaman Tujuan:</label>
              <select
                value={selectedProductForLink}
                onChange={(e) => setSelectedProductForLink(e.target.value)}
                className="w-full bg-surface-raised border border-border rounded-lg text-xs p-2.5 text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
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
                  <span className="text-[10px] text-status-success font-semibold">Booster Komisi Aktif!</span>
                )}
              </label>
              <select
                value={selectedCampaignForLink}
                onChange={(e) => setSelectedCampaignForLink(e.target.value)}
                className="w-full bg-surface-raised border border-border rounded-lg text-xs p-2.5 text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
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
              <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-foreground-muted uppercase font-semibold block">Halaman Terpilih</span>
                  <span className="font-bold text-foreground">
                    {products.find((p) => p.id === selectedProductForLink)?.name || 'Produk Spesifik'}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30">
                  Link Langsung ke Produk
                </Badge>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-border bg-surface-raised flex items-center justify-between text-xs">
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
            <div className="pt-2 space-y-1.5">
              <label className="font-semibold text-foreground block">Tautan Referral Siap Pakai:</label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={customGeneratedUrl}
                  className="bg-surface-raised border-border text-xs font-mono h-10 select-all"
                />
                <Button
                  onClick={() => handleCopy(customGeneratedUrl, 'custom-url')}
                  className="h-10 px-3.5 text-xs font-semibold shrink-0 gap-1.5"
                >
                  {copiedLink === 'custom-url' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-status-success" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Link</span>
                    </>
                  )}
                </Button>
                <a
                  href={customGeneratedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 px-3 rounded-lg border border-border bg-surface-raised hover:bg-surface-raised/80 text-foreground-muted hover:text-foreground flex items-center justify-center transition-colors shrink-0"
                  title="Buka Tautan"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Info Tracking Card */}
            <div className="pt-3 border-t border-border/70 space-y-1.5 text-[11px] text-foreground-muted">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
                <span>Garansi Pelacakan Cookie 30 Hari</span>
              </div>
              <p className="leading-relaxed">
                Setiap calon pelanggan yang membuka tautan di atas akan otomatis mengaktifkan kode referral Anda (<code className="font-mono text-primary font-bold">{partnerCode}</code>). Jika mereka membeli dalam kurun 30 hari, komisi {partnerRate}% otomatis masuk ke akun Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Ready-to-use Copywriting Templates */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-status-success" />
            <span>Template Materi Copywriting Promosi</span>
          </h3>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {/* Template 1: WhatsApp Status */}
            <div className="bg-surface-raised border border-border rounded-lg p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-status-success" />
                  <span>WhatsApp Story / Status</span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    handleCopy(
                      `Halo teman-teman! Lagi butuh akun Canva Pro, Gemini AI, ChatGPT Plus, atau Netflix private bergaransi resmi tanpa takut kena suspend? Langsung order aman lewat link resmi ini ya: ${customGeneratedUrl}`,
                      'copy-wa'
                    )
                  }
                  className="h-7 text-[11px] gap-1 px-2.5 text-primary hover:bg-primary/10"
                >
                  {copiedLink === 'copy-wa' ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink === 'copy-wa' ? 'Tersalin!' : 'Salin Teks'}</span>
                </Button>
              </div>
              <p className="text-foreground-muted leading-relaxed text-[11px] bg-surface p-2.5 rounded border border-border/50">
                &ldquo;Halo teman-teman! Lagi butuh akun Canva Pro, Gemini AI, ChatGPT Plus, atau Netflix private bergaransi resmi tanpa takut kena suspend? Langsung order aman lewat link resmi ini ya: {customGeneratedUrl}&rdquo;
              </p>
              <div className="flex justify-end">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Halo teman-teman! Lagi butuh akun Canva Pro, Gemini AI, ChatGPT Plus, atau Netflix private bergaransi resmi tanpa takut kena suspend? Langsung order aman lewat link resmi ini ya: ${customGeneratedUrl}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-status-success hover:underline"
                >
                  <Send className="w-3 h-3" />
                  <span>Bagikan ke Status WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Template 2: Chat Personal / Rekomendasi Teman */}
            <div className="bg-surface-raised border border-border rounded-lg p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span>Chat Rekomendasi Personal</span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    handleCopy(
                      `Halo kak! Mau infoin nih kalau butuh tools produktivitas & hiburan premium (Canva, ChatGPT, Netflix, dll) yang resmi dan ada garansi ganti baru 100%, rekomendasiku beli di Asterra Store aja kak. Harganya jauh lebih hemat dan prosesnya instan: ${customGeneratedUrl}`,
                      'copy-personal'
                    )
                  }
                  className="h-7 text-[11px] gap-1 px-2.5 text-primary hover:bg-primary/10"
                >
                  {copiedLink === 'copy-personal' ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink === 'copy-personal' ? 'Tersalin!' : 'Salin Teks'}</span>
                </Button>
              </div>
              <p className="text-foreground-muted leading-relaxed text-[11px] bg-surface p-2.5 rounded border border-border/50">
                &ldquo;Halo kak! Mau infoin nih kalau butuh tools produktivitas &amp; hiburan premium (Canva, ChatGPT, Netflix, dll) yang resmi dan ada garansi ganti baru 100%, rekomendasiku beli di Asterra Store aja kak. Harganya jauh lebih hemat dan prosesnya instan: {customGeneratedUrl}&rdquo;
              </p>
            </div>

            {/* Template 3: Caption Instagram / Bio */}
            <div className="bg-surface-raised border border-border rounded-lg p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Caption Instagram / Bio Link</span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    handleCopy(
                      `Layanan Akun Digital Premium Resmi & Bergaransi 100% ✨\n\n✅ Canva Pro, ChatGPT Plus, Netflix, Spotify ready kilat\n✅ Bergaransi penuh & amanah\n✅ Proses 1 - 15 menit selesai\n\nKatalog lengkap & order resmi:\n👉 ${customGeneratedUrl}`,
                      'copy-ig'
                    )
                  }
                  className="h-7 text-[11px] gap-1 px-2.5 text-primary hover:bg-primary/10"
                >
                  {copiedLink === 'copy-ig' ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink === 'copy-ig' ? 'Tersalin!' : 'Salin Teks'}</span>
                </Button>
              </div>
              <p className="text-foreground-muted leading-relaxed text-[11px] bg-surface p-2.5 rounded border border-border/50 whitespace-pre-line">
                {`Layanan Akun Digital Premium Resmi & Bergaransi 100% ✨\n\n✅ Canva Pro, ChatGPT Plus, Netflix, Spotify ready kilat\n✅ Bergaransi penuh & amanah\n✅ Proses 1 - 15 menit selesai\n\nKatalog lengkap & order resmi:\n👉 ${customGeneratedUrl}`}
              </p>
            </div>

            {/* Template 4: Broadcast Grup / Komunitas */}
            <div className="bg-surface-raised border border-border rounded-lg p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-primary" />
                  <span>Broadcast Grup / Komunitas</span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    handleCopy(
                      `Selamat siang rekan-rekan! Izin berbagi info bermanfaat untuk kebutuhan tugas, kantor, dan hiburan. Bagi yang butuh akses resmi Canva Pro, AI tools, atau streaming dengan garansi aktif dan harga terjangkau, silakan cek katalog resmi Asterra Store di: ${customGeneratedUrl} 🙏`,
                      'copy-group'
                    )
                  }
                  className="h-7 text-[11px] gap-1 px-2.5 text-primary hover:bg-primary/10"
                >
                  {copiedLink === 'copy-group' ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink === 'copy-group' ? 'Tersalin!' : 'Salin Teks'}</span>
                </Button>
              </div>
              <p className="text-foreground-muted leading-relaxed text-[11px] bg-surface p-2.5 rounded border border-border/50">
                &ldquo;Selamat siang rekan-rekan! Izin berbagi info bermanfaat untuk kebutuhan tugas, kantor, dan hiburan. Bagi yang butuh akses resmi Canva Pro, AI tools, atau streaming dengan garansi aktif dan harga terjangkau, silakan cek katalog resmi Asterra Store di: {customGeneratedUrl} 🙏&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
