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
  }
}

export default nextConfig
