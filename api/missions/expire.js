import { supabase } from '../../lib/supabase.js'
import { withAuth } from '../../lib/auth.js'
import { createNotifications } from '../../lib/notify.js'

export default withAuth(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { id: userId } = req.user
  const { mission_id } = req.body

  const { data: mission } = await supabase
    .from('missions')
    .select('*, pledges(user_id, status)')
    .eq('id', mission_id)
    .single()

  if (!mission) return res.status(404).json({ error: '미션을 찾을 수 없어요' })
  if (String(mission.creator_id) !== String(userId)) {
    return res.status(403).json({ error: '권한이 없어요' })
  }
  if (mission.status === 'expired') {
    return res.status(400).json({ error: '이미 만료된 미션이에요' })
  }

  await supabase
    .from('missions')
    .update({ status: 'expired', expired_at: new Date().toISOString() })
    .eq('id', mission_id)

  // 후원자 전원 알림
  const donorIds = [...new Set(
    (mission.pledges || [])
      .filter(p => p.status === 'confirmed')
      .map(p => p.user_id)
  )]

  if (donorIds.length > 0) {
    await createNotifications(
      donorIds.map(user_id => ({
        user_id,
        type: 'mission_completed',
        title: '미션이 만료됐어요',
        body: `"${mission.title}" 미션이 크리에이터에 의해 종료됐어요.`,
        link: `/mission/${mission_id}`
      }))
    )
  }

  return res.status(200).json({ ok: true })
})
