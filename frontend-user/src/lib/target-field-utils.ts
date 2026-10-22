import { z } from 'zod';

export type TargetFieldType = 'phone' | 'game' | 'email' | 'customer_id';

export interface TargetRequirement {
  type: TargetFieldType;
  label: string;
  placeholder: string;
  helper: string;
  validLabel?: string;
  requiresZone: boolean;
  zoneLabel: string;
  zonePlaceholder: string;
  zoneHelper: string;
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

export function validateTargetValue(type: TargetFieldType, value: string): TargetValidationResult {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return {
      isValid: false,
      isEmpty: true,
      error: 'Data tujuan aktivasi wajib diisi.',
    };
  }

  let schema;
  let successMessage = 'Format valid';

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

// -------------------------------------------------------------
// PRODUCT TARGET REQUIREMENT DETECTOR
// -------------------------------------------------------------

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
      label: 'Nomor WhatsApp / HP Tujuan Aktivasi *',
      placeholder: 'Masukan Nomor (contoh: 081234567890)',
      helper: 'Masukan nomor Anda. Akun akan dikirim melalui Riwayat Pesanan dan jangan lupa untuk membaca ketentuan.',
      validLabel: 'Nomor WhatsApp / HP valid',
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
      validLabel: 'Nomor Pelanggan / Meter valid',
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
      validLabel: 'User ID game valid',
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
      validLabel: 'User ID game valid',
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
    validLabel: 'Format email akun valid',
    requiresZone: false,
    zoneLabel: '',
    zonePlaceholder: '',
    zoneHelper: '',
  };
}
