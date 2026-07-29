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

export async function POST(req: Request) {
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
