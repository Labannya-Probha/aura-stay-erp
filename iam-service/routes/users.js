import express from 'express'
import { requireAuth, requireRole } from '../../server/middleware/auth.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'

const router = express.Router()

/**
 * Mirrors supabase/functions/admin-create-user/index.ts exactly:
 *  - auth.admin.createUser() with role/tenant_id/username in user_metadata
 *  - the existing `on_auth_user_created` trigger (handle_new_user()) then
 *    auto-populates the app_users row from that metadata.
 * This route does NOT insert into app_users directly — that would race
 * against the trigger. It only creates the auth user with the right metadata
 * and lets the trigger do what it already does today.
 */
router.post('/users', requireAuth(), requireRole('SUPERUSER', 'ADMIN'), async (req, res, next) => {
  try {
    const { email, password, username, fullName, tenantId, role, businessLine } = req.body

    if (!email || !password || !username || !tenantId || !role) {
      return res.status(400).json({
        error: 'Missing required fields: email, password, username, tenantId, role',
      })
    }

    // Non-SUPERUSER admins may only create users in their own tenant —
    // same rule admin-create-user already enforces.
    if (req.authUser.role !== 'SUPERUSER' && tenantId !== req.authUser.tenantId) {
      return res.status(403).json({ error: 'Forbidden: cannot create users outside your tenant' })
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        full_name: fullName || username,
        tenant_id: tenantId,
        role,
        business_line: businessLine || 'resort', // 'resort' | 'shop' | 'tax' | 'hrm'
      },
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.status(201).json({ user: data.user })
  } catch (err) {
    next(err)
  }
})

/**
 * Reads the real role_privileges matrix (role, module, can_create/view/edit/delete)
 * instead of a hardcoded permission list — this is the single source of truth
 * any future Shop/Tax/HRM service should query too, via has_module_privilege()
 * (the RLS helper) for DB-level checks, or this route for a UI permission map.
 */
router.get('/roles/:role/privileges', requireAuth(), async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('role_privileges')
      .select('module, can_create, can_view, can_edit, can_delete')
      .eq('role', req.params.role)
      .or(`tenant_id.eq.${req.authUser.tenantId},tenant_id.is.null`)

    if (error) throw error
    res.json({ role: req.params.role, privileges: data })
  } catch (err) {
    next(err)
  }
})

export default router
