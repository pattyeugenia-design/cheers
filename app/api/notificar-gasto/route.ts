import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { envolverEmail, trackedLink, escapeHtml } from '../../emailTemplate'
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

// A diferencia de RSVP/regalo/mensaje, aquí quien debe enterarse NO es la
// organizadora (ella es quien registra el gasto) sino cada invitado que quedó
// participando en el split — se le avisa cuánto le toca. Por eso este endpoint
// recibe el gasto ya creado y notifica a sus participantes, uno por uno.
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconocida'
  if (excedeLimite(ip)) return NextResponse.json({ success: true })

  const { celebracionSlug, gastoId } = await req.json()
  if (!celebracionSlug || !gastoId) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient(supabaseUrl, serviceKey)

  const { data: cel } = await admin.from('celebraciones').select('nombre, slug, organizador_id').eq('slug', celebracionSlug).single()
  if (!cel?.organizador_id) return NextResponse.json({ success: true })

  // El nivel que manda aquí es el de cada participante (si tiene cuenta propia),
  // no el de la organizadora — ella no es quien recibe este correo.
  const { data: gasto } = await admin.from('gastos').select('descripcion, monto').eq('id', gastoId).single()
  if (!gasto) return NextResponse.json({ success: true })

  // Escapados antes de meterlos en el HTML del correo — descripción la escribe
  // la organizadora, pero igual se sanea por si acaso; nombre del evento igual.
  const descripcionGasto = escapeHtml(gasto.descripcion)
  const nombreEvento = escapeHtml(cel.nombre)

  // Sella este gastoId como ya notificado (ver notificar-rsvp para el porqué).
  const { error: yaNotificado } = await admin.from('notificaciones_enviadas').insert({ tipo: 'gasto', recurso_id: gastoId, celebracion_slug: celebracionSlug })
  if (yaNotificado) return NextResponse.json({ success: true })

  const { data: participantes } = await admin
    .from('gasto_participantes')
    .select('invitado_id, monto_parte, es_organizador')
    .eq('gasto_id', gastoId)
  if (!participantes?.length) return NextResponse.json({ success: true })

  const idsInvitados = participantes.filter(p => p.invitado_id).map(p => p.invitado_id)
  if (!idsInvitados.length) return NextResponse.json({ success: true })

  const { data: invitados } = await admin.from('invitados').select('id, email, nombre, user_id').in('id', idsInvitados)

  for (const p of participantes) {
    const inv = invitados?.find(i => i.id === p.invitado_id)
    if (!inv?.email) continue

    const { data: perfilInv } = inv.user_id ? await admin.from('perfiles').select('lang').eq('user_id', inv.user_id).single() : { data: null }
    const lang: 'es' | 'en' = perfilInv?.lang === 'en' ? 'en' : 'es'

    // Si tiene cuenta propia, su nivel de "gasto" manda sobre si le llega al
    // instante o se agrupa en su resumen — el historial in-app siempre se
    // registra, sin importar el nivel. Sin cuenta, se manda directo (mismo
    // criterio que invitar-por-email, no hay perfil donde guardar preferencia).
    if (inv.user_id) {
      await registrarNotificacionApp(admin, inv.user_id, 'gasto', cel.slug, lang === 'en'
        ? `You owe $${Number(p.monto_parte).toLocaleString()} in "${cel.nombre}"`
        : `Te toca pagar $${Number(p.monto_parte).toLocaleString()} en "${cel.nombre}"`)
      const prefsInv = await obtenerPrefs(admin, inv.user_id)
      if (!debeEnviarNuevaInstantaneo(prefsInv.gasto.nivel)) continue
    }

    const subject = lang === 'en'
      ? `You owe $${Number(p.monto_parte).toLocaleString()} in "${nombreEvento}"`
      : `Te toca pagar $${Number(p.monto_parte).toLocaleString()} en "${nombreEvento}"`

    const cuerpo = lang === 'en'
      ? `
          <p style="font-size: 16px; color: #1c1830;">New expense in <strong>${nombreEvento}</strong>: <strong>${descripcionGasto}</strong>.</p>
          <p style="font-size: 16px; color: #1c1830;">Your share: <strong>$${Number(p.monto_parte).toLocaleString()}</strong>.</p>
          <p style="margin-top: 20px;">
            <a href="${trackedLink(`https://joincheers.app/${cel.slug}`, 'notificar_gasto')}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">View event →</a>
          </p>
      `
      : `
          <p style="font-size: 16px; color: #1c1830;">Nuevo gasto en <strong>${nombreEvento}</strong>: <strong>${descripcionGasto}</strong>.</p>
          <p style="font-size: 16px; color: #1c1830;">Tu parte: <strong>$${Number(p.monto_parte).toLocaleString()}</strong>.</p>
          <p style="margin-top: 20px;">
            <a href="${trackedLink(`https://joincheers.app/${cel.slug}`, 'notificar_gasto')}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver evento →</a>
          </p>
      `
    const html = envolverEmail(lang, cuerpo)

    try {
      await resend.emails.send({ from: 'Cheers <notificaciones@joincheers.app>', to: inv.email, subject, html })
    } catch (e) {
      console.error('Error enviando email de notificación de gasto:', e)
    }
  }

  return NextResponse.json({ success: true })
}
