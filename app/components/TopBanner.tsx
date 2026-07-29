'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import NotificacionesBell from './NotificacionesBell'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'

// Banner fijo compartido entre las pantallas interiores (dashboard, dentro de
// una celebración cuando eres la organizadora, perfil, nueva celebración).
// No se muestra a invitados viendo la celebración de alguien más — cada
// página decide si renderizarlo según su propio contexto de "soy el dueño".
export default function TopBanner({ userId, username, lang }: { userId: string; username: string; lang: string }) {
  const router = useRouter()
  const [proximo, setProximo] = useState<{ slug: string; nombre: string; fecha: string } | null>(null)

  useEffect(() => {
    if (!userId) return
    async function cargarProximo() {
      const hoy = new Date().toISOString()

      const { data: propias } = await supabase
        .from('celebraciones')
        .select('slug, nombre, fecha')
        .eq('organizador_id', userId)
        .eq('archivada', false)
        .gte('fecha', hoy)
        .order('fecha', { ascending: true })
        .limit(1)

      const { data: comoInvitado } = await supabase
        .from('invitados')
        .select('celebracion_slug')
        .eq('user_id', userId)

      let deInvitado: { slug: string; nombre: string; fecha: string } | null = null
      const slugs = (comoInvitado || []).map(i => i.celebracion_slug)
      if (slugs.length) {
        const { data: celsInvitado } = await supabase
          .from('celebraciones')
          .select('slug, nombre, fecha')
          .in('slug', slugs)
          .eq('archivada', false)
          .gte('fecha', hoy)
          .order('fecha', { ascending: true })
          .limit(1)
        deInvitado = celsInvitado?.[0] || null
      }

      const candidatos = [propias?.[0], deInvitado].filter(Boolean) as { slug: string; nombre: string; fecha: string }[]
      // Sin la hora local, "new Date('2026-08-01')" se lee como UTC y en
      // México cae un día antes — puede alterar cuál evento sale como "NEXT".
      candidatos.sort((a, b) => new Date(a.fecha + 'T00:00:00').getTime() - new Date(b.fecha + 'T00:00:00').getTime())
      setProximo(candidatos[0] || null)
    }
    cargarProximo()
  }, [userId])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 4px', marginBottom: 16, flexWrap: 'wrap' as const }}>
      <div
        onClick={() => router.push(`/${username}`)}
        style={{ fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-.5px', cursor: 'pointer', flexShrink: 0 }}
      >
        Cheers
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
        {proximo && (
          <button
            onClick={() => router.push(`/${proximo.slug}`)}
            style={{ border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.06)', color: '#EEEDFE', fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 99, cursor: 'pointer', fontFamily: F, display: 'flex', alignItems: 'center', gap: 6, maxWidth: 220, overflow: 'hidden' }}
            title={proximo.nombre}
          >
            <span style={{ fontSize: 10, color: '#AFA9EC', fontWeight: 800, textTransform: 'uppercase' as const, flexShrink: 0 }}>{lang === 'en' ? 'Next' : 'Próximo'}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{proximo.nombre}</span>
          </button>
        )}

        <button onClick={() => router.push(`/${username}`)} style={{ border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.06)', color: '#EEEDFE', fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 99, cursor: 'pointer', fontFamily: F }}>
          {lang === 'en' ? 'My celebrations' : 'Mis celebraciones'}
        </button>

        <button onClick={() => router.push('/perfil')} style={{ border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.06)', color: '#EEEDFE', fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 99, cursor: 'pointer', fontFamily: F }}>
          {lang === 'en' ? 'My profile' : 'Mi perfil'}
        </button>

        <NotificacionesBell userId={userId} lang={lang} />
      </div>
    </div>
  )
}
