import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // During server-side prerender/build, avoid hard crash when public env vars
  // are not injected yet (e.g. misconfigured Preview/Production env in Vercel).
  // Client-side runtime still requires proper vars.
  if (!url || !anonKey) {
    if (typeof window === 'undefined') {
      return null as any
    }
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createBrowserClient(
    url,
    anonKey
  )
}
