'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../supabase'
import { getLang } from '../../i18n'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const BG = 'linear-gradient(160deg,#3a1f3d,#4a2245,#2a1a3e)'

type Tab = 'presupuesto' | 'timeline' | 'novia' | 'novio' | 'pareja' | 'proveedores' | 'contratos' | 'pagos'

const ESTADOS_PROVEEDOR = ['contactado', 'cotizando', 'contratado', 'descartado'] as const
const ESTADO_LABEL: Record<string, { es: string; en: string; color: string }> = {
  contactado: { es: 'Contactado', en: 'Contacted', color: '#a89df0' },
  cotizando: { es: 'Cotizando', en: 'Quoting', color: '#c98a1e' },
  contratado: { es: 'Contratado', en: 'Booked', color: '#7CE0A8' },
  descartado: { es: 'Descartado', en: 'Dropped', color: '#f4a3a3' },
}

const inputStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.06)',
  color: '#fff', fontSize: 13, padding: '9px 12px', borderRadius: 9, fontFamily: F,
}

function fmtMoney(n: number | null | undefined) {
  if (n == null) return '—'
  return '$' + Number(n).toLocaleString()
}

export default function ProyectoBoda({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [lang, setLang] = useState('es')
  const [user, setUser] = useState<any>(null)
  const [id, setId] = useState('')
  const [proyecto, setProyecto] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [tab, setTab] = useState<Tab>('presupuesto')

  const [presupuesto, setPresupuesto] = useState<any[]>([])
  const [timeline, setTimeline] = useState<any[]>([])
  const [tablero, setTablero] = useState<any[]>([])
  const [proveedores, setProveedores] = useState<any[]>([])
  const [contratos, setContratos] = useState<any[]>([])
  const [pagos, setPagos] = useState<any[]>([])

  // Formularios rápidos por sección
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [nuevoCosto, setNuevoCosto] = useState('')
  const [nuevoTitulo, setNuevoTitulo] = useState('')
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [nuevoItem, setNuevoItem] = useState('')
  const [guardando, setGuardando] = useState(false)

  const [nuevoProvNombre, setNuevoProvNombre] = useState('')
  const [nuevoProvCategoria, setNuevoProvCategoria] = useState('')
  const [nuevoProvContacto, setNuevoProvContacto] = useState('')
  const [nuevoProvCosto, setNuevoProvCosto] = useState('')

  const [nuevoContratoNombre, setNuevoContratoNombre] = useState('')
  const [subiendoContrato, setSubiendoContrato] = useState(false)

  const [nuevoPagoConcepto, setNuevoPagoConcepto] = useState('')
  const [nuevoPagoMonto, setNuevoPagoMonto] = useState('')
  const [nuevoPagoFecha, setNuevoPagoFecha] = useState('')

  async function cargarTodo(bodaId: string) {
    const [{ data: p }, { data: t }, { data: tb }, { data: pr }, { data: ct }, { data: pg }] = await Promise.all([
      supabase.from('boda_presupuesto_items').select('*').eq('boda_id', bodaId).order('created_at'),
      supabase.from('boda_timeline_items').select('*').eq('boda_id', bodaId).order('fecha_objetivo', { ascending: true, nullsFirst: false }),
      supabase.from('boda_tablero_items').select('*').eq('boda_id', bodaId).order('orden'),
      supabase.from('boda_proveedores').select('*').eq('boda_id', bodaId).order('created_at'),
      supabase.from('boda_contratos').select('*').eq('boda_id', bodaId).order('created_at'),
      supabase.from('boda_pagos').select('*').eq('boda_id', bodaId).order('fecha', { ascending: false, nullsFirst: false }),
    ])
    setPresupuesto(p || [])
    setTimeline(t || [])
    setTablero(tb || [])
    setProveedores(pr || [])
    setContratos(ct || [])
    setPagos(pg || [])
  }

  useEffect(() => {
    setLang(getLang())
    params.then(async ({ id }) => {
      setId(id)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: proy } = await supabase.from('proyectos_boda').select('*').eq('id', id).single()
      if (!proy) { router.push('/bridal'); return }
      setProyecto(proy)
      await cargarTodo(id)
      setCargando(false)
    })
  }, [])

  async function agregarPresupuesto() {
    if (!nuevoNombre.trim()) return
    setGuardando(true)
    await supabase.from('boda_presupuesto_items').insert({
      boda_id: id, nombre: nuevoNombre.trim(), categoria: nuevaCategoria.trim() || null,
      costo_estimado: nuevoCosto ? Number(nuevoCosto) : null,
    })
    setNuevoNombre(''); setNuevaCategoria(''); setNuevoCosto('')
    await cargarTodo(id)
    setGuardando(false)
  }

  async function togglePagado(item: any) {
    setPresupuesto(prev => prev.map(x => x.id === item.id ? { ...x, pagado: !x.pagado } : x))
    await supabase.from('boda_presupuesto_items').update({ pagado: !item.pagado }).eq('id', item.id)
  }

  async function borrarPresupuesto(itemId: string) {
    setPresupuesto(prev => prev.filter(x => x.id !== itemId))
    await supabase.from('boda_presupuesto_items').delete().eq('id', itemId)
  }

  async function agregarTimeline() {
    if (!nuevoTitulo.trim()) return
    setGuardando(true)
    await supabase.from('boda_timeline_items').insert({ boda_id: id, titulo: nuevoTitulo.trim(), fecha_objetivo: nuevaFecha || null })
    setNuevoTitulo(''); setNuevaFecha('')
    await cargarTodo(id)
    setGuardando(false)
  }

  async function toggleCompletadoTimeline(item: any) {
    setTimeline(prev => prev.map(x => x.id === item.id ? { ...x, completado: !x.completado } : x))
    await supabase.from('boda_timeline_items').update({ completado: !item.completado }).eq('id', item.id)
  }

  async function borrarTimeline(itemId: string) {
    setTimeline(prev => prev.filter(x => x.id !== itemId))
    await supabase.from('boda_timeline_items').delete().eq('id', itemId)
  }

  async function agregarTablero(tableroKey: 'novia' | 'novio' | 'pareja') {
    if (!nuevoItem.trim()) return
    setGuardando(true)
    const orden = tablero.filter(x => x.tablero === tableroKey).length
    await supabase.from('boda_tablero_items').insert({ boda_id: id, tablero: tableroKey, titulo: nuevoItem.trim(), orden })
    setNuevoItem('')
    await cargarTodo(id)
    setGuardando(false)
  }

  async function toggleCompletadoTablero(item: any) {
    setTablero(prev => prev.map(x => x.id === item.id ? { ...x, completado: !x.completado } : x))
    await supabase.from('boda_tablero_items').update({ completado: !item.completado }).eq('id', item.id)
  }

  async function borrarTablero(itemId: string) {
    setTablero(prev => prev.filter(x => x.id !== itemId))
    await supabase.from('boda_tablero_items').delete().eq('id', itemId)
  }

  async function agregarProveedor() {
    if (!nuevoProvNombre.trim()) return
    setGuardando(true)
    await supabase.from('boda_proveedores').insert({
      boda_id: id, nombre: nuevoProvNombre.trim(), categoria: nuevoProvCategoria.trim() || null,
      contacto_nombre: nuevoProvContacto.trim() || null, costo_cotizado: nuevoProvCosto ? Number(nuevoProvCosto) : null,
    })
    setNuevoProvNombre(''); setNuevoProvCategoria(''); setNuevoProvContacto(''); setNuevoProvCosto('')
    await cargarTodo(id)
    setGuardando(false)
  }

  async function cambiarEstadoProveedor(item: any, estado: string) {
    setProveedores(prev => prev.map(x => x.id === item.id ? { ...x, estado } : x))
    await supabase.from('boda_proveedores').update({ estado }).eq('id', item.id)
  }

  async function borrarProveedor(itemId: string) {
    setProveedores(prev => prev.filter(x => x.id !== itemId))
    await supabase.from('boda_proveedores').delete().eq('id', itemId)
  }

  // El bucket "contratos-boda" es privado — cada archivo vive en una carpeta
  // con el id de la boda (la policy de storage revisa ese primer segmento
  // de la ruta), y para verlo hay que pedir una URL firmada al momento, no
  // guardar un link público fijo.
  async function subirContrato(file: File) {
    if (!nuevoContratoNombre.trim()) { setNuevoContratoNombre(file.name); }
    setSubiendoContrato(true)
    const path = `${id}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('contratos-boda').upload(path, file)
    if (!error) {
      await supabase.from('boda_contratos').insert({ boda_id: id, nombre: nuevoContratoNombre.trim() || file.name, archivo_url: path })
      await cargarTodo(id)
    }
    setNuevoContratoNombre('')
    setSubiendoContrato(false)
  }

  async function verContrato(archivoUrl: string) {
    const { data } = await supabase.storage.from('contratos-boda').createSignedUrl(archivoUrl, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function borrarContrato(item: any) {
    setContratos(prev => prev.filter(x => x.id !== item.id))
    await supabase.storage.from('contratos-boda').remove([item.archivo_url])
    await supabase.from('boda_contratos').delete().eq('id', item.id)
  }

  async function agregarPago() {
    if (!nuevoPagoConcepto.trim() || !nuevoPagoMonto) return
    setGuardando(true)
    await supabase.from('boda_pagos').insert({
      boda_id: id, concepto: nuevoPagoConcepto.trim(), monto: Number(nuevoPagoMonto), fecha: nuevoPagoFecha || null,
    })
    setNuevoPagoConcepto(''); setNuevoPagoMonto(''); setNuevoPagoFecha('')
    await cargarTodo(id)
    setGuardando(false)
  }

  async function borrarPago(itemId: string) {
    setPagos(prev => prev.filter(x => x.id !== itemId))
    await supabase.from('boda_pagos').delete().eq('id', itemId)
  }

  if (cargando) return (
    <main style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
      <p style={{ color: '#EEC9DD' }}>{lang === 'en' ? 'Loading…' : 'Cargando…'}</p>
    </main>
  )

  const totalEstimado = presupuesto.reduce((s, x) => s + (Number(x.costo_estimado) || 0), 0)
  const totalReal = presupuesto.reduce((s, x) => s + (Number(x.costo_real) || 0), 0)
  const totalPagado = presupuesto.filter(x => x.pagado).reduce((s, x) => s + (Number(x.costo_real ?? x.costo_estimado) || 0), 0)

  const TABS: { key: Tab; label: string }[] = [
    { key: 'presupuesto', label: lang === 'en' ? 'Budget' : 'Presupuesto' },
    { key: 'timeline', label: lang === 'en' ? 'Timeline' : 'Timeline' },
    { key: 'novia', label: lang === 'en' ? 'Bride' : 'Novia' },
    { key: 'novio', label: lang === 'en' ? 'Groom' : 'Novio' },
    { key: 'pareja', label: lang === 'en' ? 'Couple' : 'Pareja' },
    { key: 'proveedores', label: lang === 'en' ? 'Vendors' : 'Proveedores' },
    { key: 'contratos', label: lang === 'en' ? 'Contracts' : 'Contratos' },
    { key: 'pagos', label: lang === 'en' ? 'Payments' : 'Pagos' },
  ]

  const totalPagos = pagos.reduce((s, x) => s + (Number(x.monto) || 0), 0)

  return (
    <main style={{ minHeight: '100vh', background: BG, fontFamily: F, padding: '50px 20px 80px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <button onClick={() => router.push('/bridal')} style={{ border: 'none', background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 99, cursor: 'pointer', fontFamily: F, marginBottom: 20 }}>
          {lang === 'en' ? '← Back' : '← Atrás'}
        </button>

        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 24px', letterSpacing: '-.5px' }}>
          {[proyecto?.nombre_novia, proyecto?.nombre_novio].filter(Boolean).join(' & ') || (lang === 'en' ? 'Your wedding' : 'Tu boda')}
        </h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' as const }}>
          {TABS.map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)} style={{
              border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 800, padding: '8px 14px', borderRadius: 99,
              background: tab === tb.key ? 'linear-gradient(135deg,#534AB7,#D4537E)' : 'rgba(255,255,255,.08)',
              color: tab === tb.key ? '#fff' : 'rgba(255,255,255,.6)',
            }}>{tb.label}</button>
          ))}
        </div>

        {tab === 'presupuesto' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 700 }}>{lang === 'en' ? 'Estimated' : 'Estimado'}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{fmtMoney(totalEstimado)}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 700 }}>{lang === 'en' ? 'Paid so far' : 'Pagado'}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#7CE0A8' }}>{fmtMoney(totalPagado)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {presupuesto.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <input type="checkbox" checked={!!item.pagado} onChange={() => togglePagado(item)} style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: item.pagado ? 'line-through' : 'none', opacity: item.pagado ? .6 : 1 }}>{item.nombre}</div>
                    {item.categoria && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{item.categoria}</div>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#EEC9DD' }}>{fmtMoney(item.costo_real ?? item.costo_estimado)}</div>
                  <button onClick={() => borrarPresupuesto(item.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder={lang === 'en' ? 'Item' : 'Concepto'} style={{ ...inputStyle, flex: 2, minWidth: 120 }} />
              <input value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)} placeholder={lang === 'en' ? 'Category' : 'Categoría'} style={{ ...inputStyle, flex: 1, minWidth: 100 }} />
              <input type="number" value={nuevoCosto} onChange={e => setNuevoCosto(e.target.value)} placeholder={lang === 'en' ? 'Cost' : 'Costo'} style={{ ...inputStyle, width: 90 }} />
              <button onClick={agregarPresupuesto} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
            </div>
          </div>
        )}

        {tab === 'timeline' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {timeline.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <input type="checkbox" checked={!!item.completado} onChange={() => toggleCompletadoTimeline(item)} style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: item.completado ? 'line-through' : 'none', opacity: item.completado ? .6 : 1 }}>{item.titulo}</div>
                  </div>
                  {item.fecha_objetivo && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', flexShrink: 0 }}>{item.fecha_objetivo}</div>}
                  <button onClick={() => borrarTimeline(item.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <input value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} placeholder={lang === 'en' ? 'Task' : 'Tarea'} style={{ ...inputStyle, flex: 2, minWidth: 140 }} />
              <input type="date" value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' as const }} />
              <button onClick={agregarTimeline} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
            </div>
          </div>
        )}

        {(tab === 'novia' || tab === 'novio' || tab === 'pareja') && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {tablero.filter(x => x.tablero === tab).map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <input type="checkbox" checked={!!item.completado} onChange={() => toggleCompletadoTablero(item)} style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: item.completado ? 'line-through' : 'none', opacity: item.completado ? .6 : 1 }}>{item.titulo}</div>
                  <button onClick={() => borrarTablero(item.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={nuevoItem} onChange={e => setNuevoItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarTablero(tab)} placeholder={lang === 'en' ? 'Add a to-do' : 'Agregar pendiente'} style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => agregarTablero(tab)} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
            </div>
          </div>
        )}

        {tab === 'proveedores' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {proveedores.map(item => (
                <div key={item.id} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{item.nombre}</div>
                      {(item.categoria || item.contacto_nombre) && (
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{[item.categoria, item.contacto_nombre].filter(Boolean).join(' · ')}</div>
                      )}
                    </div>
                    {item.costo_cotizado != null && <div style={{ fontSize: 13, fontWeight: 800, color: '#EEC9DD' }}>{fmtMoney(item.costo_cotizado)}</div>}
                    <button onClick={() => borrarProveedor(item.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' as const }}>
                    {ESTADOS_PROVEEDOR.map(e => (
                      <button key={e} onClick={() => cambiarEstadoProveedor(item, e)} style={{
                        border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 10, fontWeight: 800, padding: '4px 9px', borderRadius: 99,
                        background: item.estado === e ? ESTADO_LABEL[e].color : 'rgba(255,255,255,.08)',
                        color: item.estado === e ? '#241c45' : 'rgba(255,255,255,.5)',
                      }}>{lang === 'en' ? ESTADO_LABEL[e].en : ESTADO_LABEL[e].es}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <input value={nuevoProvNombre} onChange={e => setNuevoProvNombre(e.target.value)} placeholder={lang === 'en' ? 'Vendor name' : 'Nombre del proveedor'} style={{ ...inputStyle, flex: 2, minWidth: 130 }} />
              <input value={nuevoProvCategoria} onChange={e => setNuevoProvCategoria(e.target.value)} placeholder={lang === 'en' ? 'Category' : 'Categoría'} style={{ ...inputStyle, flex: 1, minWidth: 90 }} />
              <input value={nuevoProvContacto} onChange={e => setNuevoProvContacto(e.target.value)} placeholder={lang === 'en' ? 'Contact' : 'Contacto'} style={{ ...inputStyle, flex: 1, minWidth: 90 }} />
              <input type="number" value={nuevoProvCosto} onChange={e => setNuevoProvCosto(e.target.value)} placeholder={lang === 'en' ? 'Quote' : 'Cotización'} style={{ ...inputStyle, width: 90 }} />
              <button onClick={agregarProveedor} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
            </div>
          </div>
        )}

        {tab === 'contratos' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {contratos.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div onClick={() => verContrato(item.archivo_url)} style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: '#EEC9DD', cursor: 'pointer', textDecoration: 'underline' }}>{item.nombre}</div>
                  <button onClick={() => borrarContrato(item)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <input value={nuevoContratoNombre} onChange={e => setNuevoContratoNombre(e.target.value)} placeholder={lang === 'en' ? 'Contract name (optional)' : 'Nombre del contrato (opcional)'} style={{ ...inputStyle, flex: 1, minWidth: 160 }} />
              <label style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>
                {subiendoContrato ? '...' : (lang === 'en' ? 'Upload' : 'Subir')}
                <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => e.target.files?.[0] && subirContrato(e.target.files[0])} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        )}

        {tab === 'pagos' && (
          <div>
            <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 700 }}>{lang === 'en' ? 'Total paid' : 'Total pagado'}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#7CE0A8' }}>{fmtMoney(totalPagos)}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 16 }}>
              {pagos.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{item.concepto}</div>
                    {item.fecha && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{item.fecha}</div>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#EEC9DD' }}>{fmtMoney(item.monto)}</div>
                  <button onClick={() => borrarPago(item.id)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.35)', fontSize: 16, cursor: 'pointer', padding: '0 2px' }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <input value={nuevoPagoConcepto} onChange={e => setNuevoPagoConcepto(e.target.value)} placeholder={lang === 'en' ? 'What was it for' : 'Concepto'} style={{ ...inputStyle, flex: 2, minWidth: 130 }} />
              <input type="number" value={nuevoPagoMonto} onChange={e => setNuevoPagoMonto(e.target.value)} placeholder={lang === 'en' ? 'Amount' : 'Monto'} style={{ ...inputStyle, width: 90 }} />
              <input type="date" value={nuevoPagoFecha} onChange={e => setNuevoPagoFecha(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' as const }} />
              <button onClick={agregarPago} disabled={guardando} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: F }}>+</button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
