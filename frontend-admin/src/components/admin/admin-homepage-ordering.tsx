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
  HelpCircle,
  Eye,
  Layers,
  Zap,
  Search,
  X,
  RefreshCw,
  Gamepad2,
  Tv,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type SectionKey = 'promo' | 'terlaris' | 'terbaru';



interface HomepageProductItem {
  id: string;
  name: string;
  productName?: string;
  slug?: string;
  brandGroup?: string;
  minPrice?: number;
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
  isPromo?: boolean;
}

export interface AdminProductGroup {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  categoryId?: string;
  categoryTag: 'ai' | 'design' | 'video' | 'streaming' | 'gaming' | 'other';
  rating: string;
  soldCount: number;
  minPrice: number;
  originalPrice: number;
  isPromo: boolean;
  savingsText?: string;
  variantCount: number;
  items: AdminProductItem[];
  match: (text: string) => boolean;
}

export function ProductBrandLogo({ name, className = 'w-10 h-10' }: { name: string; className?: string }) {
  const n = (name || '').toLowerCase();

  if (n.includes('capcut')) {
    return (
      <div className={`${className} bg-white rounded-xl border border-border/80 flex items-center justify-center p-1 shadow-2xs shrink-0 overflow-hidden`}>
        <img src="/images/brand/Capcut-logo.png" alt="CapCut" className="w-full h-full object-contain" draggable={false} />
      </div>
    );
  }

  if (n.includes('gemini') || n.includes('google ai') || n.includes('google pro')) {
    return (
      <div className={`${className} bg-white rounded-xl border border-border/80 flex items-center justify-center p-1 shadow-2xs shrink-0 overflow-hidden`}>
        <img src="/images/brand/Google-logo.png" alt="Google Gemini" className="w-full h-full object-contain" draggable={false} />
      </div>
    );
  }

  if (n.includes('chatgpt') || n.includes('openai')) {
    return (
      <div className={`${className} bg-white rounded-xl border border-border/80 flex items-center justify-center p-1 shadow-2xs shrink-0 overflow-hidden`}>
        <img src="/images/brand/ChatGPT-logo.png" alt="ChatGPT" className="w-full h-full object-contain" draggable={false} />
      </div>
    );
  }

  if (n.includes('canva')) {
    return (
      <div className={`${className} bg-white rounded-xl border border-border/80 flex items-center justify-center p-0.5 shadow-2xs shrink-0 overflow-hidden`}>
        <img src="/images/apps/canva.png" alt="Canva" className="w-full h-full object-contain" draggable={false} />
      </div>
    );
  }

  if (n.includes('alight')) {
    return (
      <div className={`${className} bg-white rounded-xl border border-border/80 flex items-center justify-center p-0.5 shadow-2xs shrink-0 overflow-hidden`}>
        <img src="/images/brand/Alightmotion-logo.png" alt="Alight Motion" className="w-full h-full object-cover rounded-lg" draggable={false} />
      </div>
    );
  }

  if (n.includes('netflix') || n.includes('ntflx')) {
    return (
      <div className={`${className} bg-black rounded-xl border border-border/80 flex items-center justify-center p-0.5 shadow-2xs shrink-0 overflow-hidden`}>
        <img src="/images/brand/Netflix-logo.png" alt="Netflix" className="w-full h-full object-cover rounded-lg" draggable={false} />
      </div>
    );
  }

  if (n.includes('spotify')) {
    return (
      <div className={`${className} bg-black rounded-xl border border-border/80 flex items-center justify-center p-0.5 shadow-2xs shrink-0 overflow-hidden`}>
        <img src="/images/brand/Spotify-logo.png" alt="Spotify" className="w-full h-full object-cover rounded-lg" draggable={false} />
      </div>
    );
  }

  if (n.includes('bstation') || n.includes('bilibili')) {
    return (
      <div className={`${className} bg-white rounded-xl border border-border/80 flex items-center justify-center p-1 shadow-2xs shrink-0 overflow-hidden`}>
        <img src="/images/brand/BStation-logo.png" alt="Bstation" className="w-full h-full object-contain" draggable={false} />
      </div>
    );
  }

  if (n.includes('iqiyi')) {
    return (
      <div className={`${className} bg-white rounded-xl border border-border/80 flex items-center justify-center p-1 shadow-2xs shrink-0 overflow-hidden`}>
        <img src="/images/brand/iqiyi-logo.png" alt="iQIYI" className="w-full h-full object-contain" draggable={false} />
      </div>
    );
  }

  if (n.includes('mobile legend') || n.includes('mlbb') || n.includes('diamond')) {
    return (
      <div className={`${className} bg-slate-950 rounded-xl border border-border/80 flex items-center justify-center p-0.5 shadow-2xs shrink-0 overflow-hidden`}>
        <img src="/images/brand/Mobilelegends-logo.png" alt="Mobile Legends" className="w-full h-full object-cover rounded-lg" draggable={false} />
      </div>
    );
  }

  if (n.includes('pubg') || n.includes('uc')) {
    return (
      <div className={`${className} bg-slate-950 rounded-xl border border-border/80 flex items-center justify-center p-0.5 shadow-2xs shrink-0 overflow-hidden`}>
        <img src="/images/brand/Pubg-logo.png" alt="PUBG" className="w-full h-full object-cover rounded-lg" draggable={false} />
      </div>
    );
  }

  if (n.includes('youtube')) {
    return (
      <div className={`${className} bg-[#FF0000] rounded-xl border border-border/80 flex items-center justify-center p-1.5 shadow-2xs shrink-0 text-white font-black text-xs`}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
      </div>
    );
  }

  if (n.includes('vidio')) {
    return (
      <div className={`${className} bg-white rounded-xl border border-border/80 flex items-center justify-center p-1 shadow-2xs shrink-0 overflow-hidden`}>
        <img src="/images/apps/vidio.png" alt="Vidio" className="w-full h-full object-contain" draggable={false} />
      </div>
    );
  }

  if (n.includes('wetv')) {
    return (
      <div className={`${className} bg-white rounded-xl border border-border/80 flex items-center justify-center p-1 shadow-2xs shrink-0 overflow-hidden`}>
        <img src="/images/apps/wetv.png" alt="WeTV" className="w-full h-full object-contain" draggable={false} />
      </div>
    );
  }

  if (n.includes('viu')) {
    return (
      <div className={`${className} bg-[#121A2A] rounded-xl border border-border/80 flex items-center justify-center p-1 shadow-2xs shrink-0 overflow-hidden`}>
        <img src="/images/apps/viu.png" alt="Viu" className="w-full h-full object-contain" draggable={false} />
      </div>
    );
  }

  if (n.includes('claude')) {
    return (
      <div className={`${className} bg-[#D97706]/15 rounded-xl border border-[#D97706]/30 flex items-center justify-center p-1 shadow-2xs shrink-0 text-[#D97706] font-black text-xs`}>
        Claude
      </div>
    );
  }

  if (n.includes('k-vision') || n.includes('nex') || n.includes('vision') || n.includes('orange tv')) {
    return (
      <div className={`${className} bg-[#121A2A] rounded-xl border border-border/80 flex items-center justify-center p-1.5 shadow-2xs shrink-0 text-[#C96F55]`}>
        <Tv className="w-5 h-5" />
      </div>
    );
  }

  return (
    <div className={`${className} bg-[#C96F55]/10 rounded-xl border border-[#C96F55]/20 flex items-center justify-center p-1.5 shadow-2xs shrink-0 text-[#C96F55]`}>
      <Layers className="w-5 h-5" />
    </div>
  );
}

