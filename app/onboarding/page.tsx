'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
const BG = 'radial-gradient(circle at 12% 18%,rgba(127,119,221,.55),transparent 45%),radial-gradient(circle at 88% 82%,rgba(212,83,126,.5),transparent 50%),linear-gradient(160deg,#534AB7 0%,#7b46a8 52%,#D4537E 100%)'

function slugifyUsername(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30)
}

export default function Onboarding() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [username, setUsername] = useState('')
  const [disponible, setDisponible] = useState<boolean | null>(null)
  const [verificando, setVerificando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const timeoutRef = useRef<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }

      // Si ya tiene username, redirigir a su página
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('username')
        .eq('user_id', user.id)
        .single()

      if (perfil?.username) {
        router.push(`/${perfil.username}`)
        return
      }

      setUser(user)

      // Sugerir username basado en nombre de Google
      const nombre = user.user_metadata?.name || ''
      const sugerido = slugifyUsername(nombre.replace(/\s+/g, '_'))
      if (sugerido) setUsername(sugerido)
    })
  }, [])

  useEffect(() => {
    if (!username || username.length < 3) {
      setDisponible(null)
      return
    }
    setVerificando(true)
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('perfiles')
        .select('username')
        .eq('username', username)
        .single()
      setDisponible(!data)
      setVerificando(false)
    }, 500)
  }, [username])

  async function confirmar() {
    if (!disponible || !user || username.length < 3) return
    setGuardando(true)
    setError('')

    const { error: err } = await supabase.from('perfiles').insert({
      user_id: user.id,
      username,
    })

    if (err) {
      setError('Ese username ya está tomado. Intenta otro.')
      setGuardando(false)
      return
    }

    router.push(`/${username}`)
  }

  const nombreSugerido = user?.user_metadata?.name?.split(' ')[0] || 'tú'

  return (
    <main style={{ minHeight: '100vh', background: BG, fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-.5px', marginBottom: 8 }}>Cheers</div>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.8)', margin: 0 }}>Bienvenida, {nombreSugerido}. Elige tu username.</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 26, padding: '32px 28px', boxShadow: '0 24px 64px rgba(83,74,183,.2)' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1c1830', margin: '0 0 8px', letterSpacing: '-.5px' }}>Tu link en Cheers</h1>
          <p style={{ fontSize: 14, color: '#6b6585', margin: '0 0 24px', lineHeight: 1.5 }}>
            Este será tu link permanente. Puedes usar letras, números y guiones bajos.
          </p>

          {/* Preview del link */}
          <div style={{ background: '#F5F4FB', borderRadius: 14, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, color: '#a39ec0', fontWeight: 600, whiteSpace: 'nowrap' }}>joincheers.app/</span>
            <input
              value={username}
              onChange={e => setUsername(slugifyUsername(e.target.value))}
              onKeyDown={e => { if (e.key === 'Enter') confirmar() }}
              placeholder="tuusername"
              autoFocus
              maxLength={30}
              style={{ flex: 1, border: 'none', background: 'transparent', fontFamily: FONT, fontSize: 15, fontWeight: 800, color: '#2a2440', outline: 'none', minWidth: 0 }}
            />
            {verificando && <span style={{ fontSize: 12, color: '#a39ec0' }}>...</span>}
            {!verificando && disponible === true && username.length >= 3 && (
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1f8a5b' }}>Disponible</span>
            )}
            {!verificando && disponible === false && (
              <span style={{ fontSize: 13, fontWeight: 700, color: '#D4537E' }}>No disponible</span>
            )}
          </div>

          {username.length > 0 && username.length < 3 && (
            <p style={{ fontSize: 12, color: '#D4537E', margin: '0 0 12px', fontWeight: 600 }}>Mínimo 3 caracteres</p>
          )}

          {error && (
            <p style={{ fontSize: 13, color: '#D4537E', margin: '0 0 12px', fontWeight: 600 }}>{error}</p>
          )}

          <div style={{ fontSize: 12, color: '#a39ec0', margin: '0 0 20px', lineHeight: 1.5 }}>
            Solo letras minúsculas, números y guiones bajos (_). Sin espacios ni caracteres especiales.
          </div>

          <button
            onClick={confirmar}
            disabled={!disponible || guardando || username.length < 3}
            style={{
              width: '100%', border: 'none', borderRadius: 14, padding: '15px',
              fontSize: 16, fontWeight: 800, cursor: (!disponible || guardando || username.length < 3) ? 'not-allowed' : 'pointer',
              color: (!disponible || username.length < 3) ? '#a79fc4' : '#fff',
              background: (!disponible || username.length < 3) ? '#EAE7F6' : 'linear-gradient(135deg,#534AB7,#D4537E)',
              boxShadow: (!disponible || username.length < 3) ? 'none' : '0 12px 28px rgba(83,74,183,.32)',
              fontFamily: FONT, transition: 'all .15s',
            }}
          >
            {guardando ? 'Guardando...' : 'Confirmar username →'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,.6)', marginTop: 20 }}>
          Puedes cambiarlo después desde tu perfil.
        </p>
      </div>
    </main>
  )
}