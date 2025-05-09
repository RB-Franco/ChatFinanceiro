/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'v0.blob.com',
      'fifmaz6upmosyxjd7.lite.usercontent.net',
      'fifmaz6upmosyxjd7.li-ent.net'
    ],
    unoptimized: true,
  },
  experimental: {
    optimizeServerReact: true,
  },
  // Adicionar configuração para servir arquivos estáticos com os tipos MIME corretos
  headers: async () => {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
}

export default nextConfig
