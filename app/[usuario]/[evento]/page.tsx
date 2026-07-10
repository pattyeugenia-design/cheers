'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../supabase'
import { getLang, t } from '../../i18n'

const LIMITE_FREE = 3

const CHIPS: Record<string, string> = {
  cumple: 'BDAY', cumpleanos: 'BDAY', cena: 'DINE', viaje: 'TRIP',
  reunion: 'MEET', evento: 'EVENT', otro: 'OTHER'
}

const TEMAS: Record<string, { label_key: string; bg: string; dark: boolean; tileBg: string; tileText: string; accentBg: string; accentText: string }> = {
  morado:  { label_key: 'theme_morado',  bg: 'radial-gradient(circle at 18% 16%,#7b6fd0,transparent 46%),linear-gradient(160deg,#534AB7,#7b46a8 58%,#D4537E)', dark: true,  tileBg: '#fff',    tileText: '#2a2440', accentBg: '#EEEDFE', accentText: '#534AB7' },
  rosa:    { label_key: 'theme_rosa',    bg: 'linear-gradient(155deg,#D4537E,#a14b9c)',                                                                        dark: true,  tileBg: '#fff5f8', tileText: '#3a1525', accentBg: '#FCE9F0', accentText: '#D4537E' },
  noche:   { label_key: 'theme_noche',   bg: 'linear-gradient(160deg,#0f0c29,#302b63,#24243e)',                                                                dark: true,  tileBg: '#1a1740', tileText: '#e8e4ff', accentBg: '#2a2560', accentText: '#a89df0' },
  bosque:  { label_key: 'theme_bosque',  bg: 'linear-gradient(155deg,#1a3c2a,#2d6a4f,#40916c)',                                                               dark: true,  tileBg: '#f0faf4', tileText: '#1a3c2a', accentBg: '#d8f3dc', accentText: '#2d6a4f' },
  ambar:   { label_key: 'theme_ambar',   bg: 'linear-gradient(155deg,#b5451b,#e76f51,#f4a261)',                                                               dark: true,  tileBg: '#fff8f0', tileText: '#3d1a08', accentBg: '#fde8d8', accentText: '#b5451b' },
  carbon:  { label_key: 'theme_carbon',  bg: 'linear-gradient(160deg,#1a1a1a,#2d2d2d,#3d3d3d)',                                                               dark: true,  tileBg: '#2a2a2a', tileText: '#f0f0f0', accentBg: '#3a3a3a', accentText: '#d0d0d0' },
  lavanda: { label_key: 'theme_lavanda', bg: '#EEEDFE',                                                                                                       dark: false, tileBg: '#fff',    tileText: '#2a2440', accentBg: '#534AB7', accentText: '#fff'    },
  crema:   { label_key: 'theme_crema',   bg: '#FBF4EC',                                                                                                       dark: false, tileBg: '#fff',    tileText: '#2a2440', accentBg: '#f0e6d3', accentText: '#7a5c3a' },
}
const TEMA_ORDER = ['morado', 'rosa', 'noche', 'bosque', 'ambar', 'carbon', 'lavanda', 'crema']

