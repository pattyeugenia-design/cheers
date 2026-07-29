import { NextResponse, type NextRequest } from 'next/server'
import { hashAdminSecret } from './app/lib/adminHash'

export async function proxy(request: NextRequest) {
  const parts = request.nextUrl.pathname.split('/').filter(Boolean)

  // Cheers guarda la sesión en el navegador (localStorage), no en cookies —
  // por eso el servidor (aquí) nunca puede ver quién eres. La primera capa
  // ("¿eres tú?") se revisa dentro de la propia página de admin_login, en el
  // navegador, con el mismo método que ya usa el resto de la app. Aquí solo
  // se protege /dashboard con el password del panel, vía cookie propia.
  if (parts[1] === 'admin_login' && parts[2] === 'dashboard') {
    const cookie = request.cookies.get('admin_auth')?.value
    const expected = await hashAdminSecret(process.env.ADMIN_PANEL_PASSWORD || '')
    if (!cookie || cookie !== expected) {
      const url = request.nextUrl.clone()
      url.pathname = `/${parts[0]}/admin_login`
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}