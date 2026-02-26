import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

/*
  Server-side Supabase client
  Uses SERVICE ROLE → bypasses RLS safely
*/
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    /* ---------------- METHOD CHECK ---------------- */
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    /* ---------------- AUTH HEADER ---------------- */
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' })
    }

    const token = authHeader.replace('Bearer ', '')

    /*
      Create user-scoped client to verify who is calling
    */
    const supabaseUser = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    /* ---------------- VERIFY USER ---------------- */
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser()

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid user token' })
    }

    /* ---------------- CHECK ADMIN ROLE ---------------- */
    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
      return res.status(403).json({ error: 'Profile not found' })
    }

    if (profile.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' })
    }

    /* ---------------- TARGET USER ---------------- */
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' })
    }

    /* ---------------- APPROVE USER ---------------- */
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ status: 'approved' })
      .eq('id', userId)

    if (updateError) {
      console.error(updateError)
      return res.status(500).json({ error: 'Failed to approve user' })
    }

    return res.status(200).json({
      success: true,
      message: 'User approved',
    })
  } catch (err) {
    console.error('Approve function error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}