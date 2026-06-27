import { supabase } from '../../lib/supabase.js'
import { withAuth } from '../../lib/auth.js'
import { createNotification } from '../../lib/notify.js'

export default withAuth(async (req, res) => {
  const { id: userId } = req.user

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('mission_requests')
      .select(`*, requester:users!requester_id(id, nickname, profile_image)`)
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { creator_id, content } = req.body
    if (!creator_id || !content?.trim()) return res.status(400).json({ error: '내용을 입력해주세요' })
    if (String(creator_id) === String(userId)) return res.status(400).json({ error: '본인에게 요청할 수 없어요' })
    if (content.trim().length > 300) return res.status(400).json({ error: '300자 이내로 입력해주세요' })

    const { data, error } = await supabase
      .from('mission_requests')
      .insert({ creator_id, requester_id: userId, content: content.trim() })
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })

    await createNotification({
      user_id: creator_id,
      type: 'mission_request',
      title: '새 미션 요청이 왔어요 📬',
      body: `"${content.trim().slice(0, 60)}${content.length > 60 ? '...' : ''}"`,
      link: '/requests'
    })

    return res.status(201).json(data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
})
