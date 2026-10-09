'use client'
// Invitación de la despedida (lo que ve cada invitada con su link personal).
// Usa el mismo sistema de diseño que la invitación de boda (paleta, flores,
// sobre animado), pero es un evento aparte con su propia lista y respuestas.
// Aquí NO hay acceso a la base de datos: la página le pasa datos y acciones.
import '@fontsource/allura/latin-400.css'
import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/cormorant-garamond/latin-400-italic.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/jost/latin-400.css'
import '@fontsource/jost/latin-500.css'
import { useState } from 'react'
import { DefsBotanicos } from './Botanicos'
import Sobre from './Sobre'
import { enlacesCalendario } from './calendario'
import { FotoEncuadrada } from './FotoEncuadrada'
import { leerEncuadreTexto } from './encuadre'
import { paletaDe, urlImagenSegura, fechaPuntos, fechaLarga, hora12, type Paleta } from './tema'
import { Ambiente, Cuenta, Estilos } from './Invitacion'

export type RespuestaDespedida = '' | 'si' | 'no'
export type ControlDespedida = {
  respuesta: RespuestaDespedida
  setRespuesta: (v: RespuestaDespedida) => void
  mensaje: string
  setMensaje: (v: string) => void
  enviar: () => void
  enviando: boolean
  enviado: boolean
  editar: () => void
}

function Etiqueta({ p, children, color }: { p: Paleta; children: React.ReactNode; color?: string }) {
  return <div style={{ fontFamily: p.etiqueta, fontSize: 11, fontWeight: 500, letterSpacing: p.tracking, textTransform: 'uppercase', color: color || p.acento }}>{children}</div>
}

function Linea({ p }: { p: Paleta }) {
  return (
    <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: '0 auto', width: 150, color: p.acento2 }}>
      <span style={{ flex: 1, height: 1, background: p.linea }} />
      <svg width="9" height="9" viewBox="0 0 10 10"><path d="M5 0 10 5 5 10 0 5z" fill="currentColor" /></svg>
      <span style={{ flex: 1, height: 1, background: p.linea }} />
    </div>
  )
}

function Pastilla({ p, href, children, relleno, onClick, deshabilitado }: { p: Paleta; href?: string; children: React.ReactNode; relleno?: boolean; onClick?: () => void; deshabilitado?: boolean }) {
  const st: React.CSSProperties = {
    display: 'inline-block', boxSizing: 'border-box', textDecoration: 'none', cursor: deshabilitado ? 'default' : 'pointer',
    fontFamily: p.etiqueta, fontSize: 11.5, fontWeight: 500, letterSpacing: '.2em', textTransform: 'uppercase', padding: '14px 24px', borderRadius: 999, whiteSpace: 'nowrap', textAlign: 'center',
    border: `1px solid ${p.acento}`, background: relleno ? p.acento : 'transparent', color: relleno ? p.botonTxt : p.acento, opacity: deshabilitado ? 0.5 : 1,
  }
  return href
    ? <a className="cw-btn" href={href} target="_blank" rel="noopener noreferrer" style={st}>{children}</a>
    : <button className="cw-btn" type="button" onClick={deshabilitado ? undefined : onClick} disabled={deshabilitado} style={st}>{children}</button>
}

