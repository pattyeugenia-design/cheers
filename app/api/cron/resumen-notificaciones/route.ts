import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { envolverEmail, trackedLink } from '../../../emailTemplate'

const resend = new Resend(process.env.RESEND_API_KEY)

// Corre diario (ver vercel.json). Para cada organizador con
// notificaciones_prefs.por_tile.nivel = "importante", agrupa lo que pasó desde
// el último resumen (RSVPs, regalos reservados, mensajes del muro) en TODAS sus
// celebraciones, y manda UN correo — pero solo si de verdad hay algo nuevo, y
// solo si ya pasaron los días de periodicidad que eligió. Si no hay nada nuevo,
// no se manda nada y no se actualiza el timestamp (se vuelve a revisar mañana).
//
// Nota: los gastos NO van en este resumen — esa notificación es para los
// invitados que deben dinero, no para la organizadora, y hoy se manda al
// instante sin importar el nivel. Agruparla en un resumen aparte queda
// pendiente como mejora futura, no está en esta primera versión.
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient(supabaseUrl, serviceKey)

  const { data: perfiles } = await admin
    .from('perfiles')
    .select('user_id, lang, notificaciones_prefs')
    .eq('notificaciones_prefs->por_tile->>nivel', 'importante')

  let enviados = 0

  for (const perfil of perfiles || []) {
    const porTile = perfil.notificaciones_prefs?.por_tile || {}
    const periodicidadDias = Number(porTile.periodicidad_dias) || 1
    const ultimoEnvio = porTile.ultimo_envio ? new Date(porTile.ultimo_envio) : new Date(0)
    const diasDesdeUltimo = (Date.now() - ultimoEnvio.getTime()) / (1000 * 60 * 60 * 24)
    if (diasDesdeUltimo < periodicidadDias) continue

    const { data: { user } } = await admin.auth.admin.getUserById(perfil.user_id)
    if (!user?.email) continue

    const { data: celebraciones } = await admin
      .from('celebraciones')
      .select('slug, nombre')
      .eq('organizador_id', perfil.user_id)
      .eq('archivada', false)
    if (!celebraciones?.length) continue

    const slugs = celebraciones.map(c => c.slug)
    const nombrePorSlug = Object.fromEntries(celebraciones.map(c => [c.slug, c.nombre]))
    const desde = ultimoEnvio.toISOString()

    const [{ data: rsvps }, { data: regalos }, { data: mensajes }] = await Promise.all([
      admin.from('rsvps').select('celebracion_slug, nombre, asistencia, created_at').in('celebracion_slug', slugs).eq('asistencia', 'si').gt('created_at', desde),
      admin.from('regalo_reservas').select('celebracion_slug, regalo_id, created_at').in('celebracion_slug', slugs).gt('created_at', desde),
      admin.from('mensajes').select('celebracion_slug, nombre, texto, created_at').in('celebracion_slug', slugs).gt('created_at', desde),
    ])

    const totalItems = (rsvps?.length || 0) + (regalos?.length || 0) + (mensajes?.length || 0)
    if (totalItems === 0) continue // nada nuevo — no se manda, no se resetea el timestamp

    const lang: 'es' | 'en' = perfil.lang === 'en' ? 'en' : 'es'

    const lineas: string[] = []
    for (const r of rsvps || []) {
      lineas.push(lang === 'en'
        ? `<li>✦ <strong>${r.nombre}</strong> confirmed for "${nombrePorSlug[r.celebracion_slug]}"</li>`
        : `<li>✦ <strong>${r.nombre}</strong> confirmó asistencia a "${nombrePorSlug[r.celebracion_slug]}"</li>`)
    }
    for (const g of regalos || []) {
      lineas.push(lang === 'en'
        ? `<li>✦ Someone reserved a gift in "${nombrePorSlug[g.celebracion_slug]}"</li>`
        : `<li>✦ Alguien reservó un regalo en "${nombrePorSlug[g.celebracion_slug]}"</li>`)
    }
    for (const m of mensajes || []) {
      lineas.push(lang === 'en'
        ? `<li>✦ <strong>${m.nombre}</strong> left a message in "${nombrePorSlug[m.celebracion_slug]}"</li>`
        : `<li>✦ <strong>${m.nombre}</strong> dejó un mensaje en "${nombrePorSlug[m.celebracion_slug]}"</li>`)
    }

    const subject = lang === 'en' ? `Your Cheers summary (${totalItems} updates)` : `Tu resumen de Cheers (${totalItems} novedades)`
    const cuerpo = lang === 'en'
      ? `
          <p style="font-size: 16px; color: #1c1830;">Here's what happened since your last summary:</p>
          <ul style="font-size: 14px; color: #2a2440; line-height: 1.8; padding-left: 18px;">${lineas.join('')}</ul>
          <p style="margin-top: 20px;">
            <a href="${trackedLink('https://joincheers.app/dashboard', 'resumen_notificaciones')}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Open dashboard →</a>
          </p>
      `
      : `
          <p style="font-size: 16px; color: #1c1830;">Esto pasó desde tu último resumen:</p>
          <ul style="font-size: 14px; color: #2a2440; line-height: 1.8; padding-left: 18px;">${lineas.join('')}</ul>
          <p style="margin-top: 20px;">
            <a href="${trackedLink('https://joincheers.app/dashboard', 'resumen_notificaciones')}" style="background: linear-gradient(135deg,#534AB7,#D4537E); color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 700;">Abrir dashboard →</a>
          </p>
      `
    const html = envolverEmail(lang, cuerpo)

    try {
      await resend.emails.send({ from: 'Cheers <notificaciones@joincheers.app>', to: user.email, subject, html })
      enviados++
      await admin.from('perfiles').update({
        notificaciones_prefs: {
          ...perfil.notificaciones_prefs,
          por_tile: { ...porTile, ultimo_envio: new Date().toISOString() },
        },
      }).eq('user_id', perfil.user_id)
    } catch (e) {
      console.error('Error enviando resumen de notificaciones:', e)
    }
  }

  return NextResponse.json({ success: true, enviados })
}
