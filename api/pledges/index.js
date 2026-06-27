import { supabase } from '../../lib/supabase.js'
import { withAuth } from '../../lib/auth.js'
import { createNotification } from '../../lib/notify.js'

export default withAuth(async (req, res) => {
  const { id: userId } = req.user

  if (req.method === 'POST') {
    const { mission_id, amount } = req.body

    const parsedAmount = parseInt(String(amount).replace(/,/g, ''))

    if (!mission_id || !parsedAmount || parsedAmount < 1000) {
      return res.status(400).json({ error: '미션 ID와 금액(최소 1,000원)이 필요해요' })
    }

    const { data: mission } = await supabase
      .from('missions')
      .select('id, status, title, creator_id, openchat_link')
      .eq('id', mission_id)
      .single()

    if (!mission) return res.status(404).json({ error: '미션을 찾을 수 없어요' })
    if (mission.status === 'expired') return res.status(400).json({ error: '만료된 미션이에요' })
    if (String(mission.creator_id) === String(userId)) {
      return res.status(400).json({ error: '본인 미션에는 후원 의향을 등록할 수 없어요' })
    }

    const { data: existing } = await supabase
      .from('pledges')
      .select('id, status')
      .eq('mission_id', mission_id)
      .eq('user_id', userId)
      .single()

    if (existing && existing.status !== 'cancelled') {
      return res.status(409).json({ error: '이미 후원 의향을 등록했어요' })
    }

    const { data: pledge, error } = await supabase
      .from('pledges')
      .upsert({
        mission_id,
        user_id: userId,
        amount: parsedAmount,
        status: 'pending',
        openchat_sent: false,
        confirmed_at: null,
        cancelled_at: null,
      }, { onConflict: 'mission_id,user_id' })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    await supabase.rpc('update_mission_amount', {
      p_mission_id: mission_id,
      p_delta: parsedAmount
    })

    if (mission.openchat_link) {
      await createNotification({
        user_id: userId,
        type: 'openchat_link',
        title: '오픈채팅방 링크가 도착했어요! 💬',
        body: `"${mission.title}" 후원 감사해요! 아래 오픈채팅방에서 카카오페이로 송금해주세요.`,
        link: mission.openchat_link
      })
      await supabase.from('pledges').update({ openchat_sent: true }).eq('id', pledge.id)
    }

    await createNotification({
      user_id: mission.creator_id,
      type: 'pledge_confirmed',
      title: '새 후원 의향이 등록됐어요 💜',
      body: `${parsedAmount.toLocaleString()}원 후원 의향이 등록됐어요. 입금 확인 후 처리해주세요.`,
      link: `/mission/${mission_id}`
    })

    return res.status(201).json(pledge)
  }

  return res.status(405).json({ error: 'Method not allowed' })
})