const FUENTES: Record<string, { label_key: string; font: string }> = {
  system:  { label_key: 'font_modern',  font: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' },
  georgia: { label_key: 'font_classic', font: 'Georgia, "Times New Roman", serif' },
  lora:    { label_key: 'font_elegant', font: '"Lora", Georgia, serif' },
  fredoka: { label_key: 'font_fun',     font: '"Fredoka One", "Comic Sans MS", cursive' },
}
const FUENTE_ORDER = ['system', 'georgia', 'lora', 'fredoka']

type TituloEstilo = 'normal-left' | 'normal-center' | 'spaced' | 'underline' | 'strikethrough'
const ESTILOS: { key: TituloEstilo; label_key: string; example: string }[] = [
  { key: 'normal-left',   label_key: 'style_left',    example: 'Aa' },
  { key: 'normal-center', label_key: 'style_center',  example: 'Aa' },
  { key: 'spaced',        label_key: 'style_spaced',  example: 'A a' },
  { key: 'underline',     label_key: 'style_underline', example: 'Aa' },
  { key: 'strikethrough', label_key: 'style_strike',  example: 'Aa' },
]

const DEFAULT_TILES_VISIBLES: Record<string, boolean> = {
  invitados: true, aperturas: true, regalos: true, mensajes: true,
  itinerario: true, presupuesto: true, quellevar: true, menu: true, reservacion: true
}

const TINFO: Record<string, { label: string; title_key: string }> = {
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

function tilesForType(type: string, sub?: string) {
  const SETS: Record<string, string[]> = {
    cumple:  ['invitados', 'aperturas', 'regalos', 'mensajes'],
    cena:    sub === 'restaurante' ? ['invitados', 'aperturas', 'reservacion'] : ['invitados', 'aperturas', 'menu'],
    viaje:   ['invitados', 'aperturas', 'itinerario', 'presupuesto', 'quellevar'],
    reunion: ['invitados', 'aperturas', 'menu'],
    evento:  ['invitados', 'aperturas', 'regalos'],
    otro:    ['invitados', 'aperturas', 'regalos'],
  }
  const LG: Record<string, boolean> = { regalos: true, itinerario: true, menu: true, mensajes: true }
  const keys = SETS[type] || ['invitados', 'aperturas', 'regalos']
  return keys.map(k => ({ key: k, size: LG[k] ? 'lg' : 'sm' }))
}

const initial = (n: string) => (n || '?').trim()[0].toUpperCase()

function tituloStyle(estilo: TituloEstilo, fuente: string, tileText: string): React.CSSProperties {
  const base: React.CSSProperties = { border: 'none', background: 'transparent', fontFamily: fuente, fontWeight: 850, color: tileText, padding: '5px 8px', borderRadius: 10, outline: 'none', minWidth: 0, width: '100%' }
  switch (estilo) {
    case 'normal-left':   return { ...base, fontSize: 23, textAlign: 'left',   letterSpacing: '-.5px' }
    case 'normal-center': return { ...base, fontSize: 23, textAlign: 'center', letterSpacing: '-.5px' }
    case 'spaced':        return { ...base, fontSize: 20, textAlign: 'center', letterSpacing: '6px', textTransform: 'uppercase' }
    case 'underline':     return { ...base, fontSize: 23, textAlign: 'left',   textDecoration: 'underline' }
    case 'strikethrough': return { ...base, fontSize: 23, textAlign: 'left',   textDecoration: 'line-through' }
  }
}

function TileIcon({ label, accentBg, accentText }: { label: string; accentBg: string; accentText: string }) {
  return (
    <div style={{ width: 28, height: 28, borderRadius: 8, background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: accentText, letterSpacing: '.3px' }}>{label}</span>
    </div>
  )
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{ width: 36, height: 20, borderRadius: 99, border: 'none', padding: 0, background: on ? 'linear-gradient(135deg,#534AB7,#D4537E)' : '#d4d0e8', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
    </button>
  )
}

export default function Dashboard({ params }: { params: Promise<{ usuario: string; evento: string }> }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tx, setTx] = useState(t.es)
  const [celebracion, setCelebracion] = useState<any>(null)
  const [rsvps, setRsvps] = useState<any[]>([])
  const [invitadosList, setInvitadosList] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [acceso, setAcceso] = useState<'loading' | 'ok' | 'denied'>('loading')

  const [title, setTitle] = useState('')
  const [tagline, setTagline] = useState('')
  const [festejado, setFestejado] = useState('')
  const [fecha, setFecha] = useState('')
  const [lugar, setLugar] = useState('')
  const [portadaUrl, setPortadaUrl] = useState<string | null>(null)
  const [subiendoPortada, setSubiendoPortada] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const [tiles, setTiles] = useState<{ key: string; size: string }[]>([])
  const [tilesVisibles, setTilesVisibles] = useState<Record<string, boolean>>(DEFAULT_TILES_VISIBLES)
  const [tema, setTema] = useState('morado')
  const [fuente, setFuente] = useState('system')
  const [tituloEstilo, setTituloEstilo] = useState<TituloEstilo>('normal-left')
  const [showCustomize, setShowCustomize] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [guardandoToggle, setGuardandoToggle] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const [showAddInvitado, setShowAddInvitado] = useState(false)
  const [nuevoInvitado, setNuevoInvitado] = useState('')
  const [guardandoInvitado, setGuardandoInvitado] = useState(false)

  useEffect(() => {
    const lang = getLang()
    setTx(t[lang])
    const check = () => setIsMobile(window.innerWidth < 600)
    check()
    window.addEventListener('resize', check)
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

      setAcceso('ok')
      setCelebracion(cel)
      setTitle(cel.nombre || '')
      setTagline(cel.tagline || '')
      setFestejado(cel.festejado_nombre || '')
      setFecha(cel.fecha || '')
      setLugar(cel.paradas?.[0]?.lugar || '')
      setPortadaUrl(cel.portada_url || null)
      setTiles(tilesForType(cel.tipo, cel.sub_tipo))
      setTilesVisibles({ ...DEFAULT_TILES_VISIBLES, ...(cel.tiles_visibles || {}) })
      if (cel.tema) setTema(cel.tema)
      if (cel.fuente) setFuente(cel.fuente)
      if (cel.titulo_align) setTituloEstilo(cel.titulo_align as TituloEstilo)

      const { data: rsvpData } = await supabase.from('rsvps').select('*').eq('celebracion_slug', cel.slug).order('created_at', { ascending: false })
      setRsvps(rsvpData || [])

      const { data: invData } = await supabase.from('invitados').select('*').eq('celebracion_slug', cel.slug).order('created_at', { ascending: false })
      setInvitadosList(invData || [])

      setCargando(false)
    })
  }, [])

  function moveTile(from: number, to: number) {
    if (from == null || from === to) return
    setTiles(prev => { const t = [...prev]; const [m] = t.splice(from, 1); t.splice(to, 0, m); return t })
  }

  function cycleSize(i: number) {
    setTiles(prev => prev.map((x, j) => j === i ? { ...x, size: x.size === 'sm' ? 'lg' : 'sm' } : x))
  }

  async function toggleVisibilidad(key: string) {
    const nuevo = { ...tilesVisibles, [key]: !tilesVisibles[key] }
    setTilesVisibles(nuevo)
    setGuardandoToggle(true)
    await supabase.from('celebraciones').update({ tiles_visibles: nuevo }).eq('slug', celebracion.slug)
    setGuardandoToggle(false)
  }

  async function guardarCampo(campo: string, valor: string) {
    if (!celebracion) return
    await supabase.from('celebraciones').update({ [campo]: valor }).eq('slug', celebracion.slug)
  }

  async function guardarLugar(val: string) {
    if (!celebracion) return
    const paradas = celebracion.paradas || []
    if (paradas.length > 0) {
      paradas[0].lugar = val
    } else {
      paradas.push({ lugar: val, hora: '', nota: '' })
    }
    await supabase.from('celebraciones').update({ paradas }).eq('slug', celebracion.slug)
    setCelebracion((prev: any) => ({ ...prev, paradas }))
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (file) subirPortada(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files?.[0]; if (file) subirPortada(file)
  }

  async function agregarInvitado() {
    if (!nuevoInvitado.trim() || !celebracion || invitadosList.length >= LIMITE_FREE) return
    setGuardandoInvitado(true)
    const row = { celebracion_slug: celebracion.slug, email: nuevoInvitado.includes('@') ? nuevoInvitado.trim() : null, nombre: nuevoInvitado.trim(), user_id: null, created_at: new Date().toISOString() }
    const { data } = await supabase.from('invitados').insert(row).select().single()
    if (data) setInvitadosList(prev => [...prev, data])
    setNuevoInvitado(''); setGuardandoInvitado(false); setShowAddInvitado(false)
  }

  if (cargando) return (
    <div style={{ minHeight: '100vh', background: TEMAS.morado.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#EEEDFE', fontSize: 16 }}>{tx.loading}</p>
    </div>
  )

  if (acceso === 'denied') return (
    <div style={{ minHeight: '100vh', background: TEMAS.morado.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '2.5rem', maxWidth: 400, textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,.25)' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1c1830', marginBottom: 8 }}>{tx.access_denied}</div>
        <p style={{ fontSize: 14, color: '#6b6585', margin: '0 0 20px' }}>{tx.no_permission}</p>
        <button onClick={() => router.back()} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 15, fontWeight: 700, padding: '12px 24px', borderRadius: 14, cursor: 'pointer' }}>
          {tx.go_home}
        </button>
      </div>
    </div>
  )

  const te = TEMAS[tema] || TEMAS.morado
  const F = FUENTES[fuente]?.font || FUENTES.system.font
  const FSYS = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
  const textColor = te.dark ? '#ffffff' : '#2a2440'
  const chip = CHIPS[celebracion?.tipo] || 'EVT'
  const confirmados = rsvps.filter(r => r.asistencia === 'si').length
  const porConfirmar = rsvps.filter(r => r.asistencia !== 'si').length
  const shareUrl = `joincheers.app/${celebracion?.slug}/r`
  const limiteAlcanzado = invitadosList.length >= LIMITE_FREE

  const pillBtn: React.CSSProperties = { background: 'rgba(255,255,255,.92)', border: 'none', color: '#534AB7', fontSize: 13, fontWeight: 700, padding: '8px 14px', borderRadius: 99, cursor: 'pointer', fontFamily: FSYS, boxShadow: '0 4px 14px rgba(20,10,40,.18)', whiteSpace: 'nowrap' as const }
  const fieldInput: React.CSSProperties = { border: 'none', background: 'transparent', fontFamily: FSYS, fontSize: 15, fontWeight: 600, color: te.tileText, padding: '7px 8px', borderRadius: 9, outline: 'none', width: '100%', boxSizing: 'border-box' as const }

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase' as const, marginBottom: 10 }}>{tx.theme}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {TEMA_ORDER.map(k => (
            <button key={k} onClick={() => { setTema(k); guardarCampo('tema', k) }} style={{ border: tema === k ? '2.5px solid #fff' : '2px solid rgba(255,255,255,.2)', borderRadius: 12, padding: '8px 10px', cursor: 'pointer', background: TEMAS[k].bg, color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: FSYS, boxShadow: tema === k ? '0 0 0 2px #534AB7' : 'none', transition: 'all .15s' }}>
              {(tx as any)[TEMAS[k].label_key]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase' as const, marginBottom: 10 }}>{tx.font}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FUENTE_ORDER.map(k => (
            <button key={k} onClick={() => { setFuente(k); guardarCampo('fuente', k) }} style={{ border: fuente === k ? '2px solid #fff' : '2px solid rgba(255,255,255,.2)', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', background: fuente === k ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.1)', color: fuente === k ? '#534AB7' : '#fff', display: 'flex', alignItems: 'center', gap: 10, fontFamily: FUENTES[k].font, fontSize: 14, fontWeight: 700, transition: 'all .15s', textAlign: 'left' as const }}>
              <span style={{ fontSize: 20 }}>Aa</span>
              <span style={{ fontFamily: FSYS }}>{(tx as any)[FUENTES[k].label_key]}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase' as const, marginBottom: 10 }}>{tx.title_style}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ESTILOS.map(e => (
            <button key={e.key} onClick={() => { setTituloEstilo(e.key); guardarCampo('titulo_align', e.key) }} style={{ border: tituloEstilo === e.key ? '2px solid #fff' : '2px solid rgba(255,255,255,.2)', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', background: tituloEstilo === e.key ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.1)', color: tituloEstilo === e.key ? '#534AB7' : '#fff', display: 'flex', alignItems: 'center', gap: 10, fontFamily: FUENTES[fuente].font, fontSize: 14, fontWeight: 700, transition: 'all .15s', textAlign: 'left' as const }}>
              <span style={{ fontSize: 16, textDecoration: e.key === 'underline' ? 'underline' : e.key === 'strikethrough' ? 'line-through' : 'none', letterSpacing: e.key === 'spaced' ? '4px' : 'normal' }}>{e.example}</span>
              <span style={{ fontFamily: FSYS }}>{(tx as any)[e.label_key]}</span>
            </button>
          ))}
        </div>
      </div>
      <button onClick={() => setShowCustomize(false)} style={{ border: 'none', background: '#fff', color: '#534AB7', fontSize: 14, fontWeight: 800, padding: '12px', borderRadius: 14, cursor: 'pointer', fontFamily: FSYS }}>
        {tx.save_close}
      </button>
    </div>
  )

  const TileContent = ({ tileKey }: { tileKey: string }) => {
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
            {invitadosList.map((inv, j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: te.accentBg, color: te.accentText, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initial(inv.nombre)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: te.tileText, fontWeight: 600 }}>{inv.nombre}</div>
                  {inv.email && <div style={{ fontSize: 11, color: '#a39ec0' }}>{inv.email}</div>}
                </div>
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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' as const }}>
              <input value={nuevoInvitado} onChange={e => setNuevoInvitado(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') agregarInvitado() }} placeholder={tx.add_guest_input} autoFocus style={{ flex: 1, minWidth: 120, border: `1.5px solid ${te.accentBg}`, borderRadius: 10, padding: '8px 12px', fontSize: 14, fontFamily: FSYS, outline: 'none', color: te.tileText, background: te.tileBg }} />
              <button onClick={agregarInvitado} disabled={guardandoInvitado} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 700, padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: FSYS, flexShrink: 0 }}>{guardandoInvitado ? '...' : tx.add_guest_btn}</button>
              <button onClick={() => { setShowAddInvitado(false); setNuevoInvitado('') }} style={{ border: 'none', background: '#f0edf8', color: '#7a7494', fontSize: 13, fontWeight: 700, padding: '8px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: FSYS }}>{tx.cancel}</button>
            </div>
          ) : (
            <button onClick={() => setShowAddInvitado(true)} style={{ border: '1.5px dashed #cfc8ec', background: 'none', color: '#534AB7', fontSize: 14, fontWeight: 700, padding: 12, borderRadius: 14, cursor: 'pointer', fontFamily: FSYS, width: '100%', marginTop: 4 }}>
              {tx.add_guest(invitadosList.length, LIMITE_FREE)}
            </button>
          )
        )}
        {rsvps.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${te.accentBg}` }}>
            {rsvps.slice(0, 6).map((r, j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: te.accentBg, color: te.accentText, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initial(r.nombre)}</div>
                <span style={{ flex: 1, fontSize: 14, color: te.tileText, fontWeight: 600 }}>{r.nombre}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: r.asistencia === 'si' ? '#1f8a5b' : '#c98a1e', background: r.asistencia === 'si' ? '#ECF7F0' : '#FFF4E6', padding: '3px 10px', borderRadius: 99 }}>
                  {r.asistencia === 'si' ? tx.going : r.asistencia === 'no' ? tx.not_going : tx.maybe}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
    if (tileKey === 'aperturas') return (
      <div>
        <div style={{ fontSize: 13, color: '#7a7494', fontWeight: 700, marginBottom: 8 }}>{tx.no_openings}</div>
        <div style={{ height: 9, background: te.accentBg, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: '0%', height: '100%', background: 'linear-gradient(90deg,#534AB7,#D4537E)' }} />
        </div>
      </div>
    )
    const dashedBtn: React.CSSProperties = { border: '1.5px dashed #cfc8ec', background: 'none', color: '#534AB7', fontSize: 14, fontWeight: 700, padding: 12, borderRadius: 14, cursor: 'pointer', fontFamily: FSYS, marginTop: 10 }
    if (tileKey === 'regalos') return <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}><p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>{tx.gifts_empty}</p><button style={dashedBtn}>{tx.add_gift}</button></div>
    if (tileKey === 'mensajes') return <p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>{tx.messages_empty}</p>
    if (tileKey === 'itinerario') return <div><p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>{tx.itinerary_empty}</p><button style={dashedBtn}>{tx.add_stop}</button></div>
    if (tileKey === 'presupuesto') return <p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>{tx.budget_empty}</p>
    if (tileKey === 'quellevar') return <div><p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>{tx.packing_empty}</p><button style={dashedBtn}>{tx.add_item}</button></div>
    if (tileKey === 'menu') return <div><p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>{tx.potluck_empty}</p><button style={dashedBtn}>{tx.assign_dish}</button></div>
    if (tileKey === 'reservacion') return <div style={{ background: 'linear-gradient(135deg,#534AB7,#D4537E)', borderRadius: 16, padding: 18, color: '#fff' }}><p style={{ fontSize: 14, margin: 0 }}>{tx.reservation_empty}</p></div>
    return null
  }

  return (
    <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: te.bg, fontFamily: FSYS }}>

      {/* Mobile drawer */}
      {isMobile && showCustomize && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setShowCustomize(false)} style={{ flex: 1, background: 'rgba(0,0,0,.4)' }} />
          <div style={{ background: 'linear-gradient(160deg,#534AB7,#7b46a8)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', maxHeight: '75vh', overflowY: 'auto' }}>
            <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,.4)', borderRadius: 99, margin: '0 auto 20px' }} />
            <SidebarContent />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', maxWidth: isMobile ? '100%' : 1280, margin: '0 auto', minHeight: '100vh' }}>

        {/* Sidebar desktop */}
        {!isMobile && showCustomize && (
          <div style={{ width: 260, flexShrink: 0, padding: '24px 16px', background: 'rgba(0,0,0,.28)', backdropFilter: 'blur(16px)', borderRight: '1px solid rgba(255,255,255,.1)', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', boxSizing: 'border-box' as const }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 24 }}>{tx.customize}</div>
            <SidebarContent />
          </div>
        )}

        {/* Contenido */}
        <div style={{ flex: 1, padding: isMobile ? '20px 16px 44px' : '26px 24px 44px', boxSizing: 'border-box' as const, zIndex: 1 }}>

          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 8, flexWrap: 'wrap' as const }}>
            <button onClick={() => router.back()} style={pillBtn}>{tx.my_celebrations}</button>
            <div style={{ textAlign: 'center' as const }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.5)', letterSpacing: '.5px' }}>{tx.cheers}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: textColor, fontFamily: F, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {title || tx.title_placeholder}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => router.push(`/${celebracion?.slug}/r`)} style={{ ...pillBtn, background: 'rgba(255,255,255,.15)', color: textColor, border: '1px solid rgba(255,255,255,.3)' }}>
                {tx.view_as_guest}
              </button>
              <button onClick={() => setShowCustomize(v => !v)} style={{ ...pillBtn, background: showCustomize ? '#534AB7' : 'rgba(255,255,255,.92)', color: showCustomize ? '#fff' : '#534AB7' }}>
                {tx.customize}
              </button>
            </div>
          </div>

          {/* Hero card */}
          <div style={{ background: te.tileBg, borderRadius: 26, overflow: 'hidden', boxShadow: '0 18px 46px rgba(25,12,50,.22)', marginBottom: 16 }}>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <div onClick={() => !subiendoPortada && fileInputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} style={{ height: 188, background: portadaUrl ? `url(${portadaUrl}) center/cover no-repeat` : dragOver ? '#EDE9FF' : 'linear-gradient(135deg,#EEEDFE,#FCE9F0)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: subiendoPortada ? 'wait' : 'pointer', position: 'relative', transition: 'background .2s', border: dragOver ? '2px dashed #534AB7' : 'none' }}>
              {subiendoPortada ? <div style={{ background: 'rgba(255,255,255,.9)', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 700, color: '#534AB7' }}>{tx.uploading}</div>
                : portadaUrl ? <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 99 }}>{tx.change_image}</div>
                : <div style={{ textAlign: 'center', color: '#a39ec0' }}><div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{tx.cover_image}</div><div style={{ fontSize: 12 }}>{tx.cover_hint}</div></div>}
            </div>

            <div style={{ padding: '16px 18px 20px' }}>
              <div style={{ marginBottom: 10 }}>
                <input value={title} onChange={e => setTitle(e.target.value)} onBlur={e => guardarCampo('nombre', e.target.value)} placeholder={tx.title_placeholder} style={tituloStyle(tituloEstilo, F, te.tileText)} />
                <input value={tagline} onChange={e => setTagline(e.target.value)} onBlur={e => guardarCampo('tagline', e.target.value)} placeholder={tx.tagline_placeholder} style={{ border: 'none', background: 'transparent', fontFamily: FSYS, fontSize: 13, color: '#7a7494', padding: '3px 8px', outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
              </div>

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
              <button style={{ flexShrink: 0, background: '#fff', color: '#534AB7', border: 'none', borderRadius: 15, padding: '14px 20px', fontSize: 14, fontWeight: 850, cursor: 'pointer', fontFamily: FSYS, boxShadow: '0 10px 24px rgba(0,0,0,.22)' }}>
                {tx.lifetime_cta}
              </button>
            </div>
          </div>

          {/* Hint */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 4px 12px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: textColor, opacity: 0.8 }}>{tx.drag_hint}</div>
            {guardandoToggle && <div style={{ fontSize: 12, color: textColor, opacity: 0.6 }}>{tx.saving}</div>}
          </div>

          {/* Grid tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            {tiles.map((tile, i) => {
              const info = TINFO[tile.key] || { label: '?', title_key: tile.key }
              const isLg = tile.size === 'lg'
              const visible = tilesVisibles[tile.key] !== false
              return (
                <div key={tile.key} draggable onDragStart={() => setDragIdx(i)} onDragOver={e => e.preventDefault()} onDrop={() => { moveTile(dragIdx!, i); setDragIdx(null) }}
                  style={{ gridColumn: isLg && !isMobile ? '1 / -1' : 'auto', background: te.tileBg, borderRadius: 22, padding: '20px 18px', boxShadow: '0 8px 24px rgba(25,12,50,.1)', cursor: 'default', opacity: visible ? 1 : 0.65, transition: 'opacity .2s', color: te.tileText }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                    <span style={{ cursor: 'grab', color: '#c8c2e0', fontSize: 15 }}>⠿</span>
                    <TileIcon label={info.label} accentBg={te.accentBg} accentText={te.accentText} />
                    <span style={{ flex: 1, fontSize: 15, fontWeight: 800, color: te.tileText }}>{(tx as any)[info.title_key]}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#a39ec0', fontWeight: 600 }}>{visible ? tx.visible : tx.hidden}</span>
                      <Toggle on={visible} onToggle={() => toggleVisibilidad(tile.key)} />
                    </div>
                    <button onClick={() => cycleSize(i)} style={{ border: 'none', background: te.accentBg, color: te.accentText, width: 28, height: 28, borderRadius: 9, cursor: 'pointer', fontSize: 13, fontFamily: FSYS }}>⤢</button>
                  </div>
                  <TileContent tileKey={tile.key} />
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}