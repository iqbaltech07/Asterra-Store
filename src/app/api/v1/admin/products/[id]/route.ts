import { NextRequest, NextResponse } from 'next/server';
import { PrismaCatalogRepository } from '@/lib/services/prisma-catalog.repository';
import { AdminAuthService } from '@/lib/services/admin-auth.service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/admin/products/:id
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = AdminAuthService.verifyAdminSession(req);
  if (!session.valid) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Sesi admin tidak valid atau belum masuk.' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const product = await PrismaCatalogRepository.getProductById(id);

  if (!product) {
    return NextResponse.json(
      { success: false, message: 'Produk tidak ditemukan' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: product });
}

/**
 * PATCH /api/v1/admin/products/:id
 * Update product details, retail price, or visibility status
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = AdminAuthService.verifyAdminSession(req);
  if (!session.valid) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Sesi admin tidak valid atau belum masuk.' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const product = await PrismaCatalogRepository.getProductById(id);

  if (!product) {
    return NextResponse.json(
      { success: false, message: 'Produk tidak ditemukan' },
      { status: 404 }
    );
  }

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.price !== undefined) {
      const p = Number(body.price);
      if (isNaN(p) || p < 0) {
        return NextResponse.json(
          { success: false, message: 'Harga retail harus berupa angka valid.' },
          { status: 400 }
        );
      }
      updates.price = p;
      updates.priceFormatted = `Rp ${Math.round(p / 1000)} Rb`;
    }
    if (body.status !== undefined) {
      if (body.status !== 'active' && body.status !== 'archived') {
        return NextResponse.json(
          { success: false, message: 'Status harus berupa "active" atau "archived".' },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }
    if (body.description !== undefined) updates.description = String(body.description);
    if (body.imageUrl !== undefined) updates.imageUrl = String(body.imageUrl);
    if (body.features !== undefined) updates.features = body.features;
    if (body.popular !== undefined) updates.popular = Boolean(body.popular);

    const updated = await PrismaCatalogRepository.updateProduct(id, updates);

    return NextResponse.json({
      success: true,
      message: 'Detail produk berhasil diperbarui.',
      data: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `Gagal memperbarui produk: ${msg}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/admin/products/:id
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = AdminAuthService.verifyAdminSession(req);
  if (!session.valid) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Sesi admin tidak valid atau belum masuk.' },
      { status: 401 }
    );
  }

  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Produk berhasil dihapus dari sistem.',
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Produk tidak ditemukan atau gagal dihapus.' },
      { status: 404 }
    );
  }
}
