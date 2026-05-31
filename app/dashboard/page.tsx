'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Dashboard() {
  const [usuario, setUsuario] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user)
    })
  }, [])

  return (
    <main style={{ minHeight: '100vh', background: '#26215C', fontFamily: 'sans-serif', padding: '2rem' }}>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <p style={{ fontSize: 32, margin: '0 0 8px' }}>🥂</p>
        <h1 style={{ fontSize: 24, fontWeight: 500, color: '#EEEDFE', margin: '0 0 4px' }}>
          Hola, {usuario?.user_metadata?.name?.split(' ')[0] || 'festejada'}
        </h1>
        <p style={{ fontSize: 14, color: '#AFA9EC', margin: '0 0 2rem' }}>{usuario?.email}</p>

        <a href="/nueva" style={{ display: 'block', width: '100%', padding: '0.9rem', background: '#7F77DD', border: 'none', borderRadius: 8, color: '#EEEDFE', fontSize: 15, fontWeight: 500, cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>
          Crear nueva celebración 🎉
        </a>
      </div>
    </main>
  )
}