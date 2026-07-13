import type { Metadata } from 'next'
import { supabase } from '../../supabase'

type Props = {
  params: Promise<{ usuario: string; evento: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: { params: Promise<{ usuario: string; evento: string }> }): Promise<Metadata> {
  const { usuario, evento } = await params
  const slug = `${usuario}/${evento}`
  const { data: cel } = await supabase.from('celebraciones').select('nombre, portada_url').eq('slug', slug).single()

  if (!cel) {
    return {
      title: 'Cheers',
      description: 'La celebración, en un link.',
    }
  }

  const title = `${cel.nombre} · Cheers`
  const description = '¡Estás invitad@! Entra para ver todos los detalles de la celebración.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(cel.portada_url ? { images: [{ url: cel.portada_url, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: cel.portada_url ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(cel.portada_url ? { images: [cel.portada_url] } : {}),
    },
  }
}

export default function EventoLayout({ children }: Props) {
  return children
}