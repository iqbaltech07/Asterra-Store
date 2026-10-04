import { prisma } from '@/lib/prisma';

export interface PaymentConfig {
  id: string;
  mode: 'gateway' | 'manual';
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  qrisImageUrl: string;
  qrisMerchantName: string;
  danaNumber: string;
  danaAccountName: string;
  confirmationWhatsapp: string;
  csEmail: string;
  csWhatsappNumbers: string[];
  instructions: string;
  enableUniqueCode: boolean;
  orderExpiryHours: number;
  updatedAt: string;
}

export interface PublicPaymentConfig {
  mode: 'gateway' | 'manual';
  bank: {
    name: string;
    account_number: string;
    account_name: string;
  };
  qris: {
    image_url: string;
    merchant_name: string;
  };
  dana: {
    number: string;
    account_name: string;
  };
  confirmation_whatsapp: string;
  cs_email: string;
  cs_whatsapp_numbers: string[];
  instructions: string;
  enable_unique_code: boolean;
  order_expiry_hours: number;
}

// In-memory persistent default fallback ensuring zero downtime
let memoryConfig: PaymentConfig = {
  id: 'default_setting',
  mode: 'gateway',
  bankName: 'Bank Central Asia (BCA)',
  bankAccountNumber: '8965123456',
  bankAccountName: 'Asterra Store Official',
  qrisImageUrl: '/images/qris-toko.png',
  qrisMerchantName: 'ASTERRA STORE QRIS',
  danaNumber: '081234567890',
  danaAccountName: 'Asterra Store',
  confirmationWhatsapp: '6281234567890',
  csEmail: 'support@asterra.store',
  csWhatsappNumbers: ['6281234567890'],
  instructions: 'Transfer sesuai nominal tepat hingga 3 digit kode unik terakhir untuk verifikasi instan mutasi.',
  enableUniqueCode: true,
  orderExpiryHours: 24,
  updatedAt: new Date().toISOString(),
};

export class PaymentConfigService {
  /**
   * Get complete payment configuration (Admin Access)
   */
  static async getConfig(): Promise<PaymentConfig> {
    if (!process.env.DATABASE_URL) {
      return memoryConfig;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prismaClient = prisma as any;
      if (prismaClient?.paymentSetting) {
        const record = await prismaClient.paymentSetting.findUnique({
          where: { id: 'default_setting' },
        });

        if (record) {
          memoryConfig = {
            id: record.id,
            mode: (record.mode as 'gateway' | 'manual') || 'gateway',
            bankName: record.bankName || memoryConfig.bankName,
            bankAccountNumber: record.bankAccountNumber || memoryConfig.bankAccountNumber,
            bankAccountName: record.bankAccountName || memoryConfig.bankAccountName,
            qrisImageUrl: record.qrisImageUrl || memoryConfig.qrisImageUrl,
            qrisMerchantName: record.qrisMerchantName || memoryConfig.qrisMerchantName,
            danaNumber: record.danaNumber || memoryConfig.danaNumber,
            danaAccountName: record.danaAccountName || memoryConfig.danaAccountName,
            confirmationWhatsapp: record.confirmationWhatsapp || memoryConfig.confirmationWhatsapp,
            csEmail: record.csEmail || memoryConfig.csEmail,
            csWhatsappNumbers: (Array.isArray(record.csWhatsappNumbers) && record.csWhatsappNumbers.length > 0)
              ? record.csWhatsappNumbers
              : memoryConfig.csWhatsappNumbers,
            instructions: record.instructions || memoryConfig.instructions,
            enableUniqueCode: typeof record.enableUniqueCode === 'boolean' ? record.enableUniqueCode : true,
            orderExpiryHours: record.orderExpiryHours || 24,
            updatedAt: record.updatedAt ? new Date(record.updatedAt).toISOString() : new Date().toISOString(),
          };
          return memoryConfig;
        }

        // If not exists in DB yet, attempt to seed default
        try {
          const seeded = await prismaClient.paymentSetting.create({
            data: {
              id: 'default_setting',
              mode: memoryConfig.mode,
              bankName: memoryConfig.bankName,
              bankAccountNumber: memoryConfig.bankAccountNumber,
              bankAccountName: memoryConfig.bankAccountName,
              qrisImageUrl: memoryConfig.qrisImageUrl,
              qrisMerchantName: memoryConfig.qrisMerchantName,
              danaNumber: memoryConfig.danaNumber,
              danaAccountName: memoryConfig.danaAccountName,
              confirmationWhatsapp: memoryConfig.confirmationWhatsapp,
              csEmail: memoryConfig.csEmail,
              csWhatsappNumbers: memoryConfig.csWhatsappNumbers,
              instructions: memoryConfig.instructions,
              enableUniqueCode: memoryConfig.enableUniqueCode,
              orderExpiryHours: memoryConfig.orderExpiryHours,
            },
          });
          if (seeded) {
            memoryConfig.updatedAt = new Date(seeded.updatedAt).toISOString();
          }
        } catch {
          // Table might not exist yet before migration, memory fallback remains active
        }
      }
    } catch (err) {
      console.warn('[PaymentConfigService] Using memory fallback due to DB notice:', err);
    }

    return memoryConfig;
  }

