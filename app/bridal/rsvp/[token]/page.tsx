'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '../../../supabase'
import { getLang } from '../../../i18n'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const BG_DEFAULT = 'linear-gradient(160deg,#3a1f3d,#4a2245,#2a1a3e)'

// Mismos temas/fuentes que la invitación normal de Cheers (app/[usuario]/[evento])
// y que el selector del Dashboard de Bridal — así lo que la pareja elige ahí se
// ve reflejado aquí tal cual, sin un sistema de diseño aparte.
const TEMAS: Record<string, { bg: string; dark: boolean }> = {
  morado:  { bg: 'radial-gradient(circle at 18% 16%,#7b6fd0,transparent 46%),linear-gradient(160deg,#534AB7,#7b46a8 58%,#D4537E)', dark: true },
  rosa:    { bg: 'linear-gradient(155deg,#D4537E,#a14b9c)', dark: true },
  noche:   { bg: 'linear-gradient(160deg,#0f0c29,#302b63,#24243e)', dark: true },
  bosque:  { bg: 'linear-gradient(155deg,#1a3c2a,#2d6a4f,#40916c)', dark: true },
  ambar:   { bg: 'linear-gradient(155deg,#b5451b,#e76f51,#f4a261)', dark: true },
  carbon:  { bg: 'linear-gradient(160deg,#1a1a1a,#2d2d2d,#3d3d3d)', dark: true },
  lavanda: { bg: '#B8B0F0', dark: false },
  crema:   { bg: '#FBF4EC', dark: false },
}

const FUENTES: Record<string, string> = {
  system:  '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
  verdana: 'Verdana, Geneva, sans-serif',
  georgia: 'Georgia, serif',
  cursive: '"Brush Script MT", "Segoe Script", cursive',
}

const MENU_OPCIONES = ['res', 'pollo', 'vegetariano', 'vegano'] as const
const MENU_LABEL: Record<string, { es: string; en: string }> = {
  res: { es: 'Res', en: 'Beef' },
  pollo: { es: 'Pollo', en: 'Chicken' },
  vegetariano: { es: 'Vegetariano', en: 'Vegetarian' },
  vegano: { es: 'Vegano', en: 'Vegan' },
}

