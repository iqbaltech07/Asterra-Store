import { NextRequest, NextResponse } from 'next/server';
import { getGlobalOrders, addGlobalOrder, Order, OrderItem } from '@/lib/orders-data';
import { AdminCatalogStore } from '@/lib/services/admin-catalog-store';
import { PaymentConfigService } from '@/lib/services/payment-config.service';
import { prisma } from '@/lib/prisma';
import { broadcastOrderEvent } from '@/lib/services/event-bus';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { PromoService } from '@/lib/services/promo.service';

// GET /api/v1/orders
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  let orders = getGlobalOrders();

  // Synchronize orders from PostgreSQL via Prisma
  try {
    const dbOrders = await prisma.order.findMany({
      take: 50,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    const existingIds = new Set(orders.map((o) => o.id));
    for (const d of dbOrders) {
      if (!existingIds.has(d.id)) {
        const mappedItems =
          d.items && d.items.length > 0
            ? d.items.map((it) => ({
                id: it.id,
                product_id: it.productId,
                product_name: it.productName,
                unit_price: it.price,
                quantity: it.quantity,
                purchased_details: {
                  target_email: it.targetEmail || d.customerEmail,
                  phone: it.targetPhone || d.customerWhatsapp || '',
                  duration: it.duration || 'standard',
                },
              }))
            : [
                {
                  id: `item-${d.id}-1`,
                  product_id: 'prod-digital',
                  product_name: 'Lisensi Layanan Digital',
                  unit_price: d.totalAmount,
                  quantity: 1,
                  purchased_details: {
                    target_email: d.customerEmail,
                    phone: d.customerWhatsapp || '',
                  },
                },
              ];

        orders.push({
          id: d.id,
          user_id: 'user-001',
          customer_email: d.customerEmail,
          customer_name: d.customerName || undefined,
          customer_whatsapp: d.customerWhatsapp || undefined,
          total_amount: d.totalAmount,
          raw_amount: d.rawAmount || undefined,
          unique_code: d.uniqueCode || undefined,
          payment_mode: (d.paymentMode as 'gateway' | 'manual') || 'gateway',
          order_status: (d.status as Order['order_status']) || 'pending',
          order_date: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
          expires_at: d.expiresAt ? new Date(d.expiresAt).toISOString() : undefined,
          customer_notes: d.customerNotes || '',
          items: mappedItems,
        });
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

    // 2. Strict Server-side Price Locking: Always use official catalog price, NEVER trust client unit_price!
    const orderItems: OrderItem[] = items.map((item, index) => {
      const lastHyphenIndex = item.product_id ? item.product_id.lastIndexOf('-') : -1;
      const possibleBaseId = lastHyphenIndex > 0 ? item.product_id.substring(0, lastHyphenIndex) : item.product_id;
      const parsedDuration = lastHyphenIndex > 0 ? item.product_id.substring(lastHyphenIndex + 1) : 'standard';

      const product =
        AdminCatalogStore.getProductById(item.product_id) ||
        AdminCatalogStore.getProductById(possibleBaseId);

      // Enforce server-side price integrity (prevent price tampering vulnerability)
      const unitPrice = product ? product.price : 14000;
      const quantity = Math.max(1, Math.min(100, Number(item.quantity) || 1));
      rawTotalAmount += unitPrice * quantity;

      return {
        id: `item-${orderId}-${index + 1}`,
        product_id: item.product_id,
        product_name: product?.name || item.product_name || 'Lisensi Digital Premium',
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
  } catch {
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan format data pesanan.' },
      { status: 400 }
    );
  }
}
