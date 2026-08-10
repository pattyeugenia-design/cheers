'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import Image from 'next/image'
import { supabase } from '../../supabase'
import { getLang } from '../../i18n'

declare global { interface Window { google: any } }

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const BG = 'linear-gradient(160deg,#3a1f3d,#4a2245,#2a1a3e)'

// Mismos temas/fuentes que la invitación normal de Cheers (app/[usuario]/[evento])
// — así la invitación de boda se ve consistente con el resto de la app en vez de
// inventar un sistema de diseño aparte.
const TEMAS: Record<string, { label_es: string; label_en: string; bg: string; dark: boolean }> = {
  morado:  { label_es: 'Morado',  label_en: 'Purple', bg: 'radial-gradient(circle at 18% 16%,#7b6fd0,transparent 46%),linear-gradient(160deg,#534AB7,#7b46a8 58%,#D4537E)', dark: true },
  rosa:    { label_es: 'Rosa',    label_en: 'Pink',   bg: 'linear-gradient(155deg,#D4537E,#a14b9c)', dark: true },
  noche:   { label_es: 'Noche',   label_en: 'Night',  bg: 'linear-gradient(160deg,#0f0c29,#302b63,#24243e)', dark: true },
  bosque:  { label_es: 'Bosque',  label_en: 'Forest', bg: 'linear-gradient(155deg,#1a3c2a,#2d6a4f,#40916c)', dark: true },
  ambar:   { label_es: 'Ámbar',   label_en: 'Amber',  bg: 'linear-gradient(155deg,#b5451b,#e76f51,#f4a261)', dark: true },
  carbon:  { label_es: 'Carbón',  label_en: 'Carbon', bg: 'linear-gradient(160deg,#1a1a1a,#2d2d2d,#3d3d3d)', dark: true },
  lavanda: { label_es: 'Lavanda', label_en: 'Lavender', bg: '#B8B0F0', dark: false },
  crema:   { label_es: 'Crema',   label_en: 'Cream',  bg: '#FBF4EC', dark: false },
}
const TEMA_ORDER = ['morado', 'rosa', 'noche', 'bosque', 'ambar', 'carbon', 'lavanda', 'crema']

