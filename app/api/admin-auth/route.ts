import { NextResponse } from 'next/server'
import { hashAdminSecret } from '../../lib/adminHash'

// Antes no había límite de intentos — alguien podía probar el password sin
// parar. La protección real de /admin_login/dashboard es tu sesión de Supabase
// (RLS exige auth.email() = tu correo), pero este límite cierra el intento de
// fuerza bruta de todos modos, como capa extra.
const intentosPorIP = new Map<string, number[]>()
const LIMITE_INTENTOS = 5
const VENTANA_MS = 60_000

function excedeLimite(ip: string): boolean {
  const ahora = Date.now()
  const previos = intentosPorIP.get(ip) || []
  const recientes = previos.filter(t => ahora - t < VENTANA_MS)
  recientes.push(ahora)
  intentosPorIP.set(ip, recientes)
  return recientes.length > LIMITE_INTENTOS
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconocida'
  if (excedeLimite(ip)) return NextResponse.json({ error: 'Demasiados intentos, espera un minuto' }, { status: 429 })

  const { password } = await req.json()

  if (!password || password !== process.env.ADMIN_PANEL_PASSWORD) {
    return NextResponse.json({ error: 'invalid' }, { status: 401 })
  }

  const hash = await hashAdminSecret(password)
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_auth', hash, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 400, // 400 días (máximo que permiten los navegadores hoy)
    path: '/',
  })
  return res
}
