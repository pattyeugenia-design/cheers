import Image from 'next/image'
import { normalizarEncuadre } from './encuadre'

// Dibuja una foto dentro de un marco con su encuadre. Se usa IGUAL en la invitación y en el editor
// del dashboard, por eso lo que la pareja ve al acomodar es exactamente lo que ven sus invitados.
//   - con `aspecto` ("4/5"): el marco tiene esa proporción y ocupa todo el ancho
//   - sin `aspecto`: llena el contenedor que lo rodea
export function FotoEncuadrada({ src, alt = '', enc, aspecto, radio, fondo, optimizada = false, prioridad = false, sizes }: {
  src: string; alt?: string; enc?: { x?: unknown; y?: unknown; z?: unknown } | null; aspecto?: string; radio?: string | number; fondo?: string
  optimizada?: boolean; prioridad?: boolean; sizes?: string
}) {
  const e = normalizarEncuadre(enc)
  const caja = { position: 'absolute' as const, width: `${e.z * 100}%`, height: `${e.z * 100}%`, left: `${(1 - e.z) * e.x * 100}%`, top: `${(1 - e.z) * e.y * 100}%` }
  const ajuste = { objectFit: 'cover' as const, objectPosition: `${e.x * 100}% ${e.y * 100}%` }
  const marco: React.CSSProperties = aspecto
    ? { position: 'relative', width: '100%', aspectRatio: aspecto, overflow: 'hidden', borderRadius: radio, background: fondo }
    : { position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: radio, background: fondo }
  return (
    <div style={marco}>
      {optimizada
        ? <div style={caja}><Image src={src} alt={alt} fill sizes={sizes || '320px'} priority={prioridad} style={ajuste} /></div>
        // eslint-disable-next-line @next/next/no-img-element
        : <img src={src} alt={alt} loading={prioridad ? 'eager' : 'lazy'} decoding="async" draggable={false} style={{ ...caja, ...ajuste, maxWidth: 'none' }} />}
    </div>
  )
}
