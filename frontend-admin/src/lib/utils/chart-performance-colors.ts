/**
 * AsterraStore Dashboard Chart Performance Color Scale
 * 
 * Aturan Urutan Warna:
 * 1. Belum ada aktivitas atau nilai 0 -> Abu-abu (#9CA3AF)
 * 2. Nilai terendah yang positif -> Merah (#EF4444)
 * 3. Nilai rendah -> Oranye (#F97316)
 * 4. Nilai menengah -> Kuning (#EAB308)
 * 5. Nilai tinggi -> Hijau (#22C55E)
 */

export type PerformanceTier = 'zero' | 'lowest' | 'low' | 'medium' | 'high';

export interface PerformanceColorConfig {
  tier: PerformanceTier;
  bg: string;
  top: string;
  glow: string;
  label: string;
}

export const PERFORMANCE_COLORS: Record<PerformanceTier, PerformanceColorConfig> = {
  zero: {
    tier: 'zero',
    bg: '#9CA3AF', // Abu-abu
    top: '#6B7280',
    glow: 'rgba(156, 163, 175, 0.35)',
    label: 'Belum Ada Aktivitas',
  },
  lowest: {
    tier: 'lowest',
    bg: '#EF4444', // Merah
    top: '#DC2626',
    glow: 'rgba(239, 68, 68, 0.35)',
    label: 'Nilai Terendah',
  },
  low: {
    tier: 'low',
    bg: '#F97316', // Oranye
    top: '#EA580C',
    glow: 'rgba(249, 115, 22, 0.35)',
    label: 'Nilai Rendah',
  },
  medium: {
    tier: 'medium',
    bg: '#EAB308', // Kuning
    top: '#CA8A04',
    glow: 'rgba(234, 179, 8, 0.35)',
    label: 'Nilai Menengah',
  },
  high: {
    tier: 'high',
    bg: '#22C55E', // Hijau
    top: '#16A34A',
    glow: 'rgba(34, 197, 94, 0.35)',
    label: 'Nilai Tinggi',
  },
};

/**
 * Menentukan konfigurasi warna performa secara dinamis berdasarkan nilai aktual
 * dan perbandingannya terhadap seluruh rentang data pada periode yang aktif.
 * 
 * @param value Nilai data titik saat ini (misal revenue)
 * @param allValues Kumpulan seluruh nilai data pada grafik saat ini
 */
export function getPerformanceColor(
  value: number,
  allValues: number[] = []
): PerformanceColorConfig {
  // 1. Kondisi nilai 0, negatif, atau data belum ada aktivitas
  // Nilai nol TIDAK BOLEH diberi warna merah.
  if (typeof value !== 'number' || isNaN(value) || value <= 0) {
    return PERFORMANCE_COLORS.zero;
  }

  // 2. Kumpulkan seluruh nilai positif valid
  const positiveValues = allValues.filter(
    (v) => typeof v === 'number' && !isNaN(v) && v > 0
  );

  // Jika tidak ada nilai positif sama sekali di seluruh array data
  if (positiveValues.length === 0) {
    return PERFORMANCE_COLORS.zero;
  }

  // Urutkan nilai unik positif secara menaik (ascending)
  const uniquePositives = Array.from(new Set(positiveValues)).sort((a, b) => a - b);
  const distinctCount = uniquePositives.length;

  // 3. Kasus Khusus: Jika seluruh nilai positif sama (distinctCount === 1)
  // Menghindari pewarnaan menyesatkan (misal semua merah).
  // Karena merupakan nilai puncak positif pada periode tersebut, gunakan Hijau.
  if (distinctCount === 1) {
    return PERFORMANCE_COLORS.high;
  }

  const minPos = uniquePositives[0];
  const maxPos = uniquePositives[distinctCount - 1];

  // Nilai positif terendah MUTLAK mendapatkan warna Merah (#EF4444)
  if (value === minPos) {
    return PERFORMANCE_COLORS.lowest;
  }

  // Nilai positif tertinggi MUTLAK mendapatkan warna Hijau (#22C55E)
  if (value === maxPos) {
    return PERFORMANCE_COLORS.high;
  }

  // 4. Jika hanya ada 2 nilai unik (min dan max sudah tertangani di atas)
  // Tidak akan ada nilai yang masuk ke baris di bawah ini.

  // 5. Kasus Khusus: 3 nilai unik (min, mid, max)
  // Nilai tengah tepat dipetakan ke Kuning (Nilai Menengah)
  if (distinctCount === 3 && value === uniquePositives[1]) {
    return PERFORMANCE_COLORS.medium;
  }

  // 6. Kasus Khusus: 4 nilai unik (min, low, mid, max)
  if (distinctCount === 4) {
    if (value === uniquePositives[1]) return PERFORMANCE_COLORS.low;
    if (value === uniquePositives[2]) return PERFORMANCE_COLORS.medium;
  }

  // 7. Kasus Umum (distinctCount >= 5):
  // Menghitung skor gabungan rank percentile (50%) dan value range ratio (50%)
  const rank = uniquePositives.indexOf(value);
  const rankRatio = rank / (distinctCount - 1); // 0 .. 1
  const valRatio = (value - minPos) / (maxPos - minPos); // 0 .. 1
  const compositeScore = (rankRatio + valRatio) / 2;

  if (compositeScore < 0.20) {
    return PERFORMANCE_COLORS.lowest; // Merah
  } else if (compositeScore < 0.45) {
    return PERFORMANCE_COLORS.low; // Oranye
  } else if (compositeScore < 0.70) {
    return PERFORMANCE_COLORS.medium; // Kuning
  } else {
    return PERFORMANCE_COLORS.high; // Hijau
  }
}
