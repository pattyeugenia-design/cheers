import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { envolverEmail, trackedLink, escapeHtml } from '../../emailTemplate'

const resend = new Resend(process.env.RESEND_API_KEY)

// Mismo patrón que /api/notificar-cambio-fecha (celebraciones normales) — el
// guardado de fecha/hora ya pasó antes de llamar esta ruta (guardarFecha en
// bridal/[id]), esto solo avisa. Si el correo falla, la fecha ya quedó
// guardada bien igual, solo se pierde el aviso.
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

  const { bodaId, accessToken } = await req.json()
  if (!bodaId || !accessToken) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const authClient = createClient(supabaseUrl, anonKey)
  const { data: { user: caller }, error: callerError } = await authClient.auth.getUser(accessToken)
  if (callerError || !caller) return NextResponse.json({ success: true })

  const admin = createClient(supabaseUrl, serviceKey)

  // Verificar que quien llama de verdad es miembro de esta boda
  const { data: miembro } = await admin
    .from('proyectos_boda_miembros')
    .select('user_id')
    .eq('boda_id', bodaId)
    .eq('user_id', caller.id)
    .maybeSingle()
  if (!miembro) return NextResponse.json({ success: true })

  const { data: proyecto } = await admin
    .from('proyectos_boda')
    .select('nombre_novia, nombre_novio, fecha_boda, hora_boda, lugar_nombre')
    .eq('id', bodaId)
    .single()
  if (!proyecto) return NextResponse.json({ success: true })

  const nombreBoda = [proyecto.nombre_novia, proyecto.nombre_novio].filter(Boolean).join(' & ') || 'la boda'
  const fechaFmt = proyecto.fecha_boda
    ? new Date(proyecto.fecha_boda + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null
  const horaFmt = proyecto.hora_boda
    ? new Date(`2000-01-01T${proyecto.hora_boda.slice(0, 5)}`).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
    : null

  const { data: invitados } = await admin
    .from('boda_invitados')
    .select('id, nombre, email, token')
    .eq('boda_id', bodaId)
    .not('email', 'is', null)

  const subject = `Cambio de fecha: boda de ${nombreBoda}`

  let enviados = 0
  await Promise.allSettled(
    (invitados || []).map(async inv => {
      const link = trackedLink(`https://joincheers.app/bridal/rsvp/${inv.token}`, 'notificar_cambio_fecha_boda')
      const cuerpo = `
          <p style="font-size: 16px; color: #1c1830;">Hola ${escapeHtml(inv.nombre)}, se actualizó la fecha de la boda de <strong>${escapeHtml(nombreBoda)}</strong>.</p>
          ${fechaFmt ? `<p style="font-size: 15px; color: #6b6585; margin: 0 0 2px;">${fechaFmt}${horaFmt ? `, ${horaFmt}` : ''}</p>` : ''}
          ${proyecto.lugar_nombre ? `<p style="font-size: 15px; color: #a39ec0; margin: 0 0 14px;">${escapeHtml(proyecto.lugar_nombre)}</p>` : ''}
          <p style="margin-top: 20px;">
            <a href="${link}" style="background: linear-gradient(135deg,#C9A876,#C98A93); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver invitación →</a>
          </p>
      `
      const html = envolverEmail('es', cuerpo)
      try {
        await resend.emails.send({ from: 'Cheers <notificaciones@joincheers.app>', to: inv.email, subject, html })
        enviados++
      } catch (e) {
        console.error('Error enviando aviso de cambio de fecha de boda:', e)
      }
    })
  )

  return NextResponse.json({ success: true, enviados })
}
