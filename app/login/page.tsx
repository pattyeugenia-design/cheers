'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    // Si ya hay sesión, ir al dashboard
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.location.href = '/dashboard'
      }
    })

    // Escuchar cuando llega el token del hash
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

  const confetti = [
    { left: '8%',  emoji: '🎉', size: 28, delay: '0s',   dur: '6s' },
    { left: '18%', emoji: '✦',  size: 16, delay: '1.2s', dur: '5s' },
    { left: '28%', emoji: '🎊', size: 24, delay: '0.5s', dur: '7s' },
    { left: '40%', emoji: '✦',  size: 14, delay: '2s',   dur: '5.5s' },
    { left: '52%', emoji: '🎉', size: 22, delay: '0.8s', dur: '6.5s' },
    { left: '64%', emoji: '✦',  size: 18, delay: '1.6s', dur: '5s' },
    { left: '74%', emoji: '🎊', size: 26, delay: '0.3s', dur: '7.5s' },
    { left: '86%', emoji: '✦',  size: 15, delay: '2.4s', dur: '5.8s' },
    { left: '94%', emoji: '🎉', size: 20, delay: '1.1s', dur: '6.2s' },
  ]

  if (cargando) return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <p style={{ color: '#AFA9EC', fontSize: 16 }}>Entrando... 🥂</p>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes caer {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
      `}</style>

      {confetti.map((c, i) => (
        <div key={i} style={{ position: 'absolute', top: 0, left: c.left, fontSize: c.size, animation: `caer ${c.dur} linear infinite ${c.delay}`, pointerEvents: 'none', color: '#D4537E' }}>
          {c.emoji}
        </div>
      ))}

      <div style={{ background: '#fff', borderRadius: 24, padding: '2.75rem 2.5rem', width: '100%', maxWidth: 420, textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', position: 'relative', zIndex: 2 }}>
        <p style={{ fontSize: 48, margin: '0 0 12px' }}>🥂</p>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: '#1d1d1f', margin: '0 0 8px' }}>Bienvenido a Cheers</h1>
        <p style={{ fontSize: 14, color: '#6e6e73', margin: '0 0 2rem' }}>Tu celebración, a tu manera</p>
        <button onClick={loginConGoogle} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #534AB7, #D4537E)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 24px rgba(212,83,126,0.3)' }}>
          Entrar con Google →
        </button>
      </div>
    </main>
  )
}