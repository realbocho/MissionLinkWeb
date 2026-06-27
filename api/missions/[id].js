import { supabase } from '../../lib/supabase.js'
import { verifyToken } from '../../lib/auth.js'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  const { id } = req.query

  if (req.method === 'GET') {
    // 미션 기본 정보
    const { data: mission, error } = await supabase
      .from('missions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !mission) return res.status(404).json({ error: '미션을 찾을 수 없어요' })

    // 크리에이터 정보 별도 조회
    const { data: creator } = await supabase
      .from('users')
      .select('id, nickname, profile_image')
      .eq('id', mission.creator_id)
      .single()

    // 후원 의향 목록 별도 조회
    const { data: pledges } = await supabase
      .from('pledges')
      .select('id, amount, status, user_id, created_at')
      .eq('mission_id', id)
      .order('created_at', { ascending: false })

    // 후원자 정보 조회
    const userIds = [...new Set((pledges || []).map(p => p.user_id))]
    let usersMap = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, nickname, profile_image')
        .in('id', userIds)
      if (users) users.forEach(u => { usersMap[u.id] = u })
    }

    const pledgesWithUser = (pledges || []).map(p => ({
      ...p,
      user: usersMap[p.user_id] || null
    }))

    return res.status(200).json({
      ...mission,
      creator,
      pledges: pledgesWithUser
    })
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
