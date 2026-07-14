import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const DESTINO = 'patty.eugenia@gmail.com'
const FROM = 'Cheers <notificaciones@joincheers.app>'

// Ruta TEMPORAL solo para previsualizar los 5 correos del journey en español.
// Protegida con el mismo CRON_SECRET que ya usamos para los crons.
// Borrar este archivo cuando Patty confirme que ya los vio todos.

function construirICSEjemplo() {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    'DTSTART:20260720T190000Z',
    'DTEND:20260720T220000Z',
    'SUMMARY:Cumpleaños de Ana',
    'LOCATION:Casa de Ana',
    'DESCRIPTION:Organizado con Cheers',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== process.env.PREVIEW_EMAILS_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const resultados: Record<string, string> = {}

  // 1. Bienvenida
  try {
    await resend.emails.send({
      from: FROM,
      to: DESTINO,
      subject: '¡Bienvenid@ a Cheers, Patty!',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="https://joincheers.app" style="display: inline-block; text-decoration: none; background: linear-gradient(135deg,#534AB7,#D4537E); padding: 10px 22px; border-radius: 12px;">
              <span style="color: #fff; font-size: 16px; font-weight: 800;">Cheers</span>
            </a>
          </div>
          <p style="font-size: 16px; color: #1c1830;">Ya tienes tu cuenta lista, <strong>@patty</strong>.</p>
          <p style="font-size: 15px; color: #6b6585; line-height: 1.6;">
            Ahora puedes crear tu primera celebración y compartirla con un solo link — sin grupos de chat, sin líos.
          </p>
          <p style="margin-top: 24px;">
            <a href="https://joincheers.app/nueva" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: 700;">Crear mi primera celebración →</a>
          </p>
          <p style="font-size: 12px; color: #a39ec0; margin-top: 20px;">Ah, y si en algún momento tu celebración crece más de lo normal, ahí tienes Pro y Lifetime — sin prisa, cuando lo necesites.</p>
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #a39ec0; line-height: 1.6; text-align: center;">
            <p style="margin: 0 0 6px;">Cheers · <a href="https://joincheers.app/terminos" style="color: #a39ec0;">Términos</a> · <a href="https://joincheers.app/privacidad" style="color: #a39ec0;">Privacidad</a> · <a href="https://joincheers.app/faq" style="color: #a39ec0;">FAQ</a></p>
            <p style="margin: 0;">¿Ya no quieres tu cuenta? Puedes darla de baja desde <a href="https://joincheers.app/perfil" style="color: #a39ec0;">tu perfil</a>.</p>
          </div>
        </div>
      `,
    })
    resultados['1_bienvenida'] = 'enviado'
  } catch (e: any) {
    resultados['1_bienvenida'] = `error: ${e?.message || e}`
  }

  // 2. Notificación de RSVP
  try {
    await resend.emails.send({
      from: FROM,
      to: DESTINO,
      subject: 'Mario confirmó: sí va a "Cumpleaños de Ana"',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="https://joincheers.app" style="display: inline-block; text-decoration: none; background: linear-gradient(135deg,#534AB7,#D4537E); padding: 10px 22px; border-radius: 12px;">
              <span style="color: #fff; font-size: 16px; font-weight: 800;">Cheers</span>
            </a>
          </div>
          <p style="font-size: 16px; color: #1c1830;"><strong>Mario</strong> sí va a <strong>Cumpleaños de Ana</strong>.</p>
          <p style="font-size: 14px; color: #6b6585; font-style: italic;">"¡Ahí estaré sin falta!"</p>
          <p style="margin-top: 20px;">
            <a href="https://joincheers.app/patty/cumpleanos-de-ana" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver evento →</a>
          </p>
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #a39ec0; line-height: 1.6; text-align: center;">
            <p style="margin: 0 0 6px;">Cheers · <a href="https://joincheers.app/terminos" style="color: #a39ec0;">Términos</a> · <a href="https://joincheers.app/privacidad" style="color: #a39ec0;">Privacidad</a> · <a href="https://joincheers.app/faq" style="color: #a39ec0;">FAQ</a></p>
            <p style="margin: 0;">¿Ya no quieres tu cuenta? Puedes darla de baja desde <a href="https://joincheers.app/perfil" style="color: #a39ec0;">tu perfil</a>.</p>
          </div>
        </div>
      `,
    })
    resultados['2_notificar_rsvp'] = 'enviado'
  } catch (e: any) {
    resultados['2_notificar_rsvp'] = `error: ${e?.message || e}`
  }

  // 3. Recordatorio 7 días (con ICS adjunto)
  try {
    await resend.emails.send({
      from: FROM,
      to: DESTINO,
      subject: 'Faltan 7 días para "Cumpleaños de Ana"',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="https://joincheers.app" style="display: inline-block; text-decoration: none; background: linear-gradient(135deg,#534AB7,#D4537E); padding: 10px 22px; border-radius: 12px;">
              <span style="color: #fff; font-size: 16px; font-weight: 800;">Cheers</span>
            </a>
          </div>
          <p style="font-size: 16px; color: #1c1830;">Tu celebración <strong>Cumpleaños de Ana</strong> es en 7 días.</p>
          <p style="font-size: 15px; color: #6b6585;">Hasta ahora, <strong>4</strong> personas han confirmado que van.</p>
          <p style="font-size: 13px; color: #7a7494;">Si esperas más de 3 invitados, con Pro caben hasta 10 en esta celebración.</p>
          <p style="margin-top: 20px;">
            <a href="https://joincheers.app/patty/cumpleanos-de-ana" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver evento →</a>
          </p>
          <p style="font-size: 12px; color: #a39ec0; margin-top: 16px;">Adjunto va un archivo .ics para agregarlo a tu calendario personal.</p>
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #a39ec0; line-height: 1.6; text-align: center;">
            <p style="margin: 0 0 6px;">Cheers · <a href="https://joincheers.app/terminos" style="color: #a39ec0;">Términos</a> · <a href="https://joincheers.app/privacidad" style="color: #a39ec0;">Privacidad</a> · <a href="https://joincheers.app/faq" style="color: #a39ec0;">FAQ</a></p>
            <p style="margin: 0;">¿Ya no quieres tu cuenta? Puedes darla de baja desde <a href="https://joincheers.app/perfil" style="color: #a39ec0;">tu perfil</a>.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: 'cumpleanos-de-ana.ics',
          content: Buffer.from(construirICSEjemplo()).toString('base64'),
        },
      ],
    })
    resultados['3_recordatorio'] = 'enviado'
  } catch (e: any) {
    resultados['3_recordatorio'] = `error: ${e?.message || e}`
  }

  // 4. Checkout abandonado
  try {
    await resend.emails.send({
      from: FROM,
      to: DESTINO,
      subject: '¿Se te fue la conexión? Tu upgrade sigue esperando',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="https://joincheers.app" style="display: inline-block; text-decoration: none; background: linear-gradient(135deg,#534AB7,#D4537E); padding: 10px 22px; border-radius: 12px;">
              <span style="color: #fff; font-size: 16px; font-weight: 800;">Cheers</span>
            </a>
          </div>
          <p style="font-size: 16px; color: #1c1830;">Vimos que empezaste a mejorar tu plan en Cheers pero no se completó — a veces pasa.</p>
          <p style="font-size: 15px; color: #6b6585;">Si quieres, aquí retomas donde lo dejaste, sin prisa.</p>
          <p style="margin-top: 20px;">
            <a href="https://joincheers.app/patty/cumpleanos-de-ana" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Continuar →</a>
          </p>
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #a39ec0; line-height: 1.6; text-align: center;">
            <p style="margin: 0 0 6px;">Cheers · <a href="https://joincheers.app/terminos" style="color: #a39ec0;">Términos</a> · <a href="https://joincheers.app/privacidad" style="color: #a39ec0;">Privacidad</a> · <a href="https://joincheers.app/faq" style="color: #a39ec0;">FAQ</a></p>
            <p style="margin: 0;">¿Ya no quieres tu cuenta? Puedes darla de baja desde <a href="https://joincheers.app/perfil" style="color: #a39ec0;">tu perfil</a>.</p>
          </div>
        </div>
      `,
    })
    resultados['4_checkout_abandonado'] = 'enviado'
  } catch (e: any) {
    resultados['4_checkout_abandonado'] = `error: ${e?.message || e}`
  }

  // 5. Post-evento (con feedback ligero)
  try {
    await resend.emails.send({
      from: FROM,
      to: DESTINO,
      subject: '¿Cómo estuvo Cumpleaños de Ana?',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="https://joincheers.app" style="display: inline-block; text-decoration: none; background: linear-gradient(135deg,#534AB7,#D4537E); padding: 10px 22px; border-radius: 12px;">
              <span style="color: #fff; font-size: 16px; font-weight: 800;">Cheers</span>
            </a>
          </div>
          <p style="font-size: 16px; color: #1c1830;">Esperamos que Cumpleaños de Ana haya salido increíble.</p>
          <p style="font-size: 15px; color: #6b6585;">Si quieres contarnos cómo te fue, con gusto lo leemos — solo responde este correo.</p>
          <p style="font-size: 14px; color: #6b6585;">Y si ya estás pensando en la próxima celebración: con Lifetime guardas todo tu historial para siempre y ya no te preocupas por límites. Sin presión, ahí queda.</p>
          <p style="margin-top: 20px;">
            <a href="https://joincheers.app/perfil" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver mi perfil →</a>
          </p>
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #a39ec0; line-height: 1.6; text-align: center;">
            <p style="margin: 0 0 6px;">Cheers · <a href="https://joincheers.app/terminos" style="color: #a39ec0;">Términos</a> · <a href="https://joincheers.app/privacidad" style="color: #a39ec0;">Privacidad</a> · <a href="https://joincheers.app/faq" style="color: #a39ec0;">FAQ</a></p>
            <p style="margin: 0;">¿Ya no quieres tu cuenta? Puedes darla de baja desde <a href="https://joincheers.app/perfil" style="color: #a39ec0;">tu perfil</a>.</p>
          </div>
        </div>
      `,
    })
    resultados['5_post_evento'] = 'enviado'
  } catch (e: any) {
    resultados['5_post_evento'] = `error: ${e?.message || e}`
  }

  return NextResponse.json({ resultados })
}
