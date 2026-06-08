import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cheers — Organízate para cualquier celebración',
  description: 'Sin grupos de WhatsApp. Sin regalos duplicados. El festejado en control, los invitados siempre informados.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const destellos = [
    { left: '3%', top: '5%', size: 14, delay: '0s', dur: '3s' },
    { left: '12%', top: '18%', size: 8, delay: '1.2s', dur: '2.5s' },
    { left: '22%', top: '55%', size: 48, delay: '0.5s', dur: '4s' },
    { left: '7%', top: '72%', size: 10, delay: '2s', dur: '2.8s' },
    { left: '33%', top: '12%', size: 18, delay: '0.8s', dur: '3.2s' },
    { left: '48%', top: '35%', size: 56, delay: '1.5s', dur: '3.5s' },
    { left: '58%', top: '65%', size: 9, delay: '0.3s', dur: '3.8s' },
    { left: '68%', top: '18%', size: 22, delay: '2.2s', dur: '2.6s' },
    { left: '78%', top: '50%', size: 12, delay: '0.9s', dur: '3.1s' },
    { left: '86%', top: '8%', size: 44, delay: '1.7s', dur: '2.4s' },
    { left: '91%', top: '78%', size: 16, delay: '0.4s', dur: '3.6s' },
    { left: '43%', top: '85%', size: 8, delay: '1.9s', dur: '2.9s' },
    { left: '16%', top: '42%', size: 60, delay: '0.7s', dur: '4.2s' },
    { left: '73%', top: '35%', size: 7, delay: '2.5s', dur: '3.4s' },
    { left: '53%', top: '90%', size: 36, delay: '1.1s', dur: '2.7s' },
    { left: '28%', top: '80%', size: 11, delay: '0.6s', dur: '3.9s' },
    { left: '62%', top: '28%', size: 52, delay: '1.8s', dur: '2.3s' },
    { left: '4%', top: '38%', size: 9, delay: '1.4s', dur: '3.7s' },
    { left: '94%', top: '45%', size: 28, delay: '0.2s', dur: '3s' },
    { left: '38%', top: '22%', size: 7, delay: '2.8s', dur: '2.6s' },
    { left: '82%', top: '88%', size: 40, delay: '0.9s', dur: '4.5s' },
    { left: '10%', top: '92%', size: 13, delay: '1.6s', dur: '3.3s' },
    { left: '56%', top: '48%', size: 8, delay: '2.3s', dur: '2.8s' },
    { left: '76%', top: '72%', size: 32, delay: '0.4s', dur: '3.8s' },
    { left: '20%', top: '30%', size: 6, delay: '1.9s', dur: '2.5s' },
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