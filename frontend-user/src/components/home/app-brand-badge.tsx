'use client';

import React from 'react';
import { ProductBrandIcon } from '@/components/ui/product-brand-icon';

export function AppBrandBadge({ name, className }: { name: string; className?: string }) {
  return <ProductBrandIcon name={name} className={className || 'w-full h-full'} />;
}
