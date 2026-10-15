import type { Metadata } from 'next'

// El link del QR no se indexa en buscadores y no revela nada del evento en el preview.
export const metadata: Metadata = {
  title: 'Comparte tus fotos · Cheers Bridal',
  description: 'Sube tus fotos del evento al álbum compartido.',
  robots: { index: false, follow: false },
}

export default function AlbumQrLayout({ children }: { children: React.ReactNode }) {
  return children
}
