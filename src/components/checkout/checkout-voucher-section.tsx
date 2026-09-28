'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tag } from 'lucide-react';

interface CheckoutVoucherSectionProps {
  promoCode: string;
  onPromoCodeChange: (val: string) => void;
  onApplyPromo: () => void;
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
  isCheckingPromo,
  promoFeedback,
}: CheckoutVoucherSectionProps) {
  return (
    <div className="pt-2 border-t border-border space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Kode Promo (ASTERRA10)"
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
