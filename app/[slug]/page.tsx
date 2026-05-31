'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useLocale } from '../hooks/useLocale'
import ListaRegalos from '../components/ListaRegalos'

const emojis: Record<string, string> = {
  cumpleanos: '🎂', boda: '💍', xv: '👑', graduacion: '🎓', babyshower: '🍼', otro: '✨'
}

export default function EventoPublico({ params }: { params: Promise<{ slug: string }> }) {
  const t = useLocale()
  const [slug, setSlug] = useState('')
  const [celebracion, setCelebracion] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [asistencia, setAsistencia] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [confirmado, setConfirmado] = useState(false)
  const [totalRsvps, setTotalRsvps] = useState(0)

  useEffect(() => {
    params.then(p => {
      setSlug(p.slug)
      cargarDatos(p.slug)
    })
  }, [])

  async function cargarDatos(s: string) {
    const { data } = await supabase
      .from('celebraciones')
      .select('*')
      .eq('slug', s)
      .single()
    setCelebracion(data)

    const { count } = await supabase
      .from('rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('celebracion_slug', s)
      .eq('asistencia', 'si')
    setTotalRsvps(count || 0)
    setCargando(false)
  }

  async function enviarRsvp() {
    if (!nombre || !asistencia) return
    setEnviando(true)
    await supabase.from('rsvps').insert({
      celebracion_slug: slug,
      nombre,
      asistencia,
      mensaje
    })
    setConfirmado(true)
    setEnviando(false)
    if (asistencia === 'si') setTotalRsvps(t => t + 1)
  }

  if (cargando) return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#AFA9EC', fontFamily: 'sans-serif' }}>{t.cargando}</p>
    </main>
  )

  if (!celebracion) return (
    <main style={{ minHeight: '100vh', background: '#26215C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#AFA9EC', fontFamily: 'sans-serif' }}>{t.no_encontrado}</p>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#26215C', fontFamily: 'sans-serif' }}>
      <div style={{ background: 'linear-gradient(160deg, #3C3489 0%, #7F77DD 100%)', padding: '2.5rem 1.5rem 2rem', textAlign: 'center' }}>
        <p style={{ fontSize: 52, margin: '0 0 8px' }}>{emojis[celebracion.tipo] || '✨'}</p>
        <h1 style={{ fontSize: 28, fontWeight: 500, color: '#FFFFFF', margin: '0 0 6px' }}>{celebracion.nombre}</h1>
        <p style={{ fontSize: 14, color: '#CECBF6', margin: '0 0 12px' }}>cheers.app/{celebracion.slug}</p>
        {totalRsvps > 0 && (
          <p style={{ fontSize: 13, color: '#AFA9EC', margin: 0 }}>
            🥂 {totalRsvps} {totalRsvps === 1 ? t.persona_confirmada : t.personas_confirmadas}
          </p>
        )}
      </div>

      <div style={{ padding: '2rem 1.5rem', maxWidth: 400, margin: '0 auto' }}>
        {!mostrarForm && !confirmado && (
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '1.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: '#EEEDFE', margin: '0 0 1rem' }}>{t.vas_a_ir}</p>
            <button
              onClick={() => setMostrarForm(true)}
              style={{ width: '100%', padding: '0.9rem', background: '#7F77DD', border: 'none', borderRadius: 8, color: '#EEEDFE', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}
            >
              {t.confirmar_asistencia}
            </button>
          </div>
        )}

        {mostrarForm && !confirmado && (
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '1.5rem' }}>
            <p style={{ fontSize: 15, color: '#EEEDFE', margin: '0 0 1.25rem', fontWeight: 500 }}>{t.tu_confirmacion}</p>

            <label style={{ fontSize: 13, color: '#AFA9EC', display: 'block', marginBottom: 4 }}>{t.tu_nombre}</label>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder={t.nombre_placeholder}
              style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#EEEDFE', fontSize: 14, marginBottom: '1rem', boxSizing: 'border-box' }}
            />

            <label style={{ fontSize: 13, color: '#AFA9EC', display: 'block', marginBottom: 8 }}>{t.vas_a_ir_pregunta}</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
              {[{ val: 'si', label: t.si_voy }, { val: 'no', label: t.no_puedo }, { val: 'talvez', label: t.tal_vez }].map(op => (
                <button
                  key={op.val}
                  onClick={() => setAsistencia(op.val)}
                  style={{ flex: 1, padding: '0.6rem 0.3rem', background: asistencia === op.val ? '#7F77DD' : 'rgba(255,255,255,0.08)', border: `1px solid ${asistencia === op.val ? '#7F77DD' : 'rgba(255,255,255,0.12)'}`, borderRadius: 8, color: '#EEEDFE', fontSize: 12, cursor: 'pointer' }}
                >
                  {op.label}
                </button>
              ))}
            </div>

            <label style={{ fontSize: 13, color: '#AFA9EC', display: 'block', marginBottom: 4 }}>{t.mensaje_label}</label>
            <textarea
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              placeholder={t.mensaje_placeholder}
              rows={3}
              style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#EEEDFE', fontSize: 14, marginBottom: '1rem', boxSizing: 'border-box', resize: 'none' }}
            />

            <button
              onClick={enviarRsvp}
              disabled={!nombre || !asistencia || enviando}
              style={{ width: '100%', padding: '0.9rem', background: (!nombre || !asistencia) ? 'rgba(127,119,221,0.4)' : '#7F77DD', border: 'none', borderRadius: 8, color: '#EEEDFE', fontSize: 15, fontWeight: 500, cursor: (!nombre || !asistencia) ? 'not-allowed' : 'pointer' }}
            >
              {enviando ? t.enviando : t.enviar}
            </button>
          </div>
        )}

        {confirmado && (
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontSize: 40, margin: '0 0 12px' }}>🥂</p>
            <p style={{ fontSize: 18, fontWeight: 500, color: '#EEEDFE', margin: '0 0 8px' }}>{t.listo}, {nombre}!</p>
            <p style={{ fontSize: 14, color: '#AFA9EC', margin: '0 0 1.5rem' }}>
              {asistencia === 'si' ? t.respuesta_si : asistencia === 'no' ? t.respuesta_no : t.respuesta_talvez}
            </p>
            <a href="/nueva" style={{ display: 'inline-block', padding: '0.7rem 1.5rem', background: '#7F77DD', borderRadius: 8, color: '#EEEDFE', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
              Crear mi celebracion →
            </a>
          </div>
        )}

        <ListaRegalos slug={slug} esOrganizador={false} />
      </div>
    </main>
  )
}