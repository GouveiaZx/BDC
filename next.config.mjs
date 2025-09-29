/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações de imagem
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      // Domínio dinâmico do Supabase baseado na variável de ambiente
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL ? [{
        protocol: 'https',
        hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
      }] : []),
      {
        protocol: 'https',
        hostname: 'ui-avatars.io',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      // Padrão genérico para subdomínios do Supabase
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      }
    ],
    dangerouslyAllowSVG: true,
  },

  // Configurações básicas
  poweredByHeader: false,
  reactStrictMode: true,

  // Configurações de produção
  compress: true,
  generateEtags: true,

  // Rewrites para arquivos especiais
  async rewrites() {
    return [
      {
        source: '/manifest.json',
        destination: '/api/manifest',
      },
    ];
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;