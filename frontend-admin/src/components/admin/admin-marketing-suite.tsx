'use client';

import React, { useState } from 'react';
import {
  Megaphone,
  Image as ImageIcon,
  Plus,
  Calendar,
  Sparkles,
  Percent,
  Tag,
  Eye,
  EyeOff,
  Clock,
  TrendingUp,
  ShoppingBag,
  Share2,
  CheckCircle2,
  Trash2,
  Edit,
  ExternalLink,
  Smartphone,
  Monitor,
  Copy,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ImageUploadDropzone, uploadFileToBlob } from '@/components/admin/image-upload-dropzone';

interface CampaignItem {
  id: string;
  name: string;
  tagline: string;
  startDate: string;
  endDate: string;
  targetCategory: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  affiliateBonusPercent: number;
  status: 'running' | 'scheduled' | 'ended' | 'draft';
  totalOrders: number;
  revenue: number;
  conversionRate: number;
}

interface BannerItem {
  id: string;
  type: 'hero' | 'promo-bar' | 'announcement';
  title: string;
  description: string;
  ctaText: string;
  destinationUrl: string;
  imageUrl: string;
  displayOrder: number;
  status: 'active' | 'inactive';
  scheduledUntil?: string;
  clickCount: number;
}

const INITIAL_CAMPAIGNS: CampaignItem[] = [
  {
    id: 'camp-1',
    name: 'Payday Special: AI & Streaming Boost',
    tagline: 'Diskon kilat akhir bulan untuk seluruh AI Tools & Hiburan',
    startDate: '2026-09-25',
    endDate: '2026-10-05',
    targetCategory: 'Semua Kategori',
    discountType: 'percentage',
    discountValue: 15,
    minPurchase: 50000,
    affiliateBonusPercent: 5,
    status: 'running',
    totalOrders: 184,
    revenue: 5520000,
    conversionRate: 8.4,
  },
  {
    id: 'camp-2',
    name: 'Content Creator Starter Pack',
    tagline: 'Bundling Canva Pro + CapCut Pro diskon Rp 15.000',
    startDate: '2026-10-01',
    endDate: '2026-10-15',
    targetCategory: 'Desain & Grafis',
    discountType: 'fixed',
    discountValue: 15000,
    minPurchase: 60000,
    affiliateBonusPercent: 7.5,
    status: 'running',
    totalOrders: 92,
    revenue: 3220000,
    conversionRate: 11.2,
  },
  {
    id: 'camp-3',
    name: 'Flash Sale 10.10 Digital Mega Deal',
    tagline: 'Mega sale kupon diskon 25% serentak jam 12:00 - 24:00',
    startDate: '2026-10-10',
    endDate: '2026-10-11',
    targetCategory: 'Semua Kategori',
    discountType: 'percentage',
    discountValue: 25,
    minPurchase: 30000,
    affiliateBonusPercent: 10,
    status: 'scheduled',
    totalOrders: 0,
    revenue: 0,
    conversionRate: 0,
  },
  {
    id: 'camp-4',
    name: 'Student Productivity Sprint',
    tagline: 'Subsidi akun Gemini & ChatGPT Pro untuk mahasiswa',
    startDate: '2026-08-15',
    endDate: '2026-09-15',
    targetCategory: 'AI Tools',
    discountType: 'percentage',
    discountValue: 20,
    minPurchase: 40000,
    affiliateBonusPercent: 5,
    status: 'ended',
    totalOrders: 312,
    revenue: 9672000,
    conversionRate: 9.8,
  },
];