export default function RsvpBoda({ params }: { params: Promise<{ token: string }> }) {
  const [lang, setLang] = useState('es')
  const [token, setToken] = useState('')
  const [cargando, setCargando] = useState(true)
  const [invitado, setInvitado] = useState<any>(null)
  const [noEncontrado, setNoEncontrado] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const [asistencia, setAsistencia] = useState<'si' | 'no' | 'tal_vez' | ''>('')
  const [numAcompanantes, setNumAcompanantes] = useState(0)
  const [menuPrincipal, setMenuPrincipal] = useState('')
  const [acompanantes, setAcompanantes] = useState<{ nombre: string; menu: string }[]>([])
  const [notas, setNotas] = useState('')

  useEffect(() => {
    setLang(getLang())
    params.then(async ({ token }) => {
      setToken(token)
      const { data, error } = await supabase.rpc('get_invitado_boda_por_token', { p_token: token })
      const info = Array.isArray(data) ? data[0] : data
      if (error || !info) { setNoEncontrado(true); setCargando(false); return }
      setInvitado(info)
      setCargando(false)
    })
  }, [])

  function actualizarNumAcompanantes(n: number) {
    setNumAcompanantes(n)
    setAcompanantes(prev => {
      const next = [...prev]
      while (next.length < n) next.push({ nombre: '', menu: '' })
      return next.slice(0, n)
    })
  }

  async function enviar() {
    if (!asistencia) return
    setEnviando(true)
    const { data } = await supabase.rpc('enviar_rsvp_boda', {
      p_token: token,
      p_asistencia: asistencia,
      p_num_acompanantes: numAcompanantes,
      p_menu_principal: menuPrincipal || null,
      p_notas: notas.trim() || null,
      p_acompanantes: acompanantes,
    })
    setEnviando(false)
    if (data) setEnviado(true)
  }

  if (cargando) return (
    <main style={{ minHeight: '100vh', background: BG_DEFAULT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
      <p style={{ color: '#EEC9DD' }}>{lang === 'en' ? 'Loading…' : 'Cargando…'}</p>
    </main>
  )

  if (noEncontrado) return (
    <main style={{ minHeight: '100vh', background: BG_DEFAULT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, padding: 20 }}>
      <p style={{ color: 'rgba(255,255,255,.7)', textAlign: 'center' as const }}>
        {lang === 'en' ? "We couldn't find this invitation." : 'No encontramos esta invitación.'}
      </p>
    </main>
  )

  // Tema/fuente/portada son lo que la pareja eligió en el Dashboard de Bridal —
  // se aplican aquí tal cual, mismo patrón que la invitación normal de Cheers.
  const te = TEMAS[invitado?.tema] || TEMAS.morado
  const fInv = FUENTES[invitado?.fuente] || F
  const claro = te.dark
  const txtPrimario = claro ? '#fff' : '#2a2440'
  const txtSecundario = claro ? 'rgba(255,255,255,.75)' : 'rgba(42,36,64,.7)'
  const txtTerciario = claro ? 'rgba(255,255,255,.5)' : 'rgba(42,36,64,.55)'
  const cardBg = claro ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)'
  const pillBg = claro ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'
  const acento = claro ? '#EEC9DD' : '#534AB7'
  const inputStyle: React.CSSProperties = {
    width: '100%', border: `1px solid ${claro ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.12)'}`, background: pillBg,
    color: txtPrimario, fontSize: 14, padding: '11px 14px', borderRadius: 10, fontFamily: F, marginBottom: 10,
  }

  if (enviado) return (
    <main style={{ minHeight: '100vh', background: te.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, padding: 20 }}>
      <div style={{ textAlign: 'center' as const, maxWidth: 400 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>💌</div>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: txtPrimario, margin: '0 0 8px' }}>{lang === 'en' ? 'Thank you!' : '¡Gracias!'}</h1>
        <p style={{ fontSize: 14, color: txtSecundario }}>
          {lang === 'en' ? 'Your response has been saved.' : 'Tu respuesta quedó guardada.'}
        </p>
      </div>
    </main>
  )

  const nombreBoda = [invitado.nombre_novia, invitado.nombre_novio].filter(Boolean).join(' & ')

  return (
    <main style={{ minHeight: '100vh', background: te.bg, fontFamily: F, padding: invitado.portada_url ? '0 0 60px' : '60px 20px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {invitado.portada_url && (
          <div style={{ position: 'relative', width: '100%', height: 260, marginBottom: 24 }}>
            <Image src={invitado.portada_url} alt="" fill sizes="480px" style={{ objectFit: 'cover', objectPosition: invitado.portada_posicion || 'center' }} priority />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0) 60%,rgba(0,0,0,.35) 100%)' }} />
          </div>
        )}
        <div style={{ padding: invitado.portada_url ? '0 20px' : 0 }}>
        <p style={{ fontSize: 13, color: acento, fontWeight: 700, textAlign: 'center' as const, marginBottom: 4 }}>
          {lang === 'en' ? "You're invited to" : 'Estás invitad@ a la boda de'}
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: txtPrimario, margin: '0 0 6px', textAlign: 'center' as const, letterSpacing: '-.5px', fontFamily: fInv }}>{nombreBoda}</h1>
        {(invitado.fecha_boda || invitado.lugar_nombre) && (
          <p style={{ fontSize: 13, color: txtTerciario, textAlign: 'center' as const, marginBottom: 28 }}>
            {invitado.fecha_boda}
            {invitado.fecha_boda && invitado.lugar_nombre && ' · '}
            {invitado.lugar_nombre && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(invitado.lugar_nombre)}`} target="_blank" style={{ color: acento }}>{invitado.lugar_nombre} ↗</a>
            )}
          </p>
        )}

        <div style={{ background: cardBg, borderRadius: 20, padding: '24px 22px' }}>
          <p style={{ fontSize: 14, color: txtPrimario, fontWeight: 700, marginBottom: 16 }}>
            {lang === 'en' ? `Hi ${invitado.nombre}, will you be there?` : `Hola ${invitado.nombre}, ¿nos acompañas?`}
          </p>

          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {(['si', 'tal_vez', 'no'] as const).map(op => (
              <button key={op} onClick={() => setAsistencia(op)} style={{
                flex: 1, border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 800, padding: '10px', borderRadius: 10,
                background: asistencia === op ? 'linear-gradient(135deg,#534AB7,#D4537E)' : pillBg,
                color: asistencia === op ? '#fff' : txtSecundario,
              }}>
                {op === 'si' ? (lang === 'en' ? 'Yes' : 'Sí') : op === 'no' ? (lang === 'en' ? 'No' : 'No') : (lang === 'en' ? 'Maybe' : 'Tal vez')}
              </button>
            ))}
          </div>

          {(asistencia === 'si' || asistencia === 'tal_vez') && (
            <>
              {MENU_OPCIONES.length > 0 && (
                <select value={menuPrincipal} onChange={e => setMenuPrincipal(e.target.value)} style={{ ...inputStyle, colorScheme: claro ? 'dark' as const : 'light' as const }}>
                  <option value="">{lang === 'en' ? 'Choose your meal' : 'Elige tu platillo'}</option>
                  {MENU_OPCIONES.map(m => <option key={m} value={m}>{lang === 'en' ? MENU_LABEL[m].en : MENU_LABEL[m].es}</option>)}
                </select>
              )}

              {invitado.acompanantes_permitidos > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 12, color: txtSecundario, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                    {lang === 'en' ? `How many guests with you? (up to ${invitado.acompanantes_permitidos})` : `¿Cuántos acompañantes traes? (hasta ${invitado.acompanantes_permitidos})`}
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {Array.from({ length: invitado.acompanantes_permitidos + 1 }, (_, n) => n).map(n => (
                      <button key={n} onClick={() => actualizarNumAcompanantes(n)} style={{
                        width: 34, height: 34, border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 800, borderRadius: 9,
                        background: numAcompanantes === n ? 'linear-gradient(135deg,#534AB7,#D4537E)' : pillBg,
                        color: numAcompanantes === n ? '#fff' : txtSecundario,
                      }}>{n}</button>
                    ))}
                  </div>
                </div>
              )}

              {acompanantes.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <input value={a.nombre} onChange={e => setAcompanantes(prev => prev.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))} placeholder={lang === 'en' ? `Guest ${i + 1} name` : `Nombre acompañante ${i + 1}`} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
                  <select value={a.menu} onChange={e => setAcompanantes(prev => prev.map((x, j) => j === i ? { ...x, menu: e.target.value } : x))} style={{ ...inputStyle, marginBottom: 0, width: 130, colorScheme: claro ? 'dark' as const : 'light' as const }}>
                    <option value="">{lang === 'en' ? 'Meal' : 'Platillo'}</option>
                    {MENU_OPCIONES.map(m => <option key={m} value={m}>{lang === 'en' ? MENU_LABEL[m].en : MENU_LABEL[m].es}</option>)}
                  </select>
                </div>
              ))}
            </>
          )}

          <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder={lang === 'en' ? 'Allergies or a note for the couple (optional)' : 'Alergias o un mensaje para la pareja (opcional)'} rows={3} style={{ ...inputStyle, resize: 'none' as const }} />

          <button onClick={enviar} disabled={!asistencia || enviando} style={{ width: '100%', border: 'none', background: !asistencia ? pillBg : 'linear-gradient(135deg,#534AB7,#D4537E)', color: !asistencia ? txtSecundario : '#fff', fontSize: 14, fontWeight: 800, padding: '12px', borderRadius: 10, cursor: asistencia ? 'pointer' : 'default', fontFamily: F }}>
            {enviando ? '...' : (lang === 'en' ? 'Send RSVP' : 'Enviar respuesta')}
          </button>
        </div>

        {(invitado.info_viaje || invitado.faq) && (
          <div style={{ background: cardBg, borderRadius: 20, padding: '20px 22px', marginTop: 16 }}>
            {invitado.info_viaje && (
              <div style={{ marginBottom: invitado.faq ? 16 : 0 }}>
                <div style={{ fontSize: 11, color: acento, fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 6 }}>{lang === 'en' ? 'Travel & stay' : 'Viaje y hospedaje'}</div>
                <p style={{ fontSize: 13, color: txtSecundario, whiteSpace: 'pre-wrap' as const, lineHeight: 1.5 }}>{invitado.info_viaje}</p>
              </div>
            )}
            {invitado.faq && (
              <div>
                <div style={{ fontSize: 11, color: acento, fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 6 }}>FAQ</div>
                <p style={{ fontSize: 13, color: txtSecundario, whiteSpace: 'pre-wrap' as const, lineHeight: 1.5 }}>{invitado.faq}</p>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </main>
  )
}
