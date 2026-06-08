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
    demo_plan: 'EL PLAN',
    demo_confirmed: 'confirmados',
    demo_gifts: 'GIFT IDEAS',
    demo_stops: [
      { hora: '7pm', lugar: '🏠 Pre en casa de Diego', nota: 'BYOB' },
      { hora: '9pm', lugar: '🍽️ Cena en Mochomos', nota: 'Reservación hecha' },
      { hora: '11pm', lugar: '🎉 Pepper Nightclub', nota: 'Lista VIP' },
    ],
    demo_gifts_items: ['🛍️ Liverpool', '📦 Amazon', '🌸 EnviaFlores'],
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
    demo_plan: 'THE PLAN',
    demo_confirmed: 'confirmed',
    demo_gifts: 'GIFT IDEAS',
    demo_stops: [
      { hora: '7pm', lugar: '🏠 Diego\'s Home', nota: 'BYOB' },
      { hora: '9pm', lugar: '🍽️ Dinner at Mochomos', nota: 'Reservation made' },
      { hora: '11pm', lugar: '🎉 Pepper Nightclub', nota: 'VIP list' },
    ],
    demo_gifts_items: ['🛍️ Liverpool', '📦 Amazon', '🌸 EnviaFlores'],
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
      if (data.session) { window.location.href = '/dashboard' } else { setCargando(false) }
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
    <main style={{ minHeight: '100vh', background: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#1d1d1f', position: 'relative', zIndex: 2 }}>

      <style>{`
        @keyframes clinkL { 0%,100%{transform:rotate(15deg)} 45%,55%{transform:rotate(4deg)} }
        @keyframes clinkR { 0%,100%{transform:rotate(-15deg)} 45%,55%{transform:rotate(-4deg)} }
        @keyframes splash { 0%,40%{opacity:0;transform:scale(0) translateX(-50%)} 50%{opacity:1;transform:scale(1) translateX(-50%)} 80%,100%{opacity:0;transform:scale(1.6) translateX(-50%)} }
        @keyframes bubble { 0%{transform:translateY(0);opacity:.7} 100%{transform:translateY(-55px);opacity:0} }
        @keyframes sparkleLocal { 0%,100%{opacity:0;transform:scale(.3)} 50%{opacity:1;transform:scale(1.2)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>

      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 48px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
        <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #534AB7, #D4537E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Cheers</span>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <a href="#como-funciona" style={{ fontSize: 14, color: '#6e6e73', textDecoration: 'none' }}>{tx.nav_how}</a>
          <a href="#precios" style={{ fontSize: 14, color: '#6e6e73', textDecoration: 'none' }}>{tx.nav_prices}</a>
          <button onClick={loginConGoogle} style={{ fontSize: 14, fontWeight: 500, background: 'linear-gradient(135deg, #534AB7, #D4537E)', color: '#fff', padding: '10px 22px', borderRadius: 22, border: 'none', cursor: 'none' }}>{tx.nav_cta}</button>
        </div>
      </nav>

      {/* HERO — fondo con gradiente sutil */}
      <section style={{ background: 'linear-gradient(160deg, #faf9ff 0%, #fff5f8 50%, #faf9ff 100%)', padding: '0 0 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', maxWidth: 1200, margin: '0 auto', padding: '80px 60px 40px', gap: 60, alignItems: 'center' }}>

          {/* IZQUIERDA — texto */}
          <div>
            <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, rgba(83,74,183,0.1), rgba(212,83,126,0.1))', border: '1px solid rgba(212,83,126,0.2)', borderRadius: 20, padding: '6px 14px', marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#D4537E', letterSpacing: '1px', margin: 0 }}>{tx.eyebrow}</p>
            </div>
            <h1 style={{ fontSize: 64, fontWeight: 700, letterSpacing: '-3px', lineHeight: 1.02, marginBottom: 20, color: '#1d1d1f' }}>
              {tx.h1a}<br />
              {tx.h1b} <span style={{ background: 'linear-gradient(135deg, #534AB7, #D4537E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{tx.h1c}</span>
            </h1>
            <p style={{ fontSize: 18, color: '#6e6e73', marginBottom: 40, lineHeight: 1.65, maxWidth: 420 }}>{tx.sub}</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
              <button onClick={loginConGoogle} style={{ fontSize: 16, fontWeight: 600, background: 'linear-gradient(135deg, #534AB7, #D4537E)', color: '#fff', padding: '15px 30px', borderRadius: 28, border: 'none', cursor: 'none', boxShadow: '0 4px 20px rgba(212,83,126,0.35)' }}>{tx.cta}</button>
              <a href="#como-funciona" style={{ fontSize: 16, fontWeight: 500, color: '#1d1d1f', padding: '15px 30px', borderRadius: 28, border: '1.5px solid #e0e0e0', textDecoration: 'none', background: '#fff' }}>{tx.how}</a>
            </div>
            {/* Store buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              {['App Store', 'Google Play'].map(store => (
                <div key={store} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: '1px solid #e0e0e0', borderRadius: 14, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <span style={{ fontSize: 20 }}>{store === 'App Store' ? '🍎' : '▶️'}</span>
                  <div>
                    <p style={{ fontSize: 9, color: '#aeaeb2', margin: 0 }}>{tx.coming_soon}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', margin: 0 }}>{store}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DERECHA — copas arriba + preview abajo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

            {/* COPAS */}
            <div style={{ position: 'relative', height: 320, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {[{ left: 20, top: 30, delay: '0s', size: 14 }, { left: 260, top: 40, delay: '0.6s', size: 14 }, { left: 40, top: 110, delay: '1.1s', size: 10 }, { left: 250, top: 100, delay: '0.3s', size: 10 }, { left: 140, top: 10, delay: '0.8s', size: 12 }].map((s, i) => (
                <div key={i} style={{ position: 'absolute', left: s.left, top: s.top, color: '#D4537E', fontSize: s.size, animation: `sparkleLocal 2s ease-in-out infinite ${s.delay}`, pointerEvents: 'none' }}>✦</div>
              ))}
              <div style={{ position: 'absolute', top: 45, left: '50%', animation: 'splash 3s ease-in-out infinite', pointerEvents: 'none', zIndex: 5 }}>
                <svg viewBox="0 0 90 70" width="80" height="60">
                  <g fill="#f7d76b" opacity="0.9">
                    <circle cx="45" cy="45" r="5" /><ellipse cx="45" cy="26" rx="4" ry="10" />
                    <ellipse cx="28" cy="32" rx="3" ry="9" transform="rotate(-30 28 32)" />
                    <ellipse cx="62" cy="32" rx="3" ry="9" transform="rotate(30 62 32)" />
                    <ellipse cx="20" cy="46" rx="3" ry="7" transform="rotate(-60 20 46)" />
                    <ellipse cx="70" cy="46" rx="3" ry="7" transform="rotate(60 70 46)" />
                  </g>
                </svg>
              </div>
              <svg viewBox="0 0 360 280" width="300" height="280" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="liq" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f5c842" stopOpacity="0.85" /><stop offset="50%" stopColor="#f7d76b" /><stop offset="100%" stopColor="#f5c842" stopOpacity="0.85" />
                  </linearGradient>
                  <linearGradient id="gl" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#D4537E" stopOpacity="0.1" /><stop offset="40%" stopColor="#fff" stopOpacity="0.5" /><stop offset="100%" stopColor="#D4537E" stopOpacity="0.08" />
                  </linearGradient>
                  <clipPath id="c1"><path d="M20,20 L42,145 Q62,160 82,145 L104,20 Z" /></clipPath>
                  <clipPath id="c2"><path d="M256,20 L278,145 Q298,160 318,145 L340,20 Z" /></clipPath>
                </defs>
                <g style={{ transformOrigin: '62px 260px', animation: 'clinkL 3s ease-in-out infinite' }}>
                  <path d="M20,20 L42,145 Q62,160 82,145 L104,20 Z" fill="url(#gl)" stroke="#D4537E" strokeWidth="1.5" strokeOpacity="0.35" />
                  <g clipPath="url(#c1)">
                    <rect x="20" y="75" width="84" height="78" fill="url(#liq)" opacity="0.88" />
                    <ellipse cx="62" cy="75" rx="40" ry="6" fill="#f7d76b" opacity="0.7"><animate attributeName="ry" values="6;9;6" dur="2s" repeatCount="indefinite" /></ellipse>
                    <rect x="35" y="80" width="3" height="58" fill="white" opacity="0.22" rx="1.5" />
                  </g>
                  <line x1="20" y1="20" x2="104" y2="20" stroke="#D4537E" strokeWidth="2" strokeOpacity="0.45" strokeLinecap="round" />
                  <rect x="58" y="146" width="8" height="96" fill="#D4537E" opacity="0.2" rx="4" />
                  <ellipse cx="62" cy="244" rx="32" ry="7" fill="#D4537E" opacity="0.14" />
                </g>
                <g style={{ transformOrigin: '298px 260px', animation: 'clinkR 3s ease-in-out infinite' }}>
                  <path d="M256,20 L278,145 Q298,160 318,145 L340,20 Z" fill="url(#gl)" stroke="#D4537E" strokeWidth="1.5" strokeOpacity="0.35" />
                  <g clipPath="url(#c2)">
                    <rect x="256" y="75" width="84" height="78" fill="url(#liq)" opacity="0.88" />
                    <ellipse cx="298" cy="75" rx="40" ry="6" fill="#f7d76b" opacity="0.7"><animate attributeName="ry" values="6;9;6" dur="2s" repeatCount="indefinite" /></ellipse>
                    <rect x="310" y="80" width="3" height="58" fill="white" opacity="0.22" rx="1.5" />
                  </g>
                  <line x1="256" y1="20" x2="340" y2="20" stroke="#D4537E" strokeWidth="2" strokeOpacity="0.45" strokeLinecap="round" />
                  <rect x="294" y="146" width="8" height="96" fill="#D4537E" opacity="0.2" rx="4" />
                  <ellipse cx="298" cy="244" rx="32" ry="7" fill="#D4537E" opacity="0.14" />
                </g>
              </svg>
              {[{ left: 100, top: 160, size: 6, delay: '0s', dur: '2s' }, { left: 113, top: 175, size: 4, delay: '0.7s', dur: '2.3s' }].map((b, i) => (
                <div key={i} style={{ position: 'absolute', width: b.size, height: b.size, left: b.left, top: b.top, borderRadius: '50%', background: 'rgba(247,215,107,0.5)', border: '1px solid rgba(247,215,107,0.8)', animation: `bubble ${b.dur} ease-in infinite ${b.delay}` }} />
              ))}
              {[{ left: 195, top: 160, size: 6, delay: '0.4s', dur: '2.1s' }, { left: 208, top: 175, size: 4, delay: '1.1s', dur: '2.4s' }].map((b, i) => (
                <div key={`r${i}`} style={{ position: 'absolute', width: b.size, height: b.size, left: b.left, top: b.top, borderRadius: '50%', background: 'rgba(247,215,107,0.5)', border: '1px solid rgba(247,215,107,0.8)', animation: `bubble ${b.dur} ease-in infinite ${b.delay}` }} />
              ))}
            </div>

            {/* PREVIEW del evento — debajo de las copas, flotando */}
            <div style={{ width: '100%', animation: 'float 4s ease-in-out infinite', boxShadow: '0 20px 60px rgba(83,74,183,0.15), 0 4px 20px rgba(212,83,126,0.1)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #534AB7 0%, #D4537E 100%)', padding: '16px 20px', textAlign: 'center', color: '#fff' }}>
                <p style={{ fontSize: 28, margin: '0 0 4px' }}>🎂</p>
                <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 2px' }}>{lang === 'es' ? 'Los 30 de Rodrigo' : "Rodrigo's 30th"}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '0 0 6px' }}>joincheers.app/los-30-de-rodrigo</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', margin: 0 }}>🥂 12 {tx.demo_confirmed}</p>
              </div>
              <div style={{ background: '#f5f5f7', padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: '#fff', borderRadius: 10, padding: 12 }}>
                  <p style={{ fontSize: 9, color: '#aeaeb2', fontWeight: 600, marginBottom: 8, letterSpacing: '0.5px' }}>🗺️ {tx.demo_plan}</p>
                  {tx.demo_stops.map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < 2 ? 8 : 0, paddingBottom: i < 2 ? 8 : 0, borderBottom: i < 2 ? '0.5px solid #f0f0f0' : 'none' }}>
                      <span style={{ fontSize: 10, color: '#D4537E', fontWeight: 600, minWidth: 24 }}>{p.hora}</span>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 500, color: '#1d1d1f', margin: '0 0 1px' }}>{p.lugar}</p>
                        <p style={{ fontSize: 10, color: '#aeaeb2', margin: 0 }}>{p.nota}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#fff', borderRadius: 10, padding: 12 }}>
                  <p style={{ fontSize: 9, color: '#aeaeb2', fontWeight: 600, marginBottom: 8, letterSpacing: '0.5px' }}>🎁 {tx.demo_gifts}</p>
                  {tx.demo_gifts_items.map(g => (
                    <p key={g} style={{ fontSize: 11, padding: '5px 8px', background: '#f5f5f7', borderRadius: 6, color: '#6e6e73', margin: '0 0 6px' }}>{g}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TIPOS */}
      <section style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', padding: '48px 40px' }}>
        {tx.tipos.map(t => (
          <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 22, border: '1px solid #e8e8e8', background: '#fafafa', fontSize: 13, color: '#6e6e73', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>{t}</span>
        ))}
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" style={{ padding: '80px 48px', background: 'linear-gradient(160deg, #faf9ff 0%, #fff5f8 100%)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#D4537E', letterSpacing: '1.5px', marginBottom: 12, textAlign: 'center' }}>{tx.s1_label}</p>
          <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-1.2px', color: '#1d1d1f', marginBottom: 56, textAlign: 'center' }}>{tx.s1_title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {tx.steps.map((s, idx) => (
              <div key={s.n} style={{ padding: 32, background: '#fff', borderRadius: 20, border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 16, right: 20, fontSize: 48, fontWeight: 800, color: idx === 0 ? 'rgba(83,74,183,0.06)' : idx === 1 ? 'rgba(212,83,126,0.06)' : 'rgba(186,117,23,0.06)', letterSpacing: '-2px' }}>{s.n}</div>
                <p style={{ fontSize: 32, marginBottom: 16 }}>{s.icon}</p>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1d1d1f', marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: '#6e6e73', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section style={{ padding: '80px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#D4537E', letterSpacing: '1.5px', marginBottom: 12 }}>{tx.s3_label}</p>
          <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-1.2px', color: '#1d1d1f', marginBottom: 56 }}>{tx.s3_title}</h2>
          <div style={{ background: 'linear-gradient(160deg, #faf9ff 0%, #fff5f8 100%)', borderRadius: 24, padding: '48px 48px 40px', border: '1px solid rgba(212,83,126,0.1)', boxShadow: '0 8px 32px rgba(83,74,183,0.08)' }}>
            <p style={{ fontSize: 56, background: 'linear-gradient(135deg, #534AB7, #D4537E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8, lineHeight: 1 }}>"</p>
            <p style={{ fontSize: 20, color: '#1d1d1f', lineHeight: 1.65, marginBottom: 24, fontWeight: 400 }}>{tx.testimonials[testimonioActivo].text}</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f', margin: '0 0 4px' }}>{tx.testimonials[testimonioActivo].name}</p>
            <p style={{ fontSize: 13, color: '#aeaeb2', margin: 0 }}>{tx.testimonials[testimonioActivo].role}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
            {tx.testimonials.map((_, i) => (
              <button key={i} onClick={() => setTestimonioActivo(i)} style={{ width: i === testimonioActivo ? 28 : 8, height: 8, borderRadius: 4, background: i === testimonioActivo ? '#D4537E' : '#e0e0e0', border: 'none', cursor: 'none', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" style={{ padding: '80px 48px', background: 'linear-gradient(160deg, #faf9ff 0%, #fff5f8 100%)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#D4537E', letterSpacing: '1.5px', marginBottom: 12, textAlign: 'center' }}>{tx.s2_label}</p>
          <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-1.2px', color: '#1d1d1f', marginBottom: 56, textAlign: 'center' }}>{tx.s2_title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {tx.plans.map(p => (
              <div key={p.name} style={{ padding: '32px 28px', borderRadius: 24, border: p.featured ? 'none' : '1px solid #f0f0f0', background: p.featured ? 'linear-gradient(160deg, #534AB7 0%, #D4537E 100%)' : '#fff', position: 'relative', boxShadow: p.featured ? '0 12px 40px rgba(212,83,126,0.3)' : '0 4px 16px rgba(0,0,0,0.05)' }}>
                {p.featured && 'badge' in p && (
                  <span style={{ position: 'absolute', top: -14, left: 24, fontSize: 11, fontWeight: 600, background: '#fff', color: '#D4537E', padding: '5px 14px', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>{(p as any).badge}</span>
                )}
                <p style={{ fontSize: 13, color: p.featured ? 'rgba(255,255,255,0.7)' : '#6e6e73', marginBottom: 8 }}>{p.name}</p>
                <p style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-2px', color: p.featured ? '#fff' : '#1d1d1f', marginBottom: 4, lineHeight: 1 }}>
                  {p.price} <span style={{ fontSize: 16, fontWeight: 400, color: p.featured ? 'rgba(255,255,255,0.7)' : '#6e6e73' }}>USD</span>
                </p>
                <p style={{ fontSize: 12, color: p.featured ? 'rgba(255,255,255,0.6)' : '#aeaeb2', marginBottom: 24 }}>{p.sub}</p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, padding: 0, marginBottom: 28 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ fontSize: 14, color: p.featured ? 'rgba(255,255,255,0.9)' : '#6e6e73', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: p.featured ? '#f7d76b' : '#1D9E75', fontSize: 16 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={loginConGoogle} style={{ width: '100%', padding: '14px', background: p.featured ? '#fff' : 'linear-gradient(135deg, #534AB7, #D4537E)', color: p.featured ? '#D4537E' : '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: 'none' }}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '100px 48px', background: '#fff', textAlign: 'center' }}>
        <h2 style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-2px', color: '#1d1d1f', marginBottom: 16 }}>{tx.cta_title}</h2>
        <p style={{ fontSize: 18, color: '#6e6e73', marginBottom: 40 }}>{tx.cta_sub}</p>
        <button onClick={loginConGoogle} style={{ fontSize: 18, fontWeight: 600, background: 'linear-gradient(135deg, #534AB7, #D4537E)', color: '#fff', padding: '18px 44px', borderRadius: 32, border: 'none', cursor: 'none', boxShadow: '0 8px 30px rgba(212,83,126,0.35)' }}>{tx.cta_btn}</button>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '32px 48px', borderTop: '0.5px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 600, background: 'linear-gradient(135deg, #534AB7, #D4537E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Cheers</span>
        <p style={{ fontSize: 12, color: '#aeaeb2' }}>joincheers.app · 2026</p>
      </footer>

    </main>
  )
}