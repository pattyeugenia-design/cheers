import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hashAdminSecret } from './app/lib/adminHash'

export async function proxy(request: NextRequest) {
  const parts = request.nextUrl.pathname.split('/').filter(Boolean)

  // Ruta de admin escondida bajo un segmento secreto (no es tu username real).
  // Si alguien entra a /cualquier-cosa/admin_login, se manda a home sin dar pistas
  // de que existe un panel de admin — la comparación pasa solo aquí, en el servidor,
  // nunca se manda al navegador.
  if (parts[1] === 'admin_login') {
    if (parts[0] !== process.env.ADMIN_PATH_SECRET) {
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

  await supabase.auth.getUser()
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}