import { NextRequest, NextResponse } from 'next/server';
import { OrderAdminService } from '@/lib/services/order-admin.service';

/**
 * GET /api/v1/admin/logs
 * Retrieve system activity & order audit logs with actor and order filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actor = searchParams.get('actor') || undefined;
    const orderId = searchParams.get('order_id') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await OrderAdminService.getAllLogs({
      actor,
      orderId,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result.logs,
      pagination: {
        total_items: result.total,
        current_page: result.page,
        total_pages: result.totalPages,
        items_per_page: result.limit,
      },
    });
  } catch (error) {
    console.error('[AdminLogsAPI] Error fetching audit logs:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat log aktivitas.' },
      { status: 500 }
    );
  }
}
