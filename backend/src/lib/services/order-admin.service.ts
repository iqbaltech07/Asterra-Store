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
import { SalesDbService } from './sales-db.service';
import { ReferralProfitService } from './referral-profit.service';

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

    // Non-blocking auto-cancel runner for expired pending orders
    void this.autoCancelExpiredOrders().catch((e) =>
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
                take: 10,
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

        if (Array.isArray(dbOrders)) {
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
              totalRevenue += Number(o.totalAmount || 0);
            } else if (o.status === 'completed') {
              completed++;
              totalRevenue += Number(o.totalAmount || 0);
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
    let dbOrderExists = false;
    let existingOrderData: any = null;
    try {
      if (prismaClient?.order) {
        const existing = await prismaClient.order.findUnique({
          where: { id: orderId },
          select: { status: true, paidAt: true },
        });
        if (existing) {
          previousStatus = existing.status;
          dbOrderExists = true;
          existingOrderData = existing;
        }
      }
    } catch {
      const currentMemoryOrder = getGlobalOrders().find((o) => o.id === orderId);
      previousStatus = currentMemoryOrder?.order_status || 'pending';
    }

    // 2. Persist update and create audit log in Prisma database
    try {
      if (prismaClient?.order) {
        const isPaid = newStatus === 'completed' || newStatus === 'processing';

        // If order exists in memory but missing in DB, sync from memory first so update won't fail
        if (!dbOrderExists) {
          const memOrder = getGlobalOrders().find((o) => o.id === orderId);
          if (memOrder) {
            await prismaClient.order.create({
              data: {
                id: memOrder.id,
                customerEmail: memOrder.customer_email || 'customer@asterra.store',
                customerName: memOrder.customer_name || null,
                customerWhatsapp: memOrder.customer_whatsapp || null,
                customerNotes: memOrder.customer_notes || null,
                totalAmount: memOrder.total_amount,
                rawAmount: memOrder.raw_amount || memOrder.total_amount,
                promoDiscount: 0,
                referralDiscount: 0,
                uniqueCode: memOrder.unique_code || null,
                paymentMode: memOrder.payment_mode || 'gateway',
                status: previousStatus,
                paymentMethod: memOrder.payment?.payment_method || 'qris',
                paymentStatus: isPaid ? 'settlement' : previousStatus,
                items: {
                  create: (memOrder.items || []).map((i) => ({
                    productId: i.product_id || 'prod-digital',
                    productName: i.product_name,
                    price: i.unit_price,
                    quantity: i.quantity,
                    targetEmail: i.purchased_details?.target_email || memOrder.customer_email,
                    targetPhone: i.purchased_details?.phone || memOrder.customer_whatsapp || null,
                    duration: i.purchased_details?.duration || 'standard',
                  })),
                },
              },
            }).catch((syncErr: any) => console.warn('[OrderAdminService] Auto-sync mem order error:', syncErr));
          }
        }

        await prismaClient.order.update({
          where: { id: orderId },
          data: {
            status: newStatus,
            paymentStatus: isPaid ? 'settlement' : newStatus,
            ...(isPaid ? { paidAt: existingOrderData?.paidAt || new Date() } : {}),
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
      console.error('[OrderAdminService] Prisma status update error:', dbErr);
    }

    // Synchronize in-memory store as well
    updateGlobalOrderStatus(orderId, newStatus, actor, notes);

    // 3. Attribution of Affiliate Sales Commission & Profit Ledger (SSOT §8, §15, §17)
    // Idempotent: Only credit once when status becomes processing/completed, not on repeated transitions
    if ((newStatus === 'processing' || newStatus === 'completed') && previousStatus !== 'completed' && previousStatus !== 'processing') {
      try {
        let referralCode: string | undefined = undefined;
        let orderTotalAmount = 0;
        let rawSellingPrice = 0;
        let customerDiscount = 0;
        let customerEmail: string = 'customer@asterra.store';
        let customerPhone: string | undefined = undefined;
        let customerName: string | undefined = undefined;
        let paymentMode = 'gateway';
        let itemsList: Array<{ productId: string; productName: string; price: number; quantity: number }> = [];

        // Check in-memory order first
        const memOrder = getGlobalOrders().find((o) => o.id === orderId);
        if (memOrder) {
          referralCode = memOrder.referral_code;
          orderTotalAmount = memOrder.total_amount;
          rawSellingPrice = memOrder.raw_amount || memOrder.total_amount;
          customerDiscount = memOrder.discount_amount || 0;
          customerEmail = memOrder.customer_email || customerEmail;
          customerPhone = memOrder.customer_whatsapp;
          customerName = memOrder.customer_name;
          paymentMode = memOrder.payment_mode || 'gateway';
          itemsList = (memOrder.items || []).map((i) => ({
            productId: i.product_id,
            productName: i.product_name,
            price: i.unit_price,
            quantity: i.quantity,
          }));
        }

        // If in DB, fetch details and items
        if (prismaClient?.order) {
          const dbOrder = await prismaClient.order.findUnique({
            where: { id: orderId },
            include: {
              items: true,
              logs: {
                where: {
                  OR: [
                    { action: 'referral_applied' },
                    { action: 'order_created' },
                    { action: 'promo_applied' },
                  ],
                },
                take: 5,
              },
            },
          });
          if (dbOrder) {
            orderTotalAmount = dbOrder.totalAmount;
            rawSellingPrice = dbOrder.rawAmount || rawSellingPrice || dbOrder.totalAmount;
            // Only commercial discounts reduce revenue. uniqueCode is a transfer identifier, not a discount.
            const storedDiscount = (dbOrder.promoDiscount || 0) + (dbOrder.referralDiscount || 0);
            customerDiscount = storedDiscount > 0
              ? storedDiscount
              : dbOrder.rawAmount
                ? Math.max(0, dbOrder.rawAmount - dbOrder.totalAmount + (dbOrder.uniqueCode || 0))
                : 0;
            customerEmail = dbOrder.customerEmail || customerEmail;
            customerPhone = customerPhone || dbOrder.customerWhatsapp || (dbOrder as any).customerPhone || undefined;
            customerName = customerName || dbOrder.customerName || undefined;
            paymentMode = dbOrder.paymentMode || paymentMode;

            if (dbOrder.items && dbOrder.items.length > 0 && itemsList.length === 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              itemsList = dbOrder.items.map((i: any) => ({
                productId: i.productId,
                productName: i.productName,
                price: i.price,
                quantity: i.quantity,
              }));
            }

            // Prefer dedicated referral column over log metadata
            if (!referralCode && dbOrder.referralCode) {
              referralCode = dbOrder.referralCode;
            }
            // Check logs metadata
            if (!referralCode) {
              for (const log of dbOrder.logs || []) {
                if (log.metadata && typeof log.metadata === 'object' && 'referral_code' in log.metadata) {
                  referralCode = (log.metadata as { referral_code?: string }).referral_code;
                  break;
                }
              }
            }
            // Check customerNotes pattern [Sales Ref: CODE]
            if (!referralCode && dbOrder.customerNotes) {
              const match = dbOrder.customerNotes.match(/\[Sales Ref:\s*([A-Za-z0-9_-]+)\]/i);
              if (match && match[1]) {
                referralCode = match[1];
              }
            }
          }
        }

        // Fetch real product cost_of_goods from DB with resilient fallback
        let totalCOGS = 0;
        try {
          const productIds = itemsList.map((i) => i.productId).filter(Boolean);
          if (productIds.length > 0 && prismaClient?.product) {
            const dbProducts = await prismaClient.product.findMany({
              where: { id: { in: productIds } },
              select: { id: true, providerPrice: true, price: true },
            });
            const productMap = new Map<string, { id: string; providerPrice?: number | null; price: number }>(
              dbProducts.map((p: { id: string; providerPrice?: number | null; price: number }) => [p.id, p])
            );

            for (const item of itemsList) {
              const p = productMap.get(item.productId);
              const unitCost = p?.providerPrice && p.providerPrice > 0
                ? p.providerPrice
                : Math.round(item.price * 0.85);
              totalCOGS += unitCost * item.quantity;
            }
          } else {
            totalCOGS = Math.round((rawSellingPrice || orderTotalAmount) * 0.85);
          }
        } catch {
          totalCOGS = Math.round((rawSellingPrice || orderTotalAmount) * 0.85);
        }

        const paymentFee = ReferralProfitService.estimatePaymentFee(orderTotalAmount, paymentMode);

        // Check if referral partner exists
        const partner = referralCode ? await SalesDbService.findByCode(referralCode) : undefined;
        let recruiterPartner = null;

        if (partner && partner.referredById) {
          recruiterPartner = await SalesDbService.findById(partner.referredById);
        }

        // Run SSOT profit calculation
        const breakdown = ReferralProfitService.calculate({
          sellingPrice: rawSellingPrice || orderTotalAmount,
          customerDiscount,
          costOfGoods: totalCOGS,
          paymentFee,
          otherDirectCost: 0,
          hasDirectReferral: Boolean(partner && partner.status === 'active'),
          hasDirectRecruiter: Boolean(recruiterPartner && recruiterPartner.status === 'active'),
          salesCommissionRate: partner ? partner.rate / 100 : undefined,
        });

        // Record in Profit Sharing General Ledger (SSOT §8) for ALL orders (with or without referral)
        const productNamesJoined = itemsList.map((i) => i.productName).join(', ') || 'Lisensi Digital';
        const primaryProductId = itemsList[0]?.productId || 'prod-digital';

        try {
          await SalesDbService.recordProfitLedger({
            orderId,
            customerEmail,
            customerName,
            productId: primaryProductId,
            productNames: productNamesJoined,
            salesId: partner?.id,
            salesName: partner?.name,
            referralCode: partner?.code,
            recruiterSalesId: recruiterPartner?.id,
            recruiterSalesName: recruiterPartner?.name,
            breakdown,
          });
          console.log(`[ProfitLedger] Successfully recorded financial ledger for order ${orderId}`);
        } catch (ledgerErr) {
          console.error('[OrderAdminService] Failed to record profit ledger:', ledgerErr);
        }

        // Credit to SalesDb Service if active referral
        if (partner && partner.status === 'active') {
          try {
            const creditResult = await SalesDbService.recordSuccessfulOrder(
              {
                orderId,
                partnerId: partner.id,
                recruiterId: recruiterPartner?.id,
                breakdown,
                customerEmail,
                customerName,
              }
            );

            if (creditResult.success && creditResult.commission > 0) {
              console.log(
                `[AffiliateCommission] Credited Rp ${creditResult.commission} (10% profit) to partner "${creditResult.partnerName}" for order ${orderId}`
              );
              if (prismaClient?.orderLog) {
                await prismaClient.orderLog.create({
                  data: {
                    orderId,
                    actor: 'system',
                    action: 'affiliate_commission_credited',
                    notes: `Komisi penjualan Rp ${creditResult.commission.toLocaleString('id-ID')} (10% dari Profit Transaksi Rp ${breakdown.transactionProfit.toLocaleString('id-ID')}) berhasil dialokasikan ke mitra sales "${creditResult.partnerName}" (${partner.code}).`,
                    metadata: {
                      referral_code: partner.code,
                      commission: creditResult.commission,
                      transaction_profit: breakdown.transactionProfit,
                      recruitment_bonus: breakdown.recruitmentBonus,
                      ceo_share: breakdown.ceoShare,
                      coo_share: breakdown.cooShare,
                      business_reserve: breakdown.businessReserve,
                      partner_name: creditResult.partnerName,
                    },
                  },
                });
              }
            } else if (!creditResult.success) {
              console.warn(`[AffiliateCommission] Notice: ${creditResult.message}`);
            }
          } catch (affCreditErr) {
            console.error('[OrderAdminService] Failed to credit affiliate commission:', affCreditErr);
          }
        }
      } catch (affiliateErr) {
        console.warn('[OrderAdminService] Error processing profit sharing and affiliate commission:', affiliateErr);
      }
    }

    // 4. Automatic Reversal of Affiliate Commission on Order Refund / Cancellation
    if (newStatus === 'cancelled' || (newStatus as string) === 'refunded') {
      try {
        const refundResult = await SalesDbService.handleOrderRefund(
          orderId,
          notes || `Status pesanan diubah ke ${newStatus}`
        );
        if (refundResult.success) {
          console.log(`[AffiliateCommission] ${refundResult.message}`);
          if (prismaClient?.orderLog) {
            await prismaClient.orderLog.create({
              data: {
                orderId,
                actor: 'system',
                action: 'affiliate_commission_reversed',
                notes: refundResult.message,
                metadata: {
                  direct_commission_reversed: refundResult.directCommissionReversed,
                  network_bonus_reversed: refundResult.networkBonusReversed,
                },
              },
            });
          }
        }
      } catch (refundErr) {
        console.warn('[OrderAdminService] Error reversing affiliate commission on refund:', refundErr);
      }
    }

    const updatedOrder = await this.getOrderById(orderId);
    const effectiveOrder: Order = updatedOrder || {
      id: orderId,
      user_id: 'user-001',
      customer_email: 'customer@asterra.store',
      total_amount: 0,
      order_status: newStatus,
      order_date: new Date().toISOString(),
      items: [],
    };

    // If order cancelled/expired after payment, release referral discount claim
    if (newStatus === 'cancelled' && previousStatus === 'processing') {
      try {
        const commission = await prismaClient.commission.findUnique({ where: { orderId } });
        if (commission && !commission.reversalReason) {
          await prismaClient.commission.update({
            where: { orderId },
            data: { status: 'reversed', reversalReason: 'Order dibatalkan setelah pembayaran' },
          });
          const order = await prismaClient.order.findUnique({ where: { id: orderId } });
          if (order?.referralDiscount && order.referralDiscount > 0 && order.referralCode) {
            await prismaClient.referralDiscountUsage.deleteMany({ where: { orderId } });
          }
        }
      } catch (releaseErr) {
        console.warn('[OrderAdminService] Failed to release referral discount on cancel:', releaseErr);
      }
    }

    // Broadcast SSE update event to user and admin clients
    broadcastOrderEvent({
      type: newStatus === 'processing' || newStatus === 'completed' ? 'order:payment_verified' : 'order:status_changed',
      orderId,
      status: newStatus,
      customerName: effectiveOrder.customer_name,
      customerEmail: effectiveOrder.customer_email,
      totalAmount: effectiveOrder.total_amount,
      message: `Status pesanan ${orderId} diubah menjadi: ${newStatus === 'processing' ? 'Di Proses' : newStatus === 'completed' ? 'Selesai' : newStatus}`,
      timestamp: new Date().toISOString(),
    });

    return effectiveOrder;
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

        if (dbLogs) {
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
