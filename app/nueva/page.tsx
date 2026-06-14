'use client'
import { useState, useEffect, useRef } from 'react'
import Script from 'next/script'
import { supabase } from '../supabase'

type Parada = { lugar: string; hora: string; nota: string; waze: string; maps: string; link: string }
type Gift = { nombre: string; link: string }

declare global {
  interface Window {
    google: any
  }
}

export default function NuevaCelebracion() {
  const [paso, setPaso] = useState(1)
  const [rolOrganizador, setRolOrganizador] = useState('')
  const [esSorpresa, setEsSorpresa] = useState(false)
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('cumpleanos')
  const [festejado, setFestejado] = useState('')
  const [paradas, setParadas] = useState<Parada[]>([{ lugar: '', hora: '', nota: '', waze: '', maps: '', link: '' }])
  const [gifts, setGifts] = useState<Gift[]>([{ nombre: '', link: '' }])
  const [loading, setLoading] = useState(false)
  const [listo, setListo] = useState(false)
  const [slug, setSlug] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [mapsListo, setMapsListo] = useState(false)

  const lugarRefs = useRef<(HTMLInputElement | null)[]>([])

  function actualizarParada(i: number, campo: keyof Parada, valor: string) {
    const nuevas = [...paradas]
    nuevas[i][campo] = valor
    setParadas(nuevas)
  }

  function actualizarGift(i: number, campo: keyof Gift, valor: string) {
    const nuevos = [...gifts]
    nuevos[i][campo] = valor
    setGifts(nuevos)
  }

  function elegirRol(rol: string) {
    setRolOrganizador(rol)
    setEsSorpresa(rol === 'sorpresa')
  }

  // Inicializa el autocomplete de Google Places en cada input de "lugar" del paso 3
  useEffect(() => {
    if (!mapsListo || paso !== 3) return
    if (!window.google?.maps?.places) return

    paradas.forEach((_, i) => {
      const inputEl = lugarRefs.current[i]
      if (!inputEl || inputEl.dataset.autocompleteInit) return

      const autocomplete = new window.google.maps.places.Autocomplete(inputEl, {
        fields: ['name', 'formatted_address', 'place_id', 'geometry'],
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (!place) return
        const nombreLugar = place.name || inputEl.value
        const direccion = place.formatted_address || ''
        const mapsLink = place.place_id
          ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nombreLugar + ' ' + direccion)}`

        setParadas(prev => {
          const nuevas = [...prev]
          nuevas[i] = { ...nuevas[i], lugar: nombreLugar, maps: mapsLink }
          return nuevas
        })
      })

      inputEl.dataset.autocompleteInit = 'true'
    })
  }, [mapsListo, paso, paradas.length])

  async function crear() {
    setLoading(true)
    setErrorMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    const nuevoSlug = nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const paradasLimpias = paradas.filter(p => p.lugar.trim())
    const giftsLimpios = gifts.filter(g => g.link.trim())
    const { error } = await supabase.from('celebraciones').insert({
      nombre,
      tipo,
      festejado_nombre: rolOrganizador === 'yo' ? user?.user_metadata?.name?.split(' ')[0] : festejado,
      organizador_id: user?.id || 'anonimo',
      slug: nuevoSlug,
      es_sorpresa: esSorpresa,
      paradas: paradasLimpias,
      gifts: giftsLimpios,
    })
    setLoading(false)
    if (!error) {
      setSlug(nuevoSlug)
      setListo(true)
    } else if (error.code === '23505') {
      setErrorMsg('Ya existe una celebración con ese nombre. Usa un nombre distinto (ej: agrega un año o detalle extra).')
    } else {
      setErrorMsg('Algo salió mal al crear la celebración. Intenta de nuevo.')
    }
  }

  if (listo) return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`
        @keyframes clinkL { 0%,100%{transform:rotate(15deg)} 45%,55%{transform:rotate(4deg)} }
        @keyframes clinkR { 0%,100%{transform:rotate(-15deg)} 45%,55%{transform:rotate(-4deg)} }
        @keyframes splash { 0%,40%{opacity:0;transform:scale(0) translateX(-50%)} 50%{opacity:1;transform:scale(1) translateX(-50%)} 80%,100%{opacity:0;transform:scale(1.6) translateX(-50%)} }
        @keyframes bubble { 0%{transform:translateY(0);opacity:.7} 100%{transform:translateY(-55px);opacity:0} }
      `}</style>
      <div style={{ textAlign: 'center', color: '#EEEDFE', padding: '2rem' }}>

        {/* Copas SVG animadas chocando */}
        <div style={{ position: 'relative', height: 220, width: 280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 24, left: '50%', animation: 'splash 3s ease-in-out infinite', pointerEvents: 'none', zIndex: 5 }}>
            <svg viewBox="0 0 90 70" width="70" height="55">
              <g fill="#f7d76b" opacity="0.9">
                <circle cx="45" cy="45" r="4.5" />
                <ellipse cx="45" cy="24" rx="3.5" ry="9" />
                <ellipse cx="27" cy="31" rx="3" ry="8" transform="rotate(-30 27 31)" />
                <ellipse cx="63" cy="31" rx="3" ry="8" transform="rotate(30 63 31)" />
                <ellipse cx="18" cy="47" rx="2.5" ry="6.5" transform="rotate(-60 18 47)" />
                <ellipse cx="72" cy="47" rx="2.5" ry="6.5" transform="rotate(60 72 47)" />
              </g>
            </svg>
          </div>

          <svg viewBox="0 0 360 300" width="260" height="220" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="liqExito" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f5c842" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#f7d76b" />
                <stop offset="100%" stopColor="#f5c842" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="glExito" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7F77DD" stopOpacity="0.15" />
                <stop offset="40%" stopColor="#fff" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#7F77DD" stopOpacity="0.12" />
              </linearGradient>
              <clipPath id="c1Exito"><path d="M14,16 L38,158 Q62,175 86,158 L110,16 Z" /></clipPath>
              <clipPath id="c2Exito"><path d="M250,16 L274,158 Q298,175 322,158 L346,16 Z" /></clipPath>
            </defs>
            <g style={{ transformOrigin: '62px 280px', animation: 'clinkL 3s ease-in-out infinite' }}>
              <path d="M14,16 L38,158 Q62,175 86,158 L110,16 Z" fill="url(#glExito)" stroke="#AFA9EC" strokeWidth="1.5" strokeOpacity="0.5" />
              <g clipPath="url(#c1Exito)">
                <rect x="14" y="80" width="96" height="86" fill="url(#liqExito)" opacity="0.88" />
                <ellipse cx="62" cy="80" rx="46" ry="7" fill="#f7d76b" opacity="0.7">
                  <animate attributeName="ry" values="7;10;7" dur="2s" repeatCount="indefinite" />
                </ellipse>
                <rect x="36" y="86" width="3.5" height="68" fill="white" opacity="0.22" rx="1.5" />
              </g>
              <line x1="14" y1="16" x2="110" y2="16" stroke="#AFA9EC" strokeWidth="2" strokeOpacity="0.6" strokeLinecap="round" />
              <rect x="58" y="159" width="9" height="106" fill="#AFA9EC" opacity="0.25" rx="4.5" />
              <ellipse cx="62" cy="267" rx="36" ry="8" fill="#AFA9EC" opacity="0.15" />
            </g>
            <g style={{ transformOrigin: '298px 280px', animation: 'clinkR 3s ease-in-out infinite' }}>
              <path d="M250,16 L274,158 Q298,175 322,158 L346,16 Z" fill="url(#glExito)" stroke="#AFA9EC" strokeWidth="1.5" strokeOpacity="0.5" />
              <g clipPath="url(#c2Exito)">
                <rect x="250" y="80" width="96" height="86" fill="url(#liqExito)" opacity="0.88" />
                <ellipse cx="298" cy="80" rx="46" ry="7" fill="#f7d76b" opacity="0.7">
                  <animate attributeName="ry" values="7;10;7" dur="2s" repeatCount="indefinite" />
                </ellipse>
                <rect x="316" y="86" width="3.5" height="68" fill="white" opacity="0.22" rx="1.5" />
              </g>
              <line x1="250" y1="16" x2="346" y2="16" stroke="#AFA9EC" strokeWidth="2" strokeOpacity="0.6" strokeLinecap="round" />
              <rect x="294" y="159" width="9" height="106" fill="#AFA9EC" opacity="0.25" rx="4.5" />
              <ellipse cx="298" cy="267" rx="36" ry="8" fill="#AFA9EC" opacity="0.15" />
            </g>
          </svg>

          {[
            { left: 64,  top: 130, size: 6, delay: '0s',   dur: '2s'   },
            { left: 76,  top: 145, size: 4, delay: '0.7s', dur: '2.3s' },
            { left: 56,  top: 142, size: 3, delay: '1.2s', dur: '1.9s' },
          ].map((b, i) => (
            <div key={i} style={{ position: 'absolute', width: b.size, height: b.size, left: b.left, top: b.top, borderRadius: '50%', background: 'rgba(247,215,107,0.5)', border: '1px solid rgba(247,215,107,0.8)', animation: `bubble ${b.dur} ease-in infinite ${b.delay}` }} />
          ))}
          {[
            { left: 178, top: 130, size: 6, delay: '0.4s', dur: '2.1s' },
            { left: 190, top: 145, size: 4, delay: '1.1s', dur: '2.4s' },
            { left: 168, top: 142, size: 3, delay: '0.9s', dur: '2.0s' },
          ].map((b, i) => (
            <div key={`r${i}`} style={{ position: 'absolute', width: b.size, height: b.size, left: b.left, top: b.top, borderRadius: '50%', background: 'rgba(247,215,107,0.5)', border: '1px solid rgba(247,215,107,0.8)', animation: `bubble ${b.dur} ease-in infinite ${b.delay}` }} />
          ))}
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', margin: '0.5rem 0 0.5rem' }}>¡Celebración creada!</h1>
        <p style={{ color: '#AFA9EC', marginBottom: '2rem', fontSize: 15 }}>{nombre}</p>
        <a href={`/${slug}`} style={{ display: 'block', padding: '1rem 2rem', background: 'linear-gradient(135deg, #534AB7, #D4537E)', borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none', boxShadow: '0 8px 24px rgba(212,83,126,0.3)', marginBottom: '0.75rem' }}>
          Ver mi celebración →
        </a>
        <a href="/dashboard" style={{ display: 'block', padding: '0.85rem 2rem', background: 'rgba(255,255,255,0.06)', borderRadius: 14, color: '#AFA9EC', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
          Ir al dashboard
        </a>
      </div>
    </main>
  )

  const input = {
    width: '100%',
    marginBottom: '0.5rem',
    padding: '0.65rem',
    borderRadius: 8,
    border: '1px solid #e0e0e0',
    fontSize: 13,
    boxSizing: 'border-box' as const,
    color: '#1d1d1f',
    background: '#FFFFFF',
  }

  const btnRol = (activo: boolean) => ({
    width: '100%',
    padding: '1.1rem',
    background: activo ? 'linear-gradient(135deg, #534AB7, #D4537E)' : '#fff',
    border: activo ? 'none' : '1.5px solid #f0f0f0',
    borderRadius: 14,
    color: activo ? '#fff' : '#1d1d1f',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '0.75rem',
    textAlign: 'left' as const,
    boxShadow: activo ? '0 8px 24px rgba(212,83,126,0.3)' : '0 2px 8px rgba(0,0,0,0.04)',
    transition: 'all 0.2s',
  })

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setMapsListo(true)}
      />
      <main style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #faf9ff 0%, #fff5f8 50%, #faf9ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: '2rem' }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: '2.5rem', width: '100%', maxWidth: 460, boxShadow: '0 24px 60px rgba(83,74,183,0.12), 0 4px 16px rgba(212,83,126,0.08)' }}>

          {paso === 1 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#D4537E', letterSpacing: '1px', margin: '0 0 6px' }}>PASO 1 DE 3</p>
              <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', color: '#1d1d1f', margin: '0 0 1.75rem' }}>¿Para quién es la celebración?</h1>
              <button style={btnRol(rolOrganizador === 'yo')} onClick={() => elegirRol('yo')} onDoubleClick={() => { elegirRol('yo'); setPaso(2) }}>
                🎂 Es mi celebración
                <p style={{ fontSize: 13, color: rolOrganizador === 'yo' ? 'rgba(255,255,255,0.8)' : '#6e6e73', margin: '4px 0 0', fontWeight: 400 }}>Yo soy el festejado y organizo mi propio evento</p>
              </button>
              <button style={btnRol(rolOrganizador === 'otro')} onClick={() => elegirRol('otro')} onDoubleClick={() => { elegirRol('otro'); setPaso(2) }}>
                🎁 Organizo para alguien más
                <p style={{ fontSize: 13, color: rolOrganizador === 'otro' ? 'rgba(255,255,255,0.8)' : '#6e6e73', margin: '4px 0 0', fontWeight: 400 }}>Organizo el evento de otra persona — ya sabe</p>
              </button>
              <button style={btnRol(rolOrganizador === 'sorpresa')} onClick={() => elegirRol('sorpresa')} onDoubleClick={() => { elegirRol('sorpresa'); setPaso(2) }}>
                🤫 Organizo para alguien más — es sorpresa
                <p style={{ fontSize: 13, color: rolOrganizador === 'sorpresa' ? 'rgba(255,255,255,0.8)' : '#6e6e73', margin: '4px 0 0', fontWeight: 400 }}>Organizo el evento de otra persona — no debe saber</p>
              </button>
              <button onClick={() => setPaso(2)} disabled={!rolOrganizador} style={{ width: '100%', padding: '1rem', background: rolOrganizador ? 'linear-gradient(135deg, #534AB7, #D4537E)' : '#f0f0f0', border: 'none', borderRadius: 14, color: rolOrganizador ? '#fff' : '#aeaeb2', fontSize: 15, fontWeight: 600, cursor: rolOrganizador ? 'pointer' : 'not-allowed', marginTop: '0.5rem', boxShadow: rolOrganizador ? '0 8px 24px rgba(212,83,126,0.3)' : 'none' }}>
                Siguiente →
              </button>
            </div>
          )}

          {paso === 2 && (
            <div>
              <button onClick={() => setPaso(1)} style={{ background: 'none', border: 'none', color: '#aeaeb2', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: '0.75rem' }}>← Atrás</button>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#D4537E', letterSpacing: '1px', margin: '0 0 6px' }}>PASO 2 DE 3</p>
              <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', color: '#1d1d1f', margin: '0 0 1.75rem' }}>Detalles del festejo</h1>

              <label style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', display: 'block', marginBottom: 6 }}>¿Qué van a celebrar?</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ ...input, marginBottom: '1.25rem' }}>
                <option value="cumpleanos">🎂 Cumpleaños</option>
                <option value="boda">💍 Boda</option>
                <option value="graduacion">🎓 Graduación</option>
                <option value="babyshower">🍼 Baby shower</option>
                <option value="bachelorette">💃 Bachelorette</option>
                <option value="otro">✨ Otro festejo</option>
              </select>

              <label style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', display: 'block', marginBottom: 6 }}>Nombre del evento</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && nombre) setPaso(3) }} placeholder='Ej: "Los 30 de Rodrigo"' style={{ ...input, marginBottom: '1.25rem' }} />

              {(rolOrganizador === 'otro' || rolOrganizador === 'sorpresa') && (
                <>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', display: 'block', marginBottom: 6 }}>¿Quién es el festejado?</label>
                  <input value={festejado} onChange={e => setFestejado(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && nombre) setPaso(3) }} placeholder='Nombre del festejado' style={{ ...input, marginBottom: '1.25rem' }} />
                </>
              )}

              <button onClick={() => setPaso(3)} disabled={!nombre} style={{ width: '100%', padding: '1rem', background: nombre ? 'linear-gradient(135deg, #534AB7, #D4537E)' : '#f0f0f0', border: 'none', borderRadius: 14, color: nombre ? '#fff' : '#aeaeb2', fontSize: 15, fontWeight: 600, cursor: nombre ? 'pointer' : 'not-allowed', marginTop: '0.5rem', boxShadow: nombre ? '0 8px 24px rgba(212,83,126,0.3)' : 'none' }}>
                Siguiente →
              </button>
            </div>
          )}

          {paso === 3 && (
            <div>
              <button onClick={() => setPaso(2)} style={{ background: 'none', border: 'none', color: '#aeaeb2', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: '0.75rem' }}>← Atrás</button>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#D4537E', letterSpacing: '1px', margin: '0 0 6px' }}>PASO 3 DE 3</p>
              <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', color: '#1d1d1f', margin: '0 0 1.75rem' }}>El plan 🗺️</h1>

              {paradas.map((p, i) => (
                <div key={i} style={{ background: '#faf9ff', border: '1px solid #f0eefa', borderRadius: 14, padding: '1rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#534AB7', margin: 0 }}>Parada {i + 1}</p>
                    {paradas.length > 1 && (
                      <button onClick={() => setParadas(paradas.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#aeaeb2', fontSize: 12, cursor: 'pointer' }}>Eliminar</button>
                    )}
                  </div>
                  <input
                    ref={el => { lugarRefs.current[i] = el }}
                    value={p.lugar}
                    onChange={e => actualizarParada(i, 'lugar', e.target.value)}
                    placeholder='📍 Lugar — escribe para buscar (ej: Mochomos, Monterrey)'
                    style={input}
                  />
                  <input value={p.hora} onChange={e => actualizarParada(i, 'hora', e.target.value)} placeholder='🕐 Hora (ej: 7pm)' style={input} />
                  <input value={p.nota} onChange={e => actualizarParada(i, 'nota', e.target.value)} placeholder='📝 Nota opcional (ej: BYOB)' style={input} />
                  <input value={p.waze} onChange={e => actualizarParada(i, 'waze', e.target.value)} placeholder='🗺️ Link Waze (opcional)' style={input} />
                  <input value={p.maps} onChange={e => actualizarParada(i, 'maps', e.target.value)} placeholder='🗺️ Link Google Maps (se llena solo al elegir de la lista)' style={input} />
                  <input value={p.link} onChange={e => actualizarParada(i, 'link', e.target.value)} placeholder='🔗 Link extra: OpenTable, reservación... (opcional)' style={{ ...input, marginBottom: 0 }} />
                </div>
              ))}

              <button onClick={() => setParadas([...paradas, { lugar: '', hora: '', nota: '', waze: '', maps: '', link: '' }])} style={{ width: '100%', padding: '0.8rem', background: 'none', border: '2px dashed #D4537E', borderRadius: 12, color: '#D4537E', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: '1.5rem' }}>
                + Agregar parada
              </button>

              <p style={{ fontSize: 14, fontWeight: 700, color: '#1d1d1f', margin: '0 0 8px' }}>🎁 Gift ideas (opcional)</p>
              {gifts.map((g, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: '0.5rem' }}>
                  <input value={g.nombre} onChange={e => actualizarGift(i, 'nombre', e.target.value)} placeholder='Nombre (ej: Liverpool, Amazon)' style={{ ...input, marginBottom: 0, flex: 1 }} />
                  <input value={g.link} onChange={e => actualizarGift(i, 'link', e.target.value)} placeholder='Link' style={{ ...input, marginBottom: 0, flex: 2 }} />
                  {gifts.length > 1 && (
                    <button onClick={() => setGifts(gifts.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#aeaeb2', fontSize: 12, cursor: 'pointer' }}>✕</button>
                  )}
                </div>
              ))}
              <button onClick={() => setGifts([...gifts, { nombre: '', link: '' }])} style={{ width: '100%', padding: '0.8rem', background: 'none', border: '2px dashed #D4537E', borderRadius: 12, color: '#D4537E', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: '1.5rem' }}>
                + Agregar gift idea
              </button>

              {errorMsg && (
                <div style={{ background: 'rgba(212,83,126,0.08)', border: '1px solid rgba(212,83,126,0.25)', borderRadius: 12, padding: '0.85rem 1rem', marginBottom: '1rem' }}>
                  <p style={{ fontSize: 13, color: '#D4537E', margin: 0, fontWeight: 500 }}>⚠️ {errorMsg}</p>
                </div>
              )}

              <button onClick={crear} disabled={loading} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #534AB7, #D4537E)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 24px rgba(212,83,126,0.3)' }}>
                {loading ? 'Creando...' : 'Crear celebración 🥂'}
              </button>
            </div>
          )}

        </div>
      </main>
    </>
  )
}