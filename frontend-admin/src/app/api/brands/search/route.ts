import { NextRequest, NextResponse } from 'next/server';

interface BrandResult {
  name: string;
  domain: string;
  icon?: string;
  brandId?: string;
  claimed?: boolean;
  verified?: boolean;
  score?: number;
}

const memoryCache = new Map<string, { timestamp: number; data: BrandResult[] }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    if (!query) {
      return NextResponse.json({ success: true, data: [] });
    }

    const cacheKey = query.toLowerCase();
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ success: true, fromCache: true, data: cached.data });
    }

    const clientId = process.env.BRANDFETCH_CLIENT_ID || '1idOZh3WAwyNTiUHkB7';
    const apiKey =
      process.env.BRANDFETCH_API_KEY ||
      'wZja_h7z1EIx8KrAtYbS_QzVnELZI48RA02MMLQEudYxBbjCS5l6t-s4DLhkXvt9LLzDCnm9-iu9dwwAMK6lwg';

    // 1. Try Backend first
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    try {
      const backendRes = await fetch(
        `${backendUrl}/api/v1/brands/search?q=${encodeURIComponent(query)}`,
        {
          headers: { 'Content-Type': 'application/json' },
          next: { revalidate: 3600 },
        }
      );
      if (backendRes.ok) {
        const json = await backendRes.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          memoryCache.set(cacheKey, { timestamp: Date.now(), data: json.data });
          return NextResponse.json({ success: true, data: json.data });
        }
      }
    } catch {
      // Fallback to direct Brandfetch API
    }

    // 2. Query Brandfetch API Directly
    const brandfetchUrl = `https://api.brandfetch.io/v2/search/${encodeURIComponent(query)}?c=${clientId}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const res = await fetch(brandfetchUrl, { headers });
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch from Brandfetch API' },
        { status: res.status }
      );
    }

    const rawItems = await res.json();
    const results: BrandResult[] = [];

    if (Array.isArray(rawItems)) {
      for (const item of rawItems) {
        const domain = item.domain || '';
        const icon =
          item.icon ||
          (domain ? `https://cdn.brandfetch.io/domain/${domain}?c=${clientId}` : undefined);

        results.push({
          name: item.name || domain,
          domain,
          icon,
          brandId: item.brandId,
          claimed: item.claimed,
          verified: item.verified,
          score: item._score,
        });
      }
    }

    memoryCache.set(cacheKey, { timestamp: Date.now(), data: results });

    return NextResponse.json({
      success: true,
      total: results.length,
      data: results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