const ADMIN_PRODUCT_DEFINITIONS: Array<{
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  categoryTag: AdminProductGroup['categoryTag'];
  rating: string;
  soldCount: number;
  match: (t: string) => boolean;
}> = [
  {
    id: 'capcut',
    name: 'CapCut',
    slug: 'capcut',
    categoryName: 'Video Editing & Content',
    categoryTag: 'video',
    rating: '4.9',
    soldCount: 980,
    match: (t: string) => t.includes('capcut'),
  },
  {
    id: 'netflix',
    name: 'Netflix',
    slug: 'netflix',
    categoryName: 'Movie & Series HD',
    categoryTag: 'streaming',
    rating: '5.0',
    soldCount: 1650,
    match: (t: string) => t.includes('netflix'),
  },
  {
    id: 'google-gemini',
    name: 'Google Gemini',
    slug: 'google-gemini',
    categoryName: 'AI Assistant & Cloud',
    categoryTag: 'ai',
    rating: '5.0',
    soldCount: 620,
    match: (t: string) => t.includes('gemini') || t.includes('google ai') || t.includes('google pro'),
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    slug: 'chatgpt',
    categoryName: 'AI Assistant & Writing',
    categoryTag: 'ai',
    rating: '5.0',
    soldCount: 850,
    match: (t: string) => t.includes('chatgpt') || t.includes('chat gpt') || t.includes('openai') || t.includes('plus plan'),
  },
  {
    id: 'canva',
    name: 'Canva',
    slug: 'canva',
    categoryName: 'Design & Kreatif',
    categoryTag: 'design',
    rating: '5.0',
    soldCount: 1420,
    match: (t: string) => t.includes('canva'),
  },
  {
    id: 'youtube',
    name: 'YouTube',
    slug: 'youtube',
    categoryName: 'Streaming & Video',
    categoryTag: 'streaming',
    rating: '5.0',
    soldCount: 2100,
    match: (t: string) => t.includes('youtube'),
  },
  {
    id: 'spotify',
    name: 'Spotify',
    slug: 'spotify',
    categoryName: 'Music & Podcast',
    categoryTag: 'streaming',
    rating: '5.0',
    soldCount: 780,
    match: (t: string) => t.includes('spotify'),
  },
  {
    id: 'alight-motion',
    name: 'Alight Motion',
    slug: 'alight-motion',
    categoryName: 'Motion Graphic & VFX',
    categoryTag: 'video',
    rating: '4.8',
    soldCount: 340,
    match: (t: string) => t.includes('alightmotion') || t.includes('alight motion'),
  },
  {
    id: 'vidio',
    name: 'Vidio',
    slug: 'vidio',
    categoryName: 'Live Sports & Premier',
    categoryTag: 'streaming',
    rating: '4.9',
    soldCount: 1100,
    match: (t: string) => t.includes('vidio'),
  },
  {
    id: 'wetv',
    name: 'WeTV',
    slug: 'wetv',
    categoryName: 'Asian Drama VIP',
    categoryTag: 'streaming',
    rating: '4.8',
    soldCount: 560,
    match: (t: string) => t.includes('wetv'),
  },
  {
    id: 'viu',
    name: 'Viu',
    slug: 'viu',
    categoryName: 'Asian Drama & Variety',
    categoryTag: 'streaming',
    rating: '4.9',
    soldCount: 910,
    match: (t: string) => t.includes('viu'),
  },
  {
    id: 'bstation',
    name: 'Bstation',
    slug: 'bstation',
    categoryName: 'Anime & Pop Culture',
    categoryTag: 'streaming',
    rating: '4.8',
    soldCount: 390,
    match: (t: string) => t.includes('bstation'),
  },
  {
    id: 'iqiyi',
    name: 'iQIYI',
    slug: 'iqiyi',
    categoryName: 'Anime & Drama HD',
    categoryTag: 'streaming',
    rating: '4.8',
    soldCount: 420,
    match: (t: string) => t.includes('iqiyi'),
  },
  {
    id: 'mobile-legends',
    name: 'Mobile Legends',
    slug: 'mobile-legends',
    categoryName: 'Top Up Game & Diamond',
    categoryTag: 'gaming',
    rating: '5.0',
    soldCount: 1250,
    match: (t: string) => t.includes('mobile legend') || t.includes('mlbb') || t.includes('diamond'),
  },
  {
    id: 'pubg',
    name: 'PUBG Mobile',
    slug: 'pubg',
    categoryName: 'Top Up Game & UC',
    categoryTag: 'gaming',
    rating: '5.0',
    soldCount: 950,
    match: (t: string) => t.includes('pubg') || t.includes('uc'),
  },
  {
    id: 'claude',
    name: 'Claude',
    slug: 'claude',
    categoryName: 'AI Assistant',
    categoryTag: 'ai',
    rating: '4.9',
    soldCount: 280,
    match: (t: string) => t.includes('claude'),
  },
  {
    id: 'k-vision',
    name: 'K-Vision & TV',
    slug: 'k-vision',
    categoryName: 'TV Parabola & Sports',
    categoryTag: 'streaming',
    rating: '4.8',
    soldCount: 450,
    match: (t: string) => t.includes('k-vision') || t.includes('nex') || t.includes('vision') || t.includes('orange tv'),
  },
];

