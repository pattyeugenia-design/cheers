import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Segundo paso del RSVP público: valida el código de 6 dígitos y, si es
// correcto, regresa el token personal del invitado (el mismo que ya usa
// /bridal/rsvp/[token]) — no cambia nada del flujo de RSVP que ya funciona,
// solo le da al invitado otra forma de llegar a su link sin buscar el correo.
const solicitudesPorIP = new Map<string, number[]>()
const LIMITE_SOLICITUDES = 15
const VENTANA_MS = 60_000

function excedeLimite(ip: string): boolean {
  const ahora = Date.now()
  const previas = solicitudesPorIP.get(ip) || []
  const recientes = previas.filter(t => ahora - t < VENTANA_MS)
  recientes.push(ahora)
  solicitudesPorIP.set(ip, recientes)
  return recientes.length > LIMITE_SOLICITUDES
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconocida'
  if (excedeLimite(ip)) return NextResponse.json({ error: 'Demasiados intentos, espera un momento.' }, { status: 429 })

  const { bodaId, email, codigo } = await req.json()
  if (!bodaId || !email || !codigo) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }
  const correoNormalizado = String(email).trim().toLowerCase()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createClient(supabaseUrl, serviceKey)

  const { data: invitado } = await admin
    .from('boda_invitados')
    .select('id, token')
    .eq('boda_id', bodaId)
    .ilike('email', correoNormalizado)
    .maybeSingle()
  if (!invitado) return NextResponse.json({ error: 'Código incorrecto o vencido.' }, { status: 400 })

  const { data: fila } = await admin
    .from('boda_codigos_verificacion')
    .select('id, expira_en, usado')
    .eq('invitado_id', invitado.id)
    .eq('codigo', String(codigo).trim())
    .eq('usado', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!fila || new Date(fila.expira_en).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Código incorrecto o vencido.' }, { status: 400 })
  }

  await admin.from('boda_codigos_verificacion').update({ usado: true }).eq('id', fila.id)

  return NextResponse.json({ success: true, token: invitado.token })
}
