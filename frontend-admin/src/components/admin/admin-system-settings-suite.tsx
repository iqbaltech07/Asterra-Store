'use client';

import React, { useState } from 'react';
import {
  Bell,
  MessageSquare,
  Mail,
  Send,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Store,
  Globe,
  Settings,
  Phone,
  HelpCircle,
  FileText,
  Search,
  Sparkles,
  Save,
  RefreshCw,
  ExternalLink,
  Code,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface NotificationRule {
  id: string;
  event: string;
  description: string;
  channel: 'WhatsApp' | 'Email' | 'Telegram' | 'All';
  recipient: 'Pelanggan' | 'Admin Toko' | 'Keduanya';
  enabled: boolean;
  template: string;
}

const INITIAL_RULES: NotificationRule[] = [
  {
    id: 'rule-order-created',
    event: 'Pesanan Dibuat (Order Created)',
    description: 'Kirim instruksi pembayaran dan link rincian tagihan seketika saat checkout.',
    channel: 'WhatsApp',
    recipient: 'Pelanggan',
    enabled: true,
    template: 'Halo {{customer_name}}, tagihan pesanan {{order_id}} untuk {{product_name}} sebesar Rp {{total_price}} telah dibuat. Silakan selesaikan pembayaran sebelum batas waktu.',
  },
  {
    id: 'rule-payment-success',
    event: 'Pembayaran Berhasil (Payment Confirmed)',
    description: 'Konfirmasi pembayaran dari Tripay diterima dan pesanan masuk antrean pengiriman lisensi.',
    channel: 'WhatsApp',
    recipient: 'Keduanya',
    enabled: true,
    template: 'Terima kasih {{customer_name}}! Pembayaran {{order_id}} berhasil diverifikasi. Akun/lisensi Anda sedang disiapkan secara instan.',
  },
  {
    id: 'rule-fulfillment-sent',
    event: 'Akun / Lisensi Terkirim (Fulfillment Ready)',
    description: 'Kirim kredensial akun digital (email/password/link invite) ke WhatsApp pembeli.',
    channel: 'WhatsApp',
    recipient: 'Pelanggan',
    enabled: true,
    template: 'Pesanan {{order_id}} telah selesai! Berikut kredensial akun {{product_name}} Anda:\n\n{{account_credentials}}\n\nGaransi aktif selama durasi paket. Hubungi CS jika ada kendala.',
  },
  {
    id: 'rule-low-balance',
    event: 'Peringatan Saldo Supplier Menipis (Low Balance)',
    description: 'Notifikasi otomatis ke admin saat deposit VIP Reseller berada di bawah batas minimum Rp 500.000.',
    channel: 'WhatsApp',
    recipient: 'Admin Toko',
    enabled: true,
    template: '⚠️ PERINGATAN ASTERRA: Saldo deposit VIP Reseller tersisa Rp {{supplier_balance}}. Segera lakukan top-up agar pesanan instan tidak terhenti.',
  },
  {
    id: 'rule-refund-submitted',
    event: 'Klaim Garansi / Refund Diajukan',
    description: 'Notifikasi ke staf saat ada konsumen mengajukan tiket komplain akun bermasalah.',
    channel: 'WhatsApp',
    recipient: 'Admin Toko',
    enabled: true,
    template: 'Tiket komplain baru #{{ticket_id}} dari {{customer_name}} untuk pesanan {{order_id}}. Alasan: {{claim_reason}}. Segera tinjau di panel admin.',
  },
];

const INITIAL_LOGS = [
  { id: 'nl-1', time: '18:15', recipient: '081234567890 (Budi)', event: 'Akun Terkirim', channel: 'WhatsApp', status: 'Delivered', latency: '420ms' },
  { id: 'nl-2', time: '18:14', recipient: '081234567890 (Budi)', event: 'Pembayaran Berhasil', channel: 'WhatsApp', status: 'Delivered', latency: '380ms' },
  { id: 'nl-3', time: '17:55', recipient: '085712345678 (Dewi)', event: 'Pesanan Dibuat', channel: 'WhatsApp', status: 'Delivered', latency: '510ms' },
  { id: 'nl-4', time: '16:20', recipient: '082199887766 (Admin)', event: 'Saldo Supplier Warning', channel: 'WhatsApp', status: 'Delivered', latency: '390ms' },
];

interface AdminSystemSettingsSuiteProps {
  activeTab: 'notifications' | 'store-settings';
  onNotify?: (msg: string) => void;
}

export function AdminSystemSettingsSuite({ activeTab, onNotify }: AdminSystemSettingsSuiteProps) {
  // Notifications State
  const [rules, setRules] = useState<NotificationRule[]>(INITIAL_RULES);
  const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState('081234567890');
  const [isTestingWa, setIsTestingWa] = useState(false);
  const [waGatewayApiKey, setWaGatewayApiKey] = useState('fonnte_api_********************');
  const [waSenderNumber, setWaSenderNumber] = useState('6281298765432');

  // Store Settings Section State
  const [settingsSection, setSettingsSection] = useState<'general' | 'contact' | 'checkout' | 'warranty' | 'seo'>('general');

  // Store Settings Form States
  const [storeName, setStoreName] = useState('Asterra Store');
  const [storeTagline, setStoreTagline] = useState('Platform Akun Digital & Lisensi Premium Terpercaya');
  const [currency, setCurrency] = useState('IDR (Rp)');
  const [timezone, setTimezone] = useState('Asia/Jakarta (WIB)');
  const [csWhatsapp, setCsWhatsapp] = useState('081298765432');
  const [csEmail, setCsEmail] = useState('support@asterra.store');
  const [csHours, setCsHours] = useState('Senin – Minggu: 08:00 – 23:00 WIB');
  const [autoCancelHours, setAutoCancelHours] = useState(24);
  const [invoicePrefix, setInvoicePrefix] = useState('AST-');
  const [minCheckoutAmount, setMinCheckoutAmount] = useState(10000);
  const [warrantyDays, setWarrantyDays] = useState(30);
  const [defaultMetaTitle, setDefaultMetaTitle] = useState('Asterra Store — Beli Akun Digital & Lisensi Resmi');
  const [defaultMetaDesc, setDefaultMetaDesc] = useState(
    'Beli Canva Pro, Gemini AI, Netflix Premium, dan Spotify harga termurah dengan garansi ganti akun 100% dan proses aktivasi otomatis 1 menit.'
  );

  const handleToggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const next = !r.enabled;
          onNotify?.(`Notifikasi "${r.event}" ${next ? 'diaktifkan' : 'dinonaktifkan'}.`);
          return { ...r, enabled: next };
        }
        return r;
      })
    );
  };

  const handleTestWhatsAppDispatch = () => {
    setIsTestingWa(true);
    setTimeout(() => {
      setIsTestingWa(false);
      onNotify?.(`Pesan uji coba WhatsApp berhasil dikirim ke ${testPhoneNumber}! (Latency: 382ms, Status: 200 OK)`);
    }, 1000);
  };

  // =========================================================================
  // 1. NOTIFICATIONS TAB
  // =========================================================================
  if (activeTab === 'notifications') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
                Messaging Dispatcher
              </span>
              <span className="text-[11px] text-foreground-muted">WhatsApp & Gateway Notification Engine</span>
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Manajemen Notifikasi Toko & Admin</h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Atur trigger notifikasi otomatis pesanan baru, pembayaran berhasil, pengiriman akun instan, dan peringatan saldo supplier.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold text-status-success border-status-success/30 bg-status-success/10">
              WhatsApp Gateway: Online
            </Badge>
          </div>
        </div>

        {/* WhatsApp Gateway Credentials Box */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                <span>Koneksi WhatsApp Gateway (Fonnte / OpenWA Engine)</span>
              </h3>
              <p className="text-[11px] text-foreground-muted">
                Bot pengirim pesan otomatis ke pembeli dan staf operasional tanpa perlu scan ulang.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNotify?.('Konfigurasi API gateway WhatsApp telah disimpan.')}
              className="text-xs border-border h-8"
            >
              Simpan Token
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-foreground block mb-1">API Token / Secret Key</label>
              <Input
                type="password"
                value={waGatewayApiKey}
                onChange={(e) => setWaGatewayApiKey(e.target.value)}
                className="bg-surface-raised border-border text-xs font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground block mb-1">Nomor Pengirim Toko (Sender ID)</label>
              <Input
                value={waSenderNumber}
                onChange={(e) => setWaSenderNumber(e.target.value)}
                className="bg-surface-raised border-border text-xs font-mono"
              />
            </div>
          </div>

          {/* Test Dispatch Bar */}
          <div className="p-3 bg-surface-raised border border-border rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-foreground-muted">Uji Kirim WhatsApp:</span>
              <Input
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="0812xxxxxxxx"
                className="w-40 bg-surface border-border text-xs font-mono h-8"
              />
            </div>
            <Button
              size="sm"
              onClick={handleTestWhatsAppDispatch}
              disabled={isTestingWa}
              className="text-xs gap-1.5 h-8"
            >
              <Send className={`w-3.5 h-3.5 ${isTestingWa ? 'animate-spin' : ''}`} />
              <span>{isTestingWa ? 'Mengirim...' : 'Kirim Pesan Uji Coba'}</span>
            </Button>
          </div>
        </div>

        {/* Notification Rules Table */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border bg-surface-raised flex items-center justify-between">
            <h3 className="font-semibold text-xs text-foreground">Daftar Trigger Notifikasi Sistem ({rules.length})</h3>
            <span className="text-[11px] text-foreground-muted">Klik template untuk melihat atau mengubah salinan pesan</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-raised/50 border-b border-border text-foreground-muted text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Event Trigger</th>
                  <th className="py-3 px-4">Saluran</th>
                  <th className="py-3 px-4">Target Penerima</th>
                  <th className="py-3 px-4">Pratinjau Salinan Template</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-surface-raised/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      <div>{rule.event}</div>
                      <div className="text-[11px] text-foreground-muted font-normal">{rule.description}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      <Badge variant="outline" className="text-[10px] text-status-success border-status-success/30 font-mono">
                        {rule.channel}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-foreground">{rule.recipient}</td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="text-[11px] text-foreground-muted line-clamp-2 font-mono bg-surface-raised/80 p-1.5 rounded border border-border/60">
                        {rule.template}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRule(rule.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
                          rule.enabled
                            ? 'bg-status-success/15 text-status-success border-status-success/30'
                            : 'bg-surface-raised text-foreground-muted border-border'
                        }`}
                      >
                        {rule.enabled ? 'Aktif' : 'Mati'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedRule(rule)}
                        className="h-8 text-xs text-primary"
                      >
                        Edit Template
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dispatch History Audit Box */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="font-semibold text-xs text-foreground">Riwayat Pengiriman Pesan Terakhir</h3>
          <div className="space-y-2 text-xs">
            {INITIAL_LOGS.map((l) => (
              <div key={l.id} className="p-2.5 rounded-lg bg-surface-raised border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-foreground-muted text-[11px]">{l.time}</span>
                  <span className="font-medium text-foreground">{l.recipient}</span>
                  <span className="text-foreground-muted">•</span>
                  <span className="text-primary font-medium">{l.event}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-foreground-muted">{l.latency}</span>
                  <Badge variant="outline" className="text-[10px] text-status-success border-status-success/30 font-mono">
                    ✓ {l.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Template Editor Modal */}
        {selectedRule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in">
            <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-4">
              <div className="border-b border-border pb-3">
                <h3 className="font-bold text-base text-foreground">Kustomisasi Template Notifikasi</h3>
                <p className="text-xs text-foreground-muted">{selectedRule.event}</p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Isi Pesan WhatsApp / SMS</label>
                  <textarea
                    rows={5}
                    value={selectedRule.template}
                    onChange={(e) => setSelectedRule({ ...selectedRule, template: e.target.value })}
                    className="w-full rounded-md border border-border bg-surface-raised p-3 text-xs font-mono text-foreground"
                  />
                </div>

                <div className="p-3 rounded-lg bg-surface-raised border border-border space-y-1">
                  <span className="text-[10px] font-semibold text-foreground block uppercase tracking-wider">
                    Daftar Tag Dinamis yang Tersedia:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{'{{customer_name}}'}</span>
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{'{{order_id}}'}</span>
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{'{{product_name}}'}</span>
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{'{{total_price}}'}</span>
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{'{{account_credentials}}'}</span>
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{'{{expiry_time}}'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedRule(null)} className="text-xs">
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setRules((prev) => prev.map((r) => (r.id === selectedRule.id ? selectedRule : r)));
                    onNotify?.('Template notifikasi berhasil diperbarui.');
                    setSelectedRule(null);
                  }}
                  className="text-xs"
                >
                  Simpan Template
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. STORE SETTINGS TAB
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
              Master Preference
            </span>
            <span className="text-[11px] text-foreground-muted">Konfigurasi Operasional Toko</span>
          </div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Pengaturan Utama Asterra Store</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Identitas brand, layanan kontak konsumen, batas waktu checkout otomatis, garansi lisensi, dan metadata SEO.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => onNotify?.('Seluruh pengaturan toko berhasil disimpan dan diterapkan ke sistem.')}
          className="text-xs gap-1.5 shadow-xs"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Simpan Seluruh Pengaturan</span>
        </Button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-2 text-xs">
        {[
          { key: 'general', label: '1. Identitas Brand & Toko' },
          { key: 'contact', label: '2. Customer Service & CS WA' },
          { key: 'checkout', label: '3. Aturan Checkout & Invoice' },
          { key: 'warranty', label: '4. Kebijakan Garansi & Akun' },
          { key: 'seo', label: '5. SEO & Metadata Dasar' },
        ].map((sec) => (
          <button
            key={sec.key}
            type="button"
            onClick={() => setSettingsSection(sec.key as any)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              settingsSection === sec.key
                ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                : 'text-foreground-muted hover:text-foreground hover:bg-surface-raised'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-xs text-xs space-y-4">
        {/* SECTION 1: GENERAL IDENTITY */}
        {settingsSection === 'general' && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="font-bold text-sm text-foreground">Identitas Brand & Toko Digital</h3>
            <div>
              <label className="font-semibold text-foreground block mb-1">Nama Toko Publik</label>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="bg-surface-raised border-border text-xs font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Tagline / Slogan Brand</label>
              <Input
                value={storeTagline}
                onChange={(e) => setStoreTagline(e.target.value)}
                className="bg-surface-raised border-border text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-foreground block mb-1">Mata Uang Utama</label>
                <Input value={currency} disabled className="bg-surface-raised border-border text-xs text-foreground-muted" />
              </div>
              <div>
                <label className="font-semibold text-foreground block mb-1">Zona Waktu Sistem</label>
                <Input value={timezone} disabled className="bg-surface-raised border-border text-xs text-foreground-muted" />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: CONTACT & CS */}
        {settingsSection === 'contact' && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="font-bold text-sm text-foreground">Kontak Resmi & Dukungan Pelanggan</h3>
            <div>
              <label className="font-semibold text-foreground block mb-1">Nomor WhatsApp Customer Service</label>
              <Input
                value={csWhatsapp}
                onChange={(e) => setCsWhatsapp(e.target.value)}
                className="bg-surface-raised border-border text-xs font-mono font-semibold text-status-success"
              />
              <span className="text-[11px] text-foreground-muted mt-1 block">
                Nomor ini akan tertera pada tombol bantuan di halaman checkout dan faktur pembeli.
              </span>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Email Resmi Support</label>
              <Input
                value={csEmail}
                onChange={(e) => setCsEmail(e.target.value)}
                className="bg-surface-raised border-border text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Jam Operasional Layanan CS</label>
              <Input
                value={csHours}
                onChange={(e) => setCsHours(e.target.value)}
                className="bg-surface-raised border-border text-xs"
              />
            </div>
          </div>
        )}

        {/* SECTION 3: CHECKOUT RULES */}
        {settingsSection === 'checkout' && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="font-bold text-sm text-foreground">Aturan Checkout & Pembatalan Otomatis</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-foreground block mb-1">Batas Waktu Bayar (Jam)</label>
                <Input
                  type="number"
                  min="1"
                  max="72"
                  value={autoCancelHours}
                  onChange={(e) => setAutoCancelHours(Number(e.target.value))}
                  className="bg-surface-raised border-border text-xs font-mono font-bold"
                />
                <span className="text-[11px] text-foreground-muted mt-1 block">
                  Pesanan belum bayar akan otomatis kedaluwarsa setelah durasi ini.
                </span>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Prefix Nomor Faktur (Invoice)</label>
                <Input
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  className="bg-surface-raised border-border text-xs font-mono uppercase font-bold"
                />
                <span className="text-[11px] text-foreground-muted mt-1 block">Contoh: {invoicePrefix}882194</span>
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Minimal Nilai Transaksi Checkout (Rp)</label>
              <Input
                type="number"
                step="1000"
                value={minCheckoutAmount}
                onChange={(e) => setMinCheckoutAmount(Number(e.target.value))}
                className="bg-surface-raised border-border text-xs font-mono font-bold"
              />
            </div>
          </div>
        )}

        {/* SECTION 4: WARRANTY POLICY */}
        {settingsSection === 'warranty' && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="font-bold text-sm text-foreground">Ketentuan Garansi Akun & Penggantian</h3>
            <div>
              <label className="font-semibold text-foreground block mb-1">Durasi Garansi Default (Hari)</label>
              <Input
                type="number"
                min="1"
                max="365"
                value={warrantyDays}
                onChange={(e) => setWarrantyDays(Number(e.target.value))}
                className="bg-surface-raised border-border text-xs font-mono font-bold text-primary"
              />
            </div>

            <div className="p-3 rounded-lg bg-surface-raised border border-border space-y-1">
              <span className="font-semibold text-foreground block">Komitmen Garansi Penuh Asterra:</span>
              <p className="text-[11px] text-foreground-muted leading-relaxed">
                Setiap akun digital yang mengalami masalah kredensial atau limit dalam masa aktif paket berhak mendapatkan reset atau pergantian akun baru maksimal 1x24 jam sejak tiket komplain dilaporkan.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 5: SEO METADATA */}
        {settingsSection === 'seo' && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="font-bold text-sm text-foreground">Pengaturan SEO & OpenGraph Storefront</h3>
            <div>
              <label className="font-semibold text-foreground block mb-1">Judul Meta Default (Browser Title)</label>
              <Input
                value={defaultMetaTitle}
                onChange={(e) => setDefaultMetaTitle(e.target.value)}
                className="bg-surface-raised border-border text-xs font-semibold"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Deskripsi Meta (Google Search Snippet)</label>
              <textarea
                rows={3}
                value={defaultMetaDesc}
                onChange={(e) => setDefaultMetaDesc(e.target.value)}
                className="w-full rounded-md border border-border bg-surface-raised p-2.5 text-xs text-foreground"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
