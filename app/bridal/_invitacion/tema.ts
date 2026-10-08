// Sistema de diseño de la invitación de boda. Un solo lugar define colores y
// tipografías; la invitación real y la vista previa leen de aquí, así nunca
// pueden verse distintas entre sí.

export type Paleta = {
  bg: string           // fondo de toda la página
  papel: string        // color sólido bajo el fondo (sobre, tarjetas opacas)
  dark: boolean
  txt: string          // texto principal
  txt2: string         // texto secundario
  txt3: string         // texto de apoyo / etiquetas
  acento: string       // etiquetas, botones, detalles
  acento2: string      // acento suave (líneas, círculos)
  linea: string        // hairlines
  card: string         // fondo de tarjetas / formularios
  cardBorde: string
  botonTxt: string     // texto sobre botón relleno
  botanicos: boolean   // mostrar acuarelas (solo en temas claros y cálidos)
  script: string       // letra para nombres
  serif: string        // letra para frases y textos
  etiqueta: string     // letra para etiquetas en mayúsculas espaciadas
  tracking: string     // espaciado de etiquetas
}

const SISTEMA = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'

// Letras de la elección clásica del dashboard (se conservan por compatibilidad).
export const FUENTES_INV: Record<string, string> = {
  system: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
  verdana: 'Verdana, Geneva, sans-serif',
  georgia: 'Georgia, serif',
  cursive: '"Brush Script MT", "Segoe Script", cursive',
}

const LEGACY: Record<string, { bg: string; dark: boolean }> = {
  morado:  { bg: 'radial-gradient(circle at 18% 16%,#7b6fd0,transparent 46%),linear-gradient(160deg,#534AB7,#7b46a8 58%,#D4537E)', dark: true },
  rosa:    { bg: 'linear-gradient(155deg,#D4537E,#a14b9c)', dark: true },
  noche:   { bg: 'linear-gradient(160deg,#0f0c29,#302b63,#24243e)', dark: true },
  bosque:  { bg: 'linear-gradient(155deg,#1a3c2a,#2d6a4f,#40916c)', dark: true },
  ambar:   { bg: 'linear-gradient(155deg,#b5451b,#e76f51,#f4a261)', dark: true },
  carbon:  { bg: 'linear-gradient(160deg,#1a1a1a,#2d2d2d,#3d3d3d)', dark: true },
  lavanda: { bg: '#B8B0F0', dark: false },
  crema:   { bg: '#FBF4EC', dark: false },
}

// Rosa polvo: sale de la paleta que eligieron los novios (ivory, blush, dusty
// rose, mauve, sage) y de la caligrafía de su recuerdito.
const ROSA_POLVO: Paleta = {
  bg: 'linear-gradient(180deg,#F8F4EE 0%,#F4ECE5 55%,#F1E6DF 100%)',
  papel: '#F6F0E9',
  dark: false,
  txt: '#4B3B38',
  txt2: '#6E5A55',
  txt3: '#9C8780',
  acento: '#AD857C',
  acento2: '#DAC2B8',
  linea: 'rgba(173,133,124,.32)',
  card: 'rgba(255,255,255,.58)',
  cardBorde: 'rgba(173,133,124,.22)',
  botonTxt: '#FFFFFF',
  botanicos: true,
  script: "'Allura', 'Brush Script MT', cursive",
  serif: "'Cormorant Garamond', Georgia, serif",
  etiqueta: "'Jost', -apple-system, system-ui, sans-serif",
  tracking: '.3em',
}

export const TEMAS_INV_ORDER = ['rosapolvo', 'morado', 'rosa', 'noche', 'bosque', 'ambar', 'carbon', 'lavanda', 'crema']

