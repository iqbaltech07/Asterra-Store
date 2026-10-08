'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  faWandMagicSparkles,
  faBagShopping,
  faXmark,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PromoCode } from '@/lib/services/promo.service';

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
  const [formDiscountValue, setFormDiscountValue] = useState<number>(10);
  const [formMaxDiscount, setFormMaxDiscount] = useState<string>('50000');
  const [formMinOrderAmount, setFormMinOrderAmount] = useState<number>(0);
  const [formUsageLimit, setFormUsageLimit] = useState<string>('500');
  const [formPerUserLimit, setFormPerUserLimit] = useState<number>(1);
  const [formExpiresAt, setFormExpiresAt] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Fetch Promo Codes from API
  const fetchPromos = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/promos');
      if (!res.ok) throw new Error('Gagal mengambil data promo');
      const json = await res.json();
      if (json.success) {
        setPromos(json.data || []);
        if (json.metrics) setMetrics(json.metrics);
      }
    } catch {
      onNotify('Gagal memuat daftar kode promo.');
    } finally {
      setIsLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    fetchPromos();
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

    if (formDiscountValue <= 0) {
      onNotify('Nilai diskon harus lebih besar dari 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: formCode.trim().toUpperCase(),
        description: formDescription.trim() || undefined,
        discountType: formDiscountType,
        discountValue: formDiscountValue,
        maxDiscount: formDiscountType === 'percentage' && formMaxDiscount ? Number(formMaxDiscount) : null,
        minOrderAmount: Number(formMinOrderAmount) || 0,
        usageLimit: formUsageLimit ? Number(formUsageLimit) : null,
        perUserLimit: Number(formPerUserLimit) || 1,
        expiresAt: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
        isActive: formIsActive,
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
      // Reset form
      setFormCode('');
      setFormDescription('');
      setFormDiscountValue(10);
      setFormMinOrderAmount(0);
      setFormUsageLimit('500');
      setFormExpiresAt('');
      fetchPromos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat kode promo.';
      onNotify(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter promos
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
      <div className="bg-surface border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">Manajemen Kode Promo & Voucher</h2>
            <Badge variant="outline" className="text-xs font-mono border-border">
              {metrics.total} Terdaftar
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Buat voucher diskon, atur kuota pemakaian per pengguna, dan amankan validasi harga secara otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPromos}
            disabled={isLoading}
            className="text-xs border-border gap-1.5 h-10 px-3.5"
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
            className="text-xs font-semibold gap-1.5 h-10 px-4 shadow-sm"
          >
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            <span>Generate Promo Baru</span>
          </Button>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-medium">Total Kode Promo</span>
            <FontAwesomeIcon icon={faTag} className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{metrics.total}</p>
          <span className="text-[11px] text-foreground-muted">Voucher dalam database</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-medium">Promo Aktif</span>
            <FontAwesomeIcon icon={faWandMagicSparkles} className="w-4 h-4 text-status-success" />
          </div>
          <p className="text-2xl font-bold text-status-success">{metrics.active}</p>
          <span className="text-[11px] text-foreground-muted">Dapat digunakan pengguna</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-medium">Total Penggunaan</span>
            <FontAwesomeIcon icon={faBagShopping} className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{metrics.totalUsed}x</p>
          <span className="text-[11px] text-foreground-muted">Transaksi memakai voucher</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-medium">Kedaluwarsa / Nonaktif</span>
            <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-status-warning" />
          </div>
          <p className="text-2xl font-bold text-foreground-muted">{metrics.expired}</p>
          <span className="text-[11px] text-foreground-muted">Tidak dapat digunakan</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-border rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-primary text-white'
                : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
            }`}
          >
            Semua ({promos.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'active'
                ? 'bg-primary text-white'
                : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
            }`}
          >
            Aktif ({metrics.active})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'inactive'
                ? 'bg-primary text-white'
                : 'bg-surface-raised text-foreground-muted hover:text-foreground border border-border'
            }`}
          >
            Nonaktif / Expired ({metrics.expired})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari kode promo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs bg-surface-raised border-border h-9"
          />
        </div>
      </div>

      {/* Promo Code Cards List */}
      {isLoading ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center space-y-3">
          <FontAwesomeIcon icon={faArrowsRotate} className="w-6 h-6 text-primary animate-spin mx-auto" />
          <p className="text-xs text-foreground-muted">Memuat daftar kode promo...</p>
        </div>
      ) : filteredPromos.length === 0 ? (
        <div className="bg-surface border border-dashed border-border rounded-xl p-12 text-center space-y-3">
          <FontAwesomeIcon icon={faTag} className="w-10 h-10 text-foreground-muted mx-auto opacity-50" />
          <h4 className="text-sm font-semibold text-foreground">Tidak Ada Kode Promo Ditemukan</h4>
          <p className="text-xs text-foreground-muted max-w-sm mx-auto">
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
            className="text-xs gap-1.5 mt-2"
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
                className={`p-5 rounded-xl border bg-surface transition-all flex flex-col justify-between space-y-4 hover:border-primary/40 ${
                  !p.isActive || isExpired ? 'opacity-70 bg-surface/60' : 'shadow-xs'
                }`}
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-base font-extrabold text-foreground tracking-wider bg-surface-raised border border-border px-2.5 py-1 rounded-lg">
                        {p.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(p.code)}
                        className="p-1 rounded-md text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                        title="Salin kode"
                      >
                        {copiedKey === p.code ? (
                          <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-status-success" />
                        ) : (
                          <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div>
                      {isExpired ? (
                        <Badge className="bg-status-warning/15 text-status-warning border-status-warning/30 text-[10px]">
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

                  <p className="text-xs text-foreground-muted leading-relaxed line-clamp-2">
                    {p.description || 'Tidak ada deskripsi tambahan.'}
                  </p>
                </div>

                {/* Key Details */}
                <div className="p-3 rounded-lg bg-surface-raised border border-border/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-foreground-muted">
                    <span>Besaran Diskon</span>
                    <span className="font-bold text-primary font-mono text-sm">
                      {p.discountType === 'percentage'
                        ? `${p.discountValue}%`
                        : formatIDR(p.discountValue)}
                    </span>
                  </div>

                  {p.discountType === 'percentage' && p.maxDiscount && (
                    <div className="flex justify-between items-center text-[11px] text-foreground-muted">
                      <span>Maks. Potongan</span>
                      <span className="font-mono font-medium text-foreground">
                        {formatIDR(p.maxDiscount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[11px] text-foreground-muted">
                    <span>Min. Belanja</span>
                    <span className="font-mono font-medium text-foreground">
                      {p.minOrderAmount > 0 ? formatIDR(p.minOrderAmount) : 'Tanpa Minimum'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-foreground-muted">
                    <span>Batas per Akun</span>
                    <span className="font-mono font-medium text-foreground">
                      {p.perUserLimit}x per pemesan
                    </span>
                  </div>
                </div>

                {/* Usage Progress Bar */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[11px] text-foreground-muted">
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
                <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted pt-1 border-t border-border/50">
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
                    className="text-xs h-8 gap-1.5 flex-1 border-border hover:bg-surface-raised"
                  >
                    <FontAwesomeIcon icon={faPowerOff} className={`w-3 h-3 ${p.isActive ? 'text-status-warning' : 'text-status-success'}`} />
                    <span>{p.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePromo(p.id, p.code)}
                    className="text-xs h-8 w-8 p-0 border-border text-status-error hover:bg-status-error/10 hover:border-status-error/30"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsCreateModalOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl p-6 sm:p-7 z-10 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FontAwesomeIcon icon={faTag} className="w-4 h-4 text-primary" />
                  <span>Generate Kode Promo Baru</span>
                </h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Tentukan besaran diskon, syarat belanja, dan batas kuota voucher.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-foreground-muted hover:text-foreground p-1"
              >
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePromoSubmit} className="space-y-4">
              {/* Promo Code Input & Auto-generate button */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Kode Promo *</span>
                  <button
                    type="button"
                    onClick={handleGenerateRandomCode}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-normal"
                  >
                    <FontAwesomeIcon icon={faWandMagicSparkles} className="w-3 h-3" />
                    <span>Acak Kode Otomatis</span>
                  </button>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    placeholder="contoh: DISKON50 / GAJIAN"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                    className="font-mono uppercase font-bold text-sm bg-surface-raised border-border tracking-wider"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Deskripsi Voucher (Opsional)</label>
                <Input
                  type="text"
                  placeholder="contoh: Diskon launching 10% untuk produk AI"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="text-xs bg-surface-raised border-border"
                />
              </div>

              {/* Discount Type Radio / Tabs */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Tipe Diskon *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormDiscountType('percentage')}
                    className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      formDiscountType === 'percentage'
                        ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                        : 'bg-surface-raised border-border text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    <FontAwesomeIcon icon={faPercent} className="w-3.5 h-3.5" />
                    <span>Persentase (%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormDiscountType('fixed')}
                    className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      formDiscountType === 'fixed'
                        ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                        : 'bg-surface-raised border-border text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    <FontAwesomeIcon icon={faTag} className="w-3.5 h-3.5" />
                    <span>Potongan Tetap (Rp)</span>
                  </button>
                </div>
              </div>

              {/* Discount Value & Max Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    {formDiscountType === 'percentage' ? 'Nilai Persentase (%) *' : 'Nominal Potongan (Rp) *'}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max={formDiscountType === 'percentage' ? 100 : 10000000}
                    required
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(Number(e.target.value))}
                    className="text-sm font-mono bg-surface-raised border-border"
                  />
                </div>

                {formDiscountType === 'percentage' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Maks. Potongan Diskon (Rp)</label>
                    <Input
                      type="number"
                      placeholder="contoh: 50000 (kosong = tanpa batas)"
                      value={formMaxDiscount}
                      onChange={(e) => setFormMaxDiscount(e.target.value)}
                      className="text-sm font-mono bg-surface-raised border-border"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Batas Kuota Total</label>
                    <Input
                      type="number"
                      placeholder="contoh: 500 (kosong = tanpa batas)"
                      value={formUsageLimit}
                      onChange={(e) => setFormUsageLimit(e.target.value)}
                      className="text-sm font-mono bg-surface-raised border-border"
                    />
                  </div>
                )}
              </div>

              {/* Min Order & Per-User Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Minimal Belanja (Rp)</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0 = tanpa syarat"
                    value={formMinOrderAmount}
                    onChange={(e) => setFormMinOrderAmount(Number(e.target.value))}
                    className="text-sm font-mono bg-surface-raised border-border"
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
                    className="text-sm font-mono bg-surface-raised border-border"
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Tanggal Kedaluwarsa (Opsional)</span>
                  <span className="text-[11px] text-foreground-muted">Kosongkan jika berlaku selamanya</span>
                </label>
                <Input
                  type="date"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                  className="text-xs bg-surface-raised border-border"
                />
              </div>

              {/* Active Switch */}
              <div className="pt-2">
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

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-xs border-border"
                >
                  Batal
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="text-xs font-semibold gap-1.5 px-4"
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
      )}
    </div>
  );
}
