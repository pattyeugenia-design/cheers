'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'

interface NotifApp {
  id: string
  tipo: string
  celebracion_slug: string | null
  texto: string
  leida: boolean
  created_at: string
}

function tiempoRelativo(iso: string, lang: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return lang === 'en' ? 'now' : 'ahora'
  if (min < 60) return lang === 'en' ? `${min}m ago` : `hace ${min} min`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return lang === 'en' ? `${hrs}h ago` : `hace ${hrs} h`
  const dias = Math.floor(hrs / 24)
  if (dias < 7) return lang === 'en' ? `${dias}d ago` : `hace ${dias} d`
  return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', { month: 'short', day: 'numeric' })
}

// Mismo patrón de badge de 3 letras que usan los tiles dentro de una
// celebración (INV, REG, MSG) — nada de emoji, para que se vea consistente.
const ICONO: Record<string, string> = { rsvp: 'RSV', regalo: 'REG', mensaje: 'MSG' }

export default function NotificacionesBell({ userId, lang, light }: { userId: string; lang: string; light?: boolean }) {
  const router = useRouter()
  const [items, setItems] = useState<NotifApp[]>([])
  const [abierto, setAbierto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  async function cargar() {
    const { data } = await supabase
      .from('notificaciones_app')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
    setItems(data || [])
  }

  useEffect(() => {
    if (!userId) return
    cargar()
    const intervalo = setInterval(cargar, 60000)
    return () => clearInterval(intervalo)
  }, [userId])

  useEffect(() => {
    const onClickFuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false)
    }
    window.addEventListener('mousedown', onClickFuera)
    return () => window.removeEventListener('mousedown', onClickFuera)
  }, [])

  const noLeidas = items.filter(n => !n.leida).length

  async function alAbrir() {
    const abriendo = !abierto
    setAbierto(abriendo)
    if (abriendo && noLeidas > 0) {
      const idsNoLeidas = items.filter(n => !n.leida).map(n => n.id)
      setItems(prev => prev.map(n => ({ ...n, leida: true })))
      await supabase.from('notificaciones_app').update({ leida: true }).in('id', idsNoLeidas)
    }
  }

  function alClickItem(n: NotifApp) {
    setAbierto(false)
    if (n.celebracion_slug) router.push(`/${n.celebracion_slug}`)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={alAbrir} style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', border: light ? 'none' : '1.5px solid rgba(255,255,255,.15)', background: light ? 'rgba(255,255,255,.92)' : 'rgba(255,255,255,.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: light ? '0 4px 14px rgba(20,10,40,.18)' : 'none' }}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M10 2.5c-2.9 0-5.2 2.3-5.2 5.2v2.6c0 .5-.2 1-.5 1.4l-1 1.3c-.5.6-.1 1.5.7 1.5h13.9c.8 0 1.2-.9.7-1.5l-1-1.3c-.3-.4-.5-.9-.5-1.4V7.7c0-2.9-2.3-5.2-5.2-5.2z" stroke={light ? '#534AB7' : '#EEEDFE'} strokeWidth="1.4" strokeLinejoin="round"/>
          <path d="M8 16.2c.3.9 1.1 1.5 2 1.5s1.7-.6 2-1.5" stroke={light ? '#534AB7' : '#EEEDFE'} strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        {noLeidas > 0 && (
          <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 99, background: '#D4537E', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', fontFamily: F }}>
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div style={{ position: 'absolute', right: 0, top: 48, width: 320, maxHeight: 400, overflowY: 'auto', background: '#1a1740', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, boxShadow: '0 16px 40px rgba(0,0,0,.4)', zIndex: 50 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', fontSize: 13, fontWeight: 800, color: '#EEEDFE' }}>
            {lang === 'en' ? 'Notifications' : 'Notificaciones'}
          </div>
          {items.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center' as const, fontSize: 13, color: '#AFA9EC' }}>
              {lang === 'en' ? 'Nothing yet' : 'Nada por aquí todavía'}
            </div>
          ) : (
            items.map(n => (
              <button key={n.id} onClick={() => alClickItem(n)} style={{ width: '100%', textAlign: 'left' as const, border: 'none', borderBottom: '1px solid rgba(255,255,255,.06)', background: n.leida ? 'transparent' : 'rgba(212,83,126,.08)', padding: '10px 16px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start', fontFamily: F }}>
                <span style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(83,74,183,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 8.5, fontWeight: 800, color: '#EEEDFE' }}>{ICONO[n.tipo] || '✦'}</span>
                </span>
                <span style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: '#EEEDFE', lineHeight: 1.4 }}>{n.texto}</div>
                  <div style={{ fontSize: 10.5, color: '#8981b5', marginTop: 2 }}>{tiempoRelativo(n.created_at, lang)}</div>
                </span>
                {!n.leida && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#D4537E', flexShrink: 0, marginTop: 5 }} />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
