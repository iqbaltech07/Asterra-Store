'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  Check,
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
  type?: 'hero' | 'promo-bar' | 'announcement';
  bannerType?: string;
  title: string;
  description?: string;
  ctaText?: string;
  destinationUrl?: string;
  linkUrl?: string;
  imageUrl: string;
  blobUrl?: string;
  pathname?: string;
  displayOrder: number;
  status?: 'active' | 'inactive';
  isActive?: boolean;
  scheduledUntil?: string;
  expiresAt?: string;
  clickCount?: number;
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
    id: 'ban-affiliate',
    type: 'hero',
    bannerType: 'hero',
    title: 'Program Mitra Affiliate Asterra Store',
    description: 'Rekomendasikan produk lisensi digital resmi, raih komisi 10% per transaksi langsung ke rekening.',
    ctaText: 'Daftar Affiliate',
    destinationUrl: '/daftar-sales',
    linkUrl: '/daftar-sales',
    imageUrl: '/images/banners/hero-banner-affiliate.webp',
    displayOrder: 1,
    status: 'active',
    isActive: true,
    scheduledUntil: '2027-12-31',
    clickCount: 1420,
  },
  {
    id: 'ban-welcome',
    type: 'hero',
    bannerType: 'hero',
    title: 'Selamat Datang di Asterra Store — Akses Akun & Lisensi Premium',
    description: 'Beli akun Canva Pro, Gemini AI, Netflix, dan Spotify dengan proses instan 1 menit.',
    ctaText: 'Eksplor Katalog',
    destinationUrl: '/#katalog',
    linkUrl: '/#katalog',
    imageUrl: '/images/banners/hero-banner-welcome.webp',
    displayOrder: 2,
    status: 'active',
    isActive: true,
    scheduledUntil: '2027-12-31',
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
    isActive: true,
    scheduledUntil: '2027-12-31',
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
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [isLoadingBanners, setIsLoadingBanners] = useState(true);
  const [isSavingBanner, setIsSavingBanner] = useState(false);
  const [stagedBannerFile, setStagedBannerFile] = useState<File | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [isPreviewPaused, setIsPreviewPaused] = useState(false);
  const [isSpecGuideOpen, setIsSpecGuideOpen] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);

  // Banner Form State
  const [banType, setBanType] = useState<'hero' | 'promo-bar' | 'announcement'>('hero');
  const [banTitle, setBanTitle] = useState('');
  const [banDesc, setBanDesc] = useState('');
  const [banCta, setBanCta] = useState('Beli Sekarang');
  const [banUrl, setBanUrl] = useState('/#katalog');
  const [banImageUrl, setBanImageUrl] = useState('/images/banners/hero-banner-welcome.webp');
  const [banOrder, setBanOrder] = useState(1);
  const [banSchedule, setBanSchedule] = useState('');
  const [banIsActive, setBanIsActive] = useState(true);

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

  // Banner API Handlers
  const loadBannersFromApi = useCallback(async () => {
    setIsLoadingBanners(true);
    try {
      const res = await fetch('/api/v1/banners?activeOnly=false');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setBanners(json.data);
          return;
        }
      }
      // Fallback to initial banners if API is empty
      setBanners(INITIAL_BANNERS);
    } catch (err) {
      console.error('Failed to load banners from API:', err);
      setBanners(INITIAL_BANNERS);
    } finally {
      setIsLoadingBanners(false);
    }
  }, []);

  useEffect(() => {
    loadBannersFromApi();
  }, [loadBannersFromApi]);

  const isBannerExpired = (ban: BannerItem): boolean => {
    const exp = ban.expiresAt || ban.scheduledUntil;
    if (!exp) return false;
    try {
      const expTime = new Date(exp).getTime();
      return !isNaN(expTime) && expTime < Date.now();
    } catch {
      return false;
    }
  };

  const handleOpenCreateBanner = () => {
    setEditingBanner(null);
    setStagedBannerFile(null);
    setBanType('hero');
    setBanTitle('');
    setBanDesc('');
    setBanCta('Beli Sekarang');
    setBanUrl('/#katalog');
    setBanImageUrl('/images/default-product-banner.png');
    setBanOrder(banners.length + 1);
    setBanSchedule('');
    setBanIsActive(true);
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banTitle.trim()) return;

    setIsSavingBanner(true);
    try {
      const formData = new FormData();
      formData.append('title', banTitle.trim());
      formData.append('description', banDesc.trim());
      formData.append('ctaText', banCta.trim());
      formData.append('bannerType', banType);
      formData.append('destinationUrl', banUrl.trim() || '/#katalog');
      formData.append('linkUrl', banUrl.trim() || '/#katalog');
      formData.append('displayOrder', String(banOrder || 0));
      formData.append('targetPage', 'home');
      formData.append('isActive', String(banIsActive));
      if (banSchedule) {
        formData.append('expiresAt', banSchedule);
        formData.append('scheduledUntil', banSchedule);
      }

      if (stagedBannerFile) {
        formData.append('file', stagedBannerFile);
      } else {
        // Use existing image URL by converting to Blob or passing file
        let blob: Blob | null = null;
        try {
          const fetchImg = await fetch(banImageUrl);
          blob = await fetchImg.blob();
        } catch {
          blob = null;
        }

        if (blob) {
          formData.append('file', blob, 'banner.webp');
        } else {
          // Fallback minimal 1x1 transparent png blob
          const byteCharacters = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const fallbackBlob = new Blob([byteArray], { type: 'image/png' });
          formData.append('file', fallbackBlob, 'banner.webp');
        }
      }

      const res = await fetch('/api/v1/banners', {
        method: 'POST',
        body: formData,
      });

      const resJson = await res.json();
      if (resJson.success) {
        onNotify?.(resJson.message || `Banner "${banTitle}" berhasil dipublikasikan!`);
        await loadBannersFromApi();
        setIsBannerModalOpen(false);
      } else {
        onNotify?.(resJson.detail || 'Gagal menyimpan banner.');
      }
    } catch (err) {
      console.error('Error saving banner:', err);
      onNotify?.('Terjadi kesalahan saat menyimpan banner.');
    } finally {
      setIsSavingBanner(false);
    }
  };

  const toggleBannerStatus = async (id: string) => {
    const target = banners.find((b) => b.id === id);
    if (!target) return;

    const currentActive = target.isActive ?? (target.status === 'active');
    const nextActive = !currentActive;

    // Optimistic UI update
    setBanners((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              isActive: nextActive,
              status: nextActive ? 'active' : 'inactive',
            }
          : b
      )
    );

    try {
      const res = await fetch(`/api/v1/banners/${id}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const json = await res.json();
      if (json.success) {
        onNotify?.(`Banner "${target.title}" ${nextActive ? 'diaktifkan' : 'dinonaktifkan'}.`);
      } else {
        loadBannersFromApi();
      }
    } catch (err) {
      console.error('Error toggling banner status:', err);
      loadBannersFromApi();
    }
  };

  const handleDeleteBanner = async (id: string, title: string) => {
    if (!confirm(`Hapus banner "${title}" dari etalase? File blob juga akan dibersihkan jika tidak digunakan lagi.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/banners/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        onNotify?.(`Banner "${title}" berhasil dihapus dari sistem & storage.`);
        setBanners((prev) => prev.filter((b) => b.id !== id));
      } else {
        onNotify?.(json.detail || 'Gagal menghapus banner.');
      }
    } catch (err) {
      console.error('Error deleting banner:', err);
      onNotify?.('Gagal menghapus banner.');
    }
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
  // Active Hero Banners & Live Interactive Preview Calculations
  const activeHeroBanners = banners.filter(
    (b) => (b.type === 'hero' || b.bannerType === 'hero') && (b.status === 'active' || b.isActive)
  );
  const fallbackWelcomeBanner: BannerItem = {
    id: 'default-welcome',
    title: 'Selamat Datang di Asterra Store — Akses Akun & Lisensi Premium Resmi',
    description: 'Layanan akun digital Canva, Netflix, Gemini AI terpercaya nomor 1.',
    ctaText: 'Eksplor Katalog',
    destinationUrl: '/#katalog',
    linkUrl: '/#katalog',
    imageUrl: '/images/banners/hero-banner-welcome.webp',
    displayOrder: 1,
    status: 'active',
    type: 'hero',
    bannerType: 'hero',
    isActive: true,
  };
  const displayHeroBanners = activeHeroBanners.length > 0 ? activeHeroBanners : [fallbackWelcomeBanner];

  // Auto-rotate live preview every 5 seconds if multiple banners exist
  useEffect(() => {
    if (displayHeroBanners.length <= 1 || isPreviewPaused) return;
    const timer = setInterval(() => {
      setPreviewSlideIndex((prev) => (prev + 1) % displayHeroBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayHeroBanners.length, isPreviewPaused]);

  const currentPreviewBanner =
    displayHeroBanners[previewSlideIndex % displayHeroBanners.length] || displayHeroBanners[0];

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
        <div className="flex items-center gap-2 flex-wrap">
          {/* Device Simulator Toggle */}
          <div className="flex items-center bg-surface-raised border border-border rounded-lg p-1 text-xs">
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`p-1.5 rounded flex items-center gap-1 transition-colors ${
                previewDevice === 'desktop' ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'text-foreground-muted hover:text-foreground'
              }`}
              title="Pratinjau Layar Desktop 1920px"
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
              title="Pratinjau Layar Mobile Smartphone 390px"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          {/* Aturan & Panduan Ukuran Banner Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsSpecGuideOpen(true)}
            className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5 shadow-xs"
            title="Buka panduan standar ukuran banner rasio 3:1"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Aturan Ukuran 3:1</span>
          </Button>

          <Button size="sm" onClick={handleOpenCreateBanner} className="text-xs gap-1.5 shadow-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Banner</span>
          </Button>
        </div>
      </div>

      {/* Live Storefront Preview Box */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Live Interactive Preview (Mode {previewDevice === 'desktop' ? 'Desktop 1920px' : 'Mobile 390px'})</span>
            </span>
            <Badge variant="outline" className="text-[10px] font-mono border-border bg-surface-raised">
              Slide {displayHeroBanners.length > 0 ? `${(previewSlideIndex % displayHeroBanners.length) + 1} dari ${displayHeroBanners.length}` : '1'}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-foreground-muted">
            <span className="hidden sm:inline">Berganti tiap 5 detik jika ada &gt; 1 banner</span>
            <button
              type="button"
              onClick={() => setIsSpecGuideOpen(true)}
              className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Info className="w-3 h-3" />
              Lihat Spesifikasi
            </button>
          </div>
        </div>

        {/* Viewport Simulation Box */}
        <div className={`mx-auto transition-all duration-300 ${previewDevice === 'mobile' ? 'max-w-[390px] border-4 border-zinc-800 rounded-[2.5rem] p-3.5 bg-zinc-950 shadow-2xl space-y-3' : 'w-full'}`}>
          {/* Smartphone Simulator Top Island Notch */}
          {previewDevice === 'mobile' && (
            <div className="flex items-center justify-between px-2 pt-1 pb-1 text-[10px] text-zinc-400 font-mono select-none">
              <span>09:41</span>
              <div className="w-20 h-3.5 bg-zinc-800 rounded-full mx-auto flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-zinc-900 mr-2" />
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>5G</span>
              </div>
            </div>
          )}

          {/* Announcement Bar Top */}
          {banners.filter((b) => b.type === 'announcement' && (b.status === 'active' || b.isActive)).map((ann) => (
            <div key={ann.id} className="mb-2 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-between text-[11px] text-primary">
              <span className="truncate font-medium">{ann.title}</span>
              <a href={ann.destinationUrl || ann.linkUrl} className="text-primary hover:underline font-semibold ml-2 shrink-0 flex items-center gap-0.5">
                {ann.ctaText || 'Lihat'} →
              </a>
            </div>
          ))}

          {/* Real Banner Showcase Swiper */}
          <div
            className="group relative w-full overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-border/80 shadow-md bg-[#121A2A] aspect-[2640/882] select-none"
            onMouseEnter={() => setIsPreviewPaused(true)}
            onMouseLeave={() => setIsPreviewPaused(false)}
          >
            {/* Graphic Image Banner */}
            <div className="relative w-full h-full overflow-hidden">
              <img
                src={currentPreviewBanner.imageUrl || '/images/banners/hero-banner-welcome.webp'}
                alt={currentPreviewBanner.title}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.004]"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/banners/hero-banner-welcome.webp';
                }}
              />

              {/* Swiper Arrows (visible if multiple banners) */}
              {displayHeroBanners.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewSlideIndex((prev) => (prev - 1 + displayHeroBanners.length) % displayHeroBanners.length);
                    }}
                    aria-label="Banner Sebelumnya"
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer z-20 shadow-md"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewSlideIndex((prev) => (prev + 1) % displayHeroBanners.length);
                    }}
                    aria-label="Banner Selanjutnya"
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer z-20 shadow-md"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Dot Indicators */}
              {displayHeroBanners.length > 1 && (
                <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md">
                  {displayHeroBanners.map((b, idx) => (
                    <button
                      key={b.id || idx}
                      type="button"
                      onClick={() => setPreviewSlideIndex(idx)}
                      className={`transition-all duration-200 rounded-full cursor-pointer ${
                        idx === previewSlideIndex % displayHeroBanners.length
                          ? 'w-4 h-1.5 bg-[#E85D3F]'
                          : 'w-1.5 h-1.5 bg-white/60 hover:bg-white'
                      }`}
                      title={`Ke Banner ${idx + 1}: ${b.title}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Smartphone Simulator Bottom Bar */}
          {previewDevice === 'mobile' && (
            <div className="pt-2 pb-0.5 flex justify-center">
              <div className="w-24 h-1 bg-zinc-700 rounded-full" />
            </div>
          )}
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
              {isLoadingBanners ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-foreground-muted">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                    <span>Memuat data banner etalase...</span>
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-foreground-muted">
                    <span>Belum ada banner etalase. Klik "Tambah Banner" untuk mengunggah.</span>
                  </td>
                </tr>
              ) : (
                banners.map((ban) => {
                  const isExpired = isBannerExpired(ban);
                  const isActive = !isExpired && (ban.isActive ?? (ban.status === 'active'));
                  const slotType = ban.type || ban.bannerType || 'hero';

                  return (
                    <tr key={ban.id} className="hover:bg-surface-raised/40 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                        #{ban.displayOrder || 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="text-[10px] font-mono capitalize border-border">
                          {slotType === 'hero' ? 'Hero Main' : slotType === 'promo-bar' ? 'Promo Bar' : 'Ticker'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {ban.imageUrl && (
                            <img
                              src={ban.imageUrl}
                              alt={ban.title}
                              className="w-10 h-6 object-cover rounded border border-border shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground truncate">{ban.title}</div>
                            <div className="text-[11px] text-foreground-muted line-clamp-1">{ban.description || '-'}</div>
                            {(ban.expiresAt || ban.scheduledUntil) && (
                              <div className="text-[10px] text-foreground-muted flex items-center gap-1 mt-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                <span>Exp: {ban.scheduledUntil || ban.expiresAt?.slice(0, 10)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-primary block">{ban.ctaText || 'Beli Sekarang'}</span>
                        <span className="text-[10px] font-mono text-foreground-muted">{ban.destinationUrl || ban.linkUrl || '/#katalog'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                        {(ban.clickCount || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isExpired ? (
                          <span
                            title="Banner telah melewati masa berlaku tayang dan otomatis dinonaktifkan."
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-status-error/15 text-status-error border border-status-error/30"
                          >
                            <Clock className="w-3 h-3" />
                            <span>Kadaluarsa</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleBannerStatus(ban.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-status-success/15 text-status-success border-status-success/30 hover:bg-status-success/25'
                                : 'bg-surface-raised text-foreground-muted border-border hover:bg-surface'
                            }`}
                          >
                            {isActive ? 'Aktif' : 'Nonaktif'}
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingBanner(ban);
                            setStagedBannerFile(null);
                            setBanType((ban.type || ban.bannerType || 'hero') as any);
                            setBanTitle(ban.title);
                            setBanDesc(ban.description || '');
                            setBanCta(ban.ctaText || 'Beli Sekarang');
                            setBanUrl(ban.destinationUrl || ban.linkUrl || '/#katalog');
                            setBanImageUrl(ban.imageUrl);
                            setBanOrder(ban.displayOrder || 1);
                            setBanSchedule(ban.scheduledUntil || ban.expiresAt?.slice(0, 10) || '');
                            setBanIsActive(ban.isActive ?? (ban.status === 'active'));
                            setIsBannerModalOpen(true);
                          }}
                          className="h-8 px-2 text-xs text-primary"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteBanner(ban.id, ban.title)}
                          className="h-8 px-2 text-xs text-status-error hover:bg-status-error/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
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

              {/* Visual Banner Upload Dropzone */}
              {/* Visual Banner Upload Dropzone with Specification Hint */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground block">Visual Banner (Gambar)</label>
                  <button
                    type="button"
                    onClick={() => setIsSpecGuideOpen(true)}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Info className="w-3 h-3" />
                    Standar Rasio 3:1
                  </button>
                </div>

                <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs flex items-start gap-2.5 text-foreground">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed text-foreground-muted">
                    <span className="font-semibold text-foreground">Standar Banner:</span> Resolusi master{' '}
                    <strong className="text-primary font-mono font-bold">2640 x 882 px</strong> (Rasio 3:1). Pastikan teks & maskot berada di{' '}
                    <strong className="text-foreground">Safe Zone tengah 80%</strong> agar tidak terpotong di layar HP. Format WebP/PNG maks. 5MB.
                  </div>
                </div>

                <ImageUploadDropzone
                  value={banImageUrl}
                  onChange={(url) => setBanImageUrl(url)}
                  onFileStaged={(file) => setStagedBannerFile(file)}
                  folder="banners"
                  label="Pilih atau Tarik File Banner"
                  description="Format JPG, PNG, WEBP, atau AVIF (Maks. 5MB). Otomatis dideduplikasi ke Vercel Blob."
                  mode="lazy"
                  isSpecialPromo={true}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Jadwal Kadaluarsa (Opsional)</label>
                  <Input
                    type="date"
                    value={banSchedule}
                    onChange={(e) => setBanSchedule(e.target.value)}
                    className="bg-surface-raised border-border text-xs"
                  />
                  <span className="text-[10px] text-foreground-muted mt-0.5 block">
                    Otomatis non-aktif setelah tanggal ini tiba.
                  </span>
                </div>
                <div className="pt-2">
                  <label className="font-semibold text-foreground block mb-1">Status Publikasi</label>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={banIsActive}
                      onChange={(e) => setBanIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-primary border-border focus:ring-primary"
                    />
                    <span className="text-xs text-foreground font-medium">Aktifkan di etalase</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBannerModalOpen(false)}
                  disabled={isSavingBanner}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSavingBanner} className="text-xs gap-1.5">
                  {isSavingBanner && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSavingBanner ? 'Menyimpan...' : editingBanner ? 'Simpan Perubahan' : 'Publikasikan Banner'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Panduan & Aturan Ukuran Banner (3:1) */}
      {isSpecGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
                    Official Design Guidelines
                  </span>
                  <span className="text-[11px] text-foreground-muted">Asterra Store Hero Standards</span>
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-foreground tracking-tight">
                  Aturan & Standar Ukuran Banner Etalase (Rasio 3:1)
                </h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Ikuti panduan berikut agar seluruh banner promosi tampil pas, tajam, dan tidak terpotong pada layar desktop maupun smartphone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSpecGuideOpen(false)}
                className="p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-raised cursor-pointer"
                title="Tutup Panduan"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Spec Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              {/* Card 1: Rasio Canvas */}
              <div className="bg-surface-raised border border-border/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center text-xs">1</div>
                  <span>Rasio Aspek Baku (3 : 1)</span>
                </div>
                <p className="text-[11px] text-foreground-muted leading-relaxed">
                  Kanvas resmi menggunakan rasio widescreen <strong className="text-foreground">3:1</strong> (Lebar 3 x Tinggi 1).
                </p>
                <div className="p-2.5 rounded-lg bg-surface border border-border space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Rekomendasi Utama:</span>
                    <strong className="text-primary font-bold">2640 x 882 px</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Resolusi Minimum:</span>
                    <span className="text-foreground">1920 x 640 px</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Safe Zone */}
              <div className="bg-surface-raised border border-border/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center text-xs">2</div>
                  <span>Safe Zone 80% (Mobile Safety)</span>
                </div>
                <p className="text-[11px] text-foreground-muted leading-relaxed">
                  Pastikan elemen krusial (headline, tombol CTA, maskot) berada di <strong className="text-foreground">80% area tengah kanvas</strong>.
                </p>
                <div className="p-2.5 rounded-lg bg-surface border border-border space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Margin Kiri & Kanan:</span>
                    <strong className="text-foreground font-mono">Min. 10% (bebas teks)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Tampilan HP (390px):</span>
                    <span className="text-status-success font-semibold">Bebas dari cut-off</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Format & Ukuran File */}
              <div className="bg-surface-raised border border-border/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center text-xs">3</div>
                  <span>Format File & Kompresi</span>
                </div>
                <p className="text-[11px] text-foreground-muted leading-relaxed">
                  Unggah file berformat modern untuk kecepatan muat kilat dan gambar anti-buram.
                </p>
                <div className="p-2.5 rounded-lg bg-surface border border-border space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Format Terbaik:</span>
                    <strong className="text-primary font-bold">.WEBP / .PNG</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Maks. Ukuran File:</span>
                    <span className="text-foreground font-mono">5 MB (Optimal &lt; 500KB)</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Brand & Maskot Asterra */}
              <div className="bg-surface-raised border border-border/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center text-xs">4</div>
                  <span>Warna Brand & Maskot Asterra</span>
                </div>
                <p className="text-[11px] text-foreground-muted leading-relaxed">
                  Desain bersih, tegas, <strong className="text-foreground">no AI-slop</strong> atau elemen ungu acak.
                </p>
                <div className="p-2.5 rounded-lg bg-surface border border-border flex items-center gap-2 text-[10px] font-mono">
                  <div className="flex items-center gap-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#121A2A] border border-white/20 inline-block" />
                    <span>#121A2A</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#E85D3F] inline-block" />
                    <span>#E85D3F</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#F8F6F1] border border-border inline-block" />
                    <span>#F8F6F1</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Canvas Diagram */}
            <div className="p-4 rounded-xl border border-border bg-[#121A2A] text-white space-y-2 text-center select-none">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#E85D3F] font-bold">
                Diagram Proporsi Banner Widescreen 3:1 (2640 x 882 px)
              </div>
              <div className="border border-dashed border-[#E85D3F]/50 rounded-lg p-5 bg-black/30 flex items-center justify-between text-xs">
                <div className="text-[10px] text-zinc-400 font-mono px-2 py-1 rounded bg-black/40">Margin 10%</div>
                <div className="space-y-1">
                  <div className="text-xs sm:text-sm font-extrabold text-white">★ SAFE ZONE 80% TENGAH ★</div>
                  <div className="text-[10px] sm:text-[11px] text-zinc-300">Tempatkan Maskot, Headline Promo, & Tombol CTA di Sini</div>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono px-2 py-1 rounded bg-black/40">Margin 10%</div>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <Button size="sm" onClick={() => setIsSpecGuideOpen(false)} className="text-xs">
                Mengerti & Tutup Panduan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
