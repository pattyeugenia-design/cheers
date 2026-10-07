// Iconos de línea fina para el itinerario. El dashboard guarda un emoji por
// momento; aquí se traduce a un icono dibujado, para que la invitación se vea
// igual en todos los teléfonos (los emojis cambian según el sistema).
const TRAZO = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const ICONOS: Record<string, React.ReactNode> = {
  iglesia: (<><path d="M12 2.5v3M10.6 4h2.8" {...TRAZO} /><path d="M12 5.5 7 9v11h10V9z" {...TRAZO} /><path d="M10 20v-5a2 2 0 0 1 4 0v5" {...TRAZO} /><path d="M3.5 20h17" {...TRAZO} /></>),
  copas: (<><path d="M7.5 3.5h4l-.4 5a1.6 1.6 0 0 1-3.2 0z" {...TRAZO} transform="rotate(-12 9.5 6)" /><path d="M12.5 3.5h4l-.4 5a1.6 1.6 0 0 1-3.2 0z" {...TRAZO} transform="rotate(12 14.5 6)" /><path d="M8.6 11.2 7.9 20M15.4 11.2l.7 8.8M6 20h4M14 20h4" {...TRAZO} /></>),
  plato: (<><circle cx="12" cy="12" r="5" {...TRAZO} /><circle cx="12" cy="12" r="2.4" {...TRAZO} /><path d="M3.6 4v5.4a1.4 1.4 0 0 0 2.8 0V4M5 9.4V20M20 4c-1.8 1.4-2.6 3.6-2.6 6.2h2.6zM20 10.2V20" {...TRAZO} /></>),
  baile: (<><path d="M9 18V6l10-2v12" {...TRAZO} /><circle cx="6.8" cy="18" r="2.2" {...TRAZO} /><circle cx="16.8" cy="16" r="2.2" {...TRAZO} /></>),
  fiesta: (<><circle cx="12" cy="13" r="6.5" {...TRAZO} /><path d="M12 2.5v4M5.8 13h12.4M12 6.5c-2.4 2-2.4 10 0 13M12 6.5c2.4 2 2.4 10 0 13M7.4 8.6c3 1.4 6.2 1.4 9.2 0M7.4 17.4c3-1.4 6.2-1.4 9.2 0" {...TRAZO} /></>),
  destello: (<><path d="M12 3c.6 4.2 2.2 6.4 6.4 7-4.2.6-5.8 2.8-6.4 7-.6-4.2-2.2-6.4-6.4-7 4.2-.6 5.8-2.8 6.4-7z" {...TRAZO} /><path d="M19 3.5v3M17.5 5h3M5 17v3M3.5 18.5h3" {...TRAZO} /></>),
  luna: (<><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" {...TRAZO} /><path d="M16.5 4.5v3M15 6h3" {...TRAZO} /></>),
  camara: (<><path d="M4 8h3l1.5-2h7L17 8h3v11H4z" {...TRAZO} /><circle cx="12" cy="13" r="3.4" {...TRAZO} /></>),
  anillo: (<><circle cx="12" cy="14.5" r="5.5" {...TRAZO} /><path d="m8.8 4.6 1.7-2h3l1.7 2-3.2 3.2z" {...TRAZO} /></>),
  reloj: (<><circle cx="12" cy="12" r="8.5" {...TRAZO} /><path d="M12 7v5l3.2 2" {...TRAZO} /></>),
}

const POR_EMOJI: Record<string, string> = {
  '⛪': 'iglesia', '🥂': 'copas', '🍽️': 'plato', '🍽': 'plato', '💃': 'baile', '🪩': 'fiesta', '🎉': 'destello', '📸': 'camara', '💍': 'anillo', '⏰': 'reloj', '🌙': 'luna',
}

// Si el título dice "última canción" o "despedida" mostramos la luna, aunque
// el emoji guardado sea el genérico del reloj.
export function nombreIcono(emoji?: string | null, titulo?: string | null): string {
  const t = (titulo || '').toLowerCase()
  if (t.includes('última') || t.includes('ultima') || t.includes('despedida') || t.includes('last')) return 'luna'
  return POR_EMOJI[emoji || ''] || 'reloj'
}

export function IconoItinerario({ emoji, titulo, tam = 26 }: { emoji?: string | null; titulo?: string | null; tam?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={tam} height={tam} aria-hidden="true" focusable="false" style={{ display: 'block' }}>
      {ICONOS[nombreIcono(emoji, titulo)]}
    </svg>
  )
}
