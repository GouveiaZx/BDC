/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Forçando nova build no Vercel - timestamp: ${new Date().toISOString()} - ${Date.now()}
  distDir: '.next',
  env: {
    FORCE_BUILD_ID: `${Date.now()}`
  },
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  async headers() {
    return [
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'image/png',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'xjguzxwwydlpvudwmiyv.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.io',
      },
      {
        protocol: 'https',
        hostname: 'exemplo.com',
      },
    ],
  },
  // Configurações adicionais conforme necessário
}

module.exports = nextConfig