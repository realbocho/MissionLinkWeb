import { supabase } from '../../lib/supabase.js'
import { signToken } from '../../lib/auth.js'

const ADJECTIVES = ['용감한', '귀여운', '빠른', '조용한', '멋진', '신비한', '행복한', '엉뚱한']
const NOUNS = ['고양이', '펭귄', '여우', '토끼', '곰돌이', '다람쥐', '수달', '햄스터']
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)]

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'code required' })

  const APP_URL = process.env.APP_URL || 'http://localhost:5173'
  const redirectUri = `${APP_URL}/login`

  console.log('[kakao] CLIENT_ID:', process.env.KAKAO_CLIENT_ID?.slice(0, 6) + '...')
  console.log('[kakao] redirect_uri:', redirectUri)

  // 1. 카카오 액세스 토큰 발급
  const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_CLIENT_ID,
      redirect_uri: redirectUri,
      code,
    })
  })
  const tokenData = await tokenRes.json()
  console.log('[kakao] tokenData:', JSON.stringify(tokenData))

  if (tokenData.error) {
    return res.status(400).json({
      error: tokenData.error_description,
      kakao_error: tokenData.error,
      redirect_uri_used: redirectUri
    })
  }

  // 2. 카카오 유저 ID 조회
  const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  })
  const kakaoUser = await userRes.json()
  const kakaoId = String(kakaoUser.id)

  // 3. 기존 유저면 닉네임 유지, 신규면 랜덤 생성
  const { data: existing } = await supabase
    .from('users')
    .select('nickname')
    .eq('id', kakaoId)
    .single()

  const nickname = existing?.nickname || `${rand(ADJECTIVES)} ${rand(NOUNS)}`

  // 4. DB upsert
  const { data: user, error } = await supabase
    .from('users')
    .upsert({ id: kakaoId, nickname, profile_image: null }, { onConflict: 'id' })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // 5. JWT 발급
  const token = signToken({ id: kakaoId, nickname })
  return res.status(200).json({ token, user })
}
