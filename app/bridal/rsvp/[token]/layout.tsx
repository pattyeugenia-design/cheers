import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { fechaLarga } from '../../_invitacion/tema'

// Lo que ven WhatsApp, iMessage y compañía cuando alguien pega el link de una
// invitación: título, descripción y (en opengraph-image.tsx) una tarjeta con la
// foto y los nombres de la pareja. Cada link es personal, así que además del
// evento se saluda al invitado por su nombre.
//
// Seguridad: se lee con la MISMA función segura que usa la invitación
// (get_invitado_boda_por_token) y solo se muestra lo que el invitado ya ve en
// su invitación. Las invitaciones nunca se indexan en buscadores.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const GENERICO: Metadata = {
  title: 'Invitación de boda · Cheers Bridal',
  description: 'Tienes una invitación personal. Ábrela para ver todos los detalles.',
  robots: { index: false, follow: false },
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params
  if (!UUID.test(token)) return GENERICO
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data } = await supabase.rpc('get_invitado_boda_por_token', { p_token: token })
    const inv = Array.isArray(data) ? data[0] : data
    if (!inv) return GENERICO

    const pareja = [inv.nombre_novia, inv.nombre_novio].filter(Boolean).join(' & ')
    const fechaCruda = fechaLarga(inv.fecha_boda, 'es')
    const fecha = fechaCruda ? fechaCruda.charAt(0).toUpperCase() + fechaCruda.slice(1) : ''
    const std = inv.modo_invitacion === 'save_the_date'
    const title = pareja ? (std ? `Save the date · ${pareja}` : `${pareja} · Nuestra boda`) : GENERICO.title as string
    const nombre = String(inv.nombre || '').trim().slice(0, 60)
    const description = std
      ? [fecha, nombre ? `Aparta la fecha, ${nombre}` : 'Aparta la fecha'].filter(Boolean).join(' · ')
      : [fecha, nombre ? `Invitación personal para ${nombre}` : 'Invitación personal'].filter(Boolean).join(' · ')

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

export default function InvitacionBodaLayout({ children }: { children: React.ReactNode }) {
  return children
}
