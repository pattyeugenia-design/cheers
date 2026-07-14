import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function formatICSDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function construirICS(nombre: string, fecha: string, hora: string | undefined, lugar: string | undefined) {
  const inicio = new Date(`${fecha}T${hora || '12:00'}:00`)
  const fin = new Date(inicio.getTime() + 3 * 60 * 60 * 1000) // 3 horas por default
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSDate(inicio)}`,
    `DTEND:${formatICSDate(fin)}`,
    `SUMMARY:${nombre}`,
    `LOCATION:${lugar || ''}`,
    'DESCRIPTION:Organizado con Cheers',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
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

  // Traemos todo lo que pase en los próximos 60 días, y filtramos
  // según el número de días de recordatorio que cada evento tenga configurado
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const enSesentaDias = new Date(hoy)
  enSesentaDias.setDate(enSesentaDias.getDate() + 60)

  const { data: proximas } = await admin
    .from('celebraciones')
    .select('nombre, slug, organizador_id, fecha, recordatorio_dias, plan, paradas')
    .gte('fecha', hoy.toISOString())
    .lte('fecha', enSesentaDias.toISOString())
    .eq('archivada', false)

  const celebraciones = (proximas || []).filter(cel => {
    if (!cel.fecha) return false
    const diasConfigurados: number[] = Array.isArray(cel.recordatorio_dias) ? cel.recordatorio_dias : [7]
    const fechaEvento = new Date(cel.fecha)
    fechaEvento.setHours(0, 0, 0, 0)
    const diffDias = Math.round((fechaEvento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    return diasConfigurados.includes(diffDias)
  })

  let enviados = 0

  for (const cel of celebraciones || []) {
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
      const fechaEvento = new Date(cel.fecha)
      fechaEvento.setHours(0, 0, 0, 0)
      const diasConfigurados = Math.round((fechaEvento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

      const primerParada = (cel.paradas || []).find((p: any) => p?.id)
      const icsContent = construirICS(cel.nombre || 'Cheers', cel.fecha, primerParada?.hora, primerParada?.lugar)

      const lineaLimite = !eventoEsPro && totalConfirmados >= 3
        ? (lang === 'en'
            ? `<p style="font-size: 13px; color: #7a7494;">Expecting more than 3 guests? Super Cheer fits up to 10 for this celebration.</p>`
            : `<p style="font-size: 13px; color: #7a7494;">Si esperas más de 3 invitados, con Super Cheer caben hasta 10 en esta celebración.</p>`)
        : ''

      const subject = lang === 'en'
        ? `${diasConfigurados} day${diasConfigurados === 1 ? '' : 's'} left until "${cel.nombre}"`
        : `Faltan ${diasConfigurados} día${diasConfigurados === 1 ? '' : 's'} para "${cel.nombre}"`

      const html = lang === 'en'
        ? `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="https://joincheers.app" style="display: inline-block; text-decoration: none; background: linear-gradient(135deg,#534AB7,#D4537E); padding: 10px 22px; border-radius: 12px;">
                <span style="color: #fff; font-size: 16px; font-weight: 800;">Cheers</span>
              </a>
            </div>
            <p style="font-size: 16px; color: #1c1830;">Your celebration <strong>${cel.nombre}</strong> is in ${diasConfigurados} day${diasConfigurados === 1 ? '' : 's'}.</p>
            <p style="font-size: 15px; color: #6b6585;">So far, <strong>${totalConfirmados}</strong> ${totalConfirmados === 1 ? 'person has' : 'people have'} confirmed they're going.</p>
            ${lineaLimite}
            <p style="margin-top: 20px;">
              <a href="https://joincheers.app/${cel.slug}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">View event →</a>
            </p>
            <p style="font-size: 12px; color: #a39ec0; margin-top: 16px;">Attached: an .ics file to add it to your personal calendar.</p>
            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #a39ec0; line-height: 1.6; text-align: center;">
              <p style="margin: 0 0 6px;">Cheers · <a href="https://joincheers.app/terminos" style="color: #a39ec0;">Terms</a> · <a href="https://joincheers.app/privacidad" style="color: #a39ec0;">Privacy</a> · <a href="https://joincheers.app/faq" style="color: #a39ec0;">FAQ</a></p>
              <p style="margin: 0;">Don't want your account anymore? You can delete it from <a href="https://joincheers.app/perfil" style="color: #a39ec0;">your profile</a>.</p>
            </div>
          </div>
        `
        : `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="https://joincheers.app" style="display: inline-block; text-decoration: none; background: linear-gradient(135deg,#534AB7,#D4537E); padding: 10px 22px; border-radius: 12px;">
                <span style="color: #fff; font-size: 16px; font-weight: 800;">Cheers</span>
              </a>
            </div>
            <p style="font-size: 16px; color: #1c1830;">Tu celebración <strong>${cel.nombre}</strong> es en ${diasConfigurados} día${diasConfigurados === 1 ? '' : 's'}.</p>
            <p style="font-size: 15px; color: #6b6585;">Hasta ahora, <strong>${totalConfirmados}</strong> persona${totalConfirmados === 1 ? '' : 's'} ha${totalConfirmados === 1 ? '' : 'n'} confirmado que va${totalConfirmados === 1 ? '' : 'n'}.</p>
            ${lineaLimite}
            <p style="margin-top: 20px;">
              <a href="https://joincheers.app/${cel.slug}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver evento →</a>
            </p>
            <p style="font-size: 12px; color: #a39ec0; margin-top: 16px;">Adjunto va un archivo .ics para agregarlo a tu calendario personal.</p>
            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #a39ec0; line-height: 1.6; text-align: center;">
              <p style="margin: 0 0 6px;">Cheers · <a href="https://joincheers.app/terminos" style="color: #a39ec0;">Términos</a> · <a href="https://joincheers.app/privacidad" style="color: #a39ec0;">Privacidad</a> · <a href="https://joincheers.app/faq" style="color: #a39ec0;">FAQ</a></p>
              <p style="margin: 0;">¿Ya no quieres tu cuenta? Puedes darla de baja desde <a href="https://joincheers.app/perfil" style="color: #a39ec0;">tu perfil</a>.</p>
            </div>
          </div>
        `

      await resend.emails.send({
        from: 'Cheers <notificaciones@joincheers.app>',
        to: organizador.email,
        subject,
        html,
        attachments: [
          {
            filename: `${(cel.slug || 'evento').replace('/', '-')}.ics`,
            content: Buffer.from(icsContent).toString('base64'),
          },
        ],
      })
      enviados++
    } catch (e) {
      console.error('Error enviando recordatorio para', cel.slug, e)
    }
  }

  return NextResponse.json({ success: true, enviados, revisados: celebraciones?.length ?? 0 })
}
