'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Flame,
  Star,
  Clock,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  Layers,
  Sparkles,
  Search,
  X,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type SectionKey = 'promo' | 'terlaris' | 'terbaru';

interface SectionConfig {
  sectionKey: SectionKey;
  mode: 'auto' | 'manual';
  manualProductIds: string[];
  updatedBy?: string;
  updatedAt?: string;
}

interface HomepageProductItem {
  id: string;
  name: string;
  price: number;
  priceFormatted?: string;
  category?: { id: string; name: string };
  categoryName?: string;
  soldCount?: number;
  isPromo?: boolean;
  status?: string;
  stock?: number;
  imageUrl?: string;
  createdAt?: string;
}

interface SectionsResponse {
  success: boolean;
  sections: {
    promo: {
      sectionKey: 'promo';
      mode: 'auto' | 'manual';
      manualProductIds: string[];
      totalAvailable: number;
      count: number;
      data: HomepageProductItem[];
      limit: number;
      updatedAt?: string;
      updatedBy?: string;
    };
    terlaris: {
      sectionKey: 'terlaris';
      mode: 'auto' | 'manual';
      manualProductIds: string[];
      totalAvailable: number;
      count: number;
      data: HomepageProductItem[];
      limit: number;
      updatedAt?: string;
      updatedBy?: string;
    };
    terbaru: {
      sectionKey: 'terbaru';
      mode: 'auto' | 'manual';
      manualProductIds: string[];
      totalAvailable: number;
      count: number;
      data: HomepageProductItem[];
      limit: number;
      updatedAt?: string;
      updatedBy?: string;
    };
  };
  timestamp: string;
}

interface AdminProductItem {
  id: string;
  name: string;
  price: number;
  priceFormatted: string;
  categoryName: string;
  status: string;
  stock: number;
  imageUrl?: string;
}

