'use client'

import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const translations = {
  es: {
    eyebrow: 'PARA CADA CELEBRACIÓN',
    h1a: 'Organízate para',
    h1b: 'cualquier',
    h1c: 'celebración',
    sub: 'Sin grupos de WhatsApp. Sin regalos duplicados. El festejado en control, los invitados siempre informados.',
    cta: 'Crear mi celebración',
    how: 'Ver cómo funciona',
    nav_how: 'Cómo funciona',
    nav_prices: 'Precios',
    nav_cta: 'Empezar gratis',
    s1_label: 'CÓMO FUNCIONA',
    s1_title: 'Tres pasos y listo',
    steps: [
      { n: '01', icon: '🎉', title: 'Crea tu celebración', desc: 'Define el plan, las paradas, los horarios y tus gift ideas en minutos.' },
      { n: '02', icon: '🔗', title: 'Comparte el link', desc: 'Un solo link. Todos ven el plan completo y confirman asistencia.' },
      { n: '03', icon: '🥂', title: 'Disfruta', desc: 'Recibe notificaciones. Ellos saben qué traer. Sin caos, sin grupos.' },
    ],
    s2_label: 'PRECIOS',
    s2_title: 'Simple y sin sorpresas',
    plans: [
      { name: 'Free', price: '$0', sub: 'Para invitados', features: ['Ver el evento', 'Confirmar asistencia', 'Ver lista de regalos'], cta: 'Entrar gratis', featured: false },
      { name: 'Event', price: '$9', sub: '1er mes · +$3 USD/mes adicional', features: ['1 evento activo', 'Hasta 50 invitados', 'Notificaciones por email', 'Recordatorios automáticos', 'Personalización del evento'], cta: 'Empezar', featured: true, badge: 'Más popular' },
      { name: 'Lifetime', price: '$49', sub: 'Pago único · para siempre', features: ['Eventos ilimitados', 'Todo incluido', 'Acceso de por vida'], cta: 'Empezar', featured: false },
    ],
    testimonials: [
      { name: 'Andrea M.', text: 'Mis 30 nunca estuvieron tan organizados. Todos sabían dónde ir y qué traer. 🥂', role: 'Festejada' },
      { name: 'Carlos R.', text: 'Organicé el bday de mi novia sin un solo mensaje de WhatsApp. Imposible pero real.', role: 'Organizador' },
      { name: 'Sofía L.', text: 'Como invitada es increíble — ves todo el plan, confirmas y listo. Nada más.', role: 'Invitada' },
      { name: 'Diego P.', text: 'La lista de regalos es un game changer. Ya no hay regalos duplicados.', role: 'Invitado' },
    ],
    s3_label: 'LO QUE DICEN',
    s3_title: 'Celebraciones reales',
    cta_title: 'Lista para celebrar',
    cta_sub: 'Crea tu primera celebración en menos de 2 minutos.',
    cta_btn: 'Empezar gratis',
    coming_soon: 'Próximamente',
    tipos: ['🎂 Cumpleaños', '💍 Boda', '👑 XV años', '🎓 Graduación', '🍼 Baby shower', '💃 Bachelorette', '✨ Otro festejo'],
  },
  en: {
    eyebrow: 'FOR EVERY CELEBRATION',
    h1a: 'Get organized for',
    h1b: 'any',
    h1c: 'celebration',
    sub: 'No WhatsApp groups. No duplicate gifts. The guest of honor in control, guests always informed.',
    cta: 'Create my celebration',
    how: 'See how it works',
    nav_how: 'How it works',
    nav_prices: 'Pricing',
    nav_cta: 'Start free',
    s1_label: 'HOW IT WORKS',
    s1_title: 'Three steps and done',
    steps: [
      { n: '01', icon: '🎉', title: 'Create your celebration', desc: 'Define the plan, stops, times, and gift ideas in minutes.' },
      { n: '02', icon: '🔗', title: 'Share the link', desc: 'One link. Everyone sees the full plan and confirms attendance.' },
      { n: '03', icon: '🥂', title: 'Enjoy', desc: 'You get notifications. They know what to bring. No chaos, no groups.' },
    ],
    s2_label: 'PRICING',
    s2_title: 'Simple and no surprises',
    plans: [
      { name: 'Free', price: '$0', sub: 'For guests', features: ['View the event', 'Confirm attendance', 'View gift list'], cta: 'Join free', featured: false },
      { name: 'Event', price: '$9', sub: '1st month · +$3 USD/month after', features: ['1 active event', 'Up to 50 guests', 'Email notifications', 'Automatic reminders', 'Event personalization'], cta: 'Get started', featured: true, badge: 'Most popular' },
      { name: 'Lifetime', price: '$49', sub: 'One-time payment · forever', features: ['Unlimited events', 'Everything included', 'Lifetime access'], cta: 'Get started', featured: false },
    ],
    testimonials: [
      { name: 'Andrea M.', text: 'My 30th birthday was so organized. Everyone knew where to go and what to bring. 🥂', role: 'Birthday girl' },
      { name: 'Carlos R.', text: 'I organized my girlfriend\'s birthday with zero WhatsApp messages. Impossible but real.', role: 'Organizer' },
      { name: 'Sofia L.', text: 'As a guest it\'s amazing — you see the full plan, confirm, and that\'s it.', role: 'Guest' },
      { name: 'Diego P.', text: 'The gift list is a game changer. No more duplicate gifts.', role: 'Guest' },
    ],
    s3_label: 'WHAT THEY SAY',
    s3_title: 'Real celebrations',
    cta_title: 'Ready to celebrate',
    cta_sub: 'Create your first celebration in less than 2 minutes.',
    cta_btn: 'Start free',
    coming_soon: 'Coming soon',
    tipos: ['🎂 Birthday', '💍 Wedding', '👑 Quinceañera', '🎓 Graduation', '🍼 Baby shower', '💃 Bachelorette', '✨ Other'],
  }
}

