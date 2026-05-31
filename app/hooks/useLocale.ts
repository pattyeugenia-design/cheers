import { useEffect, useState } from 'react'
import es from '../locales/es'
import en from '../locales/en'

export function useLocale() {
  const [locale, setLocale] = useState(es)

  useEffect(() => {
    const lang = navigator.language || 'es'
    setLocale(lang.startsWith('en') ? en : es)
  }, [])

  return locale
}