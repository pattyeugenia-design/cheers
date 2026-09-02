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

// Esta ruta hace las dos cosas juntas (marcar cancelada=true en la base Y avisar
// a los invitados) en una sola llamada, a propósito — si lo separábamos en dos
// pasos (guardar por un lado, avisar por otro) y el segundo paso fallaba, el
// evento quedaba cancelado pero nadie se enteraba. Mismo espíritu que los demás
// arreglos de "falla silenciosa" de hoy.
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconocida'
  if (excedeLimite(ip)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes, intenta en un minuto.' }, { status: 429 })
  }

  const { celebracionSlug, motivo, accessToken } = await req.json()
  if (!celebracionSlug || !accessToken) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // Verificar que quien llama de verdad es quien dice ser, y que es la organizadora
  // de este evento específico — nunca confiar en lo que mande el navegador.
  const authClient = createClient(supabaseUrl, anonKey)
  const { data: { user: caller }, error: callerError } = await authClient.auth.getUser(accessToken)
  if (callerError || !caller) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })

  const admin = createClient(supabaseUrl, serviceKey)

  const { data: cel } = await admin
    .from('celebraciones')
    .select('nombre, slug, organizador_id')
    .eq('slug', celebracionSlug)
    .single()
  if (!cel) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  if (cel.organizador_id !== caller.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const motivoLimpio: string | null = typeof motivo === 'string' && motivo.trim() ? motivo.trim().slice(0, 500) : null

  const { error: errorUpdate } = await admin
    .from('celebraciones')
    .update({ cancelada: true, cancelada_en: new Date().toISOString(), cancelada_motivo: motivoLimpio })
    .eq('slug', celebracionSlug)
  if (errorUpdate) return NextResponse.json({ error: 'No se pudo cancelar el evento' }, { status: 500 })

  const { data: perfilOrg } = await admin.from('perfiles').select('lang').eq('user_id', cel.organizador_id).single()
  const lang: 'es' | 'en' = perfilOrg?.lang === 'en' ? 'en' : 'es'
  const nombreEvento = escapeHtml(cel.nombre)
  const motivoHtml = motivoLimpio ? escapeHtml(motivoLimpio) : null

  const { data: invitados } = await admin
    .from('invitados')
    .select('email, nombre, user_id')
    .eq('celebracion_slug', celebracionSlug)

  const subject = lang === 'en' ? `Cancelled: ${cel.nombre}` : `Cancelado: ${cel.nombre}`
  const cuerpo = lang === 'en'
    ? `
        <p style="font-size: 16px; color: #1c1830;"><strong>${nombreEvento}</strong> has been cancelled by the organizer.</p>
        ${motivoHtml ? `<p style="font-size: 14px; color: #6b6585; font-style: italic;">"${motivoHtml}"</p>` : ''}
        <p style="margin-top: 20px;">
          <a href="${trackedLink(`https://joincheers.app/${cel.slug}`, 'notificar_cancelacion')}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">View event →</a>
        </p>
    `
    : `
        <p style="font-size: 16px; color: #1c1830;"><strong>${nombreEvento}</strong> fue cancelado por la organizadora.</p>
        ${motivoHtml ? `<p style="font-size: 14px; color: #6b6585; font-style: italic;">"${motivoHtml}"</p>` : ''}
        <p style="margin-top: 20px;">
          <a href="${trackedLink(`https://joincheers.app/${cel.slug}`, 'notificar_cancelacion')}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver evento →</a>
        </p>
    `
  const html = envolverEmail(lang, cuerpo)

  const textoNotifApp = lang === 'en' ? `"${cel.nombre}" was cancelled` : `"${cel.nombre}" fue cancelado`

  let correosEnviados = 0
  const resultados = await Promise.allSettled(
    (invitados || []).map(async inv => {
      if (inv.user_id) {
        await registrarNotificacionApp(admin, inv.user_id, 'cancelacion', celebracionSlug, textoNotifApp)
      }
      if (inv.email) {
        await resend.emails.send({ from: 'Cheers <notificaciones@joincheers.app>', to: inv.email, subject, html })
        correosEnviados++
      }
    })
  )
  const fallos = resultados.filter(r => r.status === 'rejected').length
  if (fallos > 0) console.error(`notificar-cancelacion: ${fallos} avisos fallaron para ${celebracionSlug}`)

  return NextResponse.json({ success: true, correosEnviados, invitados: (invitados || []).length })
}
