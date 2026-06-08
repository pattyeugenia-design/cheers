import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cheers — Organízate para cualquier celebración',
  description: 'Sin grupos de WhatsApp. Sin regalos duplicados. El festejado en control, los invitados siempre informados.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const destellos = [
    { left: '5%', top: '8%', size: 22, delay: '0s', dur: '3s' },
    { left: '15%', top: '25%', size: 10, delay: '1.2s', dur: '2.5s' },
    { left: '25%', top: '60%', size: 16, delay: '0.5s', dur: '3.5s' },
    { left: '8%', top: '75%', size: 8, delay: '2s', dur: '2.8s' },
    { left: '35%', top: '15%', size: 12, delay: '0.8s', dur: '3.2s' },
    { left: '50%', top: '40%', size: 24, delay: '1.5s', dur: '2.2s' },
    { left: '60%', top: '70%', size: 9, delay: '0.3s', dur: '3.8s' },
    { left: '70%', top: '20%', size: 18, delay: '2.2s', dur: '2.6s' },
    { left: '80%', top: '55%', size: 11, delay: '0.9s', dur: '3.1s' },
    { left: '88%', top: '10%', size: 20, delay: '1.7s', dur: '2.4s' },
    { left: '92%', top: '80%', size: 14, delay: '0.4s', dur: '3.6s' },
    { left: '45%', top: '88%', size: 8, delay: '1.9s', dur: '2.9s' },
    { left: '18%', top: '45%', size: 26, delay: '0.7s', dur: '2.3s' },
    { left: '75%', top: '38%', size: 7, delay: '2.5s', dur: '3.4s' },
    { left: '55%', top: '92%', size: 15, delay: '1.1s', dur: '2.7s' },
  ]

  return (
    <html lang="es">
      <body style={{ position: 'relative', margin: 0, padding: 0 }}>
        {destellos.map((d, i) => (
          <span
            key={i}
            style={{
              position: 'fixed',
              pointerEvents: 'none',
              color: '#D4537E',
              left: d.left,
              top: d.top,
              fontSize: d.size,
              zIndex: 0,
              animation: `destello ${d.dur} ease-in-out infinite ${d.delay}`,
            }}
          >
            ✦
          </span>
        ))}
        {children}
      </body>
    </html>
  )
}