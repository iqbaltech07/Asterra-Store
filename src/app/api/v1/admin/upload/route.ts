import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { AdminAuthService } from '@/lib/services/admin-auth.service';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/v1/admin/upload
 * Securely uploads product banners / images to Vercel Blob in Private Mode.
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
        { success: false, error: 'Ukuran file melebihi batas maksimal 10MB.' },
        { status: 400 }
      );
    }

    const folder = (formData.get('folder') as string) || 'products';
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const cleanBaseName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    const pathname = `${folder}/${cleanBaseName}-${Date.now()}.${ext}`;

    // Upload to Vercel Blob strictly in private mode
    const blob = await put(pathname, file, {
      access: 'private',
      addRandomSuffix: true,
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
      },
      message: 'Banner produk berhasil disimpan ke Vercel Blob (Private Mode).',
    });
  } catch (error: unknown) {
    console.error('[UploadAPI] Error uploading to Vercel Blob:', error);
    const msg = error instanceof Error ? error.message : 'Gagal mengunggah file gambar ke Vercel Blob.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
