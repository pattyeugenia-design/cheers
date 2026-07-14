'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../supabase'
import { getLang, t } from '../../i18n'

const FSYS = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const COLS = 12 // columnas del grid
const ROW_H = 60 // altura de cada fila en px
const GAP = 12 // gap entre tiles

const BG_INVITADO = 'radial-gradient(circle at 18% 16%,#7b6fd0,transparent 46%),linear-gradient(160deg,#534AB7,#7b46a8 58%,#D4537E)'

const TEMAS: Record<string, { label_key: string; bg: string; dark: boolean; tileBg: string; tileText: string; accentBg: string; accentText: string }> = {
  morado:  { label_key: 'theme_morado',  bg: 'radial-gradient(circle at 18% 16%,#7b6fd0,transparent 46%),linear-gradient(160deg,#534AB7,#7b46a8 58%,#D4537E)', dark: true,  tileBg: '#fff',    tileText: '#2a2440', accentBg: '#EEEDFE', accentText: '#534AB7' },
  rosa:    { label_key: 'theme_rosa',    bg: 'linear-gradient(155deg,#D4537E,#a14b9c)',                                                                        dark: true,  tileBg: '#fff5f8', tileText: '#3a1525', accentBg: '#FCE9F0', accentText: '#D4537E' },
  noche:   { label_key: 'theme_noche',   bg: 'linear-gradient(160deg,#0f0c29,#302b63,#24243e)',                                                                dark: true,  tileBg: '#1a1740', tileText: '#e8e4ff', accentBg: '#2a2560', accentText: '#a89df0' },
  bosque:  { label_key: 'theme_bosque',  bg: 'linear-gradient(155deg,#1a3c2a,#2d6a4f,#40916c)',                                                               dark: true,  tileBg: '#f0faf4', tileText: '#1a3c2a', accentBg: '#d8f3dc', accentText: '#2d6a4f' },
  ambar:   { label_key: 'theme_ambar',   bg: 'linear-gradient(155deg,#b5451b,#e76f51,#f4a261)',                                                               dark: true,  tileBg: '#fff8f0', tileText: '#3d1a08', accentBg: '#fde8d8', accentText: '#b5451b' },
  carbon:  { label_key: 'theme_carbon',  bg: 'linear-gradient(160deg,#1a1a1a,#2d2d2d,#3d3d3d)',                                                               dark: true,  tileBg: '#2a2a2a', tileText: '#f0f0f0', accentBg: '#3a3a3a', accentText: '#d0d0d0' },
  lavanda: { label_key: 'theme_lavanda', bg: '#B8B0F0',                                                                                                       dark: false, tileBg: '#fff',    tileText: '#2a2440', accentBg: '#534AB7', accentText: '#fff'    },
  crema:   { label_key: 'theme_crema',   bg: '#FBF4EC',                                                                                                       dark: false, tileBg: '#fff',    tileText: '#2a2440', accentBg: '#f0e6d3', accentText: '#7a5c3a' },
}
const TEMA_ORDER = ['morado', 'rosa', 'noche', 'bosque', 'ambar', 'carbon', 'lavanda', 'crema']

const FUENTES: Record<string, { label: string; font: string }> = {
  system:  { label: 'SF Pro',       font: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' },
  verdana: { label: 'Verdana',      font: 'Verdana, Geneva, sans-serif' },
  georgia: { label: 'Georgia',      font: 'Georgia, serif' },
  cursive: { label: 'Brush Script', font: '"Brush Script MT", "Segoe Script", cursive' },
}
const FUENTE_ORDER = ['system', 'verdana', 'georgia', 'cursive']

type TituloEstilo = 'normal-left' | 'normal-center' | 'spaced'

// Tile layout: col (1-based), row (1-based), colSpan, rowSpan
interface TileLayout {
  key: string
  col: number
  row: number
  colSpan: number
  rowSpan: number
  visible: boolean
}

const DEFAULT_TILES_VISIBLES: Record<string, boolean> = {
  portada: true, invitados: true, regalos: true, mensajes: true,
  itinerario: true, presupuesto: true, quellevar: true, menu: true, reservacion: true
}

const TINFO: Record<string, { label: string; title_key: string }> = {
  portada:    { label: 'IMG', title_key: 'tile_portada' },
  invitados:  { label: 'INV', title_key: 'tile_invitados' },
  regalos:    { label: 'REG', title_key: 'tile_regalos' },
  itinerario: { label: 'ITE', title_key: 'tile_itinerario' },
  presupuesto:{ label: 'PRE', title_key: 'tile_presupuesto' },
  quellevar:  { label: 'QLL', title_key: 'tile_quellevar' },
  menu:       { label: 'MEN', title_key: 'tile_menu' },
  reservacion:{ label: 'RES', title_key: 'tile_reservacion' },
  mensajes:   { label: 'MSG', title_key: 'tile_mensajes' },
}

const STARS = [
  { top: '4%',  left: '2%',  size: 18, delay: '0s',   dur: '3.2s' },
  { top: '8%',  left: '92%', size: 24, delay: '1.1s', dur: '2.8s' },
  { top: '15%', left: '5%',  size: 12, delay: '0.5s', dur: '3.5s' },
  { top: '30%', left: '1%',  size: 20, delay: '0.8s', dur: '3.8s' },
  { top: '52%', left: '95%', size: 22, delay: '0.3s', dur: '4.0s' },
  { top: '75%', left: '4%',  size: 26, delay: '1.3s', dur: '2.7s' },
  { top: '88%', left: '6%',  size: 18, delay: '0.4s', dur: '3.1s' },
]

function defaultLayouts(type: string, sub?: string): TileLayout[] {
  // 12 cols, tiles en grid de 2 columnas (6 cols cada una)
  const SETS: Record<string, string[]> = {
    cumple:  ['portada', 'invitados', 'regalos', 'mensajes'],
    cena:    sub === 'restaurante' ? ['portada', 'invitados', 'reservacion'] : ['portada', 'invitados', 'menu'],
    viaje:   ['portada', 'invitados', 'itinerario', 'presupuesto', 'quellevar'],
    reunion: ['portada', 'invitados', 'menu'],
    evento:  ['portada', 'invitados', 'regalos'],
    otro:    ['portada', 'invitados', 'regalos'],
  }
  const keys = SETS[type] || ['portada', 'invitados', 'regalos']

  const layouts: TileLayout[] = []
  let row = 1

  // Portada siempre ancho completo, 4 filas
  layouts.push({ key: 'portada', col: 1, row, colSpan: 6, rowSpan: 4, visible: true })
  row += 4

  // Resto en pares de 2 columnas de 6
  const rest = keys.filter(k => k !== 'portada')
  for (let i = 0; i < rest.length; i += 2) {
    const rowSpan = 4
    layouts.push({ key: rest[i], col: 1, row, colSpan: 6, rowSpan, visible: true })
    if (rest[i + 1]) {
      layouts.push({ key: rest[i + 1], col: 7, row, colSpan: 6, rowSpan, visible: true })
    }
    row += rowSpan
  }

  return layouts
}

function packLayouts(order: TileLayout[]): TileLayout[] {
  const heights = new Array(COLS).fill(0)
  return order.map(t => {
    const span = Math.min(t.colSpan, COLS)
    let bestCol = 0, bestRow = Infinity
    for (let c = 0; c <= COLS - span; c++) {
      let rowHere = 0
      for (let k = c; k < c + span; k++) rowHere = Math.max(rowHere, heights[k])
      if (rowHere < bestRow) { bestRow = rowHere; bestCol = c }
    }
    for (let k = bestCol; k < bestCol + span; k++) heights[k] = bestRow + t.rowSpan
    return { ...t, col: bestCol + 1, row: bestRow + 1 }
  })
}

const initial = (n: string) => (n || '?').trim()[0].toUpperCase()

function formatICSDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

const DIAS_ICS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

// Si la celebración es una serie recurrente, agrega la línea RRULE para que
// Apple/Outlook/Google entiendan el patrón de repetición, no solo esta fecha suelta.
function construirRRULE(tipo?: 'semanal' | 'mensual_nesimo' | null, diaSemana?: number | null, semanaMes?: number | null): string | null {
  if (!tipo || diaSemana == null || diaSemana < 0 || diaSemana > 6) return null
  const dia = DIAS_ICS[diaSemana]
  if (tipo === 'semanal') return `RRULE:FREQ=WEEKLY;BYDAY=${dia}`
  if (tipo === 'mensual_nesimo' && semanaMes) return `RRULE:FREQ=MONTHLY;BYDAY=${semanaMes}${dia}`
  return null
}

function calendarLinks(
  nombre: string, fecha: string, hora: string, lugar: string,
  recurrencia?: { tipo?: 'semanal' | 'mensual_nesimo' | null; diaSemana?: number | null; semanaMes?: number | null } | null
) {
  const inicio = new Date(`${fecha}T${hora || '12:00'}:00`)
  const fin = new Date(inicio.getTime() + 3 * 60 * 60 * 1000) // 3 horas por default
  const detalles = 'Organizado con Cheers'

  const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(nombre)}&dates=${formatICSDate(inicio)}/${formatICSDate(fin)}&details=${encodeURIComponent(detalles)}&location=${encodeURIComponent(lugar || '')}`

  const rrule = recurrencia ? construirRRULE(recurrencia.tipo, recurrencia.diaSemana, recurrencia.semanaMes) : null
  const lineasIcs = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${formatICSDate(inicio)}`,
    `DTEND:${formatICSDate(fin)}`,
    `SUMMARY:${nombre}`,
    `LOCATION:${lugar || ''}`,
    `DESCRIPTION:${detalles}`,
  ]
  if (rrule) lineasIcs.push(rrule)
  lineasIcs.push('END:VEVENT', 'END:VCALENDAR')
  const icsContent = lineasIcs.join('\r\n')
  const icsUrl = `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`

  return { googleUrl, icsUrl }
}

// Para series recurrentes, la fecha/hora/lugar que hay que mostrar es la de la
// próxima ocurrencia real (tabla "ocurrencias"), no la fecha fija con la que se
// creó el evento — esa se queda congelada en el pasado apenas pasa la primera vez.
function proximaOcurrencia(celebracion: any, ocurrencias: any[]): { fecha: string; hora?: string | null; lugar?: string | null } | null {
  if (!celebracion?.recurrente || !ocurrencias?.length) return null
  const hoyStr = new Date().toISOString().slice(0, 10)
  const futuras = [...ocurrencias].filter(o => o.fecha >= hoyStr).sort((a, b) => a.fecha.localeCompare(b.fecha))
  return futuras[0] || null
}

function getProgressLabel(pct: number, lang: string): string {
  if (pct === 100) return 'Cheers full!'
  if (pct >= 91) return lang === 'en' ? 'One last detail...' : 'Un último detalle...'
  if (pct >= 61) return lang === 'en' ? 'Almost ready!' : 'Casi lista la fiesta'
  if (pct >= 31) return lang === 'en' ? 'Taking shape!' : 'Ya va tomando forma'
  return lang === 'en' ? 'Start with the basics' : 'Empieza por lo básico'
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{ width: 36, height: 20, borderRadius: 99, border: 'none', padding: 0, background: on ? 'linear-gradient(135deg,#534AB7,#D4537E)' : '#d4d0e8', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
    </button>
  )
}

