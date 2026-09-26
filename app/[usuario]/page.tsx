'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../supabase'
import { getLang, t } from '../i18n'
import TopBanner from '../components/TopBanner'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const BG = 'linear-gradient(160deg,#241c45,#302b63,#24243e)'

const CHIPS: Record<string, string> = {
  cumple:'BDAY', cumpleanos:'BDAY', cena:'DINE', viaje:'TRIP', reunion:'MEET', evento:'EVENT', otro:'OTHER'
}

const NOMBRE_PLAN: Record<string, string> = { free: 'Cheer', pro: 'Super Cheer', lifetime: 'Extra Cheer' }
const ADMIN_EMAIL = 'patty.eugenia@gmail.com'

function agruparPorTrimestre(celebraciones: any[], lang: string, plan: string, ocurrenciasPorSlug: Record<string, string[]> = {}) {
  const ahora = new Date()
  const tresMesesAtras = new Date()
  tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3)
  const grupos: Record<string, any[]> = {}
  const pasadas: any[] = []
  const pasadasBloqueadas: any[] = []
  const sinFecha: any[] = []

  // Fecha de hoy en local (mismo cuidado de zona horaria que el resto del
  // archivo), para saber si una serie recurrente todavía tiene fechas futuras.
  const hoyLocal = new Date()
  hoyLocal.setHours(0, 0, 0, 0)
  const hoyStr = `${hoyLocal.getFullYear()}-${String(hoyLocal.getMonth() + 1).padStart(2, '0')}-${String(hoyLocal.getDate()).padStart(2, '0')}`

  celebraciones.forEach(cel => {
    if (cel.archivada) return
    if (!cel.fecha) { sinFecha.push(cel); return }

    // Para series recurrentes, lo que importa es si tienen una fecha futura
    // real (tabla "ocurrencias"), no la fecha ancla con la que se crearon —
    // si no, un evento semanal que empezó hace meses siempre caía en
    // "pasadas" aunque siguiera vigente cada semana.
    let fechaRelevante = cel.fecha
    if (cel.recurrente) {
      const futuras = (ocurrenciasPorSlug[cel.slug] || []).filter(f => f >= hoyStr).sort()
      if (futuras.length > 0) fechaRelevante = futuras[0]
    }

    // Mismo bug de zona horaria que en el calendario: sin la hora local,
    // "new Date('2026-08-01')" se lee como UTC y en México cae un día antes.
    const f = new Date(fechaRelevante + 'T00:00:00')
    if (f < ahora) {
      // Lifetime desbloquea todo el historial de la cuenta; Pro desbloquea solo esta celebración
      if (plan === 'free' && cel.plan !== 'pro' && f < tresMesesAtras) { pasadasBloqueadas.push(cel) } else { pasadas.push(cel) }
      return
    }
    const year = f.getFullYear()
    const quarter = Math.ceil((f.getMonth() + 1) / 3)
    const key = `${year}-Q${quarter}`
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(cel)
  })

  return { grupos, pasadas, pasadasBloqueadas, sinFecha }
}

function quarterLabel(key: string, lang: string) {
  const [year, q] = key.split('-')
  const labels: Record<string, string> = { Q1: lang==='en'?'Jan–Mar':'Ene–Mar', Q2: lang==='en'?'Apr–Jun':'Abr–Jun', Q3: lang==='en'?'Jul–Sep':'Jul–Sep', Q4: lang==='en'?'Oct–Dec':'Oct–Dic' }
  return `${labels[q] || q} ${year}`
}

// Info de un solo mes (celdas del grid + qué eventos caen en cada día) — se
// calcula igual para el mes actual y para el siguiente, por eso vive aparte.
function construirMesInfo(mes: Date, eventos: any[]) {
  const primerDiaSemana = mes.getDay()
  const diasEnMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const eventosPorDia: Record<number, any[]> = {}
  eventos.forEach(e => {
    if (!e.fecha) return
    // OJO: "new Date('2026-08-01')" sin hora se lee como medianoche UTC, y en
    // zonas horarias detrás de UTC (México) eso cae el día ANTERIOR en hora
    // local — por eso un evento del 1 de agosto aparecía pintado el 31 de
    // julio. Agregar la hora local evita que el navegador asuma UTC.
    const f = new Date(e.fecha + 'T00:00:00')
    if (f.getFullYear() === mes.getFullYear() && f.getMonth() === mes.getMonth()) {
      const dia = f.getDate()
      if (!eventosPorDia[dia]) eventosPorDia[dia] = []
      eventosPorDia[dia].push(e)
    }
  })
  const celdas: (number | null)[] = []
  for (let i = 0; i < primerDiaSemana; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d)
  return { celdas, eventosPorDia }
}

