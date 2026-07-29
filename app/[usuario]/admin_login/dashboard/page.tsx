'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../supabase'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const ADMIN_EMAIL = 'patty.eugenia@gmail.com'

type Vista = 'qa' | 'admin' | 'embudo' | 'crecimiento'

export default function Admin() {
  const router = useRouter()
  const [cargando, setCargando] = useState(true)
  const [vista, setVista] = useState<Vista>('qa')
  const [celebraciones, setCelebraciones] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [rsvps, setRsvps] = useState<any[]>([])
  const [invitados, setInvitados] = useState<any[]>([])
  const [eventos, setEventos] = useState<any[]>([])
  const [comprasReales, setComprasReales] = useState<any[]>([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date())
  const [busqueda, setBusqueda] = useState('')

  // Regalar Super Cheer / Extra Cheer por email, sin tener que pedírmelo
  const [regaloEmail, setRegaloEmail] = useState('')
  const [regaloTipo, setRegaloTipo] = useState<'pro' | 'lifetime'>('lifetime')
  const [regaloCargando, setRegaloCargando] = useState(false)
  const [regaloMensaje, setRegaloMensaje] = useState('')
  const [regaloOpciones, setRegaloOpciones] = useState<any[] | null>(null)

  // Borrar cuenta por moderación (abuso, bullying, etc.) — una por una, con preview y confirmación escrita
  const [moderarEmail, setModerarEmail] = useState('')
  const [moderarPreview, setModerarPreview] = useState<any | null>(null)
  const [moderarConfirmTexto, setModerarConfirmTexto] = useState('')
  const [moderarCargando, setModerarCargando] = useState(false)
  const [moderarMensaje, setModerarMensaje] = useState('')

  // Selección múltiple en la pestaña Crecimiento + acciones sobre lo seleccionado
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [accionActiva, setAccionActiva] = useState<'mensaje' | 'cortesia' | null>(null)
  const [msgAsunto, setMsgAsunto] = useState('')
  const [msgTexto, setMsgTexto] = useState('')
  const [msgCargando, setMsgCargando] = useState(false)
  const [msgResultado, setMsgResultado] = useState('')
  const [cortesiaTipoMasiva, setCortesiaTipoMasiva] = useState<'pro' | 'lifetime'>('lifetime')
  const [cortesiaCargando, setCortesiaCargando] = useState(false)
  const [cortesiaResultado, setCortesiaResultado] = useState('')

  function toggleSeleccion(uid: string) {
    setSeleccionados(prev => {
      const next = new Set(prev)
      if (next.has(uid)) next.delete(uid); else next.add(uid)
      return next
    })
  }

  const cargarDatos = useCallback(async () => {
    const [{ data: cels }, { data: users }, { data: rsvpData }, { data: invData }, { data: eventosData }, { data: comprasData }] = await Promise.all([
      supabase.from('celebraciones').select('*').order('created_at', { ascending: false }),
      supabase.from('perfiles').select('*').order('created_at', { ascending: false }),
      supabase.from('rsvps').select('*').order('created_at', { ascending: false }),
      supabase.from('invitados').select('*').order('created_at', { ascending: false }),
      // Últimos 90 días — suficiente para ver el embudo y las fuentes sin traer la tabla completa
      supabase.from('eventos_analytics').select('*').gte('created_at', new Date(Date.now() - 90*24*60*60*1000).toISOString()).order('created_at', { ascending: false }),
      // Compras reales: sin límite de fecha, son pocas filas y es el ingreso real acumulado
      supabase.from('eventos_analytics').select('metadata, created_at').eq('tipo', 'compra_completada'),
    ])
    setCelebraciones(cels || [])
    setUsuarios(users || [])
    setRsvps(rsvpData || [])
    setInvitados(invData || [])
    setEventos(eventosData || [])
    setComprasReales(comprasData || [])
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

  async function regalarPlan(slugElegido?: string) {
    if (!regaloEmail.trim()) return
    const nombrePlan = regaloTipo === 'lifetime' ? 'Extra Cheer' : 'Super Cheer'
    if (!confirm(`¿Dar ${nombrePlan} a ${regaloEmail.trim()}?`)) return
    setRegaloCargando(true)
    setRegaloMensaje('')
    setRegaloOpciones(null)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin-regalar-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: session?.access_token, email: regaloEmail.trim(), tipo: regaloTipo, slug: slugElegido }),
    })
    const data = await res.json()
    setRegaloCargando(false)
    if (data.ok) {
      setRegaloMensaje(`✓ Listo — ${regaloEmail.trim()} ya tiene ${nombrePlan}${data.celebracion ? ` (${data.celebracion})` : ''}.`)
      setRegaloEmail('')
      cargarDatos()
    } else if (data.error === 'elegir_celebracion') {
      setRegaloOpciones(data.celebraciones)
      setRegaloMensaje('Esa cuenta tiene más de una celebración activa — elige cuál:')
    } else if (data.error === 'no_encontrado') {
      setRegaloMensaje('No encontré ninguna cuenta con ese email.')
    } else if (data.error === 'sin_celebraciones') {
      setRegaloMensaje('Esa cuenta no tiene ninguna celebración activa para mejorar.')
    } else {
      setRegaloMensaje('Algo falló, intenta de nuevo.')
    }
  }

  async function buscarParaModerar() {
    if (!moderarEmail.trim()) return
    setModerarCargando(true)
    setModerarMensaje('')
    setModerarPreview(null)
    setModerarConfirmTexto('')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin-borrar-usuario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: session?.access_token, email: moderarEmail.trim() }),
    })
    const data = await res.json()
    setModerarCargando(false)
    if (data.ok && data.preview) setModerarPreview(data.preview)
    else if (data.error === 'no_encontrado') setModerarMensaje('No encontré ninguna cuenta con ese email.')
    else setModerarMensaje('Algo falló, intenta de nuevo.')
  }

  async function confirmarBorrarModeracion() {
    if (moderarConfirmTexto !== 'BORRAR') return
    setModerarCargando(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin-borrar-usuario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: session?.access_token, email: moderarEmail.trim(), confirmar: true }),
    })
    const data = await res.json()
    setModerarCargando(false)
    if (data.ok) {
      setModerarMensaje(`✓ Cuenta de ${moderarEmail.trim()} borrada.`)
      setModerarPreview(null)
      setModerarEmail('')
      setModerarConfirmTexto('')
      cargarDatos()
    } else {
      setModerarMensaje('Algo falló al borrar, intenta de nuevo.')
    }
  }

  async function enviarMensajeMasivo() {
    if (!msgTexto.trim() || seleccionados.size === 0) return
    if (!confirm(`¿Mandar este mensaje a ${seleccionados.size} persona${seleccionados.size > 1 ? 's' : ''}?`)) return
    setMsgCargando(true)
    setMsgResultado('')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin-mensaje-masivo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: session?.access_token, userIds: Array.from(seleccionados), asunto: msgAsunto, mensaje: msgTexto }),
    })
    const data = await res.json()
    setMsgCargando(false)
    if (data.ok) {
      setMsgResultado(`✓ Enviado a ${data.enviados} de ${seleccionados.size}.`)
      setMsgTexto(''); setMsgAsunto('')
    } else {
      setMsgResultado('Algo falló, intenta de nuevo.')
    }
  }

  async function aplicarCortesiaMasiva() {
    if (seleccionados.size === 0) return
    const nombrePlan = cortesiaTipoMasiva === 'lifetime' ? 'Extra Cheer' : 'Super Cheer'
    if (!confirm(`¿Dar ${nombrePlan} a ${seleccionados.size} persona${seleccionados.size > 1 ? 's' : ''}?`)) return
    setCortesiaCargando(true)
    setCortesiaResultado('')
    const { data: { session } } = await supabase.auth.getSession()
    let ok = 0, fallo = 0
    for (const uid of Array.from(seleccionados)) {
      const res = await fetch('/api/admin-regalar-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: session?.access_token, userId: uid, tipo: cortesiaTipoMasiva }),
      })
      const data = await res.json()
      if (data.ok) ok++; else fallo++
    }
    setCortesiaCargando(false)
    setCortesiaResultado(`✓ Aplicado a ${ok}${fallo ? `, ${fallo} sin poder aplicar (revisa si tienen celebración activa o más de una)` : ''}.`)
    cargarDatos()
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

  // Ingreso real: solo cuenta lo que de verdad pasó por Stripe (evento compra_completada,
  // que el webhook dispara nada más cuando el pago se confirma). El "estimado" de arriba
  // cuenta planes activos sin importar si se pagaron o se regalaron (ej. cortesías, o el
  // botón de "Regalar plan"), así que ya no son el mismo número — por diseño.
  const ingresoReal = comprasReales.reduce((sum, c) => sum + (c.metadata?.tipo === 'lifetime' ? 49 : 9), 0)

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

  // Páginas más visitadas + sesiones únicas por página (para distinguir "muchos refrescos
  // de la misma persona" de "mucha gente distinta pasando por ahí")
  const porRuta: Record<string, { vistas: number; sesiones: Set<string> }> = {}
  visitas.forEach(v => {
    const r = v.ruta || '(desconocida)'
    if (!porRuta[r]) porRuta[r] = { vistas: 0, sesiones: new Set() }
    porRuta[r].vistas++
    if (v.session_id) porRuta[r].sesiones.add(v.session_id)
  })
  const rutasOrdenadas = Object.entries(porRuta).sort((a, b) => b[1].vistas - a[1].vistas)

  // Crecimiento — top usuarios y quiénes valen un mensaje personal tuyo
  const celsPorUsuario: Record<string, number> = {}
  celebraciones.forEach(c => { celsPorUsuario[c.organizador_id] = (celsPorUsuario[c.organizador_id] || 0) + 1 })
  const topCreadores = Object.entries(celsPorUsuario)
    .map(([uid, count]) => ({ usuario: usuarios.find(u => u.user_id === uid), count }))
    .filter((x): x is { usuario: any; count: number } => !!x.usuario)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Invitados CON cuenta real (user_id no nulo) — mide a quién le está funcionando
  // esto como forma de traer gente nueva a Cheers, no solo mandar invitaciones
  const invitadosConCuentaPorUsuario: Record<string, number> = {}
  invitados.forEach(inv => {
    if (!inv.user_id) return
    const cel = celebraciones.find(c => c.slug === inv.celebracion_slug)
    if (!cel) return
    invitadosConCuentaPorUsuario[cel.organizador_id] = (invitadosConCuentaPorUsuario[cel.organizador_id] || 0) + 1
  })
  const topInvitadores = Object.entries(invitadosConCuentaPorUsuario)
    .map(([uid, count]) => ({ usuario: usuarios.find(u => u.user_id === uid), count }))
    .filter((x): x is { usuario: any; count: number } => !!x.usuario)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const usuariosNuncaUsaron = usuarios.filter(u => !celebraciones.some(c => c.organizador_id === u.user_id))

  // Se enfriaron: crearon algo, pero su celebración más reciente ya tiene 30+ días —
  // a diferencia de "nunca usaron", estos ya mostraron interés real, valen un mensaje directo
  const ultimaActividadPorUsuario: Record<string, Date> = {}
  celebraciones.forEach(c => {
    const f = new Date(c.created_at)
    if (!ultimaActividadPorUsuario[c.organizador_id] || f > ultimaActividadPorUsuario[c.organizador_id]) {
      ultimaActividadPorUsuario[c.organizador_id] = f
    }
  })
  const hace30d = new Date(Date.now() - 30*24*60*60*1000)
  const usuariosEnfriados = usuarios
    .filter(u => ultimaActividadPorUsuario[u.user_id] && ultimaActividadPorUsuario[u.user_id] < hace30d)
    .sort((a, b) => ultimaActividadPorUsuario[b.user_id].getTime() - ultimaActividadPorUsuario[a.user_id].getTime())

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
        {(['qa', 'admin', 'embudo', 'crecimiento'] as Vista[]).map(v => (
          <button key={v} onClick={() => setVista(v)} style={{ border:'none', background:vista===v?'rgba(168,157,240,.2)':'transparent', color:vista===v?'#a89df0':'rgba(255,255,255,.4)', fontSize:14, fontWeight:700, padding:'8px 18px', borderRadius:10, cursor:'pointer', fontFamily:F, borderBottom:vista===v?'2px solid #a89df0':'2px solid transparent' }}>
            {v === 'qa' ? '🧪 QA / Pruebas' : v === 'admin' ? '📊 Métricas' : v === 'embudo' ? '🔻 Embudo' : '🚀 Crecimiento'}
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

            {/* Salud de datos — conteos nada más, sin mostrar cuáles son, para no
                andar viendo el detalle de celebraciones de nadie sin una razón real */}
            <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'20px', marginBottom:24 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,.6)', marginBottom:16, textTransform:'uppercase', letterSpacing:'.5px' }}>Salud de datos</div>
              <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
                {[
                  { label:'sin foto', count: celebraciones.filter(c => !c.portada_url).length },
                  { label:'sin fecha', count: celebraciones.filter(c => !c.fecha).length },
                  { label:'sin invitados', count: celebraciones.filter(c => !invitados.some(i => i.celebracion_slug === c.slug)).length },
                  { label:'sin rsvps', count: celebraciones.filter(c => !rsvps.some(r => r.celebracion_slug === c.slug)).length },
                ].map(x => (
                  <div key={x.label}>
                    <div style={{ fontSize:22, fontWeight:900, color: x.count>0?'#f08cb0':'#4ade80' }}>{x.count}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,.4)' }}>{x.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,.6)', marginBottom:12, textTransform:'uppercase', letterSpacing:'.5px' }}>
              Buscar una celebración
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.35)', marginBottom:12 }}>
              Por privacidad, aquí ya no se lista todo de entrada — busca por nombre o slug solo cuando tengas una razón real (soporte, reporte, limpieza de spam).
            </div>

            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o slug..."
              style={{ width:'100%', boxSizing:'border-box', border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.04)', color:'#fff', fontFamily:F, fontSize:14, padding:'10px 14px', borderRadius:10, outline:'none', marginBottom:16 }}
            />

            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {busqueda.trim() && celebracionesFiltradas.length === 0 && (
                <div style={{ fontSize:13, color:'rgba(255,255,255,.35)' }}>Sin resultados para "{busqueda}".</div>
              )}
              {busqueda.trim() && celebracionesFiltradas.map(cel => {
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
            {/* Regalar plan */}
            <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'20px', marginBottom:24 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,.6)', marginBottom:16, textTransform:'uppercase', letterSpacing:'.5px' }}>Regalar plan</div>
              <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                {(['pro', 'lifetime'] as const).map(t => (
                  <button key={t} onClick={() => setRegaloTipo(t)} style={{ flex:1, border:'1px solid rgba(255,255,255,.12)', background:regaloTipo===t?'linear-gradient(135deg,#534AB7,#D4537E)':'rgba(255,255,255,.04)', color:'#fff', fontSize:13, fontWeight:800, padding:'10px', borderRadius:10, cursor:'pointer', fontFamily:F }}>
                    {t === 'pro' ? 'Super Cheer' : 'Extra Cheer'}
                  </button>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <input
                  value={regaloEmail}
                  onChange={e => setRegaloEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && regalarPlan()}
                  placeholder="email@ejemplo.com"
                  style={{ flex:1, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.04)', color:'#fff', fontFamily:F, fontSize:14, padding:'10px 14px', borderRadius:10, outline:'none' }}
                />
                <button onClick={() => regalarPlan()} disabled={regaloCargando || !regaloEmail.trim()} style={{ border:'none', background:'linear-gradient(135deg,#534AB7,#D4537E)', color:'#fff', fontSize:13, fontWeight:800, padding:'10px 20px', borderRadius:10, cursor:regaloCargando||!regaloEmail.trim()?'default':'pointer', opacity:regaloCargando||!regaloEmail.trim()?0.5:1, fontFamily:F }}>
                  {regaloCargando ? '...' : 'Regalar'}
                </button>
              </div>
              {regaloMensaje && <div style={{ fontSize:13, color:'rgba(255,255,255,.7)', marginTop:12 }}>{regaloMensaje}</div>}
              {regaloOpciones && (
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:10 }}>
                  {regaloOpciones.map(c => (
                    <button key={c.slug} onClick={() => regalarPlan(c.slug)} style={{ textAlign:'left', border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)', color:'#fff', fontSize:13, fontWeight:600, padding:'8px 12px', borderRadius:8, cursor:'pointer', fontFamily:F }}>
                      {c.nombre || 'Sin título'} <span style={{ color:'rgba(255,255,255,.4)', fontFamily:'monospace', fontSize:11 }}>({c.slug})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Borrar cuenta por moderación */}
            <div style={{ background:'rgba(212,83,126,.05)', border:'1px solid rgba(212,83,126,.2)', borderRadius:16, padding:'20px', marginBottom:24 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'#f08cb0', marginBottom:6, textTransform:'uppercase', letterSpacing:'.5px' }}>Borrar cuenta (moderación)</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginBottom:16 }}>Para casos de abuso o bullying — borra la cuenta, sus celebraciones y todo lo asociado. No se puede deshacer.</div>
              <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                <input
                  value={moderarEmail}
                  onChange={e => { setModerarEmail(e.target.value); setModerarPreview(null); setModerarMensaje('') }}
                  onKeyDown={e => e.key === 'Enter' && buscarParaModerar()}
                  placeholder="email@ejemplo.com"
                  style={{ flex:1, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.04)', color:'#fff', fontFamily:F, fontSize:14, padding:'10px 14px', borderRadius:10, outline:'none' }}
                />
                <button onClick={buscarParaModerar} disabled={moderarCargando || !moderarEmail.trim()} style={{ border:'1px solid rgba(255,255,255,.15)', background:'rgba(255,255,255,.06)', color:'#fff', fontSize:13, fontWeight:800, padding:'10px 20px', borderRadius:10, cursor:moderarCargando||!moderarEmail.trim()?'default':'pointer', opacity:moderarCargando||!moderarEmail.trim()?0.5:1, fontFamily:F }}>
                  Buscar
                </button>
              </div>

              {moderarPreview && (
                <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:12, padding:'14px 16px', marginBottom:12 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:4 }}>@{moderarPreview.username || '(sin username)'}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', marginBottom:12 }}>
                    {moderarPreview.celebraciones} celebracion{moderarPreview.celebraciones !== 1 ? 'es' : ''} · registrada {moderarPreview.creado ? new Date(moderarPreview.creado).toLocaleDateString('es-MX') : '—'}
                  </div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,.6)', marginBottom:8 }}>Escribe <strong>BORRAR</strong> para confirmar:</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <input
                      value={moderarConfirmTexto}
                      onChange={e => setModerarConfirmTexto(e.target.value)}
                      placeholder="BORRAR"
                      style={{ flex:1, border:'1px solid rgba(212,83,126,.3)', background:'rgba(255,255,255,.04)', color:'#fff', fontFamily:F, fontSize:14, padding:'10px 14px', borderRadius:10, outline:'none' }}
                    />
                    <button onClick={confirmarBorrarModeracion} disabled={moderarConfirmTexto !== 'BORRAR' || moderarCargando} style={{ border:'none', background:'#D4537E', color:'#fff', fontSize:13, fontWeight:800, padding:'10px 20px', borderRadius:10, cursor:moderarConfirmTexto==='BORRAR'&&!moderarCargando?'pointer':'default', opacity:moderarConfirmTexto==='BORRAR'&&!moderarCargando?1:0.4, fontFamily:F }}>
                      Borrar cuenta
                    </button>
                  </div>
                </div>
              )}
              {moderarMensaje && <div style={{ fontSize:13, color:'rgba(255,255,255,.7)' }}>{moderarMensaje}</div>}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:16 }}>
              {stat('Usuarios totales', totalUsuarios, `${usuariosEstaSemana} esta semana (${diffPct(usuariosEstaSemana, usuariosSemanaAnterior)} vs. anterior)`)}
              {stat('Celebraciones totales', totalCels, `${celsEstaSeamana} esta semana (${diffPct(celsEstaSeamana, celsSemanaAnterior)} vs. anterior)`, '#f08cb0')}
              {stat('Ingreso real', `$${ingresoReal}`, `${comprasReales.length} compras confirmadas en Stripe`, '#4ade80')}
              {stat('Ingreso estimado', `$${ingresoEstimado}`, `${celsPro} Super Cheer · ${usuariosLifetime} Extra Cheer (incluye regalados)`, '#a89df0')}
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

            {/* Páginas más visitadas */}
            <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'20px', marginBottom:24 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,.6)', marginBottom:16, textTransform:'uppercase', letterSpacing:'.5px' }}>Páginas más visitadas ({totalVisitas} visitas)</div>
              {rutasOrdenadas.length === 0 ? (
                <div style={{ fontSize:13, color:'rgba(255,255,255,.35)' }}>Todavía no hay visitas registradas.</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {rutasOrdenadas.map(([ruta, info]) => (
                    <div key={ruta} style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ width:180, fontSize:12, fontWeight:700, color:'rgba(255,255,255,.55)', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={ruta}>{ruta}</span>
                      <div style={{ flex:1, height:8, background:'rgba(255,255,255,.06)', borderRadius:99, overflow:'hidden' }}>
                        <div style={{ width:`${(info.vistas/totalVisitas)*100}%`, height:'100%', background:'linear-gradient(90deg,#534AB7,#D4537E)', borderRadius:99 }} />
                      </div>
                      <span style={{ fontSize:14, fontWeight:800, color:'#a89df0', minWidth:24, textAlign:'right' }}>{info.vistas}</span>
                      <span style={{ fontSize:11, color:'rgba(255,255,255,.35)', minWidth:70, textAlign:'right' }}>{info.sesiones.size} sesión{info.sesiones.size !== 1 ? 'es' : ''}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:12 }}>"Visitas" cuenta cada carga de página (recargar cuenta de nuevo). "Sesiones" son personas/pestañas distintas — si una página tiene muchas visitas pero pocas sesiones, es la misma persona recargando, no tráfico nuevo.</div>
            </div>
          </div>
        )}

        {/* VISTA CRECIMIENTO */}
        {vista === 'crecimiento' && (
          <div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.35)', marginBottom:20 }}>
              Quién está usando Cheers de verdad, quién lo está trayendo a más gente, y a quién vale la pena escribirle tú misma.
            </div>

            {/* Top creadores */}
            <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'20px', marginBottom:24 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,.6)', marginBottom:16, textTransform:'uppercase', letterSpacing:'.5px' }}>Top 10 — más celebraciones creadas</div>
              {topCreadores.length === 0 ? (
                <div style={{ fontSize:13, color:'rgba(255,255,255,.35)' }}>Todavía no hay suficientes datos.</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {topCreadores.map((x, i) => (
                    <div key={x.usuario.user_id} style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <input type="checkbox" checked={seleccionados.has(x.usuario.user_id)} onChange={() => toggleSeleccion(x.usuario.user_id)} style={{ width:16, height:16, cursor:'pointer', accentColor:'#D4537E' }} />
                      <span style={{ width:20, fontSize:12, fontWeight:800, color:'rgba(255,255,255,.3)' }}>{i+1}</span>
                      <span style={{ flex:1, fontSize:13, fontWeight:700, color:'#fff' }}>@{x.usuario.username}</span>
                      <span style={{ fontSize:14, fontWeight:800, color:'#a89df0' }}>{x.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top invitadores */}
            <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'20px', marginBottom:24 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,.6)', marginBottom:16, textTransform:'uppercase', letterSpacing:'.5px' }}>Top 10 — más gente con cuenta traída a Cheers</div>
              {topInvitadores.length === 0 ? (
                <div style={{ fontSize:13, color:'rgba(255,255,255,.35)' }}>Todavía no hay suficientes datos.</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {topInvitadores.map((x, i) => (
                    <div key={x.usuario.user_id} style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <input type="checkbox" checked={seleccionados.has(x.usuario.user_id)} onChange={() => toggleSeleccion(x.usuario.user_id)} style={{ width:16, height:16, cursor:'pointer', accentColor:'#D4537E' }} />
                      <span style={{ width:20, fontSize:12, fontWeight:800, color:'rgba(255,255,255,.3)' }}>{i+1}</span>
                      <span style={{ flex:1, fontSize:13, fontWeight:700, color:'#fff' }}>@{x.usuario.username}</span>
                      <span style={{ fontSize:14, fontWeight:800, color:'#f08cb0' }}>{x.count}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:12 }}>Cuenta invitados que ya tienen cuenta propia en Cheers (no solo invitaciones mandadas) — es la medida real de quién está trayendo gente nueva a la plataforma.</div>
            </div>

            {/* Se enfriaron */}
            <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'20px', marginBottom:24 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,.6)', marginBottom:16, textTransform:'uppercase', letterSpacing:'.5px' }}>Se enfriaron ({usuariosEnfriados.length})</div>
              {usuariosEnfriados.length === 0 ? (
                <div style={{ fontSize:13, color:'rgba(255,255,255,.35)' }}>Nadie en este caso todavía.</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {usuariosEnfriados.slice(0, 20).map(u => (
                    <div key={u.user_id} style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <input type="checkbox" checked={seleccionados.has(u.user_id)} onChange={() => toggleSeleccion(u.user_id)} style={{ width:16, height:16, cursor:'pointer', accentColor:'#D4537E' }} />
                      <span style={{ flex:1, fontSize:13, fontWeight:700, color:'#fff' }}>@{u.username}</span>
                      <span style={{ fontSize:12, color:'rgba(255,255,255,.4)' }}>última celebración: {ultimaActividadPorUsuario[u.user_id].toLocaleDateString('es-MX')}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:12 }}>Ya crearon algo, pero llevan 30+ días sin crear nada nuevo — a diferencia de los que nunca la usaron, estos ya mostraron interés real y son los más fáciles de recuperar con un mensaje tuyo.</div>
            </div>

            {/* Nunca usaron su cuenta */}
            <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'20px', marginBottom:24 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'rgba(255,255,255,.6)', marginBottom:16, textTransform:'uppercase', letterSpacing:'.5px' }}>Nunca han creado nada ({usuariosNuncaUsaron.length})</div>
              {usuariosNuncaUsaron.length === 0 ? (
                <div style={{ fontSize:13, color:'rgba(255,255,255,.35)' }}>Todos han creado al menos una celebración.</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {usuariosNuncaUsaron.slice(0, 20).map(u => (
                    <div key={u.user_id} style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <input type="checkbox" checked={seleccionados.has(u.user_id)} onChange={() => toggleSeleccion(u.user_id)} style={{ width:16, height:16, cursor:'pointer', accentColor:'#D4537E' }} />
                      <span style={{ flex:1, fontSize:13, fontWeight:700, color:'#fff' }}>@{u.username}</span>
                      <span style={{ fontSize:12, color:'rgba(255,255,255,.4)' }}>se registró: {new Date(u.created_at).toLocaleDateString('es-MX')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Barra de acciones sobre seleccionados */}
            {seleccionados.size > 0 && (
              <div style={{ position:'sticky', bottom:16, background:'#1a1740', border:'1px solid rgba(255,255,255,.15)', borderRadius:16, padding:'16px 20px', boxShadow:'0 16px 40px rgba(0,0,0,.4)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom: accionActiva ? 16 : 0, flexWrap:'wrap' }}>
                  <span style={{ fontSize:13, fontWeight:800, color:'#fff' }}>{seleccionados.size} seleccionado{seleccionados.size > 1 ? 's' : ''}</span>
                  <button onClick={() => setSeleccionados(new Set())} style={{ border:'none', background:'none', color:'rgba(255,255,255,.4)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:F }}>Quitar selección</button>
                  <div style={{ flex:1 }} />
                  <button onClick={() => setAccionActiva(accionActiva === 'mensaje' ? null : 'mensaje')} style={{ border:'1px solid rgba(255,255,255,.15)', background:accionActiva==='mensaje'?'rgba(168,157,240,.2)':'rgba(255,255,255,.06)', color:'#fff', fontSize:13, fontWeight:700, padding:'8px 16px', borderRadius:10, cursor:'pointer', fontFamily:F }}>✉️ Mensaje</button>
                  <button onClick={() => setAccionActiva(accionActiva === 'cortesia' ? null : 'cortesia')} style={{ border:'1px solid rgba(255,255,255,.15)', background:accionActiva==='cortesia'?'rgba(168,157,240,.2)':'rgba(255,255,255,.06)', color:'#fff', fontSize:13, fontWeight:700, padding:'8px 16px', borderRadius:10, cursor:'pointer', fontFamily:F }}>🎁 Cortesía</button>
                </div>

                {accionActiva === 'mensaje' && (
                  <div>
                    <input
                      value={msgAsunto}
                      onChange={e => setMsgAsunto(e.target.value)}
                      placeholder="Asunto (opcional)"
                      style={{ width:'100%', boxSizing:'border-box', border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.04)', color:'#fff', fontFamily:F, fontSize:14, padding:'10px 14px', borderRadius:10, outline:'none', marginBottom:8 }}
                    />
                    <textarea
                      value={msgTexto}
                      onChange={e => setMsgTexto(e.target.value)}
                      placeholder="Escribe tu mensaje... se manda con el mismo diseño de los demás correos de Cheers."
                      rows={5}
                      style={{ width:'100%', boxSizing:'border-box', border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.04)', color:'#fff', fontFamily:F, fontSize:14, padding:'10px 14px', borderRadius:10, outline:'none', marginBottom:8, resize:'vertical' }}
                    />
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <button onClick={enviarMensajeMasivo} disabled={msgCargando || !msgTexto.trim()} style={{ border:'none', background:'linear-gradient(135deg,#534AB7,#D4537E)', color:'#fff', fontSize:13, fontWeight:800, padding:'10px 20px', borderRadius:10, cursor:msgCargando||!msgTexto.trim()?'default':'pointer', opacity:msgCargando||!msgTexto.trim()?0.5:1, fontFamily:F }}>
                        {msgCargando ? 'Enviando...' : `Enviar a ${seleccionados.size}`}
                      </button>
                      {msgResultado && <span style={{ fontSize:13, color:'rgba(255,255,255,.7)' }}>{msgResultado}</span>}
                    </div>
                  </div>
                )}

                {accionActiva === 'cortesia' && (
                  <div>
                    <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                      {(['pro', 'lifetime'] as const).map(t => (
                        <button key={t} onClick={() => setCortesiaTipoMasiva(t)} style={{ flex:1, border:'1px solid rgba(255,255,255,.12)', background:cortesiaTipoMasiva===t?'linear-gradient(135deg,#534AB7,#D4537E)':'rgba(255,255,255,.04)', color:'#fff', fontSize:13, fontWeight:800, padding:'10px', borderRadius:10, cursor:'pointer', fontFamily:F }}>
                          {t === 'pro' ? 'Super Cheer' : 'Extra Cheer'}
                        </button>
                      ))}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <button onClick={aplicarCortesiaMasiva} disabled={cortesiaCargando} style={{ border:'none', background:'linear-gradient(135deg,#534AB7,#D4537E)', color:'#fff', fontSize:13, fontWeight:800, padding:'10px 20px', borderRadius:10, cursor:cortesiaCargando?'default':'pointer', opacity:cortesiaCargando?0.5:1, fontFamily:F }}>
                        {cortesiaCargando ? 'Aplicando...' : `Dar a ${seleccionados.size}`}
                      </button>
                      {cortesiaResultado && <span style={{ fontSize:13, color:'rgba(255,255,255,.7)' }}>{cortesiaResultado}</span>}
                    </div>
                    {cortesiaTipoMasiva === 'pro' && <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:8 }}>Super Cheer necesita que la persona tenga exactamente 1 celebración activa — si no tiene ninguna o tiene varias, esa persona no se actualiza.</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
