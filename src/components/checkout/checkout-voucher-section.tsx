'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tag, Check, X } from 'lucide-react';

interface CheckoutVoucherSectionProps {
  promoCode: string;
  onPromoCodeChange: (val: string) => void;
  onApplyPromo: () => void;
  onRemovePromo?: () => void;
  appliedPromo?: {
    code: string;
    discount: number;
    description?: string;
  } | null;
  isCheckingPromo: boolean;
  promoFeedback: {
    type: 'success' | 'error';
    text: string;
  } | null;
}

export function CheckoutVoucherSection({
  promoCode,
  onPromoCodeChange,
  onApplyPromo,
  onRemovePromo,
  appliedPromo,
  isCheckingPromo,
  promoFeedback,
}: CheckoutVoucherSectionProps) {
  return (
    <div className="pt-2 border-t border-border space-y-2">
      {appliedPromo ? (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Check className="w-4 h-4 shrink-0" />
            <div>
              <span className="font-bold font-mono">{appliedPromo.code}</span>
              <span className="text-[11px] block text-foreground-muted">
                Hemat Rp {appliedPromo.discount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
          {onRemovePromo && (
            <button
              type="button"
              onClick={onRemovePromo}
              className="text-[11px] font-medium text-foreground-muted hover:text-status-error flex items-center gap-1 px-2 py-1 rounded hover:bg-surface-raised transition-colors"
              title="Batalkan penggunaan voucher"
            >
              <X className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Kode Promo"
              value={promoCode}
              onChange={(e) => onPromoCodeChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onApplyPromo();
                }
              }}
              className="pl-8 text-xs bg-surface-raised border-border uppercase font-mono"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isCheckingPromo}
            onClick={onApplyPromo}
            className="text-xs border-border shrink-0 font-medium"
          >
            {isCheckingPromo ? 'Memeriksa...' : 'Gunakan'}
          </Button>
        </div>
      )}

      {promoFeedback && (
        <p
          className={`text-xs font-medium animate-in fade-in duration-200 ${
            promoFeedback.type === 'success'
              ? 'text-status-success'
              : 'text-status-error'
          }`}
        >
          {promoFeedback.text}
        </p>
      )}
    </div>
  );
}
