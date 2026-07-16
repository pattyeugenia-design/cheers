import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { envolverEmail, trackedLink } from '../../emailTemplate'

const resend = new Resend(process.env.RESEND_API_KEY)

// Rate limit simple en memoria: max 5 solicitudes por IP cada 60 segundos.
// No es perfecto en serverless (cada instancia tiene su propio Map), pero
// frena abuso básico de un script pegándole al endpoint, sin costo extra.
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
  if (excedeLimite(ip)) {
    // No revelamos el límite, solo dejamos de procesar (mismo patrón que los demás early-returns de esta ruta).
    return NextResponse.json({ success: true })
  }

  const { celebracionSlug, nombreInvitado, asistencia, mensaje } = await req.json()
  if (!celebracionSlug || !nombreInvitado || !asistencia) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient(supabaseUrl, serviceKey)

  const { data: cel } = await admin.from('celebraciones').select('nombre, slug, organizador_id').eq('slug', celebracionSlug).single()
  if (!cel?.organizador_id) return NextResponse.json({ success: true })

  const { data: { user: organizador } } = await admin.auth.admin.getUserById(cel.organizador_id)
  if (!organizador?.email) return NextResponse.json({ success: true })

  const { data: perfilOrg } = await admin.from('perfiles').select('lang').eq('user_id', cel.organizador_id).single()
  const lang: 'es' | 'en' = perfilOrg?.lang === 'en' ? 'en' : 'es'

  const asistenciaLabel = lang === 'en'
    ? (asistencia === 'si' ? "is going" : asistencia === 'no' ? "can't go" : 'might go')
    : (asistencia === 'si' ? 'sí va' : asistencia === 'no' ? 'no puede ir' : 'tal vez va')

  const subject = lang === 'en'
    ? `${nombreInvitado} responded: ${asistenciaLabel} to "${cel.nombre}"`
    : `${nombreInvitado} confirmó: ${asistenciaLabel} a "${cel.nombre}"`

  const cuerpo = lang === 'en'
    ? `
        <p style="font-size: 16px; color: #1c1830;"><strong>${nombreInvitado}</strong> ${asistenciaLabel} to <strong>${cel.nombre}</strong>.</p>
        ${mensaje ? `<p style="font-size: 14px; color: #6b6585; font-style: italic;">"${mensaje}"</p>` : ''}
        <p style="margin-top: 20px;">
          <a href="${trackedLink(`https://joincheers.app/${cel.slug}`, 'notificar_rsvp')}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">View event →</a>
        </p>
    `
    : `
        <p style="font-size: 16px; color: #1c1830;"><strong>${nombreInvitado}</strong> ${asistenciaLabel} a <strong>${cel.nombre}</strong>.</p>
        ${mensaje ? `<p style="font-size: 14px; color: #6b6585; font-style: italic;">"${mensaje}"</p>` : ''}
        <p style="margin-top: 20px;">
          <a href="${trackedLink(`https://joincheers.app/${cel.slug}`, 'notificar_rsvp')}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver evento →</a>
        </p>
    `
  const html = envolverEmail(lang, cuerpo)

  try {
    await resend.emails.send({ from: 'Cheers <notificaciones@joincheers.app>', to: organizador.email, subject, html })
  } catch (e) {
    console.error('Error enviando email de notificación RSVP:', e)
  }

  return NextResponse.json({ success: true })
}
