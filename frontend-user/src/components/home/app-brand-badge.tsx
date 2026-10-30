'use client';

import React from 'react';
import { ProductAvatar, ProductAvatarSize } from '@/components/ui/product-avatar';

export function AppBrandBadge({
  name,
  imageUrl,
  className,
  size,
}: {
  name: string;
  imageUrl?: string;
  className?: string;
  size?: ProductAvatarSize;
}) {
  return <ProductAvatar name={name} imageUrl={imageUrl} className={className} size={size} />;
}
