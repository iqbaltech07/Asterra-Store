'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faBolt,
  faCreditCard,
  faLayerGroup,
  faHeadphones,
  faArrowRight,
  faPlus,
  faMinus,
  faTv,
  faCircleQuestion,
  faBox,
  faTableCellsLarge,
  faStar,
  faFire,
  faEye,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import { useCatalogProducts } from '@/lib/hooks/use-catalog-products';
import { useProductCards } from '@/lib/hooks/use-product-cards';
import { useActiveCampaigns } from '@/lib/hooks/use-active-campaigns';
import { useHomepageSections } from '@/lib/hooks/use-homepage-sections';
import {
  calculateCampaignPrice,
  isProductInCampaign,
  isCampaignActiveNow,
  sortCampaignsByPriority,
  getCampaignCountdown,
  ActiveCampaign,
} from '@/lib/utils/promo-pricing';
import { QuickViewModal, QuickViewProductData } from '@/components/products/quick-view-modal';
import { getRecentlyViewed, RecentlyViewedItem } from '@/lib/services/recently-viewed';
import { ProductItem } from '@/lib/products-data';
import { HeroBannerSwiper } from '@/components/home/hero-banner-swiper';
import {
  ApplicationGroupItem,
  FeaturedGridCard,
  FeaturedGridCardSkeleton,
  ShowcaseLoopingCard,
  ShowcaseLoopingCardSkeleton,
  FeaturedSectionCountdownBadge,
} from '@/components/home/product-showcase-cards';
import { getDynamicSoldCount } from '@/lib/hooks/use-dynamic-orders';


