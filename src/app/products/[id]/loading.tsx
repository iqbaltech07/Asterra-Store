import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-14 h-3 bg-surface-raised rounded animate-pulse" />
          <span className="text-foreground-muted/40 text-xs">/</span>
          <div className="w-20 h-3 bg-surface-raised rounded animate-pulse" />
          <span className="text-foreground-muted/40 text-xs">/</span>
          <div className="w-32 h-3 bg-surface-raised rounded animate-pulse" />
        </div>

        {/* Product Details Section Skeleton */}
        <div className="space-y-10 sm:space-y-12">
          {/* Top Grid: Visual Banner + Pricing Action Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Image Banner & Highlights (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Product Banner Skeleton */}
              <div className="bg-surface border border-border rounded-xl overflow-hidden relative animate-pulse">
                <div className="h-64 sm:h-96 w-full bg-surface-raised relative flex flex-col justify-between p-4 sm:p-6">
                  {/* Badges placeholder */}
                  <div className="flex gap-2">
                    <div className="w-24 h-6 rounded-full bg-background/60" />
                    <div className="w-20 h-6 rounded-full bg-background/40" />
                  </div>
                  {/* Title & subtitle placeholder */}
                  <div className="space-y-2">
                    <div className="w-32 h-3 bg-background/50 rounded" />
                    <div className="w-3/4 sm:w-2/3 h-7 sm:h-9 bg-background/80 rounded" />
                  </div>
                </div>
              </div>

              {/* Guarantee Chips Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-surface border border-border rounded-xl p-3.5 flex items-center gap-3 animate-pulse"
                  >
                    <div className="w-9 h-9 rounded-lg bg-surface-raised shrink-0" />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="w-20 h-3 bg-surface-raised rounded" />
                      <div className="w-28 h-2.5 bg-surface-raised rounded" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Description & Features Skeleton */}
              <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-6 animate-pulse">
                <div className="space-y-3">
                  <div className="w-32 h-4 bg-surface-raised rounded" />
                  <div className="w-full h-3 bg-surface-raised rounded" />
                  <div className="w-5/6 h-3 bg-surface-raised rounded" />
                  <div className="w-4/6 h-3 bg-surface-raised rounded" />
                </div>

                <div className="pt-4 border-t border-border space-y-3">
                  <div className="w-44 h-4 bg-surface-raised rounded" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-surface-raised shrink-0" />
                        <div className="w-3/4 h-3 bg-surface-raised rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Specs Card Skeleton */}
              <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-4 animate-pulse">
                <div className="w-48 h-4 bg-surface-raised rounded" />
                <div className="divide-y divide-border/60">
                  {[1, 2, 3, 4].map((k) => (
                    <div key={k} className="py-2.5 flex justify-between items-center">
                      <div className="w-28 h-3 bg-surface-raised rounded" />
                      <div className="w-36 h-3 bg-surface-raised rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Pricing & Action Box (5 Cols) */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
              <div className="bg-surface border border-border rounded-xl p-6 shadow-xl space-y-5 animate-pulse">
                <div className="flex justify-between items-center pb-2 border-b border-border/60">
                  <div className="w-36 h-3 bg-surface-raised rounded" />
                  <div className="w-24 h-5 bg-surface-raised rounded-full" />
                </div>

                <div className="space-y-2">
                  <div className="w-48 h-8 bg-surface-raised rounded" />
                  <div className="w-64 h-3 bg-surface-raised rounded" />
                </div>

                {/* Duration options skeleton */}
                <div className="space-y-2 pt-2">
                  <div className="w-28 h-3 bg-surface-raised rounded" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-16 rounded-lg bg-surface-raised" />
                    <div className="h-16 rounded-lg bg-surface-raised" />
                  </div>
                </div>

                {/* Quantity selector skeleton */}
                <div className="flex justify-between items-center py-3 border-t border-b border-border/80">
                  <div className="w-24 h-3 bg-surface-raised rounded" />
                  <div className="w-28 h-8 bg-surface-raised rounded-lg" />
                </div>

                {/* Action buttons skeleton */}
                <div className="space-y-2.5 pt-2">
                  <div className="w-full h-11 bg-primary/40 rounded-lg" />
                  <div className="w-full h-10 bg-surface-raised rounded-lg" />
                </div>

                {/* Trust Badges skeleton */}
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="w-4/5 h-3 bg-surface-raised rounded" />
                  <div className="w-3/4 h-3 bg-surface-raised rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
