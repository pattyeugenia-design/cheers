'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from './supabase'

const translations = {
  es: {
    nav_how: 'Cómo funciona',
    nav_prices: 'Precios',
    nav_cta: 'Entrar',
    h1: 'La celebración,\nen un link.',
    sub: 'Sin grupos de WhatsApp. Sin regalos duplicados.\nTodo el plan, en un link que tus invitados abren y entienden.',
    cta_google: 'Continuar con Google',
    beta: 'BETA ABIERTA',
    social_proof: 'Más de 200 celebraciones organizadas',
    demo_label: 'ASÍ SE VE CHEERS',
    demo_event: 'Cumpleaños de Mia',
    demo_date: 'Sábado 24 de agosto',
    demo_plan: 'EL PLAN',
    demo_stops: [
      { hora: '7pm', lugar: 'Cocteles en casa de Diego', nota: 'BYOB' },
      { hora: '9pm', lugar: 'Cena en Mochomos', nota: 'Reservación hecha' },
      { hora: '11pm', lugar: 'Pepper Nightclub', nota: 'Lista VIP' },
    ],
    demo_gifts: 'LISTA DE REGALOS',
    demo_gift_items: [{ name: 'Juego de copas', status: 'Reservado', taken: true }, { name: 'Fondo para el viaje', status: 'Disponible', taken: false }],
    demo_rsvp: 'Confirmar asistencia',
    demo_confirmed: '12 confirmados',
    how_label: 'CÓMO FUNCIONA',
    how_title: 'Tres pasos.\nTodo resuelto.',
    steps: [
      { n: '01', title: 'Crea', desc: 'Elige el tipo de celebración y arma el plan: fecha, paradas y todo lo importante.' },
      { n: '02', title: 'Comparte', desc: 'Invita a tu gente con un link personalizado. Ellos confirman en segundos.' },
      { n: '03', title: 'Disfruta', desc: 'Sigue confirmaciones y regalos en un solo lugar, y enfócate en la fiesta.' },
    ],
    social_label: 'LO QUE DICEN',
    testimonials: [
      { text: '"Organicé el cumpleaños de mi mamá en una tarde. Todos confirmaron sin que yo tuviera que perseguir a nadie."', name: 'Renata G.', role: 'Organizó un cumpleaños sorpresa' },
      { text: '"El link lo compartí en el grupo y en 2 horas ya tenía 15 confirmados. Nunca había sido tan fácil."', name: 'Carlos M.', role: 'Organizó una cena de 30 personas' },
      { text: '"Como invitada es increíble — ves todo el plan, confirmas y sabes exactamente qué traer."', name: 'Sofía L.', role: 'Invitada frecuente' },
    ],
    prices_label: 'PRECIOS',
    prices_title: 'Empieza gratis.\nMejora cuando quieras.',
    plans: [
      { name: 'Free', price: '$0', sub: 'para siempre', features: ['1 celebración activa', 'Hasta 3 invitados', '1 parada', 'Lista de regalos básica'], cta: 'Empezar gratis', featured: false },
      { name: 'Pro', price: '$9', sub: 'por celebración', features: ['Hasta 10 invitados', '3 paradas', 'Lista de regalos', 'Modo sorpresa', 'Personalización completa'], cta: 'Empezar con Pro', featured: true, badge: 'MÁS POPULAR' },
      { name: 'Lifetime', price: '$49', sub: 'pago único', features: ['Todo ilimitado', 'Para siempre', 'Temas premium', 'Soporte prioritario'], cta: 'Comprar Lifetime', featured: false },
    ],
    cta_title: '¿Lista para celebrar?',
    cta_sub: 'Crea tu primera celebración en menos de 2 minutos.',
    cta_btn: 'Empezar gratis',
    no_cc: 'Gratis para siempre · Sin tarjeta de crédito',
    footer: 'joincheers.app · 2026',
  },
  en: {
    nav_how: 'How it works',
    nav_prices: 'Pricing',
    nav_cta: 'Sign in',
    h1: 'The celebration,\nin one link.',
    sub: 'No group chat chaos. No duplicate gifts.\nEveryone gets the plan, in one link they open and understand.',
    cta_google: 'Continue with Google',
    beta: 'OPEN BETA',
    social_proof: 'Over 200 celebrations organized',
    demo_label: 'WHAT CHEERS LOOKS LIKE',
    demo_event: "Mia's Birthday",
    demo_date: 'Saturday, August 24',
    demo_plan: 'THE PLAN',
    demo_stops: [
      { hora: '7pm', lugar: "Cocktails at Diego's", nota: 'BYOB' },
      { hora: '9pm', lugar: 'Dinner at Mochomos', nota: 'Reservation made' },
      { hora: '11pm', lugar: 'Pepper Nightclub', nota: 'VIP list' },
    ],
    demo_gifts: 'GIFT LIST',
    demo_gift_items: [{ name: 'Wine glasses set', status: 'Reserved', taken: true }, { name: 'Travel fund', status: 'Available', taken: false }],
    demo_rsvp: 'Confirm attendance',
    demo_confirmed: '12 confirmed',
    how_label: 'HOW IT WORKS',
    how_title: 'Three steps.\nEverything sorted.',
    steps: [
      { n: '01', title: 'Create', desc: 'Choose the celebration type and build the plan: date, stops, and everything that matters.' },
      { n: '02', title: 'Share', desc: 'Invite your people with a personalized link. They confirm in seconds.' },
      { n: '03', title: 'Enjoy', desc: 'Track confirmations and gifts in one place, and focus on the party.' },
    ],
    social_label: 'WHAT THEY SAY',
    testimonials: [
      { text: '"I organized my mom\'s birthday in an afternoon. Everyone confirmed without me chasing anyone."', name: 'Renata G.', role: 'Organized a surprise birthday' },
      { text: '"I shared the link in the group and in 2 hours had 15 confirmations. Never been this easy."', name: 'Carlos M.', role: 'Organized a dinner for 30' },
      { text: '"As a guest it\'s amazing — you see the full plan, confirm, and know exactly what to bring."', name: 'Sofia L.', role: 'Frequent guest' },
    ],
    prices_label: 'PRICING',
    prices_title: 'Start free.\nUpgrade when you want.',
    plans: [
      { name: 'Free', price: '$0', sub: 'forever', features: ['1 active celebration', 'Up to 3 guests', '1 stop', 'Basic gift list'], cta: 'Start free', featured: false },
      { name: 'Pro', price: '$9', sub: 'per celebration', features: ['Up to 10 guests', '3 stops', 'Gift list', 'Surprise mode', 'Full personalization'], cta: 'Start with Pro', featured: true, badge: 'MOST POPULAR' },
      { name: 'Lifetime', price: '$49', sub: 'one-time', features: ['Everything unlimited', 'Forever', 'Premium themes', 'Priority support'], cta: 'Buy Lifetime', featured: false },
    ],
    cta_title: 'Ready to celebrate?',
    cta_sub: 'Create your first celebration in less than 2 minutes.',
    cta_btn: 'Start free',
    no_cc: 'Free forever · No credit card required',
    footer: 'joincheers.app · 2026',
  }
}

