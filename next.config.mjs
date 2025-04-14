/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'v0.blob.com',
      'fifmaz6upmosyxjd7.lite.usercontent.net',
      'fifmaz6upmosyxjd7.li-ent.net'
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
  },
}

export default nextConfig
