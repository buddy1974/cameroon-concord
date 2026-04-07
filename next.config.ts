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
        source: '/:path*',
        has: [{ type: 'host', value: 'cameroon-concord.com' }],
        destination: 'https://www.cameroon-concord.com/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
