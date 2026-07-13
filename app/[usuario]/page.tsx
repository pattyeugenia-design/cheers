'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { getLang, t } from '../i18n'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const BG = 'linear-gradient(160deg,#241c45,#302b63,#24243e)'

const CHIPS: Record<string, string> = {
  cumple:'BDAY', cumpleanos:'BDAY', cena:'DINE', viaje:'TRIP', reunion:'MEET', evento:'EVENT', otro:'OTHER'
}

function agruparPorTrimestre(celebraciones: any[], lang: string, plan: string) {
  const ahora = new Date()
  const tresMesesAtras = new Date()
  tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3)
  const grupos: Record<string, any[]> = {}
  const pasadas: any[] = []
  const pasadasBloqueadas: any[] = []
  const sinFecha: any[] = []

  celebraciones.forEach(cel => {
    if (cel.archivada) return
    if (!cel.fecha) { sinFecha.push(cel); return }
    const f = new Date(cel.fecha)
    if (f < ahora) {
      if (plan === 'free' && f < tresMesesAtras) { pasadasBloqueadas.push(cel) } else { pasadas.push(cel) }
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

export default function Celebraciones({ params }: { params: Promise<{ usuario: string }> }) {
  const router = useRouter()
  const [tx, setTx] = useState(t.es)
  const [lang, setLang] = useState('es')
  const [user, setUser] = useState<any>(null)
  const [perfilOwner, setPerfilOwner] = useState<any>(null)
  const [perfilAuth, setPerfilAuth] = useState<any>(null)
  const [celebraciones, setCelebraciones] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [esPropio, setEsPropio] = useState(false)
  const [username, setUsername] = useState('')
  const [mostrarPasadas, setMostrarPasadas] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    const l = getLang(); setLang(l); setTx(t[l])
    params.then(async ({ usuario }) => {
      setUsername(usuario)
      const { data: perfil } = await supabase.from('perfiles').select('*').eq('username', usuario).single()
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
        }
      }

      const { data } = await supabase.from('celebraciones').select('*').eq('organizador_id', perfil.user_id).order('fecha', { ascending: true })
      setCelebraciones(data || [])
      setCargando(false)
    })
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
    await supabase.from('invitados').delete().eq('celebracion_slug', slug)
    await supabase.from('rsvps').delete().eq('celebracion_slug', slug)
    await supabase.from('celebraciones').delete().eq('slug', slug)
    setCelebraciones(prev => prev.filter(c => c.slug !== slug))
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (cargando) return (
    <main style={{ minHeight:'100vh', background:BG, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:F }}>
      <p style={{ color:'#AFA9EC' }}>{t[lang as 'es'|'en'].loading}</p>
    </main>
  )

  const nombre = perfilAuth?.nombre_completo || user?.user_metadata?.name?.split(' ')[0] || username
  const avatar = user?.user_metadata?.avatar_url
  const plan = perfilAuth?.plan || 'free'
  const { grupos, pasadas, pasadasBloqueadas, sinFecha } = agruparPorTrimestre(celebraciones, lang, plan)

  const CelCard = ({ cel }: { cel: any }) => (
    <div onClick={() => router.push(`/${cel.slug}`)} style={{ display:'flex', alignItems:'center', gap:14, padding:'1rem 1.25rem', background:'rgba(255,255,255,.06)', borderRadius:16, cursor:'pointer', border:'1px solid rgba(255,255,255,.08)', marginBottom:10, position:'relative' }}>
      <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#534AB7,#D4537E)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
        {cel.portada_url
          ? <img src={cel.portada_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <span style={{ fontSize:11, fontWeight:800, color:'#fff', textTransform:'uppercase', letterSpacing:'.5px' }}>{CHIPS[cel.tipo] || 'EVT'}</span>}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:15, fontWeight:700, color:'#EEEDFE', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cel.nombre}</div>
        <div style={{ fontSize:12, color:'#AFA9EC', marginTop:1 }}>
          {cel.fecha ? new Date(cel.fecha).toLocaleDateString(lang==='en'?'en-US':'es-MX', { month:'short', day:'numeric', year:'numeric' }) : 'Sin fecha'}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
        {cel.es_sorpresa && esPropio && <span style={{ fontSize:11, fontWeight:700, color:'#D4537E', background:'rgba(212,83,126,.15)', padding:'2px 8px', borderRadius:99 }}>{tx.surprise}</span>}
        {esPropio && <button onClick={e => { e.stopPropagation(); archivar(cel.slug, cel.archivada) }} style={{ border:'none', background:'rgba(255,255,255,.06)', color:'rgba(255,255,255,.35)', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:99, cursor:'pointer', fontFamily:F }}>
          {cel.archivada ? (lang==='en'?'Unarchive':'Desarchivar') : (lang==='en'?'Archive':'Archivar')}
        </button>}
        {esPropio && <button onClick={e => { e.stopPropagation(); eliminar(cel.slug) }} style={{ border:'none', background:'rgba(212,83,126,.1)', color:'rgba(212,83,126,.6)', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:99, cursor:'pointer', fontFamily:F }}>
          {lang==='en'?'Delete':'Eliminar'}
        </button>}
        <span style={{ fontSize:18, color:'#AFA9EC' }}>→</span>
      </div>
    </div>
  )

  return (
    <main style={{ minHeight:'100vh', background:BG, fontFamily:F, padding:'2rem 1.5rem' }}>
      <div style={{ maxWidth:560, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'2rem' }}>
          <div>
            <div style={{ fontSize:24, fontWeight:900, background:'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'-.5px', marginBottom:4 }}>Cheers</div>
            {esPropio
              ? <h1 style={{ fontSize:22, fontWeight:700, color:'#EEEDFE', margin:0 }}>{lang==='en'?`Hi, ${nombre}`:`Hola, ${nombre}`}</h1>
              : <h1 style={{ fontSize:18, fontWeight:700, color:'#EEEDFE', margin:0 }}>@{username}</h1>}
          </div>

          {esPropio && (
            <div style={{ position:'relative' }}>
              <button onClick={() => setShowMenu(v => !v)} style={{ width:44, height:44, borderRadius:'50%', border:'2px solid rgba(255,255,255,.15)', background:'rgba(255,255,255,.06)', overflow:'hidden', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {avatar
                  ? <img src={avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <span style={{ fontSize:16, fontWeight:800, color:'#fff' }}>{nombre[0]?.toUpperCase()}</span>}
              </button>
              {showMenu && (
                <>
                  <div onClick={() => setShowMenu(false)} style={{ position:'fixed', inset:0, zIndex:10 }} />
                  <div style={{ position:'absolute', right:0, top:52, background:'#1a1740', border:'1px solid rgba(255,255,255,.1)', borderRadius:16, padding:'8px', minWidth:200, boxShadow:'0 16px 40px rgba(0,0,0,.4)', zIndex:20 }}>
                    <div style={{ padding:'8px 12px', marginBottom:4 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#EEEDFE', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nombre}</div>
                      <div style={{ fontSize:12, color:'#AFA9EC' }}>@{username}</div>
                      <div style={{ fontSize:11, fontWeight:800, color:plan==='lifetime'?'#D4537E':plan==='pro'?'#534AB7':'#7a7494', marginTop:3, textTransform:'uppercase', letterSpacing:'.5px' }}>{plan}</div>
                    </div>
                    <div style={{ borderTop:'1px solid rgba(255,255,255,.08)', paddingTop:8 }}>
                      {[
                        { label: lang==='en'?'My profile':'Mi perfil', action: () => { router.push('/perfil'); setShowMenu(false) } },
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

        {/* Botón nueva celebración */}
        {esPropio && (
          <button onClick={() => router.push('/nueva')} style={{ width:'100%', padding:'1rem', background:'linear-gradient(135deg,#534AB7,#D4537E)', border:'none', borderRadius:16, color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer', marginBottom:'2rem', boxShadow:'0 8px 24px rgba(212,83,126,.3)', fontFamily:F }}>
            {tx.new_celebration}
          </button>
        )}

        {/* Sin celebraciones */}
        {celebraciones.filter(c => !c.archivada).length === 0 && (
          <div style={{ textAlign:'center', padding:'2rem', background:'rgba(255,255,255,.06)', borderRadius:16, marginBottom:16 }}>
            <p style={{ color:'#AFA9EC', fontSize:15, margin:0 }}>{esPropio ? tx.no_celebrations : tx.no_public}</p>
          </div>
        )}

        {/* Sin fecha */}
        {sinFecha.length > 0 && (
          <div style={{ marginBottom:24 }}>
            <p style={{ fontSize:11, fontWeight:800, letterSpacing:'1px', color:'#AFA9EC', textTransform:'uppercase', margin:'0 0 10px 4px' }}>{lang==='en'?'No date set':'Sin fecha'}</p>
            {sinFecha.map(cel => <CelCard key={cel.slug} cel={cel} />)}
          </div>
        )}

        {/* Por trimestre */}
        {Object.keys(grupos).sort().map(key => (
          <div key={key} style={{ marginBottom:24 }}>
            <p style={{ fontSize:11, fontWeight:800, letterSpacing:'1px', color:'#AFA9EC', textTransform:'uppercase', margin:'0 0 10px 4px' }}>{quarterLabel(key, lang)}</p>
            {grupos[key].map(cel => <CelCard key={cel.slug} cel={cel} />)}
          </div>
        ))}

        {/* Pasadas */}
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

        {/* Archivadas */}
        {esPropio && celebraciones.filter(c => c.archivada).length > 0 && (
          <p style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,.2)', marginTop:8 }}>
            {celebraciones.filter(c => c.archivada).length} {lang==='en'?'archived':'archivadas'}
          </p>
        )}

      </div>
    </main>
  )
}