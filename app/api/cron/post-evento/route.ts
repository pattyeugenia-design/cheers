import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

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

  const { data: pasadas } = await admin
    .from('celebraciones')
    .select('nombre, slug, organizador_id, fecha, festejado_nombre')
    .gte('fecha', ayerInicio.toISOString())
    .lte('fecha', ayerFin.toISOString())
    .eq('archivada', false)

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
    const html = lang === 'en'
      ? `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="https://joincheers.app" style="display: inline-block; text-decoration: none; background: linear-gradient(135deg,#534AB7,#D4537E); padding: 10px 22px; border-radius: 12px;">
              <span style="color: #fff; font-size: 16px; font-weight: 800;">Cheers</span>
            </a>
          </div>
          <p style="font-size: 16px; color: #1c1830;">Hope ${nombreEvento} turned out amazing.</p>
          <p style="font-size: 15px; color: #6b6585;">If you want to tell us how it went, just reply to this email — we'd love to hear it.</p>
          ${lineaLifetime}
          <p style="margin-top: 20px;">
            <a href="https://joincheers.app/perfil" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">See my profile →</a>
          </p>
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
          <p style="font-size: 16px; color: #1c1830;">Esperamos que ${nombreEvento} haya salido increíble.</p>
          <p style="font-size: 15px; color: #6b6585;">Si quieres contarnos cómo te fue, con gusto lo leemos — solo responde este correo.</p>
          ${lineaLifetime}
          <p style="margin-top: 20px;">
            <a href="https://joincheers.app/perfil" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver mi perfil →</a>
          </p>
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #a39ec0; line-height: 1.6; text-align: center;">
            <p style="margin: 0 0 6px;">Cheers · <a href="https://joincheers.app/terminos" style="color: #a39ec0;">Términos</a> · <a href="https://joincheers.app/privacidad" style="color: #a39ec0;">Privacidad</a> · <a href="https://joincheers.app/faq" style="color: #a39ec0;">FAQ</a></p>
            <p style="margin: 0;">¿Ya no quieres tu cuenta? Puedes darla de baja desde <a href="https://joincheers.app/perfil" style="color: #a39ec0;">tu perfil</a>.</p>
          </div>
        </div>
      `

    try {
      await resend.emails.send({ from: 'Cheers <notificaciones@joincheers.app>', to: organizador.email, subject, html })
      enviados++
    } catch (e) {
      console.error('Error enviando email post-evento para', cel.slug, e)
    }
  }

  return NextResponse.json({ success: true, enviados, revisados: pasadas?.length ?? 0 })
}
