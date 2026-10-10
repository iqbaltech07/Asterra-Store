import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'vip-reseller.co.id' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  async redirects() {
    const salesUrl = process.env.NEXT_PUBLIC_SALES_URL || 'https://sales.asterrastore.biz.id';
    return [
      {
        source: '/daftar-sales',
        destination: `${salesUrl}/daftar-sales`,
        permanent: false,
      },
      {
        source: '/sales',
        destination: `${salesUrl}/sales`,
        permanent: false,
      },
      {
        source: '/sales/:path*',
        destination: `${salesUrl}/sales/:path*`,
        permanent: false,
      },
      {
        source: '/seller',
        destination: '/affiliate',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    return [
      {
        source: '/product',
        destination: '/products',
      },
      {
        source: '/product/:id*',
        destination: '/products/:id*',
      },
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: '/media/:path*',
        destination: `${backendUrl}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
