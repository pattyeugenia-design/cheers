'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { getLang, t, RESERVED_USERNAMES } from '../i18n'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const BG = 'linear-gradient(160deg,#241c45,#302b63,#24243e)'

function slugifyUsername(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30)
}

const PLANES: Record<string, { label: string; color: string; bg: string }> = {
  free:     { label: 'Free',     color: '#7a7494', bg: '#f0edf8' },
  pro:      { label: 'Pro',      color: '#534AB7', bg: '#EEEDFE' },
  lifetime: { label: 'Lifetime', color: '#D4537E', bg: '#FCE9F0' },
}

export default function Perfil() {
  const router = useRouter()
  const [tx, setTx] = useState(t.es)
  const [lang, setLang] = useState('es')
  const [user, setUser] = useState<any>(null)
  const [perfil, setPerfil] = useState<any>(null)
  const [cargando, setCargando] = useState(true)

  const [username, setUsername] = useState('')
  const [usernameDisponible, setUsernameDisponible] = useState<boolean | null>(null)
  const [verificandoUsername, setVerificandoUsername] = useState(false)
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [cerrandoSesion, setCerrandoSesion] = useState(false)

  useEffect(() => {
    const l = getLang(); setLang(l); setTx(t[l])
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data } = await supabase.from('perfiles').select('*').eq('user_id', user.id).single()
      if (data) {
        setPerfil(data)
        setUsername(data.username || '')
        setNombreCompleto(data.nombre_completo || user.user_metadata?.name || '')
      }
      setCargando(false)
    })
  }, [])

  useEffect(() => {
    if (!username || username === perfil?.username) { setUsernameDisponible(null); return }
    if (username.length < 3) { setUsernameDisponible(null); return }
    if (RESERVED_USERNAMES.includes(username)) { setUsernameDisponible(false); return }
    setVerificandoUsername(true)
    const timeout = setTimeout(async () => {
      const { data } = await supabase.from('perfiles').select('username').eq('username', username).single()
      setUsernameDisponible(!data)
      setVerificandoUsername(false)
    }, 500)
    return () => clearTimeout(timeout)
  }, [username, perfil?.username])

  async function guardar() {
    if (!perfil || guardando) return
    if (username !== perfil.username && usernameDisponible === false) return
    setGuardando(true)
    await supabase.from('perfiles').update({
      username: username || perfil.username,
      nombre_completo: nombreCompleto,
    }).eq('user_id', user.id)
    setGuardado(true); setGuardando(false)
    setTimeout(() => setGuardado(false), 3000)
  }

  async function cerrarSesion() {
    setCerrandoSesion(true)
    await supabase.auth.signOut()
    router.push('/')
  }

  if (cargando) return (
    <main style={{ minHeight:'100vh', background:BG, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:F }}>
      <p style={{ color:'#AFA9EC' }}>Cargando...</p>
    </main>
  )

  const plan = perfil?.plan || 'free'
  const planInfo = PLANES[plan] || PLANES.free
  const avatar = user?.user_metadata?.avatar_url || perfil?.avatar_url

  return (
    <main style={{ minHeight:'100vh', background:BG, fontFamily:F, padding:'2rem 1.5rem' }}>
      <div style={{ maxWidth:480, margin:'0 auto' }}>

        <button onClick={() => router.back()} style={{ border:'none', background:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.6)', fontSize:13, fontWeight:700, padding:'8px 16px', borderRadius:99, cursor:'pointer', fontFamily:F, marginBottom:28 }}>← {lang === 'en' ? 'Back' : 'Atrás'}</button>

        {/* Header perfil */}
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:32 }}>
          <div style={{ width:64, height:64, borderRadius:'50%', overflow:'hidden', background:'linear-gradient(135deg,#534AB7,#D4537E)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {avatar
              ? <img src={avatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <span style={{ fontSize:24, fontWeight:800, color:'#fff' }}>{(nombreCompleto || user?.email || '?')[0].toUpperCase()}</span>}
          </div>
          <div>
            <div style={{ fontSize:20, fontWeight:800, color:'#EEEDFE', letterSpacing:'-.4px' }}>{nombreCompleto || user?.email}</div>
            <div style={{ fontSize:13, color:'#AFA9EC', marginTop:2 }}>@{perfil?.username}</div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:planInfo.bg, borderRadius:99, padding:'3px 10px', marginTop:6 }}>
              <span style={{ fontSize:12, fontWeight:800, color:planInfo.color }}>{planInfo.label}</span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div style={{ background:'rgba(255,255,255,.06)', borderRadius:20, padding:'24px 20px', marginBottom:16 }}>
          <h2 style={{ fontSize:16, fontWeight:800, color:'#EEEDFE', margin:'0 0 20px' }}>{lang === 'en' ? 'Your information' : 'Tu información'}</h2>

          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:800, color:'#AFA9EC', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:6 }}>{lang === 'en' ? 'Full name' : 'Nombre completo'}</label>
            <input value={nombreCompleto} onChange={e => setNombreCompleto(e.target.value)} style={{ width:'100%', boxSizing:'border-box', border:'1.5px solid rgba(255,255,255,.15)', background:'rgba(255,255,255,.06)', color:'#EEEDFE', fontFamily:F, fontSize:15, fontWeight:600, padding:'10px 14px', borderRadius:12, outline:'none' }} />
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, fontWeight:800, color:'#AFA9EC', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:6 }}>Username</label>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,.06)', border:'1.5px solid rgba(255,255,255,.15)', borderRadius:12, padding:'10px 14px' }}>
              <span style={{ fontSize:14, color:'rgba(255,255,255,.4)', fontWeight:600, whiteSpace:'nowrap' }}>joincheers.app/</span>
              <input value={username} onChange={e => setUsername(slugifyUsername(e.target.value))} style={{ flex:1, border:'none', background:'transparent', color:'#EEEDFE', fontFamily:F, fontSize:15, fontWeight:700, outline:'none', minWidth:0 }} maxLength={30} />
              {verificandoUsername && <span style={{ fontSize:12, color:'#AFA9EC', flexShrink:0 }}>...</span>}
              {!verificandoUsername && username !== perfil?.username && usernameDisponible === true && <span style={{ fontSize:12, fontWeight:700, color:'#4ade80', flexShrink:0 }}>{lang === 'en' ? 'Available' : 'Disponible'}</span>}
              {!verificandoUsername && username !== perfil?.username && usernameDisponible === false && <span style={{ fontSize:12, fontWeight:700, color:'#f08cb0', flexShrink:0 }}>{lang === 'en' ? 'Taken' : 'No disponible'}</span>}
            </div>
            {username !== perfil?.username && <p style={{ fontSize:11, color:'rgba(255,255,255,.35)', margin:'6px 0 0' }}>
              {lang === 'en' ? '⚠ Changing your username will update all your event URLs.' : '⚠ Cambiar tu username actualizará las URLs de todos tus eventos.'}
            </p>}
          </div>

          <button onClick={guardar} disabled={guardando || (username !== perfil?.username && usernameDisponible === false)} style={{ width:'100%', border:'none', background:guardado?'#1f8a5b':'linear-gradient(135deg,#534AB7,#D4537E)', color:'#fff', fontSize:15, fontWeight:800, padding:'14px', borderRadius:14, cursor:'pointer', fontFamily:F, transition:'background .2s' }}>
            {guardando ? '...' : guardado ? (lang === 'en' ? '✓ Saved' : '✓ Guardado') : (lang === 'en' ? 'Save changes' : 'Guardar cambios')}
          </button>
        </div>

        {/* Plan */}
        <div style={{ background:'rgba(255,255,255,.06)', borderRadius:20, padding:'24px 20px', marginBottom:16 }}>
          <h2 style={{ fontSize:16, fontWeight:800, color:'#EEEDFE', margin:'0 0 16px' }}>{lang === 'en' ? 'Your plan' : 'Tu plan'}</h2>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontSize:22, fontWeight:900, color:'#EEEDFE' }}>{planInfo.label}</div>
              <div style={{ fontSize:13, color:'#AFA9EC', marginTop:3 }}>
                {plan === 'free' && (lang === 'en' ? 'Up to 3 guests per celebration' : 'Hasta 3 invitados por celebración')}
                {plan === 'pro' && (lang === 'en' ? 'Up to 10 guests per celebration' : 'Hasta 10 invitados por celebración')}
                {plan === 'lifetime' && (lang === 'en' ? 'Unlimited guests · Everything included' : 'Invitados ilimitados · Todo incluido')}
              </div>
            </div>
            {plan !== 'lifetime' && (
              <button style={{ border:'none', background:'linear-gradient(135deg,#534AB7,#D4537E)', color:'#fff', fontSize:13, fontWeight:800, padding:'10px 18px', borderRadius:12, cursor:'pointer', fontFamily:F }}>
                {lang === 'en' ? 'Upgrade →' : 'Mejorar plan →'}
              </button>
            )}
          </div>
        </div>

        {/* Cerrar sesión */}
        <button onClick={cerrarSesion} disabled={cerrandoSesion} style={{ width:'100%', border:'1.5px solid rgba(255,255,255,.1)', background:'none', color:'rgba(255,255,255,.5)', fontSize:14, fontWeight:700, padding:'14px', borderRadius:14, cursor:'pointer', fontFamily:F, marginBottom:12 }}>
          {cerrandoSesion ? '...' : (lang === 'en' ? 'Sign out' : 'Cerrar sesión')}
        </button>

        <p style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,.2)' }}>
          <a href="/privacidad" style={{ color:'rgba(255,255,255,.3)', textDecoration:'none' }}>{lang === 'en' ? 'Privacy' : 'Privacidad'}</a>
          {' · '}
          <a href="/terminos" style={{ color:'rgba(255,255,255,.3)', textDecoration:'none' }}>{lang === 'en' ? 'Terms' : 'Términos'}</a>
        </p>
      </div>
    </main>
  )
}