  /**
   * Get public payment configuration for customer checkout
   * Strictly avoids leaking admin secrets or internal DB IDs
   */
  static async getPublicConfig(): Promise<PublicPaymentConfig> {
    const config = await this.getConfig();

    // Standardize WhatsApp format to international (starts with 62)
    let cleanWa = config.confirmationWhatsapp.replace(/\D/g, '');
    if (cleanWa.startsWith('0')) {
      cleanWa = '62' + cleanWa.substring(1);
    } else if (!cleanWa.startsWith('62')) {
      cleanWa = '62' + cleanWa;
    }

    const cleanNumbers = (config.csWhatsappNumbers && config.csWhatsappNumbers.length > 0)
      ? config.csWhatsappNumbers.map((num) => {
          let c = num.replace(/\D/g, '');
          if (c.startsWith('0')) c = '62' + c.substring(1);
          else if (!c.startsWith('62')) c = '62' + c;
          return c;
        })
      : [cleanWa];

    return {
      mode: config.mode,
      bank: {
        name: config.bankName,
        account_number: config.bankAccountNumber,
        account_name: config.bankAccountName,
      },
      qris: {
        image_url: config.qrisImageUrl,
        merchant_name: config.qrisMerchantName,
      },
      dana: {
        number: config.danaNumber,
        account_name: config.danaAccountName,
      },
      confirmation_whatsapp: cleanWa,
      cs_email: config.csEmail || 'support@asterra.store',
      cs_whatsapp_numbers: cleanNumbers,
      instructions: config.instructions,
      enable_unique_code: config.enableUniqueCode,
      order_expiry_hours: config.orderExpiryHours,
    };
  }

  /**
   * Update payment configuration (Admin Access)
   */
  static async updateConfig(updates: Partial<PaymentConfig>): Promise<PaymentConfig> {
    memoryConfig = {
      ...memoryConfig,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (!process.env.DATABASE_URL) {
      return memoryConfig;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prismaClient = prisma as any;
      if (prismaClient?.paymentSetting) {
        const updated = await prismaClient.paymentSetting.upsert({
          where: { id: 'default_setting' },
          create: {
            id: 'default_setting',
            mode: memoryConfig.mode,
            bankName: memoryConfig.bankName,
            bankAccountNumber: memoryConfig.bankAccountNumber,
            bankAccountName: memoryConfig.bankAccountName,
            qrisImageUrl: memoryConfig.qrisImageUrl,
            qrisMerchantName: memoryConfig.qrisMerchantName,
            danaNumber: memoryConfig.danaNumber,
            danaAccountName: memoryConfig.danaAccountName,
            confirmationWhatsapp: memoryConfig.confirmationWhatsapp,
            csEmail: memoryConfig.csEmail,
            csWhatsappNumbers: memoryConfig.csWhatsappNumbers,
            instructions: memoryConfig.instructions,
            enableUniqueCode: memoryConfig.enableUniqueCode,
            orderExpiryHours: memoryConfig.orderExpiryHours,
          },
          update: {
            mode: memoryConfig.mode,
            bankName: memoryConfig.bankName,
            bankAccountNumber: memoryConfig.bankAccountNumber,
            bankAccountName: memoryConfig.bankAccountName,
            qrisImageUrl: memoryConfig.qrisImageUrl,
            qrisMerchantName: memoryConfig.qrisMerchantName,
            danaNumber: memoryConfig.danaNumber,
            danaAccountName: memoryConfig.danaAccountName,
            confirmationWhatsapp: memoryConfig.confirmationWhatsapp,
            csEmail: memoryConfig.csEmail,
            csWhatsappNumbers: memoryConfig.csWhatsappNumbers,
            instructions: memoryConfig.instructions,
            enableUniqueCode: memoryConfig.enableUniqueCode,
            orderExpiryHours: memoryConfig.orderExpiryHours,
          },
        });

        if (updated) {
          memoryConfig.updatedAt = new Date(updated.updatedAt).toISOString();
        }
      }
    } catch (err) {
      console.warn('[PaymentConfigService] Update DB fallback to memory cache:', err);
    }

    return memoryConfig;
  }
}
