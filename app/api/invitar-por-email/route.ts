import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { envolverEmail, trackedLink } from '../../emailTemplate'

const resend = new Resend(process.env.RESEND_API_KEY)

// Rate limit simple en memoria: max 10 solicitudes por IP cada 60 segundos.
// Mismo patrón que las demás rutas de correo — frena abuso básico del endpoint.
const solicitudesPorIP = new Map<string, number[]>()
const LIMITE_SOLICITUDES = 10
const VENTANA_MS = 60_000

function excedeLimite(ip: string): boolean {
  const ahora = Date.now()
  const previas = solicitudesPorIP.get(ip) || []
  const recientes = previas.filter(t => ahora - t < VENTANA_MS)
  recientes.push(ahora)
  solicitudesPorIP.set(ip, recientes)
  return recientes.length > LIMITE_SOLICITUDES
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconocida'
  if (excedeLimite(ip)) return NextResponse.json({ success: true })

  const { celebracionSlug, invitadoEmail } = await req.json()
  if (!celebracionSlug || !invitadoEmail) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient(supabaseUrl, serviceKey)

  const { data: cel } = await admin
    .from('celebraciones')
    .select('nombre, slug, festejado_nombre, fecha, es_sorpresa, plan, paradas, organizador_id')
    .eq('slug', celebracionSlug)
    .single()
  if (!cel) return NextResponse.json({ success: true })

  const { data: { user: organizador } } = await admin.auth.admin.getUserById(cel.organizador_id)
  const { data: perfilOrg } = await admin.from('perfiles').select('nombre_completo, plan, lang').eq('user_id', cel.organizador_id).single()
  const lang: 'es' | 'en' = perfilOrg?.lang === 'en' ? 'en' : 'es'
  const locale = lang === 'en' ? 'en-US' : 'es-MX'

  const primeraParada = (cel.paradas || []).find((p: any) => p?.lugar)
  const lugarNombre: string | null = primeraParada?.lugar || null
  const fechaFmt = cel.fecha
    ? new Date(cel.fecha).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null

  const tituloEvento = cel.festejado_nombre
    ? (lang === 'en' ? `${cel.festejado_nombre}'s celebration` : `Celebración de ${cel.festejado_nombre}`)
    : cel.nombre

  const esSorpresa = cel.es_sorpresa && (perfilOrg?.plan === 'lifetime' || perfilOrg?.plan === 'pro' || cel.plan === 'pro')

  const subject = lang === 'en'
    ? `You're invited: ${tituloEvento}`
    : `Estás invitado: ${tituloEvento}`

  const link = trackedLink(`https://joincheers.app/${cel.slug}`, 'invitacion')

  const cuerpo = lang === 'en'
    ? `
        <p style="font-size: 13px; font-weight: 700; color: #a39ec0; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px;">You're invited</p>
        <h2 style="font-size: 22px; color: #1c1830; margin: 0 0 10px;">${tituloEvento}</h2>
        ${fechaFmt ? `<p style="font-size: 15px; color: #6b6585; margin: 0 0 2px;">${fechaFmt}</p>` : ''}
        ${lugarNombre ? `<p style="font-size: 15px; color: #a39ec0; margin: 0 0 14px;">${lugarNombre}</p>` : ''}
        ${esSorpresa ? `<p style="font-size: 13px; color: #D4537E; font-weight: 700; margin: 0 0 14px;">This is a surprise — don't tell the guest of honor.</p>` : ''}
        ${perfilOrg?.nombre_completo ? `<p style="font-size: 14px; color: #6b6585; margin: 0 0 20px;">Organized by ${perfilOrg.nombre_completo}</p>` : ''}
        <p style="margin-top: 10px;">
          <a href="${link}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: 700;">View invitation →</a>
        </p>
        <p style="font-size: 12px; color: #a39ec0; margin-top: 20px;">Create a free account to see the full plan and confirm your spot.</p>
    `
    : `
        <p style="font-size: 13px; font-weight: 700; color: #a39ec0; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px;">Estás invitado</p>
        <h2 style="font-size: 22px; color: #1c1830; margin: 0 0 10px;">${tituloEvento}</h2>
        ${fechaFmt ? `<p style="font-size: 15px; color: #6b6585; margin: 0 0 2px;">${fechaFmt}</p>` : ''}
        ${lugarNombre ? `<p style="font-size: 15px; color: #a39ec0; margin: 0 0 14px;">${lugarNombre}</p>` : ''}
        ${esSorpresa ? `<p style="font-size: 13px; color: #D4537E; font-weight: 700; margin: 0 0 14px;">Es sorpresa — no le digas al festejado/a.</p>` : ''}
        ${perfilOrg?.nombre_completo ? `<p style="font-size: 14px; color: #6b6585; margin: 0 0 20px;">Organiza ${perfilOrg.nombre_completo}</p>` : ''}
        <p style="margin-top: 10px;">
          <a href="${link}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 22px; border-radius: 10px; text-decoration: none; font-weight: 700;">Ver invitación →</a>
        </p>
        <p style="font-size: 12px; color: #a39ec0; margin-top: 20px;">Crea una cuenta gratis para ver el plan completo y confirmar tu lugar.</p>
    `
  const html = envolverEmail(lang, cuerpo)

  try {
    await resend.emails.send({ from: 'Cheers <notificaciones@joincheers.app>', to: invitadoEmail, subject, html })
  } catch (e) {
    console.error('Error enviando email de invitación:', e)
  }

  return NextResponse.json({ success: true })
}
