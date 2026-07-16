import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { envolverEmail, trackedLink } from '../../../emailTemplate'

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
    const email = session.customer_email

    if (tipo === 'lifetime' && userId) {
      await admin.from('perfiles').update({ plan: 'lifetime' }).eq('user_id', userId)
    } else if (tipo === 'pro' && slug && userId) {
      // Doble chequeo: solo activar Pro si el evento sigue siendo de quien pagó
      await admin.from('celebraciones').update({ plan: 'pro' }).eq('slug', slug).eq('organizador_id', userId)
    }

    // Confirmación de compra — antes solo se avisaba cuando alguien NO terminaba
    // de pagar (checkout abandonado), pero a quien SÍ compra no le llegaba nada.
    if (email && userId && (tipo === 'lifetime' || tipo === 'pro')) {
      const { data: perfil } = await admin.from('perfiles').select('lang').eq('user_id', userId).single()
      const lang: 'es' | 'en' = perfil?.lang === 'en' ? 'en' : 'es'
      const ruta = tipo === 'pro' && slug ? `/${slug}` : '/perfil'
      const link = trackedLink(`https://joincheers.app${ruta}`, 'compra_confirmada')
      const nombrePlan = tipo === 'lifetime' ? 'Extra Cheer' : 'Super Cheer'

      const subject = lang === 'en' ? `You're now ${nombrePlan}` : `Ya eres ${nombrePlan}`
      const cuerpo = lang === 'en'
        ? `
            <p style="font-size: 16px; color: #1c1830;">Your payment went through — you're officially <strong>${nombrePlan}</strong>.</p>
            <p style="font-size: 15px; color: #6b6585;">${tipo === 'lifetime' ? 'Everything is unlocked, forever, across all your celebrations.' : 'This celebration now has everything unlocked.'}</p>
            <p style="margin-top: 20px;">
              <a href="${link}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">${tipo === 'lifetime' ? 'Go to my profile →' : 'Go to my celebration →'}</a>
            </p>
        `
        : `
            <p style="font-size: 16px; color: #1c1830;">Tu pago se procesó — ya eres <strong>${nombrePlan}</strong>.</p>
            <p style="font-size: 15px; color: #6b6585;">${tipo === 'lifetime' ? 'Todo queda desbloqueado, para siempre, en todas tus celebraciones.' : 'Esta celebración ya tiene todo desbloqueado.'}</p>
            <p style="margin-top: 20px;">
              <a href="${link}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">${tipo === 'lifetime' ? 'Ir a mi perfil →' : 'Ir a mi celebración →'}</a>
            </p>
        `
      const html = envolverEmail(lang, cuerpo)

      try {
        await resend.emails.send({ from: 'Cheers <notificaciones@joincheers.app>', to: email, subject, html })
      } catch (e) {
        console.error('Error enviando email de compra confirmada:', e)
      }
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
      const cuerpo = lang === 'en'
        ? `
            <p style="font-size: 16px; color: #1c1830;">Looks like you started upgrading your Cheers plan but it didn't go through — happens sometimes.</p>
            <p style="font-size: 15px; color: #6b6585;">Whenever you're ready, you can pick up right where you left off.</p>
            <p style="margin-top: 20px;">
              <a href="${trackedLink(`https://joincheers.app${ruta}`, 'checkout_abandonado')}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Continue →</a>
            </p>
        `
        : `
            <p style="font-size: 16px; color: #1c1830;">Vimos que empezaste a mejorar tu plan en Cheers pero no se completó — a veces pasa.</p>
            <p style="font-size: 15px; color: #6b6585;">Si quieres, aquí retomas donde lo dejaste, sin prisa.</p>
            <p style="margin-top: 20px;">
              <a href="${trackedLink(`https://joincheers.app${ruta}`, 'checkout_abandonado')}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Continuar →</a>
            </p>
        `
      const html = envolverEmail(lang, cuerpo)

      try {
        await resend.emails.send({ from: 'Cheers <notificaciones@joincheers.app>', to: email, subject, html })
      } catch (e) {
        console.error('Error enviando email de checkout abandonado:', e)
      }
    }
  }

  return NextResponse.json({ received: true })
}
