'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../../../supabase'
import { getLang } from '../../../i18n'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const BG_DEFAULT = 'linear-gradient(160deg,#3a1f3d,#4a2245,#2a1a3e)'

// Vista previa a tamaño real de la invitación, SOLO para la pareja (dueños/miembros
// del proyecto, vía RLS de proyectos_boda) — no necesita ningún invitado real como
// la página de RSVP normal (app/bridal/rsvp/[token]). No guarda ni manda nada.
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

function fmtFechaBonita(fecha: string | null | undefined, lang: string) {
  if (!fecha) return null
  const d = new Date(fecha + 'T00:00:00')
  if (isNaN(d.getTime())) return fecha
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Mismo criterio que el dashboard: se acerca la foto un 15% extra para que
// "arriba/centro/abajo" siempre tenga margen real que mover, sin importar la
// relación de aspecto de la foto original.
const ORIGEN_POR_POSICION: Record<string, string> = { top: '50% 0%', center: '50% 50%', bottom: '50% 100%' }
function estiloFotoConPosicion(pos: string | null | undefined) {
  const p = pos || 'center'
  return { objectFit: 'cover' as const, objectPosition: p, transform: 'scale(1.15)', transformOrigin: ORIGEN_POR_POSICION[p] || '50% 50%' }
}

export default function PreviewInvitacionBoda({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [lang, setLang] = useState('es')
  const [id, setId] = useState('')
  const [cargando, setCargando] = useState(true)
  const [proyecto, setProyecto] = useState<any>(null)
  const [noEncontrado, setNoEncontrado] = useState(false)

  // Solo para sentir cómo responde el botón — nunca se guarda ni se manda nada aquí.
  const [asistencia, setAsistencia] = useState<'si' | 'no' | 'tal_vez' | ''>('')
  const [menuPrincipal, setMenuPrincipal] = useState('')

  useEffect(() => {
    setLang(getLang())
    params.then(async ({ id }) => {
      setId(id)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data, error } = await supabase.from('proyectos_boda').select('*').eq('id', id).single()
      if (error || !data) { setNoEncontrado(true); setCargando(false); return }
      setProyecto(data)
      setCargando(false)
    })
  }, [])

  if (cargando) return (
    <main style={{ minHeight: '100vh', background: BG_DEFAULT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
      <p style={{ color: '#EEC9DD' }}>{lang === 'en' ? 'Loading…' : 'Cargando…'}</p>
    </main>
  )

  if (noEncontrado) return (
    <main style={{ minHeight: '100vh', background: BG_DEFAULT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, padding: 20 }}>
      <p style={{ color: 'rgba(255,255,255,.7)', textAlign: 'center' as const }}>
        {lang === 'en' ? "We couldn't find this project." : 'No encontramos este proyecto.'}
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
        <div style={{ padding: '0 20px', marginBottom: 10 }}>
          <a href={`/bridal/${id}`} style={{ fontSize: 12, color: txtTerciario, fontWeight: 700 }}>
            {lang === 'en' ? '← Back to dashboard' : '← Volver al dashboard'}
          </a>
          <div style={{ marginTop: 10, background: 'rgba(0,0,0,.35)', borderRadius: 99, padding: '5px 14px', display: 'inline-block' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: '.5px', textTransform: 'uppercase' as const }}>
              👁 {lang === 'en' ? 'Preview only — nothing is sent' : 'Solo vista previa — nada se manda'}
            </span>
          </div>
        </div>

        {proyecto?.portada_url && (
          <div style={{ position: 'relative', width: '100%', height: 260, marginBottom: 24, overflow: 'hidden' }}>
            <Image src={proyecto.portada_url} alt="" fill sizes="480px" style={estiloFotoConPosicion(proyecto.portada_posicion)} priority />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0) 60%,rgba(0,0,0,.35) 100%)' }} />
          </div>
        )}
        <div style={{ padding: proyecto?.portada_url ? '0 20px' : 0 }}>
        <p style={{ fontSize: 13, color: acento, fontWeight: 700, textAlign: 'center' as const, marginBottom: 4 }}>
          {lang === 'en' ? "You're invited to" : 'Estás invitad@ a la boda de'}
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 900, color: txtPrimario, margin: '0 0 6px', textAlign: 'center' as const, letterSpacing: '-.5px', fontFamily: fInv }}>{nombreBoda || (lang === 'en' ? 'Your names' : 'Tus nombres')}</h1>
        {(proyecto?.fecha_boda || proyecto?.lugar_nombre) && (
          <p style={{ fontSize: 13, color: txtTerciario, textAlign: 'center' as const, marginBottom: 28 }}>
            {fmtFechaBonita(proyecto?.fecha_boda, lang)}
            {proyecto?.fecha_boda && proyecto?.lugar_nombre && ' · '}
            {proyecto?.lugar_nombre && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(proyecto.lugar_nombre)}`} target="_blank" style={{ color: acento }}>{proyecto.lugar_nombre} ↗</a>
            )}
          </p>
        )}

        <div style={{ background: cardBg, borderRadius: 20, padding: '24px 22px' }}>
          <p style={{ fontSize: 14, color: txtPrimario, fontWeight: 700, marginBottom: 16 }}>
            {lang === 'en' ? 'Hi [Guest], will you be there?' : 'Hola [Invitado], ¿nos acompañas?'}
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
            <select value={menuPrincipal} onChange={e => setMenuPrincipal(e.target.value)} style={{ ...inputStyle, colorScheme: claro ? 'dark' as const : 'light' as const }}>
              <option value="">{lang === 'en' ? 'Choose your meal' : 'Elige tu platillo'}</option>
              {MENU_OPCIONES.map(m => <option key={m} value={m}>{lang === 'en' ? MENU_LABEL[m].en : MENU_LABEL[m].es}</option>)}
            </select>
          )}

          <textarea readOnly value="" placeholder={lang === 'en' ? 'Allergies or a note for the couple (optional)' : 'Alergias o un mensaje para la pareja (opcional)'} rows={3} style={{ ...inputStyle, resize: 'none' as const }} />

          <button disabled style={{ width: '100%', border: 'none', background: pillBg, color: txtSecundario, fontSize: 14, fontWeight: 800, padding: '12px', borderRadius: 10, cursor: 'default', fontFamily: F }}>
            {lang === 'en' ? 'Send RSVP' : 'Enviar respuesta'}
          </button>
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
