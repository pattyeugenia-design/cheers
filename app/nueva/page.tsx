'use client'
import { useState } from 'react'
import { supabase } from '../supabase'

export default function NuevaCelebracion() {
  const [paso, setPaso] = useState(1)
  const [rolOrganizador, setRolOrganizador] = useState('') // 'yo' o 'otro'
  const [esSorpresa, setEsSorpresa] = useState(false)
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('cumpleanos')
  const [festejado, setFestejado] = useState('')
  const [loading, setLoading] = useState(false)
  const [listo, setListo] = useState(false)
  const [slug, setSlug] = useState('')

  async function crear() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const nuevoSlug = nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const { error } = await supabase.from('celebraciones').insert({
      nombre,
      tipo,
      festejado_nombre: rolOrganizador === 'yo' ? user?.user_metadata?.name?.split(' ')[0] : festejado,
      organizador_id: user?.id || 'anonimo',
      slug: nuevoSlug,
      es_sorpresa: esSorpresa,
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
        <h1 style={{ fontSize: 28, fontWeight: 500 }}>¡Celebracion creada!</h1>
        <p style={{ color: '#AFA9EC', marginBottom: '2rem' }}>{nombre}</p>
        <a href={`/${slug}`} style={{ display: 'block', padding: '0.9rem 2rem', background: '#7F77DD', borderRadius: 8, color: '#EEEDFE', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}>
          Ver mi celebracion →
        </a>
      </div>
    </main>
  )

  const inputStyle = {
    width: '100%',
    marginBottom: '1rem',
    padding: '0.75rem',
    borderRadius: 8,
    border: '1px solid #AFA9EC',
    fontSize: 14,
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
      <div style={{ background: '#EEEDFE', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 400 }}>

        {/* PASO 1 — ¿Para quién? */}
        {paso === 1 && (
          <div>
            <p style={{ fontSize: 13, color: '#AFA9EC', margin: '0 0 4px' }}>Paso 1 de 2</p>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#3C3489', margin: '0 0 1.5rem' }}>¿Para quién es la celebración?</h1>
            <button style={btnRol(rolOrganizador === 'yo')} onClick={() => setRolOrganizador('yo')}>
              🎂 Es mi celebración
              <p style={{ fontSize: 12, color: rolOrganizador === 'yo' ? '#CECBF6' : '#AFA9EC', margin: '4px 0 0', fontWeight: 400 }}>Yo soy el festejado y organizo mi propio evento</p>
            </button>
            <button style={btnRol(rolOrganizador === 'otro')} onClick={() => setRolOrganizador('otro')}>
              🎁 Estoy organizando para alguien más
              <p style={{ fontSize: 12, color: rolOrganizador === 'otro' ? '#CECBF6' : '#AFA9EC', margin: '4px 0 0', fontWeight: 400 }}>Organizo el evento de otra persona</p>
            </button>

            {rolOrganizador === 'otro' && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(127,119,221,0.1)', borderRadius: 10 }}>
                <label style={{ fontSize: 13, color: '#534AB7', display: 'block', marginBottom: 4 }}>¿Es sorpresa?</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setEsSorpresa(false)} style={{ flex: 1, padding: '0.6rem', background: !esSorpresa ? '#7F77DD' : '#EEEDFE', border: `1px solid ${!esSorpresa ? '#7F77DD' : '#AFA9EC'}`, borderRadius: 8, color: !esSorpresa ? '#EEEDFE' : '#3C3489', fontSize: 13, cursor: 'pointer' }}>
                    No, sabe
                  </button>
                  <button onClick={() => setEsSorpresa(true)} style={{ flex: 1, padding: '0.6rem', background: esSorpresa ? '#7F77DD' : '#EEEDFE', border: `1px solid ${esSorpresa ? '#7F77DD' : '#AFA9EC'}`, borderRadius: 8, color: esSorpresa ? '#EEEDFE' : '#3C3489', fontSize: 13, cursor: 'pointer' }}>
                    🤫 Si, es sorpresa
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setPaso(2)}
              disabled={!rolOrganizador}
              style={{ width: '100%', padding: '0.9rem', background: rolOrganizador ? '#7F77DD' : '#AFA9EC', border: 'none', borderRadius: 8, color: '#EEEDFE', fontSize: 15, fontWeight: 500, cursor: rolOrganizador ? 'pointer' : 'not-allowed', marginTop: '1.5rem' }}
            >
              Siguiente →
            </button>
          </div>
        )}

        {/* PASO 2 — Detalles */}
        {paso === 2 && (
          <div>
            <button onClick={() => setPaso(1)} style={{ background: 'none', border: 'none', color: '#AFA9EC', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: '0.5rem' }}>← Atras</button>
            <p style={{ fontSize: 13, color: '#AFA9EC', margin: '0 0 4px' }}>Paso 2 de 2</p>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#3C3489', margin: '0 0 1.5rem' }}>Detalles de la celebración</h1>

            <label style={{ fontSize: 13, color: '#534AB7', display: 'block', marginBottom: 4 }}>¿Que van a celebrar?</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ ...inputStyle }}>
              <option value="cumpleanos">🎂 Cumpleaños</option>
              <option value="boda">💍 Boda</option>
              <option value="xv">👑 XV años</option>
              <option value="graduacion">🎓 Graduación</option>
              <option value="babyshower">🍼 Baby shower</option>
              <option value="otro">✨ Otra celebración</option>
            </select>

            <label style={{ fontSize: 13, color: '#534AB7', display: 'block', marginBottom: 4 }}>Nombre del evento</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder='Ej: "Los 30 de Rodrigo"' style={{ ...inputStyle }} />

            {rolOrganizador === 'otro' && (
              <>
                <label style={{ fontSize: 13, color: '#534AB7', display: 'block', marginBottom: 4 }}>¿Quién es el festejado?</label>
                <input value={festejado} onChange={e => setFestejado(e.target.value)} placeholder='Nombre del festejado' style={{ ...inputStyle }} />
              </>
            )}

            <button onClick={crear} disabled={!nombre || loading} style={{ width: '100%', padding: '0.9rem', background: nombre ? '#7F77DD' : '#AFA9EC', border: 'none', borderRadius: 8, color: '#EEEDFE', fontSize: 15, fontWeight: 500, cursor: nombre ? 'pointer' : 'not-allowed', marginTop: '0.5rem' }}>
              {loading ? 'Creando...' : 'Crear celebracion 🥂'}
            </button>
          </div>
        )}

      </div>
    </main>
  )
}