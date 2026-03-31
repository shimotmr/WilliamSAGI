const PLACEHOLDER_HOSTS = new Set([
  'https://placeholder.supabase.co',
  'https://example.supabase.co',
])

export function isPlaceholderSupabaseUrl(url?: string | null): boolean {
  if (!url) return true
  return PLACEHOLDER_HOSTS.has(url)
}

export function hasConfiguredSupabase(url?: string | null, key?: string | null): boolean {
  if (!url || !key) return false
  if (key === 'placeholder') return false
  return !isPlaceholderSupabaseUrl(url)
}
