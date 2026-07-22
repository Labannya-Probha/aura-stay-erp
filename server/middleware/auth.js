import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY must all be set for the reporting API to boot.',
  )
}

// Used only to verify the incoming bearer token (auth.getUser).
const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Used only to look up role/tenant_id from app_users — matches the exact
// pattern current_tenant_id() uses in your RLS policies (id = auth.uid()).
// Requires the service-role key because we're reading another table by
// server-side authority, not as the end user via RLS.
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

export { supabaseAdmin }

export const requireAuth = () => async (req, res, next) => {
  try {
    const header = req.header('authorization') || req.header('Authorization')
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null

    if (!token) {
      return res.status(401).json({ error: 'Missing bearer token', code: 401 })
    }

    const { data, error } = await supabaseAuth.auth.getUser(token)
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token', code: 401 })
    }

    const authUserId = data.user.id

    // Mirrors current_tenant_id(): SELECT tenant_id FROM app_users WHERE id = auth.uid()
    const { data: appUserRow, error: lookupError } = await supabaseAdmin
      .from('app_users')
      .select('role, tenant_id')
      .eq('id', authUserId)
      .single()

    if (lookupError || !appUserRow) {
      return res.status(403).json({
        error: 'No app_users record found for this account. Contact an administrator.',
        code: 403,
      })
    }

    req.authUser = {
      id: authUserId,
      email: data.user.email || 'Authenticated User',
      tenantId: appUserRow.tenant_id,
      role: appUserRow.role,
      reportCodes: [],
    }

    next()
  } catch (err) {
    next(err)
  }
}

export const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Not authenticated', code: 401 })
    }
    if (!allowedRoles.includes(req.authUser.role)) {
      return res.status(403).json({
        error: `Role ${req.authUser.role} is not allowed for this operation`,
        code: 403,
      })
    }
    next()
  }
