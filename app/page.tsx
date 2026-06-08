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
      if (session) window.location.href = '/dashboard'
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loginConGoogle() {
    setCargando(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://joincheers.app/login' },
    })
  }

  if (cargando) return (
    <main style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 32 }}>🥂</span>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#1d1d1f' }}>

      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 40px', borderBottom: '0.5px solid #e0e0e0', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.3px' }}>Cheers</span>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          <a href="#como-funciona" style={{ fontSize: 14, color: '#6e6e73', textDecoration: 'none' }}>Cómo funciona</a>
          <a href="#precios" style={{ fontSize: 14, color: '#6e6e73', textDecoration: 'none' }}>Precios</a>
          <button onClick={loginConGoogle} style={{ fontSize: 14, fontWeight: 500, background: '#1d1d1f', color: '#fff', padding: '9px 20px', borderRadius: 22, border: 'none', cursor: 'pointer' }}>
            Empezar gratis
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '90px 40px 70px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: '#D4537E', letterSpacing: '1px', marginBottom: 16 }}>PARA CADA CELEBRACIÓN</p>
        <h1 style={{ fontSize: 56, fontWeight: 500, letterSpacing: '-2px', lineHeight: 1.08, marginBottom: 20, color: '#1d1d1f' }}>
          Organízate para<br />
          cualquier <span style={{ color: '#D4537E' }}>celebración</span>
        </h1>
        <p style={{ fontSize: 18, color: '#6e6e73', maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.6 }}>
          Sin grupos de WhatsApp. Sin regalos duplicados. El festejado en control, los invitados siempre informados.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={loginConGoogle} style={{ fontSize: 16, fontWeight: 500, background: '#1d1d1f', color: '#fff', padding: '14px 30px', borderRadius: 24, border: 'none', cursor: 'pointer' }}>
            Crear mi celebración
          </button>
          <a href="#como-funciona" style={{ fontSize: 16, fontWeight: 500, background: 'transparent', color: '#1d1d1f', padding: '14px 30px', borderRadius: 24, border: '0.5px solid #c0c0c0', textDecoration: 'none' }}>
            Ver cómo funciona
          </a>
        </div>
      </section>

      {/* TIPOS */}
      <section style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', padding: '0 40px 70px' }}>
        {[
          { icon: '🎂', label: 'Cumpleaños' },
          { icon: '💍', label: 'Boda' },
          { icon: '👑', label: 'XV años' },
          { icon: '🎓', label: 'Graduación' },
          { icon: '🍼', label: 'Baby shower' },
          { icon: '💃', label: 'Bachelorette' },
          { icon: '✨', label: 'Otro festejo' },
        ].map(t => (
          <span key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 20, border: '0.5px solid #e0e0e0', background: '#f5f5f7', fontSize: 13, color: '#6e6e73' }}>
            {t.icon} {t.label}
          </span>
        ))}
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" style={{ padding: '70px 40px', background: '#f5f5f7' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: '#6e6e73', letterSpacing: '1px', marginBottom: 10 }}>CÓMO FUNCIONA</p>
          <h2 style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.8px', color: '#1d1d1f', marginBottom: 48, lineHeight: 1.2 }}>Tres pasos y listo</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { n: '01', icon: '🎉', title: 'Crea tu celebración', desc: 'Define el plan, las paradas, los horarios y tus gift ideas en minutos.' },
              { n: '02', icon: '🔗', title: 'Comparte el link', desc: 'Un solo link. Todos ven el plan completo y confirman asistencia.' },
              { n: '03', icon: '🥂', title: 'Disfruta', desc: 'Recibe notificaciones. Ellos saben qué traer. Sin caos, sin grupos.' },
            ].map(s => (
              <div key={s.n} style={{ padding: 28, background: '#fff', borderRadius: 16, border: '0.5px solid #e0e0e0' }}>
                <p style={{ fontSize: 11, color: '#aeaeb2', marginBottom: 14 }}>{s.n}</p>
                <p style={{ fontSize: 28, marginBottom: 14 }}>{s.icon}</p>
                <h3 style={{ fontSize: 16, fontWeight: 500, color: '#1d1d1f', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" style={{ padding: '70px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: '#6e6e73', letterSpacing: '1px', marginBottom: 10 }}>PRECIOS</p>
          <h2 style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.8px', color: '#1d1d1f', marginBottom: 48, lineHeight: 1.2 }}>Simple y sin sorpresas</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              {
                name: 'Free', price: '$0', sub: 'Para invitados', featured: false,
                features: ['Ver el evento', 'Confirmar asistencia', 'Ver lista de regalos']
              },
              {
                name: 'Event', price: '$9', sub: '1er mes · +$3 USD/mes adicional', featured: true,
                features: ['1 evento activo', 'Hasta 50 invitados', 'Notificaciones por email', 'Recordatorios automáticos', 'Personalización del evento']
              },
              {
                name: 'Lifetime', price: '$49', sub: 'Pago único · para siempre', featured: false,
                features: ['Eventos ilimitados', 'Todo incluido', 'Acceso de por vida']
              },
            ].map(p => (
              <div key={p.name} style={{ padding: '28px 24px', borderRadius: 20, border: p.featured ? '2px solid #007AFF' : '0.5px solid #e0e0e0', background: '#fff', position: 'relative' }}>
                {p.featured && (
                  <span style={{ position: 'absolute', top: -12, left: 20, fontSize: 11, fontWeight: 500, background: '#E6F1FB', color: '#185FA5', padding: '4px 12px', borderRadius: 8 }}>
                    Más popular
                  </span>
                )}
                <p style={{ fontSize: 12, color: '#6e6e73', marginBottom: 6 }}>{p.name}</p>
                <p style={{ fontSize: 38, fontWeight: 500, letterSpacing: '-1px', color: '#1d1d1f', marginBottom: 4 }}>
                  {p.price} <span style={{ fontSize: 14, fontWeight: 400, color: '#6e6e73' }}>USD</span>
                </p>
                <p style={{ fontSize: 12, color: '#aeaeb2', marginBottom: 22 }}>{p.sub}</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ fontSize: 13, color: '#6e6e73', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#1D9E75', fontSize: 15 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={loginConGoogle} style={{ width: '100%', marginTop: 24, padding: '12px', background: p.featured ? '#1d1d1f' : 'transparent', color: p.featured ? '#fff' : '#1d1d1f', border: p.featured ? 'none' : '0.5px solid #c0c0c0', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  {p.name === 'Free' ? 'Entrar gratis' : 'Empezar'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '70px 40px', background: '#f5f5f7', textAlign: 'center' }}>
        <h2 style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.8px', color: '#1d1d1f', marginBottom: 14 }}>Lista para celebrar</h2>
        <p style={{ fontSize: 17, color: '#6e6e73', marginBottom: 32 }}>Crea tu primera celebración en menos de 2 minutos.</p>
        <button onClick={loginConGoogle} style={{ fontSize: 16, fontWeight: 500, background: '#1d1d1f', color: '#fff', padding: '15px 36px', borderRadius: 24, border: 'none', cursor: 'pointer' }}>
          Empezar gratis
        </button>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '32px 40px', borderTop: '0.5px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: '#1d1d1f' }}>Cheers</span>
        <p style={{ fontSize: 12, color: '#aeaeb2' }}>joincheers.app · 2026</p>
      </footer>

    </main>
  )
}