import { ImageResponse } from 'next/og'

// Ícono para "Agregar a pantalla de inicio" en iOS. Sin este archivo, Safari
// rellena el acceso directo con un círculo gris y la primera letra del título
// (justo lo que le pasó a Vika) en vez del logo real de Cheers.
//
// Nota: dibuja el mismo ícono de los dos vasos que ya usas en app/icon.svg,
// pero con <svg> puro en vez de un emoji — un emoji aquí obligaría a Next a
// bajar su fuente de una CDN externa al momento de compilar, lo cual truena
// en cualquier entorno sin salida a internet en ese momento (como el sandbox
// donde pruebo los builds).
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #534AB7 0%, #D4537E 100%)',
        }}
      >
        <svg width="140" height="140" viewBox="0 0 32 32">
          <defs>
            <linearGradient id="liq" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f5c842" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f7d76b" />
            </linearGradient>
            <clipPath id="c1">
              <path d="M4,4 L7,13 Q9,15 11,13 L14,4 Z" />
            </clipPath>
            <clipPath id="c2">
              <path d="M18,4 L21,13 Q23,15 25,13 L28,4 Z" />
            </clipPath>
          </defs>
          <g transform="rotate(-8, 9, 26)">
            <path d="M4,4 L7,13 Q9,15 11,13 L14,4 Z" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.55)" strokeWidth="0.6" />
            <rect x="4" y="9" width="10" height="5" fill="url(#liq)" opacity="0.85" clipPath="url(#c1)" />
            <rect x="8.3" y="13.5" width="1.4" height="7" fill="rgba(255,255,255,0.28)" rx="0.7" />
            <rect x="5.5" y="20" width="7" height="1" fill="rgba(255,255,255,0.28)" rx="0.5" />
          </g>
          <g transform="rotate(8, 23, 26)">
            <path d="M18,4 L21,13 Q23,15 25,13 L28,4 Z" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.55)" strokeWidth="0.6" />
            <rect x="18" y="9" width="10" height="5" fill="url(#liq)" opacity="0.85" clipPath="url(#c2)" />
            <rect x="22.3" y="13.5" width="1.4" height="7" fill="rgba(255,255,255,0.28)" rx="0.7" />
            <rect x="19.5" y="20" width="7" height="1" fill="rgba(255,255,255,0.28)" rx="0.5" />
          </g>
          <circle cx="16" cy="3.5" r="1" fill="#f7d76b" opacity="0.95" />
          <circle cx="13" cy="2.5" r="0.55" fill="#fff" opacity="0.85" />
          <circle cx="19" cy="2.5" r="0.55" fill="#fff" opacity="0.85" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
