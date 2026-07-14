import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { email, nombre, username, lang } = await req.json()
  if (!email || !username) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

  const idioma: 'es' | 'en' = lang === 'en' ? 'en' : 'es'

  try {
    const subject = idioma === 'en' ? `Welcome to Cheers${nombre ? `, ${nombre}` : ''}!` : `¡Bienvenid@ a Cheers${nombre ? `, ${nombre}` : ''}!`
    const html = idioma === 'en'
      ? `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="https://joincheers.app" style="display: inline-block; text-decoration: none; background: linear-gradient(135deg,#534AB7,#D4537E); padding: 10px 22px; border-radius: 12px;">
              <span style="color: #fff; font-size: 16px; font-weight: 800;">Cheers</span>
            </a>
          </div>
          <p style="font-size: 16px; color: #1c1830;">Your account is ready, <strong>@${username}</strong>.</p>
          <p style="font-size: 15px; color: #6b6585; line-height: 1.6;">
            Now you can create your first celebration and share it with a single link — no group chats, no mess.
          </p>
          <p style="margin-top: 24px;">
            <a href="https://joincheers.app/nueva" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: 700;">Create my first celebration →</a>
          </p>
          <p style="font-size: 12px; color: #a39ec0; margin-top: 20px;">By the way, if a celebration ever grows bigger than usual, Super Cheer and Extra Cheer are there when you need them — no rush.</p>
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
          <p style="font-size: 16px; color: #1c1830;">Ya tienes tu cuenta lista, <strong>@${username}</strong>.</p>
          <p style="font-size: 15px; color: #6b6585; line-height: 1.6;">
            Ahora puedes crear tu primera celebración y compartirla con un solo link — sin grupos de chat, sin líos.
          </p>
          <p style="margin-top: 24px;">
            <a href="https://joincheers.app/nueva" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: 700;">Crear mi primera celebración →</a>
          </p>
          <p style="font-size: 12px; color: #a39ec0; margin-top: 20px;">Ah, y si en algún momento tu celebración crece más de lo normal, ahí tienes Super Cheer y Extra Cheer — sin prisa, cuando lo necesites.</p>
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #a39ec0; line-height: 1.6; text-align: center;">
            <p style="margin: 0 0 6px;">Cheers · <a href="https://joincheers.app/terminos" style="color: #a39ec0;">Términos</a> · <a href="https://joincheers.app/privacidad" style="color: #a39ec0;">Privacidad</a> · <a href="https://joincheers.app/faq" style="color: #a39ec0;">FAQ</a></p>
            <p style="margin: 0;">¿Ya no quieres tu cuenta? Puedes darla de baja desde <a href="https://joincheers.app/perfil" style="color: #a39ec0;">tu perfil</a>.</p>
          </div>
        </div>
      `

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
