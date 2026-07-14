import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { celebracionSlug, nombreInvitado, asistencia, mensaje } = await req.json()
  if (!celebracionSlug || !nombreInvitado || !asistencia) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient(supabaseUrl, serviceKey)

  const { data: cel } = await admin.from('celebraciones').select('nombre, slug, organizador_id').eq('slug', celebracionSlug).single()
  if (!cel?.organizador_id) return NextResponse.json({ success: true })

  const { data: { user: organizador } } = await admin.auth.admin.getUserById(cel.organizador_id)
  if (!organizador?.email) return NextResponse.json({ success: true })

  const { data: perfilOrg } = await admin.from('perfiles').select('lang').eq('user_id', cel.organizador_id).single()
  const lang: 'es' | 'en' = perfilOrg?.lang === 'en' ? 'en' : 'es'

  const asistenciaLabel = lang === 'en'
    ? (asistencia === 'si' ? "is going" : asistencia === 'no' ? "can't go" : 'might go')
    : (asistencia === 'si' ? 'sí va' : asistencia === 'no' ? 'no puede ir' : 'tal vez va')

  const subject = lang === 'en'
    ? `${nombreInvitado} responded: ${asistenciaLabel} to "${cel.nombre}"`
    : `${nombreInvitado} confirmó: ${asistenciaLabel} a "${cel.nombre}"`

  const html = lang === 'en'
    ? `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="https://joincheers.app" style="display: inline-block; text-decoration: none; background: linear-gradient(135deg,#534AB7,#D4537E); padding: 10px 22px; border-radius: 12px;">
            <span style="color: #fff; font-size: 16px; font-weight: 800;">Cheers</span>
          </a>
        </div>
        <p style="font-size: 16px; color: #1c1830;"><strong>${nombreInvitado}</strong> ${asistenciaLabel} to <strong>${cel.nombre}</strong>.</p>
        ${mensaje ? `<p style="font-size: 14px; color: #6b6585; font-style: italic;">"${mensaje}"</p>` : ''}
        <p style="margin-top: 20px;">
          <a href="https://joincheers.app/${cel.slug}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">View event →</a>
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
        <p style="font-size: 16px; color: #1c1830;"><strong>${nombreInvitado}</strong> ${asistenciaLabel} a <strong>${cel.nombre}</strong>.</p>
        ${mensaje ? `<p style="font-size: 14px; color: #6b6585; font-style: italic;">"${mensaje}"</p>` : ''}
        <p style="margin-top: 20px;">
          <a href="https://joincheers.app/${cel.slug}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver evento →</a>
        </p>
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #a39ec0; line-height: 1.6; text-align: center;">
          <p style="margin: 0 0 6px;">Cheers · <a href="https://joincheers.app/terminos" style="color: #a39ec0;">Términos</a> · <a href="https://joincheers.app/privacidad" style="color: #a39ec0;">Privacidad</a> · <a href="https://joincheers.app/faq" style="color: #a39ec0;">FAQ</a></p>
          <p style="margin: 0;">¿Ya no quieres tu cuenta? Puedes darla de baja desde <a href="https://joincheers.app/perfil" style="color: #a39ec0;">tu perfil</a>.</p>
        </div>
      </div>
    `

  try {
    await resend.emails.send({ from: 'Cheers <notificaciones@joincheers.app>', to: organizador.email, subject, html })
  } catch (e) {
    console.error('Error enviando email de notificación RSVP:', e)
  }

  return NextResponse.json({ success: true })
}
