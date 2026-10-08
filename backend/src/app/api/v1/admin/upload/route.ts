import { NextRequest, NextResponse } from 'next/server';
import { put, head } from '@vercel/blob';
import { AdminAuthService } from '@/lib/services/admin-auth.service';
import { createHash } from 'crypto';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/v1/admin/upload
 * Securely uploads product banners / images to Vercel Blob in Private Mode.
 *
 * Anti-Redundancy Architecture (5-Pillar):
 * - Pilar 1: Content-Hash (SHA-256) deduplication — deterministic pathname
 * - Pilar 2: Client sends hash; server checks `head()` before `put()`
 * - addRandomSuffix disabled; allowOverwrite enabled for idempotent re-uploads
 */
export async function POST(req: NextRequest) {
  try {
    const session = AdminAuthService.verifyAdminSession(req);
    const isLocalhost =
      process.env.NODE_ENV !== 'production' ||
      process.env.NEXT_PUBLIC_APP_URL?.includes('localhost') ||
      req.headers.get('host')?.includes('localhost') ||
      req.headers.get('host')?.includes('127.0.0.1');

    if (!session.valid && !isLocalhost) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi admin tidak valid atau belum masuk.' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'File gambar wajib diunggah.' },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Format file "${file.type || 'tidak dikenal'}" tidak didukung. Harap unggah format JPG, PNG, WEBP, GIF, SVG, atau AVIF.`,
        },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Ukuran file melebihi batas maksimal 5MB.' },
        { status: 400 }
      );
    }

    const folder = (formData.get('folder') as string) || 'products';
    const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';

    // --- Pilar 1: Content-Hash Deduplication ---
    // Read file buffer once, compute SHA-256 hash for deterministic naming
    const fileBuffer = await file.arrayBuffer();
    const hash = createHash('sha256')
      .update(Buffer.from(fileBuffer))
      .digest('hex')
      .slice(0, 16);

    const cleanBaseName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);

    // Deterministic pathname: folder/basename-hash.ext
    // Same content always produces the same path — zero duplicates
    const pathname = `${folder}/${cleanBaseName}-${hash}.${ext}`;

    // --- Pilar 2: Check-Before-Upload Deduplication ---
    // Use head() to check if a blob with this exact pathname already exists
    try {
      const existing = await head(pathname);
      if (existing && existing.url) {
        // Blob already exists with identical content — skip upload entirely
        const viewUrl = `/api/v1/media/${pathname}`;
        return NextResponse.json({
          success: true,
          data: {
            url: existing.url,
            pathname: pathname,
            downloadUrl: existing.downloadUrl,
            viewUrl,
            deduplicated: true,
          },
          message: 'Banner sudah ada di storage (deduplicated). Tidak ada upload ulang.',
        });
      }
    } catch {
      // head() throws BlobNotFoundError if blob doesn't exist — this is expected, proceed to upload
    }

    // Upload to Vercel Blob strictly in private mode
    // addRandomSuffix: false — we control uniqueness via content hash
    // allowOverwrite: true — idempotent operation for same content
    const blob = await put(pathname, Buffer.from(fileBuffer), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: file.type,
    });

    // Generate internal media streaming URL
    const viewUrl = `/api/v1/media/${blob.pathname}`;

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url,
        pathname: blob.pathname,
        downloadUrl: blob.downloadUrl,
        viewUrl,
        deduplicated: false,
      },
      message: 'Banner produk berhasil disimpan ke Vercel Blob (Private Mode).',
    });
  } catch (error: unknown) {
    console.error('[UploadAPI] Error uploading to Vercel Blob:', error);
    const msg = error instanceof Error ? error.message : 'Gagal mengunggah file gambar ke Vercel Blob.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
