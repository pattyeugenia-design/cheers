import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Cheers — La celebración, en un link.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #534AB7 0%, #D4537E 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 140, display: 'flex', marginBottom: 10 }}>🥂</div>
        <div
          style={{
            fontSize: 110,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-2px',
          }}
        >
          Cheers
        </div>
        <div style={{ fontSize: 34, color: 'rgba(255,255,255,0.85)', marginTop: 10 }}>
          Estás invitad@ a una celebración
        </div>
      </div>
    ),
    { ...size }
  )
}