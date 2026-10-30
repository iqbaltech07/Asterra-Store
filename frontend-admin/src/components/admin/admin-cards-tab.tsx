'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Search,
  RefreshCw,
  X,
  Sliders,
  Boxes,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BrandLogoSelector } from '@/components/admin/brand-logo-selector';
import { AdminModalPortal } from '@/components/admin/admin-modal-portal';
import { ProductBrandIcon } from '@/components/ui/product-brand-icon';

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
  orderSoldCount?: number;
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

function getAdminAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('asterra_admin_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

  // Form states (Simplified: Nama Group, Logo Icon, Status Switch)
  const [formName, setFormName] = useState('');
  const [formLogo, setFormLogo] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'archived'>('active');
  // Smart automated defaults for backend compatibility
  const [formSlug, setFormSlug] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCatId, setFormCatId] = useState('cat-apps-streaming');
  const [formCatName, setFormCatName] = useState('Apps & Streaming');
  const [formOrder, setFormOrder] = useState(0);
  const [formFeatured, setFormFeatured] = useState(true);
  const [formSections, setFormSections] = useState<string[]>(['promo', 'terlaris', 'terbaru']);
  const [formBadge, setFormBadge] = useState('🔥 Promo');

  // Attribute Management State
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrOptions, setNewAttrOptions] = useState('');

  // Fetch Product Groups with Bearer auth headers
  const { data: cards = [], isLoading, isFetching, refetch } = useQuery<CardItem[]>({
    queryKey: ['admin-cards'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/cards', {
        headers: getAdminAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || errJson.error || 'Gagal mengambil data Product Group.');
      }
      const json = await res.json();
      return json.data || [];
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch real categories for Product Groups
  const { data: categoriesData } = useQuery<{ success?: boolean; data?: { id: string; name: string; slug: string }[] } | { id: string; name: string; slug: string }[]>({
    queryKey: ['public-categories'],
    queryFn: async () => {
      const res = await fetch('/api/v1/categories');
      if (!res.ok) return { success: false, data: [] };
      return res.json().catch(() => ({ success: false, data: [] }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const publicCategories: { id: string; name: string; slug: string }[] = useMemo(() => {
    if (Array.isArray(categoriesData)) return categoriesData;
    if (categoriesData && Array.isArray((categoriesData as any).data)) return (categoriesData as any).data;
    return [];
  }, [categoriesData]);

  // Filter groups
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
        headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || json.message || 'Gagal membuat Product Group.');
      return json;
    },
    onSuccess: (data) => {
      onNotify?.(data.message || 'Product Group baru berhasil dibuat.');
      queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
      queryClient.invalidateQueries({ queryKey: ['admin-cards-list'] });
      queryClient.invalidateQueries({ queryKey: ['public-cards'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] });
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
        headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || json.message || 'Gagal memperbarui Product Group.');
      return json;
    },
    onSuccess: (data) => {
      onNotify?.(data.message || 'Product Group berhasil diperbarui.');
      queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
      queryClient.invalidateQueries({ queryKey: ['admin-cards-list'] });
      queryClient.invalidateQueries({ queryKey: ['public-cards'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] });
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
      const res = await fetch(`/api/v1/admin/cards/${id}/toggle-status`, {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || json.message || 'Gagal mengubah status.');
      return json;
    },
    onSuccess: (data) => {
      onNotify?.(data.message || 'Status Product Group berhasil diubah.');
      queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
      queryClient.invalidateQueries({ queryKey: ['admin-cards-list'] });
      queryClient.invalidateQueries({ queryKey: ['public-cards'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] });
    },
    onError: (err: Error) => {
      onNotify?.(`Gagal: ${err.message}`);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/admin/cards/${id}`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders(),
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || json.message || 'Gagal menghapus Product Group.');
      return json;
    },
    onSuccess: (data) => {
      onNotify?.(data.message || 'Product Group berhasil dihapus.');
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
        headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ name, options, isRequired: true, isActive: true }),
      });
      const json = await res.json().catch(() => ({}));
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
      onNotify?.(`Gagal menambah atribut: ${err.message}`);
    },
  });

  // Delete Attribute Mutation
  const deleteAttrMutation = useMutation({
    mutationFn: async ({ cardId, attrId }: { cardId: string; attrId: string }) => {
      const res = await fetch(`/api/v1/admin/cards/${cardId}/attributes/${attrId}`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders(),
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || 'Gagal menghapus atribut.');
      return json;
    },
    onSuccess: () => {
      onNotify?.('Atribut berhasil dihapus.');
      queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
    },
    onError: (err: Error) => {
      onNotify?.(`Gagal menghapus atribut: ${err.message}`);
    },
  });

  const resetForm = () => {
    setFormName('');
    setFormSlug('');
    setFormLogo('');
    setFormDesc('');
    setFormStatus('active');
    const firstCat = publicCategories[0]?.name || 'Apps & Streaming';
    const firstCatId = publicCategories[0]?.id || 'cat-apps-streaming';
    setFormCatName(firstCat);
    setFormCatId(firstCatId);
    setFormOrder(cards.length + 1);
    setFormFeatured(true);
    setFormSections(['promo', 'terlaris', 'terbaru']);
    setFormBadge('🔥 Promo');
  };

  const handleOpenEdit = (c: CardItem) => {
    setEditingCard(c);
    setFormName(c.name);
    setFormSlug(c.slug);
    setFormLogo(c.logoUrl || c.imageUrl || '');
    setFormStatus(c.status === 'archived' ? 'archived' : 'active');
    setFormDesc(c.description || '');
    setFormCatName(c.categoryName || 'Apps & Streaming');
    setFormCatId(c.categoryId || (publicCategories.find((cat) => cat.name.toLowerCase() === (c.categoryName || '').toLowerCase())?.id) || 'cat-apps-streaming');
    setFormOrder(c.displayOrder);
    setFormFeatured(c.isFeatured || false);
    setFormSections(c.sections || ['promo', 'terlaris', 'terbaru']);
    setFormBadge(c.badgeLabel || '');
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      onNotify?.('Product Name / Brand name tidak boleh kosong.');
      return;
    }

    const calculatedSlug = formSlug.trim() || slugify(formName.trim());
    const payload = {
      name: formName.trim(),
      slug: calculatedSlug,
      logoUrl: formLogo.trim() ? formLogo.trim() : null,
      status: formStatus,
      description: formDesc.trim() || `Layanan resmi dan bergaransi untuk ${formName.trim()} di Asterra Store dengan konfirmasi otomatis dan dukungan CS 24 jam.`,
      categoryId: formCatId,
      categoryName: formCatName.trim() || 'Layanan Digital',
      displayOrder: formOrder || (cards.length + 1),
      isFeatured: formFeatured,
      sections: formSections && formSections.length > 0 ? formSections : ['promo', 'terlaris', 'terbaru'],
      badgeLabel: formBadge.trim() ? formBadge.trim() : null,
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <Boxes className="w-5 h-5 text-primary" />
            Manajemen Product Group (Pengelompokan Produk)
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Product Group mengelompokkan katalog produk dan varian layanan ke dalam grup brand resmi di etalase toko.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs gap-1.5 h-8 border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
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
            className="text-xs gap-1.5 h-8 bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Product Group</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 flex flex-col justify-between shadow-2xs">
          <span className="text-xs text-[#64748B]">Total Product Group</span>
          <span className="text-xl font-black text-[#0F172A] mt-1">{cards.length}</span>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 flex flex-col justify-between shadow-2xs">
          <span className="text-xs text-[#64748B]">Group Aktif</span>
          <span className="text-xl font-black text-emerald-600 mt-1">
            {cards.filter((c) => c.status === 'active').length}
          </span>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 flex flex-col justify-between shadow-2xs">
          <span className="text-xs text-[#64748B]">Total Katalog Terhubung</span>
          <span className="text-xl font-black text-primary mt-1">
            {cards.reduce((acc, c) => acc + (c.activeCatalogCount ?? c.catalogCount ?? 0), 0)}
          </span>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 flex flex-col justify-between shadow-2xs">
          <span className="text-xs text-[#64748B]">Penjualan Unit Riil</span>
          <span className="text-xl font-black text-[#0F172A] mt-1">
            {cards.reduce((acc, c) => acc + (c.orderSoldCount !== undefined ? c.orderSoldCount : (c.soldCount || 0)), 0)} unit
          </span>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#0F172A] text-white shadow-xs'
                : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Semua ({cards.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Aktif ({cards.filter((c) => c.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'archived'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Arsip ({cards.filter((c) => c.status === 'archived').length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama group, brand, slug..."
            className="pl-8 text-xs h-8 bg-white border-[#E2E8F0] text-[#0F172A]"
          />
        </div>
      </div>

      {/* Product Groups Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#64748B] animate-pulse">
            Memuat daftar Product Group dari database...
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Boxes className="w-8 h-8 text-[#94A3B8] mx-auto" />
            <p className="text-xs text-[#64748B]">Tidak ada Product Group yang cocok.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] uppercase tracking-wider text-[10px] font-semibold">
                  <th className="py-3 px-4">Urutan & Product Group</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Harga Terendah</th>
                  <th className="py-3 px-4">Stok Etalase</th>
                  <th className="py-3 px-4">Katalog Terhubung</th>
                  <th className="py-3 px-4">Penjualan Riil</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-[#F8FAFC] transition-colors">
                    {/* Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono text-[#64748B] w-5 shrink-0">
                          #{card.displayOrder}
                        </span>
                        <ProductBrandIcon
                          name={card.name}
                          imageUrl={card.logoUrl}
                          className="w-8 h-8 rounded-full border border-[#E2E8F0] shrink-0 p-1 shadow-2xs bg-white"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-[#0F172A] truncate">
                            {card.name}
                          </div>
                          <span className="text-[10px] font-mono text-[#64748B] block truncate">
                            /{card.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="text-[11px] text-[#0F172A] font-medium">
                        {card.categoryName || 'Layanan Digital'}
                      </span>
                    </td>

                    {/* Min Price */}
                    <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">
                      {card.minPrice && card.minPrice > 0 ? (
                        <span>Rp {card.minPrice.toLocaleString('id-ID')}</span>
                      ) : (
                        <span className="text-[#94A3B8] font-normal text-[11px]">Belum ada harga</span>
                      )}
                    </td>

                    {/* Stock Status */}
                    <td className="py-3 px-4">
                      {card.stockStatus === 'ready' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          Ready
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                          Habis
                        </span>
                      )}
                    </td>

                    {/* Connected Catalogs */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onNavigateToCatalog?.(card.id)}
                          className="font-mono font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                          title="Lihat katalog terhubung"
                        >
                          <span>{card.activeCatalogCount ?? card.catalogCount ?? 0} varian</span>
                        </button>
                      </div>
                    </td>

                    {/* Real Units Sold */}
                    <td className="py-3 px-4 font-mono text-[#0F172A]">
                      <span className="font-semibold">{card.orderSoldCount !== undefined ? card.orderSoldCount : (card.soldCount || 0)}</span> unit
                    </td>

                    {/* Status Switch */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={card.status === 'active'}
                          onClick={() => toggleMutation.mutate(card.id)}
                          disabled={toggleMutation.isPending}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
                            card.status === 'active' ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                          title={`Klik untuk mengubah status: ${card.status === 'active' ? 'Non-aktifkan' : 'Aktifkan'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              card.status === 'active' ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-[11px] font-semibold ${card.status === 'active' ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {card.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setManagingAttrsCard(card)}
                          title="Kelola Atribut Dinamis"
                          className="w-7 h-7 text-[#64748B] hover:text-primary cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenEdit(card)}
                          title="Edit Product Group"
                          className="w-7 h-7 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingCard(card)}
                          title="Hapus Product Group"
                          className="w-7 h-7 text-[#64748B] hover:text-rose-600 cursor-pointer"
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

      {/* ADD / EDIT PRODUCT GROUP MODAL (PORTALED TO DOCUMENT.BODY) */}
      {(isAddModalOpen || editingCard) && (
        <AdminModalPortal>
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddModalOpen(false);
              setEditingCard(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-lg max-h-[calc(100dvh-40px)] flex flex-col shadow-2xl overflow-hidden box-border animate-in zoom-in-95 duration-200 text-[#0F172A]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="shrink-0 px-6 py-4 border-b border-[#E2E8F0] bg-white flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-primary" />
                  <span>{editingCard ? 'Edit Product Group' : 'Tambah Product Group Baru'}</span>
                </h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Pengelompokan varian katalog ke dalam satu kartu etalase brand resmi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCard(null);
                }}
                className="h-8 w-8 p-0 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveCard} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Field 1: Product Name / Brand Name */}
              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">
                  Product Name / Brand name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingCard) {
                      setFormSlug(slugify(e.target.value));
                    }
                  }}
                  placeholder="Contoh: Google Gemini, Disney+ Hotstar, Netflix, Canva"
                  className="text-xs h-9 bg-white border-[#CBD5E1] text-[#0F172A] focus:bg-white"
                  required
                />
              </div>

              {/* Field 2: Icon from Brandfetch */}
              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">
                  Icon from Brandfetch <span className="text-destructive">*</span>
                </label>
                <BrandLogoSelector
                  value={formLogo}
                  brandName={formName}
                  productName={formName}
                  onChange={(logoUrl) => {
                    setFormLogo(logoUrl);
                  }}
                />
              </div>

              {/* Field 3: Kategori Product Group */}
              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">
                  Kategori Product Group <span className="text-destructive">*</span>
                </label>
                <select
                  value={formCatId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    setFormCatId(selId);
                    const found = publicCategories.find((cat) => cat.id === selId);
                    if (found) {
                      setFormCatName(found.name);
                    }
                  }}
                  className="w-full bg-white border border-[#CBD5E1] text-xs rounded-lg h-9 px-3 text-[#0F172A] font-medium focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  {(publicCategories || []).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#64748B] mt-1">
                  Menentukan filter kategori untuk kelompok produk ini di etalase toko.
                </p>
              </div>

              {/* Field 4: Status Visibilitas Katalog (Switch Button Aktif / Non-Aktif) */}
              <div className="pt-2 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div>
                    <label className="text-xs font-bold text-[#0F172A] block">
                      Status Group Produk
                    </label>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      {formStatus === 'active'
                        ? 'Aktif — grup produk beserta semua variasinya tampil di katalog user.'
                        : 'Non-Aktif — grup produk beserta seluruh variannya disembunyikan dari user.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${formStatus === 'active' ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {formStatus === 'active' ? 'Aktif' : 'Non-Aktif'}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formStatus === 'active'}
                      onClick={() => setFormStatus(formStatus === 'active' ? 'archived' : 'active')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        formStatus === 'active' ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          formStatus === 'active' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sticky Footer Action Bar */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E2E8F0]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCard(null);
                  }}
                  className="text-xs h-9 border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="text-xs h-9 bg-primary text-white hover:bg-primary/90 font-semibold shadow-xs cursor-pointer"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Product Group'}
                </Button>
              </div>
            </form>
          </div>
        </div>
        </AdminModalPortal>
      )}

      {/* DYNAMIC ATTRIBUTES & VARIANTS MODAL (PORTALED TO DOCUMENT.BODY) */}
      {managingAttrsCard && (
        <AdminModalPortal>
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setManagingAttrsCard(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-2xl max-h-[calc(100dvh-40px)] flex flex-col shadow-2xl overflow-hidden box-border animate-in zoom-in-95 duration-200 text-[#0F172A]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b border-[#E2E8F0] bg-white flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  <span>Atribut Dinamis: {managingAttrsCard.name}</span>
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Atur opsi pilihan (Paket, Tipe Akun, Durasi, Garansi, Region, dsb) untuk group ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManagingAttrsCard(null)}
                className="h-8 w-8 p-0 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* List Attributes */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Daftar Atribut Pilihan
                </h4>
                {managingAttrsCard.attributes && managingAttrsCard.attributes.length > 0 ? (
                  <div className="space-y-2">
                    {managingAttrsCard.attributes.map((attr) => (
                      <div
                        key={attr.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#0F172A] block">{attr.name}</span>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {attr.options?.length > 0 ? (
                              attr.options.map((opt: string) => (
                                <span
                                  key={opt}
                                  className="px-2 py-0.5 rounded text-[10px] bg-white border border-slate-200 text-[#0F172A] font-mono shadow-2xs"
                                >
                                  {opt}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-[#64748B] italic">
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
                          className="w-7 h-7 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#64748B]">
                    Belum ada atribut kustom. Atribut default sistem akan diterapkan secara otomatis.
                  </div>
                )}
              </div>

              {/* Form Add New Attribute */}
              <div className="border-t border-[#E2E8F0] pt-4 space-y-3">
                <h4 className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  Tambah Atribut Baru
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-[#0F172A] block mb-1">
                      Nama Atribut (e.g. Region, Platform, Jenis Lisensi)
                    </label>
                    <Input
                      value={newAttrName}
                      onChange={(e) => setNewAttrName(e.target.value)}
                      placeholder="Nama Atribut"
                      className="text-xs h-9 bg-white border-[#CBD5E1] text-[#0F172A] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#0F172A] block mb-1">
                      Opsi Pilihan (Pisahkan dengan koma)
                    </label>
                    <Input
                      value={newAttrOptions}
                      onChange={(e) => setNewAttrOptions(e.target.value)}
                      placeholder="Contoh: Global, Indonesia, Asia"
                      className="text-xs h-9 bg-white border-[#CBD5E1] text-[#0F172A] focus:bg-white"
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
                    className="text-xs h-8 bg-primary text-white hover:bg-primary/90 font-semibold cursor-pointer shadow-xs"
                  >
                    {addAttrMutation.isPending ? 'Menyimpan...' : 'Tambah Atribut'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] rounded-b-2xl flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setManagingAttrsCard(null)}
                className="text-xs h-8 border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
        </AdminModalPortal>
      )}

      {/* DELETE CONFIRMATION MODAL (PORTALED TO DOCUMENT.BODY) */}
      {deletingCard && (
        <AdminModalPortal>
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingCard(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-[#0F172A]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">Hapus Product Group?</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Konfirmasi penghapusan grup brand</p>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
              Anda akan menghapus Product Group <strong className="text-[#0F172A]">{deletingCard.name}</strong>.
              Seluruh Katalog Produk yang terhubung ({deletingCard.catalogCount} item) akan dialihkan menjadi katalog mandiri tanpa merusak riwayat transaksi yang ada.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingCard(null)}
                className="text-xs h-8 border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
              >
                Batal
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteMutation.mutate(deletingCard.id)}
                disabled={deleteMutation.isPending}
                className="text-xs h-8 bg-rose-600 text-white hover:bg-rose-700 font-semibold cursor-pointer shadow-xs"
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus Group'}
              </Button>
            </div>
          </div>
        </div>
        </AdminModalPortal>
      )}
    </div>
  );
}
