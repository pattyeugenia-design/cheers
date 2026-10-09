import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'
import { fechaPuntos, urlImagenSegura } from '../../_invitacion/tema'
import { leerEncuadreTexto } from '../../_invitacion/encuadre'

export const runtime = 'edge'
export const alt = 'Save the date — Cheers Bridal'
// 720x378 (misma proporción que 1200x630): la tarjeta pesa menos de ~300 KB, que es lo que WhatsApp acepta
// para mostrar la imagen; sigue siendo nítida para WhatsApp, iMessage y redes.
const ESC = 0.6
export const size = { width: 720, height: 378 }
export const contentType = 'image/png'

const CODIGO = /^[a-z0-9]{8,24}$/

// Tipografías de la invitación, incluidas en el proyecto (nada se pide a terceros).
const allura = fetch(new URL('./allura.woff', import.meta.url)).then(r => r.arrayBuffer())
const cormorant = fetch(new URL('./cormorant.woff', import.meta.url)).then(r => r.arrayBuffer())


function aBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

// La foto se descarga aquí (solo de nuestro propio Storage, JPG/PNG, máx. 4 MB):
// si algo falla, la tarjeta sale con las iniciales en lugar de la foto.
async function fotoSegura(url: string | null) {
  const u = urlImagenSegura(url)
  if (!u) return null
  try {
    const r = await fetch(u, { signal: AbortSignal.timeout(4000) })
    if (!r.ok) return null
    const tipo = (r.headers.get('content-type') || '').split(';')[0]
    if (tipo !== 'image/jpeg' && tipo !== 'image/png') return null
    const buf = await r.arrayBuffer()
    if (buf.byteLength > 4_000_000) return null
    return `data:${tipo};base64,${aBase64(buf)}`
  } catch {
    return null
  }
}

// Tarjeta del link GENERAL del Save the date: sin nombre de invitado.
export default async function Image({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params
  let inv: any = null
  if (CODIGO.test(codigo)) {
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await supabase.rpc('get_std_boda', { p_codigo: codigo })
      inv = Array.isArray(data) ? data[0] : data
    } catch { inv = null }
  }

  const [fAllura, fCormorant] = await Promise.all([allura, cormorant])
  const novia = String(inv?.nombre_novia || '').slice(0, 24)
  const novio = String(inv?.nombre_novio || '').slice(0, 24)
  const foto = await fotoSegura(inv?.portada_url || null)
  const enc = leerEncuadreTexto(inv?.portada_posicion)
  const fecha = fechaPuntos(inv?.fecha_boda, 'es')
  const lugar = String(inv?.std_lugar || '').trim().slice(0, 40)
  const iniciales = [novia[0], novio[0]].filter(Boolean).join(' & ').toUpperCase()
  const largo = Math.max(novia.length, novio.length)
  const tamNombres = largo <= 7 ? 124 : largo <= 10 ? 104 : largo <= 14 ? 84 : 66
  const ROSA = '#AD857C'

  return new ImageResponse(
    (
      <div style={{ width: 720, height: 378, display: 'flex' }}>
      <div style={{ width: 1200, height: 630, display: 'flex', transform: `translate(${-600 * (1 - ESC)}px, ${-315 * (1 - ESC)}px) scale(${ESC})`, background: 'linear-gradient(135deg, #FAF6F0 0%, #F5ECE5 60%, #F0E3DB 100%)', fontFamily: 'Cormorant' }}>
        {/* Foto en arco */}
        <div style={{ display: 'flex', position: 'relative', width: 400, height: 520, margin: 'auto 0 auto 96px' }}>
          <div style={{ position: 'absolute', left: -16, top: -16, width: 432, height: 552, borderRadius: '216px 216px 24px 24px', border: '2px solid rgba(173,133,124,0.42)', display: 'flex' }} />
          <div style={{ display: 'flex', width: 400, height: 520, borderRadius: '200px 200px 18px 18px', overflow: 'hidden', background: '#E9D8CE' }}>
            {foto
              ? (
                // El mismo encuadre (posición y acercamiento) que la pareja acomodó para su portada
                // eslint-disable-next-line @next/next/no-img-element
                <img src={foto} style={{ position: 'absolute', width: 400 * enc.z, height: 520 * enc.z, left: (400 - 400 * enc.z) * enc.x, top: (520 - 520 * enc.z) * enc.y, objectFit: 'cover', objectPosition: `${enc.x * 100}% ${enc.y * 100}%` }} />
              )
              : <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', fontFamily: 'Allura', fontSize: 120, color: ROSA }}>{iniciales || '♡'}</div>}
          </div>
        </div>

        {/* Nombres y fecha */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '0 70px 0 40px' }}>
          <div style={{ display: 'flex', fontSize: 26, letterSpacing: 8, color: ROSA }}>SAVE THE DATE</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 18, fontFamily: 'Allura', color: ROSA, lineHeight: 1 }}>
            <div style={{ display: 'flex', fontSize: tamNombres }}>{novia || 'Nuestra boda'}</div>
            {novio && <div style={{ display: 'flex', fontFamily: 'Cormorant', fontSize: 44, color: '#C8A69B', margin: '-4px 0 -2px' }}>&amp;</div>}
            {novio && <div style={{ display: 'flex', fontSize: tamNombres }}>{novio}</div>}
          </div>
          {fecha && <div style={{ display: 'flex', fontSize: 25, letterSpacing: 5, color: '#6E5A55', marginTop: 30 }}>{fecha}</div>}
          {lugar && <div style={{ display: 'flex', marginTop: 22, fontSize: 30, fontStyle: 'normal', color: '#9C8780' }}>{lugar}</div>}
        </div>
      </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Allura', data: fAllura, style: 'normal', weight: 400 },
        { name: 'Cormorant', data: fCormorant, style: 'normal', weight: 500 },
      ],
    }
  )
}
