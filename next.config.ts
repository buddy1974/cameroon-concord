import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/privacy-policy',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/sports',
        destination: '/sportsnews',
        permanent: true,
      },
      {
        source: '/sports/:path*',
        destination: '/sportsnews/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
