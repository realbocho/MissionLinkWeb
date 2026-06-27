import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setToken, setStoredUser } from '../utils/auth.js'
import api from '../utils/api.js'

const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code')

  useEffect(() => {
    if (!code) return
    // 카카오 코드로 로그인
    api.post('/auth/kakao', { code })
      .then(({ token, user }) => {
        setToken(token)
        setStoredUser(user)
        navigate('/', { replace: true })
      })
      .catch(err => {
        alert('로그인 중 오류가 발생했어요: ' + err.message)
        navigate('/login', { replace: true })
      })
  }, [code])

  const handleKakaoLogin = () => {
    const redirectUri = encodeURIComponent(`${APP_URL}/login`)
    window.location.href =
      `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code`
  }

  if (code) {
    return (
      <div className="auth-page">
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-hint)', marginTop: 12 }}>로그인 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">🎯</div>
        <h1 className="auth-title">MissionLink</h1>
        <p className="auth-sub">크리에이터와 팬을 연결하는 미션 후원 플랫폼</p>

        <button
          onClick={handleKakaoLogin}
          style={{
            width: '100%',
            background: '#FEE500',
            color: '#000000CC',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '15px',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginTop: 8
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path fillRule="evenodd" clipRule="evenodd"
              d="M10 2C5.582 2 2 4.925 2 8.538c0 2.278 1.388 4.28 3.484 5.488L4.6 17.18a.25.25 0 00.37.28l4.05-2.688c.32.04.645.06.98.06 4.418 0 8-2.924 8-6.537C18 4.925 14.418 2 10 2z"
              fill="#000000"/>
          </svg>
          카카오로 시작하기
        </button>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-hint)', lineHeight: 1.6 }}>
          로그인 시 서비스 이용약관 및<br/>개인정보처리방침에 동의하는 것으로 간주해요.
        </p>
      </div>
    </div>
  )
}
