'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../supabase'
import { getLang, t } from '../../i18n'

const LIMITE_FREE = 3
const FSYS = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'

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

const DEFAULT_TILES_VISIBLES: Record<string, boolean> = {
  portada: true, invitados: true, aperturas: true, regalos: true, mensajes: true,
  itinerario: true, presupuesto: true, quellevar: true, menu: true, reservacion: true
}

const TINFO: Record<string, { label: string; title_key: string }> = {
  portada:     { label: 'IMG', title_key: 'tile_portada' },
  invitados:   { label: 'INV', title_key: 'tile_invitados' },
  aperturas:   { label: 'APE', title_key: 'tile_aperturas' },
  regalos:     { label: 'REG', title_key: 'tile_regalos' },
  itinerario:  { label: 'ITE', title_key: 'tile_itinerario' },
  presupuesto: { label: 'PRE', title_key: 'tile_presupuesto' },
  quellevar:   { label: 'QLL', title_key: 'tile_quellevar' },
  menu:        { label: 'MEN', title_key: 'tile_menu' },
  reservacion: { label: 'RES', title_key: 'tile_reservacion' },
  mensajes:    { label: 'MSG', title_key: 'tile_mensajes' },
}

const STARS = [
  { top: '4%',  left: '2%',  size: 18, delay: '0s',   dur: '3.2s' },
  { top: '8%',  left: '92%', size: 24, delay: '1.1s', dur: '2.8s' },
  { top: '15%', left: '5%',  size: 12, delay: '0.5s', dur: '3.5s' },
  { top: '22%', left: '96%', size: 16, delay: '2.1s', dur: '2.6s' },
  { top: '30%', left: '1%',  size: 20, delay: '0.8s', dur: '3.8s' },
  { top: '38%', left: '97%', size: 14, delay: '1.6s', dur: '3.0s' },
  { top: '52%', left: '95%', size: 22, delay: '0.3s', dur: '4.0s' },
  { top: '60%', left: '2%',  size: 16, delay: '1.9s', dur: '2.9s' },
  { top: '75%', left: '4%',  size: 26, delay: '1.3s', dur: '2.7s' },
  { top: '88%', left: '6%',  size: 18, delay: '0.4s', dur: '3.1s' },
]

function tilesForType(type: string, sub?: string) {
  const SETS: Record<string, string[]> = {
    cumple:  ['portada', 'invitados', 'aperturas', 'regalos', 'mensajes'],
    cena:    sub === 'restaurante' ? ['portada', 'invitados', 'aperturas', 'reservacion'] : ['portada', 'invitados', 'aperturas', 'menu'],
    viaje:   ['portada', 'invitados', 'aperturas', 'itinerario', 'presupuesto', 'quellevar'],
    reunion: ['portada', 'invitados', 'aperturas', 'menu'],
    evento:  ['portada', 'invitados', 'aperturas', 'regalos'],
    otro:    ['portada', 'invitados', 'aperturas', 'regalos'],
  }
  const LG: Record<string, string> = { portada: 'lg', regalos: 'lg', itinerario: 'lg', menu: 'lg', mensajes: 'lg' }
  // size as string now supports sm/md/lg
  const keys = SETS[type] || ['portada', 'invitados', 'aperturas', 'regalos']
  return keys.map(k => ({ key: k, size: LG[k] || 'sm' }))
}

const initial = (n: string) => (n || '?').trim()[0].toUpperCase()

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

function TileIcon({ label, accentBg, accentText }: { label: string; accentBg: string; accentText: string }) {
  return (
    <div style={{ width: 28, height: 28, borderRadius: 8, background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: accentText, letterSpacing: '.3px' }}>{label}</span>
    </div>
  )
}

