'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { supabase } from '../../supabase'
import { getLang, t } from '../../i18n'

declare global { interface Window { google: any } }

type Step = 'type' | 'details' | 'link' | 'invite'
type TipoEvento = 'cumple' | 'cena' | 'viaje' | 'reunion' | 'evento' | 'otro' | null
type Rol = 'yo' | 'otro' | 'sorpresa' | null

const FSYS = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const BG = 'radial-gradient(circle at 12% 18%,rgba(127,119,221,.55),transparent 45%),radial-gradient(circle at 88% 82%,rgba(212,83,126,.5),transparent 50%),linear-gradient(160deg,#534AB7 0%,#7b46a8 52%,#D4537E 100%)'
const DRAFT_KEY = 'cheers_draft'
const DRAFT_TTL = 7 * 24 * 60 * 60 * 1000 // 7 días

const CHIPS: Record<string, string> = {
  cumple: 'BDAY', cena: 'DINE', viaje: 'TRIP', reunion: 'MEET', evento: 'EVENT', otro: 'OTHER'
}

const LIMITE_FREE = 3

function slugify(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40)
}

function saveDraft(data: any) {
  if (typeof window === 'undefined') return
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...data, savedAt: Date.now() }))
}

function loadDraft() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() - data.savedAt > DRAFT_TTL) { localStorage.removeItem(DRAFT_KEY); return null }
    return data
  } catch { return null }
}

function clearDraft() {
  if (typeof window !== 'undefined') localStorage.removeItem(DRAFT_KEY)
}

