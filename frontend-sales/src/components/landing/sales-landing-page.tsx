'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import TiltedCard, { TiltedCardLayer } from '@/components/ui/tilted-card';
import {
  Search,
  ShoppingBag,
  Calculator,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  RotateCcw,
  Copy,
  Share2,
  TrendingUp,
  Wallet,
  FileText,
  User,
  Menu,
  X,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Layers,
  Clock,
  MessageSquare,
  Award,
  BarChart3,
  Diamond,
  BadgeCheck,
  Package,
  Zap,
  CreditCard
} from 'lucide-react';

// ============================================================================
// DATA CONSTANTS — ASTERRASTORE CATALOG & BUSINESS LOGIC
// ============================================================================

const INITIAL_CALC_PRODUCTS = [
  {
    id: 'google-ai-18m',
    name: 'Google AI Pro Private 18 Bulan [Garansi 1 Bulan]',
    category: 'AI Tools',
    price: 57000,
    cost: 13400, // Profit = 43.600 -> 30% Komisi = Rp 13.080
    commissionPerUnit: 13080,
    resellerSuggestedPrice: 75000,
    qty: 10,
    stockPercent: 92,
    warranty: 'Garansi 1 Bulan',
    duration: '18 Bulan'
  },
  {
    id: 'chatgpt-plus-1m',
    name: 'ChatGPT Plus Private 1 Bulan [Garansi Full]',
    category: 'AI Tools',
    price: 45000,
    cost: 22500, // Profit = 22.500 -> 30% Komisi = Rp 6.750
    commissionPerUnit: 6750,
    resellerSuggestedPrice: 60000,
    qty: 15,
    stockPercent: 88,
    warranty: 'Garansi Full 30 Hari',
    duration: '1 Bulan'
  },
  {
    id: 'netflix-4k-1m',
    name: 'Netflix Premium 4K UHD 1 Bulan [Garansi]',
    category: 'Streaming',
    price: 35000,
    cost: 23000, // Profit = 12.000 -> 30% Komisi = Rp 3.600
    commissionPerUnit: 3600,
    resellerSuggestedPrice: 45000,
    qty: 10,
    stockPercent: 95,
    warranty: 'Garansi Full 30 Hari',
    duration: '1 Bulan'
  }
];

const ALL_CATALOG_PRODUCTS = [
  ...INITIAL_CALC_PRODUCTS,
  {
    id: 'canva-pro-1y',
    name: 'Canva Pro Invite 1 Tahun [Garansi 12 Bulan]',
    category: 'Creative Tools',
    price: 25000,
    cost: 11000,
    commissionPerUnit: 4200,
    resellerSuggestedPrice: 39000,
    qty: 5,
    stockPercent: 96,
    warranty: 'Garansi 12 Bulan',
    duration: '1 Tahun'
  },
  {
    id: 'spotify-prem-1m',
    name: 'Spotify Premium Individual 1 Bulan [Full Garansi]',
    category: 'Streaming',
    price: 28000,
    cost: 15000,
    commissionPerUnit: 3900,
    resellerSuggestedPrice: 38000,
    qty: 5,
    stockPercent: 84,
    warranty: 'Garansi Full 30 Hari',
    duration: '1 Bulan'
  },
  {
    id: 'capcut-pro-1m',
    name: 'CapCut Pro Private 1 Bulan [All Device]',
    category: 'Creative Tools',
    price: 32000,
    cost: 15000,
    commissionPerUnit: 5100,
    resellerSuggestedPrice: 45000,
    qty: 5,
    stockPercent: 90,
    warranty: 'Garansi Full 30 Hari',
    duration: '1 Bulan'
  },
  {
    id: 'youtube-prem-1m',
    name: 'YouTube Premium + Music 1 Bulan [Invite Email]',
    category: 'Streaming',
    price: 22000,
    cost: 10000,
    commissionPerUnit: 3600,
    resellerSuggestedPrice: 32000,
    qty: 8,
    stockPercent: 94,
    warranty: 'Garansi Full 30 Hari',
    duration: '1 Bulan'
  },
  {
    id: 'ms-365-1y',
    name: 'Microsoft 365 Personal 1 Tahun [Original Account]',
    category: 'AI Tools',
    price: 65000,
    cost: 35000,
    commissionPerUnit: 9000,
    resellerSuggestedPrice: 89000,
    qty: 4,
    stockPercent: 80,
    warranty: 'Garansi 1 Tahun',
    duration: '1 Tahun'
  }
];

const PRODUCT_BRAND_IMAGES: Record<string, string> = {
  'netflix-4k-1m': '/images/apps/netflix.png',
  'google-ai-18m': '/images/apps/gemini.svg',
  'chatgpt-plus-1m': '/images/apps/chatgpt.svg',
  'canva-pro-1y': '/images/apps/canva.svg',
  'spotify-prem-1m': '/images/apps/spotify.svg',
  'capcut-pro-1m': '/images/apps/capcut.svg',
  'youtube-prem-1m': '/images/apps/youtube.svg',
  'ms-365-1y': '/images/apps/microsoft365.svg',
};

const COMMISSION_SCENARIOS = [
  {
    id: '1-mitra',
    badge: '1 MITRA',
    rate: '30%',
    multiplier: 1,
    title: 'Target Harian (1 Mitra)',
    desc: 'Target komisi Rp 25.000 / hari (Rp 750.000 / bulan)',
    dailyTarget: 25000,
    monthlyTarget: 750000,
    presetQuantities: { 'google-ai-18m': 10, 'chatgpt-plus-1m': 15, 'netflix-4k-1m': 10 }
  },
  {
    id: '5-mitra',
    badge: '5 MITRA',
    rate: '30%',
    multiplier: 5,
    title: 'Tim 5 Mitra Produktif',
    desc: 'Simulasi omzet 5 mitra: Komisi Rp 125.000 / hari (Rp 3.750.000 / bulan)',
    dailyTarget: 125000,
    monthlyTarget: 3750000,
    presetQuantities: { 'google-ai-18m': 120, 'chatgpt-plus-1m': 200, 'netflix-4k-1m': 220 }
  },
  {
    id: '10-mitra',
    badge: '10 MITRA',
    rate: '30%',
    multiplier: 10,
    title: 'Milestone 10 Mitra',
    desc: 'Milestone 10 mitra: Komisi Rp 250.000 / hari (Rp 7.500.000 / bulan)',
    dailyTarget: 250000,
    monthlyTarget: 7500000,
    presetQuantities: { 'google-ai-18m': 250, 'chatgpt-plus-1m': 400, 'netflix-4k-1m': 410 }
  },
  {
    id: '25-mitra',
    badge: '25 MITRA',
    rate: '30%',
    multiplier: 25,
    title: 'Skala 25 Mitra',
    desc: 'Skala 25 mitra: Komisi Rp 625.000 / hari (Rp 18.750.000 / bulan)',
    dailyTarget: 625000,
    monthlyTarget: 18750000,
    presetQuantities: { 'google-ai-18m': 600, 'chatgpt-plus-1m': 1000, 'netflix-4k-1m': 1100 }
  },
  {
    id: '50-mitra',
    badge: '50 MITRA',
    rate: '30%',
    multiplier: 50,
    title: 'Ekspansi 50 Mitra',
    desc: 'Ekspansi 50 mitra: Komisi Rp 1.250.000 / hari (Rp 37.500.000 / bulan)',
    dailyTarget: 1250000,
    monthlyTarget: 37500000,
    presetQuantities: { 'google-ai-18m': 1200, 'chatgpt-plus-1m': 2000, 'netflix-4k-1m': 2200 }
  },
  {
    id: '100-mitra',
    badge: '100 MITRA',
    rate: '30%',
    multiplier: 100,
    title: 'Skala Penuh 100 Mitra',
    desc: 'Skala 100 mitra: Komisi Rp 2.500.000 / hari (Rp 75.000.000 / bulan)',
    dailyTarget: 2500000,
    monthlyTarget: 75000000,
    presetQuantities: { 'google-ai-18m': 2400, 'chatgpt-plus-1m': 4000, 'netflix-4k-1m': 4400 }
  }
];

const SELLER_TRANSACTIONS = [
  {
    id: 'AST-261109-8841',
    date: '09 Nov 2026, 14:22 WIB',
    product: 'Google AI Pro Private 18 Bulan',
    category: 'AI Tools',
    buyer: 'dimas.pratama@gmail.com',
    price: 57000,
    commission: 13080,
    status: 'Selesai',
    payoutStatus: 'Siap Dicairkan'
  },
  {
    id: 'AST-261109-8819',
    date: '09 Nov 2026, 11:05 WIB',
    product: 'ChatGPT Plus Private 1 Bulan',
    category: 'AI Tools',
    buyer: 'nabila.putri@yahoo.com',
    price: 45000,
    commission: 6750,
    status: 'Selesai',
    payoutStatus: 'Siap Dicairkan'
  },
  {
    id: 'AST-261109-8790',
    date: '09 Nov 2026, 09:40 WIB',
    product: 'Netflix Premium 4K UHD 1 Bulan',
    category: 'Streaming',
    buyer: 'reza.akbar@gmail.com',
    price: 35000,
    commission: 3600,
    status: 'Diproses',
    payoutStatus: 'Menunggu Verifikasi'
  },
  {
    id: 'AST-261108-8652',
    date: '08 Nov 2026, 20:15 WIB',
    product: 'Microsoft 365 Personal 1 Tahun',
    category: 'AI Tools',
    buyer: 'hendra.wijaya@outlook.com',
    price: 65000,
    commission: 9000,
    status: 'Selesai',
    payoutStatus: 'Siap Dicairkan'
  },
  {
    id: 'AST-261108-8611',
    date: '08 Nov 2026, 16:48 WIB',
    product: 'CapCut Pro Private 1 Bulan',
    category: 'Creative Tools',
    buyer: 'annisaa.creative@gmail.com',
    price: 32000,
    commission: 5100,
    status: 'Selesai',
    payoutStatus: 'Siap Dicairkan'
  }
];