// Brief público, sin necesidad de cuenta
function VistaBrief({ celebracion, lang, locale, organizador, ocurrencias }: any) {
  const router = useRouter()
  const [nombreInvitado, setNombreInvitado] = useState('')
  const [asistencia, setAsistencia] = useState<'si' | 'no' | 'talvez' | ''>('')
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  async function confirmarSinCuenta() {
    if (!asistencia || !nombreInvitado.trim()) return
    setGuardando(true)
    await supabase.from('rsvps').insert({
      celebracion_slug: celebracion.slug,
      nombre: nombreInvitado.trim(),
      asistencia,
      mensaje: null,
    })
    fetch('/api/notificar-rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ celebracionSlug: celebracion.slug, nombreInvitado: nombreInvitado.trim(), asistencia, mensaje: null }),
    }).catch(() => {})
    setGuardando(false); setGuardado(true)
  }

  function irADesbloquear() {
    sessionStorage.setItem('redirect_after_login', window.location.pathname)
    router.push('/login')
  }

  const proxima = proximaOcurrencia(celebracion, ocurrencias)
  const fechaEfectiva = proxima?.fecha || celebracion.fecha
  const horaEfectiva = proxima?.hora || (celebracion.paradas || []).find((p: any) => p.id)?.hora
  const lugarNombre = proxima?.lugar || (celebracion.paradas || []).find((p: any) => p.id)?.lugar

  const fecha = fechaEfectiva
    ? new Date(fechaEfectiva).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null

  const rsvpColors = {
    si:     { bg: '#ECF7F0', active: '#1f8a5b', border: '#1f8a5b', label: lang === 'en' ? 'Going' : 'Voy' },
    no:     { bg: '#FFF0F0', active: '#c0392b', border: '#c0392b', label: lang === 'en' ? "Can't make it" : 'No puedo' },
    talvez: { bg: '#FFF4E6', active: '#c98a1e', border: '#c98a1e', label: lang === 'en' ? 'Maybe' : 'Tal vez' },
  }

  return (
    <div style={{ minHeight: '100vh', background: BG_INVITADO, fontFamily: FSYS }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 18px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 900, background: 'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Cheers</div>
        </div>
        {celebracion.portada_url && (
          <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 20, boxShadow: '0 16px 40px rgba(0,0,0,.3)' }}>
            <img src={celebracion.portada_url} alt="portada" style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
          </div>
        )}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,.7)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
            {lang === 'en' ? "You're invited" : 'Estás invitado'}
          </div>
          {celebracion.es_sorpresa && (organizador?.plan === 'lifetime' || organizador?.plan === 'pro' || celebracion.plan === 'pro') && (
            <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 800, color: '#fff', background: 'rgba(255,255,255,.18)', padding: '4px 12px', borderRadius: 99, marginBottom: 10 }}>
              🤫 {lang === 'en' ? 'Surprise!' : '¡Es sorpresa!'}
            </span>
          )}
          <h1 style={{ fontSize: 32, fontWeight: 850, color: '#fff', margin: '0 0 10px', letterSpacing: '-.5px', lineHeight: 1.1 }}>
            {celebracion.festejado_nombre
              ? (lang === 'en' ? `${celebracion.festejado_nombre}'s celebration` : `Celebración de ${celebracion.festejado_nombre}`)
              : celebracion.nombre}
          </h1>
          {fecha && <p style={{ fontSize: 14, color: 'rgba(255,255,255,.85)', margin: '0 0 4px' }}>{fecha}</p>}
          {lugarNombre && <p style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', margin: 0 }}>{lugarNombre}</p>}
          {fechaEfectiva && (() => {
            const { googleUrl, icsUrl } = calendarLinks(celebracion.nombre || 'Cheers', fechaEfectiva, horaEfectiva, lugarNombre, celebracion.recurrente ? { tipo: celebracion.recurrencia_tipo, diaSemana: celebracion.recurrencia_dia_semana, semanaMes: celebracion.recurrencia_semana_mes } : null)
            return (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
                <a href={googleUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,.15)', padding: '6px 12px', borderRadius: 99, textDecoration: 'none' }}>+ Google Calendar</a>
                <a href={icsUrl} download={`${celebracion.slug?.replace('/', '-') || 'evento'}.ics`} style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,.15)', padding: '6px 12px', borderRadius: 99, textDecoration: 'none' }}>+ Apple/Outlook</a>
              </div>
            )
          })()}
          {organizador?.nombre && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {organizador.avatar
                  ? <img src={organizador.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{organizador.nombre[0]?.toUpperCase()}</span>}
              </div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,.75)' }}>{lang === 'en' ? `Organized by ${organizador.nombre}` : `Organiza ${organizador.nombre}`}</span>
            </div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 24, padding: '24px 20px', marginBottom: 16, boxShadow: '0 12px 36px rgba(25,12,50,.22)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#2a2440', marginBottom: 16 }}>
            {guardado ? (lang === 'en' ? 'Thanks for letting us know!' : '¡Gracias por avisar!') : (lang === 'en' ? 'Will you be there?' : '¿Vas a ir?')}
          </div>
          {!guardado && (
            <>
              <input
                value={nombreInvitado}
                onChange={e => setNombreInvitado(e.target.value)}
                placeholder={lang === 'en' ? 'Your name' : 'Tu nombre'}
                style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #e2dff5', background: '#fff', fontFamily: FSYS, fontSize: 15, color: '#2a2440', padding: '12px 14px', borderRadius: 12, outline: 'none', marginBottom: 12 }}
              />
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                {(['si', 'no', 'talvez'] as const).map(op => {
                  const c = rsvpColors[op]
                  const sel = asistencia === op
                  return <button key={op} onClick={() => setAsistencia(op)} style={{ flex: 1, padding: '13px 8px', borderRadius: 14, border: sel ? `2px solid ${c.border}` : '2px solid #e8e4f5', background: sel ? c.bg : '#fafafa', color: sel ? c.active : '#7a7494', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FSYS, transition: 'all .15s' }}>{c.label}</button>
                })}
              </div>
              <button onClick={confirmarSinCuenta} disabled={!asistencia || !nombreInvitado.trim() || guardando} style={{ width: '100%', padding: '14px', background: (asistencia && nombreInvitado.trim()) ? 'linear-gradient(135deg,#534AB7,#D4537E)' : '#e8e4f5', border: 'none', borderRadius: 14, color: (asistencia && nombreInvitado.trim()) ? '#fff' : '#b3adcc', fontSize: 15, fontWeight: 800, cursor: (asistencia && nombreInvitado.trim()) ? 'pointer' : 'default', fontFamily: FSYS }}>
                {guardando ? '...' : (lang === 'en' ? 'Confirm attendance' : 'Confirmar asistencia')}
              </button>
            </>
          )}
        </div>

        <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: 24, padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#fff', margin: '0 0 12px', fontWeight: 600 }}>
            {lang === 'en' ? 'Want the full details? Address, gift list, and who else is going.' : '¿Quieres ver todos los detalles? Dirección exacta, lista de regalos y quién más va.'}
          </p>
          <button onClick={irADesbloquear} style={{ border: 'none', background: '#fff', color: '#534AB7', fontSize: 14, fontWeight: 800, padding: '12px 24px', borderRadius: 14, cursor: 'pointer', fontFamily: FSYS }}>
            {lang === 'en' ? 'Sign in to see more →' : 'Inicia sesión para ver más →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Vista del invitado
function VistaInvitado({ celebracion, user, lang, tx, locale, organizador, ocurrencias }: any) {
  const router = useRouter()
  const [asistencia, setAsistencia] = useState<'si' | 'no' | 'talvez' | ''>('')
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [rsvpExistente, setRsvpExistente] = useState<any>(null)
  const [confirmados, setConfirmados] = useState<any[]>([])
  const [nombreManual, setNombreManual] = useState('')

  useEffect(() => {
    if (user) {
      supabase.from('rsvps').select('*')
        .eq('celebracion_slug', celebracion.slug)
        .eq('nombre', user?.user_metadata?.name || user?.email || '')
        .single()
        .then(({ data }) => {
          if (data) { setRsvpExistente(data); setAsistencia(data.asistencia); setMensaje(data.mensaje || '') }
        })
    }
    supabase.from('rsvps').select('nombre')
      .eq('celebracion_slug', celebracion.slug)
      .eq('asistencia', 'si')
      .then(({ data }) => setConfirmados(data || []))
  }, [])

  async function guardarRsvp() {
    const nombre = user ? (user?.user_metadata?.name || user?.email || '') : nombreManual.trim()
    if (!asistencia || !nombre) return
    setGuardando(true)
    const payload = { celebracion_slug: celebracion.slug, nombre, asistencia, mensaje: mensaje.trim() || null }
    if (rsvpExistente) await supabase.from('rsvps').update(payload).eq('id', rsvpExistente.id)
    else await supabase.from('rsvps').insert(payload)
    fetch('/api/notificar-rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ celebracionSlug: celebracion.slug, nombreInvitado: nombre, asistencia, mensaje: mensaje.trim() || null }),
    }).catch(() => {})
    const { data } = await supabase.from('rsvps').select('nombre').eq('celebracion_slug', celebracion.slug).eq('asistencia', 'si')
    setConfirmados(data || [])
    setGuardando(false); setGuardado(true)
    setTimeout(() => setGuardado(false), 3000)
  }

  const paradas = (celebracion.paradas || []).filter((p: any) => p.id)
  const regalos = celebracion.gifts || []
  const tiles = celebracion.tiles_visibles || {}
  const proxima = proximaOcurrencia(celebracion, ocurrencias)
  const fechaEfectiva = proxima?.fecha || celebracion.fecha
  const horaEfectiva = proxima?.hora || paradas[0]?.hora
  const lugarEfectivo = proxima?.lugar || paradas[0]?.lugar
  const fecha = fechaEfectiva
    ? new Date(fechaEfectiva).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null

  const rsvpColors = {
    si:     { bg: '#ECF7F0', active: '#1f8a5b', border: '#1f8a5b', label: lang === 'en' ? 'Going' : 'Voy' },
    no:     { bg: '#FFF0F0', active: '#c0392b', border: '#c0392b', label: lang === 'en' ? "Can't make it" : 'No puedo' },
    talvez: { bg: '#FFF4E6', active: '#c98a1e', border: '#c98a1e', label: lang === 'en' ? 'Maybe' : 'Tal vez' },
  }

  return (
    <div style={{ minHeight: '100vh', background: BG_INVITADO, fontFamily: FSYS }}>
      <style>{`@keyframes sp2{0%,100%{opacity:0;transform:scale(.3)}50%{opacity:.8;transform:scale(1)}}`}</style>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {STARS.map((s, i) => <div key={i} style={{ position: 'absolute', top: s.top, left: s.left, fontSize: s.size, color: 'rgba(255,255,255,.4)', lineHeight: 1, animation: `sp2 ${s.dur} ease-in-out infinite ${s.delay}` }}>✦</div>)}
      </div>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto', padding: '32px 18px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 900, background: 'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Cheers</div>
        </div>
        {celebracion.portada_url && (
          <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 20, boxShadow: '0 16px 40px rgba(0,0,0,.3)' }}>
            <img src={celebracion.portada_url} alt="portada" style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
          </div>
        )}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,.7)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
            {lang === 'en' ? "You're invited" : 'Estás invitado'}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 850, color: '#fff', margin: '0 0 10px', letterSpacing: '-.5px', lineHeight: 1.1 }}
            dangerouslySetInnerHTML={{ __html: celebracion.nombre_html || celebracion.nombre }} />
          {celebracion.tagline && <p style={{ fontSize: 15, color: 'rgba(255,255,255,.8)', margin: '0 0 10px', fontStyle: 'italic' }}>{celebracion.tagline}</p>}
          {fecha && <p style={{ fontSize: 14, color: 'rgba(255,255,255,.85)', margin: '0 0 4px' }}>{fecha}</p>}
          {lugarEfectivo && <a href={`https://maps.google.com/?q=${encodeURIComponent(lugarEfectivo)}`} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,.3)' }}>{lugarEfectivo} →</a>}
          {fechaEfectiva && (() => {
            const { googleUrl, icsUrl } = calendarLinks(celebracion.nombre || 'Cheers', fechaEfectiva, horaEfectiva, lugarEfectivo, celebracion.recurrente ? { tipo: celebracion.recurrencia_tipo, diaSemana: celebracion.recurrencia_dia_semana, semanaMes: celebracion.recurrencia_semana_mes } : null)
            return (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
                <a href={googleUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,.15)', padding: '6px 12px', borderRadius: 99, textDecoration: 'none' }}>
                  {lang === 'en' ? '+ Google Calendar' : '+ Google Calendar'}
                </a>
                <a href={icsUrl} download={`${celebracion.slug?.replace('/', '-') || 'evento'}.ics`} style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,.15)', padding: '6px 12px', borderRadius: 99, textDecoration: 'none' }}>
                  {lang === 'en' ? '+ Apple/Outlook' : '+ Apple/Outlook'}
                </a>
              </div>
            )
          })()}
          {celebracion.festejado_nombre && <p style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', margin: '4px 0 0' }}>{lang === 'en' ? `For ${celebracion.festejado_nombre}` : `Para ${celebracion.festejado_nombre}`}</p>}
          {organizador?.nombre && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {organizador.avatar
                  ? <img src={organizador.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{organizador.nombre[0]?.toUpperCase()}</span>}
              </div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,.75)' }}>{lang === 'en' ? `Organized by ${organizador.nombre}` : `Organiza ${organizador.nombre}`}</span>
            </div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 24, padding: '24px 20px', marginBottom: 16, boxShadow: '0 12px 36px rgba(25,12,50,.22)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#2a2440', marginBottom: 16 }}>
            {rsvpExistente ? (lang === 'en' ? 'Your RSVP' : 'Tu confirmación') : (lang === 'en' ? 'Will you be there?' : '¿Vas a ir?')}
          </div>
          {!user && (
            <input
              value={nombreManual}
              onChange={e => setNombreManual(e.target.value)}
              placeholder={lang === 'en' ? 'Your name' : 'Tu nombre'}
              style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #e2dff5', background: '#fff', fontFamily: FSYS, fontSize: 15, color: '#2a2440', padding: '12px 14px', borderRadius: 12, outline: 'none', marginBottom: 12 }}
            />
          )}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {(['si', 'no', 'talvez'] as const).map(op => {
              const c = rsvpColors[op]
              const sel = asistencia === op
              return <button key={op} onClick={() => setAsistencia(op)} style={{ flex: 1, padding: '13px 8px', borderRadius: 14, border: sel ? `2px solid ${c.border}` : '2px solid #e8e4f5', background: sel ? c.bg : '#fafafa', color: sel ? c.active : '#7a7494', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FSYS, transition: 'all .15s' }}>{c.label}</button>
            })}
          </div>
          {tiles.mensajes !== false && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#a39ec0', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>
                {lang === 'en' ? `Message for ${celebracion.festejado_nombre || 'the guest of honor'}` : `Mensaje para ${celebracion.festejado_nombre || 'el festejado'}`}
              </div>
              <textarea value={mensaje} onChange={e => setMensaje(e.target.value)} placeholder={lang === 'en' ? 'Write something nice...' : 'Escribe algo bonito...'} rows={3} style={{ border: '1.5px solid #e2dff5', background: '#fff', fontFamily: FSYS, fontSize: 15, color: '#2a2440', padding: '10px 14px', borderRadius: 12, outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'none', lineHeight: 1.5 }} />
            </div>
          )}
          <button onClick={guardarRsvp} disabled={!asistencia || guardando || (!user && !nombreManual.trim())} style={{ width: '100%', padding: '14px', background: asistencia ? 'linear-gradient(135deg,#534AB7,#D4537E)' : '#e8e4f5', border: 'none', borderRadius: 14, color: asistencia ? '#fff' : '#b3adcc', fontSize: 15, fontWeight: 800, cursor: asistencia ? 'pointer' : 'default', fontFamily: FSYS }}>
            {guardando ? '...' : guardado ? (lang === 'en' ? '✓ Confirmed!' : '✓ ¡Confirmado!') : rsvpExistente ? (lang === 'en' ? 'Update RSVP' : 'Actualizar') : (lang === 'en' ? 'Confirm attendance' : 'Confirmar asistencia')}
          </button>
        </div>

        {confirmados.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 24, padding: '24px 20px', marginBottom: 16, boxShadow: '0 12px 36px rgba(25,12,50,.22)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#2a2440', marginBottom: 14 }}>
              {lang === 'en'
                ? `${confirmados.length} ${confirmados.length === 1 ? 'person is' : 'people are'} going`
                : `${confirmados.length} ${confirmados.length === 1 ? 'persona va' : 'personas van'}`}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
              {confirmados.map((c, i) => (
                <span key={i} style={{ fontSize: 13, fontWeight: 700, color: '#534AB7', background: '#EEEDFE', padding: '6px 14px', borderRadius: 99 }}>{c.nombre}</span>
              ))}
            </div>
          </div>
        )}

        {paradas.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 24, padding: '24px 20px', marginBottom: 16, boxShadow: '0 12px 36px rgba(25,12,50,.22)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#2a2440', marginBottom: 16 }}>{lang === 'en' ? 'The plan' : 'El plan'}</div>
            {paradas.map((p: any, i: number) => (
              <div key={p.id} style={{ display: 'flex', gap: 14, marginBottom: i < paradas.length - 1 ? 14 : 0, paddingBottom: i < paradas.length - 1 ? 14 : 0, borderBottom: i < paradas.length - 1 ? '1px solid #f0edf8' : 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#2a2440' }}>{p.lugar}</div>
                  {p.hora && <div style={{ fontSize: 12, color: '#534AB7', fontWeight: 600, marginTop: 1 }}>{p.hora}</div>}
                  {p.nota && <div style={{ fontSize: 12, color: '#a39ec0', marginTop: 1 }}>{p.nota}</div>}
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(p.lugar)}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, color: '#1a73e8', textDecoration: 'none', display: 'inline-block', marginTop: 3 }}>{lang === 'en' ? 'See on Maps →' : 'Ver en Maps →'}</a>
                </div>
              </div>
            ))}
          </div>
        )}

        {regalos.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 24, padding: '24px 20px', marginBottom: 16, boxShadow: '0 12px 36px rgba(25,12,50,.22)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#2a2440', marginBottom: 16 }}>{lang === 'en' ? 'Gift ideas' : 'Ideas de regalo'}</div>
            {regalos.map((r: any) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: r.reservado ? '#f0faf4' : '#fafafa', borderRadius: 12, marginBottom: 8, border: r.reservado ? '1.5px solid #d8f3dc' : '1.5px solid #f0edf8' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: r.reservado ? '#1f8a5b' : '#2a2440', textDecoration: r.reservado ? 'line-through' : 'none' }}>{r.nombre}</div>
                  {r.precio && <div style={{ fontSize: 11, color: '#a39ec0' }}>${r.precio}</div>}
                </div>
                {r.reservado ? <span style={{ fontSize: 11, fontWeight: 700, color: '#1f8a5b', background: '#d8f3dc', padding: '3px 10px', borderRadius: 99 }}>{lang === 'en' ? 'Reserved' : 'Reservado'}</span>
                  : r.link && <a href={r.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 800, color: '#534AB7', background: '#EEEDFE', padding: '5px 12px', borderRadius: 99, textDecoration: 'none' }}>{lang === 'en' ? 'See →' : 'Ver →'}</a>}
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>{lang === 'en' ? 'Organized with' : 'Organizado con'}</div>
          <div style={{ fontSize: 18, fontWeight: 900, background: 'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Cheers</div>
          <button onClick={() => router.push('/')} style={{ marginTop: 8, border: 'none', background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 99, cursor: 'pointer', fontFamily: FSYS }}>
            {lang === 'en' ? 'Create your own →' : 'Crea el tuyo →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Componente Tile con resize
function ResizableTile({
  layout, totalRows, containerWidth, isMobile, te, tx, lang, children, tileLabel, info,
  onResizeEnd, onDragStart, onDragEnd, onDrop, isDragging, isDragOver, visible, onToggleVisible
}: {
  layout: TileLayout; totalRows: number; containerWidth: number; isMobile: boolean;
  te: any; tx: any; lang: string; children: React.ReactNode; tileLabel: string; info: any;
  onResizeEnd: (colSpan: number, rowSpan: number) => void;
  onDragStart: () => void; onDragEnd: () => void; onDrop: () => void;
  isDragging: boolean; isDragOver: boolean; visible: boolean; onToggleVisible: () => void;
}) {
  const resizingRef = useRef(false)
  const startRef = useRef({ x: 0, y: 0, colSpan: 0, rowSpan: 0 })
  const colW = (containerWidth + GAP) / COLS

  function startResize(e: React.MouseEvent | React.TouchEvent) {
    e.stopPropagation()
    e.preventDefault()
    resizingRef.current = true
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    startRef.current = { x: clientX, y: clientY, colSpan: layout.colSpan, rowSpan: layout.rowSpan }

    const onMove = (ev: MouseEvent | TouchEvent) => {
      if (!resizingRef.current) return
      const cx = 'touches' in ev ? ev.touches[0].clientX : ev.clientX
      const cy = 'touches' in ev ? ev.touches[0].clientY : ev.clientY
      const dx = cx - startRef.current.x
      const dy = cy - startRef.current.y
      const newColSpan = Math.max(isMobile ? 12 : 3, Math.min(12, Math.round(startRef.current.colSpan + dx / colW)))
      const newRowSpan = Math.max(2, Math.min(12, Math.round(startRef.current.rowSpan + dy / (ROW_H + GAP))))
      onResizeEnd(newColSpan, newRowSpan)
    }

    const onUp = () => {
      resizingRef.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
  }

  return (
    <div
      draggable={!resizingRef.current}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={e => e.preventDefault()}
      onDrop={onDrop}
      style={{
        gridColumn: isMobile ? undefined : `${layout.col} / span ${layout.colSpan}`,
        gridRow: isMobile ? undefined : `${layout.row} / span ${layout.rowSpan}`,
        minHeight: isMobile ? `${layout.rowSpan * (ROW_H + GAP)}px` : undefined,
        marginBottom: isMobile ? GAP : 0,
        background: isDragOver && !isDragging ? 'transparent' : te.tileBg,
        borderRadius: 18,
        border: isDragOver && !isDragging ? '2.5px dashed rgba(83,74,183,.5)' : 'none',
        boxShadow: isDragOver && !isDragging ? 'none' : '0 6px 20px rgba(25,12,50,.1)',
        opacity: isDragging ? 0.4 : visible ? 1 : 0.55,
        overflow: 'hidden',
        transition: 'opacity .2s, box-shadow .2s',
        color: te.tileText,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header del tile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px 8px', flexShrink: 0 }}>
        <span style={{ cursor: 'grab', color: '#c8c2e0', fontSize: 14, userSelect: 'none' }}>⠿</span>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: te.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: te.accentText }}>{info.label}</span>
        </div>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 800, color: te.tileText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{tileLabel}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 10, color: '#a39ec0', fontWeight: 600 }}>{visible ? (tx.visible || 'Visible') : (tx.hidden || 'Oculto')}</span>
          <Toggle on={visible} onToggle={onToggleVisible} />
        </div>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, padding: '0 14px 14px', overflowY: 'auto' }}>
        {children}
      </div>

      {/* Handle de resize */}
      <div
        onMouseDown={startResize}
        onTouchStart={startResize}
        style={{
          position: 'absolute', bottom: 0, right: 0, width: 20, height: 20,
          cursor: 'nwse-resize', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
          padding: '3px', userSelect: 'none', zIndex: 10,
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M9 1L1 9M9 5L5 9M9 9H5" stroke={te.accentText === '#fff' ? 'rgba(255,255,255,.4)' : 'rgba(83,74,183,.4)'} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  )
}

export default function EventoPage({ params }: { params: Promise<{ usuario: string; evento: string }> }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const saveTimeout = useRef<any>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const [tx, setTx] = useState(t.es)
  const [lang, setLang] = useState('es')
  const [locale, setLocale] = useState('es-MX')
  const [celebracion, setCelebracion] = useState<any>(null)
  const [organizadorPlan, setOrganizadorPlan] = useState<string>('free')
  const [comprandoPro, setComprandoPro] = useState(false)
  const [activandoPro, setActivandoPro] = useState(false)
  const [bloqueoPro, setBloqueoPro] = useState<string | null>(null)
  const [organizadorInfo, setOrganizadorInfo] = useState<{ nombre: string; avatar: string | null; plan?: string } | null>(null)
  const cuentaEsLifetime = organizadorPlan === 'lifetime'
  const eventoEsPro = cuentaEsLifetime || celebracion?.plan === 'pro' || organizadorPlan === 'pro'
  const limiteInvitados = cuentaEsLifetime ? Infinity : eventoEsPro ? 10 : 3
  const limiteRegalos = eventoEsPro ? Infinity : 1
  const limiteParadas = eventoEsPro ? Infinity : 1
  const [rsvps, setRsvps] = useState<any[]>([])
  const [invitadosList, setInvitadosList] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [rol, setRol] = useState<'organizador' | 'invitado' | 'brief' | 'sin_acceso' | null>(null)
  const [user, setUser] = useState<any>(null)

  const [tagline, setTagline] = useState('')
  const [festejado, setFestejado] = useState('')
  const [fecha, setFecha] = useState('')
  const [recordatorioDias, setRecordatorioDias] = useState<number[]>([7])
  const [lugar, setLugar] = useState('')
  const [portadaUrl, setPortadaUrl] = useState<string | null>(null)
  const [subiendoPortada, setSubiendoPortada] = useState(false)
  const [imgPosition, setImgPosition] = useState('center')
  const [showLightbox, setShowLightbox] = useState(false)

  const [layouts, setLayouts] = useState<TileLayout[]>([])
  const [tilesVisibles, setTilesVisibles] = useState<Record<string, boolean>>(DEFAULT_TILES_VISIBLES)
  const [tema, setTema] = useState('morado')
  const [fuente, setFuente] = useState('system')
  const [tituloEstilo, setTituloEstilo] = useState<TituloEstilo>('normal-left')
  const [tituloSize, setTituloSize] = useState(23)
  const [showCustomize, setShowCustomize] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [lifetimeExpanded, setLifetimeExpanded] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [containerWidth, setContainerWidth] = useState(800)

  const [showAddInvitado, setShowAddInvitado] = useState(false)
  const [nuevoInvitado, setNuevoInvitado] = useState('')
  const [guardandoInvitado, setGuardandoInvitado] = useState(false)
  const [showWAPrompt, setShowWAPrompt] = useState(false)
  const [mostrarQR, setMostrarQR] = useState(false)
  const [mostrarRecordatorios, setMostrarRecordatorios] = useState(false)
  const [ocurrencias, setOcurrencias] = useState<{ id: string; fecha: string; hora: string | null; lugar: string | null }[]>([])
  const [waPhone, setWaPhone] = useState('')
  const [invitadoPendienteWA, setInvitadoPendienteWA] = useState<any>(null)

  const [regalos, setRegalos] = useState<any[]>([])
  const [showAddRegalo, setShowAddRegalo] = useState(false)
  const [nuevoRegalo, setNuevoRegalo] = useState({ nombre: '', precio: '', link: '' })
  const [paradas, setParadas] = useState<any[]>([])
  const [showAddParada, setShowAddParada] = useState(false)
  const [nuevaParada, setNuevaParada] = useState({ lugar: '', hora: '', nota: '' })
  const [quellevar, setQuellevar] = useState<any[]>([])
  const [showAddItem, setShowAddItem] = useState(false)
  const [nuevoItem, setNuevoItem] = useState('')
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [showAddPlato, setShowAddPlato] = useState(false)
  const [nuevoPlato, setNuevoPlato] = useState({ nombre: '', quien: '' })
  const [presupuesto, setPresupuesto] = useState<any[]>([])
  const [showAddGasto, setShowAddGasto] = useState(false)
  const [nuevoGasto, setNuevoGasto] = useState({ nombre: '', monto: '', quien: '' })

  useEffect(() => {
    const l = getLang(); setLang(l); setTx(t[l]); setLocale(l === 'en' ? 'en-US' : 'es-MX')
    const check = () => {
      setIsMobile(window.innerWidth < 600)
      if (gridRef.current) setContainerWidth(gridRef.current.offsetWidth)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    params.then(async ({ usuario, evento }) => {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      let cel: any = null
      const fullSlug = `${usuario}/${evento}`
      const { data: d1 } = await supabase.rpc('get_celebracion_por_slug', { p_slug: fullSlug })
      if (d1) cel = d1
      if (!cel) {
        const { data: d2 } = await supabase.rpc('get_celebracion_por_slug', { p_slug: evento })
        if (d2) cel = d2
      }

      if (!cel) { setRol('sin_acceso'); setCargando(false); return }

      if (!authUser) {
        // El brief (sin cuenta) siempre está disponible, sin excepción, sin importar el plan del organizador
        if (cel.organizador_id) {
          const { data: perfilOrg } = await supabase.from('perfiles').select('plan, nombre_completo, avatar_url').eq('user_id', cel.organizador_id).single()
          if (perfilOrg) setOrganizadorInfo({ nombre: perfilOrg.nombre_completo || '', avatar: perfilOrg.avatar_url || null, plan: perfilOrg.plan })
        }
        setCelebracion(cel)
        setRol('brief')
        setCargando(false)
        return
      }

      setUser(authUser)

      if (cel.organizador_id === authUser.id) {
        setRol('organizador')
      } else {
        let inv: any = null
        const { data: invPorId } = await supabase.from('invitados').select('*').eq('celebracion_slug', cel.slug).eq('user_id', authUser.id).single()
        if (invPorId) {
          inv = invPorId
          setRol('invitado')
        } else {
          const { data: invPorEmail } = await supabase.from('invitados').select('*').eq('celebracion_slug', cel.slug).eq('email', authUser.email || '').is('user_id', null).single()
          if (invPorEmail) {
            // Ya estaba pre-agregado por nombre/email; al reclamarlo con su cuenta queda desbloqueado
            const nombreReal = authUser.user_metadata?.name
            const update: any = { user_id: authUser.id }
            if (nombreReal && invPorEmail.nombre === invPorEmail.email) update.nombre = nombreReal
            await supabase.from('invitados').update(update).eq('id', invPorEmail.id)
            inv = { ...invPorEmail, ...update }
            setRol('invitado')
          } else {
            const { data: perfilOrgCheck } = await supabase.from('perfiles').select('plan').eq('user_id', cel.organizador_id).single()
            const planOrganizador = perfilOrgCheck?.plan || 'free'

            if (planOrganizador !== 'lifetime') {
              // Free/Pro: cualquiera con cuenta puede desbloquear detalles, sin tope (como ya funcionaba)
              const { data: nuevoInv } = await supabase.from('invitados').insert({
                celebracion_slug: cel.slug,
                email: authUser.email || null,
                nombre: authUser.user_metadata?.name || authUser.email || '',
                user_id: authUser.id,
                created_at: new Date().toISOString(),
              }).select().single()
              inv = nuevoInv
              setRol(inv ? 'invitado' : 'brief')
            } else {
              // Lifetime: los primeros 10 que inicien sesión en este evento se desbloquean solos ("regalo" del organizador)
              const { data: yaDesbloqueados } = await supabase.rpc('contar_desbloqueados', { p_slug: cel.slug })
              if ((yaDesbloqueados ?? 0) < 10) {
                const { data: nuevoInv } = await supabase.from('invitados').insert({
                  celebracion_slug: cel.slug,
                  email: authUser.email || null,
                  nombre: authUser.user_metadata?.name || authUser.email || '',
                  user_id: authUser.id,
                  created_at: new Date().toISOString(),
                }).select().single()
                inv = nuevoInv
                setRol(inv ? 'invitado' : 'brief')
              } else {
                // Cupo lleno: solo se desbloquea si SU PROPIA cuenta ya es Lifetime (no consume cupo del organizador, no se registra como invitado)
                const { data: perfilPropio } = await supabase.from('perfiles').select('plan').eq('user_id', authUser.id).single()
                setRol(perfilPropio?.plan === 'lifetime' ? 'invitado' : 'brief')
              }
            }
          }
        }
      }

      setCelebracion(cel)
      if (cel.organizador_id) {
        const { data: perfilOrg } = await supabase.from('perfiles').select('plan, nombre_completo, avatar_url').eq('user_id', cel.organizador_id).single()
        if (perfilOrg?.plan) setOrganizadorPlan(perfilOrg.plan)
        if (perfilOrg) setOrganizadorInfo({ nombre: perfilOrg.nombre_completo || '', avatar: perfilOrg.avatar_url || null, plan: perfilOrg.plan })
      }
      setTagline(cel.tagline || '')
      setFestejado(cel.festejado_nombre || '')
      setFecha(cel.fecha || '')
      setRecordatorioDias(Array.isArray(cel.recordatorio_dias) ? cel.recordatorio_dias : [7])
      setLugar(cel.paradas?.[0]?.lugar || '')
      setPortadaUrl(cel.portada_url || null)
      setParadas(cel.paradas || [])
      setRegalos(cel.gifts || [])
      setQuellevar(cel.quellevar || [])
      setMenuItems(cel.menu || [])
      setPresupuesto(cel.presupuesto || [])

      if (cel.tile_layouts) {
        try { setLayouts(JSON.parse(cel.tile_layouts)) } catch { setLayouts(defaultLayouts(cel.tipo, cel.sub_tipo)) }
      } else {
        setLayouts(defaultLayouts(cel.tipo, cel.sub_tipo))
      }

      setTilesVisibles({ ...DEFAULT_TILES_VISIBLES, ...(cel.tiles_visibles || {}) })
      if (cel.tema) setTema(cel.tema)
      if (cel.fuente) setFuente(cel.fuente)
      if (cel.titulo_align) setTituloEstilo(cel.titulo_align as TituloEstilo)
      if (cel.titulo_size) setTituloSize(cel.titulo_size)

      const { data: rsvpData } = await supabase.from('rsvps').select('*').eq('celebracion_slug', cel.slug).order('created_at', { ascending: false })
      setRsvps(rsvpData || [])
      const { data: invData } = await supabase.from('invitados').select('*').eq('celebracion_slug', cel.slug).order('created_at', { ascending: false })
      setInvitadosList(invData || [])
      setCargando(false)

      setTimeout(() => { if (titleRef.current) titleRef.current.innerHTML = cel.nombre_html || cel.nombre || '' }, 100)
    })
  }, [])

  useEffect(() => {
    if (!celebracion || rol !== 'organizador') return
    const compra = new URLSearchParams(window.location.search).get('compra')
    if (compra !== 'exitosa') return
    setActivandoPro(true)
    let intentos = 0
    const interval = setInterval(async () => {
      intentos++
      const { data } = await supabase.from('celebraciones').select('*').eq('slug', celebracion.slug).single()
      if (data?.plan === 'pro' || intentos >= 6) {
        if (data) setCelebracion(data)
        clearInterval(interval)
        setActivandoPro(false)
        window.history.replaceState({}, '', `/${celebracion.slug}`)
      }
    }, 1500)
    return () => clearInterval(interval)
  }, [celebracion?.slug, rol])

  const saveTitleHtml = useCallback(() => {
    if (!celebracion || !titleRef.current) return
    supabase.from('celebraciones').update({ nombre_html: titleRef.current.innerHTML, nombre: titleRef.current.innerText }).eq('slug', celebracion.slug)
  }, [celebracion])

  function applyFormat(cmd: string) { titleRef.current?.focus(); document.execCommand(cmd, false); setTimeout(saveTitleHtml, 100) }

  function saveLayouts(newLayouts: TileLayout[]) {
    setLayouts(newLayouts)
    if (celebracion) supabase.from('celebraciones').update({ tile_layouts: JSON.stringify(newLayouts) }).eq('slug', celebracion.slug)
  }

  function moveLayout(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return
    const next = [...layouts]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    saveLayouts(packLayouts(next))
  }

  function resizeLayout(idx: number, colSpan: number, rowSpan: number) {
    const next = layouts.map((l, i) => i === idx ? { ...l, colSpan, rowSpan } : l)
    saveLayouts(packLayouts(next))
  }

  async function toggleVisible(key: string) {
    const nuevo = { ...tilesVisibles, [key]: !tilesVisibles[key] }
    setTilesVisibles(nuevo)
    if (celebracion) await supabase.from('celebraciones').update({ tiles_visibles: nuevo }).eq('slug', celebracion.slug)
  }

  async function guardarCampo(campo: string, valor: any) {
    if (!celebracion) return
    const { error } = await supabase.from('celebraciones').update({ [campo]: valor }).eq('slug', celebracion.slug)
    if (error && ['tema', 'fuente', 'titulo_align', 'titulo_size'].includes(campo)) {
      setBloqueoPro(tx.customize_locked_title)
      const { data } = await supabase.from('celebraciones').select('*').eq('slug', celebracion.slug).single()
      if (data) {
        setCelebracion(data)
        if (data.tema) setTema(data.tema)
        if (data.fuente) setFuente(data.fuente)
        if (data.titulo_align) setTituloEstilo(data.titulo_align)
        if (data.titulo_size) setTituloSize(data.titulo_size)
      }
    }
    if (error && campo === 'recordatorio_dias') {
      setBloqueoPro(tx.reminder_locked_title)
      const { data } = await supabase.from('celebraciones').select('recordatorio_dias').eq('slug', celebracion.slug).single()
      setRecordatorioDias(Array.isArray(data?.recordatorio_dias) ? data.recordatorio_dias : [7])
    }
  }

  useEffect(() => {
    if (!celebracion?.recurrente || !celebracion?.slug) { setOcurrencias([]); return }

    async function cargarOcurrencias() {
      if (rol === 'organizador') {
        const { data } = await supabase
          .from('ocurrencias')
          .select('id, fecha, hora, lugar')
          .eq('celebracion_slug', celebracion.slug)
          .eq('cancelada', false)
          .order('fecha', { ascending: true })
        setOcurrencias(data || [])
      } else if (rol === 'invitado' || rol === 'brief') {
        const { data } = await supabase.rpc('get_ocurrencias_por_slug', { p_slug: celebracion.slug })
        const lista = (data || []).map((o: any, i: number) => ({ id: String(i), fecha: o.fecha, hora: o.hora, lugar: o.lugar }))
        setOcurrencias(rol === 'brief' ? lista.slice(0, 1) : lista)
      }
    }
    cargarOcurrencias()
  }, [celebracion?.slug, celebracion?.recurrente, rol])

  async function actualizarOcurrencia(id: string, campo: 'lugar' | 'hora', valor: string) {
    await supabase.from('ocurrencias').update({ [campo]: valor || null }).eq('id', id)
    setOcurrencias(prev => prev.map(o => o.id === id ? { ...o, [campo]: valor || null } : o))
  }

  async function cancelarOcurrencia(id: string) {
    await supabase.from('ocurrencias').update({ cancelada: true }).eq('id', id)
    setOcurrencias(prev => prev.filter(o => o.id !== id))
  }

  async function guardarLugar(val: string) {
    if (!celebracion) return
    const ps = [...paradas]
    if (ps.length > 0) ps[0].lugar = val; else ps.push({ lugar: val, hora: '', nota: '' })
    setParadas(ps); await supabase.from('celebraciones').update({ paradas: ps }).eq('slug', celebracion.slug)
  }

  async function subirPortada(file: File) {
    if (!file || !celebracion || !file.type.startsWith('image/')) return
    setSubiendoPortada(true)
    const ext = file.name.split('.').pop()
    const path = `${celebracion.slug.replace('/', '-')}-portada.${ext}`
    const { error } = await supabase.storage.from('portadas').upload(path, file, { upsert: true })
    if (error) { setSubiendoPortada(false); return }
    const { data: { publicUrl } } = supabase.storage.from('portadas').getPublicUrl(path)
    await supabase.from('celebraciones').update({ portada_url: publicUrl }).eq('slug', celebracion.slug)
    setPortadaUrl(publicUrl); setSubiendoPortada(false)
  }

  async function agregarInvitado() {
    if (!nuevoInvitado.trim() || !celebracion || invitadosList.length >= limiteInvitados) return
    setGuardandoInvitado(true)
    const isPhone = /^\+?[\d\s\-()]{7,}$/.test(nuevoInvitado.trim()) && !nuevoInvitado.includes('@')
    const row = { celebracion_slug: celebracion.slug, email: nuevoInvitado.includes('@') ? nuevoInvitado.trim() : null, nombre: nuevoInvitado.trim(), user_id: null, created_at: new Date().toISOString() }
    const { data } = await supabase.from('invitados').insert(row).select().single()
    if (data) { setInvitadosList(prev => [...prev, data]); if (isPhone) { setInvitadoPendienteWA(data); setWaPhone(nuevoInvitado.trim()); setShowWAPrompt(true) } }
    setNuevoInvitado(''); setGuardandoInvitado(false); setShowAddInvitado(false)
  }

  async function borrarInvitado(id: string) {
    if (!confirm(lang === 'en' ? 'Remove this guest?' : '¿Quitar a este invitado?')) return
    await supabase.from('invitados').delete().eq('id', id)
    setInvitadosList(prev => prev.filter(i => i.id !== id))
  }

  async function comprarPro() {
    if (!celebracion || comprandoPro) return
    setComprandoPro(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: session?.access_token, tipo: 'pro', slug: celebracion.slug }),
    })
    const data = await res.json()
    if (res.ok && data.url) {
      window.location.href = data.url
    } else {
      setComprandoPro(false)
      alert(lang === 'en' ? 'Something went wrong, please try again.' : 'Algo salió mal, intenta de nuevo.')
    }
  }

  function enviarWA(nombre?: string, phone?: string) {
    const shareUrl = `https://joincheers.app/${celebracion?.slug}`
    const greeting = nombre ? `¡Hola ${nombre}! ` : '¡Hola! '
    const msg = encodeURIComponent(`${greeting}Te invito a ${titleRef.current?.innerText || celebracion?.nombre || ''}. Aquí está todo el plan: ${shareUrl}`)
    const p = (phone || waPhone).replace(/[^\d+]/g, '')
    window.open(p ? `https://wa.me/${p}?text=${msg}` : `https://wa.me/?text=${msg}`, '_blank')
    setShowWAPrompt(false); setWaPhone('')
  }

  async function agregarRegalo() {
    if (!nuevoRegalo.nombre.trim() || !celebracion || regalos.length >= limiteRegalos) return
    const anterior = regalos
    const nuevo = [...regalos, { id: Date.now().toString(), nombre: nuevoRegalo.nombre.trim(), precio: nuevoRegalo.precio, link: nuevoRegalo.link, reservado: false }]
    setRegalos(nuevo)
    const { error } = await supabase.from('celebraciones').update({ gifts: nuevo }).eq('slug', celebracion.slug)
    if (error) { setRegalos(anterior); setBloqueoPro(tx.gift_limit_title); return }
    setNuevoRegalo({ nombre: '', precio: '', link: '' }); setShowAddRegalo(false)
  }

  async function toggleRegalo(id: string) {
    const nuevo = regalos.map(r => r.id === id ? { ...r, reservado: !r.reservado } : r)
    setRegalos(nuevo); await supabase.from('celebraciones').update({ gifts: nuevo }).eq('slug', celebracion.slug)
  }

  async function borrarRegalo(id: string) {
    const nuevo = regalos.filter(r => r.id !== id)
    setRegalos(nuevo); await supabase.from('celebraciones').update({ gifts: nuevo }).eq('slug', celebracion.slug)
  }

  async function agregarParada() {
    if (!nuevaParada.lugar.trim() || !celebracion || paradas.filter(p => p.id).length >= limiteParadas) return
    const anterior = paradas
    const nuevo = [...paradas, { id: Date.now().toString(), ...nuevaParada }]
    setParadas(nuevo)
    const { error } = await supabase.from('celebraciones').update({ paradas: nuevo }).eq('slug', celebracion.slug)
    if (error) { setParadas(anterior); setBloqueoPro(tx.stop_limit_title); return }
    setNuevaParada({ lugar: '', hora: '', nota: '' }); setShowAddParada(false)
  }

  async function borrarParada(id: string) {
    const nuevo = paradas.filter(p => p.id !== id)
    setParadas(nuevo); await supabase.from('celebraciones').update({ paradas: nuevo }).eq('slug', celebracion.slug)
  }

  async function agregarItem() {
    if (!nuevoItem.trim() || !celebracion) return
    const nuevo = [...quellevar, { id: Date.now().toString(), nombre: nuevoItem.trim(), listo: false }]
    setQuellevar(nuevo); await supabase.from('celebraciones').update({ quellevar: nuevo }).eq('slug', celebracion.slug)
    setNuevoItem(''); setShowAddItem(false)
  }

  async function toggleItem(id: string) {
    const nuevo = quellevar.map(i => i.id === id ? { ...i, listo: !i.listo } : i)
    setQuellevar(nuevo); await supabase.from('celebraciones').update({ quellevar: nuevo }).eq('slug', celebracion.slug)
  }

  async function borrarItem(id: string) {
    const nuevo = quellevar.filter(i => i.id !== id)
    setQuellevar(nuevo); await supabase.from('celebraciones').update({ quellevar: nuevo }).eq('slug', celebracion.slug)
  }

  async function agregarPlato() {
    if (!nuevoPlato.nombre.trim() || !celebracion) return
    const nuevo = [...menuItems, { id: Date.now().toString(), nombre: nuevoPlato.nombre.trim(), quien: nuevoPlato.quien }]
    setMenuItems(nuevo); await supabase.from('celebraciones').update({ menu: nuevo }).eq('slug', celebracion.slug)
    setNuevoPlato({ nombre: '', quien: '' }); setShowAddPlato(false)
  }

  async function borrarPlato(id: string) {
    const nuevo = menuItems.filter(p => p.id !== id)
    setMenuItems(nuevo); await supabase.from('celebraciones').update({ menu: nuevo }).eq('slug', celebracion.slug)
  }

  async function agregarGasto() {
    if (!nuevoGasto.nombre.trim() || !nuevoGasto.monto || !celebracion) return
    const nuevo = [...presupuesto, { id: Date.now().toString(), nombre: nuevoGasto.nombre.trim(), monto: parseFloat(nuevoGasto.monto), quien: nuevoGasto.quien }]
    setPresupuesto(nuevo); await supabase.from('celebraciones').update({ presupuesto: nuevo }).eq('slug', celebracion.slug)
    setNuevoGasto({ nombre: '', monto: '', quien: '' }); setShowAddGasto(false)
  }

  async function borrarGasto(id: string) {
    const nuevo = presupuesto.filter(g => g.id !== id)
    setPresupuesto(nuevo); await supabase.from('celebraciones').update({ presupuesto: nuevo }).eq('slug', celebracion.slug)
  }

  if (cargando) return (
    <div style={{ minHeight: '100vh', background: TEMAS.morado.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#EEEDFE', fontSize: 16 }}>{t[lang as 'es' | 'en'].loading}</p>
    </div>
  )

  if (rol === 'sin_acceso') return (
    <div style={{ minHeight: '100vh', background: BG_INVITADO, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FSYS }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '2.5rem', maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 900, background: 'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 16 }}>Cheers</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1c1830', marginBottom: 8 }}>{lang === 'en' ? 'Not on the list' : 'No estás en la lista'}</div>
        <p style={{ fontSize: 14, color: '#6b6585', margin: '0 0 20px' }}>{lang === 'en' ? "You don't have access to this celebration." : 'No tienes acceso a esta celebración.'}</p>
        <button onClick={() => router.push('/')} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 15, fontWeight: 700, padding: '12px 24px', borderRadius: 14, cursor: 'pointer' }}>
          {lang === 'en' ? 'Go home' : 'Ir al inicio'}
        </button>
      </div>
    </div>
  )

  if (rol === 'brief') return <VistaBrief celebracion={celebracion} lang={lang} locale={locale} organizador={organizadorInfo} ocurrencias={ocurrencias} />

  if (rol === 'invitado') return <VistaInvitado celebracion={celebracion} user={user} lang={lang} tx={tx} locale={locale} organizador={organizadorInfo} ocurrencias={ocurrencias} />

  // DASHBOARD ORGANIZADOR
  const te = TEMAS[tema] || TEMAS.morado
  const F = FUENTES[fuente]?.font || FSYS
  const textColor = te.dark ? '#ffffff' : '#2a2440'
  const starColor = te.dark ? 'rgba(255,255,255,' : 'rgba(83,74,183,'
  const confirmados = rsvps.filter(r => r.asistencia === 'si').length
  const porConfirmar = rsvps.filter(r => r.asistencia !== 'si').length
  const shareUrl = `joincheers.app/${celebracion?.slug}`
  const limiteAlcanzado = invitadosList.length >= limiteInvitados
  const MIN_SIZE = 16, MAX_SIZE = isMobile ? 36 : 52
  const totalPresupuesto = presupuesto.reduce((s: number, g: any) => s + (g.monto || 0), 0)
  const totalRows = layouts.reduce((max, l) => Math.max(max, l.row + l.rowSpan - 1), 1)

  const progressItems = [
    { label: lang === 'en' ? 'Cover photo' : 'Foto de portada', done: !!portadaUrl },
    { label: lang === 'en' ? 'Event title' : 'Título del evento', done: !!(titleRef.current?.innerText || celebracion?.nombre) },
    { label: lang === 'en' ? 'Guest of honor' : 'Festejado/a', done: !!festejado },
    { label: lang === 'en' ? 'Date' : 'Fecha', done: !!fecha },
    { label: lang === 'en' ? 'Place' : 'Lugar', done: !!lugar },
    { label: lang === 'en' ? 'Description' : 'Descripción', done: !!tagline },
    { label: lang === 'en' ? 'At least 1 guest' : 'Al menos 1 invitado', done: invitadosList.length > 0 },
    { label: lang === 'en' ? 'Gift list or itinerary' : 'Regalos o itinerario', done: regalos.length > 0 || paradas.filter(p => p.id).length > 0 },
  ]
  const progress = Math.round((progressItems.filter(p => p.done).length / progressItems.length) * 100)
  const progressLabel = getProgressLabel(progress, lang)
  const isComplete = progress === 100

  const pillBtn: React.CSSProperties = { background: 'rgba(255,255,255,.92)', border: 'none', color: '#534AB7', fontSize: 13, fontWeight: 700, padding: '8px 14px', borderRadius: 99, cursor: 'pointer', fontFamily: FSYS, boxShadow: '0 4px 14px rgba(20,10,40,.18)', whiteSpace: 'nowrap' as const }
  const fieldInput: React.CSSProperties = { border: 'none', background: 'transparent', fontFamily: FSYS, fontSize: 15, fontWeight: 600, color: te.tileText, padding: '7px 8px', borderRadius: 9, outline: 'none', width: '100%', boxSizing: 'border-box' as const }
  const inputStyle: React.CSSProperties = { border: `1.5px solid ${te.accentBg}`, background: te.tileBg, fontFamily: FSYS, fontSize: 14, color: te.tileText, padding: '8px 12px', borderRadius: 10, outline: 'none', width: '100%', boxSizing: 'border-box' as const }
  const dashedBtn: React.CSSProperties = { border: '1.5px dashed #cfc8ec', background: 'none', color: '#534AB7', fontSize: 13, fontWeight: 700, padding: '9px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: FSYS, marginTop: 8 }
  const addBtn: React.CSSProperties = { border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 700, padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: FSYS }
  const cancelBtn: React.CSSProperties = { border: 'none', background: '#f0edf8', color: '#7a7494', fontSize: 13, fontWeight: 700, padding: '8px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: FSYS }
  const deleteBtn: React.CSSProperties = { border: 'none', background: '#fee2e2', color: '#dc2626', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }

  const SidebarContent = () => !eventoEsPro ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 14, padding: '18px 16px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{tx.customize_locked_title}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', lineHeight: 1.5, marginBottom: 12 }}>{tx.customize_locked_desc}</div>
        <button onClick={comprarPro} disabled={comprandoPro} style={{ width: '100%', border: 'none', background: '#fff', color: '#534AB7', fontSize: 13, fontWeight: 800, padding: '11px', borderRadius: 12, cursor: 'pointer', fontFamily: FSYS }}>{comprandoPro ? '...' : tx.customize_upgrade_cta}</button>
      </div>
      <button onClick={() => setShowCustomize(false)} style={{ border: 'none', background: 'rgba(255,255,255,.1)', color: '#fff', fontSize: 13, fontWeight: 700, padding: '10px', borderRadius: 12, cursor: 'pointer', fontFamily: FSYS }}>{tx.save_close}</button>
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase' as const, marginBottom: 10 }}>{tx.theme}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {TEMA_ORDER.map(k => (
            <button key={k} onClick={() => { setTema(k); guardarCampo('tema', k) }} style={{ border: tema === k ? '2.5px solid #fff' : '2px solid rgba(255,255,255,.15)', borderRadius: 12, padding: '10px 8px', cursor: 'pointer', background: TEMAS[k].bg, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: FSYS, boxShadow: tema === k ? '0 0 0 2px rgba(255,255,255,.5)' : 'none', transition: 'all .15s' }}>
              {(tx as any)[TEMAS[k].label_key]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase' as const, marginBottom: 10 }}>{tx.font}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FUENTE_ORDER.map(k => (
            <button key={k} onClick={() => { setFuente(k); guardarCampo('fuente', k) }} style={{ border: fuente === k ? '2px solid #fff' : '2px solid rgba(255,255,255,.15)', borderRadius: 12, padding: '12px 14px', cursor: 'pointer', background: fuente === k ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.08)', transition: 'all .15s', textAlign: 'left' as const }}>
              <div style={{ fontFamily: FUENTES[k].font, fontSize: 17, fontWeight: 700, lineHeight: 1.2, marginBottom: 3, color: fuente === k ? '#2a2440' : '#fff' }}>{titleRef.current?.innerText || celebracion?.nombre || 'Mi celebración'}</div>
              <div style={{ fontFamily: FSYS, fontSize: 10, fontWeight: 700, letterSpacing: '.5px', color: fuente === k ? '#534AB7' : 'rgba(255,255,255,.5)', textTransform: 'uppercase' as const }}>{FUENTES[k].label}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase' as const, marginBottom: 8 }}>
          {lang === 'en' ? 'Size' : 'Tamaño'} · {tituloSize}px
        </div>
        <input type="range" min={MIN_SIZE} max={MAX_SIZE} value={tituloSize}
          onChange={e => { const v = Number(e.target.value); setTituloSize(v); clearTimeout(saveTimeout.current); saveTimeout.current = setTimeout(() => guardarCampo('titulo_size', v), 300) }}
          style={{ width: '100%', accentColor: '#D4537E', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontFamily: F }}>A</span>
          <span style={{ fontSize: 18, color: 'rgba(255,255,255,.4)', fontFamily: F, fontWeight: 700 }}>A</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase' as const, marginBottom: 10 }}>{lang === 'en' ? 'Alignment' : 'Alineación'}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['normal-left', 'normal-center', 'spaced'] as TituloEstilo[]).map(s => {
            const labels: Record<string, string> = { 'normal-left': '⬛ Izq.', 'normal-center': '⬜ Cen.', 'spaced': 'S·P·A' }
            return <button key={s} onClick={() => { setTituloEstilo(s); guardarCampo('titulo_align', s) }}
              style={{ flex: 1, border: tituloEstilo === s ? '2px solid #fff' : '2px solid rgba(255,255,255,.15)', borderRadius: 10, padding: '8px 4px', cursor: 'pointer', background: tituloEstilo === s ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.08)', color: tituloEstilo === s ? '#534AB7' : '#fff', fontSize: 10, fontWeight: 700, fontFamily: FSYS }}>
              {labels[s]}
            </button>
          })}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase' as const, marginBottom: 10 }}>{lang === 'en' ? 'Format' : 'Formato'}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ cmd: 'bold', label: 'B', s: { fontWeight: 900 } }, { cmd: 'italic', label: 'I', s: { fontStyle: 'italic' } }, { cmd: 'underline', label: 'U', s: { textDecoration: 'underline' } }, { cmd: 'strikeThrough', label: 'S', s: { textDecoration: 'line-through' } }].map(f => (
            <button key={f.cmd} onClick={() => applyFormat(f.cmd)} style={{ width: 40, height: 40, borderRadius: 10, border: '2px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: FSYS, display: 'flex', alignItems: 'center', justifyContent: 'center', ...f.s }}>{f.label}</button>
          ))}
          <button onClick={() => { titleRef.current?.focus(); document.execCommand('removeFormat'); setTimeout(saveTitleHtml, 100) }} style={{ flex: 1, height: 40, borderRadius: 10, border: '2px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.6)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: FSYS }}>
            {lang === 'en' ? 'Clear' : 'Limpiar'}
          </button>
        </div>
      </div>
      <button onClick={() => setShowCustomize(false)} style={{ border: 'none', background: '#fff', color: '#534AB7', fontSize: 14, fontWeight: 800, padding: '12px', borderRadius: 14, cursor: 'pointer', fontFamily: FSYS }}>{tx.save_close}</button>
    </div>
  )

  function TileBody({ tileKey }: { tileKey: string }) {
    if (tileKey === 'portada') return (
      <div style={{ height: '100%', margin: '-8px -14px -14px', cursor: portadaUrl ? 'zoom-in' : 'pointer', position: 'relative', borderRadius: '0 0 18px 18px', overflow: 'hidden' }}
        onClick={() => { if (portadaUrl) setShowLightbox(true); else fileInputRef.current?.click() }}>
        <div style={{ height: '100%', background: portadaUrl ? `url(${portadaUrl}) ${imgPosition}/cover no-repeat` : 'linear-gradient(135deg,#EEEDFE,#FCE9F0)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {subiendoPortada
            ? <div style={{ background: 'rgba(255,255,255,.9)', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 700, color: '#534AB7' }}>{tx.uploading}</div>
            : portadaUrl
              ? <div onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }} style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,.65)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 99, cursor: 'pointer', backdropFilter: 'blur(4px)' }}>{tx.change_image}</div>
              : <div style={{ textAlign: 'center' as const, color: '#a39ec0' }}><div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{tx.cover_image}</div><div style={{ fontSize: 12 }}>{tx.cover_hint}</div></div>}
        </div>
      </div>
    )

    if (tileKey === 'invitados') return (
      <div>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, background: '#ECF7F0', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ fontSize: 22, fontWeight: 850, color: '#1f8a5b', lineHeight: 1 }}>{confirmados}</div>
            <div style={{ fontSize: 11, color: '#1f8a5b', fontWeight: 700, marginTop: 2 }}>{tx.confirmed}</div>
          </div>
          <div style={{ flex: 1, background: '#FFF4E6', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ fontSize: 22, fontWeight: 850, color: '#c98a1e', lineHeight: 1 }}>{porConfirmar}</div>
            <div style={{ fontSize: 11, color: '#c98a1e', fontWeight: 700, marginTop: 2 }}>{tx.to_confirm}</div>
          </div>
        </div>

        {/* Lista de invitados con estado de apertura */}
        {invitadosList.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {invitadosList.map(inv => {
              const rsvp = rsvps.find(r => r.nombre === inv.nombre || r.nombre === inv.email)
              return (
                <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: te.accentBg + '33', borderRadius: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: te.accentBg, color: te.accentText, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {initial(inv.nombre)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: te.tileText, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{inv.nombre}</div>
                    {rsvp && <div style={{ fontSize: 10, fontWeight: 700, color: rsvp.asistencia === 'si' ? '#1f8a5b' : rsvp.asistencia === 'no' ? '#dc2626' : '#c98a1e', marginTop: 1 }}>
                      {rsvp.asistencia === 'si' ? tx.going : rsvp.asistencia === 'no' ? tx.not_going : tx.maybe}
                    </div>}
                  </div>
                  <button onClick={() => enviarWA(inv.nombre)} style={{ border: 'none', background: '#25D366', color: '#fff', width: 24, height: 24, borderRadius: '50%', cursor: 'pointer', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>W</button>
                  <button onClick={() => borrarInvitado(inv.id)} style={{ ...deleteBtn, width: 24, height: 24, fontSize: 12 }}>×</button>
                </div>
              )
            })}
          </div>
        )}

        {limiteAlcanzado ? (
          <div style={{ background: 'linear-gradient(135deg,#534AB7,#D4537E)', borderRadius: 12, padding: '10px 12px', color: '#fff' }}>
            <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 3 }}>{tx.free_limit_title(limiteInvitados)}</div>
            <div style={{ fontSize: 11, opacity: 0.9, lineHeight: 1.4, marginBottom: 6 }}>{tx.free_limit_desc}</div>
            <button onClick={comprarPro} disabled={comprandoPro} style={{ border: 'none', background: '#fff', color: '#534AB7', fontSize: 11, fontWeight: 800, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: FSYS }}>{comprandoPro ? '...' : tx.upgrade_cta}</button>
          </div>
        ) : showAddInvitado ? (
          <div>
            <input value={nuevoInvitado} onChange={e => setNuevoInvitado(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarInvitado()} placeholder={lang === 'en' ? 'Email or phone' : 'Email o teléfono'} autoFocus style={{ ...inputStyle, marginBottom: 6 }} onFocus={e => e.stopPropagation()} />
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <button onClick={agregarInvitado} disabled={guardandoInvitado} style={{ ...addBtn, flex: 1, fontSize: 12 }}>{guardandoInvitado ? '...' : tx.add_guest_btn}</button>
              <button onClick={() => { setShowAddInvitado(false); setNuevoInvitado('') }} style={{ ...cancelBtn, fontSize: 12 }}>{tx.cancel}</button>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => enviarWA()} style={{ flex: 1, border: 'none', background: '#25D366', color: '#fff', fontSize: 12, fontWeight: 700, padding: '7px', borderRadius: 9, cursor: 'pointer', fontFamily: FSYS }}>WhatsApp</button>
              <button onClick={() => { const msg = encodeURIComponent(`¡Hola! Te invito a ${celebracion?.nombre}. El plan: https://joincheers.app/${celebracion?.slug}`); window.open(`sms:?&body=${msg}`, '_blank') }} style={{ flex: 1, border: 'none', background: '#534AB7', color: '#fff', fontSize: 12, fontWeight: 700, padding: '7px', borderRadius: 9, cursor: 'pointer', fontFamily: FSYS }}>SMS</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddInvitado(true)} style={{ ...dashedBtn, width: '100%', textAlign: 'center' as const }}>
            {limiteInvitados === Infinity ? (lang === 'en' ? '+ Add guest' : '+ Agregar invitado') : tx.add_guest(invitadosList.length, limiteInvitados)}
          </button>
        )}
      </div>
    )

    if (tileKey === 'regalos') return (
      <div>
        {regalos.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px', background: r.reservado ? '#f0faf4' : '#fafafa', borderRadius: 10, marginBottom: 6, border: `1.5px solid ${r.reservado ? '#d8f3dc' : '#f0edf8'}` }}>
            <button onClick={() => toggleRegalo(r.id)} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${r.reservado ? '#1f8a5b' : '#cfc8ec'}`, background: r.reservado ? '#1f8a5b' : 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {r.reservado && <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>✓</span>}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: r.reservado ? '#1f8a5b' : te.tileText, textDecoration: r.reservado ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{r.nombre}</div>
              {r.precio && <div style={{ fontSize: 10, color: '#a39ec0' }}>${r.precio}</div>}
            </div>
            {r.link && <a href={r.link} target="_blank" rel="noreferrer" style={{ fontSize: 10, fontWeight: 800, color: '#534AB7', background: '#EEEDFE', padding: '3px 8px', borderRadius: 99, textDecoration: 'none', flexShrink: 0 }}>Ver</a>}
            <button onClick={() => borrarRegalo(r.id)} style={{ ...deleteBtn, width: 22, height: 22, fontSize: 11 }}>×</button>
          </div>
        ))}
        {showAddRegalo ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input value={nuevoRegalo.nombre} onChange={e => setNuevoRegalo(p => ({ ...p, nombre: e.target.value }))} placeholder={lang === 'en' ? 'Gift name' : 'Nombre del regalo'} style={inputStyle} autoFocus onFocus={e => e.stopPropagation()} />
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={nuevoRegalo.precio} onChange={e => setNuevoRegalo(p => ({ ...p, precio: e.target.value }))} placeholder={lang === 'en' ? 'Price' : 'Precio'} style={{ ...inputStyle, flex: 1 }} onFocus={e => e.stopPropagation()} />
              <input value={nuevoRegalo.link} onChange={e => setNuevoRegalo(p => ({ ...p, link: e.target.value }))} placeholder="Link" style={{ ...inputStyle, flex: 2 }} onFocus={e => e.stopPropagation()} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={agregarRegalo} style={{ ...addBtn, flex: 1, fontSize: 12 }}>{lang === 'en' ? 'Add' : 'Agregar'}</button>
              <button onClick={() => { setShowAddRegalo(false); setNuevoRegalo({ nombre: '', precio: '', link: '' }) }} style={{ ...cancelBtn, fontSize: 12 }}>{tx.cancel}</button>
            </div>
          </div>
        ) : regalos.length >= limiteRegalos ? (
          <div style={{ background: 'linear-gradient(135deg,#534AB7,#D4537E)', borderRadius: 12, padding: '10px 12px', color: '#fff' }}>
            <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 3 }}>{tx.gift_limit_title}</div>
            <div style={{ fontSize: 11, opacity: 0.9, lineHeight: 1.4, marginBottom: 6 }}>{tx.gift_limit_desc}</div>
            <button onClick={comprarPro} disabled={comprandoPro} style={{ border: 'none', background: '#fff', color: '#534AB7', fontSize: 11, fontWeight: 800, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: FSYS }}>{comprandoPro ? '...' : tx.gift_upgrade_cta}</button>
          </div>
        ) : <button onClick={() => setShowAddRegalo(true)} style={dashedBtn}>{tx.add_gift}</button>}
      </div>
    )

    if (tileKey === 'itinerario') return (
      <div>
        {paradas.filter(p => p.id).map((p, i) => (
          <div key={p.id} style={{ display: 'flex', gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${te.accentBg}` }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: te.tileText }}>{p.lugar}</div>
              {p.hora && <div style={{ fontSize: 11, color: '#534AB7', fontWeight: 600 }}>{p.hora}</div>}
              {p.nota && <div style={{ fontSize: 11, color: '#a39ec0' }}>{p.nota}</div>}
            </div>
            <button onClick={() => borrarParada(p.id)} style={{ ...deleteBtn, width: 22, height: 22, fontSize: 11 }}>×</button>
          </div>
        ))}
        {showAddParada ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input value={nuevaParada.lugar} onChange={e => setNuevaParada(p => ({ ...p, lugar: e.target.value }))} placeholder={lang === 'en' ? 'Place or address' : 'Lugar o dirección'} style={inputStyle} autoFocus onFocus={e => e.stopPropagation()} />
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={nuevaParada.hora} onChange={e => setNuevaParada(p => ({ ...p, hora: e.target.value }))} placeholder={lang === 'en' ? 'Time' : 'Hora'} style={{ ...inputStyle, flex: 1 }} onFocus={e => e.stopPropagation()} />
              <input value={nuevaParada.nota} onChange={e => setNuevaParada(p => ({ ...p, nota: e.target.value }))} placeholder={lang === 'en' ? 'Note' : 'Nota'} style={{ ...inputStyle, flex: 2 }} onFocus={e => e.stopPropagation()} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={agregarParada} style={{ ...addBtn, flex: 1, fontSize: 12 }}>{lang === 'en' ? 'Add stop' : 'Agregar'}</button>
              <button onClick={() => { setShowAddParada(false); setNuevaParada({ lugar: '', hora: '', nota: '' }) }} style={{ ...cancelBtn, fontSize: 12 }}>{tx.cancel}</button>
            </div>
          </div>
        ) : paradas.filter(p => p.id).length >= limiteParadas ? (
          <div style={{ background: 'linear-gradient(135deg,#534AB7,#D4537E)', borderRadius: 12, padding: '10px 12px', color: '#fff' }}>
            <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 3 }}>{tx.stop_limit_title}</div>
            <div style={{ fontSize: 11, opacity: 0.9, lineHeight: 1.4, marginBottom: 6 }}>{tx.stop_limit_desc}</div>
            <button onClick={comprarPro} disabled={comprandoPro} style={{ border: 'none', background: '#fff', color: '#534AB7', fontSize: 11, fontWeight: 800, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: FSYS }}>{comprandoPro ? '...' : tx.stop_upgrade_cta}</button>
          </div>
        ) : <button onClick={() => setShowAddParada(true)} style={dashedBtn}>{tx.add_stop}</button>}
      </div>
    )

    if (tileKey === 'quellevar') return (
      <div>
        {quellevar.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <button onClick={() => toggleItem(item.id)} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${item.listo ? '#534AB7' : '#cfc8ec'}`, background: item.listo ? '#534AB7' : 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item.listo && <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>✓</span>}
            </button>
            <span style={{ flex: 1, fontSize: 13, color: te.tileText, textDecoration: item.listo ? 'line-through' : 'none', opacity: item.listo ? 0.5 : 1 }}>{item.nombre}</span>
            <button onClick={() => borrarItem(item.id)} style={{ ...deleteBtn, width: 22, height: 22, fontSize: 11 }}>×</button>
          </div>
        ))}
        {showAddItem ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={nuevoItem} onChange={e => setNuevoItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarItem()} placeholder={lang === 'en' ? 'Item to bring' : 'Artículo a llevar'} style={{ ...inputStyle, flex: 1 }} autoFocus onFocus={e => e.stopPropagation()} />
            <button onClick={agregarItem} style={{ ...addBtn, fontSize: 12 }}>{lang === 'en' ? 'Add' : 'Agregar'}</button>
            <button onClick={() => { setShowAddItem(false); setNuevoItem('') }} style={{ ...cancelBtn, fontSize: 12 }}>×</button>
          </div>
        ) : <button onClick={() => setShowAddItem(true)} style={dashedBtn}>{tx.add_item}</button>}
      </div>
    )

    if (tileKey === 'menu') return (
      <div>
        {menuItems.map(plato => (
          <div key={plato.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#fafafa', borderRadius: 10, marginBottom: 6, border: '1.5px solid #f0edf8' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: te.tileText }}>{plato.nombre}</div>
              {plato.quien && <div style={{ fontSize: 11, color: '#534AB7', fontWeight: 600 }}>→ {plato.quien}</div>}
            </div>
            <button onClick={() => borrarPlato(plato.id)} style={{ ...deleteBtn, width: 22, height: 22, fontSize: 11 }}>×</button>
          </div>
        ))}
        {showAddPlato ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input value={nuevoPlato.nombre} onChange={e => setNuevoPlato(p => ({ ...p, nombre: e.target.value }))} placeholder={lang === 'en' ? 'Dish or item' : 'Platillo'} style={inputStyle} autoFocus onFocus={e => e.stopPropagation()} />
            <input value={nuevoPlato.quien} onChange={e => setNuevoPlato(p => ({ ...p, quien: e.target.value }))} placeholder={lang === 'en' ? 'Who brings it?' : '¿Quién lo trae?'} style={inputStyle} onFocus={e => e.stopPropagation()} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={agregarPlato} style={{ ...addBtn, flex: 1, fontSize: 12 }}>{lang === 'en' ? 'Add' : 'Agregar'}</button>
              <button onClick={() => { setShowAddPlato(false); setNuevoPlato({ nombre: '', quien: '' }) }} style={{ ...cancelBtn, fontSize: 12 }}>{tx.cancel}</button>
            </div>
          </div>
        ) : <button onClick={() => setShowAddPlato(true)} style={dashedBtn}>{tx.assign_dish}</button>}
      </div>
    )

    if (tileKey === 'presupuesto') return (
      <div>
        {presupuesto.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '8px 10px', background: '#EEEDFE', borderRadius: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#534AB7' }}>Total</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#534AB7' }}>${totalPresupuesto.toLocaleString()}</span>
          </div>
        )}
        {presupuesto.map((g: any) => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#fafafa', borderRadius: 10, marginBottom: 6, border: '1.5px solid #f0edf8' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: te.tileText }}>{g.nombre}</div>
              {g.quien && <div style={{ fontSize: 11, color: '#a39ec0' }}>{lang === 'en' ? 'Paid by' : 'Pagó'}: {g.quien}</div>}
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#534AB7', flexShrink: 0 }}>${g.monto?.toLocaleString()}</span>
            <button onClick={() => borrarGasto(g.id)} style={{ ...deleteBtn, width: 22, height: 22, fontSize: 11 }}>×</button>
          </div>
        ))}
        {showAddGasto ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input value={nuevoGasto.nombre} onChange={e => setNuevoGasto(p => ({ ...p, nombre: e.target.value }))} placeholder={lang === 'en' ? 'Expense' : 'Gasto'} style={inputStyle} autoFocus onFocus={e => e.stopPropagation()} />
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={nuevoGasto.monto} onChange={e => setNuevoGasto(p => ({ ...p, monto: e.target.value }))} placeholder={lang === 'en' ? 'Amount' : 'Monto'} type="number" style={{ ...inputStyle, flex: 1 }} onFocus={e => e.stopPropagation()} />
              <input value={nuevoGasto.quien} onChange={e => setNuevoGasto(p => ({ ...p, quien: e.target.value }))} placeholder={lang === 'en' ? 'Who paid?' : '¿Quién pagó?'} style={{ ...inputStyle, flex: 2 }} onFocus={e => e.stopPropagation()} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={agregarGasto} style={{ ...addBtn, flex: 1, fontSize: 12 }}>{lang === 'en' ? 'Add' : 'Agregar'}</button>
              <button onClick={() => { setShowAddGasto(false); setNuevoGasto({ nombre: '', monto: '', quien: '' }) }} style={{ ...cancelBtn, fontSize: 12 }}>{tx.cancel}</button>
            </div>
          </div>
        ) : <button onClick={() => setShowAddGasto(true)} style={dashedBtn}>{lang === 'en' ? '+ Add expense' : '+ Agregar gasto'}</button>}
      </div>
    )

    if (tileKey === 'mensajes') return <p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>{tx.messages_empty}</p>
    if (tileKey === 'reservacion') return <div style={{ background: 'linear-gradient(135deg,#534AB7,#D4537E)', borderRadius: 12, padding: 14, color: '#fff' }}><p style={{ fontSize: 13, margin: 0 }}>{tx.reservation_empty}</p></div>
    return null
  }

  return (
    <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: te.bg, fontFamily: FSYS }}>
      <style>{`@keyframes starPulse{0%,100%{opacity:0;transform:scale(.3)}50%{opacity:1;transform:scale(1)}} [contenteditable]:empty:before{content:attr(data-placeholder);color:#a39ec0} [contenteditable]:focus{outline:none}`}</style>

      {/* Estrellitas */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99 }}>
        {STARS.map((s, i) => <div key={i} style={{ position: 'absolute', top: s.top, left: s.left, fontSize: s.size, color: `${starColor}0.45)`, lineHeight: 1, userSelect: 'none', animation: `starPulse ${s.dur} ease-in-out infinite ${s.delay}` }}>✦</div>)}
      </div>

      {activandoPro && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 400, background: 'linear-gradient(135deg,#534AB7,#D4537E)', borderRadius: 14, padding: '10px 18px', color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(20,10,40,.3)' }}>
          {lang === 'en' ? '✓ Payment received — activating Super Cheer for this celebration...' : '✓ Pago recibido — activando Super Cheer para esta celebración...'}
        </div>
      )}

      {bloqueoPro && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 400, background: '#fff', borderRadius: 14, padding: '12px 16px', boxShadow: '0 8px 24px rgba(20,10,40,.3)', display: 'flex', alignItems: 'center', gap: 12, maxWidth: '90vw' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#2a2440' }}>{bloqueoPro}</span>
          <button onClick={comprarPro} disabled={comprandoPro} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 12, fontWeight: 800, padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: FSYS, whiteSpace: 'nowrap' }}>
            {comprandoPro ? '...' : (lang === 'en' ? 'Go Super Cheer →' : 'Hazte Super Cheer →')}
          </button>
          <button onClick={() => router.push('/perfil')} style={{ border: 'none', background: 'none', color: '#7a7494', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: FSYS, textDecoration: 'underline', whiteSpace: 'nowrap' }}>
            {lang === 'en' ? 'or Extra Cheer' : 'o Extra Cheer'}
          </button>
          <button onClick={() => setBloqueoPro(null)} style={{ border: 'none', background: 'none', color: '#a39ec0', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) subirPortada(f) }} style={{ display: 'none' }} />

      {/* Lightbox */}
      {showLightbox && portadaUrl && (
        <div onClick={() => setShowLightbox(false)} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <img src={portadaUrl} alt="portada" style={{ width: '90vw', maxWidth: 600, height: '70vw', maxHeight: 500, borderRadius: 20, objectFit: 'cover' }} onClick={e => e.stopPropagation()} />
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }} onClick={e => e.stopPropagation()}>
            {[{ val: 'top', label: lang === 'en' ? 'Top' : 'Arriba' }, { val: 'center', label: lang === 'en' ? 'Center' : 'Centro' }, { val: 'bottom', label: lang === 'en' ? 'Bottom' : 'Abajo' }].map(p => (
              <button key={p.val} onClick={() => setImgPosition(p.val)} style={{ border: imgPosition === p.val ? '2px solid #fff' : '2px solid rgba(255,255,255,.3)', background: imgPosition === p.val ? '#fff' : 'transparent', color: imgPosition === p.val ? '#534AB7' : '#fff', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 99, cursor: 'pointer' }}>{p.label}</button>
            ))}
            <button onClick={() => { setShowLightbox(false); fileInputRef.current?.click() }} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 99, cursor: 'pointer' }}>{tx.change_image}</button>
          </div>
        </div>
      )}

      {/* Modal WhatsApp */}
      {showWAPrompt && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: '28px 24px', maxWidth: 360, width: '100%' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#2a2440', marginBottom: 8 }}>WhatsApp</div>
            <p style={{ fontSize: 14, color: '#6b6585', margin: '0 0 16px' }}>{lang === 'en' ? `Send invite to ${invitadoPendienteWA?.nombre}` : `Enviar invitación a ${invitadoPendienteWA?.nombre}`}</p>
            <input value={waPhone} onChange={e => setWaPhone(e.target.value)} placeholder="+52 81 1234 5678" style={{ border: '1.5px solid #EEEDFE', background: '#fff', fontFamily: FSYS, fontSize: 15, color: '#2a2440', padding: '10px 14px', borderRadius: 12, outline: 'none', width: '100%', boxSizing: 'border-box', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowWAPrompt(false); setWaPhone('') }} style={{ flex: 1, border: '1.5px solid #e0ddf5', background: 'none', color: '#7a7494', fontSize: 14, fontWeight: 700, padding: '11px', borderRadius: 12, cursor: 'pointer', fontFamily: FSYS }}>{lang === 'en' ? 'Skip' : 'Omitir'}</button>
              <button onClick={() => enviarWA(invitadoPendienteWA?.nombre, waPhone)} style={{ flex: 1, border: 'none', background: '#25D366', color: '#fff', fontSize: 14, fontWeight: 800, padding: '11px', borderRadius: 12, cursor: 'pointer', fontFamily: FSYS }}>{lang === 'en' ? 'Send' : 'Enviar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Panel progreso */}
      {showProgress && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80 }}>
          <div onClick={() => setShowProgress(false)} style={{ position: 'absolute', inset: 0 }} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: '24px 22px', width: 320, boxShadow: '0 20px 60px rgba(0,0,0,.25)', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#2a2440' }}>{progressLabel}</div>
              <div style={{ fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#534AB7,#D4537E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{progress}%</div>
            </div>
            <div style={{ height: 6, background: '#EEEDFE', borderRadius: 99, marginBottom: 20, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#534AB7,#D4537E)', borderRadius: 99, transition: 'width .4s' }} />
            </div>
            {progressItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: item.done ? 'linear-gradient(135deg,#534AB7,#D4537E)' : '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: item.done ? '#fff' : '#a39ec0', fontWeight: 800 }}>{item.done ? '✓' : '·'}</span>
                </div>
                <span style={{ fontSize: 13, color: item.done ? '#2a2440' : '#a39ec0', fontWeight: item.done ? 600 : 400 }}>{item.label}</span>
              </div>
            ))}
            {isComplete && <div style={{ marginTop: 16, padding: '12px', background: 'linear-gradient(135deg,#534AB7,#D4537E)', borderRadius: 12, textAlign: 'center', color: '#fff', fontSize: 14, fontWeight: 800 }}>Cheers full! ✦</div>}
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {isMobile && showCustomize && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setShowCustomize(false)} style={{ flex: 1, background: 'rgba(0,0,0,.4)' }} />
          <div style={{ background: 'linear-gradient(160deg,#534AB7,#7b46a8)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,.4)', borderRadius: 99, margin: '0 auto 20px' }} />
            <SidebarContent />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', maxWidth: isMobile ? '100%' : 1280, margin: '0 auto', minHeight: '100vh' }}>

        {/* Sidebar desktop */}
        {!isMobile && showCustomize && (
          <div style={{ width: 290, flexShrink: 0, padding: '24px 16px', background: 'rgba(0,0,0,.32)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,.08)', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', boxSizing: 'border-box' as const }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 24 }}>{tx.customize}</div>
            <SidebarContent />
          </div>
        )}

        <div style={{ flex: 1, padding: isMobile ? '20px 16px 44px' : '26px 24px 44px', boxSizing: 'border-box' as const }}>

          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 8, flexWrap: 'wrap' as const }}>
            <button onClick={() => router.back()} style={pillBtn}>{tx.my_celebrations}</button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ fontSize: 15, fontWeight: 900, background: 'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-.3px' }}>Cheers</div>
              <div ref={titleRef} contentEditable suppressContentEditableWarning data-placeholder={tx.title_placeholder}
                onInput={e => {
                  const el = e.currentTarget
                  if (el.innerText.length > 40) { el.innerText = el.innerText.slice(0, 40); const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); window.getSelection()?.removeAllRanges(); window.getSelection()?.addRange(r) }
                  saveTitleHtml()
                }}
                style={{ fontFamily: F, fontSize: tituloSize, fontWeight: 800, color: textColor, maxWidth: isMobile ? 180 : 360, textAlign: tituloEstilo === 'normal-center' || tituloEstilo === 'spaced' ? 'center' : 'left', letterSpacing: tituloEstilo === 'spaced' ? '3px' : 'normal', outline: 'none', cursor: 'text', minWidth: 80, wordBreak: 'break-word' as const, lineHeight: 1.2 }}
              />
              <button onClick={() => setShowProgress(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', display: 'flex', alignItems: 'center', gap: 5 }}>
                {isComplete
                  ? <span style={{ fontSize: 11, fontWeight: 800, color: te.dark ? '#f7d76b' : '#534AB7' }}>Cheers full! ✦</span>
                  : <>
                    <div style={{ width: 48, height: 4, borderRadius: 99, background: te.dark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.12)', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#a89df0,#f08cb0)', transition: 'width .4s' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: te.dark ? 'rgba(255,255,255,.85)' : 'rgba(0,0,0,.6)' }}>{progress}% · {progressLabel}</span>
                  </>}
              </button>
            </div>
            <button onClick={() => setShowCustomize(v => !v)} style={{ ...pillBtn, background: showCustomize ? '#534AB7' : 'rgba(255,255,255,.92)', color: showCustomize ? '#fff' : '#534AB7' }}>{tx.customize}</button>
          </div>

          {/* Hero card */}
          <div style={{ background: te.tileBg, borderRadius: 22, overflow: 'hidden', boxShadow: '0 12px 32px rgba(25,12,50,.18)', marginBottom: 14 }}>
            <div style={{ padding: '14px 16px 16px' }}>
              <input value={tagline} onChange={e => setTagline(e.target.value)} onBlur={e => guardarCampo('tagline', e.target.value)} placeholder={tx.tagline_placeholder} style={{ border: 'none', background: 'transparent', fontFamily: FSYS, fontSize: 13, color: '#7a7494', padding: '3px 8px', outline: 'none', width: '100%', boxSizing: 'border-box' as const, marginBottom: 8 }} />
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '6px 14px', padding: '0 4px' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase' as const, margin: '0 0 1px 8px' }}>{tx.celebrated}</div>
                  <input style={{ ...fieldInput, fontSize: 14 }} value={festejado} onChange={e => setFestejado(e.target.value)} onBlur={e => guardarCampo('festejado_nombre', e.target.value)} placeholder={tx.nueva_festejado_placeholder} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase' as const, margin: '0 0 1px 8px' }}>{tx.date}</div>
                  <input type="date" style={{ ...fieldInput, fontSize: 14 }} value={fecha} onChange={e => setFecha(e.target.value)} onBlur={e => guardarCampo('fecha', e.target.value)} />
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase' as const, margin: '0 0 1px 8px' }}>{lang === 'en' ? 'Remind me' : 'Recordarme'}</div>
                  {(() => {
                    const RECORDATORIO_OPCIONES: { v: number; label: string }[] = [
                      { v: 1, label: lang === 'en' ? '1 day before' : '1 día antes' },
                      { v: 3, label: lang === 'en' ? '3 days before' : '3 días antes' },
                      { v: 7, label: lang === 'en' ? '1 week before' : '1 semana antes' },
                      { v: 14, label: lang === 'en' ? '2 weeks before' : '2 semanas antes' },
                      { v: 30, label: lang === 'en' ? '1 month before' : '1 mes antes' },
                    ]
                    const resumen = recordatorioDias.length === 1
                      ? (RECORDATORIO_OPCIONES.find(o => o.v === recordatorioDias[0])?.label || '')
                      : `${recordatorioDias.length} ${lang === 'en' ? 'reminders' : 'recordatorios'}`
                    return (
                      <>
                        <button type="button" onClick={() => setMostrarRecordatorios(v => !v)} style={{ ...fieldInput, fontSize: 14, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box' as const }}>
                          <span>{resumen}</span>
                          <span style={{ fontSize: 10, color: '#a39ec0' }}>▾</span>
                        </button>
                        {mostrarRecordatorios && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff', borderRadius: 12, boxShadow: '0 8px 24px rgba(20,10,40,.2)', padding: 10, zIndex: 50, minWidth: 190 }}>
                            {RECORDATORIO_OPCIONES.map(op => {
                              const activo = recordatorioDias.includes(op.v)
                              return (
                                <label key={op.v} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', cursor: 'pointer', fontSize: 13, color: '#2a2440' }}>
                                  <input
                                    type="checkbox"
                                    checked={activo}
                                    onChange={() => {
                                      let nuevo: number[]
                                      if (activo) {
                                        nuevo = recordatorioDias.filter(d => d !== op.v)
                                        if (nuevo.length === 0) nuevo = [op.v]
                                      } else {
                                        if (!eventoEsPro && recordatorioDias.length >= 1) { setBloqueoPro(tx.reminder_locked_title); return }
                                        if (recordatorioDias.length >= 4) return
                                        nuevo = [...recordatorioDias, op.v].sort((a, b) => a - b)
                                      }
                                      setRecordatorioDias(nuevo)
                                      guardarCampo('recordatorio_dias', nuevo)
                                    }}
                                  />
                                  {op.label}
                                </label>
                              )
                            })}
                            <button type="button" onClick={() => setMostrarRecordatorios(false)} style={{ marginTop: 6, width: '100%', border: 'none', background: '#F5F4FB', color: '#534AB7', fontSize: 12, fontWeight: 700, padding: '6px 0', borderRadius: 8, cursor: 'pointer', fontFamily: FSYS }}>
                              {lang === 'en' ? 'Done' : 'Listo'}
                            </button>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase' as const, margin: '0 0 1px 8px' }}>{tx.place}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, color: '#a39ec0' }}>{tx.location}</span>
                    <input style={{ ...fieldInput, flex: 1, fontSize: 14 }} value={lugar} onChange={e => setLugar(e.target.value)} onBlur={e => guardarLugar(e.target.value)} placeholder="Google Maps" />
                    {lugar && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar)}`} target="_blank" rel="noreferrer" style={{ fontSize: 10, fontWeight: 800, color: '#1a73e8', background: '#E8F0FE', padding: '4px 8px', borderRadius: 99, textDecoration: 'none', whiteSpace: 'nowrap' as const }}>{tx.see_map}</a>}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase' as const, margin: '0 0 1px 8px' }}>{tx.guest_link}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', position: 'relative' }}>
                    <span style={{ fontSize: 12, color: '#534AB7', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{shareUrl}</span>
                    <button onClick={() => navigator.clipboard.writeText(`https://${shareUrl}`)} style={{ border: 'none', background: te.accentBg, color: te.accentText, fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99, cursor: 'pointer', fontFamily: FSYS, flexShrink: 0 }}>{tx.copy}</button>
                    <button onClick={() => setMostrarQR(v => !v)} style={{ border: 'none', background: te.accentBg, color: te.accentText, fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99, cursor: 'pointer', fontFamily: FSYS, flexShrink: 0 }}>QR</button>
                    {mostrarQR && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 8px 30px rgba(0,0,0,.18)', zIndex: 20, textAlign: 'center' as const }}>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`https://${shareUrl}`)}`}
                          alt="QR"
                          width={180}
                          height={180}
                          style={{ display: 'block', margin: '0 auto 8px' }}
                        />
                        <a
                          href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(`https://${shareUrl}`)}`}
                          download={`qr-${celebracion?.slug?.replace('/', '-')}.png`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 11, fontWeight: 800, color: '#534AB7', textDecoration: 'none' }}
                        >
                          {lang === 'en' ? 'Download' : 'Descargar'}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fechas de la serie recurrente */}
          {celebracion?.recurrente && (
            <div style={{ background: te.tileBg, borderRadius: 22, overflow: 'hidden', boxShadow: '0 12px 32px rgba(25,12,50,.18)', marginBottom: 14, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase' as const, marginBottom: 10 }}>
                {lang === 'en' ? 'Upcoming dates' : 'Próximas fechas'}
              </div>

              {ocurrencias.length === 0 && (
                <p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>
                  {rol === 'organizador'
                    ? (eventoEsPro
                        ? (lang === 'en' ? 'Generating dates soon.' : 'Las fechas se generan pronto.')
                        : (lang === 'en' ? 'Go Super Cheer or Extra Cheer so future dates get generated.' : 'Hazte Super Cheer o Extra Cheer para que se generen las fechas futuras.'))
                    : (lang === 'en' ? 'No upcoming dates yet.' : 'Todavía no hay fechas próximas.')}
                </p>
              )}

              {ocurrencias.map(o => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,.05)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#2a2440', minWidth: 92, flexShrink: 0 }}>
                    {new Date(o.fecha + 'T00:00:00').toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                  {rol === 'organizador' ? (
                    <>
                      <input
                        defaultValue={o.hora || ''}
                        onBlur={e => actualizarOcurrencia(o.id, 'hora', e.target.value)}
                        placeholder={lang === 'en' ? 'time' : 'hora'}
                        style={{ ...fieldInput, fontSize: 12, padding: '6px 8px', width: 70, flexShrink: 0 }}
                      />
                      <input
                        defaultValue={o.lugar || ''}
                        onBlur={e => actualizarOcurrencia(o.id, 'lugar', e.target.value)}
                        placeholder={lang === 'en' ? 'place (optional)' : 'lugar (opcional)'}
                        style={{ ...fieldInput, fontSize: 12, padding: '6px 8px', flex: 1 }}
                      />
                      <button onClick={() => cancelarOcurrencia(o.id)} style={{ border: 'none', background: 'none', color: '#D4537E', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: FSYS, flexShrink: 0 }}>
                        {lang === 'en' ? 'Cancel' : 'Cancelar'}
                      </button>
                    </>
                  ) : (
                    o.lugar && <div style={{ fontSize: 13, color: '#6b6585' }}>{o.lugar}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Lifetime colapsable */}
          {lifetimeExpanded ? (
            <div style={{ borderRadius: 18, padding: '18px 20px', marginBottom: 14, background: 'linear-gradient(120deg,#534AB7,#7b46a8 55%,#D4537E)', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' as const }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', opacity: 0.8 }}>{tx.lifetime_label}</div>
                  <div style={{ fontSize: isMobile ? 16 : 19, fontWeight: 850, marginTop: 4 }}>{tx.lifetime_title}</div>
                  <div style={{ fontSize: 12, opacity: 0.88, marginTop: 5, lineHeight: 1.5 }}>{tx.lifetime_desc}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  <button style={{ background: '#fff', color: '#534AB7', border: 'none', borderRadius: 12, padding: '10px 16px', fontSize: 13, fontWeight: 850, cursor: 'pointer', fontFamily: FSYS }}>{tx.lifetime_cta}</button>
                  <button onClick={() => setLifetimeExpanded(false)} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', borderRadius: 12, padding: '7px 16px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: FSYS }}>{lang === 'en' ? 'Remind me later' : 'Después'}</button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setLifetimeExpanded(true)} style={{ width: '100%', marginBottom: 14, padding: '9px 18px', background: te.dark ? 'rgba(83,74,183,.12)' : 'rgba(83,74,183,.07)', border: `1px dashed ${te.dark ? 'rgba(83,74,183,.4)' : 'rgba(83,74,183,.3)'}`, borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FSYS, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ background: 'linear-gradient(135deg,#534AB7,#D4537E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>Cheers Extra Cheer</span>
              <span style={{ color: te.dark ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.4)', fontSize: 11 }}>— {lang === 'en' ? 'Unlock everything' : 'Desbloquea todo'} ↑</span>
            </button>
          )}

          <div style={{ fontSize: 12, fontWeight: 600, color: textColor, opacity: 0.6, marginBottom: 12 }}>
            {lang === 'en' ? 'Drag to move · Drag corner to resize' : 'Arrastra para mover · Arrastra la esquina para cambiar el tamaño'}
          </div>

          {/* GRID DE TILES - CSS Grid real */}
          <div
            ref={gridRef}
            style={{
              display: isMobile ? 'flex' : 'grid',
              flexDirection: isMobile ? 'column' as const : undefined,
              gridTemplateColumns: isMobile ? undefined : `repeat(12, 1fr)`,
              gridAutoRows: `${ROW_H}px`,
              gap: GAP,
              width: '100%',
            }}
          >
            {layouts.map((layout, i) => {
              const info = TINFO[layout.key] || { label: '?', title_key: '' }
              const tileLabel = layout.key === 'portada' ? (lang === 'en' ? 'Cover photo' : 'Foto de portada') : (tx as any)[info.title_key] || layout.key
              const visible = tilesVisibles[layout.key] !== false
              return (
                <ResizableTile
                  key={layout.key}
                  layout={layout}
                  totalRows={totalRows}
                  containerWidth={containerWidth}
                  isMobile={isMobile}
                  te={te}
                  tx={tx}
                  lang={lang}
                  tileLabel={tileLabel}
                  info={info}
                  visible={visible}
                  onToggleVisible={() => toggleVisible(layout.key)}
                  onResizeEnd={(colSpan, rowSpan) => resizeLayout(i, colSpan, rowSpan)}
                  onDragStart={() => setDragIdx(i)}
                  onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
                  onDrop={() => { if (dragIdx !== null) { moveLayout(dragIdx, i); setDragIdx(null); setDragOverIdx(null) } }}
                  isDragging={dragIdx === i}
                  isDragOver={dragOverIdx === i && dragIdx !== i}
                >
                  {TileBody({ tileKey: layout.key })}
                </ResizableTile>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}