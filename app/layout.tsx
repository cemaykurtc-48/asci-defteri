import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Aşçı Defteri - Tek Dokunuş, Sıfır Karmaşa',
  description: 'Seyyar düğün ve hayır aşçıları için internetsiz, şifresiz, dev butonlu pratik iş defteri.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AşçıDefteri',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'Aşçı Defteri - Tek Dokunuş, Sıfır Karmaşa',
    description: 'Seyyar düğün ve hayır aşçıları için internetsiz, şifresiz, dev butonlu pratik iş defteri.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aşçı Defteri - Tek Dokunuş, Sıfır Karmaşa',
    description: 'Seyyar düğün ve hayır aşçıları için internetsiz, şifresiz, dev butonlu pratik iş defteri.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-slate-900 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
