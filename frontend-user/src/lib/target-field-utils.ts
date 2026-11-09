import { z } from 'zod';

export type TargetFieldType = 'phone' | 'game' | 'email' | 'customer_id' | 'choice' | 'none' | 'custom';

export interface TargetRequirement {
  type: TargetFieldType;
  label: string;
  placeholder: string;
  helper: string;
  validLabel?: string;
  requiresZone?: boolean;
  zoneLabel?: string;
  zonePlaceholder?: string;
  zoneHelper?: string;
  options?: string[]; // e.g. ['whatsapp', 'gmail']
  defaultOption?: string; // 'whatsapp' | 'gmail'
  fields?: {
    whatsapp?: { label: string; placeholder: string; helper: string };
    gmail?: { label: string; placeholder: string; helper: string };
    [key: string]: any;
  };
  required?: boolean;
  needsReview?: boolean;
}

export interface TargetValidationResult {
  isValid: boolean;
  isEmpty: boolean;
  error?: string;
  successMessage?: string;
}

// -------------------------------------------------------------
// ZOD SCHEMAS FOR TARGET DATA & CONTACT INPUTS
// -------------------------------------------------------------

export const targetPhoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s\-]/g, ''))
  .pipe(
    z
      .string()
      .min(1, 'Nomor HP/WhatsApp tujuan wajib diisi')
      .regex(
        /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/,
        'Nomor tidak valid. Gunakan awalan 08 / +628 (10-14 digit)'
      )
  );

export const targetEmailSchema = z
  .string()
  .trim()
  .min(1, 'Email tujuan aktivasi wajib diisi')
  .email('Format email tidak valid (contoh: akun@gmail.com)')
  .regex(
    /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/,
    'Domain email harus lengkap (contoh: @gmail.com)'
  );

export const targetGameIdSchema = z
  .string()
  .trim()
  .min(1, 'User ID game wajib diisi')
  .min(3, 'User ID minimal 3 karakter')
  .max(32, 'User ID maksimal 32 karakter')
  .regex(/^[a-zA-Z0-9_\-\.#]+$/, 'User ID mengandung karakter tidak valid');

export const targetZoneIdSchema = z
  .string()
  .trim()
  .min(1, 'Server / Zone ID wajib diisi')
  .min(2, 'Zone ID minimal 2 karakter/angka')
  .max(12, 'Zone ID maksimal 12 karakter/angka')
  .regex(/^[a-zA-Z0-9()\-]+$/, 'Zone ID mengandung karakter tidak valid');

export const targetCustomerIdSchema = z
  .string()
  .trim()
  .min(1, 'Nomor Pelanggan/Meter wajib diisi')
  .regex(/^[0-9]{6,25}$/, 'Nomor Pelanggan/Meter harus berupa 6-25 digit angka');

export const customerEmailSchema = z
  .string()
  .trim()
  .min(1, 'Email kontak pemesan wajib diisi')
  .email('Format email pemesan tidak valid')
  .regex(/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/, 'Domain email harus lengkap (contoh: @gmail.com)');

export const customerPhoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s\-]/g, ''))
  .pipe(
    z
      .string()
      .min(1, 'Nomor WhatsApp pemesan wajib diisi')
      .regex(
        /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/,
        'Nomor WhatsApp kontak tidak valid (contoh: 081234567890)'
      )
  );

// -------------------------------------------------------------
// VALIDATION HELPERS
// -------------------------------------------------------------

