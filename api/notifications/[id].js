import { supabase } from '../../lib/supabase.js'
import { withAuth } from '../../lib/auth.js'

export default withAuth(async (req, res) => {
  const { id: userId } = req.user
  const { id } = req.query

  // PATCH — 개별 읽음 처리
  if (req.method === 'PATCH') {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId)   // 본인 알림만

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
})
