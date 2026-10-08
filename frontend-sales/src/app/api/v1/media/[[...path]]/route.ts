import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/blob';

/**
 * GET /api/v1/media/[[...path]]
 * Secure streaming proxy for private Vercel Blob media files.
 * Supports:
 * 1) RESTful path: /api/v1/media/products/banner-123.png
 * 2) Query parameter: /api/v1/media?path=products/banner-123.png
 * 3) Direct blob url: /api/v1/media?url=https://....private.blob.vercel-storage.com/...
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams?.path;
    const { searchParams } = new URL(request.url);

    let target: string | null = null;
    if (pathSegments && pathSegments.length > 0) {
      target = pathSegments.join('/');
    } else {
      target = searchParams.get('path') || searchParams.get('url');
    }

    if (!target) {
      return NextResponse.json(
        { success: false, error: 'Path atau URL media wajib disertakan.' },
        { status: 400 }
      );
    }

    // Retrieve private blob stream with server authentication
    const result = await get(target, { access: 'private' });
    if (!result || !result.stream) {
      return NextResponse.json(
        { success: false, error: 'File media tidak ditemukan di Vercel Blob.' },
        { status: 404 }
      );
    }

    const contentType = result.blob.contentType || 'image/jpeg';
    const filename = result.blob.pathname.split('/').pop() || 'media';

    return new NextResponse(result.stream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': result.blob.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    console.error('[MediaAPI] Error streaming private blob:', error);
    const msg = error instanceof Error ? error.message : 'Gagal memuat media.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
