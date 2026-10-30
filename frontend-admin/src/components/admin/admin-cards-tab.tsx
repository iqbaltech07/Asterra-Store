'use client';

import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Eye,
  EyeOff,
  Layers,
  RefreshCw,
  X,
  Package,
  ExternalLink,
  Sliders,
  Sparkles,
  ArrowUpDown,
  Tag,
  Boxes,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export interface CardItem {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  imageUrl?: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  category?: { id: string; name: string };
  status: 'active' | 'archived' | 'inactive';
  displayOrder: number;
  isFeatured: boolean;
  sections: string[];
  rating: string;
  badgeLabel?: string;
  minPrice: number;
  minPriceFormatted: string;
  stockStatus: 'ready' | 'out_of_stock';
  isOutOfStock: boolean;
  catalogCount: number;
  activeCatalogCount: number;
  soldCount: number;
  catalogs?: any[];
  attributes?: any[];
  variants?: any[];
  createdAt?: string;
  updatedAt?: string;
}

interface AdminCardsTabProps {
  onNotify?: (msg: string) => void;
  onNavigateToCatalog?: (cardId: string) => void;
}

export function AdminCardsTab({ onNotify, onNavigateToCatalog }: AdminCardsTabProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardItem | null>(null);
  const [deletingCard, setDeletingCard] = useState<CardItem | null>(null);
  const [managingAttrsCard, setManagingAttrsCard] = useState<CardItem | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formLogo, setFormLogo] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCatName, setFormCatName] = useState('Layanan Digital');
  const [formOrder, setFormOrder] = useState(0);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formSections, setFormSections] = useState<string[]>(['promo']);
  const [formBadge, setFormBadge] = useState('🔥 Promo');

  // Attribute Management State
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrOptions, setNewAttrOptions] = useState('');

  // Fetch Cards
  const { data: cards = [], isLoading, isFetching, refetch } = useQuery<CardItem[]>({
    queryKey: ['admin-cards'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/cards');
      if (!res.ok) throw new Error('Gagal mengambil data Card Produk.');
      const json = await res.json();
      return json.data || [];
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  // Filter cards
  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (sectionFilter !== 'all' && !c.sections?.includes(sectionFilter)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchSlug = c.slug?.toLowerCase().includes(q);
        const matchCat = c.categoryName?.toLowerCase().includes(q);
        if (!matchName && !matchSlug && !matchCat) return false;
      }
      return true;
    });
  }, [cards, statusFilter, sectionFilter, searchQuery]);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const res = await fetch('/api/v1/admin/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.message || 'Gagal membuat Card Produk.');
      return json;
    },
    onSuccess: (data) => {
      onNotify?.(data.message || 'Card Produk baru berhasil dibuat.');
      queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      onNotify?.(`Gagal: ${err.message}`);
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, any> }) => {
      const res = await fetch(`/api/v1/admin/cards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.message || 'Gagal memperbarui Card Produk.');
      return json;
    },
    onSuccess: (data) => {
      onNotify?.(data.message || 'Card Produk berhasil diperbarui.');
      queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
      setEditingCard(null);
      resetForm();
    },
    onError: (err: Error) => {
      onNotify?.(`Gagal: ${err.message}`);
    },
  });

  // Toggle Status Mutation
  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/admin/cards/${id}/toggle-status`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.message || 'Gagal mengubah status.');
      return json;
    },
    onSuccess: (data) => {
      onNotify?.(data.message || 'Status Card Produk berhasil diubah.');
      queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
    },
    onError: (err: Error) => {
      onNotify?.(`Gagal: ${err.message}`);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/admin/cards/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.message || 'Gagal menghapus Card Produk.');
      return json;
    },
    onSuccess: (data) => {
      onNotify?.(data.message || 'Card Produk berhasil dihapus.');
      queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
      setDeletingCard(null);
    },
    onError: (err: Error) => {
      onNotify?.(`Gagal: ${err.message}`);
    },
  });

  // Add Attribute Mutation
  const addAttrMutation = useMutation({
    mutationFn: async ({ cardId, name, options }: { cardId: string; name: string; options: string[] }) => {
      const res = await fetch(`/api/v1/admin/cards/${cardId}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, options, isRequired: true, isActive: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || 'Gagal menyimpan atribut.');
      return json;
    },
    onSuccess: () => {
      onNotify?.('Atribut dinamis berhasil ditambahkan.');
      queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
      setNewAttrName('');
      setNewAttrOptions('');
    },
    onError: (err: Error) => {
      onNotify?.(`Gagal: ${err.message}`);
    },
  });

  // Delete Attribute Mutation
  const deleteAttrMutation = useMutation({
    mutationFn: async ({ cardId, attrId }: { cardId: string; attrId: string }) => {
      const res = await fetch(`/api/v1/admin/cards/${cardId}/attributes/${attrId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || 'Gagal menghapus atribut.');
      return json;
    },
    onSuccess: () => {
      onNotify?.('Atribut berhasil dihapus.');
      queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
    },
  });

  const resetForm = () => {
    setFormName('');
    setFormSlug('');
    setFormLogo('');
    setFormDesc('');
    setFormCatName('Layanan Digital');
    setFormOrder(0);
    setFormFeatured(false);
    setFormSections(['promo']);
    setFormBadge('🔥 Promo');
  };

  const handleOpenEdit = (c: CardItem) => {
    setEditingCard(c);
    setFormName(c.name);
    setFormSlug(c.slug);
    setFormLogo(c.logoUrl || c.imageUrl || '');
    setFormDesc(c.description || '');
    setFormCatName(c.categoryName || 'Layanan Digital');
    setFormOrder(c.displayOrder || 0);
    setFormFeatured(c.isFeatured || false);
    setFormSections(c.sections || ['promo']);
    setFormBadge(c.badgeLabel || '');
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      onNotify?.('Nama Card Produk tidak boleh kosong.');
      return;
    }

    const payload = {
      name: formName.trim(),
      slug: formSlug.trim() || undefined,
      logoUrl: formLogo.trim() || undefined,
      description: formDesc.trim() || undefined,
      categoryName: formCatName.trim(),
      displayOrder: formOrder,
      isFeatured: formFeatured,
      sections: formSections,
      badgeLabel: formBadge.trim() || undefined,
    };

    if (editingCard) {
      updateMutation.mutate({ id: editingCard.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleSectionChoice = (sec: string) => {
    setFormSections((prev) =>
      prev.includes(sec) ? prev.filter((s) => s !== sec) : [...prev, sec]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface border border-border rounded-xl p-4 sm:p-5">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Boxes className="w-5 h-5 text-primary" />
            Manajemen Card Produk (Etalase Utama)
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Card Produk adalah kartu layanan utama di homepage. Satu card menaungi banyak penawaran Katalog Produk & varian harga.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs gap-1.5 h-8 border-border"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Sinkronkan</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="text-xs gap-1.5 h-8 bg-primary text-white hover:bg-primary/90"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Card Baru</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-xs text-foreground-muted">Total Card Produk</span>
          <span className="text-xl font-black text-foreground mt-1">{cards.length}</span>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-xs text-foreground-muted">Card Aktif</span>
          <span className="text-xl font-black text-emerald-600 mt-1">
            {cards.filter((c) => c.status === 'active').length}
          </span>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-xs text-foreground-muted">Total Katalog Terhubung</span>
          <span className="text-xl font-black text-primary mt-1">
            {cards.reduce((acc, c) => acc + (c.catalogCount || 0), 0)}
          </span>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-xs text-foreground-muted">Penjualan Unit Riil</span>
          <span className="text-xl font-black text-foreground mt-1">
            {cards.reduce((acc, c) => acc + (c.soldCount || 0), 0)} unit
          </span>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-foreground text-background'
                : 'bg-surface border border-border text-foreground-muted hover:text-foreground'
            }`}
          >
            Semua ({cards.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white'
                : 'bg-surface border border-border text-foreground-muted hover:text-foreground'
            }`}
          >
            Aktif ({cards.filter((c) => c.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'archived'
                ? 'bg-amber-600 text-white'
                : 'bg-surface border border-border text-foreground-muted hover:text-foreground'
            }`}
          >
            Arsip ({cards.filter((c) => c.status === 'archived').length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama card, slug..."
            className="pl-8 text-xs h-8 bg-surface border-border"
          />
        </div>
      </div>

      {/* Cards Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-foreground-muted animate-pulse">
            Memuat daftar Card Produk dari database...
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Boxes className="w-8 h-8 text-foreground-muted/40 mx-auto" />
            <p className="text-xs text-foreground-muted">Tidak ada Card Produk yang cocok.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-raised/40 text-foreground-muted uppercase tracking-wider text-[10px] font-semibold">
                  <th className="py-3 px-4">Urutan & Card</th>
                  <th className="py-3 px-4">Kategori & Badge</th>
                  <th className="py-3 px-4">Harga Terendah</th>
                  <th className="py-3 px-4">Stok Etalase</th>
                  <th className="py-3 px-4">Katalog Terhubung</th>
                  <th className="py-3 px-4">Penjualan Riil</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-surface-raised/30 transition-colors">
                    {/* Card Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono text-foreground-muted w-5 shrink-0">
                          #{card.displayOrder}
                        </span>
                        {card.logoUrl ? (
                          <img
                            src={card.logoUrl}
                            alt={card.name}
                            className="w-8 h-8 rounded-full object-contain bg-white border border-border shrink-0 p-1"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {card.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-foreground block truncate max-w-[160px]">
                            {card.name}
                          </span>
                          <span className="text-[10px] text-foreground-muted font-mono block">
                            /{card.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category & Sections */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-foreground block">
                          {card.categoryName || 'Layanan Digital'}
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {card.sections?.map((sec) => (
                            <span
                              key={sec}
                              className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary/10 text-primary uppercase"
                            >
                              {sec}
                            </span>
                          ))}
                          {card.badgeLabel && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600">
                              {card.badgeLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Price Aggregation */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-foreground">
                        {card.minPrice > 0 ? card.minPriceFormatted : '-'}
                      </span>
                      <span className="text-[10px] text-foreground-muted block">harga terendah</span>
                    </td>

                    {/* Stock Status */}
                    <td className="py-3 px-4">
                      {card.stockStatus === 'ready' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          Stok Habis
                        </span>
                      )}
                    </td>

                    {/* Connected Catalogs */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs">
                          {card.catalogCount} Katalog
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onNavigateToCatalog?.(card.id)}
                          title="Kelola Katalog Terhubung"
                          className="w-6 h-6 text-foreground-muted hover:text-primary"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>

                    {/* Real Unit Sold Count */}
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      {card.soldCount} unit
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleMutation.mutate(card.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                          card.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25'
                            : 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/25'
                        }`}
                      >
                        {card.status === 'active' ? 'Aktif' : 'Arsip'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setManagingAttrsCard(card)}
                          title="Kelola Atribut & Varian Dinamis"
                          className="w-7 h-7 text-foreground-muted hover:text-primary"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenEdit(card)}
                          title="Edit Card Produk"
                          className="w-7 h-7 text-foreground-muted hover:text-foreground"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingCard(card)}
                          title="Hapus Card Produk"
                          className="w-7 h-7 text-foreground-muted hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* ADD / EDIT MODAL */}
      {(isAddModalOpen || editingCard) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Boxes className="w-4 h-4 text-primary" />
                {editingCard ? 'Edit Card Produk' : 'Tambah Card Produk Baru'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCard(null);
                }}
                className="text-foreground-muted hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Nama Produk <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingCard) {
                      setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
                    }
                  }}
                  placeholder="Contoh: Google Gemini, Canva, Netflix"
                  className="text-xs h-9 bg-surface-raised/40"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    Slug URL <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="google-gemini"
                    className="text-xs h-9 bg-surface-raised/40 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    Urutan Tampilan
                  </label>
                  <Input
                    type="number"
                    value={formOrder}
                    onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)}
                    className="text-xs h-9 bg-surface-raised/40"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  URL Logo Produk (Brand Icon)
                </label>
                <Input
                  value={formLogo}
                  onChange={(e) => setFormLogo(e.target.value)}
                  placeholder="/images/brand/Google-logo.png atau URL HTTPS"
                  className="text-xs h-9 bg-surface-raised/40"
                />
                <p className="text-[10px] text-foreground-muted mt-1">
                  Gunakan icon brand resmi yang tersimpan di sistem (/images/brand/... atau /images/apps/...).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    Kategori Tampilan
                  </label>
                  <Input
                    value={formCatName}
                    onChange={(e) => setFormCatName(e.target.value)}
                    placeholder="AI Tools, Apps & Streaming, dll"
                    className="text-xs h-9 bg-surface-raised/40"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    Badge Khusus (Opsional)
                  </label>
                  <Input
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="🔥 Promo, Terlaris, Baru"
                    className="text-xs h-9 bg-surface-raised/40"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  placeholder="Penjelasan ringkas mengenai benefit dan jenis lisensi produk..."
                  className="w-full rounded-lg border border-border bg-surface-raised/40 p-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1.5">
                  Tampilkan Pada Bagian Etalase Homepage:
                </label>
                <div className="flex items-center gap-3">
                  {['promo', 'terlaris', 'terbaru'].map((sec) => (
                    <label key={sec} className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formSections.includes(sec)}
                        onChange={() => toggleSectionChoice(sec)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="capitalize">{sec}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCard(null);
                  }}
                  className="text-xs h-9 border-border"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="text-xs h-9 bg-primary text-white hover:bg-primary/90"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Card Produk'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DYNAMIC ATTRIBUTES & VARIANTS MODAL */}
      {managingAttrsCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  Atribut Dinamis: {managingAttrsCard.name}
                </h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Atur opsi pilihan (Paket, Tipe Akun, Durasi, Garansi, Region, dsb) untuk card ini.
                </p>
              </div>
              <button
                onClick={() => setManagingAttrsCard(null)}
                className="text-foreground-muted hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List Attributes */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                Daftar Atribut Pilihan
              </h4>
              {managingAttrsCard.attributes && managingAttrsCard.attributes.length > 0 ? (
                <div className="space-y-2">
                  {managingAttrsCard.attributes.map((attr) => (
                    <div
                      key={attr.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-raised/40 border border-border text-xs"
                    >
                      <div>
                        <span className="font-bold text-foreground block">{attr.name}</span>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {attr.options?.length > 0 ? (
                            attr.options.map((opt: string) => (
                              <span
                                key={opt}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-surface border border-border text-foreground font-mono"
                              >
                                {opt}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-foreground-muted italic">
                              (Mengikuti variasi katalog yang terhubung)
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          deleteAttrMutation.mutate({ cardId: managingAttrsCard.id, attrId: attr.id })
                        }
                        title="Hapus Atribut"
                        className="w-7 h-7 text-foreground-muted hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center rounded-xl bg-surface-raised/20 border border-border text-xs text-foreground-muted">
                  Belum ada atribut kustom. Atribut default sistem akan diterapkan secara otomatis.
                </div>
              )}
            </div>

            {/* Form Add New Attribute */}
            <div className="border-t border-border pt-4 space-y-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-primary" />
                Tambah Atribut Baru
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    Nama Atribut (e.g. Region, Platform, Jenis Lisensi)
                  </label>
                  <Input
                    value={newAttrName}
                    onChange={(e) => setNewAttrName(e.target.value)}
                    placeholder="Nama Atribut"
                    className="text-xs h-9 bg-surface-raised/40"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    Opsi Pilihan (Pisahkan dengan koma)
                  </label>
                  <Input
                    value={newAttrOptions}
                    onChange={(e) => setNewAttrOptions(e.target.value)}
                    placeholder="Contoh: Global, Indonesia, Asia"
                    className="text-xs h-9 bg-surface-raised/40"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  onClick={() => {
                    if (!newAttrName.trim()) {
                      onNotify?.('Nama atribut tidak boleh kosong.');
                      return;
                    }
                    const opts = newAttrOptions
                      .split(',')
                      .map((o) => o.trim())
                      .filter(Boolean);
                    addAttrMutation.mutate({
                      cardId: managingAttrsCard.id,
                      name: newAttrName.trim(),
                      options: opts,
                    });
                  }}
                  disabled={addAttrMutation.isPending}
                  className="text-xs h-8 bg-primary text-white hover:bg-primary/90"
                >
                  {addAttrMutation.isPending ? 'Menyimpan...' : 'Tambah Atribut'}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setManagingAttrsCard(null)}
                className="text-xs h-8 border-border"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-foreground">Hapus Card Produk?</h3>
            </div>

            <p className="text-xs text-foreground-muted leading-relaxed">
              Anda akan menghapus Card Produk <strong className="text-foreground">{deletingCard.name}</strong>.
              Seluruh Katalog Produk yang terhubung ({deletingCard.catalogCount} item) akan dialihkan menjadi katalog mandiri tanpa merusak riwayat transaksi yang ada.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingCard(null)}
                className="text-xs h-8 border-border"
              >
                Batal
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteMutation.mutate(deletingCard.id)}
                disabled={deleteMutation.isPending}
                className="text-xs h-8 bg-destructive text-white hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus Card'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
