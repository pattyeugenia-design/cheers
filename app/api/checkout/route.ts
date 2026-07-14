import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const { accessToken, tipo, slug } = await req.json()
  if (!accessToken) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (tipo !== 'pro' && tipo !== 'lifetime') return NextResponse.json({ error: 'Tipo de plan inválido' }, { status: 400 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // Verificar que el token pertenece a un usuario real y actual (nunca confiar en un user_id que mande el cliente)
  const authClient = createClient(supabaseUrl, anonKey)
  const { data: { user }, error: userError } = await authClient.auth.getUser(accessToken)
  if (userError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Cliente con permisos de administrador, solo existe en el servidor, nunca se expone al navegador
  const admin = createClient(supabaseUrl, serviceKey)

  let priceId: string
  const metadata: Record<string, string> = { tipo, user_id: user.id }

  if (tipo === 'pro') {
    if (!slug) return NextResponse.json({ error: 'Falta la celebración' }, { status: 400 })

    // Pro es por celebración: confirmar que esta celebración es de quien está pagando
    const { data: cel } = await admin.from('celebraciones').select('slug, organizador_id, plan').eq('slug', slug).single()
    if (!cel || cel.organizador_id !== user.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    if (cel.plan === 'pro') return NextResponse.json({ error: 'Esta celebración ya es Super Cheer' }, { status: 400 })

    priceId = process.env.STRIPE_PRICE_PRO!
    metadata.slug = slug
  } else {
    // Lifetime es de toda la cuenta
    const { data: perfil } = await admin.from('perfiles').select('plan').eq('user_id', user.id).single()
    if (perfil?.plan === 'lifetime') return NextResponse.json({ error: 'Ya tienes Extra Cheer' }, { status: 400 })

    priceId = process.env.STRIPE_PRICE_LIFETIME!
  }

  const origin = req.headers.get('origin') || 'https://joincheers.app'
  // Pro regresa al evento que se acaba de comprar; Lifetime regresa al perfil
  const rutaVuelta = tipo === 'pro' ? `/${slug}` : '/perfil'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
    customer_email: user.email,
    success_url: `${origin}${rutaVuelta}?compra=exitosa`,
    cancel_url: `${origin}${rutaVuelta}?compra=cancelada`,
  })

  return NextResponse.json({ url: session.url })
}
