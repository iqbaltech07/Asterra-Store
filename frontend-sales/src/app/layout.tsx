import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { QueryProvider } from '@/providers/query-provider';
import { GsapProvider } from '@/providers/gsap-provider';
import './globals.css';

config.autoAddCss = false;

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Asterra Store - Portal Konsol Sales Representative',
    template: '%s | Asterra Store Sales',
  },
  description: 'Portal Konsol Penjualan Resmi Mitra & Sales Representative Asterra Store',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakartaSans.variable}>
      <body className="bg-background text-foreground antialiased min-h-screen">
        <QueryProvider>
          <GsapProvider>
            <main className="w-full min-h-screen">
              {children}
            </main>
          </GsapProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