const INITIAL_BANNERS: BannerItem[] = [
  {
    id: 'ban-1',
    type: 'hero',
    title: 'Akses Premium Resmi & Bergaransi',
    description: 'Beli akun Canva Pro, Gemini AI, Netflix, dan Spotify dengan proses instan 1 menit.',
    ctaText: 'Eksplor Katalog',
    destinationUrl: '/#katalog',
    imageUrl: '/images/default-product-banner.png',
    displayOrder: 1,
    status: 'active',
    scheduledUntil: '2026-12-31',
    clickCount: 1420,
  },
  {
    id: 'ban-2',
    type: 'promo-bar',
    title: '⚡ Flash Promo 10% Diskon Pengguna Baru',
    description: 'Gunakan kupon AST-NEWUSER pada halaman checkout tanpa minimal transaksi!',
    ctaText: 'Salin Kode',
    destinationUrl: '/#promo',
    imageUrl: '',
    displayOrder: 2,
    status: 'active',
    scheduledUntil: '2026-10-31',
    clickCount: 890,
  },
  {
    id: 'ban-3',
    type: 'announcement',
    title: 'Pembayaran QRIS & VA Otomatis Aktif 24 Jam',
    description: 'Semua transaksi otomatis diverifikasi dalam hitungan detik tanpa konfirmasi manual.',
    ctaText: 'Pelajari',
    destinationUrl: '/faq',
    imageUrl: '',
    displayOrder: 3,
    status: 'active',
    scheduledUntil: '2026-12-31',
    clickCount: 340,
  },
];

interface AdminMarketingSuiteProps {
  activeTab: 'campaigns' | 'banners';
  onNotify?: (msg: string) => void;
}

