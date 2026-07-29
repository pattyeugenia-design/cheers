'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../supabase'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const ADMIN_EMAIL = 'patty.eugenia@gmail.com'

type Vista = 'qa' | 'admin' | 'embudo'

export default function Admin() {
  const router = useRouter()
  const [cargando, setCargando] = useState(true)
  const [vista, setVista] = useState<Vista>('qa')
  const [celebraciones, setCelebraciones] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [rsvps, setRsvps] = useState<any[]>([])
  const [invitados, setInvitados] = useState<any[]>([])
  const [eventos, setEventos] = useState<any[]>([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date())
  const [busqueda, setBusqueda] = useState('')

  const cargarDatos = useCallback(async () => {
    const [{ data: cels }, { data: users }, { data: rsvpData }, { data: invData }, { data: eventosData }] = await Promise.all([
      supabase.from('celebraciones').select('*').order('created_at', { ascending: false }),
      supabase.from('perfiles').select('*').order('created_at', { ascending: false }),
      supabase.from('rsvps').select('*').order('created_at', { ascending: false }),
      supabase.from('invitados').select('*').order('created_at', { ascending: false }),
      // Últimos 90 días — suficiente para ver el embudo y las fuentes sin traer la tabla completa
      supabase.from('eventos_analytics').select('*').gte('created_at', new Date(Date.now() - 90*24*60*60*1000).toISOString()).order('created_at', { ascending: false }),
    ])
    setCelebraciones(cels || [])
    setUsuarios(users || [])
    setRsvps(rsvpData || [])
    setInvitados(invData || [])
    setEventos(eventosData || [])
    setUltimaActualizacion(new Date())
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/')
        return
      }
      cargarDatos().then(() => setCargando(false))
    }).catch(async () => {
      // Sesión guardada inválida/corrupta: sin esto la página se queda
      // colgada esperando para siempre en vez de mandar de vuelta.
      await supabase.auth.signOut().catch(() => {})
      router.push('/')
    })
  }, [])

  // Tiempo real — Supabase avisa por websocket en cuanto cambia algo en estas
  // tablas (requiere que la tabla esté agregada a la publicación supabase_realtime).
  // Se deja también un refresh cada 2 min como red de seguridad por si el socket se cae.
  useEffect(() => {
    const canal = supabase
      .channel('admin-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'celebraciones' }, cargarDatos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'perfiles' }, cargarDatos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvps' }, cargarDatos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invitados' }, cargarDatos)
      .subscribe()

    const respaldo = setInterval(cargarDatos, 120000)
    return () => { supabase.removeChannel(canal); clearInterval(respaldo) }
  }, [cargarDatos])

  async function borrarCelebracion(slug: string) {
    if (!confirm(`¿Borrar ${slug}? Esta acción no se puede deshacer.`)) return
    const cel = celebraciones.find(c => c.slug === slug)
    if (cel?.portada_url) {
      const idx = cel.portada_url.indexOf('/portadas/')
      if (idx !== -1) await supabase.storage.from('portadas').remove([cel.portada_url.slice(idx + '/portadas/'.length)])
    }
    await supabase.from('celebraciones').delete().eq('slug', slug)
    await supabase.from('rsvps').delete().eq('celebracion_slug', slug)
    await supabase.from('invitados').delete().eq('celebracion_slug', slug)
    setCelebraciones(prev => prev.filter(c => c.slug !== slug))
  }

  async function cambiarPlan(userId: string, plan: string) {
    await supabase.from('perfiles').update({ plan }).eq('user_id', userId)
    setUsuarios(prev => prev.map(u => u.user_id === userId ? { ...u, plan } : u))
  }

  if (cargando) return (
    <div style={{ minHeight:'100vh', background:'#0d0b1a', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:F }}>
      <p style={{ color:'rgba(255,255,255,.4)' }}>Cargando...</p>
    </div>
  )

  // Métricas
  const totalCels = celebraciones.length
  const celsEstaSeamana = celebraciones.filter(c => new Date(c.created_at) > new Date(Date.now() - 7*24*60*60*1000)).length
  const totalUsuarios = usuarios.length
  const usuariosEstaSemana = usuarios.filter(u => new Date(u.created_at) > new Date(Date.now() - 7*24*60*60*1000)).length
  const totalInvitados = invitados.length
  const totalRsvps = rsvps.length
  const rsvpVan = rsvps.filter(r => r.asistencia === 'si').length
  const porTipo: Record<string, number> = {}
  celebraciones.forEach(c => { porTipo[c.tipo] = (porTipo[c.tipo] || 0) + 1 })
  const celebracionesFiltradas = busqueda.trim()
    ? celebraciones.filter(c => (c.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) || (c.slug || '').toLowerCase().includes(busqueda.toLowerCase()))
    : celebraciones

  // Crecimiento diario (últimos 14 días)
  const DIAS = 14
  const dias = Array.from({ length: DIAS }, (_, i) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (DIAS - 1 - i))
    return d
  })
  const contarPorDia = (items: any[]) => dias.map(d => {
    const siguiente = new Date(d); siguiente.setDate(d.getDate() + 1)
    return items.filter(it => {
      const f = new Date(it.created_at)
      return f >= d && f < siguiente
    }).length
  })
  const usuariosPorDia = contarPorDia(usuarios)
  const celsPorDia = contarPorDia(celebraciones)
  const maxDia = Math.max(...usuariosPorDia, ...celsPorDia, 1)

  // Semana vs. semana pasada (no solo "esta semana" suelto)
  const hace7 = new Date(Date.now() - 7*24*60*60*1000)
  const hace14 = new Date(Date.now() - 14*24*60*60*1000)
  const usuariosSemanaAnterior = usuarios.filter(u => new Date(u.created_at) >= hace14 && new Date(u.created_at) < hace7).length
  const celsSemanaAnterior = celebraciones.filter(c => new Date(c.created_at) >= hace14 && new Date(c.created_at) < hace7).length
  const diffPct = (actual: number, anterior: number) => {
    if (anterior === 0) return actual > 0 ? '+100%' : '0%'
    const pct = Math.round(((actual - anterior) / anterior) * 100)
    return `${pct >= 0 ? '+' : ''}${pct}%`
  }

  // Pro vs Lifetime, con ingreso estimado (conteo × precio — el número exacto en vivo de
  // Stripe ya llega en el reporte semanal por correo, aquí es solo para ver la mezcla rápido)
  const celsPro = celebraciones.filter(c => c.plan === 'pro').length
  const usuariosLifetime = usuarios.filter(u => u.plan === 'lifetime').length
  const ingresoEstimado = celsPro * 9 + usuariosLifetime * 49

  // Cuentas que se registraron y nunca crearon una celebración
  const usuariosSinCelebraciones = usuarios.filter(u => !celebraciones.some(c => c.organizador_id === u.user_id)).length

  // Embudo de conversión (últimos 90 días, de la tabla eventos_analytics)
  const contarTipo = (tipo: string) => eventos.filter(e => e.tipo === tipo).length
  const visitantesUnicos = new Set(eventos.filter(e => e.tipo === 'visita').map(e => e.session_id).filter(Boolean)).size
  const pasos = [
    { label: 'Visitantes únicos', value: visitantesUnicos },
    { label: 'Registros completados', value: contarTipo('registro_completado') },
    { label: 'Celebraciones creadas', value: contarTipo('celebracion_creada') },
    { label: 'Invitados agregados', value: contarTipo('invitado_agregado') },
    { label: 'RSVPs confirmados', value: contarTipo('rsvp_confirmado') },
    { label: 'Checkouts iniciados', value: contarTipo('checkout_iniciado') },
    { label: 'Compras completadas', value: contarTipo('compra_completada') },
  ]
  const maxPaso = Math.max(...pasos.map(p => p.value), 1)

  // Fuentes de tráfico (utm_source de las visitas, últimos 90 días)
  const visitas = eventos.filter(e => e.tipo === 'visita')
  const porFuente: Record<string, number> = {}
  visitas.forEach(v => { const f = v.utm_source || (v.referrer ? 'referral' : 'directo'); porFuente[f] = (porFuente[f] || 0) + 1 })
  const fuentesOrdenadas = Object.entries(porFuente).sort((a, b) => b[1] - a[1])
  const totalVisitas = visitas.length

  // Horas pico de actividad (registros + celebraciones creadas, agrupado por hora del día)
  const porHora = Array(24).fill(0)
  ;[...usuarios, ...celebraciones].forEach(it => { porHora[new Date(it.created_at).getHours()]++ })
  const maxHora = Math.max(...porHora, 1)
  const horaPico = porHora.indexOf(maxHora)

  const stat = (label: string, value: string | number, sub?: string, color = '#a89df0') => (
    <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:16, padding:'18px 20px' }}>
      <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:32, fontWeight:900, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:'rgba(255,255,255,.3)', marginTop:4 }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#0d0b1a', fontFamily:F, color:'#fff' }}>
      {/* Header */}
      <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ fontSize:18, fontWeight:900, background:'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Cheers</div>
          <div style={{ fontSize:11, fontWeight:700, color:'#f08cb0', background:'rgba(212,83,126,.15)', padding:'3px 10px', borderRadius:99, letterSpacing:'.5px' }}>ADMIN</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>Actualizado: {ultimaActualizacion.toLocaleTimeString()}</span>
          <button onClick={cargarDatos} style={{ border:'1px solid rgba(255,255,255,.1)', background:'none', color:'rgba(255,255,255,.5)', fontSize:12, fontWeight:700, padding:'6px 12px', borderRadius:8, cursor:'pointer', fontFamily:F }}>↻ Refresh</button>
          <button onClick={() => router.push('/')} style={{ border:'none', background:'rgba(255,255,255,.06)', color:'rgba(255,255,255,.4)', fontSize:12, fontWeight:700, padding:'6px 12px', borderRadius:8, cursor:'pointer', fontFamily:F }}>← Inicio</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding:'16px 24px 0', display:'flex', gap:8 }}>
        {(['qa', 'admin', 'embudo'] as Vista[]).map(v => (
          <button key={v} onClick={() => setVista(v)} style={{ border:'none', background:vista===v?'rgba(168,157,240,.2)':'transparent', color:vista===v?'#a89df0':'rgba(255,255,255,.4)', fontSize:14, fontWeight:700, padding:'8px 18px', borderRadius:10, cursor:'pointer', fontFamily:F, borderBottom:vista===v?'2px solid #a89df0':'2px solid transparent' }}>
            {v === 'qa' ? '🧪 QA / Pruebas' : v === 'admin' ? '📊 Métricas' : '🔻 Embudo'}
          </button>
        ))}
      </div>

      <div style={{ padding:'24px' }}>

        {/* VISTA QA */}
        {vista === 'qa' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:24 }}>
              {stat('Celebraciones', totalCels, `+${celsEstaSeamana} esta semana`)}
              {stat('Usuarios', totalUsuarios, `+${usuariosEstaSemana} esta semana`, '#f08cb0')}
              {stat('Invitados', totalInvitados, 'total agregados', '#4ade80')}
              {stat('RSVPs', totalRsvps, `${rsvpVan} confirmaron ir`, '#60a5fa')}
            </div>

            <div style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,.6)', marginBottom:12, textTransform:'uppercase', letterSpacing:'.5px' }}>
              Todas las celebraciones ({celebracionesFiltradas.length}{busqueda ? ` de ${celebraciones.length}` : ''})
            </div>

            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o slug..."
              style={{ width:'100%', boxSizing:'border-box', border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.04)', color:'#fff', fontFamily:F, fontSize:14, padding:'10px 14px', borderRadius:10, outline:'none', marginBottom:16 }}
            />

            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {celebracionesFiltradas.map(cel => {
                const invCel = invitados.filter(i => i.celebracion_slug === cel.slug)
                const rsvpCel = rsvps.filter(r => r.celebracion_slug === cel.slug)
                const checks = [
                  { ok: !!cel.portada_url, label: 'foto' },
                  { ok: !!cel.fecha, label: 'fecha' },
                  { ok: invCel.length > 0, label: 'invitados' },
                  { ok: rsvpCel.length > 0, label: 'rsvps' },
                ]
                return (
                  <div key={cel.slug} style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:200 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:2 }}>{cel.nombre || 'Sin título'}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', fontFamily:'monospace' }}>{cel.slug}</div>
                    </div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {checks.map(c => (
                        <span key={c.label} style={{ fontSize:11, fontWeight:700, color:c.ok?'#4ade80':'rgba(255,255,255,.25)', background:c.ok?'rgba(74,222,128,.1)':'rgba(255,255,255,.04)', padding:'3px 8px', borderRadius:6 }}>
                          {c.ok?'✓':' '} {c.label}
                        </span>
                      ))}
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                      <span style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>{new Date(cel.created_at).toLocaleDateString('es-MX')}</span>
                      <a href={`/${cel.slug}`} target="_blank" rel="noreferrer" style={{ fontSize:12, fontWeight:700, color:'#a89df0', background:'rgba(168,157,240,.1)', padding:'5px 10px', borderRadius:8, textDecoration:'none' }}>Ver →</a>
                      <button onClick={() => borrarCelebracion(cel.slug)} style={{ fontSize:12, fontWeight:700, color:'#f08cb0', background:'rgba(212,83,126,.1)', padding:'5px 10px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:F }}>Borrar</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* VISTA ADMIN MÉTRICAS */}
        {vista === 'admin' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:16 }}>
              {stat('Usuarios totales', totalUsuarios, `${usuariosEstaSemana} esta semana (${diffPct(usuariosEstaSemana, usuariosSemanaAnterior)} vs. anterior)`)}
              {stat('Celebraciones totales', totalCels, `${celsEstaSeamana} esta semana (${diffPct(celsEstaSeamana, celsSemanaAnterior)} vs. anterior)`, '#f08cb0')}
              {stat('Ingreso estimado', `$${ingresoEstimado}`, `${celsPro} Super Cheer · ${usuariosLifetime} Extra Cheer`, '#4ade80')}
              {stat('Se registraron y no hicieron nada', usuariosSinCelebraciones, `de ${totalUsuarios} cuentas`, '#60a5fa')}
            </div>

            <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'20px', marginBottom:24 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,.6)', marginBottom:16, textTransform:'uppercase', letterSpacing:'.5px' }}>Hora pico de actividad</div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:70 }}>
                {porHora.map((v, h) => (
                  <div key={h} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, height:'100%', justifyContent:'flex-end' }} title={`${h}:00 — ${v}`}>
                    <div style={{ width:'100%', height:`${(v/maxHora)*100}%`, minHeight:v>0?2:0, background: h===horaPico ? '#f08cb0' : '#a89df0', borderRadius:2 }} />
                    {h % 3 === 0 && <span style={{ fontSize:8, color:'rgba(255,255,255,.3)' }}>{h}h</span>}
                  </div>
                ))}
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginTop:8 }}>Pico: {horaPico}:00–{horaPico+1}:00 hrs</div>
            </div>

            {/* Crecimiento diario */}
            <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'20px', marginBottom:24 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,.6)', marginBottom:4, textTransform:'uppercase', letterSpacing:'.5px' }}>Crecimiento (últimos 14 días)</div>
              <div style={{ display:'flex', gap:12, marginBottom:16 }}>
                <span style={{ fontSize:11, color:'#a89df0' }}>■ Usuarios nuevos</span>
                <span style={{ fontSize:11, color:'#f08cb0' }}>■ Celebraciones nuevas</span>
              </div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:100 }}>
                {dias.map((d, i) => (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, height:'100%', justifyContent:'flex-end' }} title={d.toLocaleDateString('es-MX')}>
                    <div style={{ display:'flex', alignItems:'flex-end', gap:1, height:'100%' }}>
                      <div style={{ width:6, height:`${(usuariosPorDia[i]/maxDia)*100}%`, minHeight:usuariosPorDia[i]>0?2:0, background:'#a89df0', borderRadius:2 }} />
                      <div style={{ width:6, height:`${(celsPorDia[i]/maxDia)*100}%`, minHeight:celsPorDia[i]>0?2:0, background:'#f08cb0', borderRadius:2 }} />
                    </div>
                    <span style={{ fontSize:9, color:'rgba(255,255,255,.3)' }}>{d.getDate()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Por tipo */}
            <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'20px', marginBottom:24 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,.6)', marginBottom:16, textTransform:'uppercase', letterSpacing:'.5px' }}>Por tipo de celebración</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {Object.entries(porTipo).sort((a,b) => b[1]-a[1]).map(([tipo, count]) => (
                  <div key={tipo} style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ width:60, fontSize:12, fontWeight:700, color:'rgba(255,255,255,.5)', textTransform:'uppercase' }}>{tipo}</span>
                    <div style={{ flex:1, height:8, background:'rgba(255,255,255,.06)', borderRadius:99, overflow:'hidden' }}>
                      <div style={{ width:`${(count/totalCels)*100}%`, height:'100%', background:'linear-gradient(90deg,#534AB7,#D4537E)', borderRadius:99 }} />
                    </div>
                    <span style={{ fontSize:14, fontWeight:800, color:'#a89df0', minWidth:24, textAlign:'right' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Usuarios recientes */}
            <div style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,.6)', marginBottom:12, textTransform:'uppercase', letterSpacing:'.5px' }}>
              Usuarios recientes
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {usuarios.slice(0, 20).map(u => (
                <div key={u.id} style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#534AB7,#D4537E)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:13, fontWeight:800, color:'#fff' }}>{(u.username || '?')[0].toUpperCase()}</span>
                  </div>
                  <div style={{ flex:1, minWidth:120 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>@{u.username}</div>
                    {u.nombre_completo && <div style={{ fontSize:11, color:'rgba(255,255,255,.4)' }}>{u.nombre_completo}</div>}
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <select value={u.plan || 'free'} onChange={e => cambiarPlan(u.user_id, e.target.value)} style={{ fontSize:11, fontWeight:700, color:u.plan==='lifetime'?'#f08cb0':u.plan==='pro'?'#a89df0':'rgba(255,255,255,.6)', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', borderRadius:6, padding:'3px 6px', textTransform:'uppercase', cursor:'pointer', fontFamily:F }}>
                      <option value="free">Cheer</option>
                      <option value="pro">Super Cheer</option>
                      <option value="lifetime">Extra Cheer</option>
                    </select>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>{new Date(u.created_at).toLocaleDateString('es-MX')}</span>
                    <a href={`/${u.username}`} target="_blank" rel="noreferrer" style={{ fontSize:11, fontWeight:700, color:'#a89df0', background:'rgba(168,157,240,.1)', padding:'4px 8px', borderRadius:6, textDecoration:'none' }}>Ver</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA EMBUDO */}
        {vista === 'embudo' && (
          <div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.35)', marginBottom:20 }}>
              Últimos 90 días · datos propios de Cheers (tabla eventos_analytics), sin herramientas externas.
            </div>

            {/* Embudo de conversión */}
            <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'20px', marginBottom:24 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,.6)', marginBottom:16, textTransform:'uppercase', letterSpacing:'.5px' }}>Embudo de conversión</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {pasos.map((p, i) => {
                  const anterior = i > 0 ? pasos[i-1].value : null
                  const pct = anterior && anterior > 0 ? Math.round((p.value / anterior) * 100) : null
                  return (
                    <div key={p.label} style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ width:170, fontSize:12, fontWeight:700, color:'rgba(255,255,255,.55)' }}>{p.label}</span>
                      <div style={{ flex:1, height:20, background:'rgba(255,255,255,.06)', borderRadius:8, overflow:'hidden' }}>
                        <div style={{ width:`${(p.value/maxPaso)*100}%`, height:'100%', background:'linear-gradient(90deg,#534AB7,#D4537E)', borderRadius:8, minWidth:p.value>0?4:0 }} />
                      </div>
                      <span style={{ fontSize:14, fontWeight:800, color:'#a89df0', minWidth:40, textAlign:'right' }}>{p.value}</span>
                      <span style={{ fontSize:11, fontWeight:700, color: pct===null?'transparent':pct>=50?'#4ade80':pct>=20?'#f5c04e':'#f08cb0', minWidth:44, textAlign:'right' }}>{pct===null?'—':`${pct}%`}</span>
                    </div>
                  )
                })}
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:12 }}>El % es contra el paso anterior, no contra el total de visitantes.</div>
            </div>

            {/* Fuentes de tráfico */}
            <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'20px', marginBottom:24 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,.6)', marginBottom:16, textTransform:'uppercase', letterSpacing:'.5px' }}>Fuentes de tráfico ({totalVisitas} visitas)</div>
              {fuentesOrdenadas.length === 0 ? (
                <div style={{ fontSize:13, color:'rgba(255,255,255,.35)' }}>Todavía no hay visitas registradas.</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {fuentesOrdenadas.map(([fuente, count]) => (
                    <div key={fuente} style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ width:100, fontSize:12, fontWeight:700, color:'rgba(255,255,255,.5)' }}>{fuente}</span>
                      <div style={{ flex:1, height:8, background:'rgba(255,255,255,.06)', borderRadius:99, overflow:'hidden' }}>
                        <div style={{ width:`${(count/totalVisitas)*100}%`, height:'100%', background:'linear-gradient(90deg,#534AB7,#D4537E)', borderRadius:99 }} />
                      </div>
                      <span style={{ fontSize:14, fontWeight:800, color:'#a89df0', minWidth:24, textAlign:'right' }}>{count}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:12 }}>"directo" = sin utm_source y sin referrer (llegó escribiendo la URL o desde una app que no lo manda, como suele pasar en Instagram). "referral" = llegó de otro sitio pero sin utm_source.</div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
