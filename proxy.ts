import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hashAdminSecret } from './app/lib/adminHash'

const ADMIN_EMAIL = 'patty.eugenia@gmail.com'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const parts = request.nextUrl.pathname.split('/').filter(Boolean)

  // Panel de admin: primera capa es tu sesión real (tu cuenta de Google/Cheers) en
  // vez de un código que memorizar — si no estás logueada como tú, se manda a home
  // sin dar pistas de que existe un panel de admin. La segunda capa sigue siendo
  // el password del panel, para entrar a /dashboard.
  if (parts[1] === 'admin_login') {
    if (!user || user.email !== ADMIN_EMAIL) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    if (parts[2] === 'dashboard') {
      const cookie = request.cookies.get('admin_auth')?.value
      const expected = await hashAdminSecret(process.env.ADMIN_PANEL_PASSWORD || '')
      if (!cookie || cookie !== expected) {
        const url = request.nextUrl.clone()
        url.pathname = `/${parts[0]}/admin_login`
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}