export default function Home() {
  const [cargando, setCargando] = useState(true)
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [testimonioActivo, setTestimonioActivo] = useState(0)
  const tx = translations[lang]

  useEffect(() => {
    const browserLang = navigator.language?.toLowerCase() || 'es'
    setLang(browserLang.startsWith('en') ? 'en' : 'es')
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.location.href = '/dashboard'
      } else {
        setCargando(false)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) window.location.href = '/dashboard'
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonioActivo(prev => (prev + 1) % tx.testimonials.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [tx.testimonials.length])

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

      <style>{`
        @keyframes clinkL {
          0%, 100% { transform: rotate(20deg); }
          45%, 55% { transform: rotate(5deg); }
        }
        @keyframes clinkR {
          0%, 100% { transform: rotate(-20deg); }
          45%, 55% { transform: rotate(-5deg); }
        }
        @keyframes splash {
          0%, 40% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
          80%, 100% { opacity: 0; transform: scale(1.5); }
        }
        @keyframes dropFly {
          0% { transform: translate(0, 0); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)); opacity: 0; }
        }
        @keyframes bubble {
          0% { transform: translateY(0); opacity: 0.7; }
          100% { transform: translateY(-50px); opacity: 0; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.3) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(20deg); }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 40px', borderBottom: '0.5px solid #e0e0e0', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.3px' }}>Cheers</span>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          <a href="#como-funciona" style={{ fontSize: 14, color: '#6e6e73', textDecoration: 'none' }}>{tx.nav_how}</a>
          <a href="#precios" style={{ fontSize: 14, color: '#6e6e73', textDecoration: 'none' }}>{tx.nav_prices}</a>
          <button onClick={loginConGoogle} style={{ fontSize: 14, fontWeight: 500, background: '#1d1d1f', color: '#fff', padding: '9px 20px', borderRadius: 22, border: 'none', cursor: 'pointer' }}>
            {tx.nav_cta}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, padding: '80px 60px', maxWidth: 1100, margin: '0 auto', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#D4537E', letterSpacing: '1px', marginBottom: 16 }}>{tx.eyebrow}</p>
          <h1 style={{ fontSize: 52, fontWeight: 500, letterSpacing: '-2px', lineHeight: 1.08, marginBottom: 20, color: '#1d1d1f' }}>
            {tx.h1a}<br />{tx.h1b} <span style={{ color: '#D4537E' }}>{tx.h1c}</span>
          </h1>
          <p style={{ fontSize: 17, color: '#6e6e73', marginBottom: 36, lineHeight: 1.6 }}>{tx.sub}</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={loginConGoogle} style={{ fontSize: 15, fontWeight: 500, background: '#1d1d1f', color: '#fff', padding: '14px 28px', borderRadius: 24, border: 'none', cursor: 'pointer' }}>
              {tx.cta}
            </button>
            <a href="#como-funciona" style={{ fontSize: 15, fontWeight: 500, color: '#1d1d1f', padding: '14px 28px', borderRadius: 24, border: '0.5px solid #c0c0c0', textDecoration: 'none' }}>
              {tx.how}
            </a>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
            {['App Store', 'Google Play'].map(store => (
              <div key={store} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: '0.5px solid #e0e0e0', borderRadius: 12, background: '#f5f5f7' }}>
                <span style={{ fontSize: 18 }}>{store === 'App Store' ? '🍎' : '▶️'}</span>
                <div>
                  <p style={{ fontSize: 9, color: '#aeaeb2', margin: 0 }}>{tx.coming_soon}</p>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#1d1d1f', margin: 0 }}>{store}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COPAS CHOCANDO */}
        <div style={{ position: 'relative', height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

          {/* Destellos */}
          {[
            { left: 30, top: 20, delay: '0s' },
            { left: 220, top: 30, delay: '0.6s' },
            { left: 15, top: 120, delay: '1.1s' },
            { left: 235, top: 100, delay: '0.3s' },
            { left: 120, top: 10, delay: '0.8s' },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', left: s.left, top: s.top, color: '#D4537E', fontSize: 14, animation: `sparkle 2s ease-in-out infinite ${s.delay}` }}>✦</div>
          ))}

          {/* Splash en el centro — aparece cuando chocan */}
          <div style={{ position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)', animation: 'splash 3s ease-in-out infinite', zIndex: 5, pointerEvents: 'none' }}>
            <svg viewBox="0 0 100 80" width="100" height="80">
              <g fill="#f7d76b" opacity="0.95">
                <circle cx="50" cy="50" r="5" />
                <ellipse cx="50" cy="30" rx="4" ry="10" />
                <ellipse cx="32" cy="36" rx="3" ry="9" transform="rotate(-30 32 36)" />
                <ellipse cx="68" cy="36" rx="3" ry="9" transform="rotate(30 68 36)" />
                <ellipse cx="22" cy="50" rx="3" ry="8" transform="rotate(-60 22 50)" />
                <ellipse cx="78" cy="50" rx="3" ry="8" transform="rotate(60 78 50)" />
              </g>
            </svg>
          </div>

          {/* Gotas volando */}
          {[
            { left: '46%', top: 95, tx: '-25px', ty: '-20px', delay: '1.35s' },
            { left: '54%', top: 90, tx: '25px', ty: '-25px', delay: '1.4s' },
            { left: '44%', top: 100, tx: '-35px', ty: '10px', delay: '1.45s' },
            { left: '56%', top: 95, tx: '35px', ty: '10px', delay: '1.38s' },
            { left: '50%', top: 85, tx: '0px', ty: '-30px', delay: '1.42s' },
          ].map((d, i) => (
            <div key={i} style={{
              position: 'absolute', left: d.left, top: d.top,
              width: 5, height: 9, borderRadius: '50%',
              background: '#f7d76b',
              animation: `dropFly 0.8s ease-out infinite 3s`,
              ['--tx' as any]: d.tx,
              ['--ty' as any]: d.ty,
              animationDelay: d.delay,
            }} />
          ))}

          {/* SVG con las dos copas */}
          <svg viewBox="0 0 280 340" width="280" height="340" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="liq" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f5c842" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#f7d76b" />
                <stop offset="100%" stopColor="#f5c842" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="gl" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D4537E" stopOpacity="0.1" />
                <stop offset="40%" stopColor="#fff" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#D4537E" stopOpacity="0.08" />
              </linearGradient>
              <clipPath id="c1"><path d="M30,30 L50,170 Q68,185 86,170 L106,30 Z" /></clipPath>
              <clipPath id="c2"><path d="M174,30 L194,170 Q212,185 230,170 L250,30 Z" /></clipPath>
            </defs>

            {/* COPA IZQUIERDA — rota hacia la derecha (hacia el centro) */}
            <g style={{ transformOrigin: '68px 300px', animation: 'clinkL 3s ease-in-out infinite' }}>
              <path d="M30,30 L50,170 Q68,185 86,170 L106,30 Z" fill="url(#gl)" stroke="#D4537E" strokeWidth="1.5" strokeOpacity="0.35" />
              <g clipPath="url(#c1)">
                <rect x="30" y="95" width="76" height="84" fill="url(#liq)" opacity="0.88" />
                <ellipse cx="68" cy="95" rx="36" ry="6" fill="#f7d76b" opacity="0.7">
                  <animate attributeName="ry" values="6;9;6" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="95;92;95" dur="2s" repeatCount="indefinite" />
                </ellipse>
                <rect x="42" y="100" width="3" height="65" fill="white" opacity="0.22" rx="1.5" />
              </g>
              <line x1="30" y1="30" x2="106" y2="30" stroke="#D4537E" strokeWidth="2" strokeOpacity="0.45" strokeLinecap="round" />
              <rect x="64" y="172" width="8" height="110" fill="#D4537E" opacity="0.2" rx="4" />
              <ellipse cx="68" cy="284" rx="30" ry="7" fill="#D4537E" opacity="0.14" />
            </g>

            {/* COPA DERECHA — rota hacia la izquierda (hacia el centro) */}
            <g style={{ transformOrigin: '212px 300px', animation: 'clinkR 3s ease-in-out infinite' }}>
              <path d="M174,30 L194,170 Q212,185 230,170 L250,30 Z" fill="url(#gl)" stroke="#D4537E" strokeWidth="1.5" strokeOpacity="0.35" />
              <g clipPath="url(#c2)">
                <rect x="174" y="95" width="76" height="84" fill="url(#liq)" opacity="0.88" />
                <ellipse cx="212" cy="95" rx="36" ry="6" fill="#f7d76b" opacity="0.7">
                  <animate attributeName="ry" values="6;9;6" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="cy" values="95;92;95" dur="2s" repeatCount="indefinite" />
                </ellipse>
                <rect x="222" y="100" width="3" height="65" fill="white" opacity="0.22" rx="1.5" />
              </g>
              <line x1="174" y1="30" x2="250" y2="30" stroke="#D4537E" strokeWidth="2" strokeOpacity="0.45" strokeLinecap="round" />
              <rect x="208" y="172" width="8" height="110" fill="#D4537E" opacity="0.2" rx="4" />
              <ellipse cx="212" cy="284" rx="30" ry="7" fill="#D4537E" opacity="0.14" />
            </g>
          </svg>

          {/* Burbujas izquierda */}
          {[
            { left: 85, top: 195, size: 6, delay: '0s', dur: '2s' },
            { left: 95, top: 210, size: 4, delay: '0.7s', dur: '2.3s' },
            { left: 78, top: 220, size: 5, delay: '1.4s', dur: '1.9s' },
          ].map((b, i) => (
            <div key={i} style={{ position: 'absolute', width: b.size, height: b.size, left: b.left, top: b.top, borderRadius: '50%', background: 'rgba(247,215,107,0.5)', border: '1px solid rgba(247,215,107,0.8)', animation: `bubble ${b.dur} ease-in infinite ${b.delay}` }} />
          ))}

          {/* Burbujas derecha */}
          {[
            { left: 175, top: 195, size: 6, delay: '0.4s', dur: '2.1s' },
            { left: 185, top: 210, size: 4, delay: '1.1s', dur: '2.4s' },
            { left: 168, top: 220, size: 5, delay: '0.2s', dur: '1.8s' },
          ].map((b, i) => (
            <div key={`r${i}`} style={{ position: 'absolute', width: b.size, height: b.size, left: b.left, top: b.top, borderRadius: '50%', background: 'rgba(247,215,107,0.5)', border: '1px solid rgba(247,215,107,0.8)', animation: `bubble ${b.dur} ease-in infinite ${b.delay}` }} />
          ))}
        </div>
      </section>

      {/* TIPOS */}
      <section style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', padding: '0 40px 70px' }}>
        {tx.tipos.map(t => (
          <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 20, border: '0.5px solid #e0e0e0', background: '#f5f5f7', fontSize: 13, color: '#6e6e73' }}>
            {t}
          </span>
        ))}
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" style={{ padding: '70px 40px', background: '#f5f5f7' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: '#6e6e73', letterSpacing: '1px', marginBottom: 10 }}>{tx.s1_label}</p>
          <h2 style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.8px', color: '#1d1d1f', marginBottom: 48 }}>{tx.s1_title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {tx.steps.map(s => (
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

      {/* TESTIMONIOS */}
      <section style={{ padding: '70px 40px', background: '#fff' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: '#6e6e73', letterSpacing: '1px', marginBottom: 10 }}>{tx.s3_label}</p>
          <h2 style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.8px', color: '#1d1d1f', marginBottom: 48 }}>{tx.s3_title}</h2>
          <div style={{ background: '#f5f5f7', borderRadius: 20, padding: '40px 40px 32px' }}>
            <p style={{ fontSize: 48, color: '#D4537E', marginBottom: 8, lineHeight: 1 }}>"</p>
            <p style={{ fontSize: 18, color: '#1d1d1f', lineHeight: 1.6, marginBottom: 20 }}>{tx.testimonials[testimonioActivo].text}</p>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#1d1d1f', margin: '0 0 2px' }}>{tx.testimonials[testimonioActivo].name}</p>
            <p style={{ fontSize: 12, color: '#aeaeb2', margin: 0 }}>{tx.testimonials[testimonioActivo].role}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
            {tx.testimonials.map((_, i) => (
              <button key={i} onClick={() => setTestimonioActivo(i)} style={{ width: i === testimonioActivo ? 24 : 8, height: 8, borderRadius: 4, background: i === testimonioActivo ? '#D4537E' : '#e0e0e0', border: 'none', cursor: 'pointer', transition: 'width 0.3s' }} />
            ))}
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" style={{ padding: '70px 40px', background: '#f5f5f7' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: '#6e6e73', letterSpacing: '1px', marginBottom: 10 }}>{tx.s2_label}</p>
          <h2 style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.8px', color: '#1d1d1f', marginBottom: 48 }}>{tx.s2_title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {tx.plans.map(p => (
              <div key={p.name} style={{ padding: '28px 24px', borderRadius: 20, border: p.featured ? '2px solid #007AFF' : '0.5px solid #e0e0e0', background: '#fff', position: 'relative' }}>
                {p.featured && 'badge' in p && (
                  <span style={{ position: 'absolute', top: -12, left: 20, fontSize: 11, fontWeight: 500, background: '#E6F1FB', color: '#185FA5', padding: '4px 12px', borderRadius: 8 }}>
                    {(p as any).badge}
                  </span>
                )}
                <p style={{ fontSize: 12, color: '#6e6e73', marginBottom: 6 }}>{p.name}</p>
                <p style={{ fontSize: 38, fontWeight: 500, letterSpacing: '-1px', color: '#1d1d1f', marginBottom: 4 }}>
                  {p.price} <span style={{ fontSize: 14, fontWeight: 400, color: '#6e6e73' }}>USD</span>
                </p>
                <p style={{ fontSize: 12, color: '#aeaeb2', marginBottom: 22 }}>{p.sub}</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9, padding: 0 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ fontSize: 13, color: '#6e6e73', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#1D9E75' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={loginConGoogle} style={{ width: '100%', marginTop: 24, padding: '12px', background: p.featured ? '#1d1d1f' : 'transparent', color: p.featured ? '#fff' : '#1d1d1f', border: p.featured ? 'none' : '0.5px solid #c0c0c0', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '70px 40px', background: '#fff', textAlign: 'center' }}>
        <h2 style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.8px', color: '#1d1d1f', marginBottom: 14 }}>{tx.cta_title}</h2>
        <p style={{ fontSize: 17, color: '#6e6e73', marginBottom: 32 }}>{tx.cta_sub}</p>
        <button onClick={loginConGoogle} style={{ fontSize: 16, fontWeight: 500, background: '#1d1d1f', color: '#fff', padding: '15px 36px', borderRadius: 24, border: 'none', cursor: 'pointer' }}>
          {tx.cta_btn}
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