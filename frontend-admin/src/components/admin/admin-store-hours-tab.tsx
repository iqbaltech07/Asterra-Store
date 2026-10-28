'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faStore,
  faDoorOpen,
  faDoorClosed,
  faFloppyDisk,
  faArrowsRotate,
  faCircleCheck,
  faTriangleExclamation,
  faCalendarDay,
  faMoon,
  faSun,
  faCartShopping,
  faWrench,
  faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  StoreHoursApi,
  WeeklySchedule,
  WeeklyScheduleDay,
  StoreOperatingHoursStatus,
} from '@/lib/api-client';

interface AdminStoreHoursTabProps {
  onNotify?: (msg: string) => void;
}

const DAYS_ORDER = [
  { key: 'monday', label: 'Senin' },
  { key: 'tuesday', label: 'Selasa' },
  { key: 'wednesday', label: 'Rabu' },
  { key: 'thursday', label: 'Kamis' },
  { key: 'friday', label: 'Jumat' },
  { key: 'saturday', label: 'Sabtu' },
  { key: 'sunday', label: 'Minggu' },
];

const DEFAULT_SCHEDULE: WeeklySchedule = {
  monday: { is_open: true, open_time: '09:00', close_time: '23:00' },
  tuesday: { is_open: true, open_time: '09:00', close_time: '23:00' },
  wednesday: { is_open: true, open_time: '09:00', close_time: '23:00' },
  thursday: { is_open: true, open_time: '09:00', close_time: '23:00' },
  friday: { is_open: true, open_time: '09:00', close_time: '23:00' },
  saturday: { is_open: true, open_time: '09:00', close_time: '23:00' },
  sunday: { is_open: true, open_time: '09:00', close_time: '23:00' },
};

