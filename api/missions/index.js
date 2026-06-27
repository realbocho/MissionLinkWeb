import { supabase } from '../../lib/supabase.js'
import { verifyToken } from '../../lib/auth.js'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    const { creator_id, status } = req.query
    let query = supabase
      .from('missions')
      .select(`
        *,
        creator:users!missions_creator_id_fkey(id, nickname, profile_image),
        pledges(id, amount, status, user_id, created_at)
      `)
      .order('created_at', { ascending: false })

    if (creator_id) query = query.eq('creator_id', String(creator_id))
    if (status) query = query.eq('status', status)

    const { data: missions, error } = await query
    if (error) return res.status(500).json({ error: error.message })

    // 각 미션의 pledges에 user 정보 추가
    const allUserIds = [...new Set(
      (missions || []).flatMap(m => (m.pledges || []).map(p => p.user_id))
    )]

    let usersMap = {}
    if (allUserIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, nickname, profile_image')
        .in('id', allUserIds)
      if (users) users.forEach(u => { usersMap[u.id] = u })
    }

    const result = (missions || []).map(m => ({
      ...m,
      pledges: (m.pledges || []).map(p => ({
        ...p,
        user: usersMap[p.user_id] || null
      }))
    }))

    return res.status(200).json(result)
  }

  if (req.method === 'POST') {
    const authHeader = req.headers['authorization']
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: '로그인이 필요해요' })
    const webUser = verifyToken(authHeader.slice(7))
    if (!webUser) return res.status(401).json({ error: '유효하지 않은 토큰이에요' })

    const { title, description, goal_amount, winner_count, weighted, openchat_link } = req.body

    if (!title?.trim()) return res.status(400).json({ error: '미션 제목을 입력해주세요' })
    if (!description?.trim()) return res.status(400).json({ error: '미션 내용을 입력해주세요' })
    if (!goal_amount || goal_amount < 1000) return res.status(400).json({ error: '목표 금액은 최소 1,000원이에요' })

    const { data: mission, error } = await supabase
      .from('missions')
      .insert({
        creator_id: webUser.id,
        title: title.trim(),
        description: description.trim(),
        goal_amount: parseInt(goal_amount),
        winner_count: winner_count === undefined ? 1 : parseInt(winner_count),
        weighted: weighted !== false,
        openchat_link: openchat_link?.trim() || null,
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(mission)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
