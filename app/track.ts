// Helper de analytics propio de Cheers — sin cookies, sin terceros. El
// "session_id" es solo un identificador aleatorio guardado en sessionStorage
// (se borra al cerrar la pestaña), nunca un dato que identifique a la persona.
function sessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem('cheers_sid')
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem('cheers_sid', id)
  }
  return id
}

export function track(
  tipo: string,
  extra: { userId?: string | null; celebracionSlug?: string | null; metadata?: Record<string, any> } = {}
) {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  // fire-and-forget: nunca bloquea ni afecta la experiencia si falla
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tipo,
      userId: extra.userId ?? null,
      celebracionSlug: extra.celebracionSlug ?? null,
      ruta: window.location.pathname,
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign'),
      referrer: document.referrer || null,
      sessionId: sessionId(),
      metadata: extra.metadata ?? null,
    }),
  }).catch(() => {})
}