export function AdminHomepageOrdering({ onNotify }: { onNotify?: (msg: string) => void }) {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<SectionKey>('promo');
  const [isAddPickerOpen, setIsAddPickerOpen] = useState(false);
  const [searchPickerQuery, setSearchPickerQuery] = useState('');
  const [pickerCategoryFilter, setPickerCategoryFilter] = useState<string>('all');
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

  // 3. Fetch real categories from Database for dynamic filter tabs
  const { data: categoriesData } = useQuery<{ success: boolean; data: { id: string; name: string; slug: string }[] }>({
    queryKey: ['public-categories'],
    queryFn: async () => {
      const res = await fetch('/api/v1/categories');
      if (!res.ok) return { success: false, data: [] };
      return res.json();
    },
    staleTime: 30 * 1000,
  });
  const dbCategories = categoriesData?.data || [];



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
    onSuccess: () => {
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

  // Lookup map for raw products in legacy manual IDs
  const catalogMap = useMemo(() => {
    const map = new Map<string, AdminProductItem>();
    for (const p of catalogData?.data || []) {
      map.set(p.id, p);
      map.set(p.name.toLowerCase(), p);
    }
    return map;
  }, [catalogData]);

  // Curated, authoritative Product entities for the homepage ordering (strictly Product level, not catalog SKUs)
  const availableProductGroups = useMemo<AdminProductGroup[]>(() => {
    const catalog = catalogData?.data || [];

    return ADMIN_PRODUCT_DEFINITIONS.map((def) => {
      const items = catalog.filter((p) => {
        if (p.status !== 'active') return false;
        const text = `${p.name} ${p.categoryName || ''}`.toLowerCase();
        return def.match(text);
      });

      const prices = items.map((p) => p.price).filter((p) => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 15000;
      const isPromo = activeSection === 'promo' || items.some((it) => it.isPromo);
      const originalPrice = isPromo ? Math.round(minPrice / 0.85) : minPrice;
      const savings = originalPrice > minPrice ? originalPrice - minPrice : 0;

      const firstItem = items[0];
      const realCatName =
        firstItem?.categoryName ||
        (firstItem as any)?.category?.name ||
        def.categoryName;
      const realCatId =
        (firstItem as any)?.categoryId ||
        (firstItem as any)?.category?.id;

      return {
        ...def,
        categoryName: realCatName,
        categoryId: realCatId,
        items,
        variantCount: items.length || 1,
        minPrice,
        originalPrice,
        isPromo,
        savingsText: savings > 0 ? `Hemat Rp ${savings.toLocaleString('id-ID')}` : undefined,
      };
    });
  }, [catalogData, activeSection]);

  const productGroupMap = useMemo(() => {
    const map = new Map<string, AdminProductGroup>();
    for (const g of availableProductGroups) {
      map.set(g.id.toLowerCase(), g);
      map.set(g.name.toLowerCase(), g);
      map.set(g.slug.toLowerCase(), g);
    }
    return map;
  }, [availableProductGroups]);

  // Dynamic category filter pills computed from DB categories + available products
  const categoryPills = useMemo(() => {
    const pills: Array<{ key: string; label: string }> = [
      { key: 'all', label: `Semua (${availableProductGroups.length})` },
    ];

    dbCategories.forEach((cat) => {
      const targetId = cat.id.toLowerCase();
      const targetName = cat.name.toLowerCase();

      const count = availableProductGroups.filter((g) => {
        const gName = (g.categoryName || '').toLowerCase();
        const gId = (g.categoryId || '').toLowerCase();
        return (
          gId === targetId ||
          gName === targetName ||
          g.items.some(
            (it) =>
              (it.categoryName || '').toLowerCase() === targetName ||
              ((it as any).categoryId || '').toLowerCase() === targetId ||
              ((it as any).category?.name || '').toLowerCase() === targetName ||
              ((it as any).category?.id || '').toLowerCase() === targetId
          )
        );
      }).length;

      pills.push({
        key: cat.id,
        label: count > 0 ? `${cat.name} (${count})` : cat.name,
      });
    });

    return pills;
  }, [availableProductGroups, dbCategories]);

  // Filtered products for modal picker (strictly distinct Product level)
  const filteredProductGroupsForPicker = useMemo(() => {
    const q = searchPickerQuery.toLowerCase().trim();
    return availableProductGroups.filter((g) => {
      // Dynamic DB Category filter pill
      if (pickerCategoryFilter !== 'all') {
        const selectedCat = dbCategories.find((c) => c.id === pickerCategoryFilter);
        const targetId = pickerCategoryFilter.toLowerCase();
        const targetName = selectedCat?.name.toLowerCase() || targetId;

        const gId = (g.categoryId || '').toLowerCase();
        const gName = (g.categoryName || '').toLowerCase();

        const matchesCategory =
          gId === targetId ||
          gName === targetName ||
          g.items.some(
            (it) =>
              (it.categoryName || '').toLowerCase() === targetName ||
              ((it as any).categoryId || '').toLowerCase() === targetId ||
              ((it as any).category?.name || '').toLowerCase() === targetName ||
              ((it as any).category?.id || '').toLowerCase() === targetId
          );

        if (!matchesCategory) return false;
      }

      if (!q) return true;
      const text = `${g.name} ${g.categoryName || ''} ${g.slug}`.toLowerCase();
      return text.includes(q);
    });
  }, [availableProductGroups, pickerCategoryFilter, searchPickerQuery, dbCategories]);

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
                    <Zap className="w-3.5 h-3.5 text-primary" />
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
                      Klik tombol &quot;Tambah Produk&quot; di atas untuk memprioritaskan produk tertentu (misal: ChatGPT, Gemini, Claude Pro, Mobile Legends).
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
                    const prodGroup = productGroupMap.get(idOrName.toLowerCase()) ||
                      availableProductGroups.find((g) => g.id === idOrName || g.slug === idOrName || g.name.toLowerCase() === idOrName.toLowerCase() || g.items.some((it) => it.id === idOrName));
                    const legacyProd = catalogMap.get(idOrName) || catalogMap.get(idOrName.toLowerCase());

                    const displayName = prodGroup?.name || legacyProd?.name || idOrName;
                    const displayCategory = prodGroup?.categoryName || legacyProd?.categoryName || 'Katalog';
                    const displayPrice = prodGroup ? `Mulai Rp ${prodGroup.minPrice.toLocaleString('id-ID')}` : (legacyProd?.priceFormatted || '-');

                    return (
                      <div
                        key={`manual-item-${idOrName}-${idx}`}
                        className="bg-surface-raised border border-border/80 hover:border-[#C96F55]/40 rounded-2xl p-3 flex items-center justify-between gap-3 transition-colors shadow-2xs"
                      >
                        {/* Position Number Pill & Logo */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="w-6 h-6 rounded-lg bg-[#C96F55]/10 text-[#C96F55] font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>

                          <ProductBrandLogo name={displayName} className="w-9 h-9" />

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground truncate" title={displayName}>
                              {displayName}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-foreground-muted mt-0.5">
                              <span>{displayCategory}</span>
                              <span>·</span>
                              <span className="font-semibold text-[#C96F55]">{displayPrice}</span>
                              {!prodGroup && !legacyProd && (
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
                            className="w-7 h-7 rounded-lg border border-border bg-surface hover:bg-border/60 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === draftManualIds.length - 1}
                            onClick={() => handleMoveDown(idx)}
                            title="Pindah ke Bawah"
                            className="w-7 h-7 rounded-lg border border-border bg-surface hover:bg-border/60 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(idOrName)}
                            title="Hapus dari Prioritas"
                            className="w-7 h-7 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors ml-1 cursor-pointer"
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
                {currentSectionData.data.slice(0, 8).map((prod, rankIdx) => {
                  const prodGroup =
                    productGroupMap.get(prod.id?.toLowerCase()) ||
                    productGroupMap.get(prod.brandGroup?.toLowerCase() || '') ||
                    productGroupMap.get(prod.slug?.toLowerCase() || '') ||
                    availableProductGroups.find((g) => {
                      const text = `${prod.productName || ''} ${prod.name || ''} ${prod.id || ''} ${prod.brandGroup || ''}`.toLowerCase();
                      return g.match(text) || g.name.toLowerCase() === text || g.slug === text;
                    });
                  const displayName = prodGroup?.name || prod.productName || prod.name;
                  const displayPrice = Number(prod.minPrice || prod.price || prodGroup?.minPrice || 0);

                  return (
                    <div
                      key={`preview-${prod.id}-${rankIdx}`}
                      className="p-2.5 rounded-xl border border-border/80 bg-surface-raised flex items-center justify-between gap-3 text-xs hover:border-[#C96F55]/30 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-5 h-5 rounded-md bg-[#C96F55] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                          {rankIdx + 1}
                        </span>
                        <ProductBrandLogo name={displayName} className="w-8 h-8" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate" title={displayName}>
                            {displayName}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-foreground-muted">
                            <span className="text-[#C96F55] font-bold">
                              Rp {displayPrice.toLocaleString('id-ID')}
                            </span>
                            <span>·</span>
                            <span>{prod.soldCount ? `${prod.soldCount} terjual` : 'Ready'}</span>
                            {prodGroup?.variantCount ? (
                              <>
                                <span>·</span>
                                <span>{prodGroup.variantCount} Varian</span>
                              </>
                            ) : null}
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
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-border rounded-xl text-xs text-foreground-muted">
                Belum ada produk aktif yang memenuhi syarat kategori ini.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Picker: Add Product to Manual Ordering (Strictly Product Level, Modeled after Gambar 2) */}
      {isAddPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 sm:px-6 sm:py-4 border-b border-border flex items-center justify-between bg-surface">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C96F55] animate-pulse" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Pilih Produk untuk Diprioritaskan
                  </h3>
                </div>
                <p className="text-xs text-foreground-muted">
                  Pilih dari <strong className="text-foreground">{availableProductGroups.length} produk aplikasi</strong> di katalog Asterra Store (bukan SKU varian)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPickerOpen(false)}
                className="w-8 h-8 rounded-xl text-foreground-muted hover:text-foreground hover:bg-surface-raised flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input & Category Filter Tabs */}
            <div className="p-3 sm:p-4 border-b border-border/80 bg-surface-raised space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
                <Input
                  value={searchPickerQuery}
                  onChange={(e) => setSearchPickerQuery(e.target.value)}
                  placeholder="Cari nama produk (misal: CapCut, Netflix, Gemini, ChatGPT, Canva, MLBB)..."
                  className="pl-9 pr-9 text-xs sm:text-sm h-10 bg-surface border-border focus:border-[#C96F55] focus:ring-1 focus:ring-[#C96F55] rounded-xl"
                  autoFocus
                />
                {searchPickerQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchPickerQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills (Dynamically retrieved from PostgreSQL DB categories) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {categoryPills.map((tab) => {
                  const isActive = pickerCategoryFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setPickerCategoryFilter(tab.key)}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#C96F55] text-white shadow-2xs font-bold'
                          : 'bg-surface border border-border/80 text-foreground-muted hover:text-foreground hover:bg-surface-raised'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Cards Grid (Modeled after Gambar 2) */}
            <div className="p-3 sm:p-5 overflow-y-auto space-y-3 flex-1 bg-surface-raised/40">
              {filteredProductGroupsForPicker.length === 0 ? (
                <div className="py-12 px-4 text-center border-2 border-dashed border-border rounded-2xl bg-surface space-y-2">
                  <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center mx-auto text-foreground-muted">
                    <Search className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    Tidak ada produk yang cocok dengan pencarian
                  </p>
                  <p className="text-[11px] text-foreground-muted">
                    Coba kata kunci lain atau pilih tab kategori yang berbeda.
                  </p>
                  {searchPickerQuery && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchPickerQuery('');
                        setPickerCategoryFilter('all');
                      }}
                      className="text-xs h-7 mt-2"
                    >
                      Reset Pencarian
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredProductGroupsForPicker.map((prod) => {
                    const isSelected =
                      draftManualIds.includes(prod.id) ||
                      draftManualIds.some(
                        (id) =>
                          id.toLowerCase() === prod.id.toLowerCase() ||
                          id.toLowerCase() === prod.name.toLowerCase() ||
                          id.toLowerCase() === prod.slug.toLowerCase()
                      );

                    return (
                      <div
                        key={prod.id}
                        className={`rounded-2xl border p-3.5 bg-surface transition-all flex flex-col justify-between shadow-2xs ${
                          isSelected
                            ? 'border-emerald-300 ring-1 ring-emerald-200/50 bg-emerald-50/10'
                            : 'border-border/80 hover:border-[#C96F55]/60 hover:shadow-xs'
                        }`}
                      >
                        <div>
                          {/* Top: Brand Logo + Name + Star Rating & Sales (Gambar 2 Layout) */}
                          <div className="flex items-start gap-3">
                            <ProductBrandLogo name={prod.name} className="w-12 h-12" />

                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-foreground truncate" title={prod.name}>
                                {prod.name}
                              </h4>
                              <div className="flex items-center gap-1.5 text-xs text-foreground-muted mt-0.5">
                                <span className="flex items-center gap-0.5 font-bold text-amber-500">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                  {prod.rating}
                                </span>
                                <span>({prod.soldCount} terjual)</span>
                              </div>
                            </div>
                          </div>

                          {/* Status Badges Row (Gambar 2 Style: Ready, Garansi, DISKON 15%) */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold border border-blue-200 bg-blue-50/80 text-blue-700">
                              Ready
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold border border-emerald-200 bg-emerald-50/80 text-emerald-700">
                              Garansi
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#C96F55] text-white flex items-center gap-1">
                              🔥 DISKON 15%
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium border border-border bg-surface-raised text-foreground-muted">
                              {prod.variantCount} Varian
                            </span>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-border/60 my-2.5" />

                        {/* Bottom: Pricing & Action Button (Gambar 2 Style) */}
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="line-through text-[11px] text-foreground-muted">
                                Rp {prod.originalPrice.toLocaleString('id-ID')}
                              </span>
                              <span className="px-1.5 py-0.2 rounded border border-rose-200 bg-rose-50 text-[10px] font-bold text-rose-600">
                                Hemat Rp {(prod.originalPrice - prod.minPrice).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <span className="block text-sm sm:text-base font-black text-[#C96F55]">
                              Rp {prod.minPrice.toLocaleString('id-ID')}
                            </span>
                          </div>

                          <div>
                            {isSelected ? (
                              <button
                                type="button"
                                disabled
                                className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1 shrink-0 opacity-90 cursor-default"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Terpilih</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddProduct(prod.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-[#C96F55] text-white hover:bg-[#b55e45] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
                              >
                                <span>Pilih</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:px-6 sm:py-3 border-t border-border bg-surface flex items-center justify-between text-xs text-foreground-muted">
              <span>
                Dipilih:{' '}
                <strong className="text-foreground">{draftManualIds.length}</strong> produk
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddPickerOpen(false)}
                className="text-xs h-8 px-4 rounded-xl hover:bg-surface-raised cursor-pointer"
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
