import { prisma } from '@/lib/prisma';
import { broadcastOrderEvent } from './event-bus';
import {
  getGlobalOrders,
  updateGlobalOrderStatus,
  addGlobalLog,
  getGlobalLogs,
  Order,
  OrderLog,
} from '@/lib/orders-data';
import { mapDbOrderToOrder, RawDbOrder } from '@/lib/utils/order-mapper';

export interface OrderFilterParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminOrderSummaryMetrics {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
}

export class OrderAdminService {
  /**
   * Fetch paginated orders with filters & summary metrics
   */
  static async getOrders(params: OrderFilterParams = {}) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const status = params.status;
    const search = params.search?.trim().toLowerCase();

    // Auto-cancel any expired pending orders before returning lists
    await this.autoCancelExpiredOrders().catch((e) =>
      console.warn('[OrderAdminService] Auto-cancel runner error:', e)
    );

    try {
      // 1. Try querying Supabase PostgreSQL database via Prisma
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prismaClient = prisma as any;
      if (prismaClient?.order) {
        const whereClause: Record<string, unknown> = {};

        if (status && status !== 'all') {
          whereClause.status = status;
        }

        if (search) {
          whereClause.OR = [
            { id: { contains: search, mode: 'insensitive' } },
            { customerEmail: { contains: search, mode: 'insensitive' } },
            { customerWhatsapp: { contains: search, mode: 'insensitive' } },
            { customerName: { contains: search, mode: 'insensitive' } },
            { items: { some: { productName: { contains: search, mode: 'insensitive' } } } },
          ];
        }

        const [dbOrders, totalCount, allStatuses] = await Promise.all([
          prismaClient.order.findMany({
            where: whereClause,
            include: {
              items: true,
              logs: {
                orderBy: { createdAt: 'desc' },
                take: 5,
              },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          prismaClient.order.count({ where: whereClause }),
          prismaClient.order.findMany({
            select: { status: true, totalAmount: true },
          }),
        ]);

        if (dbOrders && dbOrders.length > 0) {
          // Calculate metrics from database
          let pending = 0;
          let processing = 0;
          let completed = 0;
          let cancelled = 0;
          let totalRevenue = 0;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          allStatuses.forEach((o: any) => {
            if (o.status === 'pending') pending++;
            else if (o.status === 'processing') {
              processing++;
              totalRevenue += o.totalAmount;
            } else if (o.status === 'completed') {
              completed++;
              totalRevenue += o.totalAmount;
            } else if (o.status === 'cancelled') cancelled++;
          });

          const mappedOrders: Order[] = dbOrders.map((o: unknown) =>
            mapDbOrderToOrder(o as RawDbOrder)
          );

          return {
            orders: mappedOrders,
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit) || 1,
            metrics: {
              total: allStatuses.length,
              pending,
              processing,
              completed,
              cancelled,
              totalRevenue,
            },
          };
        }
      }
    } catch (err) {
      console.warn('[OrderAdminService] Prisma orders fetch warning, falling back to memory store:', err);
    }

    // 2. High-resilience in-memory store fallback
    let allOrders = getGlobalOrders();

    // Calculate global metrics across all in-memory orders
    let pending = 0;
    let processing = 0;
    let completed = 0;
    let cancelled = 0;
    let totalRevenue = 0;

    allOrders.forEach((o) => {
      if (o.order_status === 'pending') pending++;
      else if (o.order_status === 'processing') {
        processing++;
        totalRevenue += o.total_amount;
      } else if (o.order_status === 'completed') {
        completed++;
        totalRevenue += o.total_amount;
      } else if (o.order_status === 'cancelled') cancelled++;
    });

    // Apply filtering
    if (status && status !== 'all') {
      allOrders = allOrders.filter((o) => o.order_status === status);
    }

    if (search) {
      allOrders = allOrders.filter((o) => {
        const matchId = o.id.toLowerCase().includes(search);
        const matchEmail = (o.customer_email || '').toLowerCase().includes(search);
        const matchName = (o.customer_name || '').toLowerCase().includes(search);
        const matchPhone = (o.customer_whatsapp || '').toLowerCase().includes(search);
        const matchItem = o.items.some((i) => i.product_name.toLowerCase().includes(search));
        return matchId || matchEmail || matchName || matchPhone || matchItem;
      });
    }

    const totalCount = allOrders.length;
    const startIndex = (page - 1) * limit;
    const paginated = allOrders.slice(startIndex, startIndex + limit);

    return {
      orders: paginated,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
      metrics: {
        total: getGlobalOrders().length,
        pending,
        processing,
        completed,
        cancelled,
        totalRevenue,
      },
    };
  }

  /**
   * Fetch single order with detailed items and full chronological logs
   */
  static async getOrderById(orderId: string): Promise<Order | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prismaClient = prisma as any;
      if (prismaClient?.order) {
        const o = await prismaClient.order.findUnique({
          where: { id: orderId },
          include: {
            items: true,
            logs: {
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (o) {
          return mapDbOrderToOrder(o as RawDbOrder);
        }
      }
    } catch (err) {
      console.warn('[OrderAdminService] Prisma orderById lookup warning:', err);
    }

    // In-memory fallback
    const memOrder = getGlobalOrders().find((o) => o.id === orderId);
    return memOrder || null;
  }

  /**
   * Update order status manually by admin or automatically by webhook
   */
  static async updateStatus(
    orderId: string,
    newStatus: 'pending' | 'processing' | 'completed' | 'cancelled',
    actor: 'admin' | 'tripay_webhook' | 'system' = 'admin',
    notes?: string,
    metadata?: Record<string, unknown>
  ): Promise<Order | null> {
    // 1. Fetch current status from DB or memory for accurate audit trail
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaClient = prisma as any;
    let previousStatus: string = 'pending';
    try {
      if (prismaClient?.order) {
        const existing = await prismaClient.order.findUnique({
          where: { id: orderId },
          select: { status: true },
        });
        if (existing?.status) {
          previousStatus = existing.status;
        }
      }
    } catch {
      const currentMemoryOrder = getGlobalOrders().find((o) => o.id === orderId);
      previousStatus = currentMemoryOrder?.order_status || 'pending';
    }

    updateGlobalOrderStatus(orderId, newStatus, actor, notes);

    // 2. Persist update and create audit log in Prisma database
    try {
      if (prismaClient?.order) {
        const isPaid = newStatus === 'completed' || newStatus === 'processing';

        await prismaClient.order.update({
          where: { id: orderId },
          data: {
            status: newStatus,
            paymentStatus: isPaid ? 'settlement' : newStatus,
            ...(isPaid ? { paidAt: new Date() } : {}),
          },
        });

        // Insert OrderLog in DB
        if (prismaClient.orderLog) {
          await prismaClient.orderLog.create({
            data: {
              orderId,
              actor,
              action: actor === 'tripay_webhook' ? 'payment_received' : 'status_updated',
              previousStatus,
              newStatus,
              notes: notes || `Status diubah menjadi ${newStatus} oleh ${actor}`,
              metadata: metadata || null,
            },
          });
        }
      }
    } catch (dbErr) {
      console.warn('[OrderAdminService] Prisma status update warning:', dbErr);
    }

    const updatedOrder = await this.getOrderById(orderId);

    // Broadcast SSE update event to user and admin clients
    broadcastOrderEvent({
      type: newStatus === 'processing' || newStatus === 'completed' ? 'order:payment_verified' : 'order:status_changed',
      orderId,
      status: newStatus,
      customerName: updatedOrder?.customer_name,
      customerEmail: updatedOrder?.customer_email,
      totalAmount: updatedOrder?.total_amount,
      message: `Status pesanan ${orderId} diubah menjadi: ${newStatus === 'processing' ? 'Di Proses' : newStatus === 'completed' ? 'Selesai' : newStatus}`,
      timestamp: new Date().toISOString(),
    });

    return updatedOrder;
  }

  /**
   * Automatically detect and cancel all pending orders that have exceeded their expiresAt deadline.
   */
  static async autoCancelExpiredOrders(): Promise<number> {
    const now = new Date();
    let cancelledCount = 0;

    try {
      // 1. Check in Prisma DB
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prismaClient = prisma as any;
      if (prismaClient?.order) {
        const expiredDbOrders = await prismaClient.order.findMany({
          where: {
            status: 'pending',
            expiresAt: {
              lt: now,
            },
          },
          select: { id: true },
        });

        for (const o of expiredDbOrders) {
          await this.updateStatus(
            o.id,
            'cancelled',
            'system',
            'Pesanan dibatalkan otomatis oleh sistem karena telah melewati batas waktu pembayaran 24 jam.'
          );
          cancelledCount++;
        }
      }
    } catch (err) {
      console.warn('[OrderAdminService] autoCancelExpiredOrders DB error:', err);
    }

    // 2. Also check in-memory store
    const memOrders = getGlobalOrders();
    for (const o of memOrders) {
      if (o.order_status === 'pending' && o.expires_at) {
        if (new Date(o.expires_at).getTime() < now.getTime()) {
          updateGlobalOrderStatus(
            o.id,
            'cancelled',
            'system',
            'Pesanan dibatalkan otomatis oleh sistem karena telah melewati batas waktu pembayaran 24 jam.'
          );
          cancelledCount++;
        }
      }
    }

    return cancelledCount;
  }

  /**
   * Retrieve all activity / audit logs with filtering
   */
  static async getAllLogs(params: {
    orderId?: string;
    actor?: string;
    limit?: number;
    page?: number;
  }) {
    const limit = Math.max(1, Math.min(100, params.limit || 50));
    const page = Math.max(1, params.page || 1);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prismaClient = prisma as any;
      if (prismaClient?.orderLog) {
        const whereClause: Record<string, unknown> = {};
        if (params.orderId) whereClause.orderId = params.orderId;
        if (params.actor && params.actor !== 'all') whereClause.actor = params.actor;

        const [dbLogs, totalCount] = await Promise.all([
          prismaClient.orderLog.findMany({
            where: whereClause,
            include: {
              order: {
                select: { customerName: true, customerEmail: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          prismaClient.orderLog.count({ where: whereClause }),
        ]);

        if (dbLogs && dbLogs.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedLogs: OrderLog[] = dbLogs.map((l: any) => ({
            id: l.id,
            order_id: l.orderId,
            customer_name: l.order?.customerName || undefined,
            customer_email: l.order?.customerEmail || undefined,
            actor: l.actor,
            action: l.action,
            previous_status: l.previousStatus || undefined,
            new_status: l.newStatus || undefined,
            notes: l.notes || undefined,
            metadata: l.metadata || undefined,
            created_at: l.createdAt.toISOString(),
          }));

          return {
            logs: mappedLogs,
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit) || 1,
          };
        }
      }
    } catch (err) {
      console.warn('[OrderAdminService] Prisma logs query warning:', err);
    }

    // In-memory fallback
    let memLogs = getGlobalLogs(params.orderId);
    if (params.actor && params.actor !== 'all') {
      memLogs = memLogs.filter((l) => l.actor === params.actor);
    }

    const total = memLogs.length;
    const startIndex = (page - 1) * limit;
    const paginated = memLogs.slice(startIndex, startIndex + limit);

    return {
      logs: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Insert a custom audit log entry
   */
  static async createLog(logData: {
    orderId: string;
    actor: 'admin' | 'tripay_webhook' | 'customer' | 'system';
    action: string;
    previousStatus?: string;
    newStatus?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
  }) {
    const memoryLog: OrderLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      order_id: logData.orderId,
      actor: logData.actor,
      action: logData.action,
      previous_status: logData.previousStatus,
      new_status: logData.newStatus,
      notes: logData.notes,
      metadata: logData.metadata,
      created_at: new Date().toISOString(),
    };

    addGlobalLog(memoryLog);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prismaClient = prisma as any;
      if (prismaClient?.orderLog) {
        await prismaClient.orderLog.create({
          data: {
            orderId: logData.orderId,
            actor: logData.actor,
            action: logData.action,
            previousStatus: logData.previousStatus || null,
            newStatus: logData.newStatus || null,
            notes: logData.notes || null,
            metadata: logData.metadata || null,
          },
        });
      }
    } catch (err) {
      console.warn('[OrderAdminService] Prisma log insertion warning:', err);
    }

    return memoryLog;
  }
}
