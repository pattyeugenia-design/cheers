import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'patty.eugenia@gmail.com'

export async function POST(req: Request) {
  const { accessToken, correo, tipoPlan } = await req.json()
  const tipo = tipoPlan === 'pro' ? 'pro' : 'lifetime'

  if (!accessToken || !correo || typeof correo !== 'string') {
    return NextResponse.json({ ok: false, error: 'datos_incompletos' }, { status: 400 })
  }

  const correoNormalizado = correo.trim().toLowerCase()

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

  // ¿Ya existe una cuenta con ese correo? auth.users no es consultable desde el navegador,
  // por eso esto tiene que vivir en el servidor con la llave de administrador.
  const { data: listado, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) return NextResponse.json({ ok: false, error: 'error_buscando' }, { status: 500 })
  const cuenta = listado.users.find(u => u.email?.toLowerCase() === correoNormalizado)

  let perfilExistente: { user_id: string } | null = null
  if (cuenta && tipo === 'lifetime') {
    const { data } = await admin.from('perfiles').select('user_id').eq('user_id', cuenta.id).maybeSingle()
    perfilExistente = data
  }

  const seAplicaYa = !!perfilExistente

  if (seAplicaYa) {
    const { error: updateError } = await admin
      .from('perfiles')
      .update({ plan: 'lifetime' })
      .eq('user_id', perfilExistente!.user_id)
    if (updateError) return NextResponse.json({ ok: false, error: 'error_guardando' }, { status: 500 })
  }

  const { error: insertError } = await admin.from('cortesias_preaprobadas').insert({
    correo: correoNormalizado,
    tipo_plan: tipo,
    aplicado: seAplicaYa,
    aplicado_en: seAplicaYa ? new Date().toISOString() : null,
  })

  if (insertError) {
    // El índice único solo cubre pendientes (aplicado = false) — si truena por duplicado,
    // ya estaba en la lista esperando a que esa persona se registre.
    if (insertError.code === '23505') {
      return NextResponse.json({ ok: false, error: 'ya_pendiente' })
    }
    return NextResponse.json({ ok: false, error: 'error_guardando' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, estado: seAplicaYa ? 'aplicado_inmediato' : 'pendiente' })
}
