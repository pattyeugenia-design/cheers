'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../supabase'
import { getLang } from '../../../i18n'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const BG = 'linear-gradient(160deg,#3a1f3d,#4a2245,#2a1a3e)'

const MENU_OPCIONES = ['res', 'pollo', 'vegetariano', 'vegano'] as const
const MENU_LABEL: Record<string, { es: string; en: string }> = {
  res: { es: 'Res', en: 'Beef' },
  pollo: { es: 'Pollo', en: 'Chicken' },
  vegetariano: { es: 'Vegetariano', en: 'Vegetarian' },
  vegano: { es: 'Vegano', en: 'Vegan' },
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.06)',
  color: '#fff', fontSize: 14, padding: '11px 14px', borderRadius: 10, fontFamily: F, marginBottom: 10,
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
    <main style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
      <p style={{ color: '#EEC9DD' }}>{lang === 'en' ? 'Loading…' : 'Cargando…'}</p>
    </main>
  )

  if (noEncontrado) return (
    <main style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, padding: 20 }}>
      <p style={{ color: 'rgba(255,255,255,.7)', textAlign: 'center' as const }}>
        {lang === 'en' ? "We couldn't find this invitation." : 'No encontramos esta invitación.'}
      </p>
    </main>
  )

  if (enviado) return (
    <main style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, padding: 20 }}>
      <div style={{ textAlign: 'center' as const, maxWidth: 400 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>💌</div>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>{lang === 'en' ? 'Thank you!' : '¡Gracias!'}</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)' }}>
          {lang === 'en' ? 'Your response has been saved.' : 'Tu respuesta quedó guardada.'}
        </p>
      </div>
    </main>
  )

  const nombreBoda = [invitado.nombre_novia, invitado.nombre_novio].filter(Boolean).join(' & ')

  return (
    <main style={{ minHeight: '100vh', background: BG, fontFamily: F, padding: '60px 20px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <p style={{ fontSize: 13, color: '#EEC9DD', fontWeight: 700, textAlign: 'center' as const, marginBottom: 4 }}>
          {lang === 'en' ? "You're invited to" : 'Estás invitad@ a la boda de'}
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 6px', textAlign: 'center' as const, letterSpacing: '-.5px' }}>{nombreBoda}</h1>
        {(invitado.fecha_boda || invitado.lugar_nombre) && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', textAlign: 'center' as const, marginBottom: 28 }}>
            {invitado.fecha_boda}
            {invitado.fecha_boda && invitado.lugar_nombre && ' · '}
            {invitado.lugar_nombre && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(invitado.lugar_nombre)}`} target="_blank" style={{ color: '#EEC9DD' }}>{invitado.lugar_nombre} ↗</a>
            )}
          </p>
        )}

        <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 20, padding: '24px 22px' }}>
          <p style={{ fontSize: 14, color: '#fff', fontWeight: 700, marginBottom: 16 }}>
            {lang === 'en' ? `Hi ${invitado.nombre}, will you be there?` : `Hola ${invitado.nombre}, ¿nos acompañas?`}
          </p>

          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {(['si', 'tal_vez', 'no'] as const).map(op => (
              <button key={op} onClick={() => setAsistencia(op)} style={{
                flex: 1, border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 800, padding: '10px', borderRadius: 10,
                background: asistencia === op ? 'linear-gradient(135deg,#534AB7,#D4537E)' : 'rgba(255,255,255,.08)',
                color: asistencia === op ? '#fff' : 'rgba(255,255,255,.6)',
              }}>
                {op === 'si' ? (lang === 'en' ? 'Yes' : 'Sí') : op === 'no' ? (lang === 'en' ? 'No' : 'No') : (lang === 'en' ? 'Maybe' : 'Tal vez')}
              </button>
            ))}
          </div>

          {(asistencia === 'si' || asistencia === 'tal_vez') && (
            <>
              {MENU_OPCIONES.length > 0 && (
                <select value={menuPrincipal} onChange={e => setMenuPrincipal(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' as const }}>
                  <option value="">{lang === 'en' ? 'Choose your meal' : 'Elige tu platillo'}</option>
                  {MENU_OPCIONES.map(m => <option key={m} value={m}>{lang === 'en' ? MENU_LABEL[m].en : MENU_LABEL[m].es}</option>)}
                </select>
              )}

              {invitado.acompanantes_permitidos > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                    {lang === 'en' ? `How many guests with you? (up to ${invitado.acompanantes_permitidos})` : `¿Cuántos acompañantes traes? (hasta ${invitado.acompanantes_permitidos})`}
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {Array.from({ length: invitado.acompanantes_permitidos + 1 }, (_, n) => n).map(n => (
                      <button key={n} onClick={() => actualizarNumAcompanantes(n)} style={{
                        width: 34, height: 34, border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 800, borderRadius: 9,
                        background: numAcompanantes === n ? 'linear-gradient(135deg,#534AB7,#D4537E)' : 'rgba(255,255,255,.08)',
                        color: numAcompanantes === n ? '#fff' : 'rgba(255,255,255,.6)',
                      }}>{n}</button>
                    ))}
                  </div>
                </div>
              )}

              {acompanantes.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <input value={a.nombre} onChange={e => setAcompanantes(prev => prev.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))} placeholder={lang === 'en' ? `Guest ${i + 1} name` : `Nombre acompañante ${i + 1}`} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
                  <select value={a.menu} onChange={e => setAcompanantes(prev => prev.map((x, j) => j === i ? { ...x, menu: e.target.value } : x))} style={{ ...inputStyle, marginBottom: 0, width: 130, colorScheme: 'dark' as const }}>
                    <option value="">{lang === 'en' ? 'Meal' : 'Platillo'}</option>
                    {MENU_OPCIONES.map(m => <option key={m} value={m}>{lang === 'en' ? MENU_LABEL[m].en : MENU_LABEL[m].es}</option>)}
                  </select>
                </div>
              ))}
            </>
          )}

          <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder={lang === 'en' ? 'Allergies or a note for the couple (optional)' : 'Alergias o un mensaje para la pareja (opcional)'} rows={3} style={{ ...inputStyle, resize: 'none' as const }} />

          <button onClick={enviar} disabled={!asistencia || enviando} style={{ width: '100%', border: 'none', background: !asistencia ? 'rgba(255,255,255,.15)' : 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 14, fontWeight: 800, padding: '12px', borderRadius: 10, cursor: asistencia ? 'pointer' : 'default', fontFamily: F }}>
            {enviando ? '...' : (lang === 'en' ? 'Send RSVP' : 'Enviar respuesta')}
          </button>
        </div>

        {(invitado.info_viaje || invitado.faq) && (
          <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 20, padding: '20px 22px', marginTop: 16 }}>
            {invitado.info_viaje && (
              <div style={{ marginBottom: invitado.faq ? 16 : 0 }}>
                <div style={{ fontSize: 11, color: '#EEC9DD', fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 6 }}>{lang === 'en' ? 'Travel & stay' : 'Viaje y hospedaje'}</div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', whiteSpace: 'pre-wrap' as const, lineHeight: 1.5 }}>{invitado.info_viaje}</p>
              </div>
            )}
            {invitado.faq && (
              <div>
                <div style={{ fontSize: 11, color: '#EEC9DD', fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 6 }}>FAQ</div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', whiteSpace: 'pre-wrap' as const, lineHeight: 1.5 }}>{invitado.faq}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
