'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { supabase } from '../supabase'

declare global { interface Window { google: any } }

type Step = 'type' | 'role' | 'celebrating' | 'success' | 'invite'
type TipoEvento = 'cumple' | 'cena' | 'viaje' | 'reunion' | 'evento' | 'otro' | null
type Rol = 'yo' | 'otro' | 'sorpresa' | null

const TIPOS = [
  { key: 'cumple',  label: 'Cumpleaños' },
  { key: 'cena',    label: 'Cena' },
  { key: 'viaje',   label: 'Viaje' },
  { key: 'reunion', label: 'Reunión' },
  { key: 'evento',  label: 'Evento grande' },
  { key: 'otro',    label: 'Otro' },
]

const CHIPS: Record<string, string> = {
  cumple: 'BDAY', cena: 'DINE', viaje: 'TRIP', reunion: 'MEET', evento: 'EVENT', otro: 'OTHER'
}

const STEP2: Record<string, { title: string; sub: string; open?: boolean; placeholder?: string }> = {
  viaje:   { title: '¿Qué tipo de viaje?', sub: 'Cuéntanos para personalizar tu plan.', open: true, placeholder: 'Ej: escapada a la playa, aventura en la montaña…' },
  cena:    { title: '¿Dónde va a ser la cena?', sub: 'Elige el tipo de cena que organizas.' },
  otro:    { title: '¿Qué van a celebrar?', sub: 'Escríbelo con tus palabras.', open: true, placeholder: 'Ej: reunión de trabajo, despedida de soltera…' },
  cumple:  { title: '¿Para quién es?', sub: 'Elige tu rol en la celebración.' },
  reunion: { title: '¿Para quién es?', sub: 'Elige tu rol en la celebración.' },
  evento:  { title: '¿Para quién es?', sub: 'Elige tu rol en la celebración.' },
}

const ROLES = [
  { key: 'yo',       label: 'Es mi celebración',                   sub: 'Yo soy el festejado y organizo mi propio evento' },
  { key: 'otro',     label: 'Organizo para alguien más',            sub: 'Organizo el evento de otra persona — ya sabe' },
  { key: 'sorpresa', label: 'Organizo para alguien más — sorpresa', sub: 'Organizo el evento de otra persona — no debe saber' },
]

const CENA_ROLES = [
  { key: 'casa',        label: 'En casa',        sub: 'Cena en casa, potluck o preparada en casa' },
  { key: 'restaurante', label: 'En restaurante',  sub: 'Reservación o salida a comer fuera' },
]

function slugify(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40)
}

