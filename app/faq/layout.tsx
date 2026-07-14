import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Preguntas frecuentes · Cheers',
  description: '¿Cómo funciona Cheers? ¿Es gratis? ¿Mis invitados necesitan cuenta? Todo lo que necesitas saber sobre cómo organizar tu celebración con Cheers.',
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children
}