import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY

export const SUPABASE_CONFIG = { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY }

// True when the required environment variables are present at build time.
// A missing value means the app was deployed without the Vercel (or .env)
// settings — the UI in main.jsx will surface a clear message instead of
// leaving the user with a blank page.
export const SUPABASE_CONFIGURED = !!(SUPABASE_URL && SUPABASE_ANON_KEY)
const isBrowser = typeof window !== 'undefined'

const memorySessionStorage = {
  getItem() {
    return null
  },
  setItem() {},
  removeItem() {},
}

if (!SUPABASE_CONFIGURED) {
  console.error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL and SUPABASE_ANON_KEY) in your deployment environment and redeploy.',
  )
}

// storage: sessionStorage means the session is cleared automatically
// when the browser tab or window is closed — user must log in again
// next time, instead of staying signed in indefinitely (the default
// localStorage behavior).
export const supabase = SUPABASE_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: isBrowser ? window.sessionStorage : memorySessionStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null
