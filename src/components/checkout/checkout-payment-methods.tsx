'use client';

import React from 'react';
import {
  QrCode,
  Wallet,
  Building2,
  CreditCard,
} from 'lucide-react';

export interface PaymentMethodOption {
  id: string;
  name: string;
  description: string;
  category: 'qris' | 'ewallet' | 'va' | 'bank_manual';
}

interface CheckoutPaymentMethodsProps {
  isManualMode: boolean;
  paymentMethods: PaymentMethodOption[];
  selectedMethod: string;
  onSelectMethod: (methodId: string) => void;
}

export function CheckoutPaymentMethods({
  paymentMethods,
  selectedMethod,
  onSelectMethod,
}: CheckoutPaymentMethodsProps) {
  return (
    <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 space-y-4 shadow-card">
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(18,26,42,0.08)]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.25)] text-[#C96F55] flex items-center justify-center text-xs font-bold shadow-xs">
            2
          </div>
          <h2 className="text-base font-bold text-[#121A2A]">Pilih Metode Pembayaran</h2>
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        {paymentMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          return (
            <div
              key={method.id}
              onClick={() => onSelectMethod(method.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                isSelected
                  ? 'bg-[rgba(201,111,85,0.08)] border-[#C96F55] shadow-xs ring-2 ring-[#C96F55]/20'
                  : 'bg-white border-[rgba(18,26,42,0.1)] hover:border-[#121A2A] hover:bg-[#F7F5EF]/60'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                  isSelected
                    ? 'bg-[rgba(201,111,85,0.15)] text-[#C96F55] border-[rgba(201,111,85,0.3)]'
                    : 'bg-[#F7F5EF] text-[#121A2A]/60 border-[rgba(18,26,42,0.08)]'
                }`}>
                  {method.category === 'qris' && <QrCode className="w-4 h-4" />}
                  {method.category === 'ewallet' && <Wallet className="w-4 h-4" />}
                  {method.category === 'va' && <Building2 className="w-4 h-4" />}
                  {method.category === 'bank_manual' && <CreditCard className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-[#121A2A] block">
                    {method.name}
                  </span>
                  <span className="text-[11px] text-[#121A2A]/60 line-clamp-2 sm:line-clamp-none">
                    {method.description}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    isSelected ? 'bg-[#C96F55] border-[#C96F55] text-white' : 'border-[rgba(18,26,42,0.2)] bg-white'
                  }`}
                >
                  {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
