import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://gwllsoembqacolzfrquu.supabase.co'
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3bGxzb2VtYnFhY29semZycXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExODEwMzMsImV4cCI6MjA5Njc1NzAzM30.J1hfY_IxmtQzlCgpy_IzcRK6eR_cVcwuLwm201LrDJc'

export const SUPABASE_CONFIG = { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY }

// storage: sessionStorage means the session is cleared automatically
// when the browser tab or window is closed — user must log in again
// next time, instead of staying signed in indefinitely (the default
// localStorage behavior).
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
})
