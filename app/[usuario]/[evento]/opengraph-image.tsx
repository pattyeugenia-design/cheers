import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const alt = 'Cheers — Estás invitad@ a una celebración'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Copia local y mínima de los temas visuales de la celebración (definidos en
// [usuario]/[evento]/page.tsx). No se puede importar ese archivo aquí porque
// es 'use client' — se duplica a propósito, son solo tokens de color estables.
const TEMAS_OG: Record<string, { bg: string; dark: boolean }> = {
  morado:  { bg: 'radial-gradient(circle at 18% 16%,#7b6fd0,transparent 46%),linear-gradient(160deg,#534AB7,#7b46a8 58%,#D4537E)', dark: true },
  rosa:    { bg: 'linear-gradient(155deg,#D4537E,#a14b9c)', dark: true },
  noche:   { bg: 'linear-gradient(160deg,#0f0c29,#302b63,#24243e)', dark: true },
  bosque:  { bg: 'linear-gradient(155deg,#1a3c2a,#2d6a4f,#40916c)', dark: true },
  ambar:   { bg: 'linear-gradient(155deg,#b5451b,#e76f51,#f4a261)', dark: true },
  carbon:  { bg: 'linear-gradient(160deg,#1a1a1a,#2d2d2d,#3d3d3d)', dark: true },
  lavanda: { bg: '#B8B0F0', dark: false },
  crema:   { bg: '#FBF4EC', dark: false },
}

const TIPO_CHIP: Record<string, string> = {
  cumple: 'BDAY', cena: 'DINE', viaje: 'TRIP', reunion: 'MEET', evento: 'EVENT', otro: 'OTHER',
}

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
  const lugar = cel?.lugar || null
  const chip = cel?.tipo ? TIPO_CHIP[cel.tipo] : null
  const fecha = cel?.fecha
    ? new Date(cel.fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
    : null

  const tema = TEMAS_OG[cel?.tema] || TEMAS_OG.morado
  const textColor = tema.dark ? '#ffffff' : '#2a2440'
  const mutedColor = tema.dark ? 'rgba(255,255,255,0.72)' : 'rgba(42,36,64,0.65)'
  const faintColor = tema.dark ? 'rgba(255,255,255,0.5)' : 'rgba(42,36,64,0.45)'
  const glassChipBg = tema.dark ? 'rgba(255,255,255,0.16)' : 'rgba(42,36,64,0.08)'
  const lineColor = tema.dark ? 'rgba(255,255,255,0.18)' : 'rgba(42,36,64,0.12)'
  const nombreSize = nombre.length > 34 ? 50 : nombre.length > 20 ? 58 : 68

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: tema.bg,
          padding: '56px 64px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#534AB7,#D4537E)', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🥂</div>
            <div style={{ display: 'flex', fontSize: 22, fontWeight: 800, color: textColor, letterSpacing: '-0.5px' }}>Cheers</div>
          </div>
          {chip && (
            <div style={{ display: 'flex', fontSize: 15, fontWeight: 800, color: textColor, background: glassChipBg, padding: '7px 16px', borderRadius: 99, letterSpacing: '1px' }}>
              {chip}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: nombreSize,
              fontWeight: 800,
              color: textColor,
              letterSpacing: '-1.5px',
              lineHeight: 1.12,
              maxWidth: 980,
            }}
          >
            {nombre}
          </div>
          {(festejado || fecha) && (
            <div style={{ display: 'flex', fontSize: 26, color: mutedColor, marginTop: 16, fontWeight: 600 }}>
              {[festejado ? `Para ${festejado}` : null, fecha].filter(Boolean).join('  ·  ')}
            </div>
          )}
          {lugar && (
            <div style={{ display: 'flex', fontSize: 21, color: faintColor, marginTop: 8, fontWeight: 500 }}>
              {lugar}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, borderTop: `1px solid ${lineColor}` }}>
          <div style={{ display: 'flex', fontSize: 19, fontWeight: 700, color: mutedColor }}>Estás invitad@</div>
          <div style={{ display: 'flex', fontSize: 19, fontWeight: 700, color: mutedColor, letterSpacing: '0.3px' }}>joincheers.app</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
