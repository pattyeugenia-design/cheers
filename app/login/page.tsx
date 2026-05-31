'use client'

import { supabase } from '../supabase'

export default function Login() {
  async function loginConGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '2rem' }}>
      <div style={{ background: '#EEEDFE', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <p style={{ fontSize: 48, margin: '0 0 8px' }}>🥂</p>
        <h1 style={{ fontSize: 24, fontWeight: 500, color: '#3C3489', margin: '0 0 8px' }}>Bienvenido a Cheers</h1>
        <p style={{ fontSize: 14, color: '#534AB7', margin: '0 0 2rem' }}>Tu celebración, a tu manera</p>

        <button onClick={loginConGoogle} style={{ width: '100%', padding: '0.9rem', background: '#7F77DD', border: 'none', borderRadius: 8, color: '#EEEDFE', fontSize: 15, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          Entrar con Google →
        </button>
      </div>
    </main>
  )
}