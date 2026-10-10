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
