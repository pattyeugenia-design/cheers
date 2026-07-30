import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Lista blanca de eventos que reconocemos — así la tabla no se llena de
// basura si algún día alguien manda tipos inventados directo a esta ruta.
const TIPOS_VALIDOS = new Set([
  'visita',
  'registro_completado',
  'celebracion_creada',
  'invitado_agregado',
  'rsvp_confirmado',
  'mensaje_publicado',
  'regalo_reservado',
  'checkout_iniciado',
  'compra_completada',
])

// Sin login de por medio (se llama también para visitas anónimas), así que no
// se puede exigir un token aquí — el límite por IP frena que alguien use esto
// para llenar la tabla de basura o inflar/ensuciar las métricas.
const solicitudesPorIP = new Map<string, number[]>()
const LIMITE_SOLICITUDES = 30
const VENTANA_MS = 60_000

function excedeLimite(ip: string): boolean {
  const ahora = Date.now()
  const previas = solicitudesPorIP.get(ip) || []
  const recientes = previas.filter(t => ahora - t < VENTANA_MS)
  recientes.push(ahora)
  solicitudesPorIP.set(ip, recientes)
  return recientes.length > LIMITE_SOLICITUDES
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconocida'
  if (excedeLimite(ip)) return NextResponse.json({ ok: true })

  try {
    const body = await req.json()
    const { tipo, userId, celebracionSlug, ruta, utmSource, utmMedium, utmCampaign, referrer, sessionId, metadata } = body
    if (!tipo || !TIPOS_VALIDOS.has(tipo)) return NextResponse.json({ ok: true })

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    await admin.from('eventos_analytics').insert({
      tipo,
      user_id: userId || null,
      celebracion_slug: celebracionSlug || null,
      ruta: ruta || null,
      utm_source: utmSource || null,
      utm_medium: utmMedium || null,
      utm_campaign: utmCampaign || null,
      referrer: referrer || null,
      session_id: sessionId || null,
      metadata: metadata || null,
    })
  } catch {
    // Nunca dejamos que un error de analytics se note en la experiencia del usuario.
  }
  return NextResponse.json({ ok: true })
}
