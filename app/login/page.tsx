'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.location.href = '/dashboard'
      }
    })
  }, [])

  async function loginConGoogle() {
    setCargando(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `https://joincheers.app/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  if (cargando) return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#AFA9EC', fontSize: 18, fontFamily: 'sans-serif' }}>Entrando... 🥂</p>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '2rem' }}>
      <div style={{ background: '#EEEDFE', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <p style={{ fontSize: 48, margin: '0 0 8px' }}>🥂</p>
        <h1 style={{ fontSize: 24, fontWeight: 500, color: '#3C3489', margin: '0 0 8px' }}>Bienvenido a Cheers</h1>
        <p style={{ fontSize: 14, color: '#534AB7', margin: '0 0 2rem' }}>Tu celebración, a tu manera</p>
        <button onClick={loginConGoogle} style={{ width: '100%', padding: '0.9rem', background: '#7F77DD', border: 'none', borderRadius: 8, color: '#EEEDFE', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
          Entrar con Google →
        </button>
      </div>
    </main>
  )
}