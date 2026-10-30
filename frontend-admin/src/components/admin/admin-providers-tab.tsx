'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Server,
  RefreshCw,
  Key,
  Activity,
  CheckCircle2,
  X,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfigApi, ResellerConfigItem } from '@/lib/api-client';

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
  const queryClient = useQueryClient();

  // Load real reseller configurations from backend
  const { data: configsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-reseller-configs'],
    queryFn: () => ConfigApi.getResellerConfigs(),
  });

  const providers: ResellerConfigItem[] = configsData?.data || [];

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, {
    connected: boolean;
    latency_ms?: number;
    balance?: number;
    username?: string;
    message?: string;
  }>>({});

  const [selectedProvider, setSelectedProvider] = useState<ResellerConfigItem | null>(null);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);

  // Form states for selected provider
  const [formBaseUrl, setFormBaseUrl] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formApiSign, setFormApiSign] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSign, setShowApiSign] = useState(false);

  const updateConfigMutation = useMutation({
    mutationFn: ({ providerId, payload }: { providerId: string; payload: any }) =>
      ConfigApi.updateResellerConfig(providerId, payload),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reseller-configs'] });
      onNotify?.(res.message || `Konfigurasi ${vars.providerId} berhasil disimpan.`);
      setIsCredentialModalOpen(false);
      setSelectedProvider(null);
    },
    onError: (err: Error) => {
      onNotify?.(`Gagal menyimpan kredensial: ${err.message}`);
    },
  });

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const res = await ConfigApi.testResellerConnection(id);
      setTestResults((prev) => ({ ...prev, [id]: res.data }));
      if (res.data.connected) {
        onNotify?.(
          `Koneksi ${id} aktif! Latensi: ${res.data.latency_ms ?? 0}ms. Saldo: Rp ${(res.data.balance ?? 0).toLocaleString('id-ID')}`
        );
      } else {
        onNotify?.(`Koneksi ${id} gagal: ${res.data.message || 'Periksa API Key dan Sign.'}`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      onNotify?.(`Uji koneksi gagal: ${errorMsg}`);
    } finally {
      setTestingId(null);
    }
  };

  const openEditModal = (provider: ResellerConfigItem) => {
    setSelectedProvider(provider);
    setFormBaseUrl(provider.baseUrl || provider.base_url || 'https://vip-reseller.co.id/api');
    setFormApiKey(provider.maskedApiKey || provider.masked_api_key || '');
    setFormApiSign(provider.maskedApiSign || provider.masked_api_sign || '');
    setFormIsActive(provider.isActive ?? provider.is_active ?? true);
    setShowApiKey(false);
    setShowApiSign(false);
    setIsCredentialModalOpen(true);
  };

  const handleSaveCredentials = () => {
    if (!selectedProvider) return;

    const payload: any = {
      baseUrl: formBaseUrl.trim(),
      isActive: formIsActive,
    };

    // Only send key/sign if user actually edited them (not masked)
    if (formApiKey && !formApiKey.includes('****')) {
      payload.apiKey = formApiKey.trim();
    }
    if (formApiSign && !formApiSign.includes('****')) {
      payload.apiSign = formApiSign.trim();
    }

    updateConfigMutation.mutate({
      providerId: selectedProvider.id,
      payload,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
              API Reseller / Supplier
            </span>
            <span className="text-[11px] text-foreground-muted">Integrasi Gateway Upstream</span>
          </div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Konfigurasi API Reseller & Gateway</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Kelola endpoint upstream, kredensial autentikasi server-side, uji konektivitas live, dan pemantauan saldo deposit pesanan otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="text-xs gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </Button>
          {onSyncVip && (
            <Button
              size="sm"
              onClick={onSyncVip}
              className="text-xs gap-1.5 h-9 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sinkronkan Katalog VIP</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Security Notice */}
      <div className="p-4 rounded-xl bg-surface-raised border border-border text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block text-xs font-semibold text-foreground">
            Keamanan Kredensial Server-Side (Zero Secret Leakage)
          </strong>
          <p className="text-[11px] text-foreground-muted leading-relaxed">
            Semua API Key dan Signature disimpan aman di database backend dan di-masking saat ditampilkan ke browser. Sistem menerapkan validasi SSRF untuk mencegah pengalihan request ke jaringan privat/lokal.
          </p>
        </div>
      </div>

      {/* 3. Provider Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((provider) => {
          const testResult = testResults[provider.id];
          const isConnected = testResult
            ? testResult.connected
            : (provider.isConnected ?? provider.is_connected ?? false);
          const liveBalance = testResult?.balance ?? provider.balance ?? metrics?.vipBalance ?? null;
          const liveUsername = testResult?.username ?? provider.username ?? metrics?.vipUsername ?? null;
          const isSupported = provider.isSupported ?? provider.is_supported ?? true;
          const isReady = provider.readiness === 'ready' || (provider.isProductionReady ?? provider.is_production_ready);

          return (
            <div
              key={provider.id}
              className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-foreground-muted/40 transition-colors"
            >
              {/* Card Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground leading-snug">{provider.name}</h3>
                      <span className="text-[10px] font-mono text-foreground-muted block mt-0.5">
                        ID: {provider.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      className={
                        isConnected
                          ? 'bg-status-success/15 text-status-success border-status-success/30 font-mono text-[10px]'
                          : 'bg-status-warning/15 text-status-warning border-status-warning/30 font-mono text-[10px]'
                      }
                    >
                      {isConnected ? 'ONLINE / CONNECTED' : 'STANDBY'}
                    </Badge>
                    <span className="text-[10px] text-foreground-muted font-mono">
                      {isReady ? 'Siap Produksi' : 'Belum Didukung'}
                    </span>
                  </div>
                </div>

                {/* Status & Capabilities Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-surface-raised border border-border">
                    <span className="text-[10px] text-foreground-muted block uppercase font-bold tracking-wider">
                      Saldo Upstream:
                    </span>
                    <span className="font-mono font-bold text-xs sm:text-sm text-primary block mt-0.5">
                      {liveBalance !== null ? `Rp ${liveBalance.toLocaleString('id-ID')}` : 'Tidak Didukung'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-raised border border-border">
                    <span className="text-[10px] text-foreground-muted block uppercase font-bold tracking-wider">
                      Akun Gateway:
                    </span>
                    <span className="font-mono font-semibold text-xs text-foreground block mt-0.5 truncate">
                      {liveUsername || 'Terhubung via API'}
                    </span>
                  </div>
                </div>

                {/* Endpoint & Key Info */}
                <div className="p-3 bg-surface-raised rounded-xl border border-border space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-foreground-muted">
                    <span>Base Endpoint:</span>
                    <span className="font-mono text-foreground truncate max-w-[200px]">
                      {provider.baseUrl || provider.base_url || 'https://vip-reseller.co.id/api'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-foreground-muted">
                    <span>Kredensial API:</span>
                    <span className="font-mono text-foreground">
                      {provider.maskedApiKey || provider.masked_api_key || (provider.hasApiKey ? 'Tersimpan (Masked)' : 'Belum Diatur')}
                    </span>
                  </div>
                  {provider.capabilities && (
                    <div className="pt-2 border-t border-border flex flex-wrap gap-1">
                      {provider.capabilities.supports_balance && (
                        <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-[9px] font-mono text-foreground-muted">
                          Saldo Check
                        </span>
                      )}
                      {provider.capabilities.supports_status_check && (
                        <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-[9px] font-mono text-foreground-muted">
                          Live Status Check
                        </span>
                      )}
                      {provider.capabilities.supports_webhook && (
                        <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-[9px] font-mono text-foreground-muted">
                          Webhook Receiver
                        </span>
                      )}
                      {provider.capabilities.supports_stock_sync && (
                        <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-[9px] font-mono text-foreground-muted">
                          Stock Sync
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(provider)}
                  className="text-xs h-8.5 gap-1.5 font-medium cursor-pointer"
                >
                  <Key className="w-3 h-3" />
                  <span>Atur Kredensial</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={testingId === provider.id || !isSupported}
                  onClick={() => handleTestConnection(provider.id)}
                  className="text-xs h-8.5 gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Activity className={`w-3.5 h-3.5 ${testingId === provider.id ? 'animate-spin' : ''}`} />
                  <span>{testingId === provider.id ? 'Menguji...' : 'Uji Koneksi'}</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Credentials Edit Modal */}
      {isCredentialModalOpen && selectedProvider && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCredentialModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200 text-[#0F172A]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-primary">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">
                    Atur Kredensial API {selectedProvider.name}
                  </h4>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    Provider ID: {selectedProvider.id}
                  </span>
                </div>
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

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">
                  Base URL API Gateway (Wajib HTTPS):
                </label>
                <Input
                  type="text"
                  value={formBaseUrl}
                  onChange={(e) => setFormBaseUrl(e.target.value)}
                  placeholder="https://vip-reseller.co.id/api"
                  className="font-mono text-xs bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:bg-white"
                />
                <span className="text-[10px] text-[#64748B] mt-1 block">
                  Dilindungi proteksi SSRF. Alamat loopback (localhost) dan IP privat ditolak.
                </span>
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">
                  API Key / Key Parameter:
                </label>
                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={formApiKey}
                    onChange={(e) => setFormApiKey(e.target.value)}
                    placeholder="Masukkan API Key baru atau biarkan jika tidak berubah"
                    className="font-mono text-xs pr-9 bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-[10px] text-[#64748B] mt-1 block">
                  Biarkan nilai bertopeng jika tidak ingin mengubah API Key yang sudah tersimpan.
                </span>
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">
                  API Sign / Secret Token:
                </label>
                <div className="relative">
                  <Input
                    type={showApiSign ? 'text' : 'password'}
                    value={formApiSign}
                    onChange={(e) => setFormApiSign(e.target.value)}
                    placeholder="Masukkan Signature / Secret baru"
                    className="font-mono text-xs pr-9 bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiSign(!showApiSign)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                  >
                    {showApiSign ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#0F172A] block">Status Provider</span>
                  <span className="text-[11px] text-[#64748B]">
                    Aktifkan untuk pemrosesan order dan pemeriksaan status
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCredentialModalOpen(false)}
                className="text-xs border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={updateConfigMutation.isPending}
                onClick={handleSaveCredentials}
                className="text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs cursor-pointer"
              >
                {updateConfigMutation.isPending ? 'Menyimpan...' : 'Simpan Kredensial'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