export default function HomePage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // 1. Selector category state: ONLY PROMO, TERLARIS, TERBARU. (PROMO is default & priority)
  const [activeCategory, setActiveCategory] = useState<'promo' | 'terlaris' | 'terbaru'>('promo');

  // 2. Quick View Modal State
  const [quickViewProduct, setQuickViewProduct] = useState<QuickViewProductData | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // 3. Recently Viewed Products (localStorage)
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);

  // Active Campaign Status for live promotional discounts & badges (cached via shared query)
  const { campaigns: activeCampaigns } = useActiveCampaigns();

  useEffect(() => {
    setRecentlyViewed(getRecentlyViewed());
  }, []);

  // Dynamic products and Product Cards fetched from catalog API (cached via shared query)
  const { data: catalogResponse, isLoading: isCatalogLoadingQuery } = useCatalogProducts();
  const { data: sectionsResponse, isLoading: isSectionsLoading } = useHomepageSections();
  const { data: cardsResponse } = useProductCards();

  // Reference timestamp to update dynamic sold counts matching /orders delay (5–20m interval)
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const isCatalogLoading = (isCatalogLoadingQuery || isSectionsLoading) && !sectionsResponse?.sections && !catalogResponse?.data;

  const allProducts = useMemo(
    () => catalogResponse?.data || [],
    [catalogResponse?.data]
  );

  // Curated Application definitions for the Featured views
  const appConfigurations = useMemo(() => {
    return [
      {
        name: 'Google Gemini',
        match: (t: string) => t.includes('gemini') || t.includes('google ai'),
        cat: 'AI Assistant & Cloud',
        tag: 'ai' as const,
        soldCount: getDynamicSoldCount('Google Gemini', now, 36),
        targetMax: 40,
        rating: '5.0',
        isPromo: true,
        isTerlaris: false,
        isTerbaru: true,
      },
      {
        name: 'Canva',
        match: (t: string) => t.includes('canva'),
        cat: 'Design & Kreatif',
        tag: 'design' as const,
        soldCount: getDynamicSoldCount('Canva', now, 29),
        targetMax: 35,
        rating: '5.0',
        isPromo: true,
        isTerlaris: true,
        isTerbaru: false,
      },
      {
        name: 'CapCut',
        match: (t: string) => t.includes('capcut'),
        cat: 'Video Editing & Content',
        tag: 'video' as const,
        soldCount: getDynamicSoldCount('CapCut', now, 34),
        targetMax: 40,
        rating: '4.9',
        isPromo: true,
        isTerlaris: true,
        isTerbaru: false,
      },
      {
        name: 'ChatGPT',
        match: (t: string) => t.includes('chatgpt') || t.includes('chat gpt') || t.includes('plus plan'),
        cat: 'AI Assistant & Writing',
        tag: 'ai' as const,
        soldCount: getDynamicSoldCount('ChatGPT', now, 25),
        targetMax: 32,
        rating: '5.0',
        isPromo: true,
        isTerlaris: true,
        isTerbaru: false,
      },
      {
        name: 'Alight Motion',
        match: (t: string) => t.includes('alightmotion') || t.includes('alight motion'),
        cat: 'Motion Graphic & VFX',
        tag: 'video' as const,
        soldCount: getDynamicSoldCount('Alight Motion', now, 21),
        targetMax: 28,
        rating: '4.8',
        isPromo: false,
        isTerlaris: false,
        isTerbaru: true,
      },
      {
        name: 'YouTube',
        match: (t: string) => t.includes('youtube'),
        cat: 'Streaming & Video',
        tag: 'streaming' as const,
        soldCount: getDynamicSoldCount('YouTube', now, 32),
        targetMax: 40,
        rating: '5.0',
        isPromo: true,
        isTerlaris: true,
        isTerbaru: false,
      },
      {
        name: 'Spotify',
        match: (t: string) => t.includes('spotify'),
        cat: 'Music & Podcast',
        tag: 'streaming' as const,
        soldCount: getDynamicSoldCount('Spotify', now, 37),
        targetMax: 40,
        rating: '5.0',
        isPromo: false,
        isTerlaris: true,
        isTerbaru: false,
      },
      {
        name: 'Netflix',
        match: (t: string) => t.includes('netflix'),
        cat: 'Movie & Series HD',
        tag: 'streaming' as const,
        soldCount: getDynamicSoldCount('Netflix', now, 38),
        targetMax: 40,
        rating: '5.0',
        isPromo: true,
        isTerlaris: true,
        isTerbaru: false,
      },
      {
        name: 'Vidio',
        match: (t: string) => t.includes('vidio'),
        cat: 'Live Sports & Premier',
        tag: 'streaming' as const,
        soldCount: getDynamicSoldCount('Vidio', now, 23),
        targetMax: 30,
        rating: '4.9',
        isPromo: false,
        isTerlaris: true,
        isTerbaru: false,
      },
      {
        name: 'WeTV',
        match: (t: string) => t.includes('wetv'),
        cat: 'Asian Drama VIP',
        tag: 'streaming' as const,
        soldCount: getDynamicSoldCount('WeTV', now, 28),
        targetMax: 33,
        rating: '4.8',
        isPromo: false,
        isTerlaris: false,
        isTerbaru: true,
      },
      {
        name: 'iQIYI',
        match: (t: string) => t.includes('iqiyi'),
        cat: 'Anime & Drama HD',
        tag: 'streaming' as const,
        soldCount: getDynamicSoldCount('iQIYI', now, 22),
        targetMax: 28,
        rating: '4.8',
        isPromo: true,
        isTerlaris: false,
        isTerbaru: true,
      },
      {
        name: 'Bstation',
        match: (t: string) => t.includes('bstation'),
        cat: 'Anime & Pop Culture',
        tag: 'streaming' as const,
        soldCount: getDynamicSoldCount('Bstation', now, 24),
        targetMax: 30,
        rating: '4.8',
        isPromo: false,
        isTerlaris: false,
        isTerbaru: true,
      },
      {
        name: 'Viu',
        match: (t: string) => t.includes('viu'),
        cat: 'Asian Drama & Variety',
        tag: 'streaming' as const,
        soldCount: getDynamicSoldCount('Viu', now, 27),
        targetMax: 33,
        rating: '4.9',
        isPromo: false,
        isTerlaris: true,
        isTerbaru: true,
      },
      {
        name: 'Wink',
        match: (t: string) => t.includes('wink'),
        cat: 'Apps & Streaming',
        tag: 'video' as const,
        soldCount: getDynamicSoldCount('Wink', now, 24),
        targetMax: 30,
        rating: '4.9',
        isPromo: false,
        isTerlaris: false,
        isTerbaru: true,
      },
      {
        name: 'Meitu',
        match: (t: string) => t.includes('meitu'),
        cat: 'Apps & Streaming',
        tag: 'design' as const,
        soldCount: getDynamicSoldCount('Meitu', now, 22),
        targetMax: 28,
        rating: '4.9',
        isPromo: false,
        isTerlaris: false,
        isTerbaru: true,
      },
    ];
  }, [now]);

  // Map to Featured Products (authoritative backend data with 8-product guarantee & resilient fallback)
  const featuredApps = useMemo(() => {
    // 1. Map Card Produk dynamically from database or fallback to app configurations
    const dbCards = (cardsResponse?.data || []).filter((c) => c.status === 'active');
    const allMapped: ApplicationGroupItem[] = dbCards.length > 0
      ? dbCards.map((card) => {
          const items = allProducts.filter((p) => {
            if (p.status && p.status !== 'active') return false;
            if ((p as any).cardId === card.id || (p as any).card_id === card.id) return true;
            const text = `${p.name} ${(p as unknown as { id?: string }).id || ''}`.toLowerCase();
            return text.includes(card.slug.replace(/-/g, ' ')) || text.includes(card.name.toLowerCase());
          });

          const activePrices = items.map((p) => p.price).filter((p) => p > 0);
          const minPrice = card.minPrice > 0 ? card.minPrice : (activePrices.length > 0 ? Math.min(...activePrices) : 0);
          const isOutOfStock = card.stockStatus === 'out_of_stock' || card.isOutOfStock || minPrice <= 0;

          const catNameLower = (card.categoryName || '').toLowerCase();
          const categoryTag: 'ai' | 'design' | 'video' | 'streaming' | 'other' =
            catNameLower.includes('ai') ? 'ai' :
            catNameLower.includes('design') ? 'design' :
            catNameLower.includes('video') ? 'video' :
            catNameLower.includes('stream') ? 'streaming' : 'other';

          return {
            id: card.id,
            name: card.name,
            slug: card.slug,
            category: card.categoryName || 'Layanan Digital',
            categoryTag,
            logoUrl: card.logoUrl,
            imageUrl: card.imageUrl,
            description: card.description,
            soldCount: Math.min(40, Math.max(20, card.soldCount ?? 20)),
            targetMax: Math.min(40, Math.max(20, card.soldCount ?? 20)),
            rating: String(card.rating || '5.0'),
            badgeLabel:
              activeCategory === 'promo'
                ? '🔥 Promo'
                : activeCategory === 'terlaris'
                ? 'Terlaris'
                : 'Baru',
            isPromo: card.sections?.includes('promo') ?? true,
            isTerlaris: card.sections?.includes('terlaris') ?? true,
            isTerbaru: card.sections?.includes('terbaru') ?? true,
            items,
            minPrice,
            isOutOfStock,
          };
        }).filter((app) => app.minPrice > 0)
      : appConfigurations.map((target) => {
          const items = allProducts.filter((p) => {
            const text = `${p.name} ${(p as unknown as { id?: string }).id || ''} ${(p as unknown as { providerCode?: string }).providerCode || ''}`.toLowerCase();
            if (text.includes('lisensi')) return false;
            return target.match(text);
          });

          const activePrices = items.map((p) => p.price).filter((p) => p > 0);
          const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : 0;

          const isOutOfStock =
            items.length === 0 ||
            items.every((p) => {
              const isZeroStock = p.stock !== undefined && p.stock <= 0;
              const isEmpty = p.providerStatus === 'empty';
              const isUnavailable = p.status === 'out_of_stock' || p.status === 'archived';
              return isZeroStock || isEmpty || isUnavailable;
            });

          return {
            id: target.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name: target.name,
            slug: target.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            category: target.cat,
            categoryTag: target.tag,
            soldCount: Math.min(40, Math.max(20, target.soldCount ?? 20)),
            targetMax: Math.min(40, Math.max(20, target.targetMax ?? 20)),
            rating: target.rating,
            badgeLabel:
              activeCategory === 'promo'
                ? '🔥 Promo'
                : activeCategory === 'terlaris'
                ? 'Terlaris'
                : 'Baru',
            isPromo: target.isPromo,
            isTerlaris: target.isTerlaris,
            isTerbaru: target.isTerbaru,
            items,
            minPrice,
            isOutOfStock,
          };
        }).filter((app) => app.items.length > 0 && app.minPrice > 0);

    // Rule: If Promo tab is active but no campaign is running, show no promo products!
    if (activeCategory === 'promo' && (!activeCampaigns || activeCampaigns.length === 0)) {
      return [];
    }

    // 2. Authoritative Backend Section Ordering:
    // If backend provides prioritized items (from Admin manual ordering or auto ranking),
    // map them to distinct Product applications to avoid duplicate variants and display clean Brand entities
    const backendSection = sectionsResponse?.sections?.[activeCategory];
    if (backendSection && Array.isArray(backendSection.data) && backendSection.data.length > 0) {
      const orderedApps: ApplicationGroupItem[] = [];
      const seenNames = new Set<string>();

      for (const item of backendSection.data) {
        const itemText = `${item.name || ''} ${(item as unknown as { brand?: string }).brand || ''} ${item.id || ''}`.toLowerCase();
        const matched = allMapped.find((app) => {
          const appName = app.name.toLowerCase();
          const appSlug = app.slug.toLowerCase();
          return itemText.includes(appName) || itemText.includes(appSlug) || (appName.includes('gemini') && (itemText.includes('google') || itemText.includes('gemini')));
        });

        if (matched && !seenNames.has(matched.name)) {
          if (activeCategory === 'promo') {
            const hasPromo = (activeCampaigns || []).some((camp) =>
              isProductInCampaign(matched, camp) ||
              matched.items.some((it) =>
                isProductInCampaign({ id: it.id, name: it.name, category: it.category?.name }, camp)
              )
            );
            if (!hasPromo) continue;
          }
          seenNames.add(matched.name);
          orderedApps.push(matched);
          if (orderedApps.length >= 8) break;
        }
      }

      // If fewer than 8, fill from category-specific candidates in allMapped
      if (orderedApps.length < 8) {
        let fallbackCandidates = allMapped;
        if (activeCategory === 'promo') {
          if (activeCampaigns && activeCampaigns.length > 0) {
            fallbackCandidates = allMapped.filter((app) =>
              activeCampaigns.some((camp) =>
                isProductInCampaign(app, camp) ||
                app.items.some((it) =>
                  isProductInCampaign({ id: it.id, name: it.name, category: it.category?.name }, camp)
                )
              )
            );
          } else {
            fallbackCandidates = [];
          }
        } else if (activeCategory === 'terlaris') {
          fallbackCandidates = allMapped.filter((app) => app.isTerlaris);
        } else if (activeCategory === 'terbaru') {
          fallbackCandidates = allMapped.filter((app) => app.isTerbaru);
        }

        for (const candidate of fallbackCandidates) {
          if (!seenNames.has(candidate.name)) {
            seenNames.add(candidate.name);
            orderedApps.push(candidate);
            if (orderedApps.length >= 8) break;
          }
        }
      }

      if (orderedApps.length > 0) {
        return orderedApps.slice(0, 8);
      }
    }

    // 3. Resilient Fallback if backend section is empty
    if (activeCategory === 'promo') {
      // Rule 4: Dynamic based on active campaigns!
      if (!activeCampaigns || activeCampaigns.length === 0) {
        return [];
      }

      // Filter products participating in active campaigns
      const promoMatching = allMapped.filter((app) => {
        return activeCampaigns.some((camp) =>
          isProductInCampaign(app, camp) ||
          app.items.some((item) =>
            isProductInCampaign({ id: item.id, name: item.name, category: item.category?.name }, camp)
          )
        );
      });

      // Maximum 8 popular products, sorted by popularity (soldCount descending)
      return promoMatching
        .sort((a, b) => (b.targetMax || b.soldCount || 0) - (a.targetMax || a.soldCount || 0))
        .slice(0, 8);
    }

    if (activeCategory === 'terlaris') {
      return allMapped
        .filter((app) => app.isTerlaris)
        .sort((a, b) => (b.targetMax || b.soldCount || 0) - (a.targetMax || a.soldCount || 0))
        .slice(0, 8);
    }

    if (activeCategory === 'terbaru') {
      return allMapped
        .filter((app) => app.isTerbaru)
        .sort((a, b) => (b.targetMax || b.soldCount || 0) - (a.targetMax || a.soldCount || 0))
        .slice(0, 8);
    }

    return allMapped.slice(0, 8);
  }, [sectionsResponse, allProducts, appConfigurations, activeCategory, activeCampaigns, cardsResponse]);

  // Client-mounted tracking
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Product Looping Showcase: Curated list of popular accounts that stays completely independent of the selector
  const showcaseApps = useMemo(() => {
    const showcaseNames = ['Canva', 'ChatGPT', 'Netflix', 'YouTube', 'CapCut', 'Google Gemini', 'Spotify', 'Vidio', 'Alight Motion', 'iQIYI'];
    const dbCards = cardsResponse?.data || [];
    const mapped = showcaseNames.map((name) => {
      const matchedCard = dbCards.find((c) => {
        const cName = c.name.toLowerCase();
        const tName = name.toLowerCase();
        return cName.includes(tName) || tName.includes(cName);
      });

      const conf = appConfigurations.find((a) => a.name === name) || {
        name,
        match: (t: string) => t.includes(name.toLowerCase()),
        cat: 'Digital Product',
        tag: 'other' as const,
        soldCount: getDynamicSoldCount(name, now),
        rating: '5.0',
      };

      const items = allProducts.filter((p) => {
        if (matchedCard && ((p as any).cardId === matchedCard.id || (p as any).card_id === matchedCard.id)) return true;
        const text = `${p.name} ${(p as unknown as { id?: string }).id || ''}`.toLowerCase();
        return conf.match(text);
      });

      const activePrices = items.map((p) => p.price).filter((p) => p > 0);
      const minPrice = matchedCard && matchedCard.minPrice > 0
        ? matchedCard.minPrice
        : (activePrices.length > 0 ? Math.min(...activePrices) : 0);

      const isOutOfStock =
        matchedCard ? (matchedCard.stockStatus === 'out_of_stock' || matchedCard.isOutOfStock || minPrice <= 0) :
        (items.length === 0 ||
        items.every((p) => {
          const isZeroStock = p.stock !== undefined && p.stock <= 0;
          const isEmpty = p.providerStatus === 'empty';
          const isUnavailable = p.status === 'out_of_stock' || p.status === 'archived';
          return isZeroStock || isEmpty || isUnavailable;
        }));

      const finalSoldCount = matchedCard?.soldCount !== undefined
        ? Math.min(40, Math.max(20, matchedCard.soldCount))
        : Math.min(40, Math.max(20, conf.soldCount));

      return {
        id: matchedCard?.id || conf.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: matchedCard?.name || conf.name,
        slug: matchedCard?.slug || conf.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        category: matchedCard?.categoryName || conf.cat,
        categoryTag: conf.tag,
        logoUrl: matchedCard?.logoUrl,
        imageUrl: matchedCard?.imageUrl,
        description: matchedCard?.description,
        soldCount: finalSoldCount,
        rating: String(matchedCard?.rating || conf.rating || '5.0'),
        items,
        minPrice,
        isOutOfStock,
      };
    });

    // Only include applications that have real items
    return mapped.filter((app) => app.items.length > 0 && app.minPrice > 0);
  }, [allProducts, appConfigurations, now, cardsResponse]);

  const handleOpenQuickView = (app: ApplicationGroupItem) => {
    const minPrice = app.minPrice;
    if (!minPrice || minPrice <= 0) return;

    setQuickViewProduct({
      id: app.slug,
      name: app.name,
      slug: app.slug,
      category: app.category,
      price: minPrice,
      priceFormatted: `Rp ${minPrice.toLocaleString('id-ID')}`,
      rating: app.rating,
      soldCount: app.soldCount,
      description: `Akses resmi dan bergaransi penuh untuk ${app.name} di Asterra Store dengan konfirmasi otomatis dan dukungan CS 24 jam.`,
      guaranteeTitle: 'Garansi Penuh 100% Penggantian',
      processTitle: 'Aktivasi Otomatis 1 - 15 Menit',
      privacyTitle: 'Akun Private / Sharing Workspace Resmi',
    });
    setIsQuickViewOpen(true);
  };

  const handleOpenQuickViewRecent = (item: RecentlyViewedItem) => {
    setQuickViewProduct({
      id: item.id,
      name: item.name,
      slug: item.slug || item.id,
      category: item.categoryName,
      price: item.price,
      priceFormatted: item.priceFormatted || `Rp ${item.price.toLocaleString('id-ID')}`,
      rating: item.rating || '5.0',
      description: `Akses akun digital resmi ${item.name} dengan jaminan garansi penggantian penuh.`,
      guaranteeTitle: 'Garansi Penuh 100% Penggantian',
      processTitle: 'Aktivasi Cepat 1 - 15 Menit',
      privacyTitle: 'Akun Terverifikasi',
    });
    setIsQuickViewOpen(true);
  };

  const faqItems = [
    {
      q: 'Bagaimana cara membeli produk di Asterra Store?',
      a: 'Pilih aplikasi atau produk yang Anda inginkan, tentukan durasi masa aktif, isi nama dan email aktif pada halaman checkout, lalu selesaikan pembayaran melalui QRIS otomatis atau transfer bank.',
    },
    {
      q: 'Berapa lama proses aktivasi produk?',
      a: 'Sebagian besar produk diproses secara instan dalam 1 hingga 15 menit setelah pembayaran Anda terverifikasi oleh gateway pembayaran otomatis kami.',
    },
    {
      q: 'Apakah semua produk memiliki garansi resmi?',
      a: 'Ya, seluruh produk aktif di Asterra Store dilengkapi garansi resmi 100% penggantian jika akun mengalami kendala akses selama masa aktif langganan masih berlaku.',
    },
    {
      q: 'Bagaimana jika produk mengalami kendala?',
      a: 'Anda dapat langsung menghubungi tim Customer Service resmi Asterra Store melalui WhatsApp CS 24 Jam dengan melampirkan nomor Invoice pesanan Anda.',
    },
    {
      q: 'Bagaimana cara melihat pesanan saya?',
      a: 'Anda dapat membuka menu "Pesanan Saya" pada navigasi atas atau memasukkan ID invoice pesanan untuk melihat detail aktivasi dan status lisensi Anda.',
    },
    {
      q: 'Metode pembayaran apa saja yang tersedia?',
      a: 'Kami mendukung QRIS (bisa discan dengan seluruh aplikasi m-Banking dan e-Wallet seperti GoPay, OVO, Dana, ShopeePay), serta Virtual Account perbankan terkemuka.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#121A2A] flex flex-col selection:bg-[#C96F55]/20 selection:text-[#C96F55]">
      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 sm:pt-3 pb-8 sm:pb-12 w-full overflow-hidden">
        {/*
          SECTION 2: HERO BANNER IMAGE SWIPER (AUTOPLAY 5S IF >= 2 BANNERS)
        */}
        <HeroBannerSwiper />

        {/*
          SECTION 3: FEATURED PRODUCTS (STATIC GRID: [ 🔥 Promo ] [ Terlaris ] [ Terbaru ])
          MUST BE LOCATED IMMEDIATELY BELOW THE BANNER.
          - Selector: ONLY Promo / Terlaris / Terbaru (Best Seller is removed).
          - Promo is default and visually prioritized with Asterra coral accent.
          - Cards are STATIC (NOT marquee, NOT slider, NOT looping).
          - 4 columns on desktop, 2 columns on mobile.
          - Immediately visible in first viewport!
        */}
        <section id="produk-unggulan" aria-label="Produk Unggulan Asterra" data-gsap="featured-section" className="mb-6 sm:mb-8">
          {/* Section Heading & Subtitle */}
          <div className="flex items-center justify-between mb-2.5 sm:mb-3 px-0.5">
            <h2 data-gsap="section-heading" className="text-sm sm:text-base md:text-lg font-black tracking-tight text-[#121A2A]">
              Produk Unggulan & Lisensi Resmi
            </h2>
            <span data-gsap="hero-text" className="text-[11px] sm:text-xs text-[#121A2A]/55 font-medium hidden sm:inline">
              Garansi 100% Penggantian · Aktivasi Instan
            </span>
          </div>

          {/* Selector Tabs: [ 🔥 Promo ] [ Terlaris ] [ Terbaru ] */}
          <div data-gsap="category-tabs" className="flex items-center justify-between gap-2 mb-3 sm:mb-4 pb-1 border-b border-[rgba(18,26,42,0.06)] overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Tab 1: PROMO (DEFAULT & VISUALLY PROMINENT) */}
              <button
                type="button"
                data-gsap="hero-button"
                onClick={() => setActiveCategory('promo')}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
                  activeCategory === 'promo'
                    ? 'bg-[#C96F55] text-white shadow-xs scale-102 ring-2 ring-[#C96F55]/30'
                    : 'bg-white text-[#C96F55] border border-[#C96F55]/40 hover:bg-[#C96F55]/10'
                }`}
              >
                <FontAwesomeIcon icon={faFire} className="w-3.5 h-3.5" />
                <span>Promo</span>
              </button>

              {/* Tab 2: Terlaris */}
              <button
                type="button"
                data-gsap="hero-button"
                onClick={() => setActiveCategory('terlaris')}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] transition-all cursor-pointer ${
                  activeCategory === 'terlaris'
                    ? 'bg-[#121A2A] text-white font-bold shadow-xs'
                    : 'bg-white text-[#121A2A]/70 border border-[rgba(18,26,42,0.12)] hover:border-[#121A2A]/40 hover:text-[#121A2A] font-semibold'
                }`}
              >
                <span>Terlaris</span>
              </button>

              {/* Tab 3: Terbaru */}
              <button
                type="button"
                data-gsap="hero-button"
                onClick={() => setActiveCategory('terbaru')}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] transition-all cursor-pointer ${
                  activeCategory === 'terbaru'
                    ? 'bg-[#121A2A] text-white font-bold shadow-xs'
                    : 'bg-white text-[#121A2A]/70 border border-[rgba(18,26,42,0.12)] hover:border-[#121A2A]/40 hover:text-[#121A2A] font-semibold'
                }`}
              >
                <span>Terbaru</span>
              </button>
            </div>

            {/* Quick Link to Full Catalog */}
            <Link
              href="/products"
              data-gsap="hero-button"
              className="text-xs font-semibold text-[#C96F55] hover:text-[#B86047] hidden md:inline-flex items-center gap-1 shrink-0"
            >
              <span>Semua Katalog</span>
              <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
            </Link>
          </div>

          {/* Live Campaign Countdown (Isolated component to avoid re-rendering entire homepage every 1s) */}
          {isMounted && (
            <FeaturedSectionCountdownBadge
              activeCampaigns={activeCampaigns}
              featuredApps={featuredApps}
            />
          )}

          {/* STATIC PRODUCT GRID (4 columns desktop, 2 columns mobile) */}
          {isCatalogLoading ? (
            <div data-gsap="product-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-4.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <FeaturedGridCardSkeleton key={`skeleton-featured-${i}`} />
              ))}
            </div>
          ) : featuredApps.length > 0 ? (
            <div key={activeCategory} data-gsap="product-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-4.5 animate-tab-glide">
              {featuredApps.map((app) => (
                <FeaturedGridCard
                  key={`featured-${activeCategory}-${app.name}`}
                  app={app}
                  activeCampaigns={activeCampaigns}
                  onQuickView={handleOpenQuickView}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-[rgba(18,26,42,0.08)] col-span-full">
              <p className="text-xs sm:text-sm font-semibold text-[#121A2A]/70">
                {activeCategory === 'promo'
                  ? 'Saat ini belum ada promo campaign yang sedang berlangsung. Cek kembali nanti!'
                  : 'Belum ada produk aktif yang tersedia untuk kategori ini.'}
              </p>
            </div>
          )}
        </section>

        {/*
          SECTION 4: PRODUCT LOOPING SHOWCASE (VISUAL PEMANIS ONLY)
          MUST BE LOCATED BELOW FEATURED PRODUCTS.
          - Smooth infinite horizontal marquee loop.
          - Independent showcase: NOT affected when user switches between Promo / Terlaris / Terbaru.
          - Clear visual separation with dedicated section heading.
        */}
        <section aria-label="Showcase Produk Asterra" className="mt-7 sm:mt-10 mb-6 sm:mb-8 pt-6 sm:pt-7 border-t border-[rgba(18,26,42,0.06)]">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <h2 data-gsap="section-heading" className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#121A2A]/85">
                Showcase Katalog Pilihan
              </h2>
            </div>
            <span className="text-[11px] text-[#121A2A]/50 font-medium hidden sm:inline">
              Aktivasi instan 1 - 15 menit · Garansi resmi
            </span>
          </div>

          {/* Marquee Track Container with Edge Fades */}
          <div className="carousel-viewport relative w-full overflow-hidden py-1">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-3 sm:w-6 z-10 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-3 sm:w-6 z-10 bg-gradient-to-l from-white to-transparent" />

            {isCatalogLoading ? (
              <div className="flex flex-nowrap w-max gap-3 sm:gap-4 overflow-hidden py-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ShowcaseLoopingCardSkeleton key={`skeleton-showcase-${i}`} />
                ))}
              </div>
            ) : showcaseApps.length > 0 ? (
              <div
                className="carousel-track flex flex-nowrap w-max shrink-0 items-stretch"
                style={{
                  display: 'flex',
                  width: 'max-content',
                  flexShrink: 0,
                  willChange: 'transform',
                  animation: 'infinite-scroll 45s linear infinite',
                }}
              >
                {/* Original Showcase Items */}
                {showcaseApps.map((app) => (
                  <ShowcaseLoopingCard
                    key={`showcase-orig-${app.name}`}
                    app={app}
                    activeCampaigns={activeCampaigns}
                    onQuickView={handleOpenQuickView}
                  />
                ))}

                {/* Duplicated Items for continuous -50% loop */}
                {showcaseApps.map((app) => (
                  <ShowcaseLoopingCard
                    key={`showcase-dup-${app.name}`}
                    app={app}
                    isDuplicate
                    activeCampaigns={activeCampaigns}
                    onQuickView={handleOpenQuickView}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {/* SECTION 5: TERAKHIR DILIHAT (Conditional from localStorage: Rendered ONLY if history exists) */}
        {recentlyViewed.length > 0 && (
          <section
            aria-label="Produk Terakhir Dilihat"
            className="mt-6 sm:mt-8 mb-6 p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#C96F55]/10 text-[#C96F55] flex items-center justify-center">
                  <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-[#121A2A]">
                  Terakhir Dilihat
                </h3>
              </div>
              <span className="text-[11px] text-[#121A2A]/50 font-medium">
                Tersimpan di peramban Anda
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {recentlyViewed.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 sm:p-3 bg-white rounded-xl border border-[rgba(18,26,42,0.08)] hover:border-[#C96F55]/50 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#C96F55] block truncate">
                      {item.categoryName || 'Akun Digital'}
                    </span>
                    <Link
                      href={`/products/${item.slug || item.id}`}
                      className="font-bold text-xs sm:text-sm text-[#121A2A] hover:text-[#C96F55] transition-colors line-clamp-1 mt-0.5"
                      title={item.name}
                    >
                      {item.name}
                    </Link>
                  </div>

                  <div className="pt-2 mt-2 border-t border-[rgba(18,26,42,0.06)] flex items-center justify-between">
                    <span className="font-black text-xs sm:text-sm text-[#121A2A]">
                      {item.priceFormatted || `Rp ${item.price.toLocaleString('id-ID')}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenQuickViewRecent(item)}
                      title="Lihat Cepat"
                      aria-label={`Tampilan cepat ${item.name}`}
                      className="w-6 h-6 rounded-md bg-[rgba(18,26,42,0.05)] hover:bg-[#C96F55] text-[#121A2A]/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 6: LIHAT SEMUA KATALOG BUTTON */}
        <div className="flex justify-center mt-5 mb-10 sm:mb-14">
          <Link href="/product" className="w-full max-w-sm sm:max-w-md">
            <Button
              variant="outline"
              className="w-full h-10 sm:h-11 rounded-xl border-[rgba(18,26,42,0.18)] hover:border-[#C96F55] bg-white hover:bg-[rgba(201,111,85,0.04)] text-[#121A2A] hover:text-[#C96F55] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-subtle"
            >
              <span>Lihat Semua Katalog</span>
              <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* SECTION 7: KENAPA ASTERRA (6 COMMITMENTS) */}
        <section id="keunggulan" data-gsap-section="keunggulan" className="mb-10 sm:mb-14 pt-6 sm:pt-8 border-t border-[rgba(18,26,42,0.08)]">
          <div data-gsap="keunggulan-header" className="max-w-2xl mb-6">
            <span className="text-[11px] font-bold text-[#C96F55] uppercase tracking-wider block mb-1">
              Standar Kualitas &amp; Layanan
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#121A2A] tracking-tight">
              Kenapa Asterra?
            </h2>
            <p className="text-xs sm:text-sm text-[#121A2A]/65 mt-0.5 leading-relaxed">
              Enam komitmen utama yang menjadikan Asterra Store pilihan ribuan kreator, mahasiswa,
              dan profesional di seluruh Indonesia.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4.5">
            {/* 1. Produk Terverifikasi */}
            <div data-gsap="keunggulan-card" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-1.5 sm:space-y-2 hover:border-[rgba(18,26,42,0.2)] transition-[border-color,box-shadow,background-color] duration-200">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-base font-bold text-[#121A2A] leading-tight">Produk Terverifikasi</h3>
              <p className="text-[10px] sm:text-xs text-[#121A2A]/65 leading-snug sm:leading-relaxed">
                Setiap layanan memiliki informasi lisensi, durasi masa aktif, dan ketentuan garansi yang
                tercantum jelas dan transparan.
              </p>
            </div>

            {/* 2. Aktivasi Cepat */}
            <div data-gsap="keunggulan-card" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-1.5 sm:space-y-2 hover:border-[rgba(18,26,42,0.2)] transition-[border-color,box-shadow,background-color] duration-200">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <FontAwesomeIcon icon={faBolt} className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-base font-bold text-[#121A2A] leading-tight">Aktivasi Cepat</h3>
              <p className="text-[10px] sm:text-xs text-[#121A2A]/65 leading-snug sm:leading-relaxed">
                Alur pemrosesan pesanan otomatis terintegrasi. Anda mendapatkan akses kerja siap pakai
                dalam 1 hingga 15 menit.
              </p>
            </div>

            {/* 3. Pilihan Lengkap */}
            <div data-gsap="keunggulan-card" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-1.5 sm:space-y-2 hover:border-[rgba(18,26,42,0.2)] transition-[border-color,box-shadow,background-color] duration-200">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <FontAwesomeIcon icon={faLayerGroup} className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-base font-bold text-[#121A2A] leading-tight">Pilihan Lengkap</h3>
              <p className="text-[10px] sm:text-xs text-[#121A2A]/65 leading-snug sm:leading-relaxed">
                Dari asisten AI, software desain, video editing, hingga hiburan streaming premium
                semuanya tersedia dalam satu platform.
              </p>
            </div>

            {/* 4. Pembayaran Praktis */}
            <div data-gsap="keunggulan-card" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-1.5 sm:space-y-2 hover:border-[rgba(18,26,42,0.2)] transition-[border-color,box-shadow,background-color] duration-200">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <FontAwesomeIcon icon={faCreditCard} className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-base font-bold text-[#121A2A] leading-tight">Pembayaran Praktis</h3>
              <p className="text-[10px] sm:text-xs text-[#121A2A]/65 leading-snug sm:leading-relaxed">
                Dukungan gateway pembayaran terpadu melalui QRIS real-time, dompet digital e-Wallet,
                serta Virtual Account bank resmi.
              </p>
            </div>

            {/* 5. Garansi Jelas */}
            <div data-gsap="keunggulan-card" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-1.5 sm:space-y-2 hover:border-[rgba(18,26,42,0.2)] transition-[border-color,box-shadow,background-color] duration-200">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-base font-bold text-[#121A2A] leading-tight">Garansi Jelas</h3>
              <p className="text-[10px] sm:text-xs text-[#121A2A]/65 leading-snug sm:leading-relaxed">
                Klaim garansi mudah dan transparan. Jika terjadi kendala akses sebelum masa aktif
                berakhir, kami sediakan penggantian unit 100%.
              </p>
            </div>

            {/* 6. Customer Support */}
            <div data-gsap="keunggulan-card" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-1.5 sm:space-y-2 hover:border-[rgba(18,26,42,0.2)] transition-[border-color,box-shadow,background-color] duration-200">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <FontAwesomeIcon icon={faHeadphones} className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-base font-bold text-[#121A2A] leading-tight">Customer Support</h3>
              <p className="text-[10px] sm:text-xs text-[#121A2A]/65 leading-snug sm:leading-relaxed">
                Tim bantuan profesional siap merespons kebutuhan dan pertanyaan teknis Anda melalui
                saluran WhatsApp resmi Asterra Store.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 8: CARA PEMESANAN (4 STEPS) */}
        <section id="panduan" data-gsap-section="panduan" className="mb-10 sm:mb-14 pt-6 sm:pt-8 border-t border-[rgba(18,26,42,0.08)]">
          <div data-gsap="panduan-header" className="max-w-2xl mb-6">
            <span className="text-[11px] font-bold text-[#C96F55] uppercase tracking-wider block mb-1">
              Panduan Transaksi
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#121A2A] tracking-tight">
              Cara Pemesanan
            </h2>
            <p className="text-xs sm:text-sm text-[#121A2A]/65 mt-0.5 leading-relaxed">
              Empat langkah praktis untuk mendapatkan lisensi digital premium Anda tanpa ribet.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4.5">
            {/* Step 01 */}
            <div data-gsap="panduan-step" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col justify-between hover:border-[rgba(18,26,42,0.2)] transition-[border-color,box-shadow,background-color] duration-200">
              <div>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-xl sm:text-3xl font-black text-[#C96F55]/40 font-mono">
                    01
                  </span>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55]">
                    <FontAwesomeIcon icon={faTableCellsLarge} className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-[#121A2A] mb-0.5 sm:mb-1">
                  Pilih Aplikasi
                </h3>
                <p className="text-[10px] sm:text-xs text-[#121A2A]/65 leading-snug sm:leading-relaxed">
                  Tentukan aplikasi atau tools digital yang ingin Anda gunakan dari katalog Asterra.
                </p>
              </div>
            </div>

            {/* Step 02 */}
            <div data-gsap="panduan-step" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col justify-between hover:border-[rgba(18,26,42,0.2)] transition-[border-color,box-shadow,background-color] duration-200">
              <div>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-xl sm:text-3xl font-black text-[#C96F55]/40 font-mono">
                    02
                  </span>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55]">
                    <FontAwesomeIcon icon={faBox} className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-[#121A2A] mb-0.5 sm:mb-1">
                  Pilih Produk
                </h3>
                <p className="text-[10px] sm:text-xs text-[#121A2A]/65 leading-snug sm:leading-relaxed">
                  Pilih paket durasi masa aktif dan jenis lisensi (Private/Sharing) sesuai kebutuhan.
                </p>
              </div>
            </div>

            {/* Step 03 */}
            <div data-gsap="panduan-step" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col justify-between hover:border-[rgba(18,26,42,0.2)] transition-[border-color,box-shadow,background-color] duration-200">
              <div>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-xl sm:text-3xl font-black text-[#C96F55]/40 font-mono">
                    03
                  </span>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55]">
                    <FontAwesomeIcon icon={faCreditCard} className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-[#121A2A] mb-0.5 sm:mb-1">
                  Lakukan Pembayaran
                </h3>
                <p className="text-[10px] sm:text-xs text-[#121A2A]/65 leading-snug sm:leading-relaxed">
                  Scan kode QRIS instan atau bayar via Virtual Account tanpa perlu unggah bukti manual.
                </p>
              </div>
            </div>

            {/* Step 04 */}
            <div data-gsap="panduan-step" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col justify-between hover:border-[rgba(18,26,42,0.2)] transition-[border-color,box-shadow,background-color] duration-200">
              <div>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-xl sm:text-3xl font-black text-[#C96F55]/40 font-mono">
                    04
                  </span>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55]">
                    <FontAwesomeIcon icon={faBolt} className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-[#121A2A] mb-0.5 sm:mb-1">
                  Terima Aktivasi
                </h3>
                <p className="text-[10px] sm:text-xs text-[#121A2A]/65 leading-snug sm:leading-relaxed">
                  Kredensial atau tautan ruang kerja dikirimkan ke email Anda dan tercatat di menu pesanan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 9: FAQ */}
        <section id="faq" data-gsap-section="faq" className="mb-10 sm:mb-14 pt-6 sm:pt-8 border-t border-[rgba(18,26,42,0.08)]">
          <div data-gsap="faq-header" className="max-w-2xl mb-6">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#C96F55] uppercase tracking-wider mb-1">
              <FontAwesomeIcon icon={faCircleQuestion} className="w-3.5 h-3.5" />
              <span>Bantuan &amp; Panduan</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#121A2A] tracking-tight">
              Pertanyaan yang Sering Ditanyakan
            </h2>
            <p className="text-xs sm:text-sm text-[#121A2A]/65 mt-0.5 leading-relaxed">
              Jawaban seputar layanan, garansi, proses aktivasi, dan pembayaran di Asterra Store.
            </p>
          </div>

          <div className="space-y-2.5 w-full">
            {faqItems.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  data-gsap="faq-item"
                  className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-4 hover:bg-[rgba(18,26,42,0.02)] transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-[#121A2A]">
                      {faq.q}
                    </span>
                    <span className="w-6 h-6 rounded-md bg-[rgba(18,26,42,0.05)] flex items-center justify-center text-[#121A2A]/70 shrink-0">
                      {isOpen ? (
                        <FontAwesomeIcon icon={faMinus} className="w-3.5 h-3.5 text-[#C96F55]" />
                      ) : (
                        <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-3.5 sm:px-4 pb-4 pt-1 text-xs sm:text-sm text-[#121A2A]/70 leading-relaxed border-t border-[rgba(18,26,42,0.06)]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 10: FINAL CTA */}
        <section id="cta" data-gsap-section="cta" className="mb-6 sm:mb-8 p-5 sm:p-8 bg-[#121A2A] text-[#F7F5EF] rounded-2xl border border-white/10 shadow-editorial flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div data-gsap="cta-content" className="space-y-1 max-w-xl">
            <h3 className="text-base sm:text-xl lg:text-2xl font-black text-[#F7F5EF] tracking-tight">
              Dapatkan Akun Premium Pilihan Anda Hari Ini
            </h3>
            <p className="text-xs sm:text-sm text-[#F7F5EF]/70 leading-relaxed">
              Jelajahi seluruh katalog Asterra Store dengan konfirmasi otomatis dan garansi penggantian penuh.
            </p>
          </div>

          <div data-gsap="cta-actions">
            <Link href="/product">
              <Button className="h-10 sm:h-11 px-5 sm:px-6 rounded-xl bg-[#C96F55] hover:bg-[#B86047] text-[#F7F5EF] font-bold text-xs sm:text-sm gap-2 shrink-0 active:scale-95 transition-all">
                <span>Jelajahi Produk</span>
                <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        activeCampaigns={activeCampaigns}
      />
    </div>
  );
}
