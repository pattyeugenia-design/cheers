import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { envolverEmail, trackedLink } from '../../../emailTemplate'

const resend = new Resend(process.env.RESEND_API_KEY)

function formatICSDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

const DIAS_ICS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

// Para series recurrentes, arma la línea RRULE que le dice al calendario del
// invitado/organizador cómo se repite el evento, en vez de mandar solo la fecha suelta.
function construirRRULE(tipo: 'semanal' | 'mensual_nesimo', diaSemana: number, semanaMes?: number | null): string | null {
  if (diaSemana == null || diaSemana < 0 || diaSemana > 6) return null
  const dia = DIAS_ICS[diaSemana]
  if (tipo === 'semanal') return `RRULE:FREQ=WEEKLY;BYDAY=${dia}`
  if (tipo === 'mensual_nesimo' && semanaMes) return `RRULE:FREQ=MONTHLY;BYDAY=${semanaMes}${dia}`
  return null
}

function construirICS(
  nombre: string,
  fecha: string,
  hora: string | undefined,
  lugar: string | undefined,
  recurrencia?: { tipo: 'semanal' | 'mensual_nesimo'; diaSemana: number; semanaMes?: number | null } | null
) {
  const inicio = new Date(`${fecha}T${hora || '12:00'}:00`)
  const fin = new Date(inicio.getTime() + 3 * 60 * 60 * 1000) // 3 horas por default
  const rrule = recurrencia ? construirRRULE(recurrencia.tipo, recurrencia.diaSemana, recurrencia.semanaMes) : null
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSDate(inicio)}`,
    `DTEND:${formatICSDate(fin)}`,
    `SUMMARY:${nombre}`,
    `LOCATION:${lugar || ''}`,
    'DESCRIPTION:Organizado con Cheers',
  ]
  if (rrule) lineas.push(rrule)
  lineas.push('END:VEVENT', 'END:VCALENDAR')
  return lineas.join('\r\n')
}

type Candidata = {
  slug: string
  nombre: string
  organizador_id: string
  plan: string | null
  recordatorio_dias: number[] | null
  fechaEvento: string
  lugar?: string | null
  hora?: string | null
  paradas?: any[]
  recurrencia?: { tipo: 'semanal' | 'mensual_nesimo'; diaSemana: number; semanaMes?: number | null } | null
}

export async function GET(req: Request) {
  // Verificar que la llamada viene de Vercel Cron, no de cualquiera
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient(supabaseUrl, serviceKey)

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const enSesentaDias = new Date(hoy)
  enSesentaDias.setDate(enSesentaDias.getDate() + 60)
  const hoyStr = hoy.toISOString().slice(0, 10)
  const enSesentaDiasStr = enSesentaDias.toISOString().slice(0, 10)

  // 1. Celebraciones normales (no recurrentes): su propia fecha es la ocurrencia real
  const { data: normales } = await admin
    .from('celebraciones')
    .select('nombre, slug, organizador_id, fecha, recordatorio_dias, plan, paradas')
    .gte('fecha', hoy.toISOString())
    .lte('fecha', enSesentaDias.toISOString())
    .eq('archivada', false)
    .eq('recurrente', false)

  const candidatas: Candidata[] = (normales || [])
    .filter(cel => !!cel.fecha)
    .map(cel => ({
      slug: cel.slug, nombre: cel.nombre, organizador_id: cel.organizador_id, plan: cel.plan,
      recordatorio_dias: cel.recordatorio_dias, fechaEvento: cel.fecha, paradas: cel.paradas,
    }))

  // 2. Celebraciones recurrentes: las fechas reales viven en "ocurrencias", no en celebraciones.fecha
  const { data: series } = await admin
    .from('celebraciones')
    .select('nombre, slug, organizador_id, recordatorio_dias, plan, paradas, recurrencia_tipo, recurrencia_dia_semana, recurrencia_semana_mes')
    .eq('recurrente', true)
    .eq('archivada', false)

  for (const serie of series || []) {
    const { data: ocurrencias } = await admin
      .from('ocurrencias')
      .select('fecha, hora, lugar')
      .eq('celebracion_slug', serie.slug)
      .eq('cancelada', false)
      .gte('fecha', hoyStr)
      .lte('fecha', enSesentaDiasStr)

    const recurrencia = serie.recurrencia_tipo
      ? { tipo: serie.recurrencia_tipo as 'semanal' | 'mensual_nesimo', diaSemana: serie.recurrencia_dia_semana, semanaMes: serie.recurrencia_semana_mes }
      : null

    for (const oc of ocurrencias || []) {
      candidatas.push({
        slug: serie.slug, nombre: serie.nombre, organizador_id: serie.organizador_id, plan: serie.plan,
        recurrencia,
        recordatorio_dias: serie.recordatorio_dias, fechaEvento: oc.fecha, lugar: oc.lugar, hora: oc.hora,
        paradas: serie.paradas,
      })
    }
  }

  const candidatasHoy = candidatas.filter(c => {
    const diasConfigurados: number[] = Array.isArray(c.recordatorio_dias) ? c.recordatorio_dias : [7]
    const fechaEvento = new Date(c.fechaEvento)
    fechaEvento.setHours(0, 0, 0, 0)
    const diffDias = Math.round((fechaEvento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    return diasConfigurados.includes(diffDias)
  })

  let enviados = 0

  for (const cel of candidatasHoy) {
    if (!cel.organizador_id) continue

    const { count } = await admin
      .from('rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('celebracion_slug', cel.slug)
      .eq('asistencia', 'si')

    const { data: { user: organizador } } = await admin.auth.admin.getUserById(cel.organizador_id)
    if (!organizador?.email) continue

    const { data: perfilOrg } = await admin.from('perfiles').select('plan, lang').eq('user_id', cel.organizador_id).single()
    const lang: 'es' | 'en' = perfilOrg?.lang === 'en' ? 'en' : 'es'
    const cuentaEsLifetime = perfilOrg?.plan === 'lifetime'
    const eventoEsPro = cuentaEsLifetime || perfilOrg?.plan === 'pro' || cel.plan === 'pro'
    const totalConfirmados = count ?? 0

    try {
      const fechaEvento = new Date(cel.fechaEvento)
      fechaEvento.setHours(0, 0, 0, 0)
      const diasConfigurados = Math.round((fechaEvento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

      const primerParada = (cel.paradas || []).find((p: any) => p?.id)
      const icsContent = construirICS(
        cel.nombre || 'Cheers',
        cel.fechaEvento,
        cel.hora || primerParada?.hora,
        cel.lugar || primerParada?.lugar,
        cel.recurrencia
      )

      const lineaLimite = !eventoEsPro && totalConfirmados >= 3
        ? (lang === 'en'
            ? `<p style="font-size: 13px; color: #7a7494;">Expecting more than 3 guests? Super Cheer fits up to 10 for this celebration.</p>`
            : `<p style="font-size: 13px; color: #7a7494;">Si esperas más de 3 invitados, con Super Cheer caben hasta 10 en esta celebración.</p>`)
        : ''

      const subject = lang === 'en'
        ? `${diasConfigurados} day${diasConfigurados === 1 ? '' : 's'} left until "${cel.nombre}"`
        : `Faltan ${diasConfigurados} día${diasConfigurados === 1 ? '' : 's'} para "${cel.nombre}"`

      const cuerpo = lang === 'en'
        ? `
            <p style="font-size: 16px; color: #1c1830;">Your celebration <strong>${cel.nombre}</strong> is in ${diasConfigurados} day${diasConfigurados === 1 ? '' : 's'}.</p>
            <p style="font-size: 15px; color: #6b6585;">So far, <strong>${totalConfirmados}</strong> ${totalConfirmados === 1 ? 'person has' : 'people have'} confirmed they're going.</p>
            ${lineaLimite}
            <p style="margin-top: 20px;">
              <a href="${trackedLink(`https://joincheers.app/${cel.slug}`, 'recordatorio')}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">View event →</a>
            </p>
            <p style="font-size: 12px; color: #a39ec0; margin-top: 16px;">Attached: an .ics file to add it to your personal calendar.</p>
        `
        : `
            <p style="font-size: 16px; color: #1c1830;">Tu celebración <strong>${cel.nombre}</strong> es en ${diasConfigurados} día${diasConfigurados === 1 ? '' : 's'}.</p>
            <p style="font-size: 15px; color: #6b6585;">Hasta ahora, <strong>${totalConfirmados}</strong> persona${totalConfirmados === 1 ? '' : 's'} ha${totalConfirmados === 1 ? '' : 'n'} confirmado que va${totalConfirmados === 1 ? '' : 'n'}.</p>
            ${lineaLimite}
            <p style="margin-top: 20px;">
              <a href="${trackedLink(`https://joincheers.app/${cel.slug}`, 'recordatorio')}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver evento →</a>
            </p>
            <p style="font-size: 12px; color: #a39ec0; margin-top: 16px;">Adjunto va un archivo .ics para agregarlo a tu calendario personal.</p>
        `
      const html = envolverEmail(lang, cuerpo)

      await resend.emails.send({
        from: 'Cheers <notificaciones@joincheers.app>',
        to: organizador.email,
        subject,
        html,
        attachments: [
          {
            filename: `${(cel.slug || 'evento').replace('/', '-')}-${cel.fechaEvento}.ics`,
            content: Buffer.from(icsContent).toString('base64'),
          },
        ],
      })
      enviados++
    } catch (e) {
      console.error('Error enviando recordatorio para', cel.slug, e)
    }
  }

  return NextResponse.json({ success: true, enviados, revisados: candidatasHoy.length })
}
