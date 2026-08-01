'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [listo, setListo] = useState(false)
  // El link de recuperación deja una sesión temporal antes de que este
  // componente monte. Si alguien llega aquí sin pasar por ese link (o el
  // link ya venció), no hay sesión — mostramos un mensaje claro en vez de
  // dejar que truene al guardar.
  const [sesionValida, setSesionValida] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSesionValida(!!user)
    })
  }, [])

  async function guardar() {
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (password !== password2) { setError('Las contraseñas no coinciden.'); return }
    setCargando(true)
    setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    setCargando(false)
    if (err) {
      setError('No se pudo actualizar. El link puede haber vencido — pide uno nuevo desde el login.')
      return
    }
    setListo(true)
    setTimeout(() => router.push('/login'), 2000)
  }

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#534AB7,#7b46a8,#D4537E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, padding: '0 20px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>Cheers</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.97)', borderRadius: 26, padding: '32px 28px', boxShadow: '0 24px 64px rgba(83,74,183,.3)' }}>
          {sesionValida === null ? (
            <p style={{ fontSize: 14, color: '#6b6585', margin: 0, textAlign: 'center' }}>Cargando...</p>
          ) : sesionValida === false ? (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1c1830', margin: '0 0 8px', letterSpacing: '-.4px' }}>Este link ya no es válido</h2>
              <p style={{ fontSize: 14, color: '#6b6585', margin: '0 0 20px' }}>Pide un link nuevo desde la pantalla de inicio de sesión.</p>
              <button
                onClick={() => router.push('/login')}
                style={{ width: '100%', border: 'none', borderRadius: 14, padding: '13px', fontSize: 15, fontWeight: 800, cursor: 'pointer', color: '#fff', background: 'linear-gradient(135deg,#534AB7,#D4537E)', fontFamily: FONT }}
              >
                Ir al login
              </button>
            </>
          ) : listo ? (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1c1830', margin: '0 0 8px', letterSpacing: '-.4px' }}>Contraseña actualizada</h2>
              <p style={{ fontSize: 14, color: '#6b6585', margin: 0 }}>Te llevamos a iniciar sesión...</p>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1c1830', margin: '0 0 8px', letterSpacing: '-.4px' }}>Nueva contraseña</h2>
              <p style={{ fontSize: 14, color: '#6b6585', margin: '0 0 20px' }}>Escribe tu nueva contraseña.</p>

              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nueva contraseña"
                style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #e8e4f5', background: '#fff', fontFamily: FONT, fontSize: 15, color: '#2a2440', padding: '12px 14px', borderRadius: 12, outline: 'none', marginBottom: 10 }}
              />
              <input
                type="password"
                value={password2}
                onChange={e => setPassword2(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && guardar()}
                placeholder="Confirma la contraseña"
                style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #e8e4f5', background: '#fff', fontFamily: FONT, fontSize: 15, color: '#2a2440', padding: '12px 14px', borderRadius: 12, outline: 'none', marginBottom: 10 }}
              />

              {error && <p style={{ fontSize: 13, color: '#D4537E', margin: '0 0 10px', fontWeight: 600 }}>{error}</p>}

              <button
                onClick={guardar}
                disabled={cargando || !password || !password2}
                style={{ width: '100%', border: 'none', borderRadius: 14, padding: '13px', fontSize: 15, fontWeight: 800, cursor: (cargando || !password || !password2) ? 'not-allowed' : 'pointer', color: '#fff', background: 'linear-gradient(135deg,#534AB7,#D4537E)', opacity: (!cargando && (!password || !password2)) ? 0.45 : 1, transition: 'opacity .15s', fontFamily: FONT }}
              >
                {cargando ? '...' : 'Guardar contraseña'}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
