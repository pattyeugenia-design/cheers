'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../supabase'
import { getLang } from '../../../i18n'
import Invitacion, { type Control } from '../../_invitacion/Invitacion'

// Save the date con UN SOLO link para todos (no es personal): no lleva nombre
// de invitado, no pide confirmación y no guarda nada. Lee con get_std_boda, que
// solo devuelve los datos públicos del Save the date y solo si la pareja lo
// tiene activo.
const CODIGO = /^[a-z0-9]{8,24}$/

export default function SaveTheDateGeneral({ params }: { params: Promise<{ codigo: string }> }) {
  const [lang, setLang] = useState('es')
  const [cargando, setCargando] = useState(true)
  const [datos, setDatos] = useState<any>(null)

  useEffect(() => {
    setLang(getLang())
    params.then(async ({ codigo }) => {
      if (!CODIGO.test(codigo)) { setCargando(false); return }
      const { data } = await supabase.rpc('get_std_boda', { p_codigo: codigo })
      const info = Array.isArray(data) ? data[0] : data
      setDatos(info || null)
      setCargando(false)
    })
  }, [])

  if (cargando) return (
    <main style={{ minHeight: '100vh', background: '#F6F0E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
      <p style={{ color: '#AD857C', fontStyle: 'italic' }}>{lang === 'en' ? 'Loading…' : 'Cargando…'}</p>
    </main>
  )

  if (!datos) return (
    <main style={{ minHeight: '100vh', background: '#F6F0E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', padding: 20 }}>
      <p style={{ color: '#6E5A55', textAlign: 'center', fontStyle: 'italic' }}>
        {lang === 'en' ? "We couldn't find this save the date." : 'No encontramos este save the date.'}
      </p>
    </main>
  )

  const nada = () => {}
  const ctl: Control = {
    rsvp: { asistencia: '', setAsistencia: nada, numAcompanantes: 0, setNum: nada, menuPrincipal: '', setMenu: nada, acompanantes: [], setAcompanante: nada, notas: '', setNotas: nada, enviar: nada, enviando: false, enviado: false, editar: nada },
    firmas: { lista: [], nombre: '', setNombre: nada, mensaje: '', setMensaje: nada, enviada: false, enviando: false, enviar: nada },
    fotos: { lista: [], subiendo: false, recienSubida: false, subir: nada },
  }

  return <Invitacion d={{ ...datos, nombre: '', slug: `std-${datos.std_codigo}`, modo_invitacion: 'save_the_date' }} lang={lang} modo="real" ctl={ctl} />
}
