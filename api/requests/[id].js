import { supabase } from '../../lib/supabase.js'
import { withAuth } from '../../lib/auth.js'
import { createNotification } from '../../lib/notify.js'

export default withAuth(async (req, res) => {
  const webUser = req.user
  const { id } = req.query

  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })

  const { action, goal_ton, winner_count, weighted, tiers } = req.body

  // Fetch request and verify ownership
  const { data: request } = await supabase
    .from('mission_requests')
    .select('*, requester:users!requester_id(id, username, first_name, email)')
    .eq('id', id)
    .single()

  if (!request) return res.status(404).json({ error: 'Request not found' })
  if (String(request.creator_id) !== String(webUser.id)) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  if (request.status !== 'pending') {
    return res.status(400).json({ error: 'Request already handled' })
  }

  // REJECT
  if (action === 'reject') {
    await supabase
      .from('mission_requests')
      .update({ status: 'rejected' })
      .eq('id', id)

    await createNotification({
      user_id: request.requester_id,
      type: 'request_rejected',
      title: '미션 요청이 거절됐어요',
      body: `"${request.content.slice(0, 60)}${request.content.length > 60 ? '...' : ''}"`,
      link: null
    })

    return res.status(200).json({ status: 'rejected' })
  }

  // ACCEPT — create mission from request
  if (action === 'accept') {
    if (!goal_ton || parseFloat(goal_ton) <= 0) {
      return res.status(400).json({ error: 'goal_ton required to accept' })
    }

    const { data: mission, error: missionError } = await supabase
      .from('missions')
      .insert({
        creator_id: webUser.id,
        title: request.content.slice(0, 80),
        description: request.content,
        goal_ton: parseFloat(goal_ton),
        winner_count: winner_count === undefined ? 1 : parseInt(winner_count),
        weighted: weighted !== false
      })
      .select()
      .single()

    if (missionError) return res.status(500).json({ error: missionError.message })

    if (tiers && tiers.length > 0) {
      const tierRows = tiers
        .filter(t => t.name && t.amount_ton)
        .map((t, i) => ({
          mission_id: mission.id,
          name: t.name,
          amount_ton: parseFloat(t.amount_ton),
          sort_order: i
        }))
      if (tierRows.length > 0) await supabase.from('tiers').insert(tierRows)
    }

    await supabase
      .from('mission_requests')
      .update({ status: 'accepted', mission_id: mission.id })
      .eq('id', id)

    await createNotification({
      user_id: request.requester_id,
      type: 'request_accepted',
      title: '미션 요청이 수락됐어요! 🎉',
      body: `"${request.content.slice(0, 60)}${request.content.length > 60 ? '...' : ''}" — 지금 후원할 수 있어요!`,
      link: `/mission/${mission.id}`
    })

    return res.status(200).json({ status: 'accepted', mission })
  }

  return res.status(400).json({ error: 'Invalid action' })
})
