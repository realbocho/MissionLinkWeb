import { supabase } from '../../lib/supabase.js'
import { withAuth } from '../../lib/auth.js'
import { createNotification } from '../../lib/notify.js'

export default withAuth(async (req, res) => {
  const { id: userId } = req.user

  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })

  const { pledge_id, action } = req.body

  if (!pledge_id || !action) {
    return res.status(400).json({ error: 'pledge_id와 action이 필요해요' })
  }

  const { data: pledge } = await supabase
    .from('pledges')
    .select('*, mission:missions(id, title, creator_id, openchat_link)')
    .eq('id', pledge_id)
    .single()

  if (!pledge) return res.status(404).json({ error: '후원 의향을 찾을 수 없어요' })
  if (String(pledge.mission.creator_id) !== String(userId)) {
    return res.status(403).json({ error: '권한이 없어요' })
  }
  if (pledge.status !== 'pending') {
    return res.status(400).json({ error: '이미 처리된 후원 의향이에요' })
  }

  if (action === 'confirm') {
    await supabase
      .from('pledges')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', pledge_id)

    if (!pledge.openchat_sent && pledge.mission.openchat_link) {
      await createNotification({
        user_id: pledge.user_id,
        type: 'openchat_link',
        title: '입금이 확인됐어요! ✅',
        body: `"${pledge.mission.title}" 입금이 확인됐어요! 오픈채팅방에 입장해주세요.`,
        link: pledge.mission.openchat_link
      })
    }

    await createNotification({
      user_id: pledge.user_id,
      type: 'pledge_confirmed',
      title: '입금이 확인됐어요! ✅',
      body: `"${pledge.mission.title}" 후원 의향이 확인됐어요.`,
      link: `/mission/${pledge.mission_id}`
    })

    return res.status(200).json({ status: 'confirmed' })
  }

  if (action === 'cancel') {
    await supabase
      .from('pledges')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', pledge_id)

    await supabase.rpc('update_mission_amount', {
      p_mission_id: pledge.mission_id,
      p_delta: -pledge.amount
    })

    await createNotification({
      user_id: pledge.user_id,
      type: 'pledge_cancelled',
      title: '후원 의향이 취소됐어요',
      body: `"${pledge.mission.title}" 입금이 확인되지 않아 후원 의향이 취소됐어요.`,
      link: `/mission/${pledge.mission_id}`
    })

    return res.status(200).json({ status: 'cancelled' })
  }

  return res.status(400).json({ error: '올바르지 않은 action이에요' })
})
