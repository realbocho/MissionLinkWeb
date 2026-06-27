import { supabase } from '../../lib/supabase.js'
import { withAuth } from '../../lib/auth.js'

export default withAuth(async (req, res) => {
  const { id: userId } = req.user
  const { id } = req.query

  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ ok: true })
})
