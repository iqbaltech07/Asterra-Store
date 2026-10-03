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
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  activeCount: number;
  displayOrder: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 'cat-ai', name: 'AI Tools & Productivity', slug: 'ai-tools', productCount: 48, activeCount: 42, displayOrder: 1, status: 'active', createdAt: '10 Ags 2026' },
  { id: 'cat-stream', name: 'Streaming & Hiburan', slug: 'streaming', productCount: 62, activeCount: 58, displayOrder: 2, status: 'active', createdAt: '10 Ags 2026' },
  { id: 'cat-design', name: 'Desain & Grafis', slug: 'desain-grafis', productCount: 42, activeCount: 39, displayOrder: 3, status: 'active', createdAt: '12 Ags 2026' },
  { id: 'cat-cloud', name: 'Cloud & Penyimpanan', slug: 'cloud-storage', productCount: 35, activeCount: 30, displayOrder: 4, status: 'active', createdAt: '15 Ags 2026' },
  { id: 'cat-vpn', name: 'VPN & Keamanan', slug: 'vpn-security', productCount: 28, activeCount: 24, displayOrder: 5, status: 'active', createdAt: '20 Ags 2026' },
  { id: 'cat-other', name: 'Layanan Digital Lainnya', slug: 'lainnya', productCount: 21, activeCount: 18, displayOrder: 6, status: 'active', createdAt: '22 Ags 2026' },
];

interface AdminCategoriesTabProps {
  onNotify?: (msg: string) => void;
  onFilterCategoryInProducts?: (catName: string) => void;
}

export function AdminCategoriesTab({ onNotify, onFilterCategoryInProducts }: AdminCategoriesTabProps) {
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formOrder, setFormOrder] = useState(1);

  const handleOpenAdd = () => {
    setFormName('');
    setFormSlug('');
    setFormOrder(categories.length + 1);
    setEditingCategory(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormOrder(cat.displayOrder);
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    if (editingCategory) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? {
                ...c,
                name: formName,
                slug: formSlug || formName.toLowerCase().replace(/\s+/g, '-'),
                displayOrder: Number(formOrder),
              }
            : c
        )
      );
      onNotify?.(`Kategori "${formName}" berhasil diperbarui.`);
    } else {
      const newCat: CategoryItem = {
        id: `cat-${Date.now()}`,
        name: formName,
        slug: formSlug || formName.toLowerCase().replace(/\s+/g, '-'),
        productCount: 0,
        activeCount: 0,
        displayOrder: Number(formOrder),
        status: 'active',
        createdAt: 'Baru saja',
      };
      setCategories([...categories, newCat]);
      onNotify?.(`Kategori baru "${formName}" berhasil ditambahkan.`);
    }
    setIsAddModalOpen(false);
  };

  const toggleStatus = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const newStatus = c.status === 'active' ? 'inactive' : 'active';
          onNotify?.(`Status kategori "${c.name}" diubah ke ${newStatus === 'active' ? 'Aktif' : 'Nonaktif'}.`);
          return { ...c, status: newStatus };
        }
        return c;
      })
    );
  };

  const handleDeleteConfirm = () => {
    if (!deletingCategory) return;
    setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
    onNotify?.(`Kategori "${deletingCategory.name}" telah dihapus.`);
    setDeletingCategory(null);
  };

  const filteredCategories = categories
    .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
              Taksonomi Produk
            </span>
            <span className="text-[11px] text-foreground-muted">
              {categories.length} Kategori Terdaftar
            </span>
          </div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Manajemen Kategori Layanan Asterra Store
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Atur urutan hierarki tampil kategori pada etalase toko publik, status publikasi, dan distribusi produk digital.
          </p>
        </div>

        <Button size="sm" onClick={handleOpenAdd} className="text-xs gap-1.5 shadow-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Kategori Baru</span>
        </Button>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari nama kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs bg-surface-raised border-border"
          />
        </div>
        <div className="text-xs text-foreground-muted">
          Urutan tampil berdasarkan nomor prioritas display order
        </div>
      </div>

      {/* 3. Categories Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised/80 border-b border-border text-foreground-muted text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Urutan</th>
                <th className="py-3 px-4">Nama Kategori</th>
                <th className="py-3 px-4">Slug URL</th>
                <th className="py-3 px-4 text-center">Total Produk</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Tanggal Dibuat</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-surface-raised/40 transition-colors">
                  <td className="py-3.5 px-4 text-center">
                    <span className="w-7 h-7 rounded-lg bg-surface-raised border border-border font-mono font-bold text-xs inline-flex items-center justify-center text-foreground">
                      #{cat.displayOrder}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-foreground text-xs">{cat.name}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-foreground-muted">
                    /{cat.slug}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-bold text-foreground">{cat.productCount} item</span>
                    <span className="text-[10px] text-foreground-muted block">
                      ({cat.activeCount} aktif di etalase)
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => toggleStatus(cat.id)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${
                        cat.status === 'active'
                          ? 'bg-status-success/15 text-status-success border-status-success/30'
                          : 'bg-surface-raised text-foreground-muted border-border'
                      }`}
                    >
                      {cat.status === 'active' ? '✓ Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-foreground-muted text-[11px]">
                    {cat.createdAt}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(cat)}
                        className="h-7 px-2 text-xs border-border"
                      >
                        <Edit className="w-3 h-3 text-primary mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeletingCategory(cat)}
                        className="h-7 px-2 text-xs border-border text-status-error hover:bg-status-error/10 hover:border-status-error/30"
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
      </div>

      {/* 4. Modal Add / Edit Category */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground">
                {editingCategory ? 'Edit Kategori Layanan' : 'Tambah Kategori Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-foreground-muted hover:text-foreground p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Nama Kategori</label>
                <Input
                  required
                  placeholder="Contoh: AI Tools & Productivity"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="bg-surface-raised border-border text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Slug URL</label>
                <Input
                  placeholder="Contoh: ai-tools"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="bg-surface-raised border-border text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Nomor Urutan Tampil (Display Order)</label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={formOrder}
                  onChange={(e) => setFormOrder(Number(e.target.value))}
                  className="bg-surface-raised border-border text-xs font-bold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" size="sm">
                  {editingCategory ? 'Simpan Perubahan' : 'Buat Kategori'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Konfirmasi Hapus Kategori dengan Proteksi */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border rounded-xl w-full max-w-sm shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-status-error">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-foreground">Hapus Kategori</h3>
            </div>

            {deletingCategory.productCount > 0 ? (
              <div className="space-y-2">
                <p className="text-foreground">
                  Kategori <strong>{deletingCategory.name}</strong> masih memiliki{' '}
                  <strong className="text-status-error">{deletingCategory.productCount} produk terkait</strong>.
                </p>
                <p className="text-foreground-muted text-[11px]">
                  Menghapus kategori ini akan memindahkan produk-produk tersebut ke kategori &quot;Layanan Digital Lainnya&quot;. Apakah Anda yakin ingin melanjutkan?
                </p>
              </div>
            ) : (
              <p className="text-foreground-muted">
                Apakah Anda yakin ingin menghapus kategori <strong>{deletingCategory.name}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingCategory(null)}
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleDeleteConfirm}
              >
                Ya, Hapus Kategori
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
