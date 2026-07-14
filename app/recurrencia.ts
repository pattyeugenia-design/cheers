// Lógica pura para calcular fechas de celebraciones recurrentes.
// Sin acceso a base de datos — solo cálculo de fechas.

export type TipoRecurrencia = 'semanal' | 'mensual_nesimo'

/**
 * Calcula las próximas fechas de una serie recurrente.
 *
 * @param tipo 'semanal' (ej. cada viernes) o 'mensual_nesimo' (ej. cada 3er sábado)
 * @param diaSemana 0=domingo ... 6=sábado (igual que Date.getDay())
 * @param semanaMes 1-4, solo para 'mensual_nesimo' (3 = "tercer" sábado/viernes/etc.)
 * @param fechaInicio fecha desde la cual empezar a buscar, formato 'YYYY-MM-DD'
 * @param cantidad cuántas fechas futuras generar
 * @returns arreglo de fechas en formato 'YYYY-MM-DD', ordenadas ascendente
 */
export function calcularProximasFechas(
  tipo: TipoRecurrencia,
  diaSemana: number,
  semanaMes: number | null,
  fechaInicio: string,
  cantidad: number
): string[] {
  const fechas: string[] = []
  const inicio = new Date(fechaInicio + 'T00:00:00')

  if (tipo === 'semanal') {
    const actual = new Date(inicio)
    while (actual.getDay() !== diaSemana) actual.setDate(actual.getDate() + 1)
    for (let i = 0; i < cantidad; i++) {
      fechas.push(formatearFecha(actual))
      actual.setDate(actual.getDate() + 7)
    }
    return fechas
  }

  // mensual_nesimo: enésimo día de la semana de cada mes (ej. tercer sábado)
  let mes = inicio.getMonth()
  let anio = inicio.getFullYear()
  let generadas = 0
  let intentos = 0
  const n = semanaMes || 1

  while (generadas < cantidad && intentos < cantidad + 24) {
    const fecha = enesimoDiaDelMes(anio, mes, diaSemana, n)
    if (fecha >= inicio) {
      fechas.push(formatearFecha(fecha))
      generadas++
    }
    mes++
    if (mes > 11) { mes = 0; anio++ }
    intentos++
  }

  return fechas
}

function enesimoDiaDelMes(anio: number, mes: number, diaSemana: number, n: number): Date {
  const primero = new Date(anio, mes, 1)
  const offset = (diaSemana - primero.getDay() + 7) % 7
  const dia = 1 + offset + (n - 1) * 7
  return new Date(anio, mes, dia)
}

function formatearFecha(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
