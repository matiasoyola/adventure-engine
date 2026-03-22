import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Permite que Next.js confíe en los headers X-Forwarded-* que manda Nginx.
  // Sin esto, req.headers.host y la detección de HTTPS no funcionan bien
  // detrás del reverse proxy.
  experimental: {
    trustHostHeader: true,
  },
}

export default nextConfig
