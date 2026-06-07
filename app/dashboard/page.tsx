'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const emojis: Record<string, string> = {
  cumpleanos: '🎂', boda: '💍', xv: '👑', graduacion: '🎓', babyshower: '🍼', bachelorette: '💃', otro: '✨'
}

export default function Dashboard() {
  const [usuario, setUsuario] = useState<any>(null)
  const [celebraciones, setCelebraciones] = useState<any[]>([])
  const [conteos, setConteos] = useState<Record<string, number>>({})

  async function cargarCelebraciones(userId: string) {
    const { data: cels, error } = await supabase
      .from('celebraciones')
      .select('*')
      .eq('organizador_id', userId)
      .order('created_at', { ascending: false })

    if (error) console.error('Error cargando celebraciones:', error)
    console.log('Celebraciones cargadas:', cels, 'para user:', userId)
    setCelebraciones(cels || [])

    const nuevosConteos: Record<string, number> = {}
    for (const cel of cels || []) {
      const { count } = await supabase
        .from('rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('celebracion_slug', cel.slug)
        .eq('asistencia', 'si')
      nuevosConteos[cel.slug] = count || 0
    }
    setConteos(nuevosConteos)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUsuario(session.user)
        await cargarCelebraciones(session.user.id)
      } else {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
          if (user) {
            setUsuario(user)
            await cargarCelebraciones(user.id)
          } else {
            window.location.href = '/login'
          }
        })
      }
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!usuario) window.location.href = '/login'
    }, 5000)
    return () => clearTimeout(timer)
  }, [usuario])

  if (!usuario) return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#AFA9EC', fontFamily: 'sans-serif' }}>Cargando...</p>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#26215C', fontFamily: 'sans-serif', padding: '2rem' }}>
      <div style={{ maxWidth: 440, margin: '0 auto' }}>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: 28, margin: '0 0 4px' }}>🥂</p>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: '#EEEDFE', margin: '0 0 2px' }}>
            Hola, {usuario?.user_metadata?.name?.split(' ')[0] || 'festejada'}
          </h1>
          <p style={{ fontSize: 13, color: '#AFA9EC', margin: 0 }}>{usuario?.email}</p>
        </div>

        <a href="/nueva" style={{ display: 'block', width: '100%', padding: '0.9rem', background: '#7F77DD', border: 'none', borderRadius: 12, color: '#EEEDFE', fontSize: 15, fontWeight: 500, textAlign: 'center', textDecoration: 'none', marginBottom: '2rem' }}>
          + Nueva celebración 🎉
        </a>

        {celebraciones.length > 0 && (
          <div>
            <p style={{ fontSize: 12, color: '#AFA9EC', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: 1 }}>Tus celebraciones</p>
            {celebraciones.map(cel => (
              <a key={cel.id} href={`/${cel.slug}`} style={{ display: 'block', background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '0.75rem', textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 28 }}>{emojis[cel.tipo] || '✨'}</span>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 500, color: '#EEEDFE', margin: '0 0 2px' }}>{cel.nombre}</p>
                      <p style={{ fontSize: 12, color: '#AFA9EC', margin: 0 }}>joincheers.app/{cel.slug}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {conteos[cel.slug] > 0 && (
                      <p style={{ fontSize: 13, color: '#AFA9EC', margin: '0 0 2px' }}>🥂 {conteos[cel.slug]}</p>
                    )}
                    {cel.es_sorpresa && <p style={{ fontSize: 11, color: '#FFD700', margin: 0 }}>🤫 sorpresa</p>}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {celebraciones.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <p style={{ fontSize: 40, margin: '0 0 12px' }}>🎉</p>
            <p style={{ fontSize: 15, color: '#AFA9EC' }}>Aún no tienes celebraciones.</p>
            <p style={{ fontSize: 14, color: '#7F77DD' }}>¡Crea la primera!</p>
          </div>
        )}

      </div>
    </main>
  )
}