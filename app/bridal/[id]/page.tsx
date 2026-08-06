'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../supabase'
import { getLang } from '../../i18n'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const BG = 'linear-gradient(160deg,#3a1f3d,#4a2245,#2a1a3e)'

type Tab = 'presupuesto' | 'timeline' | 'novia' | 'novio' | 'pareja'

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

  // Formularios rápidos por sección
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [nuevoCosto, setNuevoCosto] = useState('')
  const [nuevoTitulo, setNuevoTitulo] = useState('')
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [nuevoItem, setNuevoItem] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function cargarTodo(bodaId: string) {
    const [{ data: p }, { data: t }, { data: tb }] = await Promise.all([
      supabase.from('boda_presupuesto_items').select('*').eq('boda_id', bodaId).order('created_at'),
      supabase.from('boda_timeline_items').select('*').eq('boda_id', bodaId).order('fecha_objetivo', { ascending: true, nullsFirst: false }),
      supabase.from('boda_tablero_items').select('*').eq('boda_id', bodaId).order('orden'),
    ])
    setPresupuesto(p || [])
    setTimeline(t || [])
    setTablero(tb || [])
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
  ]

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
      </div>
    </main>
  )
}
