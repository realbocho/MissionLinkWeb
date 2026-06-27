import { supabase } from '../../lib/supabase.js'
import { withAuth, verifyToken } from '../../lib/auth.js'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()

  // GET — 미션 목록 (공개)
  if (req.method === 'GET') {
    const { creator_id, status } = req.query
    let query = supabase
      .from('missions')
      .select(`*, creator:users!creator_id(id, nickname, profile_image), pledges(id, status)`)
      .order('created_at', { ascending: false })

    if (creator_id) query = query.eq('creator_id', String(creator_id))
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  // POST — 미션 생성 (인증 필요)
  if (req.method === 'POST') {
    const authHeader = req.headers['authorization']
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: '로그인이 필요해요' })
    const webUser = verifyToken(authHeader.slice(7))
    if (!webUser) return res.status(401).json({ error: '유효하지 않은 토큰이에요' })

    const { title, description, goal_amount, winner_count, weighted, openchat_link, tiers } = req.body

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

    // 티어 저장
    if (tiers && tiers.length > 0) {
      const tierRows = tiers
        .filter(t => t.name && t.amount)
        .map((t, i) => ({
          mission_id: mission.id,
          name: t.name,
          amount_ton: parseInt(t.amount),
          sort_order: i
        }))
      if (tierRows.length > 0) await supabase.from('tiers').insert(tierRows)
    }

    return res.status(201).json(mission)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
