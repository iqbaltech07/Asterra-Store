import { NextRequest, NextResponse } from 'next/server';
import { PaymentConfigService, PaymentConfig } from '@/lib/services/payment-config.service';

/**
 * Validates and sanitizes payment configuration updates
 */
function validatePaymentConfigInput(data: unknown): {
  valid: boolean;
  errors: string[];
  sanitized?: Partial<PaymentConfig>;
} {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Payload tidak valid atau kosong.'] };
  }

  const payload = data as Record<string, unknown>;
  const sanitized: Partial<PaymentConfig> = {};

  // 1. Mode Validation
  if (payload.mode !== undefined) {
    if (payload.mode !== 'gateway' && payload.mode !== 'manual') {
      errors.push('Mode pembayaran harus berupa "gateway" atau "manual".');
    } else {
      sanitized.mode = payload.mode;
    }
  }

  // 2. Bank Details
  if (payload.bankName !== undefined) {
    const val = String(payload.bankName).trim();
    if (val.length < 2 || val.length > 100) errors.push('Nama bank harus antara 2 hingga 100 karakter.');
    else sanitized.bankName = val;
  }

  if (payload.bankAccountNumber !== undefined) {
    const val = String(payload.bankAccountNumber).trim();
    if (!/^[0-9A-Za-z\- ]{4,35}$/.test(val)) errors.push('Nomor rekening bank harus alfanumerik (4-35 karakter).');
    else sanitized.bankAccountNumber = val;
  }

  if (payload.bankAccountName !== undefined) {
    const val = String(payload.bankAccountName).trim();
    if (val.length < 2 || val.length > 100) errors.push('Nama pemilik rekening harus antara 2 hingga 100 karakter.');
    else sanitized.bankAccountName = val;
  }

  // 3. QRIS Details
  if (payload.qrisImageUrl !== undefined) {
    const val = String(payload.qrisImageUrl).trim();
    // Allow valid URLs or root-relative paths like /images/... or empty
    if (val.length > 1000) errors.push('URL QRIS terlalu panjang (maks 1000 karakter).');
    else sanitized.qrisImageUrl = val;
  }

  if (payload.qrisMerchantName !== undefined) {
    const val = String(payload.qrisMerchantName).trim();
    if (val.length < 2 || val.length > 100) errors.push('Nama merchant QRIS harus antara 2 hingga 100 karakter.');
    else sanitized.qrisMerchantName = val;
  }

  // 4. DANA Details
  if (payload.danaNumber !== undefined) {
    const val = String(payload.danaNumber).trim();
    if (!/^[0-9+ ]{8,25}$/.test(val)) errors.push('Nomor DANA harus berupa nomor telepon yang valid.');
    else sanitized.danaNumber = val;
  }

  if (payload.danaAccountName !== undefined) {
    const val = String(payload.danaAccountName).trim();
    if (val.length < 2 || val.length > 100) errors.push('Nama akun DANA harus antara 2 hingga 100 karakter.');
    else sanitized.danaAccountName = val;
  }

  // 5. WhatsApp Confirmation
  if (payload.confirmationWhatsapp !== undefined) {
    const val = String(payload.confirmationWhatsapp).trim();
    if (!/^[0-9+ ]{8,25}$/.test(val)) errors.push('Nomor WhatsApp konfirmasi harus berupa nomor telepon yang valid.');
    else sanitized.confirmationWhatsapp = val;
  }

  // 6. Anti-Fraud Settings
  if (payload.enableUniqueCode !== undefined) {
    sanitized.enableUniqueCode = Boolean(payload.enableUniqueCode);
  }

  if (payload.orderExpiryHours !== undefined) {
    const hours = parseInt(String(payload.orderExpiryHours), 10);
    if (isNaN(hours) || hours < 1 || hours > 168) {
      errors.push('Batas waktu kedaluwarsa pesanan harus antara 1 jam hingga 168 jam (7 hari).');
    } else {
      sanitized.orderExpiryHours = hours;
    }
  }

  // 7. Instructions
  if (payload.instructions !== undefined) {
    const val = String(payload.instructions).trim();
    if (val.length > 2000) errors.push('Instruksi pembayaran maksimal 2000 karakter.');
    else sanitized.instructions = val;
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}

/**
 * GET /api/v1/admin/payment-config
 * Admin endpoint to load full payment settings
 */
export async function GET() {
  try {
    const config = await PaymentConfigService.getConfig();

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('[AdminPaymentConfigAPI] Failed to get config:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat pengaturan pembayaran.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/admin/payment-config
 * Admin endpoint to update payment configuration & mode switch
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validatePaymentConfigInput(body);

    if (!validation.valid || !validation.sanitized) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validasi pengaturan pembayaran gagal.',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const updated = await PaymentConfigService.updateConfig(validation.sanitized);

    return NextResponse.json({
      success: true,
      message: `Pengaturan pembayaran berhasil diperbarui. Mode aktif: ${updated.mode.toUpperCase()}`,
      data: updated,
    });
  } catch (error) {
    console.error('[AdminPaymentConfigAPI] Failed to update config:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyimpan perubahan pengaturan pembayaran.' },
      { status: 500 }
    );
  }
}
