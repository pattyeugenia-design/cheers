'use client'

import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function Home() {
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.location.href = '/dashboard'
      } else {
        setCargando(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        window.location.href = '/dashboard'
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loginConGoogle() {
    setCargando(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `https://joincheers.app/login`,
      },
    })
  }

  if (cargando) return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#AFA9EC', fontSize: 18, fontFamily: 'sans-serif' }}>🥂</p>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '2rem' }}>
      <p style={{ fontSize: 52, margin: '0 0 8px' }}>🥂</p>
      <h1 style={{ color: '#EEEDFE', fontSize: 42, margin: '0 0 8px', fontWeight: 500 }}>Cheers</h1>
      <p style={{ color: '#AFA9EC', fontSize: 16, margin: '0 0 3rem' }}>Tu celebración, a tu manera</p>
      <button onClick={loginConGoogle} style={{ padding: '1rem 2.5rem', background: '#7F77DD', border: 'none', borderRadius: 12, color: '#EEEDFE', fontSize: 16, fontWeight: 500, cursor: 'pointer' }}>
        Entrar con Google →
      </button>
    </main>
  )
}