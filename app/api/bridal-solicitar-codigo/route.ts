import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { envolverEmail, escapeHtml } from '../../emailTemplate'

const resend = new Resend(process.env.RESEND_API_KEY)

// Primer paso del RSVP público (sin token) de Cheers Bridal: el invitado escribe
// su correo en la página pública de la boda, si ese correo está en la lista de
// boda_invitados le mandamos un código de 6 dígitos. Nunca revelamos si el
// correo está o no en la lista — mismo criterio que el reset de contraseña.
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

function generarCodigo(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconocida'
  if (excedeLimite(ip)) return NextResponse.json({ success: true })

  const { bodaId, email } = await req.json()
  if (!bodaId || !email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }
  const correoNormalizado = email.trim().toLowerCase()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient(supabaseUrl, serviceKey)

  const { data: invitado } = await admin
    .from('boda_invitados')
    .select('id, nombre, email')
    .eq('boda_id', bodaId)
    .ilike('email', correoNormalizado)
    .maybeSingle()

  // Sin invitado con ese correo: respondemos success igual, para no revelar
  // quién está o no en la lista de invitados.
  if (!invitado) return NextResponse.json({ success: true })

  const { data: proyecto } = await admin
    .from('proyectos_boda')
    .select('nombre_novia, nombre_novio')
    .eq('id', bodaId)
    .single()
  const nombreBoda = [proyecto?.nombre_novia, proyecto?.nombre_novio].filter(Boolean).join(' & ') || 'la boda'

  const codigo = generarCodigo()
  const expiraEn = new Date(Date.now() + 15 * 60_000).toISOString()
  await admin.from('boda_codigos_verificacion').insert({
    boda_id: bodaId,
    invitado_id: invitado.id,
    codigo,
    expira_en: expiraEn,
  })

  const subject = `Tu código para confirmar asistencia — boda de ${nombreBoda}`
  const cuerpo = `
      <p style="font-size: 16px; color: #1c1830;">Hola ${escapeHtml(invitado.nombre)}, este es tu código para confirmar tu asistencia a la boda de <strong>${escapeHtml(nombreBoda)}</strong>:</p>
      <p style="font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #B76E79; margin: 20px 0;">${codigo}</p>
      <p style="font-size: 13px; color: #a39ec0;">Este código vence en 15 minutos.</p>
  `
  const html = envolverEmail('es', cuerpo)
  try {
    await resend.emails.send({ from: 'Cheers <notificaciones@joincheers.app>', to: invitado.email, subject, html })
  } catch (e) {
    console.error('Error enviando código de verificación de boda:', e)
  }

  return NextResponse.json({ success: true })
}