export function AdminHomepageOrdering({ onNotify }: { onNotify?: (msg: string) => void }) {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<SectionKey>('promo');
  const [isAddPickerOpen, setIsAddPickerOpen] = useState(false);
  const [searchPickerQuery, setSearchPickerQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Fetch live sections and computed preview
  const { data: sectionsData, isLoading: isLoadingSections } = useQuery<SectionsResponse>({
    queryKey: ['homepage-sections'],
    queryFn: async () => {
      const res = await fetch('/api/v1/homepage/sections?limit=8');
      if (!res.ok) throw new Error('Gagal memuat urutan homepage.');
      return res.json();
    },
    staleTime: 10 * 1000,
  });

  // 2. Fetch full catalog products for the manual picker
  const { data: catalogData } = useQuery<{ success: boolean; data: AdminProductItem[] }>({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/products');
      if (!res.ok) throw new Error('Gagal memuat produk katalog.');
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  const activeCatalog = useMemo(() => {
    return (catalogData?.data || []).filter((p) => p.status === 'active');
  }, [catalogData]);

  // Current section data from server
  const currentSectionData = sectionsData?.sections?.[activeSection];

  // Local draft state for editing manual priorities
  const [draftMode, setDraftMode] = useState<'auto' | 'manual'>('auto');
  const [draftManualIds, setDraftManualIds] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Sync draft state whenever active section or server data changes (if not edited locally)
  useEffect(() => {
    if (currentSectionData) {
      setDraftMode(currentSectionData.mode || 'auto');
      setDraftManualIds(currentSectionData.manualProductIds || []);
      setIsDirty(false);
    }
  }, [currentSectionData, activeSection]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (onNotify) onNotify(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 3. Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({
      sectionKey,
      mode,
      manualProductIds,
    }: {
      sectionKey: SectionKey;
      mode: 'auto' | 'manual';
      manualProductIds: string[];
    }) => {
      const res = await fetch(`/api/v1/admin/homepage/sections/${sectionKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, manualProductIds, updatedBy: 'admin' }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Gagal menyimpan urutan produk.');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['homepage-sections'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast(`Urutan kategori ${activeSection.toUpperCase()} berhasil disimpan & disinkronkan ke Customer Website!`);
    },
    onError: (err: Error) => {
      showToast(`Error: ${err.message}`);
    },
  });

  // Reorder handlers
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...draftManualIds];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setDraftManualIds(next);
    setIsDirty(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === draftManualIds.length - 1) return;
    const next = [...draftManualIds];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setDraftManualIds(next);
    setIsDirty(true);
  };

  const handleRemove = (idToRemove: string) => {
    setDraftManualIds(draftManualIds.filter((id) => id !== idToRemove));
    setIsDirty(true);
  };

  const handleAddProduct = (productId: string) => {
    if (!draftManualIds.includes(productId)) {
      setDraftManualIds([...draftManualIds, productId]);
      setIsDirty(true);
    }
    setIsAddPickerOpen(false);
  };

  const handleModeChange = (newMode: 'auto' | 'manual') => {
    setDraftMode(newMode);
    setIsDirty(true);
  };

  const handleSave = () => {
    saveMutation.mutate({
      sectionKey: activeSection,
      mode: draftMode,
      manualProductIds: draftManualIds,
    });
  };

  const handleResetToAuto = () => {
    setDraftMode('auto');
    setDraftManualIds([]);
    setIsDirty(true);
    saveMutation.mutate({
      sectionKey: activeSection,
      mode: 'auto',
      manualProductIds: [],
    });
  };

  // Lookup map for products in draft manual IDs
  const catalogMap = useMemo(() => {
    const map = new Map<string, AdminProductItem>();
    for (const p of catalogData?.data || []) {
      map.set(p.id, p);
      map.set(p.name.toLowerCase(), p);
    }
    return map;
  }, [catalogData]);

  // Filtered products for add modal
  const filteredCatalogForPicker = useMemo(() => {
    const q = searchPickerQuery.toLowerCase().trim();
    return activeCatalog.filter((p) => {
      if (draftManualIds.includes(p.id)) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q);
    });
  }, [activeCatalog, draftManualIds, searchPickerQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Layers className="w-4 h-4" />
              </span>
              <h1 className="text-base sm:text-lg font-bold text-foreground">
                Pengaturan Urutan Produk Homepage
              </h1>
            </div>
            <p className="text-xs text-foreground-muted mt-1 max-w-2xl">
              Tentukan produk yang tampil pada bagian Promo, Terlaris, dan Terbaru di Customer Website.
              Maksimal 8 produk per kategori dengan opsi Mode Otomatis (Sistem Cerdas) atau Mode Manual (Prioritas Admin).
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isDirty && (
              <Badge variant="warning" className="text-[11px] animate-pulse">
                Ada Perubahan Belum Disimpan
              </Badge>
            )}
            <Button
              type="button"
              size="sm"
              disabled={saveMutation.isPending || !isDirty}
              onClick={handleSave}
              className="bg-primary text-white hover:bg-primary/90 text-xs h-9 px-4 gap-1.5 font-semibold shadow-xs"
            >
              {saveMutation.isPending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Simpan Urutan</span>
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mt-5 border-b border-border/80 pb-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSection('promo')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeSection === 'promo'
                ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-xs'
                : 'bg-surface-raised text-foreground-muted hover:text-foreground hover:bg-border/40'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Promo / Campaign</span>
            {sectionsData?.sections?.promo && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                activeSection === 'promo' ? 'bg-white/20 text-white' : 'bg-border text-foreground-muted'
              }`}>
                {sectionsData.sections.promo.mode === 'manual' ? 'Manual' : 'Auto'} ({sectionsData.sections.promo.count})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('terlaris')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeSection === 'terlaris'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-surface-raised text-foreground-muted hover:text-foreground hover:bg-border/40'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Terlaris (Best Seller)</span>
            {sectionsData?.sections?.terlaris && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                activeSection === 'terlaris' ? 'bg-white/20 text-white' : 'bg-border text-foreground-muted'
              }`}>
                {sectionsData.sections.terlaris.mode === 'manual' ? 'Manual' : 'Auto'} ({sectionsData.sections.terlaris.count})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('terbaru')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeSection === 'terbaru'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-surface-raised text-foreground-muted hover:text-foreground hover:bg-border/40'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Terbaru (Newest)</span>
            {sectionsData?.sections?.terbaru && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                activeSection === 'terbaru' ? 'bg-white/20 text-white' : 'bg-border text-foreground-muted'
              }`}>
                {sectionsData.sections.terbaru.mode === 'manual' ? 'Manual' : 'Auto'} ({sectionsData.sections.terbaru.count})
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mode Control & Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Main Panel: Configuration & Ordering Controls */}
        <div className="lg:col-span-7 space-y-4">
          {/* Mode Switcher Card */}
          <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>Mode Pengurutan:</span>
                <span className="uppercase text-primary font-black tracking-wide">
                  {activeSection}
                </span>
              </h2>

              {draftMode === 'manual' && (
                <button
                  type="button"
                  onClick={handleResetToAuto}
                  className="text-[11px] text-foreground-muted hover:text-red-500 flex items-center gap-1 font-medium transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset ke Otomatis</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Auto Mode */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  draftMode === 'auto'
                    ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border bg-surface-raised hover:bg-border/30'
                }`}
              >
                <input
                  type="radio"
                  name="sectionMode"
                  value="auto"
                  checked={draftMode === 'auto'}
                  onChange={() => handleModeChange('auto')}
                  className="mt-1 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Mode Otomatis (Auto)</span>
                  </div>
                  <p className="text-[11px] text-foreground-muted leading-relaxed">
                    Sistem otomatis menghitung ranking ranking produk berdasarkan metrik real-time. Produk baru atau lonjakan penjualan langsung direspons.
                  </p>
                </div>
              </label>

              {/* Option 2: Manual Mode */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  draftMode === 'manual'
                    ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border bg-surface-raised hover:bg-border/30'
                }`}
              >
                <input
                  type="radio"
                  name="sectionMode"
                  value="manual"
                  checked={draftMode === 'manual'}
                  onChange={() => handleModeChange('manual')}
                  className="mt-1 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    <span>Mode Manual (Custom)</span>
                  </div>
                  <p className="text-[11px] text-foreground-muted leading-relaxed">
                    Admin menentukan urutan prioritas posisi 1, 2, 3... secara eksplisit. Sisa slot hingga 8 otomatis diisi sistem tanpa duplikasi.
                  </p>
                </div>
              </label>
            </div>

            {/* Criteria explanation card */}
            <div className="bg-surface-raised border border-border/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-foreground-muted">
              <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground">
                  {activeSection === 'promo' && 'Kriteria Otomatis Promo: '}
                  {activeSection === 'terlaris' && 'Kriteria Otomatis Terlaris: '}
                  {activeSection === 'terbaru' && 'Kriteria Otomatis Terbaru: '}
                </span>
                <span>
                  {activeSection === 'promo' &&
                    'Mengambil produk yang terdaftar di campaign aktif yang sedang berlangsung (Now >= Start Date && Now < End Date), diurutkan dari prioritas campaign tertinggi lalu unit terjual.'}
                  {activeSection === 'terlaris' &&
                    'Mengambil produk paling laris berdasarkan total unit transaksi yang berhasil (Completed/Paid) di Asterra Store. Transaksi dibatalkan/refund otomatis dieliminasi.'}
                  {activeSection === 'terbaru' &&
                    'Mengambil produk berdasarkan timestamp pembuatan atau tanggal rilis katalog terbaru (Descending: yang paling baru dirilis berada di posisi teratas).'}
                </span>
              </div>
            </div>
          </div>

          {/* Manual Priority List Manager */}
          {draftMode === 'manual' && (
            <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 animate-tab-glide">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Daftar Prioritas Urutan Manual ({draftManualIds.length} produk)
                  </h3>
                  <p className="text-[11px] text-foreground-muted mt-0.5">
                    Gunakan tombol ⬆️ dan ⬇️ untuk memindahkan posisi. Produk di nomor 1 akan tampil paling awal di Customer Website.
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddPickerOpen(true)}
                  className="text-xs h-8 gap-1.5 font-semibold border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Produk</span>
                </Button>
              </div>

              {/* Priority list */}
              {draftManualIds.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-border rounded-xl space-y-3">
                  <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center mx-auto text-foreground-muted">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground">Belum Ada Produk Prioritas Manual</p>
                    <p className="text-[11px] text-foreground-muted max-w-sm mx-auto">
                      Klik tombol "Tambah Produk" di atas untuk memprioritaskan produk tertentu (misal: ChatGPT, Gemini, Claude Pro, Mobile Legends).
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsAddPickerOpen(true)}
                    className="text-xs h-8 bg-primary text-white"
                  >
                    Pilih Produk Katalog
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {draftManualIds.map((idOrName, idx) => {
                    const prod = catalogMap.get(idOrName) || catalogMap.get(idOrName.toLowerCase());
                    const displayName = prod?.name || idOrName;
                    const displayCategory = prod?.categoryName || 'Katalog';
                    const displayPrice = prod?.priceFormatted || (prod?.price ? `Rp ${prod.price.toLocaleString('id-ID')}` : '-');

                    return (
                      <div
                        key={`manual-item-${idOrName}-${idx}`}
                        className="bg-surface-raised border border-border/80 hover:border-primary/40 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors"
                      >
                        {/* Position Number Pill */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground truncate" title={displayName}>
                              {displayName}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-foreground-muted mt-0.5">
                              <span>{displayCategory}</span>
                              <span>·</span>
                              <span className="font-semibold text-primary">{displayPrice}</span>
                              {!prod && (
                                <span className="text-amber-500 font-medium">(ID Kustom)</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Order Controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveUp(idx)}
                            title="Pindah ke Atas"
                            className="w-7 h-7 rounded-lg border border-border bg-surface hover:bg-border/60 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === draftManualIds.length - 1}
                            onClick={() => handleMoveDown(idx)}
                            title="Pindah ke Bawah"
                            className="w-7 h-7 rounded-lg border border-border bg-surface hover:bg-border/60 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(idOrName)}
                            title="Hapus dari Prioritas"
                            className="w-7 h-7 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Informational Footer */}
              <div className="pt-2 text-[11px] text-foreground-muted flex items-center justify-between border-t border-border/60">
                <span>Slot manual: {draftManualIds.length} dari 8 target</span>
                {draftManualIds.length < 8 && (
                  <span className="text-primary font-medium">
                    + {8 - draftManualIds.length} slot sisa otomatis diisi sistem
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Live Homepage Preview (Up to 8 Products) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 sticky top-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-foreground">
                  Live Preview Customer Website (8 Produk)
                </h3>
              </div>
              <Badge variant="success" className="text-[10px]">
                {currentSectionData?.mode === 'manual' ? 'Manual Active' : 'Auto Active'}
              </Badge>
            </div>

            <p className="text-[11px] text-foreground-muted">
              Ini adalah 8 produk yang sedang dilihat pelanggan di{' '}
              <strong className="text-foreground">https://asterrastore.biz.id/</strong> pada tab{' '}
              <span className="uppercase text-primary font-bold">{activeSection}</span>.
            </p>

            {/* Product items list */}
            {isLoadingSections ? (
              <div className="space-y-2 py-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 bg-surface-raised rounded-xl animate-pulse" />
                ))}
              </div>
            ) : currentSectionData?.data && currentSectionData.data.length > 0 ? (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {currentSectionData.data.slice(0, 8).map((prod, rankIdx) => (
                  <div
                    key={`preview-${prod.id}-${rankIdx}`}
                    className="p-2.5 rounded-xl border border-border/80 bg-surface-raised flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="w-5 h-5 rounded-md bg-foreground text-background font-black text-[10px] flex items-center justify-center shrink-0">
                        {rankIdx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate" title={prod.name}>
                          {prod.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-foreground-muted">
                          <span className="text-primary font-bold">
                            Rp {Number(prod.price || 0).toLocaleString('id-ID')}
                          </span>
                          <span>·</span>
                          <span>{prod.soldCount ? `${prod.soldCount} terjual` : 'Ready'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {prod.isPromo ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-100 text-red-700 border border-red-200">
                          🔥 Promo
                        </span>
                      ) : activeSection === 'terlaris' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          ⭐ Terlaris
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          ✨ Baru
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-border rounded-xl text-xs text-foreground-muted">
                Belum ada produk aktif yang memenuhi syarat kategori ini.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal / Sheet Picker: Add Product to Manual Ordering */}
      {isAddPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Pilih Produk untuk Diprioritaskan
                </h3>
                <p className="text-[11px] text-foreground-muted mt-0.5">
                  Pilih dari {activeCatalog.length} produk aktif di katalog Asterra Store
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPickerOpen(false)}
                className="w-7 h-7 rounded-lg text-foreground-muted hover:text-foreground hover:bg-border/40 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-border/80 bg-surface-raised">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
                <Input
                  value={searchPickerQuery}
                  onChange={(e) => setSearchPickerQuery(e.target.value)}
                  placeholder="Cari nama produk (misal: ChatGPT, Canva, Netflix, Claude, Mobile Legends)..."
                  className="pl-8 text-xs h-9 bg-surface border-border"
                  autoFocus
                />
              </div>
            </div>

            {/* Product list */}
            <div className="p-3 overflow-y-auto space-y-1.5 flex-1 divide-y divide-border/40">
              {filteredCatalogForPicker.length === 0 ? (
                <div className="p-8 text-center text-xs text-foreground-muted">
                  Tidak ada produk yang cocok dengan pencarian.
                </div>
              ) : (
                filteredCatalogForPicker.map((prod) => (
                  <div
                    key={prod.id}
                    className="pt-2 first:pt-0 flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-surface-raised transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate" title={prod.name}>
                        {prod.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-foreground-muted mt-0.5">
                        <span className="font-semibold text-primary">{prod.priceFormatted}</span>
                        <span>·</span>
                        <span>{prod.categoryName}</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAddProduct(prod.id)}
                      className="text-[11px] h-7 px-3 bg-primary text-white hover:bg-primary/90 shrink-0"
                    >
                      Pilih
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-border bg-surface-raised flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddPickerOpen(false)}
                className="text-xs h-8"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
