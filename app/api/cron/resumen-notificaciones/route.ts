import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { envolverEmail, trackedLink } from '../../../emailTemplate'
import { DEFAULT_NOTIF_PREFS, NotificacionesPrefs } from '../../../notificacionesPrefs'

const resend = new Resend(process.env.RESEND_API_KEY)

type TipoDigest = 'rsvp' | 'regalo' | 'mensaje'
const TIPOS: TipoDigest[] = ['rsvp', 'regalo', 'mensaje']

// Corre diario (ver vercel.json). RSVP, regalo reservado y mensaje del muro
// tienen cada uno su propio nivel/periodicidad — un organizador puede tener
// "regalo" en importante cada 3 días y "mensaje" en leve (resumen semanal),
// por ejemplo, y ambos se evalúan por separado aunque terminen en el mismo
// correo si coinciden el mismo día.
//
// RSVP solo pasa por aquí en "importante" — su piso ("leve") ya es al
// instante, no por resumen. Regalo y mensaje sí pasan por aquí tanto en
// "leve" (resumen fijo cada 7 días, el piso) como en "importante" (cada 1-3
// días, como el usuario elija). Ninguno de los tres pasa por aquí en "todo"
// (van al instante en sus propias rutas).
//
// Si un tipo estaba "due" pero no hubo nada nuevo, no se actualiza su
// ultimo_envio (se vuelve a revisar mañana). Recordatorio de evento no pasa
// por este cron — se resuelve solo en su propio cron de recordatorios.
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

  let enviados = 0

  for (const perfil of perfiles || []) {
    const prefs: NotificacionesPrefs = perfil.notificaciones_prefs?.rsvp ? perfil.notificaciones_prefs : DEFAULT_NOTIF_PREFS

    const due: Partial<Record<TipoDigest, boolean>> = {}
    for (const tipo of TIPOS) {
      const item = prefs[tipo]
      // rsvp: solo digest en "importante". regalo/mensaje: digest en "leve" (piso, 7 días fijo) o "importante".
      const pasaPorDigest = tipo === 'rsvp' ? item.nivel === 'importante' : (item.nivel === 'leve' || item.nivel === 'importante')
      if (!pasaPorDigest) continue
      const periodicidad = item.nivel === 'leve' && tipo !== 'rsvp' ? 7 : (Number(item.periodicidad_dias) || 1)
      const ultimo = item.ultimo_envio ? new Date(item.ultimo_envio) : new Date(0)
      const diasDesdeUltimo = (Date.now() - ultimo.getTime()) / (1000 * 60 * 60 * 24)
      if (diasDesdeUltimo >= periodicidad) due[tipo] = true
    }
    if (Object.keys(due).length === 0) continue

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
    const lang: 'es' | 'en' = perfil.lang === 'en' ? 'en' : 'es'

    const lineas: string[] = []
    const conteoPorTipo: Partial<Record<TipoDigest, number>> = {}

    if (due.rsvp) {
      const desde = prefs.rsvp.ultimo_envio || new Date(0).toISOString()
      const { data: rsvps } = await admin.from('rsvps').select('celebracion_slug, nombre, asistencia, created_at').in('celebracion_slug', slugs).eq('asistencia', 'si').gt('created_at', desde)
      conteoPorTipo.rsvp = rsvps?.length || 0
      for (const r of rsvps || []) {
        lineas.push(lang === 'en'
          ? `<li>✦ <strong>${r.nombre}</strong> confirmed for "${nombrePorSlug[r.celebracion_slug]}"</li>`
          : `<li>✦ <strong>${r.nombre}</strong> confirmó asistencia a "${nombrePorSlug[r.celebracion_slug]}"</li>`)
      }
    }
    if (due.regalo) {
      const desde = prefs.regalo.ultimo_envio || new Date(0).toISOString()
      const { data: regalos } = await admin.from('regalo_reservas').select('celebracion_slug, regalo_id, created_at').in('celebracion_slug', slugs).gt('created_at', desde)
      conteoPorTipo.regalo = regalos?.length || 0
      for (const g of regalos || []) {
        lineas.push(lang === 'en'
          ? `<li>✦ Someone reserved a gift in "${nombrePorSlug[g.celebracion_slug]}"</li>`
          : `<li>✦ Alguien reservó un regalo en "${nombrePorSlug[g.celebracion_slug]}"</li>`)
      }
    }
    if (due.mensaje) {
      const desde = prefs.mensaje.ultimo_envio || new Date(0).toISOString()
      const { data: mensajes } = await admin.from('mensajes').select('celebracion_slug, nombre, texto, created_at').in('celebracion_slug', slugs).gt('created_at', desde)
      conteoPorTipo.mensaje = mensajes?.length || 0
      for (const m of mensajes || []) {
        lineas.push(lang === 'en'
          ? `<li>✦ <strong>${m.nombre}</strong> left a message in "${nombrePorSlug[m.celebracion_slug]}"</li>`
          : `<li>✦ <strong>${m.nombre}</strong> dejó un mensaje en "${nombrePorSlug[m.celebracion_slug]}"</li>`)
      }
    }

    const totalItems = Object.values(conteoPorTipo).reduce((s, n) => s + (n || 0), 0)
    if (totalItems === 0) continue // nada nuevo en ningún tipo due — no se manda, no se resetea ningún timestamp

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
      const ahora = new Date().toISOString()
      const nuevoPrefs: any = { ...prefs }
      for (const tipo of TIPOS) {
        if ((conteoPorTipo[tipo] || 0) > 0) {
          nuevoPrefs[tipo] = { ...prefs[tipo], ultimo_envio: ahora }
        }
      }
      await admin.from('perfiles').update({ notificaciones_prefs: nuevoPrefs }).eq('user_id', perfil.user_id)
    } catch (e) {
      console.error('Error enviando resumen de notificaciones:', e)
    }
  }

  return NextResponse.json({ success: true, enviados })
}
