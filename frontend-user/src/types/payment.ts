export interface PaymentConfig {
  id: string;
  mode: 'gateway' | 'manual';
  isBankActive?: boolean;
  isQrisActive?: boolean;
  isDanaActive?: boolean;
  is_bank_active?: boolean;
  is_qris_active?: boolean;
  is_dana_active?: boolean;
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
  isBankActive?: boolean;
  isQrisActive?: boolean;
  isDanaActive?: boolean;
  is_bank_active?: boolean;
  is_qris_active?: boolean;
  is_dana_active?: boolean;
  bank: {
    name: string;
    account_number: string;
    account_name: string;
    is_active?: boolean;
  };
  qris: {
    image_url: string;
    merchant_name: string;
    is_active?: boolean;
  };
  dana: {
    number: string;
    account_name: string;
    is_active?: boolean;
  };
  confirmation_whatsapp: string;
  cs_email: string;
  cs_whatsapp_numbers: string[];
  instructions: string;
  enable_unique_code: boolean;
  order_expiry_hours: number;
}
