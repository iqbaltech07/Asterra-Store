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
    const storeUrl =
      process.env.NEXT_PUBLIC_STORE_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://asterrastore.biz.id'
        : 'http://localhost:3000');

    return [
      {
        source: '/products/:path*',
        destination: `${storeUrl}/products/:path*`,
        permanent: false,
      },
      {
        source: '/checkout/:path*',
        destination: `${storeUrl}/checkout/:path*`,
        permanent: false,
      },
    ];
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: '/api/sales/:path*',
        destination: `${backendUrl}/api/v1/sales/:path*`,
      },
      {
        source: '/api/partners/:path*',
        destination: `${backendUrl}/api/v1/partners/:path*`,
      },
      {
        source: '/media/:path*',
        destination: `${backendUrl}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
