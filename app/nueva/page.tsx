'use client'

import { useState } from 'react'
import { supabase } from '../supabase'

export default function NuevaCelebracion() {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('cumpleanos')
  const [festejado, setFestejado] = useState('')
  const [loading, setLoading] = useState(false)
  const [listo, setListo] = useState(false)

  async function crear() {
    setLoading(true)
    const slug = nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const { error } = await supabase.from('celebraciones').insert({
      nombre,
      tipo,
      festejado_nombre: festejado,
      organizador_id: 'test',
      slug,
    })
    setLoading(false)
    if (!error) setListo(true)
  }

  if (listo) return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', color: '#EEEDFE' }}>
        <p style={{ fontSize: 48 }}>🥂</p>
        <h1 style={{ fontSize: 28, fontWeight: 500 }}>¡Celebración creada!</h1>
        <p style={{ color: '#AFA9EC' }}>{nombre}</p>
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
        <h1 style={{ fontSize: 22, fontWeight: 500, color: '#3C3489', margin: '0 0 1.5rem' }}>Nueva celebración 🎉</h1>

        <label style={{ fontSize: 13, color: '#534AB7', display: 'block', marginBottom: 4 }}>¿Qué van a celebrar?</label>
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

        <label style={{ fontSize: 13, color: '#534AB7', display: 'block', marginBottom: 4 }}>¿Quién es el festejado?</label>
        <input value={festejado} onChange={e => setFestejado(e.target.value)} placeholder='Nombre del festejado' style={{ ...inputStyle, marginBottom: '1.5rem' }} />

        <button onClick={crear} disabled={!nombre || loading} style={{ width: '100%', padding: '0.9rem', background: '#7F77DD', border: 'none', borderRadius: 8, color: '#EEEDFE', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
          {loading ? 'Creando...' : 'Crear celebración 🥂'}
        </button>
      </div>
    </main>
  )
}