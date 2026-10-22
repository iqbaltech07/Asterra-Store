export type TargetFieldType = 'phone' | 'game' | 'email' | 'customer_id';

export interface TargetRequirement {
  type: TargetFieldType;
  label: string;
  placeholder: string;
  helper: string;
  requiresZone: boolean;
  zoneLabel: string;
  zonePlaceholder: string;
  zoneHelper: string;
}

export function getProductTargetRequirement(item?: {
  name?: string;
  category?: string;
  brand?: string;
  providerCode?: string;
}): TargetRequirement {
  const combined = `${item?.name || ''} ${item?.brand || ''} ${item?.category || ''} ${item?.providerCode || ''}`.toLowerCase();

  // 1. Phone number targets (CapCut, Pulsa, Telkomsel, Tri, XL, E-Wallets, Telegram, etc.)
  const phoneKeywords = [
    'capcut', 'pulsa', 'telkomsel', 'tsel', 'indosat', 'isat', 'tri', 'three',
    'xl', 'axis', 'smartfren', 'dana', 'gopay', 'ovo', 'shopeepay', 'linkaja',
    'kuota', 'paket data', 'whatsapp', 'telegram'
  ];
  if (phoneKeywords.some((k) => combined.includes(k))) {
    return {
      type: 'phone',
      label: 'Nomor WhatsApp / HP Anda (Data Tujuan VIP Reseller) *',
      placeholder: 'Masukan Nomor (contoh: 081234567890)',
      helper: 'Masukan nomor Anda. Akun akan dikirim melalui Riwayat Pesanan dan jangan lupa untuk membaca ketentuan.',
      requiresZone: false,
      zoneLabel: '',
      zonePlaceholder: '',
      zoneHelper: '',
    };
  }

  // 2. Customer ID / Meter targets (PLN, PDAM, TV Kabel)
  const customerIdKeywords = [
    'pln', 'token pln', 'pdam', 'bpjs', 'k-vision', 'kvision',
    'nex parabola', 'orange tv', 'smc id'
  ];
  if (customerIdKeywords.some((k) => combined.includes(k))) {
    return {
      type: 'customer_id',
      label: 'Nomor Pelanggan / No. Meter / SMC ID *',
      placeholder: 'contoh: 14205819230',
      helper: 'Masukan nomor meter atau ID pelanggan tujuan pengisian.',
      requiresZone: false,
      zoneLabel: '',
      zonePlaceholder: '',
      zoneHelper: '',
    };
  }

  // 3. Games with Server / Zone ID
  const zoneGameKeywords = [
    'mobile legends', 'mlbb', 'lifeafter', 'ragnarok', 'genshin', 'honkai', 'zenless'
  ];
  if (zoneGameKeywords.some((k) => combined.includes(k))) {
    return {
      type: 'game',
      label: 'User ID Game *',
      placeholder: 'contoh: 136216325',
      helper: 'Masukan User ID akun game tujuan top-up.',
      requiresZone: true,
      zoneLabel: 'Server / Zone ID *',
      zonePlaceholder: 'contoh: 2685',
      zoneHelper: 'Server atau Zone ID akun game Anda.',
    };
  }

  // 4. Games without Server / Zone ID
  const noZoneGameKeywords = [
    'free fire', 'ff', 'valorant', 'pubg', 'point blank', 'codm',
    'call of duty', 'honor of kings', 'hok', 'arena of valor', 'aov'
  ];
  if (noZoneGameKeywords.some((k) => combined.includes(k))) {
    return {
      type: 'game',
      label: 'User ID Game *',
      placeholder: 'contoh: 849201948',
      helper: 'Masukan User ID akun game Anda.',
      requiresZone: false,
      zoneLabel: '',
      zonePlaceholder: '',
      zoneHelper: '',
    };
  }

  // 5. Default: Email-based activation (YouTube, Spotify, Canva, Netflix, etc.)
  return {
    type: 'email',
    label: 'Email Akun Tujuan Aktivasi *',
    placeholder: 'contoh: akun_anda@gmail.com',
    helper: 'Undangan atau akses lisensi premium akan dikaitkan ke email ini.',
    requiresZone: false,
    zoneLabel: '',
    zonePlaceholder: '',
    zoneHelper: '',
  };
}
