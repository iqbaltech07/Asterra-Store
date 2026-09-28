import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { QueryProvider } from '@/providers/query-provider';
import { FloatingSupport } from '@/components/layout/floating-support';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Asterra Store - Toko Produk & Layanan Digital Premium',
  description:
    'Platform terpercaya untuk pembelian produk dan layanan digital premium seperti Canva Pro, ChatGPT Plus, Gemini Pro, Capcut Pro, dan Alight Motion Pro dengan aktivasi instan dan garansi.',
  keywords: [
    'Canva Pro',
    'ChatGPT Plus',
    'Gemini Pro',
    'Capcut Pro',
    'Alight Motion Pro',
    'produk digital murah',
    'Asterra Store',
  ],
  authors: [{ name: 'Asterra Store Team' }],
  metadataBase: new URL('https://asterra.store'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`dark ${inter.variable}`}>
      <body className="bg-background text-foreground antialiased min-h-screen">
        <QueryProvider>
          {children}
          <FloatingSupport />
        </QueryProvider>
      </body>
    </html>
  );
}
