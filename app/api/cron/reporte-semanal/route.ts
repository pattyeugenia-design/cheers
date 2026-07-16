import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { envolverEmail } from '../../../emailTemplate'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = 'patty.eugenia@gmail.com'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient(supabaseUrl, serviceKey)

  const ahora = new Date()
  const hace7 = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)
  const hace14 = new Date(ahora.getTime() - 14 * 24 * 60 * 60 * 1000)

  const [
    { count: usuariosSemana },
    { count: usuariosSemanaAnterior },
    { count: celsSemana },
    { count: celsSemanaAnterior },
    { count: rsvpsSiSemana },
  ] = await Promise.all([
    admin.from('perfiles').select('*', { count: 'exact', head: true }).gte('created_at', hace7.toISOString()),
    admin.from('perfiles').select('*', { count: 'exact', head: true }).gte('created_at', hace14.toISOString()).lt('created_at', hace7.toISOString()),
    admin.from('celebraciones').select('*', { count: 'exact', head: true }).gte('created_at', hace7.toISOString()),
    admin.from('celebraciones').select('*', { count: 'exact', head: true }).gte('created_at', hace14.toISOString()).lt('created_at', hace7.toISOString()),
    admin.from('rsvps').select('*', { count: 'exact', head: true }).gte('created_at', hace7.toISOString()).eq('asistencia', 'si'),
  ])

  // Ventas de la semana directo de Stripe (más confiable que leer perfiles/celebraciones,
  // porque el plan también se puede cambiar a mano desde el admin).
  let superCheer = 0
  let extraCheer = 0
  let totalCentavos = 0
  try {
    const sesiones = await stripe.checkout.sessions.list({
      created: { gte: Math.floor(hace7.getTime() / 1000) },
      limit: 100,
    })
    for (const s of sesiones.data) {
      if (s.status !== 'complete') continue
      if (s.metadata?.tipo === 'pro') superCheer++
      else if (s.metadata?.tipo === 'lifetime') extraCheer++
      totalCentavos += s.amount_total || 0
    }
  } catch (e) {
    console.error('Error consultando Stripe para reporte semanal:', e)
  }
  const totalVentas = (totalCentavos / 100).toFixed(2)

  const diff = (actual: number, anterior: number) => {
    if (anterior === 0) return actual > 0 ? '+100%' : '0%'
    const pct = Math.round(((actual - anterior) / anterior) * 100)
    return `${pct >= 0 ? '+' : ''}${pct}%`
  }

  const cuerpo = `
    <p style="font-size: 16px; color: #1c1830;">Reporte de la semana (${hace7.toLocaleDateString('es-MX')} – ${ahora.toLocaleDateString('es-MX')})</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b6585;">Usuarios nuevos</td>
        <td style="padding: 8px 0; font-size: 14px; color: #1c1830; text-align: right; font-weight: 700;">${usuariosSemana ?? 0} <span style="color: #a39ec0; font-weight: 400;">(${diff(usuariosSemana ?? 0, usuariosSemanaAnterior ?? 0)})</span></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b6585;">Celebraciones nuevas</td>
        <td style="padding: 8px 0; font-size: 14px; color: #1c1830; text-align: right; font-weight: 700;">${celsSemana ?? 0} <span style="color: #a39ec0; font-weight: 400;">(${diff(celsSemana ?? 0, celsSemanaAnterior ?? 0)})</span></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b6585;">Super Cheer vendidos</td>
        <td style="padding: 8px 0; font-size: 14px; color: #1c1830; text-align: right; font-weight: 700;">${superCheer}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b6585;">Extra Cheer vendidos</td>
        <td style="padding: 8px 0; font-size: 14px; color: #1c1830; text-align: right; font-weight: 700;">${extraCheer}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b6585;">Ingresos de la semana</td>
        <td style="padding: 8px 0; font-size: 14px; color: #1c1830; text-align: right; font-weight: 700;">$${totalVentas} USD</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #6b6585;">RSVPs confirmados (sí)</td>
        <td style="padding: 8px 0; font-size: 14px; color: #1c1830; text-align: right; font-weight: 700;">${rsvpsSiSemana ?? 0}</td>
      </tr>
    </table>
    <p style="margin-top: 20px; font-size: 13px; color: #a39ec0;">Detalle completo en tu dashboard de admin.</p>
  `
  const html = envolverEmail('es', cuerpo)

  try {
    await resend.emails.send({ from: 'Cheers <notificaciones@joincheers.app>', to: ADMIN_EMAIL, subject: 'Reporte semanal de Cheers', html })
  } catch (e) {
    console.error('Error enviando reporte semanal:', e)
  }

  return NextResponse.json({ success: true })
}
