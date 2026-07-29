import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'patty.eugenia@gmail.com'

export async function POST(req: Request) {
  const { accessToken, email, tipo, slug } = await req.json()
  if (!accessToken || !email || (tipo !== 'pro' && tipo !== 'lifetime')) {
    return NextResponse.json({ ok: false, error: 'datos_incompletos' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // Verificar que quien llama es realmente la cuenta de admin (nunca confiar en el navegador)
  const authClient = createClient(supabaseUrl, anonKey)
  const { data: { user: caller }, error: callerError } = await authClient.auth.getUser(accessToken)
  if (callerError || !caller || caller.email !== ADMIN_EMAIL) {
    return NextResponse.json({ ok: false, error: 'no_autorizado' }, { status: 401 })
  }

  const admin = createClient(supabaseUrl, serviceKey)

  // Buscar la cuenta por email — auth.users no es consultable directo desde el navegador,
  // por eso esto pasa por el servidor con la llave de administrador.
  const { data: listado, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) return NextResponse.json({ ok: false, error: 'error_buscando' }, { status: 500 })
  const cuenta = listado.users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase())
  if (!cuenta) return NextResponse.json({ ok: false, error: 'no_encontrado' })

  if (tipo === 'lifetime') {
    const { error } = await admin.from('perfiles').update({ plan: 'lifetime' }).eq('user_id', cuenta.id)
    if (error) return NextResponse.json({ ok: false, error: 'error_guardando' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // tipo === 'pro': Super Cheer es por celebración, hay que saber cuál
  const { data: celebraciones } = await admin
    .from('celebraciones')
    .select('slug, nombre, plan')
    .eq('organizador_id', cuenta.id)
    .eq('archivada', false)
    .order('created_at', { ascending: false })

  if (!celebraciones || celebraciones.length === 0) {
    return NextResponse.json({ ok: false, error: 'sin_celebraciones' })
  }

  if (!slug) {
    if (celebraciones.length === 1) {
      const { error } = await admin.from('celebraciones').update({ plan: 'pro' }).eq('slug', celebraciones[0].slug)
      if (error) return NextResponse.json({ ok: false, error: 'error_guardando' }, { status: 500 })
      return NextResponse.json({ ok: true, celebracion: celebraciones[0].nombre })
    }
    // Más de una celebración activa: que elija cuál en vez de adivinar
    return NextResponse.json({ ok: false, error: 'elegir_celebracion', celebraciones })
  }

  const objetivo = celebraciones.find(c => c.slug === slug)
  if (!objetivo) return NextResponse.json({ ok: false, error: 'celebracion_invalida' }, { status: 400 })
  const { error } = await admin.from('celebraciones').update({ plan: 'pro' }).eq('slug', slug)
  if (error) return NextResponse.json({ ok: false, error: 'error_guardando' }, { status: 500 })
  return NextResponse.json({ ok: true, celebracion: objetivo.nombre })
}
