import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'patty.eugenia@gmail.com'

export async function POST(req: Request) {
  const { accessToken, email, confirmar } = await req.json()
  if (!accessToken || !email) return NextResponse.json({ ok: false, error: 'datos_incompletos' }, { status: 400 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const authClient = createClient(supabaseUrl, anonKey)
  const { data: { user: caller }, error: callerError } = await authClient.auth.getUser(accessToken)
  if (callerError || !caller || caller.email !== ADMIN_EMAIL) {
    return NextResponse.json({ ok: false, error: 'no_autorizado' }, { status: 401 })
  }

  const admin = createClient(supabaseUrl, serviceKey)

  const { data: listado, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) return NextResponse.json({ ok: false, error: 'error_buscando' }, { status: 500 })
  const cuenta = listado.users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase())
  if (!cuenta) return NextResponse.json({ ok: false, error: 'no_encontrado' })

  const { data: perfil } = await admin.from('perfiles').select('username, created_at, avatar_url').eq('user_id', cuenta.id).single()
  const { data: celebs } = await admin.from('celebraciones').select('slug, portada_url').eq('organizador_id', cuenta.id)

  // Modo preview: solo mostrar quién es antes de borrar de verdad
  if (!confirmar) {
    return NextResponse.json({
      ok: true,
      preview: {
        username: perfil?.username || null,
        creado: perfil?.created_at || null,
        celebraciones: celebs?.length || 0,
      },
    })
  }

  // Modo borrar: mismo cascade que /api/eliminar-cuenta (que usa la propia usuaria para
  // borrarse a sí misma), aquí disparado por la admin sobre la cuenta encontrada
  for (const c of celebs || []) {
    await admin.from('invitados').delete().eq('celebracion_slug', c.slug)
    await admin.from('rsvps').delete().eq('celebracion_slug', c.slug)
    if (c.portada_url) {
      const idx = c.portada_url.indexOf('/portadas/')
      if (idx !== -1) await admin.storage.from('portadas').remove([c.portada_url.slice(idx + '/portadas/'.length)])
    }
  }
  await admin.from('celebraciones').delete().eq('organizador_id', cuenta.id)

  if (perfil?.avatar_url) {
    const idx = perfil.avatar_url.indexOf('/avatars/')
    if (idx !== -1) await admin.storage.from('avatars').remove([perfil.avatar_url.slice(idx + '/avatars/'.length)])
  }

  await admin.from('rsvps').delete().eq('user_id', cuenta.id)
  await admin.from('invitados').update({ user_id: null }).eq('user_id', cuenta.id)
  await admin.from('perfiles').delete().eq('user_id', cuenta.id)

  const { error: deleteError } = await admin.auth.admin.deleteUser(cuenta.id)
  if (deleteError) return NextResponse.json({ ok: false, error: 'error_borrando' }, { status: 500 })

  return NextResponse.json({ ok: true, borrado: true })
}
