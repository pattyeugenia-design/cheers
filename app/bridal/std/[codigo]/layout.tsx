import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { fechaLarga } from '../../_invitacion/tema'

// Lo que ve WhatsApp al pegar el link general del Save the date: es el mismo
// link para todos, así que no saluda a nadie por su nombre.
const CODIGO = /^[a-z0-9]{8,24}$/

const GENERICO: Metadata = {
  title: 'Save the date · Cheers Bridal',
  description: 'Aparta la fecha.',
  robots: { index: false, follow: false },
}

export async function generateMetadata({ params }: { params: Promise<{ codigo: string }> }): Promise<Metadata> {
  const { codigo } = await params
  if (!CODIGO.test(codigo)) return GENERICO
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data } = await supabase.rpc('get_std_boda', { p_codigo: codigo })
    const inv = Array.isArray(data) ? data[0] : data
    if (!inv) return GENERICO
    const pareja = [inv.nombre_novia, inv.nombre_novio].filter(Boolean).join(' & ')
    const fechaCruda = fechaLarga(inv.fecha_boda, 'es')
    const fecha = fechaCruda ? fechaCruda.charAt(0).toUpperCase() + fechaCruda.slice(1) : ''
    const title = pareja ? `Save the date · ${pareja}` : GENERICO.title as string
    const lugar = String(inv.std_lugar || '').trim().slice(0, 80)
    const description = [fecha, lugar, 'Aparta la fecha'].filter(Boolean).join(' · ')
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

export default function SaveTheDateLayout({ children }: { children: React.ReactNode }) {
  return children
}
