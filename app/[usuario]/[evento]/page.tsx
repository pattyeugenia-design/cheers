'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../supabase'

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'

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

const BG: Record<string, { css: string; dark: boolean; label: string }> = {
  morado:  { css: 'radial-gradient(circle at 18% 16%,#7b6fd0,transparent 46%),linear-gradient(160deg,#534AB7,#7b46a8 58%,#D4537E)', dark: true,  label: 'Morado' },
  rosa:    { css: 'linear-gradient(155deg,#D4537E,#a14b9c)', dark: true, label: 'Rosa' },
  noche:   { css: 'linear-gradient(160deg,#241c45,#3a2a5c)', dark: true, label: 'Noche' },
  lavanda: { css: '#EEEDFE', dark: false, label: 'Lavanda' },
  crema:   { css: '#FBF4EC', dark: false, label: 'Crema' },
}
const BG_ORDER = ['morado', 'rosa', 'noche', 'lavanda', 'crema']

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

const pillBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,.92)', border: 'none', color: '#534AB7',
  fontSize: 14, fontWeight: 700, padding: '9px 16px', borderRadius: 99,
  cursor: 'pointer', fontFamily: FONT, boxShadow: '0 4px 14px rgba(20,10,40,.18)',
}

const fieldInput: React.CSSProperties = {
  border: 'none', background: 'transparent', fontFamily: FONT,
  fontSize: 15, fontWeight: 600, color: '#2a2440',
  padding: '7px 8px', borderRadius: 9, outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

function TileIcon({ label }: { label: string }) {
  return (
    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: '#534AB7', letterSpacing: '.3px' }}>{label}</span>
    </div>
  )
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={on ? 'Visible para invitados — click para ocultar' : 'Oculto para invitados — click para mostrar'}
      style={{
        width: 36, height: 20, borderRadius: 99, border: 'none', padding: 0,
        background: on ? 'linear-gradient(135deg,#534AB7,#D4537E)' : '#d4d0e8',
        cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: on ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)'
      }} />
    </button>
  )
}

