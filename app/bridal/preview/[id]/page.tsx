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

// Countdown en vivo (días/horas/min/seg) — mismo estilo visual que el resto de
// tarjetas de la invitación, se actualiza solo cada segundo sin recargar nada.
function Countdown({ fecha, hora, cardBg, txtPrimario, txtTerciario, acento, lang }: {
  fecha: string; hora: string | null; cardBg: string; txtPrimario: string; txtTerciario: string; acento: string; lang: string
}) {
  const [restante, setRestante] = useState<{ dias: number; horas: number; min: number; seg: number } | null>(null)

  useEffect(() => {
    const objetivo = new Date(`${fecha}T${hora || '00:00'}:00`).getTime()
    function actualizar() {
      const diff = objetivo - Date.now()
      if (diff <= 0) { setRestante({ dias: 0, horas: 0, min: 0, seg: 0 }); return }
      setRestante({
        dias: Math.floor(diff / 86400000),
        horas: Math.floor((diff % 86400000) / 3600000),
        min: Math.floor((diff % 3600000) / 60000),
        seg: Math.floor((diff % 60000) / 1000),
      })
    }
    actualizar()
    const t = setInterval(actualizar, 1000)
    return () => clearInterval(t)
  }, [fecha, hora])

  if (!restante) return null

  const unidades = [
    { valor: restante.dias, label: lang === 'en' ? 'days' : 'días' },
    { valor: restante.horas, label: lang === 'en' ? 'hours' : 'horas' },
    { valor: restante.min, label: lang === 'en' ? 'min' : 'min' },
    { valor: restante.seg, label: lang === 'en' ? 'sec' : 'seg' },
  ]

  return (
    <div style={{ background: cardBg, borderRadius: 20, padding: '18px 12px', marginBottom: 16 }}>
      <p style={{ fontSize: 10, color: acento, fontWeight: 800, textTransform: 'uppercase' as const, textAlign: 'center' as const, margin: '0 0 12px', letterSpacing: '.5px' }}>
        {lang === 'en' ? 'Time to go' : 'Faltan'}
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        {unidades.map((u, i) => (
          <div key={i} style={{ textAlign: 'center' as const, minWidth: 52 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: txtPrimario, fontVariantNumeric: 'tabular-nums' as const }}>{String(u.valor).padStart(2, '0')}</div>
            <div style={{ fontSize: 9, color: txtTerciario, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.3px' }}>{u.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatICSDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function calendarLinksBoda(nombre: string, fecha: string, hora: string | null, lugar: string | null) {
  const inicio = new Date(`${fecha}T${hora || '12:00'}:00`)
  const fin = new Date(inicio.getTime() + 5 * 60 * 60 * 1000)
  const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(nombre)}&dates=${formatICSDate(inicio)}/${formatICSDate(fin)}&location=${encodeURIComponent(lugar || '')}`
  const icsContent = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `DTSTART:${formatICSDate(inicio)}`, `DTEND:${formatICSDate(fin)}`, `SUMMARY:${nombre}`, `LOCATION:${lugar || ''}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
  const icsUrl = `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`
  return { googleUrl, icsUrl }
}

export default function PreviewInvitacionBoda({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [lang, setLang] = useState('es')
  const [id, setId] = useState('')
  const [cargando, setCargando] = useState(true)
  const [proyecto, setProyecto] = useState<any>(null)
  const [noEncontrado, setNoEncontrado] = useState(false)
  const [firmas, setFirmas] = useState<any[]>([])
  const [fotos, setFotos] = useState<any[]>([])

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
      const { data: fm } = await supabase.from('boda_firmas').select('*').eq('boda_id', id).eq('aprobado', true).order('created_at', { ascending: false })
      setFirmas(fm || [])
      const { data: fo } = await supabase.from('boda_fotos').select('*').eq('boda_id', id).eq('aprobado', true).order('created_at', { ascending: false })
      setFotos(fo || [])
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
          <p style={{ fontSize: 13, color: txtTerciario, textAlign: 'center' as const, marginBottom: 8 }}>
            {fmtFechaBonita(proyecto?.fecha_boda, lang)}
            {proyecto?.fecha_boda && proyecto?.lugar_nombre && ' · '}
            {proyecto?.lugar_nombre && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(proyecto.lugar_nombre)}`} target="_blank" style={{ color: acento }}>{proyecto.lugar_nombre} ↗</a>
            )}
          </p>
        )}

        {proyecto?.fecha_boda && (() => {
          const { googleUrl, icsUrl } = calendarLinksBoda(nombreBoda || 'Boda', proyecto.fecha_boda, proyecto.hora_boda, proyecto.lugar_nombre)
          return (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
              <a href={googleUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 700, color: txtPrimario, background: pillBg, padding: '6px 12px', borderRadius: 99, textDecoration: 'none' }}>+ Google Calendar</a>
              <a href={icsUrl} download="boda.ics" style={{ fontSize: 11, fontWeight: 700, color: txtPrimario, background: pillBg, padding: '6px 12px', borderRadius: 99, textDecoration: 'none' }}>+ Apple/Outlook</a>
            </div>
          )
        })()}

        {proyecto?.fecha_boda && (
          <Countdown fecha={proyecto.fecha_boda} hora={proyecto.hora_boda} cardBg={cardBg} txtPrimario={txtPrimario} txtTerciario={txtTerciario} acento={acento} lang={lang} />
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

        {proyecto?.itinerario && proyecto.itinerario.length > 0 && (
          <div style={{ background: cardBg, borderRadius: 20, padding: '22px 20px', marginTop: 16 }}>
            <div style={{ fontSize: 11, color: acento, fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 14 }}>{lang === 'en' ? 'Itinerary' : 'Itinerario'}</div>
            {proyecto.itinerario.map((it: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < proyecto.itinerario.length - 1 ? 14 : 0 }}>
                <div style={{ fontSize: 20, lineHeight: 1 }}>{it.icono || '⏰'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: acento, fontWeight: 800 }}>{it.hora}</div>
                  <div style={{ fontSize: 14, color: txtPrimario, fontWeight: 700 }}>{it.titulo}</div>
                  {it.lugar && <div style={{ fontSize: 12, color: txtSecundario }}>{it.lugar}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {proyecto?.vestimenta_tipo && (
          <div style={{ background: cardBg, borderRadius: 20, padding: '22px 20px', marginTop: 16, textAlign: 'center' as const }}>
            <div style={{ fontSize: 11, color: acento, fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 8 }}>{lang === 'en' ? 'Dress code' : 'Vestimenta'}</div>
            <div style={{ fontSize: 16, color: txtPrimario, fontWeight: 700, marginBottom: proyecto?.vestimenta_colores?.length > 0 ? 12 : 0 }}>{proyecto.vestimenta_tipo}</div>
            {proyecto?.vestimenta_colores?.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: proyecto?.vestimenta_nota ? 10 : 0 }}>
                {proyecto.vestimenta_colores.map((c: any, i: number) => (
                  <div key={i} style={{ textAlign: 'center' as const }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: c.hex, border: '1px solid rgba(0,0,0,.1)', margin: '0 auto 4px' }} />
                    <div style={{ fontSize: 9, color: txtTerciario }}>{c.nombre}</div>
                  </div>
                ))}
              </div>
            )}
            {proyecto?.vestimenta_nota && <p style={{ fontSize: 12, color: txtSecundario, fontStyle: 'italic', margin: 0 }}>{proyecto.vestimenta_nota}</p>}
          </div>
        )}

        {proyecto?.lugar2_nombre && (
          <div style={{ background: cardBg, borderRadius: 20, padding: '22px 20px', marginTop: 16 }}>
            <div style={{ fontSize: 11, color: acento, fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 10 }}>{lang === 'en' ? 'Locations' : 'Ubicaciones'}</div>
            {proyecto?.lugar_nombre && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: txtTerciario, fontWeight: 700, textTransform: 'uppercase' as const }}>{lang === 'en' ? 'Ceremony' : 'Ceremonia'}</div>
                <a href={`https://maps.google.com/?q=${encodeURIComponent(proyecto.lugar_nombre)}`} target="_blank" style={{ fontSize: 14, color: txtPrimario, fontWeight: 700, textDecoration: 'none' }}>{proyecto.lugar_nombre} ↗</a>
              </div>
            )}
            <div>
              <div style={{ fontSize: 10, color: txtTerciario, fontWeight: 700, textTransform: 'uppercase' as const }}>{lang === 'en' ? 'Reception' : 'Recepción'}</div>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(proyecto.lugar2_nombre)}`} target="_blank" style={{ fontSize: 14, color: txtPrimario, fontWeight: 700, textDecoration: 'none' }}>{proyecto.lugar2_nombre} ↗</a>
            </div>
          </div>
        )}

        {proyecto?.hoteles && proyecto.hoteles.length > 0 && (
          <div style={{ background: cardBg, borderRadius: 20, padding: '22px 20px', marginTop: 16 }}>
            <div style={{ fontSize: 11, color: acento, fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 12 }}>{lang === 'en' ? 'Where to stay' : 'Hospedaje'}</div>
            {proyecto.hoteles.map((h: any, i: number) => (
              <div key={i} style={{ marginBottom: i < proyecto.hoteles.length - 1 ? 14 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, color: txtPrimario, fontWeight: 700 }}>{h.nombre}</span>
                  {h.tarifa_especial && <span style={{ fontSize: 9, fontWeight: 800, color: acento, background: pillBg, padding: '2px 8px', borderRadius: 99 }}>{lang === 'en' ? 'SPECIAL RATE' : 'TARIFA ESPECIAL'}</span>}
                </div>
                {h.direccion && (
                  <a href={h.link || `https://maps.google.com/?q=${encodeURIComponent(h.direccion)}`} target="_blank" style={{ fontSize: 12, color: txtSecundario, textDecoration: 'none' }}>{h.direccion} ↗</a>
                )}
              </div>
            ))}
          </div>
        )}

        {(proyecto?.mesa_regalos_link || proyecto?.mesa_regalos_nota || proyecto?.lluvia_sobres) && (
          <div style={{ background: cardBg, borderRadius: 20, padding: '22px 20px', marginTop: 16, textAlign: 'center' as const }}>
            <div style={{ fontSize: 11, color: acento, fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 10 }}>{lang === 'en' ? 'Gift registry' : 'Mesa de regalos'}</div>
            {proyecto?.mesa_regalos_nota && <p style={{ fontSize: 13, color: txtSecundario, margin: '0 0 12px', lineHeight: 1.5 }}>{proyecto.mesa_regalos_nota}</p>}
            {proyecto?.mesa_regalos_link && /^https?:\/\//i.test(proyecto.mesa_regalos_link) && (
              <a href={proyecto.mesa_regalos_link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', fontSize: 13, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#534AB7,#D4537E)', padding: '10px 20px', borderRadius: 99, textDecoration: 'none', marginBottom: proyecto?.lluvia_sobres ? 12 : 0 }}>
                {lang === 'en' ? 'See registry' : 'Ver mesa de regalos'} ↗
              </a>
            )}
            {proyecto?.lluvia_sobres && (
              <p style={{ fontSize: 12, color: txtTerciario, margin: 0 }}>
                {lang === 'en' ? 'There will be an envelope box at the entrance on the day of the event.' : 'El día del evento habrá un buzón en la entrada para recibir tu sobre.'}
              </p>
            )}
          </div>
        )}

        <div style={{ background: cardBg, borderRadius: 20, padding: '22px 20px', marginTop: 16 }}>
          <div style={{ fontSize: 11, color: acento, fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 12 }}>{lang === 'en' ? 'Guest book' : 'Libro de firmas'}</div>
          {firmas.length > 0 ? (
            firmas.map((f, i) => (
              <div key={i} style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,.06)' : 'none', paddingTop: i > 0 ? 12 : 0, marginTop: i > 0 ? 12 : 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: txtPrimario, marginBottom: 3 }}>{f.nombre}</div>
                <div style={{ fontSize: 13, color: txtSecundario, whiteSpace: 'pre-wrap' as const }}>{f.mensaje}</div>
              </div>
            ))
          ) : (
            <p style={{ fontSize: 12, color: txtTerciario, margin: 0 }}>{lang === 'en' ? 'Messages your guests leave (once you approve them) will show up here.' : 'Aquí aparecerán los mensajes de tus invitados una vez que los apruebes.'}</p>
          )}
        </div>

        <div style={{ background: cardBg, borderRadius: 20, padding: '22px 20px', marginTop: 16 }}>
          <div style={{ fontSize: 11, color: acento, fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 12 }}>{lang === 'en' ? 'Shared photo album' : 'Álbum de fotos compartido'}</div>
          {fotos.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
              {fotos.map((f, i) => (
                <img key={i} src={f.url} alt="" style={{ width: '100%', height: 90, objectFit: 'cover' as const, borderRadius: 8 }} />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: txtTerciario, margin: 0 }}>{lang === 'en' ? 'Photos your guests upload (once you approve them) will show up here.' : 'Aquí aparecerán las fotos que suban tus invitados una vez que las apruebes.'}</p>
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

        {proyecto?.solo_adultos && (
          <div style={{ background: cardBg, borderRadius: 20, padding: '20px 22px', marginTop: 16, textAlign: 'center' as const }}>
            <div style={{ fontSize: 11, color: acento, fontWeight: 800, textTransform: 'uppercase' as const, marginBottom: 8 }}>{lang === 'en' ? 'A note with love' : 'Una nota con cariño'}</div>
            <p style={{ fontSize: 13, color: txtSecundario, lineHeight: 1.5, margin: 0 }}>
              {lang === 'en' ? 'We love the little ones, but this event is adults-only. Thank you for understanding!' : 'Adoramos a los más pequeños, sin embargo este evento está destinado solo para adultos. ¡Esperamos tu comprensión!'}
            </p>
          </div>
        )}

        {proyecto?.versiculo && (
          <div style={{ background: cardBg, borderRadius: 20, padding: '24px 22px', marginTop: 16, textAlign: 'center' as const }}>
            <p style={{ fontSize: 15, color: txtPrimario, lineHeight: 1.6, fontStyle: 'italic', margin: '0 0 10px', fontFamily: fInv }}>{proyecto.versiculo}</p>
            {proyecto?.versiculo_autor && <p style={{ fontSize: 12, color: txtTerciario, fontWeight: 700, margin: 0 }}>{proyecto.versiculo_autor}</p>}
          </div>
        )}

        {proyecto?.mensaje_padres && (
          <div style={{ background: cardBg, borderRadius: 20, padding: '24px 22px', marginTop: 16, textAlign: 'center' as const }}>
            <p style={{ fontSize: 14, color: txtPrimario, lineHeight: 1.6, whiteSpace: 'pre-wrap' as const, margin: 0, fontFamily: fInv }}>{proyecto.mensaje_padres}</p>
          </div>
        )}

        {proyecto?.frase_cierre && (
          <div style={{ padding: '28px 22px', marginTop: 16, textAlign: 'center' as const }}>
            <p style={{ fontSize: 16, color: txtPrimario, lineHeight: 1.6, fontStyle: 'italic', margin: 0, fontFamily: fInv }}>{proyecto.frase_cierre}</p>
            <p style={{ fontSize: 13, color: txtTerciario, marginTop: 10 }}>— {nombreBoda}</p>
          </div>
        )}
        </div>
      </div>
    </main>
  )
}
