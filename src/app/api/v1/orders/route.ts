import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getGlobalOrders, addGlobalOrder, Order, OrderItem } from '@/lib/orders-data';
import { AdminCatalogStore } from '@/lib/services/admin-catalog-store';
import { PaymentConfigService } from '@/lib/services/payment-config.service';
import { prisma } from '@/lib/prisma';
import { broadcastOrderEvent } from '@/lib/services/event-bus';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { PromoService } from '@/lib/services/promo.service';
import { mapDbOrderToOrder, RawDbOrder } from '@/lib/utils/order-mapper';
import { OrderAdminService } from '@/lib/services/order-admin.service';

// GET /api/v1/orders
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  // Auto-cancel any expired pending orders before returning lists
  await OrderAdminService.autoCancelExpiredOrders().catch((e) =>
    console.warn('[OrdersAPI] Auto-cancel runner error:', e)
  );

  let orders = getGlobalOrders();

  // Synchronize orders from PostgreSQL via Prisma
  try {
    const dbOrders = await prisma.order.findMany({
      take: 50,
      include: {
        items: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const existingIds = new Set(orders.map((o) => o.id));
    for (const d of dbOrders) {
      if (!existingIds.has(d.id)) {
        orders.push(mapDbOrderToOrder(d as unknown as RawDbOrder));
      }
    }
  } catch (err) {
    console.warn('[OrdersAPI] Prisma sync warning on GET:', err);
  }

  if (status && status !== 'all') {
    orders = orders.filter((o) => o.order_status === status);
  }

  const total = orders.length;
  const startIndex = (page - 1) * limit;
  const paginatedOrders = orders.slice(startIndex, startIndex + limit);

  return NextResponse.json({
    success: true,
    data: paginatedOrders,
    pagination: {
      total_items: total,
      current_page: page,
      total_pages: Math.ceil(total / limit) || 1,
      items_per_page: limit,
    },
  });
}

// POST /api/v1/orders
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customer_notes, customer_contact } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Daftar item pesanan wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Read current active payment configuration
    const paymentConfig = await PaymentConfigService.getConfig();
    const isManualMode = paymentConfig.mode === 'manual';

    // Check if user is authenticated via Better Auth session
    let sessionUser: { id: string; name?: string; email: string } | null = null;
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (session?.user) {
        sessionUser = session.user;
      }
    } catch (sessionErr) {
      console.warn('[OrdersAPI] Session check skipped:', sessionErr);
    }

    const orderId = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    let rawTotalAmount = 0;

    const customerEmail =
      customer_contact?.email?.trim() ||
      sessionUser?.email ||
      'customer@asterra.store';

    const customerName =
      customer_contact?.name?.trim() ||
      sessionUser?.name ||
      customerEmail
        .split('@')[0]
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase());

    const customerWhatsapp = customer_contact?.phone?.trim() || null;

    // 2. Strict Server-side Price Lookup: Query Prisma database and catalog repository
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestedProductIds = items.map((i: any) => i.product_id).filter(Boolean);
    const possibleBaseIds = items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((i: any) => {
        const lastIdx = i.product_id ? i.product_id.lastIndexOf('-') : -1;
        return lastIdx > 0 ? i.product_id.substring(0, lastIdx) : i.product_id;
      })
      .filter(Boolean);

    const lookupIds = Array.from(new Set([...requestedProductIds, ...possibleBaseIds]));

    const dbProducts = await prisma.product.findMany({
      where: { id: { in: lookupIds } },
    });
    const dbProductMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Disk fallback catalog reader for cold-start serverless environments
    let diskCatalogMap: Map<string, { id: string; name: string; price: number }> | null = null;
    const getDiskCatalog = () => {
      if (!diskCatalogMap) {
        diskCatalogMap = new Map();
        try {
          const activeCatalogPath = path.resolve(process.cwd(), 'data/active-catalog.json');
          if (fs.existsSync(activeCatalogPath)) {
            const rawCatalog = JSON.parse(fs.readFileSync(activeCatalogPath, 'utf-8'));
            if (Array.isArray(rawCatalog)) {
              for (const p of rawCatalog) {
                if (p && p.id && typeof p.price === 'number') {
                  diskCatalogMap.set(p.id, { id: p.id, name: p.name, price: p.price });
                }
              }
            }
          }
        } catch {
          // ignore disk read errors
        }
      }
      return diskCatalogMap;
    };

    const orderItems: OrderItem[] = items.map((item, index) => {
      const lastHyphenIndex = item.product_id ? item.product_id.lastIndexOf('-') : -1;
      const possibleBaseId =
        lastHyphenIndex > 0 ? item.product_id.substring(0, lastHyphenIndex) : item.product_id;
      const parsedDuration =
        lastHyphenIndex > 0 ? item.product_id.substring(lastHyphenIndex + 1) : 'standard';

      // 1. Check DB lookup (PostgreSQL)
      const dbProduct = dbProductMap.get(item.product_id) || dbProductMap.get(possibleBaseId);

      // 2. Check Catalog Store lookup (In-Memory)
      const catalogProduct = !dbProduct
        ? AdminCatalogStore.getProductById(item.product_id) ||
          AdminCatalogStore.getProductById(possibleBaseId)
        : null;

      // 3. Check Disk Fallback (active-catalog.json)
      const diskMap = (!dbProduct && !catalogProduct) ? getDiskCatalog() : null;
      const diskProduct = diskMap
        ? diskMap.get(item.product_id) || diskMap.get(possibleBaseId)
        : null;

      const product = dbProduct || catalogProduct || diskProduct;

      // STRICT ZERO-TRUST SECURITY: Product must exist in verified catalog. Never allow arbitrary client injection.
      if (!product || typeof product.price !== 'number' || product.price <= 0) {
        throw new Error(
          `Produk "${item.product_name || item.product_id}" tidak valid atau tidak terdaftar di katalog resmi Asterra Store.`
        );
      }

      // STRICT SERVER-SIDE PRICE LOCKING: Price is ALWAYS determined by server catalog/DB, NEVER by client payload.
      const unitPrice = Math.round(product.price);
      const quantity = Math.max(1, Math.min(100, Number(item.quantity) || 1));
      rawTotalAmount += unitPrice * quantity;

      return {
        id: `item-${orderId}-${index + 1}`,
        product_id: item.product_id,
        product_name: product.name || item.product_name || 'Lisensi Digital Premium',
        unit_price: unitPrice,
        quantity,
        purchased_details: {
          target_email: item.purchased_details?.target_email || customerEmail,
          duration: item.purchased_details?.duration || parsedDuration,
          phone: item.purchased_details?.phone || customerWhatsapp || '',
        },
      };
    });

    // 3. Strict Server-Side Promo Code Validation & Discount Deduction (Anti-Fraud)
    let discountAmount = 0;
    let appliedPromoCode: string | null = null;
    if (body.promo_code && typeof body.promo_code === 'string' && body.promo_code.trim()) {
      const promoValidation = await PromoService.validatePromo(
        body.promo_code,
        rawTotalAmount,
        customerEmail
      );
      if (promoValidation.valid && promoValidation.discountAmount) {
        discountAmount = promoValidation.discountAmount;
        appliedPromoCode = promoValidation.code || body.promo_code.trim().toUpperCase();
      }
    }
    const discountedTotalAmount = Math.max(0, rawTotalAmount - discountAmount);

    // 4. Generate 3-digit randomized unique payment code for manual transfers (Anti-Fraud)
    let uniqueCode = 0;
    if (isManualMode && paymentConfig.enableUniqueCode) {
      // Generate randomized 3 digit number between 101 and 999
      uniqueCode = Math.floor(100 + Math.random() * 900);
    }
    const finalTotalAmount = discountedTotalAmount + uniqueCode;

    // 5. Calculate order expiration timestamp
    const expiryHours = paymentConfig.orderExpiryHours || 24;
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    const newOrder: Order = {
      id: orderId,
      user_id: sessionUser?.id || 'user-001',
      customer_email: customerEmail,
      customer_name: customerName,
      customer_whatsapp: customerWhatsapp || undefined,
      total_amount: finalTotalAmount,
      raw_amount: rawTotalAmount,
      unique_code: uniqueCode > 0 ? uniqueCode : undefined,
      promo_code: appliedPromoCode || undefined,
      discount_amount: discountAmount > 0 ? discountAmount : undefined,
      payment_mode: isManualMode ? 'manual' : 'gateway',
      order_status: 'pending',
      order_date: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      customer_notes: customer_notes || '',
      items: orderItems,
      payment: {
        id: `pay-${orderId}`,
        payment_method: body.payment_method || (isManualMode ? 'qris_manual' : 'qris'),
        transaction_id: `trx-${orderId.replace(/\D/g, '')}`,
        payment_status: 'pending',
        amount: finalTotalAmount,
      },
    };

    addGlobalOrder(newOrder);

    // Record promo code redemption atomically if applied
    if (appliedPromoCode && discountAmount > 0) {
      try {
        await PromoService.redeemPromo(
          appliedPromoCode,
          orderId,
          rawTotalAmount,
          customerEmail
        );
      } catch (promoErr) {
        console.warn('[OrdersAPI] Error redeeming promo code:', promoErr);
      }
    }

    // Persist to PostgreSQL Database via Prisma (with OrderItems)
    try {
      // Verify existing products to prevent foreign key errors
      const requestedProductIds = orderItems.map((i) => i.product_id);
      const existingDbProducts = await prisma.product.findMany({
        where: { id: { in: requestedProductIds } },
        select: { id: true },
      });
      const validProductIdSet = new Set(existingDbProducts.map((p) => p.id));

      // Ensure fallback product exists
      if (!validProductIdSet.has('prod-digital')) {
        await prisma.product.upsert({
          where: { id: 'prod-digital' },
          update: {},
          create: {
            id: 'prod-digital',
            name: 'Lisensi Layanan Digital',
            categoryId: 'digital',
            categoryName: 'Layanan Digital',
            brand: 'Asterra Store',
            price: 14000,
            priceFormatted: 'Rp 14.000',
            status: 'active',
          },
        });
      }

      await prisma.order.create({
        data: {
          id: orderId,
          customerName,
          customerEmail,
          customerWhatsapp,
          customerNotes: customer_notes || null,
          totalAmount: finalTotalAmount,
          rawAmount: rawTotalAmount,
          uniqueCode: uniqueCode > 0 ? uniqueCode : null,
          paymentMode: isManualMode ? 'manual' : 'gateway',
          expiresAt,
          status: 'pending',
          paymentMethod: body.payment_method || (isManualMode ? 'manual_transfer' : 'qris'),
          logs: {
            create: [
              {
                actor: 'system',
                action: appliedPromoCode ? 'promo_applied' : 'order_created',
                notes: appliedPromoCode
                  ? `Voucher "${appliedPromoCode}" diterapkan (Potongan: Rp ${discountAmount.toLocaleString('id-ID')})`
                  : 'Pesanan baru dibuat oleh pelanggan.',
                metadata: appliedPromoCode
                  ? { promo_code: appliedPromoCode, discount_amount: discountAmount }
                  : {},
              },
            ],
          },
          items: {
            create: orderItems.map((item) => {
              const matchedProductId = validProductIdSet.has(item.product_id)
                ? item.product_id
                : 'prod-digital';
              return {
                productId: matchedProductId,
                productName: item.product_name,
                price: item.unit_price,
                quantity: item.quantity,
                targetEmail: item.purchased_details?.target_email || customerEmail,
                targetPhone: item.purchased_details?.phone || customerWhatsapp,
                duration: item.purchased_details?.duration || 'standard',
              };
            }),
          },
        },
      });
    } catch (dbErr) {
      console.warn('[OrdersAPI] Prisma order & items persistence error:', dbErr);
    }

    // Broadcast Realtime SSE Event to Admin (sound + toast alert)
    broadcastOrderEvent({
      type: 'order:created',
      orderId,
      order: newOrder,
      customerName,
      customerEmail,
      totalAmount: finalTotalAmount,
      paymentMethod: newOrder.payment?.payment_method,
      status: 'pending',
      timestamp: new Date().toISOString(),
      message: `Pesanan baru masuk: ${orderId} dari ${customerName} (Rp ${finalTotalAmount.toLocaleString('id-ID')})`,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Pesanan berhasil dibuat.',
        order: newOrder,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Terjadi kesalahan format data pesanan.';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 400 }
    );
  }
}