export function AdminStoreHoursTab({ onNotify }: AdminStoreHoursTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [liveStatus, setLiveStatus] = useState<StoreOperatingHoursStatus | null>(null);

  // Form states
  const [mode, setMode] = useState<'auto' | 'manual_open' | 'manual_closed'>('auto');
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(DEFAULT_SCHEDULE);
  const [manualCloseReason, setManualCloseReason] = useState('');
  const [reopenEstimate, setReopenEstimate] = useState('');
  const [allowPreorder, setAllowPreorder] = useState(true);
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState('');

  // Fetch initial config from backend
  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await StoreHoursApi.getAdminConfig();
      if (res.success && res.data) {
        const { config, status } = res.data;
        setMode(config.mode || 'auto');
        if (config.weeklySchedule) {
          setWeeklySchedule({ ...DEFAULT_SCHEDULE, ...config.weeklySchedule });
        }
        setManualCloseReason(config.manualCloseReason || '');
        setReopenEstimate(config.reopenEstimate || '');
        setAllowPreorder(config.allowPreorder ?? true);
        setLiveStatus(status);
      }
    } catch (err: any) {
      console.error('Failed to load store operating hours config:', err);
      onNotify?.('Gagal memuat pengaturan jam operasional toko.');
    } finally {
      setIsLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Live WIB clock updater
  useEffect(() => {
    const updateWibClock = () => {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        setCurrentTimeDisplay(`${formatter.format(now)} WIB`);
      } catch {
        setCurrentTimeDisplay(new Date().toLocaleTimeString('id-ID'));
      }
    };

    updateWibClock();
    const interval = setInterval(updateWibClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update schedule day helper
  const handleUpdateDay = (dayKey: string, field: keyof WeeklyScheduleDay, value: any) => {
    setWeeklySchedule((prev) => {
      const current = prev[dayKey] || DEFAULT_SCHEDULE[dayKey];
      return {
        ...prev,
        [dayKey]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  // Preset Handlers
  const applyPreset = (preset: 'standard' | '24hours' | 'office') => {
    const updated: WeeklySchedule = {};
    DAYS_ORDER.forEach(({ key }) => {
      if (preset === 'standard') {
        updated[key] = { is_open: true, open_time: '09:00', close_time: '23:00' };
      } else if (preset === '24hours') {
        updated[key] = { is_open: true, open_time: '00:00', close_time: '23:59' };
      } else if (preset === 'office') {
        const isWeekend = key === 'saturday' || key === 'sunday';
        updated[key] = { is_open: !isWeekend, open_time: '08:00', close_time: '17:00' };
      }
    });
    setWeeklySchedule(updated);
    onNotify?.(`Preset ${preset} berhasil diterapkan ke formulir. Klik Simpan untuk memperbarui database.`);
  };

  // Save handler
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        mode,
        weeklySchedule,
        manualCloseReason: manualCloseReason.trim() || null,
        reopenEstimate: reopenEstimate.trim() || null,
        allowPreorder,
      };

      const res = await StoreHoursApi.updateConfig(payload);
      if (res.success && res.data) {
        setLiveStatus(res.data.status);
        onNotify?.('Pengaturan jam operasional toko berhasil disimpan ke database!');
      } else {
        onNotify?.(res.message || 'Gagal menyimpan pengaturan.');
      }
    } catch (err: any) {
      console.error('Error saving store operating hours:', err);
      onNotify?.(err.message || 'Terjadi kesalahan saat menyimpan pengaturan jam operasional.');
    } finally {
      setIsSaving(false);
    }
  };

  const isStoreCurrentlyOpen = liveStatus?.isOpen ?? false;

  return (
    <div className="space-y-6">
      {/* 1. Header with Live WIB Status */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faStore} className="w-3 h-3" />
              <span>Jam Operasional Toko</span>
            </span>
            <span className="text-[11px] text-foreground-muted">Zona Waktu: Asia/Jakarta (WIB)</span>
          </div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Pengaturan Status Operasional & Pre-Order Toko
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Kontrol status buka/tutup toko, jadwal mingguan, proteksi checkout normal, dan pesan banner otomatis saat tutup.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={loadConfig}
            disabled={isLoading || isSaving}
            className="text-xs border-border h-9 gap-1.5"
          >
            <FontAwesomeIcon icon={faArrowsRotate} className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="text-xs gap-1.5 h-9 px-4 font-semibold shadow-xs bg-primary hover:bg-primary-hover text-white"
          >
            <FontAwesomeIcon icon={faFloppyDisk} className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </Button>
        </div>
      </div>

      {/* 2. Live Operational Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Aktif */}
        <div className={`border rounded-xl p-4 shadow-2xs flex items-center gap-3.5 transition-colors ${
          isStoreCurrentlyOpen
            ? 'bg-status-success/5 border-status-success/30'
            : 'bg-status-error/5 border-status-error/30'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs ${
            isStoreCurrentlyOpen ? 'bg-[#16A34A]' : 'bg-[#DC2626]'
          }`}>
            <FontAwesomeIcon
              icon={isStoreCurrentlyOpen ? faDoorOpen : faDoorClosed}
              className="w-5 h-5"
            />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-semibold text-foreground-muted tracking-wider block">
              Status Operasional Saat Ini
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-base font-bold tracking-tight ${
                isStoreCurrentlyOpen ? 'text-[#16A34A]' : 'text-[#DC2626]'
              }`}>
                {isStoreCurrentlyOpen ? 'TOKO SEDANG BUKA' : 'TOKO SEDANG TUTUP'}
              </span>
            </div>
            <span className="text-[11px] text-foreground-muted block truncate mt-0.5">
              Mode: {mode === 'auto' ? 'Otomatis (Jadwal)' : mode === 'manual_open' ? 'Override Buka' : 'Override Tutup'}
            </span>
          </div>
        </div>

        {/* Jadwal Buka / Tutup Berikutnya */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faClock} className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-semibold text-foreground-muted tracking-wider block">
              {isStoreCurrentlyOpen ? 'Operasional Hingga' : 'Buka Kembali Pada'}
            </span>
            <span className="text-sm font-bold text-foreground block mt-0.5 truncate">
              {isStoreCurrentlyOpen
                ? liveStatus?.nextCloseDisplay || 'Sesuai Jadwal'
                : liveStatus?.nextOpenDisplay || liveStatus?.next_open_display || 'Belum Ditentukan'}
            </span>
            <span className="text-[11px] text-foreground-muted block truncate mt-0.5">
              {isStoreCurrentlyOpen ? 'Checkout normal aktif' : 'Mode Pre-Order aktif'}
            </span>
          </div>
        </div>

        {/* Waktu Server WIB */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-surface-raised border border-border text-foreground-muted flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faCalendarDay} className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-semibold text-foreground-muted tracking-wider block">
              Waktu Server (Asia/Jakarta)
            </span>
            <span className="text-sm font-bold font-mono text-foreground block mt-0.5">
              {currentTimeDisplay || 'Memuat waktu...'}
            </span>
            <span className="text-[11px] text-foreground-muted block mt-0.5">
              Hari: {liveStatus?.currentDayID || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Operational Mode Selector (3-Way Override) */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <FontAwesomeIcon icon={faWrench} className="w-3.5 h-3.5 text-primary" />
            <span>Kontrol Operasional Toko (Mode Override)</span>
          </h3>
          <p className="text-[11px] text-foreground-muted mt-0.5">
            Pilih apakah toko beroperasi otomatis berdasarkan jadwal mingguan atau diatur manual sementara.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Option 1: Auto Schedule */}
          <button
            type="button"
            onClick={() => setMode('auto')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              mode === 'auto'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-surface-raised hover:border-foreground-muted/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5 text-primary" />
                <span>Otomatis (Ikuti Jadwal)</span>
              </span>
              {mode === 'auto' && (
                <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5 text-primary" />
              )}
            </div>
            <p className="text-[11px] text-foreground-muted">
              Toko membuka & menutup otomatis sesuai jam operasional harian yang ditentukan di bawah.
            </p>
          </button>

          {/* Option 2: Manual Open */}
          <button
            type="button"
            onClick={() => setMode('manual_open')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              mode === 'manual_open'
                ? 'border-[#16A34A] bg-[#16A34A]/5 ring-1 ring-[#16A34A]'
                : 'border-border bg-surface-raised hover:border-foreground-muted/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-[#16A34A] flex items-center gap-1.5">
                <FontAwesomeIcon icon={faDoorOpen} className="w-3.5 h-3.5" />
                <span>Buka Manual (Paksa Buka)</span>
              </span>
              {mode === 'manual_open' && (
                <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5 text-[#16A34A]" />
              )}
            </div>
            <p className="text-[11px] text-foreground-muted">
              Paksa toko berstatus BUKA sekarang, mengabaikan jam tutup atau hari libur mingguan.
            </p>
          </button>

          {/* Option 3: Manual Closed */}
          <button
            type="button"
            onClick={() => setMode('manual_closed')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              mode === 'manual_closed'
                ? 'border-[#DC2626] bg-[#DC2626]/5 ring-1 ring-[#DC2626]'
                : 'border-border bg-surface-raised hover:border-foreground-muted/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-[#DC2626] flex items-center gap-1.5">
                <FontAwesomeIcon icon={faDoorClosed} className="w-3.5 h-3.5" />
                <span>Tutup Manual (Paksa Tutup)</span>
              </span>
              {mode === 'manual_closed' && (
                <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5 text-[#DC2626]" />
              )}
            </div>
            <p className="text-[11px] text-foreground-muted">
              Paksa toko berstatus TUTUP sekarang (misal: libur mendadak, restock besar, atau perbaikan).
            </p>
          </button>
        </div>

        {/* Additional Fields when Manual Closed is Selected */}
        {mode === 'manual_closed' && (
          <div className="p-4 bg-status-error/5 border border-status-error/20 rounded-xl space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#DC2626]">
              <FontAwesomeIcon icon={faTriangleExclamation} className="w-3.5 h-3.5" />
              <span>Detail Penutupan Manual Toko</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Alasan Penutupan (Ditampilkan ke Pembeli)
                </label>
                <Input
                  value={manualCloseReason}
                  onChange={(e) => setManualCloseReason(e.target.value)}
                  placeholder="Contoh: Sedang dalam pemeliharaan sistem server berkala."
                  className="bg-surface border-border text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Estimasi Buka Kembali (Opsional)
                </label>
                <Input
                  value={reopenEstimate}
                  onChange={(e) => setReopenEstimate(e.target.value)}
                  placeholder="Contoh: Pukul 13:00 WIB atau Besok Pagi"
                  className="bg-surface border-border text-xs"
                />
                <span className="text-[10px] text-foreground-muted mt-1 block">
                  Jika dikosongkan, sistem akan otomatis merujuk ke jadwal buka mingguan berikutnya.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Weekly Operating Schedule Table */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5 text-primary" />
              <span>Jadwal Operasional Mingguan</span>
            </h3>
            <p className="text-[11px] text-foreground-muted mt-0.5">
              Tentukan jam buka dan jam tutup untuk setiap hari dalam seminggu. Mendukung shift yang melewati tengah malam (misal 18:00 - 02:00).
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-foreground-muted font-medium mr-1">Preset Cepat:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset('standard')}
              className="text-[11px] h-7 px-2.5 border-border"
            >
              09:00 - 23:00
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset('24hours')}
              className="text-[11px] h-7 px-2.5 border-border"
            >
              24 Jam
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset('office')}
              className="text-[11px] h-7 px-2.5 border-border"
            >
              Jam Kerja (08:00 - 17:00)
            </Button>
          </div>
        </div>

        {/* Days Grid / Table */}
        <div className="space-y-2">
          {DAYS_ORDER.map(({ key, label }) => {
            const dayConfig = weeklySchedule[key] || DEFAULT_SCHEDULE[key];
            const isOpen = dayConfig.is_open;
            const openTime = dayConfig.open_time || '09:00';
            const closeTime = dayConfig.close_time || '23:00';

            const isMidnightCrossing = isOpen && closeTime <= openTime;

            return (
              <div
                key={key}
                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isOpen
                    ? 'bg-surface-raised border-border'
                    : 'bg-surface-raised/40 border-border/50 opacity-60'
                }`}
              >
                {/* Day Name & Toggle */}
                <div className="flex items-center gap-3 sm:w-44">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOpen}
                      onChange={(e) => handleUpdateDay(key, 'is_open', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <div>
                    <span className="font-bold text-xs text-foreground block">{label}</span>
                    <span className="text-[10px] text-foreground-muted block">
                      {isOpen ? 'Operasional Buka' : 'Libur (Tutup)'}
                    </span>
                  </div>
                </div>

                {/* Time Inputs */}
                {isOpen ? (
                  <div className="flex items-center gap-2 flex-1 justify-start sm:justify-end">
                    <div className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faSun} className="w-3 h-3 text-[#EAB308]" />
                      <span className="text-[11px] text-foreground-muted font-medium">Buka:</span>
                      <Input
                        type="time"
                        value={openTime}
                        onChange={(e) => handleUpdateDay(key, 'open_time', e.target.value)}
                        className="w-24 h-8 bg-surface border-border text-xs font-mono"
                      />
                    </div>

                    <span className="text-foreground-muted text-xs mx-1">–</span>

                    <div className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faMoon} className="w-3 h-3 text-[#6366F1]" />
                      <span className="text-[11px] text-foreground-muted font-medium">Tutup:</span>
                      <Input
                        type="time"
                        value={closeTime}
                        onChange={(e) => handleUpdateDay(key, 'close_time', e.target.value)}
                        className="w-24 h-8 bg-surface border-border text-xs font-mono"
                      />
                    </div>

                    {isMidnightCrossing && (
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 shrink-0 hidden md:inline-flex">
                        🌙 Melewati Tengah Malam
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 text-left sm:text-right text-xs text-foreground-muted italic">
                    Toko ditutup seharian pada hari {label}. Pengguna diarahkan ke Pre-Order.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Pre-Order & Checkout Protection Rules */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <FontAwesomeIcon icon={faCartShopping} className="w-3.5 h-3.5 text-primary" />
            <span>Kebijakan Pre-Order Saat Toko Tutup</span>
          </h3>
          <p className="text-[11px] text-foreground-muted mt-0.5">
            Atur apakah pembeli diizinkan melakukan pemesanan terjadwal (Pre-Order) ketika toko sedang berada di luar jam operasional.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-raised border border-border flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="font-bold text-xs text-foreground block">
              Izinkan Pre-Order Saat Toko Tutup
            </span>
            <p className="text-[11px] text-foreground-muted max-w-xl">
              Ketika aktif, tombol Beli Sekarang di etalase berubah menjadi &ldquo;Pre Order&rdquo;. Pesanan dicatat di sistem dan dijadwalkan diproses segera setelah toko buka kembali.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={allowPreorder}
              onChange={(e) => setAllowPreorder(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Protection Explanatory Box */}
        <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15 flex items-start gap-3 text-xs text-foreground">
          <FontAwesomeIcon icon={faCircleInfo} className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-[11px] text-foreground-muted leading-relaxed">
            <span className="font-semibold text-foreground block">Proteksi Otomatis Halaman Checkout:</span>
            <span>
              Ketika status toko Tutup, seluruh akses URL langsung ke <code>/checkout</code> normal dan request API <code>POST /orders</code> reguler ditolak secara otomatis oleh backend. Hanya alur Pre-Order yang diizinkan untuk melindungi komitmen kepuasan pelanggan dan mencegah klaim instan saat staf tidak bertugas.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