export function validateTargetValue(type: TargetFieldType, value: string, choiceMethod?: string): TargetValidationResult {
  if (type === 'none') {
    return {
      isValid: true,
      isEmpty: false,
      successMessage: 'Tidak memerlukan input tambahan',
    };
  }

  const trimmed = (value || '').trim();
  if (!trimmed) {
    return {
      isValid: false,
      isEmpty: true,
      error: 'Data tujuan pemesanan wajib diisi.',
    };
  }

  let schema;
  let successMessage = 'Format valid';

  if (type === 'choice') {
    if (choiceMethod === 'gmail') {
      schema = targetEmailSchema;
      successMessage = 'Format Gmail penerima valid';
    } else {
      schema = targetPhoneSchema;
      successMessage = 'Nomor WhatsApp penerima valid';
    }
  } else {
    switch (type) {
      case 'phone':
        schema = targetPhoneSchema;
        successMessage = 'Nomor WhatsApp / HP valid';
        break;
      case 'email':
        schema = targetEmailSchema;
        successMessage = 'Format email tujuan valid';
        break;
      case 'customer_id':
        schema = targetCustomerIdSchema;
        successMessage = 'Format nomor pelanggan valid';
        break;
      case 'game':
        schema = targetGameIdSchema;
        successMessage = 'Format User ID game valid';
        break;
      default:
        schema = z.string().trim().min(2, 'Data minimal 2 karakter');
        successMessage = 'Format data valid';
    }
  }

  const result = schema.safeParse(trimmed);
  if (result.success) {
    return {
      isValid: true,
      isEmpty: false,
      successMessage,
    };
  }

  const issueMsg =
    result.error?.issues?.[0]?.message || result.error?.message || 'Format data tujuan tidak valid.';

  return {
    isValid: false,
    isEmpty: false,
    error: issueMsg,
  };
}

export function validateTargetZone(value: string): TargetValidationResult {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return {
      isValid: false,
      isEmpty: true,
      error: 'Server / Zone ID wajib diisi.',
    };
  }

  const result = targetZoneIdSchema.safeParse(trimmed);
  if (result.success) {
    return {
      isValid: true,
      isEmpty: false,
      successMessage: 'Server / Zone ID valid',
    };
  }

  return {
    isValid: false,
    isEmpty: false,
    error: result.error?.issues?.[0]?.message || 'Server / Zone ID tidak valid.',
  };
}

export function validateContactEmail(value: string): TargetValidationResult {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return {
      isValid: false,
      isEmpty: true,
      error: 'Email pemesan wajib diisi.',
    };
  }

  const result = customerEmailSchema.safeParse(trimmed);
  if (result.success) {
    return {
      isValid: true,
      isEmpty: false,
      successMessage: 'Email pemesan valid',
    };
  }

  return {
    isValid: false,
    isEmpty: false,
    error: result.error?.issues?.[0]?.message || 'Format email pemesan tidak valid.',
  };
}

export function validateContactPhone(value: string): TargetValidationResult {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return {
      isValid: false,
      isEmpty: true,
      error: 'Nomor WhatsApp kontak wajib diisi.',
    };
  }

  const result = customerPhoneSchema.safeParse(trimmed);
  if (result.success) {
    return {
      isValid: true,
      isEmpty: false,
      successMessage: 'Nomor WhatsApp pemesan valid',
    };
  }

  return {
    isValid: false,
    isEmpty: false,
    error: result.error?.issues?.[0]?.message || 'Nomor WhatsApp tidak valid.',
  };
}

export function validateContactRecipient(value: string): TargetValidationResult {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return {
      isValid: false,
      isEmpty: true,
      error: 'Email atau Nomor WhatsApp penerima wajib diisi.',
    };
  }

  if (trimmed.includes('@')) {
    const res = validateContactEmail(trimmed);
    return {
      ...res,
      successMessage: res.isValid ? 'Email penerima valid' : undefined,
      error: res.isValid ? undefined : (res.error || 'Format email penerima tidak valid.'),
    };
  }

  const res = validateContactPhone(trimmed);
  return {
    ...res,
    successMessage: res.isValid ? 'Nomor WhatsApp penerima valid' : undefined,
    error: res.isValid ? undefined : (res.error || 'Nomor WhatsApp penerima tidak valid.'),
  };
}

// -------------------------------------------------------------
// PRODUCT TARGET REQUIREMENT DETECTOR
// -------------------------------------------------------------

