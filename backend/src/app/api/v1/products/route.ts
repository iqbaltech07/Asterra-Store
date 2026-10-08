import { NextRequest, NextResponse } from 'next/server';
import { PrismaCatalogRepository } from '@/lib/services/prisma-catalog.repository';

/**
 * GET /api/v1/products
 * Consumer storefront endpoint. ONLY returns products with status === 'active'.
 * Archived products are strictly hidden from consumers.
 * Queries Supabase PostgreSQL with instant B-Tree index lookup.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || undefined;
  const search = searchParams.get('search')?.toLowerCase().trim() || undefined;

  // Retrieve active products via Prisma Repository (Supabase with fallback)
  const { products, total } = await PrismaCatalogRepository.getActiveProducts({
    category,
    search,
  });

  return NextResponse.json({
    success: true,
    data: products,
    total,
    timestamp: new Date().toISOString(),
  });
}
