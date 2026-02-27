// Unified configuration for William Hub
// All environment variables should be managed through this file

const fallbackUrl = 'https://placeholder.supabase.co'
const fallbackKey = 'placeholder'

export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackUrl,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fallbackKey,
    serviceRoleKey: (() => {
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
      return key
    })(),
  },
} as const

// Type-safe environment variable validation
export function getEnvVar(key: string): string {
  const value = process.env[key]
  if (!value) {
    return ''
  }
  return value
}
