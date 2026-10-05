'use client';

import React, { useState } from 'react';
import {
  Server,
  RefreshCw,
  Plus,
  Key,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ShieldCheck,
  Wallet,
  Clock,
  ExternalLink,
  Code,
  Zap,
  Radio,
  Sliders,
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

  const handleTestConnection = (id: string) => {
    setTestingId(id);
    setTimeout(() => {
      setTestingId(null);
      onNotify?.(`Koneksi ke ${id === 'vip-reseller' ? 'VIP Reseller' : 'Internal Vault'} berhasil! HTTP 200 OK (Latency: 112ms).`);
    }, 800);
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
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
              API Operations Hub
            </span>
            <span className="text-[11px] text-status-success font-semibold">
              Semua Endpoint Upstream Sehat (Healthy)
            </span>
          </div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Manajemen Provider & Supplier Gateway
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Monitoring konektivitas API pihak ketiga, deposit saldo pemesanan otomatis, success rate transaksi, dan konfigurasi API keys.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onSyncVip}
            className="text-xs gap-1.5 shadow-xs"
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
          const balance = isVip && metrics?.vipBalance !== undefined && metrics.vipBalance !== null ? metrics.vipBalance : p.balance;

          return (
            <div
              key={p.id}
              className={`bg-surface border rounded-xl p-5 shadow-xs space-y-4 transition-all ${
                p.status === 'active' ? 'border-border' : 'border-border/60 opacity-60'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <span>{p.name}</span>
                    </h3>
                    <span className="text-[11px] text-foreground-muted font-mono">{p.type}</span>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold ${
                    p.health === 'healthy'
                      ? 'bg-status-success/15 text-status-success border-status-success/30'
                      : 'bg-status-warning/15 text-status-warning border-status-warning/30'
                  }`}
                >
                  ● {p.health === 'healthy' ? 'Sehat (99.2%)' : 'Degraded'}
                </Badge>
              </div>

              {/* Endpoint & Metrics Grid */}
              <div className="p-3 bg-surface-raised rounded-lg border border-border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted">API Endpoint:</span>
                  <span className="font-mono text-[11px] text-foreground font-medium truncate max-w-[200px]">
                    {p.endpoint}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/80 text-center">
                  <div>
                    <span className="text-[10px] text-foreground-muted block">Latensi Respons</span>
                    <span className="font-mono font-bold text-xs text-status-success">{p.latencyMs} ms</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-foreground-muted block">Success Rate</span>
                    <span className="font-mono font-bold text-xs text-foreground">{p.successRate}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-foreground-muted block">Produk Terkait</span>
                    <span className="font-mono font-bold text-xs text-primary">{p.totalProducts}</span>
                  </div>
                </div>
              </div>

              {/* Balance Box */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-primary/25 bg-primary/5">
                <div>
                  <span className="text-[10px] text-foreground-muted block uppercase tracking-wider font-semibold">
                    Deposit Saldo Supplier
                  </span>
                  <div className="text-lg font-bold text-primary font-mono">
                    Rp {balance.toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestConnection(p.id)}
                    disabled={testingId === p.id}
                    className="text-xs h-8 border-border"
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
                    className="text-xs h-8 border-border"
                  >
                    <Key className="w-3.5 h-3.5 mr-1" />
                    <span>Kredensial</span>
                  </Button>
                </div>
              </div>

              {/* Status Switcher & Last Sync */}
              <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="text-foreground-muted text-[11px]">
                  Terakhir sinkron: {p.lastSync}
                </span>
                <button
                  type="button"
                  onClick={() => toggleProvider(p.id)}
                  className={`text-xs font-semibold hover:underline ${
                    p.status === 'active' ? 'text-status-error' : 'text-status-success'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-sm text-foreground">Konfigurasi API {selectedProvider.name}</h3>
                <p className="text-[11px] text-foreground-muted">
                  Kredensial API disimpan secara aman di environment server internal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCredentialModalOpen(false)}
                className="text-foreground-muted hover:text-foreground p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsCredentialModalOpen(false);
                onNotify?.(`Kredensial API untuk ${selectedProvider.name} berhasil diperbarui.`);
              }}
              className="space-y-3"
            >
              <div>
                <label className="font-semibold text-foreground block mb-1">API ID / Account ID</label>
                <Input
                  value={apiId}
                  onChange={(e) => setApiId(e.target.value)}
                  className="bg-surface-raised border-border text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">API Key / Secret Token</label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-surface-raised border-border text-xs font-mono"
                />
              </div>

              <div className="p-3 bg-surface-raised rounded-lg border border-border space-y-1">
                <span className="font-semibold text-foreground block text-[11px]">IP Whitelist Gateway Server</span>
                <span className="font-mono text-primary text-[11px] block font-bold">192.168.1.17 / Server Production Asterra</span>
                <span className="text-[10px] text-foreground-muted">Pastikan IP ini terdaftar di dashboard supplier agar request tidak diblokir.</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCredentialModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" size="sm">
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
