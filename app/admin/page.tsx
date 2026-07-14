'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const ADMIN_EMAIL = 'patty.eugenia@gmail.com'

type Vista = 'qa' | 'admin'

export default function Admin() {
  const router = useRouter()
  const [cargando, setCargando] = useState(true)
  const [vista, setVista] = useState<Vista>('qa')
  const [celebraciones, setCelebraciones] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [rsvps, setRsvps] = useState<any[]>([])
  const [invitados, setInvitados] = useState<any[]>([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date())
  const [busqueda, setBusqueda] = useState('')

  const cargarDatos = useCallback(async () => {
    const [{ data: cels }, { data: users }, { data: rsvpData }, { data: invData }] = await Promise.all([
      supabase.from('celebraciones').select('*').order('created_at', { ascending: false }),
      supabase.from('perfiles').select('*').order('created_at', { ascending: false }),
      supabase.from('rsvps').select('*').order('created_at', { ascending: false }),
      supabase.from('invitados').select('*').order('created_at', { ascending: false }),
    ])
    setCelebraciones(cels || [])
    setUsuarios(users || [])
    setRsvps(rsvpData || [])
    setInvitados(invData || [])
    setUltimaActualizacion(new Date())
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/')
        return
      }
      cargarDatos().then(() => setCargando(false))
    })
  }, [])

  // Tiempo real — actualizar cada 30s
  useEffect(() => {
    const interval = setInterval(cargarDatos, 30000)
    return () => clearInterval(interval)
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
        {(['qa', 'admin'] as Vista[]).map(v => (
          <button key={v} onClick={() => setVista(v)} style={{ border:'none', background:vista===v?'rgba(168,157,240,.2)':'transparent', color:vista===v?'#a89df0':'rgba(255,255,255,.4)', fontSize:14, fontWeight:700, padding:'8px 18px', borderRadius:10, cursor:'pointer', fontFamily:F, borderBottom:vista===v?'2px solid #a89df0':'2px solid transparent' }}>
            {v === 'qa' ? '🧪 QA / Pruebas' : '📊 Métricas'}
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
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:32 }}>
              {stat('Usuarios totales', totalUsuarios, `+${usuariosEstaSemana} esta semana`)}
              {stat('Celebraciones', totalCels, `+${celsEstaSeamana} esta semana`, '#f08cb0')}
              {stat('Invitados', totalInvitados, 'en todas las cels', '#4ade80')}
              {stat('RSVPs', totalRsvps, `${Math.round(rsvpVan/Math.max(totalRsvps,1)*100)}% confirman ir`, '#60a5fa')}
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
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>{new Date(u.created_at).toLocaleDateString('es-MX')}</span>
                    <a href={`/${u.username}`} target="_blank" rel="noreferrer" style={{ fontSize:11, fontWeight:700, color:'#a89df0', background:'rgba(168,157,240,.1)', padding:'4px 8px', borderRadius:6, textDecoration:'none' }}>Ver</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}