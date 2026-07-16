import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { envolverEmail, trackedLink } from '../../../emailTemplate'

const resend = new Resend(process.env.RESEND_API_KEY)

// Recordatorios extra, opcionales, que cada persona (organizador o invitado) activa para
// sí misma en los días que quiera (recordatorios_personales) — distinto del recordatorio
// fijo de 15h y del recordatorio_dias del organizador para todo el evento.
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient(supabaseUrl, serviceKey)

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const hoyStr = hoy.toISOString().slice(0, 10)

  const { data: preferencias } = await admin
    .from('recordatorios_personales')
    .select('user_id, celebracion_slug, dias_antes')

  let enviados = 0

  for (const pref of (preferencias || []) as any[]) {
    const { data: cel } = await admin
      .from('celebraciones')
      .select('nombre, slug, fecha, recurrente, archivada, paradas')
      .eq('slug', pref.celebracion_slug)
      .single()
    if (!cel || cel.archivada) continue

    // Fecha(s) candidatas: normal -> su propia fecha; recurrente -> ocurrencias futuras
    const fechas: string[] = []
    if (!cel.recurrente) {
      if (cel.fecha) fechas.push(String(cel.fecha).slice(0, 10))
    } else {
      const { data: ocurrencias } = await admin
        .from('ocurrencias')
        .select('fecha')
        .eq('celebracion_slug', cel.slug)
        .eq('cancelada', false)
        .gte('fecha', hoyStr)
      for (const oc of (ocurrencias || []) as any[]) fechas.push(oc.fecha)
    }

    for (const fechaStr of fechas) {
      const fechaEvento = new Date(fechaStr)
      fechaEvento.setHours(0, 0, 0, 0)
      const diffDias = Math.round((fechaEvento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDias !== pref.dias_antes) continue

      const { data: { user: destinatario } } = await admin.auth.admin.getUserById(pref.user_id)
      if (!destinatario?.email) continue

      const { data: perfil } = await admin.from('perfiles').select('lang, plan').eq('user_id', pref.user_id).single()
      // Si dejó de ser Lifetime, ya no se le manda (el beneficio es de su cuenta, no del evento)
      if (perfil?.plan !== 'lifetime') continue
      const lang: 'es' | 'en' = perfil?.lang === 'en' ? 'en' : 'es'

      const link = trackedLink(`https://joincheers.app/${cel.slug}`, 'recordatorio_personal')
      const subject = lang === 'en' ? `Reminder: "${cel.nombre}" is coming up` : `Recordatorio: "${cel.nombre}" se acerca`
      const cuerpo = lang === 'en'
        ? `
            <p style="font-size: 16px; color: #1c1830;">Friendly reminder you set up — <strong>${cel.nombre}</strong> is coming up.</p>
            <p style="margin-top: 20px;">
              <a href="${link}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">View event →</a>
            </p>
        `
        : `
            <p style="font-size: 16px; color: #1c1830;">Friendly reminder que tú activaste — <strong>${cel.nombre}</strong> se acerca.</p>
            <p style="margin-top: 20px;">
              <a href="${link}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver evento →</a>
            </p>
        `
      const html = envolverEmail(lang, cuerpo)

      try {
        await resend.emails.send({ from: 'Cheers <notificaciones@joincheers.app>', to: destinatario.email, subject, html })
        enviados++
      } catch (e) {
        console.error('Error enviando recordatorio personal para', pref.user_id, cel.slug, e)
      }
    }
  }

  return NextResponse.json({ success: true, enviados })
}
