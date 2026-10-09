'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import Image from 'next/image'
import { supabase } from '../../supabase'
import { getLang } from '../../i18n'
import * as XLSX from 'xlsx'
import EditorEncuadre from '../_invitacion/EditorEncuadre'
import { FotoEncuadrada } from '../_invitacion/FotoEncuadrada'
import { leerEncuadreTexto, encuadreATexto, redondear, aspectoFoto, type Encuadre } from '../_invitacion/encuadre'

declare global { interface Window { google: any } }

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const BG = 'linear-gradient(160deg,#FFFDFB,#FBF1E7 55%,#F6E4DC)'

// Mismos temas/fuentes que la invitación normal de Cheers (app/[usuario]/[evento])
// — así la invitación de boda se ve consistente con el resto de la app en vez de
// inventar un sistema de diseño aparte.
const TEMAS: Record<string, { label_es: string; label_en: string; bg: string; dark: boolean }> = {
  rosapolvo: { label_es: 'Rosa polvo', label_en: 'Dusty rose', bg: 'linear-gradient(160deg,#F8F4EE,#EBD8D0 70%,#DAC2B8)', dark: false },
  morado:  { label_es: 'Morado',  label_en: 'Purple', bg: 'radial-gradient(circle at 18% 16%,#7b6fd0,transparent 46%),linear-gradient(160deg,#534AB7,#7b46a8 58%,#D4537E)', dark: true },
  rosa:    { label_es: 'Rosa',    label_en: 'Pink',   bg: 'linear-gradient(155deg,#D4537E,#a14b9c)', dark: true },
  noche:   { label_es: 'Noche',   label_en: 'Night',  bg: 'linear-gradient(160deg,#0f0c29,#302b63,#24243e)', dark: true },
  bosque:  { label_es: 'Bosque',  label_en: 'Forest', bg: 'linear-gradient(155deg,#1a3c2a,#2d6a4f,#40916c)', dark: true },
  ambar:   { label_es: 'Ámbar',   label_en: 'Amber',  bg: 'linear-gradient(155deg,#b5451b,#e76f51,#f4a261)', dark: true },
  carbon:  { label_es: 'Carbón',  label_en: 'Carbon', bg: 'linear-gradient(160deg,#1a1a1a,#2d2d2d,#3d3d3d)', dark: true },
  lavanda: { label_es: 'Lavanda', label_en: 'Lavender', bg: '#B8B0F0', dark: false },
  crema:   { label_es: 'Crema',   label_en: 'Cream',  bg: '#FBF4EC', dark: false },
}
const TEMA_ORDER = ['rosapolvo', 'morado', 'rosa', 'noche', 'bosque', 'ambar', 'carbon', 'lavanda', 'crema']

