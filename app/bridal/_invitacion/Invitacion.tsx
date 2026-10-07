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
import Image from 'next/image'
import { DefsBotanicos, Peonia, RamaEucalipto, Ramillete } from './Botanicos'
import { IconoItinerario } from './iconos'
import Sobre from './Sobre'
import { enlacesCalendario } from './calendario'
import { paletaDe, urlEnlaceSegura, urlImagenSegura, fechaCorta, fechaLarga, fechaPuntos, horaBonita, type Paleta } from './tema'

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

const ORIGEN: Record<string, string> = { top: '50% 0%', center: '50% 50%', bottom: '50% 100%' }
function fotoPos(pos?: string | null) {
  const p = pos || 'center'
  return { objectFit: 'cover' as const, objectPosition: p, transform: 'scale(1.15)', transformOrigin: ORIGEN[p] || '50% 50%' }
}


function Sec({ p, id, children, innerRef, ancho, arriba }: { p: Paleta; id?: string; children: React.ReactNode; innerRef?: React.Ref<HTMLElement>; ancho?: number; arriba?: number }) {
  return <section id={id} ref={innerRef} className="cw-aparece" style={{ padding: `${arriba ?? 46}px 26px 46px`, maxWidth: ancho || 560, margin: '0 auto', textAlign: 'center', position: 'relative' }}>{children}</section>
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
function Boton({ p, children, onClick, href, relleno, deshabilitado, ancho }: { p: Paleta; children: React.ReactNode; onClick?: () => void; href?: string; relleno?: boolean; deshabilitado?: boolean; ancho?: boolean }) {
  const st: React.CSSProperties = {
    display: ancho ? 'block' : 'inline-block', width: ancho ? '100%' : undefined, boxSizing: 'border-box', textDecoration: 'none', cursor: deshabilitado ? 'default' : 'pointer',
    fontFamily: p.etiqueta, fontSize: 11, fontWeight: 500, letterSpacing: '.22em', textTransform: 'uppercase', padding: '14px 26px', borderRadius: 999,
    border: `1px solid ${p.acento}`, background: relleno ? p.acento : 'transparent', color: relleno ? p.botonTxt : p.acento, opacity: deshabilitado ? .5 : 1,
  }
  return href
    ? <a className="cw-btn" href={href} target="_blank" rel="noopener noreferrer" style={st}>{children}</a>
    : <button className="cw-btn" type="button" onClick={deshabilitado ? undefined : onClick} disabled={deshabilitado} style={st}>{children}</button>
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
  const invitado = (d.nombre || '').trim()
  const lugar1 = (d.lugar_nombre || '').trim()
  const [lugar1Nombre, ...lugar1Resto] = lugar1.split(',')
  const permitidos = Math.max(0, Number(d.acompanantes_permitidos) || 0)
  const cal = d.fecha_boda ? enlacesCalendario(nombreBoda || 'Boda', d.fecha_boda, d.hora_boda, lugar1 || null, String(d.slug || d.token || nombreBoda || 'boda')) : null
  const portada = urlImagenSegura(d.portada_url)
  const historia: any[] = (Array.isArray(d.historia) ? d.historia : []).filter((h: any) => urlImagenSegura(h?.url))
  const estiloImg = urlImagenSegura(d.estilo_url)
  const estiloPaleta: any[] = Array.isArray(d.estilo_paleta) ? d.estilo_paleta : []
  const itinerario: any[] = Array.isArray(d.itinerario) ? d.itinerario : []
  const colores: any[] = Array.isArray(d.vestimenta_colores) ? d.vestimenta_colores : []
  const hoteles: any[] = Array.isArray(d.hoteles) ? d.hoteles : []
  const linkRegalos = urlEnlaceSegura(d.mesa_regalos_link)
  const limite = d.fecha_limite_rsvp as string | undefined
  const limitePasado = !!limite && new Date(limite + 'T23:59:59') < new Date()

  // Botón flotante "Confirmar asistencia": aparece al bajar y se esconde
  // cuando la sección de confirmación ya está a la vista.
  useEffect(() => {
    if (!sobreAbierto) return
    const el = rsvpRef.current
    let visible = false
    const calc = () => setFlota(window.scrollY > 520 && !visible)
    const io = el ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; calc() }, { threshold: 0.12 }) : null
    if (el && io) io.observe(el)
    window.addEventListener('scroll', calc, { passive: true })
    calc()
    return () => { io?.disconnect(); window.removeEventListener('scroll', calc) }
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

  const etiqueta: React.CSSProperties = { fontFamily: p.etiqueta, fontSize: 10.5, fontWeight: 500, letterSpacing: p.tracking, textTransform: 'uppercase', color: p.acento }
  const titulo: React.CSSProperties = { fontFamily: p.serif, fontSize: 34, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.1, color: p.txt, margin: '10px 0 0' }
  const parrafo: React.CSSProperties = { fontFamily: p.serif, fontSize: 18.5, lineHeight: 1.55, color: p.txt2, margin: 0 }

  const irA = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const r = ctl.rsvp
  const respuestaTxt = r.asistencia === 'si' ? t('Sí, ahí estaré', 'Yes, I will be there') : r.asistencia === 'no' ? t('No podré asistir', "I can't make it") : t('Tal vez', 'Maybe')

  return (
    <div className="cw-raiz" style={{ background: p.bg, backgroundColor: p.papel, color: p.txt, minHeight: '100vh', position: 'relative', overflowX: 'hidden', fontFamily: p.serif }}>
      <DefsBotanicos />
      <Estilos p={p} />

      {!sobreAbierto && (
        <Sobre p={p} lang={lang} para={invitado || t('ti', 'you')} iniciales={iniciales(d)} etiqueta={t('Nos casamos', "We're getting married")} fecha={fechaPuntos(d.fecha_boda, lang)} hint={t('Toca el sobre para abrirlo', 'Tap the envelope to open it')} onAbierto={() => setSobreAbierto(true)} />
      )}

      {preview && (
        <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(60,40,36,.92)', color: '#fff', padding: '9px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: p.etiqueta, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase' }}>
          <span>{t('Vista previa — nada se manda', 'Preview — nothing is sent')}</span>
          {volverHref && <a href={volverHref} style={{ color: '#EBCFC7', textDecoration: 'none' }}>{t('← Dashboard', '← Dashboard')}</a>}
        </div>
      )}

      {/* ───────── PORTADA ───────── */}
      <header style={{ position: 'relative', textAlign: 'center', padding: '54px 0 18px' }}>
        {p.botanicos && <div style={{ position: 'absolute', top: -10, left: -28, opacity: .9, pointerEvents: 'none' }}><RamaEucalipto ancho={118} rotar={118} hojas={8} /></div>}
        {p.botanicos && <div style={{ position: 'absolute', top: 38, right: -8, opacity: .8, pointerEvents: 'none' }}><RamaEucalipto ancho={92} rotar={-24} espejo hojas={7} /></div>}
        <div style={etiqueta}>{t('Nos casamos', "We're getting married")}</div>
        <h1 style={{ fontFamily: p.script, fontWeight: 400, fontSize: 'clamp(58px,19vw,92px)', lineHeight: .95, color: p.acento, margin: '14px 0 0' }}>
          {d.nombre_novia}
          <span style={{ display: 'block', fontFamily: p.serif, fontStyle: 'italic', fontSize: '0.36em', color: p.acento2, lineHeight: 1.35 }}>&amp;</span>
          {d.nombre_novio}
        </h1>
        <div style={{ ...etiqueta, color: p.txt2, marginTop: 20, letterSpacing: '.34em' }}>{fechaPuntos(d.fecha_boda, lang)}</div>
        {lugar1Nombre && <div style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 19, color: p.txt3, marginTop: 8 }}>{lugar1Nombre}</div>}

        <div style={{ position: 'relative', width: 'min(74vw,320px)', margin: '36px auto 0' }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: -11, border: `1px solid ${p.linea}`, borderRadius: '999px 999px 22px 22px' }} />
          <div style={{ position: 'relative', aspectRatio: '3/4', borderRadius: '999px 999px 18px 18px', overflow: 'hidden', background: `linear-gradient(160deg,${p.acento2},${p.papel})`, boxShadow: '0 24px 40px -22px rgba(90,60,55,.45)' }}>
            {portada
              ? (portada.includes('.supabase.co')
                  ? <Image src={portada} alt="" fill sizes="(max-width:600px) 74vw, 320px" priority style={fotoPos(d.portada_posicion)} />
                  // eslint-disable-next-line @next/next/no-img-element
                  : <img src={portada} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...fotoPos(d.portada_posicion) }} />)
              : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: p.script, fontSize: 58, color: p.acento }}>{iniciales(d)}</div>}
          </div>
          {p.botanicos && <div style={{ position: 'absolute', right: -44, bottom: -46, pointerEvents: 'none' }}><Ramillete ancho={210} /></div>}
          {p.botanicos && <div style={{ position: 'absolute', left: -30, bottom: 24, pointerEvents: 'none', opacity: .9 }}><Peonia ancho={70} tono="claro" rotar={-14} /></div>}
        </div>

        {d.fecha_boda && <Cuenta fecha={d.fecha_boda} hora={d.hora_boda} p={p} lang={lang} />}
      </header>

      {/* ───────── PARA TI ───────── */}
      <Sec p={p}>
        <div style={etiqueta}>{preview ? t('Tu invitación', 'Your invitation') : t('Tu invitación', 'Your invitation')}</div>
        <div style={{ fontFamily: p.script, fontSize: 'clamp(40px,12vw,54px)', color: p.acento, lineHeight: 1.05, marginTop: 10 }}>{invitado || t('Invitado', 'Guest')}</div>
        <p style={{ ...parrafo, marginTop: 14 }}>
          {permitidos > 0
            ? t(`Guardamos un lugar para ti y hasta ${permitidos} ${permitidos === 1 ? 'persona más' : 'personas más'}.`, `We saved a seat for you and up to ${permitidos} more ${permitidos === 1 ? 'guest' : 'guests'}.`)
            : t('Guardamos un lugar especial para ti.', 'We saved a special seat for you.')}
        </p>
        <div style={{ marginTop: 24 }}><Boton p={p} relleno onClick={() => irA('confirmar')}>{r.enviado || d.ya_respondio ? t('Ver mi respuesta', 'See my reply') : t('Confirmar asistencia', 'RSVP')}</Boton></div>
        {limite && <div style={{ fontFamily: p.etiqueta, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: p.txt3, marginTop: 16 }}>{t('Responde antes del', 'Reply by')} {fechaCorta(limite, lang)}</div>}
      </Sec>

      {/* ───────── FRASE ───────── */}
      {d.versiculo && (
        <Sec p={p} ancho={480}>
          <Orn p={p} />
          <p style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 25, lineHeight: 1.42, color: p.txt, margin: '30px 0 0' }}>“{d.versiculo}”</p>
          {d.versiculo_autor && <div style={{ ...etiqueta, color: p.txt3, marginTop: 16 }}>{d.versiculo_autor}</div>}
        </Sec>
      )}

      {d.mensaje_padres && (
        <Sec p={p} ancho={460} arriba={d.versiculo ? 0 : undefined}>
          {!d.versiculo && <Orn p={p} />}
          <p style={{ ...parrafo, whiteSpace: 'pre-wrap', marginTop: d.versiculo ? 0 : 28 }}>{d.mensaje_padres}</p>
        </Sec>
      )}

      {/* ───────── NUESTRA HISTORIA ───────── */}
      {historia.length > 0 && (
        <Sec p={p} ancho={600}>
          <div style={etiqueta}>{t('Momentos que nos trajeron aquí', 'Moments that brought us here')}</div>
          <h2 style={titulo}>{t('Nuestra historia', 'Our story')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px 16px', marginTop: 32, textAlign: 'center' }}>
            {historia.map((h, i) => (
              <figure key={i} className="cw-polaroid" style={{ margin: 0, transform: `rotate(${[-1.8, 1.4, 1.1, -1.5, -1, 1.7][i % 6]}deg)`, marginTop: i % 2 ? 26 : 0 }}>
                <button type="button" onClick={() => setVisor(urlImagenSegura(h.url))} style={{ all: 'unset', cursor: 'zoom-in', display: 'block', width: '100%' }} aria-label={t('Ampliar foto', 'Enlarge photo')}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urlImagenSegura(h.url) || ''} alt={h.pie || ''} loading="lazy" decoding="async" style={{ display: 'block', width: '100%', aspectRatio: '4/5', objectFit: 'cover', background: p.acento2 }} />
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
        {d.hora_boda && <p style={{ ...parrafo, fontSize: 17, color: p.txt3 }}>{horaBonita(d.hora_boda)}</p>}
        {cal && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
            <a className="cw-chip" href={cal.googleUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: p.etiqueta, color: p.acento, border: `1px solid ${p.linea}` }}>+ Google Calendar</a>
            <a className="cw-chip" href={cal.icsUrl} download="boda.ics" style={{ fontFamily: p.etiqueta, color: p.acento, border: `1px solid ${p.linea}` }}>+ Apple / Outlook</a>
          </div>
        )}

        {itinerario.length > 0 && (
          <div style={{ marginTop: 44, textAlign: 'left', position: 'relative' }}>
            <div style={{ ...etiqueta, textAlign: 'center', marginBottom: 26 }}>{t('Así será nuestro día', 'How our day will unfold')}</div>
            <div aria-hidden="true" style={{ position: 'absolute', left: 78, top: 56, bottom: 14, width: 1, background: p.linea }} />
            {itinerario.map((it, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 36px 1fr', alignItems: 'start', marginBottom: 26, position: 'relative' }}>
                <div style={{ fontFamily: p.serif, fontSize: 21, fontWeight: 500, color: p.acento, textAlign: 'right', lineHeight: '26px', fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1' }}>{(it.hora || '').slice(0, 5)}</div>
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 7.5 }}><span style={{ width: 11, height: 11, borderRadius: '50%', background: p.papel, border: `1.5px solid ${p.acento}`, boxSizing: 'border-box' }} /></div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ color: p.acento, marginTop: 0, flexShrink: 0 }}><IconoItinerario emoji={it.icono} titulo={it.titulo} /></span>
                  <div>
                    <div style={{ fontFamily: p.serif, fontSize: 22, color: p.txt, lineHeight: '26px' }}>{it.titulo}</div>
                    {it.lugar && <div style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 16, color: p.txt3, marginTop: 3 }}>{it.lugar}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Sec>

      {/* ───────── DÓNDE ───────── */}
      {(lugar1 || d.lugar2_nombre) && (
        <Sec p={p}>
          <div style={etiqueta}>{t('¿Dónde será?', 'Where?')}</div>
          <h2 style={titulo}>{t('Ubicación', 'Location')}</h2>
          {[{ etq: d.lugar2_nombre ? t('Ceremonia', 'Ceremony') : '', lugar: lugar1 }, { etq: t('Recepción', 'Reception'), lugar: (d.lugar2_nombre || '').trim() }].filter(x => x.lugar).map((x, i) => {
            const [nom, ...resto] = x.lugar.split(',')
            return (
              <div key={i} style={{ marginTop: 32 }}>
                {x.etq && <div style={{ ...etiqueta, color: p.txt3 }}>{x.etq}</div>}
                <div style={{ fontFamily: p.serif, fontSize: 28, color: p.txt, marginTop: 8, lineHeight: 1.15 }}>{nom}</div>
                {resto.length > 0 && <div style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 16, color: p.txt3, marginTop: 6 }}>{resto.join(',').trim()}</div>}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
                  <Boton p={p} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.lugar)}`}>{t('Cómo llegar', 'Directions')}</Boton>
                  <a className="cw-chip" href={`https://waze.com/ul?q=${encodeURIComponent(x.lugar)}&navigate=yes`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: p.etiqueta, color: p.acento, border: `1px solid ${p.linea}`, alignSelf: 'center' }}>Waze</a>
                </div>
              </div>
            )
          })}
        </Sec>
      )}

      {/* ───────── VESTIMENTA ───────── */}
      {(d.vestimenta_tipo || colores.length > 0) && (
        <Sec p={p}>
          <div style={etiqueta}>{t('Para lucir radiantes', 'Dress to impress')}</div>
          <h2 style={titulo}>{t('Vestimenta', 'Dress code')}</h2>
          {d.vestimenta_tipo && <div style={{ fontFamily: p.serif, fontSize: 26, color: p.txt, marginTop: 16 }}>{d.vestimenta_tipo}</div>}
          {colores.length > 0 && <CirculosColor colores={colores} p={p} />}
          {d.vestimenta_nota && <p style={{ ...parrafo, fontStyle: 'italic', marginTop: 22, fontSize: 17 }}>{d.vestimenta_nota}</p>}
          {d.solo_adultos && (
            <div style={{ marginTop: 30, padding: '18px 20px', border: `1px solid ${p.linea}`, borderRadius: 14, background: p.card }}>
              <div style={{ ...etiqueta, color: p.txt3 }}>{t('Una nota con cariño', 'A note with love')}</div>
              <p style={{ ...parrafo, fontSize: 17, marginTop: 8 }}>{t('Adoramos a los más pequeños, sin embargo este evento está destinado solo para adultos. ¡Gracias por entenderlo!', 'We love the little ones, but this event is adults-only. Thank you for understanding!')}</p>
            </div>
          )}
        </Sec>
      )}

      {/* ───────── ASÍ LO SOÑAMOS ───────── */}
      {(estiloImg || d.estilo_titulo || estiloPaleta.length > 0) && (
        <Sec p={p} ancho={600}>
          <div style={etiqueta}>{t('Nuestro estilo', 'Our style')}</div>
          <h2 style={titulo}>{t('Así lo soñamos', 'How we dreamed it')}</h2>
          {estiloImg && (
            <button type="button" onClick={() => setVisor(estiloImg)} style={{ all: 'unset', display: 'block', width: '100%', cursor: 'zoom-in', marginTop: 28 }} aria-label={t('Ampliar foto', 'Enlarge photo')}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={estiloImg} alt={d.estilo_titulo || ''} loading="lazy" decoding="async" style={{ display: 'block', width: '100%', aspectRatio: '4/3.2', objectFit: 'cover', borderRadius: 160, boxShadow: '0 24px 40px -24px rgba(90,60,55,.5)' }} />
            </button>
          )}
          {d.estilo_titulo && <div style={{ ...etiqueta, color: p.txt2, marginTop: 28, letterSpacing: '.28em' }}>{d.estilo_titulo}</div>}
          {d.estilo_texto && <p style={{ ...parrafo, fontStyle: 'italic', marginTop: 12, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>{d.estilo_texto}</p>}
          {estiloPaleta.length > 0 && <CirculosColor colores={estiloPaleta} p={p} />}
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
                {h.direccion && <div style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 16, color: p.txt3, marginTop: 10 }}>{h.direccion}</div>}
                {enlace && <div style={{ marginTop: 14 }}><Boton p={p} href={enlace}>{t('Ver ubicación', 'View location')}</Boton></div>}
              </div>
            )
          })}
        </Sec>
      )}

      {/* ───────── REGALOS ───────── */}
      {(linkRegalos || d.mesa_regalos_nota || d.lluvia_sobres) && (
        <Sec p={p} ancho={480}>
          <Orn p={p} />
          <div style={{ ...etiqueta, marginTop: 34 }}>{t('Si deseas obsequiarnos algo', 'If you wish to give us something')}</div>
          <h2 style={titulo}>{t('Mesa de regalos', 'Gift registry')}</h2>
          {d.mesa_regalos_nota && <p style={{ ...parrafo, marginTop: 14 }}>{d.mesa_regalos_nota}</p>}
          {linkRegalos && <div style={{ marginTop: 22 }}><Boton p={p} href={linkRegalos}>{t('Ver mesa de regalos', 'View registry')}</Boton></div>}
          {d.lluvia_sobres && (
            <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', color: p.txt2 }}>
              <svg width="30" height="22" viewBox="0 0 30 22" aria-hidden="true"><rect x="1" y="1" width="28" height="20" rx="2" fill="none" stroke={p.acento} strokeWidth="1.2" /><path d="m1.5 2 13.5 10L28.5 2" fill="none" stroke={p.acento} strokeWidth="1.2" /></svg>
              <span style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 17 }}>{t('El día del evento habrá un buzón para recibir tu sobre.', 'On the day there will be a box to receive your envelope.')}</span>
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

                {permitidos > 0 && (
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
                    <label style={{ ...etiqueta, color: p.txt3, display: 'block' }}>{t(`Acompañante ${i + 1}`, `Guest ${i + 1}`)}</label>
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
              return q > 0 && q < linea.length - 1
                ? <p key={i} style={{ ...parrafo, fontSize: 17, marginBottom: 10 }}><b style={{ fontWeight: 600, color: p.txt }}>{linea.slice(0, q + 1)}</b>{linea.slice(q + 1)}</p>
                : <p key={i} style={{ ...parrafo, fontSize: 17, marginBottom: 10 }}>{linea}</p>
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
      <footer style={{ position: 'relative', textAlign: 'center', padding: '30px 20px 70px' }}>
        <div className="cw-aparece" style={{ position: 'relative', width: 'min(86vw,330px)', aspectRatio: '1', margin: '0 auto', borderRadius: '50%', border: `1px solid ${p.linea}`, background: 'rgba(255,255,255,.6)', boxShadow: '0 30px 50px -30px rgba(90,60,55,.4)', overflow: 'hidden' }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 9, borderRadius: '50%', border: `1px solid ${p.linea}` }} />
          <div style={{ position: 'absolute', top: 14, left: '50%', width: 11, height: 11, marginLeft: -5.5, borderRadius: '50%', background: p.acento2 }} />
          <div style={{ position: 'relative', paddingTop: '24%' }}>
            <div style={{ fontFamily: p.script, fontSize: 'clamp(34px,10.4vw,46px)', color: p.acento, lineHeight: 1 }}>{nombreBoda}</div>
            <div style={{ ...etiqueta, color: p.txt2, marginTop: 14, letterSpacing: '.24em' }}>{t('Gracias por acompañarnos', 'Thank you for celebrating with us')}</div>
            <div style={{ ...etiqueta, color: p.txt3, marginTop: 6, letterSpacing: '.24em' }}>{fechaPuntos(d.fecha_boda, lang)}</div>
          </div>
          {p.botanicos && <div style={{ position: 'absolute', left: '50%', bottom: -16, marginLeft: -120, pointerEvents: 'none' }}><Ramillete ancho={240} /></div>}
        </div>
        {d.frase_cierre && <p style={{ ...parrafo, fontStyle: 'italic', fontSize: 21, marginTop: 38 }}>{d.frase_cierre}</p>}
        <div style={{ marginTop: 40 }}><Orn p={p} /></div>
        <a href="https://joincheers.app" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 18, fontFamily: p.etiqueta, fontSize: 10, letterSpacing: '.24em', textTransform: 'uppercase', color: p.txt3, textDecoration: 'none' }}>
          {t('Invitación creada con', 'Invitation made with')} <span style={{ color: p.acento }}>Cheers Bridal</span>
        </a>
      </footer>

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
      .cw-flota { position: fixed; z-index: 30; left: 50%; bottom: calc(18px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); border: 0; cursor: pointer; font-size: 11px; font-weight: 500; letter-spacing: .22em; text-transform: uppercase; padding: 15px 28px; border-radius: 999px; box-shadow: 0 14px 28px -10px rgba(90,60,55,.55); animation: cw-sube .5s ease both; }
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
      }
    `}</style>
  )
}
