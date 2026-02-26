import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // get profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // attach emails
    const users = await supabase.auth.admin.listUsers()

    const emailMap = new Map(
      users.data.users.map(u => [u.id, u.email])
    )

    const enriched = profiles.map(p => ({
      ...p,
      email: emailMap.get(p.id) ?? 'unknown'
    }))

    return res.status(200).json(enriched)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed loading profiles' })
  }
}