export default function NuevaCelebracion() {
  const router = useRouter()
  const [tx, setTx] = useState(t.es)
  const [lang, setLang] = useState('es')
  const [step, setStep] = useState<Step>('type')
  const [tipo, setTipo] = useState<TipoEvento>(null)
  const [rol, setRol] = useState<Rol>(null)
  const [titulo, setTitulo] = useState('')
  const [festejado, setFestejado] = useState('')
  const [fecha, setFecha] = useState('')
  const [lugar, setLugar] = useState('')
  const [recurrente, setRecurrente] = useState(false)
  const [recurrenciaTipo, setRecurrenciaTipo] = useState<'semanal' | 'mensual_nesimo'>('semanal')
  const [recurrenciaDiaSemana, setRecurrenciaDiaSemana] = useState(5) // 5 = viernes
  const [recurrenciaSemanaMes, setRecurrenciaSemanaMes] = useState(1)
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
  const [mapsListo, setMapsListo] = useState(false)
  const [userNombre, setUserNombre] = useState('')
  const [slugFinal, setSlugFinal] = useState('')
  const [hasDraft, setHasDraft] = useState(false)
  const [verificando, setVerificando] = useState(true)
  const lugarRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const l = getLang(); setLang(l); setTx(t[l])

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const nombre = user.user_metadata?.name?.split(' ')[0] || 'tu'
      setUserNombre(nombre)

      const { data: perfil } = await supabase.from('perfiles').select('username').eq('user_id', user.id).single()
      setUserSlug(perfil?.username || slugify(nombre))
      setVerificando(false)

      // Cargar draft si existe
      const draft = loadDraft()
      if (draft) {
        setHasDraft(true)
        if (draft.tipo) setTipo(draft.tipo)
        if (draft.rol) setRol(draft.rol)
        if (draft.titulo) setTitulo(draft.titulo)
        if (draft.festejado) setFestejado(draft.festejado)
        if (draft.fecha) setFecha(draft.fecha)
        if (draft.lugar) setLugar(draft.lugar)
        if (draft.eventSlug) setEventSlug(draft.eventSlug)
        if (draft.step) setStep(draft.step)
      }
    })
  }, [])

  // Auto-guardar draft al cambiar cualquier campo
  useEffect(() => {
    if (verificando) return
    saveDraft({ tipo, rol, titulo, festejado, fecha, lugar, eventSlug, step })
  }, [tipo, rol, titulo, festejado, fecha, lugar, eventSlug, step])

  useEffect(() => {
    if (!mapsListo || !lugarRef.current || lugarRef.current.dataset.init) return
    const ac = new window.google.maps.places.Autocomplete(lugarRef.current, { fields: ['name', 'formatted_address'] })
    ac.addListener('place_changed', () => {
      const p = ac.getPlace()
      if (p) setLugar(p.name || lugarRef.current?.value || '')
    })
    lugarRef.current.dataset.init = 'true'
  }, [mapsListo, step])

  useEffect(() => {
    if (!linkConfirmed && titulo) setEventSlug(slugify(titulo))
  }, [titulo, linkConfirmed])

  // Confetti
  useEffect(() => {
    const COLORS = ['#D4537E', '#534AB7', '#EEEDFE', '#F5C04E', '#fff', '#8b7fe8']
    let last = 0
    const sparkle = (e: MouseEvent) => {
      const now = performance.now()
      if (now - last < 22) return; last = now
      const el = document.createElement('div')
      el.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;pointer-events:none;z-index:9999;font-size:${Math.random() * 10 + 10}px;color:${COLORS[Math.floor(Math.random() * COLORS.length)]};animation:destello 0.6s ease-out forwards;`
      el.textContent = '✦'; document.body.appendChild(el)
      setTimeout(() => el.remove(), 600)
    }
    document.addEventListener('mousemove', sparkle)
    return () => document.removeEventListener('mousemove', sparkle)
  }, [])

  async function guardar() {
    setSaving(true); setErrorMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    const slug = `${userSlug}/${eventSlug || slugify(titulo || tipo || 'celebracion')}`
    setSlugFinal(slug)
    const { error } = await supabase.from('celebraciones').insert({
      nombre: titulo || tipo,
      tipo, festejado_nombre: rol === 'yo' ? userNombre : festejado,
      organizador_id: user?.id,
      slug, es_sorpresa: rol === 'sorpresa',
      fecha: fecha || null,
      recurrente,
      recurrencia_tipo: recurrente ? recurrenciaTipo : null,
      recurrencia_dia_semana: recurrente ? recurrenciaDiaSemana : null,
      recurrencia_semana_mes: recurrente && recurrenciaTipo === 'mensual_nesimo' ? recurrenciaSemanaMes : null,
      paradas: lugar ? [{ lugar, hora: '', nota: '' }] : [],
      gifts: [], created_at: new Date().toISOString(),
    })
    setSaving(false)
    if (!error) { clearDraft(); setStep('link') }
    else if (error.code === '23505') setErrorMsg(tx.nueva_slug_error)
    else setErrorMsg(tx.nueva_error)
  }

  async function confirmarLink() {
    setSaving(true); setErrorMsg('')
    const nuevoSlug = `${userSlug}/${eventSlug || slugify(titulo || tipo || 'celebracion')}`
    if (nuevoSlug !== slugFinal) {
      const { error } = await supabase.from('celebraciones').update({ nombre: titulo || tipo, slug: nuevoSlug }).eq('slug', slugFinal)
      if (error) {
        setSaving(false)
        if (error.code === '23505') setErrorMsg(tx.nueva_slug_error)
        else setErrorMsg(tx.nueva_error)
        return
      }
      setSlugFinal(nuevoSlug)
    }
    setSaving(false)
    setLinkConfirmed(true)
  }

  async function confirmarInvitados() {
    setGuardandoInvitados(true)
    const seleccionados = invitados.filter(i => invited[i.id])
    if (seleccionados.length > 0) {
      await supabase.from('invitados').insert(seleccionados.map(inv => ({
        celebracion_slug: slugFinal, email: inv.email.includes('@') ? inv.email : null,
        nombre: inv.name, user_id: null, created_at: new Date().toISOString(),
      })))
    }
    setGuardandoInvitados(false)
    clearDraft()
    router.push(`/${slugFinal}`)
  }

  function agregarInvitado() {
    if (!inviteQuery.trim() || invitados.length >= LIMITE_FREE) return
    const id = 'm' + Date.now()
    setInvitados(prev => [...prev, { id, name: inviteQuery.trim(), email: inviteQuery.trim() }])
    setInvited(prev => ({ ...prev, [id]: true }))
    setInviteQuery('')
  }

  function copyLink() {
    navigator.clipboard.writeText(`https://joincheers.app/${userSlug}/${eventSlug}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  function handleTipoSelect(key: TipoEvento) {
    setTipo(key)
  }

  function handleTipoDobleClick(key: TipoEvento) {
    setTipo(key)
    setStep('details')
  }

  if (verificando) return (
    <main style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FSYS }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 900, background: 'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12 }}>Cheers</div>
        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 14 }}>{tx.loading}</p>
      </div>
    </main>
  )

  const TIPOS = [
    { key: 'cumple', label: tx.tipo_cumple, chip: 'BDAY' },
    { key: 'cena',   label: tx.tipo_cena,   chip: 'DINE' },
    { key: 'viaje',  label: tx.tipo_viaje,  chip: 'TRIP' },
    { key: 'reunion',label: tx.tipo_reunion, chip: 'MEET' },
    { key: 'evento', label: tx.tipo_evento,  chip: 'EVENT' },
    { key: 'otro',   label: tx.tipo_otro,    chip: 'OTHER' },
  ]

  const ROLES = [
    { key: 'yo',       label: tx.role_me,      sub: tx.role_me_sub },
    { key: 'otro',     label: tx.role_other,   sub: tx.role_other_sub },
    { key: 'sorpresa', label: tx.role_surprise, sub: tx.role_surprise_sub },
  ]

  const shareUrl = `joincheers.app/${userSlug}/${eventSlug || 'mi-evento'}`
  const invitedCount = Object.values(invited).filter(Boolean).length
  const tipoSeleccionado = TIPOS.find(t => t.key === tipo)

  const btnPrimary = (disabled = false): React.CSSProperties => ({
    width: '100%', border: 'none', borderRadius: 18, padding: '17px', fontSize: 17, fontWeight: 700,
    fontFamily: FSYS, cursor: disabled ? 'not-allowed' : 'pointer', color: disabled ? '#a79fc4' : '#fff',
    background: disabled ? '#EAE7F6' : 'linear-gradient(135deg,#534AB7,#D4537E)',
    boxShadow: disabled ? 'none' : '0 12px 28px rgba(83,74,183,.32)',
  })

  const cardStyle = (sel: boolean): React.CSSProperties => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: '20px 12px', borderRadius: 20, cursor: 'pointer', transition: 'all .15s',
    background: sel ? 'linear-gradient(135deg,#534AB7,#D4537E)' : '#fff',
    border: sel ? 'none' : '1.5px solid #f0f0f0',
    boxShadow: sel ? '0 8px 24px rgba(212,83,126,.3)' : '0 2px 8px rgba(0,0,0,.04)',
    position: 'relative',
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
    borderRadius: 14, fontSize: 15, fontFamily: FSYS, color: '#2a2440', outline: 'none', background: '#fff', marginBottom: 14,
  }

  return (
    <>
      <style>{`
        @keyframes cheersRise{0%{opacity:0;transform:translateY(14px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes destello{0%{transform:translate(-50%,-50%) scale(0) rotate(0deg);opacity:1}100%{transform:translate(-50%,-50%) scale(1) rotate(45deg) translateY(-20px);opacity:0}}
      `}</style>

      <Script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`} strategy="afterInteractive" onLoad={() => setMapsListo(true)} />

      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 50 }} />

      <main style={{ minHeight: '100vh', background: BG, fontFamily: FSYS, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', boxSizing: 'border-box' }}>
        <div style={{ width: '100%', maxWidth: 468, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Header con Cheers y tipo seleccionado */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-.5px' }}>Cheers</div>
            {tipoSeleccionado && step !== 'type' && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.15)', borderRadius: 99, padding: '4px 12px', marginTop: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '.5px' }}>{tipoSeleccionado.chip}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', fontWeight: 600 }}>{tipoSeleccionado.label}</span>
                <button onClick={() => setStep('type')} style={{ border: 'none', background: 'none', color: 'rgba(255,255,255,.5)', fontSize: 12, cursor: 'pointer', padding: 0, fontFamily: FSYS }}>✕</button>
              </div>
            )}
          </div>

          {/* Draft banner */}
          {hasDraft && step === 'type' && (
            <div style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{lang === 'en' ? 'You have a draft' : 'Tienes un borrador'}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>{lang === 'en' ? 'It will be deleted in 7 days if you don\'t continue.' : 'Se borra en 7 días si no continúas.'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => { if (tipo) setStep('details') }} style={{ border: 'none', background: '#fff', color: '#534AB7', fontSize: 12, fontWeight: 800, padding: '7px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: FSYS }}>{lang === 'en' ? 'Continue' : 'Continuar'}</button>
                <button onClick={() => { clearDraft(); setHasDraft(false); setTipo(null); setRol(null); setTitulo(''); setFestejado(''); setFecha(''); setLugar(''); setEventSlug('') }} style={{ border: 'none', background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.7)', fontSize: 12, fontWeight: 700, padding: '7px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: FSYS }}>{lang === 'en' ? 'Discard' : 'Descartar'}</button>
              </div>
            </div>
          )}

          {/* Card principal */}
          <div style={{ background: '#fff', borderRadius: 30, boxShadow: '0 24px 64px rgba(83,74,183,.13)', padding: '32px 28px', animation: 'cheersRise .35s ease' }}>

            {/* Progress bar */}
            {(step === 'type' || step === 'details') && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                <div style={{ height: 6, flex: 1, borderRadius: 99, background: 'linear-gradient(135deg,#534AB7,#D4537E)' }} />
                <div style={{ height: 6, flex: 1, borderRadius: 99, background: step === 'details' ? 'linear-gradient(135deg,#534AB7,#D4537E)' : '#EEEDFE' }} />
              </div>
            )}

            {/* STEP 1: TIPO */}
            {step === 'type' && (
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1c1830', margin: '0 0 4px', letterSpacing: '-.5px' }}>{tx.nueva_step1_title}</h1>
                <p style={{ fontSize: 14, color: '#6b6585', margin: '0 0 8px' }}>{tx.nueva_step1_sub}</p>
                <p style={{ fontSize: 12, color: '#a39ec0', margin: '0 0 20px' }}>{lang === 'en' ? 'Tap once to select, double-tap to continue.' : 'Toca para seleccionar, doble toque para continuar.'}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {TIPOS.map(t => (
                    <div key={t.key} style={cardStyle(tipo === t.key)}
                      onClick={() => handleTipoSelect(t.key as TipoEvento)}
                      onDoubleClick={() => handleTipoDobleClick(t.key as TipoEvento)}
                    >
                      {tipo === t.key && <div style={{ position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>✓</span></div>}
                      <div style={{ fontSize: 14, fontWeight: 700, color: tipo === t.key ? '#fff' : '#534AB7', background: tipo === t.key ? 'rgba(255,255,255,.2)' : '#EEEDFE', padding: '6px 10px', borderRadius: 8 }}>{t.chip}</div>
                      <div style={{ fontSize: 15, fontWeight: 650, color: tipo === t.key ? '#fff' : '#2a2440', textAlign: 'center' }}>{t.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: DETALLES */}
            {step === 'details' && (
              <div>
                <button onClick={() => setStep('type')} style={{ background: 'none', border: 'none', color: '#534AB7', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 14, fontFamily: FSYS }}>{tx.nueva_back}</button>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1c1830', margin: '0 0 4px', letterSpacing: '-.5px' }}>{tx.nueva_role_title}</h1>
                <p style={{ fontSize: 14, color: '#6b6585', margin: '0 0 20px' }}>{tx.nueva_role_sub}</p>

                {ROLES.map(r => (
                  <div key={r.key} style={roleCardStyle(rol === r.key)} onClick={() => setRol(r.key as Rol)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 650, color: rol === r.key ? '#fff' : '#2a2440' }}>{r.label}</div>
                      <div style={{ fontSize: 13, color: rol === r.key ? 'rgba(255,255,255,.75)' : '#7a7494', marginTop: 2 }}>{r.sub}</div>
                    </div>
                    {rol === r.key && <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>✓</span></div>}
                  </div>
                ))}

                <div style={{ marginTop: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#a39ec0', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 6 }}>{tx.nueva_event_title_label}</label>
                  <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder={tipoSeleccionado?.label + '...'} style={inputStyle} />

                  {(rol === 'otro' || rol === 'sorpresa') && (
                    <>
                      <label style={{ fontSize: 11, fontWeight: 800, color: '#a39ec0', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 6 }}>{tx.nueva_festejado_label}</label>
                      <input value={festejado} onChange={e => setFestejado(e.target.value)} placeholder={tx.nueva_festejado_placeholder} style={inputStyle} />
                    </>
                  )}

                  <label style={{ fontSize: 11, fontWeight: 800, color: '#a39ec0', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 6 }}>{tx.nueva_date_label}</label>
                  <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inputStyle} />

                  <label style={{ fontSize: 11, fontWeight: 800, color: '#a39ec0', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 6 }}>{tx.nueva_place_label}</label>
                  <input ref={lugarRef} value={lugar} onChange={e => setLugar(e.target.value)} placeholder={tx.nueva_place_placeholder} style={{ ...inputStyle, marginBottom: recurrente ? 14 : 0 }} />

                  <div onClick={() => setRecurrente(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 2px', marginBottom: recurrente ? 10 : 0 }}>
                    <div style={{ width: 38, height: 22, borderRadius: 99, background: recurrente ? 'linear-gradient(135deg,#534AB7,#D4537E)' : '#EAE7F6', position: 'relative', transition: 'background .15s', flexShrink: 0 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: recurrente ? 18 : 2, transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#2a2440' }}>{lang === 'en' ? 'Repeats' : 'Se repite'}</span>
                  </div>

                  {recurrente && (
                    <div style={{ background: '#F5F4FB', borderRadius: 14, padding: 14, marginBottom: 0 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        <button type="button" onClick={() => setRecurrenciaTipo('semanal')} style={{ flex: 1, border: 'none', borderRadius: 10, padding: '8px 6px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FSYS, background: recurrenciaTipo === 'semanal' ? 'linear-gradient(135deg,#534AB7,#D4537E)' : '#fff', color: recurrenciaTipo === 'semanal' ? '#fff' : '#534AB7' }}>{lang === 'en' ? 'Every week' : 'Cada semana'}</button>
                        <button type="button" onClick={() => setRecurrenciaTipo('mensual_nesimo')} style={{ flex: 1, border: 'none', borderRadius: 10, padding: '8px 6px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FSYS, background: recurrenciaTipo === 'mensual_nesimo' ? 'linear-gradient(135deg,#534AB7,#D4537E)' : '#fff', color: recurrenciaTipo === 'mensual_nesimo' ? '#fff' : '#534AB7' }}>{lang === 'en' ? 'Monthly' : 'Cada mes'}</button>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        {recurrenciaTipo === 'mensual_nesimo' && (
                          <select value={recurrenciaSemanaMes} onChange={e => setRecurrenciaSemanaMes(Number(e.target.value))} style={{ ...inputStyle, marginBottom: 0, fontSize: 13, flex: '0 0 auto', width: 'auto', padding: '10px 8px' }}>
                            <option value={1}>{lang === 'en' ? '1st' : '1er'}</option>
                            <option value={2}>{lang === 'en' ? '2nd' : '2do'}</option>
                            <option value={3}>{lang === 'en' ? '3rd' : '3er'}</option>
                            <option value={4}>{lang === 'en' ? '4th' : '4to'}</option>
                          </select>
                        )}
                        <select value={recurrenciaDiaSemana} onChange={e => setRecurrenciaDiaSemana(Number(e.target.value))} style={{ ...inputStyle, marginBottom: 0, fontSize: 13, flex: 1 }}>
                          <option value={0}>{lang === 'en' ? 'Sunday' : 'domingo'}</option>
                          <option value={1}>{lang === 'en' ? 'Monday' : 'lunes'}</option>
                          <option value={2}>{lang === 'en' ? 'Tuesday' : 'martes'}</option>
                          <option value={3}>{lang === 'en' ? 'Wednesday' : 'miércoles'}</option>
                          <option value={4}>{lang === 'en' ? 'Thursday' : 'jueves'}</option>
                          <option value={5}>{lang === 'en' ? 'Friday' : 'viernes'}</option>
                          <option value={6}>{lang === 'en' ? 'Saturday' : 'sábado'}</option>
                        </select>
                      </div>

                      <p style={{ fontSize: 11, color: '#a39ec0', margin: '10px 2px 0', lineHeight: 1.5 }}>
                        {lang === 'en'
                          ? 'You can pick this for free, but the future dates only generate once this celebration is Super Cheer or your account is Extra Cheer.'
                          : 'Puedes elegirlo gratis, pero las fechas futuras solo se generan cuando esta celebración sea Super Cheer o tu cuenta sea Extra Cheer.'}
                      </p>
                    </div>
                  )}
                </div>

                {errorMsg && <div style={{ background: 'rgba(212,83,126,.08)', border: '1px solid rgba(212,83,126,.25)', borderRadius: 12, padding: '12px 14px', margin: '14px 0 0' }}><p style={{ fontSize: 13, color: '#D4537E', margin: 0 }}>{errorMsg}</p></div>}
              </div>
            )}

            {/* STEP 3: LINK */}
            {step === 'link' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🥂</div>
                <h1 style={{ fontSize: 28, fontWeight: 850, color: '#1c1830', margin: '0 0 6px', letterSpacing: '-.5px' }}>{tx.nueva_success_title}</h1>
                <p style={{ fontSize: 15, color: '#6b6585', margin: '0 0 24px' }}>{tx.nueva_success_sub}</p>

                <label style={{ fontSize: 11, fontWeight: 800, color: '#a39ec0', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 6, textAlign: 'left' }}>{tx.nueva_title_label}</label>
                <div style={{ position: 'relative', marginBottom: 18 }}>
                  <input value={titulo} onChange={e => { if (!linkConfirmed) { setTitulo(e.target.value) } }} placeholder={tipoSeleccionado?.label} style={{ ...inputStyle, textAlign: 'center', fontSize: 18, fontWeight: 800, marginBottom: 0, paddingRight: 40 }} readOnly={linkConfirmed} />
                  {!linkConfirmed && <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#b3adcc', pointerEvents: 'none' }}>✎</span>}
                </div>

                <label style={{ fontSize: 11, fontWeight: 800, color: '#a39ec0', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 6, textAlign: 'left' }}>{tx.nueva_link_label}</label>

                {!linkConfirmed ? (
                  <>
                    <div style={{ background: '#FFF4E6', borderRadius: 12, padding: '10px 14px', marginBottom: 12, textAlign: 'left', display: 'flex', gap: 8 }}>
                      <span style={{ color: '#c98a1e', fontWeight: 800, fontSize: 14 }}>!</span>
                      <span style={{ fontSize: 12, color: '#9a6a13', fontWeight: 600, lineHeight: 1.45 }}>{tx.nueva_link_warning}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EEEDFE', borderRadius: 14, padding: '10px 12px', marginBottom: 14, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: 'rgba(83,74,183,.6)', fontWeight: 700, flexShrink: 0 }}>joincheers.app/</span>
                      <input value={userSlug} onChange={e => setUserSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} style={{ border: 'none', background: '#fff', color: '#534AB7', fontFamily: FSYS, fontSize: 13, fontWeight: 800, padding: '4px 8px', borderRadius: 8, outline: 'none', width: `calc(${Math.max(userSlug.length + 1, 6)}ch + 16px)`, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: 'rgba(83,74,183,.4)', fontWeight: 700 }}>/</span>
                      <input value={eventSlug} onChange={e => setEventSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} style={{ border: 'none', background: '#fff', color: '#534AB7', fontFamily: FSYS, fontSize: 13, fontWeight: 800, padding: '4px 8px', borderRadius: 8, outline: 'none', flex: '1 1 100%', minWidth: 120 }} />
                    </div>
                    <button onClick={confirmarLink} disabled={saving} style={btnPrimary(saving)}>{saving ? tx.nueva_creating : tx.nueva_confirm_link}</button>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#ECF7F0', border: '1.5px solid #cdeedd', borderRadius: 14, padding: '12px 14px', marginBottom: 8 }}>
                      <div style={{ flex: 1, fontSize: 13, color: '#2a2440', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareUrl}</div>
                      <button onClick={copyLink} style={{ border: 'none', background: '#fff', color: '#534AB7', fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: FSYS }}>{copied ? tx.copied : tx.copy}</button>
                    </div>
                    <div style={{ fontSize: 12, color: '#1f8a5b', fontWeight: 700, margin: '0 4px 16px', textAlign: 'left' }}>{tx.nueva_link_confirmed}</div>
                    <button onClick={() => setStep('invite')} style={btnPrimary()}>{tx.nueva_invite_btn}</button>
                  </>
                )}

                {errorMsg && <div style={{ background: 'rgba(212,83,126,.08)', border: '1px solid rgba(212,83,126,.25)', borderRadius: 12, padding: '12px 14px', margin: '12px 0' }}><p style={{ fontSize: 13, color: '#D4537E', margin: 0 }}>{errorMsg}</p></div>}
              </div>
            )}

            {/* STEP 4: INVITE */}
            {step === 'invite' && (
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 850, color: '#2a2440', margin: '0 0 4px' }}>{tx.nueva_invite_title}</h1>
                <p style={{ fontSize: 14, color: '#6b6585', margin: '0 0 18px' }}>{tx.nueva_invite_sub}</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F5F4FB', border: '1.5px solid #EEEDFE', borderRadius: 14, padding: '10px 14px', marginBottom: 10, opacity: invitados.length >= LIMITE_FREE ? 0.5 : 1 }}>
                  <input value={inviteQuery} onChange={e => setInviteQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarInvitado()} placeholder={invitados.length >= LIMITE_FREE ? tx.nueva_limit_input(LIMITE_FREE) : tx.nueva_invite_placeholder} disabled={invitados.length >= LIMITE_FREE} style={{ flex: 1, border: 'none', background: 'transparent', fontFamily: FSYS, fontSize: 14, color: '#2a2440', outline: 'none' }} />
                  {inviteQuery.trim() && invitados.length < LIMITE_FREE && (
                    <button onClick={agregarInvitado} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 99, cursor: 'pointer', fontFamily: FSYS }}>{tx.nueva_invite_add}</button>
                  )}
                </div>

                {invitados.length >= LIMITE_FREE && (
                  <div style={{ background: 'linear-gradient(135deg,#534AB7,#D4537E)', borderRadius: 14, padding: '14px 16px', marginBottom: 12, color: '#fff' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 3 }}>{tx.nueva_limit_title}</div>
                    <div style={{ fontSize: 12, lineHeight: 1.5, opacity: 0.92, marginBottom: 10 }}>{tx.nueva_limit_desc}</div>
                    <button style={{ border: 'none', background: '#fff', color: '#534AB7', fontSize: 12, fontWeight: 800, padding: '7px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: FSYS }}>{tx.nueva_limit_cta}</button>
                  </div>
                )}

                {invitados.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {invitados.map(c => (
                      <div key={c.id} onClick={() => setInvited(prev => ({ ...prev, [c.id]: !prev[c.id] }))} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 14, cursor: 'pointer', border: invited[c.id] ? '1.5px solid #534AB7' : '1.5px solid #EEEDFE', background: invited[c.id] ? '#F3F1FB' : '#fff' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: invited[c.id] ? 'linear-gradient(135deg,#534AB7,#D4537E)' : '#EEEDFE', color: invited[c.id] ? '#fff' : '#534AB7', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.name[0].toUpperCase()}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#2a2440' }}>{c.name}</div>
                        </div>
                        {invited[c.id] && <span style={{ color: '#534AB7', fontWeight: 800 }}>✓</span>}
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={confirmarInvitados} disabled={guardandoInvitados} style={btnPrimary(guardandoInvitados)}>
                  {guardandoInvitados ? tx.nueva_saving_guests : tx.nueva_view_btn(invitedCount)}
                </button>

                <button onClick={() => router.push(`/${slugFinal}`)} style={{ width: '100%', border: 'none', background: 'none', color: '#a39ec0', fontSize: 13, fontWeight: 600, padding: '12px', cursor: 'pointer', fontFamily: FSYS, marginTop: 4 }}>
                  {lang === 'en' ? 'Skip for now →' : 'Omitir por ahora →'}
                </button>
              </div>
            )}
          </div>

          {/* Botón continuar (step type y details) */}
          {(step === 'type' || step === 'details') && (
            <button
              onClick={() => {
                if (step === 'type') { if (tipo) setStep('details') }
                else { if (rol && titulo) guardar() }
              }}
              style={btnPrimary(step === 'type' ? !tipo : (!rol || !titulo || saving))}
            >
              {step === 'type' ? tx.nueva_continue : saving ? tx.nueva_creating : tx.nueva_create}
            </button>
          )}

        </div>
      </main>
    </>
  )
}
