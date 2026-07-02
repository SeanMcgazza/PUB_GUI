import type { Metadata } from 'next';
import { Inter, Lora, Playfair_Display } from 'next/font/google';
import './globals.css';

// Body / UI font — geometric sans-serif. Maps to var(--font-inter).
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

// Heading font — high-contrast serif for the gastropub feel.
// Maps to var(--font-lora).
const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

// Editorial heading serif for the marketing site. display:'swap' avoids a
// layout-shift/FOIT while Playfair loads.
const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BarTab - QR Code Ordering for Pubs',
  description:
    'Turn your tables into ordering stations. Let customers scan, browse, and order directly from their phones.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${lora.variable} ${playfair.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