function MiniCalendario({ eventos, lang, router }: { eventos: any[]; lang: string; router: any }) {
  const [mesActual, setMesActual] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d })
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const hoy = new Date()
  const mesSiguiente = (() => { const n = new Date(mesActual); n.setMonth(n.getMonth() + 1); return n })()
  const infoActual = construirMesInfo(mesActual, eventos)
  const infoSiguiente = construirMesInfo(mesSiguiente, eventos)
  const diasSemana = lang === 'en' ? ['S','M','T','W','T','F','S'] : ['D','L','M','M','J','V','S']

  // Dos meses lado a lado (izquierda = actual, derecha = el que sigue) — en
  // mobile se apilan uno encima del otro porque no caben angostos.
  const renderMes = (mes: Date, info: ReturnType<typeof construirMesInfo>) => {
    const nombreMesRaw = mes.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', { month: 'long', year: 'numeric' })
    const nombreMes = nombreMesRaw.charAt(0).toUpperCase() + nombreMesRaw.slice(1)
    return (
      <div style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,.06)', borderRadius: 20, padding: 16 }}>
        <div style={{ textAlign: 'center', color: '#EEEDFE', fontWeight: 800, fontSize: 13, marginBottom: 8 }}>{nombreMes}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
          {diasSemana.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.35)' }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
          {info.celdas.map((dia, i) => {
            const esHoy = dia && dia === hoy.getDate() && mes.getMonth() === hoy.getMonth() && mes.getFullYear() === hoy.getFullYear()
            return (
              <div key={i} style={{ minHeight: 40, borderRadius: 7, background: dia ? (esHoy ? 'rgba(168,157,240,.18)' : 'rgba(255,255,255,.03)') : 'transparent', padding: 2, overflow: 'hidden' }}>
                {dia && <div style={{ fontSize: 9, fontWeight: esHoy ? 800 : 600, color: esHoy ? '#a89df0' : 'rgba(255,255,255,.4)' }}>{dia}</div>}
                {dia && info.eventosPorDia[dia]?.slice(0, 1).map((e, idx) => (
                  <div
                    key={idx}
                    onClick={() => router.push(`/${e.slug}${e.recurrente ? '#proximas-fechas' : ''}`)}
                    title={e.nombre}
                    style={{ fontSize: 7, fontWeight: 700, background: e.esPropia ? '#534AB7' : '#D4537E', color: '#fff', borderRadius: 3, padding: '1px 2px', marginTop: 2, cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
                  >
                    {e.nombre}
                  </div>
                ))}
                {dia && (info.eventosPorDia[dia]?.length || 0) > 1 && (
                  <div style={{ fontSize: 7, color: 'rgba(255,255,255,.4)', marginTop: 1 }}>+{info.eventosPorDia[dia].length - 1}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, marginBottom: 14 }}>
        <button onClick={() => setMesActual(m => { const n = new Date(m); n.setMonth(n.getMonth() - 1); return n })} style={{ border: 'none', background: 'rgba(255,255,255,.08)', color: '#fff', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>←</button>
        <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 16 }}>
          {renderMes(mesActual, infoActual)}
          {renderMes(mesSiguiente, infoSiguiente)}
        </div>
        <button onClick={() => setMesActual(m => { const n = new Date(m); n.setMonth(n.getMonth() + 1); return n })} style={{ border: 'none', background: 'rgba(255,255,255,.08)', color: '#fff', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>→</button>
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,.5)' }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#534AB7', marginRight: 4 }} />{lang === 'en' ? 'You organize' : 'Organizas tú'}</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,.5)' }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#D4537E', marginRight: 4 }} />{lang === 'en' ? "You're invited" : 'Te invitaron'}</span>
      </div>
    </div>
  )
}

export default function Celebraciones({ params }: { params: Promise<{ usuario: string }> }) {
  const router = useRouter()
  const [tx, setTx] = useState(t.es)
  const [lang, setLang] = useState('es')
  const [user, setUser] = useState<any>(null)
  const [perfilOwner, setPerfilOwner] = useState<any>(null)
  const [perfilAuth, setPerfilAuth] = useState<any>(null)
  const [celebraciones, setCelebraciones] = useState<any[]>([])
  const [invitaciones, setInvitaciones] = useState<any[]>([])
  // Fechas reales generadas para cada serie recurrente (slug -> ['YYYY-MM-DD', ...]),
  // para que el Mini Calendario pinte el evento en CADA fecha en la que ocurre, no
  // solo en la fecha ancla con la que se creó la serie.
  const [ocurrenciasPorSlug, setOcurrenciasPorSlug] = useState<Record<string, string[]>>({})
  const [cargando, setCargando] = useState(true)
  const [esPropio, setEsPropio] = useState(false)
  const [username, setUsername] = useState('')
  const [mostrarPasadas, setMostrarPasadas] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [proyectosBoda, setProyectosBoda] = useState<any[]>([])
  const [mostrarBienvenidaBridal, setMostrarBienvenidaBridal] = useState(false)

  // Acomodo personalizable del dashboard — cuántas columnas y en qué orden va
  // cada bloque. Null hasta que perfiles.layout_dashboard cargue; mientras
  // tanto se usa layoutPorDefecto() (1 columna, el orden de siempre).
  const [layoutDashboard, setLayoutDashboard] = useState<{ columnas: number; bloques: { id: string; col: number; orden: number }[] } | null>(null)
  const [personalizando, setPersonalizando] = useState(false)

  useEffect(() => {
    const l = getLang(); setLang(l); setTx(t[l])
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)

    // Separado en función aparte para poder llamarlo de nuevo cuando la pestaña
    // o el acceso directo instalado (home screen / shortcut de escritorio) vuelve
    // a primer plano. Sin esto, si alguien deja la app "abierta en segundo plano"
    // y crea un evento en otra pestaña/dispositivo, al volver ve la lista vieja
    // porque este efecto solo corría una vez, al montar el componente.
    async function cargarDatos(usuario: string) {
      setUsername(usuario)
      const nuevoOcurrenciasPorSlug: Record<string, string[]> = {}
      const { data: perfilRows } = await supabase.rpc('get_perfil_publico_por_username', { p_username: usuario })
      const perfil = perfilRows?.[0]
      if (!perfil) { setCargando(false); return }
      setPerfilOwner(perfil)

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setUser(authUser)
        const es = authUser.id === perfil.user_id
        setEsPropio(es)
        if (es) {
          const { data: perfilAuth } = await supabase.from('perfiles').select('*').eq('user_id', authUser.id).single()
          setPerfilAuth(perfilAuth)
          if (perfilAuth?.layout_dashboard) setLayoutDashboard(perfilAuth.layout_dashboard)

          const { data: misInvitaciones } = await supabase.from('invitados').select('celebracion_slug, created_at').eq('user_id', authUser.id)
          const slugsInvitado = (misInvitaciones || []).map(i => i.celebracion_slug)
          if (slugsInvitado.length) {
            const [{ data: celsInvitado }, { data: misRsvps }, { data: misReservas }] = await Promise.all([
              supabase.from('celebraciones').select('*').in('slug', slugsInvitado).order('fecha', { ascending: true }),
              supabase.from('rsvps').select('celebracion_slug, asistencia').eq('user_id', authUser.id).in('celebracion_slug', slugsInvitado),
              supabase.from('regalo_reservas').select('celebracion_slug, regalo_id').eq('user_id', authUser.id).in('celebracion_slug', slugsInvitado),
            ])
            const fechaInvPorSlug: Record<string, string> = {}
            ;(misInvitaciones || []).forEach(i => { fechaInvPorSlug[i.celebracion_slug] = i.created_at })
            const asistenciaPorSlug: Record<string, string> = {}
            ;(misRsvps || []).forEach(r => { asistenciaPorSlug[r.celebracion_slug] = r.asistencia })
            const regaloIdPorSlug: Record<string, string> = {}
            ;(misReservas || []).forEach(r => { regaloIdPorSlug[r.celebracion_slug] = r.regalo_id })
            setInvitaciones((celsInvitado || [])
              .filter(c => c.organizador_id !== authUser.id)
              .map(c => ({
                ...c,
                invitadoDesde: fechaInvPorSlug[c.slug],
                miAsistencia: asistenciaPorSlug[c.slug] || null,
                miRegalo: (c.gifts || []).find((g: any) => g.id === regaloIdPorSlug[c.slug])?.nombre || null,
              }))
            )

            // Fechas reales de las series recurrentes a las que estoy invitado (vía RPC,
            // como invitado no tengo permiso de leer "ocurrencias" directo)
            const invitadasRecurrentes = (celsInvitado || []).filter((c: any) => c.recurrente)
            if (invitadasRecurrentes.length) {
              const listas = await Promise.all(
                invitadasRecurrentes.map((c: any) => supabase.rpc('get_ocurrencias_por_slug', { p_slug: c.slug }))
              )
              invitadasRecurrentes.forEach((c: any, i: number) => {
                const fechas = (listas[i].data || []).map((o: any) => o.fecha)
                if (fechas.length) nuevoOcurrenciasPorSlug[c.slug] = fechas
              })
            }
          }

          // La lista de celebraciones organizadas solo se muestra al dueño del perfil, nunca a otros visitantes
          const { data } = await supabase.from('celebraciones').select('*').eq('organizador_id', perfil.user_id).order('fecha', { ascending: true })
          setCelebraciones(data || [])

          // Fechas reales de mis propias series recurrentes (acceso directo, soy el organizador)
          const propiasRecurrentes = (data || []).filter((c: any) => c.recurrente)
          if (propiasRecurrentes.length) {
            const { data: ocs } = await supabase
              .from('ocurrencias')
              .select('celebracion_slug, fecha')
              .in('celebracion_slug', propiasRecurrentes.map((c: any) => c.slug))
              .eq('cancelada', false)
            ;(ocs || []).forEach((o: any) => {
              if (!nuevoOcurrenciasPorSlug[o.celebracion_slug]) nuevoOcurrenciasPorSlug[o.celebracion_slug] = []
              nuevoOcurrenciasPorSlug[o.celebracion_slug].push(o.fecha)
            })
          }

          setOcurrenciasPorSlug(nuevoOcurrenciasPorSlug)

          // Proyecto(s) de boda del usuario (Cheers Bridal) — se muestran junto a
          // las celebraciones sociales en este mismo dashboard, no en una sección
          // aparte. Si alguno todavía no tuvo su animación de bienvenida, se marca
          // para mostrarla (una sola vez por proyecto, ver cerrarBienvenidaBridal).
          const { data: miembrosBoda } = await supabase
            .from('proyectos_boda_miembros')
            .select('boda_id, proyectos_boda(id, nombre_novia, nombre_novio, fecha_boda, bienvenida_mostrada)')
            .eq('user_id', authUser.id)
          const listaBodas = (miembrosBoda || []).map((m: any) => m.proyectos_boda).filter(Boolean)
          setProyectosBoda(listaBodas)
          if (listaBodas.some((p: any) => !p.bienvenida_mostrada)) setMostrarBienvenidaBridal(true)
        }
      }

      setCargando(false)
    }

    // Sesión guardada inválida/corrupta (ej. cuenta borrada): sin este catch la
    // promesa nunca resuelve y la página se queda cargando para siempre.
    function cargarDatosSeguro(usuario: string) {
      cargarDatos(usuario).catch(async () => {
        await supabase.auth.signOut().catch(() => {})
        setCargando(false)
      })
    }

    params.then(({ usuario }) => cargarDatosSeguro(usuario))

    function alVolverAPrimerPlano() {
      if (document.visibilityState === 'visible') {
        params.then(({ usuario }) => cargarDatosSeguro(usuario))
      }
    }
    document.addEventListener('visibilitychange', alVolverAPrimerPlano)
    window.addEventListener('focus', alVolverAPrimerPlano)
    return () => {
      document.removeEventListener('visibilitychange', alVolverAPrimerPlano)
      window.removeEventListener('focus', alVolverAPrimerPlano)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  async function archivar(slug: string, archivada: boolean) {
    await supabase.from('celebraciones').update({ archivada: !archivada }).eq('slug', slug)
    setCelebraciones(prev => prev.map(c => c.slug === slug ? { ...c, archivada: !archivada } : c))
  }

  async function eliminar(slug: string) {
    const msg = lang === 'en'
      ? 'Delete this celebration? This cannot be undone.'
      : '¿Eliminar esta celebración? No se puede deshacer.'
    if (!confirm(msg)) return
    const cel = celebraciones.find(c => c.slug === slug)
    if (cel?.portada_url) {
      const idx = cel.portada_url.indexOf('/portadas/')
      if (idx !== -1) await supabase.storage.from('portadas').remove([cel.portada_url.slice(idx + '/portadas/'.length)])
    }
    await supabase.from('invitados').delete().eq('celebracion_slug', slug)
    await supabase.from('rsvps').delete().eq('celebracion_slug', slug)
    await supabase.from('celebraciones').delete().eq('slug', slug)
    setCelebraciones(prev => prev.filter(c => c.slug !== slug))
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const BLOQUES_IDS = ['invitaciones_nuevas', 'calendario', 'nueva_celebracion', 'tu_boda', 'tus_invitaciones', 'celebraciones']

  function layoutPorDefecto() {
    return { columnas: 1, bloques: BLOQUES_IDS.map((id, i) => ({ id, col: 0, orden: i })) }
  }

  async function guardarLayout(nuevo: { columnas: number; bloques: { id: string; col: number; orden: number }[] }) {
    setLayoutDashboard(nuevo)
    if (!user) return
    await supabase.from('perfiles').update({ layout_dashboard: nuevo }).eq('user_id', user.id)
  }

  function moverBloqueVertical(id: string, dir: -1 | 1) {
    const actual = layoutDashboard || layoutPorDefecto()
    const bloques = [...actual.bloques]
    const idx = bloques.findIndex(b => b.id === id)
    if (idx === -1) return
    const mismaCol = bloques.filter(b => b.col === bloques[idx].col).sort((a, b) => a.orden - b.orden)
    const posEnCol = mismaCol.findIndex(b => b.id === id)
    const nuevaPos = posEnCol + dir
    if (nuevaPos < 0 || nuevaPos >= mismaCol.length) return
    const otro = mismaCol[nuevaPos]
    const ordenPropio = bloques[idx].orden
    const otroIdx = bloques.findIndex(b => b.id === otro.id)
    bloques[idx] = { ...bloques[idx], orden: otro.orden }
    bloques[otroIdx] = { ...bloques[otroIdx], orden: ordenPropio }
    guardarLayout({ ...actual, bloques })
  }

  function moverBloqueColumna(id: string, dir: -1 | 1) {
    const actual = layoutDashboard || layoutPorDefecto()
    const bloques = [...actual.bloques]
    const idx = bloques.findIndex(b => b.id === id)
    if (idx === -1) return
    const nuevaCol = bloques[idx].col + dir
    if (nuevaCol < 0 || nuevaCol >= actual.columnas) return
    const ordenesEnCol = bloques.filter(b => b.col === nuevaCol).map(b => b.orden)
    const maxOrden = ordenesEnCol.length ? Math.max(...ordenesEnCol) : -1
    bloques[idx] = { ...bloques[idx], col: nuevaCol, orden: maxOrden + 1 }
    guardarLayout({ ...actual, bloques })
  }

  function cambiarColumnas(n: number) {
    const actual = layoutDashboard || layoutPorDefecto()
    const bloques = actual.bloques.map(b => b.col >= n ? { ...b, col: n - 1 } : b)
    guardarLayout({ columnas: n, bloques })
  }

  async function cerrarBienvenidaBridal() {
    const proyecto = proyectosBoda.find(p => !p.bienvenida_mostrada)
    setMostrarBienvenidaBridal(false)
    if (proyecto) {
      await supabase.from('proyectos_boda').update({ bienvenida_mostrada: true }).eq('id', proyecto.id)
      setProyectosBoda(prev => prev.map(p => p.id === proyecto.id ? { ...p, bienvenida_mostrada: true } : p))
    }
  }

  if (cargando) return (
    <main style={{ minHeight:'100vh', background:BG, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:F }}>
      <p style={{ color:'#AFA9EC' }}>{t[lang as 'es'|'en'].loading}</p>
    </main>
  )

  // Animación de bienvenida a Cheers Bridal — solo la primera vez que esta
  // cuenta entra al dashboard después de crear un proyecto de boda.
  if (mostrarBienvenidaBridal) return (
    <main style={{ minHeight:'100vh', background:'linear-gradient(160deg,#FFFDFB,#FBF1E7 55%,#F6E4DC)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:F, padding:20 }}>
      <style>{`@keyframes bridalPop{0%{transform:scale(.7);opacity:0}60%{transform:scale(1.05);opacity:1}100%{transform:scale(1);opacity:1}}@keyframes bridalFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ textAlign:'center', maxWidth:360 }}>
        <div style={{ width:76, height:76, borderRadius:'50%', background:'linear-gradient(135deg,#C9A876,#C98A93)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 22px', animation:'bridalPop .6s ease-out' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M12 17.5c-2-1.4-3.3-2.6-3.3-4a1.9 1.9 0 0 1 3.3-1.3 1.9 1.9 0 0 1 3.3 1.3c0 1.4-1.3 2.6-3.3 4z" fill="rgba(255,255,255,0.9)" stroke="none"/></svg>
        </div>
        <h1 style={{ fontSize:24, fontWeight:900, color:'#3D2B2E', margin:'0 0 10px', letterSpacing:'-.5px', animation:'bridalFade .5s ease-out .15s both' }}>
          {lang==='en' ? 'Your wedding lives in Cheers now' : 'Tu boda ya vive en Cheers'}
        </h1>
        <p style={{ fontSize:14, color:'rgba(61,43,46,.62)', lineHeight:1.6, margin:'0 0 28px', animation:'bridalFade .5s ease-out .25s both' }}>
          {lang==='en'
            ? "From now on you'll find it right next to your other celebrations, every time you come in."
            : 'De ahora en adelante la vas a encontrar junto a tus demás celebraciones, cada vez que entres.'}
        </p>
        <button onClick={cerrarBienvenidaBridal} style={{ border:'none', background:'linear-gradient(135deg,#C9A876,#C98A93)', color:'#fff', fontSize:14, fontWeight:800, padding:'13px 28px', borderRadius:14, cursor:'pointer', fontFamily:F, animation:'bridalFade .5s ease-out .35s both' }}>
          {lang==='en' ? 'Continue' : 'Continuar'}
        </button>
      </div>
    </main>
  )

  const nombre = perfilAuth?.nombre_completo || user?.user_metadata?.name?.split(' ')[0] || username
  const avatar = user?.user_metadata?.avatar_url
  const plan = perfilOwner?.plan || 'free'
  const { grupos, pasadas, pasadasBloqueadas, sinFecha } = agruparPorTrimestre(celebraciones, lang, plan, ocurrenciasPorSlug)
  // Las series recurrentes se pintan en CADA una de sus fechas reales (tabla
  // "ocurrencias"), no solo en la fecha ancla con la que se crearon — si no,
  // un evento "cada viernes" solo aparecería una vez en todo el calendario.
  const expandirRecurrente = (c: any) =>
    c.recurrente && ocurrenciasPorSlug[c.slug]?.length
      ? ocurrenciasPorSlug[c.slug].map(fecha => ({ ...c, fecha }))
      : [c]

  const eventosCalendario = [
    ...celebraciones.filter(c => !c.archivada).flatMap(expandirRecurrente).map(c => ({ ...c, esPropia: true })),
    ...invitaciones.flatMap(expandirRecurrente).map(c => ({ ...c, esPropia: false })),
  ]
  const invitacionesNuevas = invitaciones.filter(c => c.invitadoDesde && (Date.now() - new Date(c.invitadoDesde).getTime()) < 7 * 24 * 60 * 60 * 1000)

  const CelCard = ({ cel }: { cel: any }) => (
    <div onClick={() => router.push(`/${cel.slug}`)} style={{ display:'flex', alignItems:'center', gap:14, padding:'1rem 1.25rem', background:'rgba(255,255,255,.06)', borderRadius:16, cursor:'pointer', border:'1px solid rgba(255,255,255,.08)', marginBottom:10, position:'relative' }}>
      <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#534AB7,#D4537E)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
        {cel.portada_url
          ? <Image src={cel.portada_url} alt="" width={40} height={40} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <span style={{ fontSize:11, fontWeight:800, color:'#fff', textTransform:'uppercase', letterSpacing:'.5px' }}>{CHIPS[cel.tipo] || 'EVT'}</span>}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:15, fontWeight:700, color:'#EEEDFE', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cel.nombre}</div>
        <div style={{ fontSize:12, color:'#AFA9EC', marginTop:1 }}>
          {cel.fecha ? new Date(cel.fecha + 'T00:00:00').toLocaleDateString(lang==='en'?'en-US':'es-MX', { month:'short', day:'numeric', year:'numeric' }) : 'Sin fecha'}
        </div>
        {!cel.esPropia && (cel.miAsistencia || cel.miRegalo) && (
          <div style={{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap' }}>
            {cel.miAsistencia && (
              <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:99, color: cel.miAsistencia==='si' ? '#1f8a5b' : cel.miAsistencia==='no' ? '#dc2626' : '#c98a1e', background: cel.miAsistencia==='si' ? 'rgba(31,138,91,.15)' : cel.miAsistencia==='no' ? 'rgba(220,38,38,.15)' : 'rgba(201,138,30,.15)' }}>
                {cel.miAsistencia==='si' ? (lang==='en'?'Going':'Voy') : cel.miAsistencia==='no' ? (lang==='en'?"Not going":'No voy') : (lang==='en'?'Maybe':'Tal vez')}
              </span>
            )}
            {cel.miRegalo && (
              <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:99, color:'#534AB7', background:'rgba(83,74,183,.15)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:160 }}>
                🎁 {cel.miRegalo}
              </span>
            )}
          </div>
        )}
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
        {cel.es_sorpresa && esPropio && cel.esPropia !== false && (plan === 'lifetime' || plan === 'pro' || cel.plan === 'pro') && <span style={{ fontSize:11, fontWeight:700, color:'#D4537E', background:'rgba(212,83,126,.15)', padding:'2px 8px', borderRadius:99 }}>{tx.surprise}</span>}
        {esPropio && cel.esPropia !== false && <button onClick={e => { e.stopPropagation(); archivar(cel.slug, cel.archivada) }} style={{ border:'none', background:'rgba(255,255,255,.06)', color:'rgba(255,255,255,.35)', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:99, cursor:'pointer', fontFamily:F }}>
          {cel.archivada ? (lang==='en'?'Unarchive':'Desarchivar') : (lang==='en'?'Archive':'Archivar')}
        </button>}
        {esPropio && cel.esPropia !== false && <button onClick={e => { e.stopPropagation(); eliminar(cel.slug) }} style={{ border:'none', background:'rgba(212,83,126,.1)', color:'rgba(212,83,126,.6)', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:99, cursor:'pointer', fontFamily:F }}>
          {lang==='en'?'Delete':'Eliminar'}
        </button>}
        <span style={{ fontSize:18, color:'#AFA9EC' }}>→</span>
      </div>
    </div>
  )

  const BodaCard = ({ p }: { p: any }) => (
    <div onClick={() => router.push(`/bridal/${p.id}`)} style={{ display:'flex', alignItems:'center', gap:14, padding:'1rem 1.25rem', background:'linear-gradient(135deg,rgba(201,168,118,.14),rgba(201,138,147,.14))', borderRadius:16, cursor:'pointer', border:'1px solid rgba(201,138,147,.3)', marginBottom:10 }}>
      <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#C9A876,#C98A93)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M12 17.5c-2-1.4-3.3-2.6-3.3-4a1.9 1.9 0 0 1 3.3-1.3 1.9 1.9 0 0 1 3.3 1.3c0 1.4-1.3 2.6-3.3 4z" fill="rgba(255,255,255,0.9)" stroke="none"/></svg>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:15, fontWeight:700, color:'#EEEDFE', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {[p.nombre_novia, p.nombre_novio].filter(Boolean).join(' & ') || (lang==='en'?'Your wedding':'Tu boda')}
        </div>
        <div style={{ fontSize:12, color:'#d8b3ba', marginTop:1 }}>
          {p.fecha_boda ? new Date(p.fecha_boda + 'T00:00:00').toLocaleDateString(lang==='en'?'en-US':'es-MX', { month:'short', day:'numeric', year:'numeric' }) : (lang==='en'?'Wedding project':'Proyecto de boda')}
        </div>
      </div>
      <span style={{ fontSize:18, color:'#d8b3ba' }}>→</span>
    </div>
  )

  // Bloques del dashboard — el contenido de cada uno vive aquí, y layoutDashboard
  // decide en qué columna y en qué orden se pinta cada quien. null = no hay nada
  // que mostrar ese bloque ahorita (no ocupa espacio ni aparece al personalizar).
  const bloquesContenido: Record<string, React.ReactNode> = {
    invitaciones_nuevas: (esPropio && invitacionesNuevas.length > 0) ? (
      <div style={{ background:'rgba(212,83,126,.15)', border:'1px solid rgba(212,83,126,.3)', borderRadius:14, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:18 }}>🎉</span>
        <p style={{ fontSize:13, color:'#fff', margin:0, fontWeight:600 }}>
          {lang==='en'
            ? `You were invited to ${invitacionesNuevas.length} new celebration${invitacionesNuevas.length > 1 ? 's' : ''}: ${invitacionesNuevas.map(c => c.nombre).join(', ')}`
            : `Te invitaron a ${invitacionesNuevas.length} celebracion${invitacionesNuevas.length > 1 ? 'es' : ''} nueva${invitacionesNuevas.length > 1 ? 's' : ''}: ${invitacionesNuevas.map(c => c.nombre).join(', ')}`}
        </p>
      </div>
    ) : null,

    calendario: (esPropio && eventosCalendario.length > 0) ? (
      <MiniCalendario eventos={eventosCalendario} lang={lang} router={router} />
    ) : null,

    nueva_celebracion: esPropio ? (
      <button onClick={() => router.push(`/${username}/nueva`)} style={{ width:'100%', padding:'1rem', background:'linear-gradient(135deg,#534AB7,#D4537E)', border:'none', borderRadius:16, color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer', marginBottom:'2rem', boxShadow:'0 8px 24px rgba(212,83,126,.3)', fontFamily:F }}>
        {tx.new_celebration}
      </button>
    ) : null,

    tu_boda: (esPropio && proyectosBoda.length > 0) ? (
      <div style={{ marginBottom:24 }}>
        <p style={{ fontSize:11, fontWeight:800, letterSpacing:'1px', color:'#d8b3ba', textTransform:'uppercase', margin:'0 0 10px 4px' }}>
          {lang==='en' ? 'Your wedding' : 'Tu boda'}
        </p>
        {proyectosBoda.map(p => <BodaCard key={p.id} p={p} />)}
      </div>
    ) : null,

    tus_invitaciones: (esPropio && invitaciones.length > 0) ? (
      <div style={{ marginBottom:24 }}>
        <p style={{ fontSize:11, fontWeight:800, letterSpacing:'1px', color:'#AFA9EC', textTransform:'uppercase', margin:'0 0 10px 4px' }}>
          {lang==='en' ? 'Your invitations' : 'Tus invitaciones'}
        </p>
        {[...invitaciones].sort((a,b) => new Date((a.fecha ? a.fecha + 'T00:00:00' : 0)).getTime() - new Date((b.fecha ? b.fecha + 'T00:00:00' : 0)).getTime()).map(cel => (
          <CelCard key={cel.slug} cel={{ ...cel, esPropia:false }} />
        ))}
      </div>
    ) : null,

    celebraciones: (
      <div>
        {celebraciones.filter(c => !c.archivada).length === 0 && invitaciones.length === 0 && (
          <div style={{ textAlign:'center', padding:'2rem', background:'rgba(255,255,255,.06)', borderRadius:16, marginBottom:16 }}>
            <p style={{ color:'#AFA9EC', fontSize:15, margin:0 }}>{esPropio ? tx.no_celebrations : tx.no_public}</p>
          </div>
        )}

        {sinFecha.length > 0 && (
          <div style={{ marginBottom:24 }}>
            <p style={{ fontSize:11, fontWeight:800, letterSpacing:'1px', color:'#AFA9EC', textTransform:'uppercase', margin:'0 0 10px 4px' }}>{lang==='en'?'No date set':'Sin fecha'}</p>
            {sinFecha.map(cel => <CelCard key={cel.slug} cel={cel} />)}
          </div>
        )}

        {Object.keys(grupos).sort().map(key => (
          <div key={key} style={{ marginBottom:24 }}>
            <p style={{ fontSize:11, fontWeight:800, letterSpacing:'1px', color:'#AFA9EC', textTransform:'uppercase', margin:'0 0 10px 4px' }}>{quarterLabel(key, lang)}</p>
            {grupos[key].map(cel => <CelCard key={cel.slug} cel={cel} />)}
          </div>
        ))}

        {(pasadas.length > 0 || pasadasBloqueadas.length > 0) && (
          <div style={{ marginBottom:24 }}>
            <button onClick={() => setMostrarPasadas(v => !v)} style={{ width:'100%', border:'none', background:'rgba(255,255,255,.04)', color:'#AFA9EC', fontSize:13, fontWeight:700, padding:'12px', borderRadius:12, cursor:'pointer', fontFamily:F, marginBottom:mostrarPasadas?12:0 }}>
              {mostrarPasadas
                ? (lang==='en'?'Hide past celebrations ↑':'Ocultar pasadas ↑')
                : `${lang==='en'?'Show past celebrations':'Ver celebraciones pasadas'} (${pasadas.length + pasadasBloqueadas.length}) ↓`}
            </button>
            {mostrarPasadas && pasadas.map(cel => <CelCard key={cel.slug} cel={cel} />)}
            {mostrarPasadas && pasadasBloqueadas.length > 0 && (
              <div style={{ textAlign:'center', padding:'1rem', background:'rgba(83,74,183,.12)', borderRadius:12, marginTop:8 }}>
                <p style={{ fontSize:13, color:'#AFA9EC', margin:'0 0 8px' }}>
                  {lang==='en'
                    ? `${pasadasBloqueadas.length} more celebration${pasadasBloqueadas.length > 1 ? 's' : ''} older than 3 months`
                    : `${pasadasBloqueadas.length} celebracion${pasadasBloqueadas.length > 1 ? 'es' : ''} más antigua${pasadasBloqueadas.length > 1 ? 's' : ''} de 3 meses`}
                </p>
                {esPropio && <button onClick={() => router.push('/perfil')} style={{ border:'none', background:'linear-gradient(135deg,#534AB7,#D4537E)', color:'#fff', fontSize:12, fontWeight:800, padding:'8px 16px', borderRadius:99, cursor:'pointer', fontFamily:F }}>
                  {lang==='en' ? 'Upgrade to see full history →' : 'Mejora tu plan para verlas →'}
                </button>}
              </div>
            )}
          </div>
        )}

        {esPropio && celebraciones.filter(c => c.archivada).length > 0 && (
          <p style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,.2)', marginTop:8 }}>
            {celebraciones.filter(c => c.archivada).length} {lang==='en'?'archived':'archivadas'}
          </p>
        )}
      </div>
    ),
  }

  const layout = layoutDashboard || layoutPorDefecto()
  const columnasEfectivas = isMobile ? 1 : layout.columnas
  const anchoMax = columnasEfectivas === 1 ? 900 : columnasEfectivas === 2 ? 1200 : 1500
  const idsConContenido = new Set(Object.keys(bloquesContenido).filter(id => bloquesContenido[id] !== null))
  const columnasContenido: string[][] = Array.from({ length: columnasEfectivas }, () => [])
  layout.bloques
    .filter(b => idsConContenido.has(b.id))
    .forEach(b => { columnasContenido[Math.min(b.col, columnasEfectivas - 1)].push(b.id) })
  columnasContenido.forEach(col => col.sort((a, b) => {
    const oa = layout.bloques.find(x => x.id === a)?.orden ?? 0
    const ob = layout.bloques.find(x => x.id === b)?.orden ?? 0
    return oa - ob
  }))
  const botonPersonalizar: React.CSSProperties = { border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.06)', color:'#AFA9EC', width:22, height:22, borderRadius:6, cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center' }

  return (
    <main style={{ minHeight:'100vh', background:BG, fontFamily:F, padding:'2rem 1.5rem' }}>
      <div style={{ maxWidth:anchoMax, margin:'0 auto', transition:'max-width .2s' }}>

        {esPropio && user
          ? <TopBanner userId={user.id} username={username} lang={lang} />
          : <div style={{ fontSize:34, fontWeight:900, background:'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'-.5px', marginBottom:22 }}>Cheers</div>}

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {esPropio
              ? <h1 style={{ fontSize:22, fontWeight:700, color:'#EEEDFE', margin:0 }}>{lang==='en'?`Hi, ${nombre}`:`Hola, ${nombre}`}</h1>
              : <h1 style={{ fontSize:18, fontWeight:700, color:'#EEEDFE', margin:0 }}>@{username}</h1>}
            {esPropio && user?.email === ADMIN_EMAIL && (
              <span style={{ fontSize:10, fontWeight:800, color:'#f08cb0', background:'rgba(212,83,126,.15)', padding:'3px 9px', borderRadius:99, letterSpacing:'.5px' }}>ADMIN</span>
            )}
          </div>

          {esPropio && (
            <div style={{ position:'relative' }}>
              <button onClick={() => setShowMenu(v => !v)} style={{ width:44, height:44, borderRadius:'50%', border:'2px solid rgba(255,255,255,.15)', background:'rgba(255,255,255,.06)', overflow:'hidden', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {avatar
                  ? <Image src={avatar} alt="" width={44} height={44} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <span style={{ fontSize:16, fontWeight:800, color:'#fff' }}>{nombre[0]?.toUpperCase()}</span>}
              </button>
              {showMenu && (
                <>
                  <div onClick={() => setShowMenu(false)} style={{ position:'fixed', inset:0, zIndex:10 }} />
                  <div style={{ position:'absolute', right:0, top:52, background:'#1a1740', border:'1px solid rgba(255,255,255,.1)', borderRadius:16, padding:'8px', minWidth:200, boxShadow:'0 16px 40px rgba(0,0,0,.4)', zIndex:20 }}>
                    <div style={{ padding:'8px 12px', marginBottom:4 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#EEEDFE', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nombre}</div>
                      <div style={{ fontSize:12, color:'#AFA9EC' }}>@{username}</div>
                      <div style={{ fontSize:11, fontWeight:800, color:plan==='lifetime'?'#D4537E':plan==='pro'?'#534AB7':'#7a7494', marginTop:3, textTransform:'uppercase', letterSpacing:'.5px' }}>{NOMBRE_PLAN[plan] || plan}</div>
                    </div>
                    <div style={{ borderTop:'1px solid rgba(255,255,255,.08)', paddingTop:8 }}>
                      {[
                        { label: lang==='en'?'My profile':'Mi perfil', action: () => { router.push('/perfil'); setShowMenu(false) } },
                        ...(user?.email === ADMIN_EMAIL ? [{ label: lang==='en'?'Admin panel':'Panel de Admin', action: () => { router.push(`/${username}/admin_login`); setShowMenu(false) } }] : []),
                        { label: lang==='en'?'Sign out':'Cerrar sesión', action: cerrarSesion, danger: true },
                      ].map(item => (
                        <button key={item.label} onClick={item.action} style={{ width:'100%', border:'none', background:'none', color:(item as any).danger?'#f08cb0':'#EEEDFE', fontSize:14, fontWeight:600, padding:'10px 12px', borderRadius:10, cursor:'pointer', fontFamily:F, textAlign:'left', display:'block' }}>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Personalizar acomodo — solo para el dueño del dashboard */}
        {esPropio && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:8, marginBottom:14 }}>
            {personalizando && !isMobile && (
              <div style={{ display:'flex', gap:4, marginRight:8 }}>
                {[1,2,3].map(n => (
                  <button key={n} onClick={() => cambiarColumnas(n)} style={{ border:'1px solid rgba(255,255,255,.12)', background: layout.columnas===n ? 'linear-gradient(135deg,#534AB7,#D4537E)' : 'rgba(255,255,255,.06)', color:'#fff', fontSize:12, fontWeight:700, padding:'5px 10px', borderRadius:8, cursor:'pointer', fontFamily:F }}>
                    {n} {lang==='en' ? (n===1?'col':'cols') : (n===1?'col':'cols')}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setPersonalizando(v => !v)} style={{ border:'1px solid rgba(255,255,255,.12)', background: personalizando ? 'rgba(212,83,126,.2)' : 'rgba(255,255,255,.06)', color:'#EEEDFE', fontSize:12, fontWeight:700, padding:'6px 12px', borderRadius:8, cursor:'pointer', fontFamily:F }}>
              {personalizando ? (lang==='en' ? 'Done' : 'Listo') : (lang==='en' ? 'Customize layout' : 'Personalizar acomodo')}
            </button>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:`repeat(${columnasEfectivas},1fr)`, gap:24 }}>
          {columnasContenido.map((idsEnCol, colIdx) => (
            <div key={colIdx} style={{ display:'flex', flexDirection:'column' as const, minWidth:0 }}>
              {idsEnCol.map(idBloque => (
                <div key={idBloque}>
                  {personalizando && (
                    <div style={{ display:'flex', gap:4, marginBottom:6, justifyContent:'flex-end' }}>
                      <button onClick={() => moverBloqueVertical(idBloque,-1)} title={lang==='en'?'Move up':'Subir'} style={botonPersonalizar}>↑</button>
                      <button onClick={() => moverBloqueVertical(idBloque,1)} title={lang==='en'?'Move down':'Bajar'} style={botonPersonalizar}>↓</button>
                      {columnasEfectivas > 1 && <>
                        <button onClick={() => moverBloqueColumna(idBloque,-1)} title={lang==='en'?'Move left':'Mover a la izquierda'} style={botonPersonalizar}>←</button>
                        <button onClick={() => moverBloqueColumna(idBloque,1)} title={lang==='en'?'Move right':'Mover a la derecha'} style={botonPersonalizar}>→</button>
                      </>}
                    </div>
                  )}
                  {bloquesContenido[idBloque]}
                </div>
              ))}
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}