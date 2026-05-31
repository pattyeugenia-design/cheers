'use client'

import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function Home() {
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      setCargando(true)
      setTimeout(async () => {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          window.location.href = '/dashboard'
        } else {
          setCargando(false)
        }
      }, 1500)
    }
  }, [])

  if (cargando) {
    return (
      <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#AFA9EC', fontSize: 18 }}>Entrando... 🥂</p>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1 style={{ color: '#EEEDFE', fontSize: 48, margin: '0 0 8px', fontWeight: 500 }}>Cheers</h1>
      <p style={{ color: '#AFA9EC', fontSize: 18, margin: '0 0 3rem' }}>Tu celebracion, a tu manera</p>
      <a href="/login" style={{ display: 'block', padding: '1rem 2.5rem', background: '#7F77DD', borderRadius: 12, color: '#EEEDFE', fontSize: 16, fontWeight: 500, textDecoration: 'none', textAlign: 'center' }}>
        Crear mi celebracion
      </a>
    </main>
  )
}