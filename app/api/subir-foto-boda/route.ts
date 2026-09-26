import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const TAMANO_MAXIMO = 15 * 1024 * 1024 // 15MB, suficiente para una foto de celular sin abrir la puerta a archivos gigantes

export async function POST(req: Request) {
  const form = await req.formData()
  const token = form.get('token') as string | null
  const nombre = (form.get('nombre') as string | null)?.trim() || null
  const archivo = form.get('archivo') as File | null

  if (!token || !archivo) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 })
  if (archivo.size > TAMANO_MAXIMO) return NextResponse.json({ error: 'La foto pesa demasiado' }, { status: 400 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient(supabaseUrl, serviceKey)

  // El token del invitado es lo único que confiamos del cliente — de ahí sacamos
  // el boda_id real en el servidor, nunca lo recibimos directo del formulario.
  const { data: invitado, error: errInvitado } = await admin
    .from('boda_invitados')
    .select('boda_id')
    .eq('token', token)
    .single()
  if (errInvitado || !invitado) return NextResponse.json({ error: 'Invitación no válida' }, { status: 404 })

  const extension = archivo.name.split('.').pop()?.toLowerCase() || 'jpg'
  const nombreArchivo = `${invitado.boda_id}/${crypto.randomUUID()}.${extension}`
  const bytes = new Uint8Array(await archivo.arrayBuffer())

  const { error: errSubida } = await admin.storage.from('fotos-boda').upload(nombreArchivo, bytes, { contentType: archivo.type })
  if (errSubida) return NextResponse.json({ error: 'No se pudo subir la foto' }, { status: 500 })

  const { data: urlPublica } = admin.storage.from('fotos-boda').getPublicUrl(nombreArchivo)

  const { error: errInsert } = await admin.from('boda_fotos').insert({
    boda_id: invitado.boda_id,
    url: urlPublica.publicUrl,
    ruta_storage: nombreArchivo,
    subida_por: nombre,
  })
  if (errInsert) return NextResponse.json({ error: 'No se pudo guardar el registro' }, { status: 500 })

  return NextResponse.json({ success: true })
}
