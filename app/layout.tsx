import type { Metadata } from 'next'
import './globals.css'
import ClientEffects from './components/ClientEffects'

export const metadata: Metadata = {
  title: 'Cheers — Organízate para cualquier celebración',
  description: 'Sin grupos de chat. Sin regalos duplicados. El festejado en control, los invitados siempre informados.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, cursor: 'none', background: '#fff' }}>
        <style>{`
          @keyframes destelloFijo {
            0%, 100% { opacity: 0; transform: scale(0.2) rotate(0deg); }
            50% { opacity: 1; transform: scale(1) rotate(15deg); }
          }
          a, button { cursor: none; }
        `}</style>
        <ClientEffects />
        {children}
      </body>
    </html>
  )
}