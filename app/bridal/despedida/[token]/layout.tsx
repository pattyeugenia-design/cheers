import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { fechaLarga } from '../../_invitacion/tema'

// Lo que ve WhatsApp al pegar el link de la despedida: es personal, así que
// saluda a la invitada por su nombre. Se lee con la misma función segura que
// usa la invitación y nunca se indexa en buscadores.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const GENERICO: Metadata = {
  title: 'Despedida de soltera · Cheers Bridal',
  description: 'Tienes una invitación personal. Ábrela para ver todos los detalles.',
  robots: { index: false, follow: false },
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params
  if (!UUID.test(token)) return GENERICO
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data } = await supabase.rpc('get_despedida_por_token', { p_token: token })
    const inv = Array.isArray(data) ? data[0] : data
    if (!inv) return GENERICO
    const festejada = String(inv.festejada || inv.nombre_novia || '').trim().slice(0, 40)
    const titulo = String(inv.titulo || 'Despedida de soltera').trim().slice(0, 80)
    const title = festejada ? `${titulo} de ${festejada}` : titulo
    const fechaCruda = fechaLarga(inv.fecha, 'es')
    const fecha = fechaCruda ? fechaCruda.charAt(0).toUpperCase() + fechaCruda.slice(1) : ''
    const nombre = String(inv.nombre || '').trim().slice(0, 60)
    const description = [fecha, nombre ? `Invitación personal para ${nombre}` : 'Invitación personal'].filter(Boolean).join(' · ')
    return {
      title,
      description,
      robots: { index: false, follow: false },
      openGraph: { title, description, type: 'website', locale: 'es_MX', siteName: 'Cheers Bridal' },
      twitter: { card: 'summary_large_image', title, description },
    }
  } catch {
    return GENERICO
  }
}

export default function InvitacionDespedidaLayout({ children }: { children: React.ReactNode }) {
  return children
}
