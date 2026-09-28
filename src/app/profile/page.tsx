'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession, signOut, signIn } from '@/lib/auth-client';
import { useAuthStore } from '@/store/use-auth-store';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Fetch full profile & orders from authenticated API
  const {
    data: profileData,
    isLoading: isProfileLoading,
    refetch,
  } = useQuery<ProfileApiResponse>({
    queryKey: ['userProfile', session?.user?.id],
    queryFn: async () => {
      const res = await fetch('/api/v1/users/profile');
      if (!res.ok) {
        throw new Error('Gagal memuat profil pengguna.');
      }
      return res.json();
    },
    enabled: !!session?.user,
  });

  const profile = profileData?.data;

  useEffect(() => {
    if (profile) {
      setEditName(profile.name || '');
      setEditPhone(profile.phone || '');
    } else if (session?.user) {
      setEditName(session.user.name || '');
    }
  }, [profile, session]);

  // Mutation to update profile
  const updateProfileMutation = useMutation({
    mutationFn: async ({ name, phone }: { name: string; phone: string }) => {
      const res = await fetch('/api/v1/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal memperbarui profil.');
      }
      return res.json();
    },
    onSuccess: () => {
      showNotification('Profil berhasil disimpan dan diperbarui.');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      refetch();
    },
    onError: (err: Error) => {
      showNotification(err.message || 'Terjadi kesalahan saat menyimpan data.');
    },
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showNotification('Nama tidak boleh kosong.');
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
      // Ignore network errors on logout
    }
    legacyLogout();
    showNotification('Anda telah berhasil keluar dari akun.');
    setTimeout(() => {
      router.push('/');
    }, 600);
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
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
          <Badge variant="success" className="text-[11px] gap-1 py-0.5">
            <CheckCircle2 className="w-3 h-3 text-status-success" />
            <span>Lunas & Selesai</span>
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" className="text-[11px] gap-1 py-0.5 text-primary border-primary/30 bg-primary/10">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Sedang Diproses</span>
          </Badge>
        );
      case 'verified':
        return (
          <Badge variant="secondary" className="text-[11px] gap-1 py-0.5 text-sky-500 border-sky-500/30 bg-sky-500/10">
            <CheckCircle2 className="w-3 h-3 text-sky-500" />
            <span>Pembayaran Terverifikasi</span>
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="text-[11px] gap-1 py-0.5 text-status-warning border-status-warning/30 bg-status-warning/10">
            <Clock className="w-3 h-3 text-status-warning" />
            <span>Menunggu Pembayaran</span>
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="text-[11px] text-foreground-muted border-border">
            Dibatalkan
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[11px] capitalize">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-raised border border-primary/30 text-foreground px-4 py-3 rounded-card shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Header */}
      <Header onNotify={showNotification} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* Loading State */}
        {isAuthPending ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-9 h-9 text-primary animate-spin" />
            <p className="text-sm text-foreground-muted font-medium">
              Memeriksa autentikasi akun Google...
            </p>
          </div>
        ) : !session?.user ? (
          /* Unauthenticated State */
          <div className="max-w-md mx-auto py-16 text-center">
            <div className="p-8 rounded-card bg-surface border border-border shadow-xs space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mx-auto flex items-center justify-center text-primary">
                <UserIcon className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Akses Profil Pelanggan
                </h1>
                <p className="text-xs text-foreground-muted leading-relaxed">
                  Silakan masuk menggunakan akun Google Anda untuk mengakses informasi lisensi, profil pengguna, dan riwayat pesanan Asterra Store.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full gap-2.5 h-11 bg-primary text-white hover:bg-primary/90 font-medium"
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
                  <Button variant="outline" className="w-full text-xs border-border">
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2 text-xs text-foreground-muted mb-1">
                  <Link href="/" className="hover:text-foreground transition-colors">
                    Beranda
                  </Link>
                  <span>/</span>
                  <span className="text-foreground font-medium">Profil Pengguna</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Profil Pelanggan
                </h1>
                <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
                  Kelola kredensial akun, identitas pemesan, dan riwayat lisensi produk digital Anda
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2 text-status-error hover:bg-status-error/10 hover:border-status-error/30 border-border text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar Akun</span>
                </Button>
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Profile Card, Security & CS Help */}
              <div className="space-y-6 lg:col-span-1">
                {/* User ID Card */}
                <Card className="border-border bg-surface shadow-xs">
                  <CardHeader className="text-center pb-4">
                    <div className="relative mx-auto mb-3">
                      {session.user.image ? (
                        <img
                          src={session.user.image}
                          alt={session.user.name || 'User Profile'}
                          className="w-24 h-24 rounded-2xl object-cover ring-2 ring-primary/40 shadow-sm mx-auto"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-primary/10 border-2 border-primary/30 mx-auto flex items-center justify-center text-primary text-3xl font-bold shadow-inner">
                          {session.user.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-1 bg-surface-raised border border-border p-1.5 rounded-full shadow-xs">
                        <ShieldCheck className="w-4 h-4 text-status-success" />
                      </div>
                    </div>

                    <CardTitle className="text-lg font-bold text-foreground">
                      {profile?.name || session.user.name || 'Pelanggan Asterra'}
                    </CardTitle>
                    <CardDescription className="text-xs text-foreground-muted flex items-center justify-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" />
                      <span>{session.user.email}</span>
                    </CardDescription>

                    <div className="pt-3 flex flex-wrap items-center justify-center gap-1.5">
                      <Badge variant="success" className="text-[10px] gap-1 py-0.5">
                        <CheckCircle2 className="w-3 h-3 text-status-success" />
                        <span>Google SSO Terverifikasi</span>
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] py-0.5">
                        Member Asterra
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-3 text-xs border-t border-border">
                    <div className="flex items-center justify-between text-foreground-muted">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>Bergabung Sejak</span>
                      </div>
                      <span className="font-medium text-foreground">
                        {formatDate(profile?.createdAt || session.user.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-foreground-muted">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-3.5 h-3.5 text-primary" />
                        <span>Peran Akun</span>
                      </div>
                      <span className="font-medium text-foreground capitalize">
                        {profile?.role || 'Pelanggan'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-foreground-muted">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>Metode Masuk</span>
                      </div>
                      <span className="font-medium text-foreground">
                        Google OAuth 2.0
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* CS Assistance Card */}
                <div className="p-4 rounded-card bg-surface-raised border border-border space-y-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-foreground">
                        Layanan Bantuan 24/7
                      </h4>
                      <p className="text-[11px] text-foreground-muted">
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
                      className="w-full text-xs gap-1.5 border-border hover:border-primary/50 text-foreground"
                    >
                      <span>Hubungi CS via WhatsApp</span>
                      <ExternalLink className="w-3 h-3 text-foreground-muted" />
                    </Button>
                  </a>
                </div>
              </div>

              {/* Right Column: Stats, Account Form & Order History */}
              <div className="space-y-6 lg:col-span-2">
                {/* Stats Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-card bg-surface border border-border shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground-muted font-medium">Total Pesanan</span>
                      <ShoppingBag className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {isProfileLoading ? '-' : profile?.stats.totalOrders ?? 0}
                    </p>
                    <span className="text-[10px] text-foreground-muted">
                      Transaksi terdaftar
                    </span>
                  </div>

                  <div className="p-4 rounded-card bg-surface border border-border shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground-muted font-medium">Pesanan Selesai</span>
                      <CheckCircle2 className="w-4 h-4 text-status-success" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {isProfileLoading ? '-' : profile?.stats.completedOrders ?? 0}
                    </p>
                    <span className="text-[10px] text-foreground-muted">
                      Lisensi aktif & terkirim
                    </span>
                  </div>

                  <div className="p-4 rounded-card bg-surface border border-border shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground-muted font-medium">Menunggu Bayar</span>
                      <Clock className="w-4 h-4 text-status-warning" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {isProfileLoading ? '-' : profile?.stats.pendingOrders ?? 0}
                    </p>
                    <span className="text-[10px] text-foreground-muted">
                      Belum diselesaikan
                    </span>
                  </div>
                </div>

                {/* Account Details & Inline Edit Card */}
                <Card className="border-border bg-surface shadow-xs">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-base font-semibold">Informasi Akun</CardTitle>
                      <CardDescription className="text-xs">
                        Data pemesan yang akan digunakan saat proses checkout dan pengiriman lisensi
                      </CardDescription>
                    </div>

                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="gap-1.5 text-xs border-border hover:border-primary/40"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-primary" />
                        <span>Ubah Data</span>
                      </Button>
                    )}
                  </CardHeader>

                  <CardContent>
                    {isEditing ? (
                      <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-foreground-muted">
                            Nama Lengkap
                          </label>
                          <Input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Masukkan nama lengkap Anda"
                            className="bg-surface-raised border-border text-sm"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-foreground-muted">
                            Nomor WhatsApp (Untuk Notifikasi Lisensi)
                          </label>
                          <Input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="Contoh: 081234567890"
                            className="bg-surface-raised border-border text-sm"
                          />
                          <p className="text-[10px] text-foreground-muted">
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
                            className="border-border text-xs"
                          >
                            Batal
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={updateProfileMutation.isPending}
                            className="text-xs font-medium bg-primary text-white hover:bg-primary/90 gap-1.5"
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
                        <div className="p-3.5 rounded-lg bg-surface-raised border border-border space-y-1">
                          <span className="text-foreground-muted font-medium">Nama Lengkap</span>
                          <p className="font-semibold text-foreground text-sm">
                            {profile?.name || session.user.name || '-'}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-lg bg-surface-raised border border-border space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-foreground-muted font-medium">Alamat Email</span>
                            <Badge variant="outline" className="text-[10px] py-0">
                              Google
                            </Badge>
                          </div>
                          <p className="font-semibold text-foreground text-sm truncate">
                            {session.user.email}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-lg bg-surface-raised border border-border space-y-1">
                          <span className="text-foreground-muted font-medium">Nomor WhatsApp</span>
                          <p className="font-semibold text-foreground text-sm">
                            {profile?.phone || 'Belum diisi'}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-lg bg-surface-raised border border-border space-y-1">
                          <span className="text-foreground-muted font-medium">Status Akun</span>
                          <p className="font-semibold text-status-success text-sm flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aktif & Terverifikasi</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Orders History & Subscriptions Card */}
                <Card className="border-border bg-surface shadow-xs">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <span>Riwayat Transaksi & Lisensi</span>
                        {profile?.orders && profile.orders.length > 0 && (
                          <Badge variant="outline" className="text-[10px] font-mono py-0 px-2 text-foreground-muted border-border">
                            {profile.orders.length} Transaksi
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Daftar produk digital dan lisensi yang pernah Anda beli di Asterra Store
                      </CardDescription>
                    </div>

                    <Link href="/products">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1 border-border hover:border-primary/40"
                      >
                        <span>Belanja Lagi</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {isProfileLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        <p className="text-xs text-foreground-muted font-medium">
                          Memuat riwayat transaksi...
                        </p>
                      </div>
                    ) : profile?.orders && profile.orders.length > 0 ? (
                      <div className="space-y-3">
                        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1.5 scroll-smooth overscroll-contain">
                          {profile.orders.map((order) => (
                          <div
                            key={order.id}
                            className="p-4 rounded-xl bg-surface-raised border border-border hover:border-primary/30 transition-all space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-foreground">
                                  #{order.id.slice(0, 10).toUpperCase()}
                                </span>
                                <span className="text-[11px] text-foreground-muted">
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
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                        <Package className="w-3.5 h-3.5" />
                                      </div>
                                      <div>
                                        <p className="font-semibold text-foreground">
                                          {item.productName}
                                        </p>
                                        <p className="text-[10px] text-foreground-muted">
                                          {item.quantity} x {formatIDR(item.price)}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="font-medium text-foreground">
                                      {formatIDR(item.price * item.quantity)}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-foreground-muted">
                                  Detail item pesanan digital
                                </p>
                              )}
                            </div>

                            {/* Footer with Total and CS Support */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="text-foreground-muted">Total Pembayaran:</span>
                                <span className="font-bold text-primary text-sm">
                                  {formatIDR(order.totalAmount)}
                                </span>
                              </div>

                              <a
                                href={`https://wa.me/6281234567890?text=Halo%20CS%20Asterra%20Store%2C%20saya%20ingin%20konfirmasi%20pesanan%20%23${order.id.toUpperCase()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                              >
                                <span>Bantuan Pesanan #{order.id.slice(0, 6)}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                        </div>

                        {profile.orders.length > 2 && (
                          <p className="text-[11px] text-foreground-muted text-center pt-1">
                            Menampilkan {profile.orders.length} riwayat pesanan (dapat digulir ke bawah)
                          </p>
                        )}
                      </div>
                    ) : (
                      /* Empty Orders State */
                      <div className="text-center py-10 px-4 rounded-xl border border-dashed border-border/80 bg-surface-raised space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                          <Package className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm text-foreground">
                            Belum Ada Riwayat Pesanan
                          </h4>
                          <p className="text-xs text-foreground-muted max-w-sm mx-auto">
                            Anda belum pernah melakukan transaksi di Asterra Store. Jelajahi katalog aplikasi premium, streaming, dan produktivitas sekarang.
                          </p>
                        </div>
                        <Link href="/products" className="inline-block pt-1">
                          <Button size="sm" className="text-xs bg-primary text-white hover:bg-primary/90 font-medium">
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
