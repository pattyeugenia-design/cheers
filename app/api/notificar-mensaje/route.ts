import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { envolverEmail, trackedLink } from '../../emailTemplate'
import { obtenerPrefs, debeEnviarNuevaInstantaneo } from '../../notificacionesPrefs'
import { registrarNotificacionApp } from '../../notificacionesApp'

const resend = new Resend(process.env.RESEND_API_KEY)

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

  const { celebracionSlug, mensajeId } = await req.json()
  if (!celebracionSlug || !mensajeId) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient(supabaseUrl, serviceKey)

  const { data: cel } = await admin.from('celebraciones').select('nombre, slug, organizador_id').eq('slug', celebracionSlug).single()
  if (!cel?.organizador_id) return NextResponse.json({ success: true })

  // Se vuelve a leer el mensaje real de la base de datos por su id — nunca se
  // confía en el autor/texto que mande el navegador, para que nadie pueda
  // mandarle al organizador un mensaje inventado haciéndose pasar por invitado.
  const { data: msg } = await admin.from('mensajes').select('nombre, texto, celebracion_slug').eq('id', mensajeId).single()
  if (!msg || msg.celebracion_slug !== celebracionSlug) return NextResponse.json({ success: true })

  const { data: perfilOrg } = await admin.from('perfiles').select('lang').eq('user_id', cel.organizador_id).single()
  const lang: 'es' | 'en' = perfilOrg?.lang === 'en' ? 'en' : 'es'
  const autor = msg.nombre || (lang === 'en' ? 'Someone' : 'Alguien')
  const texto = msg.texto

  // El historial in-app siempre se registra, sin importar el nivel de email elegido.
  await registrarNotificacionApp(admin, cel.organizador_id, 'mensaje', cel.slug, lang === 'en'
    ? `${autor} left a message in "${cel.nombre}"`
    : `${autor} dejó un mensaje en "${cel.nombre}"`)

  const prefs = await obtenerPrefs(admin, cel.organizador_id)
  if (!debeEnviarNuevaInstantaneo(prefs.mensaje.nivel)) return NextResponse.json({ success: true })

  const { data: { user: organizador } } = await admin.auth.admin.getUserById(cel.organizador_id)
  if (!organizador?.email) return NextResponse.json({ success: true })

  const subject = lang === 'en'
    ? `New message in "${cel.nombre}"`
    : `Nuevo mensaje en "${cel.nombre}"`

  const cuerpo = lang === 'en'
    ? `
        <p style="font-size: 16px; color: #1c1830;"><strong>${autor}</strong> left a message in <strong>${cel.nombre}</strong>:</p>
        <p style="font-size: 14px; color: #6b6585; font-style: italic;">"${texto}"</p>
        <p style="margin-top: 20px;">
          <a href="${trackedLink(`https://joincheers.app/${cel.slug}`, 'notificar_mensaje')}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">View event →</a>
        </p>
    `
    : `
        <p style="font-size: 16px; color: #1c1830;"><strong>${autor}</strong> dejó un mensaje en <strong>${cel.nombre}</strong>:</p>
        <p style="font-size: 14px; color: #6b6585; font-style: italic;">"${texto}"</p>
        <p style="margin-top: 20px;">
          <a href="${trackedLink(`https://joincheers.app/${cel.slug}`, 'notificar_mensaje')}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver evento →</a>
        </p>
    `
  const html = envolverEmail(lang, cuerpo)

  try {
    await resend.emails.send({ from: 'Cheers <notificaciones@joincheers.app>', to: organizador.email, subject, html })
  } catch (e) {
    console.error('Error enviando email de notificación de mensaje:', e)
  }

  return NextResponse.json({ success: true })
}
