import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Falta firma' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient(supabaseUrl, serviceKey)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const tipo = session.metadata?.tipo
    const userId = session.metadata?.user_id
    const slug = session.metadata?.slug

    if (tipo === 'lifetime' && userId) {
      await admin.from('perfiles').update({ plan: 'lifetime' }).eq('user_id', userId)
    } else if (tipo === 'pro' && slug && userId) {
      // Doble chequeo: solo activar Pro si el evento sigue siendo de quien pagó
      await admin.from('celebraciones').update({ plan: 'pro' }).eq('slug', slug).eq('organizador_id', userId)
    }
  }

  if (event.type === 'checkout.session.expired') {
    // Alguien empezó a pagar Pro/Lifetime y no terminó — recordatorio suave, sin presión
    const session = event.data.object as Stripe.Checkout.Session
    const tipo = session.metadata?.tipo
    const userId = session.metadata?.user_id
    const slug = session.metadata?.slug
    const email = session.customer_email

    if (email && userId) {
      const { data: perfil } = await admin.from('perfiles').select('lang').eq('user_id', userId).single()
      const lang: 'es' | 'en' = perfil?.lang === 'en' ? 'en' : 'es'
      const ruta = tipo === 'pro' && slug ? `/${slug}` : '/perfil'

      const subject = lang === 'en' ? 'Connection hiccup? Your upgrade is still waiting' : '¿Se te fue la conexión? Tu upgrade sigue esperando'
      const html = lang === 'en'
        ? `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="https://joincheers.app" style="display: inline-block; text-decoration: none; background: linear-gradient(135deg,#534AB7,#D4537E); padding: 10px 22px; border-radius: 12px;">
                <span style="color: #fff; font-size: 16px; font-weight: 800;">Cheers</span>
              </a>
            </div>
            <p style="font-size: 16px; color: #1c1830;">Looks like you started upgrading your Cheers plan but it didn't go through — happens sometimes.</p>
            <p style="font-size: 15px; color: #6b6585;">Whenever you're ready, you can pick up right where you left off.</p>
            <p style="margin-top: 20px;">
              <a href="https://joincheers.app${ruta}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Continue →</a>
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
            <p style="font-size: 16px; color: #1c1830;">Vimos que empezaste a mejorar tu plan en Cheers pero no se completó — a veces pasa.</p>
            <p style="font-size: 15px; color: #6b6585;">Si quieres, aquí retomas donde lo dejaste, sin prisa.</p>
            <p style="margin-top: 20px;">
              <a href="https://joincheers.app${ruta}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Continuar →</a>
            </p>
            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #a39ec0; line-height: 1.6; text-align: center;">
              <p style="margin: 0 0 6px;">Cheers · <a href="https://joincheers.app/terminos" style="color: #a39ec0;">Términos</a> · <a href="https://joincheers.app/privacidad" style="color: #a39ec0;">Privacidad</a> · <a href="https://joincheers.app/faq" style="color: #a39ec0;">FAQ</a></p>
              <p style="margin: 0;">¿Ya no quieres tu cuenta? Puedes darla de baja desde <a href="https://joincheers.app/perfil" style="color: #a39ec0;">tu perfil</a>.</p>
            </div>
          </div>
        `

      try {
        await resend.emails.send({ from: 'Cheers <notificaciones@joincheers.app>', to: email, subject, html })
      } catch (e) {
        console.error('Error enviando email de checkout abandonado:', e)
      }
    }
  }

  return NextResponse.json({ received: true })
}
