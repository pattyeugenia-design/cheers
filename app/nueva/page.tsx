'use client'
import { useState } from 'react'
import { supabase } from '../supabase'

type Parada = { lugar: string; hora: string; nota: string; waze: string; maps: string; link: string }
type Gift = { nombre: string; link: string }

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
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', color: '#EEEDFE', padding: '2rem' }}>
        <p style={{ fontSize: 48 }}>🥂</p>
        <h1 style={{ fontSize: 28, fontWeight: 500 }}>¡Celebración creada!</h1>
        <p style={{ color: '#AFA9EC', marginBottom: '2rem' }}>{nombre}</p>
        <a href={`/${slug}`} style={{ display: 'block', padding: '0.9rem 2rem', background: '#7F77DD', borderRadius: 8, color: '#EEEDFE', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>
          Ver mi celebración →
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
    <main style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #faf9ff 0%, #fff5f8 50%, #faf9ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: '2rem' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '2.5rem', width: '100%', maxWidth: 460, boxShadow: '0 24px 60px rgba(83,74,183,0.12), 0 4px 16px rgba(212,83,126,0.08)' }}>

        {paso === 1 && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#D4537E', letterSpacing: '1px', margin: '0 0 6px' }}>PASO 1 DE 3</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', color: '#1d1d1f', margin: '0 0 1.75rem' }}>¿Para quién es la celebración?</h1>
            <button style={btnRol(rolOrganizador === 'yo')} onClick={() => elegirRol('yo')}>
              🎂 Es mi celebración
              <p style={{ fontSize: 13, color: rolOrganizador === 'yo' ? 'rgba(255,255,255,0.8)' : '#6e6e73', margin: '4px 0 0', fontWeight: 400 }}>Yo soy el festejado y organizo mi propio evento</p>
            </button>
            <button style={btnRol(rolOrganizador === 'otro')} onClick={() => elegirRol('otro')}>
              🎁 Organizo para alguien más
              <p style={{ fontSize: 13, color: rolOrganizador === 'otro' ? 'rgba(255,255,255,0.8)' : '#6e6e73', margin: '4px 0 0', fontWeight: 400 }}>Organizo el evento de otra persona — ya sabe</p>
            </button>
            <button style={btnRol(rolOrganizador === 'sorpresa')} onClick={() => elegirRol('sorpresa')}>
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
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder='Ej: "Los 30 de Rodrigo"' style={{ ...input, marginBottom: '1.25rem' }} />

            {(rolOrganizador === 'otro' || rolOrganizador === 'sorpresa') && (
              <>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', display: 'block', marginBottom: 6 }}>¿Quién es el festejado?</label>
                <input value={festejado} onChange={e => setFestejado(e.target.value)} placeholder='Nombre del festejado' style={{ ...input, marginBottom: '1.25rem' }} />
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
                <input value={p.lugar} onChange={e => actualizarParada(i, 'lugar', e.target.value)} placeholder='📍 Lugar (ej: Casa de mi novio, Mochomos)' style={input} />
                <input value={p.hora} onChange={e => actualizarParada(i, 'hora', e.target.value)} placeholder='🕐 Hora (ej: 7pm)' style={input} />
                <input value={p.nota} onChange={e => actualizarParada(i, 'nota', e.target.value)} placeholder='📝 Nota opcional (ej: BYOB)' style={input} />
                <input value={p.waze} onChange={e => actualizarParada(i, 'waze', e.target.value)} placeholder='🗺️ Link Waze (opcional)' style={input} />
                <input value={p.maps} onChange={e => actualizarParada(i, 'maps', e.target.value)} placeholder='🗺️ Link Google Maps (opcional)' style={input} />
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
  )
}