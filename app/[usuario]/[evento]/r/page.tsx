'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../supabase'

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'

const BG = 'radial-gradient(circle at 18% 16%,#7b6fd0,transparent 46%),linear-gradient(160deg,#534AB7,#7b46a8 58%,#D4537E)'

const fieldInput: React.CSSProperties = {
  border: '1.5px solid #e2dff5', background: '#fff', fontFamily: FONT,
  fontSize: 15, fontWeight: 600, color: '#2a2440',
  padding: '10px 14px', borderRadius: 12, outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

export default function InvitadoView({ params }: { params: Promise<{ usuario: string; evento: string }> }) {
  const router = useRouter()
  const [celebracion, setCelebracion] = useState<any>(null)
  const [invitado, setInvitado] = useState<any>(null)
  const [rsvpExistente, setRsvpExistente] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [acceso, setAcceso] = useState<'loading' | 'ok' | 'denied' | 'no-account'>('loading')

  // RSVP form
  const [asistencia, setAsistencia] = useState<'si' | 'no' | 'talvez' | ''>('')
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    params.then(async ({ usuario, evento }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // guardar destino para redirigir de vuelta después del login
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('redirect_after_login', `/${usuario}/${evento}/r`)
        }
        router.push('/login')
        return
      }

      // buscar celebracion
      let cel: any = null
      const fullSlug = `${usuario}/${evento}`
      const { data: d1 } = await supabase.from('celebraciones').select('*').eq('slug', fullSlug).single()
      if (d1) cel = d1
      if (!cel) {
        const { data: d2 } = await supabase.from('celebraciones').select('*').eq('slug', evento).single()
        if (d2) cel = d2
      }

      if (!cel) { setAcceso('denied'); setCargando(false); return }

      // verificar que el usuario esté en tabla invitados
      const { data: inv } = await supabase
        .from('invitados')
        .select('*')
        .eq('celebracion_slug', cel.slug)
        .eq('user_id', user.id)
        .single()

      // el organizador también puede ver la vista /r
      const esOrganizador = cel.organizador_id === user.id

      if (!inv && !esOrganizador) { setAcceso('denied'); setCargando(false); return }

      // buscar rsvp existente
      const { data: rsvpData } = await supabase
        .from('rsvps')
        .select('*')
        .eq('celebracion_slug', cel.slug)
        .eq('nombre', user.user_metadata?.name || user.email || '')
        .single()

      setCelebracion(cel)
      setInvitado(inv || { nombre: user.user_metadata?.name, email: user.email, user_id: user.id })
      if (rsvpData) {
        setRsvpExistente(rsvpData)
        setAsistencia(rsvpData.asistencia)
        setMensaje(rsvpData.mensaje || '')
      }
      setAcceso('ok')
      setCargando(false)
    })
  }, [])

  async function guardarRsvp() {
    if (!asistencia || !celebracion) return
    setGuardando(true)

    const payload = {
      celebracion_slug: celebracion.slug,
      nombre: invitado?.nombre || invitado?.email || '',
      asistencia,
      mensaje: mensaje.trim() || null,
    }

    if (rsvpExistente) {
      await supabase.from('rsvps').update(payload).eq('id', rsvpExistente.id)
    } else {
      await supabase.from('rsvps').insert(payload)
    }

    setGuardando(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 3000)
  }

  if (cargando) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <p style={{ color: '#EEEDFE', fontSize: 16 }}>Cargando...</p>
    </div>
  )

  if (acceso === 'denied') return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '2.5rem', maxWidth: 400, textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,.25)' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1c1830', marginBottom: 8 }}>Sin acceso</div>
        <p style={{ fontSize: 14, color: '#6b6585', margin: '0 0 20px' }}>No estás en la lista de invitados de esta celebración.</p>
        <button onClick={() => router.push('/dashboard')} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 15, fontWeight: 700, padding: '12px 24px', borderRadius: 14, cursor: 'pointer', fontFamily: FONT }}>
          Ir a inicio
        </button>
      </div>
    </div>
  )

  const tiles = celebracion?.tiles_visibles || {}
  const paradas = celebracion?.paradas || []
  const regalos = celebracion?.gifts || []
  const fecha = celebracion?.fecha ? new Date(celebracion.fecha).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : null

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: FONT, padding: '32px 18px 60px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,.7)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Estás invitado</div>
          <h1 style={{ fontSize: 32, fontWeight: 850, color: '#fff', margin: '0 0 8px', letterSpacing: '-.5px', lineHeight: 1.1 }}>{celebracion?.nombre}</h1>
          {fecha && <p style={{ fontSize: 15, color: 'rgba(255,255,255,.85)', margin: 0 }}>{fecha}</p>}
          {celebracion?.paradas?.[0]?.lugar && (
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', margin: '4px 0 0' }}>{celebracion.paradas[0].lugar}</p>
          )}
        </div>

        {/* RSVP */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '24px 20px', marginBottom: 16, boxShadow: '0 12px 36px rgba(25,12,50,.22)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#2a2440', marginBottom: 16 }}>
            {rsvpExistente ? 'Tu confirmación' : 'Confirma tu asistencia'}
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {(['si', 'no', 'talvez'] as const).map(op => {
              const labels = { si: 'Voy', no: 'No puedo', talvez: 'Tal vez' }
              const colors = { si: { bg: '#ECF7F0', active: '#1f8a5b', border: '#1f8a5b' }, no: { bg: '#FFF0F0', active: '#c0392b', border: '#c0392b' }, talvez: { bg: '#FFF4E6', active: '#c98a1e', border: '#c98a1e' } }
              const c = colors[op]
              const sel = asistencia === op
              return (
                <button
                  key={op}
                  onClick={() => setAsistencia(op)}
                  style={{ flex: 1, padding: '12px 8px', borderRadius: 14, border: sel ? `2px solid ${c.border}` : '2px solid #e8e4f5', background: sel ? c.bg : '#fafafa', color: sel ? c.active : '#7a7494', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, transition: 'all .15s' }}
                >
                  {labels[op]}
                </button>
              )
            })}
          </div>

          {/* Mensaje para el festejado */}
          {tiles.mensajes !== false && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#a39ec0', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Mensaje para {celebracion?.festejado_nombre || 'el festejado'}</div>
              <textarea
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                placeholder="Escribe algo bonito..."
                rows={3}
                style={{ ...fieldInput, resize: 'none', lineHeight: 1.5 }}
              />
            </div>
          )}

          <button
            onClick={guardarRsvp}
            disabled={!asistencia || guardando}
            style={{ width: '100%', padding: '14px', background: asistencia ? 'linear-gradient(135deg,#534AB7,#D4537E)' : '#e8e4f5', border: 'none', borderRadius: 14, color: asistencia ? '#fff' : '#b3adcc', fontSize: 15, fontWeight: 800, cursor: asistencia ? 'pointer' : 'default', fontFamily: FONT, transition: 'all .15s' }}
          >
            {guardando ? 'Guardando...' : guardado ? 'Confirmado' : rsvpExistente ? 'Actualizar confirmación' : 'Confirmar asistencia'}
          </button>
        </div>

        {/* Itinerario / paradas */}
        {tiles.itinerario !== false && paradas.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 24, padding: '24px 20px', marginBottom: 16, boxShadow: '0 12px 36px rgba(25,12,50,.22)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#2a2440', marginBottom: 16 }}>El plan</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {paradas.map((p: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#2a2440' }}>{p.nombre || p.lugar}</div>
                    {p.lugar && p.nombre && <div style={{ fontSize: 13, color: '#7a7494', marginTop: 2 }}>{p.lugar}</div>}
                    {p.hora && <div style={{ fontSize: 12, color: '#a39ec0', marginTop: 2 }}>{p.hora}</div>}
                    {p.lugar && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.lugar)}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, color: '#534AB7', textDecoration: 'none', marginTop: 4, display: 'inline-block' }}>
                        Ver en Maps →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de regalos */}
        {tiles.regalos !== false && regalos.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 24, padding: '24px 20px', marginBottom: 16, boxShadow: '0 12px 36px rgba(25,12,50,.22)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#2a2440', marginBottom: 16 }}>Ideas de regalo</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {regalos.map((r: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#fafafa', borderRadius: 14, border: '1.5px solid #f0edf8' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#2a2440' }}>{r.nombre}</div>
                    {r.precio && <div style={{ fontSize: 12, color: '#7a7494', marginTop: 2 }}>${r.precio}</div>}
                  </div>
                  {r.link && (
                    <a href={r.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 800, color: '#534AB7', background: '#EEEDFE', padding: '6px 12px', borderRadius: 99, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      Ver →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}