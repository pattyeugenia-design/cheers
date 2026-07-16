import type { Metadata } from 'next'
import './globals.css'
import ClientEffects from './components/ClientEffects'

export const metadata: Metadata = {
  metadataBase: new URL('https://joincheers.app'),
  title: 'Cheers — Organízate para cualquier celebración',
  description: 'Sin grupos de chat. Sin regalos duplicados. El festejado en control, los invitados siempre informados.',
}

const destellos = [
  { left: '3%',  top: '3%',  size: 16, delay: '0s',   dur: '3s'   },
  { left: '12%', top: '8%',  size: 10, delay: '1.2s', dur: '2.5s' },
  { left: '22%', top: '15%', size: 50, delay: '0.5s', dur: '4s'   },
  { left: '7%',  top: '22%', size: 12, delay: '2s',   dur: '2.8s' },
  { left: '33%', top: '5%',  size: 20, delay: '0.8s', dur: '3.2s' },
  { left: '48%', top: '12%', size: 58, delay: '1.5s', dur: '3.5s' },
  { left: '58%', top: '20%', size: 11, delay: '0.3s', dur: '3.8s' },
  { left: '68%', top: '6%',  size: 24, delay: '2.2s', dur: '2.6s' },
  { left: '78%', top: '16%', size: 14, delay: '0.9s', dur: '3.1s' },
  { left: '86%', top: '2%',  size: 46, delay: '1.7s', dur: '2.4s' },
  { left: '91%', top: '24%', size: 18, delay: '0.4s', dur: '3.6s' },
  { left: '43%', top: '28%', size: 10, delay: '1.9s', dur: '2.9s' },
  { left: '16%', top: '13%', size: 62, delay: '0.7s', dur: '4.2s' },
  { left: '73%', top: '11%', size: 9,  delay: '2.5s', dur: '3.4s' },
  { left: '53%', top: '30%', size: 38, delay: '1.1s', dur: '2.7s' },
  { left: '28%', top: '25%', size: 13, delay: '0.6s', dur: '3.9s' },
  { left: '62%', top: '9%',  size: 54, delay: '1.8s', dur: '2.3s' },
  { left: '4%',  top: '12%', size: 11, delay: '1.4s', dur: '3.7s' },
  { left: '94%', top: '14%', size: 30, delay: '0.2s', dur: '3s'   },
  { left: '38%', top: '7%',  size: 9,  delay: '2.8s', dur: '2.6s' },
  { left: '82%', top: '27%', size: 42, delay: '0.9s', dur: '4.5s' },
  { left: '10%', top: '29%', size: 15, delay: '1.6s', dur: '3.3s' },
  { left: '56%', top: '15%', size: 10, delay: '2.3s', dur: '2.8s' },
  { left: '76%', top: '23%', size: 34, delay: '0.4s', dur: '3.8s' },
  { left: '20%', top: '9%',  size: 8,  delay: '1.9s', dur: '2.5s' },
  { left: '6%',  top: '35%', size: 16, delay: '0.3s', dur: '3.2s' },
  { left: '18%', top: '42%', size: 9,  delay: '1.6s', dur: '2.7s' },
  { left: '30%', top: '38%', size: 52, delay: '0.6s', dur: '4.1s' },
  { left: '42%', top: '45%', size: 12, delay: '2.1s', dur: '3s'   },
  { left: '54%', top: '40%', size: 60, delay: '1.0s', dur: '2.4s' },
  { left: '66%', top: '46%', size: 11, delay: '0.4s', dur: '3.6s' },
  { left: '78%', top: '37%', size: 46, delay: '1.8s', dur: '2.9s' },
  { left: '90%', top: '44%', size: 14, delay: '0.7s', dur: '3.4s' },
  { left: '10%', top: '50%', size: 36, delay: '2.4s', dur: '2.6s' },
  { left: '24%', top: '53%', size: 8,  delay: '1.3s', dur: '3.8s' },
  { left: '36%', top: '49%', size: 22, delay: '0.5s', dur: '3.1s' },
  { left: '48%', top: '55%', size: 10, delay: '2.0s', dur: '2.5s' },
  { left: '60%', top: '51%', size: 56, delay: '1.5s', dur: '3.7s' },
  { left: '72%', top: '58%', size: 9,  delay: '0.2s', dur: '2.8s' },
  { left: '84%', top: '53%', size: 28, delay: '1.9s', dur: '3.3s' },
  { left: '94%', top: '60%', size: 13, delay: '0.8s', dur: '4.0s' },
  { left: '4%',  top: '65%', size: 44, delay: '0.6s', dur: '2.7s' },
  { left: '16%', top: '70%', size: 10, delay: '1.7s', dur: '3.5s' },
  { left: '28%', top: '67%', size: 18, delay: '0.3s', dur: '2.9s' },
  { left: '40%', top: '73%', size: 9,  delay: '2.2s', dur: '3.2s' },
  { left: '52%', top: '69%', size: 50, delay: '1.1s', dur: '2.6s' },
  { left: '64%', top: '75%', size: 12, delay: '0.4s', dur: '3.9s' },
  { left: '76%', top: '71%', size: 38, delay: '1.6s', dur: '2.4s' },
  { left: '88%', top: '78%', size: 8,  delay: '0.9s', dur: '3.6s' },
  { left: '8%',  top: '82%', size: 20, delay: '2.3s', dur: '2.8s' },
  { left: '20%', top: '88%', size: 10, delay: '1.0s', dur: '3.4s' },
  { left: '32%', top: '85%', size: 58, delay: '0.5s', dur: '2.3s' },
  { left: '44%', top: '90%', size: 11, delay: '1.8s', dur: '3.7s' },
  { left: '56%', top: '86%', size: 30, delay: '0.7s', dur: '2.5s' },
  { left: '68%', top: '92%', size: 9,  delay: '2.5s', dur: '3.1s' },
  { left: '80%', top: '87%', size: 46, delay: '1.2s', dur: '2.7s' },
  { left: '92%', top: '93%', size: 14, delay: '0.3s', dur: '3.8s' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Playfair+Display:wght@700;800&family=Fredoka+One&family=Pacifico&display=swap" rel="stylesheet" />
        {/* Datos estructurados de marca y producto (Organization + WebSite + SoftwareApplication),
            estándar 2026 recomendado para que Google y los motores de IA entiendan qué es Cheers,
            no solo como empresa sino como producto (con sus 3 planes). No incluye "logo" en formato
            ideal (Google prefiere PNG/JPG, no SVG) ni redes sociales (sameAs) porque Cheers todavía
            no tiene ninguna cuenta pública — vale la pena crear al menos una y regresar a agregarla aquí. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://joincheers.app/#organization',
                  name: 'Cheers',
                  url: 'https://joincheers.app',
                  logo: 'https://joincheers.app/icon.svg',
                  description: 'Organiza cualquier celebración con un solo link — cumpleaños, posadas, quinceañeras, despedidas de soltera, cenas, viajes con amigos.',
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://joincheers.app/#website',
                  url: 'https://joincheers.app',
                  name: 'Cheers',
                  publisher: { '@id': 'https://joincheers.app/#organization' },
                },
                {
                  '@type': 'SoftwareApplication',
                  '@id': 'https://joincheers.app/#software',
                  name: 'Cheers',
                  url: 'https://joincheers.app',
                  applicationCategory: 'LifestyleApplication',
                  operatingSystem: 'Web',
                  description: 'Organiza cualquier celebración con un solo link — cumpleaños, posadas, quinceañeras, despedidas de soltera, cenas, viajes con amigos.',
                  offers: [
                    { '@type': 'Offer', name: 'Cheer', price: '0', priceCurrency: 'USD' },
                    { '@type': 'Offer', name: 'Super Cheer', price: '9', priceCurrency: 'USD' },
                    { '@type': 'Offer', name: 'Extra Cheer', price: '49', priceCurrency: 'USD' },
                  ],
                },
              ],
            }),
          }}
        />
      </head>
      <body style={{ margin: 0, padding: 0, cursor: 'none', background: '#fff', position: 'relative' }}>
        <style>{`
          @keyframes destelloFijo {
            0%, 100% { opacity: 0; transform: scale(0.2) rotate(0deg); }
            50% { opacity: 0.7; transform: scale(1) rotate(15deg); }
          }
          a, button { cursor: none; }
        `}</style>

        <ClientEffects />

        {destellos.map((d, i) => (
          <span key={i} style={{
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 0,
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