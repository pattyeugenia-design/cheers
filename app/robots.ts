import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/perfil', '/admin', '/*/nueva', '/onboarding', '/login', '/dashboard'],
    },
    sitemap: 'https://joincheers.app/sitemap.xml',
  }
}