export default function Home() {
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [cargando, setCargando] = useState(false)
  const [testimonioActivo, setTestimonioActivo] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tx = translations[lang]

  useEffect(() => {
    const browserLang = navigator.language?.toLowerCase() || 'es'
    setLang(browserLang.startsWith('en') ? 'en' : 'es')

    const checkSize = () => {
      setIsMobile(window.innerWidth < 640)
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024)
    }
    checkSize()
    window.addEventListener('resize', checkSize)

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const { data: perfil } = await supabase.from('perfiles').select('username').eq('user_id', data.session.user.id).single()
        if (perfil?.username) window.location.href = `/${perfil.username}`
        else window.location.href = '/onboarding'
      }
    })

    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => { window.removeEventListener('scroll', handleScroll); window.removeEventListener('resize', checkSize) }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonioActivo(prev => (prev + 1) % tx.testimonials.length)
    }, 4500)
    return () => clearInterval(interval)
  }, [tx.testimonials.length])

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return
    const ctx = cv.getContext('2d'); if (!ctx) return
    let raf: number
    const dpr = window.devicePixelRatio || 1
    const resize = () => { cv.width = window.innerWidth * dpr; cv.height = window.innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    resize()
    window.addEventListener('resize', resize)
    const particles: any[] = []
    for (let i = 0; i < 50; i++) {
      particles.push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, size: Math.random() * 2.5 + 0.5, speedX: (Math.random() - 0.5) * 0.25, speedY: (Math.random() - 0.5) * 0.25, opacity: Math.random() * 0.4 + 0.1, color: Math.random() > 0.5 ? '#534AB7' : '#D4537E' })
    }
    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      particles.forEach(p => {
        p.x += p.speedX; p.y += p.speedY
        if (p.x < 0) p.x = window.innerWidth; if (p.x > window.innerWidth) p.x = 0
        if (p.y < 0) p.y = window.innerHeight; if (p.y > window.innerHeight) p.y = 0
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color; ctx.globalAlpha = p.opacity; ctx.fill()
      })
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  async function loginConGoogle() {
    setCargando(true)
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/login` } })
  }

  const F = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif'
  const isSmall = isMobile || isTablet
  const px = isMobile ? '20px' : isTablet ? '32px' : '48px'

  const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  )

  return (
    <main style={{ minHeight: '100vh', fontFamily: F, color: '#fff', background: '#0d0b1a', position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(212,83,126,.4)} 50%{box-shadow:0 0 0 14px rgba(212,83,126,0)} }
        @keyframes clinkL { 0%,100%{transform:rotate(12deg)} 45%,55%{transform:rotate(3deg)} }
        @keyframes clinkR { 0%,100%{transform:rotate(-12deg)} 45%,55%{transform:rotate(-3deg)} }
        .btn-g:hover { transform: translateY(-2px); box-shadow: 0 20px 48px rgba(212,83,126,.55) !important; }
        .btn-g { transition: transform .15s, box-shadow .15s; }
        .card-h { transition: transform .2s; }
        .card-h:hover { transform: translateY(-4px); }
        .nav-link { transition: color .15s; }
        .nav-link:hover { color: #fff !important; }
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: `0 ${px}`, height: isMobile ? 56 : 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: scrolled ? 'rgba(13,11,26,.9)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,.06)' : 'none', transition: 'all .3s' }}>
        <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 800, background: 'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-.5px' }}>Cheers</div>
        <div style={{ display: 'flex', gap: isMobile ? 16 : 28, alignItems: 'center' }}>
          {!isMobile && (
            <>
              <a href="#como-funciona" className="nav-link" style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}>{tx.nav_how}</a>
              <a href="#precios" className="nav-link" style={{ fontSize: 14, color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}>{tx.nav_prices}</a>
            </>
          )}
          <button onClick={loginConGoogle} style={{ fontSize: 13, fontWeight: 700, background: 'rgba(255,255,255,.08)', color: '#fff', padding: isMobile ? '7px 14px' : '8px 18px', borderRadius: 99, border: '1px solid rgba(255,255,255,.12)', cursor: 'pointer', fontFamily: F }}>
            {tx.nav_cta}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: isMobile ? '100px 20px 60px' : isTablet ? '100px 32px 60px' : '80px 48px 60px', position: 'relative', zIndex: 1 }}>
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: isMobile ? 320 : 700, height: 400, background: 'radial-gradient(ellipse, rgba(83,74,183,.3) 0%, rgba(212,83,126,.15) 50%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: isSmall ? '1fr' : '1fr 1fr', gap: isSmall ? 48 : 80, alignItems: 'center' }}>

          {/* Texto */}
          <div style={{ animation: 'fadeUp .6s ease both', textAlign: isMobile ? 'center' : 'left' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 99, padding: '6px 14px', marginBottom: 24 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', fontWeight: 600, letterSpacing: '.5px' }}>{tx.beta}</span>
            </div>

            <h1 style={{ fontSize: isMobile ? 48 : isTablet ? 58 : 72, fontWeight: 900, letterSpacing: isMobile ? '-2px' : '-3px', lineHeight: 1, margin: '0 0 20px', color: '#fff' }}>
              {tx.h1.split('\n').map((line, i) => (
                <span key={i}>
                  {i === 0 ? line : <><br /><span style={{ background: 'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{line}</span></>}
                </span>
              ))}
            </h1>

            <p style={{ fontSize: isMobile ? 16 : 18, color: 'rgba(255,255,255,.5)', lineHeight: 1.7, margin: '0 0 36px', maxWidth: isMobile ? '100%' : 440 }}>
              {tx.sub.split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
            </p>

            <button className="btn-g" onClick={loginConGoogle} disabled={cargando} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: isMobile ? '14px 22px' : '16px 28px', background: 'linear-gradient(135deg,#534AB7,#D4537E)', border: 'none', borderRadius: 16, color: '#fff', fontSize: isMobile ? 15 : 16, fontWeight: 700, cursor: 'pointer', fontFamily: F, boxShadow: '0 12px 32px rgba(212,83,126,.4)', marginBottom: 14, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <GoogleIcon />
              {cargando ? '...' : tx.cta_google}
            </button>

            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', margin: '0 0 24px' }}>{tx.no_cc}</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <div style={{ display: 'flex' }}>
                {['M', 'C', 'S', 'R'].map((l, i) => (
                  <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', background: `linear-gradient(135deg,${i % 2 === 0 ? '#534AB7,#7b6fd0' : '#D4537E,#a14b9c'})`, border: '2px solid #0d0b1a', marginLeft: i > 0 ? -7 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>{l}</div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', margin: 0 }}>{tx.social_proof}</p>
            </div>
          </div>

          {/* Demo card */}
          <div style={{ display: 'flex', justifyContent: 'center', animation: 'fadeUp .6s .2s ease both', opacity: 0, animationFillMode: 'forwards' }}>
            <div style={{ animation: 'float 5s ease-in-out infinite', width: '100%', maxWidth: isMobile ? 320 : 340, position: 'relative' }}>
              <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 28, overflow: 'hidden', backdropFilter: 'blur(20px)', boxShadow: '0 40px 100px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.06)' }}>
                <div style={{ background: 'linear-gradient(135deg,#534AB7,#D4537E)', padding: isMobile ? '18px 16px' : '24px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.7)', letterSpacing: '1.5px', marginBottom: 5 }}>BDAY</div>
                  <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 850, color: '#fff', marginBottom: 3 }}>{tx.demo_event}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginBottom: 8 }}>{tx.demo_date}</div>
                  <div style={{ display: 'inline-block', background: 'rgba(255,255,255,.15)', borderRadius: 99, padding: '3px 12px', fontSize: 11, fontWeight: 700, color: '#fff' }}>{tx.demo_confirmed}</div>
                </div>
                <div style={{ padding: isMobile ? '12px 14px' : '16px 18px' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.4)', letterSpacing: '1px', marginBottom: 8 }}>{tx.demo_plan}</div>
                  {tx.demo_stops.map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < 2 ? 8 : 12, paddingBottom: i < 2 ? 8 : 0, borderBottom: i < 2 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#a89df0', minWidth: 26, flexShrink: 0 }}>{p.hora}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{p.lugar}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 1 }}>{p.nota}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.4)', letterSpacing: '1px', marginBottom: 6 }}>{tx.demo_gifts}</div>
                  {tx.demo_gift_items.map((g, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 8px', background: 'rgba(255,255,255,.04)', borderRadius: 8, marginBottom: 5, border: '1px solid rgba(255,255,255,.05)' }}>
                      <span style={{ fontSize: 12, color: g.taken ? 'rgba(255,255,255,.3)' : '#fff', textDecoration: g.taken ? 'line-through' : 'none' }}>{g.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: g.taken ? '#a89df0' : '#4ade80' }}>{g.status}</span>
                    </div>
                  ))}
                  <button style={{ width: '100%', marginTop: 6, padding: '11px', background: 'linear-gradient(135deg,#534AB7,#D4537E)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: F }}>{tx.demo_rsvp}</button>
                </div>
              </div>
              <div style={{ position: 'absolute', top: -12, right: -12, background: 'linear-gradient(135deg,#534AB7,#D4537E)', borderRadius: 10, padding: '6px 12px', fontSize: 11, fontWeight: 800, color: '#fff', boxShadow: '0 6px 16px rgba(212,83,126,.4)', border: '2px solid #0d0b1a' }}>joincheers.app</div>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" style={{ padding: isMobile ? '64px 20px' : isTablet ? '80px 32px' : '100px 48px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#a89df0', letterSpacing: '2px', marginBottom: 14 }}>{tx.how_label}</p>
            <h2 style={{ fontSize: isMobile ? 36 : isTablet ? 44 : 52, fontWeight: 900, letterSpacing: isMobile ? '-1.5px' : '-2px', color: '#fff', margin: 0, lineHeight: 1.05 }}>
              {tx.how_title.split('\n').map((l, i) => <span key={i}>{l}{i === 0 && <br />}</span>)}
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 16 }}>
            {tx.steps.map((s, i) => (
              <div key={s.n} className="card-h" style={{ padding: isMobile ? '28px 22px' : '36px 28px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -10, right: 16, fontSize: isMobile ? 60 : 80, fontWeight: 900, color: i === 0 ? 'rgba(83,74,183,.15)' : i === 1 ? 'rgba(212,83,126,.15)' : 'rgba(168,157,240,.15)', letterSpacing: '-4px', lineHeight: 1 }}>{s.n}</div>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: i === 0 ? 'rgba(83,74,183,.2)' : i === 1 ? 'rgba(212,83,126,.2)' : 'rgba(168,157,240,.2)', border: `1px solid ${i === 0 ? 'rgba(83,74,183,.4)' : i === 1 ? 'rgba(212,83,126,.4)' : 'rgba(168,157,240,.4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: i === 0 ? '#a89df0' : i === 1 ? '#f08cb0' : '#c4bbf8' }}>{s.n}</span>
                </div>
                <h3 style={{ fontSize: isMobile ? 20 : 22, fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: '-.5px' }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,.4)', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section style={{ padding: isMobile ? '60px 20px' : isTablet ? '72px 32px' : '80px 48px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#a89df0', letterSpacing: '2px', marginBottom: 40 }}>{tx.social_label}</p>
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 24, padding: isMobile ? '28px 20px' : '44px 40px' }}>
            <div style={{ fontSize: isMobile ? 44 : 56, background: 'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1, marginBottom: 8 }}>"</div>
            <p style={{ fontSize: isMobile ? 16 : 19, color: 'rgba(255,255,255,.8)', lineHeight: 1.65, margin: '0 0 24px', fontWeight: 400, minHeight: isMobile ? 60 : 80 }}>{tx.testimonials[testimonioActivo].text}</p>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{tx.testimonials[testimonioActivo].name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)' }}>{tx.testimonials[testimonioActivo].role}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
            {tx.testimonials.map((_, i) => (
              <button key={i} onClick={() => setTestimonioActivo(i)} style={{ width: i === testimonioActivo ? 24 : 8, height: 8, borderRadius: 4, background: i === testimonioActivo ? 'linear-gradient(135deg,#534AB7,#D4537E)' : 'rgba(255,255,255,.15)', border: 'none', cursor: 'pointer', transition: 'all .3s' }} />
            ))}
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" style={{ padding: isMobile ? '64px 20px' : isTablet ? '80px 32px' : '100px 48px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 60 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#a89df0', letterSpacing: '2px', marginBottom: 14 }}>{tx.prices_label}</p>
            <h2 style={{ fontSize: isMobile ? 36 : isTablet ? 44 : 52, fontWeight: 900, letterSpacing: isMobile ? '-1.5px' : '-2px', color: '#fff', margin: 0, lineHeight: 1.05 }}>
              {tx.prices_title.split('\n').map((l, i) => <span key={i}>{l}{i === 0 && <br />}</span>)}
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 16 }}>
            {tx.plans.map(p => (
              <div key={p.name} className="card-h" style={{ padding: isMobile ? '24px 20px' : '32px 24px', borderRadius: 24, background: p.featured ? 'linear-gradient(160deg,#534AB7,#7b46a8 50%,#D4537E)' : 'rgba(255,255,255,.03)', border: p.featured ? 'none' : '1px solid rgba(255,255,255,.07)', position: 'relative', boxShadow: p.featured ? '0 20px 60px rgba(212,83,126,.4)' : 'none' }}>
                {p.featured && 'badge' in p && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#534AB7', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 99, letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                    {(p as any).badge}
                  </div>
                )}
                <div style={{ fontSize: 13, fontWeight: 700, color: p.featured ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.4)', marginBottom: 8 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: isMobile ? 40 : 46, fontWeight: 900, color: '#fff', letterSpacing: '-2px', lineHeight: 1 }}>{p.price}</span>
                  <span style={{ fontSize: 13, color: p.featured ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.35)' }}>USD</span>
                </div>
                <div style={{ fontSize: 12, color: p.featured ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.3)', marginBottom: 24 }}>{p.sub}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 15, height: 15, borderRadius: '50%', background: p.featured ? 'rgba(255,255,255,.2)' : 'rgba(83,74,183,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 8, color: p.featured ? '#fff' : '#a89df0', fontWeight: 800 }}>✓</span>
                      </div>
                      <span style={{ fontSize: 13, color: p.featured ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.45)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={loginConGoogle} style={{ width: '100%', padding: '12px', background: p.featured ? '#fff' : 'rgba(255,255,255,.07)', color: p.featured ? '#534AB7' : 'rgba(255,255,255,.55)', border: p.featured ? 'none' : '1px solid rgba(255,255,255,.1)', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: F, transition: 'all .15s' }}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: isMobile ? '64px 20px' : isTablet ? '80px 32px' : '100px 48px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 250, background: 'radial-gradient(ellipse, rgba(212,83,126,.25) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <h2 style={{ fontSize: isMobile ? 36 : isTablet ? 44 : 52, fontWeight: 900, letterSpacing: isMobile ? '-1.5px' : '-2px', color: '#fff', margin: '0 0 14px', lineHeight: 1.05, position: 'relative' }}>{tx.cta_title}</h2>
          <p style={{ fontSize: isMobile ? 15 : 17, color: 'rgba(255,255,255,.4)', margin: '0 0 36px', position: 'relative' }}>{tx.cta_sub}</p>
          <button className="btn-g" onClick={loginConGoogle} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: isMobile ? '14px 24px' : '17px 32px', background: 'linear-gradient(135deg,#534AB7,#D4537E)', border: 'none', borderRadius: 16, color: '#fff', fontSize: isMobile ? 15 : 17, fontWeight: 800, cursor: 'pointer', fontFamily: F, boxShadow: '0 16px 40px rgba(212,83,126,.45)', position: 'relative', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
            <GoogleIcon />
            {tx.cta_btn}
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: `20px ${px}`, borderTop: '1px solid rgba(255,255,255,.05)', display: 'flex', justifyContent: isMobile ? 'center' : 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800, background: 'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Cheers</div>
        {!isMobile && <p style={{ fontSize: 12, color: 'rgba(255,255,255,.2)', margin: 0 }}>{tx.footer}</p>}
      </footer>
    </main>
  )
}