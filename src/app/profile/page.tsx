'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession, signOut, signIn } from '@/lib/auth-client';
import { useAuthStore } from '@/store/use-auth-store';
import { AsterraLogo } from '@/components/ui/asterra-logo';
import {
  User as UserIcon,
  Mail,
  Calendar,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Package,
  Edit2,
  ShoppingBag,
  ExternalLink,
  PhoneCall,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  customerEmail: string;
  customerWhatsapp: string | null;
  totalAmount: number;
  status: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  createdAt: string;
  items: OrderItem[];
}

interface ProfileApiResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    emailVerified: boolean;
    phone: string | null;
    createdAt: string;
    orders: Order[];
    stats: {
      totalOrders: number;
      completedOrders: number;
      pendingOrders: number;
    };
  };
}

function formatDate(dateInput: string | Date | undefined | null) {
  if (!dateInput) return '-';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return '-';
  }
}

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending: isAuthPending } = useSession();
  const { logout: legacyLogout } = useAuthStore();

  const [notification, setNotification] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Fetch full profile info from server
  const { data: profileData, isLoading: isProfileLoading } = useQuery<ProfileApiResponse>({
    queryKey: ['user-profile', session?.user?.email],
    queryFn: async () => {
      const res = await fetch('/api/v1/users/profile');
      if (!res.ok) throw new Error('Gagal mengambil data profil');
      return res.json();
    },
    enabled: !!session?.user?.email,
    staleTime: 5 * 60 * 1000,
  });

  const profile = profileData?.data;

  // Initialize editable fields once profile is loaded
  useEffect(() => {
    if (profile) {
      setEditName(profile.name || session?.user?.name || '');
      setEditPhone(profile.phone || '');
    } else if (session?.user) {
      setEditName(session.user.name || '');
    }
  }, [profile, session?.user]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Mutation to update profile
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: { name: string; phone: string }) => {
      const res = await fetch('/api/v1/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Gagal memperbarui profil');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setIsEditing(false);
      showNotification('Profil akun Anda berhasil diperbarui!');
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Terjadi kendala saat update profil';
      showNotification(message);
    },
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showNotification('Nama lengkap tidak boleh kosong');
      return;
    }
    updateProfileMutation.mutate({
      name: editName.trim(),
      phone: editPhone.trim(),
    });
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // Ignore if offline
    }
    legacyLogout();
    showNotification('Anda telah keluar dari akun.');
    router.push('/');
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: '/profile',
      });
    } catch {
      setIsLoggingIn(false);
      showNotification('Gagal menghubungkan ke layanan Google. Silakan coba lagi.');
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Lunas & Selesai</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[rgba(201,111,85,0.08)] text-[#C96F55] border border-[rgba(201,111,85,0.25)]">
            <Sparkles className="w-3 h-3 text-[#C96F55]" />
            <span>Sedang Diproses</span>
          </span>
        );
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>Pembayaran Terverifikasi</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Menunggu Pembayaran</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 capitalize">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#121A2A] flex flex-col selection:bg-[#C96F55]/20 selection:text-[#C96F55]">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#121A2A] border border-white/15 text-[#F7F5EF] px-4 py-3 rounded-xl shadow-editorial flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#C96F55] shrink-0" />
          <span className="text-sm font-semibold">{notification}</span>
        </div>
      )}

      {/* Header */}
      <Header onNotify={showNotification} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 w-full">
        {/* Loading State */}
        {isAuthPending ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-9 h-9 text-accent animate-spin" />
            <p className="text-sm text-slate-500 font-medium">
              Memeriksa autentikasi akun Google...
            </p>
          </div>
        ) : !session?.user ? (
          /* Unauthenticated State */
          <div className="max-w-md mx-auto py-12 text-center">
            <div className="p-8 rounded-2xl bg-white border border-border shadow-card space-y-6">
              <div className="flex justify-center">
                <AsterraLogo variant="light-bg" size="lg" linkToHome={true} />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-extrabold tracking-tight text-navy-900">
                  Akses Profil Pelanggan
                </h1>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Silakan masuk menggunakan akun Google Anda untuk mengakses informasi lisensi, profil pengguna, dan riwayat pesanan Asterra Store.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full gap-2.5 h-11 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Masuk dengan Akun Google</span>
                </Button>

                <Link href="/" className="block">
                  <Button variant="outline" className="w-full text-xs border-border rounded-xl text-navy-900 hover:text-accent">
                    Kembali ke Beranda
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard View */
          <div className="space-y-8">
            {/* Top Bar / Breadcrumb & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 flex-wrap sm:flex-nowrap overflow-hidden">
                  <Link href="/" className="hover:text-navy-900 transition-colors shrink-0">
                    Beranda
                  </Link>
                  <span className="shrink-0 text-slate-300">/</span>
                  <span className="text-navy-900 font-semibold truncate max-w-[160px] sm:max-w-none">Profil Saya</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-900">
                  Profil Pelanggan
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Kelola kredensial akun, identitas pemesan, dan riwayat lisensi produk digital Anda
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2 text-status-error hover:bg-red-50 hover:border-red-200 border-border text-xs rounded-xl"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar Akun</span>
                </Button>
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Left Column: Profile Card, Security & CS Help */}
              <div className="space-y-6 lg:col-span-1">
                {/* User ID Card */}
                <Card className="border-border bg-white rounded-2xl shadow-card">
                  <CardHeader className="text-center pb-4 pt-6">
                    <div className="relative mx-auto mb-3">
                      {session.user.image ? (
                        <img
                          src={session.user.image}
                          alt={session.user.name || 'User Profile'}
                          className="w-24 h-24 rounded-2xl object-cover ring-2 ring-accent/40 shadow-sm mx-auto"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-[rgba(201,111,85,0.08)] border-2 border-[rgba(201,111,85,0.25)] mx-auto flex items-center justify-center text-[#C96F55] text-3xl font-bold shadow-inner">
                          {session.user.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-1 bg-white border border-border p-1.5 rounded-full shadow-xs">
                        <ShieldCheck className="w-4 h-4 text-status-success" />
                      </div>
                    </div>

                    <CardTitle className="text-lg font-bold text-navy-900">
                      {profile?.name || session.user.name || 'Pelanggan Asterra'}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{session.user.email}</span>
                    </CardDescription>

                    <div className="pt-3 flex flex-wrap items-center justify-center gap-1.5">
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Google Terverifikasi</span>
                      </span>
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Member Asterra
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-3 text-xs border-t border-border">
                    <div className="flex items-center justify-between text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-accent" />
                        <span>Bergabung Sejak</span>
                      </div>
                      <span className="font-semibold text-navy-900">
                        {formatDate(profile?.createdAt || session.user.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-3.5 h-3.5 text-accent" />
                        <span>Peran Akun</span>
                      </div>
                      <span className="font-semibold text-navy-900 capitalize">
                        {profile?.role || 'Pelanggan'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-accent" />
                        <span>Metode Masuk</span>
                      </div>
                      <span className="font-semibold text-navy-900">
                        Google OAuth 2.0
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* CS Assistance Card */}
                <div className="p-5 rounded-2xl bg-white border border-border space-y-3 shadow-card">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55] shrink-0">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-navy-900">
                        Layanan Bantuan 24/7
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Kendala lisensi atau verifikasi pembayaran?
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://wa.me/6281234567890?text=Halo%20CS%20Asterra%20Store%2C%20saya%20membutuhkan%20bantuan%20seputar%20akun%20dan%20pesanan%20saya."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-1.5 border-border hover:border-accent text-navy-900 rounded-xl"
                    >
                      <span>Hubungi CS via WhatsApp</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Button>
                  </a>
                </div>
              </div>

              {/* Right Column: Stats, Account Form & Order History */}
              <div className="space-y-6 lg:col-span-2">
                {/* Stats Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-2xl bg-white border border-border shadow-card space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-semibold">Total Pesanan</span>
                      <ShoppingBag className="w-4 h-4 text-accent" />
                    </div>
                    <p className="text-2xl font-extrabold text-navy-900">
                      {isProfileLoading ? '-' : profile?.stats.totalOrders ?? 0}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Transaksi terdaftar
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-border shadow-card space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-semibold">Pesanan Selesai</span>
                      <CheckCircle2 className="w-4 h-4 text-status-success" />
                    </div>
                    <p className="text-2xl font-extrabold text-navy-900">
                      {isProfileLoading ? '-' : profile?.stats.completedOrders ?? 0}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Lisensi aktif & terkirim
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-border shadow-card space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-semibold">Menunggu Bayar</span>
                      <Clock className="w-4 h-4 text-status-warning" />
                    </div>
                    <p className="text-2xl font-extrabold text-navy-900">
                      {isProfileLoading ? '-' : profile?.stats.pendingOrders ?? 0}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Belum diselesaikan
                    </span>
                  </div>
                </div>

                {/* Account Details & Inline Edit Card */}
                <Card className="border-border bg-white rounded-2xl shadow-card">
                  <CardHeader className="flex flex-row items-center justify-between p-6 pb-3">
                    <div>
                      <CardTitle className="text-base font-bold text-navy-900">Informasi Akun</CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-0.5">
                        Data pemesan yang akan digunakan saat proses checkout dan pengiriman lisensi
                      </CardDescription>
                    </div>

                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="gap-1.5 text-xs border-border hover:border-accent rounded-xl text-navy-900"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-accent" />
                        <span>Ubah Data</span>
                      </Button>
                    )}
                  </CardHeader>

                  <CardContent className="p-6 pt-0">
                    {isEditing ? (
                      <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-navy-900">
                            Nama Lengkap
                          </label>
                          <Input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Masukkan nama lengkap Anda"
                            className="bg-white border-border text-sm rounded-xl"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-navy-900">
                            Nomor WhatsApp (Untuk Notifikasi Lisensi)
                          </label>
                          <Input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="Contoh: 081234567890"
                            className="bg-white border-border text-sm rounded-xl"
                          />
                          <p className="text-[10px] text-slate-400">
                            Nomor ini akan otomatis terisi saat Anda melakukan pemesanan baru.
                          </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-border">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsEditing(false);
                              setEditName(profile?.name || session.user.name || '');
                              setEditPhone(profile?.phone || '');
                            }}
                            className="border-border text-xs rounded-xl"
                          >
                            Batal
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={updateProfileMutation.isPending}
                            className="text-xs font-bold bg-accent hover:bg-accent-hover text-white gap-1.5 rounded-xl cursor-pointer"
                          >
                            {updateProfileMutation.isPending && (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            )}
                            <span>Simpan Perubahan</span>
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs pt-1">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-border space-y-1">
                          <span className="text-slate-400 font-semibold">Nama Lengkap</span>
                          <p className="font-bold text-navy-900 text-sm">
                            {profile?.name || session.user.name || '-'}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-border space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-semibold">Alamat Email</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                              Google
                            </span>
                          </div>
                          <p className="font-bold text-navy-900 text-sm truncate">
                            {session.user.email}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-border space-y-1">
                          <span className="text-slate-400 font-semibold">Nomor WhatsApp</span>
                          <p className="font-bold text-navy-900 text-sm">
                            {profile?.phone || 'Belum diisi'}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-border space-y-1">
                          <span className="text-slate-400 font-semibold">Status Akun</span>
                          <p className="font-bold text-status-success text-sm flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aktif & Terverifikasi</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Orders History & Subscriptions Card */}
                <Card className="border-border bg-white rounded-2xl shadow-card">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 pb-3">
                    <div className="space-y-1">
                      <CardTitle className="text-sm sm:text-base font-bold text-navy-900 flex flex-wrap items-center gap-2">
                        <span>Riwayat Transaksi & Lisensi</span>
                        {profile?.orders && profile.orders.length > 0 && (
                          <span className="text-[10px] font-bold py-0.5 px-2.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            {profile.orders.length} Transaksi
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Daftar produk digital dan lisensi yang pernah Anda beli di Asterra Store
                      </CardDescription>
                    </div>

                    <Link href="/products" className="self-start sm:self-auto shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 px-3 gap-1 border-border hover:border-accent rounded-xl text-navy-900 shrink-0"
                      >
                        <span>Belanja Lagi</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </CardHeader>

                  <CardContent className="p-6 pt-0 space-y-4">
                    {isProfileLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="w-6 h-6 text-accent animate-spin" />
                        <p className="text-xs text-slate-500 font-medium">
                          Memuat riwayat transaksi...
                        </p>
                      </div>
                    ) : profile?.orders && profile.orders.length > 0 ? (
                      <div className="space-y-3">
                        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1.5 scroll-smooth overscroll-contain">
                          {profile.orders.map((order) => (
                            <div
                              key={order.id}
                              className="p-4 rounded-xl bg-slate-50 border border-border hover:border-slate-300 transition-all space-y-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-navy-900">
                                    #{order.id.slice(0, 10).toUpperCase()}
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    • {formatDate(order.createdAt)}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {getOrderStatusBadge(order.status)}
                                </div>
                              </div>

                              {/* Order Items */}
                              <div className="space-y-2">
                                {order.items && order.items.length > 0 ? (
                                  order.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between text-xs"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                                        <div className="w-7 h-7 rounded-lg bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55] shrink-0">
                                          <Package className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="font-bold text-navy-900 truncate">
                                            {item.productName}
                                          </p>
                                          <p className="text-[10px] text-slate-500">
                                            {item.quantity} x {formatIDR(item.price)}
                                          </p>
                                        </div>
                                      </div>
                                      <span className="font-bold text-navy-900 shrink-0 text-right">
                                        {formatIDR(item.price * item.quantity)}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-slate-500">
                                    Detail item pesanan digital
                                  </p>
                                )}
                              </div>

                              {/* Footer with Total and CS Support */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-500">Total Pembayaran:</span>
                                  <span className="font-extrabold text-accent text-sm">
                                    {formatIDR(order.totalAmount)}
                                  </span>
                                </div>

                                <a
                                  href={`https://wa.me/6281234567890?text=Halo%20CS%20Asterra%20Store%2C%20saya%20ingin%20konfirmasi%20pesanan%20%23${order.id.toUpperCase()}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline font-semibold"
                                >
                                  <span>Bantuan Pesanan #{order.id.slice(0, 8).toUpperCase()}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>

                        {profile.orders.length > 2 && (
                          <p className="text-[11px] text-slate-400 text-center pt-1">
                            Menampilkan {profile.orders.length} riwayat pesanan (dapat digulir ke bawah)
                          </p>
                        )}
                      </div>
                    ) : (
                      /* Empty Orders State */
                      <div className="text-center py-10 px-4 rounded-xl border border-dashed border-border bg-slate-50 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-[rgba(201,111,85,0.08)] text-[#C96F55] flex items-center justify-center mx-auto border border-[rgba(201,111,85,0.2)]">
                          <Package className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-navy-900">
                            Belum Ada Riwayat Pesanan
                          </h4>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Anda belum pernah melakukan transaksi di Asterra Store. Jelajahi katalog aplikasi premium, streaming, dan produktivitas sekarang.
                          </p>
                        </div>
                        <Link href="/products" className="inline-block pt-1">
                          <Button size="sm" className="text-xs bg-accent hover:bg-accent-hover text-white font-bold rounded-xl cursor-pointer">
                            Jelajahi Katalog Produk
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer onNotify={showNotification} />
    </div>
  );
}
