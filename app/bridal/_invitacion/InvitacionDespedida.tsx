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
import { paletaDe, urlImagenSegura, fechaPuntos, hora12 } from './tema'
import { Ambiente, Estilos } from './Invitacion'

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

export default function InvitacionDespedida({ d, lang, ctl }: { d: any; lang: string; ctl: ControlDespedida }) {
  const p = paletaDe(d.tema, d.fuente)
  const t = (es: string, en: string) => (lang === 'en' ? en : es)
  const [sobreAbierto, setSobreAbierto] = useState(false)
  const [ahora] = useState(() => Date.now())

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
  const limiteFecha = d.fecha_limite ? new Date(`${d.fecha_limite}T12:00:00`) : null
  const limite = limiteFecha && !isNaN(limiteFecha.getTime()) ? limiteFecha.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '') : ''

  // WhatsApp para dudas: solo dígitos y largo válido; en México se agrega 52.
  const waDigitos = String(d.ayuda_whatsapp || '').replace(/\D/g, '')
  const waNumero = /^\d{10}$/.test(waDigitos) ? '52' + waDigitos : (/^\d{11,15}$/.test(waDigitos) ? waDigitos : '')
  const linkDudas = waNumero ? `https://wa.me/${waNumero}?text=${encodeURIComponent(t(`Hola, soy ${invitada}. Tengo una duda sobre la despedida.`, `Hi, this is ${invitada}. I have a question about the shower.`).slice(0, 300))}` : null

  // Faltan N días (sin reloj grande: la invitación es corta a propósito)
  const dias = d.fecha ? Math.ceil((new Date(`${d.fecha}T${/^\d{2}:\d{2}$/.test(d.hora_inicio || '') ? d.hora_inicio : '00:00'}:00`).getTime() - ahora) / 86400000) : null
  const faltan = dias !== null && dias > 0 ? (dias === 1 ? t('Falta 1 día', '1 day to go') : t(`Faltan ${dias} días`, `${dias} days to go`)) : ''
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugarCompleto)}`
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(lugarCompleto)}&navigate=yes`

  const etq: React.CSSProperties = { fontFamily: p.etiqueta, fontSize: 10.5, fontWeight: 500, letterSpacing: '.22em', textTransform: 'uppercase', color: p.acento }
  const mini: React.CSSProperties = { fontFamily: p.etiqueta, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: p.acento, border: `1px solid ${p.linea}`, borderRadius: 999, padding: '7px 12px', textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-block' }

  return (
    <div className="cw-raiz" style={{ background: p.bg, backgroundColor: p.papel, color: p.txt, minHeight: '100vh', position: 'relative', overflowX: 'hidden', fontFamily: p.serif }}>
      <DefsBotanicos />
      <Estilos p={p} />
      <EstilosDespedida />
      <Ambiente p={p} />

      {!sobreAbierto && (
        <Sobre p={p} lang={lang} para={invitada || t('ti', 'you')} iniciales={(festejada[0] || '♡').toUpperCase()} etiqueta={titulo} fecha={fechaPuntos(d.fecha, lang)} hint={t('Toca el sobre para abrirlo', 'Tap the envelope to open it')} onAbierto={() => setSobreAbierto(true)} />
      )}

      <div className="cw-pagina cd-pagina">
        <div className="cd-grid">
          {/* Foto en arco */}
          <div className="cd-foto">
            <div aria-hidden="true" style={{ position: 'absolute', inset: -9, border: `1px solid ${p.linea}`, borderRadius: '999px 999px 20px 20px' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '999px 999px 16px 16px', overflow: 'hidden', background: `linear-gradient(160deg,${p.acento2},${p.papel})`, boxShadow: '0 20px 34px -20px rgba(90,60,55,.45)' }}>
              {portada
                ? <FotoEncuadrada src={portada} alt={festejada} enc={encPortada} prioridad />
                : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: p.script, fontSize: 80, color: p.acento }}>{(festejada[0] || '♡').toUpperCase()}</div>}
            </div>
          </div>

          <div className="cd-info">
            {/* Encabezado */}
            <div style={etq}>{titulo}</div>
            <h1 className="cd-nombre" style={{ fontFamily: p.script, fontWeight: 400, color: p.acento, margin: 0, lineHeight: 1 }}>{festejada}</h1>
            <div className="cd-fecha" style={{ fontFamily: p.etiqueta, fontWeight: 500, letterSpacing: '.24em', textTransform: 'uppercase', color: p.txt2 }}>{fechaPuntos(d.fecha, lang)}</div>
            {(horario || faltan) && <div className="cd-sub" style={{ fontFamily: p.serif, fontStyle: 'italic', color: p.txt3 }}>{[horario, faltan].filter(Boolean).join(' · ')}</div>}

            {/* Para ti */}
            {invitada && <div className="cd-invitada" style={{ fontFamily: p.script, color: p.acento, lineHeight: 1.05 }}><span style={{ ...etq, color: p.txt3, marginRight: 10, verticalAlign: '.45em' }}>{t('Para', 'For')}</span>{invitada}</div>}
            {mensaje && <p className="cd-texto" style={{ fontFamily: p.serif, color: p.txt2, margin: 0 }}>{mensaje}</p>}
            {anfitrionas && <div className="cd-firma" style={{ fontFamily: p.serif, fontStyle: 'italic', color: p.txt }}>{t('Con cariño,', 'With love,')} {anfitrionas}</div>}

            {/* Detalles en una sola tarjeta */}
            <div className="cd-detalles" style={{ border: `1px solid ${p.cardBorde}`, background: p.card }}>
              {lugarNombre && (
                <div className="cd-det cd-det-lugar">
                  <div style={etq}>{t('Dónde', 'Where')}</div>
                  <div className="cd-det-valor" style={{ fontFamily: p.serif, color: p.txt }}>{lugarNombre}</div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 6 }}>
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={mini}>Maps</a>
                    <a href={wazeUrl} target="_blank" rel="noopener noreferrer" style={mini}>Waze</a>
                  </div>
                </div>
              )}
              {vestimenta && (
                <div className="cd-det">
                  <div style={etq}>{t('Vestimenta', 'Dress code')}</div>
                  <div className="cd-det-valor" style={{ fontFamily: p.serif, color: p.txt }}>{vestimenta}</div>
                </div>
              )}
              {regalo && (
                <div className="cd-det">
                  <div style={etq}>{t('Regalo', 'Gift')}</div>
                  <div className="cd-det-valor" style={{ fontFamily: p.serif, color: p.txt }}>{regalo}</div>
                </div>
              )}
            </div>

            {/* Confirmar */}
            <div id="confirmar" className="cd-rsvp" style={{ border: `1px solid ${p.cardBorde}`, background: p.card }}>
              {ctl.enviado ? (
                <>
                  <div className="cd-gracias" style={{ fontFamily: p.script, color: p.acento, lineHeight: 1.1 }}>{t('¡Gracias', 'Thank you')}{primerNombre ? `, ${primerNombre}` : ''}!</div>
                  <p className="cd-texto" style={{ fontFamily: p.serif, color: p.txt2, margin: '4px 0 0' }}>
                    {ctl.respuesta === 'si' ? t('Quedaste confirmada. ¡Te esperamos!', "You're confirmed. See you there!") : t('Gracias por avisarnos. Te vamos a extrañar.', "Thanks for letting us know. We'll miss you.")}
                  </p>
                  <button type="button" onClick={ctl.editar} style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: p.etiqueta, fontSize: 10.5, letterSpacing: '.2em', textTransform: 'uppercase', color: p.acento, textDecoration: 'underline', textUnderlineOffset: 4 }}>{t('Cambiar mi respuesta', 'Change my answer')}</button>
                </>
              ) : (
                <>
                  <div style={etq}>{t('¿Nos acompañas?', 'Will you join us?')}</div>
                  {limite && <div className="cd-limite" style={{ fontFamily: p.serif, fontStyle: 'italic', color: p.txt3 }}>{t(`Confirma antes del ${limite}`, `Please reply by ${limite}`)}</div>}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
                    {([['si', t('Sí voy', "I'll be there")], ['no', t('No podré', "Can't make it")]] as [RespuestaDespedida, string][]).map(([v, txt]) => (
                      <button key={v} type="button" onClick={() => ctl.setRespuesta(v)} aria-pressed={ctl.respuesta === v} className="cw-btn"
                        style={{ flex: '1 1 0', maxWidth: 180, cursor: 'pointer', fontFamily: p.etiqueta, fontSize: 11, fontWeight: 500, letterSpacing: '.16em', textTransform: 'uppercase', padding: '12px 8px', borderRadius: 999, border: `1px solid ${p.acento}`, background: ctl.respuesta === v ? p.acento : 'transparent', color: ctl.respuesta === v ? p.botonTxt : p.acento }}>
                        {txt}
                      </button>
                    ))}
                  </div>
                  {ctl.respuesta && (
                    <>
                      <input value={ctl.mensaje} maxLength={300} onChange={e => ctl.setMensaje(e.target.value)}
                        placeholder={t(`Un mensaje para ${festejada || 'la novia'} (opcional)`, `A note for ${festejada || 'the bride'} (optional)`)}
                        style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 10, padding: '10px 14px', borderRadius: 999, border: `1px solid ${p.linea}`, background: 'rgba(255,255,255,.75)', fontFamily: p.serif, fontSize: 17, color: p.txt, outline: 'none' }} />
                      <button type="button" onClick={ctl.enviar} disabled={ctl.enviando} className="cw-btn"
                        style={{ marginTop: 10, cursor: 'pointer', fontFamily: p.etiqueta, fontSize: 11, fontWeight: 500, letterSpacing: '.2em', textTransform: 'uppercase', padding: '12px 26px', borderRadius: 999, border: `1px solid ${p.acento}`, background: p.acento, color: p.botonTxt, opacity: ctl.enviando ? 0.6 : 1 }}>
                        {ctl.enviando ? t('Enviando…', 'Sending…') : t('Enviar respuesta', 'Send answer')}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Calendario y dudas en una sola línea */}
            {(cal || linkDudas) && (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                {cal && <a href={cal.googleUrl} target="_blank" rel="noopener noreferrer" style={mini}>+ Google Calendar</a>}
                {cal && <a href={cal.icsUrl} download="despedida.ics" style={mini}>+ Apple</a>}
                {linkDudas && <a href={linkDudas} target="_blank" rel="noopener noreferrer" style={mini}>{t('Dudas', 'Questions')}</a>}
              </div>
            )}

            <a href="https://joincheers.app" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', opacity: 0.7 }}>
              <span style={{ fontFamily: p.etiqueta, fontSize: 9, letterSpacing: '.22em', textTransform: 'uppercase', color: p.txt3 }}>{t('Invitación creada por Cheers Bridal', 'Invitation created by Cheers Bridal')}</span>
              <span style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 13, color: p.txt3, marginLeft: 6 }}>{t('de Patty Eugenia', 'by Patty Eugenia')}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Diseño compacto: en celular, una columna corta; en computadora, foto a la