const FUENTES: Record<string, { label: string; font: string }> = {
  system:  { label: 'SF Pro',       font: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' },
  verdana: { label: 'Verdana',      font: 'Verdana, Geneva, sans-serif' },
  georgia: { label: 'Georgia',      font: 'Georgia, serif' },
  cursive: { label: 'Brush Script', font: '"Brush Script MT", "Segoe Script", cursive' },
}
const FUENTE_ORDER = ['system', 'verdana', 'georgia', 'cursive']

type Tab = 'dashboard' | 'invitados' | 'presupuesto' | 'timeline' | 'novia' | 'novio' | 'pareja' | 'luna_miel' | 'vida_despues' | 'embarazo' | 'wedding_planner' | 'proveedores' | 'contratos' | 'pagos' | 'inspiracion' | 'beauty_timeline' | 'dia_b' | 'calendario_pagos'
type TableroKey = 'novia' | 'novio' | 'pareja' | 'luna_miel' | 'vida_despues' | 'embarazo' | 'wedding_planner' | 'beauty_timeline' | 'dia_b'

const CATEGORIA_WEDDING_PLANNER = 'Wedding Planner'

// Cada módulo se puede prender/apagar desde el Dashboard. Los que no tienen
// tabKey (iglesia/civil) no son pestañas, solo afectan el checklist de trámites.
const MODULOS: { key: string; tabKey?: Tab; es: string; en: string }[] = [
  { key: 'invitados', tabKey: 'invitados', es: 'Invitados', en: 'Guests' },
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
  border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.06)',
  color: '#fff', fontSize: 13, padding: '9px 12px', borderRadius: 9, fontFamily: F,
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

  const [linkInspiracion, setLinkInspiracion] = useState('')
  const [guardandoInspiracion, setGuardandoInspiracion] = useState(false)

  const [nuevoWpNombre, setNuevoWpNombre] = useState('')
  const [nuevoWpContacto, setNuevoWpContacto] = useState('')
  const [nuevoWpCosto, setNuevoWpCosto] = useState('')

  const [mapsListo, setMapsListo] = useState(false)
  const [editandoLugar, setEditandoLugar] = useState(false)
  const [lugarInput, setLugarInput] = useState('')
  const lugarRef = useRef<HTMLInputElement>(null)

  const [editandoInfo, setEditandoInfo] = useState(false)
  const [infoViajeInput, setInfoViajeInput] = useState('')
  const [faqInput, setFaqInput] = useState('')

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
  const [primerosPasosCerrado, setPrimerosPasosCerrado] = useState(false)

  async function cargarTodo(bodaId: string) {
    const [{ data: p }, { data: t }, { data: tb }, { data: pr }, { data: ct }, { data: pg }, { data: inv }, { data: rs }] = await Promise.all([
      supabase.from('boda_presupuesto_items').select('*').eq('boda_id', bodaId).order('created_at'),
      supabase.from('boda_timeline_items').select('*').eq('boda_id', bodaId).order('fecha_objetivo', { ascending: true, nullsFirst: false }),
      supabase.from('boda_tablero_items').select('*').eq('boda_id', bodaId).order('orden'),
      supabase.from('boda_proveedores').select('*').eq('boda_id', bodaId).order('created_at'),
      supabase.from('boda_contratos').select('*').eq('boda_id', bodaId).order('created_at'),
      supabase.from('boda_pagos').select('*').eq('boda_id', bodaId).order('fecha', { ascending: false, nullsFirst: false }),
      supabase.from('boda_invitados').select('*').eq('boda_id', bodaId).order('created_at'),
      supabase.from('boda_rsvps').select('*').eq('boda_id', bodaId),
    ])
    setPresupuesto(p || [])
    setTimeline(t || [])
    setTablero(tb || [])
    setProveedores(pr || [])
    setContratos(ct || [])
    setPagos(pg || [])
    setInvitadosBoda(inv || [])
    setRsvpsBoda(rs || [])
  }

  useEffect(() => {
    setLang(getLang())
    params.then(async ({ id }) => {
      setId(id)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: proy } = await supabase.from('proyectos_boda').select('*').eq('id', id).single()
      if (!proy) { router.push('/bridal'); return }
      setProyecto(proy)
      setLinkInspiracion(proy.link_inspiracion || '')
      setLugarInput(proy.lugar_nombre || '')
      setInfoViajeInput(proy.info_viaje || '')
      setFaqInput(proy.faq || '')
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

  async function guardarInfoRsvp() {
    const info_viaje = infoViajeInput.trim() || null
    const faq = faqInput.trim() || null
    await supabase.from('proyectos_boda').update({ info_viaje, faq }).eq('id', id)
    setProyecto((prev: any) => ({ ...prev, info_viaje, faq }))
    setEditandoInfo(false)
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
    const { data: { publicUrl } } = supabase.storage.from('portadas').getPublicUrl(path)
    await supabase.from('proyectos_boda').update({ portada_url: publicUrl }).eq('id', id)
    setProyecto((prev: any) => ({ ...prev, portada_url: publicUrl }))
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
  function recordarSiguientePorWA() {
    const pendientesConTel = invitadosBoda.filter(inv => !rsvpsBoda.find(r => r.invitado_id === inv.id) && inv.telefono)
    if (pendientesConTel.length === 0) return
    const inv = pendientesConTel[waPendienteIdx % pendientesConTel.length]
    const url = `https://joincheers.app/bridal/rsvp/${inv.token}`
    const nombreBoda = [proyecto?.nombre_novia, proyecto?.nombre_novio].filter(Boolean).join(' & ')
    const msg = encodeURIComponent(
      lang === 'en'
        ? `Hi ${inv.nombre}! Just checking — we haven't gotten your RSVP yet for ${nombreBoda}'s wedding. Can you confirm here? ${url}`
        : `¡Hola ${inv.nombre}! Todavía no nos llega tu confirmación para la boda de ${nombreBoda}. ¿Nos confirmas aquí? ${url}`
    )
    const destino = inv.telefono.replace(/[^\d+]/g, '')
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
    const destino = inv.telefono ? inv.telefono.replace(/[^\d+]/g, '') : ''
    window.open(`https://wa.me/${destino}?text=${msg}`, '_blank')
  }

  if (cargando) return (
    <main style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
      <p style={{ color: '#EEC9DD' }}>{lang === 'en' ? 'Loading…' : 'Cargando…'}</p>
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

  return (
    <main style={{ minHeight: '100vh', background: BG, fontFamily: F, padding: '50px 20px 80px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <button onClick={() => router.push('/bridal')} style={{ border: 'none', background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 99, cursor: 'pointer', fontFamily: F, marginBottom: 20 }}>
          {lang === 'en' ? '← Back' : '← Atrás'}
        </button>

        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 24px', letterSpacing: '-.5px' }}>
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
              background: seccionActiva === sec.id ? 'linear-gradient(135deg,#534AB7,#D4537E)' : 'rgba(255,255,255,.08)',
              color: seccionActiva === sec.id ? '#fff' : 'rgba(255,255,255,.6)',
            }}>{lang === 'en' ? sec.en : sec.es}</button>
          ))}
        </div>

        {/* Sub-tabs — solo de la sección activa */}
        {tabsDeSeccion.length > 1 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' as const }}>
            {tabsDeSeccion.map(tb => (
              <button key={tb.key} onClick={() => setTab(tb.key)} style={{
                border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 99,
                background: tab === tb.key ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.05)',
                color: tab === tb.key ? '#2a2440' : 'rgba(255,255,255,.5)',
              }}>{tb.label}</button>
            ))}
          </div>
        )}
        {tabsDeSeccion.length <= 1 && <div style={{ marginBottom: 20 }} />}

        {tab === 'dashboard' && (
          <div>
            {/* Primeros pasos: el primer día el dashboard es puros 0/0 en 17 módulos
                prendidos por default — esto da 3 acciones concretas para arrancar
                en vez de que se sienta una pared vacía. Se apaga sola en cuanto hay
                algo de contenido real, o si la cierran a mano. */}
            {!primerosPasosCerrado && invitadosBoda.length === 0 && presupuesto.length === 0 && !proyecto?.lugar_nombre && (
              <div style={{ background: 'rgba(255,255,255,.06)', border: '1px dashed rgba(255,255,255,.2)', borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{lang === 'en' ? 'Getting started' : 'Primeros pasos'}</div>
                  <button onClick={() => setPrimerosPasosCerrado(true)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.4)', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginBottom: 10, lineHeight: 1.5 }}>
                  {lang === 'en'
                    ? 'All modules are on by default — turn off the ones you don\'t need at the bottom of this page. To start, try:'
                    : 'Todos los módulos están prendidos por default — apaga los que no necesites al final de esta página. Para empezar, prueba:'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                  <button onClick={() => setEditandoLugar(true)} style={{ textAlign: 'left' as const, border: 'none', background: 'rgba(255,255,255,.06)', color: '#EEC9DD', fontSize: 12, fontWeight: 700, padding: '8px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>
                    {lang === 'en' ? '→ Add your venue' : '→ Agrega tu lugar'}
                  </button>
                  <button onClick={() => setTab('invitados')} style={{ textAlign: 'left' as const, border: 'none', background: 'rgba(255,255,255,.06)', color: '#EEC9DD', fontSize: 12, fontWeight: 700, padding: '8px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>
                    {lang === 'en' ? '→ Add your first guests' : '→ Agrega tus primeros invitados'}
                  </button>
                  <button onClick={() => setTab('presupuesto')} style={{ textAlign: 'left' as const, border: 'none', background: 'rgba(255,255,255,.06)', color: '#EEC9DD', fontSize: 12, fontWeight: 700, padding: '8px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>
                    {lang === 'en' ? '→ Start your budget' : '→ Arranca tu presupuesto'}
                  </button>
                </div>
              </div>
            )}

            {/* Brief: mismo espíritu que el brief de Cheers normal — fecha, lugar, invitados, organizadores */}
            <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 16, padding: '18px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 14, marginBottom: editandoLugar ? 12 : 0 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', fontWeight: 800, textTransform: 'uppercase' as const }}>{lang === 'en' ? 'Date' : 'Fecha'}</div>
                  <div style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>
                    {proyecto?.fecha_boda || (lang === 'en' ? 'Pending' : 'Pendiente')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', fontWeight: 800, textTransform: 'uppercase' as const }}>{lang === 'en' ? 'Guests' : 'Invitados'}</div>
                  <div style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>
                    {proyecto?.invitados_estimados ?? (lang === 'en' ? 'Pending' : 'Pendiente')}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', fontWeight: 800, textTransform: 'uppercase' as const }}>{lang === 'en' ? 'Venue' : 'Lugar'}</div>
                  {editandoLugar ? null : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>{proyecto?.lugar_nombre || (lang === 'en' ? 'Pending' : 'Pendiente')}</div>
                      {proyecto?.lugar_nombre && (
                        <a href={`https://maps.google.com/?q=${encodeURIComponent(proyecto.lugar_nombre)}`} target="_blank" style={{ fontSize: 11, color: '#AFA9EC', fontWeight: 700 }}>Maps ↗</a>
                      )}
                      <button onClick={() => setEditandoLugar(true)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.4)', fontSize: 11, cursor: 'pointer', fontFamily: F }}>{lang === 'en' ? 'edit' : 'editar'}</button>
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', fontWeight: 800, textTransform: 'uppercase' as const }}>{lang === 'en' ? 'Wedding Planner' : 'Wedding Planner'}</div>
                  <div style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>{wpContratado?.nombre || (lang === 'en' ? 'Not selected' : 'Sin elegir')}</div>
                </div>
              </div>
              {editandoLugar && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input ref={lugarRef} value={lugarInput} onChange={e => setLugarInput(e.target.value)} placeholder={lang === 'en' ? 'Search venue…' : 'Buscar lugar…'} style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={guardarLugar} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>{lang === 'en' ? 'Save' : 'Guardar'}</button>
                </div>
              )}
            </div>

            {/* Info que ven los invitados en su página de RSVP */}
            <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editandoInfo ? 10 : 0 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', fontWeight: 800, textTransform: 'uppercase' as const }}>
                  {lang === 'en' ? 'Info for guests (travel & FAQ)' : 'Info para invitados (viaje y FAQ)'}
                </div>
                {!editandoInfo && (
                  <button onClick={() => setEditandoInfo(true)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.4)', fontSize: 11, cursor: 'pointer', fontFamily: F }}>{lang === 'en' ? 'edit' : 'editar'}</button>
                )}
              </div>
              {editandoInfo ? (
                <div>
                  <textarea value={infoViajeInput} onChange={e => setInfoViajeInput(e.target.value)} rows={3} placeholder={lang === 'en' ? 'Travel & stay info' : 'Info de viaje y hospedaje'} style={{ ...inputStyle, width: '100%', resize: 'none' as const }} />
                  <textarea value={faqInput} onChange={e => setFaqInput(e.target.value)} rows={3} placeholder="FAQ" style={{ ...inputStyle, width: '100%', resize: 'none' as const }} />
                  <button onClick={guardarInfoRsvp} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>{lang === 'en' ? 'Save' : 'Guardar'}</button>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', margin: 0 }}>
                  {(proyecto?.info_viaje || proyecto?.faq) ? (lang === 'en' ? 'Saved — visible on the RSVP page.' : 'Guardado — visible en la página de RSVP.') : (lang === 'en' ? 'Nothing yet.' : 'Todavía nada.')}
                </p>
              )}
            </div>

            {/* Diseño de la invitación digital que ven los invitados */}
            <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', fontWeight: 800, textTransform: 'uppercase' as const }}>
                  {lang === 'en' ? 'Invitation design' : 'Diseño de la invitación'}
                </div>
                {invitadosBoda[0]?.token && (
                  <a href={`/bridal/rsvp/${invitadosBoda[0].token}`} target="_blank" style={{ fontSize: 11, color: '#AFA9EC', fontWeight: 700 }}>
                    {lang === 'en' ? 'Preview →' : 'Vista previa →'}
                  </a>
                )}
              </div>

              <input ref={portadaInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) subirPortada(f) }} style={{ display: 'none' }} />
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
                <div onClick={() => portadaInputRef.current?.click()} style={{ position: 'relative', width: 80, height: 80, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,.08)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {proyecto?.portada_url ? (
                    <Image src={proyecto.portada_url} alt="portada" fill sizes="80px" style={{ objectFit: 'cover', objectPosition: proyecto.portada_posicion || 'center' }} />
                  ) : (
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', fontWeight: 700, textAlign: 'center' as const, padding: 4 }}>{subiendoPortada ? '...' : (lang === 'en' ? 'Add photo' : 'Agregar foto')}</span>
                  )}
                </div>
                {proyecto?.portada_url && (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                    <button onClick={() => portadaInputRef.current?.click()} style={{ border: 'none', background: 'rgba(255,255,255,.1)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: F, textAlign: 'left' as const }}>
                      {lang === 'en' ? 'Change photo' : 'Cambiar foto'}
                    </button>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[{ v: 'top', l: lang === 'en' ? 'Top' : 'Arriba' }, { v: 'center', l: lang === 'en' ? 'Center' : 'Centro' }, { v: 'bottom', l: lang === 'en' ? 'Bottom' : 'Abajo' }].map(p => (
                        <button key={p.v} onClick={() => guardarPortadaPosicion(p.v)} style={{ border: 'none', background: (proyecto?.portada_posicion || 'center') === p.v ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.08)', color: (proyecto?.portada_posicion || 'center') === p.v ? '#2a2440' : 'rgba(255,255,255,.6)', fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: F }}>{p.l}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Vista previa real por tema — como Zola/Joy/Bliss & Bone: cada tarjeta
                  ya muestra tu foto, tus nombres y tu fecha con ese tema puesto, no
                  solo un color suelto. Toca una para elegirla. */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 12, overflowX: 'auto' as const, paddingBottom: 4, WebkitOverflowScrolling: 'touch' as const }}>
                {TEMA_ORDER.map(k => {
                  const t = TEMAS[k]
                  const seleccionado = (proyecto?.tema || 'morado') === k
                  const txt = t.dark ? '#fff' : '#3D2B2E'
                  const nombreBoda = [proyecto?.nombre_novia, proyecto?.nombre_novio].filter(Boolean).join(' & ') || (lang === 'en' ? 'Your names' : 'Tus nombres')
                  const fechaBonita = fmtFechaBonita(proyecto?.fecha_boda, lang)
                  return (
                    <div key={k} style={{ flexShrink: 0, width: 138 }}>
                      <div onClick={() => guardarTema(k)} style={{ position: 'relative', width: 138, height: 172, borderRadius: 16, overflow: 'hidden', cursor: 'pointer', background: t.bg, outline: seleccionado ? '3px solid #D4537E' : '3px solid transparent', outlineOffset: 2 }}>
                        {proyecto?.portada_url && (
                          <>
                            <Image src={proyecto.portada_url} alt="" fill sizes="138px" style={{ objectFit: 'cover', objectPosition: proyecto.portada_posicion || 'center', opacity: .5 }} />
                            <div style={{ position: 'absolute', inset: 0, background: t.bg, opacity: .55 }} />
                          </>
                        )}
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '10px 10px', textAlign: 'center' as const }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: txt, fontFamily: FUENTES[proyecto?.fuente || 'system'].font, lineHeight: 1.2 }}>{nombreBoda}</div>
                          {fechaBonita && <div style={{ fontSize: 9, color: txt, opacity: .85, marginTop: 6, textTransform: 'uppercase' as const, letterSpacing: '.5px' }}>{fechaBonita}</div>}
                        </div>
                        {seleccionado && (
                          <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#D4537E' }}>✓</div>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.55)', fontWeight: 700, textAlign: 'center' as const, marginTop: 6 }}>{lang === 'en' ? t.label_en : t.label_es}</div>
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                {FUENTE_ORDER.map(k => (
                  <button key={k} onClick={() => guardarFuente(k)} style={{
                    border: (proyecto?.fuente || 'system') === k ? '2px solid #D4537E' : '2px solid rgba(255,255,255,.15)', borderRadius: 9, padding: '7px 12px', cursor: 'pointer',
                    background: (proyecto?.fuente || 'system') === k ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.08)',
                    color: (proyecto?.fuente || 'system') === k ? '#2a2440' : '#fff', fontSize: 12, fontFamily: FUENTES[k].font, fontWeight: 700,
                  }}>{FUENTES[k].label}</button>
                ))}
              </div>
            </div>

            {/* Métricas por módulo */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {moduloActivo('presupuesto') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>{lang === 'en' ? 'Budget' : 'Presupuesto'}</div>
                  <div style={{ fontSize: 12, color: '#EEC9DD' }}>{fmtMoney(totalPagado)} / {fmtMoney(presupuestoMetaTile)}{totalEstimado === 0 && presupuestoMetaTile > 0 ? (lang === 'en' ? ' (estimate)' : ' (estimado)') : ''}</div>
                  {pagosVencidos.length > 0 && <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99, background: '#f4a3a3', color: '#241c45' }}>{pagosVencidos.length} {lang === 'en' ? 'overdue' : 'vencidos'}</span>}
                  {pagosProximos.length > 0 && <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99, background: '#c98a1e', color: '#241c45' }}>{pagosProximos.length} {lang === 'en' ? 'due soon' : 'próximos'}</span>}
                </div>
              )}
              {moduloActivo('proveedores') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>{lang === 'en' ? 'Vendors' : 'Proveedores'}</div>
                  <div style={{ fontSize: 12, color: '#EEC9DD' }}>{proveedores.filter(p => p.estado === 'contratado').length}/{proveedores.length} {lang === 'en' ? 'booked' : 'contratados'}</div>
                </div>
              )}
              {moduloActivo('invitados') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>{lang === 'en' ? 'Guests' : 'Invitados'}</div>
                  <div style={{ fontSize: 12, color: '#EEC9DD' }}>{rsvpConfirmados}/{invitadosMetaTile} {lang === 'en' ? 'confirmed' : 'confirmados'}{invitadosBoda.length === 0 && invitadosMetaTile > 0 ? (lang === 'en' ? ' (estimate)' : ' (estimado)') : ''}</div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>Timeline</div>
                <div style={{ fontSize: 12, color: '#EEC9DD' }}>{timeline.filter(x => x.completado).length}/{timeline.length}</div>
              </div>
              {['novia', 'novio', 'pareja', 'luna_miel', 'vida_despues', 'embarazo', 'wedding_planner', 'beauty_timeline', 'dia_b'].filter(moduloActivo).map(k => {
                const items = tablero.filter(x => x.tablero === k)
                const modulo = MODULOS.find(m => m.key === k)!
                if (k === 'wedding_planner' && !wpContratado) return null
                return (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>{lang === 'en' ? modulo.en : modulo.es}</div>
                    <div style={{ fontSize: 12, color: '#EEC9DD' }}>{items.filter(x => x.completado).length}/{items.length}</div>
                  </div>
                )
              })}
              {moduloActivo('contratos') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>{lang === 'en' ? 'Contracts' : 'Contratos'}</div>
                  <div style={{ fontSize: 12, color: '#EEC9DD' }}>{contratosFirmados}/{contratos.length} {lang === 'en' ? 'signed' : 'firmados'}</div>
                </div>
              )}
              {moduloActivo('pagos') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>{lang === 'en' ? 'Payments' : 'Pagos'}</div>
                  <div style={{ fontSize: 12, color: '#EEC9DD' }}>{fmtMoney(totalPagos)}</div>
                </div>
              )}
              {moduloActivo('inspiracion') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>{lang === 'en' ? 'Inspiration' : 'Inspiración'}</div>
                  <div style={{ fontSize: 12, color: '#EEC9DD' }}>{proyecto?.link_inspiracion ? (lang === 'en' ? 'Saved' : 'Guardado') : (lang === 'en' ? 'Pending' : 'Pendiente')}</div>
                </div>
              )}
            </div>

            {/* Módulos: prender/apagar */}
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 8 }}>{lang === 'en' ? 'Modules' : 'Módulos'}</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
              {MODULOS.map(m => {
                const activo = moduloActivo(m.key)
                return (
                  <div key={m.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,.04)', borderRadius: 10, opacity: activo ? 1 : .5 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', fontWeight: 600 }}>{lang === 'en' ? m.en : m.es}</span>
                    <button onClick={() => toggleModulo(m.key)} style={{
                      border: 'none', cursor: 'pointer', width: 40, height: 24, borderRadius: 99, padding: 3,
                      background: activo ? 'linear-gradient(135deg,#534AB7,#D4537E)' : 'rgba(255,255,255,.15)', display: 'flex', justifyContent: activo ? 'flex-end' : 'flex-start',
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
              <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 700 }}>{lang === 'en' ? 'Confirmed' : 'Confirmados'}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#7CE0A8' }}>{rsvpsBoda.filter(r => r.asistencia === 'si').length}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 700 }}>{lang === 'en' ? 'Pending' : 'Por confirmar'}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{invitadosBoda.length - rsvpsBoda.length}</div>
              </div>
            </div>

            {invitadosBoda.length - rsvpsBoda.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 8 }}>
                  {lang === 'en' ? 'Remind pending guests' : 'Recordar a pendientes'}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                  <button onClick={recordarPorCorreo} disabled={recordando} style={{ border: 'none', background: 'rgba(255,255,255,.1)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>
                    {recordando ? '...' : (lang === 'en' ? 'By email' : 'Por correo')}
                  </button>
                  <button onClick={recordarSiguientePorWA} style={{ border: 'none', background: '#25D366', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>
                    {lang === 'en' ? 'By WhatsApp (next one)' : 'Por WhatsApp (el siguiente)'}
                  </button>
                </div>
                {ultimoRecordatorio && <p style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 8 }}>{ultimoRecordatorio}</p>}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {invitadosBoda.map(inv => {
                const rsvp = rsvpsBoda.find(r => r.invitado_id === inv.id)
                return (
                  <div key={inv.id} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{inv.nombre}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>
                          {[inv.grupo, inv.acompanantes_permitidos > 0 ? `+${inv.acompanantes_permitidos}` : null].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      {rsvp ? (
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 9px', borderRadius: 99, background: ASISTENCIA_LABEL[rsvp.asistencia].color, color: '#241c45' }}>
                          {lang === 'en' ? ASISTENCIA_LABEL[rsvp.asistencia].en : ASISTENCIA_LABEL[rsvp.asistencia].es}
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 9px', borderRadius: 99, background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.5)' }}>
                          {lang === 'en' ? 'Pending' : 'Sin responder'}
                        </span>
                      )}
                      <button onClick={() => enviarInvitacionWA(inv)} title="WhatsApp" style={{ border: 'none', background: '#25D366', color: '#fff', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', flexShrink: 0, fontSize: 13 }}>↗</button>
                      <button onClick={() => capturandoManual === inv.id ? setCapturandoManual(null) : abrirCapturaManual(inv)} title={lang === 'en' ? 'Log a call' : 'Registrar llamada'} style={{ border: 'none', background: 'rgba(255,255,255,.12)', color: '#fff', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', flexShrink: 0, fontSize: 12 }}>☎</button>
                      <button onClick={() => borrarInvitadoBoda(inv.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                    </div>

                    {capturandoManual === inv.id && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.1)' }}>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginBottom: 8 }}>
                          {lang === 'en' ? 'Log what they confirmed by phone — same as a digital RSVP.' : 'Registra lo que confirmó por teléfono — cuenta igual que un RSVP digital.'}
                        </p>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                          {(['si', 'tal_vez', 'no'] as const).map(op => (
                            <button key={op} onClick={() => setManualAsistencia(op)} style={{
                              flex: 1, border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 12, fontWeight: 800, padding: '8px', borderRadius: 8,
                              background: manualAsistencia === op ? 'linear-gradient(135deg,#534AB7,#D4537E)' : 'rgba(255,255,255,.08)',
                              color: manualAsistencia === op ? '#fff' : 'rgba(255,255,255,.6)',
                            }}>{op === 'si' ? (lang === 'en' ? 'Yes' : 'Sí') : op === 'no' ? 'No' : (lang === 'en' ? 'Maybe' : 'Tal vez')}</button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 8 }}>
                          <select value={manualMenu} onChange={e => setManualMenu(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 110, colorScheme: 'dark' as const }}>
                            <option value="">{lang === 'en' ? 'Meal' : 'Platillo'}</option>
                            {['res', 'pollo', 'vegetariano', 'vegano'].map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <input type="number" min={0} value={manualAcompanantes} onChange={e => setManualAcompanantes(e.target.value)} placeholder={lang === 'en' ? '+1s' : 'Acompañantes'} style={{ ...inputStyle, width: 90 }} />
                        </div>
                        <input value={manualNotas} onChange={e => setManualNotas(e.target.value)} placeholder={lang === 'en' ? 'Note (optional)' : 'Nota (opcional)'} style={{ ...inputStyle, width: '100%' }} />
                        <button onClick={() => guardarRsvpManual(inv.id)} disabled={!manualAsistencia || guardando} style={{ border: 'none', background: !manualAsistencia ? 'rgba(255,255,255,.15)' : 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: manualAsistencia ? 'pointer' : 'default', fontFamily: F }}>
                          {lang === 'en' ? 'Save' : 'Guardar'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <input value={nuevoInvNombre} onChange={e => setNuevoInvNombre(e.target.value)} placeholder={lang === 'en' ? 'Name' : 'Nombre'} style={{ ...inputStyle, flex: 2, minWidth: 120 }} />
              <input value={nuevoInvContacto} onChange={e => setNuevoInvContacto(e.target.value)} placeholder={lang === 'en' ? 'Phone or email' : 'Teléfono o email'} style={{ ...inputStyle, flex: 1, minWidth: 130 }} />
              <input value={nuevoInvGrupo} onChange={e => setNuevoInvGrupo(e.target.value)} placeholder={lang === 'en' ? 'Group' : 'Grupo'} style={{ ...inputStyle, flex: 1, minWidth: 90 }} />
              <input type="number" min={0} value={nuevoInvAcompanantes} onChange={e => setNuevoInvAcompanantes(e.target.value)} placeholder={lang === 'en' ? '+1s' : 'Acompañantes'} style={{ ...inputStyle, width: 80 }} />
              <button onClick={agregarInvitadoBoda} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
            </div>
          </div>
        )}

        {tab === 'presupuesto' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 700 }}>{lang === 'en' ? 'Estimated' : 'Estimado'}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{fmtMoney(totalEstimado)}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 700 }}>{lang === 'en' ? 'Paid so far' : 'Pagado'}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#7CE0A8' }}>{fmtMoney(totalPagado)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {presupuesto.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <input type="checkbox" checked={!!item.pagado} onChange={() => togglePagado(item)} style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: item.pagado ? 'line-through' : 'none', opacity: item.pagado ? .6 : 1 }}>{item.nombre}</div>
                    <div style={{ fontSize: 11, color: item.fecha_limite && !item.pagado && item.fecha_limite < hoy ? '#f4a3a3' : 'rgba(255,255,255,.4)' }}>
                      {[item.categoria, item.fecha_limite ? (lang === 'en' ? `due ${item.fecha_limite}` : `vence ${item.fecha_limite}`) : null].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#EEC9DD' }}>{fmtMoney(item.costo_real ?? item.costo_estimado)}</div>
                  <button onClick={() => borrarPresupuesto(item.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder={lang === 'en' ? 'Item' : 'Concepto'} style={{ ...inputStyle, flex: 2, minWidth: 120 }} />
              <input value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)} placeholder={lang === 'en' ? 'Category' : 'Categoría'} style={{ ...inputStyle, flex: 1, minWidth: 100 }} />
              <input type="number" value={nuevoCosto} onChange={e => setNuevoCosto(e.target.value)} placeholder={lang === 'en' ? 'Cost' : 'Costo'} style={{ ...inputStyle, width: 90 }} />
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 3 }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', fontWeight: 700, textTransform: 'uppercase' as const }}>{lang === 'en' ? 'Due date (optional)' : 'Fecha límite de pago (opcional)'}</span>
                <input type="date" value={nuevaFechaLimite} onChange={e => setNuevaFechaLimite(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' as const, marginBottom: 0 }} />
              </div>
              <button onClick={agregarPresupuesto} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
            </div>
          </div>
        )}

        {tab === 'timeline' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {timeline.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <input type="checkbox" checked={!!item.completado} onChange={() => toggleCompletadoTimeline(item)} style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: item.completado ? 'line-through' : 'none', opacity: item.completado ? .6 : 1 }}>{item.titulo}</div>
                  </div>
                  {item.fecha_objetivo && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', flexShrink: 0 }}>{item.fecha_objetivo}</div>}
                  <button onClick={() => borrarTimeline(item.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <input value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} placeholder={lang === 'en' ? 'Task' : 'Tarea'} style={{ ...inputStyle, flex: 2, minWidth: 140 }} />
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 3 }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', fontWeight: 700, textTransform: 'uppercase' as const }}>{lang === 'en' ? 'Target date' : 'Fecha objetivo'}</span>
                <input type="date" value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' as const, marginBottom: 0 }} />
              </div>
              <button onClick={agregarTimeline} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
            </div>
          </div>
        )}

        {(tab === 'novia' || tab === 'novio' || tab === 'pareja' || tab === 'luna_miel' || tab === 'vida_despues' || tab === 'embarazo' || tab === 'beauty_timeline' || tab === 'dia_b') && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {tablero.filter(x => x.tablero === tab).map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <input type="checkbox" checked={!!item.completado} onChange={() => toggleCompletadoTablero(item)} style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: item.completado ? 'line-through' : 'none', opacity: item.completado ? .6 : 1 }}>{item.titulo}</div>
                  <button onClick={() => borrarTablero(item.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={nuevoItem} onChange={e => setNuevoItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarTablero(tab)} placeholder={lang === 'en' ? 'Add a to-do' : 'Agregar pendiente'} style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => agregarTablero(tab as TableroKey)} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
            </div>
          </div>
        )}

        {tab === 'wedding_planner' && (
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 8 }}>
              {lang === 'en' ? 'Compare candidates' : 'Comparativa'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {wpCandidatos.map(item => (
                <div key={item.id} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{item.nombre}</div>
                      {item.contacto_nombre && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{item.contacto_nombre}</div>}
                    </div>
                    {item.costo_cotizado != null && <div style={{ fontSize: 13, fontWeight: 800, color: '#EEC9DD' }}>{fmtMoney(item.costo_cotizado)}</div>}
                    <button onClick={() => borrarProveedor(item.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' as const }}>
                    {ESTADOS_PROVEEDOR.map(e => (
                      <button key={e} onClick={() => cambiarEstadoProveedor(item, e)} style={{
                        border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 10, fontWeight: 800, padding: '4px 9px', borderRadius: 99,
                        background: item.estado === e ? ESTADO_LABEL[e].color : 'rgba(255,255,255,.08)',
                        color: item.estado === e ? '#241c45' : 'rgba(255,255,255,.5)',
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
              <button onClick={agregarWpCandidato} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
            </div>

            {wpContratado ? (
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 8 }}>
                  {lang === 'en' ? `What ${wpContratado.nombre} will do` : `Qué va a hacer ${wpContratado.nombre}`}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
                  {tablero.filter(x => x.tablero === 'wedding_planner').map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                      <input type="checkbox" checked={!!item.completado} onChange={() => toggleCompletadoTablero(item)} style={{ width: 16, height: 16, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: item.completado ? 'line-through' : 'none', opacity: item.completado ? .6 : 1 }}>{item.titulo}</div>
                      <button onClick={() => borrarTablero(item.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={nuevoItem} onChange={e => setNuevoItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarTablero('wedding_planner')} placeholder={lang === 'en' ? 'Add a responsibility' : 'Agregar responsabilidad'} style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={() => agregarTablero('wedding_planner')} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>
                {lang === 'en' ? 'Mark one candidate as "Booked" above to unlock their checklist.' : 'Marca a uno como "Contratado" arriba para desbloquear su checklist.'}
              </p>
            )}
          </div>
        )}

        {tab === 'proveedores' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {proveedores.map(item => (
                <div key={item.id} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{item.nombre}</div>
                      {(item.categoria || item.contacto_nombre) && (
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{[item.categoria, item.contacto_nombre].filter(Boolean).join(' · ')}</div>
                      )}
                    </div>
                    {item.costo_cotizado != null && <div style={{ fontSize: 13, fontWeight: 800, color: '#EEC9DD' }}>{fmtMoney(item.costo_cotizado)}</div>}
                    <button onClick={() => borrarProveedor(item.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' as const }}>
                    {ESTADOS_PROVEEDOR.map(e => (
                      <button key={e} onClick={() => cambiarEstadoProveedor(item, e)} style={{
                        border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 10, fontWeight: 800, padding: '4px 9px', borderRadius: 99,
                        background: item.estado === e ? ESTADO_LABEL[e].color : 'rgba(255,255,255,.08)',
                        color: item.estado === e ? '#241c45' : 'rgba(255,255,255,.5)',
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
              <button onClick={agregarProveedor} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
            </div>
          </div>
        )}

        {tab === 'contratos' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {contratos.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 700, flexShrink: 0 }}>
                    <input type="checkbox" checked={!!item.firmado} onChange={() => toggleFirmado(item)} style={{ width: 16, height: 16 }} />
                    {lang === 'en' ? 'Signed' : 'Firmado'}
                  </label>
                  <div onClick={() => verContrato(item.archivo_url)} style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: '#EEC9DD', cursor: 'pointer', textDecoration: 'underline' }}>{item.nombre}</div>
                  <button onClick={() => borrarContrato(item)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <input value={nuevoContratoNombre} onChange={e => setNuevoContratoNombre(e.target.value)} placeholder={lang === 'en' ? 'Contract name (optional)' : 'Nombre del contrato (opcional)'} style={{ ...inputStyle, flex: 1, minWidth: 160 }} />
              <label style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>
                {subiendoContrato ? '...' : (lang === 'en' ? 'Upload' : 'Subir')}
                <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => e.target.files?.[0] && subirContrato(e.target.files[0])} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        )}

        {tab === 'pagos' && (
          <div>
            <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 700 }}>{lang === 'en' ? 'Total paid' : 'Total pagado'}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#7CE0A8' }}>{fmtMoney(totalPagos)}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {pagos.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{item.concepto}</div>
                    {item.fecha && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{item.fecha}</div>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#EEC9DD' }}>{fmtMoney(item.monto)}</div>
                  <button onClick={() => borrarPago(item.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <input value={nuevoPagoConcepto} onChange={e => setNuevoPagoConcepto(e.target.value)} placeholder={lang === 'en' ? 'What was it for' : 'Concepto'} style={{ ...inputStyle, flex: 2, minWidth: 130 }} />
              <input type="number" value={nuevoPagoMonto} onChange={e => setNuevoPagoMonto(e.target.value)} placeholder={lang === 'en' ? 'Amount' : 'Monto'} style={{ ...inputStyle, width: 90 }} />
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 3 }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', fontWeight: 700, textTransform: 'uppercase' as const }}>{lang === 'en' ? 'Payment date' : 'Fecha del pago'}</span>
                <input type="date" value={nuevoPagoFecha} onChange={e => setNuevoPagoFecha(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' as const, marginBottom: 0 }} />
              </div>
              <button onClick={agregarPago} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
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
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>
                  {lang === 'en' ? 'Nothing yet — add due dates in Budget or payments in Payments.' : 'Todavía nada — agrega fechas límite en Presupuesto o pagos en Pagos.'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {filas.map(f => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{f.concepto}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{f.fecha}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#EEC9DD' }}>{fmtMoney(f.monto)}</div>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99, background: ESTADO_CAL[f.estado].color, color: '#241c45' }}>
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
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', marginBottom: 14 }}>
              {lang === 'en' ? 'Save a link to your inspiration board (Pinterest, Canva, etc).' : 'Guarda un link a tu tablero de inspiración (Pinterest, Canva, etc).'}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <input value={linkInspiracion} onChange={e => setLinkInspiracion(e.target.value)} placeholder={lang === 'en' ? 'https://...' : 'https://...'} style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
              <button onClick={guardarLinkInspiracion} disabled={guardandoInspiracion} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>
                {lang === 'en' ? 'Save' : 'Guardar'}
              </button>
              {proyecto?.link_inspiracion && (
                <button onClick={() => window.open(proyecto.link_inspiracion, '_blank')} style={{ border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.06)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>
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
