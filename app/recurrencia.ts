// Lógica pura para calcular fechas de celebraciones recurrentes.
// Sin acceso a base de datos — solo cálculo de fechas.
//
// Soporta el mismo nivel de detalle que un evento recurrente de Outlook/Google
// Calendar: cada cuántos días/semanas/meses/años se repite (no solo cada 1),
// varios días de la semana a la vez, día fijo del mes o "enésimo día de la
// semana" del mes, y tres formas de terminar (nunca / en una fecha / después
// de X repeticiones — esto último se resuelve fuera de esta función, ver
// `ocurrenciasRestantes` abajo).

export type TipoRecurrencia = 'diario' | 'semanal' | 'mensual_dia' | 'mensual_nesimo' | 'anual'
export type FinRecurrencia = 'nunca' | 'fecha' | 'conteo'

export interface ConfigRecurrencia {
  tipo: TipoRecurrencia
  intervalo?: number | null      // cada cuántos días/semanas/meses/años (mínimo 1, default 1)
  diasSemana?: number[] | null   // 'semanal': uno o varios, 0=domingo...6=sábado
  diaMes?: number | null         // 'mensual_dia': día fijo del mes (1-31)
  diaSemana?: number | null      // 'mensual_nesimo': día de la semana (0-6)
  semanaMes?: number | null      // 'mensual_nesimo': 1-4, o -1 para "el último"
  mesAnio?: number | null        // 'anual': mes (0-11). Si no se da, se usa el mes de fechaInicio
  diaAnio?: number | null        // 'anual': día del mes (1-31). Si no se da, se usa el día de fechaInicio
}

/**
 * Calcula hasta `cantidad` fechas futuras de una serie recurrente.
 *
 * @param config qué tipo de repetición es y sus parámetros
 * @param fechaInicio primera fecha posible a considerar, formato 'YYYY-MM-DD'
 * @param cantidad tope de fechas a generar en esta pasada
 * @param finFecha si la serie termina en una fecha, no generar después de esta ('YYYY-MM-DD'); null si no aplica
 * @param ocurrenciasRestantes si la serie termina después de X repeticiones, cuántas quedan disponibles; null si no aplica
 * @returns arreglo de fechas 'YYYY-MM-DD', ordenadas ascendente
 */
export function calcularProximasFechas(
  config: ConfigRecurrencia,
  fechaInicio: string,
  cantidad: number,
  finFecha: string | null = null,
  ocurrenciasRestantes: number | null = null
): string[] {
  const tope = ocurrenciasRestantes === null ? cantidad : Math.min(cantidad, Math.max(0, ocurrenciasRestantes))
  if (tope <= 0) return []

  const intervalo = Math.max(1, config.intervalo || 1)
  const fechas: string[] = []
  const inicio = new Date(fechaInicio + 'T00:00:00')
  const dentroDeRango = (d: Date) => !finFecha || formatearFecha(d) <= finFecha

  if (config.tipo === 'diario') {
    const actual = new Date(inicio)
    while (fechas.length < tope) {
      if (!dentroDeRango(actual)) break
      fechas.push(formatearFecha(actual))
      actual.setDate(actual.getDate() + intervalo)
    }
    return fechas
  }

  if (config.tipo === 'semanal') {
    const dias = (config.diasSemana && config.diasSemana.length ? config.diasSemana : [inicio.getDay()]).slice().sort((a, b) => a - b)
    const inicioSemana = new Date(inicio)
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay())
    let vueltas = 0

    while (fechas.length < tope && vueltas < tope + 520) {
      for (const d of dias) {
        const candidato = new Date(inicioSemana)
        candidato.setDate(candidato.getDate() + d)
        if (candidato < inicio) continue
        if (!dentroDeRango(candidato)) return fechas
        fechas.push(formatearFecha(candidato))
        if (fechas.length >= tope) break
      }
      inicioSemana.setDate(inicioSemana.getDate() + 7 * intervalo)
      vueltas++
    }
    return fechas
  }

  if (config.tipo === 'mensual_dia') {
    const dia = config.diaMes || inicio.getDate()
    let mes = inicio.getMonth()
    let anio = inicio.getFullYear()
    let intentos = 0
    while (fechas.length < tope && intentos < tope + 240) {
      const candidato = new Date(anio, mes, Math.min(dia, ultimoDiaDelMes(anio, mes)))
      if (candidato >= inicio) {
        if (!dentroDeRango(candidato)) break
        fechas.push(formatearFecha(candidato))
      }
      mes += intervalo
      while (mes > 11) { mes -= 12; anio++ }
      intentos++
    }
    return fechas
  }

  if (config.tipo === 'mensual_nesimo') {
    const diaSemana = config.diaSemana ?? inicio.getDay()
    const n = config.semanaMes || 1
    let mes = inicio.getMonth()
    let anio = inicio.getFullYear()
    let intentos = 0
    while (fechas.length < tope && intentos < tope + 240) {
      const candidato = enesimoDiaDelMes(anio, mes, diaSemana, n)
      if (candidato >= inicio) {
        if (!dentroDeRango(candidato)) break
        fechas.push(formatearFecha(candidato))
      }
      mes += intervalo
      while (mes > 11) { mes -= 12; anio++ }
      intentos++
    }
    return fechas
  }

  // 'anual'
  const mesAnio = config.mesAnio ?? inicio.getMonth()
  const diaAnio = config.diaAnio ?? inicio.getDate()
  let anio = inicio.getFullYear()
  let intentos = 0
  while (fechas.length < tope && intentos < tope + 60) {
    const candidato = new Date(anio, mesAnio, Math.min(diaAnio, ultimoDiaDelMes(anio, mesAnio)))
    if (candidato >= inicio) {
      if (!dentroDeRango(candidato)) break
      fechas.push(formatearFecha(candidato))
    }
    anio += intervalo
    intentos++
  }
  return fechas
}

function enesimoDiaDelMes(anio: number, mes: number, diaSemana: number, n: number): Date {
  if (n === -1) {
    // el último [diaSemana] del mes (ej. "el último viernes")
    const ultimo = new Date(anio, mes + 1, 0)
    const offset = (ultimo.getDay() - diaSemana + 7) % 7
    return new Date(anio, mes, ultimo.getDate() - offset)
  }
  const primero = new Date(anio, mes, 1)
  const offset = (diaSemana - primero.getDay() + 7) % 7
  const dia = 1 + offset + (n - 1) * 7
  return new Date(anio, mes, dia)
}

function ultimoDiaDelMes(anio: number, mes: number): number {
  return new Date(anio, mes + 1, 0).getDate()
}

function formatearFecha(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
