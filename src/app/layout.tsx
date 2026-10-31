import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';
import { OrganizationStructuredData, WebSiteStructuredData } from '@/components/seo/StructuredData';

const getMetadataBaseUrl = () => {
  try {
    const rawUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'https://hamper-orpin.vercel.app';
    const cleanUrl = rawUrl.replace(/^["']|["']$/g, '').trim();
    const fullUrl = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') ? cleanUrl : `https://${cleanUrl}`;
    return new URL(fullUrl);
  } catch {
    return new URL('https://hamper-orpin.vercel.app');
  }
};

export const metadata: Metadata = {
  title: {
    default: 'KawaiOra Artisan Hampers | Premium Gift Hampers for Every Occasion',
    template: '%s | KawaiOra Artisan Hampers',
  },
  description: 'Discover thoughtfully curated artisan gift hampers for birthdays, anniversaries, weddings, corporate gifting, and more. Premium packaging, personalized messages, and reliable delivery across India.',
  keywords: ['gift hampers', 'birthday gifts', 'anniversary gifts', 'corporate gifts', 'wedding hampers', 'personalized gifts', 'luxury gift boxes', 'online gifting India'],
  authors: [{ name: 'KawaiOra Artisan Hampers' }],
  creator: 'KawaiOra Artisan Hampers',
  publisher: 'KawaiOra Artisan Hampers',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: getMetadataBaseUrl(),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'KawaiOra Artisan Hampers',
    title: 'KawaiOra Artisan Hampers | Premium Gift Hampers for Every Occasion',
    description: 'Discover thoughtfully curated artisan gift hampers for birthdays, anniversaries, weddings, corporate gifting, and more.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'KawaiOra Artisan Hampers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KawaiOra Artisan Hampers',
    description: 'Premium gift hampers for every occasion',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/images/kawaiora-logo.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <OrganizationStructuredData />
        <WebSiteStructuredData />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '1rem',
                padding: '1rem 1.5rem',
              },
              success: {
                iconTheme: {
                  primary: '#f59e0b',
                  secondary: '#f8fafc',
                },
              },
              error: {
                iconTheme: {
                  primary: '#e11d48',
                  secondary: '#f8fafc',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}