import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient(supabaseUrl, serviceKey)

  const enSieteDias = new Date()
  enSieteDias.setDate(enSieteDias.getDate() + 7)
  const fechaObjetivo = enSieteDias.toISOString().split('T')[0]

  const { data: celebraciones } = await admin
    .from('celebraciones')
    .select('nombre, slug, organizador_id, fecha')
    .gte('fecha', `${fechaObjetivo}T00:00:00`)
    .lt('fecha', `${fechaObjetivo}T23:59:59`)
    .eq('archivada', false)

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

    try {
      await resend.emails.send({
        from: 'Cheers <notificaciones@joincheers.app>',
        to: organizador.email,
        subject: `Faltan 7 días para "${cel.nombre}" 🎉`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <p style="font-size: 16px; color: #1c1830;">Tu celebración <strong>${cel.nombre}</strong> es en una semana.</p>
            <p style="font-size: 15px; color: #6b6585;">Hasta ahora, <strong>${count ?? 0}</strong> persona${count === 1 ? '' : 's'} ha${count === 1 ? '' : 'n'} confirmado que va${count === 1 ? '' : 'n'}.</p>
            <p style="margin-top: 20px;">
              <a href="https://joincheers.app/${cel.slug}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver evento →</a>
            </p>
          </div>
        `,
      })
      enviados++
    } catch (e) {
      console.error('Error enviando recordatorio para', cel.slug, e)
    }
  }

  return NextResponse.json({ success: true, enviados, revisados: celebraciones?.length ?? 0 })
}
