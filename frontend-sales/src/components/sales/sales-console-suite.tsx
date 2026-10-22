'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAppBaseUrl } from '@/lib/utils/url';

import type {
  SalesConsoleProps,
  SalesProfileData,
  ProductItem,
  SalesOrder,
  NetworkMember,
  NetworkBonusLogItem,
  NetworkDataResponse,
  CampaignItem,
} from './types';
import { SalesOverviewTab } from './tabs/sales-overview-tab';
import { SalesCatalogTab } from './tabs/sales-catalog-tab';
import { SalesLinksTab } from './tabs/sales-links-tab';
import { SalesOrdersTab } from './tabs/sales-orders-tab';
import { SalesNetworkTab } from './tabs/sales-network-tab';
import { SalesWalletTab } from './tabs/sales-wallet-tab';
import { SalesAcademyTab } from './tabs/sales-academy-tab';

export type {
  NetworkMember,
  NetworkBonusLogItem,
  NetworkDataResponse,
};

export function SalesConsoleSuite({ activeTab, onTabChange, adminUser }: SalesConsoleProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // 1. Fetch Sales Profile & Live Metrics
  const { data: profileRes, isLoading: isProfileLoading, refetch: refetchProfile } = useQuery<{
    success: boolean;
    data: SalesProfileData;
  }>({
    queryKey: ['sales-me'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('asterra_admin_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/sales/me', { headers });
      if (!res.ok) throw new Error('Gagal memuat profil sales');
      return res.json();
    },
    staleTime: 30000,
  });

  const partner = profileRes?.data;
  const partnerCode = partner?.code || 'AST-SALES';
  const partnerRate = partner?.rate || 10;

  // 2. Fetch Products for Catalog Tab
  const { data: productsRes, isLoading: isProductsLoading } = useQuery<{
    success: boolean;
    data: ProductItem[];
  }>({
    queryKey: ['sales-products'],
    queryFn: async () => {
      const res = await fetch('/api/v1/products');
      if (!res.ok) throw new Error('Gagal memuat katalog');
      return res.json();
    },
    staleTime: 60000,
  });

  // 3. Fetch Sales Orders
  const { data: ordersRes, isLoading: isOrdersLoading, refetch: refetchOrders } = useQuery<{
    success: boolean;
    data: SalesOrder[];
  }>({
    queryKey: ['sales-orders'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('asterra_admin_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/sales/orders', { headers });
      if (!res.ok) throw new Error('Gagal memuat pesanan');
      return res.json();
    },
    staleTime: 30000,
  });

  // 4. Fetch Network & Downline Bonus Data
  const { data: networkRes, isLoading: isNetworkLoading, refetch: refetchNetwork } = useQuery<{
    success: boolean;
    data: NetworkDataResponse;
  }>({
    queryKey: ['sales-network'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('asterra_admin_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/sales/network', { headers });
      if (!res.ok) throw new Error('Gagal memuat data bonus tim');
      return res.json();
    },
    staleTime: 30000,
  });

  const networkData = networkRes?.data;

  // 5. Fetch Active Campaigns & Booster Rates for Sales Portal
  const { data: campaignsRes } = useQuery<{
    success: boolean;
    data: CampaignItem[];
  }>({
    queryKey: ['sales-campaigns'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('asterra_admin_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/sales/campaigns', { headers });
      if (!res.ok) throw new Error('Gagal memuat event campaign');
      return res.json();
    },
    staleTime: 30000,
  });

  // Helper copy link
  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(id);
      setTimeout(() => setCopiedLink(null), 2500);
    }
  };

  const inviteSalesUrl = `${getAppBaseUrl()}/daftar-sales?ref=${partnerCode}`;

  const inviteWaMessage = encodeURIComponent(
    `Halo! Mau dapat penghasilan tambahan tanpa modal? Yuk gabung jadi Mitra Sales resmi di Asterra Store!\n\n` +
      `✅ Komisi penjualan langsung 10% (naik 15% setelah 50 order) dari Profit Transaksi bersih\n` +
      `✅ Bonus rekrutmen mitra sales 2% dari Profit Transaksi (1-Level resmi)\n` +
      `✅ Produk digital terlaris (Canva Pro, ChatGPT, Gemini, Netflix, Spotify, dll)\n` +
      `✅ Disediakan link affiliate, banner & materi promosi siap pakai\n` +
      `✅ Pencairan komisi mudah & cepat langsung ke rekening bank Anda\n\n` +
      `Daftar gratis sekarang pakai link referral saya:\n${inviteSalesUrl}\n\n` +
      `Kode Referral: ${partnerCode}`
  );

  return (
    <div key={activeTab} className="space-y-6 animate-tab-glide">
      {/* 1. SALES OVERVIEW TAB */}
      {activeTab === 'sales-overview' && (
        <SalesOverviewTab
          partner={partner}
          partnerCode={partnerCode}
          partnerRate={partnerRate}
          userName={adminUser?.name}
          copiedLink={copiedLink}
          handleCopy={handleCopy}
          onTabChange={onTabChange}
          networkData={networkData}
          isProfileLoading={isProfileLoading}
          inviteSalesUrl={inviteSalesUrl}
          campaigns={campaignsRes?.data}
        />
      )}

      {/* 2. SALES CATALOG TAB */}
      {activeTab === 'sales-catalog' && (
        <SalesCatalogTab
          partnerCode={partnerCode}
          partnerRate={partnerRate}
          products={productsRes?.data || []}
          isLoading={isProductsLoading}
          onTabChange={onTabChange}
        />
      )}

      {/* 3. SALES LINKS & PROMO COPY GENERATOR TAB */}
      {activeTab === 'sales-links' && (
        <SalesLinksTab
          products={productsRes?.data || []}
          campaigns={campaignsRes?.data || []}
          partnerCode={partnerCode}
          partnerRate={partnerRate}
          copiedLink={copiedLink}
          handleCopy={handleCopy}
        />
      )}

      {/* 4. SALES ORDERS TAB */}
      {activeTab === 'sales-orders' && (
        <SalesOrdersTab
          partnerCode={partnerCode}
          partnerRate={partnerRate}
          orders={ordersRes?.data || []}
          isLoading={isOrdersLoading}
          onRefresh={() => refetchOrders()}
          onTabChange={onTabChange}
        />
      )}

      {/* 5. SALES NETWORK & DOWNLINE TEAM TAB */}
      {activeTab === 'sales-network' && (
        <SalesNetworkTab
          partnerCode={partnerCode}
          inviteSalesUrl={inviteSalesUrl}
          inviteWaMessage={inviteWaMessage}
          networkData={networkData}
          isLoading={isNetworkLoading}
          onRefresh={() => refetchNetwork()}
          handleCopy={handleCopy}
          copiedLink={copiedLink}
        />
      )}

      {/* 6. SALES WALLET & WITHDRAWAL TAB */}
      {activeTab === 'sales-wallet' && (
        <SalesWalletTab
          partner={partner}
          onRefetchProfile={() => refetchProfile()}
        />
      )}

      {/* 7. SALES ACADEMY & GUIDELINES TAB */}
      {activeTab === 'sales-academy' && <SalesAcademyTab />}
    </div>
  );
}
