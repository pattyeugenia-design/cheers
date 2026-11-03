import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { fechaLarga } from '../../_invitacion/tema'

// Lo que ve WhatsApp al pegar el link del Save the date. El link general no
// saluda a nadie; el personal dice "Para <nombre>" en la descripción.
const CODIGO = /^[a-z0-9]{8,24}$/
const PERSONAL = /^[a-z0-9]+(-[a-z0-9]+)*-[a-z0-9]{12}$/

const GENERICO: Metadata = {
  title: 'Save the date · Cheers Bridal',
  description: 'Aparta la fecha.',
  robots: { index: false, follow: false },
}

export async function generateMetadata({ params }: { params: Promise<{ codigo: string }> }): Promise<Metadata> {
  const { codigo } = await params
  const personal = codigo.length <= 100 && PERSONAL.test(codigo)
  if (!personal && !CODIGO.test(codigo)) return GENERICO
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data } = personal
      ? await supabase.rpc('get_std_invitado', { p_codigo: codigo })
      : await supabase.rpc('get_std_boda', { p_codigo: codigo })
    const inv = Array.isArray(data) ? data[0] : data
    if (!inv) return GENERICO
    const pareja = [inv.nombre_novia, inv.nombre_novio].filter(Boolean).join(' & ')
    const fechaCruda = fechaLarga(inv.fecha_boda, 'es')
    const fecha = fechaCruda ? fechaCruda.charAt(0).toUpperCase() + fechaCruda.slice(1) : ''
    const title = pareja ? `Save the date · ${pareja}` : GENERICO.title as string
    const lugar = String(inv.std_lugar || '').trim().slice(0, 80)
    const para = personal ? String(inv.nombre || '').trim().slice(0, 60) : ''
    const description = [para ? `Para ${para}` : '', fecha, lugar, 'Aparta la fecha'].filter(Boolean).join(' · ')
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
