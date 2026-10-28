'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalculator,
  faPlus,
  faMinus,
  faTrashCan,
  faRotateLeft,
  faPercent,
  faShieldHalved,
  faArrowTrendUp,
  faCartPlus,
  faBagShopping,
  faCoins,
  faTriangleExclamation,
  faCircleInfo,
  faCheck,
  faTags,
  faStore,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AUTHENTIC_CATALOG_PRODUCTS,
  SimulatedProduct,
  formatRupiah,
} from '@/lib/catalog-products';

interface SimulationItem {
  product: SimulatedProduct;
  quantity: number;
}

interface CommissionPreset {
  id: string;
  code: string;
  name: string;
  personalRate: 15 | 20;
  referrals: number;
  totalPercent: number;
  description: string;
}

const COMMISSION_PRESETS: CommissionPreset[] = [
  {
    id: 'level-a',
    code: 'LEVEL A',
    name: 'Sales Pemula',
    personalRate: 15,
    referrals: 0,
    totalPercent: 15,
    description: 'Komisi standar 15% penjualan mandiri tanpa referral',
  },
  {
    id: 'level-b',
    code: 'LEVEL B',
    name: 'Sales Target (VIP)',
    personalRate: 20,
    referrals: 0,
    totalPercent: 20,
    description: 'Komisi 20% penjualan mandiri (Milestone 50+ order)',
  },
  {
    id: 'level-c',
    code: 'LEVEL C',
    name: 'Pemula + 1 Referral',
    personalRate: 15,
    referrals: 1,
    totalPercent: 17,
    description: '15% komisi pribadi + 2% bonus referral (Total 17%)',
  },
  {
    id: 'level-d',
    code: 'LEVEL D',
    name: 'Pemula + 2 Referral',
    personalRate: 15,
    referrals: 2,
    totalPercent: 19,
    description: '15% komisi pribadi + 2×2% bonus referral (Total 19%)',
  },
  {
    id: 'level-e',
    code: 'LEVEL E',
    name: 'Target + 1 Referral',
    personalRate: 20,
    referrals: 1,
    totalPercent: 22,
    description: '20% komisi pribadi + 2% bonus referral (Total 22%)',
  },
  {
    id: 'level-f',
    code: 'LEVEL F',
    name: 'Target + 2 Referral',
    personalRate: 20,
    referrals: 2,
    totalPercent: 24,
    description: '20% komisi pribadi + 2×2% bonus referral (Total 24%)',
  },
];

// Initial realistic product basket (Canva Education, ChatGPT Plus, Netflix)
const INITIAL_ITEMS: SimulationItem[] = [
  {
    product: AUTHENTIC_CATALOG_PRODUCTS[0], // Canva Education
    quantity: 10,
  },
  {
    product: AUTHENTIC_CATALOG_PRODUCTS[1], // ChatGPT Plus
    quantity: 5,
  },
  {
    product: AUTHENTIC_CATALOG_PRODUCTS[2], // Netflix Premium
    quantity: 20,
  },
];

