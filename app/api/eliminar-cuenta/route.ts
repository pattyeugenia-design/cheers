import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Borra los archivos de Storage (fotos y contratos) de las bodas que creó este
// usuario. Las filas de la base se borran solas en cascada al borrar la cuenta,
// pero los archivos no — sin esto quedarían huérfanos (y con datos personales).
async function borrarArchivosDeBodas(admin: any, userId: string) {
  const { data: bodas } = await admin.from('proyectos_boda').select('id').eq('creador_id', userId)
  for (const b of bodas || []) {
    for (const bucket of ['fotos-boda', 'contratos-boda', 'bodas-media']) {
      const { data: archivos } = await admin.storage.from(bucket).list(b.id, { limit: 1000 })
      if (archivos?.length) await admin.storage.from(bucket).remove(archivos.map((a: any) => `${b.id}/${a.name}`))
    }
    // La foto de portada de la boda vive en otro bucket, con el id en el nombre del archivo.
    const { data: portadasBoda } = await admin.storage.from('portadas').list('', { search: `boda-${b.id}-portada`, limit: 20 })
    if (portadasBoda?.length) await admin.storage.from('portadas').remove(portadasBoda.map((a: any) => a.name))
  }
}

export async function POST(req: Request) {
  const { accessToken } = await req.json()
  if (!accessToken) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // Verificar que el token pertenece a un usuario real y actual (nunca confiar en un user_id que mande el cliente)
  const authClient = createClient(supabaseUrl, anonKey)
  const { data: { user }, error: userError } = await authClient.auth.getUser(accessToken)
  if (userError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Cliente con permisos de administrador, solo existe en el servidor, nunca se expone al navegador
  const admin = createClient(supabaseUrl, serviceKey)

  // Borrar celebraciones propias y sus datos relacionados (invitados, rsvps, portadas)
  const { data: celebs } = await admin.from('celebraciones').select('slug, portada_url').eq('organizador_id', user.id)
  for (const c of celebs || []) {
    await admin.from('invitados').delete().eq('celebracion_slug', c.slug)
    await admin.from('rsvps').delete().eq('celebracion_slug', c.slug)
    if (c.portada_url) {
      const idx = c.portada_url.indexOf('/portadas/')
      if (idx !== -1) await admin.storage.from('portadas').remove([c.portada_url.slice(idx + '/portadas/'.length)])
    }
  }
  await admin.from('celebraciones').delete().eq('organizador_id', user.id)

  // Borrar la foto de avatar si existe
  const { data: perfilData } = await admin.from('perfiles').select('avatar_url').eq('user_id', user.id).single()
  if (perfilData?.avatar_url) {
    const idx = perfilData.avatar_url.indexOf('/avatars/')
    if (idx !== -1) await admin.storage.from('avatars').remove([perfilData.avatar_url.slice(idx + '/avatars/'.length)])
  }

  // Borrar los RSVPs que dejó en eventos de otras personas
  await admin.from('rsvps').delete().eq('user_id', user.id)

  // Desvincular (no borrar) registros donde este usuario fue invitado en eventos de otras personas
  await admin.from('invitados').update({ user_id: null }).eq('user_id', user.id)

  // Borrar el perfil
  await admin.from('perfiles').delete().eq('user_id', user.id)

  // Borrar la cuenta de autenticación
  await borrarArchivosDeBodas(admin, user.id)

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
