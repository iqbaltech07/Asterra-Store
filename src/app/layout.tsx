import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { QueryProvider } from '@/providers/query-provider';
import { FloatingSupport } from '@/components/layout/floating-support';
import { ReferralTracker } from '@/components/analytics/referral-tracker';
import { GsapProvider } from '@/providers/gsap-provider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Asterra Store - Toko Lisensi & Akun Digital Premium Resmi',
    template: '%s | Asterra Store',
  },
  description:
    'Platform terpercaya untuk pembelian produk dan layanan digital premium seperti Canva Pro, ChatGPT Plus, Gemini Pro, Capcut Pro, dan Alight Motion Pro dengan aktivasi instan dan garansi.',
  keywords: [
    'Canva Pro',
    'ChatGPT Plus',
    'Gemini Pro',
    'Capcut Pro',
    'Alight Motion Pro',
    'produk digital murah',
    'lisensi resmi',
    'akun premium',
    'Asterra Store',
  ],
  authors: [{ name: 'Asterra Store Team' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://asterrastore.biz.id'),
  openGraph: {
    title: 'Asterra Store - Toko Lisensi & Akun Digital Premium Resmi',
    description:
      'Platform terpercaya untuk pembelian produk dan lisensi digital premium dengan garansi resmi dan aktivasi instan.',
    url: 'https://asterrastore.biz.id',
    siteName: 'Asterra Store',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Asterra Store - Toko Lisensi & Akun Digital Premium Resmi',
    description:
      'Platform terpercaya untuk pembelian produk dan lisensi digital premium dengan garansi resmi dan aktivasi instan.',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'OnlineStore',
  name: 'Asterra Store',
  url: 'https://asterrastore.biz.id',
  description: 'Toko online produk dan lisensi digital resmi terpercaya di Indonesia.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://asterrastore.biz.id/products?search={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="bg-background text-foreground antialiased min-h-screen">
        <QueryProvider>
          <ReferralTracker />
          <GsapProvider>
            {children}
          </GsapProvider>
          <FloatingSupport />
        </QueryProvider>
      </body>
    </html>
  );
}
