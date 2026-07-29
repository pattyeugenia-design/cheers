import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { envolverEmail, type Idioma } from '../../emailTemplate'

const ADMIN_EMAIL = 'patty.eugenia@gmail.com'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { accessToken, userIds, asunto, mensaje } = await req.json()
  if (!accessToken || !Array.isArray(userIds) || userIds.length === 0 || !mensaje?.trim()) {
    return NextResponse.json({ ok: false, error: 'datos_incompletos' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const authClient = createClient(supabaseUrl, anonKey)
  const { data: { user: caller }, error: callerError } = await authClient.auth.getUser(accessToken)
  if (callerError || !caller || caller.email !== ADMIN_EMAIL) {
    return NextResponse.json({ ok: false, error: 'no_autorizado' }, { status: 401 })
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const { data: listado, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) return NextResponse.json({ ok: false, error: 'error_buscando' }, { status: 500 })
  const { data: perfiles } = await admin.from('perfiles').select('user_id, lang').in('user_id', userIds)

  // El texto que escribe Patty se parte en párrafos (línea en blanco) y se
  // envuelve con el mismo banner/footer que ya usan los demás correos de Cheers.
  const parrafos = mensaje.trim().split(/\n\s*\n/).map((p: string) =>
    `<p style="font-size: 15px; color: #1c1830; line-height: 1.6; margin: 0 0 16px;">${p.replace(/\n/g, '<br>')}</p>`
  ).join('')

  let enviados = 0
  for (const uid of userIds) {
    const cuenta = listado.users.find(u => u.id === uid)
    if (!cuenta?.email) continue
    const lang: Idioma = perfiles?.find(p => p.user_id === uid)?.lang === 'en' ? 'en' : 'es'
    const html = envolverEmail(lang, parrafos)
    try {
      await resend.emails.send({
        from: 'Cheers <notificaciones@joincheers.app>',
        to: cuenta.email,
        subject: asunto?.trim() || (lang === 'en' ? 'A message from Cheers' : 'Un mensaje de Cheers'),
        html,
      })
      enviados++
    } catch {
      // seguimos con el resto aunque uno falle
    }
  }

  return NextResponse.json({ ok: true, enviados })
}
