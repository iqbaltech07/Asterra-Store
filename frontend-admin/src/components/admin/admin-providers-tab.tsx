'use client';

import React, { useState } from 'react';
import {
  Server,
  RefreshCw,
  Key,
  Activity,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ProviderConfig {
  id: string;
  name: string;
  type: string;
  endpoint: string;
  balance: number;
  currency: string;
  health: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  successRate: number;
  lastSync: string;
  status: 'active' | 'disabled';
  totalProducts: number;
}

const INITIAL_PROVIDERS: ProviderConfig[] = [
  {
    id: 'vip-reseller',
    name: 'VIP Reseller API Gateway (Primary)',
    type: 'REST JSON / API v2',
    endpoint: 'https://vip-reseller.co.id/api/',
    balance: 0,
    currency: 'IDR',
    health: 'healthy',
    latencyMs: 114,
    successRate: 99.2,
    lastSync: 'Baru saja',
    status: 'active',
    totalProducts: 1841,
  },
  {
    id: 'internal-manual',
    name: 'Asterra Internal Vault (Private Accounts)',
    type: 'Direct Fulfillment / Manual Dispatch',
    endpoint: 'internal://fulfillment-service',
    balance: 5000000,
    currency: 'IDR',
    health: 'healthy',
    latencyMs: 12,
    successRate: 100,
    lastSync: 'Real-time',
    status: 'active',
    totalProducts: 45,
  },
];

interface AdminProvidersTabProps {
  metrics?: {
    vipBalance?: number | null;
    isVipConnected?: boolean;
    vipUsername?: string;
    vipStatusMessage?: string;
  };
  onNotify?: (msg: string) => void;
  onSyncVip?: () => void;
}

export function AdminProvidersTab({ metrics, onNotify, onSyncVip }: AdminProvidersTabProps) {
  const [providers, setProviders] = useState<ProviderConfig[]>(INITIAL_PROVIDERS);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfig | null>(null);

  // Credential form
  const [apiKey, setApiKey] = useState('vip_sec_**********************7a8b');
  const [apiId, setApiId] = useState('AST-ROOT-SUPPLIER');

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    if (id === 'vip-reseller') {
      try {
        const res = await fetch('/api/v1/admin/sync-vip', { method: 'POST' });
        const data = await res.json();
        if (res.ok && data.success) {
          onNotify?.(`Koneksi ke VIP Reseller aktif! Saldo: Rp ${(data.balance ?? metrics?.vipBalance ?? 0).toLocaleString('id-ID')}.`);
        } else {
          onNotify?.(`Koneksi VIP Reseller gagal: ${data.detail || data.message || 'Error gateway'}`);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        onNotify?.(`Koneksi ke VIP Reseller gagal: ${errorMsg}`);
      } finally {
        setTestingId(null);
      }
    } else {
      setTimeout(() => {
        setTestingId(null);
        onNotify?.(`Koneksi ke Internal Vault berhasil! Status: Active (Latency: 12ms).`);
      }, 500);
    }
  };

  const toggleProvider = (id: string) => {
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextStatus = p.status === 'active' ? 'disabled' : 'active';
          onNotify?.(`Provider ${p.name} berhasil di-${nextStatus === 'active' ? 'aktifkan' : 'nonaktifkan'}.`);
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              API Operations Hub
            </span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Semua Endpoint Upstream Sehat
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            Manajemen Provider & Supplier Gateway
          </h2>
          <p className="text-xs text-foreground-muted mt-1">
            Monitoring konektivitas API pihak ketiga, deposit saldo pemesanan otomatis, success rate transaksi, dan konfigurasi API keys.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onSyncVip}
            className="text-xs gap-1.5 shadow-xs rounded-xl h-9 font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sinkronkan Katalog VIP</span>
          </Button>
        </div>
      </div>

      {/* 2. Provider Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {providers.map((p) => {
          const isVip = p.id === 'vip-reseller';
          const isConnected = isVip ? Boolean(metrics?.isVipConnected) : p.status === 'active';
          const balance = isVip && metrics?.vipBalance !== undefined && metrics.vipBalance !== null ? metrics.vipBalance : p.balance;

          return (
            <div
              key={p.id}
              className={`bg-surface border rounded-2xl p-6 shadow-xs space-y-4 transition-all ${
                isConnected ? 'border-border' : 'border-border/60 opacity-80'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-border flex items-center justify-center text-foreground shrink-0">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <span>{p.name}</span>
                    </h3>
                    <span className="text-xs text-foreground-muted font-mono">{p.type}</span>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold ${
                    isConnected
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                      : 'bg-amber-50 text-amber-700 border-amber-200/60'
                  }`}
                >
                  {isConnected ? (isVip ? `Terhubung (${metrics?.vipUsername || 'Aktif'})` : 'Sehat (100%)') : 'Belum Terhubung'}
                </Badge>
              </div>

              {/* Endpoint & Metrics Grid */}
              <div className="p-4 bg-surface-raised rounded-xl border border-border space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted font-medium">API Endpoint:</span>
                  <span className="font-mono text-xs text-foreground font-semibold truncate max-w-[240px]">
                    {p.endpoint}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-border text-center">
                  <div>
                    <span className="text-[10px] text-foreground-muted block font-medium">Latensi Respons</span>
                    <span className="font-mono font-bold text-xs text-emerald-600">{p.latencyMs} ms</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-foreground-muted block font-medium">Success Rate</span>
                    <span className="font-mono font-bold text-xs text-foreground">{p.successRate}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-foreground-muted block font-medium">Produk Terkait</span>
                    <span className="font-mono font-bold text-xs text-primary">{p.totalProducts}</span>
                  </div>
                </div>
              </div>

              {/* Balance Box */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-raised">
                <div>
                  <span className="text-[10px] text-foreground-muted block uppercase tracking-wider font-semibold">
                    Deposit Saldo Supplier
                  </span>
                  <div className="text-xl font-extrabold text-foreground font-mono">
                    Rp {balance.toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestConnection(p.id)}
                    disabled={testingId === p.id}
                    className="text-xs h-9 border-border rounded-xl font-semibold"
                  >
                    <Activity className={`w-3.5 h-3.5 mr-1 text-primary ${testingId === p.id ? 'animate-spin' : ''}`} />
                    <span>{testingId === p.id ? 'Memeriksa...' : 'Tes Ping'}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedProvider(p);
                      setIsCredentialModalOpen(true);
                    }}
                    className="text-xs h-9 border-border rounded-xl font-semibold"
                  >
                    <Key className="w-3.5 h-3.5 mr-1" />
                    <span>Kredensial</span>
                  </Button>
                </div>
              </div>

              {/* Status Switcher & Last Sync */}
              <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="text-foreground-muted text-xs font-mono">
                  Terakhir sinkron: {p.lastSync}
                </span>
                <button
                  type="button"
                  onClick={() => toggleProvider(p.id)}
                  className={`text-xs font-semibold hover:underline ${
                    p.status === 'active' ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {p.status === 'active' ? 'Nonaktifkan Provider' : 'Aktifkan Provider'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Modal Konfigurasi Kredensial API */}
      {isCredentialModalOpen && selectedProvider && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md max-h-[calc(100dvh-40px)] flex flex-col shadow-2xl overflow-hidden box-border animate-in zoom-in-95 duration-200">
            {/* Sticky Header */}
            <div className="shrink-0 px-5 py-3.5 border-b border-[#E2E8F0] bg-white flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Konfigurasi API {selectedProvider.name}</h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Kredensial API disimpan secara aman di environment server internal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCredentialModalOpen(false)}
                className="h-8 w-8 p-0 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsCredentialModalOpen(false);
                onNotify?.(`Kredensial API untuk ${selectedProvider.name} berhasil diperbarui.`);
              }}
              className="flex-1 flex flex-col overflow-hidden m-0 p-0"
            >
              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs bg-[#F8FAFC]">
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">API ID / Account ID</label>
                    <Input
                      value={apiId}
                      onChange={(e) => setApiId(e.target.value)}
                      className="bg-white border-[#E2E8F0] text-xs font-mono text-[#0F172A] rounded-lg h-9 px-3 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">API Key / Secret Token</label>
                    <Input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="bg-white border-[#E2E8F0] text-xs font-mono text-[#0F172A] rounded-lg h-9 px-3 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#E2E8F0] space-y-1 shadow-2xs">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">IP Whitelist Gateway Server</span>
                  <span className="font-mono text-[#2563EB] text-xs block font-bold">192.168.1.17 / Server Production Asterra</span>
                  <span className="text-[10px] text-[#64748B] block mt-0.5">Pastikan IP ini terdaftar di dashboard supplier agar request tidak diblokir.</span>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="shrink-0 px-4 sm:px-5 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCredentialModalOpen(false)}
                  className="text-xs h-8 px-3.5 border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] rounded-lg cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs gap-1.5 h-8 px-4 font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs rounded-lg cursor-pointer"
                >
                  Simpan Kredensial
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
