'use client'
// "Post-invitación" de la despedida: lo que ve cada invitada con su mismo link
// personal a partir del día siguiente al evento. Mismo diseño que la invitación,
// pero solo con el agradecimiento y el álbum de fotos (sin confirmar, ubicación
// ni calendario). La invitación original sigue disponible con ?invitacion=1.
// Aquí NO hay acceso a la base de datos: la página le pasa los datos.
import '@fontsource/allura/latin-400.css'
import '@fontsource/cormorant-garamond/latin-400.css'
import '@fontsource/cormorant-garamond/latin-400-italic.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/jost/latin-400.css'
import '@fontsource/jost/latin-500.css'
import { useState } from 'react'
import { DefsBotanicos } from './Botanicos'
import Sobre from './Sobre'
import { FotoEncuadrada } from './FotoEncuadrada'
import { leerEncuadreTexto } from './encuadre'
import { paletaDe, urlImagenSegura, fechaPuntos } from './tema'
import { Ambiente, Estilos } from './Invitacion'
import { EstilosDespedida } from './InvitacionDespedida'

export default function PostDespedida({ d, lang }: { d: any; lang: string }) {
  const p = paletaDe(d.tema, d.fuente)
  const t = (es: string, en: string) => (lang === 'en' ? en : es)
  const [sobreAbierto, setSobreAbierto] = useState(false)

  const festejada = String(d.festejada || d.nombre_novia || '').trim().slice(0, 40)
  const titulo = String(d.titulo || t('Despedida de soltera', 'Bridal shower')).trim().slice(0, 80)
  const invitada = String(d.nombre || '').trim().slice(0, 80)
  const primerNombre = invitada.split(/\s+/)[0] || invitada
  const anfitrionas = String(d.anfitrionas || '').trim().slice(0, 160)
  const fue = d.respuesta !== 'no'
  // Foto propia de la post-invitación (ej. con las anfitrionas); si no hay, la portada de la boda
  const fotoPost = urlImagenSegura(d.post_portada_url)
  const portada = fotoPost || urlImagenSegura(d.portada_url)
  const encPortada = leerEncuadreTexto(fotoPost ? d.post_portada_posicion : d.portada_posicion)

  const albumCodigo = /^[a-z0-9]{8,24}$/.test(String(d.album_codigo || '')) ? String(d.album_codigo) : ''
  const albumUrl = albumCodigo ? `https://joincheers.app/bridal/fotos/${albumCodigo}` : ''
  const cierra = d.album_cierra ? new Date(d.album_cierra) : null
  const albumAbierto = !!cierra && !isNaN(cierra.getTime()) && Date.now() < cierra.getTime()
  const cierraTexto = albumAbierto && cierra
    ? cierra.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Monterrey' }).replace(',', '')
    : ''

  const etq: React.CSSProperties = { fontFamily: p.etiqueta, fontSize: 10.5, fontWeight: 500, letterSpacing: '.22em', textTransform: 'uppercase', color: p.acento }
  const botonFotos: React.CSSProperties = { fontFamily: p.etiqueta, fontSize: 11.5, fontWeight: 500, letterSpacing: '.18em', textTransform: 'uppercase', padding: '14px 26px', borderRadius: 999, border: `1px solid ${p.acento}`, background: p.acento, color: p.botonTxt, textDecoration: 'none', display: 'inline-block' }

  return (
    <div className="cw-raiz" style={{ background: p.bg, backgroundColor: p.papel, color: p.txt, minHeight: '100vh', position: 'relative', overflowX: 'hidden', fontFamily: p.serif }}>
      <DefsBotanicos />
      <Estilos p={p} />
      <EstilosDespedida />
      <Ambiente p={p} />

      {!sobreAbierto && (
        <Sobre p={p} lang={lang} para={invitada || t('ti', 'you')} iniciales={(festejada[0] || '♡').toUpperCase()} carta={t('Gracias', 'Thank you')} etiqueta={titulo} fecha={fechaPuntos(d.fecha, lang)} hint={t('Toca el sobre para abrirlo', 'Tap the envelope to open it')} onAbierto={() => setSobreAbierto(true)} />
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
            <div style={etq}>{titulo}{festejada ? ` · ${festejada}` : ''}</div>
            <h1 className="cd-nombre" style={{ fontFamily: p.script, fontWeight: 400, color: p.acento, margin: 0, lineHeight: 1 }}>
              {fue ? t('Gracias', 'Thank you') : t('Te extrañamos', 'We missed you')}
            </h1>
            {primerNombre && <div className="cd-sub" style={{ fontFamily: p.serif, fontStyle: 'italic', color: p.txt3 }}>{fue ? t(`por acompañarnos, ${primerNombre}`, `for joining us, ${primerNombre}`) : primerNombre}</div>}

            <p className="cd-texto" style={{ fontFamily: p.serif, color: p.txt2, margin: 0 }}>
              {fue
                ? t('Fue una mañana muy bonita y nos dio mucho gusto compartirla contigo.', 'It was a lovely morning and we were so glad to share it with you.')
                : t('Gracias por tu cariño. Aquí puedes ver algunas fotos de la despedida.', 'Thank you for your love. Here you can see some photos from the shower.')}
            </p>

            {albumUrl && (
              <div className="cd-rsvp" style={{ border: `1px solid ${p.cardBorde}`, background: p.card }}>
                <div style={etq}>{t('Álbum de fotos', 'Photo album')}</div>
                {fue && albumAbierto && (
                  <p className="cd-texto" style={{ fontFamily: p.serif, color: p.txt2, margin: '6px 0 0' }}>
                    {t('Si tomaste fotos, nos encantaría verlas. Puedes subirlas aquí, sin descargar nada.', "If you took photos, we'd love to see them. Upload them here, nothing to download.")}
                  </p>
                )}
                <a href={albumUrl} target="_blank" rel="noopener noreferrer" className="cw-btn" style={{ ...botonFotos, marginTop: 12 }}>
                  {fue && albumAbierto ? t('Subir y ver fotos', 'Upload and see photos') : t('Ver las fotos', 'See the photos')}
                </a>
                {fue && cierraTexto && (
                  <div className="cd-limite" style={{ fontFamily: p.serif, fontStyle: 'italic', color: p.txt3, marginTop: 10 }}>
                    {t(`El álbum queda abierto hasta el ${cierraTexto}.`, `The album stays open until ${cierraTexto}.`)}
                  </div>
                )}
              </div>
            )}

            {anfitrionas && <div className="cd-firma" style={{ fontFamily: p.serif, fontStyle: 'italic', color: p.txt }}>{t('Con cariño,', 'With love,')} {anfitrionas}</div>}

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
