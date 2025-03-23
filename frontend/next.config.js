/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin',
        permanent: true,
      },
    ];
  },
  // Environment configuration
  env: {
    NEXT_PUBLIC_DEPLOYMENT_MODE: process.env.NEXT_PUBLIC_DEPLOYMENT_MODE || 'demo',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
  // Build configuration
  swcMinify: true,
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
