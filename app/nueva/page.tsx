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

  async function crear() {
    setLoading(true)
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
    border: '1px solid #AFA9EC',
    fontSize: 13,
    boxSizing: 'border-box' as const,
    color: '#3C3489',
    background: '#FFFFFF',
  }

  const btnRol = (activo: boolean) => ({
    width: '100%',
    padding: '1rem',
    background: activo ? '#7F77DD' : '#EEEDFE',
    border: `2px solid ${activo ? '#7F77DD' : '#AFA9EC'}`,
    borderRadius: 12,
    color: activo ? '#EEEDFE' : '#3C3489',
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
    marginBottom: '0.75rem',
    textAlign: 'left' as const,
  })

  return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '2rem' }}>
      <div style={{ background: '#EEEDFE', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 440 }}>

        {paso === 1 && (
          <div>
            <p style={{ fontSize: 13, color: '#AFA9EC', margin: '0 0 4px' }}>Paso 1 de 3</p>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#3C3489', margin: '0 0 1.5rem' }}>¿Para quién es la celebración?</h1>
            <button style={btnRol(rolOrganizador === 'yo')} onClick={() => setRolOrganizador('yo')}>
              🎂 Es mi celebración
              <p style={{ fontSize: 12, color: rolOrganizador === 'yo' ? '#CECBF6' : '#AFA9EC', margin: '4px 0 0', fontWeight: 400 }}>Yo soy el festejado y organizo mi propio evento</p>
            </button>
            <button style={btnRol(rolOrganizador === 'otro')} onClick={() => setRolOrganizador('otro')}>
              🎁 Organizo para alguien más
              <p style={{ fontSize: 12, color: rolOrganizador === 'otro' ? '#CECBF6' : '#AFA9EC', margin: '4px 0 0', fontWeight: 400 }}>Organizo el evento de otra persona</p>
            </button>
            {rolOrganizador === 'otro' && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(127,119,221,0.1)', borderRadius: 10 }}>
                <label style={{ fontSize: 13, color: '#534AB7', display: 'block', marginBottom: 8 }}>¿Es sorpresa?</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setEsSorpresa(false)} style={{ flex: 1, padding: '0.6rem', background: !esSorpresa ? '#7F77DD' : '#EEEDFE', border: `1px solid ${!esSorpresa ? '#7F77DD' : '#AFA9EC'}`, borderRadius: 8, color: !esSorpresa ? '#EEEDFE' : '#3C3489', fontSize: 13, cursor: 'pointer' }}>No, sabe</button>
                  <button onClick={() => setEsSorpresa(true)} style={{ flex: 1, padding: '0.6rem', background: esSorpresa ? '#7F77DD' : '#EEEDFE', border: `1px solid ${esSorpresa ? '#7F77DD' : '#AFA9EC'}`, borderRadius: 8, color: esSorpresa ? '#EEEDFE' : '#3C3489', fontSize: 13, cursor: 'pointer' }}>🤫 Es sorpresa</button>
                </div>
              </div>
            )}
            <button onClick={() => setPaso(2)} disabled={!rolOrganizador} style={{ width: '100%', padding: '0.9rem', background: rolOrganizador ? '#7F77DD' : '#AFA9EC', border: 'none', borderRadius: 8, color: '#EEEDFE', fontSize: 15, fontWeight: 500, cursor: rolOrganizador ? 'pointer' : 'not-allowed', marginTop: '1.5rem' }}>
              Siguiente →
            </button>
          </div>
        )}

        {paso === 2 && (
          <div>
            <button onClick={() => setPaso(1)} style={{ background: 'none', border: 'none', color: '#AFA9EC', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: '0.5rem' }}>← Atrás</button>
            <p style={{ fontSize: 13, color: '#AFA9EC', margin: '0 0 4px' }}>Paso 2 de 3</p>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#3C3489', margin: '0 0 1.5rem' }}>Detalles del festejo</h1>

            <label style={{ fontSize: 13, color: '#534AB7', display: 'block', marginBottom: 4 }}>¿Qué van a celebrar?</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ ...input, marginBottom: '1rem' }}>
              <option value="cumpleanos">🎂 Cumpleaños</option>
              <option value="boda">💍 Boda</option>
              <option value="xv">👑 XV años</option>
              <option value="graduacion">🎓 Graduación</option>
              <option value="babyshower">🍼 Baby shower</option>
              <option value="bachelorette">💃 Bachelorette</option>
              <option value="otro">✨ Otro festejo</option>
            </select>

            <label style={{ fontSize: 13, color: '#534AB7', display: 'block', marginBottom: 4 }}>Nombre del evento</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder='Ej: "Los 30 de Rodrigo"' style={{ ...input, marginBottom: '1rem' }} />

            {rolOrganizador === 'otro' && (
              <>
                <label style={{ fontSize: 13, color: '#534AB7', display: 'block', marginBottom: 4 }}>¿Quién es el festejado?</label>
                <input value={festejado} onChange={e => setFestejado(e.target.value)} placeholder='Nombre del festejado' style={{ ...input, marginBottom: '1rem' }} />
              </>
            )}

            <button onClick={() => setPaso(3)} disabled={!nombre} style={{ width: '100%', padding: '0.9rem', background: nombre ? '#7F77DD' : '#AFA9EC', border: 'none', borderRadius: 8, color: '#EEEDFE', fontSize: 15, fontWeight: 500, cursor: nombre ? 'pointer' : 'not-allowed', marginTop: '0.5rem' }}>
              Siguiente →
            </button>
          </div>
        )}

        {paso === 3 && (
          <div>
            <button onClick={() => setPaso(2)} style={{ background: 'none', border: 'none', color: '#AFA9EC', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: '0.5rem' }}>← Atrás</button>
            <p style={{ fontSize: 13, color: '#AFA9EC', margin: '0 0 4px' }}>Paso 3 de 3</p>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#3C3489', margin: '0 0 1.5rem' }}>El plan 🗺️</h1>

            {paradas.map((p, i) => (
              <div key={i} style={{ background: 'rgba(127,119,221,0.08)', borderRadius: 10, padding: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#534AB7', margin: 0 }}>Parada {i + 1}</p>
                  {paradas.length > 1 && (
                    <button onClick={() => setParadas(paradas.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#AFA9EC', fontSize: 12, cursor: 'pointer' }}>Eliminar</button>
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

            <button onClick={() => setParadas([...paradas, { lugar: '', hora: '', nota: '', waze: '', maps: '', link: '' }])} style={{ width: '100%', padding: '0.7rem', background: 'none', border: '2px dashed #AFA9EC', borderRadius: 8, color: '#534AB7', fontSize: 13, cursor: 'pointer', marginBottom: '1.5rem' }}>
              + Agregar parada
            </button>

            <p style={{ fontSize: 14, fontWeight: 600, color: '#3C3489', margin: '0 0 8px' }}>🎁 Gift ideas (opcional)</p>
            {gifts.map((g, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: '0.5rem' }}>
                <input value={g.nombre} onChange={e => actualizarGift(i, 'nombre', e.target.value)} placeholder='Nombre (ej: Liverpool, Amazon)' style={{ ...input, marginBottom: 0, flex: 1 }} />
                <input value={g.link} onChange={e => actualizarGift(i, 'link', e.target.value)} placeholder='Link' style={{ ...input, marginBottom: 0, flex: 2 }} />
                {gifts.length > 1 && (
                  <button onClick={() => setGifts(gifts.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#AFA9EC', fontSize: 12, cursor: 'pointer' }}>✕</button>
                )}
              </div>
            ))}
            <button onClick={() => setGifts([...gifts, { nombre: '', link: '' }])} style={{ width: '100%', padding: '0.7rem', background: 'none', border: '2px dashed #AFA9EC', borderRadius: 8, color: '#534AB7', fontSize: 13, cursor: 'pointer', marginBottom: '1.5rem' }}>
              + Agregar gift idea
            </button>

            <button onClick={crear} disabled={loading} style={{ width: '100%', padding: '0.9rem', background: '#7F77DD', border: 'none', borderRadius: 8, color: '#EEEDFE', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
              {loading ? 'Creando...' : 'Crear celebración 🥂'}
            </button>
          </div>
        )}

      </div>
    </main>
  )
}