import type { NextConfig } from "next";

// Content-Security-Policy: lista blanca de dónde puede cargar cosas el sitio.
// Va en modo "Report-Only": el navegador NO bloquea nada todavía, solo avisa en
// la consola si algo quedaría bloqueado. Cuando se confirme en vivo que Google
// Maps, login y Stripe funcionan sin avisos, se cambia a 'Content-Security-Policy'.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://ykqlgogliwqgpxsmutvx.supabase.co wss://ykqlgogliwqgpxsmutvx.supabase.co https://maps.googleapis.com https://places.googleapis.com",
  "worker-src 'self' blob:",
  "frame-src 'self' https://www.google.com https://maps.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Fotos de portada y avatares subidos por los usuarios (Supabase Storage)
      { protocol: 'https', hostname: 'ykqlgogliwqgpxsmutvx.supabase.co', pathname: '/storage/v1/object/public/**' },
      // Avatares de cuentas que iniciaron sesión con Google
      { protocol: 'https', hostname: '*.googleusercontent.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Evita que otros sitios metan páginas de Cheers en un iframe (clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Evita que el navegador "adivine" mal el tipo de un archivo subido
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Limita qué tanta info del link de origen se manda al navegar a otro sitio
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Fuerza HTTPS siempre, evita ataques de "downgrade" a HTTP
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy-Report-Only', value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
