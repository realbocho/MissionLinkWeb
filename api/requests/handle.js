import { supabase } from '../../lib/supabase.js'
import { withAuth } from '../../lib/auth.js'
import { createNotification } from '../../lib/notify.js'

export default withAuth(async (req, res) => {
  const { id: userId } = req.user

  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })

  const { request_id, action, goal_ton, winner_count, weighted } = req.body

  if (!request_id || !action) {
    return res.status(400).json({ error: 'request_id와 action이 필요해요' })
  }

  const { data: request } = await supabase
    .from('mission_requests')
    .select('*, requester:users!requester_id(id, nickname)')
    .eq('id', request_id)
    .single()

  if (!request) return res.status(404).json({ error: '요청을 찾을 수 없어요' })
  if (String(request.creator_id) !== String(userId)) {
    return res.status(403).json({ error: '권한이 없어요' })
  }
  if (request.status !== 'pending') {
    return res.status(400).json({ error: '이미 처리된 요청이에요' })
  }

  // 거절
  if (action === 'reject') {
    await supabase
      .from('mission_requests')
      .update({ status: 'rejected' })
      .eq('id', request_id)

    await createNotification({
      user_id: request.requester_id,
      type: 'request_rejected',
      title: '미션 요청이 거절됐어요',
      body: `"${request.content.slice(0, 60)}${request.content.length > 60 ? '...' : ''}"`,
      link: null
    })

    return res.status(200).json({ status: 'rejected' })
  }

  // 수락
  if (action === 'accept') {
    const parsedAmount = parseInt(String(goal_ton).replace(/,/g, ''))
    if (!parsedAmount || parsedAmount < 1000) {
      return res.status(400).json({ error: '목표 금액은 최소 1,000원이에요' })
    }

    const { data: mission, error } = await supabase
      .from('missions')
      .insert({
        creator_id: userId,
        title: request.content.slice(0, 80),
        description: request.content,
        goal_amount: parsedAmount,
        winner_count: winner_count === undefined ? 1 : parseInt(winner_count),
        weighted: weighted !== false
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    await supabase
      .from('mission_requests')
      .update({ status: 'accepted', mission_id: mission.id })
      .eq('id', request_id)

    await createNotification({
      user_id: request.requester_id,
      type: 'request_accepted',
      title: '미션 요청이 수락됐어요! 🎉',
      body: `"${request.content.slice(0, 60)}${request.content.length > 60 ? '...' : ''}" — 지금 후원할 수 있어요!`,
      link: `/mission/${mission.id}`
    })

    return res.status(200).json({ status: 'accepted', mission })
  }

  return res.status(400).json({ error: '올바르지 않은 action이에요' })
})
