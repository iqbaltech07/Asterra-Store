'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Check,
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
  isManualMode,
  paymentMethods,
  selectedMethod,
  onSelectMethod,
}: CheckoutPaymentMethodsProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
            2
          </div>
          <h2 className="text-base font-bold text-foreground">Pilih Metode Pembayaran</h2>
        </div>

        {isManualMode ? (
          <Badge className="bg-status-warning/15 text-status-warning border-status-warning/30 text-[10px] font-mono gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Mode Transfer Toko</span>
          </Badge>
        ) : (
          <Badge className="bg-status-success/15 text-status-success border-status-success/30 text-[10px] font-mono gap-1">
            <Check className="w-3 h-3" />
            <span>Gateway Otomatis</span>
          </Badge>
        )}
      </div>

      {/* Notice for Manual Mode */}
      {isManualMode && (
        <div className="p-3.5 rounded-lg bg-status-warning/10 border border-status-warning/30 space-y-1">
          <div className="flex items-center gap-2 text-status-warning font-semibold text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Pembayaran Transfer Manual Toko Aktif</span>
          </div>
          <p className="text-[11px] text-foreground-muted leading-relaxed">
            Silakan pilih metode transfer langsung di bawah ini. Anda akan mendapatkan detail rekening dan
            tombol konfirmasi instan ke WhatsApp admin setelah pesanan dibuat.
          </p>
        </div>
      )}

      <div className="space-y-2.5 pt-1">
        {paymentMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          return (
            <div
              key={method.id}
              onClick={() => onSelectMethod(method.id)}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                isSelected
                  ? 'bg-surface-raised border-primary shadow-sm ring-1 ring-primary'
                  : 'bg-surface border-border hover:border-foreground-muted/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-raised flex items-center justify-center text-primary shrink-0">
                  {method.category === 'qris' && <QrCode className="w-4 h-4" />}
                  {method.category === 'ewallet' && <Wallet className="w-4 h-4" />}
                  {method.category === 'va' && <Building2 className="w-4 h-4" />}
                  {method.category === 'bank_manual' && <CreditCard className="w-4 h-4" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    {method.name}
                  </span>
                  <span className="text-[11px] text-foreground-muted">
                    {method.description}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isManualMode ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-warning/15 text-status-warning font-medium">
                    Manual
                  </span>
                ) : method.category === 'qris' ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-success/10 text-status-success font-medium">
                    Otomatis
                  </span>
                ) : null}
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-primary text-white' : 'bg-surface-hover'
                  }`}
                >
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
