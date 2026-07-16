'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'

export default function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCargando(true)
    const res = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setCargando(false)
    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      setError('Password incorrecto')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0b1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
      <form onSubmit={entrar} style={{ width: '100%', maxWidth: 340, padding: '32px 28px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 900, background: 'linear-gradient(135deg,#a89df0,#f08cb0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 }}>Cheers</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginBottom: 20 }}>Acceso a Admin</div>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          style={{ width: '100%', boxSizing: 'border-box', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: '#fff', fontFamily: F, fontSize: 14, padding: '12px 14px', borderRadius: 10, outline: 'none', marginBottom: 12 }}
        />
        {error && <div style={{ fontSize: 12, color: '#f08cb0', marginBottom: 12 }}>{error}</div>}
        <button
          type="submit"
          disabled={cargando || !password}
          style={{ width: '100%', border: 'none', background: 'linear-gradient(135deg,#534AB7,#D4537E)', color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 14px', borderRadius: 10, cursor: cargando || !password ? 'default' : 'pointer', opacity: cargando || !password ? 0.6 : 1, fontFamily: F }}
        >
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
