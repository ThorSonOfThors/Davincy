import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('===== DELETE USER START =====')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    /* ---------------- ENV ---------------- */

    const supabaseUrl = process.env.SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: 'Server misconfiguration' })
    }

    /* ---------------- AUTH HEADER ---------------- */

    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing authorization token'
      })
    }

    const token = authHeader.replace('Bearer ', '')

    /* ---------------- USER CLIENT (VERIFY CALLER) ---------------- */

    const supabaseUser = createClient(
      supabaseUrl,
      process.env.VITE_SUPABASE_ANON_KEY!
    )

    const {
      data: { user },
      error: userError
    } = await supabaseUser.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({
        error: 'Invalid session'
      })
    }

    console.log('Caller user:', user.id)

    /* ---------------- ADMIN CLIENT ---------------- */

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    })

    /* ---------------- CHECK ADMIN ROLE ---------------- */

    const { data: profile, error: profileFetchError } =
      await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profileFetchError || !profile) {
      return res.status(403).json({
        error: 'Profile not found'
      })
    }

    if (profile.role !== 'admin') {
      console.log('❌ Non-admin attempted deletion')
      return res.status(403).json({
        error: 'Admin privileges required'
      })
    }

    console.log('✅ Admin verified')

    /* ---------------- BODY ---------------- */

    const { userId } = req.body ?? {}

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        error: 'userId is required'
      })
    }

    /* ---------------- DELETE AUTH USER ---------------- */

    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error(deleteError)
      return res.status(500).json({
        error: deleteError.message
      })
    }

    console.log('✅ User deleted safely')

    return res.status(200).json({
      success: true
    })

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal error' })
  } finally {
    console.log('===== DELETE USER END =====')
  }
}