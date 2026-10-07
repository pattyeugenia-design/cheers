// Ilustraciones botánicas en SVG propio (sin imágenes externas): peonías de
// acuarela y hojas redondas de eucalipto, en los tonos de la paleta de la
// pareja. Todo es decorativo (aria-hidden) y se dibuja con formas simples +
// un filtro que imita el borde irregular del pigmento sobre papel.

// Los filtros viven en un único <svg> oculto que se monta una sola vez en la
// página; el resto de ilustraciones los referencian por id.
export function DefsBotanicos() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="cw-acuarela" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" result="ruido" />
          <feDisplacementMap in="SourceGraphic" in2="ruido" scale="7" xChannelSelector="R" yChannelSelector="G" result="borde" />
          <feGaussianBlur in="borde" stdDeviation="0.45" />
        </filter>
        <filter id="cw-suave" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <radialGradient id="cw-petalo-claro" cx="50%" cy="100%" r="105%">
          <stop offset="0%" stopColor="#CF8A93" />
          <stop offset="45%" stopColor="#E6B0B5" />
          <stop offset="100%" stopColor="#F5DADA" />
        </radialGradient>
        <radialGradient id="cw-petalo-oscuro" cx="50%" cy="100%" r="105%">
          <stop offset="0%" stopColor="#A85A63" />
          <stop offset="50%" stopColor="#C78890" />
          <stop offset="100%" stopColor="#E3B3B7" />
        </radialGradient>
        <radialGradient id="cw-hoja" cx="40%" cy="38%" r="75%">
          <stop offset="0%" stopColor="#C3CEC1" />
          <stop offset="62%" stopColor="#A4B4A8" />
          <stop offset="100%" stopColor="#8A9C8F" />
        </radialGradient>
        <radialGradient id="cw-hoja2" cx="40%" cy="38%" r="75%">
          <stop offset="0%" stopColor="#CBD3C6" />
          <stop offset="62%" stopColor="#B2BCAA" />
          <stop offset="100%" stopColor="#97A28E" />
        </radialGradient>
      </defs>
    </svg>
  )
}

// Punto sobre una curva de Bézier cúbica y su dirección, para repartir hojas.
type P = [number, number]
function bez(t: number, p0: P, p1: P, p2: P, p3: P): { x: number; y: number; ang: number } {
  const u = 1 - t
  const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]
  const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
  const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0])
  const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1])
  return { x, y, ang: (Math.atan2(dy, dx) * 180) / Math.PI }
}

