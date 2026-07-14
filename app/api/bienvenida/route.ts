import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { email, nombre, username } = await req.json()
  if (!email || !username) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

  try {
    await resend.emails.send({
      from: 'Cheers <notificaciones@joincheers.app>',
      to: email,
      subject: `¡Bienvenid@ a Cheers${nombre ? `, ${nombre}` : ''}!`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <p style="font-size: 20px; font-weight: 800; color: #1c1830;">🥂 ¡Cheers!</p>
          <p style="font-size: 16px; color: #1c1830;">Ya tienes tu cuenta lista, <strong>@${username}</strong>.</p>
          <p style="font-size: 15px; color: #6b6585; line-height: 1.6;">
            Ahora puedes crear tu primera celebración y compartirla con un solo link — sin grupos de chat, sin líos.
          </p>
          <p style="margin-top: 24px;">
            <a href="https://joincheers.app/nueva" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: 700;">Crear mi primera celebración →</a>
          </p>
        </div>
      `,
    })
  } catch (e) {
    console.error('Error enviando email de bienvenida:', e)
  }

  return NextResponse.json({ success: true })
}
