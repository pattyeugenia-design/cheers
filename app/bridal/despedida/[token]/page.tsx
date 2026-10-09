'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../supabase'
import { getLang } from '../../../i18n'
import InvitacionDespedida, { type ControlDespedida, type RespuestaDespedida } from '../../_invitacion/InvitacionDespedida'

// Página que abre cada invitada de la despedida con su link personal (token).
// Solo lee su propia invitación (get_despedida_por_token) y solo puede guardar
// su propia respuesta (responder_despedida). Nada se mezcla con el RSVP de la boda.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function InvitacionDespedidaPagina({ params }: { params: Promise<{ token: string }> }) {
  const [lang, setLang] = useState('es')
  const [token, setToken] = useState('')
  const [cargando, setCargando] = useState(true)
  const [datos, setDatos] = useState<any>(null)
  const [respuesta, setRespuesta] = useState<RespuestaDespedida>('')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    setLang(getLang())
    params.then(async ({ token }) => {
      setToken(token)
      if (!UUID.test(token)) { setCargando(false); return }
      const { data } = await supabase.rpc('get_despedida_por_token', { p_token: token })
      const info = Array.isArray(data) ? data[0] : data
      if (info) {
        setDatos(info)
        if (info.respuesta === 'si' || info.respuesta === 'no') { setRespuesta(info.respuesta); setEnviado(true) }
        setMensaje(String(info.mensaje_invitada || ''))
      }
      setCargando(false)
    })
  }, [])

  async function enviar() {
    if (!respuesta) return
    setEnviando(true)
    const { data } = await supabase.rpc('responder_despedida', { p_token: token, p_respuesta: respuesta, p_mensaje: mensaje.trim() || null })
    setEnviando(false)
    if (data) {
      setEnviado(true)
      document.getElementById('confirmar')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      alert(lang === 'en' ? 'We could not save your answer, please try again.' : 'No pudimos guardar tu respuesta, intenta de nuevo.')
    }
  }

  if (cargando) return (
    <main style={{ minHeight: '100vh', background: '#F6F0E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
      <p style={{ color: '#AD857C', fontStyle: 'italic' }}>{lang === 'en' ? 'Loading…' : 'Cargando…'}</p>
    </main>
  )

  if (!datos) return (
    <main style={{ minHeight: '100vh', background: '#F6F0E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', padding: 20 }}>
      <p style={{ color: '#6E5A55', textAlign: 'center', fontStyle: 'italic' }}>
        {lang === 'en' ? "We couldn't find this invitation." : 'No encontramos esta invitación.'}
      </p>
    </main>
  )

  const ctl: ControlDespedida = { respuesta, setRespuesta, mensaje, setMensaje, enviar, enviando, enviado, editar: () => setEnviado(false) }
  return <InvitacionDespedida d={{ ...datos, token }} lang={lang} ctl={ctl} />
}