export function paletaDe(tema?: string | null, fuente?: string | null): Paleta {
  if (tema === 'rosapolvo') return ROSA_POLVO
  const t = LEGACY[tema || 'morado'] || LEGACY.morado
  const f = FUENTES_INV[fuente || 'system'] || FUENTES_INV.system
  return t.dark
    ? { bg: t.bg, papel: '#2a1f3d', dark: true, txt: '#FFFFFF', txt2: 'rgba(255,255,255,.78)', txt3: 'rgba(255,255,255,.55)', acento: '#EEC9DD', acento2: 'rgba(255,255,255,.35)', linea: 'rgba(255,255,255,.22)', card: 'rgba(255,255,255,.07)', cardBorde: 'rgba(255,255,255,.14)', botonTxt: '#2a1f3d', botanicos: false, script: f, serif: f, etiqueta: SISTEMA, tracking: '.18em' }
    : { bg: t.bg, papel: '#FBF4EC', dark: false, txt: '#2a2440', txt2: 'rgba(42,36,64,.72)', txt3: 'rgba(42,36,64,.5)', acento: '#534AB7', acento2: 'rgba(83,74,183,.35)', linea: 'rgba(42,36,64,.18)', card: 'rgba(255,255,255,.55)', cardBorde: 'rgba(42,36,64,.1)', botonTxt: '#FFFFFF', botanicos: false, script: f, serif: f, etiqueta: SISTEMA, tracking: '.18em' }
}

// Solo URLs https de nuestro propio Storage (o Google para avatares): nada de
// imágenes de terceros dentro de una invitación, ni esquemas raros.
export function urlImagenSegura(url?: string | null): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    // Solo en desarrollo (nunca en el sitio real): imágenes de prueba locales.
    if (process.env.NODE_ENV === 'development' && u.hostname === 'localhost' && u.pathname.startsWith('/mock/')) return u.toString()
    if (u.protocol !== 'https:') return null
    if (!u.hostname.endsWith('.supabase.co')) return null
    if (!u.pathname.startsWith('/storage/v1/object/public/')) return null
    return u.toString()
  } catch { return null }
}

// Enlaces externos (mesa de regalos, hoteles): solo http(s).
export function urlEnlaceSegura(url?: string | null): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null
  } catch { return null }
}

export function fechaLarga(fecha: string | null | undefined, lang: string) {
  if (!fecha) return ''
  const d = new Date(fecha + 'T12:00:00')
  if (isNaN(d.getTime())) return fecha
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
export function fechaCorta(fecha: string | null | undefined, lang: string) {
  if (!fecha) return ''
  const d = new Date(fecha + 'T12:00:00')
  if (isNaN(d.getTime())) return fecha
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}
// "SÁBADO · 13 · FEBRERO · 2027": el día de la semana siempre va incluido.
export function fechaPuntos(fecha: string | null | undefined, lang: string) {
  if (!fecha) return ''
  const d = new Date(fecha + 'T12:00:00')
  if (isNaN(d.getTime())) return fecha
  const loc = lang === 'en' ? 'en-US' : 'es-MX'
  const dia = d.toLocaleDateString(loc, { weekday: 'long' }).toUpperCase()
  const mes = d.toLocaleDateString(loc, { month: 'long' }).toUpperCase()
  return `${dia} · ${d.getDate()} · ${mes} · ${d.getFullYear()}`
}
// "19:30" -> "7:30 pm"; "02:00" -> "2:00 am". Si ya viene con am/pm se respeta.
export function hora12(h?: string | null) {
  const m = /^\s*(\d{1,2}):(\d{2})\s*(am|pm)?\s*$/i.exec(h || '')
  if (!m) return (h || '').trim()
  let hh = Number(m[1])
  const suf = (m[3] || (hh >= 12 ? 'pm' : 'am')).toLowerCase()
  hh = hh % 12 || 12
  return `${hh}:${m[2]} ${suf}`
}
export function horaBonita(hora?: string | null) {
  return hora12(hora)
}
// "19:30 - 20:30" (o "7:30 pm a 8:30 pm") -> { ini: "19:30", fin: "20:30" }
export function partirHora(h?: string | null): { ini: string; fin: string | null } {
  const partes = String(h || '').split(/\s*(?:-|–|—|\ba\b|\bto\b)\s*/i).map(s => s.trim()).filter(Boolean)
  return { ini: partes[0] || '', fin: partes[1] || null }
}
