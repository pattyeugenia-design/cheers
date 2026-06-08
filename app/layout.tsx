import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cheers — Organízate para cualquier celebración',
  description: 'Sin grupos de WhatsApp. Sin regalos duplicados. El festejado en control, los invitados siempre informados.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}