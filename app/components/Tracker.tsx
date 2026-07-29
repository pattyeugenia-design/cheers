'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { track } from '../track'

// Registra una "visita" cada vez que cambia la ruta. No usa useSearchParams
// (eso forzaría todas las páginas estáticas a volverse dinámicas) — los
// utm_source/campaign se leen directo de window.location dentro de track().
export default function Tracker() {
  const pathname = usePathname()
  useEffect(() => {
    track('visita')
  }, [pathname])
  return null
}
