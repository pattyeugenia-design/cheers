import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// La extensión se deriva del tipo real del archivo, nunca del nombre que manda el cliente.
const EXTENSIONES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
}
const TAMANO_MAXIMO = 15 * 1024 * 1024
const MAX_POR_HORA = 40
const MAX_TOTAL_POR_BODA = 500

// Filtro automático de contenido (Google Cloud Vision, SafeSearch).
// Si GOOGLE_VISION_API_KEY existe en Vercel, TODA foto se revisa antes de
// guardarse; si la revisión falla o no se puede hacer, la foto NO se guarda.
// Si la variable no existe, el filtro está apagado (comportamiento anterior).
const NIVELES_BLOQUEO = ['LIKELY', 'VERY_LIKELY']
const TIPOS_ESCANEABLES = ['image/jpeg', 'image/png', 'image/webp']

type ResultadoFiltro = 'ok' | 'bloqueada' | 'error' | 'formato'

async function revisarContenido(bytes: Uint8Array, tipo: string): Promise<ResultadoFiltro> {
  const key = process.env.GOOGLE_VISION_API_KEY
  if (!key) return 'ok'
  if (!TIPOS_ESCANEABLES.includes(tipo)) return 'formato'
  try {
    const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{ image: { content: Buffer.from(bytes).toString('base64') }, features: [{ type: 'SAFE_SEARCH_DETECTION' }] }],
      }),
    })
    if (!res.ok) {
      console.error('Vision API respondió', res.status, await res.text())
      return 'error'
    }
    const data = await res.json()
    const r = data?.responses?.[0]
    if (r?.error || !r?.safeSearchAnnotation) {
      console.error('Vision API sin resultado:', r?.error)
      return 'error'
    }
    const { adult, violence } = r.safeSearchAnnotation
    if (NIVELES_BLOQUEO.includes(adult) || NIVELES_BLOQUEO.includes(violence)) return 'bloqueada'
    return 'ok'
  } catch (e) {
    console.error('Error llamando Vision API:', e)
    return 'error'
  }
}

export async function POST(req: Request) {
  const form = await req.formData()
  const token = form.get('token') as string | null
  const nombre = ((form.get('nombre') as string | null)?.trim() || '').slice(0, 100) || null
  const archivo = form.get('archivo') as File | null

  if (!token || !archivo) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  const extension = EXTENSIONES[archivo.type]
  if (!extension) return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 })
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

  const haceUnaHora = new Date(Date.now() - 60 * 60_000).toISOString()
  const [{ count: enLaHora }, { count: total }] = await Promise.all([
    admin.from('boda_fotos').select('id', { count: 'exact', head: true }).eq('boda_id', invitado.boda_id).gte('created_at', haceUnaHora),
    admin.from('boda_fotos').select('id', { count: 'exact', head: true }).eq('boda_id', invitado.boda_id),
  ])
  if ((enLaHora ?? 0) >= MAX_POR_HORA) return NextResponse.json({ error: 'Se subieron muchas fotos en poco tiempo, intenta más tarde.' }, { status: 429 })
  if ((total ?? 0) >= MAX_TOTAL_POR_BODA) return NextResponse.json({ error: 'El álbum ya llegó a su límite de fotos.' }, { status: 429 })

  const bytes = new Uint8Array(await archivo.arrayBuffer())

  // El filtro corre ANTES de guardar nada en Storage.
  const filtro = await revisarContenido(bytes, archivo.type)
  if (filtro === 'bloqueada') return NextResponse.json({ error: 'Esta foto no se puede subir al álbum.' }, { status: 422 })
  if (filtro === 'formato') return NextResponse.json({ error: 'Sube la foto en formato JPG o PNG.' }, { status: 400 })
  if (filtro === 'error') return NextResponse.json({ error: 'No se pudo revisar la foto, intenta de nuevo.' }, { status: 503 })

  const nombreArchivo = `${invitado.boda_id}/${crypto.randomUUID()}.${extension}`
  const { error: errSubida } = await admin.storage.from('fotos-boda').upload(nombreArchivo, bytes, { contentType: archivo.type })
  if (errSubida) return NextResponse.json({ error: 'No se pudo subir la foto' }, { status: 500 })

  const { data: urlPublica } = admin.storage.from('fotos-boda').getPublicUrl(nombreArchivo)

  const { error: errInsert } = await admin.from('boda_fotos').insert({
    boda_id: invitado.boda_id,
    url: urlPublica.publicUrl,
    ruta_storage: nombreArchivo,
    subida_por: nombre,
  })
  if (errInsert) {
    await admin.storage.from('fotos-boda').remove([nombreArchivo])
    return NextResponse.json({ error: 'No se pudo guardar el registro' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
