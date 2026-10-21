'use client';

import { useQuery } from '@tanstack/react-query';
import { PaymentConfigApi } from '@/lib/api-client';
import { PublicPaymentConfig } from '@/types/payment';

/**
 * Shared React Query hook for public payment configuration and customer support contacts.
 *
 * Eliminates redundant parallel fetches across Footer, Floating Support, Checkout, and Order pages.
 *
 * - queryKey: ['public-payment-config'] (shared with checkout and order views)
 * - staleTime: 10 minutes (prevents repeated hits for rarely changed payment settings)
 * - gcTime: 30 minutes
 * - refetchOnWindowFocus: false
 */
export function usePaymentConfig(options?: { enabled?: boolean }) {
  const query = useQuery<{ success: boolean; data: PublicPaymentConfig }>({
    queryKey: ['public-payment-config'],
    queryFn: () => PaymentConfigApi.getPublicConfig(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
  });

  const config = query.data?.data;

  const whatsappNumbers: string[] =
    Array.isArray(config?.cs_whatsapp_numbers) && config.cs_whatsapp_numbers.length > 0
      ? config.cs_whatsapp_numbers
      : config?.confirmation_whatsapp
      ? [config.confirmation_whatsapp]
      : ['6281234567890'];

  const primaryWhatsapp = (whatsappNumbers[0] || '6281234567890').replace(/\D/g, '');
  const supportEmail = config?.cs_email || 'support@asterra.store';

  return {
    ...query,
    config,
    whatsappNumbers,
    primaryWhatsapp,
    supportEmail,
  };
}