function Hoja({ x, y, rot, s, alt }: { x: number; y: number; rot: number; s: number; alt?: boolean }) {
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${s})`}>
      <path d="M0 0 C-17 -5 -20 -31 0 -38 C 20 -31 17 -5 0 0Z" fill={alt ? 'url(#cw-hoja2)' : 'url(#cw-hoja)'} opacity=".9" />
      <path d="M0 -2 C-9 -12 -8 -26 0 -34 C 4 -24 3 -12 0 -2Z" fill="#E4EBE2" opacity=".28" />
      <path d="M0 -1 L0 -33" stroke="#EDF2EA" strokeWidth=".9" opacity=".5" fill="none" />
    </g>
  )
}

// Rama de eucalipto: tallo curvo con hojas redondas alternadas.
export function RamaEucalipto({ ancho = 140, rotar = 0, espejo = false, hojas = 9, style }: { ancho?: number; rotar?: number; espejo?: boolean; hojas?: number; style?: React.CSSProperties }) {
  const p0: P = [0, 0], p1: P = [14, -60], p2: P = [-10, -125], p3: P = [10, -200]
  const items = Array.from({ length: hojas }, (_, i) => {
    const t = (i + 1) / (hojas + 1) * 0.96 + 0.04
    const b = bez(t, p0, p1, p2, p3)
    const lado = i % 2 === 0 ? 1 : -1
    return { x: b.x, y: b.y, rot: b.ang + 90 + lado * (48 + ((i * 11) % 22)), s: 1.12 - t * 0.5 + ((i * 7) % 5) * 0.03, alt: i % 3 === 0 }
  })
  const tip = bez(1, p0, p1, p2, p3)
  return (
    <svg viewBox="-60 -240 120 250" width={ancho} aria-hidden="true" focusable="false" style={{ display: 'block', overflow: 'visible', transform: `rotate(${rotar}deg) scaleX(${espejo ? -1 : 1})`, ...style }}>
      <g filter="url(#cw-acuarela)">
        <path d="M0 0 C14 -60 -10 -125 10 -200" stroke="#8EA395" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity=".85" />
        {items.map((h, i) => <Hoja key={i} {...h} />)}
        <Hoja x={tip.x} y={tip.y} rot={tip.ang + 90} s={0.62} alt />
      </g>
    </svg>
  )
}

type Tono = 'claro' | 'oscuro'
const PETALO = 'M0 0 C-24 -8 -34 -44 -7 -63 C 9 -70 27 -56 28 -36 C 30 -16 16 -4 0 0Z'

// Peonía de acuarela: anillos de pétalos irregulares de claro a oscuro, con
// sombra en el centro y pliegues, como las flores de pigmento sobre papel.
function PeoniaG({ tono = 'claro' }: { tono?: Tono }) {
  const grad = tono === 'claro' ? 'url(#cw-petalo-claro)' : 'url(#cw-petalo-oscuro)'
  const sombra = tono === 'claro' ? '#A9515E' : '#7E2F3E'
  const borde = tono === 'claro' ? '#C98088' : '#9C4E58'
  // [rotación, escala, opacidad] — valores fijos (no aleatorios) para que
  // la flor se vea igual en el servidor y en el navegador.
  const ext: [number, number, number][] = [[0, 1.04, .62], [46, .96, .58], [93, 1.08, .6], [141, .94, .56], [184, 1.02, .6], [229, 1.07, .58], [271, .93, .6], [318, 1.0, .56]]
  const med: [number, number, number][] = [[20, .84, .72], [82, .78, .7], [140, .86, .72], [203, .8, .7], [262, .84, .72], [322, .76, .7]]
  const int: [number, number, number][] = [[10, .56, .8], [76, .52, .8], [150, .58, .8], [222, .5, .8], [292, .55, .8]]
  const cen: [number, number, number][] = [[40, .32, .85], [165, .3, .85], [275, .28, .85]]
  const capa = (a: [number, number, number][], k: string) =>
    a.map(([r, e, o], i) => <path key={k + i} d={PETALO} fill={grad} opacity={o} transform={`rotate(${r}) scale(${e})`} />)
  return (
    <g filter="url(#cw-acuarela)">
      <g filter="url(#cw-suave)" opacity=".55">{capa(ext, 'h')}</g>
      {capa(ext, 'e')}
      {capa(med, 'm')}
      <circle r="26" fill={sombra} opacity=".22" filter="url(#cw-suave)" />
      {capa(int, 'i')}
      {capa(cen, 'c')}
      <g fill="none" stroke={borde} strokeWidth="1" strokeLinecap="round" opacity=".34">
        {ext.map(([r, e], i) => <path key={i} d="M0 -6 C -14 -20 -16 -40 -4 -58" transform={`rotate(${r}) scale(${e * 0.9})`} />)}
      </g>
      <circle r="5" fill="#5E2631" opacity=".5" />
      {Array.from({ length: 7 }, (_, i) => (
        <line key={i} x1="0" y1="0" x2={Math.cos((i * 51 * Math.PI) / 180) * 9} y2={Math.sin((i * 51 * Math.PI) / 180) * 9} stroke="#4C1E28" strokeWidth=".7" opacity=".45" />
      ))}
    </g>
  )
}

export function Peonia({ ancho = 120, tono = 'claro', rotar = 0, style }: { ancho?: number; tono?: Tono; rotar?: number; style?: React.CSSProperties }) {
  return (
    <svg viewBox="-80 -80 160 160" width={ancho} aria-hidden="true" focusable="false" style={{ display: 'block', overflow: 'visible', transform: `rotate(${rotar}deg)`, ...style }}>
      <PeoniaG tono={tono} />
    </svg>
  )
}

// Ramillete: dos peonías + hojas de eucalipto sobre un tallo. Pensado para
// asomar por abajo o por una esquina (como en el recuerdito).
export function Ramillete({ ancho = 300, espejo = false, style }: { ancho?: number; espejo?: boolean; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 320 190" width={ancho} aria-hidden="true" focusable="false" style={{ display: 'block', overflow: 'visible', transform: espejo ? 'scaleX(-1)' : undefined, ...style }}>
      <g filter="url(#cw-acuarela)">
        <path d="M20 182 C90 150 150 128 232 96" stroke="#8EA395" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity=".8" />
        <path d="M150 128 C 160 118 168 108 170 96" stroke="#8EA395" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".7" />
        <Hoja x={44} y={160} rot={-62} s={1.25} />
        <Hoja x={96} y={158} rot={118} s={1.1} alt />
        <Hoja x={206} y={118} rot={150} s={0.95} />
      </g>
      <g transform="translate(118 78) rotate(-8) scale(0.82)"><PeoniaG tono="claro" /></g>
      <g transform="translate(226 62) rotate(14) scale(0.6)"><PeoniaG tono="oscuro" /></g>
    </svg>
  )
}
