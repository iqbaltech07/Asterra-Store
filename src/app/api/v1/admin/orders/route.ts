import { NextRequest, NextResponse } from 'next/server';
import { OrderAdminService } from '@/lib/services/order-admin.service';

/**
 * GET /api/v1/admin/orders
 * Retrieve paginated orders with status filtering, search query, and metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await OrderAdminService.getOrders({
      status,
      search,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result.orders,
      pagination: {
        total_items: result.total,
        current_page: result.page,
        total_pages: result.totalPages,
        items_per_page: result.limit,
      },
      metrics: result.metrics,
    });
  } catch (error) {
    console.error('[AdminOrdersAPI] Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil daftar pesanan.' },
      { status: 500 }
    );
  }
}