export default function Dashboard({ params }: { params: Promise<{ usuario: string; evento: string }> }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const saveTimeout = useRef<any>(null)

  const [tx, setTx] = useState(t.es)
  const [lang, setLang] = useState('es')
  const [celebracion, setCelebracion] = useState<any>(null)
  const [rsvps, setRsvps] = useState<any[]>([])
  const [invitadosList, setInvitadosList] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [acceso, setAcceso] = useState<'loading' | 'ok' | 'denied'>('loading')

  // Hero fields
  const [tagline, setTagline] = useState('')
  const [festejado, setFestejado] = useState('')
  const [fecha, setFecha] = useState('')
  const [lugar, setLugar] = useState('')
  const [portadaUrl, setPortadaUrl] = useState<string | null>(null)
  const [subiendoPortada, setSubiendoPortada] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [imgPosition, setImgPosition] = useState('center')
  const [showLightbox, setShowLightbox] = useState(false)

  // Tiles
  const [tiles, setTiles] = useState<{ key: string; size: string }[]>([])
  const [tilesVisibles, setTilesVisibles] = useState<Record<string, boolean>>(DEFAULT_TILES_VISIBLES)
  const [tema, setTema] = useState('morado')
  const [fuente, setFuente] = useState('system')
  const [tituloEstilo, setTituloEstilo] = useState<TituloEstilo>('normal-left')
  const [tituloSize, setTituloSize] = useState(23)
  const [showCustomize, setShowCustomize] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [guardandoToggle, setGuardandoToggle] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Invitados
  const [showAddInvitado, setShowAddInvitado] = useState(false)
  const [nuevoInvitado, setNuevoInvitado] = useState('')
  const [guardandoInvitado, setGuardandoInvitado] = useState(false)
  const [showWAPrompt, setShowWAPrompt] = useState(false)
  const [waPhone, setWaPhone] = useState('')
  const [invitadoPendienteWA, setInvitadoPendienteWA] = useState<any>(null)

  // Regalos
  const [regalos, setRegalos] = useState<any[]>([])
  const [showAddRegalo, setShowAddRegalo] = useState(false)
  const [nuevoRegalo, setNuevoRegalo] = useState({ nombre: '', precio: '', link: '' })

  // Itinerario
  const [paradas, setParadas] = useState<any[]>([])
  const [showAddParada, setShowAddParada] = useState(false)
  const [nuevaParada, setNuevaParada] = useState({ lugar: '', hora: '', nota: '' })

  // Qué llevar
  const [quellevar, setQuellevar] = useState<any[]>([])
  const [showAddItem, setShowAddItem] = useState(false)
  const [nuevoItem, setNuevoItem] = useState('')

  // Quién trae qué
  const [menu, setMenu] = useState<any[]>([])
  const [showAddPlato, setShowAddPlato] = useState(false)
  const [nuevoPlato, setNuevoPlato] = useState({ nombre: '', quien: '' })

  useEffect(() => {
    const l = getLang(); setLang(l); setTx(t[l])
    const check = () => setIsMobile(window.innerWidth < 600)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    params.then(async ({ usuario, evento }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      let cel: any = null
      const fullSlug = `${usuario}/${evento}`
      const { data: d1 } = await supabase.from('celebraciones').select('*').eq('slug', fullSlug).single()
      if (d1) cel = d1
      if (!cel) {
        const { data: d2 } = await supabase.from('celebraciones').select('*').eq('slug', evento).single()
        if (d2) cel = d2
      }

      if (!cel) { setAcceso('denied'); setCargando(false); return }
      if (cel.organizador_id !== user.id) { setAcceso('denied'); setCargando(false); return }

      setAcceso('ok'); setCelebracion(cel)
      setTagline(cel.tagline || '')
      setFestejado(cel.festejado_nombre || '')
      setFecha(cel.fecha || '')
      setLugar(cel.paradas?.[0]?.lugar || '')
      setPortadaUrl(cel.portada_url || null)
      setParadas(cel.paradas || [])
      setRegalos(cel.gifts || [])
      setQuellevar(cel.quellevar || [])
      setMenu(cel.menu || [])
      if (cel.tiles_order) {
        try { setTiles(JSON.parse(cel.tiles_order)) } catch { setTiles(tilesForType(cel.tipo, cel.sub_tipo)) }
      } else {
        setTiles(tilesForType(cel.tipo, cel.sub_tipo))
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

      setTimeout(() => {
        if (titleRef.current) titleRef.current.innerHTML = cel.nombre_html || cel.nombre || ''
      }, 100)
    })
  }, [])

  const saveTitleHtml = useCallback(() => {
    if (!celebracion || !titleRef.current) return
    const html = titleRef.current.innerHTML
    supabase.from('celebraciones').update({ nombre_html: html, nombre: titleRef.current.innerText }).eq('slug', celebracion.slug)
  }, [celebracion])

  function applyFormat(cmd: string) {
    titleRef.current?.focus()
    document.execCommand(cmd, false)
    setTimeout(saveTitleHtml, 100)
  }

  function moveTile(from: number, to: number) {
    if (from == null || from === to) return
    setTiles(prev => {
      const t = [...prev]; const [m] = t.splice(from, 1); t.splice(to, 0, m)
      guardarCampo('tiles_order', JSON.stringify(t))
      return t
    })
  }

  function cycleSize(i: number) {
    setTiles(prev => {
      const next = prev.map((x, j) => {
        if (j !== i) return x
        const sizes = ['sm', 'md', 'lg']
        const idx = sizes.indexOf(x.size)
        const newSize = sizes[(idx + 1) % sizes.length]
        return { ...x, size: newSize }
      })
      guardarCampo('tiles_order', JSON.stringify(next))
      return next
    })
  }

  async function toggleVisibilidad(key: string) {
    const nuevo = { ...tilesVisibles, [key]: !tilesVisibles[key] }
    setTilesVisibles(nuevo)
    setGuardandoToggle(true)
    await supabase.from('celebraciones').update({ tiles_visibles: nuevo }).eq('slug', celebracion.slug)
    setGuardandoToggle(false)
  }

  async function guardarCampo(campo: string, valor: any) {
    if (!celebracion) return
    await supabase.from('celebraciones').update({ [campo]: valor }).eq('slug', celebracion.slug)
  }

  async function guardarLugar(val: string) {
    if (!celebracion) return
    const ps = [...paradas]
    if (ps.length > 0) ps[0].lugar = val
    else ps.push({ lugar: val, hora: '', nota: '' })
    setParadas(ps)
    await supabase.from('celebraciones').update({ paradas: ps }).eq('slug', celebracion.slug)
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
    setPortadaUrl(publicUrl)
    setSubiendoPortada(false)
  }

  // Invitados
  async function agregarInvitado() {
    if (!nuevoInvitado.trim() || !celebracion || invitadosList.length >= LIMITE_FREE) return
    setGuardandoInvitado(true)
    const isPhone = /^\+?[\d\s\-()]{7,}$/.test(nuevoInvitado.trim()) && !nuevoInvitado.includes('@')
    const row = { celebracion_slug: celebracion.slug, email: nuevoInvitado.includes('@') ? nuevoInvitado.trim() : null, nombre: nuevoInvitado.trim(), user_id: null, created_at: new Date().toISOString() }
    const { data } = await supabase.from('invitados').insert(row).select().single()
    if (data) {
      setInvitadosList(prev => [...prev, data])
      if (isPhone) { setInvitadoPendienteWA(data); setWaPhone(nuevoInvitado.trim()); setShowWAPrompt(true) }
    }
    setNuevoInvitado(''); setGuardandoInvitado(false); setShowAddInvitado(false)
  }

  async function borrarInvitado(id: string) {
    if (!confirm(lang === 'en' ? 'Remove this guest?' : '¿Quitar a este invitado?')) return
    await supabase.from('invitados').delete().eq('id', id)
    setInvitadosList(prev => prev.filter(i => i.id !== id))
  }

  function enviarWA(nombre?: string, phone?: string) {
    const shareUrl = `https://joincheers.app/${celebracion?.slug}/r`
    const greeting = nombre ? `¡Hola ${nombre}! ` : '¡Hola! '
    const msg = encodeURIComponent(`${greeting}Te invito a ${titleRef.current?.innerText || celebracion?.nombre || ''}. Aquí está todo el plan: ${shareUrl}`)
    const p = (phone || waPhone).replace(/[^\d+]/g, '')
    window.open(p ? `https://wa.me/${p}?text=${msg}` : `https://wa.me/?text=${msg}`, '_blank')
    setShowWAPrompt(false); setWaPhone('')
  }

  function enviarSMS() {
    const shareUrl = `https://joincheers.app/${celebracion?.slug}/r`
    const msg = encodeURIComponent(`¡Hola! Te invito a ${celebracion?.nombre || ''}. El plan: ${shareUrl}`)
    window.open(`sms:?&body=${msg}`, '_blank')
  }

  // Regalos
  async function agregarRegalo() {
    if (!nuevoRegalo.nombre.trim() || !celebracion) return
    const nuevo = [...regalos, { id: Date.now().toString(), nombre: nuevoRegalo.nombre.trim(), precio: nuevoRegalo.precio, link: nuevoRegalo.link, reservado: false }]
    setRegalos(nuevo)
    await supabase.from('celebraciones').update({ gifts: nuevo }).eq('slug', celebracion.slug)
    setNuevoRegalo({ nombre: '', precio: '', link: '' }); setShowAddRegalo(false)
  }

  async function toggleRegalo(id: string) {
    const nuevo = regalos.map(r => r.id === id ? { ...r, reservado: !r.reservado } : r)
    setRegalos(nuevo)
    await supabase.from('celebraciones').update({ gifts: nuevo }).eq('slug', celebracion.slug)
  }

  async function borrarRegalo(id: string) {
    const nuevo = regalos.filter(r => r.id !== id)
    setRegalos(nuevo)
    await supabase.from('celebraciones').update({ gifts: nuevo }).eq('slug', celebracion.slug)
  }

  // Itinerario
  async function agregarParada() {
    if (!nuevaParada.lugar.trim() || !celebracion) return
    const nuevo = [...paradas, { id: Date.now().toString(), ...nuevaParada }]
    setParadas(nuevo)
    await supabase.from('celebraciones').update({ paradas: nuevo }).eq('slug', celebracion.slug)
    setNuevaParada({ lugar: '', hora: '', nota: '' }); setShowAddParada(false)
  }

  async function borrarParada(id: string) {
    const nuevo = paradas.filter(p => p.id !== id)
    setParadas(nuevo)
    await supabase.from('celebraciones').update({ paradas: nuevo }).eq('slug', celebracion.slug)
  }

  // Qué llevar
  async function agregarItem() {
    if (!nuevoItem.trim() || !celebracion) return
    const nuevo = [...quellevar, { id: Date.now().toString(), nombre: nuevoItem.trim(), listo: false }]
    setQuellevar(nuevo)
    await supabase.from('celebraciones').update({ quellevar: nuevo }).eq('slug', celebracion.slug)
    setNuevoItem(''); setShowAddItem(false)
  }

  async function toggleItem(id: string) {
    const nuevo = quellevar.map(i => i.id === id ? { ...i, listo: !i.listo } : i)
    setQuellevar(nuevo)
    await supabase.from('celebraciones').update({ quellevar: nuevo }).eq('slug', celebracion.slug)
  }

  async function borrarItem(id: string) {
    const nuevo = quellevar.filter(i => i.id !== id)
    setQuellevar(nuevo)
    await supabase.from('celebraciones').update({ quellevar: nuevo }).eq('slug', celebracion.slug)
  }

  // Quién trae qué
  async function agregarPlato() {
    if (!nuevoPlato.nombre.trim() || !celebracion) return
    const nuevo = [...menu, { id: Date.now().toString(), nombre: nuevoPlato.nombre.trim(), quien: nuevoPlato.quien }]
    setMenu(nuevo)
    await supabase.from('celebraciones').update({ menu: nuevo }).eq('slug', celebracion.slug)
    setNuevoPlato({ nombre: '', quien: '' }); setShowAddPlato(false)
  }

  async function borrarPlato(id: string) {
    const nuevo = menu.filter(p => p.id !== id)
    setMenu(nuevo)
    await supabase.from('celebraciones').update({ menu: nuevo }).eq('slug', celebracion.slug)
  }

  if (cargando) return (
    <div style={{ minHeight: '100vh', background: TEMAS.morado.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#EEEDFE', fontSize: 16 }}>{tx.loading}</p>
    </div>
  )

  if (acceso === 'denied') return (
    <div style={{ minHeight: '100vh', background: TEMAS.morado.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '2.5rem', maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1c1830', marginBottom: 8 }}>{tx.access_denied}</div>
        <p style={{ fontSize: 14, color: '#6b6585', margin: '0 0 20px' }}>{tx.no_permission}</p>
        <button onClick={() => router.back()} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 15, fontWeight: 700, padding: '12px 24px', borderRadius: 14, cursor: 'pointer' }}>{tx.go_home}</button>
      </div>
    </div>
  )

  const te = TEMAS[tema] || TEMAS.morado
  const F = FUENTES[fuente]?.font || FSYS
  const textColor = te.dark ? '#ffffff' : '#2a2440'
  const starColor = te.dark ? 'rgba(255,255,255,' : 'rgba(83,74,183,'
  const confirmados = rsvps.filter(r => r.asistencia === 'si').length
  const porConfirmar = rsvps.filter(r => r.asistencia !== 'si').length
  const shareUrl = `joincheers.app/${celebracion?.slug}/r`
  const limiteAlcanzado = invitadosList.length >= LIMITE_FREE
  const MIN_SIZE = 16, MAX_SIZE = isMobile ? 36 : 52

  const progressItems = [
    { label: lang === 'en' ? 'Cover photo' : 'Foto de portada', done: !!portadaUrl },
    { label: lang === 'en' ? 'Event title' : 'Título del evento', done: !!(titleRef.current?.innerText || celebracion?.nombre) },
    { label: lang === 'en' ? 'Guest of honor' : 'Festejado/a', done: !!festejado },
    { label: lang === 'en' ? 'Date' : 'Fecha', done: !!fecha },
    { label: lang === 'en' ? 'Place' : 'Lugar', done: !!lugar },
    { label: lang === 'en' ? 'Description' : 'Descripción', done: !!tagline },
    { label: lang === 'en' ? 'At least 1 guest' : 'Al menos 1 invitado', done: invitadosList.length > 0 },
    { label: lang === 'en' ? 'Gift list or itinerary' : 'Regalos o itinerario', done: regalos.length > 0 || paradas.length > 1 },
  ]
  const progress = Math.round((progressItems.filter(p => p.done).length / progressItems.length) * 100)
  const progressLabel = getProgressLabel(progress, lang)
  const isComplete = progress === 100

  const pillBtn: React.CSSProperties = { background: 'rgba(255,255,255,.92)', border: 'none', color: '#534AB7', fontSize: 13, fontWeight: 700, padding: '8px 14px', borderRadius: 99, cursor: 'pointer', fontFamily: FSYS, boxShadow: '0 4px 14px rgba(20,10,40,.18)', whiteSpace: 'nowrap' as const }
  const fieldInput: React.CSSProperties = { border: 'none', background: 'transparent', fontFamily: FSYS, fontSize: 15, fontWeight: 600, color: te.tileText, padding: '7px 8px', borderRadius: 9, outline: 'none', width: '100%', boxSizing: 'border-box' as const }
  const inputStyle: React.CSSProperties = { border: `1.5px solid ${te.accentBg}`, background: te.tileBg, fontFamily: FSYS, fontSize: 14, color: te.tileText, padding: '8px 12px', borderRadius: 10, outline: 'none', width: '100%', boxSizing: 'border-box' as const }
  const dashedBtn: React.CSSProperties = { border: '1.5px dashed #cfc8ec', background: 'none', color: '#534AB7', fontSize: 14, fontWeight: 700, padding: '10px 16px', borderRadius: 14, cursor: 'pointer', fontFamily: FSYS, marginTop: 8 }
  const addBtn: React.CSSProperties = { border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 700, padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: FSYS }
  const cancelBtn: React.CSSProperties = { border: 'none', background: '#f0edf8', color: '#7a7494', fontSize: 13, fontWeight: 700, padding: '8px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: FSYS }
  const deleteBtn: React.CSSProperties = { border: 'none', background: '#fee2e2', color: '#dc2626', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
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
              <div style={{ fontFamily: FUENTES[k].font, fontSize: 17, fontWeight: 700, lineHeight: 1.2, marginBottom: 3, color: fuente === k ? '#2a2440' : '#fff' }}>
                {titleRef.current?.innerText || celebracion?.nombre || 'Mi celebración'}
              </div>
              <div style={{ fontFamily: FSYS, fontSize: 10, fontWeight: 700, letterSpacing: '.5px', color: fuente === k ? '#534AB7' : 'rgba(255,255,255,.5)', textTransform: 'uppercase' as const }}>{FUENTES[k].label}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase' as const, marginBottom: 8 }}>
          {lang === 'en' ? 'Title size' : 'Tamaño'} · {tituloSize}px
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
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase' as const, marginBottom: 10 }}>
          {lang === 'en' ? 'Alignment' : 'Alineación'}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['normal-left', 'normal-center', 'spaced'] as TituloEstilo[]).map(s => {
            const labels: Record<string, string> = { 'normal-left': '⬛ Izq.', 'normal-center': '⬜ Cen.', 'spaced': 'S·P·A·C·E' }
            return (
              <button key={s} onClick={() => { setTituloEstilo(s); guardarCampo('titulo_align', s); titleRef.current?.focus(); if (s === 'normal-center' || s === 'spaced') document.execCommand('justifyCenter'); else document.execCommand('justifyLeft') }}
                style={{ flex: 1, border: tituloEstilo === s ? '2px solid #fff' : '2px solid rgba(255,255,255,.15)', borderRadius: 10, padding: '8px 4px', cursor: 'pointer', background: tituloEstilo === s ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.08)', color: tituloEstilo === s ? '#534AB7' : '#fff', fontSize: 10, fontWeight: 700, fontFamily: FSYS, transition: 'all .15s' }}>
                {labels[s]}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase' as const, marginBottom: 10 }}>
          {lang === 'en' ? 'Format' : 'Formato'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ cmd: 'bold', label: 'B', style: { fontWeight: 900 } }, { cmd: 'italic', label: 'I', style: { fontStyle: 'italic' } }, { cmd: 'underline', label: 'U', style: { textDecoration: 'underline' } }, { cmd: 'strikeThrough', label: 'S', style: { textDecoration: 'line-through' } }].map(f => (
            <button key={f.cmd} onClick={() => applyFormat(f.cmd)} style={{ width: 40, height: 40, borderRadius: 10, border: '2px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: FSYS, display: 'flex', alignItems: 'center', justifyContent: 'center', ...f.style }}>{f.label}</button>
          ))}
          <button onClick={() => { titleRef.current?.focus(); document.execCommand('removeFormat'); setTimeout(saveTitleHtml, 100) }} style={{ flex: 1, height: 40, borderRadius: 10, border: '2px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.6)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: FSYS }}>
            {lang === 'en' ? 'Clear' : 'Limpiar'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', margin: '8px 0 0', lineHeight: 1.4 }}>
          {lang === 'en' ? 'Select text in the title then tap a format.' : 'Selecciona texto en el título y aplica el formato.'}
        </p>
      </div>

      <button onClick={() => setShowCustomize(false)} style={{ border: 'none', background: '#fff', color: '#534AB7', fontSize: 14, fontWeight: 800, padding: '12px', borderRadius: 14, cursor: 'pointer', fontFamily: FSYS }}>{tx.save_close}</button>
    </div>
  )

  const TileContent = ({ tileKey, tileSize }: { tileKey: string; tileSize: string }) => {
    // PORTADA
    if (tileKey === 'portada') return (
      <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) subirPortada(f) }}
        onClick={() => { if (portadaUrl) setShowLightbox(true); else if (!subiendoPortada) fileInputRef.current?.click() }}
        style={{ margin: '0 -18px -20px', cursor: portadaUrl ? 'zoom-in' : 'pointer', borderRadius: '0 0 18px 18px', overflow: 'hidden', position: 'relative' as const }}>
        <div style={{ height: tileSize === 'lg' ? (isMobile ? 260 : 420) : (isMobile ? 180 : 240), background: portadaUrl ? `url(${portadaUrl}) ${imgPosition}/cover no-repeat` : dragOver ? '#EDE9FF' : 'linear-gradient(135deg,#EEEDFE,#FCE9F0)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {subiendoPortada
            ? <div style={{ background: 'rgba(255,255,255,.9)', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 700, color: '#534AB7' }}>{tx.uploading}</div>
            : portadaUrl
              ? <div onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }} style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,.65)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 99, cursor: 'pointer', zIndex: 2, backdropFilter: 'blur(4px)' }}>{tx.change_image}</div>
              : <div style={{ textAlign: 'center' as const, color: '#a39ec0', pointerEvents: 'none' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{tx.cover_image}</div>
                  <div style={{ fontSize: 12 }}>{tx.cover_hint}</div>
                </div>}
        </div>
      </div>
    )

    // INVITADOS
    if (tileKey === 'invitados') return (
      <div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, background: '#ECF7F0', borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ fontSize: 26, fontWeight: 850, color: '#1f8a5b', lineHeight: 1 }}>{confirmados}</div>
            <div style={{ fontSize: 12, color: '#1f8a5b', fontWeight: 700, marginTop: 3 }}>{tx.confirmed}</div>
          </div>
          <div style={{ flex: 1, background: '#FFF4E6', borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ fontSize: 26, fontWeight: 850, color: '#c98a1e', lineHeight: 1 }}>{porConfirmar}</div>
            <div style={{ fontSize: 12, color: '#c98a1e', fontWeight: 700, marginTop: 3 }}>{tx.to_confirm}</div>
          </div>
        </div>

        {invitadosList.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {invitadosList.map(inv => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: te.accentBg, color: te.accentText, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initial(inv.nombre)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: te.tileText, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{inv.nombre}</div>
                  {inv.email && <div style={{ fontSize: 11, color: '#a39ec0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{inv.email}</div>}
                </div>
                <button onClick={() => enviarWA(inv.nombre)} title="WhatsApp" style={{ border: 'none', background: '#25D366', color: '#fff', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>W</button>
                <button onClick={() => borrarInvitado(inv.id)} style={{ ...deleteBtn }}>×</button>
              </div>
            ))}
          </div>
        )}

        {limiteAlcanzado && (
          <div style={{ background: 'linear-gradient(135deg,#534AB7,#D4537E)', borderRadius: 14, padding: '12px 14px', marginBottom: 10, color: '#fff' }}>
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>{tx.free_limit_title(LIMITE_FREE)}</div>
            <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.4, marginBottom: 8 }}>{tx.free_limit_desc}</div>
            <button style={{ border: 'none', background: '#fff', color: '#534AB7', fontSize: 12, fontWeight: 800, padding: '7px 14px', borderRadius: 9, cursor: 'pointer', fontFamily: FSYS }}>{tx.upgrade_cta}</button>
          </div>
        )}

        {!limiteAlcanzado && (
          showAddInvitado ? (
            <div style={{ marginTop: 4 }}>
              <input value={nuevoInvitado} onChange={e => setNuevoInvitado(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarInvitado()} placeholder="Nombre, email o teléfono" autoFocus style={{ ...inputStyle, marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button onClick={agregarInvitado} disabled={guardandoInvitado} style={{ ...addBtn, flex: 1 }}>{guardandoInvitado ? '...' : tx.add_guest_btn}</button>
                <button onClick={() => { setShowAddInvitado(false); setNuevoInvitado('') }} style={cancelBtn}>{tx.cancel}</button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => enviarWA()} style={{ flex: 1, border: 'none', background: '#25D366', color: '#fff', fontSize: 13, fontWeight: 700, padding: '9px', borderRadius: 10, cursor: 'pointer', fontFamily: FSYS }}>WhatsApp</button>
                <button onClick={enviarSMS} style={{ flex: 1, border: 'none', background: '#534AB7', color: '#fff', fontSize: 13, fontWeight: 700, padding: '9px', borderRadius: 10, cursor: 'pointer', fontFamily: FSYS }}>SMS</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddInvitado(true)} style={{ ...dashedBtn, width: '100%', textAlign: 'center' as const }}>
              {tx.add_guest(invitadosList.length, LIMITE_FREE)}
            </button>
          )
        )}

        {rsvps.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${te.accentBg}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#a39ec0', textTransform: 'uppercase' as const, letterSpacing: '.5px', marginBottom: 8 }}>RSVPs</div>
            {rsvps.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: te.accentBg, color: te.accentText, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initial(r.nombre)}</div>
                <span style={{ flex: 1, fontSize: 13, color: te.tileText, fontWeight: 600 }}>{r.nombre}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: r.asistencia === 'si' ? '#1f8a5b' : r.asistencia === 'no' ? '#dc2626' : '#c98a1e', background: r.asistencia === 'si' ? '#ECF7F0' : r.asistencia === 'no' ? '#FEE2E2' : '#FFF4E6', padding: '2px 8px', borderRadius: 99 }}>
                  {r.asistencia === 'si' ? tx.going : r.asistencia === 'no' ? tx.not_going : tx.maybe}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )

    // APERTURAS
    if (tileKey === 'aperturas') return (
      <div>
        <div style={{ fontSize: 13, color: '#7a7494', fontWeight: 700, marginBottom: 8 }}>{tx.no_openings}</div>
        <div style={{ height: 8, background: te.accentBg, borderRadius: 99 }} />
      </div>
    )

    // REGALOS
    if (tileKey === 'regalos') return (
      <div>
        {regalos.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {regalos.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: r.reservado ? '#f0faf4' : '#fafafa', borderRadius: 12, border: r.reservado ? '1.5px solid #d8f3dc' : '1.5px solid #f0edf8' }}>
                <button onClick={() => toggleRegalo(r.id)} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${r.reservado ? '#1f8a5b' : '#cfc8ec'}`, background: r.reservado ? '#1f8a5b' : 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {r.reservado && <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>✓</span>}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: r.reservado ? '#1f8a5b' : te.tileText, textDecoration: r.reservado ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{r.nombre}</div>
                  {r.precio && <div style={{ fontSize: 11, color: '#a39ec0' }}>${r.precio}</div>}
                </div>
                {r.link && <a href={r.link} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 800, color: '#534AB7', background: '#EEEDFE', padding: '4px 10px', borderRadius: 99, textDecoration: 'none', flexShrink: 0 }}>Ver</a>}
                <button onClick={() => borrarRegalo(r.id)} style={{ ...deleteBtn }}>×</button>
              </div>
            ))}
          </div>
        )}
        {showAddRegalo ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={nuevoRegalo.nombre} onChange={e => setNuevoRegalo(p => ({ ...p, nombre: e.target.value }))} placeholder={lang === 'en' ? 'Gift name' : 'Nombre del regalo'} style={inputStyle} autoFocus />
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={nuevoRegalo.precio} onChange={e => setNuevoRegalo(p => ({ ...p, precio: e.target.value }))} placeholder={lang === 'en' ? 'Price (optional)' : 'Precio (opcional)'} style={{ ...inputStyle, flex: 1 }} />
              <input value={nuevoRegalo.link} onChange={e => setNuevoRegalo(p => ({ ...p, link: e.target.value }))} placeholder="Link (opcional)" style={{ ...inputStyle, flex: 2 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={agregarRegalo} style={{ ...addBtn, flex: 1 }}>{lang === 'en' ? 'Add' : 'Agregar'}</button>
              <button onClick={() => { setShowAddRegalo(false); setNuevoRegalo({ nombre: '', precio: '', link: '' }) }} style={cancelBtn}>{tx.cancel}</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddRegalo(true)} style={dashedBtn}>{tx.add_gift}</button>
        )}
      </div>
    )

    // ITINERARIO
    if (tileKey === 'itinerario') return (
      <div>
        {paradas.filter(p => p.id).length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
            {paradas.filter(p => p.id).map((p, i) => (
              <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: te.tileText }}>{p.lugar}</div>
                  {p.hora && <div style={{ fontSize: 12, color: '#534AB7', fontWeight: 600, marginTop: 1 }}>{p.hora}</div>}
                  {p.nota && <div style={{ fontSize: 12, color: '#a39ec0', marginTop: 1 }}>{p.nota}</div>}
                  {p.lugar && <a href={`https://maps.google.com/?q=${encodeURIComponent(p.lugar)}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 700, color: '#1a73e8', textDecoration: 'none', display: 'inline-block', marginTop: 2 }}>{tx.see_map}</a>}
                </div>
                <button onClick={() => borrarParada(p.id)} style={{ ...deleteBtn, marginTop: 2 }}>×</button>
              </div>
            ))}
          </div>
        )}
        {showAddParada ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={nuevaParada.lugar} onChange={e => setNuevaParada(p => ({ ...p, lugar: e.target.value }))} placeholder={lang === 'en' ? 'Place or address' : 'Lugar o dirección'} style={inputStyle} autoFocus />
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={nuevaParada.hora} onChange={e => setNuevaParada(p => ({ ...p, hora: e.target.value }))} placeholder={lang === 'en' ? 'Time (e.g. 8pm)' : 'Hora (ej: 8pm)'} style={{ ...inputStyle, flex: 1 }} />
              <input value={nuevaParada.nota} onChange={e => setNuevaParada(p => ({ ...p, nota: e.target.value }))} placeholder={lang === 'en' ? 'Note (optional)' : 'Nota (opcional)'} style={{ ...inputStyle, flex: 2 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={agregarParada} style={{ ...addBtn, flex: 1 }}>{lang === 'en' ? 'Add stop' : 'Agregar parada'}</button>
              <button onClick={() => { setShowAddParada(false); setNuevaParada({ lugar: '', hora: '', nota: '' }) }} style={cancelBtn}>{tx.cancel}</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddParada(true)} style={dashedBtn}>{tx.add_stop}</button>
        )}
      </div>
    )

    // QUÉ LLEVAR
    if (tileKey === 'quellevar') return (
      <div>
        {quellevar.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {quellevar.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => toggleItem(item.id)} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${item.listo ? '#534AB7' : '#cfc8ec'}`, background: item.listo ? '#534AB7' : 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.listo && <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>✓</span>}
                </button>
                <span style={{ flex: 1, fontSize: 14, color: te.tileText, textDecoration: item.listo ? 'line-through' : 'none', opacity: item.listo ? 0.5 : 1 }}>{item.nombre}</span>
                <button onClick={() => borrarItem(item.id)} style={{ ...deleteBtn }}>×</button>
              </div>
            ))}
          </div>
        )}
        {showAddItem ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={nuevoItem} onChange={e => setNuevoItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarItem()} placeholder={lang === 'en' ? 'Item to bring' : 'Artículo a llevar'} style={{ ...inputStyle, flex: 1 }} autoFocus />
            <button onClick={agregarItem} style={addBtn}>{lang === 'en' ? 'Add' : 'Agregar'}</button>
            <button onClick={() => { setShowAddItem(false); setNuevoItem('') }} style={cancelBtn}>×</button>
          </div>
        ) : (
          <button onClick={() => setShowAddItem(true)} style={dashedBtn}>{tx.add_item}</button>
        )}
      </div>
    )

    // QUIÉN TRAE QUÉ
    if (tileKey === 'menu') return (
      <div>
        {menu.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {menu.map(plato => (
              <div key={plato.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#fafafa', borderRadius: 12, border: '1.5px solid #f0edf8' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: te.tileText }}>{plato.nombre}</div>
                  {plato.quien && <div style={{ fontSize: 12, color: '#534AB7', fontWeight: 600, marginTop: 1 }}>→ {plato.quien}</div>}
                </div>
                <button onClick={() => borrarPlato(plato.id)} style={{ ...deleteBtn }}>×</button>
              </div>
            ))}
          </div>
        )}
        {showAddPlato ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={nuevoPlato.nombre} onChange={e => setNuevoPlato(p => ({ ...p, nombre: e.target.value }))} placeholder={lang === 'en' ? 'Dish or item' : 'Platillo o artículo'} style={inputStyle} autoFocus />
            <input value={nuevoPlato.quien} onChange={e => setNuevoPlato(p => ({ ...p, quien: e.target.value }))} placeholder={lang === 'en' ? 'Who brings it? (optional)' : '¿Quién lo trae? (opcional)'} style={inputStyle} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={agregarPlato} style={{ ...addBtn, flex: 1 }}>{lang === 'en' ? 'Add' : 'Agregar'}</button>
              <button onClick={() => { setShowAddPlato(false); setNuevoPlato({ nombre: '', quien: '' }) }} style={cancelBtn}>{tx.cancel}</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddPlato(true)} style={dashedBtn}>{tx.assign_dish}</button>
        )}
      </div>
    )

    // MENSAJES
    if (tileKey === 'mensajes') return <p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>{tx.messages_empty}</p>

    // PRESUPUESTO
    if (tileKey === 'presupuesto') return <p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>{tx.budget_empty}</p>

    // RESERVACIÓN
    if (tileKey === 'reservacion') return (
      <div style={{ background: 'linear-gradient(135deg,#534AB7,#D4537E)', borderRadius: 16, padding: 18, color: '#fff' }}>
        <p style={{ fontSize: 14, margin: 0 }}>{tx.reservation_empty}</p>
      </div>
    )

    return null
  }

  return (
    <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: te.bg, fontFamily: FSYS }}>
      <style>{`@keyframes starPulse { 0%,100%{opacity:0;transform:scale(.3)} 50%{opacity:1;transform:scale(1)} } [contenteditable]:empty:before{content:attr(data-placeholder);color:#a39ec0} [contenteditable]:focus{outline:none}`}</style>

      {/* Estrellitas */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99 }}>
        {STARS.map((s, i) => (
          <div key={i} style={{ position: 'absolute', top: s.top, left: s.left, fontSize: s.size, color: `${starColor}0.45)`, lineHeight: 1, userSelect: 'none', animation: `starPulse ${s.dur} ease-in-out infinite ${s.delay}` }}>✦</div>
        ))}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) subirPortada(f) }} style={{ display: 'none' }} />

      {/* Lightbox */}
      {showLightbox && portadaUrl && (
        <div onClick={() => setShowLightbox(false)} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <img src={portadaUrl} alt="portada" style={{ width: '90vw', maxWidth: 600, height: '70vw', maxHeight: 500, borderRadius: 20, objectFit: 'cover', boxShadow: '0 24px 60px rgba(0,0,0,.6)' }} onClick={e => e.stopPropagation()} />
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }} onClick={e => e.stopPropagation()}>
            {[{ val: 'top', label: lang === 'en' ? 'Top' : 'Arriba' }, { val: 'center', label: lang === 'en' ? 'Center' : 'Centro' }, { val: 'bottom', label: lang === 'en' ? 'Bottom' : 'Abajo' }].map(p => (
              <button key={p.val} onClick={() => setImgPosition(p.val)} style={{ border: imgPosition === p.val ? '2px solid #fff' : '2px solid rgba(255,255,255,.3)', background: imgPosition === p.val ? '#fff' : 'transparent', color: imgPosition === p.val ? '#534AB7' : '#fff', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 99, cursor: 'pointer' }}>{p.label}</button>
            ))}
            <button onClick={() => { setShowLightbox(false); fileInputRef.current?.click() }} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 99, cursor: 'pointer' }}>{tx.change_image}</button>
          </div>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, marginTop: 12 }}>{lang === 'en' ? 'Click outside to close' : 'Clic fuera para cerrar'}</p>
        </div>
      )}

      {/* Modal WhatsApp */}
      {showWAPrompt && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: '28px 24px', maxWidth: 360, width: '100%' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#2a2440', marginBottom: 8 }}>WhatsApp</div>
            <p style={{ fontSize: 14, color: '#6b6585', margin: '0 0 16px' }}>{lang === 'en' ? `Confirm number for ${invitadoPendienteWA?.nombre}` : `Confirma el número de ${invitadoPendienteWA?.nombre}`}</p>
            <input value={waPhone} onChange={e => setWaPhone(e.target.value)} placeholder="+52 81 1234 5678" style={{ ...inputStyle, marginBottom: 12 }} />
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
              <div style={{ fontSize: 11, fontWeight: 700, color: te.dark ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.35)', letterSpacing: '.5px' }}>{tx.cheers}</div>
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
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => router.push(`/${celebracion?.slug}/r`)} style={{ ...pillBtn, background: 'rgba(255,255,255,.15)', color: textColor, border: '1px solid rgba(255,255,255,.3)' }}>{tx.view_as_guest}</button>
              <button onClick={() => setShowCustomize(v => !v)} style={{ ...pillBtn, background: showCustomize ? '#534AB7' : 'rgba(255,255,255,.92)', color: showCustomize ? '#fff' : '#534AB7' }}>{tx.customize}</button>
            </div>
          </div>

          {/* Hero card */}
          <div style={{ background: te.tileBg, borderRadius: 26, overflow: 'hidden', boxShadow: '0 18px 46px rgba(25,12,50,.22)', marginBottom: 16 }}>
            <div style={{ padding: '16px 18px 20px' }}>
              <input value={tagline} onChange={e => setTagline(e.target.value)} onBlur={e => guardarCampo('tagline', e.target.value)} placeholder={tx.tagline_placeholder} style={{ border: 'none', background: 'transparent', fontFamily: FSYS, fontSize: 13, color: '#7a7494', padding: '3px 8px', outline: 'none', width: '100%', boxSizing: 'border-box' as const, marginBottom: 8 }} />
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '8px 16px', padding: '0 4px' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase' as const, margin: '0 0 1px 8px' }}>{tx.celebrated}</div>
                  <input style={fieldInput} value={festejado} onChange={e => setFestejado(e.target.value)} onBlur={e => guardarCampo('festejado_nombre', e.target.value)} placeholder={tx.nueva_festejado_placeholder} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase' as const, margin: '0 0 1px 8px' }}>{tx.date}</div>
                  <input type="date" style={fieldInput} value={fecha} onChange={e => setFecha(e.target.value)} onBlur={e => guardarCampo('fecha', e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase' as const, margin: '0 0 1px 8px' }}>{tx.place}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12, color: '#a39ec0' }}>{tx.location}</span>
                    <input style={{ ...fieldInput, flex: 1 }} value={lugar} onChange={e => setLugar(e.target.value)} onBlur={e => guardarLugar(e.target.value)} placeholder="Google Maps" />
                    {lugar && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar)}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 800, color: '#1a73e8', background: '#E8F0FE', padding: '5px 10px', borderRadius: 99, textDecoration: 'none', whiteSpace: 'nowrap' as const }}>{tx.see_map}</a>}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase' as const, margin: '0 0 1px 8px' }}>{tx.guest_link}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 8px' }}>
                    <span style={{ fontSize: 13, color: '#534AB7', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{shareUrl}</span>
                    <button onClick={() => navigator.clipboard.writeText(`https://${shareUrl}`)} style={{ border: 'none', background: te.accentBg, color: te.accentText, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 99, cursor: 'pointer', fontFamily: FSYS, flexShrink: 0 }}>{tx.copy}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upsell */}
          <div style={{ borderRadius: 22, padding: '22px 24px', marginBottom: 18, background: 'linear-gradient(120deg,#534AB7,#7b46a8 55%,#D4537E)', boxShadow: '0 16px 42px rgba(83,74,183,.45)', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' as const }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1.5px', opacity: 0.85 }}>{tx.lifetime_label}</div>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 850, letterSpacing: '-.4px', marginTop: 5 }}>{tx.lifetime_title}</div>
                <div style={{ fontSize: 13, opacity: 0.92, marginTop: 7, lineHeight: 1.5 }}>{tx.lifetime_desc}</div>
              </div>
              <button style={{ flexShrink: 0, background: '#fff', color: '#534AB7', border: 'none', borderRadius: 15, padding: '14px 20px', fontSize: 14, fontWeight: 850, cursor: 'pointer', fontFamily: FSYS }}>{tx.lifetime_cta}</button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 4px 12px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: textColor, opacity: 0.8 }}>{tx.drag_hint}</div>
            {guardandoToggle && <div style={{ fontSize: 12, color: textColor, opacity: 0.6 }}>{tx.saving}</div>}
          </div>

          {/* Grid tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            {tiles.map((tile, i) => {
              const info = TINFO[tile.key] || { label: '?', title_key: '' }
              const isLg = tile.size === 'lg'
              const visible = tilesVisibles[tile.key] !== false
              const tileLabel = tile.key === 'portada' ? (lang === 'en' ? 'Cover photo' : 'Foto de portada') : (tx as any)[info.title_key] || tile.key
              return (
                <div key={tile.key} draggable onDragStart={() => setDragIdx(i)} onDragOver={e => { e.preventDefault(); setDragOverIdx(i) }} onDragLeave={() => setDragOverIdx(null)} onDrop={() => { moveTile(dragIdx!, i); setDragIdx(null); setDragOverIdx(null) }}
                  style={{ gridColumn: isLg && !isMobile ? '1 / -1' : 'auto', background: dragOverIdx === i && dragIdx !== i ? 'transparent' : te.tileBg, borderRadius: 22, padding: '20px 18px', boxShadow: dragOverIdx === i && dragIdx !== i ? 'none' : '0 8px 24px rgba(25,12,50,.1)', opacity: visible ? (dragIdx === i ? 0.4 : 1) : 0.65, border: dragOverIdx === i && dragIdx !== i ? '2.5px dashed rgba(83,74,183,.5)' : 'none', transition: 'all .15s', color: te.tileText }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                    <span style={{ cursor: 'grab', color: '#c8c2e0', fontSize: 15 }}>⠿</span>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: te.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: te.accentText, letterSpacing: '.3px' }}>{info.label}</span>
                    </div>
                    <span style={{ flex: 1, fontSize: 15, fontWeight: 800, color: te.tileText }}>{tileLabel}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#a39ec0', fontWeight: 600 }}>{visible ? tx.visible : tx.hidden}</span>
                      <Toggle on={visible} onToggle={() => toggleVisibilidad(tile.key)} />
                    </div>
                    <button onClick={() => cycleSize(i)} style={{ border: 'none', background: te.accentBg, color: te.accentText, width: 28, height: 28, borderRadius: 9, cursor: 'pointer', fontSize: 13, fontFamily: FSYS }}>⤢</button>
                  </div>
                  <TileContent tileKey={tile.key} tileSize={tile.size} />
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}