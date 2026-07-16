import { NextResponse } from 'next/server'
import { hashAdminSecret } from '../../lib/adminHash'

export async function POST(req: Request) {
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