export default function InvitacionDespedida({ d, lang, ctl }: { d: any; lang: string; ctl: ControlDespedida }) {
  const p = paletaDe(d.tema, d.fuente)
  const t = (es: string, en: string) => (lang === 'en' ? en : es)
  const [sobreAbierto, setSobreAbierto] = useState(false)

  const festejada = String(d.festejada || d.nombre_novia || '').trim().slice(0, 40)
  const titulo = String(d.titulo || t('Despedida de soltera', 'Bridal shower')).trim().slice(0, 80)
  const invitada = String(d.nombre || '').trim().slice(0, 80)
  const primerNombre = invitada.split(/\s+/)[0] || invitada
  const anfitrionas = String(d.anfitrionas || '').trim().slice(0, 160)
  const mensaje = String(d.mensaje || '').trim().slice(0, 600)
  const lugarNombre = String(d.lugar_nombre || '').trim().slice(0, 120)
  const lugarDir = String(d.lugar_direccion || '').trim().slice(0, 200)
  const lugarCompleto = [lugarNombre, lugarDir].filter(Boolean).join(', ')
  const vestimenta = String(d.vestimenta || '').trim().slice(0, 80)
  const regalo = String(d.regalo || '').trim().slice(0, 160)
  const horario = [d.hora_inicio ? hora12(d.hora_inicio) : '', d.hora_fin ? hora12(d.hora_fin) : ''].filter(Boolean).join(t(' a ', ' to '))
  const portada = urlImagenSegura(d.portada_url)
  const encPortada = leerEncuadreTexto(d.portada_posicion)
  const cal = d.fecha ? enlacesCalendario(`${titulo}${festejada ? ` · ${festejada}` : ''}`, d.fecha, d.hora_inicio || null, lugarCompleto || null, `despedida-${String(d.token || 'x')}`, d.hora_fin || null) : null
  const limite = d.fecha_limite ? fechaLarga(d.fecha_limite, lang) : ''

  // WhatsApp para dudas: solo dígitos y largo válido; en México se agrega 52.
  const waDigitos = String(d.ayuda_whatsapp || '').replace(/\D/g, '')
  const waNumero = /^\d{10}$/.test(waDigitos) ? '52' + waDigitos : (/^\d{11,15}$/.test(waDigitos) ? waDigitos : '')
  const linkDudas = waNumero ? `https://wa.me/${waNumero}?text=${encodeURIComponent(t(`Hola, soy ${invitada}. Tengo una duda sobre la despedida.`, `Hi, this is ${invitada}. I have a question about the shower.`).slice(0, 300))}` : null

  const parrafo: React.CSSProperties = { fontFamily: p.serif, fontSize: 20, lineHeight: 1.55, color: p.txt2, margin: 0 }
  const tarjeta: React.CSSProperties = { border: `1px solid ${p.cardBorde}`, background: p.card, borderRadius: 18, padding: '20px 18px' }

  return (
    <div className="cw-raiz" style={{ background: p.bg, backgroundColor: p.papel, color: p.txt, minHeight: '100vh', position: 'relative', overflowX: 'hidden', fontFamily: p.serif }}>
      <DefsBotanicos />
      <Estilos p={p} />
      <Ambiente p={p} />

      {!sobreAbierto && (
        <Sobre p={p} lang={lang} para={invitada || t('ti', 'you')} iniciales={(festejada[0] || '♡').toUpperCase()} etiqueta={titulo} fecha={fechaPuntos(d.fecha, lang)} hint={t('Toca el sobre para abrirlo', 'Tap the envelope to open it')} onAbierto={() => setSobreAbierto(true)} />
      )}

      <div className="cw-pagina">
        {/* ───────── PORTADA ───────── */}
        <header style={{ position: 'relative', textAlign: 'center', padding: '54px 0 10px' }}>
          <Etiqueta p={p}>{titulo}</Etiqueta>
          <h1 style={{ fontFamily: p.script, fontWeight: 400, fontSize: 'clamp(70px, 22vw, 104px)', lineHeight: 1.05, color: p.acento, margin: '12px auto 0', padding: '0 10px' }}>{festejada}</h1>
          <div style={{ fontFamily: p.etiqueta, fontSize: 11.5, fontWeight: 500, letterSpacing: '.26em', textTransform: 'uppercase', color: p.txt2, marginTop: 14, padding: '0 14px' }}>{fechaPuntos(d.fecha, lang)}</div>
          {horario && <div style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 21, color: p.txt3, marginTop: 8 }}>{horario}</div>}

          <div style={{ position: 'relative', width: 'min(70vw,300px)', margin: '34px auto 0' }}>
            <div aria-hidden="true" style={{ position: 'absolute', inset: -11, border: `1px solid ${p.linea}`, borderRadius: '999px 999px 22px 22px' }} />
            <div style={{ position: 'relative', aspectRatio: '3/4', borderRadius: '999px 999px 18px 18px', overflow: 'hidden', background: `linear-gradient(160deg,${p.acento2},${p.papel})`, boxShadow: '0 24px 40px -22px rgba(90,60,55,.45)' }}>
              {portada
                ? <FotoEncuadrada src={portada} alt={festejada} enc={encPortada} prioridad />
                : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: p.script, fontSize: 90, color: p.acento }}>{(festejada[0] || '♡').toUpperCase()}</div>}
            </div>
          </div>

          {d.fecha && <div style={{ marginTop: 40 }}><Cuenta fecha={d.fecha} hora={d.hora_inicio || null} p={p} lang={lang} compacta /></div>}
        </header>

        {/* ───────── PARA TI ───────── */}
        <section className="cw-aparece" style={{ padding: '38px 26px 26px', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <Linea p={p} />
          <div style={{ marginTop: 26 }}><Etiqueta p={p}>{t('Tu invitación', 'Your invitation')}</Etiqueta></div>
          {invitada && <div style={{ fontFamily: p.script, fontSize: 'clamp(42px,12vw,56px)', color: p.acento, lineHeight: 1.05, marginTop: 10 }}>{invitada}</div>}
          {mensaje && <p style={{ ...parrafo, marginTop: 18 }}>{mensaje}</p>}
          {anfitrionas && (
            <div style={{ marginTop: 22 }}>
              <div style={{ fontFamily: p.etiqueta, fontSize: 10.5, letterSpacing: '.24em', textTransform: 'uppercase', color: p.txt3 }}>{t('Con cariño', 'With love')}</div>
              <div style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 22, color: p.txt, marginTop: 6 }}>{anfitrionas}</div>
            </div>
          )}
        </section>

        {/* ───────── DETALLES ───────── */}
        <section className="cw-aparece" style={{ padding: '18px 22px 26px', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          {lugarNombre && (
            <div style={tarjeta}>
              <Etiqueta p={p}>{t('¿Dónde será?', 'Where')}</Etiqueta>
              <div style={{ fontFamily: p.serif, fontSize: 27, color: p.txt, marginTop: 10, lineHeight: 1.2 }}>{lugarNombre}</div>
              {lugarDir && <div style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 18, color: p.txt3, marginTop: 6 }}>{lugarDir}</div>}
              {horario && <div style={{ fontFamily: p.etiqueta, fontSize: 11.5, letterSpacing: '.18em', textTransform: 'uppercase', color: p.acento, marginTop: 10 }}>{horario}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
                <Pastilla p={p} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugarCompleto)}`}>Google Maps</Pastilla>
                <Pastilla p={p} href={`https://waze.com/ul?q=${encodeURIComponent(lugarCompleto)}&navigate=yes`}>Waze</Pastilla>
              </div>
            </div>
          )}
          {(vestimenta || regalo) && (
            <div style={{ display: 'grid', gridTemplateColumns: vestimenta && regalo ? '1fr 1fr' : '1fr', gap: 12, marginTop: 12 }}>
              {vestimenta && (
                <div style={tarjeta}>
                  <Etiqueta p={p}>{t('Vestimenta', 'Dress code')}</Etiqueta>
                  <div style={{ fontFamily: p.serif, fontSize: 24, color: p.txt, marginTop: 8 }}>{vestimenta}</div>
                </div>
              )}
              {regalo && (
                <div style={tarjeta}>
                  <Etiqueta p={p}>{t('Regalo', 'Gift')}</Etiqueta>
                  <div style={{ fontFamily: p.serif, fontSize: 24, color: p.txt, marginTop: 8, lineHeight: 1.2 }}>{regalo}</div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ───────── CONFIRMAR ───────── */}
        <section id="confirmar" className="cw-aparece" style={{ padding: '26px 22px 30px', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ ...tarjeta, padding: '30px 22px' }}>
            <Etiqueta p={p}>{t('Confirma tu asistencia', 'Please RSVP')}</Etiqueta>
            <div style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 34, color: p.txt, marginTop: 10, lineHeight: 1.1 }}>{t('¿Nos acompañas?', 'Will you join us?')}</div>
            {limite && <p style={{ ...parrafo, fontSize: 18, marginTop: 10 }}>{t(`Por favor confírmanos antes del ${limite}.`, `Please let us know by ${limite}.`)}</p>}

            {ctl.enviado ? (
              <div style={{ marginTop: 22 }}>
                <div style={{ fontFamily: p.script, fontSize: 46, color: p.acento, lineHeight: 1.1 }}>{t('¡Gracias', 'Thank you')}{primerNombre ? `, ${primerNombre}` : ''}!</div>
                <p style={{ ...parrafo, marginTop: 10 }}>
                  {ctl.respuesta === 'si' ? t('Quedaste confirmada. ¡Te esperamos!', "You're confirmed. See you there!") : t('Gracias por avisarnos. Te vamos a extrañar.', "Thanks for letting us know. We'll miss you.")}
                </p>
                <div style={{ marginTop: 18 }}>
                  <button type="button" onClick={ctl.editar} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: p.etiqueta, fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: p.acento, textDecoration: 'underline', textUnderlineOffset: 4 }}>{t('Cambiar mi respuesta', 'Change my answer')}</button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 22 }}>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {([['si', t('Sí, ahí estaré', "Yes, I'll be there")], ['no', t('No podré ir', "I can't make it")]] as [RespuestaDespedida, string][]).map(([v, txt]) => (
                    <button key={v} type="button" onClick={() => ctl.setRespuesta(v)} aria-pressed={ctl.respuesta === v} className="cw-btn"
                      style={{ flex: '1 1 160px', maxWidth: 220, cursor: 'pointer', fontFamily: p.etiqueta, fontSize: 11.5, fontWeight: 500, letterSpacing: '.16em', textTransform: 'uppercase', padding: '15px 12px', borderRadius: 999, border: `1px solid ${p.acento}`, background: ctl.respuesta === v ? p.acento : 'transparent', color: ctl.respuesta === v ? p.botonTxt : p.acento }}>
                      {txt}
                    </button>
                  ))}
                </div>
                <textarea value={ctl.mensaje} maxLength={300} onChange={e => ctl.setMensaje(e.target.value)} rows={3}
                  placeholder={t(`Un mensaje para ${festejada || 'la novia'} (opcional)`, `A note for ${festejada || 'the bride'} (optional)`)}
                  style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 16, padding: '12px 14px', borderRadius: 14, border: `1px solid ${p.linea}`, background: 'rgba(255,255,255,.7)', fontFamily: p.serif, fontSize: 18, color: p.txt, resize: 'vertical', outline: 'none' }} />
                <div style={{ marginTop: 16 }}>
                  <Pastilla p={p} relleno onClick={ctl.enviar} deshabilitado={!ctl.respuesta || ctl.enviando}>{ctl.enviando ? t('Enviando…', 'Sending…') : t('Enviar respuesta', 'Send answer')}</Pastilla>
                </div>
              </div>
            )}
          </div>

          {cal && (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 22 }}>
              <a className="cw-chip" href={cal.googleUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: p.etiqueta, color: p.acento, border: `1px solid ${p.linea}` }}>+ Google Calendar</a>
              <a className="cw-chip" href={cal.icsUrl} download="despedida.ics" style={{ fontFamily: p.etiqueta, color: p.acento, border: `1px solid ${p.linea}` }}>+ Apple / Outlook</a>
            </div>
          )}

          {linkDudas && (
            <div style={{ marginTop: 26 }}>
              <p style={{ ...parrafo, fontSize: 18 }}>{t('¿Tienes alguna duda?', 'Any questions?')}</p>
              <div style={{ marginTop: 10 }}><Pastilla p={p} href={linkDudas}>{t('Escríbenos por WhatsApp', 'Message us on WhatsApp')}</Pastilla></div>
            </div>
          )}
        </section>

        <footer style={{ textAlign: 'center', padding: '20px 20px 46px' }}>
          <Linea p={p} />
          <a href="https://joincheers.app" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 22, textDecoration: 'none', opacity: 0.75 }}>
            <span style={{ fontFamily: p.etiqueta, fontSize: 9.5, letterSpacing: '.22em', textTransform: 'uppercase', color: p.txt3 }}>{t('Invitación creada por Cheers Bridal', 'Invitation created by Cheers Bridal')}</span>
            <span style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 14, color: p.txt3, marginLeft: 8 }}>{t('de Patty Eugenia', 'by Patty Eugenia')}</span>
          </a>
        </footer>
      </div>
    </div>
  )
}