const FUENTES: Record<string, { label: string; font: string }> = {
  system:  { label: 'SF Pro',       font: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' },
  verdana: { label: 'Verdana',      font: 'Verdana, Geneva, sans-serif' },
  georgia: { label: 'Georgia',      font: 'Georgia, serif' },
  cursive: { label: 'Brush Script', font: '"Brush Script MT", "Segoe Script", cursive' },
}
const FUENTE_ORDER = ['system', 'verdana', 'georgia', 'cursive']

type Tab = 'dashboard' | 'invitados' | 'mesas' | 'presupuesto' | 'timeline' | 'novia' | 'novio' | 'pareja' | 'luna_miel' | 'vida_despues' | 'embarazo' | 'wedding_planner' | 'proveedores' | 'contratos' | 'pagos' | 'inspiracion' | 'beauty_timeline' | 'dia_b' | 'calendario_pagos'
type TableroKey = 'novia' | 'novio' | 'pareja' | 'luna_miel' | 'vida_despues' | 'embarazo' | 'wedding_planner' | 'beauty_timeline' | 'dia_b'

const CATEGORIA_WEDDING_PLANNER = 'Wedding Planner'

// Cada módulo se puede prender/apagar desde el Dashboard. Los que no tienen
// tabKey (iglesia/civil) no son pestañas, solo afectan el checklist de trámites.
const MODULOS: { key: string; tabKey?: Tab; es: string; en: string }[] = [
  { key: 'invitados', tabKey: 'invitados', es: 'Invitados', en: 'Guests' },
  { key: 'mesas', tabKey: 'mesas', es: 'Mesas', en: 'Seating' },
  { key: 'presupuesto', tabKey: 'presupuesto', es: 'Presupuesto', en: 'Budget' },
  { key: 'novia', tabKey: 'novia', es: 'Novia', en: 'Bride' },
  { key: 'novio', tabKey: 'novio', es: 'Novio', en: 'Groom' },
  { key: 'pareja', tabKey: 'pareja', es: 'Pareja', en: 'Couple' },
  { key: 'luna_miel', tabKey: 'luna_miel', es: 'Luna de miel', en: 'Honeymoon' },
  { key: 'vida_despues', tabKey: 'vida_despues', es: 'Vida después', en: 'Life after' },
  { key: 'embarazo', tabKey: 'embarazo', es: 'Embarazo', en: 'Pregnancy' },
  { key: 'wedding_planner', tabKey: 'wedding_planner', es: 'Wedding Planner', en: 'Wedding Planner' },
  { key: 'beauty_timeline', tabKey: 'beauty_timeline', es: 'Beauty Timeline', en: 'Beauty Timeline' },
  { key: 'dia_b', tabKey: 'dia_b', es: 'Día B', en: 'Wedding Day' },
  { key: 'proveedores', tabKey: 'proveedores', es: 'Proveedores', en: 'Vendors' },
  { key: 'contratos', tabKey: 'contratos', es: 'Contratos', en: 'Contracts' },
  { key: 'pagos', tabKey: 'pagos', es: 'Pagos', en: 'Payments' },
  { key: 'calendario_pagos', tabKey: 'calendario_pagos', es: 'Calendario de Pagos', en: 'Payment Calendar' },
  { key: 'inspiracion', tabKey: 'inspiracion', es: 'Inspiración', en: 'Inspiration' },
]

const ASISTENCIA_LABEL: Record<string, { es: string; en: string; color: string }> = {
  si: { es: 'Va', en: 'Going', color: '#7CE0A8' },
  no: { es: 'No va', en: 'Not going', color: '#f4a3a3' },
  tal_vez: { es: 'Tal vez', en: 'Maybe', color: '#c98a1e' },
}

const ESTADOS_PROVEEDOR = ['contactado', 'cotizando', 'contratado', 'descartado'] as const
const ESTADO_LABEL: Record<string, { es: string; en: string; color: string }> = {
  contactado: { es: 'Contactado', en: 'Contacted', color: '#a89df0' },
  cotizando: { es: 'Cotizando', en: 'Quoting', color: '#c98a1e' },
  contratado: { es: 'Contratado', en: 'Booked', color: '#7CE0A8' },
  descartado: { es: 'Descartado', en: 'Dropped', color: '#f4a3a3' },
}

const inputStyle: React.CSSProperties = {
  border: '1px solid rgba(183,110,121,.15)', background: 'rgba(183,110,121,.06)',
  color: '#3D2B2E', fontSize: 13, padding: '9px 12px', borderRadius: 9, fontFamily: F,
}

function fmtMoney(n: number | null | undefined) {
  if (n == null) return '—'
  return Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Solo para las tarjetas de vista previa de la invitación — la fecha se guarda como
// YYYY-MM-DD (sin formato), aquí solo se muestra bonita, no se toca lo guardado.
function fmtFechaBonita(fecha: string | null | undefined, lang: string) {
  if (!fecha) return null
  const d = new Date(fecha + 'T00:00:00')
  if (isNaN(d.getTime())) return fecha
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Miniaturas de las fotos de la portada: leen el encuadre guardado (posición y acercamiento) y
// también las posiciones de antes (arriba / centro / abajo).
const ORIGEN_POR_POSICION: Record<string, string> = { top: '50% 0%', center: '50% 50%', bottom: '50% 100%' }
function estiloFotoConPosicion(pos: string | null | undefined) {
  const e = leerEncuadreTexto(pos)
  const origen = `${e.x * 100}% ${e.y * 100}%`
  return { objectFit: 'cover' as const, objectPosition: origen, transform: `scale(${e.z})`, transformOrigin: origen }
}

// Íconos automáticos por palabra clave — el organizador nunca elige un ícono a
// mano, solo escribe el nombre del momento y aquí se adivina el más parecido.
const ICONOS_ITINERARIO: [string, string][] = [
  ['ceremonia', '⛪'], ['iglesia', '⛪'], ['boda civil', '💍'],
  ['coctel', '🥂'], ['cóctel', '🥂'], ['brindis', '🥂'],
  ['cena', '🍽️'], ['comida', '🍽️'], ['banquete', '🍽️'],
  ['baile', '💃'], ['primer baile', '💃'],
  ['fiesta', '🪩'], ['dj', '🪩'],
  ['recepcion', '🎉'], ['recepción', '🎉'],
  ['foto', '📸'],
]
function adivinarIcono(titulo: string) {
  const t = titulo.toLowerCase()
  const match = ICONOS_ITINERARIO.find(([palabra]) => t.includes(palabra))
  return match ? match[1] : '⏰'
}

// Itinerario: una línea por evento, "hora | título | lugar opcional"
function itinerarioATexto(items: any[]) {
  return (items || []).map(it => [it.hora, it.titulo, it.lugar].filter(Boolean).join(' | ')).join('\n')
}
function textoAItinerario(texto: string) {
  return texto.split('\n').map(l => l.trim()).filter(Boolean).map(linea => {
    const [hora, titulo, lugar] = linea.split('|').map(p => p?.trim() || '')
    return { hora: hora || '', titulo: titulo || hora, lugar: lugar || null, icono: adivinarIcono(titulo || hora) }
  })
}

// Hoteles: una línea por hotel, "nombre | dirección | especial(si/no) | link | reseña | traslado".
// Los campos vacíos se conservan en su lugar para que al volver a editar nada se recorra.
function hotelesATexto(items: any[]) {
  return (items || []).map(h => {
    const campos = [h.nombre, h.direccion, h.tarifa_especial ? 'si' : 'no', h.link, h.resena, h.traslado].map(v => (v ?? '').toString())
    while (campos.length > 3 && campos[campos.length - 1] === '') campos.pop()
    return campos.join(' | ')
  }).join('\n')
}
function textoAHoteles(texto: string) {
  return texto.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 6).map(linea => {
    const [nombre, direccion, especial, link, resena, traslado] = linea.split('|').map(p => p?.trim() || '')
    return {
      nombre: (nombre || '').slice(0, 80),
      direccion: direccion ? direccion.slice(0, 160) : null,
      tarifa_especial: (especial || '').toLowerCase().startsWith('s'),
      link: link ? link.slice(0, 500) : null,
      resena: resena ? resena.slice(0, 700) : null,
      traslado: traslado ? traslado.slice(0, 160) : null,
    }
  })
}

// Mesas de regalos: una línea por tienda, "nombre | link (opcional) | nota (opcional)".
// Sin link = "Próximamente". Los links solo pueden ser web (http/https).
function mesasATexto(items: any[]) {
  return (items || []).map(m => {
    const campos = [m.nombre, m.link, m.nota].map(v => (v ?? '').toString())
    while (campos.length > 1 && campos[campos.length - 1] === '') campos.pop()
    return campos.join(' | ')
  }).join('\n')
}
function textoAMesas(texto: string): { mesas: any[]; error: string | null } {
  const mesas: any[] = []
  for (const linea of texto.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 4)) {
    const [nombre, linkCrudo, nota] = linea.split('|').map(p => p?.trim() || '')
    if (!nombre) continue
    let link = linkCrudo
    if (link && !/^https?:\/\//i.test(link) && /^[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(link)) link = 'https://' + link
    if (link && (!/^https?:\/\/\S+$/i.test(link) || link.length > 500)) return { mesas: [], error: nombre }
    mesas.push({ nombre: nombre.slice(0, 60), link: link || null, nota: nota ? nota.slice(0, 120) : null })
  }
  return { mesas, error: null }
}

// Colores de vestimenta: nombres o hex separados por coma. Si no reconocemos
// el nombre, usamos un gris neutro en vez de fallar — nunca rompe el guardado.
const COLORES_CONOCIDOS: Record<string, string> = {
  aqua: '#7FCDCD', turquesa: '#40B5AD', 'azul bebe': '#B8D4E8', 'azul bebé': '#B8D4E8',
  'azul cielo': '#8CB4D8', 'azul noche': '#1B2A4A', 'azul marino': '#1B2A4A', 'azul rey': '#2E4C9B',
  'gris perla': '#D6D6D6', gris: '#9E9E9E', plata: '#C0C0C0',
  blanco: '#FFFFFF', 'blanco roto': '#F5F0E8', marfil: '#FFFFF0', crema: '#FFF8E7',
  negro: '#000000', carbon: '#2B2B2B', carbón: '#2B2B2B',
  rosa: '#E8A0BF', 'rosa pastel': '#F4C2D7', fucsia: '#D6336C', magenta: '#C2185B',
  dorado: '#C9A876', oro: '#D4AF37', bronce: '#8C6B4F', champan: '#F0DFC8', 'champán': '#F0DFC8',
  vino: '#722F37', borgoña: '#5C1A24', rojo: '#C0392B', coral: '#FF7F6B', salmon: '#FA8072', 'salmón': '#FA8072',
  verde: '#4A7C59', 'verde botella': '#0B3D2E', 'verde olivo': '#6B8E23', 'verde menta': '#98D8C8', esmeralda: '#2E8B57', sage: '#B2AC88', salvia: '#B2AC88',
  morado: '#6A4C93', lavanda: '#B8B0F0', lila: '#C8A2C8', purpura: '#800080', 'púrpura': '#800080',
  amarillo: '#F4D35E', mostaza: '#D4A017', durazno: '#FFCBA4',
  cafe: '#6F4E37', 'café': '#6F4E37', chocolate: '#3D2817', beige: '#E8DCC4', arena: '#DCC9A3', terracota: '#C1440E',
  naranja: '#E67E22',
}
function vestimentaColoresATexto(items: any[]) {
  return (items || []).map((c: any) => c.nombre || c.hex).join(', ')
}
function textoAVestimentaColores(texto: string) {
  return texto.split(',').map(s => s.trim()).filter(Boolean).map(nombre => {
    const reconocido = nombre.startsWith('#') || !!COLORES_CONOCIDOS[nombre.toLowerCase()]
    return {
      nombre,
      hex: nombre.startsWith('#') ? nombre : (COLORES_CONOCIDOS[nombre.toLowerCase()] || '#B8B0C8'),
      reconocido,
    }
  })
}

export default function ProyectoBoda({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [lang, setLang] = useState('es')
  const [user, setUser] = useState<any>(null)
  const [id, setId] = useState('')
  const [proyecto, setProyecto] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [tab, setTab] = useState<Tab>('dashboard')

  const [presupuesto, setPresupuesto] = useState<any[]>([])
  const [timeline, setTimeline] = useState<any[]>([])
  const [tablero, setTablero] = useState<any[]>([])
  const [proveedores, setProveedores] = useState<any[]>([])
  const [contratos, setContratos] = useState<any[]>([])
  const [pagos, setPagos] = useState<any[]>([])
  const [invitadosBoda, setInvitadosBoda] = useState<any[]>([])
  const [firmasBoda, setFirmasBoda] = useState<any[]>([])
  const [fotosBoda, setFotosBoda] = useState<any[]>([])
  const [rsvpsBoda, setRsvpsBoda] = useState<any[]>([])

  // Formularios rápidos por sección
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [nuevoCosto, setNuevoCosto] = useState('')
  const [nuevaFechaLimite, setNuevaFechaLimite] = useState('')
  const [nuevoTitulo, setNuevoTitulo] = useState('')
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [nuevoItem, setNuevoItem] = useState('')
  const [guardando, setGuardando] = useState(false)

  const [nuevoProvNombre, setNuevoProvNombre] = useState('')
  const [nuevoProvCategoria, setNuevoProvCategoria] = useState('')
  const [nuevoProvContacto, setNuevoProvContacto] = useState('')
  const [nuevoProvCosto, setNuevoProvCosto] = useState('')

  const [nuevoContratoNombre, setNuevoContratoNombre] = useState('')
  const [subiendoContrato, setSubiendoContrato] = useState(false)

  const [nuevoPagoConcepto, setNuevoPagoConcepto] = useState('')
  const [nuevoPagoMonto, setNuevoPagoMonto] = useState('')
  const [nuevoPagoFecha, setNuevoPagoFecha] = useState('')

  const [nuevoInvNombre, setNuevoInvNombre] = useState('')
  const [nuevoInvContacto, setNuevoInvContacto] = useState('')
  const [nuevoInvGrupo, setNuevoInvGrupo] = useState('')
  const [nuevoInvAcompanantes, setNuevoInvAcompanantes] = useState('0')
  const [previewImportInv, setPreviewImportInv] = useState<{ nombre: string; contacto: string; grupo: string; acompanantes: number }[] | null>(null)
  const [importandoInv, setImportandoInv] = useState(false)
  const [errorImportInv, setErrorImportInv] = useState('')

  const [linkInspiracion, setLinkInspiracion] = useState('')
  const [guardandoInspiracion, setGuardandoInspiracion] = useState(false)

  const [nuevoWpNombre, setNuevoWpNombre] = useState('')
  const [nuevoWpContacto, setNuevoWpContacto] = useState('')
  const [nuevoWpCosto, setNuevoWpCosto] = useState('')

  const [mapsListo, setMapsListo] = useState(false)
  const [editandoLugar, setEditandoLugar] = useState(false)
  const [lugarInput, setLugarInput] = useState('')
  const lugarRef = useRef<HTMLInputElement>(null)
  const lugar2Ref = useRef<HTMLInputElement>(null)

  const [editandoFecha, setEditandoFecha] = useState(false)
  const [fechaInput, setFechaInput] = useState('')
  const [horaInput, setHoraInput] = useState('')
  const [guardandoFecha, setGuardandoFecha] = useState(false)

  const [miUsername, setMiUsername] = useState('')
  const [editandoSlug, setEditandoSlug] = useState(false)
  const [slugInput, setSlugInput] = useState('')
  const [guardandoSlug, setGuardandoSlug] = useState(false)
  const [errorSlug, setErrorSlug] = useState('')

  const [editandoInfo, setEditandoInfo] = useState(false)
  const [infoViajeInput, setInfoViajeInput] = useState('')
  const [faqInput, setFaqInput] = useState('')
  const [editandoContenido, setEditandoContenido] = useState(false)
  const [versiculoInput, setVersiculoInput] = useState('')
  const [versiculoAutorInput, setVersiculoAutorInput] = useState('')
  const [mensajePadresInput, setMensajePadresInput] = useState('')
  const [soloAdultosInput, setSoloAdultosInput] = useState(false)
  const [fraseCierreInput, setFraseCierreInput] = useState('')

  // Fase 3: todo se edita como texto simple (una línea por elemento) y se
  // convierte a JSON al guardar — así el organizador nunca ve un formulario
  // con botones de "agregar renglón", solo escribe como en las demás cajas.
  const [editandoFase3, setEditandoFase3] = useState(false)
  const [itinerarioInput, setItinerarioInput] = useState('')
  const [vestimentaTipoInput, setVestimentaTipoInput] = useState('')
  const [vestimentaColoresInput, setVestimentaColoresInput] = useState('')
  const [vestimentaNotaInput, setVestimentaNotaInput] = useState('')
  const [lugar2Input, setLugar2Input] = useState('')
  const [hotelesInput, setHotelesInput] = useState('')
  // Personalización de la invitación: fecha límite, historia (fotos de la pareja) y estilo
  const [fechaLimiteInput, setFechaLimiteInput] = useState('')
  const [modoInvitacion, setModoInvitacion] = useState('completa')
  const [stdActivo, setStdActivo] = useState(false)
  const [stdCopiado, setStdCopiado] = useState(false)
  const [stdLugarInput, setStdLugarInput] = useState('')
  const [apartadas, setApartadas] = useState<string[]>([])
  const [historiaItems, setHistoriaItems] = useState<any[]>([])
  const [subiendoMedia, setSubiendoMedia] = useState<string | null>(null)
  const [progresoFotos, setProgresoFotos] = useState('')
  const [editorEnc, setEditorEnc] = useState<null | { tipo: 'historia'; i: number } | { tipo: 'portada' }>(null)
  const [personalGuardado, setPersonalGuardado] = useState(false)
  const [mesasRegalosInput, setMesasRegalosInput] = useState('')
  const [ayudaWhatsappInput, setAyudaWhatsappInput] = useState('')
  const [ayudaMensajeInput, setAyudaMensajeInput] = useState('')
  const [mesaRegalosNotaInput, setMesaRegalosNotaInput] = useState('')
  const [lluviaSobresInput, setLluviaSobresInput] = useState(false)

  const [recordando, setRecordando] = useState(false)
  const [ultimoRecordatorio, setUltimoRecordatorio] = useState<string | null>(null)
  const [waPendienteIdx, setWaPendienteIdx] = useState(0)

  const [capturandoManual, setCapturandoManual] = useState<string | null>(null)
  const [manualAsistencia, setManualAsistencia] = useState<'si' | 'no' | 'tal_vez' | ''>('')
  const [manualMenu, setManualMenu] = useState('')
  const [manualAcompanantes, setManualAcompanantes] = useState('0')
  const [manualNotas, setManualNotas] = useState('')

  const [subiendoPortada, setSubiendoPortada] = useState(false)
  const portadaInputRef = useRef<HTMLInputElement>(null)
  const temaCarruselRef = useRef<HTMLDivElement>(null)
  const excelInvitadosRef = useRef<HTMLInputElement>(null)
  const [primerosPasosCerrado, setPrimerosPasosCerrado] = useState(false)

  const [mesasBoda, setMesasBoda] = useState<any[]>([])
  const [nuevaMesaNombre, setNuevaMesaNombre] = useState('')
  const [nuevaMesaCapacidad, setNuevaMesaCapacidad] = useState('')
  const [guardandoMesa, setGuardandoMesa] = useState(false)

  async function cargarTodo(bodaId: string) {
    const [{ data: p }, { data: t }, { data: tb }, { data: pr }, { data: ct }, { data: pg }, { data: inv }, { data: rs }, { data: ms }, { data: fm }, { data: fo }] = await Promise.all([
      supabase.from('boda_presupuesto_items').select('*').eq('boda_id', bodaId).order('created_at'),
      supabase.from('boda_timeline_items').select('*').eq('boda_id', bodaId).order('fecha_objetivo', { ascending: true, nullsFirst: false }),
      supabase.from('boda_tablero_items').select('*').eq('boda_id', bodaId).order('orden'),
      supabase.from('boda_proveedores').select('*').eq('boda_id', bodaId).order('created_at'),
      supabase.from('boda_contratos').select('*').eq('boda_id', bodaId).order('created_at'),
      supabase.from('boda_pagos').select('*').eq('boda_id', bodaId).order('fecha', { ascending: false, nullsFirst: false }),
      supabase.from('boda_invitados').select('*').eq('boda_id', bodaId).order('created_at'),
      supabase.from('boda_rsvps').select('*').eq('boda_id', bodaId),
      supabase.from('boda_mesas').select('*').eq('boda_id', bodaId).order('orden'),
      supabase.from('boda_firmas').select('*').eq('boda_id', bodaId).order('created_at', { ascending: false }),
      supabase.from('boda_fotos').select('*').eq('boda_id', bodaId).order('created_at', { ascending: false }),
    ])
    setPresupuesto(p || [])
    setTimeline(t || [])
    setTablero(tb || [])
    setProveedores(pr || [])
    setContratos(ct || [])
    setPagos(pg || [])
    setInvitadosBoda(inv || [])
    setRsvpsBoda(rs || [])
    const { data: ap } = await supabase.from('boda_fecha_apartada').select('invitado_id').eq('boda_id', bodaId)
    setApartadas((ap || []).map((x: any) => x.invitado_id))
    setMesasBoda(ms || [])
    setFirmasBoda(fm || [])
    setFotosBoda(fo || [])
  }

  async function agregarMesa() {
    if (!nuevaMesaNombre.trim()) return
    setGuardandoMesa(true)
    const { data } = await supabase.from('boda_mesas').insert({
      boda_id: id,
      nombre: nuevaMesaNombre.trim(),
      capacidad: nuevaMesaCapacidad ? Number(nuevaMesaCapacidad) : null,
      orden: mesasBoda.length,
    }).select().single()
    if (data) setMesasBoda(prev => [...prev, data])
    setNuevaMesaNombre('')
    setNuevaMesaCapacidad('')
    setGuardandoMesa(false)
  }

  async function borrarMesa(mesaId: string) {
    setMesasBoda(prev => prev.filter(m => m.id !== mesaId))
    setInvitadosBoda(prev => prev.map(i => i.mesa_id === mesaId ? { ...i, mesa_id: null } : i))
    await supabase.from('boda_mesas').delete().eq('id', mesaId)
  }

  async function asignarInvitadoAMesa(invitadoId: string, mesaId: string | null) {
    setInvitadosBoda(prev => prev.map(i => i.id === invitadoId ? { ...i, mesa_id: mesaId } : i))
    await supabase.from('boda_invitados').update({ mesa_id: mesaId }).eq('id', invitadoId)
  }

  // Cuenta al invitado + sus acompañantes confirmados (si ya respondió el RSVP)
  // como los asientos que ocupa en la mesa — si todavía no responde, cuenta
  // solo como 1 para no subestimar la capacidad necesaria.
  function asientosDe(invitadoId: string) {
    const rsvp = rsvpsBoda.find(r => r.invitado_id === invitadoId)
    if (rsvp && rsvp.asistencia === 'si') return 1 + (rsvp.num_acompanantes || 0)
    return 1
  }

  useEffect(() => {
    setLang(getLang())
    params.then(async ({ id }) => {
      setId(id)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: perfilPropio } = await supabase.from('perfiles').select('username').eq('user_id', user.id).single()
      setMiUsername(perfilPropio?.username || '')
      const { data: proy } = await supabase.from('proyectos_boda').select('*').eq('id', id).single()
      if (!proy) { router.push('/bridal'); return }
      setProyecto(proy)
      setLinkInspiracion(proy.link_inspiracion || '')
      setLugarInput(proy.lugar_nombre || '')
      setInfoViajeInput(proy.info_viaje || '')
      setFaqInput(proy.faq || '')
      setVersiculoInput(proy.versiculo || '')
      setVersiculoAutorInput(proy.versiculo_autor || '')
      setMensajePadresInput(proy.mensaje_padres || '')
      setSoloAdultosInput(!!proy.solo_adultos)
      setFraseCierreInput(proy.frase_cierre || '')
      setItinerarioInput(itinerarioATexto(proy.itinerario))
      setVestimentaTipoInput(proy.vestimenta_tipo || '')
      setVestimentaColoresInput(vestimentaColoresATexto(proy.vestimenta_colores))
      setVestimentaNotaInput(proy.vestimenta_nota || '')
      setLugar2Input(proy.lugar2_nombre || '')
      setHotelesInput(hotelesATexto(proy.hoteles))
      setFechaLimiteInput(proy.fecha_limite_rsvp || '')
      setModoInvitacion(proy.modo_invitacion || 'completa')
      setStdActivo(!!proy.std_activo)
      setStdLugarInput(proy.std_lugar || '')
      setAyudaWhatsappInput(proy.ayuda_whatsapp || '')
      setAyudaMensajeInput(proy.ayuda_mensaje || '')
      setHistoriaItems(Array.isArray(proy.historia) ? proy.historia : [])
      // Si la boda traía un solo link de regalos (versión anterior), se muestra como primera mesa para editarlo.
      setMesasRegalosInput(Array.isArray(proy.mesas_regalos) && proy.mesas_regalos.length > 0 ? mesasATexto(proy.mesas_regalos) : (proy.mesa_regalos_link ? `Mesa de regalos | ${proy.mesa_regalos_link}` : ''))
      setMesaRegalosNotaInput(proy.mesa_regalos_nota || '')
      setLluviaSobresInput(!!proy.lluvia_sobres)
      setSlugInput(proy.slug || '')
      await cargarTodo(id)
      setCargando(false)
    })
  }, [])

  useEffect(() => {
    if (!mapsListo || !editandoLugar || !lugarRef.current || lugarRef.current.dataset.init) return
    const ac = new window.google.maps.places.Autocomplete(lugarRef.current, { fields: ['name', 'formatted_address'] })
    ac.addListener('place_changed', () => {
      const p = ac.getPlace()
      if (p) setLugarInput(lugarRef.current?.value || p.name || '')
    })
    lugarRef.current.dataset.init = 'true'
  }, [mapsListo, editandoLugar])

  useEffect(() => {
    if (!mapsListo || !editandoFase3 || !lugar2Ref.current || lugar2Ref.current.dataset.init) return
    const ac = new window.google.maps.places.Autocomplete(lugar2Ref.current, { fields: ['name', 'formatted_address'] })
    ac.addListener('place_changed', () => {
      const p = ac.getPlace()
      if (p) setLugar2Input(lugar2Ref.current?.value || p.name || '')
    })
    lugar2Ref.current.dataset.init = 'true'
  }, [mapsListo, editandoFase3])

  async function agregarPresupuesto() {
    if (!nuevoNombre.trim()) return
    setGuardando(true)
    await supabase.from('boda_presupuesto_items').insert({
      boda_id: id, nombre: nuevoNombre.trim(), categoria: nuevaCategoria.trim() || null,
      costo_estimado: nuevoCosto ? Number(nuevoCosto) : null,
      fecha_limite: nuevaFechaLimite || null,
    })
    setNuevoNombre(''); setNuevaCategoria(''); setNuevoCosto(''); setNuevaFechaLimite('')
    await cargarTodo(id)
    setGuardando(false)
  }

  async function togglePagado(item: any) {
    setPresupuesto(prev => prev.map(x => x.id === item.id ? { ...x, pagado: !x.pagado } : x))
    await supabase.from('boda_presupuesto_items').update({ pagado: !item.pagado }).eq('id', item.id)
  }

  async function borrarPresupuesto(itemId: string) {
    setPresupuesto(prev => prev.filter(x => x.id !== itemId))
    await supabase.from('boda_presupuesto_items').delete().eq('id', itemId)
  }

  async function agregarTimeline() {
    if (!nuevoTitulo.trim()) return
    setGuardando(true)
    await supabase.from('boda_timeline_items').insert({ boda_id: id, titulo: nuevoTitulo.trim(), fecha_objetivo: nuevaFecha || null })
    setNuevoTitulo(''); setNuevaFecha('')
    await cargarTodo(id)
    setGuardando(false)
  }

  async function toggleCompletadoTimeline(item: any) {
    setTimeline(prev => prev.map(x => x.id === item.id ? { ...x, completado: !x.completado } : x))
    await supabase.from('boda_timeline_items').update({ completado: !item.completado }).eq('id', item.id)
  }

  async function borrarTimeline(itemId: string) {
    setTimeline(prev => prev.filter(x => x.id !== itemId))
    await supabase.from('boda_timeline_items').delete().eq('id', itemId)
  }

  async function agregarTablero(tableroKey: TableroKey) {
    if (!nuevoItem.trim()) return
    setGuardando(true)
    const orden = tablero.filter(x => x.tablero === tableroKey).length
    await supabase.from('boda_tablero_items').insert({ boda_id: id, tablero: tableroKey, titulo: nuevoItem.trim(), orden })
    setNuevoItem('')
    await cargarTodo(id)
    setGuardando(false)
  }

  async function toggleCompletadoTablero(item: any) {
    setTablero(prev => prev.map(x => x.id === item.id ? { ...x, completado: !x.completado } : x))
    await supabase.from('boda_tablero_items').update({ completado: !item.completado }).eq('id', item.id)
  }

  async function borrarTablero(itemId: string) {
    setTablero(prev => prev.filter(x => x.id !== itemId))
    await supabase.from('boda_tablero_items').delete().eq('id', itemId)
  }

  async function agregarProveedor() {
    if (!nuevoProvNombre.trim()) return
    setGuardando(true)
    await supabase.from('boda_proveedores').insert({
      boda_id: id, nombre: nuevoProvNombre.trim(), categoria: nuevoProvCategoria.trim() || null,
      contacto_nombre: nuevoProvContacto.trim() || null, costo_cotizado: nuevoProvCosto ? Number(nuevoProvCosto) : null,
    })
    setNuevoProvNombre(''); setNuevoProvCategoria(''); setNuevoProvContacto(''); setNuevoProvCosto('')
    await cargarTodo(id)
    setGuardando(false)
  }

  async function cambiarEstadoProveedor(item: any, estado: string) {
    setProveedores(prev => prev.map(x => x.id === item.id ? { ...x, estado } : x))
    await supabase.from('boda_proveedores').update({ estado }).eq('id', item.id)
  }

  async function borrarProveedor(itemId: string) {
    setProveedores(prev => prev.filter(x => x.id !== itemId))
    await supabase.from('boda_proveedores').delete().eq('id', itemId)
  }

  // El bucket "contratos-boda" es privado — cada archivo vive en una carpeta
  // con el id de la boda (la policy de storage revisa ese primer segmento
  // de la ruta), y para verlo hay que pedir una URL firmada al momento, no
  // guardar un link público fijo.
  async function subirContrato(file: File) {
    if (!nuevoContratoNombre.trim()) { setNuevoContratoNombre(file.name); }
    setSubiendoContrato(true)
    const path = `${id}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('contratos-boda').upload(path, file)
    if (!error) {
      await supabase.from('boda_contratos').insert({ boda_id: id, nombre: nuevoContratoNombre.trim() || file.name, archivo_url: path })
      await cargarTodo(id)
    }
    setNuevoContratoNombre('')
    setSubiendoContrato(false)
  }

  async function verContrato(archivoUrl: string) {
    const { data } = await supabase.storage.from('contratos-boda').createSignedUrl(archivoUrl, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function borrarContrato(item: any) {
    setContratos(prev => prev.filter(x => x.id !== item.id))
    await supabase.storage.from('contratos-boda').remove([item.archivo_url])
    await supabase.from('boda_contratos').delete().eq('id', item.id)
  }

  async function toggleFirmado(item: any) {
    setContratos(prev => prev.map(x => x.id === item.id ? { ...x, firmado: !x.firmado } : x))
    await supabase.from('boda_contratos').update({ firmado: !item.firmado }).eq('id', item.id)
  }

  async function agregarPago() {
    if (!nuevoPagoConcepto.trim() || !nuevoPagoMonto) return
    setGuardando(true)
    await supabase.from('boda_pagos').insert({
      boda_id: id, concepto: nuevoPagoConcepto.trim(), monto: Number(nuevoPagoMonto), fecha: nuevoPagoFecha || null,
    })
    setNuevoPagoConcepto(''); setNuevoPagoMonto(''); setNuevoPagoFecha('')
    await cargarTodo(id)
    setGuardando(false)
  }

  async function borrarPago(itemId: string) {
    setPagos(prev => prev.filter(x => x.id !== itemId))
    await supabase.from('boda_pagos').delete().eq('id', itemId)
  }

  async function agregarInvitadoBoda() {
    if (!nuevoInvNombre.trim()) return
    setGuardando(true)
    const esTelefono = /^\+?[\d\s\-()]{7,}$/.test(nuevoInvContacto.trim())
    await supabase.from('boda_invitados').insert({
      boda_id: id, nombre: nuevoInvNombre.trim(),
      telefono: esTelefono ? nuevoInvContacto.trim() : null,
      email: !esTelefono ? (nuevoInvContacto.trim() || null) : null,
      grupo: nuevoInvGrupo.trim() || null,
      acompanantes_permitidos: Number(nuevoInvAcompanantes) || 0,
    })
    setNuevoInvNombre(''); setNuevoInvContacto(''); setNuevoInvGrupo(''); setNuevoInvAcompanantes('0')
    await cargarTodo(id)
    setGuardando(false)
  }

  // Lee un Excel/CSV que la pareja ya tenía armado y arma una vista previa antes
  // de insertar nada — así no se cargan 150 filas mal leídas sin que las revise.
  // Detecta columnas por nombre (nombre/teléfono/grupo/acompañantes) sin importar
  // el orden ni mayúsculas/acentos; si no encuentra columna de nombre, usa la primera.
  function normalizarClave(k: string) {
    return k.toLowerCase().normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '').trim()
  }
  async function onArchivoInvitados(file: File) {
    setErrorImportInv('')
    setPreviewImportInv(null)
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const hoja = wb.Sheets[wb.SheetNames[0]]
      const filas: Record<string, any>[] = XLSX.utils.sheet_to_json(hoja, { defval: '' })
      if (!filas.length) { setErrorImportInv(lang === 'en' ? 'The file has no rows.' : 'El archivo no tiene filas.'); return }

      const claves = Object.keys(filas[0])
      const clave = (patron: RegExp) => claves.find(k => patron.test(normalizarClave(k)))
      const kNombre = clave(/nombre|name|invitad/)
      const kContacto = clave(/tel|phone|celular|correo|email|mail/)
      const kGrupo = clave(/grupo|group|mesa|table|familia/)
      const kAcomp = clave(/acompan|plus ?one|\+ ?1|invitados extra|guests/)

      const filasProcesadas = filas.map(f => ({
        nombre: String((kNombre ? f[kNombre] : Object.values(f)[0]) ?? '').trim(),
        contacto: String((kContacto ? f[kContacto] : '') ?? '').trim(),
        grupo: String((kGrupo ? f[kGrupo] : '') ?? '').trim(),
        acompanantes: Math.max(0, parseInt(String((kAcomp ? f[kAcomp] : '0') ?? '0'), 10) || 0),
      })).filter(f => f.nombre)

      if (!filasProcesadas.length) { setErrorImportInv(lang === 'en' ? "Couldn't find a name column." : 'No encontré una columna de nombres.'); return }
      setPreviewImportInv(filasProcesadas)
    } catch (e) {
      setErrorImportInv(lang === 'en' ? "Couldn't read that file. Try exporting it as .xlsx or .csv." : 'No pude leer ese archivo. Prueba exportándolo como .xlsx o .csv.')
    }
  }

  async function confirmarImportacionInv() {
    if (!previewImportInv?.length) return
    setImportandoInv(true)
    const filas = previewImportInv.map(r => {
      const esTelefono = /^\+?[\d\s\-()]{7,}$/.test(r.contacto)
      return {
        boda_id: id, nombre: r.nombre,
        telefono: esTelefono ? r.contacto : null,
        email: !esTelefono ? (r.contacto || null) : null,
        grupo: r.grupo || null,
        acompanantes_permitidos: r.acompanantes,
      }
    })
    await supabase.from('boda_invitados').insert(filas)
    await cargarTodo(id)
    setImportandoInv(false)
    setPreviewImportInv(null)
    if (excelInvitadosRef.current) excelInvitadosRef.current.value = ''
  }

  async function borrarInvitadoBoda(itemId: string) {
    setInvitadosBoda(prev => prev.filter(x => x.id !== itemId))
    await supabase.from('boda_invitados').delete().eq('id', itemId)
  }

  async function guardarLinkInspiracion() {
    setGuardandoInspiracion(true)
    await supabase.from('proyectos_boda').update({ link_inspiracion: linkInspiracion.trim() || null }).eq('id', id)
    setProyecto((prev: any) => ({ ...prev, link_inspiracion: linkInspiracion.trim() || null }))
    setGuardandoInspiracion(false)
  }

  async function guardarLugar() {
    const valor = lugarInput.trim() || null
    await supabase.from('proyectos_boda').update({ lugar_nombre: valor }).eq('id', id)
    setProyecto((prev: any) => ({ ...prev, lugar_nombre: valor }))
    setEditandoLugar(false)
  }

  function slugify(str: string) {
    return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40)
  }

  async function guardarSlug() {
    const valor = slugify(slugInput)
    if (!valor) { setErrorSlug(lang === 'en' ? 'Write something first.' : 'Escribe algo primero.'); return }
    setGuardandoSlug(true)
    setErrorSlug('')
    const { error } = await supabase.from('proyectos_boda').update({ slug: valor }).eq('id', id)
    setGuardandoSlug(false)
    if (error) {
      setErrorSlug(error.code === '23505' ? (lang === 'en' ? 'That link is taken, try another.' : 'Ese link ya está en uso, intenta con otro.') : (lang === 'en' ? 'Something went wrong.' : 'Algo salió mal.'))
      return
    }
    setProyecto((prev: any) => ({ ...prev, slug: valor }))
    setSlugInput(valor)
    setEditandoSlug(false)
  }

  async function guardarFecha() {
    setGuardandoFecha(true)
    const fecha_boda = fechaInput || null
    const hora_boda = horaInput || null
    const { error } = await supabase.from('proyectos_boda').update({ fecha_boda, hora_boda }).eq('id', id)
    setGuardandoFecha(false)
    if (error) return
    setProyecto((prev: any) => ({ ...prev, fecha_boda, hora_boda }))
    setEditandoFecha(false)
    // Aviso por correo a los invitados — fire-and-forget, igual que en las
    // celebraciones normales: si falla, la fecha ya quedó guardada bien.
    const { data: { session } } = await supabase.auth.getSession()
    fetch('/api/notificar-cambio-fecha-boda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bodaId: id, accessToken: session?.access_token }),
    }).catch(() => {})
  }

  async function guardarInfoRsvp() {
    const info_viaje = infoViajeInput.trim() || null
    const faq = faqInput.trim() || null
    await supabase.from('proyectos_boda').update({ info_viaje, faq }).eq('id', id)
    setProyecto((prev: any) => ({ ...prev, info_viaje, faq }))
    setEditandoInfo(false)
  }

  async function guardarContenidoAdicional() {
    const cambios = {
      versiculo: versiculoInput.trim() || null,
      versiculo_autor: versiculoAutorInput.trim() || null,
      mensaje_padres: mensajePadresInput.trim() || null,
      solo_adultos: soloAdultosInput,
      frase_cierre: fraseCierreInput.trim() || null,
    }
    await supabase.from('proyectos_boda').update(cambios).eq('id', id)
    setProyecto((prev: any) => ({ ...prev, ...cambios }))
    setEditandoContenido(false)
  }

  async function guardarFase3() {
    // Mesas de regalos: solo se aceptan links web reales (http/https). Si la pareja
    // escribe "liverpool.com.mx/..." sin https, se lo agregamos; cualquier otra cosa
    // ("javascript:", espacios, etc.) se rechaza con aviso y no se guarda nada.
    const waDigitos = ayudaWhatsappInput.replace(/\D/g, '')
    if (waDigitos && !/^\d{10,15}$/.test(waDigitos)) {
      alert(lang === 'en' ? 'The WhatsApp number must have 10 to 15 digits.' : 'El número de WhatsApp debe tener de 10 a 15 dígitos.')
      return
    }
    const { mesas, error: mesaMala } = textoAMesas(mesasRegalosInput)
    if (mesaMala) {
      alert(lang === 'en' ? `The link for "${mesaMala}" must be a web address (https://...).` : `El link de "${mesaMala}" debe ser una dirección web (https://...).`)
      return
    }
    const cambios = {
      itinerario: textoAItinerario(itinerarioInput),
      vestimenta_tipo: vestimentaTipoInput.trim() || null,
      vestimenta_colores: textoAVestimentaColores(vestimentaColoresInput),
      vestimenta_nota: vestimentaNotaInput.trim() || null,
      lugar2_nombre: lugar2Input.trim() || null,
      hoteles: textoAHoteles(hotelesInput),
      mesa_regalos_link: null,
      mesas_regalos: mesas,
      ayuda_whatsapp: waDigitos || null,
      ayuda_mensaje: ayudaMensajeInput.trim().slice(0, 300) || null,
      mesa_regalos_nota: mesaRegalosNotaInput.trim() || null,
      lluvia_sobres: lluviaSobresInput,
    }
    const { error } = await supabase.from('proyectos_boda').update(cambios).eq('id', id)
    if (error) {
      alert(lang === 'en' ? 'Could not save, please try again.' : 'No se pudo guardar, intenta de nuevo.')
      return
    }
    setProyecto((prev: any) => ({ ...prev, ...cambios }))
    setEditandoFase3(false)
  }

  // ── Personalización de la invitación ─────────────────────────────────────
  // Reduce la foto en el celular antes de subirla (máx. 1600px, JPG). Si el
  // formato no se puede leer (por ejemplo HEIC en algunos navegadores) NO se
  // sube el original: se avisa para que la pareja use JPG, PNG o WebP.
  async function reducirImagen(archivo: File, maximo = 1600): Promise<Blob | null> {
    try {
      const bitmap = await createImageBitmap(archivo)
      const escala = Math.min(1, maximo / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * escala)
      canvas.height = Math.round(bitmap.height * escala)
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      return await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.86))
    } catch {
      return null
    }
  }

  // Mide una foto (ya reducida) para guardar su proporción: así el marco se adapta si es horizontal o vertical.
  function medirBlob(blob: Blob): Promise<{ w: number; h: number } | null> {
    return createImageBitmap(blob).then(b => { const r = { w: b.width, h: b.height }; b.close?.(); return r }).catch(() => null)
  }

  // Sube varias fotos de "Nuestra historia" una tras otra (hasta completar 6). Va acumulando la lista
  // para que ninguna pise a la anterior, y guarda después de cada foto para no perder lo ya subido.
  async function subirVarias(archivos: File[]) {
    const lugares = 6 - historiaItems.length
    if (lugares <= 0) return
    const lista = archivos.filter(f => f && f.type.startsWith('image/')).slice(0, lugares)
    if (archivos.length > lugares) alert(lang === 'en' ? `Only ${lugares} more photo(s) fit (max 6). The rest were skipped.` : `Solo caben ${lugares} foto(s) más (máximo 6). Las demás no se subieron.`)
    let acumulado = [...historiaItems]
    let fallidas = 0
    setSubiendoMedia('historia')
    for (let k = 0; k < lista.length; k++) {
      const file = lista[k]
      setProgresoFotos(`${k + 1}/${lista.length}`)
      if (file.size > 25 * 1024 * 1024) { fallidas++; continue }
      const blob = await reducirImagen(file)
      if (!blob) { fallidas++; continue }
      const dims = await medirBlob(blob)
      const ruta = `${id}/historia-${crypto.randomUUID()}.jpg`
      const { error } = await supabase.storage.from('bodas-media').upload(ruta, blob, { contentType: 'image/jpeg', upsert: false })
      if (error) { fallidas++; continue }
      const { data: { publicUrl } } = supabase.storage.from('bodas-media').getPublicUrl(ruta)
      const nuevos = [...acumulado, { url: publicUrl, ruta, pie: '', ...(dims ? { w: dims.w, h: dims.h } : {}) }]
      const { error: e2 } = await supabase.from('proyectos_boda').update({ historia: nuevos }).eq('id', id)
      if (e2) { await supabase.storage.from('bodas-media').remove([ruta]); fallidas++; continue }
      acumulado = nuevos
      setHistoriaItems(nuevos)
      setProyecto((prev: any) => ({ ...prev, historia: nuevos }))
    }
    setSubiendoMedia(null)
    setProgresoFotos('')
    if (fallidas) alert(lang === 'en' ? `${fallidas} photo(s) could not be uploaded. Please try those again.` : `${fallidas} foto(s) no se pudieron subir. Intenta esas de nuevo.`)
  }

  async function quitarHistoria(i: number) {
    const item = historiaItems[i]
    if (!item) return
    if (typeof item.ruta === 'string' && item.ruta.startsWith(`${id}/`)) await supabase.storage.from('bodas-media').remove([item.ruta])
    const nuevos = historiaItems.filter((_, j) => j !== i)
    await supabase.from('proyectos_boda').update({ historia: nuevos }).eq('id', id)
    setHistoriaItems(nuevos)
    setProyecto((prev: any) => ({ ...prev, historia: nuevos }))
  }

  // Acomodar una foto dentro de su marco (arrastrar y acercar). Se guarda la posición y el acercamiento.
  async function guardarEncuadreHistoria(i: number, enc: Encuadre) {
    const e = redondear(enc)
    const nuevos = historiaItems.map((h, j) => (j === i ? { ...h, x: e.x, y: e.y, z: e.z } : h))
    const { error } = await supabase.from('proyectos_boda').update({ historia: nuevos }).eq('id', id)
    if (error) { alert(lang === 'en' ? "Couldn't save the position." : 'No se pudo guardar el acomodo.'); return }
    setHistoriaItems(nuevos)
    setProyecto((prev: any) => ({ ...prev, historia: nuevos }))
  }

  async function guardarEncuadrePortada(enc: Encuadre) {
    const texto = encuadreATexto(enc)
    const { error } = await supabase.from('proyectos_boda').update({ portada_posicion: texto }).eq('id', id)
    if (error) { alert(lang === 'en' ? "Couldn't save the position." : 'No se pudo guardar el acomodo.'); return }
    setProyecto((prev: any) => ({ ...prev, portada_posicion: texto }))
  }

  // Save the date con link general: se prende/apaga y se edita la ciudad. El link
  // personal de cada invitado siempre es la invitación completa.
  async function guardarStd(activo: boolean, lugar: string) {
    const std_lugar = lugar.trim().slice(0, 80) || null
    const { error } = await supabase.from('proyectos_boda').update({ std_activo: activo, std_lugar }).eq('id', id)
    if (error) { alert(lang === 'en' ? "Couldn't save the save the date." : 'No se pudo guardar el Save the date.'); return }
    setStdActivo(activo)
    setProyecto((prev: any) => ({ ...prev, std_activo: activo, std_lugar }))
  }

  // (Antes) Modo de la invitación: "completa" (todo) o "save_the_date" (solo fecha, hospedaje y un botón).
  async function guardarModoInvitacion(modo: string, lugar: string) {
    const std_lugar = lugar.trim().slice(0, 80) || null
    const { error } = await supabase.from('proyectos_boda').update({ modo_invitacion: modo, std_lugar }).eq('id', id)
    if (error) { alert(lang === 'en' ? "Couldn't save the invitation mode." : 'No se pudo guardar el modo de la invitación.'); return }
    setModoInvitacion(modo)
    setProyecto((prev: any) => ({ ...prev, modo_invitacion: modo, std_lugar }))
  }

  async function guardarPieHistoria(i: number, pie: string) {
    const limpio = pie.trim().slice(0, 80)
    if ((historiaItems[i]?.pie || '') === limpio) return
    const nuevos = historiaItems.map((h, j) => (j === i ? { ...h, pie: limpio } : h))
    await supabase.from('proyectos_boda').update({ historia: nuevos }).eq('id', id)
    setHistoriaItems(nuevos)
    setProyecto((prev: any) => ({ ...prev, historia: nuevos }))
  }

  async function guardarPersonalizacion() {
    const cambios = {
      fecha_limite_rsvp: /^\d{4}-\d{2}-\d{2}$/.test(fechaLimiteInput) ? fechaLimiteInput : null,
    }
    await supabase.from('proyectos_boda').update(cambios).eq('id', id)
    setProyecto((prev: any) => ({ ...prev, ...cambios }))
    setPersonalGuardado(true)
    setTimeout(() => setPersonalGuardado(false), 2500)
  }

  async function aprobarFirma(firmaId: string) {
    await supabase.from('boda_firmas').update({ aprobado: true }).eq('id', firmaId)
    setFirmasBoda(prev => prev.map(f => f.id === firmaId ? { ...f, aprobado: true } : f))
  }

  async function rechazarFirma(firmaId: string) {
    await supabase.from('boda_firmas').delete().eq('id', firmaId)
    setFirmasBoda(prev => prev.filter(f => f.id !== firmaId))
  }

  async function aprobarFoto(fotoId: string) {
    await supabase.from('boda_fotos').update({ aprobado: true }).eq('id', fotoId)
    setFotosBoda(prev => prev.map(f => f.id === fotoId ? { ...f, aprobado: true } : f))
  }

  async function rechazarFoto(foto: any) {
    await supabase.storage.from('fotos-boda').remove([foto.ruta_storage])
    await supabase.from('boda_fotos').delete().eq('id', foto.id)
    setFotosBoda(prev => prev.filter(f => f.id !== foto.id))
  }

  async function guardarTema(k: string) {
    setProyecto((prev: any) => ({ ...prev, tema: k }))
    await supabase.from('proyectos_boda').update({ tema: k }).eq('id', id)
  }

  async function guardarFuente(k: string) {
    setProyecto((prev: any) => ({ ...prev, fuente: k }))
    await supabase.from('proyectos_boda').update({ fuente: k }).eq('id', id)
  }

  async function guardarPortadaPosicion(pos: string) {
    setProyecto((prev: any) => ({ ...prev, portada_posicion: pos }))
    await supabase.from('proyectos_boda').update({ portada_posicion: pos }).eq('id', id)
  }

  async function subirPortada(file: File) {
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 8 * 1024 * 1024) {
      alert(lang === 'en' ? 'Photo is too big (max 8MB). Try a smaller one.' : 'La foto pesa demasiado (máx. 8MB). Intenta con una más chica.')
      return
    }
    setSubiendoPortada(true)
    const ext = file.name.split('.').pop()
    const path = `boda-${id}-portada.${ext}`
    const { error } = await supabase.storage.from('portadas').upload(path, file, { upsert: true })
    if (error) {
      setSubiendoPortada(false)
      alert(lang === 'en' ? "Couldn't upload the photo. Try a smaller file." : 'No se pudo subir la foto. Intenta con un archivo más chico.')
      return
    }
    const { data: { publicUrl: urlBase } } = supabase.storage.from('portadas').getPublicUrl(path)
    // La foto nueva usa el mismo nombre de archivo que la anterior: sin esta marca de versión,
    // el navegador y el servidor de imágenes podían seguir mostrando la foto vieja.
    const publicUrl = `${urlBase}?v=${Date.now()}`
    await supabase.from('proyectos_boda').update({ portada_url: publicUrl, portada_posicion: 'center' }).eq('id', id)
    setProyecto((prev: any) => ({ ...prev, portada_url: publicUrl, portada_posicion: 'center' }))
    setSubiendoPortada(false)
  }

  // Captura manual: para cuando alguien (ej. el wedding planner) confirma la
  // asistencia de un invitado por teléfono en vez de que el invitado use su
  // link — mismo destino (boda_rsvps) que el RSVP digital, solo otra puerta.
  function abrirCapturaManual(inv: any) {
    const existente = rsvpsBoda.find(r => r.invitado_id === inv.id)
    setManualAsistencia(existente?.asistencia || '')
    setManualMenu(existente?.menu_principal || '')
    setManualAcompanantes(String(existente?.num_acompanantes ?? 0))
    setManualNotas(existente?.notas || '')
    setCapturandoManual(inv.id)
  }

  async function guardarRsvpManual(invitadoId: string) {
    if (!manualAsistencia) return
    setGuardando(true)
    const existente = rsvpsBoda.find(r => r.invitado_id === invitadoId)
    const payload = {
      boda_id: id, invitado_id: invitadoId, asistencia: manualAsistencia,
      num_acompanantes: Number(manualAcompanantes) || 0,
      menu_principal: manualMenu || null, notas: manualNotas.trim() || null,
    }
    if (existente) await supabase.from('boda_rsvps').update(payload).eq('id', existente.id)
    else await supabase.from('boda_rsvps').insert(payload)
    setCapturandoManual(null)
    await cargarTodo(id)
    setGuardando(false)
  }

  async function toggleModulo(key: string) {
    const activos = { ...(proyecto?.modulos_activos || {}) }
    activos[key] = !(activos[key] !== false) // default true si no existe la llave
    setProyecto((prev: any) => ({ ...prev, modulos_activos: activos }))
    await supabase.from('proyectos_boda').update({ modulos_activos: activos }).eq('id', id)
  }

  function moduloActivo(key: string) {
    return proyecto?.modulos_activos?.[key] !== false
  }

  // Wedding Planner es una vista filtrada de Proveedores (categoría fija), no una
  // tabla aparte — evita duplicar datos si algún día también cotizas ahí mismo.
  const wpCandidatos = proveedores.filter(p => p.categoria === CATEGORIA_WEDDING_PLANNER)
  const wpContratado = wpCandidatos.find(p => p.estado === 'contratado')

  async function agregarWpCandidato() {
    if (!nuevoWpNombre.trim()) return
    setGuardando(true)
    await supabase.from('boda_proveedores').insert({
      boda_id: id, nombre: nuevoWpNombre.trim(), categoria: CATEGORIA_WEDDING_PLANNER,
      contacto_nombre: nuevoWpContacto.trim() || null, costo_cotizado: nuevoWpCosto ? Number(nuevoWpCosto) : null,
    })
    setNuevoWpNombre(''); setNuevoWpContacto(''); setNuevoWpCosto('')
    await cargarTodo(id)
    setGuardando(false)
  }

  async function recordarPorCorreo() {
    setRecordando(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/bridal-recordar-rsvp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bodaId: id, accessToken: session?.access_token }),
    })
    const data = await res.json().catch(() => ({}))
    setUltimoRecordatorio(lang === 'en' ? `${data.enviados ?? 0} reminder emails sent` : `${data.enviados ?? 0} correos de recordatorio enviados`)
    setRecordando(false)
  }

  // WhatsApp no se puede mandar solo desde el servidor sin la API de negocio de
  // pago — así que en vez de "todo de un jalón", esto abre WhatsApp con el
  // siguiente pendiente cada vez que le das clic, uno a la vez.
  // WhatsApp necesita el número con clave de país. En México son 10 dígitos: se antepone 52
  // (y el viejo formato 521 + 10 dígitos se convierte a 52 + 10).
  function telefonoWA(tel: string) {
    let d = (tel || '').replace(/\D/g, '')
    if (d.length === 10) d = '52' + d
    else if (d.length === 13 && d.startsWith('521')) d = '52' + d.slice(3)
    return d.length >= 11 ? d : ''
  }

  function recordarSiguientePorWA() {
    const pendientesConTel = invitadosBoda.filter(inv => !rsvpsBoda.find(r => r.invitado_id === inv.id) && telefonoWA(inv.telefono))
    if (pendientesConTel.length === 0) return
    const inv = pendientesConTel[waPendienteIdx % pendientesConTel.length]
    const url = `https://joincheers.app/bridal/rsvp/${inv.token}`
    const nombreBoda = [proyecto?.nombre_novia, proyecto?.nombre_novio].filter(Boolean).join(' & ')
    const msg = encodeURIComponent(
      lang === 'en'
        ? `Hi ${inv.nombre}! Just checking — we haven't gotten your RSVP yet for ${nombreBoda}'s wedding. Can you confirm here? ${url}`
        : `¡Hola ${inv.nombre}! Todavía no nos llega tu confirmación para la boda de ${nombreBoda}. ¿Nos confirmas aquí? ${url}`
    )
    const destino = telefonoWA(inv.telefono)
    window.open(`https://wa.me/${destino}?text=${msg}`, '_blank')
    setWaPendienteIdx(prev => prev + 1)
  }

  function enviarInvitacionWA(inv: any) {
    const url = `https://joincheers.app/bridal/rsvp/${inv.token}`
    const nombreBoda = [proyecto?.nombre_novia, proyecto?.nombre_novio].filter(Boolean).join(' & ')
    const msg = encodeURIComponent(
      lang === 'en'
        ? `Hi ${inv.nombre}! You're invited to ${nombreBoda}'s wedding. Please RSVP here: ${url}`
        : `¡Hola ${inv.nombre}! Estás invitad@ a la boda de ${nombreBoda}. Confirma tu asistencia aquí: ${url}`
    )
    const destino = telefonoWA(inv.telefono || '')
    window.open(`https://wa.me/${destino}?text=${msg}`, '_blank')
  }

  if (cargando) return (
    <main style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
      <p style={{ color: '#B76E79' }}>{lang === 'en' ? 'Loading…' : 'Cargando…'}</p>
    </main>
  )

  const totalEstimado = presupuesto.reduce((s, x) => s + (Number(x.costo_estimado) || 0), 0)
  const totalReal = presupuesto.reduce((s, x) => s + (Number(x.costo_real) || 0), 0)
  const totalPagado = presupuesto.filter(x => x.pagado).reduce((s, x) => s + (Number(x.costo_real ?? x.costo_estimado) || 0), 0)

  // Con 17 pestañas posibles, una sola fila que se envuelve es difícil de escanear
  // (sobre todo en celular) y no comunica que "Beauty Timeline" y "Timeline" son
  // cosas distintas de "Contratos". Se agrupan en secciones (mismo espíritu que
  // los "groups" de un board de gestión de proyectos) — primero eliges la
  // sección, y solo entonces ves sus pestañas.
  const SECCIONES: { id: string; es: string; en: string }[] = [
    { id: 'resumen', es: 'Resumen', en: 'Overview' },
    { id: 'logistica', es: 'Logística', en: 'Logistics' },
    { id: 'invitados', es: 'Invitados', en: 'Guests' },
    { id: 'nosotros', es: 'Nosotros', en: 'Us' },
    { id: 'dia_b_sec', es: 'El gran día', en: 'The big day' },
    { id: 'despues', es: 'Después', en: 'After' },
    { id: 'inspiracion_sec', es: 'Inspiración', en: 'Inspiration' },
  ]
  const TABS_TODAS: { key: Tab; label: string; moduloKey?: string; seccion: string }[] = [
    { key: 'dashboard', label: lang === 'en' ? 'Dashboard' : 'Dashboard', seccion: 'resumen' },
    { key: 'invitados', label: lang === 'en' ? 'Guests' : 'Invitados', moduloKey: 'invitados', seccion: 'invitados' },
    { key: 'mesas', label: lang === 'en' ? 'Seating' : 'Mesas', moduloKey: 'mesas', seccion: 'invitados' },
    { key: 'presupuesto', label: lang === 'en' ? 'Budget' : 'Presupuesto', moduloKey: 'presupuesto', seccion: 'logistica' },
    { key: 'timeline', label: lang === 'en' ? 'Timeline' : 'Timeline', seccion: 'logistica' },
    { key: 'proveedores', label: lang === 'en' ? 'Vendors' : 'Proveedores', moduloKey: 'proveedores', seccion: 'logistica' },
    { key: 'wedding_planner', label: 'Wedding Planner', moduloKey: 'wedding_planner', seccion: 'logistica' },
    { key: 'contratos', label: lang === 'en' ? 'Contracts' : 'Contratos', moduloKey: 'contratos', seccion: 'logistica' },
    { key: 'pagos', label: lang === 'en' ? 'Payments' : 'Pagos', moduloKey: 'pagos', seccion: 'logistica' },
    { key: 'calendario_pagos', label: lang === 'en' ? 'Payment Calendar' : 'Calendario de Pagos', moduloKey: 'calendario_pagos', seccion: 'logistica' },
    { key: 'novia', label: lang === 'en' ? 'Bride' : 'Novia', moduloKey: 'novia', seccion: 'nosotros' },
    { key: 'novio', label: lang === 'en' ? 'Groom' : 'Novio', moduloKey: 'novio', seccion: 'nosotros' },
    { key: 'pareja', label: lang === 'en' ? 'Couple' : 'Pareja', moduloKey: 'pareja', seccion: 'nosotros' },
    { key: 'beauty_timeline', label: 'Beauty Timeline', moduloKey: 'beauty_timeline', seccion: 'nosotros' },
    { key: 'dia_b', label: lang === 'en' ? 'Wedding Day' : 'Día B', moduloKey: 'dia_b', seccion: 'dia_b_sec' },
    { key: 'luna_miel', label: lang === 'en' ? 'Honeymoon' : 'Luna de miel', moduloKey: 'luna_miel', seccion: 'despues' },
    { key: 'vida_despues', label: lang === 'en' ? 'Life after' : 'Vida después', moduloKey: 'vida_despues', seccion: 'despues' },
    { key: 'embarazo', label: lang === 'en' ? 'Pregnancy' : 'Embarazo', moduloKey: 'embarazo', seccion: 'despues' },
    { key: 'inspiracion', label: lang === 'en' ? 'Inspiration' : 'Inspiración', moduloKey: 'inspiracion', seccion: 'inspiracion_sec' },
  ]
  const TABS = TABS_TODAS.filter(t => !t.moduloKey || moduloActivo(t.moduloKey))
  const seccionesConTabs = SECCIONES.filter(s => TABS.some(t => t.seccion === s.id))
  const seccionActiva = TABS.find(t => t.key === tab)?.seccion || seccionesConTabs[0]?.id
  const tabsDeSeccion = TABS.filter(t => t.seccion === seccionActiva)

  const totalPagos = pagos.reduce((s, x) => s + (Number(x.monto) || 0), 0)
  const hoy = new Date().toISOString().slice(0, 10)
  const en30dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const pagosVencidos = presupuesto.filter(x => !x.pagado && x.fecha_limite && x.fecha_limite < hoy)
  const pagosProximos = presupuesto.filter(x => !x.pagado && x.fecha_limite && x.fecha_limite >= hoy && x.fecha_limite <= en30dias)
  const contratosFirmados = contratos.filter(c => c.firmado).length
  const rsvpConfirmados = rsvpsBoda.filter(r => r.asistencia === 'si').length
  // Si aún no hay detalle línea por línea, usar el estimado que se llenó al crear el proyecto,
  // para que el tile no se vea en $0/0 cuando en realidad ya hay un número dado.
  const presupuestoMetaTile = totalEstimado > 0 ? totalEstimado : (Number(proyecto?.presupuesto_total) || 0)
  const invitadosMetaTile = invitadosBoda.length > 0 ? invitadosBoda.length : (Number(proyecto?.invitados_estimados) || 0)

  // Countdown + progreso: días para la boda y % del checklist de Timeline
  // completado — como Zola/Aisle Planner. Se basa en Timeline (la única lista
  // de tareas real que ya existe) en vez de inventar un % combinado con
  // dinero/invitados, que sería más confuso que útil.
  const diasParaBoda = proyecto?.fecha_boda
    ? Math.round((new Date(proyecto.fecha_boda + 'T00:00:00').getTime() - new Date(hoy + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24))
    : null
  const timelineActivo = timeline.length > 0
  const timelinePct = timelineActivo ? Math.round((timeline.filter(x => x.completado).length / timeline.length) * 100) : 0

  return (
    <main style={{ minHeight: '100vh', background: BG, fontFamily: F, padding: '50px 20px 80px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <button onClick={() => router.push('/bridal')} style={{ border: 'none', background: 'rgba(183,110,121,.08)', color: 'rgba(61,43,46,.7)', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 99, cursor: 'pointer', fontFamily: F, marginBottom: 20 }}>
          {lang === 'en' ? '← Back' : '← Atrás'}
        </button>

        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#3D2B2E', margin: '0 0 24px', letterSpacing: '-.5px' }}>
          {[proyecto?.nombre_novia, proyecto?.nombre_novio].filter(Boolean).join(' & ') || (lang === 'en' ? 'Your wedding' : 'Tu boda')}
        </h1>

        {/* Secciones — primer nivel, agrupa las pestañas en vez de una fila de 17 */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' as const }}>
          {seccionesConTabs.map(sec => (
            <button key={sec.id} onClick={() => {
              const primerTab = TABS.find(t => t.seccion === sec.id)
              if (primerTab) setTab(primerTab.key)
            }} style={{
              border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 800, padding: '8px 14px', borderRadius: 99,
              background: seccionActiva === sec.id ? 'linear-gradient(135deg,#C9A876,#C98A93)' : 'rgba(183,110,121,.08)',
              color: seccionActiva === sec.id ? '#fff' : 'rgba(61,43,46,.6)',
            }}>{lang === 'en' ? sec.en : sec.es}</button>
          ))}
        </div>

        {/* Sub-tabs — solo de la sección activa */}
        {tabsDeSeccion.length > 1 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' as const }}>
            {tabsDeSeccion.map(tb => (
              <button key={tb.key} onClick={() => setTab(tb.key)} style={{
                border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 99,
                background: tab === tb.key ? 'rgba(183,110,121,.9)' : 'rgba(183,110,121,.05)',
                color: tab === tb.key ? '#3D2B2E' : 'rgba(61,43,46,.5)',
              }}>{tb.label}</button>
            ))}
          </div>
        )}
        {tabsDeSeccion.length <= 1 && <div style={{ marginBottom: 20 }} />}

        {tab === 'dashboard' && (
          <div>
            {/* Countdown: da sensación de avance, como el "faltan X días" de Zola/Aisle Planner */}
            {diasParaBoda !== null && (
              <div style={{ background: 'linear-gradient(135deg,#B76E79,#96525C)', borderRadius: 16, padding: '18px 20px', marginBottom: 16, color: '#fff' }}>
                {diasParaBoda === 0 ? (
                  <div style={{ fontSize: 16, fontWeight: 900 }}>{lang === 'en' ? "It's the big day!" : '¡Hoy es el gran día!'}</div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: timelineActivo ? 10 : 0 }}>
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{Math.abs(diasParaBoda)}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, opacity: .85, textTransform: 'uppercase' as const, letterSpacing: '.5px' }}>
                        {diasParaBoda > 0 ? (lang === 'en' ? 'days to go' : 'días para la boda') : (lang === 'en' ? 'days married' : 'días de casados')}
                      </div>
                    </div>
                    {timelineActivo && (
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{timelinePct}% <span style={{ fontWeight: 600, opacity: .85, fontSize: 11 }}>{lang === 'en' ? 'checklist' : 'del checklist'}</span></div>
                    )}
                  </div>
                )}
                {timelineActivo && diasParaBoda !== 0 && (
                  <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,.3)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${timelinePct}%`, background: '#fff', borderRadius: 99 }} />
                  </div>
                )}
              </div>
            )}

            {/* Primeros pasos: el primer día el dashboard es puros 0/0 en 17 módulos
                prendidos por default — esto da 3 acciones concretas para arrancar
                en vez de que se sienta una pared vacía. Se apaga sola en cuanto hay
                algo de contenido real, o si la cierran a mano. */}
            {!primerosPasosCerrado && invitadosBoda.length === 0 && presupuesto.length === 0 && !proyecto?.lugar_nombre && (
              <div style={{ background: 'rgba(183,110,121,.06)', border: '1px dashed rgba(183,110,121,.3)', borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#3D2B2E' }}>{lang === 'en' ? 'Getting started' : 'Primeros pasos'}</div>
                  <button onClick={() => setPrimerosPasosCerrado(true)} style={{ border: 'none', background: 'transparent', color: 'rgba(61,43,46,.4)', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
                <p style={{ fontSize: 12, color: 'rgba(61,43,46,.55)', marginBottom: 10, lineHeight: 1.5 }}>
                  {lang === 'en'
                    ? 'All modules are on by default — turn off the ones you don\'t need at the bottom of this page. To start, try:'
                    : 'Todos los módulos están prendidos por default — apaga los que no necesites al final de esta página. Para empezar, prueba:'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                  <button onClick={() => setEditandoLugar(true)} style={{ textAlign: 'left' as const, border: 'none', background: 'rgba(183,110,121,.06)', color: '#B76E79', fontSize: 12, fontWeight: 700, padding: '8px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>
                    {lang === 'en' ? '→ Add your venue' : '→ Agrega tu lugar'}
                  </button>
                  <button onClick={() => setTab('invitados')} style={{ textAlign: 'left' as const, border: 'none', background: 'rgba(183,110,121,.06)', color: '#B76E79', fontSize: 12, fontWeight: 700, padding: '8px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>
                    {lang === 'en' ? '→ Add your first guests' : '→ Agrega tus primeros invitados'}
                  </button>
                  <button onClick={() => setTab('presupuesto')} style={{ textAlign: 'left' as const, border: 'none', background: 'rgba(183,110,121,.06)', color: '#B76E79', fontSize: 12, fontWeight: 700, padding: '8px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>
                    {lang === 'en' ? '→ Start your budget' : '→ Arranca tu presupuesto'}
                  </button>
                </div>
              </div>
            )}

            {/* Brief: mismo espíritu que el brief de Cheers normal — fecha, lugar, invitados, organizadores */}
            <div style={{ background: 'rgba(183,110,121,.06)', borderRadius: 16, padding: '18px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 14, marginBottom: (editandoLugar || editandoFecha) ? 12 : 0 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(61,43,46,.45)', fontWeight: 800, textTransform: 'uppercase' as const }}>{lang === 'en' ? 'Date' : 'Fecha'}</div>
                  {editandoFecha ? null : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 14, color: '#3D2B2E', fontWeight: 700 }}>
                        {proyecto?.fecha_boda || (lang === 'en' ? 'Pending' : 'Pendiente')}
                        {proyecto?.hora_boda ? `, ${new Date(`2000-01-01T${proyecto.hora_boda.slice(0, 5)}`).toLocaleTimeString(lang === 'en' ? 'en-US' : 'es-MX', { hour: 'numeric', minute: '2-digit' })}` : ''}
                      </div>
                      <button onClick={() => { setFechaInput(proyecto?.fecha_boda || ''); setHoraInput(proyecto?.hora_boda || ''); setEditandoFecha(true) }} style={{ border: 'none', background: 'transparent', color: 'rgba(61,43,46,.4)', fontSize: 11, cursor: 'pointer', fontFamily: F }}>{lang === 'en' ? 'edit' : 'editar'}</button>
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(61,43,46,.45)', fontWeight: 800, textTransform: 'uppercase' as const }}>{lang === 'en' ? 'Guests' : 'Invitados'}</div>
                  <div style={{ fontSize: 14, color: '#3D2B2E', fontWeight: 700 }}>
                    {proyecto?.invitados_estimados ?? (lang === 'en' ? 'Pending' : 'Pendiente')}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 10, color: 'rgba(61,43,46,.45)', fontWeight: 800, textTransform: 'uppercase' as const }}>{lang === 'en' ? 'Venue' : 'Lugar'}</div>
                  {editandoLugar ? null : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 14, color: '#3D2B2E', fontWeight: 700 }}>{proyecto?.lugar_nombre || (lang === 'en' ? 'Pending' : 'Pendiente')}</div>
                      {proyecto?.lugar_nombre && (
                        <a href={`https://maps.google.com/?q=${encodeURIComponent(proyecto.lugar_nombre)}`} target="_blank" style={{ fontSize: 11, color: '#B76E79', fontWeight: 700 }}>Maps ↗</a>
                      )}
                      <button onClick={() => setEditandoLugar(true)} style={{ border: 'none', background: 'transparent', color: 'rgba(61,43,46,.4)', fontSize: 11, cursor: 'pointer', fontFamily: F }}>{lang === 'en' ? 'edit' : 'editar'}</button>
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(61,43,46,.45)', fontWeight: 800, textTransform: 'uppercase' as const }}>{lang === 'en' ? 'Wedding Planner' : 'Wedding Planner'}</div>
                  <div style={{ fontSize: 14, color: '#3D2B2E', fontWeight: 700 }}>{wpContratado?.nombre || (lang === 'en' ? 'Not selected' : 'Sin elegir')}</div>
                </div>
              </div>
              {editandoLugar && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input ref={lugarRef} value={lugarInput} onChange={e => setLugarInput(e.target.value)} placeholder={lang === 'en' ? 'Search venue…' : 'Buscar lugar…'} style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={guardarLugar} style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>{lang === 'en' ? 'Save' : 'Guardar'}</button>
                </div>
              )}
              {editandoFecha && (
                <div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <input type="date" value={fechaInput} onChange={e => setFechaInput(e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
                    <input type="time" value={horaInput} onChange={e => setHoraInput(e.target.value)} style={{ ...inputStyle, width: 110, marginBottom: 0 }} />
                  </div>
                  {/* Si ya hay invitados con RSVP, cambiar la fecha les manda un correo
                      automático — mismo comportamiento que las celebraciones normales. */}
                  {invitadosBoda.length > 0 && (
                    <p style={{ fontSize: 11, color: 'rgba(61,43,46,.45)', margin: '0 0 8px' }}>
                      {lang === 'en' ? 'Your guests will get an email about this change.' : 'A tus invitados les va a llegar un correo avisando de este cambio.'}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={guardarFecha} disabled={guardandoFecha} style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>{guardandoFecha ? '...' : (lang === 'en' ? 'Save' : 'Guardar')}</button>
                    <button onClick={() => setEditandoFecha(false)} style={{ border: '1px solid rgba(183,110,121,.2)', background: 'transparent', color: 'rgba(61,43,46,.5)', fontSize: 13, fontWeight: 700, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>{lang === 'en' ? 'Cancel' : 'Cancelar'}</button>
                  </div>
                </div>
              )}
            </div>

            {/* Info que ven los invitados en su página de RSVP */}
            <div style={{ background: 'rgba(183,110,121,.06)', borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editandoInfo ? 10 : 0 }}>
                <div style={{ fontSize: 11, color: 'rgba(61,43,46,.45)', fontWeight: 800, textTransform: 'uppercase' as const }}>
                  {lang === 'en' ? 'Info for guests (travel & FAQ)' : 'Info para invitados (viaje y FAQ)'}
                </div>
                {!editandoInfo && (
                  <button onClick={() => setEditandoInfo(true)} style={{ border: 'none', background: 'transparent', color: 'rgba(61,43,46,.4)', fontSize: 11, cursor: 'pointer', fontFamily: F }}>{lang === 'en' ? 'edit' : 'editar'}</button>
                )}
              </div>
              {editandoInfo ? (
                <div>
                  <textarea value={infoViajeInput} onChange={e => setInfoViajeInput(e.target.value)} rows={3} placeholder={lang === 'en' ? 'Travel & stay info' : 'Info de viaje y hospedaje'} style={{ ...inputStyle, width: '100%', resize: 'none' as const }} />
                  <textarea value={faqInput} onChange={e => setFaqInput(e.target.value)} rows={3} placeholder="FAQ" style={{ ...inputStyle, width: '100%', resize: 'none' as const }} />
                  <button onClick={guardarInfoRsvp} style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>{lang === 'en' ? 'Save' : 'Guardar'}</button>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: 'rgba(61,43,46,.4)', margin: 0 }}>
                  {(proyecto?.info_viaje || proyecto?.faq) ? (lang === 'en' ? 'Saved — visible on the RSVP page.' : 'Guardado — visible en la página de RSVP.') : (lang === 'en' ? 'Nothing yet.' : 'Todavía nada.')}
                </p>
              )}
            </div>

            {/* Fase 1: versículo, padres, solo adultos, frase de cierre */}
            <div style={{ background: 'rgba(183,110,121,.06)', borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editandoContenido ? 10 : 0 }}>
                <div style={{ fontSize: 11, color: 'rgba(61,43,46,.45)', fontWeight: 800, textTransform: 'uppercase' as const }}>
                  {lang === 'en' ? 'Extra touches (verse, parents, closing note)' : 'Detalles extra (versículo, padres, nota de cierre)'}
                </div>
                {!editandoContenido && (
                  <button onClick={() => setEditandoContenido(true)} style={{ border: 'none', background: 'transparent', color: 'rgba(61,43,46,.4)', fontSize: 11, cursor: 'pointer', fontFamily: F }}>{lang === 'en' ? 'edit' : 'editar'}</button>
                )}
              </div>
              {editandoContenido ? (
                <div>
                  <textarea value={versiculoInput} onChange={e => setVersiculoInput(e.target.value)} rows={2} placeholder={lang === 'en' ? 'Verse or quote (optional)' : 'Versículo o frase (opcional)'} style={{ ...inputStyle, width: '100%', resize: 'none' as const }} />
                  <input value={versiculoAutorInput} onChange={e => setVersiculoAutorInput(e.target.value)} placeholder={lang === 'en' ? 'Citation, e.g. 1 Corinthians 13:4-8' : 'Cita, ej. 1 Corintios 13:4-8'} style={{ ...inputStyle, width: '100%' }} />
                  <textarea value={mensajePadresInput} onChange={e => setMensajePadresInput(e.target.value)} rows={3} placeholder={lang === 'en' ? 'Parents (optional), one line each. You can add a title before a colon, e.g. Parents of the bride: John and Mary. Shown under "With the blessing of our families".' : 'Padres (opcional), una línea por familia. Puedes poner un título antes de los dos puntos, ej. Padres de la novia: José y Patricia. Sale bajo "Con la bendición de nuestras familias".'} style={{ ...inputStyle, width: '100%', resize: 'none' as const }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#3D2B2E', marginBottom: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={soloAdultosInput} onChange={e => setSoloAdultosInput(e.target.checked)} />
                    {lang === 'en' ? 'Adults-only event (leave unchecked if kids are welcome)' : 'Evento solo para adultos (déjalo sin marcar si sí quieres niños)'}
                  </label>
                  <textarea value={fraseCierreInput} onChange={e => setFraseCierreInput(e.target.value)} rows={2} placeholder={lang === 'en' ? 'Closing phrase, e.g. "Choosing you every day..."' : 'Frase de cierre, ej. "Elegirte cada día fue..."'} style={{ ...inputStyle, width: '100%', resize: 'none' as const }} />
                  <button onClick={guardarContenidoAdicional} style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>{lang === 'en' ? 'Save' : 'Guardar'}</button>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: 'rgba(61,43,46,.4)', margin: 0 }}>
                  {(proyecto?.versiculo || proyecto?.mensaje_padres || proyecto?.frase_cierre || proyecto?.solo_adultos)
                    ? (lang === 'en' ? 'Saved — visible on the RSVP page.' : 'Guardado — visible en la página de RSVP.')
                    : (lang === 'en' ? 'Nothing yet.' : 'Todavía nada.')}
                </p>
              )}
            </div>

            {/* Fase 3: itinerario, vestimenta, segunda ubicación, hospedaje */}
            <div style={{ background: 'rgba(183,110,121,.06)', borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editandoFase3 ? 10 : 0 }}>
                <div style={{ fontSize: 11, color: 'rgba(61,43,46,.45)', fontWeight: 800, textTransform: 'uppercase' as const }}>
                  {lang === 'en' ? 'Itinerary, dress code, second venue & hotels' : 'Itinerario, vestimenta, segunda ubicación y hoteles'}
                </div>
                {!editandoFase3 && (
                  <button onClick={() => setEditandoFase3(true)} style={{ border: 'none', background: 'transparent', color: 'rgba(61,43,46,.4)', fontSize: 11, cursor: 'pointer', fontFamily: F }}>{lang === 'en' ? 'edit' : 'editar'}</button>
                )}
              </div>
              {editandoFase3 ? (
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(61,43,46,.5)', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                    {lang === 'en' ? 'Itinerary — one per line: time | title | place (optional)' : 'Itinerario — uno por línea: hora | título | lugar (opcional)'}
                  </label>
                  <textarea value={itinerarioInput} onChange={e => setItinerarioInput(e.target.value)} rows={4} placeholder={'19:30 - 20:30 | Ceremonia religiosa | Nombre del lugar\n21:00 - 02:00 | Recepción | Nombre del lugar'} style={{ ...inputStyle, width: '100%', resize: 'none' as const, fontFamily: 'monospace' }} />
                  {itinerarioInput.trim() && (
                    <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.08)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                      <div style={{ fontSize: 10, color: 'rgba(61,43,46,.4)', fontWeight: 700, marginBottom: 6 }}>{lang === 'en' ? 'Preview:' : 'Así se va a ver:'}</div>
                      {textoAItinerario(itinerarioInput).map((it, i) => (
                        <div key={i} style={{ fontSize: 12, color: '#3D2B2E', marginBottom: 3 }}>{it.icono} <b>{it.hora}</b> — {it.titulo}{it.lugar ? ` (${it.lugar})` : ''}</div>
                      ))}
                    </div>
                  )}

                  <label style={{ fontSize: 11, color: 'rgba(61,43,46,.5)', fontWeight: 700, display: 'block', margin: '10px 0 4px' }}>
                    {lang === 'en' ? 'Dress code' : 'Vestimenta'}
                  </label>
                  <input value={vestimentaTipoInput} onChange={e => setVestimentaTipoInput(e.target.value)} placeholder={lang === 'en' ? 'e.g. Formal, Casual, Black tie' : 'ej. Formal, Casual, Etiqueta rigurosa'} style={{ ...inputStyle, width: '100%' }} />
                  <input value={vestimentaColoresInput} onChange={e => setVestimentaColoresInput(e.target.value)} placeholder={lang === 'en' ? 'Suggested colors, comma separated (optional): aqua, azul cielo, gris perla' : 'Colores sugeridos, separados por coma (opcional): aqua, azul cielo, gris perla'} style={{ ...inputStyle, width: '100%' }} />
                  {vestimentaColoresInput.trim() && (
                    <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.08)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                      <div style={{ fontSize: 10, color: 'rgba(61,43,46,.4)', fontWeight: 700, marginBottom: 8 }}>{lang === 'en' ? 'Preview:' : 'Así se va a ver:'}</div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
                        {textoAVestimentaColores(vestimentaColoresInput).map((c, i) => (
                          <div key={i} style={{ textAlign: 'center' as const }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: c.hex, border: '1px solid rgba(0,0,0,.15)', margin: '0 auto 3px' }} />
                            <div style={{ fontSize: 9, color: c.reconocido ? '#3D2B2E' : '#B45309' }}>{c.nombre}{!c.reconocido && ' ⚠'}</div>
                          </div>
                        ))}
                      </div>
                      {textoAVestimentaColores(vestimentaColoresInput).some(c => !c.reconocido) && (
                        <div style={{ fontSize: 10, color: '#B45309', marginTop: 6 }}>
                          {lang === 'en' ? '⚠ Colors marked with a warning weren\u2019t recognized and show as gray — try a hex code like #A9D6E5 instead.' : '⚠ Los colores marcados no se reconocieron y se ven grises — prueba con un código hex como #A9D6E5.'}
                        </div>
                      )}
                    </div>
                  )}
                  <input value={vestimentaNotaInput} onChange={e => setVestimentaNotaInput(e.target.value)} placeholder={lang === 'en' ? 'e.g. Please avoid white' : 'ej. Evita el blanco, reservado para la novia'} style={{ ...inputStyle, width: '100%' }} />

                  <label style={{ fontSize: 11, color: 'rgba(61,43,46,.5)', fontWeight: 700, display: 'block', margin: '10px 0 4px' }}>
                    {lang === 'en' ? 'Second venue (e.g. reception, if different from the main one)' : 'Segunda ubicación (ej. recepción, si es distinta a la principal)'}
                  </label>
                  <input ref={lugar2Ref} value={lugar2Input} onChange={e => setLugar2Input(e.target.value)} placeholder={lang === 'en' ? 'Search venue…' : 'Buscar lugar…'} style={{ ...inputStyle, width: '100%' }} />

                  <label style={{ fontSize: 11, color: 'rgba(61,43,46,.5)', fontWeight: 700, display: 'block', margin: '10px 0 4px' }}>
                    {lang === 'en' ? 'Hotels — one per line: name | address | special wedding rate? yes/no | map link | short review | travel time (leave blanks between bars if you skip one)' : 'Hoteles — uno por línea: nombre | dirección | ¿tarifa especial de boda? si/no | link de mapa | reseña breve | traslado (si te saltas uno, deja las barras vacías)'}
                  </label>
                  <textarea value={hotelesInput} onChange={e => setHotelesInput(e.target.value)} rows={5} placeholder={'Hotel Ejemplo | Av. Principal 100, Zona Centro | no | | Una frase sobre por qué lo elegimos | Aprox. 20 min en Uber'} style={{ ...inputStyle, width: '100%', resize: 'vertical' as const, fontFamily: 'monospace' }} />
                  {hotelesInput.trim() && (
                    <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.08)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                      <div style={{ fontSize: 10, color: 'rgba(61,43,46,.4)', fontWeight: 700, marginBottom: 6 }}>{lang === 'en' ? 'Preview:' : 'Así se va a ver:'}</div>
                      {textoAHoteles(hotelesInput).map((h, i) => (
                        <div key={i} style={{ fontSize: 12, color: '#3D2B2E', marginBottom: 3 }}>
                          <b>{h.nombre}</b>{h.tarifa_especial ? ' 🏷️' : ''}{h.direccion ? ` — ${h.direccion}` : ''}
                        </div>
                      ))}
                    </div>
                  )}

                  <label style={{ fontSize: 11, color: 'rgba(61,43,46,.5)', fontWeight: 700, display: 'block', margin: '10px 0 4px' }}>
                    {lang === 'en' ? 'Gift registries — one per line: store | link (optional) | note (optional). No link = "Coming soon"' : 'Mesas de regalos — una por línea: tienda | link (opcional) | nota (opcional). Sin link aparece "Próximamente"'}
                  </label>
                  <textarea value={mesasRegalosInput} onChange={e => setMesasRegalosInput(e.target.value)} rows={3} placeholder={'El Palacio de Hierro\nLiverpool | https://... | Número de evento 12345'} style={{ ...inputStyle, width: '100%', resize: 'vertical' as const, fontFamily: 'monospace' }} />
                  <input value={mesaRegalosNotaInput} onChange={e => setMesaRegalosNotaInput(e.target.value)} placeholder={lang === 'en' ? 'e.g. Your presence is the best gift, but if you\u2019d like...' : 'ej. Tu presencia es el mejor regalo, pero si deseas obsequiarnos algo...'} style={{ ...inputStyle, width: '100%' }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#3D2B2E', marginBottom: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={lluviaSobresInput} onChange={e => setLluviaSobresInput(e.target.checked)} />
                    {lang === 'en' ? 'Mention an envelope box at the entrance' : 'Mencionar buzón de sobres en la entrada'}
                  </label>

                  <label style={{ fontSize: 11, color: 'rgba(61,43,46,.5)', fontWeight: 700, display: 'block', margin: '10px 0 4px' }}>
                    {lang === 'en' ? 'Hair & makeup help button (WhatsApp, optional): your number and the message guests send' : 'Botón "¿Buscas quién te arregle?" (WhatsApp, opcional): tu número y el mensaje que les llega a ti'}
                  </label>
                  <input value={ayudaWhatsappInput} onChange={e => setAyudaWhatsappInput(e.target.value)} inputMode="tel" placeholder={lang === 'en' ? 'WhatsApp number, 10 digits' : 'Número de WhatsApp, 10 dígitos'} style={{ ...inputStyle, width: '100%' }} />
                  <input value={ayudaMensajeInput} maxLength={300} onChange={e => setAyudaMensajeInput(e.target.value)} placeholder={lang === 'en' ? 'Message (you can use {nombre} for the guest name)' : 'Mensaje (puedes usar {nombre} para el nombre del invitado)'} style={{ ...inputStyle, width: '100%' }} />
                  <button onClick={guardarFase3} style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F, marginTop: 6 }}>{lang === 'en' ? 'Save' : 'Guardar'}</button>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: 'rgba(61,43,46,.4)', margin: 0 }}>
                  {((proyecto?.itinerario?.length > 0) || proyecto?.vestimenta_tipo || proyecto?.lugar2_nombre || (proyecto?.hoteles?.length > 0) || proyecto?.mesa_regalos_link || (proyecto?.mesas_regalos?.length > 0) || proyecto?.ayuda_whatsapp || proyecto?.mesa_regalos_nota || proyecto?.lluvia_sobres)
                    ? (lang === 'en' ? 'Saved — visible on the RSVP page.' : 'Guardado — visible en la página de RSVP.')
                    : (lang === 'en' ? 'Nothing yet.' : 'Todavía nada.')}
                </p>
              )}
            </div>

            {/* Personalización: fecha límite, Nuestra historia y Así lo soñamos */}
            <div style={{ background: 'rgba(183,110,121,.06)', borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(61,43,46,.45)', fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 12 }}>
                {lang === 'en' ? 'Make it yours: deadline & our story' : 'Hazla tuya: fecha límite y nuestra historia'}
              </div>

              <label style={{ fontSize: 11, color: 'rgba(61,43,46,.5)', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                {lang === 'en' ? 'Reply deadline (optional)' : 'Fecha límite para confirmar (opcional)'}
              </label>
              <input type="date" value={fechaLimiteInput} onChange={e => setFechaLimiteInput(e.target.value)} style={{ ...inputStyle, width: '100%' }} />

              <label style={{ fontSize: 11, color: 'rgba(61,43,46,.5)', fontWeight: 700, display: 'block', margin: '12px 0 6px' }}>
                {lang === 'en' ? `Our story — up to 6 photos (${historiaItems.length}/6)` : `Nuestra historia — hasta 6 fotos (${historiaItems.length}/6)`}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 10 }}>
                {historiaItems.map((h, i) => (
                  <div key={h.ruta || i}>
                    <div style={{ position: 'relative' as const }}>
                      <FotoEncuadrada src={h.url} enc={h} aspecto={String(aspectoFoto(h.w, h.h))} radio={8} fondo="rgba(183,110,121,.08)" />
                      <button onClick={() => setEditorEnc({ tipo: 'historia', i })} style={{ position: 'absolute' as const, left: 4, bottom: 4, border: 'none', background: 'rgba(255,255,255,.92)', color: '#3D2B2E', fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 99, cursor: 'pointer', fontFamily: F }}>{lang === 'en' ? 'Position' : 'Acomodar'}</button>
                      <button onClick={() => quitarHistoria(i)} aria-label={lang === 'en' ? 'Remove photo' : 'Quitar foto'} style={{ position: 'absolute' as const, top: 4, right: 4, border: 'none', background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 11, width: 20, height: 20, borderRadius: '50%', cursor: 'pointer', lineHeight: 1 }}>✕</button>
                    </div>
                    <input defaultValue={h.pie || ''} maxLength={80} onBlur={e => guardarPieHistoria(i, e.target.value)} placeholder={lang === 'en' ? 'Caption' : 'Pie de foto'} style={{ ...inputStyle, width: '100%', fontSize: 11, padding: '6px 8px', marginTop: 4, marginBottom: 0 }} />
                  </div>
                ))}
                {historiaItems.length < 6 && (
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '4/5', border: '1.5px dashed rgba(183,110,121,.45)', borderRadius: 8, cursor: subiendoMedia ? 'default' : 'pointer', fontSize: 11, fontWeight: 700, color: '#B76E79', textAlign: 'center' as const, padding: 6, opacity: subiendoMedia === 'historia' ? .5 : 1 }}>
                    {subiendoMedia === 'historia' ? `${lang === 'en' ? 'Uploading…' : 'Subiendo…'} ${progresoFotos}` : (lang === 'en' ? '+ Add photos (you can pick several)' : '+ Agregar fotos (puedes elegir varias)')}
                    <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/*" disabled={!!subiendoMedia} onChange={e => { const fs = Array.from(e.target.files || []); if (fs.length) subirVarias(fs); e.target.value = '' }} style={{ display: 'none' }} />
                  </label>
                )}
              </div>

              {editorEnc?.tipo === 'historia' && historiaItems[editorEnc.i] && (
                <EditorEncuadre
                  url={historiaItems[editorEnc.i].url} aspecto="auto" inicial={historiaItems[editorEnc.i]} lang={lang}
                  titulo={lang === 'en' ? 'Position this photo' : 'Acomoda esta foto'}
                  onGuardar={e => { guardarEncuadreHistoria(editorEnc.i, e); setEditorEnc(null) }} onCancelar={() => setEditorEnc(null)}
                />
              )}
              {editorEnc?.tipo === 'portada' && proyecto?.portada_url && (
                <EditorEncuadre
                  url={proyecto.portada_url} aspecto="3/4" arco inicial={leerEncuadreTexto(proyecto.portada_posicion)} lang={lang}
                  titulo={lang === 'en' ? 'Position your cover photo' : 'Acomoda tu foto de portada'}
                  onGuardar={e => { guardarEncuadrePortada(e); setEditorEnc(null) }} onCancelar={() => setEditorEnc(null)}
                />
              )}
              <button onClick={guardarPersonalizacion} style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F, marginTop: 4 }}>{personalGuardado ? (lang === 'en' ? 'Saved ✓' : 'Guardado ✓') : (lang === 'en' ? 'Save' : 'Guardar')}</button>
            </div>

            {/* Libro de firmas: los invitados escriben, la pareja aprueba antes de que se vuelva público */}
            <div style={{ background: 'rgba(183,110,121,.06)', borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(61,43,46,.45)', fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 10 }}>
                {lang === 'en' ? 'Guest book' : 'Libro de firmas'}
              </div>
              {firmasBoda.filter(f => !f.aprobado).length === 0 && firmasBoda.filter(f => f.aprobado).length === 0 && (
                <p style={{ fontSize: 12, color: 'rgba(61,43,46,.4)', margin: 0 }}>{lang === 'en' ? 'No messages yet.' : 'Todavía no hay mensajes.'}</p>
              )}
              {firmasBoda.filter(f => !f.aprobado).length > 0 && (
                <div style={{ marginBottom: firmasBoda.some(f => f.aprobado) ? 14 : 0 }}>
                  <div style={{ fontSize: 10, color: '#B45309', fontWeight: 800, marginBottom: 6 }}>{lang === 'en' ? 'PENDING APPROVAL' : 'PENDIENTES DE APROBAR'}</div>
                  {firmasBoda.filter(f => !f.aprobado).map(f => (
                    <div key={f.id} style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#3D2B2E', marginBottom: 3 }}>{f.nombre}</div>
                      <div style={{ fontSize: 13, color: '#3D2B2E', marginBottom: 8, whiteSpace: 'pre-wrap' as const }}>{f.mensaje}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => aprobarFirma(f.id)} style={{ border: 'none', background: '#2E7D32', color: '#fff', fontSize: 11, fontWeight: 800, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: F }}>{lang === 'en' ? 'Approve' : 'Aprobar'}</button>
                        <button onClick={() => rechazarFirma(f.id)} style={{ border: '1px solid rgba(0,0,0,.15)', background: 'transparent', color: '#3D2B2E', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: F }}>{lang === 'en' ? 'Reject' : 'Rechazar'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {firmasBoda.filter(f => f.aprobado).length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(61,43,46,.4)', fontWeight: 800, marginBottom: 6 }}>{lang === 'en' ? `PUBLISHED (${firmasBoda.filter(f => f.aprobado).length})` : `PUBLICADOS (${firmasBoda.filter(f => f.aprobado).length})`}</div>
                  {firmasBoda.filter(f => f.aprobado).map(f => (
                    <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,.05)' }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#3D2B2E' }}>{f.nombre}: </span>
                        <span style={{ fontSize: 12, color: 'rgba(61,43,46,.6)' }}>{f.mensaje}</span>
                      </div>
                      <button onClick={() => rechazarFirma(f.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(61,43,46,.35)', fontSize: 11, cursor: 'pointer', fontFamily: F, flexShrink: 0 }}>{lang === 'en' ? 'remove' : 'quitar'}</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Álbum de fotos: mismo criterio de moderación que el libro de firmas */}
            <div style={{ background: 'rgba(183,110,121,.06)', borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(61,43,46,.45)', fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 10 }}>
                {lang === 'en' ? 'Shared photo album' : 'Álbum de fotos compartido'}
              </div>
              {fotosBoda.length === 0 && (
                <p style={{ fontSize: 12, color: 'rgba(61,43,46,.4)', margin: 0 }}>{lang === 'en' ? 'No photos yet.' : 'Todavía no hay fotos.'}</p>
              )}
              {fotosBoda.filter(f => !f.aprobado).length > 0 && (
                <div style={{ marginBottom: fotosBoda.some(f => f.aprobado) ? 14 : 0 }}>
                  <div style={{ fontSize: 10, color: '#B45309', fontWeight: 800, marginBottom: 6 }}>{lang === 'en' ? 'PENDING APPROVAL' : 'PENDIENTES DE APROBAR'}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
                    {fotosBoda.filter(f => !f.aprobado).map(f => (
                      <div key={f.id} style={{ position: 'relative' as const }}>
                        <img src={f.url} alt="" style={{ width: '100%', height: 90, objectFit: 'cover' as const, borderRadius: 8, display: 'block' }} />
                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                          <button onClick={() => aprobarFoto(f.id)} style={{ flex: 1, border: 'none', background: '#2E7D32', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px', borderRadius: 6, cursor: 'pointer', fontFamily: F }}>{lang === 'en' ? 'OK' : 'Sí'}</button>
                          <button onClick={() => rechazarFoto(f)} style={{ flex: 1, border: '1px solid rgba(0,0,0,.15)', background: 'transparent', color: '#3D2B2E', fontSize: 10, fontWeight: 700, padding: '4px', borderRadius: 6, cursor: 'pointer', fontFamily: F }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {fotosBoda.filter(f => f.aprobado).length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(61,43,46,.4)', fontWeight: 800, marginBottom: 6 }}>{lang === 'en' ? `PUBLISHED (${fotosBoda.filter(f => f.aprobado).length})` : `PUBLICADAS (${fotosBoda.filter(f => f.aprobado).length})`}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
                    {fotosBoda.filter(f => f.aprobado).map(f => (
                      <div key={f.id} style={{ position: 'relative' as const }}>
                        <img src={f.url} alt="" style={{ width: '100%', height: 90, objectFit: 'cover' as const, borderRadius: 8, display: 'block' }} />
                        <button onClick={() => rechazarFoto(f)} style={{ position: 'absolute' as const, top: 4, right: 4, border: 'none', background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 11, width: 20, height: 20, borderRadius: '50%', cursor: 'pointer', lineHeight: 1 }}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Diseño de la invitación digital que ven los invitados */}
            <div style={{ background: 'rgba(183,110,121,.06)', borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'rgba(61,43,46,.45)', fontWeight: 800, textTransform: 'uppercase' as const }}>
                  {lang === 'en' ? 'Invitation design' : 'Diseño de la invitación'}
                </div>
                <span style={{ display: 'flex', gap: 12 }}>
                  <a href={`/bridal/preview/${id}?std=1`} target="_blank" style={{ fontSize: 11, color: '#B76E79', fontWeight: 700 }}>Save the date →</a>
                  <a href={`/bridal/preview/${id}`} target="_blank" style={{ fontSize: 11, color: '#B76E79', fontWeight: 700 }}>
                    {lang === 'en' ? 'Full-size preview →' : 'Vista previa a tamaño real →'}
                  </a>
                </span>
              </div>

              {(() => {
                const codigo = /^[a-z0-9]{8,24}$/.test(String(proyecto?.std_codigo || '')) ? String(proyecto.std_codigo) : ''
                const linkStd = codigo ? `${typeof window !== 'undefined' ? window.location.origin : 'https://joincheers.app'}/bridal/std/${codigo}` : ''
                const textoWa = `${lang === 'en' ? 'Save the date' : 'Aparta la fecha'}: ${linkStd}`
                return (
                  <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 12, background: stdActivo ? 'rgba(201,168,118,.18)' : 'rgba(183,110,121,.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: 'rgba(61,43,46,.45)', fontWeight: 800, textTransform: 'uppercase' as const }}>
                        {lang === 'en' ? 'Save the date (one link for everyone)' : 'Save the date (un link para todos)'}
                      </div>
                      <button onClick={() => guardarStd(!stdActivo, stdLugarInput)} style={{ border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 11, fontWeight: 800, padding: '6px 12px', borderRadius: 99, background: stdActivo ? 'linear-gradient(135deg,#C9A876,#C98A93)' : 'rgba(255,255,255,.8)', color: stdActivo ? '#fff' : 'rgba(61,43,46,.6)' }}>
                        {stdActivo ? (lang === 'en' ? 'Active' : 'Activo') : (lang === 'en' ? 'Off' : 'Apagado')}
                      </button>
                    </div>
                    {stdActivo && linkStd ? (
                      <>
                        <div style={{ fontSize: 12, color: '#3D2B2E', background: 'rgba(255,255,255,.75)', borderRadius: 8, padding: '8px 10px', wordBreak: 'break-all' as const }}>{linkStd}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' as const }}>
                          <button onClick={() => { navigator.clipboard?.writeText(linkStd).then(() => { setStdCopiado(true); setTimeout(() => setStdCopiado(false), 1800) }) }} style={{ border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 11, fontWeight: 800, padding: '8px 12px', borderRadius: 9, background: '#B76E79', color: '#fff' }}>
                            {stdCopiado ? (lang === 'en' ? 'Copied' : 'Copiado') : (lang === 'en' ? 'Copy link' : 'Copiar link')}
                          </button>
                          <a href={`https://wa.me/?text=${encodeURIComponent(textoWa)}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', fontFamily: F, fontSize: 11, fontWeight: 800, padding: '8px 12px', borderRadius: 9, background: 'rgba(255,255,255,.8)', color: '#3D2B2E' }}>WhatsApp</a>
                          <a href={linkStd} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', fontFamily: F, fontSize: 11, fontWeight: 800, padding: '8px 12px', borderRadius: 9, background: 'rgba(255,255,255,.8)', color: '#3D2B2E' }}>{lang === 'en' ? 'Open' : 'Ver'}</a>
                        </div>
                      </>
                    ) : (
                      <p style={{ fontSize: 11, color: 'rgba(61,43,46,.55)', margin: 0, lineHeight: 1.45 }}>
                        {lang === 'en' ? 'Turn it on to get one link with the date, city and lodging, to share with everyone.' : 'Préndelo para tener un solo link con la fecha, la ciudad y el hospedaje, para mandárselo a todos.'}
                      </p>
                    )}
                    <input value={stdLugarInput} maxLength={80} onChange={e => setStdLugarInput(e.target.value)} onBlur={() => guardarStd(stdActivo, stdLugarInput)} placeholder={lang === 'en' ? 'City shown (e.g. Monterrey, Nuevo León)' : 'Ciudad que se muestra (ej. Monterrey, Nuevo León)'} style={{ ...inputStyle, width: '100%', marginTop: 8 }} />
                    <p style={{ fontSize: 11, color: 'rgba(61,43,46,.55)', margin: '8px 0 0', lineHeight: 1.45 }}>
                      {lang === 'en' ? "Each guest's personal link is always the full invitation." : 'El link personal de cada invitado siempre es la invitación completa.'}
                    </p>
                  </div>
                )
              })()}

              <a href={`/bridal/${id}/despedida`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', marginBottom: 14, padding: '12px 14px', borderRadius: 12, background: 'rgba(183,110,121,.06)', color: '#3D2B2E' }}>
                <span style={{ fontSize: 12, fontWeight: 800 }}>{lang === 'en' ? 'Bridal shower: invitations and RSVPs' : 'Despedida: invitaciones y respuestas'}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#B76E79' }}>→</span>
              </a>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: 'rgba(61,43,46,.45)', fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 4 }}>
                  {lang === 'en' ? 'Public link to share' : 'Link público para compartir'}
                </div>
                {editandoSlug ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'rgba(61,43,46,.4)', whiteSpace: 'nowrap' as const }}>joincheers.app/boda/{miUsername}/</span>
                      <input value={slugInput} onChange={e => setSlugInput(e.target.value)} placeholder="boda-patty-y-valente" style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
                    </div>
                    {errorSlug && <p style={{ fontSize: 11, color: '#C24B4B', marginBottom: 6 }}>{errorSlug}</p>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={guardarSlug} disabled={guardandoSlug} style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 12, fontWeight: 800, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: F }}>
                        {guardandoSlug ? '...' : (lang === 'en' ? 'Save' : 'Guardar')}
                      </button>
                      <button onClick={() => { setEditandoSlug(false); setErrorSlug('') }} style={{ border: '1px solid rgba(183,110,121,.2)', background: 'transparent', color: 'rgba(61,43,46,.5)', fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: F }}>
                        {lang === 'en' ? 'Cancel' : 'Cancelar'}
                      </button>
                    </div>
                  </div>
                ) : proyecto?.slug ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <a href={`/boda/${miUsername}/${proyecto.slug}`} target="_blank" style={{ fontSize: 12, color: '#B76E79', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      joincheers.app/boda/{miUsername}/{proyecto.slug}
                    </a>
                    <button onClick={() => setEditandoSlug(true)} style={{ border: 'none', background: 'transparent', color: 'rgba(61,43,46,.4)', fontSize: 11, cursor: 'pointer', fontFamily: F }}>{lang === 'en' ? 'edit' : 'editar'}</button>
                  </div>
                ) : (
                  <button onClick={() => setEditandoSlug(true)} style={{ border: 'none', background: 'rgba(183,110,121,.1)', color: '#B76E79', fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: F }}>
                    {lang === 'en' ? '+ Create public link' : '+ Crear link público'}
                  </button>
                )}
              </div>

              <input ref={portadaInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) subirPortada(f) }} style={{ display: 'none' }} />
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
                <div onClick={() => portadaInputRef.current?.click()} style={{ position: 'relative', width: 80, height: 80, borderRadius: 12, overflow: 'hidden', background: 'rgba(183,110,121,.08)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {proyecto?.portada_url ? (
                    <FotoEncuadrada src={proyecto.portada_url} alt="portada" enc={leerEncuadreTexto(proyecto.portada_posicion)} optimizada sizes="80px" />
                  ) : (
                    <span style={{ fontSize: 10, color: 'rgba(61,43,46,.4)', fontWeight: 700, textAlign: 'center' as const, padding: 4 }}>{subiendoPortada ? '...' : (lang === 'en' ? 'Add photo' : 'Agregar foto')}</span>
                  )}
                </div>
                {proyecto?.portada_url && (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                    <button onClick={() => portadaInputRef.current?.click()} style={{ border: 'none', background: 'rgba(183,110,121,.1)', color: '#3D2B2E', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: F, textAlign: 'left' as const }}>
                      {lang === 'en' ? 'Change photo' : 'Cambiar foto'}
                    </button>
                    <button onClick={() => setEditorEnc({ tipo: 'portada' })} style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: F, textAlign: 'left' as const }}>
                      {lang === 'en' ? 'Position photo' : 'Acomodar foto'}
                    </button>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[{ v: 'top', l: lang === 'en' ? 'Top' : 'Arriba' }, { v: 'center', l: lang === 'en' ? 'Center' : 'Centro' }, { v: 'bottom', l: lang === 'en' ? 'Bottom' : 'Abajo' }].map(p => (
                        <button key={p.v} onClick={() => guardarPortadaPosicion(p.v)} style={{ border: 'none', background: (proyecto?.portada_posicion || 'center') === p.v ? 'rgba(183,110,121,.9)' : 'rgba(183,110,121,.08)', color: (proyecto?.portada_posicion || 'center') === p.v ? '#3D2B2E' : 'rgba(61,43,46,.6)', fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: F }}>{p.l}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Vista previa real por tema — como Zola/Joy/Bliss & Bone: cada tarjeta
                  ya muestra tu foto, tus nombres y tu fecha con ese tema puesto, no
                  solo un color suelto. Toca una para elegirla. */}
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <button aria-label={lang === 'en' ? 'Previous' : 'Anterior'} onClick={() => temaCarruselRef.current?.scrollBy({ left: -160, behavior: 'smooth' })} style={{
                  position: 'absolute', left: -6, top: 76, zIndex: 2, width: 30, height: 30, borderRadius: '50%', border: 'none',
                  background: 'rgba(0,0,0,.55)', color: '#3D2B2E', cursor: 'pointer', fontSize: 15, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.3)',
                }}>‹</button>
                <button aria-label={lang === 'en' ? 'Next' : 'Siguiente'} onClick={() => temaCarruselRef.current?.scrollBy({ left: 160, behavior: 'smooth' })} style={{
                  position: 'absolute', right: -6, top: 76, zIndex: 2, width: 30, height: 30, borderRadius: '50%', border: 'none',
                  background: 'rgba(0,0,0,.55)', color: '#3D2B2E', cursor: 'pointer', fontSize: 15, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.3)',
                }}>›</button>
                <div ref={temaCarruselRef} style={{ display: 'flex', gap: 10, overflowX: 'auto' as const, paddingBottom: 4, WebkitOverflowScrolling: 'touch' as const, scrollBehavior: 'smooth' as const }}>
                {TEMA_ORDER.map(k => {
                  const t = TEMAS[k]
                  const seleccionado = (proyecto?.tema || 'morado') === k
                  const txt = t.dark ? '#fff' : '#3D2B2E'
                  const nombreBoda = [proyecto?.nombre_novia, proyecto?.nombre_novio].filter(Boolean).join(' & ') || (lang === 'en' ? 'Your names' : 'Tus nombres')
                  const fechaBonita = fmtFechaBonita(proyecto?.fecha_boda, lang)
                  return (
                    <div key={k} style={{ flexShrink: 0, width: 138 }}>
                      <div onClick={() => guardarTema(k)} style={{ position: 'relative', width: 138, height: 172, borderRadius: 16, overflow: 'hidden', cursor: 'pointer', background: t.bg, outline: seleccionado ? '3px solid #B76E79' : '3px solid transparent', outlineOffset: 2 }}>
                        {proyecto?.portada_url && (
                          <>
                            <Image src={proyecto.portada_url} alt="" fill sizes="138px" style={{ ...estiloFotoConPosicion(proyecto.portada_posicion), opacity: .5 }} />
                            <div style={{ position: 'absolute', inset: 0, background: t.bg, opacity: .55 }} />
                          </>
                        )}
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '10px 10px', textAlign: 'center' as const }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: txt, fontFamily: FUENTES[proyecto?.fuente || 'system'].font, lineHeight: 1.2 }}>{nombreBoda}</div>
                          {fechaBonita && <div style={{ fontSize: 9, color: txt, opacity: .85, marginTop: 6, textTransform: 'uppercase' as const, letterSpacing: '.5px' }}>{fechaBonita}</div>}
                        </div>
                        {seleccionado && (
                          <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#B76E79' }}>✓</div>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(61,43,46,.55)', fontWeight: 700, textAlign: 'center' as const, marginTop: 6 }}>{lang === 'en' ? t.label_en : t.label_es}</div>
                    </div>
                  )
                })}
                </div>
              </div>

              {(proyecto?.tema || 'morado') === 'rosapolvo' ? (
                <div style={{ fontSize: 11, color: 'rgba(61,43,46,.5)', fontStyle: 'italic' }}>{lang === 'en' ? 'This theme comes with its own calligraphy and fonts.' : 'Este tema ya trae su propia caligrafía y tipografías.'}</div>
              ) : (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                {FUENTE_ORDER.map(k => (
                  <button key={k} onClick={() => guardarFuente(k)} style={{
                    border: (proyecto?.fuente || 'system') === k ? '2px solid #B76E79' : '2px solid rgba(183,110,121,.2)', borderRadius: 9, padding: '7px 12px', cursor: 'pointer',
                    background: (proyecto?.fuente || 'system') === k ? 'rgba(183,110,121,.95)' : 'rgba(183,110,121,.08)',
                    color: (proyecto?.fuente || 'system') === k ? '#fff' : 'rgba(61,43,46,.7)', fontSize: 12, fontFamily: FUENTES[k].font, fontWeight: 700,
                  }}>{FUENTES[k].label}</button>
                ))}
              </div>
              )}
            </div>

            {/* Métricas por módulo */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {moduloActivo('presupuesto') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(183,110,121,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#3D2B2E' }}>{lang === 'en' ? 'Budget' : 'Presupuesto'}</div>
                  <div style={{ fontSize: 12, color: '#B76E79' }}>{fmtMoney(totalPagado)} / {fmtMoney(presupuestoMetaTile)}{totalEstimado === 0 && presupuestoMetaTile > 0 ? (lang === 'en' ? ' (estimate)' : ' (estimado)') : ''}</div>
                  {pagosVencidos.length > 0 && <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99, background: '#f4a3a3', color: '#3D2B2E' }}>{pagosVencidos.length} {lang === 'en' ? 'overdue' : 'vencidos'}</span>}
                  {pagosProximos.length > 0 && <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99, background: '#c98a1e', color: '#3D2B2E' }}>{pagosProximos.length} {lang === 'en' ? 'due soon' : 'próximos'}</span>}
                </div>
              )}
              {moduloActivo('proveedores') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(183,110,121,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#3D2B2E' }}>{lang === 'en' ? 'Vendors' : 'Proveedores'}</div>
                  <div style={{ fontSize: 12, color: '#B76E79' }}>{proveedores.filter(p => p.estado === 'contratado').length}/{proveedores.length} {lang === 'en' ? 'booked' : 'contratados'}</div>
                </div>
              )}
              {moduloActivo('invitados') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(183,110,121,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#3D2B2E' }}>{lang === 'en' ? 'Guests' : 'Invitados'}</div>
                  <div style={{ fontSize: 12, color: '#B76E79' }}>{rsvpConfirmados}/{invitadosMetaTile} {lang === 'en' ? 'confirmed' : 'confirmados'}{invitadosBoda.length === 0 && invitadosMetaTile > 0 ? (lang === 'en' ? ' (estimate)' : ' (estimado)') : ''}</div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(183,110,121,.06)', borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#3D2B2E' }}>Timeline</div>
                <div style={{ fontSize: 12, color: '#B76E79' }}>{timeline.filter(x => x.completado).length}/{timeline.length}</div>
              </div>
              {['novia', 'novio', 'pareja', 'luna_miel', 'vida_despues', 'embarazo', 'wedding_planner', 'beauty_timeline', 'dia_b'].filter(moduloActivo).map(k => {
                const items = tablero.filter(x => x.tablero === k)
                const modulo = MODULOS.find(m => m.key === k)!
                if (k === 'wedding_planner' && !wpContratado) return null
                return (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(183,110,121,.06)', borderRadius: 12, padding: '10px 14px' }}>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#3D2B2E' }}>{lang === 'en' ? modulo.en : modulo.es}</div>
                    <div style={{ fontSize: 12, color: '#B76E79' }}>{items.filter(x => x.completado).length}/{items.length}</div>
                  </div>
                )
              })}
              {moduloActivo('contratos') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(183,110,121,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#3D2B2E' }}>{lang === 'en' ? 'Contracts' : 'Contratos'}</div>
                  <div style={{ fontSize: 12, color: '#B76E79' }}>{contratosFirmados}/{contratos.length} {lang === 'en' ? 'signed' : 'firmados'}</div>
                </div>
              )}
              {moduloActivo('pagos') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(183,110,121,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#3D2B2E' }}>{lang === 'en' ? 'Payments' : 'Pagos'}</div>
                  <div style={{ fontSize: 12, color: '#B76E79' }}>{fmtMoney(totalPagos)}</div>
                </div>
              )}
              {moduloActivo('inspiracion') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(183,110,121,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#3D2B2E' }}>{lang === 'en' ? 'Inspiration' : 'Inspiración'}</div>
                  <div style={{ fontSize: 12, color: '#B76E79' }}>{proyecto?.link_inspiracion ? (lang === 'en' ? 'Saved' : 'Guardado') : (lang === 'en' ? 'Pending' : 'Pendiente')}</div>
                </div>
              )}
            </div>

            {/* Módulos: prender/apagar */}
            <div style={{ fontSize: 11, color: 'rgba(61,43,46,.4)', fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 8 }}>{lang === 'en' ? 'Modules' : 'Módulos'}</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
              {MODULOS.map(m => {
                const activo = moduloActivo(m.key)
                return (
                  <div key={m.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(183,110,121,.04)', borderRadius: 10, opacity: activo ? 1 : .5 }}>
                    <span style={{ fontSize: 13, color: 'rgba(61,43,46,.8)', fontWeight: 600 }}>{lang === 'en' ? m.en : m.es}</span>
                    <button onClick={() => toggleModulo(m.key)} style={{
                      border: 'none', cursor: 'pointer', width: 40, height: 24, borderRadius: 99, padding: 3,
                      background: activo ? 'linear-gradient(135deg,#C9A876,#C98A93)' : 'rgba(183,110,121,.2)', display: 'flex', justifyContent: activo ? 'flex-end' : 'flex-start',
                    }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', display: 'block' }} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'invitados' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, background: 'rgba(183,110,121,.06)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'rgba(61,43,46,.5)', fontWeight: 700 }}>{lang === 'en' ? 'Confirmed' : 'Confirmados'}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#3FA76B' }}>{rsvpsBoda.filter(r => r.asistencia === 'si').length}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(183,110,121,.06)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'rgba(61,43,46,.5)', fontWeight: 700 }}>{lang === 'en' ? 'Pending' : 'Por confirmar'}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#3D2B2E' }}>{invitadosBoda.length - rsvpsBoda.length}</div>
              </div>
            </div>

            {invitadosBoda.length - rsvpsBoda.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'rgba(61,43,46,.4)', fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 8 }}>
                  {lang === 'en' ? 'Remind pending guests' : 'Recordar a pendientes'}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                  <button onClick={recordarPorCorreo} disabled={recordando} style={{ border: 'none', background: 'rgba(183,110,121,.1)', color: '#3D2B2E', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>
                    {recordando ? '...' : (lang === 'en' ? 'By email' : 'Por correo')}
                  </button>
                  <button onClick={recordarSiguientePorWA} style={{ border: 'none', background: '#25D366', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>
                    {lang === 'en' ? 'By WhatsApp (next one)' : 'Por WhatsApp (el siguiente)'}
                  </button>
                </div>
                {ultimoRecordatorio && <p style={{ fontSize: 11, color: 'rgba(61,43,46,.45)', marginTop: 8 }}>{ultimoRecordatorio}</p>}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {apartadas.length > 0 && invitadosBoda.length > 0 && (
                <div style={{ fontSize: 12, fontWeight: 800, color: '#3D2B2E', margin: '2px 0 10px' }}>
                  {apartadas.length} {lang === 'en' ? 'of' : 'de'} {invitadosBoda.length} {lang === 'en' ? 'have saved the date' : 'ya apartaron la fecha'}
                </div>
              )}
              {invitadosBoda.map(inv => {
                const rsvp = rsvpsBoda.find(r => r.invitado_id === inv.id)
                return (
                  <div key={inv.id} style={{ background: 'rgba(183,110,121,.06)', borderRadius: 12, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#3D2B2E' }}>{inv.nombre}</div>
                        <div style={{ fontSize: 11, color: 'rgba(61,43,46,.4)' }}>
                          {[inv.grupo, inv.acompanantes_permitidos > 0 ? `+${inv.acompanantes_permitidos}` : null].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      {apartadas.includes(inv.id) && (
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 9px', borderRadius: 99, background: 'rgba(201,168,118,.25)', color: '#3D2B2E' }}>
                          {lang === 'en' ? 'Saved the date' : 'Apartó la fecha'}
                        </span>
                      )}
                      {rsvp ? (
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 9px', borderRadius: 99, background: ASISTENCIA_LABEL[rsvp.asistencia].color, color: '#3D2B2E' }}>
                          {lang === 'en' ? ASISTENCIA_LABEL[rsvp.asistencia].en : ASISTENCIA_LABEL[rsvp.asistencia].es}
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 9px', borderRadius: 99, background: 'rgba(183,110,121,.1)', color: 'rgba(61,43,46,.5)' }}>
                          {lang === 'en' ? 'Pending' : 'Sin responder'}
                        </span>
                      )}
                      <button onClick={() => enviarInvitacionWA(inv)} title="WhatsApp" style={{ border: 'none', background: '#25D366', color: '#fff', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', flexShrink: 0, fontSize: 13 }}>↗</button>
                      <button onClick={() => capturandoManual === inv.id ? setCapturandoManual(null) : abrirCapturaManual(inv)} title={lang === 'en' ? 'Log a call' : 'Registrar llamada'} style={{ border: 'none', background: 'rgba(183,110,121,.12)', color: '#3D2B2E', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', flexShrink: 0, fontSize: 12 }}>☎</button>
                      <button onClick={() => borrarInvitadoBoda(inv.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(61,43,46,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                    </div>

                    {capturandoManual === inv.id && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(183,110,121,.15)' }}>
                        <p style={{ fontSize: 11, color: 'rgba(61,43,46,.45)', marginBottom: 8 }}>
                          {lang === 'en' ? 'Log what they confirmed by phone — same as a digital RSVP.' : 'Registra lo que confirmó por teléfono — cuenta igual que un RSVP digital.'}
                        </p>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                          {(['si', 'tal_vez', 'no'] as const).map(op => (
                            <button key={op} onClick={() => setManualAsistencia(op)} style={{
                              flex: 1, border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 12, fontWeight: 800, padding: '8px', borderRadius: 8,
                              background: manualAsistencia === op ? 'linear-gradient(135deg,#C9A876,#C98A93)' : 'rgba(183,110,121,.08)',
                              color: manualAsistencia === op ? '#fff' : 'rgba(61,43,46,.6)',
                            }}>{op === 'si' ? (lang === 'en' ? 'Yes' : 'Sí') : op === 'no' ? 'No' : (lang === 'en' ? 'Maybe' : 'Tal vez')}</button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 8 }}>
                          <select value={manualMenu} onChange={e => setManualMenu(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 110, colorScheme: 'light' as const }}>
                            <option value="">{lang === 'en' ? 'Meal' : 'Platillo'}</option>
                            {['res', 'pollo', 'vegetariano', 'vegano'].map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <input type="number" min={0} value={manualAcompanantes} onChange={e => setManualAcompanantes(e.target.value)} placeholder={lang === 'en' ? '+1s' : 'Acompañantes'} style={{ ...inputStyle, width: 90 }} />
                        </div>
                        <input value={manualNotas} onChange={e => setManualNotas(e.target.value)} placeholder={lang === 'en' ? 'Note (optional)' : 'Nota (opcional)'} style={{ ...inputStyle, width: '100%' }} />
                        <button onClick={() => guardarRsvpManual(inv.id)} disabled={!manualAsistencia || guardando} style={{ border: 'none', background: !manualAsistencia ? 'rgba(183,110,121,.18)' : 'linear-gradient(135deg,#C9A876,#C98A93)', color: !manualAsistencia ? 'rgba(61,43,46,.5)' : '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: manualAsistencia ? 'pointer' : 'default', fontFamily: F }}>
                          {lang === 'en' ? 'Save' : 'Guardar'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{ background: 'rgba(183,110,121,.05)', borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#3D2B2E', marginBottom: 4 }}>{lang === 'en' ? 'Import from Excel' : 'Importar desde Excel'}</div>
              <div style={{ fontSize: 11, color: 'rgba(61,43,46,.5)', marginBottom: 10 }}>
                {lang === 'en' ? "Upload your guest list (.xlsx, .xls or .csv) — we'll find the names automatically." : 'Sube tu lista de invitados (.xlsx, .xls o .csv) — detectamos los nombres solos, sin importar el orden de las columnas.'}
              </div>
              <input ref={excelInvitadosRef} type="file" accept=".xlsx,.xls,.csv" onChange={e => { const f = e.target.files?.[0]; if (f) onArchivoInvitados(f) }} style={{ display: 'none' }} />
              <button onClick={() => excelInvitadosRef.current?.click()} style={{ border: 'none', background: 'rgba(183,110,121,.1)', color: '#3D2B2E', fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: F }}>
                {lang === 'en' ? 'Choose file' : 'Elegir archivo'}
              </button>
              {errorImportInv && <div style={{ fontSize: 11, color: '#C24B4B', marginTop: 8 }}>{errorImportInv}</div>}

              {previewImportInv && (
                <div style={{ marginTop: 12, background: 'rgba(0,0,0,.15)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#3D2B2E', marginBottom: 6 }}>
                    {lang === 'en' ? `Found ${previewImportInv.length} guests:` : `Encontré ${previewImportInv.length} invitados:`}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(61,43,46,.6)', maxHeight: 120, overflowY: 'auto' as const, marginBottom: 10, lineHeight: 1.6 }}>
                    {previewImportInv.slice(0, 8).map((r, i) => <div key={i}>{r.nombre}{r.grupo ? ` · ${r.grupo}` : ''}</div>)}
                    {previewImportInv.length > 8 && <div>{lang === 'en' ? `+ ${previewImportInv.length - 8} more` : `+ ${previewImportInv.length - 8} más`}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={confirmarImportacionInv} disabled={importandoInv} style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 12, fontWeight: 800, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: F }}>
                      {importandoInv ? '...' : (lang === 'en' ? `Add ${previewImportInv.length} guests` : `Agregar ${previewImportInv.length} invitados`)}
                    </button>
                    <button onClick={() => { setPreviewImportInv(null); if (excelInvitadosRef.current) excelInvitadosRef.current.value = '' }} style={{ border: 'none', background: 'rgba(183,110,121,.08)', color: 'rgba(61,43,46,.6)', fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: F }}>
                      {lang === 'en' ? 'Cancel' : 'Cancelar'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ fontSize: 11, color: 'rgba(61,43,46,.4)', fontWeight: 700, marginBottom: 8 }}>{lang === 'en' ? 'Or add one at a time' : 'O agrega uno a la vez'}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <input value={nuevoInvNombre} onChange={e => setNuevoInvNombre(e.target.value)} placeholder={lang === 'en' ? 'Name' : 'Nombre'} style={{ ...inputStyle, flex: 2, minWidth: 120 }} />
              <input value={nuevoInvContacto} onChange={e => setNuevoInvContacto(e.target.value)} placeholder={lang === 'en' ? 'Phone or email' : 'Teléfono o email'} style={{ ...inputStyle, flex: 1, minWidth: 130 }} />
              <input value={nuevoInvGrupo} onChange={e => setNuevoInvGrupo(e.target.value)} placeholder={lang === 'en' ? 'Group' : 'Grupo'} style={{ ...inputStyle, flex: 1, minWidth: 90 }} />
              <input type="number" min={0} value={nuevoInvAcompanantes} onChange={e => setNuevoInvAcompanantes(e.target.value)} placeholder={lang === 'en' ? '+1s' : 'Acompañantes'} style={{ ...inputStyle, width: 80 }} />
              <button onClick={agregarInvitadoBoda} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
            </div>
          </div>
        )}

        {tab === 'mesas' && (
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
              <input value={nuevaMesaNombre} onChange={e => setNuevaMesaNombre(e.target.value)} placeholder={lang === 'en' ? 'Table name (e.g. Table 1)' : 'Nombre de la mesa (ej. Mesa 1)'} style={{ ...inputStyle, flex: 2, minWidth: 140 }} />
              <input type="number" min={0} value={nuevaMesaCapacidad} onChange={e => setNuevaMesaCapacidad(e.target.value)} placeholder={lang === 'en' ? 'Seats' : 'Capacidad'} style={{ ...inputStyle, width: 100 }} />
              <button onClick={agregarMesa} disabled={guardandoMesa || !nuevaMesaNombre.trim()} style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
            </div>

            {mesasBoda.length === 0 && (
              <p style={{ fontSize: 13, color: 'rgba(61,43,46,.45)', marginBottom: 20 }}>
                {lang === 'en' ? 'Create your first table above to start seating your guests.' : 'Crea tu primera mesa arriba para empezar a acomodar a tus invitados.'}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12, marginBottom: 20 }}>
              {mesasBoda.map(mesa => {
                const asignados = invitadosBoda.filter(i => i.mesa_id === mesa.id)
                const ocupados = asignados.reduce((sum, i) => sum + asientosDe(i.id), 0)
                return (
                  <div key={mesa.id} style={{ background: 'rgba(183,110,121,.06)', borderRadius: 14, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: asignados.length > 0 ? 10 : 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#3D2B2E' }}>{mesa.nombre}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: mesa.capacidad && ocupados > mesa.capacidad ? '#C24B4B' : 'rgba(61,43,46,.5)' }}>
                          {ocupados}{mesa.capacidad ? `/${mesa.capacidad}` : ''} {lang === 'en' ? 'seated' : 'sentados'}
                        </span>
                        <button onClick={() => borrarMesa(mesa.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(61,43,46,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                      </div>
                    </div>
                    {asignados.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                        {asignados.map(inv => (
                          <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,.5)', borderRadius: 8, padding: '6px 10px' }}>
                            <span style={{ fontSize: 12, color: '#3D2B2E', fontWeight: 600 }}>{inv.nombre}</span>
                            <button onClick={() => asignarInvitadoAMesa(inv.id, null)} style={{ border: 'none', background: 'transparent', color: '#B76E79', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
                              {lang === 'en' ? 'remove' : 'quitar'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {mesasBoda.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: 'rgba(61,43,46,.4)', fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 8 }}>
                  {lang === 'en' ? 'Not seated yet' : 'Sin mesa asignada'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {invitadosBoda.filter(i => !i.mesa_id).map(inv => (
                    <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(183,110,121,.06)', borderRadius: 12, padding: '10px 14px' }}>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#3D2B2E' }}>{inv.nombre}</span>
                      <select value="" onChange={e => e.target.value && asignarInvitadoAMesa(inv.id, e.target.value)} style={{ ...inputStyle, width: 160, marginBottom: 0, colorScheme: 'light' as const }}>
                        <option value="">{lang === 'en' ? 'Assign to…' : 'Asignar a…'}</option>
                        {mesasBoda.map(mesa => <option key={mesa.id} value={mesa.id}>{mesa.nombre}</option>)}
                      </select>
                    </div>
                  ))}
                  {invitadosBoda.filter(i => !i.mesa_id).length === 0 && (
                    <p style={{ fontSize: 13, color: 'rgba(61,43,46,.45)' }}>{lang === 'en' ? 'Everyone has a table.' : 'Todos tienen mesa.'}</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'presupuesto' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, background: 'rgba(183,110,121,.06)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'rgba(61,43,46,.5)', fontWeight: 700 }}>{lang === 'en' ? 'Estimated' : 'Estimado'}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#3D2B2E' }}>{fmtMoney(totalEstimado)}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(183,110,121,.06)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'rgba(61,43,46,.5)', fontWeight: 700 }}>{lang === 'en' ? 'Paid so far' : 'Pagado'}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#3FA76B' }}>{fmtMoney(totalPagado)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {presupuesto.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(183,110,121,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <input type="checkbox" checked={!!item.pagado} onChange={() => togglePagado(item)} style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#3D2B2E', textDecoration: item.pagado ? 'line-through' : 'none', opacity: item.pagado ? .6 : 1 }}>{item.nombre}</div>
                    <div style={{ fontSize: 11, color: item.fecha_limite && !item.pagado && item.fecha_limite < hoy ? '#C24B4B' : 'rgba(61,43,46,.4)' }}>
                      {[item.categoria, item.fecha_limite ? (lang === 'en' ? `due ${item.fecha_limite}` : `vence ${item.fecha_limite}`) : null].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#B76E79' }}>{fmtMoney(item.costo_real ?? item.costo_estimado)}</div>
                  <button onClick={() => borrarPresupuesto(item.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(61,43,46,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder={lang === 'en' ? 'Item' : 'Concepto'} style={{ ...inputStyle, flex: 2, minWidth: 120 }} />
              <input value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)} placeholder={lang === 'en' ? 'Category' : 'Categoría'} style={{ ...inputStyle, flex: 1, minWidth: 100 }} />
              <input type="number" value={nuevoCosto} onChange={e => setNuevoCosto(e.target.value)} placeholder={lang === 'en' ? 'Cost' : 'Costo'} style={{ ...inputStyle, width: 90 }} />
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 3 }}>
                <span style={{ fontSize: 9, color: 'rgba(61,43,46,.4)', fontWeight: 700, textTransform: 'uppercase' as const }}>{lang === 'en' ? 'Due date (optional)' : 'Fecha límite de pago (opcional)'}</span>
                <input type="date" value={nuevaFechaLimite} onChange={e => setNuevaFechaLimite(e.target.value)} style={{ ...inputStyle, colorScheme: 'light' as const, marginBottom: 0 }} />
              </div>
              <button onClick={agregarPresupuesto} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
            </div>
          </div>
        )}

        {tab === 'timeline' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {timeline.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(183,110,121,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <input type="checkbox" checked={!!item.completado} onChange={() => toggleCompletadoTimeline(item)} style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#3D2B2E', textDecoration: item.completado ? 'line-through' : 'none', opacity: item.completado ? .6 : 1 }}>{item.titulo}</div>
                  </div>
                  {item.fecha_objetivo && <div style={{ fontSize: 11, color: 'rgba(61,43,46,.45)', flexShrink: 0 }}>{item.fecha_objetivo}</div>}
                  <button onClick={() => borrarTimeline(item.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(61,43,46,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <input value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} placeholder={lang === 'en' ? 'Task' : 'Tarea'} style={{ ...inputStyle, flex: 2, minWidth: 140 }} />
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 3 }}>
                <span style={{ fontSize: 9, color: 'rgba(61,43,46,.4)', fontWeight: 700, textTransform: 'uppercase' as const }}>{lang === 'en' ? 'Target date' : 'Fecha objetivo'}</span>
                <input type="date" value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)} style={{ ...inputStyle, colorScheme: 'light' as const, marginBottom: 0 }} />
              </div>
              <button onClick={agregarTimeline} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
            </div>
          </div>
        )}

        {(tab === 'novia' || tab === 'novio' || tab === 'pareja' || tab === 'luna_miel' || tab === 'vida_despues' || tab === 'embarazo' || tab === 'beauty_timeline' || tab === 'dia_b') && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {tablero.filter(x => x.tablero === tab).map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(183,110,121,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <input type="checkbox" checked={!!item.completado} onChange={() => toggleCompletadoTablero(item)} style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: '#3D2B2E', textDecoration: item.completado ? 'line-through' : 'none', opacity: item.completado ? .6 : 1 }}>{item.titulo}</div>
                  <button onClick={() => borrarTablero(item.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(61,43,46,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={nuevoItem} onChange={e => setNuevoItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarTablero(tab)} placeholder={lang === 'en' ? 'Add a to-do' : 'Agregar pendiente'} style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => agregarTablero(tab as TableroKey)} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
            </div>
          </div>
        )}

        {tab === 'wedding_planner' && (
          <div>
            <div style={{ fontSize: 11, color: 'rgba(61,43,46,.4)', fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 8 }}>
              {lang === 'en' ? 'Compare candidates' : 'Comparativa'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {wpCandidatos.map(item => (
                <div key={item.id} style={{ background: 'rgba(183,110,121,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#3D2B2E' }}>{item.nombre}</div>
                      {item.contacto_nombre && <div style={{ fontSize: 11, color: 'rgba(61,43,46,.4)' }}>{item.contacto_nombre}</div>}
                    </div>
                    {item.costo_cotizado != null && <div style={{ fontSize: 13, fontWeight: 800, color: '#B76E79' }}>{fmtMoney(item.costo_cotizado)}</div>}
                    <button onClick={() => borrarProveedor(item.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(61,43,46,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' as const }}>
                    {ESTADOS_PROVEEDOR.map(e => (
                      <button key={e} onClick={() => cambiarEstadoProveedor(item, e)} style={{
                        border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 10, fontWeight: 800, padding: '4px 9px', borderRadius: 99,
                        background: item.estado === e ? ESTADO_LABEL[e].color : 'rgba(183,110,121,.08)',
                        color: item.estado === e ? '#3D2B2E' : 'rgba(61,43,46,.5)',
                      }}>{lang === 'en' ? ESTADO_LABEL[e].en : ESTADO_LABEL[e].es}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 24 }}>
              <input value={nuevoWpNombre} onChange={e => setNuevoWpNombre(e.target.value)} placeholder={lang === 'en' ? 'Candidate name' : 'Nombre'} style={{ ...inputStyle, flex: 2, minWidth: 130 }} />
              <input value={nuevoWpContacto} onChange={e => setNuevoWpContacto(e.target.value)} placeholder={lang === 'en' ? 'Contact' : 'Contacto'} style={{ ...inputStyle, flex: 1, minWidth: 90 }} />
              <input type="number" value={nuevoWpCosto} onChange={e => setNuevoWpCosto(e.target.value)} placeholder={lang === 'en' ? 'Quote' : 'Cotización'} style={{ ...inputStyle, width: 90 }} />
              <button onClick={agregarWpCandidato} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
            </div>

            {wpContratado ? (
              <div>
                <div style={{ fontSize: 11, color: 'rgba(61,43,46,.4)', fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 8 }}>
                  {lang === 'en' ? `What ${wpContratado.nombre} will do` : `Qué va a hacer ${wpContratado.nombre}`}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
                  {tablero.filter(x => x.tablero === 'wedding_planner').map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(183,110,121,.06)', borderRadius: 12, padding: '10px 14px' }}>
                      <input type="checkbox" checked={!!item.completado} onChange={() => toggleCompletadoTablero(item)} style={{ width: 16, height: 16, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: '#3D2B2E', textDecoration: item.completado ? 'line-through' : 'none', opacity: item.completado ? .6 : 1 }}>{item.titulo}</div>
                      <button onClick={() => borrarTablero(item.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(61,43,46,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={nuevoItem} onChange={e => setNuevoItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarTablero('wedding_planner')} placeholder={lang === 'en' ? 'Add a responsibility' : 'Agregar responsabilidad'} style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={() => agregarTablero('wedding_planner')} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'rgba(61,43,46,.4)' }}>
                {lang === 'en' ? 'Mark one candidate as "Booked" above to unlock their checklist.' : 'Marca a uno como "Contratado" arriba para desbloquear su checklist.'}
              </p>
            )}
          </div>
        )}

        {tab === 'proveedores' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {proveedores.map(item => (
                <div key={item.id} style={{ background: 'rgba(183,110,121,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#3D2B2E' }}>{item.nombre}</div>
                      {(item.categoria || item.contacto_nombre) && (
                        <div style={{ fontSize: 11, color: 'rgba(61,43,46,.4)' }}>{[item.categoria, item.contacto_nombre].filter(Boolean).join(' · ')}</div>
                      )}
                    </div>
                    {item.costo_cotizado != null && <div style={{ fontSize: 13, fontWeight: 800, color: '#B76E79' }}>{fmtMoney(item.costo_cotizado)}</div>}
                    <button onClick={() => borrarProveedor(item.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(61,43,46,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' as const }}>
                    {ESTADOS_PROVEEDOR.map(e => (
                      <button key={e} onClick={() => cambiarEstadoProveedor(item, e)} style={{
                        border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 10, fontWeight: 800, padding: '4px 9px', borderRadius: 99,
                        background: item.estado === e ? ESTADO_LABEL[e].color : 'rgba(183,110,121,.08)',
                        color: item.estado === e ? '#3D2B2E' : 'rgba(61,43,46,.5)',
                      }}>{lang === 'en' ? ESTADO_LABEL[e].en : ESTADO_LABEL[e].es}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <input value={nuevoProvNombre} onChange={e => setNuevoProvNombre(e.target.value)} placeholder={lang === 'en' ? 'Vendor name' : 'Nombre del proveedor'} style={{ ...inputStyle, flex: 2, minWidth: 130 }} />
              <input value={nuevoProvCategoria} onChange={e => setNuevoProvCategoria(e.target.value)} placeholder={lang === 'en' ? 'Category' : 'Categoría'} style={{ ...inputStyle, flex: 1, minWidth: 90 }} />
              <input value={nuevoProvContacto} onChange={e => setNuevoProvContacto(e.target.value)} placeholder={lang === 'en' ? 'Contact' : 'Contacto'} style={{ ...inputStyle, flex: 1, minWidth: 90 }} />
              <input type="number" value={nuevoProvCosto} onChange={e => setNuevoProvCosto(e.target.value)} placeholder={lang === 'en' ? 'Quote' : 'Cotización'} style={{ ...inputStyle, width: 90 }} />
              <button onClick={agregarProveedor} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
            </div>
          </div>
        )}

        {tab === 'contratos' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {contratos.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(183,110,121,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'rgba(61,43,46,.5)', fontWeight: 700, flexShrink: 0 }}>
                    <input type="checkbox" checked={!!item.firmado} onChange={() => toggleFirmado(item)} style={{ width: 16, height: 16 }} />
                    {lang === 'en' ? 'Signed' : 'Firmado'}
                  </label>
                  <div onClick={() => verContrato(item.archivo_url)} style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: '#B76E79', cursor: 'pointer', textDecoration: 'underline' }}>{item.nombre}</div>
                  <button onClick={() => borrarContrato(item)} style={{ border: 'none', background: 'transparent', color: 'rgba(61,43,46,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <input value={nuevoContratoNombre} onChange={e => setNuevoContratoNombre(e.target.value)} placeholder={lang === 'en' ? 'Contract name (optional)' : 'Nombre del contrato (opcional)'} style={{ ...inputStyle, flex: 1, minWidth: 160 }} />
              <label style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>
                {subiendoContrato ? '...' : (lang === 'en' ? 'Upload' : 'Subir')}
                <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => e.target.files?.[0] && subirContrato(e.target.files[0])} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        )}

        {tab === 'pagos' && (
          <div>
            <div style={{ background: 'rgba(183,110,121,.06)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(61,43,46,.5)', fontWeight: 700 }}>{lang === 'en' ? 'Total paid' : 'Total pagado'}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#3FA76B' }}>{fmtMoney(totalPagos)}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {pagos.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(183,110,121,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#3D2B2E' }}>{item.concepto}</div>
                    {item.fecha && <div style={{ fontSize: 11, color: 'rgba(61,43,46,.4)' }}>{item.fecha}</div>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#B76E79' }}>{fmtMoney(item.monto)}</div>
                  <button onClick={() => borrarPago(item.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(61,43,46,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <input value={nuevoPagoConcepto} onChange={e => setNuevoPagoConcepto(e.target.value)} placeholder={lang === 'en' ? 'What was it for' : 'Concepto'} style={{ ...inputStyle, flex: 2, minWidth: 130 }} />
              <input type="number" value={nuevoPagoMonto} onChange={e => setNuevoPagoMonto(e.target.value)} placeholder={lang === 'en' ? 'Amount' : 'Monto'} style={{ ...inputStyle, width: 90 }} />
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 3 }}>
                <span style={{ fontSize: 9, color: 'rgba(61,43,46,.4)', fontWeight: 700, textTransform: 'uppercase' as const }}>{lang === 'en' ? 'Payment date' : 'Fecha del pago'}</span>
                <input type="date" value={nuevoPagoFecha} onChange={e => setNuevoPagoFecha(e.target.value)} style={{ ...inputStyle, colorScheme: 'light' as const, marginBottom: 0 }} />
              </div>
              <button onClick={agregarPago} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
            </div>
          </div>
        )}

        {tab === 'calendario_pagos' && (() => {
          // No es tabla nueva: junta lo que ya existe — pendientes de Presupuesto
          // (fecha_limite) y abonos ya hechos de Pagos — en una sola línea de
          // tiempo, como la pestaña de Calendario de Pagos del Excel de Patty.
          type Fila = { id: string; concepto: string; monto: number | null; fecha: string; estado: 'vencido' | 'proximo' | 'programado' | 'pagado' }
          const filas: Fila[] = [
            ...presupuesto.filter(x => x.fecha_limite && !x.pagado).map(x => ({
              id: 'p-' + x.id, concepto: x.nombre, monto: x.costo_real ?? x.costo_estimado, fecha: x.fecha_limite,
              estado: (x.fecha_limite < hoy ? 'vencido' : x.fecha_limite <= en30dias ? 'proximo' : 'programado') as Fila['estado'],
            })),
            ...pagos.filter(x => x.fecha).map(x => ({ id: 'g-' + x.id, concepto: x.concepto, monto: x.monto, fecha: x.fecha, estado: 'pagado' as const })),
          ].sort((a, b) => a.fecha.localeCompare(b.fecha))
          const ESTADO_CAL: Record<string, { es: string; en: string; color: string }> = {
            vencido: { es: 'Vencido', en: 'Overdue', color: '#f4a3a3' },
            proximo: { es: 'Próximo', en: 'Due soon', color: '#c98a1e' },
            programado: { es: 'Programado', en: 'Scheduled', color: '#a89df0' },
            pagado: { es: 'Pagado', en: 'Paid', color: '#7CE0A8' },
          }
          return (
            <div>
              {filas.length === 0 ? (
                <p style={{ fontSize: 13, color: 'rgba(61,43,46,.4)' }}>
                  {lang === 'en' ? 'Nothing yet — add due dates in Budget or payments in Payments.' : 'Todavía nada — agrega fechas límite en Presupuesto o pagos en Pagos.'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {filas.map(f => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(183,110,121,.06)', borderRadius: 12, padding: '10px 14px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#3D2B2E' }}>{f.concepto}</div>
                        <div style={{ fontSize: 11, color: 'rgba(61,43,46,.4)' }}>{f.fecha}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#B76E79' }}>{fmtMoney(f.monto)}</div>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99, background: ESTADO_CAL[f.estado].color, color: '#3D2B2E' }}>
                        {lang === 'en' ? ESTADO_CAL[f.estado].en : ESTADO_CAL[f.estado].es}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        {tab === 'inspiracion' && (
          <div>
            <p style={{ fontSize: 13, color: 'rgba(61,43,46,.55)', marginBottom: 14 }}>
              {lang === 'en' ? 'Save a link to your inspiration board (Pinterest, Canva, etc).' : 'Guarda un link a tu tablero de inspiración (Pinterest, Canva, etc).'}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <input value={linkInspiracion} onChange={e => setLinkInspiracion(e.target.value)} placeholder={lang === 'en' ? 'https://...' : 'https://...'} style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
              <button onClick={guardarLinkInspiracion} disabled={guardandoInspiracion} style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>
                {lang === 'en' ? 'Save' : 'Guardar'}
              </button>
              {proyecto?.link_inspiracion && (
                <button onClick={() => window.open(proyecto.link_inspiracion, '_blank')} style={{ border: '1px solid rgba(183,110,121,.15)', background: 'rgba(183,110,121,.06)', color: '#3D2B2E', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>
                  {lang === 'en' ? 'Open' : 'Abrir'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <Script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`} strategy="afterInteractive" onLoad={() => setMapsListo(true)} />
    </main>
  )
}
