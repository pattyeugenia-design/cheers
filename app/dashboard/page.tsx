'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import ListaRegalos from '../components/ListaRegalos'

export default function Dashboard() {
  const [usuario, setUsuario] = useState<any>(null)
  const [celebraciones, setCelebraciones] = useState<any[]>([])
  const [seleccionada, setSeleccionada] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user)
      if (data.user) cargarCelebraciones(data.user.email!)
    })
  }, [])

  async function cargarCelebraciones(email: string) {
    const { data } = await supabase
      .from('celebraciones')
      .select('*')
      .eq('organizador_id', email)
    setCelebraciones(data || [])
    if (data && data.length > 0) setSeleccionada(data[0])
  }

  return (
    <main style={{ minHeight: '100vh', background: '#26215C', fontFamily: 'sans-serif', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <p style={{ fontSize: 32, margin: '0 0 8px' }}>🥂</p>
        <h1 style={{ fontSize: 24, fontWeight: 500, color: '#EEEDFE', margin: '0 0 4px' }}>
          Hola, {usuario?.user_metadata?.name?.split(' ')[0] || 'festejada'}
        </h1>
        <p style={{ fontSize: 14, color: '#AFA9EC', margin: '0 0 2rem' }}>{usuario?.email}</p>

        {celebraciones.length === 0 ? (
          <a href="/nueva" style={{ display: 'block', width: '100%', padding: '0.9rem', background: '#7F77DD', border: 'none', borderRadius: 8, color: '#EEEDFE', fontSize: 15, fontWeight: 500, textAlign: 'center', textDecoration: 'none' }}>
            Crear nueva celebracion
          </a>
        ) : (
          <>
            {celebraciones.length > 1 && (
              <div style={{ marginBottom: '1rem' }}>
                {celebraciones.map(c => (
                  <button
                    key={c.slug}
                    onClick={() => setSeleccionada(c)}
                    style={{ marginRight: 8, marginBottom: 8, padding: '0.4rem 0.9rem', background: seleccionada?.slug === c.slug ? '#7F77DD' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: '#EEEDFE', fontSize: 13, cursor: 'pointer' }}
                  >
                    {c.nombre}
                  </button>
                ))}
              </div>
            )}

            {seleccionada && (
              <div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' }}>
                  <p style={{ fontSize: 18, fontWeight: 500, color: '#EEEDFE', margin: '0 0 4px' }}>{seleccionada.nombre}</p>
                  <a href={'/' + seleccionada.slug} style={{ fontSize: 13, color: '#7F77DD' }}>cheers.app/{seleccionada.slug}</a>
                </div>

                <ListaRegalos slug={seleccionada.slug} esOrganizador={true} />

                <a href="/nueva" style={{ display: 'block', width: '100%', padding: '0.9rem', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, color: '#AFA9EC', fontSize: 14, textAlign: 'center', textDecoration: 'none', marginTop: '1.5rem' }}>
                  + Crear otra celebracion
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
