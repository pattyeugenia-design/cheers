'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useLocale } from '../hooks/useLocale'

type Regalo = {
  id: string
  nombre: string
  link?: string
  precio?: number
  reservado_por?: string
}

export default function ListaRegalos({ slug, esOrganizador }: { slug: string, esOrganizador: boolean }) {
  const t = useLocale()
  const [regalos, setRegalos] = useState<Regalo[]>([])
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoLink, setNuevoLink] = useState('')
  const [nuevoPrecio, setNuevoPrecio] = useState('')
  const [agregando, setAgregando] = useState(false)
  const [reservandoId, setReservandoId] = useState<string | null>(null)
  const [nombreReserva, setNombreReserva] = useState('')

  useEffect(() => {
    cargarRegalos()
  }, [slug])

  async function cargarRegalos() {
    const { data } = await supabase
      .from('regalos')
      .select('*')
      .eq('celebracion_slug', slug)
      .order('created_at', { ascending: true })
    setRegalos(data || [])
  }

  async function agregarRegalo() {
    if (!nuevoNombre) return
    await supabase.from('regalos').insert({
      celebracion_slug: slug,
      nombre: nuevoNombre,
      link: nuevoLink || null,
      precio: nuevoPrecio ? parseFloat(nuevoPrecio) : null,
    })
    setNuevoNombre('')
    setNuevoLink('')
    setNuevoPrecio('')
    setAgregando(false)
    cargarRegalos()
  }

  async function reservarRegalo(id: string) {
    if (!nombreReserva) return
    await supabase.from('regalos').update({ reservado_por: nombreReserva }).eq('id', id)
    setReservandoId(null)
    setNombreReserva('')
    cargarRegalos()
  }

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    color: '#EEEDFE',
    fontSize: 14,
    marginBottom: '0.75rem',
    boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <p style={{ fontSize: 16, fontWeight: 500, color: '#EEEDFE', margin: 0 }}>🎁 {t.lista_de_regalos}</p>
        {esOrganizador && (
          <button
            onClick={() => setAgregando(!agregando)}
            style={{ padding: '0.4rem 0.9rem', background: '#7F77DD', border: 'none', borderRadius: 8, color: '#EEEDFE', fontSize: 13, cursor: 'pointer' }}
          >
            + {t.anadir_regalo}
          </button>
        )}
      </div>

      {agregando && (
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' }}>
          <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder={t.nombre_del_regalo} style={inputStyle} />
          <input value={nuevoLink} onChange={e => setNuevoLink(e.target.value)} placeholder={t.link_opcional} style={inputStyle} />
          <input value={nuevoPrecio} onChange={e => setNuevoPrecio(e.target.value)} placeholder={t.precio_opcional} type="number" style={inputStyle} />
          <button
            onClick={agregarRegalo}
            disabled={!nuevoNombre}
            style={{ width: '100%', padding: '0.75rem', background: nuevoNombre ? '#7F77DD' : 'rgba(127,119,221,0.4)', border: 'none', borderRadius: 8, color: '#EEEDFE', fontSize: 14, cursor: nuevoNombre ? 'pointer' : 'not-allowed' }}
          >
            {t.anadir_regalo}
          </button>
        </div>
      )}

      {regalos.length === 0 && (
        <p style={{ fontSize: 14, color: '#AFA9EC', textAlign: 'center', padding: '1rem 0' }}>{t.sin_regalos}</p>
      )}

      {regalos.map(regalo => (
        <div key={regalo.id} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 15, color: '#EEEDFE', margin: '0 0 4px', fontWeight: 500 }}>{regalo.nombre}</p>
              {regalo.precio && <p style={{ fontSize: 13, color: '#AFA9EC', margin: '0 0 4px' }}>${regalo.precio}</p>}
              {regalo.link && <a href={regalo.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#7F77DD' }}>{regalo.link}</a>}
              {regalo.reservado_por && (
                <p style={{ fontSize: 12, color: '#AFA9EC', margin: '6px 0 0' }}>✅ {t.reservado_por}: {regalo.reservado_por}</p>
              )}
            </div>
            {!regalo.reservado_por && (
              <button
                onClick={() => setReservandoId(regalo.id)}
                style={{ padding: '0.4rem 0.8rem', background: 'rgba(127,119,221,0.3)', border: '1px solid #7F77DD', borderRadius: 8, color: '#EEEDFE', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {t.reservar}
              </button>
            )}
          </div>

          {reservandoId === regalo.id && (
            <div style={{ marginTop: '0.75rem' }}>
              <input
                value={nombreReserva}
                onChange={e => setNombreReserva(e.target.value)}
                placeholder={t.tu_nombre_para_reservar}
                style={{ ...inputStyle, marginBottom: '0.5rem' }}
              />
              <button
                onClick={() => reservarRegalo(regalo.id)}
                disabled={!nombreReserva}
                style={{ width: '100%', padding: '0.6rem', background: nombreReserva ? '#7F77DD' : 'rgba(127,119,221,0.4)', border: 'none', borderRadius: 8, color: '#EEEDFE', fontSize: 14, cursor: nombreReserva ? 'pointer' : 'not-allowed' }}
              >
                {t.confirmar_reserva}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}