'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../../../supabase'
import { getLang } from '../../../i18n'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const BG_DEFAULT = 'linear-gradient(160deg,#3a1f3d,#4a2245,#2a1a3e)'

// Página PÚBLICA de la invitación de boda — no necesita sesión ni token en la
// URL, a diferencia de /bridal/rsvp/[token] (link personal por correo). Sirve
// para compartir en redes/WhatsApp. Para confirmar asistencia, el invitado
// tiene que estar en la lista (boda_invitados) y validar su correo con un
// código de 6 dígitos — así cualquiera puede ver la invitación, pero nadie
// puede confirmar por otra persona. Al validar el código, lo mandamos a su
// link personal de siempre (/bridal/rsvp/[token]), que ya tiene todo el flujo
// de RSVP construido — esta página no lo duplica.
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

function fmtFechaBonita(fecha: string | null | undefined, lang: string) {
  if (!fecha) return null
  const d = new Date(fecha + 'T00:00:00')
  if (isNaN(d.getTime())) return fecha
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

const ORIGEN_POR_POSICION: Record<string, string> = { top: '50% 0%', center: '50% 50%', bottom: '50% 100%' }
function estiloFotoConPosicion(pos: string | null | undefined) {
  const p = pos || 'center'
  return { objectFit: 'cover' as const, objectPosition: p, transform: 'scale(1.15)', transformOrigin: ORIGEN_POR_POSICION[p] || '50% 50%' }
}

export default function InvitacionPublicaBoda({ params }: { params: Promise<{ usuario: string; slug: string }> }) {
  const router = useRouter()
  const [lang, setLang] = useState('es')
  const [bodaId, setBodaId] = useState('')
  const [cargando, setCargando] = useState(true)
  const [proyecto, setProyecto] = useState<any>(null)
  const [noEncontrado, setNoEncontrado] = useState(false)

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  const [paso, setPaso] = useState<'email' | 'codigo'>('email')
  const [emailInput, setEmailInput] = useState('')
  const [codigoInput, setCodigoInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLang(getLang())
    params.then(async ({ usuario, slug }) => {
      const { data, error } = await supabase.rpc('get_proyecto_boda_publico_por_slug', { p_username: usuario, p_slug: slug })
      const fila = data?.[0]
      if (error || !fila) { setNoEncontrado(true); setCargando(false); return }
      setBodaId(fila.id)
      setProyecto(fila)
      setCargando(false)
    })
  }, [])

  async function solicitarCodigo() {
    if (!emailInput.trim()) return
    setEnviando(true)
    setError('')
    await fetch('/api/bridal-solicitar-codigo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bodaId, email: emailInput.trim() }),
    }).catch(() => {})
    setEnviando(false)
    setPaso('codigo')
  }

  async function verificarCodigo() {
    if (!codigoInput.trim()) return
    setEnviando(true)
    setError('')
    try {
      const res = await fetch('/api/bridal-verificar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bodaId, email: emailInput.trim(), codigo: codigoInput.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.token) {
        router.push(`/bridal/rsvp/${data.token}`)
        return
      }
      setError(lang === 'en' ? 'Wrong or expired code.' : 'Código incorrecto o vencido.')
    } catch {
      setError(lang === 'en' ? 'Something went wrong, please try again.' : 'Algo salió mal, intenta de nuevo.')
    }
    setEnviando(false)
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

  const te = TEMAS[proyecto?.tema] || TEMAS.morado
  const fInv = FUENTES[proyecto?.fuente] || F
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
  const nombreBoda = [proyecto?.nombre_novia, proyecto?.nombre_novio].filter(Boolean).join(' & ')

  return (
    <main style={{ minHeight: '100vh', background: te.bg, fontFamily: F, padding: proyecto?.portada_url ? '0 0 60px' : '60px 20px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {proyecto?.portada_url && (
          <div style={{ position: 'relative', width: '100%', height: 260, marginBottom: 24, overflow: 'hidden' }}>
            <Image src={proyecto.portada_url} alt="" fill sizes="480px" style={estiloFotoConPosicion(proyecto.portada_posicion)} priority />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0) 60%,rgba(0,0,0,.35) 100%)' }} />
          </div>
        )}
        <div style={{ padding: proyecto?.portada_url ? '0 20px' : 0 }}>
        <p style={{ fontSize: 13, color: acento, fontWeight: 700, textAlign: 'center' as const, marginBottom: 4 }}>
          {lang === 'en' ? "You're invited to the wedding of" : 'Estás invitad@ a la boda de'}
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: txtPrimario, margin: '0 0 6px', textAlign: 'center' as const, letterSpacing: '-.5px', fontFamily: fInv }}>{nombreBoda || (lang === 'en' ? 'Their names' : 'Sus nombres')}</h1>
        {(proyecto?.fecha_boda || proyecto?.lugar_nombre) && (
          <p style={{ fontSize: 13, color: txtTerciario, textAlign: 'center' as const, marginBottom: 28 }}>
            {fmtFechaBonita(proyecto?.fecha_boda, lang)}
            {proyecto?.hora_boda ? `, ${new Date(`2000-01-01T${proyecto.hora_boda.slice(0, 5)}`).toLocaleTimeString(lang === 'en' ? 'en-US' : 'es-MX', { hour: 'numeric', minute: '2-digit' })}` : ''}
            {(proyecto?.fecha_boda || proyecto?.hora_boda) && proyecto?.lugar_nombre && ' · '}
            {proyecto?.lugar_nombre && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(proyecto.lugar_nombre)}`} target="_blank" style={{ color: acento }}>{proyecto.lugar_nombre} ↗</a>
            )}
          </p>
        )}

        <div style={{ background: cardBg, borderRadius: 20, padding: '24px 22px' }}>
          {!mostrarConfirmacion ? (
            <button onClick={() => setMostrarConfirmacion(true)} style={{ width: '100%', border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 14, fontWeight: 800, padding: '13px', borderRadius: 10, cursor: 'pointer', fontFamily: F }}>
              {lang === 'en' ? 'Confirm attendance' : 'Confirmar asistencia'}
            </button>
          ) : paso === 'email' ? (
            <div>
              <p style={{ fontSize: 13, color: txtSecundario, marginBottom: 12 }}>
                {lang === 'en' ? "Enter the email you were invited with — we'll send you a code." : 'Escribe el correo con el que te invitaron — te mandamos un código.'}
              </p>
              <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)} placeholder="tu@correo.com" style={inputStyle} />
              <button onClick={solicitarCodigo} disabled={enviando || !emailInput.trim()} style={{ width: '100%', border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 14, fontWeight: 800, padding: '12px', borderRadius: 10, cursor: 'pointer', fontFamily: F }}>
                {enviando ? '...' : (lang === 'en' ? 'Send code' : 'Mandar código')}
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: txtSecundario, marginBottom: 12 }}>
                {lang === 'en' ? 'Enter the 6-digit code we emailed you.' : 'Escribe el código de 6 dígitos que te mandamos por correo.'}
              </p>
              <input value={codigoInput} onChange={e => setCodigoInput(e.target.value)} placeholder="000000" maxLength={6} style={{ ...inputStyle, textAlign: 'center' as const, letterSpacing: 4, fontSize: 18, fontWeight: 800 }} />
              {error && <p style={{ fontSize: 12, color: '#f08cb0', marginBottom: 10 }}>{error}</p>}
              <button onClick={verificarCodigo} disabled={enviando || !codigoInput.trim()} style={{ width: '100%', border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 14, fontWeight: 800, padding: '12px', borderRadius: 10, cursor: 'pointer', fontFamily: F, marginBottom: 8 }}>
                {enviando ? '...' : (lang === 'en' ? 'Continue' : 'Continuar')}
              </button>
              <button onClick={() => { setPaso('email'); setError('') }} style={{ width: '100%', border: 'none', background: 'transparent', color: txtTerciario, fontSize: 12, fontWeight: 700, padding: '4px', cursor: 'pointer', fontFamily: F }}>
                {lang === 'en' ? '← Use a different email' : '← Usar otro correo'}
              </button>
            </div>
          )}
        </div>

        {(proyecto?.info_viaje || proyecto?.faq) && (
          <div style={{ background: cardBg, borderRadius: 20, padding: '20px 22px', marginTop: 16 }}>
            {proyecto?.info_viaje && (
              <div style={{ marginBottom: proyecto?.faq ? 16 : 0 }}>
                <div style={{ fontSize: 11, color: acento, fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 6 }}>{lang === 'en' ? 'Travel & stay' : 'Viaje y hospedaje'}</div>
                <p style={{ fontSize: 13, color: txtSecundario, whiteSpace: 'pre-wrap' as const, lineHeight: 1.5 }}>{proyecto.info_viaje}</p>
              </div>
            )}
            {proyecto?.faq && (
              <div>
                <div style={{ fontSize: 11, color: acento, fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 6 }}>FAQ</div>
                <p style={{ fontSize: 13, color: txtSecundario, whiteSpace: 'pre-wrap' as const, lineHeight: 1.5 }}>{proyecto.faq}</p>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </main>
  )
}
