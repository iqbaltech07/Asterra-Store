'use client';

import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { ProductCard } from '@/components/products/product-card';
import { ProductItem } from '@/lib/products-data';
import { ActiveCampaign } from '@/lib/utils/promo-pricing';
import { RelatedProduct } from './types';

interface ProductDetailRelatedProps {
  relatedProducts: RelatedProduct[];
  activeCampaigns: ActiveCampaign[];
}

export function ProductDetailRelated({
  relatedProducts,
  activeCampaigns,
}: ProductDetailRelatedProps) {
  if (!relatedProducts || relatedProducts.length === 0) return null;

  return (
    <div data-gsap="related-products" className="space-y-4 sm:space-y-6 pt-2 sm:pt-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2.5 sm:pb-3 border-b border-[rgba(18,26,42,0.1)]">
        <div>
          <h2 className="text-base sm:text-2xl font-black text-[#121A2A] tracking-tight">
            Rekomendasi Produk Lainnya
          </h2>
          <p className="text-[11px] sm:text-xs text-[#121A2A]/60 mt-0.5">
            Pilihan relevan yang paling sering dibeli bersama produk ini
          </p>
        </div>
        <Link
          href="/products"
          className="text-xs font-bold text-[#C96F55] hover:text-[#B86047] inline-flex items-center gap-1 shrink-0 transition-colors"
        >
          <span>Lihat Semua Katalog</span>
          <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div data-gsap="product-detail-related" className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
        {relatedProducts.map((rel) => {
          const relProductItem: ProductItem = {
            id: rel.id,
            name: rel.name,
            category: rel.category,
            price: rel.price,
            priceFormatted: rel.priceFormatted,
            description: `Layanan digital resmi ${rel.name} bergaransi penuh.`,
            features: ['Garansi Penggantian', 'Aktivasi Instan'],
            status: 'active',
            stock: rel.stock,
            providerStatus: rel.providerStatus,
            imageUrl: rel.imageUrl,
            brand: rel.brand || rel.category?.name || 'Asterra',
          };

          return (
            <div key={rel.id} data-gsap="related-product-card">
              <ProductCard
                product={relProductItem}
                activeCampaigns={activeCampaigns}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
