'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../supabase'
import { getLang } from '../../../i18n'
import { fechaLarga, fechaCorta, hora12 } from '../../_invitacion/tema'

// Lista de invitadas de la despedida, SOLO para la pareja (miembros del proyecto,
// por RLS de boda_despedidas y boda_despedida_invitadas). Desde aquí se manda
// cada link personal por WhatsApp (se abre WhatsApp con el mensaje listo; nada
// se manda solo) y se ven o anotan las respuestas.
const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const ROSA = '#B76E79'
const TINTA = '#3D2B2E'

type Invitada = { id: string; token: string; nombre: string; telefono: string | null; respuesta: 'si' | 'no' | null; origen: 'link' | 'whatsapp' | null; mensaje: string | null; respondio_en: string | null; enviado_en: string | null }
type Filtro = 'todas' | 'si' | 'no' | 'pendiente' | 'sin_enviar'

// 10 dígitos = México (se agrega 52); "+1…" u otro con lada se respeta.
function numeroWa(tel: string | null) {
  const crudo = String(tel || '')
  const dig = crudo.replace(/\D/g, '')
  if (/^\d{10}$/.test(dig) && !crudo.trim().startsWith('+')) return '52' + dig
  if (/^\d{11,15}$/.test(dig)) return dig
  return ''
}
function telLimpio(tel: string) {
  const t = tel.trim()
  const dig = t.replace(/\D/g, '')
  if (!dig) return null
  const v = (t.startsWith('+') ? '+' : '') + dig
  return /^\+?\d{10,15}$/.test(v) ? v : undefined
}

