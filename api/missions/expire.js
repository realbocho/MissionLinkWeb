import { supabase } from '../../lib/supabase.js'
import { withAuth } from '../../lib/auth.js'
import { createNotifications, createNotification } from '../../lib/notify.js'

export default withAuth(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { id: userId } = req.user
  const { mission_id } = req.body

  const { data: mission } = await supabase
    .from('missions')
    .select('*')
    .eq('id', mission_id)
    .single()

  if (!mission) return res.status(404).json({ error: '미션을 찾을 수 없어요' })
  if (String(mission.creator_id) !== String(userId)) {
    return res.status(403).json({ error: '권한이 없어요' })
  }
  if (mission.status === 'expired') {
    return res.status(400).json({ error: '이미 만료된 미션이에요' })
  }

  // 만료 처리
  await supabase
    .from('missions')
    .update({ status: 'expired', expired_at: new Date().toISOString() })
    .eq('id', mission_id)

  // 입금 확인된 후원자 목록
  const { data: pledges } = await supabase
    .from('pledges')
    .select('user_id, amount')
    .eq('mission_id', mission_id)
    .eq('status', 'confirmed')

  if (!pledges || pledges.length === 0) {
    return res.status(200).json({ ok: true, winners: [] })
  }

  const uniqueDonorIds = [...new Set(pledges.map(p => p.user_id))]

  // 추첨
  let winnerIds = []
  if (mission.winner_count === 0) {
    // 0 = 전원 당첨
    winnerIds = uniqueDonorIds
  } else {
    const count = Math.min(mission.winner_count, uniqueDonorIds.length)

    if (mission.weighted) {
      // 가중 추첨 — 금액 많을수록 확률 높음
      const ticketPool = []
      for (const p of pledges) {
        const tickets = Math.max(1, Math.floor(parseInt(p.amount) / 1000))
        for (let i = 0; i < tickets; i++) ticketPool.push(p.user_id)
      }
      const shuffled = ticketPool.sort(() => Math.random() - 0.5)
      const used = new Set()
      for (const uid of shuffled) {
        if (!used.has(uid)) { used.add(uid); winnerIds.push(uid) }
        if (winnerIds.length >= count) break
      }
    } else {
      // 균등 추첨
      const shuffled = [...uniqueDonorIds].sort(() => Math.random() - 0.5)
      winnerIds = shuffled.slice(0, count)
    }
  }

  // 당첨자 DB 저장
  if (winnerIds.length > 0) {
    await supabase.from('winners').insert(
      winnerIds.map(uid => ({ mission_id, user_id: uid }))
    )
  }

  // 당첨자 알림
  if (winnerIds.length > 0) {
    const emailLine = mission.contact_email
      ? `\n📧 크리에이터 연락처: ${mission.contact_email}`
      : ''
    await createNotifications(
      winnerIds.map(uid => ({
        user_id: uid,
        type: 'winner_selected',
        title: '🏆 당첨됐어요!',
        body: `"${mission.title}" 추첨에서 당첨됐어요! 아래 이메일로 크리에이터에게 연락해주세요.${emailLine}`,
        link: `/mission/${mission_id}`
      }))
    )
  }

  // 미선택 후원자 알림 (당첨 안 된 사람)
  const loserIds = uniqueDonorIds.filter(uid => !winnerIds.includes(uid))
  if (loserIds.length > 0 && mission.winner_count !== 0) {
    await createNotifications(
      loserIds.map(uid => ({
        user_id: uid,
        type: 'mission_completed',
        title: '미션이 완료됐어요',
        body: `"${mission.title}" 추첨 결과 아쉽게도 당첨되지 않았어요. 다음 기회에!`,
        link: `/mission/${mission_id}`
      }))
    )
  }

  // 전원 당첨이면 모두에게 알림
  if (mission.winner_count === 0) {
    await createNotifications(
      uniqueDonorIds.map(uid => ({
        user_id: uid,
        type: 'winner_selected',
        title: '🏆 당첨됐어요!',
        body: `"${mission.title}" 후원자 전원이 당첨됐어요! 크리에이터의 미션 수행을 기다려주세요.`,
        link: `/mission/${mission_id}`
      }))
    )
  }

  return res.status(200).json({ ok: true, winners: winnerIds })
})
