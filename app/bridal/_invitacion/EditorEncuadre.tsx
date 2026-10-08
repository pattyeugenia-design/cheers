'use client'
import { useEffect, useRef, useState } from 'react'
import { FotoEncuadrada } from './FotoEncuadrada'
import { normalizarEncuadre, redondear, type Encuadre } from './encuadre'

// Ventana para acomodar una foto en su marco: se arrastra para moverla y se acerca con la barra.
// El marco usa la MISMA proporción y el MISMO dibujo que la invitación, así que lo que se ve aquí
// es lo que verán los invitados.
export default function EditorEncuadre({ url, aspecto, arco, inicial, titulo, lang, onGuardar, onCancelar }: {
  url: string; aspecto: string; arco?: boolean; inicial?: { x?: unknown; y?: unknown; z?: unknown } | null; titulo: string; lang: string
  onGuardar: (e: Encuadre) => void; onCancelar: () => void
}) {
  const t = (es: string, en: string) => (lang === 'en' ? en : es)
  const [enc, setEnc] = useState<Encuadre>(normalizarEncuadre(inicial))
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null)
  const marco = useRef<HTMLDivElement>(null)
  const arrastre = useRef<{ px: number; py: number; x: number; y: number } | null>(null)
  const [moviendo, setMoviendo] = useState(false)

  // medimos la foto original para saber cuánto sobra por cada lado y poder arrastrarla bien
  useEffect(() => {
    const im = new window.Image()
    im.onload = () => setNat({ w: im.naturalWidth, h: im.naturalHeight })
    im.src = url
  }, [url])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancelar() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onCancelar])

  function medidas() {
    const m = marco.current
    if (!m || !nat) return null
    const cw = m.clientWidth, ch = m.clientHeight
    const cubrir = Math.max(cw / nat.w, ch / nat.h)
    return { cw, ch, dw: nat.w * cubrir * enc.z, dh: nat.h * cubrir * enc.z }
  }
  function mover(dx: number, dy: number, base: { x: number; y: number }) {
    const d = medidas()
    if (!d) return
    const sobraX = d.cw - d.dw, sobraY = d.ch - d.dh   // siempre ≤ 0: lo que se sale de cada lado
    const x = sobraX < -0.5 ? base.x + dx / sobraX : base.x
    const y = sobraY < -0.5 ? base.y + dy / sobraY : base.y
    setEnc(prev => normalizarEncuadre({ x, y, z: prev.z }))
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={titulo} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(40,28,26,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onCancelar}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, padding: 20, width: 'min(360px, 100%)', maxHeight: '100%', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.35)', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#3D2B2E', marginBottom: 4 }}>{titulo}</div>
        <div style={{ fontSize: 12, color: 'rgba(61,43,46,.6)', marginBottom: 14, lineHeight: 1.4 }}>{t('Arrastra la foto para acomodarla. Así es como la verán tus invitados.', 'Drag the photo to position it. This is how your guests will see it.')}</div>

        <div
          ref={marco}
          data-x={enc.x.toFixed(3)} data-y={enc.y.toFixed(3)} data-z={enc.z.toFixed(2)} data-listo={nat ? '1' : '0'}
          tabIndex={0}
          aria-label={t('Marco de la foto. Usa las flechas del teclado para moverla.', 'Photo frame. Use the arrow keys to move it.')}
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); arrastre.current = { px: e.clientX, py: e.clientY, x: enc.x, y: enc.y }; setMoviendo(true) }}
          onPointerMove={e => { const a = arrastre.current; if (a) mover(e.clientX - a.px, e.clientY - a.py, { x: a.x, y: a.y }) }}
          onPointerUp={() => { arrastre.current = null; setMoviendo(false) }}
          onPointerCancel={() => { arrastre.current = null; setMoviendo(false) }}
          onKeyDown={e => {
            const paso = 0.02
            const m: Record<string, [number, number]> = { ArrowLeft: [paso, 0], ArrowRight: [-paso, 0], ArrowUp: [0, paso], ArrowDown: [0, -paso] }
            if (m[e.key]) { e.preventDefault(); setEnc(p => normalizarEncuadre({ x: p.x + m[e.key][0], y: p.y + m[e.key][1], z: p.z })) }
          }}
          style={{ position: 'relative', width: 'min(300px, calc(100vw - 80px))', margin: '0 auto', aspectRatio: aspecto, touchAction: 'none', cursor: moviendo ? 'grabbing' : 'grab', outlineOffset: 3, userSelect: 'none', WebkitUserSelect: 'none', borderRadius: arco ? '999px 999px 14px 14px' : 6, boxShadow: '0 8px 24px -10px rgba(60,40,36,.5)' }}
        >
          <FotoEncuadrada src={url} enc={enc} radio={arco ? '999px 999px 14px 14px' : 6} fondo="#EEE6E0" />
        </div>

        <label style={{ display: 'block', marginTop: 18, fontSize: 11, fontWeight: 700, color: 'rgba(61,43,46,.55)' }}>
          {t('Acercar', 'Zoom')}
          <input type="range" min={1} max={3} step={0.02} value={enc.z} onChange={e => setEnc(p => normalizarEncuadre({ x: p.x, y: p.y, z: parseFloat(e.target.value) }))} style={{ display: 'block', width: '100%', marginTop: 6, accentColor: '#B76E79' }} />
        </label>

        <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'space-between' }}>
          <button type="button" onClick={() => setEnc({ x: 0.5, y: 0.5, z: 1 })} style={{ border: 'none', background: 'transparent', color: 'rgba(61,43,46,.55)', fontSize: 12, cursor: 'pointer', padding: '8px 4px' }}>{t('Restablecer', 'Reset')}</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onCancelar} style={{ border: '1px solid rgba(0,0,0,.15)', background: 'transparent', color: '#3D2B2E', fontSize: 13, fontWeight: 700, padding: '9px 16px', borderRadius: 10, cursor: 'pointer' }}>{t('Cancelar', 'Cancel')}</button>
            <button type="button" onClick={() => onGuardar(redondear(enc))} style={{ border: 'none', background: 'linear-gradient(135deg,#C9A876,#C98A93)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 18px', borderRadius: 10, cursor: 'pointer' }}>{t('Guardar', 'Save')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
