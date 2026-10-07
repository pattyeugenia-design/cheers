'use client'
import { useEffect, useState } from 'react'
import { Peonia, RamaEucalipto, Ramillete } from './Botanicos'
import type { Paleta } from './tema'

// Portada de entrada: un sobre dirigido al invitado por su nombre. Al tocarlo
// se abre la solapa, la carta sube y la portada se desvanece. Es solo
// decoración: el contenido de la invitación ya está debajo y accesible.
export default function Sobre({ p, para, iniciales, etiqueta, fecha, hint, onAbierto, lang }: {
  p: Paleta; para: string; iniciales: string; etiqueta: string; fecha: string; hint: string; onAbierto: () => void; lang: string
}) {
  const [fase, setFase] = useState<'cerrado' | 'abriendo' | 'fuera'>('cerrado')

  function abrir() {
    if (fase !== 'cerrado') return
    setFase('abriendo')
    window.setTimeout(() => { setFase('fuera'); onAbierto() }, 2000)
  }

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  if (fase === 'fuera') return null
  return (
    <div className={`cw-sobre-capa${fase === 'abriendo' ? ' cw-abriendo' : ''}`} style={{ background: p.bg, backgroundColor: p.papel }}>
      {p.botanicos && (
        <>
          <div style={{ position: 'absolute', top: -22, left: -34, opacity: .95, pointerEvents: 'none' }}><RamaEucalipto ancho={150} rotar={128} hojas={9} /></div>
          <div style={{ position: 'absolute', bottom: -18, right: -46, pointerEvents: 'none' }}><Ramillete ancho={290} /></div>
          <div style={{ position: 'absolute', top: 44, right: -30, opacity: .75, pointerEvents: 'none' }}><Peonia ancho={96} tono="oscuro" rotar={20} /></div>
        </>
      )}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px' }}>
        <div style={{ fontFamily: p.etiqueta, fontSize: 11, letterSpacing: p.tracking, color: p.acento, textTransform: 'uppercase', marginBottom: 26 }}>{etiqueta}</div>

        <button type="button" onClick={abrir} aria-label={lang === 'en' ? 'Open invitation' : 'Abrir invitación'} className="cw-sobre">
          <div className="cw-sobre-cuerpo" />
          <div className="cw-sobre-carta">
            <div style={{ fontFamily: p.script, fontSize: 30, color: p.acento, lineHeight: 1 }}>{iniciales}</div>
            <div style={{ fontFamily: p.etiqueta, fontSize: 8.5, letterSpacing: '.3em', color: p.txt3, marginTop: 8 }}>{fecha}</div>
          </div>
          <div className="cw-sobre-frente">
            <div className="cw-sobre-dest">
              <div style={{ fontFamily: p.etiqueta, fontSize: 8.5, letterSpacing: '.32em', color: 'rgba(110,78,70,.7)', textTransform: 'uppercase' }}>{lang === 'en' ? 'For' : 'Para'}</div>
              <div style={{ fontFamily: p.script, fontSize: 'clamp(24px,7.2vw,31px)', color: '#6E4E46', lineHeight: 1.05, marginTop: 3 }}>{para}</div>
            </div>
          </div>
          <div className="cw-sobre-solapa" />
          <div className="cw-sello">
            <span style={{ fontFamily: p.script, fontSize: 21, color: '#F6E7E1', lineHeight: 1, whiteSpace: 'nowrap' }}>{iniciales.replace(/\s+/g, '')}</span>
          </div>
        </button>

        <div className="cw-hint" style={{ fontFamily: p.serif, fontStyle: 'italic', fontSize: 17, color: p.txt2, marginTop: 34 }}>{hint}</div>
      </div>
    </div>
  )
}
