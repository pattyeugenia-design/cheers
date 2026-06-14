import type { Metadata } from 'next'
import './globals.css'
import ClientEffects from './components/ClientEffects'

export const metadata: Metadata = {
  title: 'Cheers — Organízate para cualquier celebración',
  description: 'Sin grupos de chat. Sin regalos duplicados. El festejado en control, los invitados siempre informados.',
}

const destellos = [
  { left: '3%',  top: '5%',  size: 14, delay: '0s',   dur: '3s'   },
  { left: '12%', top: '15%', size: 8,  delay: '1.2s', dur: '2.5s' },
  { left: '22%', top: '40%', size: 48, delay: '0.5s', dur: '4s'   },
  { left: '7%',  top: '55%', size: 10, delay: '2s',   dur: '2.8s' },
  { left: '33%', top: '10%', size: 18, delay: '0.8s', dur: '3.2s' },
  { left: '48%', top: '28%', size: 56, delay: '1.5s', dur: '3.5s' },
  { left: '58%', top: '50%', size: 9,  delay: '0.3s', dur: '3.8s' },
  { left: '68%', top: '15%', size: 22, delay: '2.2s', dur: '2.6s' },
  { left: '78%', top: '38%', size: 12, delay: '0.9s', dur: '3.1s' },
  { left: '86%', top: '6%',  size: 44, delay: '1.7s', dur: '2.4s' },
  { left: '91%', top: '60%', size: 16, delay: '0.4s', dur: '3.6s' },
  { left: '43%', top: '65%', size: 8,  delay: '1.9s', dur: '2.9s' },
  { left: '16%', top: '32%', size: 60, delay: '0.7s', dur: '4.2s' },
  { left: '73%', top: '27%', size: 7,  delay: '2.5s', dur: '3.4s' },
  { left: '53%', top: '70%', size: 36, delay: '1.1s', dur: '2.7s' },
  { left: '28%', top: '62%', size: 11, delay: '0.6s', dur: '3.9s' },
  { left: '62%', top: '22%', size: 52, delay: '1.8s', dur: '2.3s' },
  { left: '4%',  top: '29%', size: 9,  delay: '1.4s', dur: '3.7s' },
  { left: '94%', top: '35%', size: 28, delay: '0.2s', dur: '3s'   },
  { left: '38%', top: '17%', size: 7,  delay: '2.8s', dur: '2.6s' },
  { left: '82%', top: '68%', size: 40, delay: '0.9s', dur: '4.5s' },
  { left: '10%', top: '72%', size: 13, delay: '1.6s', dur: '3.3s' },
  { left: '56%', top: '37%', size: 8,  delay: '2.3s', dur: '2.8s' },
  { left: '76%', top: '56%', size: 32, delay: '0.4s', dur: '3.8s' },
  { left: '20%', top: '23%', size: 6,  delay: '1.9s', dur: '2.5s' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, cursor: 'none', background: '#fff', position: 'relative' }}>
        <style>{`
          @keyframes destelloFijo {
            0%, 100% { opacity: 0; transform: scale(0.2) rotate(0deg); }
            50% { opacity: 0.4; transform: scale(1) rotate(15deg); }
          }
          a, button { cursor: none; }
        `}</style>

        <ClientEffects />

        {destellos.map((d, i) => (
          <span key={i} style={{
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 5,
            color: '#D4537E',
            left: d.left,
            top: d.top,
            fontSize: d.size,
            animation: `destelloFijo ${d.dur} ease-in-out infinite ${d.delay}`,
          }}>✦</span>
        ))}

        {children}
      </body>
    </html>
  )
}