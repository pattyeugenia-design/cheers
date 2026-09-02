import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { envolverEmail, trackedLink, escapeHtml } from '../../emailTemplate'
import { registrarNotificacionApp } from '../../notificacionesApp'

const resend = new Resend(process.env.RESEND_API_KEY)

// Rate limit simple en memoria — mismo patrón que las demás rutas de correo.
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

// A diferencia de notificar-cancelacion, aquí el guardado de la fecha/hora ya
// pasó antes de llamar esta ruta (guardarCampo/guardarHora en la página del
// evento) — esto solo avisa. Si el correo falla, la fecha ya quedó guardada
// bien igual, solo se pierde el aviso, que es un daño menor.
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconocida'
  if (excedeLimite(ip)) return NextResponse.json({ success: true })

  const { celebracionSlug, accessToken } = await req.json()
  if (!celebracionSlug || !accessToken) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const authClient = createClient(supabaseUrl, anonKey)
  const { data: { user: caller }, error: callerError } = await authClient.auth.getUser(accessToken)
  if (callerError || !caller) return NextResponse.json({ success: true })

  const admin = createClient(supabaseUrl, serviceKey)

  const { data: cel } = await admin
    .from('celebraciones')
    .select('nombre, slug, organizador_id, fecha, paradas, cancelada')
    .eq('slug', celebracionSlug)
    .single()
  if (!cel) return NextResponse.json({ success: true })
  if (cel.organizador_id !== caller.id) return NextResponse.json({ success: true })
  if (cel.cancelada) return NextResponse.json({ success: true }) // evento cancelado no manda avisos de fecha

  const { data: perfilOrg } = await admin.from('perfiles').select('lang').eq('user_id', cel.organizador_id).single()
  const lang: 'es' | 'en' = perfilOrg?.lang === 'en' ? 'en' : 'es'
  const locale = lang === 'en' ? 'en-US' : 'es-MX'
  const nombreEvento = escapeHtml(cel.nombre)

  const primeraParada = (cel.paradas || []).find((p: any) => p?.lugar || p?.hora)
  const fechaFmt = cel.fecha
    ? new Date(cel.fecha + 'T00:00:00').toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null
  const horaFmt = primeraParada?.hora
    ? new Date(`2000-01-01T${primeraParada.hora.slice(0, 5)}`).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
    : null
  const lugarNombre = primeraParada?.lugar ? escapeHtml(primeraParada.lugar) : null

  const { data: invitados } = await admin
    .from('invitados')
    .select('email, user_id')
    .eq('celebracion_slug', celebracionSlug)

  const subject = lang === 'en' ? `Date updated: ${cel.nombre}` : `Cambio de fecha: ${cel.nombre}`
  const cuerpo = lang === 'en'
    ? `
        <p style="font-size: 16px; color: #1c1830;">The date for <strong>${nombreEvento}</strong> was updated.</p>
        ${fechaFmt ? `<p style="font-size: 15px; color: #6b6585; margin: 0 0 2px;">${fechaFmt}${horaFmt ? `, ${horaFmt}` : ''}</p>` : ''}
        ${lugarNombre ? `<p style="font-size: 15px; color: #a39ec0; margin: 0 0 14px;">${lugarNombre}</p>` : ''}
        <p style="margin-top: 20px;">
          <a href="${trackedLink(`https://joincheers.app/${cel.slug}`, 'notificar_cambio_fecha')}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">View event →</a>
        </p>
    `
    : `
        <p style="font-size: 16px; color: #1c1830;">Se actualizó la fecha de <strong>${nombreEvento}</strong>.</p>
        ${fechaFmt ? `<p style="font-size: 15px; color: #6b6585; margin: 0 0 2px;">${fechaFmt}${horaFmt ? `, ${horaFmt}` : ''}</p>` : ''}
        ${lugarNombre ? `<p style="font-size: 15px; color: #a39ec0; margin: 0 0 14px;">${lugarNombre}</p>` : ''}
        <p style="margin-top: 20px;">
          <a href="${trackedLink(`https://joincheers.app/${cel.slug}`, 'notificar_cambio_fecha')}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver evento →</a>
        </p>
    `
  const html = envolverEmail(lang, cuerpo)

  const textoNotifApp = lang === 'en'
    ? `The date for "${cel.nombre}" changed${fechaFmt ? `: ${fechaFmt}` : ''}`
    : `Cambió la fecha de "${cel.nombre}"${fechaFmt ? `: ${fechaFmt}` : ''}`

  await Promise.allSettled(
    (invitados || []).map(async inv => {
      if (inv.user_id) {
        await registrarNotificacionApp(admin, inv.user_id, 'cambio_fecha', celebracionSlug, textoNotifApp)
      }
      if (inv.email) {
        await resend.emails.send({ from: 'Cheers <notificaciones@joincheers.app>', to: inv.email, subject, html })
      }
    })
  )

  return NextResponse.json({ success: true })
}
