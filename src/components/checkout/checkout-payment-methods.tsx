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
    <div className="bg-white border border-border rounded-2xl p-6 space-y-4 shadow-card">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-xl bg-orange-50 border border-orange-200/80 text-accent flex items-center justify-center text-xs font-bold shadow-xs">
            2
          </div>
          <h2 className="text-base font-bold text-navy-900">Pilih Metode Pembayaran</h2>
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
                  ? 'bg-orange-50/40 border-accent shadow-xs ring-2 ring-accent/20'
                  : 'bg-white border-border hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  isSelected
                    ? 'bg-orange-100/70 text-accent border-orange-200'
                    : 'bg-slate-50 text-slate-500 border-border'
                }`}>
                  {method.category === 'qris' && <QrCode className="w-4 h-4" />}
                  {method.category === 'ewallet' && <Wallet className="w-4 h-4" />}
                  {method.category === 'va' && <Building2 className="w-4 h-4" />}
                  {method.category === 'bank_manual' && <CreditCard className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-navy-900 block">
                    {method.name}
                  </span>
                  <span className="text-[11px] text-slate-500 line-clamp-2 sm:line-clamp-none">
                    {method.description}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    isSelected ? 'bg-accent border-accent text-white' : 'border-slate-300 bg-white'
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
