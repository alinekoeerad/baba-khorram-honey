import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { uiStringsFa } from '@/content/ui-strings.fa';

/**
 * Self-hosted Vazirmatn Variable Font
 * Sourced from official npm package 'vazirmatn' (v33.003, SIL OFL 1.1).
 * Weights 100 to 900, zero external requests at runtime.
 * Loaded with font-display swap and preload.
 * Single canonical copy located in public/fonts/Vazirmatn[wght].woff2.
 */
const vazirmatn = localFont({
  src: '../../public/fonts/Vazirmatn[wght].woff2',
  display: 'swap',
  variable: '--font-vazirmatn',
  weight: '100 900',
  preload: true,
});

export const metadata: Metadata = {
  title: `${uiStringsFa.brand.name} | ${uiStringsFa.brand.tagline}`,
  description: uiStringsFa.brand.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-warm text-[#2B2017] font-sans font-medium antialiased selection:bg-honey/30">
        {children}
      </body>
    </html>
  );
}
