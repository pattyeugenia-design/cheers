'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../supabase'

const LIMITE_FREE = 3

// Temas: fondo + color de tiles combinados
const TEMAS: Record<string, {
  label: string
  bg: string
  dark: boolean
  tileBg: string
  tileText: string
  accentBg: string
  accentText: string
}> = {
  morado: {
    label: 'Morado',
    bg: 'radial-gradient(circle at 18% 16%,#7b6fd0,transparent 46%),linear-gradient(160deg,#534AB7,#7b46a8 58%,#D4537E)',
    dark: true, tileBg: '#fff', tileText: '#2a2440', accentBg: '#EEEDFE', accentText: '#534AB7',
  },
  rosa: {
    label: 'Rosa',
    bg: 'linear-gradient(155deg,#D4537E,#a14b9c)',
    dark: true, tileBg: '#fff5f8', tileText: '#3a1525', accentBg: '#FCE9F0', accentText: '#D4537E',
  },
  noche: {
    label: 'Noche',
    bg: 'linear-gradient(160deg,#0f0c29,#302b63,#24243e)',
    dark: true, tileBg: '#1a1740', tileText: '#e8e4ff', accentBg: '#2a2560', accentText: '#a89df0',
  },
  bosque: {
    label: 'Bosque',
    bg: 'linear-gradient(155deg,#1a3c2a,#2d6a4f,#40916c)',
    dark: true, tileBg: '#f0faf4', tileText: '#1a3c2a', accentBg: '#d8f3dc', accentText: '#2d6a4f',
  },
  ambar: {
    label: 'Ámbar',
    bg: 'linear-gradient(155deg,#b5451b,#e76f51,#f4a261)',
    dark: true, tileBg: '#fff8f0', tileText: '#3d1a08', accentBg: '#fde8d8', accentText: '#b5451b',
  },
  carbon: {
    label: 'Carbón',
    bg: 'linear-gradient(160deg,#1a1a1a,#2d2d2d,#3d3d3d)',
    dark: true, tileBg: '#2a2a2a', tileText: '#f0f0f0', accentBg: '#3a3a3a', accentText: '#d0d0d0',
  },
  lavanda: {
    label: 'Lavanda',
    bg: '#EEEDFE',
    dark: false, tileBg: '#fff', tileText: '#2a2440', accentBg: '#534AB7', accentText: '#fff',
  },
  crema: {
    label: 'Crema',
    bg: '#FBF4EC',
    dark: false, tileBg: '#fff', tileText: '#2a2440', accentBg: '#f0e6d3', accentText: '#7a5c3a',
  },
}
const TEMA_ORDER = ['morado', 'rosa', 'noche', 'bosque', 'ambar', 'carbon', 'lavanda', 'crema']

