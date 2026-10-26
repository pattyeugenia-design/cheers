'use client'
import { useEffect, useMemo, useState } from 'react'

// "Modo envío": muestra un invitado a la vez con un botón grande para abrir
// WhatsApp con su mensaje listo. Al dar Enviar se marca como enviado y pasa
// solo al siguiente. Nada se manda automático: la persona da Enviar en WhatsApp.
const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const ROSA = '#B76E79'
const TINTA = '#3D2B2E'

export type ItemEnvio = { id: string; nombre: string; telefono: string | null; enviado: boolean }
type Via = 'app' | 'web'

// 10 dígitos = México (se agrega 52); "+1…" u otro con lada se respeta.
export function numeroWa(tel: string | null) {
  const crudo = String(tel || '')
  const dig = crudo.replace(/\D/g, '')
  if (/^\d{10}$/.test(dig) && !crudo.trim().startsWith('+')) return '52' + dig
  if (/^\d{11,15}$/.test(dig)) return dig
  return ''
}

function esCelular() {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export default function ModoEnvio({ items, textoDe, onEnviado, onCerrar, lang }: {
  items: ItemEnvio[]
  textoDe: (id: string) => string
  onEnviado: (id: string) => void
  onCerrar: () => void
  lang: string
}) {
  const t = (es: string, en: string) => (lang === 'en' ? en : es)
  const [saltarEnviados, setSaltarEnviados] = useState(true)
  // La cola se arma una sola vez al abrir (y al cambiar el filtro de enviados),
  // para que no se mueva mientras se marca a cada quien como enviado.
  const cola = useMemo(
    () => items.filter(i => numeroWa(i.telefono) && (!saltarEnviados || !i.enviado)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saltarEnviados]
  )
  const sinTel = useMemo(() => items.filter(i => !numeroWa(i.telefono)).length, [items])
  const [pos, setPos] = useState(0)
  const [hechos, setHechos] = useState<Set<string>>(new Set())
  const [movil, setMovil] = useState(false)
  const [via, setVia] = useState<Via>('app')

  useEffect(() => {
    setMovil(esCelular())
    try { const v = localStorage.getItem('cheers_envio_via'); if (v === 'app' || v === 'web') setVia(v) } catch { /* sin storage */ }
  }, [])
  useEffect(() => { setPos(0) }, [saltarEnviados])

  const actual = cola[pos]
  const total = cola.length
  const terminado = pos >= total

  function cambiarVia(v: Via) {
    setVia(v)
    try { localStorage.setItem('cheers_envio_via', v) } catch { /* sin storage */ }
  }

  function urlDe(id: string, tel: string | null) {
    const num = numeroWa(tel)
    const txt = encodeURIComponent(textoDe(id))
    if (movil) return `https://wa.me/${num}?text=${txt}`
    if (via === 'web') return `https://web.whatsapp.com/send?phone=${num}&text=${txt}`
    return `whatsapp://send?phone=${num}&text=${txt}`
  }

  function enviar() {
    if (!actual) return
    const url = urlDe(actual.id, actual.telefono)
    if (!movil && via === 'web') window.open(url, 'cheers_whatsapp')
    else if (!movil) window.location.href = url
    else window.open(url, '_blank')
    onEnviado(actual.id)
    setHechos(prev => new Set(prev).add(actual.id))
    setPos(p => p + 1)
  }

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      // Si el foco está en un botón, Enter/espacio ya lo "clickea": no repetir.
      if ((e.key === 'Enter' || e.key === ' ') && e.target instanceof HTMLElement && e.target.tagName === 'BUTTON') return
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enviar() }
      else if (e.key === 'ArrowRight') setPos(p => Math.min(p + 1, total))
      else if (e.key === 'ArrowLeft') setPos(p => Math.max(p - 1, 0))
      else if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  })

  const boton: React.CSSProperties = { border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 700, padding: '10px 14px', borderRadius: 10, background: 'rgba(183,110,121,.1)', color: TINTA }

  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(61,43,46,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: F, color: TINTA }}>
      <div style={{ background: '#FBF6F3', borderRadius: 18, width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', padding: '18px 18px 20px', boxShadow: '0 24px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: ROSA, letterSpacing: '.04em' }}>{t('MODO ENVÍO', 'SEND MODE')}</div>
          <button onClick={onCerrar} style={{ ...boton, padding: '6px 10px', background: 'transparent' }}>{t('Cerrar', 'Close')}</button>
        </div>

        <div style={{ height: 6, background: 'rgba(183,110,121,.15)', borderRadius: 99, margin: '12px 0 6px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${total ? (Math.min(pos, total) / total) * 100 : 100}%`, background: ROSA, transition: 'width .25s' }} />
        </div>
        <div style={{ fontSize: 12, color: 'rgba(61,43,46,.6)', display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <span>{terminado ? t(`Listo: ${hechos.size} enviados`, `Done: ${hechos.size} sent`) : t(`${pos + 1} de ${total}`, `${pos + 1} of ${total}`)}</span>
          <label style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={saltarEnviados} onChange={e => setSaltarEnviados(e.target.checked)} style={{ marginRight: 6 }} />
            {t('Saltar a quien ya se le envió', 'Skip already sent')}
          </label>
        </div>

        {terminado ? (
          <div style={{ textAlign: 'center', padding: '34px 8px 14px' }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{total ? t('¡Terminaste!', 'All done!') : t('No hay nadie pendiente', 'No one left')}</div>
            {sinTel > 0 && <p style={{ fontSize: 13, color: 'rgba(61,43,46,.6)' }}>{t(`${sinTel} sin teléfono válido no entraron a la cola.`, `${sinTel} without a valid phone were skipped.`)}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14 }}>
              {total > 0 && <button onClick={() => setPos(Math.max(total - 1, 0))} style={boton}>{t('← Regresar', '← Back')}</button>}
              <button onClick={onCerrar} style={{ ...boton, background: ROSA, color: '#fff' }}>{t('Cerrar', 'Close')}</button>
            </div>
          </div>
        ) : actual && (
          <>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2 }}>{actual.nombre}</div>
              <div style={{ fontSize: 13, color: 'rgba(61,43,46,.6)', marginTop: 2 }}>
                {actual.telefono}{actual.enviado || hechos.has(actual.id) ? ` · ${t('ya enviado', 'already sent')}` : ''}
              </div>
            </div>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.45, background: '#fff', border: '1px solid rgba(183,110,121,.18)', borderRadius: 12, padding: '12px 14px', margin: '12px 0 16px', maxHeight: 220, overflowY: 'auto' }}>
              {textoDe(actual.id)}
            </div>
            <button onClick={enviar} autoFocus style={{ ...boton, width: '100%', fontSize: 17, padding: '16px', background: ROSA, color: '#fff', borderRadius: 14 }}>
              {t('Enviar por WhatsApp', 'Send on WhatsApp')}
            </button>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 10 }}>
              <button onClick={() => setPos(p => Math.max(p - 1, 0))} disabled={pos === 0} style={{ ...boton, opacity: pos === 0 ? 0.4 : 1 }}>{t('← Anterior', '← Previous')}</button>
              <button onClick={() => setPos(p => p + 1)} style={boton}>{t('Saltar →', 'Skip →')}</button>
            </div>
            {!movil && (
              <div style={{ fontSize: 12, color: 'rgba(61,43,46,.6)', marginTop: 14, lineHeight: 1.5 }}>
                {t('Atajos: Enter = enviar, → saltar, ← anterior. ', 'Shortcuts: Enter = send, → skip, ← previous. ')}
                {via === 'app'
                  ? <>{t('Se abre la app de WhatsApp. ¿No se abre? ', 'Opens the WhatsApp app. Not opening? ')}<button onClick={() => cambiarVia('web')} style={{ border: 'none', background: 'none', padding: 0, color: ROSA, fontWeight: 700, cursor: 'pointer', fontFamily: F, fontSize: 12 }}>{t('Usar WhatsApp Web', 'Use WhatsApp Web')}</button></>
                  : <>{t('Se abre WhatsApp Web en una sola pestaña. ', 'Opens WhatsApp Web in one tab. ')}<button onClick={() => cambiarVia('app')} style={{ border: 'none', background: 'none', padding: 0, color: ROSA, fontWeight: 700, cursor: 'pointer', fontFamily: F, fontSize: 12 }}>{t('Usar la app', 'Use the app')}</button></>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
