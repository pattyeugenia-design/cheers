'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { getLang, t } from '../i18n'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const BG = 'linear-gradient(160deg,#241c45,#302b63,#24243e)'

const CHIPS: Record<string, string> = {
  cumple: 'BDAY', cumpleanos: 'BDAY', cena: 'DINE', viaje: 'TRIP',
  reunion: 'MEET', evento: 'EVENT', otro: 'OTHER'
}

export default function Celebraciones({ params }: { params: Promise<{ usuario: string }> }) {
  const router = useRouter()
  const [tx, setTx] = useState(t.es)
  const [user, setUser] = useState<any>(null)
  const [celebraciones, setCelebraciones] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [esPropio, setEsPropio] = useState(false)
  const [username, setUsername] = useState('')
  const [perfilExiste, setPerfilExiste] = useState(true)

  useEffect(() => {
    const lang = getLang()
    setTx(t[lang])

    params.then(async ({ usuario }) => {
      setUsername(usuario)

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('user_id, username')
        .eq('username', usuario)
        .single()

      if (!perfil) { setPerfilExiste(false); setCargando(false); return }

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setUser(authUser)
        setEsPropio(authUser.id === perfil.user_id)
      }

      const { data } = await supabase
        .from('celebraciones')
        .select('*')
        .eq('organizador_id', perfil.user_id)
        .order('created_at', { ascending: false })

      setCelebraciones(data || [])
      setCargando(false)
    })
  }, [])

  const nombre = user?.user_metadata?.name?.split(' ')[0] || username

  function slugToPath(slug: string) {
    return `/${slug}`
  }

  if (cargando) return (
    <main style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
      <p style={{ color: '#AFA9EC' }}>{tx.loading}</p>
    </main>
  )

  if (!perfilExiste) return (
    <main style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '2.5rem', maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1c1830', marginBottom: 8 }}>404</div>
        <p style={{ fontSize: 14, color: '#6b6585', margin: '0 0 20px' }}>@{username} {tx.no_public}</p>
        <button onClick={() => router.push('/')} style={{ border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 15, fontWeight: 700, padding: '12px 24px', borderRadius: 14, cursor: 'pointer', fontFamily: F }}>{tx.go_home}</button>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: BG, fontFamily: F, padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#EEEDFE', margin: '0 0 4px', letterSpacing: '-.5px' }}>{tx.cheers}</div>
          {esPropio ? (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#EEEDFE', margin: '0 0 4px', letterSpacing: '-.5px' }}>{tx.hello(nombre)}</h1>
              <p style={{ fontSize: 14, color: '#AFA9EC', margin: 0 }}>{user?.email}</p>
            </>
          ) : (
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#EEEDFE', margin: '0 0 4px' }}>{tx.celebrations_of(username)}</h1>
          )}
        </div>

        {esPropio && (
          <button
            onClick={() => router.push('/nueva')}
            style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg,#534AB7,#D4537E)', border: 'none', borderRadius: 16, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: '2rem', boxShadow: '0 8px 24px rgba(212,83,126,.3)', fontFamily: F }}
          >
            {tx.new_celebration}
          </button>
        )}

        {celebraciones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,.06)', borderRadius: 16 }}>
            <p style={{ color: '#AFA9EC', fontSize: 15, margin: 0 }}>
              {esPropio ? tx.no_celebrations : tx.no_public}
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px', color: '#AFA9EC', textTransform: 'uppercase', margin: '0 0 12px 4px' }}>
              {esPropio ? tx.your_celebrations : tx.celebrations_of(username)}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {celebraciones.map(cel => (
                <div
                  key={cel.slug}
                  onClick={() => router.push(slugToPath(cel.slug))}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '1rem 1.25rem', background: 'rgba(255,255,255,.06)', borderRadius: 16, cursor: 'pointer', border: '1px solid rgba(255,255,255,.08)' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#534AB7,#D4537E)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '.5px' }}>{CHIPS[cel.tipo] || 'EVT'}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#EEEDFE', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cel.nombre}</div>
                    <div style={{ fontSize: 12, color: '#AFA9EC', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>joincheers.app/{cel.slug}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    {cel.es_sorpresa && esPropio && <span style={{ fontSize: 11, fontWeight: 700, color: '#D4537E', background: 'rgba(212,83,126,.15)', padding: '2px 8px', borderRadius: 99 }}>{tx.surprise}</span>}
                    <span style={{ fontSize: 20, color: '#AFA9EC' }}>→</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!user && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button onClick={() => router.push('/login')} style={{ border: 'none', background: 'rgba(255,255,255,.1)', color: '#EEEDFE', fontSize: 14, fontWeight: 700, padding: '12px 24px', borderRadius: 14, cursor: 'pointer', fontFamily: F }}>
              {tx.sign_in_prompt}
            </button>
          </div>
        )}

      </div>
    </main>
  )
}