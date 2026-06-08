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
    demo_plan: 'El plan',
    demo_confirmed: 'confirmados',
    demo_gifts: 'Gift ideas',
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
    demo_plan: 'The plan',
    demo_confirmed: 'confirmed',
    demo_gifts: 'Gift ideas',
  }
}

const ChampagneAnimation = () => (
  <div style={{ position: 'relative', width: 280, height: 340, margin: '0 auto' }}>
    <style>{`
      @keyframes bubble1 { 0% { transform: translateY(0) translateX(0); opacity: 0.8; } 100% { transform: translateY(-120px) translateX(4px); opacity: 0; } }
      @keyframes bubble2 { 0% { transform: translateY(0) translateX(0); opacity: 0.6; } 100% { transform: translateY(-100px) translateX(-6px); opacity: 0; } }
      @keyframes bubble3 { 0% { transform: translateY(0); opacity: 0.9; } 100% { transform: translateY(-140px) translateX(8px); opacity: 0; } }
      @keyframes pour { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.04); } }
      @keyframes sparkle { 0%, 100% { opacity: 0; transform: scale(0.5); } 50% { opacity: 1; transform: scale(1.2); } }
      @keyframes sway { 0%, 100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
      @keyframes liquid { 0%, 100% { d: path("M60,180 Q80,175 100,180 Q120,185 140,180 L140,240 Q120,238 100,240 Q80,242 60,240 Z"); } 50% { d: path("M60,180 Q80,185 100,178 Q120,172 140,180 L140,240 Q120,242 100,238 Q80,234 60,240 Z"); } }
      .bubble { position: absolute; border-radius: 50%; background: rgba(212,83,126,0.3); border: 1px solid rgba(212,83,126,0.5); }
      .b1 { width: 8px; height: 8px; left: 115px; top: 220px; animation: bubble1 2s ease-in infinite; }
      .b2 { width: 5px; height: 5px; left: 128px; top: 230px; animation: bubble2 2.4s ease-in infinite 0.6s; }
      .b3 { width: 6px; height: 6px; left: 105px; top: 210px; animation: bubble3 1.8s ease-in infinite 1.2s; }
      .b4 { width: 4px; height: 4px; left: 135px; top: 225px; animation: bubble1 2.2s ease-in infinite 0.3s; }
      .b5 { width: 7px; height: 7px; left: 110px; top: 235px; animation: bubble2 2.6s ease-in infinite 0.9s; }
      .b6 { width: 5px; height: 5px; left: 122px; top: 215px; animation: bubble3 2s ease-in infinite 1.5s; }
      .sparkle { position: absolute; color: #D4537E; animation: sparkle 1.5s ease-in-out infinite; font-size: 16px; }
      .s1 { left: 50px; top: 60px; animation-delay: 0s; }
      .s2 { left: 200px; top: 80px; animation-delay: 0.5s; }
      .s3 { left: 30px; top: 150px; animation-delay: 1s; }
      .s4 { left: 220px; top: 140px; animation-delay: 0.8s; }
      .s5 { left: 160px; top: 40px; animation-delay: 0.3s; }
      .glass { animation: sway 4s ease-in-out infinite; transform-origin: bottom center; }
    `}</style>

    <span className="sparkle s1">✦</span>
    <span className="sparkle s2">✦</span>
    <span className="sparkle s3">✦</span>
    <span className="sparkle s4">✦</span>
    <span className="sparkle s5">✦</span>

    <svg className="glass" viewBox="0 0 200 320" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="champagne" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f5c842" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#f7d76b" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#f5c842" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="glass" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D4537E" stopOpacity="0.15" />
          <stop offset="30%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#D4537E" stopOpacity="0.1" />
        </linearGradient>
        <clipPath id="glassClip">
          <path d="M55,60 L75,230 Q100,245 125,230 L145,60 Z" />
        </clipPath>
      </defs>

      {/* Stem */}
      <rect x="95" y="230" width="10" height="60" fill="#D4537E" opacity="0.3" rx="3" />
      {/* Base */}
      <ellipse cx="100" cy="292" rx="35" ry="8" fill="#D4537E" opacity="0.2" />
      <ellipse cx="100" cy="290" rx="32" ry="6" fill="#D4537E" opacity="0.15" rx="4" />

      {/* Glass body */}
      <path d="M55,60 L75,230 Q100,245 125,230 L145,60 Z" fill="url(#glass)" stroke="#D4537E" strokeWidth="1.5" strokeOpacity="0.4" />

      {/* Liquid fill */}
      <g clipPath="url(#glassClip)">
        <rect x="55" y="140" width="90" height="100" fill="url(#champagne)" opacity="0.85" />
        {/* Liquid surface animation */}
        <ellipse cx="100" cy="140" rx="42" ry="5" fill="#f7d76b" opacity="0.6">
          <animate attributeName="ry" values="5;7;5" dur="2s" repeatCount="indefinite" />
          <animate attributeName="cy" values="140;138;140" dur="2s" repeatCount="indefinite" />
        </ellipse>
        {/* Shimmer */}
        <rect x="68" y="145" width="4" height="80" fill="white" opacity="0.2" rx="2" />
        <rect x="78" y="148" width="2" height="70" fill="white" opacity="0.15" rx="1" />
      </g>

      {/* Glass outline top */}
      <path d="M55,60 L145,60" stroke="#D4537E" strokeWidth="2" strokeOpacity="0.5" strokeLinecap="round" />

      {/* Rim glow */}
      <ellipse cx="100" cy="60" rx="45" ry="4" fill="none" stroke="#D4537E" strokeWidth="1" strokeOpacity="0.3" />
    </svg>

    <div className="bubble b1" />
    <div className="bubble b2" />
    <div className="bubble b3" />
    <div className="bubble b4" />
    <div className="bubble b5" />
    <div className="bubble b6" />
  </div>
)

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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

        {/* ANIMACIÓN CHAMPAGNE */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
          <ChampagneAnimation />
        </div>
      </section>

      {/* TIPOS */}
      <section style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', padding: '0 40px 70px' }}>
        {[
          { icon: '🎂', label: lang === 'es' ? 'Cumpleaños' : 'Birthday' },
          { icon: '💍', label: lang === 'es' ? 'Boda' : 'Wedding' },
          { icon: '👑', label: lang === 'es' ? 'XV años' : 'Quinceañera' },
          { icon: '🎓', label: lang === 'es' ? 'Graduación' : 'Graduation' },
          { icon: '🍼', label: 'Baby shower' },
          { icon: '💃', label: 'Bachelorette' },
          { icon: '✨', label: lang === 'es' ? 'Otro festejo' : 'Other' },
        ].map(t => (
          <span key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 20, border: '0.5px solid #e0e0e0', background: '#f5f5f7', fontSize: 13, color: '#6e6e73' }}>
            {t.icon} {t.label}
          </span>
        ))}
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" style={{ padding: '70px 40px', background: '#f5f5f7' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: '#6e6e73', letterSpacing: '1px', marginBottom: 10 }}>{tx.s1_label}</p>
          <h2 style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.8px', color: '#1d1d1f', marginBottom: 48, lineHeight: 1.2 }}>{tx.s1_title}</h2>
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
          <h2 style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.8px', color: '#1d1d1f', marginBottom: 48, lineHeight: 1.2 }}>{tx.s3_title}</h2>
          <div style={{ background: '#f5f5f7', borderRadius: 20, padding: '40px 40px 32px' }}>
            <p style={{ fontSize: 48, color: '#D4537E', marginBottom: 8, lineHeight: 1 }}>"</p>
            <p style={{ fontSize: 18, color: '#1d1d1f', lineHeight: 1.6, marginBottom: 20 }}>
              {tx.testimonials[testimonioActivo].text}
            </p>
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
          <h2 style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.8px', color: '#1d1d1f', marginBottom: 48, lineHeight: 1.2 }}>{tx.s2_title}</h2>
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