const PAYOUT_HISTORY = [
  {
    id: 'WD-261102-019',
    date: '02 Nov 2026, 10:15 WIB',
    amount: 250000,
    method: 'BCA (8420918271 a.n. Rendy V.)',
    status: 'Berhasil Ditransfer'
  },
  {
    id: 'WD-261024-084',
    date: '24 Okt 2026, 15:40 WIB',
    amount: 310000,
    method: 'BCA (8420918271 a.n. Rendy V.)',
    status: 'Berhasil Ditransfer'
  },
  {
    id: 'WD-261012-041',
    date: '12 Okt 2026, 09:20 WIB',
    amount: 185000,
    method: 'GoPay (0812-8891-4402)',
    status: 'Berhasil Ditransfer'
  }
];

const FAQ_ITEMS = [
  {
    category: 'Kemitraan & Komisi',
    question: 'Bagaimana skema perhitungan komisi di Sales Portal AsterraStore?',
    answer:
      'Sesuai Model Bisnis AsterraStore v2.0, komisi dihitung murni 30% dari keuntungan bersih transaksi (Harga Jual Resmi dikurangi Modal Produk). Tidak ada manipulasi atau kenaikan harga jual ke pelanggan, sehingga link promosi Anda tetap memiliki harga yang sangat kompetitif.'
  },
  {
    category: 'Kemitraan & Komisi',
    question: 'Apakah bergabung menjadi Mitra Sales AsterraStore dikenakan biaya?',
    answer:
      '100% Gratis. Anda tidak dikenakan biaya pendaftaran, biaya langganan bulanan, maupun kewajiban menyetok atau deposit saldo. Anda cukup mendaftar akun Sales Portal dan langsung bisa membagikan link produk.'
  },
  {
    category: 'Pencairan Dana',
    question: 'Bagaimana cara mencairkan komisi penjualan (Payout)?',
    answer:
      'Anda dapat mengajukan pencairan kapan saja melalui menu "Komisi & Pencairan" di Dashboard Sales Portal. Dana komisi yang berstatus "Siap Dicairkan" akan ditransfer ke rekening Bank (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, DANA, OVO, ShopeePay) tanpa potongan tersembunyi.'
  },
  {
    category: 'Operasional & Garansi',
    question: 'Apakah saya perlu mengurus pengiriman akun dan kendala teknis pembeli?',
    answer:
      'Tidak perlu. Seluruh proses pemenuhan pesanan (pengiriman akun/invite), pengelolaan stok, hingga layanan garansi pelanggan ditangani sepenuhnya oleh sistem otomatis dan tim operasional AsterraStore.'
  },
  {
    category: 'Operasional & Garansi',
    question: 'Apakah semua produk di AsterraStore memiliki garansi resmi?',
    answer:
      'Ya, seluruh produk digital di katalog AsterraStore mulai dari Netflix, ChatGPT Plus, Google AI Pro, hingga Canva dan Microsoft 365 dilengkapi garansi sesuai masa aktif dan keterangan yang tertera secara transparan di setiap kartu produk.'
  },
  {
    category: 'Pencairan Dana',
    question: 'Kapan komisi transaksi berstatus "Siap Dicairkan"?',
    answer:
      'Begitu pelanggan menyelesaikan pembayaran dan produk digital berhasil dikirim serta terverifikasi oleh sistem, komisi 30% profit bersih langsung masuk ke saldo "Komisi Siap Dicairkan" Anda secara real-time.'
  }
];

// Helper Formatter IDR
const formatIDR = (num: number) => {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
};

