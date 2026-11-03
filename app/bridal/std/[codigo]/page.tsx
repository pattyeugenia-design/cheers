'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../supabase'
import { getLang } from '../../../i18n'
import Invitacion, { type Control } from '../../_invitacion/Invitacion'

// Save the date. Dos tipos de link:
// - GENERAL (/bridal/std/20c278aa36): el mismo para todos, sin nombre. Lee con get_std_boda.
// - PERSONAL (/bridal/std/patty-y-valente-k3m9x2p7qa4z): uno por invitado, con su nombre en el
//   sobre y el botón "Ya aparté la fecha". Lee con get_std_invitado, que nunca devuelve el token
//   de la invitación completa.
// Ninguno pide confirmación de asistencia.
const CODIGO = /^[a-z0-9]{8,24}$/
const PERSONAL = /^[a-z0-9]+(-[a-z0-9]+)*-[a-z0-9]{12}$/

export default function SaveTheDate({ params }: { params: Promise<{ codigo: string }> }) {
  const [lang, setLang] = useState('es')
  const [codigo, setCodigo] = useState('')
  const [cargando, setCargando] = useState(true)
  const [datos, setDatos] = useState<any>(null)
  const [apartada, setApartada] = useState(false)
  const [respuesta, setRespuesta] = useState<string | null>(null)

  useEffect(() => {
    setLang(getLang())
    params.then(async ({ codigo }) => {
      setCodigo(codigo)
      if (codigo.length <= 100 && PERSONAL.test(codigo)) {
        const { data } = await supabase.rpc('get_std_invitado', { p_codigo: codigo })
        const info = Array.isArray(data) ? data[0] : data
        setDatos(info ? { ...info, personal: true } : null)
        setApartada(!!info?.fecha_apartada)
        setRespuesta(info?.std_respuesta || null)
      } else if (CODIGO.test(codigo)) {
        const [{ data }, { data: en }] = await Promise.all([
          supabase.rpc('get_std_boda', { p_codigo: codigo }),
          supabase.rpc('get_contenido_en_boda', { p_ref: codigo }),
        ])
        const info = Array.isArray(data) ? data[0] : data
        setDatos(info ? { ...info, contenido_en: en || null } : null)
      }
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

  async function apartarFecha() {
    setApartada(true)
    await supabase.rpc('apartar_fecha_std', { p_codigo: codigo })
  }

  async function responder(v: 'si' | 'no' | 'tal_vez') {
    const antes = respuesta
    setRespuesta(v)
    const { data, error } = await supabase.rpc('responder_std', { p_codigo: codigo, p_respuesta: v })
    if (error || data === false) setRespuesta(antes)
  }

  const nada = () => {}
  const ctl: Control = {
    ...(datos.personal ? { apartar: { hecho: apartada, accion: apartarFecha }, preRespuesta: { valor: respuesta, responder } } : {}),
    rsvp: { asistencia: '', setAsistencia: nada, numAcompanantes: 0, setNum: nada, menuPrincipal: '', setMenu: nada, acompanantes: [], setAcompanante: nada, notas: '', setNotas: nada, enviar: nada, enviando: false, enviado: false, editar: nada },
    firmas: { lista: [], nombre: '', setNombre: nada, mensaje: '', setMensaje: nada, enviada: false, enviando: false, enviar: nada },
    fotos: { lista: [], subiendo: false, recienSubida: false, subir: nada },
  }

  return <Invitacion d={{ ...datos, nombre: datos.personal ? datos.nombre : '', slug: `std-${datos.std_codigo}`, modo_invitacion: 'save_the_date' }} lang={lang} modo="real" ctl={ctl} />
}