export function CommissionSimulator() {
  // Simulator Mode: 'commission' (Mode Penjualan Pribadi & Referral) or 'reseller' (Mode Simulasi Harga Jual Reseller)
  const [activeMode, setActiveMode] = useState<'commission' | 'reseller'>('commission');

  // ----------------------------------------------------
  // STATE MODE 1: SIMULASI KOMISI SALES
  // ----------------------------------------------------
  const [personalRate, setPersonalRate] = useState<15 | 20>(15);
  const [referralCount, setReferralCount] = useState<number>(0);
  const [activePreset, setActivePreset] = useState<string>('level-a');
  const [items, setItems] = useState<SimulationItem[]>(INITIAL_ITEMS);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Available products not yet added to current simulation basket
  const availableProducts = useMemo(() => {
    const existingIds = new Set(items.map((i) => i.product.id));
    return AUTHENTIC_CATALOG_PRODUCTS.filter((p) => !existingIds.has(p.id));
  }, [items]);

  // Set default selected product whenever availableProducts changes
  useEffect(() => {
    if (availableProducts.length > 0) {
      if (!availableProducts.some((p) => p.id === selectedProductId)) {
        setSelectedProductId(availableProducts[0].id);
      }
    } else {
      setSelectedProductId('');
    }
  }, [availableProducts, selectedProductId]);

  // Handle Preset Selection
  const applyPreset = (preset: CommissionPreset) => {
    setActivePreset(preset.id);
    setPersonalRate(preset.personalRate);
    setReferralCount(preset.referrals);
  };

  const handleRateChange = (rate: 15 | 20) => {
    setPersonalRate(rate);
    const matching = COMMISSION_PRESETS.find(
      (p) => p.personalRate === rate && p.referrals === referralCount
    );
    setActivePreset(matching ? matching.id : 'custom');
  };

  const handleReferralChange = (count: number) => {
    const validCount = Math.max(0, Math.floor(count));
    setReferralCount(validCount);
    const matching = COMMISSION_PRESETS.find(
      (p) => p.personalRate === personalRate && p.referrals === validCount
    );
    setActivePreset(matching ? matching.id : 'custom');
  };

  // Add Product to Commission Basket
  const handleAddProduct = () => {
    if (!selectedProductId) return;
    const prod = AUTHENTIC_CATALOG_PRODUCTS.find((p) => p.id === selectedProductId);
    if (!prod) return;
    setItems((prev) => [...prev, { product: prod, quantity: 5 }]);
  };

  // Update Item Quantity (Strict positive integer validation)
  const handleQuantityChange = (productId: string, rawVal: number | string) => {
    const num = typeof rawVal === 'number' ? rawVal : parseInt(String(rawVal), 10);
    const validQty = isNaN(num) || num < 0 ? 0 : Math.min(9999, Math.floor(num));
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: validQty } : i
      )
    );
  };

  const handleQuantityStep = (productId: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.product.id === productId) {
          const next = Math.max(0, i.quantity + delta);
          return { ...i, quantity: next };
        }
        return i;
      })
    );
  };

  // Remove Item
  const handleRemoveItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  // Reset Commission Simulation
  const handleResetSimulation = () => {
    setItems(INITIAL_ITEMS);
    setPersonalRate(15);
    setReferralCount(0);
    setActivePreset('level-a');
  };

  // Safe Real-time Commission Calculation (Zero Internal Profit Leakage)
  const simulationResults = useMemo(() => {
    let totalUnits = 0;
    let personalCommission = 0;
    let totalBaseCommission = 0;

    const breakdown = items.map((item) => {
      const qty = item.quantity;
      // Base commission is 15% standard rate. If VIP 20%, scaled proportionally.
      const rateMultiplier = personalRate === 20 ? (20 / 15) : 1.0;
      const unitCommission = Math.round(item.product.baseCommission * rateMultiplier);
      const subtotalCommission = unitCommission * qty;

      totalUnits += qty;
      personalCommission += subtotalCommission;
      totalBaseCommission += item.product.baseCommission * qty;

      return {
        ...item,
        unitCommission,
        subtotalCommission,
      };
    });

    // Referral bonus is 2% of profit baseline (which is exactly 2/15 of the 15% base commission)
    const referralBonus = Math.round(totalBaseCommission * (2 / 15) * referralCount);
    const totalEarnings = personalCommission + referralBonus;
    const effectiveCommissionRate = personalRate + referralCount * 2;

    return {
      totalUnits,
      personalCommission,
      referralBonus,
      totalEarnings,
      effectiveCommissionRate,
      breakdown,
    };
  }, [items, personalRate, referralCount]);

  // ----------------------------------------------------
  // STATE MODE 2: SIMULASI HARGA JUAL RESELLER
  // ----------------------------------------------------
  // Test Scenario Preset or Custom
  const [isTestScenarioA, setIsTestScenarioA] = useState<boolean>(false);
  const [selectedResellerProductId, setSelectedResellerProductId] = useState<string>(
    AUTHENTIC_CATALOG_PRODUCTS[0].id
  );
  const [resellerSellingPriceInput, setResellerSellingPriceInput] = useState<string>('30000');
  const [resellerQuantityInput, setResellerQuantityInput] = useState<string>('10');
  const [isCommissionEligible, setIsCommissionEligible] = useState<boolean>(true);
  const [resellerReferralCount, setResellerReferralCount] = useState<number>(0);

  // Selected Product for Reseller Mode
  const activeResellerProduct = useMemo(() => {
    return (
      AUTHENTIC_CATALOG_PRODUCTS.find((p) => p.id === selectedResellerProductId) ||
      AUTHENTIC_CATALOG_PRODUCTS[0]
    );
  }, [selectedResellerProductId]);

  // When switching products in authentic mode, suggest a default selling price (price + 20% or +Rp 5.000)
  const handleSelectResellerProduct = (productId: string) => {
    setIsTestScenarioA(false);
    setSelectedResellerProductId(productId);
    const prod = AUTHENTIC_CATALOG_PRODUCTS.find((p) => p.id === productId);
    if (prod) {
      const suggested = Math.round(prod.price * 1.15 / 1000) * 1000;
      setResellerSellingPriceInput(String(suggested));
    }
  };

  // Load Test Scenario A directly (Asterra Rp 20.000, Reseller Rp 23.000, 10 Unit, Komisi Rp 500)
  const handleLoadScenarioA = () => {
    setIsTestScenarioA(true);
    setResellerSellingPriceInput('23000');
    setResellerQuantityInput('10');
    setIsCommissionEligible(true);
    setResellerReferralCount(0);
  };

  // Current AsterraStore Price & Unit Commission for Reseller Simulation
  const currentAsterraPrice = isTestScenarioA ? 20000 : activeResellerProduct.price;
  const currentUnitCommissionEstimate = isTestScenarioA ? 500 : activeResellerProduct.baseCommission;

  // Numerical inputs with safe fallback (Zero NaN/undefined guarantee)
  const numericSellingPrice = useMemo(() => {
    const cleaned = String(resellerSellingPriceInput).replace(/[^\d]/g, '');
    if (!cleaned) return 0;
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  }, [resellerSellingPriceInput]);

  const numericQuantity = useMemo(() => {
    const cleaned = String(resellerQuantityInput).replace(/[^\d]/g, '');
    if (!cleaned) return 0;
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) || parsed < 0 ? 0 : Math.min(99999, parsed);
  }, [resellerQuantityInput]);

  // Reseller Calculations
  const resellerResults = useMemo(() => {
    const asterraPrice = currentAsterraPrice;
    const sellingPrice = numericSellingPrice;
    const units = numericQuantity;

    // 1. Selisih harga per unit = Harga jual kepada pelanggan - Harga produk AsterraStore
    const unitMarkup = sellingPrice - asterraPrice;

    // 2. Estimasi total markup = Jumlah unit × Selisih harga per unit
    const totalMarkup = units * unitMarkup;

    // 3. Estimasi komisi = Jumlah unit × Komisi per transaksi yang memenuhi syarat
    const unitCommission = isCommissionEligible ? currentUnitCommissionEstimate : 0;
    const totalCommission = units * unitCommission;

    // 4. Bonus referral (jika relevan dan memenuhi syarat)
    const referralBonus =
      isCommissionEligible && resellerReferralCount > 0
        ? Math.round(units * unitCommission * 0.20 * resellerReferralCount)
        : 0;

    // 5. Total potensi pendapatan = Estimasi total markup + Estimasi komisi + Bonus referral
    const totalPotentialEarnings = totalMarkup + totalCommission + referralBonus;

    // Loss Detection
    const hasLoss = sellingPrice < asterraPrice;
    const isZeroUnits = units === 0;

    return {
      asterraPrice,
      sellingPrice,
      unitMarkup,
      units,
      totalMarkup,
      unitCommission,
      totalCommission,
      referralBonus,
      totalPotentialEarnings,
      hasLoss,
      isZeroUnits,
    };
  }, [
    currentAsterraPrice,
    numericSellingPrice,
    numericQuantity,
    isCommissionEligible,
    currentUnitCommissionEstimate,
    resellerReferralCount,
  ]);

  // Quick Markup Increment Helpers
  const applyMarkupOffset = (offsetRp: number) => {
    const nextPrice = Math.max(0, currentAsterraPrice + offsetRp);
    setResellerSellingPriceInput(String(nextPrice));
  };

  const applyLossScenario = () => {
    // Purposeful loss scenario test (Scenario C: Selling price lower than product price)
    const lowerPrice = Math.max(0, currentAsterraPrice - 2000);
    setResellerSellingPriceInput(String(lowerPrice));
  };

  return (
    <div
      id="kalkulator-sales"
      className="bg-surface border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-sm space-y-8 animate-in fade-in"
    >
      {/* 1. TOP HEADER & MODE SEGMENTED CONTROL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
            <FontAwesomeIcon icon={activeMode === 'commission' ? faCalculator : faCoins} className="text-xs" />
            <span>Kalkulator Finansial AsterraStore</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
            {activeMode === 'commission' ? 'Simulasi Penghasilan Sales' : 'Simulasi Harga Jual Reseller'}
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed max-w-2xl">
            {activeMode === 'commission'
              ? 'Pilih produk dan jumlah penjualan untuk melihat estimasi komisi bulanan Anda secara langsung. Komisi dihitung berdasarkan skema komisi kemitraan resmi AsterraStore.'
              : 'Atur harga jual kepada pelanggan untuk memperkirakan potensi pendapatan Anda.'}
          </p>
        </div>

        {/* MODE SWITCHER TABS (Segmented Control) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <div className="inline-flex p-1 rounded-xl bg-surface-raised border border-border shadow-xs">
            <button
              type="button"
              onClick={() => setActiveMode('commission')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeMode === 'commission'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              <FontAwesomeIcon icon={faCalculator} className="text-xs" />
              <span>Simulasi Komisi Sales</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('reseller')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeMode === 'reseller'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              <FontAwesomeIcon icon={faStore} className="text-xs" />
              <span>Simulasi Harga Jual Reseller</span>
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={activeMode === 'commission' ? handleResetSimulation : () => handleSelectResellerProduct(AUTHENTIC_CATALOG_PRODUCTS[0].id)}
            className="text-xs h-9 px-3 gap-1.5 border-border hover:bg-surface-raised cursor-pointer"
            title="Reset simulasi ke kondisi awal"
          >
            <FontAwesomeIcon icon={faRotateLeft} className="text-xs text-foreground-muted" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: SIMULASI KOMISI SALES (PRIBADI & REFERRAL)                        */}
      {/* ========================================================================= */}
      {activeMode === 'commission' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Preset Level Scenarios (A - F) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FontAwesomeIcon icon={faPercent} className="text-xs text-primary" />
                <span>Pilihan Skenario Level Komisi:</span>
              </span>
              <span className="text-[11px] text-foreground-muted">
                Klik skenario untuk simulasi otomatis
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {COMMISSION_PRESETS.map((preset) => {
                const isSelected = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-xs ring-2 ring-primary/20'
                        : 'bg-surface-raised hover:bg-surface border-border text-foreground'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                            isSelected ? 'text-white/80' : 'text-primary'
                          }`}
                        >
                          {preset.code}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] py-0 px-1 font-mono font-bold ${
                            isSelected
                              ? 'border-white/30 text-white bg-white/10'
                              : 'border-primary/20 text-primary bg-primary/5'
                          }`}
                        >
                          {preset.totalPercent}%
                        </Badge>
                      </div>
                      <h4
                        className={`text-xs font-bold mt-1 line-clamp-1 ${
                          isSelected ? 'text-white' : 'text-foreground'
                        }`}
                      >
                        {preset.name}
                      </h4>
                    </div>
                    <span
                      className={`text-[10px] mt-1.5 block leading-tight ${
                        isSelected ? 'text-white/80' : 'text-foreground-muted'
                      }`}
                    >
                      {preset.personalRate}% {preset.referrals > 0 ? `+ ${preset.referrals * 2}% Ref` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Interaction Grid: Controls & Basket (Left) + Results Panel (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Left Column: Rate Customizer & Product Basket (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Rate & Referral Controls Bar */}
              <div className="p-4 rounded-xl bg-surface-raised border border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Personal Commission Rate Toggle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Tingkat Komisi Penjualan Pribadi:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleRateChange(15)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        personalRate === 15
                          ? 'bg-primary text-white border-primary shadow-2xs'
                          : 'bg-surface hover:bg-surface-raised border-border text-foreground'
                      }`}
                    >
                      <FontAwesomeIcon icon={faPercent} className="text-xs" />
                      <span>15% (Pemula)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRateChange(20)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        personalRate === 20
                          ? 'bg-primary text-white border-primary shadow-2xs'
                          : 'bg-surface hover:bg-surface-raised border-border text-foreground'
                      }`}
                    >
                      <FontAwesomeIcon icon={faArrowTrendUp} className="text-xs" />
                      <span>20% (Target VIP)</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-foreground-muted block">
                    Naik ke 20% otomatis setelah akumulasi 50 pesanan sukses.
                  </span>
                </div>

                {/* Referral Count Stepper */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      Mitra Referral Aktif:
                    </label>
                    <span className="text-[10px] font-mono text-status-success font-semibold">
                      +{referralCount * 2}% Bonus
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleReferralChange(referralCount - 1)}
                      disabled={referralCount <= 0}
                      className="w-9 h-9 p-0 rounded-lg shrink-0 border-border cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faMinus} className="text-xs" />
                    </Button>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={referralCount}
                      onChange={(e) => handleReferralChange(parseInt(e.target.value, 10) || 0)}
                      className="h-9 w-full rounded-lg bg-surface border border-border text-center text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleReferralChange(referralCount + 1)}
                      className="w-9 h-9 p-0 rounded-lg shrink-0 border-border cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faPlus} className="text-xs" />
                    </Button>
                  </div>
                  <span className="text-[10px] text-foreground-muted block">
                    Bonus 2% dari transaksi mitra yang Anda rekrut langsung.
                  </span>
                </div>
              </div>

              {/* Product Selection List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <FontAwesomeIcon icon={faBagShopping} className="text-xs text-primary" />
                      <span>Daftar Produk yang Disimulasikan ({items.length})</span>
                    </h3>
                    <p className="text-[11px] text-foreground-muted">
                      Sesuaikan jumlah terjual per produk untuk melihat proyeksi komisi.
                    </p>
                  </div>

                  {/* Add Product Dropdown */}
                  {availableProducts.length > 0 && (
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="h-8 max-w-[180px] sm:max-w-[220px] rounded-lg bg-surface-raised border border-border text-xs px-2 text-foreground truncate focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {availableProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddProduct}
                        className="h-8 px-2.5 text-xs font-bold gap-1 bg-primary cursor-pointer shrink-0"
                      >
                        <FontAwesomeIcon icon={faCartPlus} className="text-xs" />
                        <span>Tambah</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* List of Simulated Items */}
                {items.length === 0 ? (
                  <div className="p-8 rounded-xl border border-dashed border-border text-center space-y-3 bg-surface-raised/40">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <FontAwesomeIcon icon={faCartPlus} className="text-lg" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        Belum Ada Produk dalam Simulasi
                      </h4>
                      <p className="text-xs text-foreground-muted mt-0.5 max-w-sm mx-auto">
                        Pilih produk digital dari katalog di atas untuk mulai menghitung estimasi komisi.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleResetSimulation}
                      className="text-xs h-9 px-4 font-bold bg-primary"
                    >
                      Tambah Produk Rekomendasi
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {simulationResults.breakdown.map((item) => (
                      <div
                        key={item.product.id}
                        className="p-3.5 sm:p-4 rounded-xl bg-surface border border-border hover:border-primary/30 transition-colors shadow-2xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                                {item.product.category}
                              </span>
                              <span className="text-xs text-foreground-muted font-mono">
                                Harga: {formatRupiah(item.product.price)}
                              </span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug line-clamp-2">
                              {item.product.name}
                            </h4>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.product.id)}
                            className="text-foreground-muted hover:text-status-error p-1 rounded transition-colors cursor-pointer shrink-0"
                            title="Hapus dari simulasi"
                            aria-label={`Hapus ${item.product.name} dari simulasi`}
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                          </button>
                        </div>

                        {/* Quantity Stepper & Commission Info (Zero Margin Leakage) */}
                        <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          {/* Stepper Quantity Control */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-foreground-muted font-medium">
                              Jumlah Penjualan:
                            </span>
                            <div className="inline-flex items-center border border-border rounded-lg bg-surface-raised overflow-hidden">
                              <button
                                type="button"
                                onClick={() => handleQuantityStep(item.product.id, -1)}
                                disabled={item.quantity <= 0}
                                className="w-7 h-7 flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-surface disabled:opacity-40 transition-colors cursor-pointer"
                                aria-label="Kurangi jumlah"
                              >
                                <FontAwesomeIcon icon={faMinus} className="text-[10px]" />
                              </button>
                              <input
                                type="number"
                                min="0"
                                max="9999"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleQuantityChange(item.product.id, e.target.value)
                                }
                                className="w-12 h-7 text-center font-mono font-bold text-xs bg-transparent border-0 focus:outline-none text-foreground"
                              />
                              <button
                                type="button"
                                onClick={() => handleQuantityStep(item.product.id, 1)}
                                className="w-7 h-7 flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
                                aria-label="Tambah jumlah"
                              >
                                <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                              </button>
                            </div>
                            <span className="text-[11px] text-foreground-muted font-mono">
                              unit
                            </span>
                          </div>

                          {/* Safe Commission Display Without Exposing Store Profit */}
                          <div className="text-left sm:text-right">
                            <div className="text-[11px] text-foreground-muted">
                              Estimasi Komisi: <strong className="text-primary font-mono">{formatRupiah(item.unitCommission)}</strong> /unit
                            </div>
                            <div className="text-xs font-bold text-primary font-mono mt-0.5">
                              Subtotal Komisi: {formatRupiah(item.subtotalCommission)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Real-time Results Panel (5 cols) */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-status-success/10 via-surface to-surface border border-status-success/30 shadow-md space-y-5">
                {/* Hero KPI: Total Estimated Monthly Earnings */}
                <div className="space-y-1.5 border-b border-border pb-4">
                  <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider block">
                    Total Estimasi Penghasilan Bulanan:
                  </span>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono text-status-success tracking-tight">
                    {formatRupiah(simulationResults.totalEarnings)}
                  </div>
                  <p className="text-[11px] text-foreground-muted leading-tight">
                    Potensi pendapatan Anda dari penjualan langsung dan bonus mitra referral aktif.
                  </p>
                </div>

                {/* Metrics Breakdown (Protected: No Total Profit Display) */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised border border-border">
                    <span className="text-foreground-muted">Total Unit Terjual:</span>
                    <span className="font-mono font-bold text-foreground">
                      {simulationResults.totalUnits} unit / bulan
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised border border-border">
                    <span className="text-foreground-muted">
                      Komisi Penjualan Pribadi ({personalRate}%):
                    </span>
                    <span className="font-mono font-bold text-primary">
                      {formatRupiah(simulationResults.personalCommission)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised border border-border">
                    <span className="text-foreground-muted">
                      Bonus Referral ({referralCount * 2}%):
                    </span>
                    <span className="font-mono font-bold text-status-success">
                      {formatRupiah(simulationResults.referralBonus)}
                    </span>
                  </div>
                </div>

                {/* Commission Scheme Breakdown Pill */}
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-primary">
                    <span>Total Komisi Efektif:</span>
                    <span className="font-mono text-sm">{simulationResults.effectiveCommissionRate}%</span>
                  </div>
                  <p className="text-[11px] text-foreground-muted leading-relaxed">
                    Skema: <strong className="text-foreground">{personalRate}%</strong> Komisi Pribadi
                    {referralCount > 0 ? (
                      <>
                        {' '}+ <strong className="text-status-success">{referralCount * 2}%</strong> Bonus Referral ({referralCount} mitra)
                      </>
                    ) : (
                      ' (0 referral)'
                    )}
                    .
                  </p>
                </div>

                {/* Educational Note & Non-Guarantee Disclaimer */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-foreground-muted space-y-1 leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold text-amber-600 text-xs">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-xs" />
                    <span>Ketentuan Komisi Asterra Store:</span>
                  </div>
                  <p>
                    • Komisi dihitung berdasarkan performa penjualan produk yang berhasil diselesaikan dan lolos masa garansi.
                  </p>
                  <p>
                    • Bonus referral 2% diproyeksikan atas asumsi mitra binaan aktif menghasilkan volume transaksi setara.
                  </p>
                  <p className="text-[10px] text-foreground-muted/80 pt-1 border-t border-amber-500/15 italic">
                    * Estimasi di atas merupakan simulasi ilustratif untuk perencanaan sales. Bukan saldo riil atau pendapatan tetap yang dijamin.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: SIMULASI HARGA JUAL RESELLER (MARKUP PELANGGAN & KOMISI)          */}
      {/* ========================================================================= */}
      {activeMode === 'reseller' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Quick Scenario Preset Chips */}
          <div className="p-3.5 rounded-xl bg-surface-raised border border-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <FontAwesomeIcon icon={faTags} className="text-xs text-primary" />
                <span>Pilih Skenario / Produk Simulasi:</span>
              </span>
              <span className="text-[11px] text-foreground-muted">
                Klik untuk memuat data pengujian
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Button
                type="button"
                size="sm"
                variant={isTestScenarioA ? 'default' : 'outline'}
                onClick={handleLoadScenarioA}
                className={`text-xs h-8 px-3 rounded-lg font-bold shrink-0 cursor-pointer ${
                  isTestScenarioA ? 'bg-primary text-white shadow-2xs' : 'border-border'
                }`}
              >
                <FontAwesomeIcon icon={faCheck} className="text-xs mr-1" />
                <span>Uji Skenario A (Rp 20.000 / Rp 23.000 / 10 Unit)</span>
              </Button>

              {AUTHENTIC_CATALOG_PRODUCTS.slice(0, 4).map((prod) => {
                const isSelected = !isTestScenarioA && selectedResellerProductId === prod.id;
                return (
                  <Button
                    key={prod.id}
                    type="button"
                    size="sm"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => handleSelectResellerProduct(prod.id)}
                    className={`text-xs h-8 px-3 rounded-lg font-semibold shrink-0 cursor-pointer ${
                      isSelected ? 'bg-primary text-white shadow-2xs' : 'border-border'
                    }`}
                  >
                    <span>{prod.brand || prod.name.split(' ')[0]} ({formatRupiah(prod.price)})</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Loss Warning Banner (Scenario C Verification) */}
          {resellerResults.hasLoss && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 flex items-start gap-3 animate-in fade-in">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                <FontAwesomeIcon icon={faTriangleExclamation} className="text-sm" />
              </div>
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-rose-800 text-sm">
                  Peringatan Potensi Kerugian
                </h4>
                <p className="leading-relaxed text-rose-700">
                  Harga jual kepada pelanggan lebih rendah daripada harga produk AsterraStore. Selisih harga per unit bernilai negatif (
                  <strong className="font-mono font-bold">{formatRupiah(resellerResults.unitMarkup)}</strong>
                  ). Menjual di bawah harga toko berpotensi menimbulkan kerugian sebesar{' '}
                  <strong className="font-mono font-bold">{formatRupiah(resellerResults.totalMarkup)}</strong> pada transaksi ini.
                </p>
              </div>
            </div>
          )}

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Left Column: Interactive Inputs (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-5">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                  <FontAwesomeIcon icon={faStore} className="text-xs text-primary" />
                  <span>Parameter Simulasi Penjualan Reseller</span>
                </h3>

                {/* 1. Product Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      Pilihan Produk AsterraStore:
                    </label>
                    <span className="text-[11px] text-foreground-muted">
                      Sumber: Katalog Produk Aktual
                    </span>
                  </div>

                  {isTestScenarioA ? (
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-primary">
                          Produk Uji Skenario A (Simulasi Pengujian)
                        </div>
                        <div className="text-[11px] text-foreground-muted">
                          Harga Produk AsterraStore: <strong className="font-mono text-foreground font-bold">Rp 20.000</strong>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelectResellerProduct(AUTHENTIC_CATALOG_PRODUCTS[0].id)}
                        className="text-xs h-7 px-2.5 border-border"
                      >
                        Pilih Produk Katalog
                      </Button>
                    </div>
                  ) : (
                    <select
                      value={selectedResellerProductId}
                      onChange={(e) => handleSelectResellerProduct(e.target.value)}
                      className="w-full h-10 rounded-xl bg-surface-raised border border-border text-xs px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium cursor-pointer"
                    >
                      {AUTHENTIC_CATALOG_PRODUCTS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {formatRupiah(p.price)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 2. Read-Only AsterraStore Price */}
                <div className="p-3 rounded-xl bg-surface-raised border border-border flex items-center justify-between text-xs">
                  <div>
                    <span className="text-foreground-muted block text-[11px]">
                      Harga produk di AsterraStore:
                    </span>
                    <span className="text-[10px] text-foreground-muted/80">
                      Harga resmi yang tersedia untuk publik
                    </span>
                  </div>
                  <div className="text-base font-bold font-mono text-foreground">
                    {formatRupiah(resellerResults.asterraPrice)}
                  </div>
                </div>

                {/* 3. Reseller Selling Price Input (Interactive) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      Harga Jual yang Ditetapkan kepada Pelanggan:
                    </label>
                    <span
                      className={`text-xs font-mono font-bold ${
                        resellerResults.unitMarkup > 0
                          ? 'text-status-success'
                          : resellerResults.unitMarkup < 0
                          ? 'text-status-error'
                          : 'text-foreground-muted'
                      }`}
                    >
                      Selisih: {formatRupiah(resellerResults.unitMarkup)} /unit
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground-muted font-mono">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={resellerSellingPriceInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, '');
                        setResellerSellingPriceInput(val);
                      }}
                      placeholder="Masukkan harga jual reseller..."
                      className={`w-full h-11 pl-10 pr-4 rounded-xl bg-surface border text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-2 ${
                        resellerResults.hasLoss
                          ? 'border-status-error focus:ring-status-error/30'
                          : 'border-border focus:ring-primary/30'
                      }`}
                    />
                  </div>

                  {/* Quick Markup Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-foreground-muted font-medium mr-1">
                      Markup cepat:
                    </span>
                    <button
                      type="button"
                      onClick={() => applyMarkupOffset(3000)}
                      className="px-2 py-1 rounded-md text-[10px] font-bold bg-surface-raised hover:bg-surface border border-border text-foreground transition-colors cursor-pointer"
                    >
                      +Rp 3.000
                    </button>
                    <button
                      type="button"
                      onClick={() => applyMarkupOffset(5000)}
                      className="px-2 py-1 rounded-md text-[10px] font-bold bg-surface-raised hover:bg-surface border border-border text-foreground transition-colors cursor-pointer"
                    >
                      +Rp 5.000
                    </button>
                    <button
                      type="button"
                      onClick={() => applyMarkupOffset(10000)}
                      className="px-2 py-1 rounded-md text-[10px] font-bold bg-surface-raised hover:bg-surface border border-border text-foreground transition-colors cursor-pointer"
                    >
                      +Rp 10.000
                    </button>
                    <button
                      type="button"
                      onClick={() => applyMarkupOffset(0)}
                      className="px-2 py-1 rounded-md text-[10px] font-medium bg-surface-raised hover:bg-surface border border-border text-foreground-muted transition-colors cursor-pointer"
                      title="Uji skenario harga sama (Scenario B)"
                    >
                      Sama (+Rp 0)
                    </button>
                    <button
                      type="button"
                      onClick={applyLossScenario}
                      className="px-2 py-1 rounded-md text-[10px] font-medium bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 transition-colors cursor-pointer"
                      title="Uji skenario kerugian (Scenario C)"
                    >
                      Uji Rugi (-Rp 2.000)
                    </button>
                  </div>
                </div>

                {/* 4. Quantity Stepper */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      Jumlah Unit yang Ingin Dijual:
                    </label>
                    <span className="text-[11px] text-foreground-muted font-mono">
                      {resellerResults.units} unit
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setResellerQuantityInput(String(Math.max(0, numericQuantity - 1)))
                      }
                      disabled={numericQuantity <= 0}
                      className="w-10 h-10 p-0 rounded-xl shrink-0 border-border cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faMinus} className="text-xs" />
                    </Button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={resellerQuantityInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, '');
                        setResellerQuantityInput(val);
                      }}
                      className="h-10 w-full rounded-xl bg-surface border border-border text-center text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setResellerQuantityInput(String(numericQuantity + 1))
                      }
                      className="w-10 h-10 p-0 rounded-xl shrink-0 border-border cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faPlus} className="text-xs" />
                    </Button>
                  </div>

                  {/* Quantity presets */}
                  <div className="flex items-center gap-2 pt-1">
                    {[0, 1, 5, 10, 25, 50].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setResellerQuantityInput(String(q))}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                          numericQuantity === q
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface-raised hover:bg-surface border-border text-foreground-muted'
                        }`}
                      >
                        {q} unit
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Commission Eligibility & Referral Options */}
                <div className="pt-3 border-t border-border space-y-3">
                  <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-surface-raised border border-border">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="commission-toggle"
                          className="text-xs font-bold text-foreground cursor-pointer"
                        >
                          Sertakan Estimasi Komisi Transaksi (Transaksi Memenuhi Syarat)
                        </label>
                      </div>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        Hanya aktif jika transaksi dilakukan melalui link/kode referral resmi mitra yang memenuhi syarat program affiliate.
                      </p>
                    </div>
                    <input
                      id="commission-toggle"
                      type="checkbox"
                      checked={isCommissionEligible}
                      onChange={(e) => setIsCommissionEligible(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer shrink-0"
                    />
                  </div>

                  {/* Referral Bonus (Conditional) */}
                  {isCommissionEligible && (
                    <div className="p-3 rounded-xl bg-surface-raised border border-border flex items-center justify-between gap-4 text-xs">
                      <div>
                        <span className="font-bold text-foreground block">
                          Mitra Referral Aktif:
                        </span>
                        <span className="text-[10px] text-foreground-muted">
                          Bonus 2% jika mitra rekrutan langsung melakukan transaksi serupa
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setResellerReferralCount(Math.max(0, resellerReferralCount - 1))}
                          disabled={resellerReferralCount <= 0}
                          className="w-7 h-7 p-0 rounded-lg border-border"
                        >
                          <FontAwesomeIcon icon={faMinus} className="text-[10px]" />
                        </Button>
                        <span className="font-mono font-bold w-6 text-center">
                          {resellerReferralCount}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setResellerReferralCount(resellerReferralCount + 1)}
                          className="w-7 h-7 p-0 rounded-lg border-border"
                        >
                          <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Reseller Results Summary Panel (5 cols) */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
              <div
                className={`p-5 sm:p-6 rounded-2xl bg-gradient-to-br via-surface to-surface border shadow-md space-y-5 ${
                  resellerResults.hasLoss
                    ? 'from-status-error/10 border-status-error/40'
                    : 'from-status-success/10 border-status-success/30'
                }`}
              >
                {/* Hero KPI: Total Potential Earnings */}
                <div className="space-y-1.5 border-b border-border pb-4">
                  <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider block">
                    Total Potensi Pendapatan:
                  </span>
                  <div
                    className={`text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight ${
                      resellerResults.totalPotentialEarnings < 0
                        ? 'text-status-error'
                        : resellerResults.totalPotentialEarnings === 0
                        ? 'text-foreground'
                        : 'text-status-success'
                    }`}
                  >
                    {formatRupiah(resellerResults.totalPotentialEarnings)}
                  </div>
                  <p className="text-[11px] text-foreground-muted leading-tight">
                    {resellerResults.hasLoss
                      ? 'Potensi defisit transaksi akibat harga jual di bawah harga produk toko.'
                      : 'Akumulasi estimasi markup penjualan dan estimasi komisi yang memenuhi syarat.'}
                  </p>
                </div>

                {/* Structured Breakdown Table (Strict Terminology Enforced) */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised border border-border">
                    <span className="text-foreground-muted">Harga produk AsterraStore:</span>
                    <span className="font-mono font-bold text-foreground">
                      {formatRupiah(resellerResults.asterraPrice)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised border border-border">
                    <span className="text-foreground-muted">Harga jual kepada pelanggan:</span>
                    <span className="font-mono font-bold text-foreground">
                      {formatRupiah(resellerResults.sellingPrice)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised border border-border">
                    <span className="text-foreground-muted">Selisih harga per unit:</span>
                    <span
                      className={`font-mono font-bold ${
                        resellerResults.unitMarkup < 0
                          ? 'text-status-error'
                          : resellerResults.unitMarkup > 0
                          ? 'text-status-success'
                          : 'text-foreground'
                      }`}
                    >
                      {formatRupiah(resellerResults.unitMarkup)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised border border-border">
                    <span className="text-foreground-muted">Jumlah unit yang disimulasikan:</span>
                    <span className="font-mono font-bold text-foreground">
                      {resellerResults.units} unit
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised border border-border">
                    <span className="text-foreground-muted">Estimasi total markup:</span>
                    <span
                      className={`font-mono font-bold ${
                        resellerResults.totalMarkup < 0
                          ? 'text-status-error'
                          : resellerResults.totalMarkup > 0
                          ? 'text-status-success'
                          : 'text-foreground'
                      }`}
                    >
                      {formatRupiah(resellerResults.totalMarkup)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised border border-border">
                    <div className="space-y-0.5">
                      <span className="text-foreground-muted block">Estimasi komisi:</span>
                      <span className="text-[10px] text-foreground-muted/70 block">
                        {isCommissionEligible ? '(Transaksi memenuhi syarat)' : '(Tidak memenuhi syarat)'}
                      </span>
                    </div>
                    <span
                      className={`font-mono font-bold ${
                        isCommissionEligible && resellerResults.totalCommission > 0
                          ? 'text-primary'
                          : 'text-foreground-muted'
                      }`}
                    >
                      {formatRupiah(resellerResults.totalCommission)}
                    </span>
                  </div>

                  {resellerReferralCount > 0 && isCommissionEligible && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised border border-border">
                      <span className="text-foreground-muted">Bonus referral ({resellerReferralCount} mitra):</span>
                      <span className="font-mono font-bold text-status-success">
                        {formatRupiah(resellerResults.referralBonus)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Clear Business Assumption Callout */}
                <div className="p-3.5 rounded-xl bg-surface-raised/80 border border-border text-[11px] text-foreground-muted space-y-1.5 leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold text-foreground text-xs">
                    <FontAwesomeIcon icon={faCircleInfo} className="text-xs text-primary" />
                    <span>Ketentuan & Asumsi Simulasi:</span>
                  </div>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>
                      Transaksi mandiri atau pembelian langsung oleh reseller tanpa referral resmi tidak berhak atas komisi affiliate tambahan.
                    </li>
                    <li>
                      Estimasi komisi transaksi hanya berlaku jika transaksi pelanggan dilakukan melalui link/kode referral resmi mitra.
                    </li>
                    <li>
                      Total potensi pendapatan belum memperhitungkan biaya operasional reseller (seperti biaya transfer perbankan, biaya promosi/iklan, atau diskon khusus dari reseller ke pelanggan).
                    </li>
                  </ul>
                  <p className="text-[10px] text-foreground-muted/70 pt-1.5 border-t border-border/60 italic">
                    * Angka simulasi merupakan estimasi proyeksi untuk perencanaan bisnis, bukan jaminan pendapatan pasti.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