// Tipografías
const FUENTES: Record<string, { label: string; font: string; preview: string }> = {
  system: { label: 'Moderna', font: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif', preview: 'Aa' },
  georgia: { label: 'Clásica', font: 'Georgia, "Times New Roman", serif', preview: 'Aa' },
  lora: { label: 'Elegante', font: '"Lora", Georgia, serif', preview: 'Aa' },
  fredoka: { label: 'Divertida', font: '"Fredoka One", "Comic Sans MS", cursive', preview: 'Aa' },
}
const FUENTE_ORDER = ['system', 'georgia', 'lora', 'fredoka']

const TIPO_LABEL: Record<string, string> = {
  cumple: 'Cumpleaños', cumpleanos: 'Cumpleaños', cena: 'Cena', viaje: 'Viaje',
  reunion: 'Reunión', evento: 'Evento', otro: 'Otro'
}

const TINFO: Record<string, { label: string; title: string }> = {
  invitados:   { label: 'INV', title: 'Invitados' },
  aperturas:   { label: 'APE', title: 'Quién abrió el link' },
  regalos:     { label: 'REG', title: 'Lista de regalos' },
  itinerario:  { label: 'ITE', title: 'Itinerario' },
  presupuesto: { label: 'PRE', title: 'Presupuesto compartido' },
  quellevar:   { label: 'QLL', title: 'Qué llevar' },
  menu:        { label: 'MEN', title: 'Quién trae qué' },
  reservacion: { label: 'RES', title: 'Reservación' },
  mensajes:    { label: 'MSG', title: 'Mensajes para el festejado' },
}

const DEFAULT_TILES_VISIBLES: Record<string, boolean> = {
  invitados: true, aperturas: true, regalos: true, mensajes: true,
  itinerario: true, presupuesto: true, quellevar: true, menu: true, reservacion: true
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
  const [celebracion, setCelebracion] = useState<any>(null)
  const [rsvps, setRsvps] = useState<any[]>([])
  const [invitadosList, setInvitadosList] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [acceso, setAcceso] = useState<'loading' | 'ok' | 'denied'>('loading')

  const [title, setTitle] = useState('')
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
  const [tituloAlign, setTituloAlign] = useState<'left' | 'center'>('left')
  const [showCustomize, setShowCustomize] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [guardandoToggle, setGuardandoToggle] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const [showAddInvitado, setShowAddInvitado] = useState(false)
  const [nuevoInvitado, setNuevoInvitado] = useState('')
  const [guardandoInvitado, setGuardandoInvitado] = useState(false)

  useEffect(() => {
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
      setFestejado(cel.festejado_nombre || '')
      setFecha(cel.fecha || '')
      setLugar(cel.paradas?.[0]?.lugar || '')
      setPortadaUrl(cel.portada_url || null)
      setTiles(tilesForType(cel.tipo, cel.sub_tipo))
      setTilesVisibles({ ...DEFAULT_TILES_VISIBLES, ...(cel.tiles_visibles || {}) })
      if (cel.tema) setTema(cel.tema)
      if (cel.fuente) setFuente(cel.fuente)
      if (cel.titulo_align) setTituloAlign(cel.titulo_align)

      const { data: rsvpData } = await supabase.from('rsvps').select('*').eq('celebracion_slug', cel.slug).order('created_at', { ascending: false })
      setRsvps(rsvpData || [])

      const { data: invData } = await supabase.from('invitados').select('*').eq('celebracion_slug', cel.slug).order('created_at', { ascending: false })
      setInvitadosList(invData || [])

      setCargando(false)
    })
  }, [])

  function moveTile(from: number, to: number) {
    if (from == null || from === to) return
    setTiles(prev => {
      const t = [...prev]
      const [m] = t.splice(from, 1)
      t.splice(to, 0, m)
      return t
    })
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

  async function guardarPersonalizacion(campo: string, valor: string) {
    await supabase.from('celebraciones').update({ [campo]: valor }).eq('slug', celebracion.slug)
  }

  async function subirPortada(file: File) {
    if (!file || !celebracion) return
    if (!file.type.startsWith('image/')) return
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
    const file = e.target.files?.[0]
    if (file) subirPortada(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) subirPortada(file)
  }

  async function agregarInvitado() {
    if (!nuevoInvitado.trim() || !celebracion) return
    if (invitadosList.length >= LIMITE_FREE) return
    setGuardandoInvitado(true)
    const row = {
      celebracion_slug: celebracion.slug,
      email: nuevoInvitado.includes('@') ? nuevoInvitado.trim() : null,
      nombre: nuevoInvitado.trim(),
      user_id: null,
      created_at: new Date().toISOString(),
    }
    const { data } = await supabase.from('invitados').insert(row).select().single()
    if (data) setInvitadosList(prev => [...prev, data])
    setNuevoInvitado('')
    setGuardandoInvitado(false)
    setShowAddInvitado(false)
  }

  if (cargando) return (
    <div style={{ minHeight: '100vh', background: TEMAS.morado.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FUENTES.system.font }}>
      <p style={{ color: '#EEEDFE', fontSize: 16 }}>Cargando...</p>
    </div>
  )

  if (acceso === 'denied') return (
    <div style={{ minHeight: '100vh', background: TEMAS.morado.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FUENTES.system.font }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '2.5rem', maxWidth: 400, textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,.25)' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1c1830', marginBottom: 8 }}>Acceso denegado</div>
        <p style={{ fontSize: 14, color: '#6b6585', margin: '0 0 20px' }}>No tienes permiso para ver esta celebración.</p>
        <button onClick={() => router.push('/dashboard')} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 15, fontWeight: 700, padding: '12px 24px', borderRadius: 14, cursor: 'pointer' }}>
          Ir a mis celebraciones
        </button>
      </div>
    </div>
  )

  const t = TEMAS[tema] || TEMAS.morado
  const F = FUENTES[fuente]?.font || FUENTES.system.font
  const textColor = t.dark ? '#ffffff' : '#2a2440'
  const tipoLabel = TIPO_LABEL[celebracion?.tipo] || 'Celebración'
  const confirmados = rsvps.filter(r => r.asistencia === 'si').length
  const porConfirmar = rsvps.filter(r => r.asistencia !== 'si').length
  const shareUrl = `joincheers.app/${celebracion?.slug}/r`
  const limiteAlcanzado = invitadosList.length >= LIMITE_FREE

  const pillBtn: React.CSSProperties = {
    background: 'rgba(255,255,255,.92)', border: 'none', color: '#534AB7',
    fontSize: 13, fontWeight: 700, padding: '8px 14px', borderRadius: 99,
    cursor: 'pointer', fontFamily: F, boxShadow: '0 4px 14px rgba(20,10,40,.18)',
    whiteSpace: 'nowrap' as const,
  }

  const fieldInput: React.CSSProperties = {
    border: 'none', background: 'transparent', fontFamily: F,
    fontSize: 15, fontWeight: 600, color: t.tileText,
    padding: '7px 8px', borderRadius: 9, outline: 'none',
    width: '100%', boxSizing: 'border-box' as const,
  }

  // Panel de personalización
  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Temas */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: t.dark ? 'rgba(255,255,255,.6)' : '#a39ec0', textTransform: 'uppercase', marginBottom: 10 }}>Tema</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {TEMA_ORDER.map(k => (
            <button
              key={k}
              onClick={() => { setTema(k); guardarPersonalizacion('tema', k) }}
              style={{
                border: tema === k ? '2.5px solid #fff' : '2px solid rgba(255,255,255,.2)',
                borderRadius: 12, padding: '8px 10px', cursor: 'pointer',
                background: TEMAS[k].bg, color: '#fff',
                fontSize: 12, fontWeight: 700, fontFamily: F,
                boxShadow: tema === k ? '0 0 0 2px #534AB7' : 'none',
                transition: 'all .15s',
              }}
            >
              {TEMAS[k].label}
            </button>
          ))}
        </div>
      </div>

      {/* Tipografías */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: t.dark ? 'rgba(255,255,255,.6)' : '#a39ec0', textTransform: 'uppercase', marginBottom: 10 }}>Tipografía</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FUENTE_ORDER.map(k => (
            <button
              key={k}
              onClick={() => { setFuente(k); guardarPersonalizacion('fuente', k) }}
              style={{
                border: fuente === k ? '2px solid #534AB7' : '2px solid rgba(255,255,255,.2)',
                borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
                background: fuente === k ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.12)',
                color: fuente === k ? '#534AB7' : textColor,
                display: 'flex', alignItems: 'center', gap: 10,
                fontFamily: FUENTES[k].font, fontSize: 14, fontWeight: 700,
                transition: 'all .15s', textAlign: 'left' as const,
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{FUENTES[k].preview}</span>
              <span>{FUENTES[k].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Alineación del título */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: t.dark ? 'rgba(255,255,255,.6)' : '#a39ec0', textTransform: 'uppercase', marginBottom: 10 }}>Título</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['left', 'center'] as const).map(al => (
            <button
              key={al}
              onClick={() => { setTituloAlign(al); guardarPersonalizacion('titulo_align', al) }}
              style={{
                flex: 1, border: tituloAlign === al ? '2px solid #534AB7' : '2px solid rgba(255,255,255,.2)',
                borderRadius: 10, padding: '10px', cursor: 'pointer',
                background: tituloAlign === al ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.12)',
                color: tituloAlign === al ? '#534AB7' : textColor,
                fontSize: 13, fontWeight: 700, fontFamily: F,
                transition: 'all .15s',
              }}
            >
              {al === 'left' ? '⬛ Izquierda' : '⬜ Centro'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // Contenido principal del dashboard
  const MainContent = () => (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 8, flexWrap: 'wrap' as const }}>
        <button onClick={() => router.push('/dashboard')} style={pillBtn}>← Mis celebraciones</button>
        <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.4px', color: textColor, fontFamily: F }}>Cheers</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
          <button onClick={() => router.push(`/${celebracion?.slug}/r`)} style={{ ...pillBtn, background: 'rgba(255,255,255,.15)', color: textColor, border: '1px solid rgba(255,255,255,.3)' }}>
            Ver como invitado →
          </button>
          {isMobile && (
            <button onClick={() => setShowCustomize(v => !v)} style={{ ...pillBtn, background: showCustomize ? '#534AB7' : 'rgba(255,255,255,.92)', color: showCustomize ? '#fff' : '#534AB7' }}>
              Personalizar
            </button>
          )}
        </div>
      </div>

      {/* Panel personalización móvil */}
      {isMobile && showCustomize && (
        <div style={{ background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(12px)', borderRadius: 20, padding: '20px 16px', marginBottom: 16 }}>
          <SidebarContent />
        </div>
      )}

      {/* Hero card */}
      <div style={{ background: t.tileBg, borderRadius: 26, overflow: 'hidden', boxShadow: '0 18px 46px rgba(25,12,50,.22)', marginBottom: 16 }}>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        <div
          onClick={() => !subiendoPortada && fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            height: 188,
            background: portadaUrl ? `url(${portadaUrl}) center/cover no-repeat` : dragOver ? '#EDE9FF' : 'linear-gradient(135deg,#EEEDFE,#FCE9F0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: subiendoPortada ? 'wait' : 'pointer',
            position: 'relative', transition: 'background .2s',
            border: dragOver ? '2px dashed #534AB7' : 'none',
          }}
        >
          {subiendoPortada ? (
            <div style={{ background: 'rgba(255,255,255,.9)', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 700, color: '#534AB7', fontFamily: F }}>Subiendo imagen...</div>
          ) : portadaUrl ? (
            <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 99 }}>Cambiar imagen</div>
          ) : (
            <div style={{ textAlign: 'center', color: '#a39ec0' }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Sube una imagen de portada</div>
              <div style={{ fontSize: 12 }}>Arrastra o haz click para elegir</div>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 18px 20px' }}>
          <div style={{ display: 'flex', alignItems: tituloAlign === 'center' ? 'center' : 'flex-start', flexDirection: tituloAlign === 'center' ? 'column' : 'row', gap: 12, marginBottom: 6 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#534AB7,#D4537E)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', textTransform: 'uppercase' as const, letterSpacing: '.5px' }}>{tipoLabel.slice(0, 3)}</span>
            </div>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Título del evento"
              style={{
                border: 'none', background: 'transparent', fontFamily: F,
                fontSize: tituloAlign === 'center' ? 26 : 23,
                fontWeight: 850, letterSpacing: '-.5px', color: t.tileText,
                padding: '5px 8px', borderRadius: 10, outline: 'none',
                flex: 1, minWidth: 0, textAlign: tituloAlign,
              }}
            />
            {tituloAlign !== 'center' && <span style={{ fontSize: 12, fontWeight: 700, color: '#b3adcc' }}>Editable</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '8px 16px', padding: '0 4px' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase' as const, margin: '0 0 1px 8px' }}>Festejado/a</div>
              <input style={fieldInput} value={festejado} onChange={e => setFestejado(e.target.value)} placeholder="Nombre" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase' as const, margin: '0 0 1px 8px' }}>Fecha</div>
              <input type="date" style={fieldInput} value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase' as const, margin: '0 0 1px 8px' }}>Lugar</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 12, color: '#a39ec0' }}>ubicacion</span>
                <input style={{ ...fieldInput, flex: 1 }} value={lugar} onChange={e => setLugar(e.target.value)} placeholder="Buscar en Google Maps" />
                {lugar && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar)}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 800, color: '#1a73e8', background: '#E8F0FE', padding: '5px 10px', borderRadius: 99, textDecoration: 'none', whiteSpace: 'nowrap' as const }}>Ver ↗</a>}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase' as const, margin: '0 0 1px 8px' }}>Link para invitados</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 8px' }}>
                <span style={{ fontSize: 13, color: '#534AB7', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{shareUrl}</span>
                <button onClick={() => navigator.clipboard.writeText(`https://${shareUrl}`)} style={{ border: 'none', background: t.accentBg, color: t.accentText, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 99, cursor: 'pointer', fontFamily: F, flexShrink: 0 }}>Copiar</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upsell Lifetime */}
      <div style={{ borderRadius: 22, padding: '22px 24px', marginBottom: 18, background: 'linear-gradient(120deg,#534AB7,#7b46a8 55%,#D4537E)', boxShadow: '0 16px 42px rgba(83,74,183,.45)', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' as const }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1.5px', opacity: 0.85 }}>CHEERS LIFETIME</div>
            <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 850, letterSpacing: '-.4px', marginTop: 5, fontFamily: F }}>Desbloquea todo, para siempre</div>
            <div style={{ fontSize: 13, opacity: 0.92, marginTop: 7, lineHeight: 1.5 }}>Invitados ilimitados, seguimiento de aperturas y temas premium. Un solo pago.</div>
          </div>
          <button style={{ flexShrink: 0, background: '#fff', color: '#534AB7', border: 'none', borderRadius: 15, padding: '14px 20px', fontSize: 14, fontWeight: 850, cursor: 'pointer', fontFamily: F, boxShadow: '0 10px 24px rgba(0,0,0,.22)' }}>
            Hazme Lifetime →
          </button>
        </div>
      </div>

      {/* Hint */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 4px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: textColor, opacity: 0.8, fontFamily: F }}>
          Arrastra las tarjetas para reacomodar · usa ⤢ para cambiar el tamaño
        </div>
        {guardandoToggle && <div style={{ fontSize: 12, color: textColor, opacity: 0.6 }}>Guardando...</div>}
      </div>

      {/* Grid de tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        {tiles.map((tile, i) => {
          const info = TINFO[tile.key] || { label: '?', title: tile.key }
          const isLg = tile.size === 'lg'
          const visible = tilesVisibles[tile.key] !== false
          return (
            <div
              key={tile.key}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => { moveTile(dragIdx!, i); setDragIdx(null) }}
              style={{
                gridColumn: isLg && !isMobile ? '1 / -1' : 'auto',
                background: t.tileBg, borderRadius: 22, padding: '20px 18px',
                boxShadow: '0 8px 24px rgba(25,12,50,.1)', cursor: 'default',
                opacity: visible ? 1 : 0.65, transition: 'opacity .2s',
                color: t.tileText,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                <span style={{ cursor: 'grab', color: '#c8c2e0', fontSize: 15 }}>⠿</span>
                <TileIcon label={info.label} accentBg={t.accentBg} accentText={t.accentText} />
                <span style={{ flex: 1, fontSize: 15, fontWeight: 800, color: t.tileText, fontFamily: F }}>{info.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#a39ec0', fontWeight: 600 }}>{visible ? 'Visible' : 'Oculto'}</span>
                  <Toggle on={visible} onToggle={() => toggleVisibilidad(tile.key)} />
                </div>
                <button onClick={() => cycleSize(i)} style={{ border: 'none', background: t.accentBg, color: t.accentText, width: 28, height: 28, borderRadius: 9, cursor: 'pointer', fontSize: 13, fontFamily: F }}>⤢</button>
              </div>

              {tile.key === 'invitados' && (
                <div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                    <div style={{ flex: 1, background: '#ECF7F0', borderRadius: 14, padding: '12px 14px' }}>
                      <div style={{ fontSize: 26, fontWeight: 850, color: '#1f8a5b', lineHeight: 1 }}>{confirmados}</div>
                      <div style={{ fontSize: 12, color: '#1f8a5b', fontWeight: 700, marginTop: 3 }}>Confirmados</div>
                    </div>
                    <div style={{ flex: 1, background: '#FFF4E6', borderRadius: 14, padding: '12px 14px' }}>
                      <div style={{ fontSize: 26, fontWeight: 850, color: '#c98a1e', lineHeight: 1 }}>{porConfirmar}</div>
                      <div style={{ fontSize: 12, color: '#c98a1e', fontWeight: 700, marginTop: 3 }}>Por confirmar</div>
                    </div>
                  </div>

                  {invitadosList.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                      {invitadosList.map((inv, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: t.accentBg, color: t.accentText, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initial(inv.nombre)}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, color: t.tileText, fontWeight: 600 }}>{inv.nombre}</div>
                            {inv.email && <div style={{ fontSize: 11, color: '#a39ec0' }}>{inv.email}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {limiteAlcanzado && (
                    <div style={{ background: 'linear-gradient(135deg,#534AB7,#D4537E)', borderRadius: 14, padding: '12px 14px', marginBottom: 10, color: '#fff' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>Límite del plan gratuito ({LIMITE_FREE} invitados)</div>
                      <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.4, marginBottom: 8 }}>Con Pro invitas hasta 10, con Lifetime invitas a todos.</div>
                      <button style={{ border: 'none', background: '#fff', color: '#534AB7', fontSize: 12, fontWeight: 800, padding: '7px 14px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>
                        Hazte Pro o Lifetime →
                      </button>
                    </div>
                  )}

                  {!limiteAlcanzado && (
                    <>
                      {showAddInvitado ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' as const }}>
                          <input
                            value={nuevoInvitado}
                            onChange={e => setNuevoInvitado(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') agregarInvitado() }}
                            placeholder="Nombre o email"
                            autoFocus
                            style={{ flex: 1, minWidth: 120, border: `1.5px solid ${t.accentBg}`, borderRadius: 10, padding: '8px 12px', fontSize: 14, fontFamily: F, outline: 'none', color: t.tileText, background: t.tileBg }}
                          />
                          <button onClick={agregarInvitado} disabled={guardandoInvitado} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 700, padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: F, flexShrink: 0 }}>
                            {guardandoInvitado ? '...' : 'Agregar'}
                          </button>
                          <button onClick={() => { setShowAddInvitado(false); setNuevoInvitado('') }} style={{ border: 'none', background: '#f0edf8', color: '#7a7494', fontSize: 13, fontWeight: 700, padding: '8px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: F }}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setShowAddInvitado(true)} style={{ border: '1.5px dashed #cfc8ec', background: 'none', color: '#534AB7', fontSize: 14, fontWeight: 700, padding: 12, borderRadius: 14, cursor: 'pointer', fontFamily: F, width: '100%', marginTop: 4 }}>
                          + Agregar invitado ({invitadosList.length}/{LIMITE_FREE} gratis)
                        </button>
                      )}
                    </>
                  )}

                  {rsvps.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${t.accentBg}` }}>
                      {rsvps.slice(0, 6).map((r, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: t.accentBg, color: t.accentText, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initial(r.nombre)}</div>
                          <span style={{ flex: 1, fontSize: 14, color: t.tileText, fontWeight: 600 }}>{r.nombre}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: r.asistencia === 'si' ? '#1f8a5b' : '#c98a1e', background: r.asistencia === 'si' ? '#ECF7F0' : '#FFF4E6', padding: '3px 10px', borderRadius: 99 }}>
                            {r.asistencia === 'si' ? 'Va' : r.asistencia === 'no' ? 'No va' : 'Tal vez'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tile.key === 'aperturas' && (
                <div>
                  <div style={{ fontSize: 13, color: '#7a7494', fontWeight: 700, marginBottom: 8 }}>Sin datos de apertura aún</div>
                  <div style={{ height: 9, background: t.accentBg, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: '0%', height: '100%', background: 'linear-gradient(90deg,#534AB7,#D4537E)' }} />
                  </div>
                </div>
              )}

              {tile.key === 'regalos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>Agrega ideas de regalo para que tus invitados elijan.</p>
                  <button style={{ border: `1.5px dashed ${t.accentText === '#fff' ? 'rgba(255,255,255,.3)' : '#cfc8ec'}`, background: 'none', color: t.accentText === '#fff' ? 'rgba(255,255,255,.8)' : '#534AB7', fontSize: 14, fontWeight: 700, padding: 12, borderRadius: 14, cursor: 'pointer', fontFamily: F }}>+ Agregar regalo</button>
                </div>
              )}

              {tile.key === 'mensajes' && (
                <p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>Aquí aparecerán los mensajes que tus invitados dejen para el festejado.</p>
              )}

              {tile.key === 'itinerario' && (
                <div>
                  <p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>Agrega las paradas del itinerario.</p>
                  <button style={{ border: `1.5px dashed ${t.accentText === '#fff' ? 'rgba(255,255,255,.3)' : '#cfc8ec'}`, background: 'none', color: t.accentText === '#fff' ? 'rgba(255,255,255,.8)' : '#534AB7', fontSize: 14, fontWeight: 700, padding: 12, borderRadius: 14, cursor: 'pointer', fontFamily: F, marginTop: 10 }}>+ Agregar parada</button>
                </div>
              )}

              {tile.key === 'presupuesto' && (
                <p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>Gestiona el presupuesto del viaje con tu grupo.</p>
              )}

              {tile.key === 'quellevar' && (
                <div>
                  <p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>Agrega artículos a la lista de qué llevar.</p>
                  <button style={{ border: `1.5px dashed ${t.accentText === '#fff' ? 'rgba(255,255,255,.3)' : '#cfc8ec'}`, background: 'none', color: t.accentText === '#fff' ? 'rgba(255,255,255,.8)' : '#534AB7', fontSize: 14, fontWeight: 700, padding: 12, borderRadius: 14, cursor: 'pointer', fontFamily: F, marginTop: 10 }}>+ Agregar artículo</button>
                </div>
              )}

              {tile.key === 'menu' && (
                <div>
                  <p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>¿Quién trae qué? Organiza el potluck aquí.</p>
                  <button style={{ border: `1.5px dashed ${t.accentText === '#fff' ? 'rgba(255,255,255,.3)' : '#cfc8ec'}`, background: 'none', color: t.accentText === '#fff' ? 'rgba(255,255,255,.8)' : '#534AB7', fontSize: 14, fontWeight: 700, padding: 12, borderRadius: 14, cursor: 'pointer', fontFamily: F, marginTop: 10 }}>+ Asignar platillo</button>
                </div>
              )}

              {tile.key === 'reservacion' && (
                <div style={{ background: 'linear-gradient(135deg,#534AB7,#D4537E)', borderRadius: 16, padding: 18, color: '#fff' }}>
                  <p style={{ fontSize: 14, margin: 0, fontFamily: F }}>Agrega los datos de tu reservación aquí.</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: t.bg, fontFamily: F }}>
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        maxWidth: isMobile ? '100%' : 1280,
        margin: '0 auto',
        minHeight: '100vh',
        position: 'relative',
      }}>

        {/* Sidebar desktop */}
        {!isMobile && (
          <div style={{
            width: 240, flexShrink: 0,
            padding: '24px 16px',
            background: 'rgba(0,0,0,.28)',
            backdropFilter: 'blur(16px)',
            borderRight: '1px solid rgba(255,255,255,.1)',
            position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
            boxSizing: 'border-box',
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: textColor, marginBottom: 24, fontFamily: F, letterSpacing: '-.3px' }}>Personalizar</div>
            <SidebarContent />
          </div>
        )}

        {/* Contenido principal */}
        <div style={{ flex: 1, padding: isMobile ? '20px 16px 44px' : '26px 24px 44px', boxSizing: 'border-box', zIndex: 1 }}>
          <MainContent />
        </div>

      </div>
    </div>
  )
}