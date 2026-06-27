import { supabase } from '../../lib/supabase.js'
import { verifyToken } from '../../lib/auth.js'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  const { id } = req.query

  if (req.method === 'GET') {
    const { data: mission, error } = await supabase
      .from('missions')
      .select(`
        *,
        creator:users!creator_id(id, nickname, profile_image),
        pledges(
          id, amount, status, user_id, created_at,
          user:users!user_id(id, nickname, profile_image)
        )
      `)
      .eq('id', id)
      .single()

    if (error) return res.status(404).json({ error: '미션을 찾을 수 없어요' })

    mission.pledges = (mission.pledges || [])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    return res.status(200).json(mission)
  }

  if (req.method === 'PATCH') {
    const authHeader = req.headers['authorization']
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: '로그인이 필요해요' })
    const webUser = verifyToken(authHeader.slice(7))
    if (!webUser) return res.status(401).json({ error: '유효하지 않은 토큰이에요' })

    const { data: mission } = await supabase.from('missions').select('creator_id').eq('id', id).single()
    if (!mission) return res.status(404).json({ error: '미션을 찾을 수 없어요' })
    if (String(mission.creator_id) !== String(webUser.id)) return res.status(403).json({ error: '권한이 없어요' })

    const { openchat_link, title, description } = req.body
    const updates = {}
    if (openchat_link !== undefined) updates.openchat_link = openchat_link?.trim() || null
    if (title) updates.title = title.trim()
    if (description) updates.description = description.trim()

    const { data, error } = await supabase.from('missions').update(updates).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
