'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../supabase'
import { getLang } from '../../../i18n'
import Invitacion, { type Control, type Asistencia } from '../../_invitacion/Invitacion'

// Vista previa a tamaño real de la invitación, SOLO para la pareja (dueños y
// miembros del proyecto, por RLS de proyectos_boda). Usa exactamente la misma
// invitación que ve el invitado; los botones de enviar están apagados y nada
// se guarda.
export default function PreviewInvitacionBoda({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [lang, setLang] = useState('es')
  const [id, setId] = useState('')
  const [cargando, setCargando] = useState(true)
  const [proyecto, setProyecto] = useState<any>(null)
  const [noEncontrado, setNoEncontrado] = useState(false)
  const [firmas, setFirmas] = useState<any[]>([])
  const [fotos, setFotos] = useState<any[]>([])

  // Solo para sentir cómo responde el formulario — nunca se guarda nada aquí.
  const [asistencia, setAsistencia] = useState<Asistencia>('')
  const [numAcompanantes, setNumAcompanantes] = useState(0)
  const [menuPrincipal, setMenuPrincipal] = useState('')
  const [acompanantes, setAcompanantes] = useState<{ nombre: string; menu: string }[]>([])
  const [notas, setNotas] = useState('')
  const [fNombre, setFNombre] = useState('')
  const [fMensaje, setFMensaje] = useState('')

  useEffect(() => {
    setLang(getLang())
    params.then(async ({ id }) => {
      setId(id)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data, error } = await supabase.from('proyectos_boda').select('*').eq('id', id).single()
      if (error || !data) { setNoEncontrado(true); setCargando(false); return }
      setProyecto(data)
      const { data: fm } = await supabase.from('boda_firmas').select('*').eq('boda_id', id).eq('aprobado', true).order('created_at', { ascending: false })
      setFirmas(fm || [])
      const { data: fo } = await supabase.from('boda_fotos').select('*').eq('boda_id', id).eq('aprobado', true).order('created_at', { ascending: false })
      setFotos(fo || [])
      setCargando(false)
    })
  }, [])

  if (cargando) return (
    <main style={{ minHeight: '100vh', background: '#F6F0E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
      <p style={{ color: '#AD857C', fontStyle: 'italic' }}>{lang === 'en' ? 'Loading…' : 'Cargando…'}</p>
    </main>
  )

  if (noEncontrado) return (
    <main style={{ minHeight: '100vh', background: '#F6F0E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', padding: 20 }}>
      <p style={{ color: '#6E5A55', textAlign: 'center', fontStyle: 'italic' }}>
        {lang === 'en' ? "We couldn't find this project." : 'No encontramos este proyecto.'}
      </p>
    </main>
  )

  const nada = () => {}
  const ctl: Control = {
    rsvp: {
      asistencia, setAsistencia, numAcompanantes, menuPrincipal, setMenu: setMenuPrincipal, notas, setNotas,
      setNum: n => {
        setNumAcompanantes(n)
        setAcompanantes(prev => { const next = [...prev]; while (next.length < n) next.push({ nombre: '', menu: '' }); return next.slice(0, n) })
      },
      acompanantes,
      setAcompanante: (i, campo, v) => setAcompanantes(prev => prev.map((x, j) => (j === i ? { ...x, [campo]: v } : x))),
      enviar: nada, enviando: false, enviado: false, editar: nada,
    },
    firmas: { lista: firmas, nombre: fNombre, setNombre: setFNombre, mensaje: fMensaje, setMensaje: setFMensaje, enviada: false, enviando: false, enviar: nada },
    fotos: { lista: fotos, subiendo: false, recienSubida: false, subir: nada },
  }

  return (
    <Invitacion
      d={{ ...proyecto, nombre: lang === 'en' ? 'Your guest' : 'Tu invitado', acompanantes_permitidos: Math.max(1, proyecto.acompanantes_permitidos || 2), ya_respondio: false }}
      lang={lang} modo="preview" ctl={ctl} volverHref={`/bridal/${id}`}
    />
  )
}
