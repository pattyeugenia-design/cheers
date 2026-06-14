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

  const piezas = [
    { left: -30, top: -60,  size: 22, delay: '0s',    dur: '2.4s', emoji: '✦' },
    { left: 40,  top: -90,  size: 16, delay: '0.3s',  dur: '2.8s', emoji: '✦' },
    { left: -70, top: -10,  size: 14, delay: '0.6s',  dur: '2.2s', emoji: '✦' },
    { left: 80,  top: -30,  size: 20, delay: '0.9s',  dur: '2.6s', emoji: '✦' },
    { left: -10, top: -110, size: 18, delay: '1.2s',  dur: '2.5s', emoji: '✦' },
    { left: 60,  top: -80,  size: 12, delay: '0.4s',  dur: '2.3s', emoji: '✦' },
    { left: -50, top: -90,  size: 16, delay: '1.5s',  dur: '2.7s', emoji: '✦' },
    { left: 20,  top: -50,  size: 14, delay: '0.8s',  dur: '2.4s', emoji: '✦' },
  ]

  if (cargando) return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <p style={{ color: '#AFA9EC', fontSize: 16 }}>Entrando... 🥂</p>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: '2rem' }}>
      <style>{`
        @keyframes popperShake {
          0%, 100% { transform: rotate(-8deg); }
          50% { transform: rotate(4deg); }
        }
        @keyframes confettiPop {
          0% { transform: translate(0,0) scale(0.3) rotate(0deg); opacity: 0; }
          15% { opacity: 1; transform: translate(0,0) scale(1) rotate(0deg); }
          100% { transform: translate(var(--tx), var(--ty)) scale(0.6) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4rem', maxWidth: 900, width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>

        {/* Card de login - izquierda */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '2.75rem 2.5rem', width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}>
          <p style={{ fontSize: 48, margin: '0 0 12px' }}>🥂</p>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: '#1d1d1f', margin: '0 0 8px' }}>Bienvenido a Cheers</h1>
          <p style={{ fontSize: 14, color: '#6e6e73', margin: '0 0 2rem' }}>Tu celebración, a tu manera</p>
          <button onClick={loginConGoogle} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #534AB7, #D4537E)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 24px rgba(212,83,126,0.3)' }}>
            Entrar con Google →
          </button>
        </div>

        {/* Popper animado con confetti - derecha */}
        <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 90, animation: 'popperShake 1.8s ease-in-out infinite', transformOrigin: '70% 90%' }}>
            🎉
          </div>
          {piezas.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '58%',
                top: '38%',
                fontSize: p.size,
                color: i % 2 === 0 ? '#D4537E' : '#7F77DD',
                animation: `confettiPop ${p.dur} ease-out infinite ${p.delay}`,
                ['--tx' as any]: `${p.left}px`,
                ['--ty' as any]: `${p.top}px`,
                ['--rot' as any]: `${p.left > 0 ? 180 : -180}deg`,
                pointerEvents: 'none',
              }}
            >
              {p.emoji}
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}