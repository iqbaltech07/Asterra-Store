'use client';

import React from 'react';

export function PrivateOrdersSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat riwayat pesanan">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5 animate-pulse"
        >
          {/* Card Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-raised shrink-0" />
              <div className="space-y-1.5">
                <div className="w-28 h-4 bg-surface-raised rounded" />
                <div className="w-40 h-3 bg-surface-raised rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-6 rounded-full bg-surface-raised" />
              <div className="w-20 h-5 bg-surface-raised rounded" />
            </div>
          </div>

          {/* 4-Step Fulfillment Timeline Skeleton */}
          <div className="py-2 space-y-3">
            <div className="w-36 h-3 bg-surface-raised rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="p-2.5 rounded-lg bg-surface-raised h-10" />
              ))}
            </div>
          </div>

          {/* Items Row Skeleton */}
          <div className="space-y-2">
            <div className="bg-surface-raised rounded-lg p-3 h-16" />
          </div>

          {/* Actions Footer Skeleton */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
            <div className="w-28 h-4 bg-surface-raised rounded" />
            <div className="flex items-center gap-2">
              <div className="w-20 h-8 rounded-lg bg-surface-raised" />
              <div className="w-24 h-8 rounded-lg bg-surface-raised" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PrivateOrdersPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full animate-in fade-in duration-150">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center justify-between gap-3 mb-6 animate-pulse">
        <div className="w-36 h-4 bg-surface-raised rounded" />
        <div className="w-28 h-8 bg-surface-raised rounded-lg" />
      </div>

      {/* Email Lookup Card Skeleton */}
      <div className="bg-surface border border-primary/20 rounded-xl p-4 sm:p-5 max-w-xl mx-auto mb-8 animate-pulse">
        <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
          <div className="flex-1 h-9 rounded-lg bg-surface-raised" />
          <div className="w-28 h-9 rounded-lg bg-surface-raised shrink-0" />
        </div>
      </div>

      {/* Orders Skeleton */}
      <PrivateOrdersSkeleton />
    </div>
  );
}
