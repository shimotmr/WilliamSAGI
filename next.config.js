/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => require('crypto').randomBytes(8).toString('hex'),
}

module.exports = nextConfig
