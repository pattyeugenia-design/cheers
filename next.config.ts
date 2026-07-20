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
};

export default nextConfig;
