'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'

export default function Login() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Verificar si ya está logueado
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      // Verificar si tiene username
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('username')
        .eq('user_id', user.id)
        .single()

      if (perfil?.username) {
        // Revisar redirect pendiente
        const redirect = typeof window !== 'undefined' ? sessionStorage.getItem('redirect_after_login') : null
        if (redirect) {
          sessionStorage.removeItem('redirect_after_login')
          router.push(redirect)
        } else {
          router.push(`/${perfil.username}`)
        }
      } else {
        router.push('/onboarding')
      }
    })

    // Escuchar cambios de auth (después del OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('username')
          .eq('user_id', session.user.id)
          .single()

        if (perfil?.username) {
          const redirect = typeof window !== 'undefined' ? sessionStorage.getItem('redirect_after_login') : null
          if (redirect) {
            sessionStorage.removeItem('redirect_after_login')
            router.push(redirect)
          } else {
            router.push(`/${perfil.username}`)
          }
        } else {
          router.push('/onboarding')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Confetti
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return
    const ctx = cv.getContext('2d'); if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    cv.width = window.innerWidth * dpr; cv.height = window.innerHeight * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const colors = ['#534AB7', '#D4537E', '#EEEDFE', '#F5C04E', '#fff', '#8b7fe8']
    const parts: any[] = []
    for (let i = 0; i < 120; i++) {
      parts.push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight - window.innerHeight, vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 3, color: colors[Math.floor(Math.random() * colors.length)], w: 6 + Math.random() * 8, h: 3 + Math.random() * 5, rot: Math.random() * 360, rsp: (Math.random() - 0.5) * 4 })
    }
    let raf: number
    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      for (const p of parts) {
        p.y += p.vy; p.x += p.vx; p.rot += p.rsp
        if (p.y > window.innerHeight) { p.y = -10; p.x = Math.random() * window.innerWidth }
        ctx.save(); ctx.globalAlpha = 0.85; ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180)
        ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore()
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  async function loginConGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/login` }
    })
  }

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#534AB7,#7b46a8,#D4537E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, padding: '0 20px', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: '-1px', marginBottom: 8 }}>Cheers</div>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.85)', margin: 0, lineHeight: 1.5 }}>
            Organiza tu próxima celebración
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,.97)', borderRadius: 26, padding: '32px 28px', boxShadow: '0 24px 64px rgba(83,74,183,.3)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1c1830', margin: '0 0 8px', letterSpacing: '-.4px' }}>Entrar a Cheers</h2>
          <p style={{ fontSize: 14, color: '#6b6585', margin: '0 0 24px' }}>Usa tu cuenta de Google para continuar.</p>

          <button
            onClick={loginConGoogle}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '14px 20px', border: '1.5px solid #e8e4f5', borderRadius: 14, background: '#fff', cursor: 'pointer', fontFamily: FONT, fontSize: 15, fontWeight: 700, color: '#2a2440', boxShadow: '0 4px 14px rgba(0,0,0,.06)', transition: 'all .15s' }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            Continuar con Google
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 20, lineHeight: 1.5 }}>
          Al entrar aceptas los términos de uso de Cheers.
        </p>
      </div>
    </main>
  )
}