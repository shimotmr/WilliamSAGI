/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    forceSwcTransforms: true,
  },
  generateBuildId: async () => require('crypto').randomBytes(8).toString('hex'),
}

module.exports = nextConfig
