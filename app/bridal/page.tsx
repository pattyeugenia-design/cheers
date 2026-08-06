'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { getLang } from '../i18n'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const BG = 'linear-gradient(160deg,#3a1f3d,#4a2245,#2a1a3e)'

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.06)',
  color: '#fff', fontSize: 14, padding: '11px 14px', borderRadius: 10, fontFamily: F, marginBottom: 12,
}

export default function Bridal() {
  const router = useRouter()
  const [lang, setLang] = useState('es')
  const [user, setUser] = useState<any>(null)
  const [plan, setPlan] = useState<string>('free')
  const [cargando, setCargando] = useState(true)
  const [comprando, setComprando] = useState(false)
  const [activando, setActivando] = useState(false)

  const [proyectos, setProyectos] = useState<any[]>([])
  const [creando, setCreando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [nombreNovia, setNombreNovia] = useState('')
  const [nombreNovio, setNombreNovio] = useState('')
  const [fechaBoda, setFechaBoda] = useState('')
  const [presupuestoTotal, setPresupuestoTotal] = useState('')
  const [error, setError] = useState('')

  async function cargarProyectos(userId: string) {
    const { data } = await supabase
      .from('proyectos_boda_miembros')
      .select('boda_id, rol, proyectos_boda(id, nombre_novia, nombre_novio, fecha_boda, presupuesto_total, created_at)')
      .eq('user_id', userId)
    const lista = (data || []).map((m: any) => m.proyectos_boda).filter(Boolean)
    setProyectos(lista)
  }

  useEffect(() => {
    setLang(getLang())
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        sessionStorage.setItem('redirect_after_login', '/bridal')
        router.push('/login')
        return
      }
      setUser(user)
      const { data: perfil } = await supabase.from('perfiles').select('plan').eq('user_id', user.id).single()
      setPlan(perfil?.plan || 'free')
      if (perfil?.plan === 'lifetime') await cargarProyectos(user.id)
      setCargando(false)
    }).catch(async () => {
      await supabase.auth.signOut().catch(() => {})
      router.push('/login')
    })
  }, [])

  // Después de pagar, Stripe redirige aquí con ?compra=exitosa — el webhook
  // actualiza el plan en la base de forma asíncrona, así que hay que
  // sondear unos segundos hasta que perfiles.plan diga "lifetime".
  useEffect(() => {
    if (!user) return
    const compra = new URLSearchParams(window.location.search).get('compra')
    if (compra !== 'exitosa') return
    setActivando(true)
    let intentos = 0
    const interval = setInterval(async () => {
      intentos++
      const { data } = await supabase.from('perfiles').select('plan').eq('user_id', user.id).single()
      if (data?.plan === 'lifetime' || intentos >= 6) {
        if (data?.plan === 'lifetime') { setPlan('lifetime'); await cargarProyectos(user.id) }
        clearInterval(interval)
        setActivando(false)
        window.history.replaceState({}, '', '/bridal')
      }
    }, 1500)
    return () => clearInterval(interval)
  }, [user])

  async function comprar() {
    setComprando(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: session?.access_token, tipo: 'lifetime', returnTo: 'bridal' }),
    })
    const data = await res.json()
    if (res.ok && data.url) {
      window.location.href = data.url
    } else {
      setComprando(false)
      alert(lang === 'en' ? 'Something went wrong, please try again.' : 'Algo salió mal, intenta de nuevo.')
    }
  }

  async function crearProyecto() {
    if (!user) return
    if (!nombreNovia.trim() && !nombreNovio.trim()) {
      setError(lang === 'en' ? 'Add at least one name' : 'Agrega al menos un nombre')
      return
    }
    setError('')
    setGuardando(true)
    const { data: boda, error: errBoda } = await supabase
      .from('proyectos_boda')
      .insert({
        creador_id: user.id,
        nombre_novia: nombreNovia.trim() || null,
        nombre_novio: nombreNovio.trim() || null,
        fecha_boda: fechaBoda || null,
        presupuesto_total: presupuestoTotal ? Number(presupuestoTotal) : null,
      })
      .select('id')
      .single()

    if (errBoda || !boda) {
      setGuardando(false)
      setError(lang === 'en' ? 'Something went wrong, please try again.' : 'Algo salió mal, intenta de nuevo.')
      return
    }

    await supabase.from('proyectos_boda_miembros').insert({ boda_id: boda.id, user_id: user.id, rol: 'creador' })

    setGuardando(false)
    setCreando(false)
    await cargarProyectos(user.id)
  }

  if (cargando) return (
    <main style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
      <p style={{ color: '#EEC9DD' }}>{lang === 'en' ? 'Loading…' : 'Cargando…'}</p>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: BG, fontFamily: F, padding: '60px 20px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <button onClick={() => router.push('/perfil')} style={{ border: 'none', background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 99, cursor: 'pointer', fontFamily: F, marginBottom: 28 }}>
          {lang === 'en' ? '← Back' : '← Atrás'}
        </button>

        <h1 style={{ fontSize: 30, fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-.5px' }}>Cheers Bridal</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.55)', marginBottom: 32 }}>
          {lang === 'en' ? 'Everything to plan your wedding, in one place.' : 'Todo para planear tu boda, en un solo lugar.'}
        </p>

        {activando && (
          <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 16, padding: '16px 18px', marginBottom: 20, color: '#EEC9DD', fontSize: 13, fontWeight: 700 }}>
            {lang === 'en' ? 'Activating your account…' : 'Activando tu cuenta…'}
          </div>
        )}

        {plan !== 'lifetime' ? (
          <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 20, padding: '28px 24px' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
              {lang === 'en' ? 'Included with Extra Cheer' : 'Incluido con Extra Cheer'}
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.6, marginBottom: 20 }}>
              {lang === 'en'
                ? 'Cheers Bridal is not a separate purchase — buying Extra Cheer ($49, one time) unlocks it, plus everything Extra Cheer already includes for the rest of your celebrations, forever.'
                : 'Cheers Bridal no se compra aparte — con Extra Cheer ($49, pago único) lo desbloqueas, además de todo lo que Extra Cheer ya incluye para el resto de tus celebraciones, para siempre.'}
            </p>
            <button onClick={comprar} disabled={comprando} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 14, fontWeight: 800, padding: '12px 20px', borderRadius: 12, cursor: 'pointer', fontFamily: F }}>
              {comprando ? '...' : (lang === 'en' ? 'Get Extra Cheer — $49 →' : 'Comprar Extra Cheer — $49 →')}
            </button>
          </div>
        ) : proyectos.length === 0 && !creando ? (
          <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 20, padding: '28px 24px', textAlign: 'center' as const }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', marginBottom: 18 }}>
              {lang === 'en' ? "You don't have a wedding project yet." : 'Todavía no tienes un proyecto de boda.'}
            </p>
            <button onClick={() => setCreando(true)} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 14, fontWeight: 800, padding: '12px 20px', borderRadius: 12, cursor: 'pointer', fontFamily: F }}>
              {lang === 'en' ? '+ Start planning' : '+ Empezar a planear'}
            </button>
          </div>
        ) : creando ? (
          <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 20, padding: '24px 22px' }}>
            <input value={nombreNovia} onChange={e => setNombreNovia(e.target.value)} placeholder={lang === 'en' ? "Bride's name" : 'Nombre de la novia'} style={inputStyle} />
            <input value={nombreNovio} onChange={e => setNombreNovio(e.target.value)} placeholder={lang === 'en' ? "Groom's name" : 'Nombre del novio'} style={inputStyle} />
            <input type="date" value={fechaBoda} onChange={e => setFechaBoda(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' as const }} />
            <input type="number" value={presupuestoTotal} onChange={e => setPresupuestoTotal(e.target.value)} placeholder={lang === 'en' ? 'Total budget (optional)' : 'Presupuesto total (opcional)'} style={inputStyle} />
            {error && <p style={{ color: '#f4a3a3', fontSize: 12, marginBottom: 10 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={crearProyecto} disabled={guardando} style={{ flex: 1, border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 14, fontWeight: 800, padding: '11px', borderRadius: 10, cursor: 'pointer', fontFamily: F }}>
                {guardando ? '...' : (lang === 'en' ? 'Create project' : 'Crear proyecto')}
              </button>
              <button onClick={() => setCreando(false)} style={{ border: '1px solid rgba(255,255,255,.15)', background: 'transparent', color: 'rgba(255,255,255,.7)', fontSize: 14, fontWeight: 700, padding: '11px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: F }}>
                {lang === 'en' ? 'Cancel' : 'Cancelar'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            {proyectos.map(p => (
              <div key={p.id} onClick={() => router.push(`/bridal/${p.id}`)} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 18, padding: '20px 22px', cursor: 'pointer' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
                  {[p.nombre_novia, p.nombre_novio].filter(Boolean).join(' & ') || (lang === 'en' ? 'Your wedding' : 'Tu boda')}
                </div>
                {p.fecha_boda && <div style={{ fontSize: 13, color: '#EEC9DD', marginTop: 4 }}>{p.fecha_boda}</div>}
                <div style={{ fontSize: 12, color: '#AFA9EC', marginTop: 14, fontWeight: 700 }}>
                  {lang === 'en' ? 'Open budget, timeline & boards →' : 'Abrir presupuesto, timeline y tableros →'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