export default function NuevaCelebracion() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('type')
  const [tipo, setTipo] = useState<TipoEvento>(null)
  const [rol, setRol] = useState<Rol>(null)
  const [customEvent, setCustomEvent] = useState('')
  const [titulo, setTitulo] = useState('')
  const [festejado, setFestejado] = useState('')
  const [fecha, setFecha] = useState('')
  const [lugar, setLugar] = useState('')
  const [userSlug, setUserSlug] = useState('')
  const [eventSlug, setEventSlug] = useState('')
  const [linkConfirmed, setLinkConfirmed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [inviteQuery, setInviteQuery] = useState('')
  const [invitados, setInvitados] = useState<{ id: string; name: string; email: string }[]>([])
  const [invited, setInvited] = useState<Record<string, boolean>>({})
  const [guardandoInvitados, setGuardandoInvitados] = useState(false)
  const [verificando, setVerificando] = useState(true)
  const [mapsListo, setMapsListo] = useState(false)
  const [userNombre, setUserNombre] = useState('')
  const [slugFinal, setSlugFinal] = useState('')
  const lugarRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const nombre = user.user_metadata?.name?.split(' ')[0] || 'tu'
      setUserNombre(nombre)
      setUserSlug(slugify(nombre))
      setVerificando(false)
    })
  }, [router])

  useEffect(() => {
    const COLORS = ['#D4537E', '#534AB7', '#7F77DD']
    let last = 0
    const sparkle = (e: MouseEvent) => {
      const now = performance.now()
      if (now - last < 22) return
      last = now
      const el = document.createElement('div')
      el.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;pointer-events:none;z-index:9999;font-size:${Math.random() * 10 + 10}px;color:${COLORS[Math.floor(Math.random() * 3)]};animation:destello 0.6s ease-out forwards;`
      el.textContent = '✦'
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 600)
    }
    document.addEventListener('mousemove', sparkle)
    return () => document.removeEventListener('mousemove', sparkle)
  }, [])

  useEffect(() => {
    if (!mapsListo || !lugarRef.current || lugarRef.current.dataset.init) return
    const ac = new window.google.maps.places.Autocomplete(lugarRef.current, { fields: ['name', 'place_id', 'formatted_address'] })
    ac.addListener('place_changed', () => {
      const p = ac.getPlace()
      if (!p) return
      setLugar(p.name || lugarRef.current?.value || '')
    })
    lugarRef.current.dataset.init = 'true'
  }, [mapsListo, step])

  useEffect(() => {
    if (!linkConfirmed && titulo) setEventSlug(slugify(titulo))
  }, [titulo, linkConfirmed])

  useEffect(() => {
    if (step !== 'celebrating') return
    fireConfetti(0)
    fireConfetti(550)
    setTimeout(() => setStep('success'), 1800)
  }, [step])

  function fireConfetti(delay: number) {
    setTimeout(() => {
      const cv = canvasRef.current; if (!cv) return
      const ctx = cv.getContext('2d'); if (!ctx) return
      const dpr = window.devicePixelRatio || 1
      const W = cv.offsetWidth, H = cv.offsetHeight
      cv.width = W * dpr; cv.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const colors = ['#534AB7', '#D4537E', '#EEEDFE', '#F5C04E', '#fff', '#8b7fe8']
      const parts: any[] = []
      for (let i = 0; i < 150; i++) {
        const a = Math.random() * Math.PI * 2
        const sp = 4 + Math.random() * 9
        parts.push({ x: W / 2, y: H * 0.4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, color: colors[Math.floor(Math.random() * colors.length)], w: 6 + Math.random() * 8, h: 3 + Math.random() * 5, rot: Math.random() * 360, rsp: (Math.random() - 0.5) * 8, life: 1 })
      }
      let raf: number
      const draw = () => {
        ctx.clearRect(0, 0, W, H)
        let alive = false
        for (const p of parts) {
          p.vy += 0.18; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.rsp; p.life -= 0.012
          if (p.life <= 0) continue; alive = true
          ctx.save(); ctx.globalAlpha = Math.max(0, p.life)
          ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180)
          ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
          ctx.restore()
        }
        if (alive) raf = requestAnimationFrame(draw)
      }
      raf = requestAnimationFrame(draw)
      setTimeout(() => cancelAnimationFrame(raf), 4000)
    }, delay)
  }

  async function guardar() {
    setSaving(true); setErrorMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    const slug = `${userSlug}/${eventSlug || slugify(titulo || customEvent || tipo || 'celebracion')}`
    setSlugFinal(slug)
    const { error } = await supabase.from('celebraciones').insert({
      nombre: titulo || customEvent || tipo,
      tipo,
      festejado_nombre: rol === 'yo' ? userNombre : festejado,
      organizador_id: user?.id || 'anonimo',
      slug,
      es_sorpresa: rol === 'sorpresa',
      paradas: lugar ? [{ lugar, hora: '', nota: '', waze: '', maps: '', link: '' }] : [],
      gifts: [],
      created_at: new Date().toISOString(),
    })
    setSaving(false)
    if (!error) { setStep('celebrating') }
    else if (error.code === '23505') setErrorMsg('Ya existe una celebración con ese nombre. Cambia el título.')
    else setErrorMsg('Algo salió mal. Intenta de nuevo.')
  }

  async function confirmarInvitados() {
    setGuardandoInvitados(true)
    const seleccionados = invitados.filter(i => invited[i.id])
    if (seleccionados.length > 0) {
      const rows = seleccionados.map(inv => ({
        celebracion_slug: slugFinal,
        email: inv.email.includes('@') ? inv.email : null,
        nombre: inv.name,
        user_id: null,
        created_at: new Date().toISOString(),
      }))
      await supabase.from('invitados').insert(rows)
    }
    setGuardandoInvitados(false)
    router.push(`/${slugFinal}`)
  }

  function agregarInvitado() {
    if (!inviteQuery.trim()) return
    const id = 'm' + Date.now()
    setInvitados(prev => [...prev, { id, name: inviteQuery.trim(), email: inviteQuery.trim() }])
    setInvited(prev => ({ ...prev, [id]: true }))
    setInviteQuery('')
  }

  function copyLink() {
    navigator.clipboard.writeText(`https://joincheers.app/${userSlug}/${eventSlug}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const chosenTipo = TIPOS.find(t => t.key === tipo)
  const step2cfg = tipo ? STEP2[tipo] : null
  const shareUrl = `joincheers.app/${userSlug}/${eventSlug || 'mi-evento'}`
  const invitedCount = Object.values(invited).filter(Boolean).length

  if (verificando) return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#faf9ff,#fff5f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system,sans-serif' }}>
      <p style={{ color: '#aeaeb2', fontSize: 14 }}>Cargando...</p>
    </main>
  )

  const F = '-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif'
  const bg = 'radial-gradient(circle at 12% 18%,rgba(127,119,221,.55),transparent 45%),radial-gradient(circle at 88% 82%,rgba(212,83,126,.5),transparent 50%),linear-gradient(160deg,#534AB7 0%,#7b46a8 52%,#D4537E 100%)'

  const btnPrimary = (disabled = false): React.CSSProperties => ({
    width: '100%', border: 'none', borderRadius: 18, padding: '17px', fontSize: 17, fontWeight: 700,
    fontFamily: F, cursor: disabled ? 'not-allowed' : 'pointer', color: disabled ? '#a79fc4' : '#fff',
    background: disabled ? '#EAE7F6' : 'linear-gradient(135deg,#534AB7,#D4537E)',
    boxShadow: disabled ? 'none' : '0 12px 28px rgba(83,74,183,.32)',
  })

  const cardStyle = (sel: boolean): React.CSSProperties => ({
    position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: '20px 12px', borderRadius: 20, cursor: 'pointer', transition: 'all .15s',
    background: sel ? 'linear-gradient(135deg,#534AB7,#D4537E)' : '#fff',
    border: sel ? 'none' : '1.5px solid #f0f0f0',
    boxShadow: sel ? '0 8px 24px rgba(212,83,126,.3)' : '0 2px 8px rgba(0,0,0,.04)',
    color: sel ? '#fff' : '#2a2440',
  })

  const roleCardStyle = (sel: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderRadius: 16, cursor: 'pointer',
    transition: 'all .15s', marginBottom: 12,
    background: sel ? 'linear-gradient(135deg,#534AB7,#D4537E)' : '#fff',
    border: sel ? 'none' : '1.5px solid #f0f0f0',
    boxShadow: sel ? '0 8px 24px rgba(212,83,126,.3)' : '0 2px 8px rgba(0,0,0,.04)',
  })

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '13px 16px', border: '2px solid #EEEDFE',
    borderRadius: 14, fontSize: 15, fontFamily: F, color: '#2a2440', outline: 'none',
    background: '#fff', marginBottom: 14,
  }

  return (
    <>
      <style>{`
        @keyframes cheersRise { 0%{opacity:0;transform:translateY(14px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes cheersPop  { 0%{transform:scale(.5);opacity:0} 60%{transform:scale(1.12);opacity:1} 100%{transform:scale(1)} }
        @keyframes cheersPulse{ 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes destello   { 0%{transform:translate(-50%,-50%) scale(0) rotate(0deg);opacity:1} 100%{transform:translate(-50%,-50%) scale(1) rotate(45deg) translateY(-20px);opacity:0} }
      `}</style>

      <Script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`} strategy="afterInteractive" onLoad={() => setMapsListo(true)} />

      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 50 }} />

      <main style={{ minHeight: '100vh', width: '100%', background: bg, fontFamily: F, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', boxSizing: 'border-box' }}>

        {(step === 'type' || step === 'role' || step === 'celebrating' || step === 'success') && (
          <div style={{ width: '100%', maxWidth: 468, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: (step === 'success' || step === 'celebrating') ? 0 : 22 }}>

            <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-.5px', color: '#fff', textShadow: '0 2px 14px rgba(40,20,70,.35)' }}>Cheers</div>

            <div style={{ width: '100%', background: '#fff', borderRadius: 30, boxShadow: '0 24px 64px rgba(83,74,183,.13)', padding: '34px 30px 30px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>

              {(step === 'type' || step === 'role') && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 26 }}>
                  <div style={{ height: 6, flex: 1, borderRadius: 99, background: 'linear-gradient(135deg,#534AB7,#D4537E)' }} />
                  <div style={{ height: 6, flex: 1, borderRadius: 99, background: step === 'role' ? 'linear-gradient(135deg,#534AB7,#D4537E)' : '#EEEDFE' }} />
                </div>
              )}

              {/* STEP 1: Tipo */}
              {step === 'type' && (
                <div style={{ animation: 'cheersRise .35s ease' }}>
                  <h1 style={{ fontSize: 25, fontWeight: 800, letterSpacing: '-.6px', margin: '0 0 4px', color: '#1c1830' }}>¿Qué estás celebrando?</h1>
                  <p style={{ fontSize: 15, color: '#6b6585', margin: '0 0 24px' }}>Elige el tipo de plan que quieres organizar.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {TIPOS.map(t => (
                      <div key={t.key} style={cardStyle(tipo === t.key)} onClick={() => setTipo(t.key as TipoEvento)} onDoubleClick={() => { setTipo(t.key as TipoEvento); setStep('role') }}>
                        {tipo === t.key && (
                          <div style={{ position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,.3)', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
                        )}
                        <div style={{ fontSize: 15, fontWeight: 700, color: tipo === t.key ? '#fff' : '#534AB7', background: tipo === t.key ? 'rgba(255,255,255,.2)' : '#EEEDFE', padding: '6px 10px', borderRadius: 8 }}>
                          {CHIPS[t.key]}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 650, textAlign: 'center', color: tipo === t.key ? '#fff' : '#2a2440' }}>{t.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: Rol */}
              {step === 'role' && step2cfg && (
                <div style={{ animation: 'cheersRise .35s ease' }}>
                  <button onClick={() => { setStep('type'); setRol(null) }} style={{ background: 'none', border: 'none', color: '#534AB7', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 14, fontFamily: F }}>← Atrás</button>
                  <h1 style={{ fontSize: 25, fontWeight: 800, letterSpacing: '-.6px', margin: '0 0 4px', color: '#1c1830' }}>{step2cfg.title}</h1>
                  <p style={{ fontSize: 15, color: '#6b6585', margin: '0 0 24px' }}>{step2cfg.sub}</p>

                  {step2cfg.open && (
                    <>
                      <input value={customEvent} onChange={e => setCustomEvent(e.target.value)} placeholder={step2cfg.placeholder} style={inputStyle} />
                      <p style={{ fontSize: 13, color: '#7a7494', margin: '-8px 2px 16px' }}>Aparecerá en la invitación tal como lo escribas.</p>
                    </>
                  )}

                  {tipo === 'cena' && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {CENA_ROLES.map(r => (
                        <div key={r.key} style={roleCardStyle(rol === r.key)} onClick={() => setRol(r.key as Rol)}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 16, fontWeight: 650, color: rol === r.key ? '#fff' : '#2a2440' }}>{r.label}</div>
                            <div style={{ fontSize: 13, color: rol === r.key ? 'rgba(255,255,255,.75)' : '#7a7494', marginTop: 2 }}>{r.sub}</div>
                          </div>
                          {rol === r.key && <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,.3)', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {!step2cfg.open && tipo !== 'cena' && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {ROLES.map(r => (
                        <div key={r.key} style={roleCardStyle(rol === r.key)} onClick={() => setRol(r.key as Rol)}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 16, fontWeight: 650, color: rol === r.key ? '#fff' : '#2a2440' }}>{r.label}</div>
                            <div style={{ fontSize: 13, color: rol === r.key ? 'rgba(255,255,255,.75)' : '#7a7494', marginTop: 2 }}>{r.sub}</div>
                          </div>
                          {rol === r.key && <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,.3)', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Título del evento</label>
                    <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder={`Ej: ${rol === 'yo' ? `Mi ${chosenTipo?.label}` : `${chosenTipo?.label} de...`}`} style={inputStyle} />

                    {(rol === 'otro' || rol === 'sorpresa') && (
                      <>
                        <label style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>¿Quién es el festejado?</label>
                        <input value={festejado} onChange={e => setFestejado(e.target.value)} placeholder="Nombre del festejado" style={inputStyle} />
                      </>
                    )}

                    <label style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Fecha</label>
                    <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inputStyle} />

                    <label style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Lugar</label>
                    <input ref={lugarRef} value={lugar} onChange={e => setLugar(e.target.value)} placeholder="Buscar lugar..." style={{ ...inputStyle, marginBottom: 0 }} />
                  </div>
                </div>
              )}

              {/* Celebrating */}
              {step === 'celebrating' && (
                <div style={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center' }}>
                  <div style={{ animation: 'cheersPulse .7s ease-in-out infinite' }}>
                    <div style={{ width: 72, height: 72, borderRadius: 22, background: 'linear-gradient(135deg,#534AB7,#D4537E)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{CHIPS[tipo || ''] || 'CHR'}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: '#534AB7' }}>Planeando tu celebración…</div>
                </div>
              )}

              {/* Success */}
              {step === 'success' && (
                <div style={{ textAlign: 'center', padding: '8px 0', animation: 'cheersRise .4s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, animation: 'cheersPop .6s ease both' }}>
                    <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg,#534AB7,#D4537E)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>✓</span>
                    </div>
                  </div>
                  <h1 style={{ fontSize: 34, fontWeight: 850, letterSpacing: -1, margin: '14px 0 6px', background: 'linear-gradient(135deg,#534AB7,#D4537E)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>¡Cheers!</h1>
                  <p style={{ fontSize: 15, color: '#6b6585', margin: '0 0 20px' }}>Tu celebración está lista para compartir.</p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 4px 6px' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase' }}>Ponle título a tu evento</span>
                  </div>
                  <div style={{ position: 'relative', marginBottom: 18 }}>
                    <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder={`Ej: ${chosenTipo?.label} de ${userNombre}`} spellCheck={false} style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', border: '2px solid #d8d4f5', background: '#fff', borderRadius: 14, padding: '13px 40px', fontSize: 18, fontWeight: 800, color: '#2a2440', fontFamily: F, outline: 'none' }} />
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#b3adcc', pointerEvents: 'none' }}>✎</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 4px 6px' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase' }}>Tu link</span>
                    {!linkConfirmed && <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#a39ec0', textTransform: 'uppercase' }}>personalízalo</span>}
                    {linkConfirmed && <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.4px', color: '#1f8a5b', textTransform: 'uppercase' }}>Confirmado</span>}
                  </div>

                  {!linkConfirmed && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, textAlign: 'left', background: '#FFF4E6', borderRadius: 13, padding: '11px 13px', marginBottom: 12 }}>
                        <span style={{ fontSize: 15, lineHeight: 1.3, flexShrink: 0, color: '#c98a1e', fontWeight: 800 }}>!</span>
                        <span style={{ fontSize: 12.5, color: '#9a6a13', fontWeight: 600, lineHeight: 1.45 }}>¡Recuerda que después no podrás editar el nombre del evento!</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#EEEDFE', borderRadius: 16, padding: '11px 12px', marginBottom: 16 }}>
                        <div style={{ flex: 1, minWidth: 0, textAlign: 'left', fontSize: 14.5, color: '#534AB7', fontWeight: 700, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                          <span style={{ opacity: .55 }}>joincheers.app/</span>
                          <input value={userSlug} onChange={e => setUserSlug(slugify(e.target.value))} placeholder="tu_usuario" spellCheck={false} style={{ minWidth: 70, border: 'none', background: '#fff', color: '#534AB7', fontFamily: F, fontSize: 14.5, fontWeight: 800, padding: '3px 7px', borderRadius: 8, outline: 'none' }} />
                          <span style={{ opacity: .55 }}>/</span>
                          <input value={eventSlug} onChange={e => setEventSlug(slugify(e.target.value))} placeholder="mi-evento" spellCheck={false} style={{ minWidth: 90, border: 'none', background: '#fff', color: '#534AB7', fontFamily: F, fontSize: 14.5, fontWeight: 800, padding: '3px 7px', borderRadius: 8, outline: 'none' }} />
                        </div>
                      </div>
                      <button onClick={() => setLinkConfirmed(true)} style={btnPrimary()}>Confirmar link</button>
                    </>
                  )}

                  {linkConfirmed && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#ECF7F0', border: '1.5px solid #cdeedd', borderRadius: 16, padding: '13px 14px', marginBottom: 10 }}>
                        <div style={{ flex: 1, minWidth: 0, textAlign: 'left', fontSize: 14.5, color: '#2a2440', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareUrl}</div>
                        <button onClick={copyLink} style={{ flexShrink: 0, border: 'none', background: '#fff', color: '#534AB7', fontSize: 13, fontWeight: 700, padding: '8px 14px', borderRadius: 11, cursor: 'pointer', fontFamily: F }}>
                          {copied ? '¡Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <div style={{ textAlign: 'left', fontSize: 12.5, color: '#1f8a5b', fontWeight: 700, margin: '0 4px 16px' }}>Link confirmado · ya no se puede cambiar</div>
                      <button onClick={() => setStep('invite')} style={btnPrimary()}>Invitar personas →</button>
                    </>
                  )}

                  {errorMsg && (
                    <div style={{ background: 'rgba(212,83,126,.08)', border: '1px solid rgba(212,83,126,.25)', borderRadius: 12, padding: '12px 14px', margin: '12px 0' }}>
                      <p style={{ fontSize: 13, color: '#D4537E', margin: 0, fontWeight: 500 }}>{errorMsg}</p>
                    </div>
                  )}
                </div>
              )}

            </div>

            {(step === 'type' || step === 'role') && (
              <button
                onClick={() => {
                  if (step === 'type') {
                    if (tipo) setStep('role')
                  } else {
                    const canAdvance = step2cfg?.open ? !!customEvent : !!rol
                    if (canAdvance && titulo) guardar()
                    else if (canAdvance && !titulo) {
                      document.querySelector<HTMLInputElement>('input[placeholder*="Ej:"]')?.focus()
                    }
                  }
                }}
                style={btnPrimary(step === 'type' ? !tipo : (step2cfg?.open ? !customEvent : !rol))}
              >
                {step === 'type' ? 'Continuar' : saving ? 'Creando...' : 'Crear celebración'}
              </button>
            )}
          </div>
        )}

        {/* Invite */}
        {step === 'invite' && (
          <div style={{ width: '100%', maxWidth: 468, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => setStep('success')} style={{ background: 'rgba(255,255,255,.92)', border: 'none', color: '#534AB7', fontSize: 14, fontWeight: 700, padding: '9px 16px', borderRadius: 99, cursor: 'pointer', fontFamily: F, boxShadow: '0 4px 14px rgba(20,10,40,.18)' }}>← Volver</button>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.4px', color: '#fff' }}>Cheers</div>
              <div style={{ width: 84 }} />
            </div>

            <div style={{ background: '#fff', borderRadius: 26, padding: '24px 22px', boxShadow: '0 18px 46px rgba(25,12,50,.22)' }}>
              <h1 style={{ fontSize: 26, fontWeight: 850, letterSpacing: '-.6px', margin: '0 0 4px', color: '#2a2440' }}>Invita a tus personas</h1>
              <p style={{ fontSize: 14.5, color: '#6b6585', margin: '0 0 18px' }}>Agrega a tus invitados por email o nombre.</p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F5F4FB', border: '1.5px solid #EEEDFE', borderRadius: 14, padding: '10px 14px', marginBottom: 12 }}>
                <input
                  value={inviteQuery}
                  onChange={e => setInviteQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') agregarInvitado() }}
                  placeholder="Nombre o email — presiona Enter para agregar"
                  style={{ flex: 1, border: 'none', background: 'transparent', fontFamily: F, fontSize: 14.5, fontWeight: 600, color: '#2a2440', outline: 'none' }}
                />
                {inviteQuery.trim() && (
                  <button onClick={agregarInvitado} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 99, cursor: 'pointer', fontFamily: F, flexShrink: 0 }}>
                    + Agregar
                  </button>
                )}
              </div>

              {invitados.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {invitados.map(c => (
                    <div key={c.id} onClick={() => setInvited(prev => ({ ...prev, [c.id]: !prev[c.id] }))} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 14, cursor: 'pointer', border: invited[c.id] ? '1.5px solid #534AB7' : '1.5px solid #EEEDFE', background: invited[c.id] ? '#F3F1FB' : '#fff' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: invited[c.id] ? 'linear-gradient(135deg,#534AB7,#D4537E)' : '#EEEDFE', color: invited[c.id] ? '#fff' : '#534AB7', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {c.name[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#2a2440' }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: '#7a7494' }}>{c.email}</div>
                      </div>
                      {invited[c.id] && <span style={{ color: '#534AB7', fontWeight: 800 }}>✓</span>}
                    </div>
                  ))}
                </div>
              )}

              <button onClick={confirmarInvitados} disabled={guardandoInvitados} style={btnPrimary(guardandoInvitados)}>
                {guardandoInvitados ? 'Guardando...' : invitedCount > 0 ? `Ver mi celebración (${invitedCount} invitados) →` : 'Ver mi celebración →'}
              </button>
            </div>
          </div>
        )}

      </main>
    </>
  )
}