'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/use-cart-store';
import { useAuthStore } from '@/store/use-auth-store';
import { useSession } from '@/lib/auth-client';
import { PublicPaymentConfig } from '@/lib/services/payment-config.service';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  ArrowRight,
  Lock,
  Copy,
  Check,
  ShoppingBag,
  Clock,
  Building2,
  Wallet,
  Tag,
  X,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface PaymentMethodOption {
  id: string;
  name: string;
  description: string;
  category: 'qris' | 'ewallet' | 'va' | 'bank_manual';
}

const GATEWAY_PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'qris',
    name: 'QRIS (Semua Pembayaran)',
    description: 'Scan instan via BCA, Mandiri, BRI, SeaBank, BNI, GoPay, OVO, ShopeePay, DANA',
    category: 'qris',
  },
  {
    id: 'bca_va',
    name: 'BCA Virtual Account',
    description: 'Transfer otomatis via BCA Mobile, myBCA, KlikBCA, atau ATM BCA',
    category: 'va',
  },
  {
    id: 'bni_va',
    name: 'BNI Virtual Account',
    description: 'Transfer otomatis via BNI Mobile Banking, Internet Banking, atau ATM BNI',
    category: 'va',
  },
  {
    id: 'seabank_va',
    name: 'SeaBank Virtual Account',
    description: 'Transfer otomatis via aplikasi SeaBank atau jaringan Bank Lainnya',
    category: 'va',
  },
  {
    id: 'dana',
    name: 'DANA E-Wallet',
    description: 'Pembayaran instan terhubung langsung dengan akun DANA Anda',
    category: 'ewallet',
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalAmount, getTotalItems, clearCart } = useCartStore();
  const { data: session } = useSession();
  const { user: legacyUser } = useAuthStore();

  // Payment configuration from server
  const [paymentConfig, setPaymentConfig] = useState<PublicPaymentConfig | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('qris');

  // Auto-fill from active Better Auth session or legacy auth store
  useEffect(() => {
    const authUser = session?.user || legacyUser;
    if (authUser) {
      if (authUser.name) setCustomerName((curr) => curr || authUser.name || '');
      if (authUser.email) setTargetEmail((curr) => curr || authUser.email || '');
    }
  }, [session, legacyUser]);

  // Fetch saved WhatsApp number and verified profile details
  useEffect(() => {
    if (session?.user) {
      fetch('/api/v1/users/profile')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            if (json.data.name) setCustomerName((curr) => curr || json.data.name);
            if (json.data.email) setTargetEmail((curr) => curr || json.data.email);
            if (json.data.phone) setPhoneNumber((curr) => curr || json.data.phone);
          }
        })
        .catch(() => {});
    }
  }, [session]);

  // Promo code states
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discount: number;
    description?: string;
  } | null>(null);
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [promoFeedback, setPromoFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const promoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showPromoFeedback = (type: 'success' | 'error', text: string) => {
    if (promoTimerRef.current) {
      clearTimeout(promoTimerRef.current);
    }
    setPromoFeedback({ type, text });
    promoTimerRef.current = setTimeout(() => {
      setPromoFeedback(null);
    }, 4000);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal for manual payment instructions only
  const [activeManualModal, setActiveManualModal] = useState<{
    orderId: string;
    amount: number;
    rawAmount?: number;
    uniqueCode?: number;
    method: string;
    expiresAt?: string;
  } | null>(null);

  const [notification, setNotification] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Fetch active payment config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/v1/payment-config');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setPaymentConfig(json.data);
            if (json.data.mode === 'manual') {
              setSelectedMethod('manual_bca');
            } else {
              setSelectedMethod('qris');
            }
          }
        }
      } catch (err) {
        console.warn('[Checkout] Failed to load payment config, using default:', err);
      }
    }
    loadConfig();
  }, []);

  const isManualMode = paymentConfig?.mode === 'manual';

  // Dynamic payment methods based on server mode
  const currentPaymentMethods: PaymentMethodOption[] = isManualMode
    ? [
        {
          id: 'manual_bca',
          name: paymentConfig?.bank?.name || 'Bank Central Asia (BCA)',
          description: `No. Rek: ${paymentConfig?.bank?.account_number || '8965123456'} a.n ${
            paymentConfig?.bank?.account_name || 'Asterra Store Official'
          }`,
          category: 'bank_manual',
        },
        {
          id: 'manual_qris',
          name: 'QRIS Statis Toko',
          description: `Scan QRIS Semua Bank & E-Wallet (${paymentConfig?.qris?.merchant_name || 'ASTERRA STORE'})`,
          category: 'qris',
        },
        {
          id: 'manual_dana',
          name: 'Transfer E-Wallet DANA',
          description: `No. HP: ${paymentConfig?.dana?.number || '081234567890'} a.n ${
            paymentConfig?.dana?.account_name || 'Asterra Store'
          }`,
          category: 'ewallet',
        },
      ]
    : GATEWAY_PAYMENT_METHODS;

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      showPromoFeedback('error', 'Silakan masukkan kode voucher.');
      return;
    }

    try {
      setIsCheckingPromo(true);
      const res = await fetch('/api/v1/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          subtotal: getTotalAmount(),
          email: targetEmail.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setAppliedPromo(null);
        showPromoFeedback('error', json.error || 'Kode promo tidak valid atau syarat tidak terpenuhi.');
        return;
      }

      setAppliedPromo({
        code: json.data.code,
        discount: json.data.discountAmount,
        description: json.data.description,
      });
      showPromoFeedback('success', json.data.message || `Kode voucher ${json.data.code} berhasil digunakan!`);
    } catch {
      showPromoFeedback('error', 'Gagal memeriksa kode promo. Periksa koneksi Anda.');
    } finally {
      setIsCheckingPromo(false);
    }
  };

  const subtotal = getTotalAmount();
  const discountAmount = appliedPromo ? appliedPromo.discount : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleCopy = (text: string, key: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showNotification(`${label} berhasil disalin!`);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      showNotification('Mohon lengkapi nama lengkap pemesan.');
      return;
    }

    if (!targetEmail.trim()) {
      showNotification('Mohon lengkapi email tujuan aktivasi akun.');
      return;
    }

    if (items.length === 0) {
      showNotification('Keranjang pesanan masih kosong.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create order on backend (Strict Server-Side Price Locking, Promo Validation & Unique Code Calculation)
      const orderPayload = {
        items: items.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          unit_price: item.priceNumeric,
          quantity: item.quantity,
          purchased_details: {
            target_email: targetEmail.trim(),
            phone: phoneNumber.trim(),
          },
        })),
        customer_notes: customerNotes.trim(),
        payment_method: selectedMethod,
        promo_code: appliedPromo?.code || undefined,
        customer_contact: {
          name: customerName.trim(),
          email: targetEmail.trim(),
          phone: phoneNumber.trim(),
        },
      };

      const orderRes = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Gagal membuat pesanan');
      }

      const createdOrder = orderData.order;

      // Clear shopping cart
      clearCart();

      // 2. Handle based on active payment mode
      if (isManualMode || createdOrder.payment_mode === 'manual') {
        // Show manual modal with exact total (including 3-digit unique code) and WhatsApp confirmation button
        setActiveManualModal({
          orderId: createdOrder.id,
          amount: createdOrder.total_amount,
          rawAmount: createdOrder.raw_amount,
          uniqueCode: createdOrder.unique_code,
          method: selectedMethod,
          expiresAt: createdOrder.expires_at,
        });
      } else {
        // In gateway mode, initiate Tripay payment and directly redirect
        showNotification('Membuat tagihan pembayaran Tripay...');
        const payRes = await fetch(`/api/v1/orders/${createdOrder.id}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_method: selectedMethod }),
        });

        const payData = await payRes.json();
        if (!payRes.ok || !payData.success) {
          throw new Error(payData.error || 'Gagal menginisiasi pembayaran gateway Tripay');
        }

        const checkoutUrl = payData.payment?.checkout_url || payData.payment?.redirect_url;
        if (checkoutUrl) {
          showNotification('Mengarahkan ke halaman pembayaran resmi Tripay...');
          // Direct redirect without popup modal
          window.location.href = checkoutUrl;
          return;
        }

        showNotification('Pesanan berhasil dibuat. Mengarahkan ke status pesanan.');
        router.push('/orders');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      showNotification(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMethodName = (methodId: string) => {
    if (methodId === 'manual_bca') return paymentConfig?.bank?.name || 'Bank Central Asia (BCA)';
    if (methodId === 'manual_qris') return 'QRIS Statis Toko';
    if (methodId === 'manual_dana') return 'Transfer E-Wallet DANA';
    if (methodId === 'qris') return 'QRIS (Semua Pembayaran)';
    if (methodId === 'bca_va') return 'BCA Virtual Account';
    if (methodId === 'bni_va') return 'BNI Virtual Account';
    if (methodId === 'seabank_va') return 'SeaBank Virtual Account';
    if (methodId === 'dana') return 'DANA E-Wallet';
    return 'Tripay Payment Gateway';
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      <Header onNotify={showNotification} />

      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-surface-raised border border-primary/40 text-foreground px-4 py-3 rounded-lg shadow-xl flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Check className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-medium">{notification}</p>
          </div>
        </div>
      )}

      <main className="flex-1 w-full">
        {/* Empty Cart State */}
        {items.length === 0 && !activeManualModal ? (
          <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col justify-center">
            {/* Breadcrumb aligned directly with the card */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-foreground-muted mb-5">
              <Link href="/" className="hover:text-foreground transition-colors">
                Beranda
              </Link>
              <span>/</span>
              <Link href="/products" className="hover:text-foreground transition-colors">
                Katalog
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">Checkout Instan</span>
            </nav>

            <div className="bg-surface border border-border rounded-xl p-8 sm:p-10 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-xl bg-surface-raised border border-border flex items-center justify-center mx-auto text-foreground-muted mb-4">
                <ShoppingBag className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">
                Keranjang Belanja Kosong
              </h2>
              <p className="text-xs sm:text-sm text-foreground-muted max-w-sm mx-auto leading-relaxed mb-6">
                Pilih produk digital dari katalog terlebih dahulu sebelum melanjutkan ke proses checkout.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/products" className="w-full sm:w-auto">
                  <Button size="sm" className="w-full sm:w-auto gap-2 text-xs px-5 h-9 font-semibold">
                    <span>Jelajahi Katalog Produk</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>

                <Link href="/orders" className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs border-border h-9 px-4">
                    <span>Riwayat Pesanan</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 w-full">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-foreground-muted mb-6 sm:mb-8">
              <Link href="/" className="hover:text-foreground transition-colors">
                Beranda
              </Link>
              <span>/</span>
              <Link href="/products" className="hover:text-foreground transition-colors">
                Katalog
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">Checkout Instan</span>
            </nav>

            {/* Checkout Main Content */}
            <form onSubmit={handleSubmitOrder} className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Checkout & Pembayaran Instan
                </h1>
                <p className="text-xs sm:text-sm text-foreground-muted mt-1">
                  Pastikan informasi akun dan email tujuan sudah benar sebelum melakukan transaksi.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs bg-surface-raised border border-border px-3 py-1.5 rounded-lg text-foreground-muted w-fit">
                <Lock className="w-3.5 h-3.5 text-primary" />
                <span>Transaksi Terenkripsi SSL 256-Bit</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form & Payment Methods (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Customer Information Card */}
                <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-border">
                    <div className="w-6 h-6 rounded-md bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <h2 className="text-base font-bold text-foreground">Informasi Akun Tujuan Lisensi</h2>
                  </div>

                  <div className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span>Nama Lengkap Customer / Pemesan *</span>
                        <span className="text-[11px] text-foreground-muted font-normal">Identitas validasi admin</span>
                      </label>
                      <Input
                        type="text"
                        required
                        placeholder="contoh: Budi Santoso"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="bg-surface-raised border-border text-xs sm:text-sm font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span>Email Tujuan Aktivasi / Akun *</span>
                        <span className="text-[11px] text-foreground-muted font-normal">Kredensial dikirim ke email ini</span>
                      </label>
                      <Input
                        type="email"
                        required
                        placeholder="contoh: akun_anda@gmail.com"
                        value={targetEmail}
                        onChange={(e) => setTargetEmail(e.target.value)}
                        className="bg-surface-raised border-border text-xs sm:text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span>Nomor WhatsApp / Kontak (Opsional)</span>
                        <span className="text-[11px] text-foreground-muted font-normal">Notifikasi status instan</span>
                      </label>
                      <Input
                        type="tel"
                        placeholder="contoh: 081234567890"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="bg-surface-raised border-border text-xs sm:text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Catatan Khusus Pesanan (Opsional)
                      </label>
                      <Input
                        type="text"
                        placeholder="contoh: Mohon konfirmasi akun via WhatsApp juga..."
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        className="bg-surface-raised border-border text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Payment Method Card */}
                <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      <h2 className="text-base font-bold text-foreground">Pilih Metode Pembayaran</h2>
                    </div>

                    {isManualMode ? (
                      <Badge className="bg-status-warning/15 text-status-warning border-status-warning/30 text-[10px] font-mono gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Mode Transfer Toko</span>
                      </Badge>
                    ) : (
                      <Badge className="bg-status-success/15 text-status-success border-status-success/30 text-[10px] font-mono gap-1">
                        <Check className="w-3 h-3" />
                        <span>Gateway Otomatis</span>
                      </Badge>
                    )}
                  </div>

                  {/* Notice for Manual Mode */}
                  {isManualMode && (
                    <div className="p-3.5 rounded-lg bg-status-warning/10 border border-status-warning/30 space-y-1">
                      <div className="flex items-center gap-2 text-status-warning font-semibold text-xs">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Pembayaran Transfer Manual Toko Aktif</span>
                      </div>
                      <p className="text-[11px] text-foreground-muted leading-relaxed">
                        Silakan pilih metode transfer langsung di bawah ini. Anda akan mendapatkan detail rekening dan
                        tombol konfirmasi instan ke WhatsApp admin setelah pesanan dibuat.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2.5 pt-1">
                    {currentPaymentMethods.map((method) => {
                      const isSelected = selectedMethod === method.id;
                      return (
                        <div
                          key={method.id}
                          onClick={() => setSelectedMethod(method.id)}
                          className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-surface-raised border-primary shadow-sm ring-1 ring-primary'
                              : 'bg-surface border-border hover:border-foreground-muted/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-surface-raised flex items-center justify-center text-primary shrink-0">
                              {method.category === 'qris' && <QrCode className="w-4 h-4" />}
                              {method.category === 'ewallet' && <Wallet className="w-4 h-4" />}
                              {method.category === 'va' && <Building2 className="w-4 h-4" />}
                              {method.category === 'bank_manual' && <CreditCard className="w-4 h-4" />}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-foreground block">
                                {method.name}
                              </span>
                              <span className="text-[11px] text-foreground-muted">
                                {method.description}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isManualMode ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-warning/15 text-status-warning font-medium">
                                Manual
                              </span>
                            ) : method.category === 'qris' ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-success/10 text-status-success font-medium">
                                Otomatis
                              </span>
                            ) : null}
                            <span
                              className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                isSelected ? 'bg-primary text-white' : 'bg-surface-hover'
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Order Summary & Pay Button (5 Cols) */}
              <div className="lg:col-span-5 sticky top-24 space-y-6">
                <div className="bg-surface border border-border rounded-xl p-6 shadow-xl space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <h3 className="text-base font-bold text-foreground">Ringkasan Pesanan</h3>
                    <Badge variant="outline" className="text-xs border-border">
                      {getTotalItems()} Item
                    </Badge>
                  </div>

                  {/* Items List */}
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-border/40 last:border-0"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-foreground block">{item.name}</span>
                          <span className="text-foreground-muted text-[11px]">
                            {item.quantity}x @ Rp {item.priceNumeric.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-foreground">
                          Rp {(item.priceNumeric * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Promo Code Input */}
                  <div className="pt-2 border-t border-border space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          type="text"
                          placeholder="Kode Promo (ASTERRA10)"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="pl-8 text-xs bg-surface-raised border-border uppercase font-mono"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isCheckingPromo}
                        onClick={handleApplyPromo}
                        className="text-xs border-border shrink-0 font-medium"
                      >
                        {isCheckingPromo ? 'Memeriksa...' : 'Gunakan'}
                      </Button>
                    </div>

                    {/* Feedback message: pure text red/green with auto-dismiss timer, no close button */}
                    {promoFeedback && (
                      <p
                        className={`text-xs font-medium animate-in fade-in duration-200 ${
                          promoFeedback.type === 'success'
                            ? 'text-status-success'
                            : 'text-status-error'
                        }`}
                      >
                        {promoFeedback.text}
                      </p>
                    )}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="pt-2 border-t border-border space-y-2 text-xs">
                    <div className="flex justify-between text-foreground-muted">
                      <span>Subtotal Belanja</span>
                      <span className="font-mono">Rp {subtotal.toLocaleString('id-ID')}</span>
                    </div>

                    {appliedPromo && (
                      <div className="flex justify-between text-status-success">
                        <span>Diskon Voucher ({appliedPromo.code})</span>
                        <span className="font-mono">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                      </div>
                    )}

                    {isManualMode && paymentConfig?.enable_unique_code && (
                      <div className="flex justify-between text-primary font-mono text-[11px] pt-1">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Kode Verifikasi Mutasi</span>
                        </span>
                        <span>Dihitung otomatis</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-border flex justify-between items-baseline">
                      <span className="text-sm font-bold text-foreground">Total Tagihan</span>
                      <div className="text-right">
                        <span className="text-xl font-extrabold text-primary font-mono block">
                          Rp {finalTotal.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] text-foreground-muted">Termasuk PPN & Biaya Layanan</span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full gap-2 text-sm font-bold h-12 shadow-lg shadow-primary/20"
                  >
                    {isSubmitting ? (
                      <span>Memproses Pesanan...</span>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>
                          {isManualMode ? 'Lanjut ke Transfer Manual' : `Bayar Sekarang (Rp ${finalTotal.toLocaleString('id-ID')})`}
                        </span>
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-foreground-muted text-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    <span>Garansi uang kembali 100% jika aktivasi akun gagal.</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
      </main>

      {/* MODAL 1: MANUAL TRANSFER POP-UP INSTRUCTIONS (Anti-Fraud & WhatsApp Confirmation) */}
      {activeManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in"
            onClick={() => {
              setActiveManualModal(null);
              router.push('/orders');
            }}
          />

          <div className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl p-6 sm:p-8 z-10 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px] bg-status-warning text-black font-semibold">
                    Transfer Manual Toko
                  </Badge>
                  <span className="text-xs font-mono text-foreground-muted">
                    ID: {activeManualModal.orderId}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground mt-2">
                  Instruksi Pembayaran Manual
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveManualModal(null);
                  router.push('/orders');
                }}
                className="text-foreground-muted hover:text-foreground p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Expiry Warning Box */}
            <div className="bg-surface-raised rounded-lg p-3 flex items-center justify-between text-xs border border-border">
              <div className="flex items-center gap-2 text-foreground-muted">
                <Clock className="w-4 h-4 text-status-warning" />
                <span>Batas Waktu Pembayaran</span>
              </div>
              <span className="font-mono font-bold text-status-warning">
                {paymentConfig?.order_expiry_hours || 24} Jam ke depan
              </span>
            </div>

            {/* Highlighted Amount to Transfer with Unique Code */}
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl text-center space-y-2">
              <span className="text-xs text-foreground-muted block font-medium">
                Total Nominal Wajib Ditransfer:
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-primary font-mono">
                  Rp {activeManualModal.amount.toLocaleString('id-ID')}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(String(activeManualModal.amount), 'amount', 'Nominal transfer tepat')
                  }
                  className="px-2 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 text-xs font-semibold flex items-center gap-1"
                  title="Salin Nominal Tepat"
                >
                  {copiedKey === 'amount' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'amount' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              {activeManualModal.uniqueCode && (
                <p className="text-[11px] text-foreground-muted font-medium">
                  Termasuk 3 digit kode verifikasi mutasi{' '}
                  <span className="text-primary font-mono font-bold">
                    (+Rp {activeManualModal.uniqueCode})
                  </span>
                  . Mohon transfer tepat hingga digit terakhir agar verifikasi otomatis cepat!
                </p>
              )}
            </div>

            {/* Method Details: Bank BCA / QRIS / DANA */}
            {activeManualModal.method === 'manual_bca' && (
              <div className="p-4 bg-surface-raised rounded-xl border border-border space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Rekening Tujuan Transfer:</span>
                  <span className="text-foreground-muted text-[11px]">{paymentConfig?.bank?.name}</span>
                </div>
                <div className="flex items-center justify-between bg-surface p-3 rounded-lg border border-border">
                  <div>
                    <span className="font-mono font-bold text-lg text-foreground tracking-wider block">
                      {paymentConfig?.bank?.account_number || '8965123456'}
                    </span>
                    <span className="text-[11px] text-foreground-muted">
                      a.n {paymentConfig?.bank?.account_name || 'Asterra Store Official'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleCopy(
                        paymentConfig?.bank?.account_number || '8965123456',
                        'bca',
                        'Nomor rekening'
                      )
                    }
                    className="text-xs gap-1.5 h-8 font-semibold"
                  >
                    {copiedKey === 'bca' ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'bca' ? 'Tersalin' : 'Salin'}</span>
                  </Button>
                </div>
              </div>
            )}

            {activeManualModal.method === 'manual_qris' && (
              <div className="p-4 bg-surface-raised rounded-xl border border-border text-center space-y-3">
                <div className="w-40 h-40 bg-white p-2 rounded-xl mx-auto flex items-center justify-center border border-border">
                  {/* QR Pattern / Image preview */}
                  <div className="w-full h-full border-2 border-ink border-dashed rounded-lg flex flex-col items-center justify-center p-2 text-ink">
                    <QrCode className="w-14 h-14 mb-1" />
                    <span className="text-[8px] font-bold uppercase tracking-wider text-ink">
                      {paymentConfig?.qris?.merchant_name || 'ASTERRA STORE QRIS'}
                    </span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">
                    {paymentConfig?.qris?.merchant_name || 'ASTERRA STORE QRIS'}
                  </span>
                  <p className="text-[11px] text-foreground-muted max-w-xs mx-auto">
                    Scan barcode di atas menggunakan GoPay, OVO, Dana, ShopeePay, atau BCA Mobile.
                  </p>
                </div>
              </div>
            )}

            {activeManualModal.method === 'manual_dana' && (
              <div className="p-4 bg-surface-raised rounded-xl border border-border space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Nomor Akun E-Wallet DANA:</span>
                  <span className="text-foreground-muted text-[11px]">DANA Indonesia</span>
                </div>
                <div className="flex items-center justify-between bg-surface p-3 rounded-lg border border-border">
                  <div>
                    <span className="font-mono font-bold text-lg text-foreground tracking-wider block">
                      {paymentConfig?.dana?.number || '081234567890'}
                    </span>
                    <span className="text-[11px] text-foreground-muted">
                      a.n {paymentConfig?.dana?.account_name || 'Asterra Store'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleCopy(
                        paymentConfig?.dana?.number || '081234567890',
                        'dana',
                        'Nomor DANA'
                      )
                    }
                    className="text-xs gap-1.5 h-8 font-semibold"
                  >
                    {copiedKey === 'dana' ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'dana' ? 'Tersalin' : 'Salin'}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Direct WhatsApp Confirmation Button */}
            <div className="space-y-2.5 pt-1">
              <a
                href={`https://wa.me/${paymentConfig?.confirmation_whatsapp || '6281234567890'}?text=${encodeURIComponent(
                  `Halo Admin Asterra Store, saya sudah melakukan transfer pembayaran manual untuk pesanan:\n\n• No. Pesanan: ${
                    activeManualModal.orderId
                  }\n• Nama Pemesan: ${customerName}\n• Email Aktivasi: ${targetEmail}\n• Total Nominal Ditransfer: Rp ${activeManualModal.amount.toLocaleString(
                    'id-ID'
                  )}\n• Metode: ${getMethodName(
                    activeManualModal.method
                  )}\n\nBerikut saya lampirkan bukti transfernya untuk divalidasi. Terima kasih!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Kirim Bukti Pembayaran ke WhatsApp Admin</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <Button
                variant="outline"
                className="w-full text-xs text-foreground-muted border-border hover:bg-surface-raised h-10"
                onClick={() => {
                  setActiveManualModal(null);
                  router.push('/orders');
                }}
              >
                Saya Sudah Transfer & Lihat Status Pesanan
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