export default function DespedidaDashboard({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [lang, setLang] = useState('es')
  const [id, setId] = useState('')
  const [cargando, setCargando] = useState(true)
  const [despedida, setDespedida] = useState<any>(null)
  const [invitadas, setInvitadas] = useState<Invitada[]>([])
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [busca, setBusca] = useState('')
  const [plantilla, setPlantilla] = useState('')
  const [copiado, setCopiado] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoTel, setNuevoTel] = useState('')
  const [errorNuevo, setErrorNuevo] = useState('')
  const t = (es: string, en: string) => (lang === 'en' ? en : es)

  useEffect(() => {
    setLang(getLang())
    params.then(async ({ id }) => {
      setId(id)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: ds } = await supabase.from('boda_despedidas').select('*').eq('boda_id', id).order('created_at', { ascending: true }).limit(1)
      const d = ds?.[0] || null
      setDespedida(d)
      if (d) {
        const { data: inv } = await supabase.from('boda_despedida_invitadas')
          .select('id, token, nombre, telefono, respuesta, origen, mensaje, respondio_en, enviado_en')
          .eq('despedida_id', d.id).order('nombre', { ascending: true })
        setInvitadas((inv || []) as Invitada[])
        const fecha = fechaLarga(d.fecha, 'es')
        const hora = d.hora_inicio ? hora12(d.hora_inicio) : ''
        const limite = d.fecha_limite ? fechaCorta(d.fecha_limite, 'es').replace(/ de \d{4}$/, '') : ''
        setPlantilla(
          `Hola {nombre}, con mucho cariño te comparto tu invitación a la ${String(d.titulo || 'despedida de soltera').toLowerCase()} de ${d.festejada || 'Patty'}: ${fecha}${hora ? `, ${hora}` : ''}${d.lugar_nombre ? `, en ${d.lugar_nombre}` : ''}.` +
          `${limite ? ` Por favor confírmanos antes del ${limite}` : ' Por favor confírmanos'} aquí: {link}`
        )
      }
      setCargando(false)
    })
  }, [])

  const origen = typeof window !== 'undefined' ? window.location.origin : 'https://joincheers.app'
  const linkDe = (inv: Invitada) => `${origen}/bridal/despedida/${inv.token}`
  const primerNombre = (n: string) => n.trim().split(/\s+/)[0] || n
  const textoDe = (inv: Invitada) => plantilla.replace(/\{nombre\}/g, primerNombre(inv.nombre)).replace(/\{link\}/g, linkDe(inv)).slice(0, 1200)

  const cuentas = useMemo(() => ({
    si: invitadas.filter(i => i.respuesta === 'si').length,
    no: invitadas.filter(i => i.respuesta === 'no').length,
    pendiente: invitadas.filter(i => !i.respuesta).length,
    enviadas: invitadas.filter(i => i.enviado_en).length,
  }), [invitadas])

  const visibles = invitadas.filter(i => {
    if (filtro === 'si' && i.respuesta !== 'si') return false
    if (filtro === 'no' && i.respuesta !== 'no') return false
    if (filtro === 'pendiente' && i.respuesta) return false
    if (filtro === 'sin_enviar' && i.enviado_en) return false
    const q = busca.trim().toLowerCase()
    return !q || i.nombre.toLowerCase().includes(q) || String(i.telefono || '').includes(q)
  })

  async function actualizar(inv: Invitada, cambios: Partial<Invitada>) {
    const antes = invitadas
    setInvitadas(prev => prev.map(x => (x.id === inv.id ? { ...x, ...cambios } : x)))
    const { error } = await supabase.from('boda_despedida_invitadas').update(cambios).eq('id', inv.id)
    if (error) { setInvitadas(antes); alert(t('No se pudo guardar.', "Couldn't save.")) }
  }

  function marcarEnviada(inv: Invitada) {
    if (!inv.enviado_en) actualizar(inv, { enviado_en: new Date().toISOString() })
  }

  function anotarRespuesta(inv: Invitada, v: string) {
    if (v === 'si' || v === 'no') actualizar(inv, { respuesta: v, origen: 'whatsapp', respondio_en: new Date().toISOString() })
    else actualizar(inv, { respuesta: null, origen: null, respondio_en: null })
  }

  async function copiar(inv: Invitada) {
    try {
      await navigator.clipboard.writeText(linkDe(inv))
      setCopiado(inv.id)
      setTimeout(() => setCopiado(''), 1600)
    } catch { /* el navegador no dejó copiar */ }
  }

  async function agregar() {
    setErrorNuevo('')
    const nombre = nuevoNombre.trim().slice(0, 80)
    if (!nombre || !despedida) { setErrorNuevo(t('Escribe el nombre.', 'Type a name.')); return }
    const tel = telLimpio(nuevoTel)
    if (tel === undefined) { setErrorNuevo(t('El teléfono debe tener 10 dígitos (o +1… si es de EU).', 'Phone must have 10 digits (or +1… for the US).')); return }
    const { data, error } = await supabase.from('boda_despedida_invitadas')
      .insert({ despedida_id: despedida.id, nombre, telefono: tel })
      .select('id, token, nombre, telefono, respuesta, origen, mensaje, respondio_en, enviado_en').single()
    if (error || !data) { setErrorNuevo(t('No se pudo agregar.', "Couldn't add.")); return }
    setInvitadas(prev => [...prev, data as Invitada].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setNuevoNombre(''); setNuevoTel('')
  }

  async function quitar(inv: Invitada) {
    if (!window.confirm(t(`¿Quitar a ${inv.nombre} de la despedida? Su link deja de funcionar.`, `Remove ${inv.nombre}? Her link will stop working.`))) return
    const { error } = await supabase.from('boda_despedida_invitadas').delete().eq('id', inv.id)
    if (error) { alert(t('No se pudo quitar.', "Couldn't remove.")); return }
    setInvitadas(prev => prev.filter(x => x.id !== inv.id))
  }

  const pagina: React.CSSProperties = { minHeight: '100vh', background: '#FBF6F3', fontFamily: F, color: TINTA }
  if (cargando) return <main style={{ ...pagina, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: ROSA }}>{t('Cargando…', 'Loading…')}</p></main>
  if (!despedida) return (
    <main style={{ ...pagina, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
      <div>
        <p>{t('Esta boda todavía no tiene despedida.', 'This wedding has no shower yet.')}</p>
        <a href={`/bridal/${id}`} style={{ color: ROSA, fontWeight: 700, fontSize: 13 }}>{t('← Volver al dashboard', '← Back to dashboard')}</a>
      </div>
    </main>
  )

  const chip = (activo: boolean): React.CSSProperties => ({ border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 12, fontWeight: 700, padding: '7px 12px', borderRadius: 99, background: activo ? ROSA : 'rgba(183,110,121,.1)', color: activo ? '#fff' : TINTA })
  const boton: React.CSSProperties = { border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 12, fontWeight: 700, padding: '8px 11px', borderRadius: 9, background: 'rgba(183,110,121,.1)', color: TINTA, textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-block' }
  const input: React.CSSProperties = { fontFamily: F, fontSize: 14, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(61,43,46,.15)', background: '#fff', color: TINTA, boxSizing: 'border-box' }

  return (
    <main style={pagina}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '22px 16px 60px' }}>
        <a href={`/bridal/${id}`} style={{ color: ROSA, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>{t('← Dashboard', '← Dashboard')}</a>
        <h1 style={{ fontSize: 24, margin: '14px 0 4px' }}>{despedida.titulo}{despedida.festejada ? ` · ${despedida.festejada}` : ''}</h1>
        <p style={{ fontSize: 14, color: 'rgba(61,43,46,.65)', margin: 0, lineHeight: 1.5 }}>
          {fechaLarga(despedida.fecha, lang)}{despedida.hora_inicio ? ` · ${hora12(despedida.hora_inicio)}${despedida.hora_fin ? ` a ${hora12(despedida.hora_fin)}` : ''}` : ''}{despedida.lugar_nombre ? ` · ${despedida.lugar_nombre}` : ''}
          {despedida.fecha_limite ? <><br />{t('Confirmar antes del', 'RSVP by')} {fechaLarga(despedida.fecha_limite, lang)}</> : null}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8, margin: '18px 0' }}>
          {([[t('Van', 'Yes'), cuentas.si], [t('No van', 'No'), cuentas.no], [t('Sin respuesta', 'Pending'), cuentas.pendiente], [t('Links enviados', 'Links sent'), `${cuentas.enviadas}/${invitadas.length}`]] as [string, string | number][]).map(([k, v]) => (
            <div key={k} style={{ background: '#fff', borderRadius: 12, padding: '12px 10px', textAlign: 'center', border: '1px solid rgba(183,110,121,.15)' }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{v}</div>
              <div style={{ fontSize: 11, color: 'rgba(61,43,46,.6)', fontWeight: 700 }}>{k}</div>
            </div>
          ))}
        </div>

        <details style={{ background: '#fff', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(183,110,121,.15)', marginBottom: 14 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>{t('Mensaje de WhatsApp', 'WhatsApp message')}</summary>
          <p style={{ fontSize: 12, color: 'rgba(61,43,46,.6)', margin: '8px 0' }}>{t('{nombre} se cambia por el nombre de cada invitada y {link} por su link personal. Los cambios aquí no se guardan al salir.', '{nombre} becomes each guest’s first name and {link} her personal link. Changes are not saved when you leave.')}</p>
          <textarea value={plantilla} onChange={e => setPlantilla(e.target.value)} rows={4} maxLength={900} style={{ ...input, width: '100%', resize: 'vertical' }} />
        </details>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {([['todas', t('Todas', 'All')], ['si', t('Van', 'Yes')], ['no', t('No van', 'No')], ['pendiente', t('Sin respuesta', 'Pending')], ['sin_enviar', t('Sin enviar', 'Not sent')]] as [Filtro, string][]).map(([v, txt]) => (
            <button key={v} onClick={() => setFiltro(v)} style={chip(filtro === v)}>{txt}</button>
          ))}
        </div>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder={t('Buscar por nombre o teléfono', 'Search by name or phone')} style={{ ...input, width: '100%', marginBottom: 12 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visibles.map(inv => {
            const wa = numeroWa(inv.telefono)
            return (
              <div key={inv.id} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(183,110,121,.15)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{inv.nombre}</div>
                    <div style={{ fontSize: 12, color: 'rgba(61,43,46,.55)' }}>
                      {inv.telefono || t('sin teléfono', 'no phone')}
                      {inv.enviado_en ? ` · ${t('link enviado', 'link sent')}` : ''}
                    </div>
                    {inv.mensaje && <div style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(61,43,46,.75)', marginTop: 6 }}>“{inv.mensaje}”</div>}
                  </div>
                  <select value={inv.respuesta || ''} onChange={e => anotarRespuesta(inv, e.target.value)} title={inv.origen === 'link' ? t('Respondió en su link', 'Answered in her link') : inv.origen === 'whatsapp' ? t('Anotado por ti', 'Noted by you') : ''}
                    style={{ ...input, fontSize: 13, fontWeight: 700, padding: '7px 8px', background: inv.respuesta === 'si' ? 'rgba(122,160,120,.18)' : inv.respuesta === 'no' ? 'rgba(194,75,75,.12)' : '#fff' }}>
                    <option value="">{t('Sin respuesta', 'Pending')}</option>
                    <option value="si">{t('Va', 'Yes')}{inv.origen === 'link' && inv.respuesta === 'si' ? t(' (en su link)', ' (her link)') : ''}</option>
                    <option value="no">{t('No va', 'No')}{inv.origen === 'link' && inv.respuesta === 'no' ? t(' (en su link)', ' (her link)') : ''}</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  {wa
                    ? <a href={`https://wa.me/${wa}?text=${encodeURIComponent(textoDe(inv))}`} target="_blank" rel="noopener noreferrer" onClick={() => marcarEnviada(inv)} style={{ ...boton, background: ROSA, color: '#fff' }}>{inv.enviado_en ? t('Reenviar por WhatsApp', 'Resend on WhatsApp') : t('Enviar por WhatsApp', 'Send on WhatsApp')}</a>
                    : <span style={{ ...boton, opacity: 0.5, cursor: 'default' }}>{t('Sin WhatsApp', 'No WhatsApp')}</span>}
                  <button onClick={() => copiar(inv)} style={boton}>{copiado === inv.id ? t('Copiado', 'Copied') : t('Copiar link', 'Copy link')}</button>
                  <a href={linkDe(inv)} target="_blank" rel="noopener noreferrer" style={boton}>{t('Ver', 'Open')}</a>
                  {!inv.enviado_en && <button onClick={() => marcarEnviada(inv)} style={boton}>{t('Marcar enviado', 'Mark sent')}</button>}
                  <button onClick={() => quitar(inv)} style={{ ...boton, background: 'transparent', color: 'rgba(61,43,46,.5)' }}>{t('Quitar', 'Remove')}</button>
                </div>
              </div>
            )
          })}
          {visibles.length === 0 && <p style={{ fontSize: 13, color: 'rgba(61,43,46,.55)', textAlign: 'center' }}>{t('Nadie en esta lista.', 'No one here.')}</p>}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: '14px', border: '1px solid rgba(183,110,121,.15)', marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>{t('Agregar invitada', 'Add guest')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} maxLength={80} placeholder={t('Nombre', 'Name')} style={{ ...input, flex: '2 1 180px' }} />
            <input value={nuevoTel} onChange={e => setNuevoTel(e.target.value)} maxLength={20} placeholder={t('WhatsApp (10 dígitos)', 'WhatsApp')} inputMode="tel" style={{ ...input, flex: '1 1 140px' }} />
            <button onClick={agregar} style={{ ...boton, background: ROSA, color: '#fff', padding: '10px 16px' }}>{t('Agregar', 'Add')}</button>
          </div>
          {errorNuevo && <p style={{ fontSize: 12, color: '#C24B4B', margin: '8px 0 0' }}>{errorNuevo}</p>}
        </div>
      </div>
    </main>
  )
}
