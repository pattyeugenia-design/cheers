import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { envolverEmail, trackedLink } from '../../../emailTemplate'

const resend = new Resend(process.env.RESEND_API_KEY)

// Recordatorio fijo ~15 horas antes del evento, para organizador + TODOS los
// invitados con correo conocido, sin importar si ya confirmaron o no.
// Distinto del cron "recordatorios" (que es configurable en días y solo va al organizador).
async function enviarRecordatorio15h(
  admin: any,
  slug: string,
  nombreEvento: string,
  organizadorId: string
) {
  const { data: { user: organizador } } = await admin.auth.admin.getUserById(organizadorId)
  const { data: perfilOrg } = await admin.from('perfiles').select('username, nombre_completo, lang').eq('user_id', organizadorId).single()
  const lang: 'es' | 'en' = (perfilOrg as any)?.lang === 'en' ? 'en' : 'es'
  const firma = (perfilOrg as any)?.nombre_completo || ((perfilOrg as any)?.username ? `@${(perfilOrg as any).username}` : '')

  const { data: invitados } = await admin
    .from('invitados')
    .select('email')
    .eq('celebracion_slug', slug)
    .not('email', 'is', null)

  const destinatarios = new Set<string>()
  if (organizador?.email) destinatarios.add(organizador.email)
  for (const inv of (invitados || []) as any[]) {
    if (inv.email) destinatarios.add(inv.email)
  }
  if (destinatarios.size === 0) return 0

  const link = trackedLink(`https://joincheers.app/${slug}`, 'recordatorio_15h')
  const subject = lang === 'en' ? `Reminder: "${nombreEvento}" is in less than 15 hours` : `Recordatorio: "${nombreEvento}" es en menos de 15 horas`
  const cuerpo = lang === 'en'
    ? `
        <p style="font-size: 16px; color: #1c1830;">Friendly reminder — <strong>${nombreEvento}</strong> is coming up soon.</p>
        <p style="font-size: 15px; color: #6b6585;">See you there${firma ? `, ${firma}` : ''}.</p>
        <p style="margin-top: 20px;">
          <a href="${link}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">View event →</a>
        </p>
    `
    : `
        <p style="font-size: 16px; color: #1c1830;">Friendly reminder — <strong>${nombreEvento}</strong> es pronto.</p>
        <p style="font-size: 15px; color: #6b6585;">Nos vemos ahí${firma ? `, ${firma}` : ''}.</p>
        <p style="margin-top: 20px;">
          <a href="${link}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver evento →</a>
        </p>
    `
  const html = envolverEmail(lang, cuerpo)

  let enviados = 0
  for (const email of destinatarios) {
    try {
      await resend.emails.send({ from: 'Cheers <notificaciones@joincheers.app>', to: email, subject, html })
      enviados++
    } catch (e) {
      console.error('Error enviando recordatorio 15h a', email, 'para', slug, e)
    }
  }
  return enviados
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient(supabaseUrl, serviceKey)

  const ahora = new Date()
  let enviados = 0

  // 1. Celebraciones no recurrentes: su propia fecha es la ocurrencia real
  const { data: normales } = await admin
    .from('celebraciones')
    .select('nombre, slug, organizador_id, fecha, paradas, recordatorio_15h_enviado')
    .eq('archivada', false)
    .eq('recurrente', false)
    .eq('recordatorio_15h_enviado', false)
    .not('fecha', 'is', null)

  for (const cel of (normales || []) as any[]) {
    if (!cel.organizador_id) continue
    const primerParada = (cel.paradas || []).find((p: any) => p?.id)
    const horaEvento = primerParada?.hora || '12:00'
    const fechaBase = String(cel.fecha).slice(0, 10)
    const eventoDT = new Date(`${fechaBase}T${horaEvento}:00`)
    const horasFaltan = (eventoDT.getTime() - ahora.getTime()) / (1000 * 60 * 60)

    if (horasFaltan > 0 && horasFaltan <= 15) {
      enviados += await enviarRecordatorio15h(admin, cel.slug, cel.nombre, cel.organizador_id)
      await admin.from('celebraciones').update({ recordatorio_15h_enviado: true }).eq('slug', cel.slug)
    }
  }

  // 2. Series recurrentes: revisar cada ocurrencia futura pendiente de aviso
  const { data: ocurrenciasPendientes } = await admin
    .from('ocurrencias')
    .select('id, celebracion_slug, fecha, hora')
    .eq('cancelada', false)
    .eq('recordatorio_15h_enviado', false)

  for (const oc of (ocurrenciasPendientes || []) as any[]) {
    const horaEvento = oc.hora || '12:00'
    const eventoDT = new Date(`${oc.fecha}T${horaEvento}:00`)
    const horasFaltan = (eventoDT.getTime() - ahora.getTime()) / (1000 * 60 * 60)

    if (horasFaltan > 0 && horasFaltan <= 15) {
      const { data: serie } = await admin.from('celebraciones').select('nombre, slug, organizador_id').eq('slug', oc.celebracion_slug).single()
      if (serie?.organizador_id) {
        enviados += await enviarRecordatorio15h(admin, serie.slug, serie.nombre, serie.organizador_id)
        await admin.from('ocurrencias').update({ recordatorio_15h_enviado: true }).eq('id', oc.id)
      }
    }
  }

  return NextResponse.json({ success: true, enviados })
}
