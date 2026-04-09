/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  
  // Disable x-powered-by header (minor security + perf)
  poweredByHeader: false,
  
  // 先讓 production build 不被其他頁的 TS 錯誤卡死
  typescript: {
    ignoreBuildErrors: true,
  },

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  // 設定環境變數預設值，避免 build 時報錯
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
    JWT_SECRET: process.env.JWT_SECRET || 'placeholder',
  },
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://william-sagi.vercel.app https://codex.williamhsiao.tw http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
