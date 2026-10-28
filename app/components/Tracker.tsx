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
    // En el álbum QR se guarda quién entra: el nombre que trae el link personal
    // (?de=Nombre) o, si no trae, el nombre que esa persona ya usó para subir fotos.
    if (pathname?.startsWith('/bridal/fotos/')) {
      let de = ''
      try {
        de = new URLSearchParams(window.location.search).get('de') || localStorage.getItem('cheers_qr_nombre') || ''
      } catch { /* sin almacenamiento */ }
      de = de.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 60)
      track('visita', de ? { metadata: { de } } : {})
      return
    }
    track('visita')
  }, [pathname])
  return null
}
