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
          background: 'linear-gradient(160deg, #241c45 0%, #534AB7 45%, #D4537E 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 800, color: '#fff', letterSpacing: -2 }}>Cheers</div>
        <div style={{ fontSize: 34, color: 'rgba(255,255,255,.85)', marginTop: 12 }}>La celebración, en un link.</div>
      </div>
    ),
    { ...size }
  )
}
