'use client'
// Invitación de boda (lo que ve el invitado). La usan la página real
// (/bridal/rsvp/[token]) y la vista previa de la pareja, para que siempre se
// vean idénticas. Aquí NO hay acceso a la base de datos: la página que la usa
// le pasa los datos y las acciones.
import '@fontsource/allura/latin-400.css'
import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/cormorant-garamond/latin-400-italic.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/cormorant-garamond/latin-600.css'
import '@fontsource/jost/latin-300.css'
import '@fontsource/jost/latin-400.css'
import '@fontsource/jost/latin-500.css'
import { useEffect, useRef, useState } from 'react'
import { DefsBotanicos, Peonia, RamaEucalipto, Ramillete } from './Botanicos'
import { IconoItinerario } from './iconos'
import Sobre from './Sobre'
import { enlacesCalendario } from './calendario'
import { FotoEncuadrada } from './FotoEncuadrada'
import { leerEncuadreTexto } from './encuadre'
import { paletaDe, urlEnlaceSegura, urlImagenSegura, fechaCorta, fechaLarga, fechaPuntos, horaBonita, hora12, partirHora, type Paleta } from './tema'

export const MENU_OPCIONES = ['res', 'pollo', 'vegetariano', 'vegano'] as const
const MENU_LABEL: Record<string, { es: string; en: string }> = {
  res: { es: 'Res', en: 'Beef' }, pollo: { es: 'Pollo', en: 'Chicken' },
  vegetariano: { es: 'Vegetariano', en: 'Vegetarian' }, vegano: { es: 'Vegano', en: 'Vegan' },
}

export type Asistencia = '' | 'si' | 'no' | 'tal_vez'
export type Control = {
  rsvp: {
    asistencia: Asistencia; setAsistencia: (v: Asistencia) => void
    numAcompanantes: number; setNum: (n: number) => void
    menuPrincipal: string; setMenu: (v: string) => void
    acompanantes: { nombre: string; menu: string }[]; setAcompanante: (i: number, campo: 'nombre' | 'menu', v: string) => void
    notas: string; setNotas: (v: string) => void
    enviar: () => void; enviando: boolean; enviado: boolean; editar: () => void
  }
  firmas: { lista: any[]; nombre: string; setNombre: (v: string) => void; mensaje: string; setMensaje: (v: string) => void; enviada: boolean; enviando: boolean; enviar: () => void }
  fotos: { lista: any[]; subiendo: boolean; recienSubida: boolean; subir: (f: File) => void }
}

function Sec({ p, id, children, innerRef, ancho, arriba, abajo }: { p: Paleta; id?: string; children: React.ReactNode; innerRef?: React.Ref<HTMLElement>; ancho?: number; arriba?: number; abajo?: number }) {
  return <section id={id} ref={innerRef} className="cw-aparece" style={{ padding: `${arriba ?? 42}px 26px ${abajo ?? 42}px`, maxWidth: ancho || 560, margin: '0 auto', textAlign: 'center', position: 'relative' }}>{children}</section>
}
function Orn({ p }: { p: Paleta }) {
  return (
    <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: '0 auto', width: 150, color: p.acento2 }}>
      <span style={{ flex: 1, height: 1, background: p.linea }} />
      <svg width="9" height="9" viewBox="0 0 10 10"><path d="M5 0 10 5 5 10 0 5z" fill="currentColor" /></svg>
      <span style={{ flex: 1, height: 1, background: p.linea }} />
    </div>
  )
}
function Boton({ p, children, onClick, href, relleno, deshabilitado, ancho, compacto }: { p: Paleta; children: React.ReactNode; onClick?: () => void; href?: string; relleno?: boolean; deshabilitado?: boolean; ancho?: boolean; compacto?: boolean }) {
  const st: React.CSSProperties = {
    display: ancho ? 'block' : 'inline-block', width: ancho ? '100%' : undefined, boxSizing: 'border-box', textDecoration: 'none', cursor: deshabilitado ? 'default' : 'pointer',
    fontFamily: p.etiqueta, fontSize: 11, fontWeight: 500, letterSpacing: compacto ? '.14em' : '.22em', textTransform: 'uppercase', padding: compacto ? '14px 8px' : '14px 26px', borderRadius: 999, whiteSpace: 'nowrap', textAlign: 'center',
    border: `1px solid ${p.acento}`, background: relleno ? p.acento : 'transparent', color: relleno ? p.botonTxt : p.acento, opacity: deshabilitado ? .5 : 1,
  }
  return href
    ? <a className="cw-btn" href={href} target="_blank" rel="noopener noreferrer" style={st}>{children}</a>
    : <button className="cw-btn" type="button" onClick={deshabilitado ? undefined : onClick} disabled={deshabilitado} style={st}>{children}</button>
}

// "Cómo llegar": una etiqueta (no botón) y dos botones iguales.
function ComoLlegar({ p, lugar, google, t }: { p: Paleta; lugar: string; google?: string | null; t: (es: string, en: string) => string }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontFamily: p.etiqueta, fontSize: 10.5, letterSpacing: '.26em', textTransform: 'uppercase', color: p.txt3, marginBottom: 10 }}>{t('Cómo llegar', 'Directions')}</div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 140px', maxWidth: 168 }}><Boton p={p} ancho compacto href={google || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar)}`}>Google Maps</Boton></div>
        <div style={{ flex: '1 1 140px', maxWidth: 168 }}><Boton p={p} ancho compacto href={`https://waze.com/ul?q=${encodeURIComponent(lugar)}&navigate=yes`}>Waze</Boton></div>
      </div>
    </div>
  )
}

function iniciales(d: any) {
  const a = (d.nombre_novia || '').trim()[0]; const b = (d.nombre_novio || '').trim()[0]
  return [a, b].filter(Boolean).join(' & ').toUpperCase() || '♡'
}

