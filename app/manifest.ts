import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Aşçı Defteri - Tek Dokunuş, Sıfır Karmaşa',
    short_name: 'AşçıDefteri',
    description: 'Seyyar düğün ve hayır aşçıları için internetsiz, şifresiz iş defteri.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#0F172A',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
