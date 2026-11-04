'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  TrendingUp,
  BarChart3,
  Crown,
  Save,
  Check,
  RotateCcw,
  Sparkles,
  Filter,
  CheckCircle2,
  ArrowUpDown,
  Layers,
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
  baseSoldCount?: number;
  dummySoldCount?: number;
  realSoldCount?: number;
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

  // Active view: 'groups' | 'sold_count' | 'showcase'
  const [activeSubTab, setActiveSubTab] = useState<'groups' | 'sold_count' | 'showcase'>('groups');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  // Sold count specific filters and state
  const [soldSearchQuery, setSoldSearchQuery] = useState('');
  const [soldSectionFilter, setSoldSectionFilter] = useState<string>('all');
  const [baselineEdits, setBaselineEdits] = useState<Record<string, number>>({});
  const [savingCardId, setSavingCardId] = useState<string | null>(null);

  // Showcase ordering state
  const [showcaseSlots, setShowcaseSlots] = useState<string[]>([
    'card-iqiyi',
    'card-canva',
    'card-chatgpt',
    'card-netflix',
    'card-youtube',
  ]);

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

  // Fetch Homepage Showcase Section config
  const { data: showcaseSectionResponse, refetch: refetchShowcase } = useQuery<{
    success?: boolean;
    sections?: Record<string, any>;
  }>({
    queryKey: ['admin-homepage-showcase'],
    queryFn: async () => {
      const res = await fetch('/api/v1/homepage/sections');
      if (!res.ok) return null;
      return res.json().catch(() => null);
    },
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (showcaseSectionResponse?.sections?.showcase?.manualProductIds?.length) {
      const ids = showcaseSectionResponse.sections.showcase.manualProductIds;
      setShowcaseSlots(ids.slice(0, 5));
    } else if (showcaseSectionResponse?.sections?.showcase?.data?.length) {
      const ids = showcaseSectionResponse.sections.showcase.data.map((c: any) => c.id || c.cardId).filter(Boolean);
      if (ids.length) {
        setShowcaseSlots(ids.slice(0, 5));
      }
    }
  }, [showcaseSectionResponse]);

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

  // Filter sold count cards
  const filteredSoldCards = useMemo(() => {
    return cards.filter((c) => {
      if (soldSectionFilter !== 'all' && !c.sections?.includes(soldSectionFilter)) return false;
      if (soldSearchQuery.trim()) {
        const q = soldSearchQuery.toLowerCase().trim();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchSlug = c.slug?.toLowerCase().includes(q);
        const matchCat = c.categoryName?.toLowerCase().includes(q);
        if (!matchName && !matchSlug && !matchCat) return false;
      }
      return true;
    });
  }, [cards, soldSectionFilter, soldSearchQuery]);

  // Mutations
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
      queryClient.invalidateQueries({ queryKey: ['admin-cards-list'] });
      queryClient.invalidateQueries({ queryKey: ['public-cards'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] });
      setDeletingCard(null);
    },
    onError: (err: Error) => {
      onNotify?.(`Gagal: ${err.message}`);
    },
  });

  // Single Baseline Mutation
  const updateBaselineMutation = useMutation({
    mutationFn: async ({ id, baseline }: { id: string; baseline: number }) => {
      setSavingCardId(id);
      const res = await fetch(`/api/v1/admin/cards/${id}/baseline`, {
        method: 'PUT',
        headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ baseSoldCount: baseline }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || json.message || 'Gagal menyimpan baseline.');
      return json;
    },
    onSuccess: (data, variables) => {
      onNotify?.(data.message || 'Baseline terjual berhasil disimpan ke database.');
      setBaselineEdits((prev) => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
      queryClient.invalidateQueries({ queryKey: ['public-cards'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-sections'] });
    },
    onError: (err: Error) => {
      onNotify?.(`Gagal: ${err.message}`);
    },
    onSettled: () => {
      setSavingCardId(null);
    },
  });

  // Batch Baseline Mutation
  const batchUpdateBaselineMutation = useMutation({
    mutationFn: async (updates: { id: string; baseSoldCount: number }[]) => {
      const res = await fetch('/api/v1/admin/cards/batch-baseline', {
        method: 'PATCH',
        headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ updates }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || json.message || 'Gagal menyimpan batch baseline.');
      return json;
    },
    onSuccess: (data) => {
      onNotify?.(data.message || 'Seluruh perubahan baseline berhasil disimpan ke database.');
      setBaselineEdits({});
      queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
      queryClient.invalidateQueries({ queryKey: ['public-cards'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-sections'] });
    },
    onError: (err: Error) => {
      onNotify?.(`Gagal: ${err.message}`);
    },
  });

  // Showcase Ordering Mutation
  const updateShowcaseMutation = useMutation({
    mutationFn: async (cardIds: string[]) => {
      const res = await fetch('/api/v1/admin/homepage/sections/showcase', {
        method: 'PUT',
        headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({
          mode: 'manual',
          manualProductIds: cardIds,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || json.message || 'Gagal menyimpan urutan showcase.');
      return json;
    },
    onSuccess: () => {
      onNotify?.('Urutan Showcase Katalog Pilihan (TOP 1–5) berhasil disimpan!');
      queryClient.invalidateQueries({ queryKey: ['admin-homepage-showcase'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-sections'] });
    },
    onError: (err: Error) => {
      onNotify?.(`Gagal: ${err.message}`);
    },
  });

  // Attribute mutations
  const addAttrMutation = useMutation({
    mutationFn: async ({ cardId, name, options }: { cardId: string; name: string; options: string[] }) => {
      const res = await fetch(`/api/v1/admin/cards/${cardId}/attributes`, {
        method: 'POST',
        headers: getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({
          name,
          displayOrder: (managingAttrsCard?.attributes?.length || 0) + 1,
          isRequired: true,
          options,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || 'Gagal menambah atribut.');
      return json;
    },
    onSuccess: (data) => {
      onNotify?.('Atribut berhasil ditambahkan.');
      queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
      setNewAttrName('');
      setNewAttrOptions('');
      if (managingAttrsCard) {
        setManagingAttrsCard((prev) =>
          prev ? { ...prev, attributes: [...(prev.attributes || []), data.data] } : null
        );
      }
    },
    onError: (err: Error) => {
      onNotify?.(`Gagal menambah atribut: ${err.message}`);
    },
  });

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

  // Sold count baseline editing helpers
  const handleBaselineChange = (cardId: string, val: string) => {
    const parsed = parseInt(val, 10);
    const sanitized = isNaN(parsed) ? 0 : Math.max(0, parsed);
    setBaselineEdits((prev) => ({
      ...prev,
      [cardId]: sanitized,
    }));
  };

  const handleSaveSingleBaseline = (card: CardItem) => {
    const newBase = baselineEdits[card.id] !== undefined ? baselineEdits[card.id] : (card.baseSoldCount || 0);
    updateBaselineMutation.mutate({ id: card.id, baseline: newBase });
  };

  const handleSaveAllBaselines = () => {
    const updates = Object.entries(baselineEdits).map(([id, baseSoldCount]) => ({
      id,
      baseSoldCount,
    }));
    if (updates.length === 0) {
      onNotify?.('Tidak ada perubahan baseline untuk disimpan.');
      return;
    }
    batchUpdateBaselineMutation.mutate(updates);
  };

  const handleResetBaselines = () => {
    setBaselineEdits({});
    onNotify?.('Perubahan belum tersimpan telah dibatalkan.');
  };

  // Summary metrics for sold count view
  const soldMetrics = useMemo(() => {
    let totalBase = 0;
    let totalDummy = 0;
    let totalReal = 0;
    let totalSold = 0;

    cards.forEach((c) => {
      const b = baselineEdits[c.id] !== undefined ? baselineEdits[c.id] : (c.baseSoldCount || 0);
      const d = c.dummySoldCount || 0;
      const r = c.realSoldCount || 0;
      totalBase += b;
      totalDummy += d;
      totalReal += r;
      totalSold += (b + d + r);
    });

    return { totalBase, totalDummy, totalReal, totalSold };
  }, [cards, baselineEdits]);

  const hasPendingEdits = Object.keys(baselineEdits).length > 0;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <Boxes className="w-5 h-5 text-primary" />
            Manajemen Product Group & Sold Count
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Kelola pengelompokan produk etalase, kalibrasi baseline jumlah terjual (anti-anomali), dan urutan Showcase Katalog Pilihan.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              refetch();
              refetchShowcase();
            }}
            disabled={isFetching}
            className="text-xs gap-1.5 h-8 border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Sinkronkan</span>
          </Button>

          {activeSubTab === 'groups' && (
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
          )}
        </div>
      </div>

      {/* Subtab Navigation Pills */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
        <button
          onClick={() => setActiveSubTab('groups')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'groups'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Daftar Product Group</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/50 text-[#0F172A]">
            {cards.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('sold_count')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'sold_count'
              ? 'bg-[#C96F55] text-white shadow-xs'
              : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#C96F55] hover:bg-[#F8FAFC]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Pengaturan Sold Count & Baseline</span>
          {hasPendingEdits && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 font-black animate-pulse">
              {Object.keys(baselineEdits).length} Diubah
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('showcase')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'showcase'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs'
              : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-amber-600 hover:bg-[#F8FAFC]'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>Urutan Showcase Marquee (TOP 1–5)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: PRODUCT GROUPS LIST */}
      {/* ========================================================================= */}
      {activeSubTab === 'groups' && (
        <div className="space-y-6">
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

                        <td className="py-3 px-4">
                          <span className="text-[11px] text-[#0F172A] font-medium">
                            {card.categoryName || 'Layanan Digital'}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">
                          {card.minPrice && card.minPrice > 0 ? (
                            <span>Rp {card.minPrice.toLocaleString('id-ID')}</span>
                          ) : (
                            <span className="text-[#94A3B8] font-normal text-[11px]">Belum ada harga</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {card.stockStatus === 'out_of_stock' || card.isOutOfStock ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                              Stok Habis
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Ready
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() => onNavigateToCatalog?.(card.id)}
                            className="font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>{card.activeCatalogCount ?? card.catalogCount ?? 0} varian aktif</span>
                          </button>
                        </td>

                        <td className="py-3 px-4 font-mono text-[#0F172A]">
                          <span className="font-bold">{card.soldCount}</span>
                          <span className="text-[#64748B] text-[10px] ml-1">
                            (Base: {card.baseSoldCount || 0})
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleMutation.mutate(card.id)}
                            disabled={toggleMutation.isPending}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                              card.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                            }`}
                          >
                            {card.status === 'active' ? 'Aktif' : 'Arsip'}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setManagingAttrsCard(card)}
                              title="Kelola Atribut Pilihan"
                              className="h-7 w-7 p-0 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(card)}
                              title="Edit Group"
                              className="h-7 w-7 p-0 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingCard(card)}
                              title="Hapus Group"
                              className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: SOLD COUNT & BASELINE MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSubTab === 'sold_count' && (
        <div className="space-y-6">
          {/* Explanation Alert */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300/60 flex items-center justify-center shrink-0 text-amber-700">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-xs text-[#0F172A] space-y-1">
                <div className="font-bold flex items-center gap-2">
                  <span>Formula Total Terjual:</span>
                  <code className="bg-white px-2 py-0.5 rounded border border-amber-300 font-mono text-amber-800">
                    Total Terjual = Baseline + Completed Dummy Orders + Completed Real Orders
                  </code>
                </div>
                <p className="text-[#64748B] leading-relaxed">
                  Admin hanya mengubah angka <strong>Baseline</strong>. Data riwayat transaksi nyata maupun dummy tidak dapat diubah dari tabel ini guna menjaga integritas finansial dan mutasi pesanan. Angka baseline otomatis berlaku sama pada semua section (Promo, Terlaris, Terbaru).
                </p>
              </div>
            </div>

            {hasPendingEdits && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetBaselines}
                  disabled={batchUpdateBaselineMutation.isPending}
                  className="text-xs h-8 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveAllBaselines}
                  disabled={batchUpdateBaselineMutation.isPending}
                  className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs gap-1.5"
                >
                  <Save className={`w-3.5 h-3.5 ${batchUpdateBaselineMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>Simpan Semua ({Object.keys(baselineEdits).length})</span>
                </Button>
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-2xs">
              <span className="text-xs text-[#64748B]">Total Baseline Terpasang</span>
              <div className="text-xl font-black text-[#0F172A] mt-1">{soldMetrics.totalBase}</div>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-2xs">
              <span className="text-xs text-[#64748B]">Dummy Orders Selesai</span>
              <div className="text-xl font-black text-amber-600 mt-1">{soldMetrics.totalDummy} unit</div>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-2xs">
              <span className="text-xs text-[#64748B]">Real Orders Selesai</span>
              <div className="text-xl font-black text-blue-600 mt-1">{soldMetrics.totalReal} unit</div>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-2xs">
              <span className="text-xs text-[#64748B]">Total Tampil di Etalase</span>
              <div className="text-xl font-black text-emerald-600 mt-1">{soldMetrics.totalSold} unit</div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSoldSectionFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  soldSectionFilter === 'all'
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Semua Section ({cards.length})
              </button>
              <button
                onClick={() => setSoldSectionFilter('terbaru')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  soldSectionFilter === 'terbaru'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Terbaru (11–20)
              </button>
              <button
                onClick={() => setSoldSectionFilter('promo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  soldSectionFilter === 'promo'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Promo
              </button>
              <button
                onClick={() => setSoldSectionFilter('terlaris')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  soldSectionFilter === 'terlaris'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Populer / Terlaris
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={soldSearchQuery}
                onChange={(e) => setSoldSearchQuery(e.target.value)}
                placeholder="Cari produk / brand..."
                className="pl-8 text-xs h-8 bg-white border-[#E2E8F0] text-[#0F172A]"
              />
            </div>
          </div>

          {/* Sold Count Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] uppercase tracking-wider text-[10px] font-semibold">
                    <th className="py-3 px-4">Produk</th>
                    <th className="py-3 px-4">Section Etalase</th>
                    <th className="py-3 px-4 text-center">Baseline (Admin)</th>
                    <th className="py-3 px-4 text-center">Dummy (Histori)</th>
                    <th className="py-3 px-4 text-center">Real (Histori)</th>
                    <th className="py-3 px-4 text-center">Total Terjual (Live)</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredSoldCards.map((card) => {
                    const isEdited = baselineEdits[card.id] !== undefined;
                    const baselineVal = isEdited ? baselineEdits[card.id] : (card.baseSoldCount ?? 0);
                    const dummyVal = card.dummySoldCount ?? 0;
                    const realVal = card.realSoldCount ?? 0;
                    const liveTotal = baselineVal + dummyVal + realVal;
                    const isSaving = savingCardId === card.id;

                    const secList = card.sections || [];
                    const formattedSections = secList
                      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                      .join(', ') || 'Umum';

                    return (
                      <tr key={card.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                        {/* Product info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
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

                        {/* Section */}
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-medium text-[#0F172A] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {formattedSections}
                          </span>
                        </td>

                        {/* Baseline Input */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center justify-center">
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              value={baselineVal}
                              onChange={(e) => handleBaselineChange(card.id, e.target.value)}
                              className={`w-20 text-center font-bold text-xs h-8 ${
                                isEdited
                                  ? 'border-amber-400 bg-amber-50/60 text-amber-900 ring-1 ring-amber-300'
                                  : 'border-slate-300 bg-white text-[#0F172A]'
                              }`}
                            />
                          </div>
                        </td>

                        {/* Dummy count */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            {dummyVal}
                          </span>
                        </td>

                        {/* Real count */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                            {realVal}
                          </span>
                        </td>

                        {/* Total live */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                            {liveTotal} terjual
                          </span>
                        </td>

                        {/* Action save single */}
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            disabled={!isEdited || isSaving}
                            onClick={() => handleSaveSingleBaseline(card)}
                            className={`text-xs h-7 px-2.5 gap-1 font-semibold transition-all cursor-pointer ${
                              isEdited
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            }`}
                          >
                            <Save className={`w-3 h-3 ${isSaving ? 'animate-spin' : ''}`} />
                            <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: SHOWCASE MARQUEE (TOP 1–5) RANKING CONTROL */}
      {/* ========================================================================= */}
      {activeSubTab === 'showcase' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Crown className="w-5 h-5" />
              </div>
              <div className="text-xs text-[#0F172A] space-y-1">
                <h3 className="font-bold text-sm text-[#0F172A]">Pengaturan Urutan Showcase Katalog Pilihan (TOP 1 – TOP 5)</h3>
                <p className="text-[#64748B] leading-relaxed">
                  Admin dapat menentukan urutan visual kartu pada marquee looping banner. Urutan ini sepenuhnya independen dari total jumlah terjual dan tidak mengubah histori transaksi nyata maupun baseline order.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => updateShowcaseMutation.mutate(showcaseSlots)}
              disabled={updateShowcaseMutation.isPending}
              className="text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer shadow-xs gap-1.5 shrink-0"
            >
              <Save className={`w-3.5 h-3.5 ${updateShowcaseMutation.isPending ? 'animate-spin' : ''}`} />
              <span>{updateShowcaseMutation.isPending ? 'Menyimpan...' : 'Simpan Urutan Showcase'}</span>
            </Button>
          </div>

          {/* 5 Showcase Slots Selector */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            {[0, 1, 2, 3, 4].map((idx) => {
              const rankNum = idx + 1;
              const slotThemes = [
                { title: 'TOP 1', bg: 'bg-[#FFFDF5] border-amber-300', badge: 'bg-amber-500 text-white', color: 'Gold / Cream' },
                { title: 'TOP 2', bg: 'bg-[#F8FAFC] border-sky-300', badge: 'bg-sky-500 text-white', color: 'Soft Blue' },
                { title: 'TOP 3', bg: 'bg-[#FAF5FF] border-purple-300', badge: 'bg-purple-500 text-white', color: 'Soft Lavender' },
                { title: 'TOP 4', bg: 'bg-[#FFF5F5] border-rose-300', badge: 'bg-rose-500 text-white', color: 'Soft Coral' },
                { title: 'TOP 5', bg: 'bg-[#F8FAFC] border-slate-300', badge: 'bg-slate-600 text-white', color: 'Silver / Grey' },
              ];
              const theme = slotThemes[idx];
              const currentCardId = showcaseSlots[idx] || '';
              const matchedCard = cards.find((c) => c.id === currentCardId || c.slug === currentCardId);

              return (
                <div
                  key={idx}
                  className={`border rounded-2xl p-4 flex flex-col justify-between shadow-xs ${theme.bg}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black shadow-2xs ${theme.badge}`}>
                        <Crown className="w-3 h-3" />
                        {theme.title}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {theme.color}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Pilih Product Card:</label>
                      <select
                        value={currentCardId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setShowcaseSlots((prev) => {
                            const next = [...prev];
                            next[idx] = val;
                            return next;
                          });
                        }}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-semibold text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="">-- Pilih Kartu --</option>
                        {cards.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.soldCount} terjual)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Preview slot */}
                    {matchedCard && (
                      <div className="mt-3 bg-white/90 border border-slate-200/80 rounded-xl p-3 flex items-center gap-2.5 shadow-2xs">
                        <ProductBrandIcon
                          name={matchedCard.name}
                          imageUrl={matchedCard.logoUrl}
                          className="w-9 h-9 rounded-xl border border-slate-200 p-1 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[#0F172A] truncate">
                            {matchedCard.name}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            ★ {matchedCard.rating} ({matchedCard.soldCount} terjual)
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      {/* ADD / EDIT MODAL */}
      {isAddModalOpen && (
        <AdminModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsAddModalOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-[#0F172A]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-[#0F172A]">
                    {editingCard ? 'Edit Product Group' : 'Tambah Product Group Baru'}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Buat entitas grup brand untuk mengelompokkan katalog dan varian
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-7 h-7 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCard} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F172A]">
                    Nama Product Group / Brand <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Netflix, Canva, ChatGPT..."
                    className="text-xs h-9 bg-white border-[#CBD5E1] text-[#0F172A]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F172A]">Logo Brand Resmi</label>
                  <BrandLogoSelector
                    value={formLogo}
                    onChange={setFormLogo}
                    brandName={formName}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F172A]">Kategori Layanan</label>
                  <select
                    value={formCatId}
                    onChange={(e) => {
                      const selId = e.target.value;
                      setFormCatId(selId);
                      const matched = publicCategories.find((cat) => cat.id === selId);
                      if (matched) setFormCatName(matched.name);
                    }}
                    className="w-full text-xs h-9 bg-white border border-[#CBD5E1] rounded-md px-3 text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {publicCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F172A]">Tampilkan di Section</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['promo', 'terlaris', 'terbaru'].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => toggleSectionChoice(sec)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          formSections.includes(sec)
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-white text-[#64748B] border-[#CBD5E1] hover:text-[#0F172A]'
                        }`}
                      >
                        {sec === 'promo' ? '🔥 Promo' : sec === 'terlaris' ? '⭐ Terlaris' : '✨ Terbaru'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0F172A]">Deskripsi Singkat</label>
                  <textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={3}
                    placeholder="Deskripsi layanan resmi..."
                    className="w-full text-xs bg-white border border-[#CBD5E1] rounded-md p-2.5 text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E2E8F0]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-xs h-8 border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="text-xs h-8 bg-primary text-white hover:bg-primary/90 font-semibold cursor-pointer shadow-xs"
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Product Group'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </AdminModalPortal>
      )}

      {/* ATTRIBUTES MODAL */}
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
              className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-[#0F172A]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-[#0F172A]">
                    Kelola Atribut: {managingAttrsCard.name}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Konfigurasi opsi pilihan seperti Tipe Akun, Durasi, dll.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setManagingAttrsCard(null)}
                  className="w-7 h-7 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#0F172A]">Daftar Atribut Saat Ini</h4>
                  {(managingAttrsCard.attributes || []).length === 0 ? (
                    <p className="text-xs text-[#94A3B8] italic">Belum ada atribut khusus.</p>
                  ) : (
                    <div className="space-y-2">
                      {(managingAttrsCard.attributes || []).map((attr: any) => (
                        <div
                          key={attr.id}
                          className="flex items-center justify-between p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-xs"
                        >
                          <div>
                            <span className="font-bold text-[#0F172A]">{attr.name}</span>
                            <span className="text-[10px] text-[#64748B] ml-2">
                              (Urutan #{attr.displayOrder})
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              deleteAttrMutation.mutate({
                                cardId: managingAttrsCard.id,
                                attrId: attr.id,
                              })
                            }
                            className="h-6 w-6 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
                  <h4 className="text-xs font-bold text-[#0F172A]">Tambah Atribut Baru</h4>
                  <div className="space-y-2">
                    <Input
                      value={newAttrName}
                      onChange={(e) => setNewAttrName(e.target.value)}
                      placeholder="Nama atribut (cth: Durasi Layanan)"
                      className="text-xs h-8 bg-white border-[#CBD5E1]"
                    />
                    <Input
                      value={newAttrOptions}
                      onChange={(e) => setNewAttrOptions(e.target.value)}
                      placeholder="Opsi (pisahkan dengan koma, cth: 1 Bulan, 3 Bulan)"
                      className="text-xs h-8 bg-white border-[#CBD5E1]"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!newAttrName.trim()) return;
                        const opts = newAttrOptions.split(',').map((s) => s.trim()).filter(Boolean);
                        addAttrMutation.mutate({
                          cardId: managingAttrsCard.id,
                          name: newAttrName.trim(),
                          options: opts,
                        });
                      }}
                      disabled={addAttrMutation.isPending}
                      className="text-xs h-8 bg-primary text-white hover:bg-primary/90 font-semibold cursor-pointer shadow-xs w-full"
                    >
                      {addAttrMutation.isPending ? 'Menyimpan...' : 'Tambah Atribut'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AdminModalPortal>
      )}

      {/* DELETE MODAL */}
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
