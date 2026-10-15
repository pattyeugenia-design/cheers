import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Subida de fotos desde el QR del evento (sin link personal).
// Es un archivo aparte a propósito: NO toca /api/subir-foto-boda. Usa el mismo
// filtro de contenido y las mismas reglas de formato y tamaño, pero:
//   - el álbum se identifica por su código (el del QR), y solo acepta fotos
//     dentro de su ventana de tiempo (abre/cierra);
//   - los límites están pensados para una fiesta (muchas fotos en poco tiempo).
const EXTENSIONES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const TAMANO_MAXIMO = 15 * 1024 * 1024
const MAX_POR_HORA = 400
const MAX_TOTAL_POR_ALBUM = 3000
const CODIGO = /^[a-z0-9]{8,24}$/

const NIVELES_BLOQUEO = ['LIKELY', 'VERY_LIKELY']
type ResultadoFiltro = 'ok' | 'bloqueada' | 'error'

// Mismo filtro que la invitación (Google Cloud Vision, SafeSearch). Si la llave
// existe, TODA foto se revisa antes de guardarse; si la revisión falla, no se guarda.
async function revisarContenido(bytes: Uint8Array): Promise<ResultadoFiltro> {
  const key = process.env.GOOGLE_VISION_API_KEY
  if (!key) return 'ok'
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
  const codigo = String(form.get('codigo') || '')
  const nombre = String(form.get('nombre') || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, 60) || null
  const archivo = form.get('archivo') as File | null

  if (!CODIGO.test(codigo) || !archivo || typeof archivo === 'string') return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  const extension = EXTENSIONES[archivo.type]
  if (!extension) return NextResponse.json({ error: 'Sube la foto en formato JPG o PNG.' }, { status: 400 })
  if (archivo.size > TAMANO_MAXIMO) return NextResponse.json({ error: 'La foto pesa demasiado' }, { status: 400 })

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // El código del QR es lo único que confiamos del cliente: de ahí sacamos el
  // álbum y la boda en el servidor.
  const { data: album } = await admin
    .from('boda_albumes_qr')
    .select('id, boda_id, abre, cierra')
    .eq('codigo', codigo)
    .maybeSingle()
  if (!album) return NextResponse.json({ error: 'Este álbum no existe.' }, { status: 404 })
  const ahora = Date.now()
  if (ahora < new Date(album.abre).getTime()) return NextResponse.json({ error: 'El álbum todavía no abre.' }, { status: 403 })
  if (ahora > new Date(album.cierra).getTime()) return NextResponse.json({ error: 'El álbum ya cerró. ¡Gracias!' }, { status: 403 })

  const haceUnaHora = new Date(ahora - 60 * 60_000).toISOString()
  const [{ count: enLaHora }, { count: total }] = await Promise.all([
    admin.from('boda_fotos').select('id', { count: 'exact', head: true }).eq('album_id', album.id).gte('created_at', haceUnaHora),
    admin.from('boda_fotos').select('id', { count: 'exact', head: true }).eq('album_id', album.id),
  ])
  if ((enLaHora ?? 0) >= MAX_POR_HORA) return NextResponse.json({ error: 'Se subieron muchas fotos en poco tiempo, intenta en un rato.' }, { status: 429 })
  if ((total ?? 0) >= MAX_TOTAL_POR_ALBUM) return NextResponse.json({ error: 'El álbum ya llegó a su límite de fotos.' }, { status: 429 })

  const bytes = new Uint8Array(await archivo.arrayBuffer())
  const filtro = await revisarContenido(bytes)
  if (filtro === 'bloqueada') return NextResponse.json({ error: 'Esta foto no se puede subir al álbum.' }, { status: 422 })
  if (filtro === 'error') return NextResponse.json({ error: 'No se pudo revisar la foto, intenta de nuevo.' }, { status: 503 })

  const ruta = `${album.boda_id}/qr/${album.id}/${crypto.randomUUID()}.${extension}`
  const { error: errSubida } = await admin.storage.from('fotos-boda').upload(ruta, bytes, { contentType: archivo.type })
  if (errSubida) return NextResponse.json({ error: 'No se pudo subir la foto' }, { status: 500 })
  const { data: urlPublica } = admin.storage.from('fotos-boda').getPublicUrl(ruta)

  // Ya pasó el filtro: se publica directo en el álbum (la pareja puede borrarla).
  const { error: errInsert } = await admin.from('boda_fotos').insert({
    boda_id: album.boda_id,
    album_id: album.id,
    url: urlPublica.publicUrl,
    ruta_storage: ruta,
    subida_por: nombre,
    aprobado: true,
  })
  if (errInsert) {
    await admin.storage.from('fotos-boda').remove([ruta])
    return NextResponse.json({ error: 'No se pudo guardar la foto' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
