'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCartStore } from '@/store/use-cart-store';
import { useAuthStore } from '@/store/use-auth-store';
import { useSession } from '@/lib/auth-client';
import { PublicPaymentConfig } from '@/types/payment';
import { OrdersApi, PromosApi, PaymentConfigApi } from '@/lib/api-client';
import { calculateCampaignPrice, ActiveCampaign } from '@/lib/utils/promo-pricing';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faCheck } from '@fortawesome/free-solid-svg-icons';
import { CheckoutEmptyState } from '@/components/checkout/checkout-empty-state';
import { CheckoutCustomerForm } from '@/components/checkout/checkout-customer-form';
import {
  CheckoutPaymentMethods,
  PaymentMethodOption,
} from '@/components/checkout/checkout-payment-methods';
import { CheckoutCartSummary } from '@/components/checkout/checkout-cart-summary';
import {
  CheckoutManualModal,
  ManualPaymentModalData,
} from '@/components/checkout/checkout-manual-modal';
import { AuthRequiredModal } from '@/components/auth/auth-required-modal';

const GATEWAY_PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'qris',
    name: 'QRIS (Semua Pembayaran)',
    description: 'Scan instan via BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, DANA',
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
    id: 'dana',
    name: 'DANA E-Wallet',
    description: 'Pembayaran instan terhubung langsung dengan akun DANA Anda',
    category: 'ewallet',
  },
];

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, hasHydrated, getTotalAmount, getTotalItems, clearCart, removeItem } = useCartStore();
  const { data: session, isPending: isSessionPending } = useSession();
  const { user: legacyUser } = useAuthStore();
  const isAuthenticated = Boolean(session?.user || legacyUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Sales Partner Referral & Discount Tracking
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralPartner, setReferralPartner] = useState<{
    code: string;
    name: string;
  } | null>(null);
  const [referralDiscount, setReferralDiscount] = useState<number>(0);
  const [isReferralDiscountUsed, setIsReferralDiscountUsed] = useState<boolean>(false);
  const [activeCampaignSlug, setActiveCampaignSlug] = useState<string>('');

  // 0. Fetch active running promo campaigns
  const { data: activeCampaignsData } = useQuery({
    queryKey: ['active-promo-campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/v1/campaigns/active');
      return res.json();
    },
    staleTime: 30000,
  });

  const activeCampaigns = useMemo(() => {
    return Array.isArray(activeCampaignsData?.data) ? activeCampaignsData.data : [];
  }, [activeCampaignsData]);

  // Auto-detect & persist referral code & campaign from query params or localStorage
  useEffect(() => {
    let activeRef = searchParams.get('ref');
    if (!activeRef && typeof window !== 'undefined') {
      try {
        activeRef = localStorage.getItem('asterra_ref');
      } catch (_) {}
    }
    if (activeRef && activeRef.trim()) {
      const cleanRef = activeRef.trim().toUpperCase();
      setReferralCode(cleanRef);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('asterra_ref', cleanRef);
          document.cookie = `asterra_ref=${encodeURIComponent(cleanRef)}; path=/; max-age=2592000; SameSite=Lax`;
          // Preserve parameter in address bar if not present
          if (!searchParams.get('ref')) {
            const url = new URL(window.location.href);
            url.searchParams.set('ref', cleanRef);
            const campaign =
              localStorage.getItem('asterra_campaign') ||
              localStorage.getItem('asterra_utm_campaign');
            if (campaign && !url.searchParams.has('campaign')) {
              url.searchParams.set('campaign', campaign);
            }
            window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
          }
        } catch (_) {}
      }
    }

    // Detect campaign parameter
    const urlCamp = searchParams.get('campaign') || searchParams.get('utm_campaign');
    let campVal = urlCamp;
    if (!campVal && typeof window !== 'undefined') {
      try {
        campVal = localStorage.getItem('asterra_campaign') || localStorage.getItem('asterra_utm_campaign');
      } catch (_) {}
    }
    if (campVal && campVal.trim()) {
      const cleanCamp = campVal.trim();
      setActiveCampaignSlug(cleanCamp);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('asterra_campaign', cleanCamp);
          localStorage.setItem('asterra_utm_campaign', cleanCamp);
          document.cookie = `asterra_campaign=${encodeURIComponent(cleanCamp)}; path=/; max-age=2592000; SameSite=Lax`;
          document.cookie = `asterra_utm_campaign=${encodeURIComponent(cleanCamp)}; path=/; max-age=2592000; SameSite=Lax`;
          if (!searchParams.get('campaign') && !searchParams.get('utm_campaign')) {
            const url = new URL(window.location.href);
            url.searchParams.set('campaign', cleanCamp);
            window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
          }
        } catch (_) {}
      }
    }
  }, [searchParams]);

  // Match active campaign
  const matchingCampaign = useMemo(() => {
    if (!activeCampaigns.length) return null;
    if (activeCampaignSlug) {
      const found = activeCampaigns.find(
        (c: ActiveCampaign) =>
          (c.slug === activeCampaignSlug || c.id === activeCampaignSlug) &&
          c.status !== 'ended' &&
          c.isActive !== false
      );
      if (found) return found;
    }
    // Automatically identify campaign that provides discount to cart items
    for (const item of items) {
      const promoCalc = calculateCampaignPrice(item.priceNumeric, item, activeCampaigns);
      if (promoCalc.hasPromo && promoCalc.campaignName) {
        const found = activeCampaigns.find((c: ActiveCampaign) => c.name === promoCalc.campaignName);
        if (found) return found;
      }
    }
    return activeCampaigns[0] || null;
  }, [activeCampaigns, activeCampaignSlug, items]);

  // Purge campaign parameter ONLY when campaign has explicitly ended
  useEffect(() => {
    if (activeCampaignsData && activeCampaignSlug && activeCampaigns.length > 0) {
      const isExplicitlyEnded = activeCampaigns.some(
        (c: { slug?: string; id?: string; status?: string; isActive?: boolean }) =>
          (c.slug === activeCampaignSlug || c.id === activeCampaignSlug) &&
          (c.status === 'ended' || c.isActive === false)
      );

      const hasExplicitParam =
        typeof window !== 'undefined' &&
        (new URL(window.location.href).searchParams.has('campaign') ||
          new URL(window.location.href).searchParams.has('utm_campaign'));

      if (isExplicitlyEnded && !hasExplicitParam) {
        // Campaign has explicitly ended! Clean up
        setActiveCampaignSlug('');
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('asterra_campaign');
            localStorage.removeItem('asterra_utm_campaign');
            document.cookie = 'asterra_campaign=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            document.cookie = 'asterra_utm_campaign=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          } catch {}
          const currentUrl = new URL(window.location.href);
          let changed = false;
          if (currentUrl.searchParams.has('campaign')) {
            currentUrl.searchParams.delete('campaign');
            changed = true;
          }
          if (currentUrl.searchParams.has('utm_campaign')) {
            currentUrl.searchParams.delete('utm_campaign');
            changed = true;
          }
          if (changed) {
            window.history.replaceState(
              window.history.state,
              '',
              currentUrl.pathname + currentUrl.search + currentUrl.hash
            );
          }
        }
      }
    }
  }, [activeCampaignsData, activeCampaignSlug, activeCampaigns]);

  // Real-time referral attribution & 1-time customer referral discount eligibility check
  useEffect(() => {
    if (!referralCode.trim()) {
      setReferralPartner(null);
      setReferralDiscount(0);
      setIsReferralDiscountUsed(false);
      return;
    }

    let isCancelled = false;
    const checkRef = async () => {
      try {
        const query = new URLSearchParams({
          code: referralCode.trim(),
          ...(targetEmail.trim() ? { email: targetEmail.trim() } : {}),
          ...(phoneNumber.trim() ? { phone: phoneNumber.trim() } : {}),
        });
        const res = await fetch(`/api/v1/affiliate/validate-referral?${query.toString()}`);
        const json = await res.json();
        if (isCancelled) return;

        if (json.valid && json.data) {
          setReferralPartner({
            code: json.data.code,
            name: json.data.partnerName,
          });

          if (json.data.discountEligible === false) {
             // Diskon referral sudah 1x dipakai untuk akun ini
             setReferralDiscount(0);
             setIsReferralDiscountUsed(true);
             // JANGAN HAPUS asterra_ref dan JANGAN HAPUS url param! Mitra sales tetap tercatat sah!
          } else {
             setReferralDiscount(json.data.discountAmount || 1000);
             setIsReferralDiscountUsed(false);
          }
        } else {
          setReferralPartner(null);
          setReferralDiscount(0);
          setIsReferralDiscountUsed(false);
        }
      } catch (_) {
        if (!isCancelled) {
          setReferralPartner(null);
          setReferralDiscount(0);
          setIsReferralDiscountUsed(false);
        }
      }
    };

    checkRef();
    return () => {
      isCancelled = true;
    };
  }, [referralCode, targetEmail, phoneNumber]);

  // Default fallback ensuring zero-delay rendering for users
  const DEFAULT_PUBLIC_CONFIG: PublicPaymentConfig = {
    mode: 'manual',
    bank: {
      name: 'Bank Central Asia (BCA)',
      account_number: '8965123456',
      account_name: 'Asterra Store Official',
    },
    qris: {
      image_url: '/images/qris-toko.png',
      merchant_name: 'ASTERRA STORE QRIS',
    },
    dana: {
      number: '081234567890',
      account_name: 'Asterra Store',
    },
    confirmation_whatsapp: '6281234567890',
    instructions: 'Transfer sesuai nominal tepat hingga 3 digit kode unik terakhir untuk verifikasi instan mutasi.',
    enable_unique_code: true,
    order_expiry_hours: 24,
    cs_email: 'cs@asterra.store',
    cs_whatsapp_numbers: ['6281234567890'],
  };

  // Payment configuration from server (cached in localStorage to prevent gateway-to-manual visual delay)
  const [paymentConfig, setPaymentConfig] = useState<PublicPaymentConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('asterra_payment_config');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.mode) return parsed;
        }
      } catch {}
    }
    return DEFAULT_PUBLIC_CONFIG;
  });

  const [selectedMethod, setSelectedMethod] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('asterra_payment_config');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.mode === 'gateway') return 'qris';
          return 'manual_bca';
        }
      } catch {}
    }
    return 'manual_bca';
  });


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
      const emailParam = session?.user?.email ? `?email=${encodeURIComponent(session.user.email)}` : '';
      fetch(`/api/v1/users/profile${emailParam}`)
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

  const [activeManualModal, setActiveManualModal] = useState<ManualPaymentModalData | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // 1. TanStack Query: Fetch active payment config
  const { data: configData } = useQuery({
    queryKey: ['public-payment-config'],
    queryFn: () => PaymentConfigApi.getPublicConfig(),
    staleTime: 60000,
  });

  useEffect(() => {
    if (configData?.success && configData.data) {
      setPaymentConfig(configData.data);
      try {
        localStorage.setItem('asterra_payment_config', JSON.stringify(configData.data));
      } catch {}
      setSelectedMethod((prev) => {
        if (configData.data.mode === 'manual' && !prev.startsWith('manual_')) {
          return 'manual_bca';
        }
        if (configData.data.mode === 'gateway' && prev.startsWith('manual_')) {
          return 'qris';
        }
        return prev;
      });
    }
  }, [configData]);

  // Prompt unauthenticated guests to login on checkout page
  useEffect(() => {
    if (!isSessionPending && !isAuthenticated) {
      setIsAuthModalOpen(true);
    }
  }, [isSessionPending, isAuthenticated]);

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

  // 2. TanStack Mutation: Validate Promo Voucher
  const validatePromoMutation = useMutation({
    mutationFn: async (code: string) => {
      return PromosApi.validate(
        code,
        getTotalAmount(),
        targetEmail.trim() || undefined,
        items.map((i) => ({ product_id: i.id, quantity: i.quantity, price: i.priceNumeric })),
        referralDiscount
      );
    },
    onSuccess: (res, code) => {
      if (!res || !res.valid) {
        setAppliedPromo(null);
        showPromoFeedback('error', res?.error || 'Kode promo tidak valid atau syarat tidak terpenuhi.');
        return;
      }
      setAppliedPromo({
        code: res.code || code,
        discount: res.discountAmount || 0,
        description: res.description,
      });
      showPromoFeedback('success', res.message || `Kode voucher ${res.code || code} berhasil digunakan!`);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Gagal memeriksa kode promo. Periksa koneksi Anda.';
      setAppliedPromo(null);
      showPromoFeedback('error', msg);
    },
  });

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      showPromoFeedback('error', 'Silakan masukkan kode voucher.');
      return;
    }
    validatePromoMutation.mutate(code);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    showPromoFeedback('success', 'Penggunaan voucher dibatalkan.');
  };

  const subtotal = getTotalAmount();
  const discountAmount = appliedPromo ? appliedPromo.discount : 0;

  // Real-time Campaign Discount Computation
  const campaignDiscount = useMemo(() => {
    if (!activeCampaigns.length || !items.length) return 0;
    let totalDiscount = 0;
    for (const item of items) {
      const promoCalc = calculateCampaignPrice(item.priceNumeric, item, activeCampaigns);
      if (promoCalc.hasPromo) {
        totalDiscount += promoCalc.discountAmount * item.quantity;
      }
    }
    return Math.max(0, totalDiscount);
  }, [activeCampaigns, items]);

  const finalTotal = Math.max(0, subtotal - discountAmount - referralDiscount - campaignDiscount);

  const handleCopy = (text: string, key: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showNotification(`${label} berhasil disalin!`);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const hasOutOfStockItems = items.some(
    (item) => item.isOutOfStock || (item.stock !== undefined && item.stock <= 0)
  );

  const handleValidateBeforeCheckout = (): boolean => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      showNotification('Silakan masuk ke akun Anda terlebih dahulu untuk memproses pesanan.');
      return false;
    }

    if (hasOutOfStockItems) {
      showNotification('Terdapat produk dengan stok habis di pesanan Anda. Hapus item tersebut sebelum melanjutkan.');
      return false;
    }

    if (!customerName.trim()) {
      showNotification('Mohon lengkapi nama lengkap pemesan.');
      return false;
    }

    if (!targetEmail.trim()) {
      showNotification('Mohon lengkapi email tujuan aktivasi akun.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail.trim())) {
      showNotification('Format email aktivasi tidak valid.');
      return false;
    }

    if (items.length === 0) {
      showNotification('Keranjang pesanan masih kosong.');
      return false;
    }

    return true;
  };

  // 3. TanStack Mutation: Create Order & Process Payment
  const createOrderMutation = useMutation({
    mutationFn: async (payload: any) => {
      return OrdersApi.create(payload);
    },
    onSuccess: async (orderData) => {
      const createdOrder = orderData.order;

      // Rule 3: Perilaku parameter URL
      // Setelah user berhasil mengklaim diskon referral, parameter ref harus dihapus dari URL.
      // Pengecualian: jika parameter campaign juga tersedia, parameter ref tidak boleh dihapus.
      if (referralDiscount > 0) {
        setIsReferralDiscountUsed(true);
        setReferralDiscount(0);

        if (typeof window !== 'undefined') {
          try {
            const currentUrl = new URL(window.location.href);
            const hasCampaignParam =
              currentUrl.searchParams.has('campaign') ||
              currentUrl.searchParams.has('utm_campaign') ||
              Boolean(activeCampaignSlug);

            if (!hasCampaignParam) {
              if (currentUrl.searchParams.has('ref')) {
                currentUrl.searchParams.delete('ref');
                window.history.replaceState(
                  window.history.state,
                  '',
                  currentUrl.pathname + currentUrl.search + currentUrl.hash
                );
              }
              localStorage.setItem('asterra_ref_claimed', 'true');
              localStorage.removeItem('asterra_ref');
              localStorage.removeItem('asterra_referral_session_id');
              document.cookie = 'asterra_ref=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
              document.cookie = 'asterra_referral_session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            } else {
              // Jika campaign tersedia bersamaan, parameter ref tidak boleh dihapus (misal ref=AST-Founder-SAGE&campaign=flash-sales-10-10)
              localStorage.setItem('asterra_ref_claimed', 'true');
            }
          } catch {}
        }
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('asterra_customer_email', targetEmail.trim());
          localStorage.setItem('asterra_last_order_id', createdOrder.id);
        } catch {}
      }

      clearCart();

      const orderTotal = Number(
        (createdOrder as unknown as { totalAmount?: number; total_amount?: number; amount?: number }).totalAmount ??
        (createdOrder as unknown as { totalAmount?: number; total_amount?: number; amount?: number }).total_amount ??
        (createdOrder as unknown as { totalAmount?: number; total_amount?: number; amount?: number }).amount ??
        finalTotal ??
        0
      );
      const orderRaw = Number(
        (createdOrder as unknown as { rawAmount?: number; raw_amount?: number }).rawAmount ??
        (createdOrder as unknown as { rawAmount?: number; raw_amount?: number }).raw_amount ??
        subtotal ??
        0
      );
      const orderUnique = Number(
        (createdOrder as unknown as { uniqueCode?: number; unique_code?: number }).uniqueCode ??
        (createdOrder as unknown as { uniqueCode?: number; unique_code?: number }).unique_code ??
        0
      );
      const orderExpiresAt =
        (createdOrder as unknown as { expiresAt?: string; expires_at?: string }).expiresAt ||
        (createdOrder as unknown as { expiresAt?: string; expires_at?: string }).expires_at;

      const isOrderManual =
        isManualMode ||
        createdOrder.payment_mode === 'manual' ||
        (createdOrder as unknown as { paymentMode?: string }).paymentMode === 'manual' ||
        selectedMethod.startsWith('manual_');

      if (isOrderManual) {
        setActiveManualModal({
          orderId: createdOrder.id,
          amount: orderTotal,
          totalAmount: orderTotal,
          total_amount: orderTotal,
          rawAmount: orderRaw,
          raw_amount: orderRaw,
          uniqueCode: orderUnique,
          unique_code: orderUnique,
          method: selectedMethod,
          expiresAt: orderExpiresAt,
          expires_at: orderExpiresAt,
        });
      } else {
        showNotification('Membuat tagihan pembayaran Tripay...');
        const payData = await OrdersApi.pay(createdOrder.id, selectedMethod);

        const checkoutUrl = payData.payment?.checkout_url || payData.payment?.redirect_url;
        if (checkoutUrl) {
          showNotification('Mengarahkan ke halaman pembayaran resmi Tripay...');
          window.location.href = checkoutUrl;
          return;
        }

        showNotification('Pesanan berhasil dibuat. Mengarahkan ke status pesanan.');
        router.push('/orders');
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      showNotification(msg);
    },
  });

  const handleSubmitOrder = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!handleValidateBeforeCheckout()) {
      return;
    }

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
      referral_code: referralPartner?.code || (referralCode.trim() ? referralCode.trim() : undefined),
      referral_discount: referralDiscount,
      referral_session_id:
        typeof window !== 'undefined'
          ? localStorage.getItem('asterra_referral_session_id') || undefined
          : undefined,
      campaign_id: matchingCampaign?.id || (activeCampaignSlug ? activeCampaignSlug : undefined),
      campaign_slug: matchingCampaign?.slug || (activeCampaignSlug ? activeCampaignSlug : undefined),
      campaign_discount: campaignDiscount,
      utm_campaign: matchingCampaign?.slug || (activeCampaignSlug ? activeCampaignSlug : undefined),
      customer_contact: {
        name: customerName.trim(),
        email: targetEmail.trim(),
        phone: phoneNumber.trim(),
      },
    };

    createOrderMutation.mutate(orderPayload);
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
      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-surface-raised border border-primary/40 text-foreground px-4 py-3 rounded-lg shadow-xl flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-medium">{notification}</p>
          </div>
        </div>
      )}

      <main className="flex-1 w-full">
        {/* Cart Hydration & Empty Cart State Guard */}
        {!hasHydrated ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-10 h-10 border-4 border-[#C96F55] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-foreground-muted">Memuat keranjang belanja Anda...</p>
          </div>
        ) : items.length === 0 && !activeManualModal ? (
          <CheckoutEmptyState />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 w-full">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-foreground-muted mb-6 sm:mb-8 flex-wrap sm:flex-nowrap overflow-hidden">
              <Link href="/" className="hover:text-foreground transition-colors shrink-0">
                Beranda
              </Link>
              <span className="shrink-0">/</span>
              <Link href="/products" className="hover:text-foreground transition-colors shrink-0">
                Katalog
              </Link>
              <span className="shrink-0">/</span>
              <span className="text-foreground font-medium truncate max-w-[160px] sm:max-w-none">Checkout Instan</span>
            </nav>

            {/* Checkout Main Content */}
            <form onSubmit={handleSubmitOrder} className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h1 data-gsap="page-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    Checkout & Pembayaran Instan
                  </h1>
                  <p data-gsap="page-sub" className="text-xs sm:text-sm text-foreground-muted mt-1">
                    Pastikan informasi akun dan email tujuan sudah benar sebelum melakukan transaksi.
                  </p>
                </div>
                <div data-gsap="hero-card" className="flex items-center gap-2 text-xs bg-surface-raised border border-border px-3 py-1.5 rounded-lg text-foreground-muted w-fit">
                  <FontAwesomeIcon icon={faLock} className="w-3.5 h-3.5 text-primary" />
                  <span>Transaksi Terenkripsi SSL 256-Bit</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Form & Payment Methods (7 Cols) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Customer Information Card */}
                  <CheckoutCustomerForm
                    customerName={customerName}
                    onCustomerNameChange={setCustomerName}
                    targetEmail={targetEmail}
                    onTargetEmailChange={setTargetEmail}
                    phoneNumber={phoneNumber}
                    onPhoneNumberChange={setPhoneNumber}
                    customerNotes={customerNotes}
                    onCustomerNotesChange={setCustomerNotes}
                  />

                  {/* Payment Method Card */}
                  <CheckoutPaymentMethods
                    isManualMode={isManualMode}
                    paymentMethods={currentPaymentMethods}
                    selectedMethod={selectedMethod}
                    onSelectMethod={setSelectedMethod}
                  />
                </div>

                {/* Right Column: Order Summary & Pay Button (5 Cols) */}
                <div className="lg:col-span-5 sticky top-24 space-y-6">
                  <CheckoutCartSummary
                    items={items}
                    totalItems={getTotalItems()}
                    subtotal={subtotal}
                    appliedPromo={appliedPromo}
                    discountAmount={discountAmount}
                    referralDiscount={referralDiscount}
                    referralPartner={referralPartner}
                    isReferralDiscountUsed={isReferralDiscountUsed}
                    campaignDiscount={campaignDiscount}
                    activeCampaign={matchingCampaign}
                    finalTotal={finalTotal}
                    isManualMode={isManualMode}
                    enableUniqueCode={Boolean(paymentConfig.enable_unique_code)}
                    isSubmitting={createOrderMutation.isPending}
                    hasOutOfStockItems={hasOutOfStockItems}
                    promoCode={promoCode}
                    onPromoCodeChange={setPromoCode}
                    onApplyPromo={handleApplyPromo}
                    onRemovePromo={handleRemovePromo}
                    isCheckingPromo={validatePromoMutation.isPending}
                    promoFeedback={promoFeedback}
                    onValidateBeforeCheckout={handleValidateBeforeCheckout}
                    onConfirmOrder={() => handleSubmitOrder()}
                    onRemoveItem={removeItem}
                  />
                </div>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Manual Payment Modal */}
      <CheckoutManualModal
        data={activeManualModal}
        paymentConfig={paymentConfig}
        customerName={customerName}
        targetEmail={targetEmail}
        onClose={() => {
          setActiveManualModal(null);
          router.push('/orders');
        }}
        onCopy={handleCopy}
        copiedKey={copiedKey}
        getMethodName={getMethodName}
      />

      {/* Guest Authentication Modal */}
      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFCF7] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}
