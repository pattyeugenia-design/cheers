'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Dashboard() {
  const [usuario, setUsuario] = useState<any>(null)
  const [celebraciones, setCelebraciones] = useState<any[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = '/login'
        return
      }
      const user = data.session.user
      setUsuario(user)
      supabase
        .from('celebraciones')
        .select('*')
        .eq('organizador_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data: cels }) => setCelebraciones(cels || []))
    })
  }, [])

  if (!usuario) return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#AFA9EC' }}>Cargando...</p>
    </main>
  )

  const emojis: Record<string, string> = {
    cumpleanos: '🎂', boda: '💍', xv: '👑', graduacion: '🎓', babyshower: '🍼', otro: '✨'
  }

  return (
    <main style={{ minHeight: '100vh', background: '#26215C', fontFamily: 'sans-serif', padding: '2rem' }}>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <p style={{ fontSize: 32, margin: '0 0 8px' }}>🥂</p>
        <h1 style={{ fontSize: 24, fontWeight: 500, color: '#EEEDFE', margin: '0 0 4px' }}>
          Hola, {usuario?.user_metadata?.name?.split(' ')[0] || 'festejada'}
        </h1>
        <p style={{ fontSize: 14, color: '#AFA9EC', margin: '0 0 2rem' }}>{usuario?.email}</p>

        <a href="/nueva" style={{ display: 'block', width: '100%', padding: '0.9rem', background: '#7F77DD', border: 'none', borderRadius: 8, color: '#EEEDFE', fontSize: 15, fontWeight: 500, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', marginBottom: '2rem' }}>
          Crear nueva celebracion 🎉
        </a>

        {celebraciones.length > 0 && (
          <div>
            <p style={{ fontSize: 13, color: '#AFA9EC', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: 1 }}>Tus celebraciones</p>
            {celebraciones.map(cel => (
              <a key={cel.id} href={`/${cel.slug}`} style={{ display: 'block', background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem', marginBottom: '0.75rem', textDecoration: 'none' }}>
                <p style={{ fontSize: 24, margin: '0 0 4px' }}>{emojis[cel.tipo] || '✨'}</p>
                <p style={{ fontSize: 16, fontWeight: 500, color: '#EEEDFE', margin: '0 0 2px' }}>{cel.nombre}</p>
                <p style={{ fontSize: 13, color: '#AFA9EC', margin: 0 }}>joincheers.app/{cel.slug}</p>
              </a>
            ))}
          </div>
        )}

        {celebraciones.length === 0 && (
          <p style={{ fontSize: 14, color: '#AFA9EC', textAlign: 'center' }}>Aun no tienes celebraciones. ¡Crea la primera!</p>
        )}
      </div>
    </main>
  )
}