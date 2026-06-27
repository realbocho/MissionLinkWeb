import { supabase } from '../../lib/supabase.js'
import { withAuth } from '../../lib/auth.js'

export default withAuth(async (req, res) => {
  const { id } = req.user

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('users')
      .select('id, nickname, profile_image, created_at')
      .eq('id', id)
      .single()
    if (error) return res.status(404).json({ error: '사용자를 찾을 수 없어요' })
    return res.status(200).json(data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
})
