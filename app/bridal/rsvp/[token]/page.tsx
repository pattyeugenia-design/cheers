'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../supabase'
import { getLang } from '../../../i18n'
import Invitacion, { type Control, type Asistencia } from '../../_invitacion/Invitacion'

// Página real que abre cada invitado con su link personal (token). Aquí vive
// SOLO la lógica (cargar datos, enviar respuesta, firmar, subir fotos); cómo
// se ve está en app/bridal/_invitacion, compartido con la vista previa.
export default function RsvpBoda({ params }: { params: Promise<{ token: string }> }) {
  const [lang, setLang] = useState('es')
  const [token, setToken] = useState('')
  const [cargando, setCargando] = useState(true)
  const [invitado, setInvitado] = useState<any>(null)
  const [noEncontrado, setNoEncontrado] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [fechaApartada, setFechaApartada] = useState(false)

  const [asistencia, setAsistencia] = useState<Asistencia>('')
  const [numAcompanantes, setNumAcompanantes] = useState(0)
  const [menuPrincipal, setMenuPrincipal] = useState('')
  const [acompanantes, setAcompanantes] = useState<{ nombre: string; menu: string }[]>([])
  const [notas, setNotas] = useState('')

  const [firmas, setFirmas] = useState<any[]>([])
  const [firmaNombreInput, setFirmaNombreInput] = useState('')
  const [firmaMensajeInput, setFirmaMensajeInput] = useState('')
  const [firmaEnviada, setFirmaEnviada] = useState(false)
  const [enviandoFirma, setEnviandoFirma] = useState(false)

  const [fotos, setFotos] = useState<any[]>([])
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [fotoRecienSubida, setFotoRecienSubida] = useState(false)

  useEffect(() => {
    setLang(getLang())
    params.then(async ({ token }) => {
      setToken(token)
      const { data, error } = await supabase.rpc('get_invitado_boda_por_token', { p_token: token })
      const info = Array.isArray(data) ? data[0] : data
      if (error || !info) { setNoEncontrado(true); setCargando(false); return }
      setInvitado(info)
      setFechaApartada(!!info.fecha_apartada)
      setFirmaNombreInput(info.nombre || '')

      // Si ya respondió, recuperamos su respuesta para mostrarla (y poder cambiarla).
      if (info.ya_respondio) {
        const { data: mi } = await supabase.rpc('get_mi_rsvp_boda', { p_token: token })
        const m = Array.isArray(mi) ? mi[0] : mi
        if (m) {
          setAsistencia((m.asistencia as Asistencia) || '')
          setNumAcompanantes(m.num_acompanantes || 0)
          setMenuPrincipal(m.menu_principal || '')
          setNotas(m.notas || '')
          const lista = Array.isArray(m.acompanantes) ? m.acompanantes : []
          setAcompanantes(lista.map((a: any) => ({ nombre: String(a?.nombre || ''), menu: String(a?.menu || '') })))
          setEnviado(true)
        }
      }
      setCargando(false)
      const { data: fm } = await supabase.rpc('get_firmas_aprobadas_boda', { p_token: token })
      setFirmas(fm || [])
      const { data: fo } = await supabase.rpc('get_fotos_aprobadas_boda', { p_token: token })
      setFotos(fo || [])
    })
  }, [])

  async function enviarFirma() {
    if (!firmaNombreInput.trim() || !firmaMensajeInput.trim()) return
    setEnviandoFirma(true)
    await supabase.rpc('firmar_libro_boda', { p_token: token, p_nombre: firmaNombreInput.trim(), p_mensaje: firmaMensajeInput.trim() })
    setEnviandoFirma(false)
    setFirmaEnviada(true)
  }

  // Reduce la foto en el navegador antes de subirla (máx. 2000px, JPG): las
  // fotos de celular pueden pasar el límite de 4.5MB de Vercel, y en JPG el
  // filtro de contenido siempre puede revisarlas (HEIC no se puede escanear).
  async function reducirFoto(archivo: File): Promise<Blob> {
    try {
      const bitmap = await createImageBitmap(archivo)
      const escala = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * escala)
      canvas.height = Math.round(bitmap.height * escala)
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.85))
      return blob || archivo
    } catch {
      return archivo
    }
  }

  async function subirFoto(archivo: File) {
    setSubiendoFoto(true)
    const foto = await reducirFoto(archivo)
    const form = new FormData()
    form.append('token', token)
    form.append('nombre', invitado?.nombre || '')
    form.append('archivo', foto, foto === archivo ? archivo.name : 'foto.jpg')
    const res = await fetch('/api/subir-foto-boda', { method: 'POST', body: form })
    setSubiendoFoto(false)
    if (res.ok) {
      setFotoRecienSubida(true)
    } else {
      const data = await res.json().catch(() => null)
      alert(data?.error || (lang === 'en' ? 'Could not upload the photo, please try again.' : 'No se pudo subir la foto, intenta de nuevo.'))
    }
  }

  function actualizarNumAcompanantes(n: number) {
    setNumAcompanantes(n)
    setAcompanantes(prev => {
      const next = [...prev]
      while (next.length < n) next.push({ nombre: '', menu: '' })
      return next.slice(0, n)
    })
  }

  async function enviar() {
    if (!asistencia) return
    setEnviando(true)
    const { data } = await supabase.rpc('enviar_rsvp_boda', {
      p_token: token,
      p_asistencia: asistencia,
      p_num_acompanantes: numAcompanantes,
      p_menu_principal: menuPrincipal || null,
      p_notas: notas.trim() || null,
      p_acompanantes: acompanantes,
    })
    setEnviando(false)
    if (data) {
      setEnviado(true)
      setInvitado((prev: any) => ({ ...prev, ya_respondio: true }))
      document.getElementById('confirmar')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      alert(lang === 'en' ? 'We could not save your reply, please try again.' : 'No pudimos guardar tu respuesta, intenta de nuevo.')
    }
  }

  if (cargando) return (
    <main style={{ minHeight: '100vh', background: '#F6F0E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
      <p style={{ color: '#AD857C', fontStyle: 'italic' }}>{lang === 'en' ? 'Loading…' : 'Cargando…'}</p>
    </main>
  )

  if (noEncontrado) return (
    <main style={{ minHeight: '100vh', background: '#F6F0E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', padding: 20 }}>
      <p style={{ color: '#6E5A55', textAlign: 'center', fontStyle: 'italic' }}>
        {lang === 'en' ? "We couldn't find this invitation." : 'No encontramos esta invitación.'}
      </p>
    </main>
  )

  async function apartarFecha() {
    setFechaApartada(true)
    await supabase.rpc('apartar_fecha_boda', { p_token: token })
  }

  const ctl: Control = {
    apartar: { hecho: fechaApartada, accion: apartarFecha },
    rsvp: {
      asistencia, setAsistencia, numAcompanantes, setNum: actualizarNumAcompanantes,
      menuPrincipal, setMenu: setMenuPrincipal, acompanantes,
      setAcompanante: (i, campo, v) => setAcompanantes(prev => prev.map((x, j) => (j === i ? { ...x, [campo]: v } : x))),
      notas, setNotas, enviar, enviando, enviado, editar: () => setEnviado(false),
    },
    firmas: { lista: firmas, nombre: firmaNombreInput, setNombre: setFirmaNombreInput, mensaje: firmaMensajeInput, setMensaje: setFirmaMensajeInput, enviada: firmaEnviada, enviando: enviandoFirma, enviar: enviarFirma },
    fotos: { lista: fotos, subiendo: subiendoFoto, recienSubida: fotoRecienSubida, subir: subirFoto },
  }

  // El link personal siempre es la invitación completa; el Save the date tiene su propio link general (/bridal/std/...).
  return <Invitacion d={{ ...invitado, token, modo_invitacion: 'completa' }} lang={lang} modo="real" ctl={ctl} />
}
