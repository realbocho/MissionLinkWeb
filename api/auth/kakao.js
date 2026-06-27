import { supabase } from '../../lib/supabase.js'
import { signToken } from '../../lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'code required' })

  const APP_URL = process.env.APP_URL || 'http://localhost:5173'

  // 1. 카카오 액세스 토큰 발급
  const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_CLIENT_ID,
      redirect_uri: `${APP_URL}/auth/kakao/callback`,
      code,
    })
  })
  const tokenData = await tokenRes.json()
  if (tokenData.error) return res.status(400).json({ error: tokenData.error_description })

  // 2. 카카오 유저 정보 조회
  const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  })
  const kakaoUser = await userRes.json()

  const kakaoId = String(kakaoUser.id)
  const nickname = kakaoUser.kakao_account?.profile?.nickname || '익명'
  const profileImage = kakaoUser.kakao_account?.profile?.profile_image_url || null

  // 3. DB upsert
  const { data: user, error } = await supabase
    .from('users')
    .upsert({
      id: kakaoId,
      nickname,
      profile_image: profileImage,
    }, { onConflict: 'id' })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // 4. JWT 발급
  const token = signToken({ id: kakaoId, nickname })
  return res.status(200).json({ token, user })
}
