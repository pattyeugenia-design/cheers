'use client'
import { useState } from 'react'
import { supabase } from '../supabase'

export default function NuevaCelebracion() {
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
      festejado_nombre: festejado,
      organizador_id: user?.id || 'anonimo',
      slug: nuevoSlug,
    })
    setLoading(false)
    if (!error) {
      setSlug(nuevoSlug)
      setListo(true)
    }
  }

  if (listo) return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', color: '#EEEDFE' }}>
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

  return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '2rem' }}>
      <div style={{ background: '#EEEDFE', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 400 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: '#3C3489', margin: '0 0 1.5rem' }}>Nueva celebracion 🎉</h1>
        <label style={{ fontSize: 13, color: '#534AB7', display: 'block', marginBottom: 4 }}>¿Que van a celebrar?</label>
        <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ ...inputStyle }}>
          <option value="cumpleanos">🎂 Cumpleanos</option>
          <option value="boda">💍 Boda</option>
          <option value="xv">👑 XV anos</option>
          <option value="graduacion">🎓 Graduacion</option>
          <option value="babyshower">🍼 Baby shower</option>
          <option value="otro">✨ Otra celebracion</option>
        </select>
        <label style={{ fontSize: 13, color: '#534AB7', display: 'block', marginBottom: 4 }}>Nombre del evento</label>
        <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder='Ej: "Los 30 de Rodrigo"' style={{ ...inputStyle }} />
        <label style={{ fontSize: 13, color: '#534AB7', display: 'block', marginBottom: 4 }}>¿Quien es el festejado?</label>
        <input value={festejado} onChange={e => setFestejado(e.target.value)} placeholder='Nombre del festejado' style={{ ...inputStyle, marginBottom: '1.5rem' }} />
        <button onClick={crear} disabled={!nombre || loading} style={{ width: '100%', padding: '0.9rem', background: '#7F77DD', border: 'none', borderRadius: 8, color: '#EEEDFE', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
          {loading ? 'Creando...' : 'Crear celebracion 🥂'}
        </button>
      </div>
    </main>
  )
}