export function SalesLandingPage() {
  // Navigation Routing: 'landing' (/), 'register' (/daftar-sales), 'dashboard' (/dashboard)
  const [currentRoute, setCurrentRoute] = useState<'landing' | 'register' | 'dashboard'>('landing');
  const [dashboardTab, setDashboardTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Responsive scale factor for Hero Stage
  const [heroScale, setHeroScale] = useState(1);
  useEffect(() => {
    const handleResize = () => {
      const vw = window.innerWidth;
      if (vw < 1200) {
        const computed = Math.max(0.5, Math.min(1, (vw - 32) / 1160));
        setHeroScale(computed);
      } else {
        setHeroScale(1);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const navigateAndScroll = (sectionId: string) => {
    if (currentRoute !== 'landing') {
      setCurrentRoute('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ==========================================================================
  // FINANCIAL CALCULATOR STATE
  // ==========================================================================
  const [calcMode, setCalcMode] = useState<'sales' | 'reseller'>('sales');
  const [activeScenario, setActiveScenario] = useState('1-mitra');
  const [simulatedItems, setSimulatedItems] = useState(INITIAL_CALC_PRODUCTS);
  const [selectedAddProductId, setSelectedAddProductId] = useState('canva-pro-1y');

  // Reseller custom markup price state
  const [resellerCustomPrices, setResellerCustomPrices] = useState<Record<string, number>>({
    'google-ai-18m': 75000,
    'chatgpt-plus-1m': 60000,
    'netflix-4k-1m': 45000,
    'canva-pro-1y': 39000,
    'spotify-prem-1m': 38000,
    'capcut-pro-1m': 45000,
    'youtube-prem-1m': 32000,
    'ms-365-1y': 89000
  });

  const handleSelectScenario = (scenario: typeof COMMISSION_SCENARIOS[0]) => {
    setActiveScenario(scenario.id);
    const baseItems = INITIAL_CALC_PRODUCTS.map((item) => ({
      ...item,
      qty: (scenario.presetQuantities as Record<string, number>)[item.id] || item.qty * scenario.multiplier
    }));
    setSimulatedItems(baseItems);
    showToast(`Skenario ${scenario.title} berhasil diterapkan.`);
  };

  const handleResetCalculator = () => {
    setActiveScenario('1-mitra');
    setCalcMode('sales');
    setSimulatedItems(INITIAL_CALC_PRODUCTS.map((i) => ({ ...i })));
    showToast('Kalkulator direset ke baseline awal (35 unit/bulan • Rp 268.050).');
  };

  const handleUpdateQty = (id: string, newQty: number | string) => {
    const validQty = Math.max(1, Math.min(9999, Number(newQty) || 1));
    setSimulatedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty: validQty } : item))
    );
  };

  const handleRemoveCalcItem = (id: string) => {
    if (simulatedItems.length <= 1) {
      showToast('Minimal harus ada 1 produk dalam simulasi.');
      return;
    }
    setSimulatedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddCalcProduct = () => {
    const productDef = ALL_CATALOG_PRODUCTS.find((p) => p.id === selectedAddProductId);
    if (!productDef) return;

    const existing = simulatedItems.find((item) => item.id === productDef.id);
    if (existing) {
      handleUpdateQty(productDef.id, existing.qty + 5);
      showToast(`Jumlah unit ${productDef.name.split('[')[0]} ditambah 5 unit.`);
    } else {
      setSimulatedItems((prev) => [...prev, { ...productDef, qty: 5 }]);
      showToast(`Produk ${productDef.name.split('[')[0]} ditambahkan.`);
    }
  };

  const calcSummary = useMemo(() => {
    let totalUnits = 0;
    let totalPersonalCommission = 0;
    let totalResellerMarkupProfit = 0;
    let totalRevenue = 0;
    let totalModal = 0;

    simulatedItems.forEach((item) => {
      totalUnits += item.qty;
      totalPersonalCommission += item.commissionPerUnit * item.qty;
      const customPrice = resellerCustomPrices[item.id] || item.resellerSuggestedPrice;
      const resellerMargin = Math.max(0, customPrice - item.price) + item.commissionPerUnit;
      totalResellerMarkupProfit += resellerMargin * item.qty;

      if (calcMode === 'sales') {
        totalRevenue += item.price * item.qty;
      } else {
        totalRevenue += customPrice * item.qty;
        totalModal += item.price * item.qty;
      }
    });

    const currentScenarioObj =
      COMMISSION_SCENARIOS.find((s) => s.id === activeScenario) || COMMISSION_SCENARIOS[0];

    return {
      totalUnits,
      totalPersonalCommission,
      totalResellerMarkupProfit,
      totalRevenue,
      totalModal,
      displayMonthlyTotal:
        calcMode === 'sales' ? totalPersonalCommission : totalResellerMarkupProfit,
      scenarioObj: currentScenarioObj
    };
  }, [simulatedItems, activeScenario, calcMode, resellerCustomPrices]);

  // Modals & Interactive States
  const [promoModalProduct, setPromoModalProduct] = useState<typeof ALL_CATALOG_PRODUCTS[0] | null>(null);
  const [orderModalProduct, setOrderModalProduct] = useState<typeof ALL_CATALOG_PRODUCTS[0] | null>(null);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('385000');
  const [payoutMethod, setPayoutMethod] = useState('BCA (8420918271 a.n. Rendy V.)');
  const [availableBalance, setAvailableBalance] = useState(385000);
  const [payoutList, setPayoutList] = useState(PAYOUT_HISTORY);

  // Landing Filter & FAQ States
  const [catalogCategory, setCatalogCategory] = useState('Semua Produk');
  const [howItWorksTab, setHowItWorksTab] = useState<'sales' | 'customer'>('sales');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const handleCopyText = (text: string, label = 'Tautan berhasil disalin!') => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    showToast(label);
  };

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmt = Number(payoutAmount);
    if (!numericAmt || numericAmt < 50000) {
      showToast('Minimal pencairan komisi adalah Rp 50.000.');
      return;
    }
    if (numericAmt > availableBalance) {
      showToast('Saldo komisi aktif tidak mencukupi.');
      return;
    }

    const newPayout = {
      id: `WD-261109-${Math.floor(100 + Math.random() * 899)}`,
      date: 'Baru saja (09 Nov 2026)',
      amount: numericAmt,
      method: payoutMethod,
      status: 'Sedang Diproses'
    };

    setPayoutList([newPayout, ...payoutList]);
    setAvailableBalance((prev) => prev - numericAmt);
    setPayoutModalOpen(false);
    showToast(`Pengajuan pencairan ${formatIDR(numericAmt)} berhasil diproses!`);
  };

  // ==========================================================================
  // REUSABLE FINANCIAL CALCULATOR COMPONENT
  // ==========================================================================
  const renderFinancialCalculator = (isEmbeddedInDashboard = false) => (
    <div
      className={`${
        isEmbeddedInDashboard
          ? 'bg-white rounded-2xl border border-stone-200/90 p-6 lg:p-8 shadow-sm'
          : 'bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 lg:p-10 shadow-[0_20px_50px_-12px_rgba(28,25,23,0.06)] relative overflow-hidden'
      }`}
    >
      {/* Subtle Warm Amber Glow in Top-Right */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-100/40 via-amber-50/20 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Top Banner: Minimalist Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #FFF9F5 0%, #FFFDFB 45%, #FFF5EE 100%)'
        }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 p-5 sm:p-6 rounded-2xl border border-orange-200/80 shadow-xs relative z-10"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-orange-200/90 text-[#EA580C] text-xs font-bold mb-2 shadow-2xs">
            <Calculator className="w-3.5 h-3.5 text-[#EA580C]" />
            <span>Kalkulator Cuan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Kalkulator Cuan
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Simulasi modal, omzet, dan estimasi keuntungan bersih.
          </p>
        </div>

        {/* Mode Switcher Tabs + Reset Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 rounded-xl bg-white border border-orange-200/80 shadow-xs">
            <button
              type="button"
              onClick={() => setCalcMode('sales')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                calcMode === 'sales'
                  ? 'bg-[#EA580C] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#EA580C]'
              }`}
            >
              <span>Komisi Sales (30%)</span>
            </button>
            <button
              type="button"
              onClick={() => setCalcMode('reseller')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                calcMode === 'reseller'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#2563EB]'
              }`}
            >
              <span>Markup Reseller</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetCalculator}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-orange-50 hover:border-orange-300 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Preset Scenarios + Add Product Bar */}
      <div className="mt-6 pt-2 flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1">Skenario Penjualan:</span>
          {COMMISSION_SCENARIOS.map((sc) => {
            const isSelected = activeScenario === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => handleSelectScenario(sc)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-[#EA580C] text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-slate-700 hover:border-orange-300 hover:bg-orange-50/50'
                }`}
              >
                {sc.badge}
              </button>
            );
          })}
        </div>

        {/* Add Product Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedAddProductId}
            onChange={(e) => setSelectedAddProductId(e.target.value)}
            aria-label="Pilih produk tambahan"
            className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-[#EA580C] max-w-[200px] truncate shadow-2xs"
          >
            {ALL_CATALOG_PRODUCTS.map((prod) => (
              <option key={prod.id} value={prod.id}>
                {prod.name.split('[')[0]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddCalcProduct}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Calculator Body */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
        {/* Left Column: Grouped Inputs (Harga Jual, Modal, Jumlah Terjual) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
            {/* Desktop Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-3 bg-stone-50/90 border-b border-stone-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-4">Produk</div>
              <div className="col-span-2 text-right">Modal</div>
              <div className="col-span-3 text-right">Harga Jual</div>
              <div className="col-span-3 text-right">Jumlah Terjual</div>
            </div>

            {/* Input Rows */}
            <div className="divide-y divide-stone-100">
              {simulatedItems.map((item) => {
                const customResellerPrice =
                  resellerCustomPrices[item.id] || item.resellerSuggestedPrice;
                const modalCost = calcMode === 'sales' ? 0 : item.price;

                return (
                  <div
                    key={item.id}
                    className="p-4 sm:px-4 sm:py-3.5 hover:bg-stone-50/50 transition-colors"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      {/* Produk */}
                      <div className="sm:col-span-4 flex items-center justify-between sm:justify-start gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {item.name.split('[')[0]}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.category}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCalcItem(item.id)}
                          title="Hapus produk"
                          className="sm:hidden p-1 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Modal */}
                      <div className="sm:col-span-2 flex sm:block items-center justify-between text-right">
                        <span className="sm:hidden text-xs text-slate-500 font-medium">Modal:</span>
                        <div className="text-xs font-bold font-mono">
                          {modalCost === 0 ? (
                            <span className="text-emerald-700">Rp 0</span>
                          ) : (
                            <span className="text-slate-800">{formatIDR(modalCost)}</span>
                          )}
                        </div>
                      </div>

                      {/* Harga Jual */}
                      <div className="sm:col-span-3 flex sm:block items-center justify-between text-right">
                        <span className="sm:hidden text-xs text-slate-500 font-medium">Harga Jual:</span>
                        {calcMode === 'reseller' ? (
                          <div className="inline-flex items-center gap-1 justify-end">
                            <span className="text-[11px] text-slate-400 font-mono">Rp</span>
                            <input
                              type="number"
                              value={customResellerPrice}
                              onChange={(e) =>
                                setResellerCustomPrices((prev) => ({
                                  ...prev,
                                  [item.id]: Number(e.target.value) || item.price
                                }))
                              }
                              className="w-24 px-2 py-1 rounded-lg border border-stone-200 text-xs font-bold text-right font-mono text-slate-900 focus:outline-none focus:border-[#EA580C]"
                            />
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-slate-900 font-mono">
                            {formatIDR(item.price)}
                          </div>
                        )}
                      </div>

                      {/* Jumlah Terjual */}
                      <div className="sm:col-span-3 flex sm:flex-row items-center justify-between sm:justify-end gap-2">
                        <span className="sm:hidden text-xs text-slate-500 font-medium">Jumlah Terjual:</span>
                        <div className="inline-flex items-center rounded-lg border border-stone-200 bg-stone-50 p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, item.qty - 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:text-[#EA580C]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="9999"
                            value={item.qty}
                            onChange={(e) => handleUpdateQty(item.id, e.target.value)}
                            aria-label={`Jumlah unit ${item.name}`}
                            className="w-10 text-center bg-transparent text-xs font-bold text-slate-900 font-mono focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, item.qty + 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:text-[#EA580C]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCalcItem(item.id)}
                          title="Hapus produk"
                          className="hidden sm:inline-flex p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Hasil Kalkulasi (Total Modal, Total Pendapatan, Estimasi Keuntungan) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF9F5 45%, #FFF5EE 100%)',
              boxShadow: '0 20px 50px -12px rgba(234, 88, 12, 0.12), 0 0 0 1px rgba(234, 88, 12, 0.15)'
            }}
            className="rounded-3xl p-6 sm:p-7 relative overflow-hidden space-y-4"
          >
            {/* HERO RESULT: ESTIMASI KEUNTUNGAN */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#ECFDF5] via-[#F0FDF4] to-white border border-emerald-300 shadow-xs text-left">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                  Estimasi Keuntungan
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#059669] text-[11px] font-black border border-emerald-200">
                  {calcMode === 'sales' ? 'Komisi 30%' : 'Margin + Komisi'}
                </span>
              </div>
              <div className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#047857] font-mono tracking-tight leading-none mt-2">
                {formatIDR(calcSummary.displayMonthlyTotal)}
              </div>
              <div className="text-xs text-slate-500 mt-2.5 font-medium flex items-center justify-between">
                <span>Potensi laba bersih per bulan</span>
                <span className="text-[#059669] font-bold">Langsung cair</span>
              </div>
            </div>

            {/* SECONDARY METRICS: Total Modal & Total Pendapatan */}
            <div className="grid grid-cols-2 gap-3">
              {/* Total Modal */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 text-left shadow-2xs">
                <span className="text-xs font-semibold text-slate-500">Total Modal</span>
                <div className="text-base sm:text-lg font-extrabold text-slate-900 font-mono mt-1">
                  {calcSummary.totalModal === 0 ? (
                    <span className="text-emerald-700">Rp 0</span>
                  ) : (
                    formatIDR(calcSummary.totalModal)
                  )}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {calcMode === 'sales' ? 'Tanpa modal kulakan' : 'Modal beli produk'}
                </span>
              </div>

              {/* Total Pendapatan */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 text-left shadow-2xs">
                <span className="text-xs font-semibold text-slate-500">Total Pendapatan</span>
                <div className="text-base sm:text-lg font-extrabold text-slate-900 font-mono mt-1">
                  {formatIDR(calcSummary.totalRevenue)}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {calcSummary.totalUnits} unit terjual
                </span>
              </div>
            </div>

            {/* Quick Note */}
            <div className="p-3 rounded-xl bg-slate-50/90 border border-stone-200 flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium">Pencairan Dana:</span>
              <span className="font-bold text-slate-900">Min. Rp 50.000 • Tanpa Potongan</span>
            </div>

            {/* CTA Button */}
            {!isEmbeddedInDashboard && (
              <div className="pt-2">
                <Link
                  href="/daftar-sales"
                  style={{
                    background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                    boxShadow: '0 10px 24px -4px rgba(234, 88, 12, 0.4)'
                  }}
                  className="w-full py-3.5 px-5 rounded-2xl text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md cursor-pointer"
                >
                  <span>Daftar Sekarang & Ambil Cuan</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-center text-[11px] text-slate-400 mt-2 font-medium">
                  Pendaftaran 100% Gratis • Akun Langsung Aktif
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ==========================================================================
  // VIEW 1: HALAMAN UTAMA (LANDING PAGE)
  // ==========================================================================
  const renderLandingPage = () => {
    const filteredProducts =
      catalogCategory === 'Semua Produk'
        ? ALL_CATALOG_PRODUCTS
        : ALL_CATALOG_PRODUCTS.filter((p) => {
            if (catalogCategory === 'Streaming & Entertainment') return p.category === 'Streaming';
            if (catalogCategory === 'AI & Productivity') return p.category === 'AI Tools';
            if (catalogCategory === 'Creative Tools') return p.category === 'Creative Tools';
            return true;
          });

    return (
      <div className="min-h-screen bg-[#FDFBF7] text-slate-900">
        {/* Sticky Main Navbar */}
        <header className="sticky top-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-orange-950/5">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 text-left group">
              <div className="w-9 h-9 rounded-full bg-[#E0531F] flex items-center justify-center text-white font-extrabold text-base shadow-sm group-hover:bg-[#EA580C] transition-colors">
                A
              </div>
              <div>
                <div className="text-[15px] font-extrabold tracking-tight text-[#111827] leading-none">
                  Asterra<span className="text-[#E0531F]">Store</span>
                </div>
                <div className="text-[8.5px] font-semibold tracking-[0.16em] uppercase text-slate-400 mt-1">
                  DIGITAL MARKETPLACE
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-7">
              <nav className="flex items-center gap-6 text-[13px] font-medium text-slate-600">
                <button
                  type="button"
                  onClick={() => navigateAndScroll('products-section')}
                  className="hover:text-[#E0531F] transition-colors"
                >
                  Products
                </button>
                <button
                  type="button"
                  onClick={() => navigateAndScroll('how-it-works-section')}
                  className="hover:text-[#E0531F] transition-colors"
                >
                  How It Works
                </button>
                <button
                  type="button"
                  onClick={() => navigateAndScroll('faq-section')}
                  className="hover:text-[#E0531F] transition-colors"
                >
                  FAQ
                </button>
              </nav>

              <div className="flex items-center gap-4 pl-2">
                <Link
                  href="/sales/login"
                  className="text-[13px] font-bold text-[#111827] hover:text-[#E0531F] transition-colors px-2 py-1"
                >
                  Login
                </Link>
                <Link
                  href="/daftar-sales"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#E0531F] hover:bg-[#C94312] text-white text-[13px] font-semibold shadow-sm transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-700"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateAndScroll('products-section');
                }}
                className="block w-full text-left py-2 text-sm font-semibold text-slate-700"
              >
                Products
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateAndScroll('calculator-section');
                }}
                className="block w-full text-left py-2 text-sm font-semibold text-slate-700"
              >
                Kalkulator Finansial
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateAndScroll('how-it-works-section');
                }}
                className="block w-full text-left py-2 text-sm font-semibold text-slate-700"
              >
                How It Works
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateAndScroll('faq-section');
                }}
                className="block w-full text-left py-2 text-sm font-semibold text-slate-700"
              >
                FAQ
              </button>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                <Link
                  href="/sales/login"
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 text-center"
                >
                  Login
                </Link>
                <Link
                  href="/daftar-sales"
                  className="flex-1 py-2.5 rounded-xl bg-[#E0531F] text-white text-sm font-bold flex items-center justify-center gap-1.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </header>

        {/* Keyframe animations for flowing circuit beams */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes flowBeamL1 {
            0% { stroke-dashoffset: 70; opacity: 0; }
            10% { opacity: 1; }
            85% { opacity: 1; }
            100% { stroke-dashoffset: -290; opacity: 0; }
          }
          @keyframes flowBeamL2 {
            0% { stroke-dashoffset: 85; opacity: 0; }
            10% { opacity: 1; }
            85% { opacity: 1; }
            100% { stroke-dashoffset: -370; opacity: 0; }
          }
          @keyframes flowBeamR1 {
            0% { stroke-dashoffset: 70; opacity: 0; }
            10% { opacity: 1; }
            85% { opacity: 1; }
            100% { stroke-dashoffset: -280; opacity: 0; }
          }
          @keyframes flowBeamR2 {
            0% { stroke-dashoffset: 85; opacity: 0; }
            10% { opacity: 1; }
            85% { opacity: 1; }
            100% { stroke-dashoffset: -375; opacity: 0; }
          }
          .beam-pulse-l1 {
            stroke-dasharray: 65 300;
            animation: flowBeamL1 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
          .beam-pulse-l2 {
            stroke-dasharray: 80 380;
            animation: flowBeamL2 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.7s;
          }
          .beam-pulse-r1 {
            stroke-dasharray: 65 300;
            animation: flowBeamR1 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.35s;
          }
          .beam-pulse-r2 {
            stroke-dasharray: 80 380;
            animation: flowBeamR2 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite 1.05s;
          }
        `}} />

        {/* ===================================================================
            HERO SECTION — KONTEN.COM STYLE WITH ACTIVE FLOWING BEAMS
        =================================================================== */}
        <section className="relative overflow-hidden bg-[#FDFBF7] border-b border-orange-950/5">
          {/* Warm Orange Glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 36%, rgba(234, 88, 12, 0.14) 0%, rgba(251, 146, 60, 0.07) 32%, rgba(253, 251, 247, 0) 68%)'
            }}
          />

          {/* Scaled Proportional Stage */}
          <div
            className="relative w-full flex justify-center overflow-hidden"
            style={{ height: `${Math.round(530 * heroScale)}px` }}
          >
            <div
              className="relative shrink-0 select-none"
              style={{
                width: '1160px',
                height: '520px',
                transform: `scale(${heroScale})`,
                transformOrigin: 'top center'
              }}
            >
              {/* 45-Degree Animated Connector Circuit Lines */}
              <svg
                className="absolute inset-0 w-[1160px] h-[520px] pointer-events-none"
                viewBox="0 0 1160 520"
                fill="none"
              >
                <defs>
                  <linearGradient id="beamGradL1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FB923C" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="#EA580C" stopOpacity="1" />
                    <stop offset="100%" stopColor="#FF7A30" stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id="beamGradL2" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FB923C" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="#EA580C" stopOpacity="1" />
                    <stop offset="100%" stopColor="#FF7A30" stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id="beamGradR1" x1="100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#FB923C" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="#EA580C" stopOpacity="1" />
                    <stop offset="100%" stopColor="#FF7A30" stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id="beamGradR2" x1="100%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#FB923C" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="#EA580C" stopOpacity="1" />
                    <stop offset="100%" stopColor="#FF7A30" stopOpacity="1" />
                  </linearGradient>
                  <filter id="beamGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Static Base Circuit Traces */}
                <path d="M 285 110 L 370 110 L 435 170 L 538 170" stroke="#E7E0D6" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 270 335 L 345 335 L 435 186 L 538 186" stroke="#E7E0D6" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 865 110 L 790 110 L 725 170 L 622 170" stroke="#E7E0D6" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 895 335 L 815 335 L 725 186 L 622 186" stroke="#E7E0D6" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />

                {/* Animated Glowing Light Beams Converging Inwards to Center Planet */}
                <path
                  d="M 285 110 L 370 110 L 435 170 L 538 170"
                  stroke="url(#beamGradL1)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#beamGlow)"
                  className="beam-pulse-l1"
                />
                <path
                  d="M 270 335 L 345 335 L 435 186 L 538 186"
                  stroke="url(#beamGradL2)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#beamGlow)"
                  className="beam-pulse-l2"
                />
                <path
                  d="M 865 110 L 790 110 L 725 170 L 622 170"
                  stroke="url(#beamGradR1)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#beamGlow)"
                  className="beam-pulse-r1"
                />
                <path
                  d="M 895 335 L 815 335 L 725 186 L 622 186"
                  stroke="url(#beamGradR2)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#beamGlow)"
                  className="beam-pulse-r2"
                />
              </svg>

              {/* 1. TOP-LEFT CARD: NETFLIX (Clean pill header, no overlapping play icon, no dots) */}
              <div
                style={{ left: '88px', top: '58px', width: '198px' }}
                className="absolute bg-white rounded-2xl p-3 border border-stone-200/80 shadow-[0_12px_32px_-8px_rgba(28,25,23,0.07)]"
              >
                <div className="bg-[#1F242D] rounded-full px-2.5 py-1.5 flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-[4px] bg-[#E50914] flex items-center justify-center text-[9px] font-black text-white leading-none">
                      N
                    </span>
                    <span className="text-[10px] font-extrabold tracking-wider text-white">
                      NETFLIX
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[9px] font-bold text-slate-100 tracking-wide">
                    4K UHD
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11.5px] mb-1">
                  <span className="font-bold text-[#111827]">Stream Pass</span>
                  <span className="font-extrabold text-[#EA580C] font-mono">Rp2.500</span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-medium">43.2K Views</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#16A36A]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Ready</span>
                  </span>
                </div>
              </div>

              {/* 2. BOTTOM-LEFT CARD: CHATGPT PLUS (Orange AI SUITE badge, no dots) */}
              <div
                style={{ left: '62px', top: '252px', width: '210px' }}
                className="absolute bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-[0_12px_32px_-8px_rgba(28,25,23,0.07)]"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#0D9488] shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[8.5px] font-extrabold uppercase tracking-wider text-[#EA580C]">
                      AI SUITE
                    </div>
                    <div className="text-[11.5px] font-extrabold text-[#111827] truncate">
                      ChatGPT Plus & Team
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-[9.5px] mb-1">
                    <span className="text-slate-400 font-medium">Stok Tersedia</span>
                    <span className="font-bold text-[#16A36A]">88% Ready</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: '88%',
                        background: 'linear-gradient(90deg, #10B981 0%, #0D9488 100%)'
                      }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[8.5px] text-slate-400">Harga Resmi</div>
                    <div className="text-[11.5px] font-extrabold text-[#111827] font-mono">
                      Rp45.000<span className="text-[9px] font-normal text-slate-400">/bln</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOrderModalProduct(ALL_CATALOG_PRODUCTS[1])}
                    className="px-3.5 py-1 rounded-full bg-[#111827] hover:bg-[#E0531F] text-white text-[10px] font-bold transition-colors"
                  >
                    Order
                  </button>
                </div>
              </div>

              {/* 3. TOP-RIGHT CARD: @Rendy.vck (Verified Partner with BadgeCheck, no green pulse) */}
              <div
                style={{ left: '865px', top: '52px', width: '212px' }}
                className="absolute bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-[0_12px_32px_-8px_rgba(28,25,23,0.07)]"
              >
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-[#E0531F] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    RV
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11.5px] font-bold text-[#111827] leading-tight">
                      @Rendy.vck
                    </div>
                    <div className="inline-flex items-center gap-1 text-[9.5px] font-medium text-slate-400">
                      <BadgeCheck className="w-3 h-3 text-[#2563EB]" />
                      <span>Verified Partner</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 space-y-1.5 text-[10.5px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Views</span>
                    <span className="font-bold text-[#111827]">21.4K</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Est. Payout</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#ECFDF5] border border-[#A7F3D0] text-[#16A36A] font-extrabold text-[10.5px] font-mono">
                      Rp385.000
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. BOTTOM-RIGHT CARD: KEMITRAAN (Mitra Sales Resmi, Blue Diamond Icon, +15% Bonus, Tier 4) */}
              <div
                style={{ left: '895px', top: '252px', width: '176px' }}
                className="absolute bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-[0_12px_32px_-8px_rgba(28,25,23,0.07)] text-center"
              >
                <div className="text-[8.5px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  KEMITRAAN
                </div>

                {/* Blue Bracketed Diamond Icon */}
                <div className="my-2 flex items-center justify-center">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB]">
                    <Diamond className="w-5 h-5 fill-blue-500/10" />
                  </div>
                </div>

                <div className="text-[11.5px] font-extrabold text-[#111827] pb-2 border-b border-slate-100">
                  Mitra Sales Resmi
                </div>

                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-[#FFF7ED] border border-orange-200 text-[#EA580C] text-[9px] font-bold inline-flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>+15% Bonus</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-semibold text-slate-600 inline-flex items-center gap-0.5">
                    <Award className="w-2.5 h-2.5 text-amber-500" />
                    <span>Tier 4</span>
                  </span>
                </div>
              </div>

              {/* 5. CENTER 3D SQUIRCLE WITH LOOPING ANIMATED ASTERRA PLANET (Konten.com style, no dots) */}
              {/* Soft Ambient Radial Bloom Behind Squircle */}
              <div
                style={{ left: '580px', top: '175px' }}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full bg-orange-500/20 blur-2xl pointer-events-none"
              />

              <div
                style={{
                  left: '580px',
                  top: '175px',
                  background: 'linear-gradient(145deg, #FB923C 0%, #EA580C 50%, #C2410C 100%)',
                  boxShadow:
                    '0 22px 48px -8px rgba(234, 88, 12, 0.52), 0 0 32px 4px rgba(251, 146, 60, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.4)'
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-[84px] h-[84px] rounded-[24px] flex items-center justify-center border border-orange-200/50 p-2 overflow-hidden group transition-all duration-300 hover:scale-105"
              >
                <picture className="w-full h-full flex items-center justify-center pointer-events-none select-none">
                  <source srcSet="/assets/asterra-planet-transparent.webp" type="image/webp" />
                  <img
                    src="/assets/asterra-planet-transparent.webp"
                    alt="AsterraStore Looping Planet"
                    width={72}
                    height={72}
                    decoding="async"
                    draggable={false}
                    className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
                    onError={(e) => {
                      e.currentTarget.src = '/images/brand/asterra-mark.png';
                    }}
                  />
                </picture>
              </div>

              {/* 6. CENTER HEADLINE & CTA */}
              <div
                style={{ left: '580px', top: '236px', width: '540px' }}
                className="absolute -translate-x-1/2 text-center"
              >
                {/* Verified Transactions Pill */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-stone-200/90 shadow-sm mb-4">
                  <ShieldCheck className="w-4 h-4 text-[#16A36A]" />
                  <span className="text-[11px] font-semibold text-slate-700">
                    1.000+ Transaksi Sukses Terverifikasi
                  </span>
                </div>

                <h1 className="text-[40px] font-extrabold text-[#111827] tracking-tight leading-[1.12]">
                  Semua Kebutuhan Digital,
                  <span className="block text-[#E0531F]">Satu Tempat.</span>
                </h1>

                <p className="mt-3 text-[12.5px] text-slate-500 max-w-[435px] mx-auto leading-relaxed">
                  Temukan berbagai produk digital premium dengan proses pembelian mudah, cepat, dan
                  terpercaya hanya di Asterra Store.
                </p>

                <div className="mt-5 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigateAndScroll('calculator-section')}
                    style={{
                      boxShadow: '0 10px 22px -5px rgba(224, 83, 31, 0.42)'
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#E0531F] hover:bg-[#C94312] text-white text-[12.5px] font-bold transition-all"
                  >
                    <span>Mulai Sekarang</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateAndScroll('products-section')}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-stone-50 text-[#111827] border border-stone-200/90 text-[12.5px] font-bold shadow-sm transition-all"
                  >
                    <span>Jelajahi Produk</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION: KALKULATOR FINANSIAL (PINDAH KE HALAMAN UTAMA /)
        =================================================================== */}
        <section
          id="calculator-section"
          className="py-16 sm:py-20"
          style={{
            background: 'linear-gradient(180deg, #FDFBF7 0%, #FFF9F5 45%, #FAF7F2 100%)'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {renderFinancialCalculator(false)}
          </div>
        </section>

        {/* ===================================================================
            SECTION: KATALOG PRODUK UNGGULAN
        =================================================================== */}
        <section
          id="products-section"
          className="py-16 sm:py-20 bg-white border-t border-stone-200"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#EA580C] text-xs font-bold mb-3 shadow-2xs">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>KATALOG PRODUK & KOMISI SALES</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
                  Produk Digital Premium Siap Dipasarkan
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-500 max-w-2xl">
                  Harga kompetitif untuk pelanggan dengan komisi transparan 30% dari profit bersih
                  untuk setiap Mitra Sales AsterraStore.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  'Semua Produk',
                  'Streaming & Entertainment',
                  'AI & Productivity',
                  'Creative Tools'
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCatalogCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      catalogCategory === cat
                        ? 'bg-[#EA580C] text-white shadow-sm'
                        : 'bg-stone-100 text-slate-600 hover:bg-orange-50 hover:text-[#EA580C]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid with 3D TiltedCard Flip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((prod) => {
                const frontImage = PRODUCT_BRAND_IMAGES[prod.id] || '/images/apps/gemini.svg';
                return (
                  <TiltedCard
                    key={prod.id}
                    imageSrc={frontImage}
                    altText={prod.name}
                    captionText="Klik untuk lihat komisi"
                    showTooltip={true}
                    containerWidth="100%"
                    imageWidth="100%"
                    containerHeight="360px"
                    imageHeight="360px"
                    radius={24}
                    rotateAmplitude={12}
                    scaleOnHover={1.03}
                    glare={0.4}
                    shadow={0.45}
                    flipOnClick={true}
                    className="w-full"
                    backContent={
                      <div className="bg-white rounded-[24px] p-5 sm:p-6 flex flex-col justify-between h-full border border-stone-200/90 shadow-md text-left select-none relative">
                        <div>
                          {/* Category Pill & Stock Status */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-bold tracking-tight">
                              {prod.category}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A36A]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A]" />
                              <span>Stok {prod.stockPercent}%</span>
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-base font-extrabold text-slate-900 line-clamp-2 min-h-[46px] leading-snug">
                            {prod.name}
                          </h3>

                          {/* Duration & Warranty */}
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <ShieldCheck className="w-4 h-4 text-[#0D9488] shrink-0" />
                            <span>{prod.duration} • {prod.warranty}</span>
                          </div>

                          {/* Pricing & Commission Card matching Image 2 */}
                          <div className="mt-4 p-3.5 rounded-2xl bg-[#F8FAFC] border border-stone-200/90 space-y-2">
                            <div className="flex items-baseline justify-between">
                              <span className="text-xs text-slate-500 font-medium">Harga Pelanggan</span>
                              <span className="text-base font-extrabold text-slate-900 font-mono tracking-tight">
                                {formatIDR(prod.price)}
                              </span>
                            </div>
                            <div className="flex items-baseline justify-between pt-2 border-t border-stone-200/80">
                              <span className="text-xs font-bold text-[#15803D]">
                                Komisi Sales (30%)
                              </span>
                              <span className="text-sm font-extrabold text-[#059669] font-mono">
                                +{formatIDR(prod.commissionPerUnit)} <span className="text-xs font-semibold text-slate-500">/unit</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons matching Image 2 with stopPropagation */}
                        <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOrderModalProduct(prod);
                            }}
                            className="py-2.5 px-4 rounded-full bg-[#0F172A] hover:bg-[#EA580C] text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer text-center"
                          >
                            Beli Produk
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPromoModalProduct(prod);
                            }}
                            className="py-2.5 px-4 rounded-full bg-[#FFF7ED] hover:bg-orange-100 border border-orange-200/90 text-[#EA580C] text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer text-center"
                          >
                            <Share2 className="w-3.5 h-3.5 text-[#EA580C]" />
                            <span>Promosikan</span>
                          </button>
                        </div>
                      </div>
                    }
                  >
                    <TiltedCardLayer depth={25}>
                      <div className="absolute inset-x-3 bottom-3 p-3 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-between shadow-lg">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold truncate text-slate-100">{prod.name.split('[')[0]}</p>
                          <p className="text-[11px] text-emerald-400 font-semibold font-mono">
                            +{formatIDR(prod.commissionPerUnit)} komisi
                          </p>
                        </div>
                        <span className="shrink-0 px-2.5 py-1 rounded-lg bg-orange-500/25 border border-orange-400/40 text-[10px] font-bold text-orange-200 flex items-center gap-1">
                          <span>Lihat</span>
                          <span className="text-xs">↻</span>
                        </span>
                      </div>
                    </TiltedCardLayer>
                  </TiltedCard>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION: HOW IT WORKS
        =================================================================== */}
        <section
          id="how-it-works-section"
          className="py-16 sm:py-20 bg-[#FCFAF6] border-t border-orange-950/5"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#EA580C] text-xs font-bold mb-3 shadow-2xs">
                <Layers className="w-3.5 h-3.5 text-[#EA580C]" />
                <span>HOW IT WORKS</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
                Bagaimana Sistem AsterraStore Bekerja?
              </h2>
              <p className="mt-2.5 text-sm sm:text-base text-slate-600">
                Satu ekosistem terintegrasi yang memudahkan pelanggan mendapatkan produk digital
                premium dan membantu Mitra Sales memperoleh komisi bersih secara transparan.
              </p>

              <div className="mt-6 inline-flex p-1.5 rounded-2xl bg-white border border-stone-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => setHowItWorksTab('sales')}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    howItWorksTab === 'sales'
                      ? 'bg-[#EA580C] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Alur Mitra Sales (Komisi 30%)
                </button>
                <button
                  type="button"
                  onClick={() => setHowItWorksTab('customer')}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    howItWorksTab === 'customer'
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Alur Pelanggan (Beli Produk)
                </button>
              </div>
            </div>

            {/* 4 Step Cards */}
            {howItWorksTab === 'sales' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    step: '01',
                    icon: User,
                    title: 'Daftar Akun Sales Gratis',
                    desc: 'Registrasi sebagai Mitra Sales AsterraStore tanpa biaya pendaftaran dan tanpa kewajiban deposit stok produk.',
                    badge: 'Tanpa Modal'
                  },
                  {
                    step: '02',
                    icon: Share2,
                    title: 'Pilih & Bagikan Link Produk',
                    desc: 'Buka katalog di Sales Portal, salin tautan affiliate unik Anda atau gunakan template teks promosi siap kirim.',
                    badge: 'Katalog Lengkap'
                  },
                  {
                    step: '03',
                    icon: Zap,
                    title: 'Pesanan Diproses Otomatis',
                    desc: 'Saat pelanggan membeli melalui tautan Anda, pengiriman produk dan garansi ditangani penuh oleh sistem AsterraStore.',
                    badge: 'Terima Beres'
                  },
                  {
                    step: '04',
                    icon: Wallet,
                    title: 'Terima Komisi 30% Profit',
                    desc: 'Komisi 30% dari laba bersih transaksi langsung masuk ke saldo aktif dan siap dicairkan ke Bank atau E-Wallet.',
                    badge: 'Payout Cepat'
                  }
                ].map((item) => {
                  const StepIcon = item.icon;
                  return (
                    <div
                      key={item.step}
                      className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col justify-between shadow-sm hover:border-[#EA580C] transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 text-[#EA580C] font-extrabold text-sm flex items-center justify-center">
                            <StepIcon className="w-5 h-5" />
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-[#B45309] border border-amber-200 text-[11px] font-bold">
                            {item.badge}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    step: '01',
                    icon: ShoppingBag,
                    title: 'Pilih Layanan Digital',
                    desc: 'Jelajahi katalog layanan streaming, AI productivity, atau creative tools sesuai varian durasi yang Anda butuhkan.',
                    badge: '100% Original'
                  },
                  {
                    step: '02',
                    icon: CreditCard,
                    title: 'Checkout & Pembayaran Instan',
                    desc: 'Masukkan email/nomor WhatsApp penerima dan selesaikan pembayaran via QRIS, Virtual Account, atau E-Wallet.',
                    badge: 'QRIS & E-Wallet'
                  },
                  {
                    step: '03',
                    icon: Package,
                    title: 'Pengiriman Terstruktur',
                    desc: 'Sistem memverifikasi pembayaran secara otomatis dan mengirimkan detail akses akun beserta panduan aktivasi.',
                    badge: 'Proses Cepat'
                  },
                  {
                    step: '04',
                    icon: ShieldCheck,
                    title: 'Jaminan Garansi Penuh',
                    desc: 'Nikmati layanan digital premium dengan jaminan garansi resmi sesuai masa aktif paket yang Anda beli.',
                    badge: 'Full Garansi'
                  }
                ].map((item) => {
                  const StepIcon = item.icon;
                  return (
                    <div
                      key={item.step}
                      className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] font-extrabold text-sm flex items-center justify-center">
                            <StepIcon className="w-5 h-5" />
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                            {item.badge}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ===================================================================
            SECTION: FAQ
        =================================================================== */}
        <section id="faq-section" className="py-16 sm:py-20 bg-white border-t border-stone-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#EA580C] text-xs font-bold mb-3 shadow-2xs">
                <HelpCircle className="w-3.5 h-3.5 text-[#EA580C]" />
                <span>PERTANYAAN UMUM (FAQ)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
                Informasi Seputar Produk & Sales Portal
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-500">
                Transparansi mengenai komisi 30%, pencairan dana, dan jaminan kualitas produk
                AsterraStore.
              </p>
            </div>

            <div className="space-y-3.5">
              {FAQ_ITEMS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border transition-all ${
                      isOpen
                        ? 'bg-[#FFF9F5] border-orange-200 shadow-2xs'
                        : 'bg-white border-stone-200 hover:border-orange-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#EA580C]">
                          {faq.category}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                          {faq.question}
                        </h3>
                      </div>
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                          isOpen
                            ? 'bg-[#EA580C] text-white rotate-180'
                            : 'bg-stone-100 text-slate-600'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-orange-100">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Call to Action Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #18181B 55%, #1C1917 100%)',
                boxShadow: '0 20px 48px -10px rgba(15, 23, 42, 0.4)'
              }}
              className="mt-12 p-6 sm:p-8 rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-6 border border-stone-800 shadow-lg"
            >
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-[11px] font-bold mb-2">
                  Peluang Penghasilan Mitra
                </span>
                <h3 className="text-lg sm:text-xl font-bold">
                  Siap Memulai Komisi Bersama AsterraStore?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Bergabung gratis atau masuk ke dashboard kerja Sales Portal Anda sekarang.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  href="/sales"
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs sm:text-sm font-bold transition-colors"
                >
                  Buka Sales Portal
                </Link>
                <Link
                  href="/daftar-sales"
                  style={{
                    background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                    boxShadow: '0 10px 24px -4px rgba(234, 88, 12, 0.4)'
                  }}
                  className="px-5 py-2.5 rounded-xl hover:opacity-95 text-white text-xs sm:text-sm font-bold transition-all shadow-md inline-flex items-center gap-1.5"
                >
                  <span>Daftar Mitra Sales</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white border-t border-stone-200 py-10 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div
                style={{
                  background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)'
                }}
                className="w-7 h-7 rounded-full text-white font-extrabold flex items-center justify-center text-xs"
              >
                A
              </div>
              <span className="font-bold text-slate-900">
                AsterraStore — Semua Kebutuhan Digital, Satu Tempat.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={() => navigateAndScroll('calculator-section')}
                className="hover:text-[#EA580C] transition-colors"
              >
                Kalkulator Finansial
              </button>
              <button
                type="button"
                onClick={() => navigateAndScroll('how-it-works-section')}
                className="hover:text-[#EA580C] transition-colors"
              >
                How It Works
              </button>
              <button
                type="button"
                onClick={() => navigateAndScroll('faq-section')}
                className="hover:text-[#EA580C] transition-colors"
              >
                FAQ
              </button>
              <Link
                href="/sales"
                className="font-semibold text-[#EA580C] hover:underline"
              >
                Sales Portal
              </Link>
            </div>
          </div>
        </footer>
      </div>
    );
  };

  // ==========================================================================
  // VIEW 2: HALAMAN DAFTAR SALES (/daftar-sales)
  // ==========================================================================
  const renderRegisterSalesPage = () => (
    <div className="min-h-screen bg-[#FCFAF6] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button
          type="button"
          onClick={() => setCurrentRoute('landing')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#EA580C] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Utama</span>
        </button>

        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div
              style={{
                background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)'
              }}
              className="w-10 h-10 rounded-full text-white font-extrabold flex items-center justify-center text-lg"
            >
              A
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900">
                Registrasi Mitra Sales AsterraStore
              </div>
              <div className="text-xs text-[#EA580C] font-semibold">
                Komisi Resmi 30% Profit Bersih • Tanpa Biaya Pendaftaran
              </div>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Mulai Pasarkan Produk Digital AsterraStore
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Lengkapi data profil akun Anda di bawah ini untuk mendapatkan akses langsung ke{' '}
            <strong>Sales Portal Dashboard</strong>, generator link referral, dan pencairan komisi.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              showToast('Pendaftaran berhasil! Mengarahkan ke Dashboard...');
              setCurrentRoute('dashboard');
            }}
            className="mt-7 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  defaultValue="Rendy Vickriansyah"
                  placeholder="Nama Lengkap"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Username Sales / Kode Unik
                </label>
                <input
                  type="text"
                  required
                  defaultValue="Rendy.vck"
                  placeholder="Kode Sales"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Aktif
                </label>
                <input
                  type="email"
                  required
                  defaultValue="rendy.vck@asterrastore.biz.id"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  defaultValue="081288914402"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Bank / E-Wallet Pencairan
                </label>
                <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-[#2563EB]">
                  <option>Bank BCA</option>
                  <option>Bank Mandiri</option>
                  <option>Bank BRI</option>
                  <option>Bank BNI</option>
                  <option>GoPay</option>
                  <option>DANA</option>
                  <option>OVO</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor Rekening / E-Wallet
                </label>
                <input
                  type="text"
                  required
                  defaultValue="8420918271"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-slate-600 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
              <div>
                Dengan mendaftar, Anda menyetujui ketentuan kemitraan resmi AsterraStore (Komisi
                30% dari profit bersih setiap pesanan sukses).
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentRoute('landing');
                  setTimeout(() => navigateAndScroll('calculator-section'), 100);
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Lihat Simulasi Komisi
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <span>Aktifkan Akun & Masuk Sales Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // ==========================================================================
  // VIEW 3: SALES PORTAL DASHBOARD (/dashboard)
  // ==========================================================================
  const [dashSearchQuery, setDashSearchQuery] = useState('');
  const [txFilterStatus, setTxFilterStatus] = useState('Semua');
  const [chartPeriod, setChartPeriod] = useState('7d');

  const renderSalesPortalDashboard = () => {
    const navItems = [
      { id: 'overview', label: 'Ringkasan Performa', icon: BarChart3 },
      { id: 'catalog', label: 'Katalog & Promosi', icon: ShoppingBag },
      { id: 'transactions', label: 'Transaksi Penjualan', icon: FileText },
      { id: 'payouts', label: 'Komisi & Pencairan', icon: Wallet },
      { id: 'calculator', label: 'Kalkulator Komisi', icon: Calculator },
      { id: 'profile', label: 'Profil & Akun', icon: User }
    ];

    const filteredDashboardCatalog = ALL_CATALOG_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(dashSearchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(dashSearchQuery.toLowerCase())
    );

    const filteredTransactions = SELLER_TRANSACTIONS.filter((tx) => {
      if (txFilterStatus === 'Semua') return true;
      return tx.status === txFilterStatus;
    });

    return (
      <div className="min-h-screen bg-[#F4F5F7] text-slate-900 flex flex-col lg:flex-row">
        {/* Dark Sidebar (#111111) */}
        <aside className="w-full lg:w-64 bg-[#111111] text-slate-300 shrink-0 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
          <div>
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white font-extrabold flex items-center justify-center text-base">
                  A
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white tracking-tight leading-none">
                    Asterra<span className="text-[#3B82F6]">Store</span>
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-1">
                    SALES PORTAL v2.0
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentRoute('landing')}
                className="lg:hidden px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-200"
              >
                Marketplace
              </button>
            </div>

            {/* Seller Info Card */}
            <div className="p-4 mx-3 mt-4 rounded-xl bg-[#1B1B1B] border border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#EA580C] text-white font-bold text-xs flex items-center justify-center shrink-0">
                  RV
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">@Rendy.vck</div>
                  <div className="inline-flex items-center gap-1 text-[11px] text-[#16A36A] font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Mitra Sales Aktif</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Skema Komisi</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                  30% Profit
                </span>
              </div>
            </div>

            {/* Navigation List */}
            <nav className="p-3 space-y-1 flex lg:flex-col overflow-x-auto lg:overflow-x-visible">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = dashboardTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDashboardTab(item.id)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 lg:w-full text-left ${
                      isActive
                        ? 'bg-[#2563EB] text-white shadow-sm'
                        : 'text-slate-400 hover:bg-[#1B1B1B] hover:text-white'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="hidden lg:block p-4 border-t border-slate-800 space-y-2">
            <button
              type="button"
              onClick={() => setCurrentRoute('landing')}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#1B1B1B] hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
            >
              <span>Halaman Marketplace</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </aside>

        {/* Workspace Body */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {navItems.find((n) => n.id === dashboardTab)?.label}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola penjualan, bagikan link katalog, dan pantau pencairan komisi Anda.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                <span className="text-slate-500 mr-1.5">Link Toko:</span>
                <span className="font-mono font-bold text-slate-800 mr-2">
                  asterrastore.biz.id/?ref=RENDYVCK
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      'https://staging.sales.asterrastore.biz.id/?ref=RENDYVCK',
                      'Link toko affiliate Anda disalin!'
                    )
                  }
                  className="p-1 rounded-md bg-white hover:bg-blue-50 text-[#2563EB] border border-slate-200"
                  title="Salin Link"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPayoutModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16A36A] hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Cairkan Komisi</span>
              </button>
            </div>
          </header>

          <main className="p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
            {/* OVERVIEW TAB */}
            {dashboardTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1 */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">
                        Komisi Siap Dicairkan
                      </span>
                      <span className="p-2 rounded-xl bg-emerald-50 text-[#16A36A]">
                        <Wallet className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="my-3">
                      <div className="text-2xl font-extrabold text-[#16A36A] font-mono">
                        {formatIDR(availableBalance)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Saldo aktif siap ditransfer ke rekening
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPayoutModalOpen(true)}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#16A36A] text-xs font-bold transition-colors text-center inline-flex items-center justify-center gap-1"
                    >
                      <span>Ajukan Pencairan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">
                        Total Komisi Bulan Ini
                      </span>
                      <span className="p-2 rounded-xl bg-blue-50 text-[#2563EB]">
                        <TrendingUp className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="my-3">
                      <div className="text-2xl font-extrabold text-slate-900 font-mono">
                        Rp 512.400
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Murni 30% profit dari 48 pesanan sukses
                      </div>
                    </div>
                    <div className="text-[11px] font-semibold text-[#2563EB] bg-blue-50 px-2.5 py-1.5 rounded-lg">
                      Rata-rata komisi Rp 10.675 / transaksi
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">
                        Transaksi Terverifikasi
                      </span>
                      <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
                        <ShoppingBag className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="my-3">
                      <div className="text-2xl font-extrabold text-slate-900 font-mono">
                        48 Pesanan
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Total nilai produk terjual Rp 2.190.000
                      </div>
                    </div>
                    <div className="text-[11px] font-semibold text-[#16A36A] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>96% pesanan selesai sukses</span>
                    </div>
                  </div>

                  {/* Card 4 */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">
                        Komisi Dalam Proses
                      </span>
                      <span className="p-2 rounded-xl bg-amber-50 text-[#F59E0B]">
                        <Clock className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="my-3">
                      <div className="text-2xl font-extrabold text-[#F59E0B] font-mono">
                        Rp 42.150
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Menunggu verifikasi selesai pesanan
                      </div>
                    </div>
                    <div className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg">
                      4 transaksi aktif sedang berjalan
                    </div>
                  </div>
                </div>

                {/* Chart & Top Products Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Daily Chart */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          Grafik Performa Komisi Harian
                        </h2>
                        <p className="text-xs text-slate-500">
                          Akumulasi 30% profit bersih dari pesanan melalui tautan Anda
                        </p>
                      </div>
                      <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                        <button
                          type="button"
                          onClick={() => setChartPeriod('7d')}
                          className={`px-3 py-1 rounded-lg font-bold ${
                            chartPeriod === '7d'
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500'
                          }`}
                        >
                          7 Hari
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartPeriod('30d')}
                          className={`px-3 py-1 rounded-lg font-bold ${
                            chartPeriod === '30d'
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500'
                          }`}
                        >
                          Bulan Ini
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-3 items-end h-48 pt-6 pb-2 px-2 border-b border-slate-100">
                      {[
                        { day: 'Sen', val: 42000, h: '55%' },
                        { day: 'Sel', val: 58500, h: '72%' },
                        { day: 'Rab', val: 35100, h: '45%' },
                        { day: 'Kam', val: 76200, h: '92%' },
                        { day: 'Jum', val: 64800, h: '80%' },
                        { day: 'Sab', val: 82400, h: '100%' },
                        { day: 'Min', val: 54150, h: '68%' }
                      ].map((bar, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col items-center justify-end h-full group"
                        >
                          <div className="text-[10px] font-bold text-slate-600 mb-1.5 opacity-85 group-hover:text-[#2563EB]">
                            {Math.round(bar.val / 1000)}rb
                          </div>
                          <div className="w-full max-w-[38px] bg-slate-100 rounded-t-xl h-32 flex items-end overflow-hidden">
                            <div
                              className="w-full bg-[#2563EB] group-hover:bg-blue-700 rounded-t-xl transition-all duration-300"
                              style={{ height: bar.h }}
                            />
                          </div>
                          <div className="text-[11px] font-semibold text-slate-500 mt-2">
                            {bar.day}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>
                        Produk terlaris:{' '}
                        <strong className="text-slate-800">Google AI Pro 18 Bulan</strong> &{' '}
                        <strong className="text-slate-800">ChatGPT Plus</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setDashboardTab('calculator')}
                        className="font-bold text-[#2563EB] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Simulasikan Target Komisi</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Fast Share Box */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-base font-bold text-slate-900">
                            Promosi Cepat Produk Unggulan
                          </h2>
                          <p className="text-xs text-slate-500">
                            Salin link atau teks promosi WhatsApp sekali klik
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDashboardTab('catalog')}
                          className="text-xs font-bold text-[#2563EB] hover:underline"
                        >
                          Semua ({ALL_CATALOG_PRODUCTS.length})
                        </button>
                      </div>

                      <div className="space-y-3">
                        {ALL_CATALOG_PRODUCTS.slice(0, 3).map((prod) => (
                          <div
                            key={prod.id}
                            className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {prod.name}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-[11px]">
                                <span className="text-slate-500">
                                  Harga: {formatIDR(prod.price)}
                                </span>
                                <span className="text-[#16A36A] font-extrabold">
                                  • Komisi {formatIDR(prod.commissionPerUnit)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyText(
                                    `https://staging.sales.asterrastore.biz.id/p/${prod.id}?ref=RENDYVCK`,
                                    `Link affiliate ${prod.name.split('[')[0]} disalin!`
                                  )
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold"
                              >
                                Salin Link
                              </button>
                              <button
                                type="button"
                                onClick={() => setPromoModalProduct(prod)}
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#2563EB]"
                                title="Buat Teks Promosi WhatsApp"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDashboardTab('catalog')}
                      className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      <span>Buka Katalog Lengkap</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Recent Transactions Table */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Aktivitas Penjualan & Komisi Terbaru
                      </h2>
                      <p className="text-xs text-slate-500">
                        Pesanan pelanggan melalui tautan promosi Anda
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDashboardTab('transactions')}
                      className="text-xs font-bold text-[#2563EB] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Lihat Semua</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400">
                          <th className="py-3 px-3">ID Transaksi</th>
                          <th className="py-3 px-3">Produk</th>
                          <th className="py-3 px-3">Pembeli</th>
                          <th className="py-3 px-3">Harga</th>
                          <th className="py-3 px-3">Komisi 30%</th>
                          <th className="py-3 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {SELLER_TRANSACTIONS.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50">
                            <td className="py-3.5 px-3 font-mono font-semibold text-slate-700">
                              {tx.id}
                              <div className="text-[10px] font-sans font-normal text-slate-400">
                                {tx.date}
                              </div>
                            </td>
                            <td className="py-3.5 px-3 font-bold text-slate-900">{tx.product}</td>
                            <td className="py-3.5 px-3 text-slate-500">{tx.buyer}</td>
                            <td className="py-3.5 px-3 font-mono text-slate-700">
                              {formatIDR(tx.price)}
                            </td>
                            <td className="py-3.5 px-3 font-mono font-extrabold text-[#16A36A]">
                              +{formatIDR(tx.commission)}
                            </td>
                            <td className="py-3.5 px-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  tx.status === 'Selesai'
                                    ? 'bg-emerald-50 text-[#16A36A]'
                                    : tx.status === 'Diproses'
                                    ? 'bg-amber-50 text-[#F59E0B]'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* CATALOG TAB */}
            {dashboardTab === 'catalog' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Katalog Produk & Generator Promosi
                    </h2>
                    <p className="text-xs text-slate-500">
                      Salin tautan atau teks promosi WhatsApp untuk disebarkan ke media sosial.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={dashSearchQuery}
                      onChange={(e) => setDashSearchQuery(e.target.value)}
                      placeholder="Cari produk..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDashboardCatalog.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between bg-white"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-[#2563EB] text-[11px] font-bold">
                            {prod.category}
                          </span>
                          <span className="text-[11px] font-semibold text-[#16A36A]">
                            Stok {prod.stockPercent}%
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{prod.name}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {prod.duration} • {prod.warranty}
                        </p>

                        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Harga Jual Resmi:</span>
                            <span className="font-bold text-slate-900 font-mono">
                              {formatIDR(prod.price)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-200">
                            <span className="font-semibold text-[#2563EB]">
                              Komisi Anda (30% Profit):
                            </span>
                            <span className="font-extrabold text-[#16A36A] font-mono">
                              +{formatIDR(prod.commissionPerUnit)} /unit
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(
                              `https://staging.sales.asterrastore.biz.id/p/${prod.id}?ref=RENDYVCK`,
                              `Link affiliate ${prod.name.split('[')[0]} disalin!`
                            )
                          }
                          className="flex-1 py-2 px-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Link</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPromoModalProduct(prod)}
                          className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Teks WA</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TRANSACTIONS TAB */}
            {dashboardTab === 'transactions' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Riwayat Transaksi Penjualan
                    </h2>
                    <p className="text-xs text-slate-500">
                      Seluruh transaksi pembeli yang menggunakan kode referensi Anda
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['Semua', 'Selesai', 'Diproses'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setTxFilterStatus(st)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                          txFilterStatus === st
                            ? 'bg-[#2563EB] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-3">Invoice</th>
                        <th className="py-3 px-3">Produk</th>
                        <th className="py-3 px-3">Pembeli</th>
                        <th className="py-3 px-3">Harga</th>
                        <th className="py-3 px-3">Komisi 30%</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Pencairan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-800">
                            {tx.id}
                            <div className="text-[10px] font-sans font-normal text-slate-400">
                              {tx.date}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-bold text-slate-900">{tx.product}</td>
                          <td className="py-3.5 px-3 text-slate-500">{tx.buyer}</td>
                          <td className="py-3.5 px-3 font-mono text-slate-700">
                            {formatIDR(tx.price)}
                          </td>
                          <td className="py-3.5 px-3 font-mono font-extrabold text-[#16A36A]">
                            +{formatIDR(tx.commission)}
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                tx.status === 'Selesai'
                                  ? 'bg-emerald-50 text-[#16A36A]'
                                  : 'bg-amber-50 text-[#F59E0B]'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-slate-700">
                            {tx.payoutStatus}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PAYOUTS TAB */}
            {dashboardTab === 'payouts' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="text-xs font-bold text-slate-500">
                      Saldo Komisi Siap Dicairkan
                    </div>
                    <div className="text-2xl font-extrabold text-[#16A36A] font-mono mt-2">
                      {formatIDR(availableBalance)}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPayoutModalOpen(true)}
                      className="mt-4 w-full py-2.5 rounded-xl bg-[#16A36A] hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                    >
                      Tarik Dana Sekarang
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="text-xs font-bold text-slate-500">
                      Total Komisi Telah Dicairkan
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 font-mono mt-2">
                      Rp 745.000
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Akumulasi penarikan berhasil ke rekening tujuan Anda.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="text-xs font-bold text-slate-500">Rekening Tujuan Utama</div>
                    <div className="text-sm font-extrabold text-slate-900 mt-2">
                      Bank BCA (8420918271)
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">a.n. Rendy Vickriansyah</div>
                    <button
                      type="button"
                      onClick={() => setDashboardTab('profile')}
                      className="mt-3 text-xs font-bold text-[#2563EB] hover:underline"
                    >
                      Ubah Rekening Tujuan
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-4">
                    Riwayat Pencairan Dana
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400">
                          <th className="py-3 px-3">ID Payout</th>
                          <th className="py-3 px-3">Tanggal</th>
                          <th className="py-3 px-3">Metode Transfer</th>
                          <th className="py-3 px-3">Nominal Bersih</th>
                          <th className="py-3 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {payoutList.map((wd) => (
                          <tr key={wd.id}>
                            <td className="py-3.5 px-3 font-mono font-bold text-slate-800">
                              {wd.id}
                            </td>
                            <td className="py-3.5 px-3 text-slate-500">{wd.date}</td>
                            <td className="py-3.5 px-3 font-semibold text-slate-800">
                              {wd.method}
                            </td>
                            <td className="py-3.5 px-3 font-mono font-extrabold text-slate-900">
                              {formatIDR(wd.amount)}
                            </td>
                            <td className="py-3.5 px-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  wd.status.includes('Berhasil')
                                    ? 'bg-emerald-50 text-[#16A36A]'
                                    : 'bg-amber-50 text-[#F59E0B]'
                                }`}
                              >
                                {wd.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* CALCULATOR EMBEDDED TAB */}
            {dashboardTab === 'calculator' && renderFinancialCalculator(true)}

            {/* PROFILE TAB */}
            {dashboardTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl space-y-5 shadow-sm">
                <h2 className="text-base font-bold text-slate-900">
                  Profil Sales & Rekening Pencairan
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      defaultValue="Rendy Vickriansyah"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kode Referral</label>
                    <input
                      type="text"
                      defaultValue="RENDYVCK"
                      readOnly
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bank / E-Wallet</label>
                    <input
                      type="text"
                      defaultValue="Bank BCA"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nomor Rekening</label>
                    <input
                      type="text"
                      defaultValue="8420918271"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => showToast('Perubahan profil berhasil disimpan!')}
                  className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Simpan Perubahan
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // MODALS RENDERING (PROMO GENERATOR, QUICK ORDER, PAYOUT)
  // ==========================================================================
  return (
    <div className="min-h-screen flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {currentRoute === 'landing' && renderLandingPage()}
      {currentRoute === 'register' && renderRegisterSalesPage()}
      {currentRoute === 'dashboard' && renderSalesPortalDashboard()}

      {/* 1. WHATSAPP & TELEGRAM PROMO GENERATOR MODAL */}
      {promoModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-[#2563EB] text-[11px] font-bold">
                  Materi Promosi Sales
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  {promoModalProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPromoModalProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Harga Jual Resmi:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatIDR(promoModalProduct.price)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Komisi Sales (30% Profit Bersih):</span>
                <span className="font-extrabold text-[#16A36A] font-mono">
                  +{formatIDR(promoModalProduct.commissionPerUnit)} / pesanan
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Template Teks Promosi Siap Kirim (Tanpa Emoticon Acak):
              </label>
              <textarea
                readOnly
                rows={6}
                value={`[PROMO SPESIAL ASTERRASTORE]\n\nLayanan: ${promoModalProduct.name}\nDurasi: ${promoModalProduct.duration} (${promoModalProduct.warranty})\nHarga Resmi: ${formatIDR(promoModalProduct.price)}\nJaminan: 100% Legal, Cepat, dan Bergaransi Resmi\n\nOrder langsung melalui link terverifikasi berikut:\nhttps://staging.sales.asterrastore.biz.id/p/${promoModalProduct.id}?ref=RENDYVCK`}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 font-mono leading-relaxed focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPromoModalProduct(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  handleCopyText(
                    `[PROMO SPESIAL ASTERRASTORE]\n\nLayanan: ${promoModalProduct.name}\nDurasi: ${promoModalProduct.duration} (${promoModalProduct.warranty})\nHarga Resmi: ${formatIDR(promoModalProduct.price)}\nJaminan: 100% Legal, Cepat, dan Bergaransi Resmi\n\nOrder langsung melalui link terverifikasi berikut:\nhttps://staging.sales.asterrastore.biz.id/p/${promoModalProduct.id}?ref=RENDYVCK`,
                    'Teks promosi dan tautan affiliate berhasil disalin!'
                  );
                  setPromoModalProduct(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Teks & Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. QUICK ORDER CHECKOUT MODAL */}
      {orderModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-orange-50 text-[#EA580C] text-[11px] font-bold">
                  Checkout Instan AsterraStore
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  {orderModalProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOrderModalProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Durasi & Garansi:</span>
                <span className="font-semibold text-slate-800">
                  {orderModalProduct.duration} ({orderModalProduct.warranty})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Pembayaran:</span>
                <span className="text-sm font-extrabold text-[#EA580C] font-mono">
                  {formatIDR(orderModalProduct.price)}
                </span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setOrderModalProduct(null);
                showToast(
                  `Pesanan ${orderModalProduct.name.split('[')[0]} berhasil dibuat! Selesaikan pembayaran via QRIS.`
                );
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email / WhatsApp Penerima Akun
                </label>
                <input
                  type="text"
                  required
                  placeholder="pelanggan@gmail.com / 0812xxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#EA580C]"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white">
                  <option>QRIS Instan (Semua E-Wallet & Mobile Banking)</option>
                  <option>BCA Virtual Account</option>
                  <option>Mandiri Virtual Account</option>
                  <option>GoPay / DANA / OVO</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOrderModalProduct(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-orange-700 text-white font-bold inline-flex items-center gap-1.5"
                >
                  <span>Bayar Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. PAYOUT REQUEST MODAL */}
      {payoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-[#16A36A] text-[11px] font-bold">
                  Pencairan Komisi Sales
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  Tarik Saldo Komisi Aktif
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPayoutModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Saldo Siap Dicairkan:</span>
                <span className="text-base font-extrabold text-[#16A36A] font-mono">
                  {formatIDR(availableBalance)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nominal Pencairan (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="50000"
                  max={availableBalance}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rekening Tujuan</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option>BCA (8420918271 a.n. Rendy V.)</option>
                  <option>GoPay (0812-8891-4402 a.n. Rendy V.)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayoutModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#16A36A] hover:bg-emerald-700 text-white font-bold"
                >
                  Konfirmasi Pencairan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-[#111111] text-white px-4 py-3 rounded-2xl shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-[#16A36A] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
