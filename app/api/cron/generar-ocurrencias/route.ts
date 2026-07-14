import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calcularProximasFechas, TipoRecurrencia } from '../../../recurrencia'

const OBJETIVO_FUTURAS = 10 // siempre mantener al menos estas fechas futuras generadas

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient(supabaseUrl, serviceKey)

  const { data: series } = await admin
    .from('celebraciones')
    .select('slug, fecha, plan, organizador_id, recurrente, recurrencia_tipo, recurrencia_dia_semana, recurrencia_semana_mes')
    .eq('recurrente', true)
    .eq('archivada', false)

  let seriesActualizadas = 0
  let fechasGeneradas = 0
  let seriesSinPagar = 0

  for (const serie of series || []) {
    if (!serie.recurrencia_tipo || serie.recurrencia_dia_semana === null || serie.recurrencia_dia_semana === undefined) continue

    const { data: perfilOrg } = await admin.from('perfiles').select('plan').eq('user_id', serie.organizador_id).single()
    const esPro = perfilOrg?.plan === 'lifetime' || serie.plan === 'pro'

    // Si todavía no está pagada, se deja seleccionada pero no se generan fechas
    // (igual que el modo sorpresa: se elige al crear, pero solo se activa al pagar)
    if (!esPro) { seriesSinPagar++; continue }

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const hoyStr = hoy.toISOString().slice(0, 10)

    const { data: existentes } = await admin
      .from('ocurrencias')
      .select('fecha, cancelada')
      .eq('celebracion_slug', serie.slug)
      .order('fecha', { ascending: false })

    const futuras = (existentes || []).filter(o => !o.cancelada && o.fecha >= hoyStr)
    const faltantes = OBJETIVO_FUTURAS - futuras.length
    if (faltantes <= 0) continue

    const ultimaFecha = existentes && existentes.length > 0 ? existentes[0].fecha : null
    const fechaInicio = ultimaFecha
      ? new Date(new Date(ultimaFecha + 'T00:00:00').getTime() + 86400000).toISOString().slice(0, 10)
      : (serie.fecha || hoyStr)

    const nuevasFechas = calcularProximasFechas(
      serie.recurrencia_tipo as TipoRecurrencia,
      serie.recurrencia_dia_semana,
      serie.recurrencia_semana_mes,
      fechaInicio,
      faltantes
    )

    if (nuevasFechas.length === 0) continue

    const { error } = await admin.from('ocurrencias').insert(
      nuevasFechas.map(fecha => ({ celebracion_slug: serie.slug, fecha }))
    )

    if (!error) {
      seriesActualizadas++
      fechasGeneradas += nuevasFechas.length
    }
  }

  return NextResponse.json({
    success: true,
    seriesRevisadas: series?.length ?? 0,
    seriesActualizadas,
    fechasGeneradas,
    seriesSinPagar,
  })
}