export function getProductTargetRequirement(item?: {
  name?: string;
  category?: string;
  brand?: string;
  providerCode?: string;
  inputType?: string;
  input_type?: string;
  inputConfig?: any;
  input_config?: any;
}): TargetRequirement {
  // 1. Authoritative check: If product already has explicit input configuration from backend DB
  const rawCfg = item?.inputConfig || item?.input_config;
  let parsedCfg: any = null;
  if (rawCfg) {
    try {
      parsedCfg = typeof rawCfg === 'string' ? JSON.parse(rawCfg) : rawCfg;
    } catch {
      parsedCfg = null;
    }
  }

  const explicitType = (item?.inputType || item?.input_type || parsedCfg?.type || '').toLowerCase();

  if (parsedCfg && typeof parsedCfg === 'object') {
    const cfgType = (parsedCfg.type || explicitType || 'email').toLowerCase() as TargetFieldType;
    return {
      type: cfgType,
      label: parsedCfg.label || (cfgType === 'phone' ? 'Nomor WhatsApp / HP Tujuan Aktivasi *' : cfgType === 'choice' ? 'Metode Pengiriman Akun *' : 'Email Akun Tujuan Aktivasi *'),
      placeholder: parsedCfg.placeholder || (cfgType === 'phone' ? 'contoh: 081234567890' : 'contoh: akun_anda@gmail.com'),
      helper: parsedCfg.helper || 'Pastikan data tujuan akun sudah benar.',
      validLabel: parsedCfg.validLabel,
      requiresZone: Boolean(parsedCfg.requires_zone || parsedCfg.requiresZone),
      zoneLabel: parsedCfg.zone_label || parsedCfg.zoneLabel || 'Server / Zone ID *',
      zonePlaceholder: parsedCfg.zone_placeholder || parsedCfg.zonePlaceholder || 'contoh: 2685',
      zoneHelper: parsedCfg.zone_helper || parsedCfg.zoneHelper || 'Server atau Zone ID akun game Anda.',
      options: parsedCfg.options || (cfgType === 'choice' ? ['whatsapp', 'gmail'] : undefined),
      defaultOption: parsedCfg.default_option || parsedCfg.defaultOption || 'whatsapp',
      fields: parsedCfg.fields,
      required: parsedCfg.required !== false,
      needsReview: Boolean(parsedCfg.needs_review || parsedCfg.needsReview),
    };
  }

  const combined = `${item?.name || ''} ${item?.brand || ''} ${item?.category || ''} ${item?.providerCode || ''}`.toLowerCase();
  const brandName = item?.brand && item.brand.toLowerCase() !== 'digital' ? item.brand.trim() : (item?.name?.split(' ')[0] || 'Akun');

  // 2. Choice-based delivery (Store-provided accounts: ChatGPT, Netflix, Spotify, Disney, Prime, WeTV, Vidio, etc.)
  const choiceKeywords = [
    'chatgpt', 'openai', 'gpt-4', 'gpt', 'netflix', 'disney', 'prime video',
    'vidio', 'wetv', 'iqiyi', 'hbogo', 'hbo', 'spotify', 'crunchyroll',
    'midjourney', 'claude'
  ];
  if (explicitType === 'choice' || (!explicitType && choiceKeywords.some((k) => combined.includes(k)))) {
    return {
      type: 'choice',
      label: `Metode Pengiriman Akun ${brandName} *`,
      placeholder: 'Pilih WhatsApp atau Gmail untuk menerima kredensial akun',
      helper: `Akun ${brandName} disediakan oleh AsterraStore dan akan dikirimkan ke kontak WhatsApp atau Gmail pilihan Anda.`,
      options: ['whatsapp', 'gmail'],
      defaultOption: 'whatsapp',
      fields: {
        whatsapp: {
          label: 'Nomor WhatsApp Penerima Akun *',
          placeholder: 'contoh: 081234567890',
          helper: 'Kredensial login akun akan dikirimkan melalui WhatsApp ini.',
        },
        gmail: {
          label: 'Email Gmail Penerima Akun *',
          placeholder: 'contoh: akun_penerima@gmail.com',
          helper: 'Kredensial login akun akan dikirimkan melalui email Gmail ini (terpisah dari email login website).',
        },
      },
      required: true,
    };
  }

  // 3. Voucher / Digital Code (No input required)
  const voucherKeywords = [
    'voucher', 'gift card', 'giftcard', 'redeem code', 'steam wallet', 'playstation', 'google play'
  ];
  if (explicitType === 'none' || (!explicitType && voucherKeywords.some((k) => combined.includes(k)))) {
    return {
      type: 'none',
      label: 'Tidak Memerlukan Input Tujuan',
      placeholder: '',
      helper: 'Kode voucher / lisensi akan langsung diterbitkan pada rincian pesanan Anda setelah pembayaran terverifikasi.',
      requiresZone: false,
      required: false,
    };
  }

  // 4. Phone number targets (CapCut, Pulsa, Telkomsel, Tri, XL, E-Wallets, etc.)
  const phoneKeywords = [
    'capcut', 'pulsa', 'telkomsel', 'tsel', 'indosat', 'isat', 'tri', 'three',
    'xl', 'axis', 'smartfren', 'dana', 'gopay', 'ovo', 'shopeepay', 'linkaja',
    'kuota', 'paket data'
  ];
  if (explicitType === 'phone' || (!explicitType && phoneKeywords.some((k) => combined.includes(k)))) {
    return {
      type: 'phone',
      label: `Nomor WhatsApp / HP Tujuan Aktivasi ${brandName} *`,
      placeholder: 'Masukan Nomor (contoh: 081234567890)',
      helper: `Aktivasi paket atau pengisian akan diproses ke nomor ${brandName} ini.`,
      validLabel: 'Nomor WhatsApp / HP valid',
      requiresZone: false,
      zoneLabel: '',
      zonePlaceholder: '',
      zoneHelper: '',
      required: true,
    };
  }

  // 5. Customer ID / Meter targets (PLN, PDAM, TV Kabel)
  const customerIdKeywords = [
    'pln', 'token pln', 'pdam', 'bpjs', 'k-vision', 'kvision',
    'nex parabola', 'orange tv', 'smc id'
  ];
  if (explicitType === 'customer_id' || (!explicitType && customerIdKeywords.some((k) => combined.includes(k)))) {
    return {
      type: 'customer_id',
      label: 'Nomor Pelanggan / No. Meter / SMC ID *',
      placeholder: 'contoh: 14205819230',
      helper: 'Masukan nomor meter atau ID pelanggan tujuan pengisian.',
      validLabel: 'Nomor Pelanggan / Meter valid',
      requiresZone: false,
      zoneLabel: '',
      zonePlaceholder: '',
      zoneHelper: '',
      required: true,
    };
  }

  // 6. Games with Server / Zone ID
  const zoneGameKeywords = [
    'mobile legends', 'mlbb', 'lifeafter', 'ragnarok', 'genshin', 'honkai', 'zenless'
  ];
  if (zoneGameKeywords.some((k) => combined.includes(k))) {
    return {
      type: 'game',
      label: 'User ID Game *',
      placeholder: 'contoh: 136216325',
      helper: 'Masukan User ID akun game tujuan top-up.',
      validLabel: 'User ID game valid',
      requiresZone: true,
      zoneLabel: 'Server / Zone ID *',
      zonePlaceholder: 'contoh: 2685',
      zoneHelper: 'Server atau Zone ID akun game Anda.',
      required: true,
    };
  }

  // 7. Games without Server / Zone ID
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
      validLabel: 'User ID game valid',
      requiresZone: false,
      zoneLabel: '',
      zonePlaceholder: '',
      zoneHelper: '',
      required: true,
    };
  }

  // 8. Explicit email-based activation (YouTube Family, Canva, Google One, Gemini, Duolingo, etc.)
  const emailInviteKeywords = [
    'youtube', 'family', 'invite', 'undangan', 'canva', 'google one',
    'gemini', 'duolingo', 'notion', 'office 365', 'microsoft 365', 'apple music'
  ];
  if (explicitType === 'email' || emailInviteKeywords.some((k) => combined.includes(k))) {
    return {
      type: 'email',
      label: `Email Akun ${brandName} Tujuan Aktivasi *`,
      placeholder: 'contoh: akun_anda@gmail.com',
      helper: `Undangan atau aktivasi premium ${brandName} akan dikaitkan ke email akun ini (terpisah dari email login akun website).`,
      validLabel: 'Format email akun valid',
      requiresZone: false,
      zoneLabel: '',
      zonePlaceholder: '',
      zoneHelper: '',
      required: true,
    };
  }

  // 9. Ambiguous fallback: NOT automatically assumed as email. Flagged for admin review and blocked from checkout.
  return {
    type: 'custom',
    label: `Produk Dalam Peninjauan Admin *`,
    placeholder: 'Menunggu konfigurasi input oleh admin',
    helper: 'Konfigurasi jenis fulfillment produk ini sedang dalam peninjauan admin dan belum dapat dipesan saat ini.',
    validLabel: '',
    requiresZone: false,
    zoneLabel: '',
    zonePlaceholder: '',
    zoneHelper: '',
    required: true,
    needsReview: true,
  };
}
