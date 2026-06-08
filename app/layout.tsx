import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cheers — Organízate para cualquier celebración',
  description: 'Sin grupos de WhatsApp. Sin regalos duplicados. El festejado en control, los invitados siempre informados.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const destellos = [
    { left: '3%', top: '5vh', size: 14, delay: '0s', dur: '3s' },
    { left: '12%', top: '18vh', size: 8, delay: '1.2s', dur: '2.5s' },
    { left: '22%', top: '55vh', size: 48, delay: '0.5s', dur: '4s' },
    { left: '7%', top: '72vh', size: 10, delay: '2s', dur: '2.8s' },
    { left: '33%', top: '12vh', size: 18, delay: '0.8s', dur: '3.2s' },
    { left: '48%', top: '35vh', size: 56, delay: '1.5s', dur: '3.5s' },
    { left: '58%', top: '65vh', size: 9, delay: '0.3s', dur: '3.8s' },
    { left: '68%', top: '18vh', size: 22, delay: '2.2s', dur: '2.6s' },
    { left: '78%', top: '50vh', size: 12, delay: '0.9s', dur: '3.1s' },
    { left: '86%', top: '8vh', size: 44, delay: '1.7s', dur: '2.4s' },
    { left: '91%', top: '78vh', size: 16, delay: '0.4s', dur: '3.6s' },
    { left: '43%', top: '85vh', size: 8, delay: '1.9s', dur: '2.9s' },
    { left: '16%', top: '42vh', size: 60, delay: '0.7s', dur: '4.2s' },
    { left: '73%', top: '35vh', size: 7, delay: '2.5s', dur: '3.4s' },
    { left: '53%', top: '90vh', size: 36, delay: '1.1s', dur: '2.7s' },
    { left: '28%', top: '80vh', size: 11, delay: '0.6s', dur: '3.9s' },
    { left: '62%', top: '28vh', size: 52, delay: '1.8s', dur: '2.3s' },
    { left: '4%', top: '38vh', size: 9, delay: '1.4s', dur: '3.7s' },
    { left: '94%', top: '45vh', size: 28, delay: '0.2s', dur: '3s' },
    { left: '38%', top: '22vh', size: 7, delay: '2.8s', dur: '2.6s' },
    { left: '82%', top: '88vh', size: 40, delay: '0.9s', dur: '4.5s' },
    { left: '10%', top: '92vh', size: 13, delay: '1.6s', dur: '3.3s' },
    { left: '56%', top: '48vh', size: 8, delay: '2.3s', dur: '2.8s' },
    { left: '76%', top: '72vh', size: 32, delay: '0.4s', dur: '3.8s' },
    { left: '20%', top: '30vh', size: 6, delay: '1.9s', dur: '2.5s' },
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