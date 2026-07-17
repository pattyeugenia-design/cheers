import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const alt = 'Cheers — Estás invitad@ a una celebración'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Busca la celebración con la misma función RPC segura que ya usa la vista pública
// (get_celebracion_por_slug) — es la única forma aprobada de leer datos de una
// celebración sin sesión, así que la reusamos aquí en vez de consultar la tabla directo.
async function buscarCelebracion(usuario: string, evento: string) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: d1 } = await supabase.rpc('get_celebracion_por_slug', { p_slug: `${usuario}/${evento}` })
  if (d1) return d1
  const { data: d2 } = await supabase.rpc('get_celebracion_por_slug', { p_slug: evento })
  return d2 || null
}

export default async function Image({ params }: { params: Promise<{ usuario: string; evento: string }> }) {
  const { usuario, evento } = await params
  const cel = await buscarCelebracion(usuario, evento)

  const nombre = cel?.nombre || 'Cheers'
  const festejado = cel?.festejado_nombre || null
  const fecha = cel?.fecha
    ? new Date(cel.fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
    : null

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
        <div style={{ fontSize: 80, display: 'flex', marginBottom: 10 }}>🥂</div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-2px',
            textAlign: 'center',
            display: 'flex',
            padding: '0 70px',
            lineHeight: 1.15,
          }}
        >
          {nombre}
        </div>
        {festejado && (
          <div style={{ fontSize: 30, color: 'rgba(255,255,255,0.85)', marginTop: 12, display: 'flex' }}>
            Para {festejado}
          </div>
        )}
        {fecha && (
          <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.85)', marginTop: 18, display: 'flex' }}>
            {fecha}
          </div>
        )}
        <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.65)', marginTop: 26, display: 'flex' }}>
          Estás invitad@ · Cheers
        </div>
      </div>
    ),
    { ...size }
  )
}
