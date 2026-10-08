// Encuadre de una foto dentro de su marco: dónde está su "centro" (x, y de 0 a 1) y cuánto
// se acerca (z de 1 a 3). Es lo que la pareja acomoda arrastrando la foto, como en Facebook.
// Todo lo que se lee de la base se limpia aquí: nunca se confía en que sea un número válido.
export type Encuadre = { x: number; y: number; z: number }

const acotar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
function num(v: unknown, por: number): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN
  return Number.isFinite(n) ? n : por
}

export function normalizarEncuadre(e?: { x?: unknown; y?: unknown; z?: unknown } | null): Encuadre {
  return { x: acotar(num(e?.x, 0.5), 0, 1), y: acotar(num(e?.y, 0.5), 0, 1), z: acotar(num(e?.z, 1), 1, 3) }
}

// Las posiciones de la portada vienen de dos épocas: los nombres de antes (arriba / centro / abajo)
// y el formato nuevo "50% 28% 1.2" (x, y y acercamiento). Ambas se entienden.
const ANTIGUAS: Record<string, Encuadre> = {
  top: { x: 0.5, y: 0, z: 1 }, center: { x: 0.5, y: 0.28, z: 1 }, bottom: { x: 0.5, y: 1, z: 1 },
}
export function leerEncuadreTexto(valor?: string | null): Encuadre {
  const v = String(valor || '').trim()
  if (ANTIGUAS[v]) return { ...ANTIGUAS[v] }
  const m = /^(\d{1,3}(?:\.\d+)?)%\s+(\d{1,3}(?:\.\d+)?)%(?:\s+(\d(?:\.\d+)?))?$/.exec(v)
  if (!m) return { ...ANTIGUAS.center }
  return normalizarEncuadre({ x: parseFloat(m[1]) / 100, y: parseFloat(m[2]) / 100, z: m[3] ? parseFloat(m[3]) : 1 })
}
export function encuadreATexto(e: Encuadre): string {
  const n = normalizarEncuadre(e)
  const z = String(Math.round(n.z * 100) / 100)
  return `${Math.round(n.x * 100)}% ${Math.round(n.y * 100)}% ${z}`
}
export function redondear(e: Encuadre): Encuadre {
  const n = normalizarEncuadre(e)
  const r = (v: number) => Math.round(v * 1000) / 1000
  return { x: r(n.x), y: r(n.y), z: r(n.z) }
}
