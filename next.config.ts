import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**.cameroon-concord.com' },
      { protocol: 'http',  hostname: '**.cameroon-concord.com' },
      { protocol: 'https', hostname: 'cameroon-concord.com' },
      { protocol: 'http',  hostname: 'cameroon-concord.com' },
    ],
  },
}

export default nextConfig
