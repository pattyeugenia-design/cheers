import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { envolverEmail, trackedLink } from '../../emailTemplate'
import { obtenerPrefs, debeEnviarNuevaInstantaneo } from '../../notificacionesPrefs'

const resend = new Resend(process.env.RESEND_API_KEY)

// Mismo patrón de rate limit que notificar-rsvp/invitar-por-email.
const solicitudesPorIP = new Map<string, number[]>()
const LIMITE_SOLICITUDES = 5
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
  if (excedeLimite(ip)) return NextResponse.json({ success: true })

  const { celebracionSlug, regaloId } = await req.json()
  if (!celebracionSlug || !regaloId) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient(supabaseUrl, serviceKey)

  const { data: cel } = await admin.from('celebraciones').select('nombre, slug, organizador_id, gifts').eq('slug', celebracionSlug).single()
  if (!cel?.organizador_id) return NextResponse.json({ success: true })

  // "importante"/"leve" no mandan esta al instante — importante se agrupa en el
  // resumen periódico (cron resumen-notificaciones), leve la calla del todo.
  const prefs = await obtenerPrefs(admin, cel.organizador_id)
  if (!debeEnviarNuevaInstantaneo(prefs.por_tile.nivel)) return NextResponse.json({ success: true })

  const { data: { user: organizador } } = await admin.auth.admin.getUserById(cel.organizador_id)
  if (!organizador?.email) return NextResponse.json({ success: true })

  const { data: perfilOrg } = await admin.from('perfiles').select('lang').eq('user_id', cel.organizador_id).single()
  const lang: 'es' | 'en' = perfilOrg?.lang === 'en' ? 'en' : 'es'

  const regalo = (cel.gifts || []).find((g: any) => g.id === regaloId)
  const nombreRegalo = regalo?.nombre || (lang === 'en' ? 'A gift' : 'Un regalo')

  const subject = lang === 'en'
    ? `Someone reserved "${nombreRegalo}" for "${cel.nombre}"`
    : `Alguien reservó "${nombreRegalo}" en "${cel.nombre}"`

  const cuerpo = lang === 'en'
    ? `
        <p style="font-size: 16px; color: #1c1830;">Someone just reserved <strong>${nombreRegalo}</strong> for <strong>${cel.nombre}</strong>.</p>
        <p style="margin-top: 20px;">
          <a href="${trackedLink(`https://joincheers.app/${cel.slug}`, 'notificar_regalo')}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">View event →</a>
        </p>
    `
    : `
        <p style="font-size: 16px; color: #1c1830;">Alguien reservó <strong>${nombreRegalo}</strong> en <strong>${cel.nombre}</strong>.</p>
        <p style="margin-top: 20px;">
          <a href="${trackedLink(`https://joincheers.app/${cel.slug}`, 'notificar_regalo')}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver evento →</a>
        </p>
    `
  const html = envolverEmail(lang, cuerpo)

  try {
    await resend.emails.send({ from: 'Cheers <notificaciones@joincheers.app>', to: organizador.email, subject, html })
  } catch (e) {
    console.error('Error enviando email de notificación de regalo:', e)
  }

  return NextResponse.json({ success: true })
}