export default function Dashboard({ params }: { params: Promise<{ usuario: string; evento: string }> }) {
  const router = useRouter()
  const [celebracion, setCelebracion] = useState<any>(null)
  const [rsvps, setRsvps] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [acceso, setAcceso] = useState<'loading' | 'ok' | 'denied'>('loading')

  const [title, setTitle] = useState('')
  const [festejado, setFestejado] = useState('')
  const [fecha, setFecha] = useState('')
  const [lugar, setLugar] = useState('')

  const [tiles, setTiles] = useState<{ key: string; size: string }[]>([])
  const [tilesVisibles, setTilesVisibles] = useState<Record<string, boolean>>(DEFAULT_TILES_VISIBLES)
  const [planBg, setPlanBg] = useState('morado')
  const [showCustomize, setShowCustomize] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [guardandoToggle, setGuardandoToggle] = useState(false)

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
      setTiles(tilesForType(cel.tipo, cel.sub_tipo))
      setTilesVisibles({ ...DEFAULT_TILES_VISIBLES, ...(cel.tiles_visibles || {}) })

      const { data: rsvpData } = await supabase.from('rsvps').select('*').eq('celebracion_slug', cel.slug).order('created_at', { ascending: false })
      setRsvps(rsvpData || [])
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

  if (cargando) return (
    <div style={{ minHeight: '100vh', background: BG.morado.css, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <p style={{ color: '#EEEDFE', fontSize: 16 }}>Cargando...</p>
    </div>
  )

  if (acceso === 'denied') return (
    <div style={{ minHeight: '100vh', background: BG.morado.css, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '2.5rem', maxWidth: 400, textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,.25)' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1c1830', marginBottom: 8 }}>Acceso denegado</div>
        <p style={{ fontSize: 14, color: '#6b6585', margin: '0 0 20px' }}>No tienes permiso para ver esta celebración.</p>
        <button onClick={() => router.push('/dashboard')} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 15, fontWeight: 700, padding: '12px 24px', borderRadius: 14, cursor: 'pointer', fontFamily: FONT }}>
          Ir a mis celebraciones
        </button>
      </div>
    </div>
  )

  const bg = BG[planBg]
  const dark = bg.dark
  const textColor = dark ? '#ffffff' : '#2a2440'
  const tipoLabel = TIPO_LABEL[celebracion?.tipo] || 'Celebración'
  const confirmados = rsvps.filter(r => r.asistencia === 'si').length
  const porConfirmar = rsvps.filter(r => r.asistencia !== 'si').length
  const shareUrl = `joincheers.app/${celebracion?.slug}/r`

  return (
    <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: bg.css, padding: '26px 18px 44px', boxSizing: 'border-box', fontFamily: FONT }}>
      <div style={{ position: 'relative', maxWidth: 940, margin: '0 auto' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <button onClick={() => router.push('/dashboard')} style={pillBtn}>← Mis celebraciones</button>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.4px', color: textColor, textShadow: '0 1px 10px rgba(20,10,40,.25)' }}>Cheers</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => router.push(`/${celebracion?.slug}/r`)}
              style={{ ...pillBtn, background: 'rgba(255,255,255,.15)', color: textColor, border: '1px solid rgba(255,255,255,.3)' }}
            >
              Ver como invitado →
            </button>
            <button onClick={() => setShowCustomize(v => !v)} style={{ ...pillBtn, background: showCustomize ? '#534AB7' : 'rgba(255,255,255,.92)', color: showCustomize ? '#fff' : '#534AB7' }}>
              Personalizar
            </button>
          </div>
        </div>

        {/* Hero card */}
        <div style={{ background: 'rgba(255,255,255,.97)', borderRadius: 26, overflow: 'hidden', boxShadow: '0 18px 46px rgba(25,12,50,.22)', marginBottom: 16 }}>
          <div style={{ height: 188, background: 'linear-gradient(135deg,#EEEDFE,#FCE9F0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a39ec0', fontSize: 14, fontWeight: 600 }}>
            Imagen del evento — próximamente
          </div>
          <div style={{ padding: '16px 18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#534AB7,#D4537E)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '.5px' }}>{tipoLabel.slice(0, 3)}</span>
              </div>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título del evento" style={{ border: 'none', background: 'transparent', fontFamily: FONT, fontSize: 23, fontWeight: 850, letterSpacing: '-.5px', color: '#2a2440', padding: '5px 8px', borderRadius: 10, outline: 'none', flex: 1, minWidth: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#b3adcc' }}>Editable</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', padding: '0 4px' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase', margin: '0 0 1px 8px' }}>Festejado/a</div>
                <input style={fieldInput} value={festejado} onChange={e => setFestejado(e.target.value)} placeholder="Nombre" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase', margin: '0 0 1px 8px' }}>Fecha</div>
                <input type="date" style={fieldInput} value={fecha} onChange={e => setFecha(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase', margin: '0 0 1px 8px' }}>Lugar</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12, color: '#a39ec0' }}>ubicacion</span>
                  <input style={{ ...fieldInput, flex: 1 }} value={lugar} onChange={e => setLugar(e.target.value)} placeholder="Buscar en Google Maps" />
                  {lugar && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar)}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 800, color: '#1a73e8', background: '#E8F0FE', padding: '5px 10px', borderRadius: 99, textDecoration: 'none', whiteSpace: 'nowrap' }}>Ver ↗</a>}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase', margin: '0 0 1px 8px' }}>Link para invitados</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 8px' }}>
                  <span style={{ fontSize: 13, color: '#534AB7', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareUrl}</span>
                  <button onClick={() => navigator.clipboard.writeText(`https://${shareUrl}`)} style={{ border: 'none', background: '#EEEDFE', color: '#534AB7', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 99, cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}>Copiar</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personalización */}
        {showCustomize && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: 'rgba(255,255,255,.93)', borderRadius: 18, padding: '12px 16px', marginBottom: 16, boxShadow: '0 8px 24px rgba(25,12,50,.14)' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#534AB7' }}>Fondo</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {BG_ORDER.map(k => (
                <button key={k} title={BG[k].label} onClick={() => setPlanBg(k)} style={{ width: 26, height: 26, borderRadius: '50%', background: BG[k].css, cursor: 'pointer', padding: 0, border: planBg === k ? '3px solid #534AB7' : '2px solid #fff', boxShadow: '0 1px 5px rgba(0,0,0,.22)' }} />
              ))}
            </div>
          </div>
        )}

        {/* Upsell Lifetime */}
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, padding: '22px 24px', marginBottom: 18, background: 'linear-gradient(120deg,#534AB7,#7b46a8 55%,#D4537E)', boxShadow: '0 16px 42px rgba(83,74,183,.45)', color: '#fff' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1.5px', opacity: 0.85 }}>CHEERS LIFETIME</div>
              <div style={{ fontSize: 22, fontWeight: 850, letterSpacing: '-.4px', marginTop: 5 }}>Desbloquea todo, para siempre</div>
              <div style={{ fontSize: 14, opacity: 0.92, marginTop: 7, lineHeight: 1.5 }}>Invitados ilimitados, seguimiento de aperturas y temas premium. Un solo pago.</div>
            </div>
            <button style={{ flexShrink: 0, background: '#fff', color: '#534AB7', border: 'none', borderRadius: 15, padding: '15px 24px', fontSize: 15, fontWeight: 850, cursor: 'pointer', fontFamily: FONT, boxShadow: '0 10px 24px rgba(0,0,0,.22)' }}>
              Hazme Lifetime →
            </button>
          </div>
        </div>

        {/* Hint */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 4px 12px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: textColor, opacity: 0.8 }}>
            Arrastra las tarjetas para reacomodar · usa ⤢ para cambiar el tamaño
          </div>
          {guardandoToggle && <div style={{ fontSize: 12, color: textColor, opacity: 0.6 }}>Guardando...</div>}
        </div>

        {/* Grid de tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                  gridColumn: isLg ? '1 / -1' : 'auto',
                  background: '#fff',
                  borderRadius: 22,
                  padding: '20px 18px',
                  boxShadow: '0 8px 24px rgba(25,12,50,.1)',
                  cursor: 'default',
                  opacity: visible ? 1 : 0.65,
                  transition: 'opacity .2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                  <span style={{ cursor: 'grab', color: '#c8c2e0', fontSize: 15 }}>⠿</span>
                  <TileIcon label={info.label} />
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 800, color: '#2a2440' }}>{info.title}</span>
                  {/* Toggle visibilidad */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#a39ec0', fontWeight: 600 }}>{visible ? 'Visible' : 'Oculto'}</span>
                    <Toggle on={visible} onToggle={() => toggleVisibilidad(tile.key)} />
                  </div>
                  <button onClick={() => cycleSize(i)} title="Cambiar tamaño" style={{ border: 'none', background: '#F3F1FB', color: '#534AB7', width: 28, height: 28, borderRadius: 9, cursor: 'pointer', fontSize: 13, fontFamily: FONT }}>⤢</button>
                </div>

                {/* Invitados */}
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {rsvps.slice(0, 6).map((r, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#EEEDFE', color: '#534AB7', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initial(r.nombre)}</div>
                          <span style={{ flex: 1, fontSize: 14, color: '#2a2440', fontWeight: 600 }}>{r.nombre}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: r.asistencia === 'si' ? '#1f8a5b' : '#c98a1e', background: r.asistencia === 'si' ? '#ECF7F0' : '#FFF4E6', padding: '3px 10px', borderRadius: 99 }}>
                            {r.asistencia === 'si' ? 'Va' : r.asistencia === 'no' ? 'No va' : 'Tal vez'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tile.key === 'aperturas' && (
                  <div>
                    <div style={{ fontSize: 13, color: '#7a7494', fontWeight: 700, marginBottom: 8 }}>Sin datos de apertura aún</div>
                    <div style={{ height: 9, background: '#EEEDFE', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: '0%', height: '100%', background: 'linear-gradient(90deg,#534AB7,#D4537E)' }} />
                    </div>
                  </div>
                )}

                {tile.key === 'regalos' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>Agrega ideas de regalo para que tus invitados elijan.</p>
                    <button style={{ border: '1.5px dashed #cfc8ec', background: 'none', color: '#534AB7', fontSize: 14, fontWeight: 700, padding: 12, borderRadius: 14, cursor: 'pointer', fontFamily: FONT }}>+ Agregar regalo</button>
                  </div>
                )}

                {tile.key === 'mensajes' && (
                  <div>
                    <p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>Aquí aparecerán los mensajes que tus invitados dejen para el festejado.</p>
                  </div>
                )}

                {tile.key === 'itinerario' && (
                  <div>
                    <p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>Agrega las paradas del itinerario.</p>
                    <button style={{ border: '1.5px dashed #cfc8ec', background: 'none', color: '#534AB7', fontSize: 14, fontWeight: 700, padding: 12, borderRadius: 14, cursor: 'pointer', fontFamily: FONT, marginTop: 10 }}>+ Agregar parada</button>
                  </div>
                )}

                {tile.key === 'presupuesto' && (
                  <div>
                    <p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>Gestiona el presupuesto del viaje con tu grupo.</p>
                  </div>
                )}

                {tile.key === 'quellevar' && (
                  <div>
                    <p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>Agrega artículos a la lista de qué llevar.</p>
                    <button style={{ border: '1.5px dashed #cfc8ec', background: 'none', color: '#534AB7', fontSize: 14, fontWeight: 700, padding: 12, borderRadius: 14, cursor: 'pointer', fontFamily: FONT, marginTop: 10 }}>+ Agregar artículo</button>
                  </div>
                )}

                {tile.key === 'menu' && (
                  <div>
                    <p style={{ fontSize: 13, color: '#7a7494', margin: 0 }}>¿Quién trae qué? Organiza el potluck aquí.</p>
                    <button style={{ border: '1.5px dashed #cfc8ec', background: 'none', color: '#534AB7', fontSize: 14, fontWeight: 700, padding: 12, borderRadius: 14, cursor: 'pointer', fontFamily: FONT, marginTop: 10 }}>+ Asignar platillo</button>
                  </div>
                )}

                {tile.key === 'reservacion' && (
                  <div style={{ background: 'linear-gradient(135deg,#534AB7,#D4537E)', borderRadius: 16, padding: 18, color: '#fff' }}>
                    <p style={{ fontSize: 14, margin: 0 }}>Agrega los datos de tu reservación aquí.</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}