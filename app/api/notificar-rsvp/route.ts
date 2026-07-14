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

  const asistenciaLabel = asistencia === 'si' ? 'sí va' : asistencia === 'no' ? 'no puede ir' : 'tal vez va'

  try {
    await resend.emails.send({
      from: 'Cheers <notificaciones@joincheers.app>',
      to: organizador.email,
      subject: `${nombreInvitado} confirmó: ${asistenciaLabel} a "${cel.nombre}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <p style="font-size: 16px; color: #1c1830;"><strong>${nombreInvitado}</strong> ${asistenciaLabel} a <strong>${cel.nombre}</strong>.</p>
          ${mensaje ? `<p style="font-size: 14px; color: #6b6585; font-style: italic;">"${mensaje}"</p>` : ''}
          <p style="margin-top: 20px;">
            <a href="https://joincheers.app/${cel.slug}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver evento →</a>
          </p>
        </div>
      `,
    })
  } catch (e) {
    console.error('Error enviando email de notificación RSVP:', e)
  }

  return NextResponse.json({ success: true })
}