export default function Invitacion({ d, lang, modo, ctl, volverHref }: { d: any; lang: string; modo: 'real' | 'preview'; ctl: Control; volverHref?: string }) {
  const p = paletaDe(d.tema, d.fuente)
  const t = (es: string, en: string) => (lang === 'en' ? en : es)
  const preview = modo === 'preview'
  const [sobreAbierto, setSobreAbierto] = useState(false)
  const [visor, setVisor] = useState<string | null>(null)
  const [flota, setFlota] = useState(false)
  const rsvpRef = useRef<HTMLElement>(null)

  const nombreBoda = [d.nombre_novia, d.nombre_novio].filter(Boolean).join(' & ')
  const largoNombres = String(d.nombre_novia || '').length + String(d.nombre_novio || '').length
  const factorNombres = Math.min(1, 15 / Math.max(1, largoNombres))   // nombres largos se achican para seguir en un renglón
  const invitado = (d.nombre || '').trim()
  const lugar1 = (d.lugar_nombre || '').trim()
  const [lugar1Nombre, ...lugar1Resto] = lugar1.split(',')
  const permitidos = Math.max(0, Number(d.acompanantes_permitidos) || 0)
  const ultimoItem = Array.isArray(d.itinerario) && d.itinerario.length ? d.itinerario[d.itinerario.length - 1] : null
  const cal = d.fecha_boda ? enlacesCalendario(nombreBoda || 'Boda', d.fecha_boda, d.hora_boda, lugar1 || null, String(d.slug || d.token || nombreBoda || 'boda'), ultimoItem ? partirHora(ultimoItem.hora).fin : null) : null
  const portada = urlImagenSegura(d.portada_url)
  const encPortada = leerEncuadreTexto(d.portada_posicion)
  const historia: any[] = (Array.isArray(d.historia) ? d.historia : []).filter((h: any) => urlImagenSegura(h?.url))
  const itinerario: any[] = Array.isArray(d.itinerario) ? d.itinerario : []
  const colores: any[] = Array.isArray(d.vestimenta_colores) ? d.vestimenta_colores : []
  const hoteles: any[] = Array.isArray(d.hoteles) ? d.hoteles : []
  const linkRegalos = urlEnlaceSegura(d.mesa_regalos_link)
  // WhatsApp de ayuda (peinado y maquillaje): solo dígitos y largo válido; en México se agrega 52.
  const waDigitos = String(d.ayuda_whatsapp || '').replace(/\D/g, '')
  const waNumero = /^\d{10}$/.test(waDigitos) ? '52' + waDigitos : (/^\d{11,15}$/.test(waDigitos) ? waDigitos : '')
  const waMensaje = String(d.ayuda_mensaje || t('Hola, ¿me puedes ayudar a conseguir cita para maquillaje y/o peinado?', 'Hi! Could you help me book hair and/or makeup?')).replace(/\{nombre\}/g, invitado).slice(0, 300)
  const linkAyuda = waNumero ? `https://wa.me/${waNumero}?text=${encodeURIComponent(waMensaje)}` : null
  const mesas: any[] = (Array.isArray(d.mesas_regalos) ? d.mesas_regalos : []).filter((m: any) => m && String(m.nombre || '').trim()).slice(0, 4)
  const limite = d.fecha_limite_rsvp as string | undefined
  const limitePasado = !!limite && new Date(limite + 'T23:59:59') < new Date()

  // Botón flotante "Confirmar asistencia": aparece al bajar y se esconde en cuanto la
  // confirmación entra a la vista; ya que la pasaste, no vuelve a estorbar.
  useEffect(() => {
    if (!sobreAbierto) return
    const calc = () => {
      const r = rsvpRef.current?.getBoundingClientRect()
      const todaviaNoLlega = r ? r.top > window.innerHeight : false
      setFlota(window.scrollY > 520 && todaviaNoLlega)
    }
    window.addEventListener('scroll', calc, { passive: true })
    window.addEventListener('resize', calc)
    calc()
    return () => { window.removeEventListener('scroll', calc); window.removeEventListener('resize', calc) }
  }, [sobreAbierto])

  // Las secciones aparecen suavemente al llegar a ellas.
  // Si el navegador no puede observar el scroll, todo queda visible desde el
  // inicio (la clase cw-js solo se pone cuando el observador ya está activo).
  useEffect(() => {
    const raiz = document.querySelector('.cw-raiz')
    const els = Array.from(document.querySelectorAll('.cw-aparece'))
    if (typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('cw-in'); io.unobserve(e.target) } }), { threshold: 0.08 })
    els.forEach(e => io.observe(e))
    raiz?.classList.add('cw-js')
    return () => { io.disconnect(); raiz?.classList.remove('cw-js') }
  }, [])

  useEffect(() => {
    if (!visor) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setVisor(null) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [visor])

  const etiqueta: React.CSSProperties = { fontFamily: p.etiqueta, fontSize: 11, fontWeight: 500, letterSpacing: p.tracking, textTransform: 'uppercase', color: p.acento }
  const titulo: React.CSSProperties = { fontFamily: p.serif, fontSize: 36, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.1, color: p.txt, margin: '10px 0 0' }
  const parrafo: React.CSSProperties = { fontFamily: p.serif, fontSize: 19.5, lineHeight: 1.55, color: p.txt2, margin: 0 }

  const irA = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const r = ctl.rsvp
  const respuestaTxt = r.asistencia === 'si' ? t('Sí, ahí estaré', 'Yes, I will be there') : r.asistencia === 'no' ? t('No podré asistir', "I can't make it") : t('Tal vez', 'Maybe')

  return (
    <div className="cw-raiz" style={{ background: p.bg, backgroundColor: p.papel, color: p.txt, minHeight: '100vh', position: 'relative', overflowX: 'hidden', fontFamily: p.serif }}>
      <DefsBotanicos />
      <Estilos p={p} />
      <Ambiente p={p} />

      {!sobreAbierto && (
        <Sobre p={p} lang={lang} para={invitado || t('ti', 'you')} iniciales={iniciales(d)} etiqueta={t('Nos casamos', "We're getting married")} fecha={fechaPuntos(d.fecha_boda, lang)} hint={t('Toca el sobre para abrirlo', 'Tap the envelope to open it')} onAbierto={() => setSobreAbierto(true)} />
      )}

      <div className="cw-pagina">
      {preview && (
        <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(60,40,36,.92)', color: '#fff', padding: '9px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: p.etiqueta, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase' }}>
          <span>{t('Vista previa — nada se manda', 'Preview — nothing is sent')}</span>
          {volverHref && <a href={volverHref} style={{ color: '#EBCFC7', textDecoration: 'none' }}>{t('← Dashboard', '← Dashboard')}</a>}
        </div>
      )}

      {/* ───────── PORTADA ───────── */}
      <header style={{ position: 'relative', textAlign: 'center', padding: '54px 0 18px' }}>
        <div style={etiqueta}>{t('Nos casamos', "We're getting married")}</div>
        <h1 style={{ fontFamily: p.script, fontWeight: 400, fontSize: `calc(clamp(42px, 12.4vw, 80px) * ${factorNombres})`, lineHeight: 1.1, color: p.acento, margin: '16px auto 0', padding: '0 10px', whiteSpace: largoNombres > 26 ? 'normal' : 'nowrap' }}>
          {d.nombre_novia}
          <span style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: '0.5em', color: p.acento2, margin: '0 .26em', verticalAlign: '.22em' }}>&amp;</span>
          {d.nombre_novio}
        </h1>
        <div style={{ ...etiqueta, color: p.txt2, marginTop: 22, letterSpacing: '.26em', padding: '0 14px' }}>{fechaPuntos(d.fecha_boda, lang)}</div>
        {lugar1Nombre && <div style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 19, lineHeight: 1.3, color: p.txt3, margin: '10px auto 0', maxWidth: 320, padding: '0 16px' }}>{lugar1Nombre}</div>}

        <div style={{ position: 'relative', width: 'min(74vw,320px)', margin: '36px auto 0' }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: -11, border: `1px solid ${p.linea}`, borderRadius: '999px 999px 22px 22px' }} />
          <div style={{ position: 'relative', aspectRatio: '3/4', borderRadius: '999px 999px 18px 18px', overflow: 'hidden', background: `linear-gradient(160deg,${p.acento2},${p.papel})`, boxShadow: '0 24px 40px -22px rgba(90,60,55,.45)' }}>
            {portada
              ? <FotoEncuadrada src={portada} enc={encPortada} optimizada={portada.includes('.supabase.co')} prioridad sizes={`(max-width:600px) ${Math.round(74 * encPortada.z)}vw, ${Math.round(320 * encPortada.z)}px`} />
              : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: p.script, fontSize: 58, color: p.acento }}>{iniciales(d)}</div>}
          </div>
          {p.botanicos && <div style={{ position: 'absolute', right: -44, bottom: -46, pointerEvents: 'none' }}><Ramillete ancho={210} /></div>}
          {p.botanicos && <div style={{ position: 'absolute', left: -30, bottom: 24, pointerEvents: 'none', opacity: .9 }}><Peonia ancho={70} tono="claro" rotar={-14} /></div>}
        </div>

        {d.fecha_boda && <Cuenta fecha={d.fecha_boda} hora={d.hora_boda} p={p} lang={lang} />}
      </header>

      {/* ───────── PARA TI ───────── */}
      <Sec p={p} arriba={34} abajo={20}>
        <div style={etiqueta}>{t('Tu invitación', 'Your invitation')}</div>
        <div style={{ fontFamily: p.script, fontSize: 'clamp(40px,12vw,54px)', color: p.acento, lineHeight: 1.05, marginTop: 10 }}>{invitado || t('Invitado', 'Guest')}</div>
        <p style={{ ...parrafo, marginTop: 14 }}>
          {permitidos === 0
            ? t('Guardamos un lugar especial para ti.', 'We saved a special seat for you.')
            : permitidos === 1
              ? t('Guardamos un lugar para ti y para tu acompañante.', 'We saved seats for you and your guest.')
              : t(`Guardamos un lugar para ti y hasta ${permitidos} personas más.`, `We saved a seat for you and up to ${permitidos} more guests.`)}
        </p>
        {d.solo_adultos && (
          <p style={{ ...parrafo, fontStyle: 'italic', fontSize: 17, color: p.txt3, margin: '12px auto 0', maxWidth: 380 }}>
            {t('Será una noche pensada solo para adultos. Gracias por acompañarnos y por ayudarnos a cuidar este detalle.', 'It will be an evening just for adults. Thank you for being with us and for helping us take care of this detail.')}
          </p>
        )}
        <div style={{ marginTop: 24 }}><Boton p={p} relleno onClick={() => irA('confirmar')}>{r.enviado || d.ya_respondio ? t('Ver mi respuesta', 'See my reply') : t('Confirmar asistencia', 'RSVP')}</Boton></div>
        {limite && <div style={{ fontFamily: p.etiqueta, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: p.txt3, marginTop: 16 }}>{t('Responde antes del', 'Reply by')} {fechaCorta(limite, lang)}</div>}
      </Sec>

      {/* ───────── FRASE Y FAMILIAS ───────── */}
      {(d.versiculo || d.mensaje_padres) && <div style={{ padding: '14px 0 0' }}><Orn p={p} /></div>}
      {d.versiculo && (() => {
        // Frases de hasta 60 letras van en un solo renglón: el tamaño se ajusta al largo y a la pantalla.
        // Las más largas se acomodan en varios renglones parejos.
        const largo = String(d.versiculo).length
        const unaLinea = largo <= 60
        const estiloFrase = { fontFamily: p.serif, fontStyle: 'italic', fontSize: unaLinea ? `clamp(14px, ${(214 / Math.max(largo, 28)).toFixed(2)}vw, 27px)` : 26, lineHeight: 1.4, color: p.txt, margin: 0, whiteSpace: unaLinea ? 'nowrap' : 'normal', textWrap: 'balance' } as React.CSSProperties
        return (
          <Sec p={p} ancho={unaLinea ? 660 : 480} arriba={32} abajo={d.mensaje_padres ? 26 : 42}>
            <p style={estiloFrase}>“{d.versiculo}”</p>
            {d.versiculo_autor && <div style={{ ...etiqueta, color: p.txt3, marginTop: 16 }}>{d.versiculo_autor}</div>}
          </Sec>
        )
      })()}
      {d.mensaje_padres && (
        <Sec p={p} ancho={460} arriba={d.versiculo ? 6 : 32}>
          <div style={{ ...etiqueta, whiteSpace: 'nowrap', fontSize: 'clamp(9px, 2.75vw, 11px)', letterSpacing: '.2em' }}>{t('Con la bendición de nuestras familias', 'With the blessing of our families')}</div>
          {(() => {
            // "Padres de la novia: José y Patricia" -> etiqueta chica arriba y los nombres abajo
            const lineas = String(d.mensaje_padres).split('\n').map(l => l.trim()).filter(Boolean).slice(0, 12).map(linea => {
              const k = linea.indexOf(':')
              const conEtiqueta = k > 0 && k < 40
              return { etq: conEtiqueta ? linea.slice(0, k).trim() : '', nombres: conEtiqueta ? linea.slice(k + 1).trim() : linea }
            })
            // Dos familias, cada una en un solo renglón: van lado a lado, a la misma altura.
            const enColumnas = lineas.length === 2 && lineas.every(x => x.nombres.length <= 22 && x.etq.length <= 22)
            if (enColumnas) return (
              <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
                {lineas.map((x, i) => (
                  <div key={i} style={{ padding: '2px 8px', borderLeft: i ? `1px solid ${p.linea}` : 'none' }}>
                    {x.etq && <div style={{ ...etiqueta, color: p.txt3, fontSize: 10, letterSpacing: '.14em', whiteSpace: 'nowrap' }}>{x.etq}</div>}
                    <div style={{ fontFamily: p.serif, fontSize: 'clamp(16px, 4.9vw, 24px)', color: p.txt, lineHeight: 1.3, marginTop: x.etq ? 8 : 0, whiteSpace: 'nowrap' }}>{x.nombres}</div>
                  </div>
                ))}
              </div>
            )
            return (
              <div style={{ marginTop: 20 }}>
                {lineas.map((x, i) => (
                  <div key={i} style={{ marginTop: i ? 22 : 0 }}>
                    {x.etq && <div style={{ ...etiqueta, color: p.txt3, fontSize: 10, letterSpacing: '.24em' }}>{x.etq}</div>}
                    <div style={{ fontFamily: p.serif, fontSize: 24, color: p.txt, lineHeight: 1.3, marginTop: x.etq ? 6 : 0 }}>{x.nombres}</div>
                  </div>
                ))}
              </div>
            )
          })()}
        </Sec>
      )}

      {/* ───────── NUESTRA HISTORIA ───────── */}
      {historia.length > 0 && (
        <Sec p={p} ancho={600} abajo={26}>
          <div style={etiqueta}>{t('Momentos que nos trajeron aquí', 'Moments that brought us here')}</div>
          <h2 style={titulo}>{t('Nuestra historia', 'Our story')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px 16px', marginTop: 32, textAlign: 'center' }}>
            {historia.map((h, i) => (
              <figure key={i} className="cw-polaroid" style={{ margin: 0, transform: `rotate(${[-1.8, 1.4, 1.1, -1.5, -1, 1.7][i % 6]}deg)`, marginTop: i % 2 ? 26 : 0 }}>
                <button type="button" onClick={() => setVisor(urlImagenSegura(h.url))} style={{ all: 'unset', cursor: 'zoom-in', display: 'block', width: '100%' }} aria-label={t('Ampliar foto', 'Enlarge photo')}>
                  <FotoEncuadrada src={urlImagenSegura(h.url) || ''} alt={h.pie || ''} enc={h} aspecto="4/5" fondo={p.acento2} />
                </button>
                {h.pie && <figcaption style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 15, color: p.txt2, padding: '9px 4px 2px', lineHeight: 1.25 }}>{h.pie}</figcaption>}
              </figure>
            ))}
          </div>
        </Sec>
      )}

      {/* ───────── EL GRAN DÍA ───────── */}
      <Sec p={p}>
        <div style={etiqueta}>{t('Aparta la fecha', 'Save the date')}</div>
        <h2 style={titulo}>{t('El gran día', 'The big day')}</h2>
        <p style={{ ...parrafo, marginTop: 14 }}>{(() => { const f = fechaLarga(d.fecha_boda, lang); return f.charAt(0).toUpperCase() + f.slice(1) })()}</p>
        {d.hora_boda && <p style={{ ...parrafo, fontSize: 19, color: p.acento, fontWeight: 500, marginTop: 2 }}>{horaBonita(d.hora_boda)}</p>}
        {lugar1Nombre && <p style={{ ...parrafo, fontStyle: 'italic', fontSize: 18, color: p.txt3, margin: '4px auto 0', maxWidth: 400 }}>{lugar1Nombre}</p>}
        {cal && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
            <a className="cw-chip" href={cal.googleUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: p.etiqueta, color: p.acento, border: `1px solid ${p.linea}` }}>+ Google Calendar</a>
            <a className="cw-chip" href={cal.icsUrl} download="boda.ics" style={{ fontFamily: p.etiqueta, color: p.acento, border: `1px solid ${p.linea}` }}>+ Apple / Outlook</a>
          </div>
        )}

        {itinerario.length > 0 && (
          <div style={{ marginTop: 46 }}>
            <div style={{ ...etiqueta, marginBottom: 30 }}>{t('Así será nuestro día', 'How our day will unfold')}</div>
            {itinerario.map((it, i) => {
              const h = partirHora(it.hora)
              return (
                <div key={i}>
                  <div style={{ width: 54, height: 54, borderRadius: '50%', border: `1px solid ${p.linea}`, background: p.card, color: p.acento, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <IconoItinerario emoji={it.icono} titulo={it.titulo} tam={27} />
                  </div>
                  <div style={{ fontFamily: p.serif, fontSize: 28, fontWeight: 500, color: p.acento, marginTop: 14, lineHeight: 1.1, fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1' }}>{hora12(h.ini)}</div>
                  {h.fin && <div style={{ fontFamily: p.etiqueta, fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: p.txt3, marginTop: 5 }}>{t('hasta', 'until')} {hora12(h.fin)}</div>}
                  <div style={{ fontFamily: p.serif, fontSize: 25, color: p.txt, marginTop: 12, lineHeight: 1.2 }}>{it.titulo}</div>
                  {it.lugar && <div style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 17, color: p.txt3, marginTop: 5, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>{it.lugar}</div>}
                  {i < itinerario.length - 1 && <div aria-hidden="true" style={{ width: 1, height: 40, background: p.linea, margin: '26px auto' }} />}
                </div>
              )
            })}
          </div>
        )}
      </Sec>

      {/* ───────── DÓNDE ───────── */}
      {(lugar1 || d.lugar2_nombre) && (
        <Sec p={p}>
          <h2 style={{ ...titulo, marginTop: 0 }}>{t('¿Dónde será?', 'Where will it be?')}</h2>
          {[{ etq: d.lugar2_nombre ? t('Ceremonia', 'Ceremony') : '', lugar: lugar1 }, { etq: t('Recepción', 'Reception'), lugar: (d.lugar2_nombre || '').trim() }].filter(x => x.lugar).map((x, i) => {
            const [nom, ...resto] = x.lugar.split(',')
            return (
              <div key={i} style={{ marginTop: 32 }}>
                {x.etq && <div style={{ ...etiqueta, color: p.txt3 }}>{x.etq}</div>}
                <div style={{ fontFamily: p.serif, fontSize: 28, color: p.txt, marginTop: 8, lineHeight: 1.15 }}>{nom}</div>
                {resto.length > 0 && <div style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 16, color: p.txt3, marginTop: 6 }}>{resto.join(',').trim()}</div>}
                <ComoLlegar p={p} lugar={x.lugar} t={t} />
              </div>
            )
          })}
        </Sec>
      )}

      {/* ───────── VESTIMENTA ───────── */}
      {(d.vestimenta_tipo || colores.length > 0) && (
        <Sec p={p} ancho={460}>
          <svg width="40" height="30" viewBox="0 0 40 30" aria-hidden="true" style={{ display: 'block', margin: '0 auto' }}>
            <path d="M20 9.5a3.2 3.2 0 1 1 3.2 3.2c-1.8 0-3.2 1.2-3.2 3v1.6L3 26.2a1.4 1.4 0 0 0 .7 2.6h32.6a1.4 1.4 0 0 0 .7-2.6L20 17.3" fill="none" stroke={p.acento} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ ...etiqueta, marginTop: 14 }}>{t('Código de vestimenta', 'Dress code')}</div>
          {d.vestimenta_tipo && <div style={{ fontFamily: p.script, fontSize: 'clamp(54px,15vw,68px)', color: p.acento, lineHeight: 1.05, marginTop: 6 }}>{d.vestimenta_tipo}</div>}
          {colores.length > 0 && <CirculosColor colores={colores} p={p} />}
          {d.vestimenta_nota && <p style={{ ...parrafo, fontStyle: 'italic', marginTop: 14, fontSize: 18 }}>{d.vestimenta_nota}</p>}
        </Sec>
      )}

      {/* ───────── AYUDA: PEINADO Y MAQUILLAJE ───────── */}
      {linkAyuda && (
        <Sec p={p} ancho={460}>
          <div style={etiqueta}>{t('Para que luzcas increíble', 'To look your best')}</div>
          <h2 style={titulo}>{t('¿Buscas quién te arregle?', 'Looking for hair & makeup?')}</h2>
          <p style={{ ...parrafo, marginTop: 14 }}>{t('Te recomendamos a quien nos arregla a nosotros. Escríbele directo por WhatsApp para tu cita de maquillaje y/o peinado.', 'We recommend who is doing our hair and makeup. Message her directly on WhatsApp to book your appointment.')}</p>
          <div style={{ marginTop: 22 }}><Boton p={p} relleno href={linkAyuda}>{t('Escribir por WhatsApp', 'Message on WhatsApp')}</Boton></div>
        </Sec>
      )}

      {/* ───────── HOSPEDAJE ───────── */}
      {(hoteles.length > 0 || d.info_viaje) && (
        <Sec p={p}>
          <div style={etiqueta}>{t('Para quienes vienen de lejos', 'For those traveling')}</div>
          <h2 style={titulo}>{t('Hospedaje', 'Where to stay')}</h2>
          {d.info_viaje && <p style={{ ...parrafo, marginTop: 16, whiteSpace: 'pre-wrap' }}>{d.info_viaje}</p>}
          {hoteles.map((h, i) => {
            const enlace = urlEnlaceSegura(h.link) || (h.direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${h.nombre} ${h.direccion}`)}` : null)
            return (
              <div key={i} style={{ marginTop: 26, padding: '22px 20px', border: `1px solid ${p.cardBorde}`, borderRadius: 18, background: p.card }}>
                <div style={{ fontFamily: p.serif, fontSize: 24, color: p.txt }}>{h.nombre}</div>
                {h.tarifa_especial && <span style={{ display: 'inline-block', marginTop: 8, fontFamily: p.etiqueta, fontSize: 9.5, letterSpacing: '.2em', textTransform: 'uppercase', color: p.acento, border: `1px solid ${p.linea}`, borderRadius: 99, padding: '4px 11px' }}>{t('Tarifa especial de boda', 'Special wedding rate')}</span>}
                {h.direccion && <div style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 17, color: p.txt3, marginTop: 10 }}>{h.direccion}</div>}
                {h.resena && <p style={{ ...parrafo, fontSize: 18, marginTop: 14, textAlign: 'left' }}>{String(h.resena).slice(0, 700)}</p>}
                {h.traslado && (
                  <div style={{ marginTop: 14, padding: '10px 14px', border: `1px solid ${p.linea}`, borderRadius: 12, fontFamily: p.etiqueta, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: p.acento, lineHeight: 1.6 }}>
                    {String(h.traslado).slice(0, 160)}
                  </div>
                )}
                <ComoLlegar p={p} lugar={`${h.nombre} ${h.direccion || ''}`.trim()} google={enlace} t={t} />
              </div>
            )
          })}
        </Sec>
      )}

      {/* ───────── REGALOS ───────── */}
      {(mesas.length > 0 || linkRegalos || d.mesa_regalos_nota || d.lluvia_sobres) && (
        <Sec p={p} ancho={520}>
          <div style={etiqueta}>{t('Si deseas obsequiarnos algo', 'If you wish to give us something')}</div>
          <h2 style={titulo}>{t('Mesa de regalos', 'Gift registry')}</h2>
          {d.mesa_regalos_nota && <p style={{ ...parrafo, marginTop: 14 }}>{d.mesa_regalos_nota}</p>}
          {mesas.map((m, i) => {
            const enlace = urlEnlaceSegura(m.link)
            return (
              <div key={i} style={{ marginTop: 24, padding: '22px 20px', border: `1px solid ${p.cardBorde}`, borderRadius: 18, background: p.card }}>
                <div style={{ fontFamily: p.serif, fontSize: 26, color: p.txt }}>{String(m.nombre).slice(0, 60)}</div>
                {m.nota && <div style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 17, color: p.txt3, marginTop: 6 }}>{String(m.nota).slice(0, 120)}</div>}
                {enlace
                  ? <div style={{ marginTop: 16 }}><Boton p={p} href={enlace}>{t('Ver mesa de regalos', 'View registry')}</Boton></div>
                  : <div style={{ ...etiqueta, color: p.txt3, marginTop: 14, letterSpacing: '.22em' }}>{t('Próximamente', 'Coming soon')}</div>}
              </div>
            )
          })}
          {mesas.length === 0 && linkRegalos && <div style={{ marginTop: 22 }}><Boton p={p} href={linkRegalos}>{t('Ver mesa de regalos', 'View registry')}</Boton></div>}
          {d.lluvia_sobres && (
            <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', color: p.txt2 }}>
              <svg width="30" height="22" viewBox="0 0 30 22" aria-hidden="true"><rect x="1" y="1" width="28" height="20" rx="2" fill="none" stroke={p.acento} strokeWidth="1.2" /><path d="m1.5 2 13.5 10L28.5 2" fill="none" stroke={p.acento} strokeWidth="1.2" /></svg>
              <span style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 18 }}>{t('El día del evento habrá un buzón para recibir tu sobre.', 'On the day there will be a box to receive your envelope.')}</span>
            </div>
          )}
        </Sec>
      )}

      {/* ───────── CONFIRMAR ───────── */}
      <Sec p={p} id="confirmar" innerRef={rsvpRef} ancho={520}>
        <div style={etiqueta}>{t('Nos encantaría contar contigo', "We'd love to have you")}</div>
        <h2 style={titulo}>{t('Confirma tu asistencia', 'Please RSVP')}</h2>

        {r.enviado ? (
          <div style={{ marginTop: 28, padding: '30px 22px', border: `1px solid ${p.cardBorde}`, borderRadius: 20, background: p.card }}>
            <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true" style={{ display: 'block', margin: '0 auto' }}><circle cx="22" cy="22" r="20" fill="none" stroke={p.acento} strokeWidth="1.2" /><path d="m13 23 6.5 6.5L31 16" fill="none" stroke={p.acento} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <div style={{ fontFamily: p.script, fontSize: 44, color: p.acento, marginTop: 8, lineHeight: 1.1 }}>{t('¡Gracias!', 'Thank you!')}</div>
            <p style={{ ...parrafo, marginTop: 8 }}>{respuestaTxt}{r.numAcompanantes > 0 && r.asistencia !== 'no' ? ` · +${r.numAcompanantes}` : ''}</p>
            <p style={{ ...parrafo, fontSize: 16, color: p.txt3, marginTop: 6 }}>{t('Tu respuesta quedó guardada.', 'Your reply has been saved.')}</p>
            <div style={{ marginTop: 20 }}><button type="button" className="cw-enlace" onClick={r.editar} style={{ color: p.acento, fontFamily: p.etiqueta }}>{t('Cambiar mi respuesta', 'Change my reply')}</button></div>
          </div>
        ) : (
          <div style={{ marginTop: 28, textAlign: 'left', padding: '28px 22px', border: `1px solid ${p.cardBorde}`, borderRadius: 20, background: p.card }}>
            {(d.ya_respondio) && <div style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 16, color: p.acento, textAlign: 'center', marginBottom: 14 }}>{t('Ya habías respondido — aquí puedes cambiar tu respuesta.', 'You already replied — you can change it here.')}</div>}
            {limite && <div style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 16, color: limitePasado ? '#A8575F' : p.txt3, textAlign: 'center', marginBottom: 16 }}>{limitePasado ? t(`La fecha límite fue el ${fechaCorta(limite, lang)}. Si necesitas confirmar o cambiar algo, escríbenos.`, `The deadline was ${fechaCorta(limite, lang)}. If you need to confirm or change something, let us know.`) : t(`Por favor responde antes del ${fechaCorta(limite, lang)}.`, `Please reply by ${fechaCorta(limite, lang)}.`)}</div>}
            <div style={{ fontFamily: p.serif, fontSize: 22, color: p.txt, textAlign: 'center', marginBottom: 16 }}>{t(`${invitado ? invitado + ', ' : ''}¿nos acompañas?`, `${invitado ? invitado + ', ' : ''}will you join us?`)}</div>
            <div role="radiogroup" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {([['si', t('Sí', 'Yes')], ['tal_vez', t('Tal vez', 'Maybe')], ['no', t('No', 'No')]] as [Asistencia, string][]).map(([k, label]) => (
                <button key={k} type="button" role="radio" aria-checked={r.asistencia === k} onClick={() => r.setAsistencia(k)} className="cw-opcion" style={{ fontFamily: p.etiqueta, border: `1px solid ${r.asistencia === k ? p.acento : p.linea}`, background: r.asistencia === k ? p.acento : 'transparent', color: r.asistencia === k ? p.botonTxt : p.txt2 }}>{label}</button>
              ))}
            </div>

            {(r.asistencia === 'si' || r.asistencia === 'tal_vez') && (
              <div style={{ marginTop: 22 }}>
                <label style={{ ...etiqueta, color: p.txt3, display: 'block' }}>{t('Tu platillo', 'Your meal')}</label>
                <select className="cw-campo" value={r.menuPrincipal} onChange={e => r.setMenu(e.target.value)} style={{ fontFamily: p.serif, color: p.txt, colorScheme: p.dark ? 'dark' : 'light' }}>
                  <option value="">{t('Elige una opción', 'Choose an option')}</option>
                  {MENU_OPCIONES.map(m => <option key={m} value={m}>{lang === 'en' ? MENU_LABEL[m].en : MENU_LABEL[m].es}</option>)}
                </select>

                {permitidos === 1 && (
                  <div style={{ marginTop: 22 }}>
                    <label style={{ ...etiqueta, color: p.txt3, display: 'block', marginBottom: 10 }}>{t('¿Vienes acompañado?', 'Are you bringing a guest?')}</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {([[0, t('No, solo yo', 'No, just me')], [1, t('Sí, con mi acompañante', 'Yes, with my guest')]] as [number, string][]).map(([n, label]) => (
                        <button key={n} type="button" onClick={() => r.setNum(n)} className="cw-opcion" style={{ flex: 1, fontFamily: p.etiqueta, border: `1px solid ${r.numAcompanantes === n ? p.acento : p.linea}`, background: r.numAcompanantes === n ? p.acento : 'transparent', color: r.numAcompanantes === n ? p.botonTxt : p.txt2, letterSpacing: '.1em', padding: '13px 8px' }}>{label}</button>
                      ))}
                    </div>
                  </div>
                )}
                {permitidos > 1 && (
                  <div style={{ marginTop: 22 }}>
                    <label style={{ ...etiqueta, color: p.txt3, display: 'block', marginBottom: 10 }}>{t(`¿Cuántos acompañantes traes? (hasta ${permitidos})`, `How many guests are you bringing? (up to ${permitidos})`)}</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {Array.from({ length: permitidos + 1 }, (_, n) => n).map(n => (
                        <button key={n} type="button" onClick={() => r.setNum(n)} className="cw-num" style={{ fontFamily: p.serif, border: `1px solid ${r.numAcompanantes === n ? p.acento : p.linea}`, background: r.numAcompanantes === n ? p.acento : 'transparent', color: r.numAcompanantes === n ? p.botonTxt : p.txt2 }}>{n}</button>
                      ))}
                    </div>
                  </div>
                )}

                {r.acompanantes.map((a, i) => (
                  <div key={i} style={{ marginTop: 20 }}>
                    <label style={{ ...etiqueta, color: p.txt3, display: 'block' }}>{permitidos === 1 ? t('Tu acompañante', 'Your guest') : t(`Acompañante ${i + 1}`, `Guest ${i + 1}`)}</label>
                    <input className="cw-campo" maxLength={100} value={a.nombre} onChange={e => r.setAcompanante(i, 'nombre', e.target.value)} placeholder={t('Nombre completo', 'Full name')} style={{ fontFamily: p.serif, color: p.txt }} />
                    <select className="cw-campo" value={a.menu} onChange={e => r.setAcompanante(i, 'menu', e.target.value)} style={{ fontFamily: p.serif, color: p.txt, colorScheme: p.dark ? 'dark' : 'light' }}>
                      <option value="">{t('Platillo', 'Meal')}</option>
                      {MENU_OPCIONES.map(m => <option key={m} value={m}>{lang === 'en' ? MENU_LABEL[m].en : MENU_LABEL[m].es}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 22 }}>
              <label style={{ ...etiqueta, color: p.txt3, display: 'block' }}>{t('Alergias o un mensaje para nosotros (opcional)', 'Allergies or a note for us (optional)')}</label>
              <textarea className="cw-campo" maxLength={1000} rows={2} value={r.notas} onChange={e => r.setNotas(e.target.value)} style={{ fontFamily: p.serif, color: p.txt, resize: 'none' }} />
            </div>
            <div style={{ marginTop: 24 }}>
              <Boton p={p} relleno ancho onClick={r.enviar} deshabilitado={preview || !r.asistencia || r.enviando}>{r.enviando ? '…' : (d.ya_respondio ? t('Actualizar respuesta', 'Update reply') : t('Enviar respuesta', 'Send reply'))}</Boton>
              {preview && <div style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 14.5, color: p.txt3, textAlign: 'center', marginTop: 10 }}>{t('En la vista previa no se envía nada.', 'Nothing is sent in preview.')}</div>}
            </div>
          </div>
        )}

        {d.faq && (
          <div style={{ marginTop: 40, textAlign: 'left' }}>
            <div style={{ ...etiqueta, textAlign: 'center', marginBottom: 14 }}>{t('Preguntas frecuentes', 'FAQ')}</div>
            {String(d.faq).split('\n').map(l => l.trim()).filter(Boolean).map((linea, i) => {
              const q = linea.indexOf('?')
              const ultima = i === String(d.faq).split('\n').map(l => l.trim()).filter(Boolean).length - 1
              return q > 0 && q < linea.length - 1
                ? <p key={i} style={{ ...parrafo, fontSize: 17, marginBottom: ultima ? 0 : 10 }}><b style={{ fontWeight: 600, color: p.txt }}>{linea.slice(0, q + 1)}</b>{linea.slice(q + 1)}</p>
                : <p key={i} style={{ ...parrafo, fontSize: 17, marginBottom: ultima ? 0 : 10 }}>{linea}</p>
            })}
          </div>
        )}
      </Sec>

      {/* ───────── FOTOS ───────── */}
      <Sec p={p} ancho={520}>
        <div style={etiqueta}>{t('El álbum de todos', "Everyone's album")}</div>
        <h2 style={titulo}>{t('Comparte tus fotos', 'Share your photos')}</h2>
        <p style={{ ...parrafo, marginTop: 14 }}>{t('Ayúdanos a guardar cada instante del día: sube las fotos que tomes, queremos verlo todo desde tus ojos.', 'Help us keep every moment: upload the photos you take — we want to see it all through your eyes.')}</p>
        {ctl.fotos.recienSubida ? (
          <p style={{ ...parrafo, marginTop: 20, color: p.acento }}>{t('¡Gracias! Tu foto aparecerá aquí cuando la aprobemos.', 'Thank you! Your photo will appear here once we approve it.')}</p>
        ) : (
          <label className="cw-btn" style={{ display: 'inline-block', marginTop: 22, cursor: preview ? 'default' : 'pointer', fontFamily: p.etiqueta, fontSize: 11, fontWeight: 500, letterSpacing: '.22em', textTransform: 'uppercase', padding: '14px 26px', borderRadius: 999, border: `1px solid ${p.acento}`, color: p.acento, opacity: preview || ctl.fotos.subiendo ? .55 : 1 }}>
            {ctl.fotos.subiendo ? t('Subiendo…', 'Uploading…') : t('Subir una foto', 'Upload a photo')}
            <input type="file" accept="image/*" disabled={preview || ctl.fotos.subiendo} onChange={e => { const f = e.target.files?.[0]; if (f) ctl.fotos.subir(f); e.target.value = '' }} style={{ display: 'none' }} />
          </label>
        )}
        {ctl.fotos.lista.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginTop: 28 }}>
            {ctl.fotos.lista.map((f, i) => {
              const u = urlImagenSegura(f.url)
              return u ? (
                <button key={i} type="button" onClick={() => setVisor(u)} style={{ all: 'unset', cursor: 'zoom-in', display: 'block' }} aria-label={t('Ampliar foto', 'Enlarge photo')}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" loading="lazy" decoding="async" style={{ display: 'block', width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 6 }} />
                </button>
              ) : null
            })}
          </div>
        )}
      </Sec>

      {/* ───────── FIRMAS ───────── */}
      <Sec p={p} ancho={520}>
        <div style={etiqueta}>{t('Recuerdos que quedan', 'Memories that stay')}</div>
        <h2 style={titulo}>{t('Libro de firmas', 'Guest book')}</h2>
        <p style={{ ...parrafo, marginTop: 14 }}>{t('Déjanos unas palabras para volver a este día una y otra vez.', 'Leave us a few words so we can come back to this day again and again.')}</p>
        {ctl.firmas.enviada ? (
          <p style={{ ...parrafo, marginTop: 22, color: p.acento }}>{t('Gracias — tu mensaje aparecerá aquí cuando lo aprobemos.', 'Thank you — your message will appear here once we approve it.')}</p>
        ) : (
          <div style={{ marginTop: 22, textAlign: 'left', padding: '24px 22px', border: `1px solid ${p.cardBorde}`, borderRadius: 20, background: p.card }}>
            <label style={{ ...etiqueta, color: p.txt3, display: 'block' }}>{t('Tu nombre', 'Your name')}</label>
            <input className="cw-campo" maxLength={100} value={ctl.firmas.nombre} onChange={e => ctl.firmas.setNombre(e.target.value)} style={{ fontFamily: p.serif, color: p.txt }} />
            <label style={{ ...etiqueta, color: p.txt3, display: 'block', marginTop: 18 }}>{t('Tu mensaje', 'Your message')}</label>
            <textarea className="cw-campo" maxLength={1000} rows={3} value={ctl.firmas.mensaje} onChange={e => ctl.firmas.setMensaje(e.target.value)} placeholder={t('Un deseo, un recuerdo, lo que el corazón te dicte…', 'A wish, a memory, whatever your heart says…')} style={{ fontFamily: p.serif, color: p.txt, resize: 'none' }} />
            <div style={{ marginTop: 20 }}><Boton p={p} relleno ancho onClick={ctl.firmas.enviar} deshabilitado={preview || !ctl.firmas.nombre.trim() || !ctl.firmas.mensaje.trim() || ctl.firmas.enviando}>{ctl.firmas.enviando ? '…' : t('Firmar el libro', 'Sign the book')}</Boton></div>
          </div>
        )}
        {ctl.firmas.lista.length > 0 && (
          <div style={{ marginTop: 28, textAlign: 'left' }}>
            {ctl.firmas.lista.map((f, i) => (
              <div key={i} style={{ padding: '18px 20px', border: `1px solid ${p.cardBorde}`, borderRadius: 16, background: p.card, marginBottom: 12 }}>
                <div style={{ fontFamily: p.script, fontSize: 30, color: p.acento, lineHeight: 1.1 }}>{f.nombre}</div>
                <p style={{ ...parrafo, fontSize: 17.5, marginTop: 6, whiteSpace: 'pre-wrap' }}>{f.mensaje}</p>
              </div>
            ))}
          </div>
        )}
      </Sec>

      {/* ───────── CIERRE ───────── */}
      <footer style={{ position: 'relative', textAlign: 'center', padding: '24px 18px 70px' }}>
        <div className="cw-aparece" style={{ position: 'relative', maxWidth: 520, margin: '0 auto', borderRadius: 26, overflow: 'hidden', border: `1px solid ${p.linea}`, background: 'linear-gradient(180deg, rgba(255,255,255,.78), rgba(250,236,231,.78))', boxShadow: '0 30px 50px -34px rgba(90,60,55,.45)', padding: '60px 24px 180px' }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 10, borderRadius: 18, border: `1px solid ${p.linea}`, pointerEvents: 'none' }} />
          {p.botanicos && <div style={{ position: 'absolute', top: -20, left: -34, opacity: .92, pointerEvents: 'none' }}><RamaEucalipto ancho={66} rotar={125} hojas={5} /></div>}
          {p.botanicos && <div style={{ position: 'absolute', top: -16, right: -30, opacity: .88, pointerEvents: 'none' }}><RamaEucalipto ancho={60} rotar={-125} espejo hojas={5} /></div>}
          <div style={{ position: 'relative' }}>
            <div style={etiqueta}>{t('Con todo nuestro amor', 'With all our love')}</div>
            <div style={{ fontFamily: p.script, fontSize: `calc(clamp(38px, 11.4vw, 58px) * ${factorNombres})`, color: p.acento, lineHeight: 1.1, marginTop: 14, whiteSpace: largoNombres > 26 ? 'normal' : 'nowrap' }}>
              {d.nombre_novia}<span style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: '0.4em', color: p.acento2, margin: '0 .32em', verticalAlign: '.34em' }}>&amp;</span>{d.nombre_novio}
            </div>
            {/* Un solo agradecimiento (el que la pareja escribe como frase de cierre) y la fecha */}
            <p style={{ ...parrafo, fontStyle: 'italic', fontSize: 22, lineHeight: 1.4, margin: '22px auto 0', maxWidth: 340, textWrap: 'balance' } as React.CSSProperties}>{d.frase_cierre || t('Gracias por acompañarnos', 'Thank you for celebrating with us')}</p>
            <div style={{ ...etiqueta, color: p.txt3, marginTop: 20, letterSpacing: '.26em' }}>{fechaPuntos(d.fecha_boda, lang)}</div>
          </div>
          {p.botanicos && <div style={{ position: 'absolute', left: '50%', bottom: -24, marginLeft: -175, pointerEvents: 'none' }}><Ramillete ancho={350} /></div>}
        </div>
        <div style={{ marginTop: 40 }}><Orn p={p} /></div>
        <a href="https://joincheers.app" target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 20, textDecoration: 'none', opacity: 0.75 }}>
          <span style={{ display: 'block', fontFamily: p.etiqueta, fontSize: 9.5, letterSpacing: '.22em', textTransform: 'uppercase', color: p.txt3 }}>
            {t('Invitación creada por Cheers Bridal', 'Invitation created by Cheers Bridal')}
          </span>
          <span style={{ display: 'block', fontFamily: p.serif, fontStyle: 'italic', fontSize: 14, color: p.txt3, marginTop: 3 }}>{t('de Patty Eugenia', 'by Patty Eugenia')}</span>
        </a>
      </footer>

      </div>{/* /cw-pagina */}

      {/* Botón flotante */}
      {flota && !preview && !r.enviado && (
        <button type="button" className="cw-flota" onClick={() => irA('confirmar')} style={{ fontFamily: p.etiqueta, background: p.acento, color: p.botonTxt }}>{t('Confirmar asistencia', 'RSVP')}</button>
      )}

      {/* Visor de fotos */}
      {visor && (
        <div className="cw-visor" onClick={() => setVisor(null)} role="dialog" aria-modal="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={visor} alt="" />
          <button type="button" aria-label={t('Cerrar', 'Close')} onClick={() => setVisor(null)}>×</button>
        </div>
      )}
    </div>
  )
}

