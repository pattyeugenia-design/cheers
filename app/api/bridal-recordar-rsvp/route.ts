import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { envolverEmail, trackedLink, escapeHtml } from '../../emailTemplate'

const resend = new Resend(process.env.RESEND_API_KEY)

// Mismo patrón de rate limit que /api/invitar-por-email — frena abuso básico.
const solicitudesPorIP = new Map<string, number[]>()
const LIMITE_SOLICITUDES = 10
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
  if (excedeLimite(ip)) return NextResponse.json({ success: true, enviados: 0 })

  const { bodaId, accessToken } = await req.json()
  if (!bodaId || !accessToken) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // Igual que invitar-por-email: nunca confiar en el navegador — se verifica la
  // sesión real y que quien llama de verdad sea miembro de esta boda.
  const authClient = createClient(supabaseUrl, anonKey)
  const { data: { user: caller }, error: callerError } = await authClient.auth.getUser(accessToken)
  if (callerError || !caller) return NextResponse.json({ success: true, enviados: 0 })

  const admin = createClient(supabaseUrl, serviceKey)

  const { data: miembro } = await admin
    .from('proyectos_boda_miembros')
    .select('user_id')
    .eq('boda_id', bodaId)
    .eq('user_id', caller.id)
    .maybeSingle()
  if (!miembro) return NextResponse.json({ success: true, enviados: 0 })

  const { data: proyecto } = await admin
    .from('proyectos_boda')
    .select('nombre_novia, nombre_novio, fecha_boda, lugar_nombre')
    .eq('id', bodaId)
    .single()
  if (!proyecto) return NextResponse.json({ success: true, enviados: 0 })

  const { data: invitados } = await admin
    .from('boda_invitados')
    .select('id, nombre, email, token')
    .eq('boda_id', bodaId)
    .not('email', 'is', null)

  const { data: rsvps } = await admin
    .from('boda_rsvps')
    .select('invitado_id')
    .eq('boda_id', bodaId)

  const yaRespondio = new Set((rsvps || []).map(r => r.invitado_id))
  const pendientes = (invitados || []).filter(inv => !yaRespondio.has(inv.id))

  const nombreBoda = [proyecto.nombre_novia, proyecto.nombre_novio].filter(Boolean).join(' & ')
  const fechaFmt = proyecto.fecha_boda
    ? new Date(proyecto.fecha_boda + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null

  let enviados = 0
  for (const inv of pendientes) {
    const link = trackedLink(`https://joincheers.app/bridal/rsvp/${inv.token}`, 'recordatorio-rsvp-boda')
    const subject = `¿Nos acompañas en la boda de ${nombreBoda}?`
    const cuerpo = `
        <p style="font-size: 16px; color: #1c1830;">Hola ${escapeHtml(inv.nombre)}, todavía no hemos recibido tu confirmación para la boda de <strong>${escapeHtml(nombreBoda)}</strong>.</p>
        ${fechaFmt ? `<p style="font-size: 14px; color: #6b6585;">${fechaFmt}</p>` : ''}
        ${proyecto.lugar_nombre ? `<p style="font-size: 14px; color: #a39ec0;">${escapeHtml(proyecto.lugar_nombre)}</p>` : ''}
        <p style="margin-top: 16px;">
          <a href="${link}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: 700;">Confirmar asistencia →</a>
        </p>
    `
    const html = envolverEmail('es', cuerpo)
    try {
      await resend.emails.send({ from: 'Cheers <notificaciones@joincheers.app>', to: inv.email, subject, html })
      enviados++
    } catch (e) {
      console.error('Error enviando recordatorio de RSVP boda:', e)
    }
  }

  return NextResponse.json({ success: true, enviados })
}
