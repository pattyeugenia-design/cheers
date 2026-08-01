import type { NextConfig } from "next";

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
        ],
      },
    ];
  },
};

export default nextConfig;
