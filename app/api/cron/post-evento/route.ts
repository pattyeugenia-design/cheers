import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { envolverEmail, trackedLink } from '../../../emailTemplate'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: Request) {
  // Verificar que la llamada viene de Vercel Cron, no de cualquiera
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient(supabaseUrl, serviceKey)

  // Eventos cuya fecha fue ayer (1 día después de la celebración)
  const ayerInicio = new Date()
  ayerInicio.setDate(ayerInicio.getDate() - 1)
  ayerInicio.setHours(0, 0, 0, 0)
  const ayerFin = new Date(ayerInicio)
  ayerFin.setHours(23, 59, 59, 999)

  const ayerStr = ayerInicio.toISOString().slice(0, 10)

  const { data: normales } = await admin
    .from('celebraciones')
    .select('nombre, slug, organizador_id, fecha, festejado_nombre')
    .gte('fecha', ayerInicio.toISOString())
    .lte('fecha', ayerFin.toISOString())
    .eq('archivada', false)
    .eq('recurrente', false)

  const pasadas: { nombre: string; slug: string; organizador_id: string; festejado_nombre?: string | null }[] = [...(normales || [])]

  // Series recurrentes: revisar si alguna de sus fechas fue ayer
  const { data: series } = await admin
    .from('celebraciones')
    .select('nombre, slug, organizador_id, festejado_nombre')
    .eq('recurrente', true)
    .eq('archivada', false)

  for (const serie of series || []) {
    const { data: ocurrenciaAyer } = await admin
      .from('ocurrencias')
      .select('fecha')
      .eq('celebracion_slug', serie.slug)
      .eq('cancelada', false)
      .eq('fecha', ayerStr)
      .limit(1)
    if (ocurrenciaAyer && ocurrenciaAyer.length > 0) pasadas.push(serie)
  }

  let enviados = 0

  for (const cel of pasadas || []) {
    if (!cel.organizador_id) continue

    const { data: { user: organizador } } = await admin.auth.admin.getUserById(cel.organizador_id)
    if (!organizador?.email) continue

    const { data: perfilOrg } = await admin.from('perfiles').select('plan, lang').eq('user_id', cel.organizador_id).single()
    const lang: 'es' | 'en' = perfilOrg?.lang === 'en' ? 'en' : 'es'
    const yaEsLifetime = perfilOrg?.plan === 'lifetime'
    const nombreEvento = cel.festejado_nombre || cel.nombre

    const lineaLifetime = yaEsLifetime
      ? ''
      : lang === 'en'
        ? `<p style="font-size: 14px; color: #6b6585;">And if you're already thinking about your next celebration: Extra Cheer keeps your full history forever and takes the limits off. No pressure, just leaving it here.</p>`
        : `<p style="font-size: 14px; color: #6b6585;">Y si ya estás pensando en la próxima celebración: con Extra Cheer guardas todo tu historial para siempre y ya no te preocupas por límites. Sin presión, ahí queda.</p>`

    const subject = lang === 'en' ? `How did ${cel.nombre} go?` : `¿Cómo estuvo ${cel.nombre}?`
    const cuerpo = lang === 'en'
      ? `
          <p style="font-size: 16px; color: #1c1830;">Hope ${nombreEvento} turned out amazing.</p>
          <p style="font-size: 15px; color: #6b6585;">If you want to tell us how it went, just reply to this email — we'd love to hear it.</p>
          ${lineaLifetime}
          <p style="margin-top: 20px;">
            <a href="${trackedLink('https://joincheers.app/perfil', 'post_evento')}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">See my profile →</a>
          </p>
      `
      : `
          <p style="font-size: 16px; color: #1c1830;">Esperamos que ${nombreEvento} haya salido increíble.</p>
          <p style="font-size: 15px; color: #6b6585;">Si quieres contarnos cómo te fue, con gusto lo leemos — solo responde este correo.</p>
          ${lineaLifetime}
          <p style="margin-top: 20px;">
            <a href="${trackedLink('https://joincheers.app/perfil', 'post_evento')}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver mi perfil →</a>
          </p>
      `
    const html = envolverEmail(lang, cuerpo)

    try {
      await resend.emails.send({ from: 'Cheers <notificaciones@joincheers.app>', to: organizador.email, subject, html })
      enviados++
    } catch (e) {
      console.error('Error enviando email post-evento para', cel.slug, e)
    }
  }

  return NextResponse.json({ success: true, enviados, revisados: pasadas?.length ?? 0 })
}
