import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { envolverEmail } from '../../emailTemplate'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { email, nombre, username, lang } = await req.json()
  if (!email || !username) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

  const idioma: 'es' | 'en' = lang === 'en' ? 'en' : 'es'

  try {
    const subject = idioma === 'en' ? `Welcome to Cheers${nombre ? `, ${nombre}` : ''}!` : `¡Bienvenid@ a Cheers${nombre ? `, ${nombre}` : ''}!`
    const cuerpo = idioma === 'en'
      ? `
          <p style="font-size: 16px; color: #1c1830;">Your account is ready, <strong>@${username}</strong>.</p>
          <p style="font-size: 15px; color: #6b6585; line-height: 1.6;">
            Now you can create your first celebration and share it with a single link — no group chats, no mess.
          </p>
          <p style="margin-top: 24px;">
            <a href="https://joincheers.app/${username}/nueva" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: 700;">Create my first celebration →</a>
          </p>
          <p style="font-size: 12px; color: #a39ec0; margin-top: 20px;">By the way, if a celebration ever grows bigger than usual, Super Cheer and Extra Cheer are there when you need them — no rush.</p>
      `
      : `
          <p style="font-size: 16px; color: #1c1830;">Ya tienes tu cuenta lista, <strong>@${username}</strong>.</p>
          <p style="font-size: 15px; color: #6b6585; line-height: 1.6;">
            Ahora puedes crear tu primera celebración y compartirla con un solo link — sin grupos de chat, sin líos.
          </p>
          <p style="margin-top: 24px;">
            <a href="https://joincheers.app/${username}/nueva" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: 700;">Crear mi primera celebración →</a>
          </p>
          <p style="font-size: 12px; color: #a39ec0; margin-top: 20px;">Ah, y si en algún momento tu celebración crece más de lo normal, ahí tienes Super Cheer y Extra Cheer — sin prisa, cuando lo necesites.</p>
      `
    const html = envolverEmail(idioma, cuerpo)

    await resend.emails.send({
      from: 'Cheers <notificaciones@joincheers.app>',
      to: email,
      subject,
      html,
    })
  } catch (e) {
    console.error('Error enviando email de bienvenida:', e)
  }

  return NextResponse.json({ success: true })
}
