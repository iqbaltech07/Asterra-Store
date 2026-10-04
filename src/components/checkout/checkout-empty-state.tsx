'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBagShopping, faArrowRight } from '@fortawesome/free-solid-svg-icons';

export function CheckoutEmptyState() {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col justify-center">
      {/* Breadcrumb aligned directly with the card */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-foreground-muted mb-5">
        <Link href="/" className="hover:text-foreground transition-colors">
          Beranda
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-foreground transition-colors">
          Katalog
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Checkout Instan</span>
      </nav>

      <div className="bg-surface border border-border rounded-xl p-8 sm:p-10 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-xl bg-surface-raised border border-border flex items-center justify-center mx-auto text-foreground-muted mb-4">
          <FontAwesomeIcon icon={faBagShopping} className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">
          Keranjang Belanja Kosong
        </h2>
        <p className="text-xs sm:text-sm text-foreground-muted max-w-sm mx-auto leading-relaxed mb-6">
          Pilih produk digital dari katalog terlebih dahulu sebelum melanjutkan ke proses checkout.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/products" className="w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto gap-2 text-xs px-5 h-9 font-semibold">
              <span>Jelajahi Katalog Produk</span>
              <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
            </Button>
          </Link>

          <Link href="/orders" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs border-border h-9 px-4">
              <span>Riwayat Pesanan</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