// Pétalos cayendo, destellos y ramas fijas con vaivén. Todo decorativo, sin
// aleatoriedad (los valores son fijos, así se ve igual en servidor y teléfono)
// y se apaga solo si el invitado tiene activado "reducir movimiento".
const PETALOS: [number, number, number, number, number, number, number][] = [
  [6, 15, 17, 0, 60, 280, 0], [14, 11, 21, 6, -40, 200, 1], [23, 17, 19, 12, 50, 320, 0], [31, 12, 23, 3, -60, 240, 1],
  [40, 14, 18, 9, 40, 300, 0], [49, 10, 24, 15, -30, 180, 1], [57, 16, 20, 2, 70, 340, 0], [65, 12, 22, 11, -50, 260, 1],
  [73, 15, 18, 7, 45, 290, 0], [81, 11, 25, 14, -45, 210, 1], [88, 17, 19, 4, 55, 330, 0], [94, 12, 21, 10, -35, 230, 1],
]
const BRILLOS: [number, number, number, number][] = [
  [8, 18, 12, 0], [22, 64, 10, 1.4], [37, 28, 13, 2.8], [52, 78, 11, 0.7], [63, 14, 10, 2.1],
  [78, 52, 13, 3.5], [90, 30, 11, 1.1], [16, 86, 12, 3.1], [44, 92, 10, 0.3], [85, 84, 12, 2.4],
]
function Ambiente({ p }: { p: Paleta }) {
  if (!p.botanicos) return null
  return (
    <div aria-hidden="true">
      <div className="cw-rama cw-rama-i"><div className="cw-brisa"><RamaEucalipto ancho={112} rotar={128} hojas={8} /></div></div>
      <div className="cw-rama cw-rama-d"><div className="cw-brisa cw-brisa-b"><RamaEucalipto ancho={100} rotar={-128} espejo hojas={7} /></div></div>
      <div className="cw-flor cw-flor-i1"><div className="cw-mece"><Peonia ancho={80} tono="claro" rotar={-12} /></div></div>
      <div className="cw-flor cw-flor-i2"><div className="cw-mece" style={{ animationDelay: '-4s' }}><Peonia ancho={46} tono="oscuro" rotar={18} /></div></div>
      <div className="cw-flor cw-flor-d1"><div className="cw-mece" style={{ animationDelay: '-2s' }}><Peonia ancho={74} tono="claro" rotar={14} /></div></div>
      <div className="cw-flor cw-flor-d2"><div className="cw-mece" style={{ animationDelay: '-6s' }}><Peonia ancho={44} tono="oscuro" rotar={-16} /></div></div>
      <div className="cw-capa-ligera">
        {PETALOS.map(([x, tam, dur, del, der, giro, tono], i) => (
          <svg key={'p' + i} className="cw-petalo" viewBox="-12 -25 24 27" width={tam} height={Math.round(tam * 1.1)} style={{ left: `${x}%`, animationDuration: `${dur}s`, animationDelay: `-${del}s`, ['--der' as string]: `${der}px`, ['--giro' as string]: `${giro}deg` } as React.CSSProperties}>
            <path d="M0 0 C-8 -6 -9 -18 0 -23 C 9 -18 8 -6 0 0Z" fill={tono ? 'url(#cw-pet-rosa)' : 'url(#cw-pet-marfil)'} />
          </svg>
        ))}
        {BRILLOS.map(([x, y, tam, del], i) => (
          <svg key={'b' + i} className="cw-brillo" viewBox="-10 -10 20 20" width={tam} height={tam} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${del}s` }}>
            <path d="M0 -9 C1 -3 3 -1 9 0 C3 1 1 3 0 9 C-1 3 -3 1 -9 0 C-3 -1 -1 -3 0 -9Z" fill="#E7CE9B" />
          </svg>
        ))}
      </div>
    </div>
  )
}

function CirculosColor({ colores, p }: { colores: any[]; p: Paleta }) {
  const seguros = colores.filter(c => /^#[0-9a-fA-F]{3,8}$/.test(String(c?.hex || ''))).slice(0, 8)
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 26 }}>
      {seguros.map((c, i) => (
        <div key={i} style={{ width: 58, textAlign: 'center' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: c.hex, margin: '0 auto', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.07), 0 6px 10px -6px rgba(90,60,55,.4)' }} />
          <div style={{ fontFamily: p.etiqueta, fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: p.txt3, marginTop: 8, lineHeight: 1.3 }}>{String(c.nombre || '').slice(0, 24)}</div>
        </div>
      ))}
    </div>
  )
}

function Cuenta({ fecha, hora, p, lang }: { fecha: string; hora: string | null; p: Paleta; lang: string }) {
  const [r, setR] = useState<{ d: number; h: number; m: number; s: number } | null>(null)
  useEffect(() => {
    const objetivo = new Date(`${fecha}T${/^\d{1,2}:\d{2}/.test(hora || '') ? hora : '00:00'}:00`).getTime()
    const act = () => {
      const diff = Math.max(0, objetivo - Date.now())
      setR({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) })
    }
    act(); const id = setInterval(act, 1000); return () => clearInterval(id)
  }, [fecha, hora])
  if (!r) return null
  const u = [[r.d, lang === 'en' ? 'days' : 'días'], [r.h, lang === 'en' ? 'hours' : 'horas'], [r.m, 'min'], [r.s, lang === 'en' ? 'sec' : 'seg']] as [number, string][]
  return (
    <div style={{ marginTop: 52 }}>
      <div style={{ fontFamily: p.etiqueta, fontSize: 10.5, letterSpacing: p.tracking, textTransform: 'uppercase', color: p.acento }}>{lang === 'en' ? 'Counting down' : 'Faltan'}</div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        {u.map(([n, l], i) => (
          <div key={i} style={{ width: 74, textAlign: 'center', borderLeft: i ? `1px solid ${p.linea}` : 'none' }}>
            <div style={{ fontFamily: p.serif, fontSize: 40, fontWeight: 400, color: p.txt, lineHeight: 1, fontVariantNumeric: 'lining-nums tabular-nums', fontFeatureSettings: '"lnum" 1, "tnum" 1' }}>{String(n).padStart(2, '0')}</div>
            <div style={{ fontFamily: p.etiqueta, fontSize: 9, letterSpacing: '.22em', textTransform: 'uppercase', color: p.txt3, marginTop: 8 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Estilos({ p }: { p: Paleta }) {
  return (
    <style>{`
      .cw-raiz { -webkit-font-smoothing: antialiased; }
      .cw-pagina { position: relative; z-index: 2; }
      /* Capa decorativa fija: las ramas se quedan arriba mientras se hace scroll */
      .cw-rama { position: fixed; z-index: 1; pointer-events: none; }
      .cw-rama-i { top: -44px; left: -52px; opacity: .92; }
      .cw-rama-d { top: -32px; right: -50px; opacity: .88; }
      .cw-brisa { transform-origin: 0 0; animation: cw-brisa 9s ease-in-out infinite; }
      .cw-brisa-b { transform-origin: 100% 0; animation-duration: 11s; animation-delay: -3s; }
      @keyframes cw-brisa { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(2.8deg); } }
      .cw-flor { position: fixed; z-index: 1; pointer-events: none; }
      .cw-flor-i1 { top: 34px; left: -30px; }
      .cw-flor-i2 { top: 4px; left: 38px; }
      .cw-flor-d1 { top: 46px; right: -28px; }
      .cw-flor-d2 { top: 12px; right: 34px; }
      .cw-mece { animation: cw-mece 10s ease-in-out infinite; }
      @keyframes cw-mece { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(3px) rotate(2.2deg); } }
      .cw-capa-ligera { position: fixed; inset: 0; z-index: 3; pointer-events: none; overflow: hidden; }
      .cw-petalo { position: absolute; top: -30px; opacity: 0; will-change: transform, opacity; animation: cw-cae linear infinite; filter: drop-shadow(0 1px 1.5px rgba(150,105,98,.28)); }
      @keyframes cw-cae { 0% { transform: translate3d(0,-6vh,0) rotate(0deg); opacity: 0; } 8% { opacity: .9; } 90% { opacity: .9; } 100% { transform: translate3d(var(--der),108vh,0) rotate(var(--giro)); opacity: 0; } }
      .cw-brillo { position: absolute; opacity: 0; animation: cw-brilla 5.5s ease-in-out infinite; filter: drop-shadow(0 0 4px rgba(231,206,155,.95)); }
      @keyframes cw-brilla { 0%, 100% { opacity: 0; transform: scale(.4) rotate(0deg); } 50% { opacity: .95; transform: scale(1) rotate(45deg); } }
      /* Pantallas grandes: todo el contenido crece junto (texto, fotos y márgenes) para leerse cómodo */
      @media (min-width: 820px) { .cw-pagina { zoom: 1.15; } .cw-sobre-wrap { zoom: 1.25; } .cw-rama-i { left: -24px; } .cw-rama-d { right: -20px; } }
      @media (min-width: 1180px) { .cw-pagina { zoom: 1.3; } .cw-sobre-wrap { zoom: 1.4; } .cw-rama-i { transform: scale(1.25); transform-origin: 0 0; } .cw-rama-d { transform: scale(1.25); transform-origin: 100% 0; } .cw-flor-i1, .cw-flor-i2 { transform: scale(1.25); transform-origin: 0 0; } .cw-flor-d1, .cw-flor-d2 { transform: scale(1.25); transform-origin: 100% 0; } }
      .cw-raiz *, .cw-raiz *::before, .cw-raiz *::after { box-sizing: border-box; }
      .cw-aparece { transition: opacity .9s ease, transform .9s ease; }
      .cw-js .cw-aparece:not(.cw-in) { opacity: 0; transform: translateY(20px); }
      .cw-btn { transition: background .25s ease, color .25s ease, transform .25s ease; }
      .cw-btn:hover:not(:disabled) { transform: translateY(-1px); }
      .cw-chip { display: inline-block; text-decoration: none; font-size: 10.5px; font-weight: 500; letter-spacing: .18em; text-transform: uppercase; padding: 9px 16px; border-radius: 999px; }
      .cw-polaroid { background: #fff; padding: 9px 9px 12px; box-shadow: 0 14px 26px -14px rgba(90,60,55,.45), 0 1px 3px rgba(0,0,0,.08); }
      .cw-opcion { cursor: pointer; padding: 13px 6px; border-radius: 999px; font-size: 11px; font-weight: 500; letter-spacing: .2em; text-transform: uppercase; transition: all .2s ease; }
      .cw-num { cursor: pointer; width: 44px; height: 44px; border-radius: 50%; font-size: 21px; transition: all .2s ease; }
      .cw-campo { display: block; width: 100%; border: 0; border-bottom: 1px solid ${p.linea}; background: transparent; padding: 10px 2px; font-size: 19px; outline: none; border-radius: 0; margin-top: 4px; }
      .cw-campo:focus { border-bottom-color: ${p.acento}; }
      .cw-enlace { all: unset; cursor: pointer; font-size: 11px; letter-spacing: .2em; text-transform: uppercase; border-bottom: 1px solid currentColor; padding-bottom: 2px; }
      .cw-flota { white-space: nowrap; position: fixed; z-index: 30; left: 50%; bottom: calc(18px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); border: 0; cursor: pointer; font-size: 11px; font-weight: 500; letter-spacing: .22em; text-transform: uppercase; padding: 15px 28px; border-radius: 999px; box-shadow: 0 14px 28px -10px rgba(90,60,55,.55); animation: cw-sube .5s ease both; }
      @keyframes cw-sube { from { opacity: 0; transform: translate(-50%, 16px); } to { opacity: 1; transform: translate(-50%, 0); } }
      .cw-visor { position: fixed; inset: 0; z-index: 90; background: rgba(40,28,26,.88); display: flex; align-items: center; justify-content: center; padding: 18px; cursor: zoom-out; }
      .cw-visor img { max-width: 100%; max-height: 100%; border-radius: 6px; box-shadow: 0 20px 60px rgba(0,0,0,.5); }
      .cw-visor button { position: absolute; top: 14px; right: 18px; background: none; border: 0; color: #fff; font-size: 38px; line-height: 1; cursor: pointer; }

      /* Portada de sobre */
      .cw-sobre-capa { position: fixed; inset: 0; z-index: 80; display: flex; align-items: center; justify-content: center; overflow: hidden; }
      .cw-sobre-capa.cw-abriendo { animation: cw-desvanece .9s ease 1.15s forwards; }
      @keyframes cw-desvanece { to { opacity: 0; visibility: hidden; } }
      .cw-sobre { all: unset; box-sizing: border-box; position: relative; display: block; width: min(82vw, 340px); aspect-ratio: 1.42 / 1; cursor: pointer; perspective: 1100px; filter: drop-shadow(0 22px 24px rgba(95,64,58,.3)); }
      .cw-sobre:focus-visible { outline: 2px solid ${p.acento}; outline-offset: 8px; }
      .cw-sobre-cuerpo { position: absolute; inset: 0; background: linear-gradient(165deg, #CDB1A5, #BE9C8F); border-radius: 6px; }
      .cw-sobre-carta { position: absolute; left: 8%; right: 8%; top: 7%; bottom: 12%; background: #FDFAF6; border-radius: 3px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 1px 4px rgba(0,0,0,.14); z-index: 2; transition: transform 1s cubic-bezier(.4,.1,.2,1) .55s; }
      .cw-abriendo .cw-sobre-carta { transform: translateY(-62%); }
      .cw-sobre-frente { position: absolute; inset: 0; clip-path: polygon(0 0, 50% 56%, 100% 0, 100% 100%, 0 100%); background: linear-gradient(180deg, #E8D5CA, #D8BDB1); border-radius: 6px; z-index: 3; display: flex; align-items: flex-end; justify-content: center; }
      .cw-sobre-dest { margin-bottom: 5.5%; text-align: center; }
      .cw-sobre-solapa { position: absolute; left: 0; right: 0; top: 0; height: 60%; clip-path: polygon(0 0, 100% 0, 50% 100%); background: linear-gradient(180deg, #F0E2D8, #DEC7BB); transform-origin: 50% 0; z-index: 4; }
      .cw-abriendo .cw-sobre-solapa { animation: cw-solapa .8s cubic-bezier(.5,.05,.25,1) forwards; }
      @keyframes cw-solapa { 0% { transform: rotateX(0); z-index: 4; } 49% { z-index: 4; } 50% { z-index: 1; } 100% { transform: rotateX(180deg); z-index: 1; } }
      .cw-sello { position: absolute; left: 50%; top: 54%; width: 54px; height: 54px; margin: -27px 0 0 -27px; border-radius: 48% 52% 50% 50% / 52% 48% 52% 48%; background: radial-gradient(circle at 35% 30%, #D9ABA5, #B7827B 55%, #8E5D58); box-shadow: 0 3px 7px rgba(70,35,30,.4), inset 0 -3px 5px rgba(60,25,22,.35), inset 0 2px 3px rgba(255,225,219,.45), 0 0 0 3px rgba(183,130,123,.45); display: flex; align-items: center; justify-content: center; z-index: 5; transition: opacity .3s ease, transform .3s ease; }
      .cw-abriendo .cw-sello { opacity: 0; transform: scale(.7); }
      .cw-hint { animation: cw-pulso 2.6s ease-in-out infinite; }
      .cw-abriendo .cw-hint { opacity: 0; animation: none; transition: opacity .3s; }
      @keyframes cw-pulso { 0%,100% { opacity: .55; } 50% { opacity: 1; } }

      @media (prefers-reduced-motion: reduce) {
        .cw-js .cw-aparece:not(.cw-in) { opacity: 1; transform: none; }
        .cw-aparece { transition: none; }
        .cw-sobre-carta, .cw-sobre-solapa, .cw-sello { transition-duration: .01s !important; transition-delay: 0s !important; animation-duration: .01s !important; }
        .cw-sobre-capa.cw-abriendo { animation-delay: .3s; animation-duration: .3s; }
        .cw-hint, .cw-flota { animation: none; }
        .cw-capa-ligera { display: none; }
        .cw-brisa, .cw-mece { animation: none; }
      }
    `}</style>
  )
}