export function AdminMarketingSuite({ activeTab, onNotify }: AdminMarketingSuiteProps) {
  // Campaigns State
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(INITIAL_CAMPAIGNS);
  const [campaignFilter, setCampaignFilter] = useState<'all' | 'running' | 'scheduled' | 'ended'>('all');
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignItem | null>(null);

  // Campaign Form State
  const [campName, setCampName] = useState('');
  const [campTagline, setCampTagline] = useState('');
  const [campStartDate, setCampStartDate] = useState('2026-10-05');
  const [campEndDate, setCampEndDate] = useState('2026-10-20');
  const [campCategory, setCampCategory] = useState('Semua Kategori');
  const [campDiscountType, setCampDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [campDiscountValue, setCampDiscountValue] = useState(15);
  const [campMinPurchase, setCampMinPurchase] = useState(50000);
  const [campAffiliateBonus, setCampAffiliateBonus] = useState(5);

  // Banners State
  const [banners, setBanners] = useState<BannerItem[]>(INITIAL_BANNERS);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);

  // Banner Form State
  const [banType, setBanType] = useState<'hero' | 'promo-bar' | 'announcement'>('hero');
  const [banTitle, setBanTitle] = useState('');
  const [banDesc, setBanDesc] = useState('');
  const [banCta, setBanCta] = useState('Beli Sekarang');
  const [banUrl, setBanUrl] = useState('/#katalog');
  const [banImageUrl, setBanImageUrl] = useState('/images/default-product-banner.png');
  const [banOrder, setBanOrder] = useState(1);
  const [banSchedule, setBanSchedule] = useState('2026-12-31');

  // Campaign Handlers
  const handleOpenCreateCampaign = () => {
    setEditingCampaign(null);
    setCampName('');
    setCampTagline('');
    setCampStartDate('2026-10-05');
    setCampEndDate('2026-10-20');
    setCampCategory('Semua Kategori');
    setCampDiscountType('percentage');
    setCampDiscountValue(15);
    setCampMinPurchase(50000);
    setCampAffiliateBonus(5);
    setIsCampaignModalOpen(true);
  };

  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName.trim()) return;

    if (editingCampaign) {
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === editingCampaign.id
            ? {
                ...c,
                name: campName,
                tagline: campTagline,
                startDate: campStartDate,
                endDate: campEndDate,
                targetCategory: campCategory,
                discountType: campDiscountType,
                discountValue: campDiscountValue,
                minPurchase: campMinPurchase,
                affiliateBonusPercent: campAffiliateBonus,
              }
            : c
        )
      );
      onNotify?.(`Campaign "${campName}" berhasil diperbarui.`);
    } else {
      const newCamp: CampaignItem = {
        id: `camp-${Date.now()}`,
        name: campName,
        tagline: campTagline,
        startDate: campStartDate,
        endDate: campEndDate,
        targetCategory: campCategory,
        discountType: campDiscountType,
        discountValue: campDiscountValue,
        minPurchase: campMinPurchase,
        affiliateBonusPercent: campAffiliateBonus,
        status: 'running',
        totalOrders: 0,
        revenue: 0,
        conversionRate: 0,
      };
      setCampaigns((prev) => [newCamp, ...prev]);
      onNotify?.(`Campaign promosi "${campName}" berhasil diluncurkan!`);
    }
    setIsCampaignModalOpen(false);
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const next = c.status === 'running' ? 'ended' : 'running';
          onNotify?.(`Status campaign "${c.name}" diubah ke ${next}.`);
          return { ...c, status: next };
        }
        return c;
      })
    );
  };

  // Banner Handlers
  const handleOpenCreateBanner = () => {
    setEditingBanner(null);
    setBanType('hero');
    setBanTitle('');
    setBanDesc('');
    setBanCta('Beli Sekarang');
    setBanUrl('/#katalog');
    setBanImageUrl('/images/default-product-banner.png');
    setBanOrder(banners.length + 1);
    setBanSchedule('2026-12-31');
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!banTitle.trim()) return;

    if (editingBanner) {
      setBanners((prev) =>
        prev.map((b) =>
          b.id === editingBanner.id
            ? {
                ...b,
                type: banType,
                title: banTitle,
                description: banDesc,
                ctaText: banCta,
                destinationUrl: banUrl,
                imageUrl: banImageUrl,
                displayOrder: Number(banOrder),
                scheduledUntil: banSchedule,
              }
            : b
        )
      );
      onNotify?.(`Banner "${banTitle}" berhasil diperbarui.`);
    } else {
      const newBanner: BannerItem = {
        id: `ban-${Date.now()}`,
        type: banType,
        title: banTitle,
        description: banDesc,
        ctaText: banCta,
        destinationUrl: banUrl,
        imageUrl: banImageUrl,
        displayOrder: Number(banOrder),
        status: 'active',
        scheduledUntil: banSchedule,
        clickCount: 0,
      };
      setBanners((prev) => [...prev, newBanner]);
      onNotify?.(`Banner baru "${banTitle}" berhasil dipublikasikan ke etalase!`);
    }
    setIsBannerModalOpen(false);
  };

  const toggleBannerStatus = (id: string) => {
    setBanners((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const next = b.status === 'active' ? 'inactive' : 'active';
          onNotify?.(`Banner "${b.title}" ${next === 'active' ? 'diaktifkan' : 'disembunyikan'}.`);
          return { ...b, status: next };
        }
        return b;
      })
    );
  };

  // =========================================================================
  // 1. CAMPAIGNS TAB
  // =========================================================================
  if (activeTab === 'campaigns') {
    const totalRevenue = campaigns.reduce((acc, c) => acc + c.revenue, 0);
    const totalOrders = campaigns.reduce((acc, c) => acc + c.totalOrders, 0);
    const activeCount = campaigns.filter((c) => c.status === 'running').length;

    const filteredCampaigns = campaigns.filter((c) => {
      if (campaignFilter === 'all') return true;
      return c.status === campaignFilter;
    });

    return (
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
                Marketing Studio
              </span>
              <span className="text-[11px] text-foreground-muted">Promosi & Flash Sale Booster</span>
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Manajemen Campaign Promosi</h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Rancang campaign diskon, target kategori produk, voucher bundling, dan insentif bonus komisi mitra affiliate.
            </p>
          </div>
          <Button size="sm" onClick={handleOpenCreateCampaign} className="text-xs gap-1.5 shadow-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Campaign Baru</span>
          </Button>
        </div>

        {/* Campaign Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
            <span className="text-[11px] text-foreground-muted block mb-1">Campaign Sedang Berjalan</span>
            <div className="text-2xl font-bold text-status-success">{activeCount} Promo</div>
            <span className="text-[10px] text-foreground-muted">Dari {campaigns.length} total program</span>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
            <span className="text-[11px] text-foreground-muted block mb-1">Omzet Dari Campaign</span>
            <div className="text-2xl font-bold text-primary font-mono">Rp {totalRevenue.toLocaleString('id-ID')}</div>
            <span className="text-[10px] text-status-success font-semibold">↑ Kontribusi 48.6% omzet</span>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
            <span className="text-[11px] text-foreground-muted block mb-1">Pesanan Terdorong Promo</span>
            <div className="text-2xl font-bold text-foreground">{totalOrders} Orders</div>
            <span className="text-[10px] text-foreground-muted">Terverifikasi checkout</span>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
            <span className="text-[11px] text-foreground-muted block mb-1">Rata-Rata Rasio Konversi</span>
            <div className="text-2xl font-bold text-foreground font-mono">9.8%</div>
            <span className="text-[10px] text-status-success font-semibold">Tinggi (+3.2% vs standar)</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'running', 'scheduled', 'ended'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setCampaignFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                campaignFilter === tab
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-surface border border-border text-foreground-muted hover:text-foreground hover:bg-surface-raised'
              }`}
            >
              {tab === 'all' ? `Semua (${campaigns.length})` : tab === 'running' ? `Berjalan (${activeCount})` : tab}
            </button>
          ))}
        </div>

        {/* Campaigns Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCampaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-surface border border-border hover:border-primary/40 rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold uppercase tracking-wider ${
                      camp.status === 'running'
                        ? 'bg-status-success/15 text-status-success border-status-success/30'
                        : camp.status === 'scheduled'
                        ? 'bg-primary/15 text-primary border-primary/30'
                        : 'bg-surface-raised text-foreground-muted border-border'
                    }`}
                  >
                    {camp.status === 'running' ? '● Aktif Berjalan' : camp.status === 'scheduled' ? 'Terjadwal' : 'Berakhir'}
                  </Badge>
                  <span className="text-[11px] text-foreground-muted flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3" />
                    <span>{camp.startDate} s.d. {camp.endDate}</span>
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-foreground leading-snug">{camp.name}</h3>
                  <p className="text-xs text-foreground-muted mt-0.5">{camp.tagline}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-xs">
                  <div className="p-2 rounded-lg bg-surface-raised border border-border">
                    <span className="text-[10px] text-foreground-muted block">Rule Diskon</span>
                    <span className="font-bold text-primary">
                      {camp.discountType === 'percentage' ? `${camp.discountValue}% OFF` : `Potongan Rp ${camp.discountValue.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-raised border border-border">
                    <span className="text-[10px] text-foreground-muted block">Target Produk</span>
                    <span className="font-bold text-foreground truncate block">{camp.targetCategory}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-raised border border-border">
                    <span className="text-[10px] text-foreground-muted block">Bonus Sales Affiliate</span>
                    <span className="font-bold text-status-success">+{camp.affiliateBonusPercent}% Komisi</span>
                  </div>
                </div>

                {/* Telemetry Numbers */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/15 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-foreground-muted block">Total Pesanan</span>
                    <span className="font-bold text-foreground font-mono">{camp.totalOrders} Pesanan</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-foreground-muted block">Omzet Diperoleh</span>
                    <span className="font-bold text-primary font-mono">Rp {camp.revenue.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-foreground-muted block">Konversi</span>
                    <span className="font-bold text-status-success font-mono">{camp.conversionRate}%</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleCampaignStatus(camp.id)}
                  className="text-xs h-8 border-border"
                >
                  {camp.status === 'running' ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 mr-1 text-foreground-muted" />
                      <span>Hentikan Promo</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 mr-1 text-status-success" />
                      <span>Jalankan Ulang</span>
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingCampaign(camp);
                    setCampName(camp.name);
                    setCampTagline(camp.tagline);
                    setCampStartDate(camp.startDate);
                    setCampEndDate(camp.endDate);
                    setCampCategory(camp.targetCategory);
                    setCampDiscountType(camp.discountType);
                    setCampDiscountValue(camp.discountValue);
                    setCampMinPurchase(camp.minPurchase);
                    setCampAffiliateBonus(camp.affiliateBonusPercent);
                    setIsCampaignModalOpen(true);
                  }}
                  className="text-xs h-8 text-primary"
                >
                  <Edit className="w-3.5 h-3.5 mr-1" />
                  <span>Edit Aturan</span>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Create/Edit Campaign */}
        {isCampaignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in">
            <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="border-b border-border pb-3">
                <h3 className="font-bold text-base text-foreground">
                  {editingCampaign ? 'Pengaturan Campaign Promosi' : 'Buat Campaign Promosi Baru'}
                </h3>
                <p className="text-xs text-foreground-muted">
                  Tentukan periode aktif, aturan diskon konsumen, dan bonus insentif affiliate.
                </p>
              </div>

              <form onSubmit={handleSaveCampaign} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Nama Campaign Promo</label>
                  <Input
                    required
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                    placeholder="Contoh: Flash Sale 11.11 Super Deals"
                    className="bg-surface-raised border-border text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Deskripsi / Sub-Copy</label>
                  <Input
                    value={campTagline}
                    onChange={(e) => setCampTagline(e.target.value)}
                    placeholder="Contoh: Diskon 20% untuk semua akun AI & Streaming"
                    className="bg-surface-raised border-border text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-foreground block mb-1">Tanggal Mulai</label>
                    <Input
                      type="date"
                      required
                      value={campStartDate}
                      onChange={(e) => setCampStartDate(e.target.value)}
                      className="bg-surface-raised border-border text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-foreground block mb-1">Tanggal Selesai</label>
                    <Input
                      type="date"
                      required
                      value={campEndDate}
                      onChange={(e) => setCampEndDate(e.target.value)}
                      className="bg-surface-raised border-border text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-foreground block mb-1">Tipe Diskon</label>
                    <select
                      value={campDiscountType}
                      onChange={(e) => setCampDiscountType(e.target.value as any)}
                      className="w-full h-9 rounded-md border border-border bg-surface-raised px-3 text-xs text-foreground"
                    >
                      <option value="percentage">Persentase (% Diskon)</option>
                      <option value="fixed">Nominal Tetap (Rp Potongan)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-foreground block mb-1">
                      Nilai Diskon ({campDiscountType === 'percentage' ? '%' : 'Rp'})
                    </label>
                    <Input
                      type="number"
                      required
                      min="1"
                      value={campDiscountValue}
                      onChange={(e) => setCampDiscountValue(Number(e.target.value))}
                      className="bg-surface-raised border-border text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-foreground block mb-1">Target Kategori Produk</label>
                    <select
                      value={campCategory}
                      onChange={(e) => setCampCategory(e.target.value)}
                      className="w-full h-9 rounded-md border border-border bg-surface-raised px-3 text-xs text-foreground"
                    >
                      <option value="Semua Kategori">Semua Kategori</option>
                      <option value="AI Tools">AI Tools & Productivity</option>
                      <option value="Streaming">Streaming & Hiburan</option>
                      <option value="Desain & Grafis">Desain & Grafis</option>
                      <option value="Cloud & Penyimpanan">Cloud & Penyimpanan</option>
                      <option value="VPN & Keamanan">VPN & Keamanan</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-foreground block mb-1">Bonus Komisi Affiliate (%)</label>
                    <Input
                      type="number"
                      min="0"
                      max="30"
                      value={campAffiliateBonus}
                      onChange={(e) => setCampAffiliateBonus(Number(e.target.value))}
                      className="bg-surface-raised border-border text-xs font-mono text-status-success font-bold"
                      placeholder="Contoh: 5"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCampaignModalOpen(false)} className="text-xs">
                    Batal
                  </Button>
                  <Button type="submit" className="text-xs">
                    {editingCampaign ? 'Simpan Perubahan' : 'Luncurkan Campaign'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. BANNERS & STOREFRONT CMS TAB
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
              Storefront CMS
            </span>
            <span className="text-[11px] text-foreground-muted">Visual Content & Hero Studio</span>
          </div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Banner Hero & Konten Etalase</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Kelola hero banner, promotional announcement bar, featured spotlight, dan urutan tampilan tanpa perlu menyentuh kode.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Device Simulator Toggle */}
          <div className="flex items-center bg-surface-raised border border-border rounded-lg p-1 text-xs">
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`p-1.5 rounded flex items-center gap-1 transition-colors ${
                previewDevice === 'desktop' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-foreground-muted hover:text-foreground'
              }`}
              title="Pratinjau Layar Desktop"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`p-1.5 rounded flex items-center gap-1 transition-colors ${
                previewDevice === 'mobile' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-foreground-muted hover:text-foreground'
              }`}
              title="Pratinjau Layar Mobile Smartphone"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          <Button size="sm" onClick={handleOpenCreateBanner} className="text-xs gap-1.5 shadow-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Banner</span>
          </Button>
        </div>
      </div>

      {/* Live Storefront Preview Box */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Live Interactive Preview (Mode {previewDevice === 'desktop' ? 'Desktop 1920px' : 'Mobile 390px'})</span>
          </span>
          <span className="text-[11px] text-foreground-muted">Sesuai tampilan pengunjung saat ini</span>
        </div>

        {/* Viewport Simulation Box */}
        <div className={`mx-auto transition-all duration-300 ${previewDevice === 'mobile' ? 'max-w-sm border-2 border-border/80 rounded-3xl p-3 bg-ink shadow-2xl' : 'w-full'}`}>
          {/* Announcement Bar Top */}
          {banners.filter((b) => b.type === 'announcement' && b.status === 'active').map((ann) => (
            <div key={ann.id} className="mb-3 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-between text-[11px] text-primary">
              <span className="truncate font-medium">{ann.title}</span>
              <a href={ann.destinationUrl} className="text-primary hover:underline font-semibold ml-2 shrink-0 flex items-center gap-0.5">
                {ann.ctaText} →
              </a>
            </div>
          ))}

          {/* Hero Banner Showcase */}
          <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-gradient-to-r from-zinc-950 via-zinc-900 to-indigo-950/80 p-6 sm:p-8 text-foreground shadow-lg">
            <div className="relative z-10 max-w-xl space-y-3">
              <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider text-primary border-primary/40 bg-primary/10">
                Official Asterra Store
              </Badge>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
                {banners.find((b) => b.type === 'hero' && b.status === 'active')?.title || 'Akses Akun Premium Bergaransi'}
              </h1>
              <p className="text-xs text-zinc-300 line-clamp-2">
                {banners.find((b) => b.type === 'hero' && b.status === 'active')?.description ||
                  'Layanan akun digital Canva, Netflix, Gemini AI terpercaya nomor 1.'}
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Button size="sm" className="text-xs font-semibold shadow-md">
                  {banners.find((b) => b.type === 'hero' && b.status === 'active')?.ctaText || 'Beli Sekarang'}
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
                <span className="text-[11px] text-zinc-400">Garansi ganti akun 100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner List Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border bg-surface-raised flex items-center justify-between">
          <h3 className="font-semibold text-xs text-foreground">Daftar Banner & Section Storefront ({banners.length})</h3>
          <span className="text-[11px] text-foreground-muted">Urutan tampilan menentukan posisi banner di beranda</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised/50 border-b border-border text-foreground-muted text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Urutan</th>
                <th className="py-3 px-4">Tipe Slot</th>
                <th className="py-3 px-4">Judul & Salinan</th>
                <th className="py-3 px-4">Target Tombol (CTA)</th>
                <th className="py-3 px-4 text-center">Interaksi (Klik)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {banners.map((ban) => (
                <tr key={ban.id} className="hover:bg-surface-raised/40 transition-colors">
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                    #{ban.displayOrder}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="outline" className="text-[10px] font-mono capitalize border-border">
                      {ban.type === 'hero' ? 'Hero Main' : ban.type === 'promo-bar' ? 'Promo Bar' : 'Ticker'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-foreground">{ban.title}</div>
                    <div className="text-[11px] text-foreground-muted line-clamp-1">{ban.description}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-primary block">{ban.ctaText}</span>
                    <span className="text-[10px] font-mono text-foreground-muted">{ban.destinationUrl}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                    {ban.clickCount.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => toggleBannerStatus(ban.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
                        ban.status === 'active'
                          ? 'bg-status-success/15 text-status-success border-status-success/30 hover:bg-status-success/25'
                          : 'bg-surface-raised text-foreground-muted border-border hover:bg-surface'
                      }`}
                    >
                      {ban.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingBanner(ban);
                        setBanType(ban.type);
                        setBanTitle(ban.title);
                        setBanDesc(ban.description);
                        setBanCta(ban.ctaText);
                        setBanUrl(ban.destinationUrl);
                        setBanImageUrl(ban.imageUrl);
                        setBanOrder(ban.displayOrder);
                        setBanSchedule(ban.scheduledUntil || '2026-12-31');
                        setIsBannerModalOpen(true);
                      }}
                      className="h-8 px-2 text-xs text-primary"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setBanners((prev) => prev.filter((b) => b.id !== ban.id));
                        onNotify?.(`Banner "${ban.title}" berhasil dihapus.`);
                      }}
                      className="h-8 px-2 text-xs text-status-error hover:bg-status-error/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create/Edit Banner */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">
                {editingBanner ? 'Edit Banner Etalase' : 'Tambah Banner Etalase Baru'}
              </h3>
              <p className="text-xs text-foreground-muted">
                Atur visual, judul, call to action, dan destinasi tombol bagi pembeli.
              </p>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Tipe Penempatan</label>
                  <select
                    value={banType}
                    onChange={(e) => setBanType(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-border bg-surface-raised px-3 text-xs text-foreground"
                  >
                    <option value="hero">Hero Main Banner</option>
                    <option value="promo-bar">Promotional Banner Bar</option>
                    <option value="announcement">Announcement Ticker Bar</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-foreground block mb-1">Urutan Prioritas Tampil</label>
                  <Input
                    type="number"
                    min="1"
                    value={banOrder}
                    onChange={(e) => setBanOrder(Number(e.target.value))}
                    className="bg-surface-raised border-border text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Judul Utama Banner</label>
                <Input
                  required
                  value={banTitle}
                  onChange={(e) => setBanTitle(e.target.value)}
                  placeholder="Contoh: Canva Pro 1 Bulan Private Resmi"
                  className="bg-surface-raised border-border text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Deskripsi Pendukung</label>
                <Input
                  value={banDesc}
                  onChange={(e) => setBanDesc(e.target.value)}
                  placeholder="Contoh: Fitur AI Magic Studio lengkap dengan garansi ganti akun."
                  className="bg-surface-raised border-border text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Teks Tombol (CTA)</label>
                  <Input
                    value={banCta}
                    onChange={(e) => setBanCta(e.target.value)}
                    placeholder="Beli Sekarang / Eksplor"
                    className="bg-surface-raised border-border text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground block mb-1">URL Tujuan</label>
                  <Input
                    value={banUrl}
                    onChange={(e) => setBanUrl(e.target.value)}
                    placeholder="/#katalog atau /product/canva-pro"
                    className="bg-surface-raised border-border text-xs font-mono"
                  />
                </div>
              </div>

              {/* Banner Image URL / Dropzone */}
              <div>
                <label className="font-semibold text-foreground block mb-1">Gambar Banner / Visual Asset</label>
                <Input
                  value={banImageUrl}
                  onChange={(e) => setBanImageUrl(e.target.value)}
                  placeholder="/images/default-product-banner.png atau link CDN"
                  className="bg-surface-raised border-border text-xs font-mono"
                />
                <span className="text-[11px] text-foreground-muted mt-1 block">
                  Format gambar terverifikasi Vercel Blob deduplikasi otomatis.
                </span>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Jadwal Tayang Sampai</label>
                <Input
                  type="date"
                  value={banSchedule}
                  onChange={(e) => setBanSchedule(e.target.value)}
                  className="bg-surface-raised border-border text-xs"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsBannerModalOpen(false)} className="text-xs">
                  Batal
                </Button>
                <Button type="submit" className="text-xs">
                  {editingBanner ? 'Simpan Perubahan' : 'Publikasikan Banner'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
