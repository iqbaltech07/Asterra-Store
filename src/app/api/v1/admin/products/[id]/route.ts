import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { PrismaCatalogRepository } from '@/lib/services/prisma-catalog.repository';
import { AdminAuthService } from '@/lib/services/admin-auth.service';

/**
 * Checks if a URL is a Vercel Blob private media URL managed by Asterra.
 * Only these URLs should be cleaned up from Blob storage.
 */
function isAsterraBlobUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return url.includes('/api/v1/media/') || url.includes('blob.vercel-storage.com');
}

/**
 * Extracts the Blob pathname from an internal media URL.
 * /api/v1/media/products/file.webp → products/file.webp
 */
function extractBlobPathname(url: string): string | null {
  const prefix = '/api/v1/media/';
  const idx = url.indexOf(prefix);
  if (idx !== -1) {
    return url.slice(idx + prefix.length);
  }
  // Direct blob URL — use as-is for del()
  if (url.includes('blob.vercel-storage.com')) {
    return url;
  }
  return null;
}

/**
 * Safely deletes a blob from Vercel Blob storage.
 * Logs errors but never throws — GC failures should not break the main operation.
 */
async function safeDeleteBlob(url: string): Promise<void> {
  const pathname = extractBlobPathname(url);
  if (!pathname) return;

  try {
    await del(pathname);
    console.log(`[BlobGC] Deleted orphan blob: ${pathname}`);
  } catch (err) {
    // BlobNotFoundError is expected if blob was already removed
    console.warn(`[BlobGC] Failed to delete blob "${pathname}":`, err);
  }
}

/**
 * Checks if any other product in the catalog is using the same image URL.
 * Uses a focused Prisma count query for efficiency.
 */
async function isBlobUsedByOtherProducts(
  imageUrl: string,
  excludeProductId: string
): Promise<boolean> {
  try {
    const count = await prisma.product.count({
      where: {
        imageUrl: imageUrl,
        id: { not: excludeProductId },
      },
    });
    return count > 0;
  } catch {
    // If we can't check, assume it's in use to be safe
    return true;
  }
}

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
 * Update product details, retail price, or visibility status.
 *
 * Pilar 3 (Garbage Collection): When imageUrl changes, the old Blob is deleted
 * if it's an Asterra-managed private blob and not shared by other products.
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
    if (body.providerPrice !== undefined) {
      const pp = Number(body.providerPrice);
      if (!isNaN(pp) && pp >= 0) {
        updates.providerPrice = pp;
      }
    }
    if (body.stock !== undefined) {
      const s = Number(body.stock);
      if (!isNaN(s) && s >= 0) {
        updates.stock = s;
      }
    }
    if (body.providerStatus !== undefined) {
      updates.providerStatus = body.providerStatus;
    }

    // [T10] Jika stok dari vip reseller habis/empty maka set ke 0 langsung
    const finalProviderStatus = updates.providerStatus ?? product.providerStatus;
    if (product.provider === 'vip-reseller' && finalProviderStatus === 'empty') {
      updates.stock = 0;
    }

    if (body.description !== undefined) updates.description = String(body.description);
    if (body.imageUrl !== undefined) updates.imageUrl = String(body.imageUrl);
    if (body.features !== undefined) updates.features = body.features;
    if (body.popular !== undefined) updates.popular = Boolean(body.popular);
    if (body.guaranteeTitle !== undefined) updates.guaranteeTitle = String(body.guaranteeTitle).trim();
    if (body.guaranteeDesc !== undefined) updates.guaranteeDesc = String(body.guaranteeDesc).trim();
    if (body.processTitle !== undefined) updates.processTitle = String(body.processTitle).trim();
    if (body.processDesc !== undefined) updates.processDesc = String(body.processDesc).trim();
    if (body.privacyTitle !== undefined) updates.privacyTitle = String(body.privacyTitle).trim();
    if (body.privacyDesc !== undefined) updates.privacyDesc = String(body.privacyDesc).trim();

    // --- Pilar 3: Garbage Collection on Image Change ---
    const oldImageUrl = product.imageUrl;
    const newImageUrl = updates.imageUrl as string | undefined;
    const imageChanged = newImageUrl !== undefined && newImageUrl !== oldImageUrl;

    const updated = await PrismaCatalogRepository.updateProduct(id, updates);

    // After successful update, clean up the old blob if image changed
    if (imageChanged && isAsterraBlobUrl(oldImageUrl)) {
      const isShared = await isBlobUsedByOtherProducts(oldImageUrl, id);
      if (!isShared) {
        // Fire-and-forget: GC should not block the response
        safeDeleteBlob(oldImageUrl).catch(() => {});
      }
    }

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
 *
 * Pilar 3 (Garbage Collection): When a product is deleted, its Blob image
 * is also removed from storage if not shared by other products.
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
    // Fetch product before deletion to get its image URL for GC
    const product = await PrismaCatalogRepository.getProductById(id);
    const imageUrlToClean = product?.imageUrl;

    await PrismaCatalogRepository.deleteProduct(id);

    // --- Pilar 3: Garbage Collection on Product Delete ---
    if (imageUrlToClean && isAsterraBlobUrl(imageUrlToClean)) {
      const isShared = await isBlobUsedByOtherProducts(imageUrlToClean, id);
      if (!isShared) {
        safeDeleteBlob(imageUrlToClean).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Produk berhasil dihapus dari sistem Asterra Store.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `Gagal menghapus produk: ${msg}` },
      { status: 500 }
    );
  }
}
