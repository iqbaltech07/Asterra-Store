import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { PrismaCatalogRepository } from '@/lib/services/prisma-catalog.repository';
import { AdminAuthService } from '@/lib/services/admin-auth.service';

/**
 * Checks if a URL is a Vercel Blob private media URL managed by Asterra.
 */
function isAsterraBlobUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return url.includes('/api/v1/media/') || url.includes('blob.vercel-storage.com');
}

/**
 * Extracts the Blob pathname from an internal media URL.
 */
function extractBlobPathname(url: string): string | null {
  const prefix = '/api/v1/media/';
  const idx = url.indexOf(prefix);
  if (idx !== -1) return url.slice(idx + prefix.length);
  if (url.includes('blob.vercel-storage.com')) return url;
  return null;
}

/**
 * POST /api/v1/admin/products/bulk-delete
 * Permanently delete multiple products in a single database operation.
 *
 * Pilar 3 (Garbage Collection): Cleans up Vercel Blob images for deleted products
 * that are not shared by remaining products.
 */
export async function POST(req: NextRequest) {
  const session = AdminAuthService.verifyAdminSession(req);
  if (!session.valid) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Sesi admin tidak valid atau belum masuk.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Daftar ID produk yang akan dihapus wajib diisi.' },
        { status: 400 }
      );
    }

    // Fetch image URLs before deletion for GC
    const productsToDelete = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, imageUrl: true },
    });

    const { count } = await PrismaCatalogRepository.bulkDeleteProducts(ids);

    // --- Pilar 3: Garbage Collection for bulk deleted products ---
    // Fire-and-forget: collect unique blob URLs and delete if not shared
    const blobUrls = productsToDelete
      .map((p) => p.imageUrl)
      .filter((url): url is string => isAsterraBlobUrl(url));

    const uniqueUrls = [...new Set(blobUrls)];

    for (const url of uniqueUrls) {
      try {
        // Check if any remaining product still uses this image
        const sharedCount = await prisma.product.count({
          where: { imageUrl: url },
        });

        if (sharedCount === 0) {
          const pathname = extractBlobPathname(url);
          if (pathname) {
            await del(pathname);
            console.log(`[BlobGC] Bulk-delete cleanup: ${pathname}`);
          }
        }
      } catch (err) {
        console.warn(`[BlobGC] Failed to clean blob "${url}":`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${count} produk terpilih dari sistem Asterra Store.`,
      count,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `Gagal menghapus produk massal: ${msg}` },
      { status: 500 }
    );
  }
}
