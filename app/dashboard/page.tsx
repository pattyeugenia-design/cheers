'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'

const TIPO_LABEL: Record<string, string> = {
  cumple: 'Cumpleaños', cumpleanos: 'Cumpleaños', cena: 'Cena', viaje: 'Viaje',
  reunion: 'Reunión', evento: 'Evento', otro: 'Otro'
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [celebraciones, setCelebraciones] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUser(user)
      supabase.from('celebraciones')
        .select('*')
        .eq('organizador_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setCelebraciones(data || [])
          setCargando(false)
        })
    })
  }, [])

  const nombre = user?.user_metadata?.name?.split(' ')[0] || 'tú'

  function slugToPath(slug: string) {
    if (slug.includes('/')) return `/${slug}`
    return `/${slug}`
  }

  if (cargando) return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif' }}>
      <p style={{ color: '#AFA9EC' }}>Cargando...</p>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#26215C', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#EEEDFE', margin: '0 0 4px', letterSpacing: '-.5px' }}>Cheers</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#EEEDFE', margin: '0 0 4px', letterSpacing: '-.5px' }}>Hola, {nombre}</h1>
          <p style={{ fontSize: 14, color: '#AFA9EC', margin: 0 }}>{user?.email}</p>
        </div>

        {/* Botón nueva celebración */}
        <button
          onClick={() => router.push('/nueva')}
          style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg,#534AB7,#D4537E)', border: 'none', borderRadius: 16, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: '2rem', boxShadow: '0 8px 24px rgba(212,83,126,.3)', fontFamily: 'inherit' }}
        >
          + Nueva celebración
        </button>

        {/* Lista de celebraciones */}
        {celebraciones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,.06)', borderRadius: 16 }}>
            <p style={{ color: '#AFA9EC', fontSize: 15, margin: 0 }}>Aún no tienes celebraciones. ¡Crea tu primera!</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px', color: '#AFA9EC', textTransform: 'uppercase', margin: '0 0 12px 4px' }}>Tus celebraciones</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {celebraciones.map(cel => (
                <div
                  key={cel.slug}
                  onClick={() => router.push(slugToPath(cel.slug))}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '1rem 1.25rem', background: 'rgba(255,255,255,.06)', borderRadius: 16, cursor: 'pointer', border: '1px solid rgba(255,255,255,.08)', transition: 'background .15s' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#534AB7,#D4537E)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '.5px' }}>{{ cumple: 'BDAY', cumpleanos: 'BDAY', cena: 'DINE', viaje: 'TRIP', reunion: 'MEET', evento: 'EVENT', otro: 'OTHER' }[cel.tipo] || 'EVT'}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#EEEDFE', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cel.nombre}</div>
                    <div style={{ fontSize: 12, color: '#AFA9EC', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>joincheers.app/{cel.slug}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    {cel.es_sorpresa && <span style={{ fontSize: 11, fontWeight: 700, color: '#D4537E', background: 'rgba(212,83,126,.15)', padding: '2px 8px', borderRadius: 99 }}>sorpresa</span>}
                    <span style={{ fontSize: 20, color: '#AFA9EC' }}>→</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </main>
  )
}