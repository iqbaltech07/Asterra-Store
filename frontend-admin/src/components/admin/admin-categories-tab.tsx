'use client';

import React, { useState } from 'react';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Search,
  Eye,
  EyeOff,
  Layers,
  RefreshCw,
  X,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  activeCount: number;
  displayOrder: number;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

interface AdminCategoriesTabProps {
  onNotify?: (msg: string) => void;
  onFilterCategoryInProducts?: (catName: string) => void;
}

export function AdminCategoriesTab({ onNotify, onFilterCategoryInProducts }: AdminCategoriesTabProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formOrder, setFormOrder] = useState(1);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  // Real API Query
  const { data: categories = [], isLoading, isFetching, refetch } = useQuery<CategoryItem[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/categories');
      if (!res.ok) throw new Error('Gagal mengambil data kategori');
      const json = await res.json();
      return json.data || [];
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; slug?: string; displayOrder?: number; status?: string }) => {
      const res = await fetch('/api/v1/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.message || 'Gagal menambahkan kategori');
      return json;
    },
    onSuccess: (data) => {
      onNotify?.(data.message || 'Kategori baru berhasil ditambahkan.');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['public-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsAddModalOpen(false);
    },
    onError: (err: Error) => {
      onNotify?.(`Gagal: ${err.message}`);
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, any> }) => {
      const res = await fetch(`/api/v1/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.message || 'Gagal memperbarui kategori');
      return json;
    },
    onSuccess: (data) => {
      onNotify?.(data.message || 'Kategori berhasil diperbarui.');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['public-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsAddModalOpen(false);
      setEditingCategory(null);
    },
    onError: (err: Error) => {
      onNotify?.(`Gagal: ${err.message}`);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/admin/categories/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.message || 'Gagal menghapus kategori');
      return json;
    },
    onSuccess: (data) => {
      onNotify?.(data.message || 'Kategori berhasil dihapus.');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['public-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDeletingCategory(null);
    },
    onError: (err: Error) => {
      onNotify?.(`Gagal: ${err.message}`);
    },
  });

  const handleOpenAdd = () => {
    setFormName('');
    setFormSlug('');
    setFormOrder(categories.length + 1);
    setFormStatus('active');
    setEditingCategory(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormOrder(cat.displayOrder);
    setFormStatus(cat.status);
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        payload: {
          name: formName.trim(),
          slug: formSlug.trim() || undefined,
          displayOrder: Number(formOrder),
          status: formStatus,
        },
      });
    } else {
      createMutation.mutate({
        name: formName.trim(),
        slug: formSlug.trim() || undefined,
        displayOrder: Number(formOrder),
        status: formStatus,
      });
    }
  };

  const toggleStatus = (cat: CategoryItem) => {
    const nextStatus = cat.status === 'active' ? 'inactive' : 'active';
    updateMutation.mutate({
      id: cat.id,
      payload: { status: nextStatus },
    });
  };

  const handleDeleteConfirm = () => {
    if (!deletingCategory) return;
    deleteMutation.mutate(deletingCategory.id);
  };

  const filteredCategories = categories
    .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.slug.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const totalProductsAll = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);
  const totalActiveAll = categories.reduce((sum, c) => sum + (c.activeCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Taksonomi Produk
            </span>
            <span className="text-xs text-foreground-muted font-mono">
              {categories.length} Kategori Terdaftar · {totalProductsAll} Total Produk ({totalActiveAll} Aktif)
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            Manajemen Kategori Layanan Asterra Store
          </h2>
          <p className="text-xs text-foreground-muted mt-1">
            Atur urutan hierarki tampil kategori pada etalase toko publik, status publikasi, dan distribusi produk digital.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs h-9 px-3 rounded-xl border-border font-semibold gap-1.5"
            title="Muat ulang data kategori dari database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button size="sm" onClick={handleOpenAdd} className="text-xs gap-1.5 shadow-xs rounded-xl h-9 font-semibold">
            <Plus className="w-4 h-4" />
            <span>Tambah Kategori Baru</span>
          </Button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari nama kategori atau slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs bg-surface-raised border-border rounded-xl h-10"
          />
        </div>
        <div className="text-xs text-foreground-muted font-mono">
          Urutan tampil berdasarkan nomor prioritas display order
        </div>
      </div>

      {/* 3. Categories Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-foreground-muted animate-pulse">
            Memuat daftar kategori langsung dari database Supabase...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center text-xs text-foreground-muted">
            {searchQuery ? `Tidak ada kategori yang cocok dengan "${searchQuery}".` : 'Belum ada kategori yang terdaftar.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-raised border-b border-border text-foreground-muted text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4 w-16 text-center font-semibold">Urutan</th>
                  <th className="py-3 px-4 font-semibold">Nama Kategori</th>
                  <th className="py-3 px-4 font-semibold">Slug URL</th>
                  <th className="py-3 px-4 text-center font-semibold">Total Produk</th>
                  <th className="py-3 px-4 text-center font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Tanggal Dibuat</th>
                  <th className="py-3 px-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-surface-raised/60 transition-colors">
                    <td className="py-3.5 px-4 text-center">
                      <span className="w-7 h-7 rounded-xl bg-surface-raised border border-border font-mono font-bold text-xs inline-flex items-center justify-center text-foreground">
                        #{cat.displayOrder}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-foreground text-xs">{cat.name}</div>
                      <span className="text-[10px] text-foreground-muted font-mono">{cat.id}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-foreground-muted">
                      /{cat.slug}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="font-bold text-foreground">{cat.productCount} item</span>
                      <span className="text-[10px] text-emerald-600 block font-sans font-medium">
                        ({cat.activeCount} aktif di etalase)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleStatus(cat)}
                        disabled={updateMutation.isPending}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${
                          cat.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100'
                            : 'bg-surface-raised text-foreground-muted border-border hover:bg-border'
                        }`}
                        title="Klik untuk mengubah status aktif / nonaktif"
                      >
                        {cat.status === 'active' ? '✓ Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-foreground-muted text-[11px] font-mono">
                      {cat.createdAt
                        ? new Date(cat.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onFilterCategoryInProducts && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onFilterCategoryInProducts(cat.name)}
                            className="h-8 px-2.5 text-xs text-foreground-muted hover:text-primary rounded-xl font-medium gap-1"
                            title="Buka katalog produk dan filter berdasarkan kategori ini"
                          >
                            <Layers className="w-3.5 h-3.5 text-primary" />
                            <span>Lihat Produk</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(cat)}
                          className="h-8 px-2.5 text-xs border-border rounded-xl font-semibold"
                        >
                          <Edit className="w-3 h-3 text-primary mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingCategory(cat)}
                          className="h-8 px-2.5 text-xs border-border rounded-xl text-rose-600 hover:bg-rose-50 hover:border-rose-200/60"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Modal Add / Edit Category */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md max-h-[calc(100dvh-40px)] flex flex-col shadow-2xl overflow-hidden box-border animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="shrink-0 px-5 py-3.5 border-b border-[#E2E8F0] bg-white flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-[#0F172A]">
                  {editingCategory ? 'Edit Kategori Layanan' : 'Tambah Kategori Baru'}
                </h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  {editingCategory ? 'Perbarui informasi dan status kategori katalog' : 'Tentukan nama dan urutan kategori etalase'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="h-8 w-8 p-0 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] shrink-0 cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs bg-[#F8FAFC]">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">
                    Nama Kategori *
                  </label>
                  <Input
                    required
                    placeholder="Contoh: AI Tools, Apps & Streaming..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="bg-white border-[#E2E8F0] text-xs rounded-lg h-9 text-[#0F172A] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">
                    Slug URL (Opsional)
                  </label>
                  <Input
                    placeholder="Otomatis dibuat jika kosong (contoh: ai-tools)"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="bg-white border-[#E2E8F0] text-xs font-mono rounded-lg h-9 text-[#0F172A] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">
                      Urutan (Order)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      required
                      value={formOrder}
                      onChange={(e) => setFormOrder(Number(e.target.value))}
                      className="bg-white border-[#E2E8F0] text-xs font-bold rounded-lg h-9 text-[#0F172A] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">
                      Status Publikasi
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                      className="w-full bg-white border border-[#E2E8F0] text-xs rounded-lg h-9 px-3 text-[#0F172A] font-medium focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    >
                      <option value="active">✓ Aktif</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 sm:px-5 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs h-8 px-3.5 border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] rounded-lg cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="text-xs gap-1.5 h-8 px-4 font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs rounded-lg cursor-pointer disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Menyimpan...'
                  : editingCategory
                  ? 'Simpan Perubahan'
                  : 'Buat Kategori'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Konfirmasi Hapus */}
      {deletingCategory && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingCategory(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md max-h-[calc(100dvh-40px)] flex flex-col shadow-2xl overflow-hidden box-border animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="shrink-0 px-5 py-3.5 border-b border-[#E2E8F0] bg-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-bold text-[#0F172A]">Hapus Kategori</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeletingCategory(null)}
                className="h-8 w-8 p-0 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] shrink-0 cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs bg-[#F8FAFC]">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
                {deletingCategory.productCount > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[#0F172A] leading-relaxed">
                      Kategori <strong>{deletingCategory.name}</strong> masih memiliki{' '}
                      <strong className="text-rose-600 font-mono">{deletingCategory.productCount} produk terkait</strong> ({deletingCategory.activeCount} aktif di etalase).
                    </p>
                    <p className="text-amber-700 bg-amber-50 border border-amber-200/60 p-3 rounded-lg text-[11px] leading-relaxed">
                      Sistem keamanan Asterra melindungi data produk Anda. Harap ubah kategori produk-produk tersebut ke kategori lain sebelum menghapus kategori ini.
                    </p>
                  </div>
                ) : (
                  <p className="text-[#64748B] leading-relaxed">
                    Apakah Anda yakin ingin menghapus kategori <strong className="text-[#0F172A]">{deletingCategory.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 sm:px-5 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingCategory(null)}
                className="text-xs h-8 px-3.5 border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] rounded-lg cursor-pointer"
              >
                Batal
              </Button>
              {deletingCategory.productCount === 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={handleDeleteConfirm}
                  className="text-xs h-8 px-4 font-semibold rounded-lg cursor-pointer bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus Kategori'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