// izquierda y todo lo demás a la derecha en una sola pantalla.
function EstilosDespedida() {
  return (
    <style>{`
      .cw-pagina.cd-pagina { zoom: 1 !important; }
      .cd-grid { max-width: 460px; margin: 0 auto; padding: 46px 20px 28px; display: flex; flex-direction: column; align-items: center; gap: 18px; }
      .cd-foto { position: relative; width: min(46vw, 190px); aspect-ratio: 3 / 4; margin: 6px 0 4px; }
      .cd-info { width: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; }
      .cd-nombre { font-size: clamp(64px, 19vw, 84px); margin-top: -2px !important; }
      .cd-fecha { font-size: 11.5px; }
      .cd-sub { font-size: 18px; }
      .cd-invitada { font-size: clamp(34px, 10vw, 44px); margin-top: 8px; }
      .cd-texto { font-size: 18px; line-height: 1.45; text-wrap: balance; }
      .cd-firma { font-size: 18px; }
      .cd-detalles { width: 100%; box-sizing: border-box; border-radius: 18px; padding: 14px 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px 8px; margin-top: 6px; }
      .cd-det-lugar { grid-column: 1 / -1; padding-bottom: 12px; border-bottom: 1px solid rgba(173,133,124,.22); }
      .cd-det-valor { font-size: 21px; line-height: 1.2; margin-top: 4px; }
      .cd-rsvp { width: 100%; box-sizing: border-box; border-radius: 18px; padding: 16px 14px; }
      .cd-limite { font-size: 16px; margin-top: 4px; }
      .cd-gracias { font-size: 40px; }
      @media (min-width: 1000px) and (min-height: 600px) {
        .cd-grid { max-width: 1240px; min-height: 100vh; box-sizing: border-box; padding: 3vh 5vw; flex-direction: row; justify-content: center; gap: 5vw; }
        .cd-foto { width: auto; height: clamp(320px, 74vh, 700px); flex: none; margin: 0; }
        .cd-info { max-width: 620px; gap: 1.2vh; }
        .cd-nombre { font-size: clamp(70px, 12vh, 120px); }
        .cd-fecha { font-size: clamp(12px, 1.8vh, 16px); }
        .cd-sub { font-size: clamp(17px, 2.5vh, 22px); }
        .cd-invitada { font-size: clamp(34px, 5.4vh, 52px); margin-top: 0.6vh; }
        .cd-texto { font-size: clamp(16.5px, 2.4vh, 21px); }
        .cd-firma { font-size: clamp(16.5px, 2.4vh, 21px); }
        .cd-detalles { grid-template-columns: 1.5fr 1fr 1fr; padding: 1.6vh 1vw; margin-top: 0.6vh; }
        .cd-det-lugar { grid-column: auto; padding-bottom: 0; border-bottom: none; border-right: 1px solid rgba(173,133,124,.22); padding-right: 8px; }
        .cd-det-valor { font-size: clamp(18px, 2.6vh, 23px); }
        .cd-rsvp { padding: 1.8vh 1.4vw; }
      }
    `}</style>
  )
}
