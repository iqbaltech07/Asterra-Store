'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminModalPortal } from '@/components/admin/admin-modal-portal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTag,
  faPercent,
  faPlus,
  faArrowsRotate,
  faMagnifyingGlass,
  faCheck,
  faCopy,
  faTrash,
  faPowerOff,
  faCalendar,
  faCircleCheck,
  faShuffle,
  faBagShopping,
  faXmark,
  faClock,
  faBox,
  faGlobe,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PromoCode } from '@/types/promo';
import { fetchWithRetry } from '@/lib/api-client';
import { useCatalogProducts } from '@/lib/hooks/use-catalog-products';

interface AdminPromosTabProps {
  onNotify: (msg: string) => void;
}

export function AdminPromosTab({ onNotify }: AdminPromosTabProps) {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [metrics, setMetrics] = useState<{
    total: number;
    active: number;
    expired: number;
    totalUsed: number;
  }>({ total: 0, active: 0, expired: 0, totalUsed: 0 });

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States for New Promo
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState<string>('10');
  const [formMaxDiscount, setFormMaxDiscount] = useState<string>('50000');
  const [formMinOrderAmount, setFormMinOrderAmount] = useState<string>('0');
  const [formUsageLimit, setFormUsageLimit] = useState<string>('500');
  const [formPerUserLimit, setFormPerUserLimit] = useState<number>(1);
  const [formExpiresAt, setFormExpiresAt] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formTargetScope, setFormTargetScope] = useState<'all' | 'specific_product'>('all');
  const [formTargetProductId, setFormTargetProductId] = useState<string>('');
  const [formTargetProductName, setFormTargetProductName] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');

  const { data: catalogData, isLoading: isCatalogLoading } = useCatalogProducts();
  const catalogProducts = catalogData?.data || [];

  const filteredCatalogProducts = catalogProducts.filter((p) => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    const catName = typeof p.category === 'object' && p.category !== null ? p.category.name : '';
    return (
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (catName && catName.toLowerCase().includes(q))
    );
  });

  // Track modal open state via ref for safe access inside auto-sync intervals and events
  const isCreateModalOpenRef = useRef(isCreateModalOpen);
  useEffect(() => {
    isCreateModalOpenRef.current = isCreateModalOpen;
  }, [isCreateModalOpen]);

  const onNotifyRef = useRef(onNotify);
  useEffect(() => {
    onNotifyRef.current = onNotify;
  }, [onNotify]);

  const isFetchingRef = useRef(false);

  // Fetch Promo Codes from API - Event-driven & Silent Background Updates
  const fetchPromos = useCallback(
    async (isSilent = false) => {
      // Prevent concurrent duplicate requests
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (!isSilent) {
        setIsLoading(true);
      }

      try {
        const res = await fetchWithRetry('/api/v1/admin/promos');
        if (!res.ok) throw new Error('Gagal mengambil data promo');
        const json = await res.json();
        if (json.success) {
          setPromos(json.data || []);
          if (json.metrics) setMetrics(json.metrics);
        }
      } catch {
        if (!isSilent) {
          onNotifyRef.current('Gagal memuat daftar kode promo.');
        }
      } finally {
        if (!isSilent) setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    []
  );

  useEffect(() => {
    // Initial fetch on mount
    fetchPromos(false);

    // Event-driven listener triggered strictly when data actually changes (SSE promo:updated -> admin:refresh-promos)
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const handleEventDrivenRefresh = () => {
      // Don't disturb active modal
      if (isCreateModalOpenRef.current) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchPromos(true);
      }, 300);
    };

    window.addEventListener('admin:refresh-promos', handleEventDrivenRefresh);

    return () => {
      window.removeEventListener('admin:refresh-promos', handleEventDrivenRefresh);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [fetchPromos]);

  const handleCopy = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedKey(code);
      onNotify(`Kode promo "${code}" berhasil disalin!`);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleGenerateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generated = `AST-${rand}`;
    setFormCode(generated);
    onNotify(`Kode promo acak "${generated}" dibuat!`);
  };

  const handleToggleStatus = async (id: string, code: string) => {
    try {
      const res = await fetch(`/api/v1/admin/promos/${id}`, {
        method: 'PATCH',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengubah status');
      }
      onNotify(json.message || `Status "${code}" diperbarui.`);
      fetchPromos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      onNotify(msg);
    }
  };

  const handleDeletePromo = async (id: string, code: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kode promo "${code}" secara permanen?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/promos/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghapus promo');
      }
      onNotify(`Kode promo "${code}" berhasil dihapus.`);
      fetchPromos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus promo.';
      onNotify(msg);
    }
  };

  const handleCreatePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formCode.trim()) {
      onNotify('Kode promo tidak boleh kosong.');
      return;
    }

    const numDiscountValue = parseFloat(String(formDiscountValue).replace(/,/g, '.')) || 0;
    if (numDiscountValue <= 0) {
      onNotify('Nilai diskon harus lebih besar dari 0.');
      return;
    }

    if (formTargetScope === 'specific_product' && !formTargetProductId) {
      onNotify('Silakan pilih produk yang ditargetkan untuk voucher ini.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: formCode.trim().toUpperCase(),
        description: formDescription.trim() || undefined,
        discountType: formDiscountType,
        discountValue: numDiscountValue,
        maxDiscount: formDiscountType === 'percentage' && formMaxDiscount ? (parseFloat(String(formMaxDiscount).replace(/,/g, '.')) || null) : null,
        minOrderAmount: parseFloat(String(formMinOrderAmount).replace(/,/g, '.')) || 0,
        usageLimit: formUsageLimit ? Number(formUsageLimit) : null,
        perUserLimit: Number(formPerUserLimit) || 1,
        expiresAt: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
        isActive: formIsActive,
        targetScope: formTargetScope,
        targetProductId: formTargetScope === 'specific_product' ? formTargetProductId : null,
        targetProductName: formTargetScope === 'specific_product' ? formTargetProductName : null,
      };

      const res = await fetch('/api/v1/admin/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal membuat kode promo.');
      }

      onNotify(json.message || `Kode promo "${json.data?.code}" berhasil dibuat.`);
      setIsCreateModalOpen(false);
      setFormCode('');
      setFormDescription('');
      setFormDiscountValue('10');
      setFormMinOrderAmount('0');
      setFormUsageLimit('500');
      setFormExpiresAt('');
      setFormTargetScope('all');
      setFormTargetProductId('');
      setFormTargetProductName('');
      setProductSearch('');
      fetchPromos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat kode promo.';
      onNotify(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPromos = promos.filter((p) => {
    const matchesSearch =
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const isExpired = p.expiresAt && new Date(p.expiresAt) < new Date();
    const isCurrentlyActive = p.isActive && !isExpired;

    if (statusFilter === 'active') return matchesSearch && isCurrentlyActive;
    if (statusFilter === 'inactive') return matchesSearch && (!p.isActive || isExpired);
    return matchesSearch;
  });

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground tracking-tight">Manajemen Kode Promo & Voucher</h2>
            <Badge variant="outline" className="text-xs font-mono border-border bg-surface-raised">
              {metrics.total} Terdaftar
            </Badge>
          </div>
          <p className="text-xs text-foreground-muted mt-1">
            Buat voucher diskon, atur kuota pemakaian per pengguna, dan amankan validasi harga secara otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPromos()}
            disabled={isLoading}
            className="text-xs border-border gap-1.5 h-9 px-3.5 rounded-xl font-semibold"
          >
            <FontAwesomeIcon icon={faArrowsRotate} className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              handleGenerateRandomCode();
              setIsCreateModalOpen(true);
            }}
            className="text-xs font-semibold gap-1.5 h-9 px-4 shadow-xs rounded-xl"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
            <span>Generate Promo Baru</span>
          </Button>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-semibold">Total Kode Promo</span>
            <div className="w-7 h-7 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground-muted">
              <FontAwesomeIcon icon={faTag} className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">{metrics.total}</p>
          <span className="text-xs text-foreground-muted block pt-1 border-t border-border/60">Voucher dalam database</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-semibold">Promo Aktif</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center">
              <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono tracking-tight">{metrics.active}</p>
          <span className="text-xs text-emerald-600 font-medium block pt-1 border-t border-border/60">Dapat digunakan pengguna</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-semibold">Total Penggunaan</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-primary border border-blue-200/60 flex items-center justify-center">
              <FontAwesomeIcon icon={faBagShopping} className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">{metrics.totalUsed}x</p>
          <span className="text-xs text-foreground-muted block pt-1 border-t border-border/60">Transaksi memakai voucher</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-semibold">Kedaluwarsa / Nonaktif</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center">
              <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground-muted font-mono tracking-tight">{metrics.expired}</p>
          <span className="text-xs text-foreground-muted block pt-1 border-t border-border/60">Tidak dapat digunakan</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-foreground text-background shadow-xs'
                : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
            }`}
          >
            Semua ({promos.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
            }`}
          >
            Aktif ({metrics.active})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'inactive'
                ? 'bg-foreground text-background shadow-xs'
                : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
            }`}
          >
            Nonaktif / Expired ({metrics.expired})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3 h-3 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            placeholder="Cari kode promo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs bg-surface-raised border-border h-9 rounded-xl"
          />
        </div>
      </div>

      {/* Promo Code Cards List */}
      {isLoading ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center space-y-3">
          <FontAwesomeIcon icon={faArrowsRotate} className="w-6 h-6 text-primary animate-spin mx-auto" />
          <p className="text-xs text-foreground-muted animate-pulse">Memuat daftar kode promo...</p>
        </div>
      ) : filteredPromos.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center space-y-3">
          <FontAwesomeIcon icon={faTag} className="w-10 h-10 text-foreground-muted mx-auto opacity-40" />
          <h4 className="text-sm font-semibold text-foreground">Tidak Ada Kode Promo Ditemukan</h4>
          <p className="text-xs text-foreground-muted max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? `Tidak ditemukan promo yang cocok dengan pencarian "${searchQuery}".`
              : 'Belum ada kode promo terdaftar. Klik "Generate Promo Baru" untuk menambahkan.'}
          </p>
          <Button
            size="sm"
            onClick={() => {
              handleGenerateRandomCode();
              setIsCreateModalOpen(true);
            }}
            className="text-xs gap-1.5 mt-2 rounded-xl"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
            <span>Buat Promo Pertama</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPromos.map((p) => {
            const isExpired = p.expiresAt && new Date(p.expiresAt) < new Date();
            const usagePercent =
              p.usageLimit !== null && p.usageLimit > 0
                ? Math.min(100, Math.round((p.usedCount / p.usageLimit) * 100))
                : 0;

            return (
              <div
                key={p.id}
                className={`p-6 rounded-2xl border bg-surface transition-all flex flex-col justify-between space-y-4 hover:border-foreground/20 hover:shadow-sm ${
                  !p.isActive || isExpired ? 'opacity-70 bg-surface-raised' : 'shadow-xs border-border'
                }`}
              >
                {/* Header */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-extrabold text-foreground tracking-wider bg-surface-raised border border-border px-3 py-1 rounded-xl">
                        {p.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(p.code)}
                        className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-raised transition-colors"
                        title="Salin kode"
                      >
                        {copiedKey === p.code ? (
                          <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div>
                      {isExpired ? (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200/60 text-[10px]">
                          Kedaluwarsa
                        </Badge>
                      ) : p.isActive ? (
                        <Badge variant="success" className="text-[10px]">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-foreground-muted">
                          Nonaktif
                        </Badge>
                      )}
                    </div>
                  </div>

                  {p.targetScope === 'specific_product' || p.targetProductId ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-[11px] font-medium">
                      <FontAwesomeIcon icon={faBox} className="w-3 h-3 shrink-0 text-indigo-500" />
                      <span className="truncate">Khusus: {p.targetProductName || p.targetProductId}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-raised border border-border text-foreground-muted text-[11px]">
                      <FontAwesomeIcon icon={faGlobe} className="w-3 h-3 shrink-0 opacity-60" />
                      <span>Semua Produk</span>
                    </div>
                  )}

                  <p className="text-xs text-foreground-muted leading-relaxed line-clamp-2">
                    {p.description || 'Tidak ada deskripsi tambahan.'}
                  </p>
                </div>

                {/* Key Details */}
                <div className="p-3.5 rounded-xl bg-surface-raised border border-border space-y-2 text-xs">
                  <div className="flex justify-between items-center text-foreground-muted">
                    <span className="font-medium">Besaran Diskon</span>
                    <span className="font-bold text-primary font-mono text-sm">
                      {p.discountType === 'percentage'
                        ? `${p.discountValue}%`
                        : formatIDR(p.discountValue)}
                    </span>
                  </div>

                  {p.discountType === 'percentage' && p.maxDiscount && (
                    <div className="flex justify-between items-center text-xs text-foreground-muted">
                      <span>Maks. Potongan</span>
                      <span className="font-mono font-medium text-foreground">
                        {formatIDR(p.maxDiscount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-foreground-muted">
                    <span>Min. Belanja</span>
                    <span className="font-mono font-medium text-foreground">
                      {p.minOrderAmount > 0 ? formatIDR(p.minOrderAmount) : 'Tanpa Minimum'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-foreground-muted">
                    <span>Batas per Akun</span>
                    <span className="font-mono font-medium text-foreground">
                      {p.perUserLimit}x per pemesan
                    </span>
                  </div>
                </div>

                {/* Usage Progress Bar */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-xs text-foreground-muted">
                    <span>Kuota Digunakan</span>
                    <span className="font-mono font-medium">
                      {p.usedCount} {p.usageLimit !== null ? `/ ${p.usageLimit}` : 'Terpakai'}
                    </span>
                  </div>
                  {p.usageLimit !== null && (
                    <div className="w-full h-1.5 bg-surface-raised border border-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Expiration date */}
                <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted pt-2 border-t border-border font-mono">
                  <FontAwesomeIcon icon={faCalendar} className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {p.expiresAt
                      ? `Kedaluwarsa: ${new Intl.DateTimeFormat('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }).format(new Date(p.expiresAt))}`
                      : 'Masa berlaku: Selamanya'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(p.id, p.code)}
                    className="text-xs h-8 gap-1.5 flex-1 border-border rounded-xl font-semibold"
                  >
                    <FontAwesomeIcon icon={faPowerOff} className={`w-3 h-3 ${p.isActive ? 'text-amber-500' : 'text-emerald-600'}`} />
                    <span>{p.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePromo(p.id, p.code)}
                    className="text-xs h-8 w-8 p-0 border-border rounded-xl text-rose-600 hover:bg-rose-50 hover:border-rose-200/60"
                    title="Hapus promo"
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE PROMO CODE MODAL */}
      {isCreateModalOpen && (
        <AdminModalPortal>
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-lg max-h-[calc(100dvh-40px)] flex flex-col shadow-2xl overflow-hidden box-border animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="shrink-0 px-5 py-3.5 border-b border-[#E2E8F0] bg-white flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <FontAwesomeIcon icon={faTag} className="w-4 h-4 text-[#2563EB]" />
                  <span>Generate Kode Promo Baru</span>
                </h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Tentukan besaran diskon, syarat belanja, dan batas kuota voucher.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                className="h-8 w-8 p-0 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] shrink-0 cursor-pointer"
                title="Tutup (Esc)"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleCreatePromoSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs bg-[#F8FAFC]">
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Kode Promo *</span>
                  <button
                    type="button"
                    onClick={handleGenerateRandomCode}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                  >
                    <FontAwesomeIcon icon={faShuffle} className="w-3 h-3" />
                    <span>Acak Kode Otomatis</span>
                  </button>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="contoh: DISKON50 / GAJIAN"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  className="font-mono uppercase font-bold text-sm bg-surface-raised border-border tracking-wider rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Deskripsi Voucher (Opsional)</label>
                <Input
                  type="text"
                  placeholder="contoh: Diskon launching 10% untuk produk AI"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="text-xs bg-surface-raised border-border rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Cakupan Voucher *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormTargetScope('all');
                      setFormTargetProductId('');
                      setFormTargetProductName('');
                    }}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      formTargetScope === 'all'
                        ? 'bg-primary/10 border-primary text-primary shadow-xs'
                        : 'bg-surface-raised border-border text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    <FontAwesomeIcon icon={faGlobe} className="w-3.5 h-3.5" />
                    <span>Semua Produk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTargetScope('specific_product')}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      formTargetScope === 'specific_product'
                        ? 'bg-primary/10 border-primary text-primary shadow-xs'
                        : 'bg-surface-raised border-border text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    <FontAwesomeIcon icon={faBox} className="w-3.5 h-3.5" />
                    <span>Khusus Produk Tertentu</span>
                  </button>
                </div>
              </div>

              {formTargetScope === 'specific_product' && (
                <div className="p-3 bg-indigo-50/50 border border-indigo-200/60 rounded-xl space-y-2 animate-in fade-in">
                  <label className="text-xs font-semibold text-indigo-900 flex items-center justify-between">
                    <span>Pilih Produk Target Promo *</span>
                    {formTargetProductName && (
                      <span className="text-[11px] font-normal text-indigo-600 truncate max-w-[200px]">
                        Terpilih: {formTargetProductName}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3 h-3 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="Cari nama atau brand produk..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-8 text-xs bg-white border-border rounded-lg h-8"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 border border-border/80 rounded-lg bg-white p-1">
                    {isCatalogLoading ? (
                      <p className="text-[11px] text-foreground-muted p-2 text-center">Memuat produk katalog...</p>
                    ) : filteredCatalogProducts.length === 0 ? (
                      <p className="text-[11px] text-foreground-muted p-2 text-center">Tidak ada produk yang cocok.</p>
                    ) : (
                      filteredCatalogProducts.map((prod) => {
                        const isSelected = formTargetProductId === prod.id;
                        return (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => {
                              setFormTargetProductId(prod.id);
                              setFormTargetProductName(prod.name);
                            }}
                            className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white font-semibold'
                                : 'hover:bg-slate-50 text-foreground'
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <span className="block truncate font-medium">{prod.name}</span>
                              <span className={`text-[10px] block ${isSelected ? 'text-indigo-200' : 'text-foreground-muted'}`}>
                                {prod.brand || prod.category?.name} • Rp {Number(prod.price || 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                            {isSelected && <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                  {!formTargetProductId && (
                    <p className="text-[10px] text-rose-500 font-medium">
                      * Wajib memilih satu produk untuk voucher khusus.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Tipe Diskon *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormDiscountType('percentage')}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      formDiscountType === 'percentage'
                        ? 'bg-primary/10 border-primary text-primary shadow-xs'
                        : 'bg-surface-raised border-border text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    <FontAwesomeIcon icon={faPercent} className="w-3.5 h-3.5" />
                    <span>Persentase (%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormDiscountType('fixed')}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      formDiscountType === 'fixed'
                        ? 'bg-primary/10 border-primary text-primary shadow-xs'
                        : 'bg-surface-raised border-border text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    <FontAwesomeIcon icon={faTag} className="w-3.5 h-3.5" />
                    <span>Potongan Tetap (Rp)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {formDiscountType === 'percentage' ? 'Nilai Persentase (%) *' : 'Nominal Potongan (Rp) *'}
                  </label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    required
                    value={formDiscountValue}
                    onChange={(e) => {
                      const val = e.target.value.replace(/,/g, '.');
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setFormDiscountValue(val);
                      }
                    }}
                    placeholder={formDiscountType === 'percentage' ? '10' : '15000'}
                    className="text-xs font-mono bg-surface-raised border-border rounded-xl h-10"
                  />
                </div>

                {formDiscountType === 'percentage' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Maks. Potongan (Rp)</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="contoh: 50000"
                      value={formMaxDiscount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/,/g, '.');
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setFormMaxDiscount(val);
                        }
                      }}
                      className="text-xs font-mono bg-surface-raised border-border rounded-xl h-10"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Batas Kuota Total</label>
                    <Input
                      type="number"
                      placeholder="contoh: 500"
                      value={formUsageLimit}
                      onChange={(e) => setFormUsageLimit(e.target.value)}
                      className="text-xs font-mono bg-surface-raised border-border rounded-xl h-10"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Minimal Belanja (Rp)</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0 = tanpa syarat"
                    value={formMinOrderAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/,/g, '.');
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setFormMinOrderAmount(val);
                      }
                    }}
                    className="text-xs font-mono bg-surface-raised border-border rounded-xl h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Batas per Akun Pemesan</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formPerUserLimit}
                    onChange={(e) => setFormPerUserLimit(Number(e.target.value))}
                    className="text-xs font-mono bg-surface-raised border-border rounded-xl h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Tanggal Kedaluwarsa (Opsional)</span>
                </label>
                <Input
                  type="date"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                  className="text-xs bg-surface-raised border-border rounded-xl h-10"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>Aktifkan voucher ini segera setelah dibuat</span>
                </label>
              </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="shrink-0 px-4 sm:px-5 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-xs h-8 px-3.5 border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] rounded-lg cursor-pointer"
                >
                  Batal
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="text-xs gap-1.5 h-8 px-4 font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <FontAwesomeIcon icon={faArrowsRotate} className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
                      <span>Simpan & Terbitkan Promo</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
        </AdminModalPortal>
      )}
    </div>
  );
}
